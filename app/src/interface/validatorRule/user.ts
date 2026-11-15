import { UserRouterPathEnum } from "@/routers/user";

import { MethodEnum } from "./commonRule";

const userRule: {
  [key in string]: {
    _method: MethodEnum;
    [key: string]: string;
  };
} = {
  /** auto-start */
  [UserRouterPathEnum.Login]: {
    _method: MethodEnum.POST,
    /** 用户名 */
    userName: "required|string",
    /** 密码 */
    password: "required|string",
  },
  [UserRouterPathEnum.UpdateAvatar]: {
    _method: MethodEnum.PUT,
    /** 头像 */
    avatar: "required|string",
  },
  [UserRouterPathEnum.ChangePassword]: {
    _method: MethodEnum.POST,
    /** 原密码 */
    oldPassword: "required|string",
    /** 新密码 */
    newPassword: "required|string",
  },
  /** auto-end */
};

export default userRule;
