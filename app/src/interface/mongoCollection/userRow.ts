import { ObjectId } from "mongodb";

/** 用户角色：管理员 / 普通成员 */
export type UserRole = "admin" | "member";
/** 账号状态：正常 / 已禁用（禁用后不能登录，残留会话失效） */
export type UserStatus = "active" | "disabled";

export interface IUserRowDocument {
  _id: ObjectId;
  userName: string;
  password: string;
  avatar: string;
  userId: number;
  /** 角色 */
  role: UserRole;
  /** 账号状态；旧文档可能缺失，新建用户必须写入 */
  status?: UserStatus;
}
