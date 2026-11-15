import { ObjectId } from "mongodb";

export interface INacosDocument {
  _id: ObjectId;
  /** 存储的内容 */
  info: any;
  /** 备注 */
  remark: string;
  /** 唯一值 */
  key: string;
}
