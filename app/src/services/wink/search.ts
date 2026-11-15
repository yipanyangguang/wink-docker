import { WithId } from "mongodb";
import { winkListCollection } from "../mongodb";
import { getUserInfo } from "../user";
import { IWinkListDocument } from "@/interface/mongoCollection/winkList";

const searchWinkService = async (params: ISearchWinkServiceParams) => {
  const { page, pageSize, keyword } = params;
  // 搜索按普通文本匹配，避免用户输入未闭合或带量词的正则字符导致 MongoDB 查询异常。
  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // 从数据库中 搜索瞬间，匹配关键字，对content，location，topics进行匹配

  const filter = {
    $or: [
      { content: { $regex: escapedKeyword } },
      { location: { $regex: escapedKeyword } },
      { topics: { $regex: escapedKeyword } },
    ]
  };
  const res = await winkListCollection.find(filter)
    .sort({ time: -1 }).skip((page - 1) * pageSize).limit(pageSize).toArray();
  const total = await winkListCollection.countDocuments(filter);

  const userInfo = {};
  const result: IResultItem[] = [];
  for (let i = 0; i < res.length; i++) {
    const item = res[i];
    if (!userInfo[item.userId]) {
      userInfo[item.userId] = await getUserInfo(item.userId);
    }
    result.push({
      ...item,
      userName: userInfo[item.userId].userName,
      avatar: userInfo[item.userId].avatar,
    });
  }

  return {
    data: result,
    total
  }
}

type IResultItem = WithId<IWinkListDocument> & {
  userName: string;
  avatar: string;
}

interface ISearchWinkServiceParams {
  page: number;
  pageSize: number;
  keyword: string;
}

export default searchWinkService;
