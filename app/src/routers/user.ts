import Router from "koa-router";

import {
  loginController,
  loginOutController,
  getInfoController,
  updateInfoController,
  changePasswordController,
} from "@/controller/user";
import activeTimeController from "@/controller/user/activeTime.controller";
import allController from "@/controller/user/all.controller";

const router = new Router();

export enum UserRouterPathEnum {
  /** 登录(账户密码) */
  Login = "/api/user/login",
  /** 登出 */
  LoginOut = "/api/user/login_out",
  /** 获取用户信息 */
  Info = "/api/user/info",
  /** 更新用户头像 */
  UpdateAvatar = "/api/user/update_avatar",
  /** 获取所有用户的最近活跃时间 */
  ActiveTime = "/api/user/active_time",
  /** 获取所有用户信息 */
  All = "/api/user/all",
  /** 修改密码 */
  ChangePassword = "/api/user/change_password",
}

router.post(UserRouterPathEnum.Login, loginController);
router.get(UserRouterPathEnum.LoginOut, loginOutController);
router.get(UserRouterPathEnum.Info, getInfoController);
router.put(UserRouterPathEnum.UpdateAvatar, updateInfoController);
router.get(UserRouterPathEnum.ActiveTime, activeTimeController);
router.get(UserRouterPathEnum.All, allController);
router.post(UserRouterPathEnum.ChangePassword, changePasswordController);

export default router;
