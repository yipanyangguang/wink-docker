import Koa from "koa";

import { syncJobsWithSettings } from "@/services/maintenance/jobRegistry";
import {
  getMaintenanceSettings,
  updateMaintenanceSettings,
} from "@/services/setup";
import { ErrorCodeEnum, handleError, handleSuccess } from "@/utils/errorCode";

const SETTING_KEYS = ["dbBackup", "cleanUnusedFiles"] as const;

/** 读维护开关状态 */
export const getSettingsController = async (ctx: Koa.Context) => {
  ctx.body = handleSuccess(await getMaintenanceSettings());
};

/** 写维护开关状态：只接受布尔值，写入后即时注册/注销对应任务，无需重启容器 */
export const putSettingsController = async (ctx: Koa.Context) => {
  const body = (ctx.request.body ?? {}) as Record<string, unknown>;
  const patch: { dbBackup?: boolean; cleanUnusedFiles?: boolean } = {};

  for (const key of SETTING_KEYS) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      if (typeof body[key] !== "boolean") {
        ctx.body = handleError(
          ErrorCodeEnum.PARAMS_VALIDATION_FAILED,
          "参数不合法",
        );
        return;
      }
      patch[key] = body[key] as boolean;
    }
  }

  await updateMaintenanceSettings(patch);
  await syncJobsWithSettings();
  ctx.body = handleSuccess(await getMaintenanceSettings());
};
