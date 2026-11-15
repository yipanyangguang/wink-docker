import { Context } from "koa";

import { isAdminRole } from "@/config/admin";
import { IWinkRuleInterface } from "@/interface/validatorInterface/wink";
import { WinkRouterPathEnum } from "@/routers/wink";
import { deleteTopic } from "@/services/wink/topic";
import { ErrorCodeEnum, handleError, handleSuccess } from "@/utils/errorCode";

/** 话题没有创始人，只有管理员能删 */
const deleteTopicController = async (ctx: Context) => {
  if (!isAdminRole(ctx.state.curUserInfo?.role)) {
    ctx.body = handleError(ErrorCodeEnum.NO_PERMISSION, "只有管理员可以删除话题");
    return;
  }

  const { topic } = ctx.request
    .query as IWinkRuleInterface[WinkRouterPathEnum.DeleteTopic];
  await deleteTopic(topic);
  ctx.body = handleSuccess(undefined);
};

export default deleteTopicController;
