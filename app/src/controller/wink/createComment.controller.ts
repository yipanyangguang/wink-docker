import { IWinkRuleInterface } from "@/interface/validatorInterface/wink";
import { WinkRouterPathEnum } from "@/routers/wink";
import {
  writeComment,
} from "@/services/wink/comment";
import { ErrorCodeEnum, handleError, handleSuccess } from "@/utils/errorCode";
import { Context } from "koa";

/** 写评论 */
const createCommentController = async (ctx: Context) => {
  const requestParams = ctx.request.body as IWinkRuleInterface[WinkRouterPathEnum.Comment];
  // 额外逻辑 图片和文本不能同时为空
  if (!requestParams.content && !requestParams.image) {
    return ctx.body = handleError(ErrorCodeEnum.BUSINESS_ERROR, "评论内容不能为空")
  }

  const res = await writeComment({
    winkId: requestParams.winkId,
    content: requestParams.content || "",
    image: requestParams.image || "",
    time: Date.now(),
    userId: ctx.state.curUserInfo.userId,
  });

  ctx.body = handleSuccess(res)
};

export default createCommentController;