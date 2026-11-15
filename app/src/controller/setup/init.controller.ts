import Koa from "koa";

import {
  getInitialized,
  initializeSystem,
  validateNewUser,
} from "@/services/setup";
import { ErrorCodeEnum, handleError, handleSuccess } from "@/utils/errorCode";

/** 一次性初始化：创建首个管理员并写入初始配置 */
const setupInitController = async (ctx: Koa.Context) => {
  const { userName, password } = (ctx.request.body ?? {}) as {
    userName?: unknown;
    password?: unknown;
  };

  // 已初始化后接口永久关闭：先判定状态，再校验参数，
  // 保证无论提交什么都只返回「系统已初始化」
  if (await getInitialized()) {
    ctx.body = handleError(ErrorCodeEnum.BUSINESS_ERROR, "系统已初始化");
    return;
  }

  const invalid = validateNewUser(userName, password);
  if (invalid) {
    ctx.body = handleError(ErrorCodeEnum.PARAMS_VALIDATION_FAILED, invalid);
    return;
  }

  try {
    const result = await initializeSystem({
      userName: userName as string,
      password: password as string,
    });
    if (!result.ok || !result.user) {
      ctx.body = handleError(ErrorCodeEnum.BUSINESS_ERROR, "系统已初始化");
      return;
    }
    ctx.body = handleSuccess({
      userName: result.user.userName,
      userId: result.user.userId,
      role: "admin",
    });
  } catch (error) {
    ctx.body = handleError(
      ErrorCodeEnum.BUSINESS_ERROR,
      error instanceof Error ? error.message : "初始化失败",
    );
  }
};

export default setupInitController;
