import { ObjectId } from "mongodb";

export interface IWinkCommentDocument {
  _id: ObjectId;
  /** 所属帖子id */
  winkId: string;
  /** 评论内容 */
  content: string;
  /** 评论附带的图片 */
  image: string;
  /** 评论时间 */
  time: number;
  /** 评论者id */
  userId: number;
}
