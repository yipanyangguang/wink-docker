import { IWinkRuleInterface } from "@/interface/validatorInterface/wink";
import { WinkRouterPathEnum } from "@/routers/wink";
import { changeTopicBackground } from "@/services/wink/topic";
import { handleSuccess } from "@/utils/errorCode";
import Koa from "koa";

const setTopicBGController = async (ctx: Koa.Context) => {
  const requestParams = ctx.request.body as IWinkRuleInterface[WinkRouterPathEnum.SetTopicBackground];
  const { topic, background } = requestParams;
  const res = await changeTopicBackground(topic, background);
  ctx.body = handleSuccess(res);
}

export default setTopicBGController;