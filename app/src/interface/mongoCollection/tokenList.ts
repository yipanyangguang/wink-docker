import { ObjectId } from "mongodb";

export interface ITokenListDocument {
  _id: ObjectId;
  userAgent: string;
  loginTime: number;
  token: string;
  userId: number;
  /** 最近活跃时间 */
  lastUseTime: number;
  /** 会话备注 */
  remark?: string;
}
