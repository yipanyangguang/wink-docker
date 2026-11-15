import { IOperator, isOwnerOrAdmin } from "@/config/admin";
import { IWinkListDocument } from "@/interface/mongoCollection/winkList";
import { IWinkListReq } from "@/interface/winkInterface";
import { topicCollection, winkListCollection } from "@/services/mongodb";
import { Filter, ObjectId } from "mongodb";
import { getUserInfo } from "../user";
import { getCommentInfo } from "./comment";

interface IWinkListRes extends IWinkListDocument {
  userName: string;
  avatar: string;
}

const handleFilter = async (params: IWinkListReq) => {
  const unShowTopics = await topicCollection
    .find({
      showIndex: false,
    })
    .toArray();

  const winkUnShowList = unShowTopics.map((item) => item.topic);

  const { topic, location } = params;
  const filter: Filter<IWinkListDocument> = {
    topics: { $nin: winkUnShowList },
  };
  if (topic) {
    filter["topics"] = { $in: [topic], $nin: winkUnShowList };
  }
  if (location) {
    filter["location"] = location;
  }
  // 如果 topic 在 winkUnShowList 中
  if (topic && winkUnShowList.includes(topic as string)) {
    filter["topics"] = { $in: [topic] };
  }
  return filter;
};

/** 获取瞬间列表 */
export const getWinkList = async (params: IWinkListReq) => {
  const { page, pageSize, desc } = params;
  const filter = await handleFilter(params);
  const res = await winkListCollection
    .find(filter)
    .sort({ time: desc ? 1 : -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .toArray();

  const userInfo = {};

  const result: IWinkListRes[] = [];
  for (let i = 0; i < res.length; i++) {
    const item = res[i];
    if (!userInfo[item.userId]) {
      userInfo[item.userId] = await getUserInfo(item.userId);
    }
    result.push({
      ...item,
      userName: userInfo[item.userId]?.userName ?? "",
      avatar: userInfo[item.userId]?.avatar ?? "404.png",
    });
  }

  const returnRes = result.map(async (item) => {
    const winkId = item._id.toString();
    const comment = await getCommentInfo(winkId);
    return {
      ...item,
      commentCount: comment.commentCount,
      latestComment: comment.commentInfo,
    };
  });

  return Promise.all(returnRes);
};

/** 从全部瞬间中随机抽样，不应用话题隐藏或首页展示过滤。 */
export const getRandomWinkList = async (size = 10) => {
  // 多取一批候选，再按话题配额筛选，尽量保证最终仍能返回 10 条。
  const candidates = await winkListCollection
    .aggregate<IWinkListDocument>([
      { $sample: { size: Math.max(size * 10, 100) } },
    ])
    .toArray();

  const topicCounts = new Map<string, number>();
  const res: IWinkListDocument[] = [];
  for (const item of candidates) {
    const topics = Array.from(
      new Set((item.topics || []).map((topic) => topic.trim()).filter(Boolean)),
    );
    if (topics.some((topic) => (topicCounts.get(topic) || 0) >= 3)) continue;

    res.push(item);
    topics.forEach((topic) => {
      topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
    });
    if (res.length >= size) break;
  }

  const userInfo: Record<number, Awaited<ReturnType<typeof getUserInfo>>> = {};
  const result: IWinkListRes[] = [];
  for (const item of res) {
    if (!userInfo[item.userId]) {
      userInfo[item.userId] = await getUserInfo(item.userId);
    }
    result.push({
      ...item,
      userName: userInfo[item.userId]?.userName ?? "",
      avatar: userInfo[item.userId]?.avatar ?? "404.png",
    });
  }

  return Promise.all(result.map(async (item) => {
    const comment = await getCommentInfo(item._id.toString());
    return {
      ...item,
      commentCount: comment.commentCount,
      latestComment: comment.commentInfo,
    };
  }));
};

/** 获取瞬间列表数量 */
export const getWinkListCount = async (params: IWinkListReq) => {
  const filter = await handleFilter(params);
  return await winkListCollection.countDocuments(filter);
};

/** 删除瞬间：仅作者本人或管理员 */
export const deleteWink = async (
  id: string,
  operator: IOperator,
): Promise<"deleted" | "not_found" | "forbidden"> => {
  let _id: ObjectId;
  try {
    _id = ObjectId.createFromHexString(id);
  } catch {
    return "not_found";
  }

  const current = await winkListCollection.findOne(
    { _id },
    { projection: { userId: true } },
  );
  if (!current) return "not_found";
  if (!isOwnerOrAdmin(operator, current.userId)) return "forbidden";

  await winkListCollection.deleteOne({ _id });
  return "deleted";
};

type EditWinkParams = {
  winkId: string;
  userId: number;
  operatorRole?: string;
  content: string;
  images: string[];
  video: {
    path: string;
    cover: string;
  };
  location: string;
  topics: string[];
  time: number;
};

/** 编辑帖子，仅允许作者或超级管理员操作 */
export const editWink = async ({
  winkId,
  userId,
  operatorRole,
  content,
  images,
  video,
  location,
  topics,
  time,
}: EditWinkParams): Promise<"updated" | "not_found" | "forbidden"> => {
  // 不允许发布未来时间：超出就钳制为当前时间（前端不再提供未来时间的选择）
  const effectiveTime = Math.max(0, Math.min(time, Math.floor(Date.now() / 1000)));

  let _id: ObjectId;
  try {
    _id = ObjectId.createFromHexString(winkId);
  } catch {
    return "not_found";
  }
  const current = await winkListCollection.findOne({ _id });

  if (!current) {
    return "not_found";
  }

  if (!isOwnerOrAdmin({ userId, role: operatorRole }, current.userId)) {
    return "forbidden";
  }

  await winkListCollection.updateOne(
    { _id },
    {
      $set: {
        content,
        images,
        video,
        location,
        topics,
        time: effectiveTime,
      },
    },
  );

  return "updated";
};

/** 获取所有的话题 */
export const getAllTopics = async () =>
  await topicCollection.find({}).toArray();

/** 通过照片列表反查对应的帖子列表 */
export const getWinkListByPhotoList = async (photoList: string[]) => {
  const res = await winkListCollection
    .find({
      images: { $in: photoList },
    })
    .toArray();
  return res;
};

/** 获取瞬间的详情 */
export const getWinkDetail = async (winkId: string) => {
  const res = await winkListCollection.findOne({
    _id: ObjectId.createFromHexString(winkId),
  });
  if (!res) {
    return null;
  }
  const userInfo = await getUserInfo(res.userId);
  return {
    ...res,
    userName: userInfo?.userName,
    avatar: userInfo?.avatar,
  };
};
