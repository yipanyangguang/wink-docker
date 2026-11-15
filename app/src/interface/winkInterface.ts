/** 一个帖子的所有属性 */
export interface IWinkItem {
  _id: string;
  userId: number;
  content: string;
  images: string[];
  video: {
    path: string;
    cover: string;
  };
  time: number;
  location: string;
  topics: string[];
}

/** 获取瞬间列表的请求体 */
export interface IWinkListReq {
  page: number;
  pageSize: number;
  location?: string;
  topic?: string;
  desc?: string;
}
