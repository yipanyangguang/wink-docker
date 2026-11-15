/**
 * @description 发布帖子
 */
import Koa from "koa";

import { IWinkRuleInterface } from "@/interface/validatorInterface/wink";
import { WinkRouterPathEnum } from "@/routers/wink";
import sendWink from "@/services/wink/sendWink";
import { recordTopicInfo } from "@/services/wink/topic";
import { ErrorCodeEnum, handleError } from "@/utils/errorCode";

const createWinkController = async (ctx: Koa.Context) => {
  const {
    content = "",
    images = [],
    video = { path: "", cover: "" },
    location = "",
    topics = [],
    time,
  } = ctx.request.body as IWinkRuleInterface[WinkRouterPathEnum.New];

  let effectiveTime: number | undefined;
  if (time !== undefined) {
    if (!Number.isSafeInteger(time) || time < 0) {
      ctx.body = handleError(
        ErrorCodeEnum.PARAMS_VALIDATION_FAILED,
        "发布时间必须是有效的秒级时间戳",
      );
      return;
    }
    // 超出当前时间就按当前时间发布，不报错、不写未来时间
    effectiveTime = Math.min(time, Math.floor(Date.now() / 1000));
  }

  const res = await sendWink({
    content,
    images,
    video,
    location,
    topics,
    time: effectiveTime,
    userId: ctx.state.curUserInfo.userId,
  });

  // 记录 topic 信息；await 保证响应返回时话题已可用于查询
  await Promise.all(topics.map((topic) => recordTopicInfo(topic)));

  ctx.body = {
    error: 0,
    msg: "发布成功",
    data: res,
  };
};

export default createWinkController;
