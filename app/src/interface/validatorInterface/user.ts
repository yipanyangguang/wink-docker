/** 该文件由脚本生成,请勿修改 */

import { UserRouterPathEnum } from "@/routers/user";

export interface IUserRuleInterface {
  [UserRouterPathEnum.Login]: {
    /** 用户名 */
    userName: string;
    /** 密码 */
    password: string;
  };
  [UserRouterPathEnum.UpdateAvatar]: {
    /** 头像 */
    avatar: string;
  };
}
