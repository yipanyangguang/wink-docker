import { Context } from "koa";

import { WinkRouterPathEnum } from "@/routers/wink";
import { IWinkRuleInterface } from "@/interface/validatorInterface/wink";
import { createWinkShare } from "@/services/wink/share";
import { handleError, handleSuccess, ErrorCodeEnum } from "@/utils/errorCode";

const createWinkShareController = async (ctx: Context) => {
  const { winkId } = ctx.request.body as IWinkRuleInterface[WinkRouterPathEnum.CreateShare];
  const userId = ctx.state.curUserInfo.userId;
  const data = await createWinkShare(winkId, userId);
  if (!data) {
    ctx.status = 404;
    ctx.body = handleError(ErrorCodeEnum.BUSINESS_ERROR, "帖子不存在");
    return;
  }
  ctx.body = handleSuccess(data);
};

export default createWinkShareController;
