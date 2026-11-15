import Koa from "koa";

import { isAdminRole } from "@/config/admin";
import { ErrorCodeEnum, handleError } from "@/utils/errorCode";

/** 管理端接口统一鉴权：非管理员一律 -4 */
const adminOnly = async (ctx: Koa.Context, next: Koa.Next) => {
  if (!isAdminRole(ctx.state.curUserInfo?.role)) {
    ctx.body = handleError(ErrorCodeEnum.NO_PERMISSION, "只有管理员可以操作");
    return;
  }
  await next();
};

export default adminOnly;
