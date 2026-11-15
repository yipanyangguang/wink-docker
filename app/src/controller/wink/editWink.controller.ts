import { Context } from "koa";

import { IWinkRuleInterface } from "@/interface/validatorInterface/wink";
import { WinkRouterPathEnum } from "@/routers/wink";
import { editWink } from "@/services/wink";
import { recordTopicInfo } from "@/services/wink/topic";
import { ErrorCodeEnum, handleError, handleSuccess } from "@/utils/errorCode";

/**
 * @description 编辑帖子
 */
const editWinkController = async (ctx: Context) => {
  const {
    winkId,
    content = "",
    images = [],
    video = { path: "", cover: "" },
    location = "",
    topics = [],
    time,
  } = ctx.request.body as IWinkRuleInterface[WinkRouterPathEnum.Edit];
  const result = await editWink({
    winkId,
    content,
    images,
    video,
    location,
    topics,
    time,
    userId: ctx.state.curUserInfo.userId,
    operatorRole: ctx.state.curUserInfo.role,
  });

  if (result === "not_found") {
    ctx.body = handleError(ErrorCodeEnum.BUSINESS_ERROR, "帖子不存在");
    return;
  }

  if (result === "forbidden") {
    ctx.body = handleError(ErrorCodeEnum.NO_PERMISSION, "只能编辑自己的帖子");
    return;
  }

  await Promise.all(topics.map((topic) => recordTopicInfo(topic)));

  ctx.body = {
    ...handleSuccess(winkId),
    msg: "编辑成功",
  };
};

export default editWinkController;
