import { ObjectId } from "mongodb";

export interface ITopicDocument {
  _id: ObjectId;
  /** 话题名称 */
  topic: string;
  /** 是否在首页展示 */
  showIndex: boolean | null;
  /** 最后使用时间 */
  lastTime: number | null;
  /** 话题背景图 */
  background: string | null;
}
