import { Context } from "koa";

import { IWinkRuleInterface } from "@/interface/validatorInterface/wink";
import { WinkRouterPathEnum } from "@/routers/wink";
import { deleteComment } from "@/services/wink/comment";
import { ErrorCodeEnum, handleError, handleSuccess } from "@/utils/errorCode";

/** 删除评论 */
const deleteCommentController = async (ctx: Context) => {
  const { commentId } = ctx.query as IWinkRuleInterface[WinkRouterPathEnum.DeleteComment];
  const operator = {
    userId: ctx.state.curUserInfo.userId,
    role: ctx.state.curUserInfo.role,
  };
  const result = await deleteComment(commentId, operator);

  if (result === "not_found") {
    ctx.body = handleError(ErrorCodeEnum.BUSINESS_ERROR, "评论不存在");
    return;
  }
  if (result === "forbidden") {
    ctx.body = handleError(ErrorCodeEnum.NO_PERMISSION, "只能删除自己的评论");
    return;
  }

  ctx.body = handleSuccess(undefined);
};

export default deleteCommentController;
