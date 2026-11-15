import Koa from "koa";

import { getHealthChecks, getInitialized } from "@/services/setup";
import { ErrorCodeEnum, handleError, handleSuccess } from "@/utils/errorCode";

/** 轻量健康检查：只探测 mongo / redis / storage，任一失败返回 503 */
const healthController = async (ctx: Koa.Context) => {
  const checks = await getHealthChecks();
  const initialized = await getInitialized();
  const healthy = checks.mongo && checks.redis && checks.storage;

  if (!healthy) {
    ctx.status = 503;
    ctx.body = handleError(ErrorCodeEnum.BUSINESS_ERROR, "服务未就绪");
    return;
  }

  ctx.body = handleSuccess({
    healthy,
    mongo: checks.mongo,
    redis: checks.redis,
    storage: checks.storage,
    initialized,
  });
};

export default healthController;
