import { IWinkRuleInterface } from "@/interface/validatorInterface/wink";
import { WinkRouterPathEnum } from "@/routers/wink";
import { getTopicBackground } from "@/services/wink/topic";
import { isNoAuthWinkTopic } from "@/services/nacos";
import { ErrorCodeEnum, handleError } from "@/utils/errorCode";
import { handleSuccess } from "@/utils/errorCode";
import Koa from "koa";

const getTopicBGController = async (ctx: Koa.Context) => {
  const requestParams = ctx.request.query as IWinkRuleInterface[WinkRouterPathEnum.GetTopicBackground];
  const { topic } = requestParams;
  if (!(await isNoAuthWinkTopic(topic))) {
    ctx.body = handleError(ErrorCodeEnum.NO_PERMISSION, "没有权限访问这个话题");
    return;
  }
  const res = await getTopicBackground(topic);
  ctx.body = handleSuccess(res);
}

export default getTopicBGController;
