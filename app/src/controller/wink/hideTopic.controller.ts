import { IWinkRuleInterface } from "@/interface/validatorInterface/wink";
import { WinkRouterPathEnum } from "@/routers/wink";
import { changeTopicStatus } from "@/services/wink/topic";
import { handleSuccess } from "@/utils/errorCode";
import { Context } from "koa"

const hideTopicController = async (ctx: Context) => {
  const { topic } = ctx.request.query as IWinkRuleInterface[WinkRouterPathEnum.HideTopic];
  await changeTopicStatus(topic, false);
  ctx.body = handleSuccess(undefined);
}

export default hideTopicController;