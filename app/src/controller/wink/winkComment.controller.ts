import { IWinkRuleInterface } from "@/interface/validatorInterface/wink";
import { WinkRouterPathEnum } from "@/routers/wink";
import {
  getComments,
} from "@/services/wink/comment";
import { handleSuccess } from "@/utils/errorCode";
import { Context } from "koa";

/** 获取帖子下所有评论 */
const getCommentsController = async (ctx: Context) => {
  const { winkId } = ctx.query as IWinkRuleInterface[WinkRouterPathEnum.GetComments];
  const res = await getComments(winkId);
  ctx.body = handleSuccess(res);
};

export default getCommentsController;
