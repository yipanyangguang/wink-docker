import { Context } from "koa";

import { isAdminRole } from "@/config/admin";
import { IWinkRuleInterface } from "@/interface/validatorInterface/wink";
import { WinkRouterPathEnum } from "@/routers/wink";
import { renameTopic } from "@/services/wink/topic";
import { ErrorCodeEnum, handleError, handleSuccess } from "@/utils/errorCode";

const renameTopicController = async (ctx: Context) => {
  if (!isAdminRole(ctx.state.curUserInfo?.role)) {
    ctx.body = handleError(ErrorCodeEnum.NO_PERMISSION, "只有管理员可以修改话题名称");
    return;
  }
  const { topic, newTopic } = ctx.request.body as IWinkRuleInterface[WinkRouterPathEnum.RenameTopic];
  const normalizedTopic = topic.trim();
  const normalizedNewTopic = newTopic.trim();

  if (!normalizedTopic || !normalizedNewTopic) {
    ctx.body = handleError(ErrorCodeEnum.PARAMS_VALIDATION_FAILED, "话题名称不能为空");
    return;
  }
  if (Array.from(normalizedNewTopic).length > 30) {
    ctx.body = handleError(ErrorCodeEnum.PARAMS_VALIDATION_FAILED, "话题名称不能超过30个字符");
    return;
  }
  if (/[\r\n\t]/.test(normalizedNewTopic)) {
    ctx.body = handleError(ErrorCodeEnum.PARAMS_VALIDATION_FAILED, "话题名称不能包含换行或制表符");
    return;
  }

  const result = await renameTopic(normalizedTopic, normalizedNewTopic);
  if (result.status === "not_found") {
    ctx.body = handleError(ErrorCodeEnum.BUSINESS_ERROR, "原话题不存在");
    return;
  }
  if (result.status === "duplicate") {
    ctx.body = handleError(ErrorCodeEnum.BUSINESS_ERROR, "新话题名称已存在");
    return;
  }
  if (result.status === "same") {
    ctx.body = handleError(ErrorCodeEnum.BUSINESS_ERROR, "新旧话题名称不能相同");
    return;
  }
  if (result.status !== "renamed") {
    ctx.body = handleError(ErrorCodeEnum.BUSINESS_ERROR, "话题改名失败，请重试");
    return;
  }

  ctx.body = {
    ...handleSuccess({
      oldTopic: normalizedTopic,
      newTopic: normalizedNewTopic,
      updatedWinkCount: result.updatedWinkCount,
    }),
    msg: "话题改名成功",
  };
};

export default renameTopicController;
