import { Context } from "koa";

import { IWinkRuleInterface } from "@/interface/validatorInterface/wink";
import { WinkRouterPathEnum } from "@/routers/wink";
import { deleteWink } from "@/services/wink";
import { ErrorCodeEnum, handleError, handleSuccess } from "@/utils/errorCode";

const delWinkController = async (ctx: Context) => {
  const { id } = ctx.request.query as IWinkRuleInterface[WinkRouterPathEnum.Delete];
  const operator = {
    userId: ctx.state.curUserInfo.userId,
    role: ctx.state.curUserInfo.role,
  };
  const result = await deleteWink(id, operator);

  if (result === "not_found") {
    ctx.body = handleError(ErrorCodeEnum.BUSINESS_ERROR, "帖子不存在");
    return;
  }
  if (result === "forbidden") {
    ctx.body = handleError(ErrorCodeEnum.NO_PERMISSION, "只能删除自己的帖子");
    return;
  }

  ctx.body = handleSuccess(undefined);
};

export default delWinkController;
