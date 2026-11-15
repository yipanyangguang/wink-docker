import { IOperator, isOwnerOrAdmin } from "@/config/admin";
import { IWinkCommentDocument } from "@/interface/mongoCollection/winkComment";
import { userCollection, winkCommentCollection } from "../mongodb";
import { ObjectId } from "mongodb";

/**
 * @description 写入评论
 */
export const writeComment = async (
  params: Omit<IWinkCommentDocument, "_id">
) => {
  return winkCommentCollection.insertOne({
    _id: new ObjectId(),
    ...params,
  });
};

/** 获取帖子的评论数量和最新的一条评论信息 */
export const getCommentInfo = async (winkId: string) => {
  const commentInfo = await winkCommentCollection
    .find({ winkId })
    .sort({ time: -1 })
    .limit(1)
    .toArray();
  const commentCount = await winkCommentCollection.countDocuments({ winkId });

  if (commentInfo.length) {
    const latestComment = commentInfo[0];
    const modifyLatestComment = await handleCommentData([latestComment]);
    return {
      commentInfo: modifyLatestComment[0],
      commentCount,
    };
  }

  return {
    commentInfo: null,
    commentCount,
  };
};

/** 处理评论数据，将数据中的userId转换为用户信息 */
const handleCommentData = async (commentInfos: IWinkCommentDocument[]) => {
  const temp: {
    userId: number;
    avatar: string;
    userName: string;
  }[] = [];
  const result = commentInfos.map(async (commentInfo) => {
    // userCollection;
    if (!temp[commentInfo.userId]) {
      const userInfo = await userCollection.findOne({
        userId: commentInfo.userId,
      });
      temp.push({
        userId: commentInfo.userId,
        avatar: userInfo?.avatar || "",
        userName: userInfo?.userName || "",
      });
      return {
        ...commentInfo,
        avatar: userInfo?.avatar,
        userName: userInfo?.userName,
      };
    }
    const userInfo = temp.filter(
      (item) => item.userId === commentInfo.userId
    )[0];
    return {
      ...commentInfo,
      avatar: userInfo.avatar,
      userName: userInfo.userName,
    };
  });
  return Promise.all(result);
};

/** 获取帖子下所有的评论 */
export const getComments = async (winkId: string) => {
  const commentInfos = await winkCommentCollection
    .find({ winkId })
    .sort({ time: -1 })
    .toArray();
  return await handleCommentData(commentInfos);
};

/** 删除评论：仅评论者本人或管理员 */
export const deleteComment = async (
  id: string,
  operator: IOperator,
): Promise<"deleted" | "not_found" | "forbidden"> => {
  let _id: ObjectId;
  try {
    _id = ObjectId.createFromHexString(id);
  } catch {
    return "not_found";
  }

  const current = await winkCommentCollection.findOne(
    { _id },
    { projection: { userId: true } },
  );
  if (!current) return "not_found";
  if (!isOwnerOrAdmin(operator, current.userId)) return "forbidden";

  await winkCommentCollection.deleteOne({ _id });
  return "deleted";
};
