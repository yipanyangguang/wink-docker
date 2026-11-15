import Koa from "koa";

import { getSystemStatus } from "@/services/setup";
import { handleSuccess } from "@/utils/errorCode";

/** 系统状态：向导阶段与日常都可读 */
const setupStatusController = async (ctx: Koa.Context) => {
  ctx.body = handleSuccess(await getSystemStatus());
};

export default setupStatusController;
