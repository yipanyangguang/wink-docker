import { Context } from "koa";

import { isAdminRole } from "@/config/admin";
import {
  getNacosInfoAndRemark,
  isAllowedNacosKey,
  setNacosInfo,
} from "@/services/nacos";
import { ErrorCodeEnum, handleError } from "@/utils/errorCode";

/** 获取 nacos 内容（只读两个白名单 key） */
export const getNacosContentController = async (ctx: Context) => {
  const key = String(ctx.request.query.key || "");
  if (!isAllowedNacosKey(key)) {
    ctx.status = 400;
    ctx.body = handleError(ErrorCodeEnum.PARAMS_VALIDATION_FAILED, "不支持的配置项");
    return;
  }

  const info = await getNacosInfoAndRemark(key);
  ctx.body = {
    error: 0,
    msg: info?.remark,
    data: info?.info,
  };
};

/** 设置/更新 nacos 内容；维护开关只有管理员能写 */
export const setNacosContentController = async (ctx: Context) => {
  const params = ctx.request.body as {
    key: string;
    info: object;
    remark: string;
  };
  const { key, info, remark } = params;

  if (!key || !isAllowedNacosKey(key)) {
    ctx.status = 400;
    ctx.body = handleError(ErrorCodeEnum.PARAMS_VALIDATION_FAILED, "不支持的配置项");
    return;
  }
  if (key === "maintenance" && !isAdminRole(ctx.state.curUserInfo?.role)) {
    ctx.body = handleError(ErrorCodeEnum.NO_PERMISSION, "只有管理员可以修改维护开关");
    return;
  }

  const obj = await setNacosInfo(key, info, remark);
  ctx.body = {
    error: 0,
    msg: obj?.remark,
    data: obj?.info,
  };
};
