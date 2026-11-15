import { Context } from "koa";

import { WinkRouterPathEnum } from "@/routers/wink";
import { IWinkRuleInterface } from "@/interface/validatorInterface/wink";
import { deleteWinkShare } from "@/services/wink/share";
import { handleError, handleSuccess, ErrorCodeEnum } from "@/utils/errorCode";

const deleteWinkShareController = async (ctx: Context) => {
  const { shareId } = ctx.request.query as IWinkRuleInterface[WinkRouterPathEnum.DeleteShare];
  const operator = {
    userId: ctx.state.curUserInfo.userId,
    role: ctx.state.curUserInfo.role,
  };
  const deleted = await deleteWinkShare(shareId, operator);
  if (!deleted) {
    ctx.body = handleError(ErrorCodeEnum.NO_PERMISSION, "分享不存在或无权删除");
    return;
  }
  ctx.body = handleSuccess(undefined);
};

export default deleteWinkShareController;
