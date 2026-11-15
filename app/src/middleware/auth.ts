import Koa from "koa";

import { noCheckApis, setupFreePaths } from "@/config/noCheckApis";
import { getInitialized } from "@/services/setup";
import { updateTokenLastUseTime } from "@/services/user";
import verifyToken from "@/services/verifyToken";
import { ErrorCodeEnum, handleError } from "@/utils/errorCode";
import logger from "@/utils/logger";

/** 含密码或长期凭据的接口不把请求体写进日志 */
const SENSITIVE_PATHS = ["/api/user/login", "/api/user/change_password"];

const runBackgroundTask = (
  task: Promise<unknown>,
  taskName: string,
  path: string,
) => {
  void task.catch((error) => {
    logger.error({
      title: "authMiddleware",
      message: `${taskName}执行失败`,
      more: {
        path,
        error,
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });
  });
};

const authMiddleware = async (ctx: Koa.Context, next: Koa.Next) => {
  const { path } = ctx.request;
  const sensitive = SENSITIVE_PATHS.includes(path);
  const requestBodyLog = sensitive
    ? "[已隐藏]"
    : JSON.stringify(ctx.request.body ?? {}).slice(0, 200);
  const requestQueryLog = JSON.stringify(ctx.request.query).slice(0, 200);

  // 未初始化时只放行健康检查与向导接口；其余（含 login）统一返回 -5，
  // 前端据此跳 /setup 而不是 /login
  if (!setupFreePaths.includes(path) && !(await getInitialized())) {
    ctx.body = handleError(ErrorCodeEnum.NOT_INITIALIZED);
    return;
  }

  // 免鉴权接口
  if (noCheckApis.includes(path)) {
    logger.info({
      title: "authMiddleware",
      message: "无验证访问",
      more: {
        method: ctx.request.method,
        path,
        body: requestBodyLog,
        query: requestQueryLog,
      },
    });
    await next();
    return;
  }

  const token = ctx.request.header.token as string;
  const { error, data } = await verifyToken(token);

  if (!error) {
    ctx.state = {
      curUserInfo: {
        userName: data?.userName,
        avatar: data?.avatar,
        userId: data?.userId,
        role: data?.role ?? "member",
        status: data?.status ?? "active",
      },
    };
    logger.info({
      title: "authMiddleware",
      message: `${data?.userName}访问`,
      more: {
        method: ctx.request.method,
        path,
        body: requestBodyLog,
        query: requestQueryLog,
      },
    });
    runBackgroundTask(
      updateTokenLastUseTime(token),
      "updateTokenLastUseTime",
      path,
    );
    await next();
    return;
  }

  ctx.body = handleError(ErrorCodeEnum.TOKEN_EXPIRED);
};

export default authMiddleware;
