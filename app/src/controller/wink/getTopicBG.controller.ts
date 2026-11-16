import { IWinkRuleInterface } from "@/interface/validatorInterface/wink";
import { WinkRouterPathEnum } from "@/routers/wink";
import { getTopicBackground } from "@/services/wink/topic";
import { handleSuccess } from "@/utils/errorCode";
import Koa from "koa";

const getTopicBGController = async (ctx: Koa.Context) => {
  const requestParams = ctx.request.query as IWinkRuleInterface[WinkRouterPathEnum.GetTopicBackground];
  const { topic } = requestParams;
  const res = await getTopicBackground(topic);
  ctx.body = handleSuccess(res);
}

export default getTopicBGController;
