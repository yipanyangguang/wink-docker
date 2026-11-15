import { Context } from "koa";

import { WinkRouterPathEnum } from "@/routers/wink";
import { IWinkRuleInterface } from "@/interface/validatorInterface/wink";
import { getWinkShareDetail } from "@/services/wink/share";
import { handleError, handleSuccess, ErrorCodeEnum } from "@/utils/errorCode";

const getWinkShareDetailController = async (ctx: Context) => {
  const { shareId } = ctx.query as IWinkRuleInterface[WinkRouterPathEnum.ShareDetail];
  const data = await getWinkShareDetail(shareId);
  if (!data) {
    ctx.body = handleError(ErrorCodeEnum.BUSINESS_ERROR, "分享已过期或已被删除");
    return;
  }
  ctx.set("Cache-Control", "no-store");
  ctx.set("X-Robots-Tag", "noindex, nofollow");
  ctx.body = handleSuccess(data);
};

export default getWinkShareDetailController;
