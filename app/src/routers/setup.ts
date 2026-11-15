import Router from "koa-router";

import healthController from "@/controller/setup/health.controller";
import setupInitController from "@/controller/setup/init.controller";
import setupStatusController from "@/controller/setup/status.controller";

const router = new Router();

export enum SetupRouterPathEnum {
  /** 健康检查 */
  Health = "/api/health",
  /** 系统状态（向导页长期可读） */
  Status = "/api/setup/status",
  /** 一次性初始化 */
  Init = "/api/setup/init",
}

router.get(SetupRouterPathEnum.Health, healthController);
router.get(SetupRouterPathEnum.Status, setupStatusController);
router.post(SetupRouterPathEnum.Init, setupInitController);

export default router;
