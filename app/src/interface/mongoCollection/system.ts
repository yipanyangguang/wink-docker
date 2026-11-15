import { ObjectId } from "mongodb";

/** 系统级配置：initialized 标记、版本号等 */
export interface ISystemDocument {
  _id: ObjectId;
  key: string;
  value: unknown;
}
