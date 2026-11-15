import { IWinkRuleInterface } from "@/interface/validatorInterface/wink";
import { WinkRouterPathEnum } from "@/routers/wink";
import { changeTopicStatus } from "@/services/wink/topic";
import { handleSuccess } from "@/utils/errorCode";
import { Context } from "koa"

const showTopicController = async (ctx: Context) => {
  const { topic } = ctx.request.query as IWinkRuleInterface[WinkRouterPathEnum.ShowTopic];
  await changeTopicStatus(topic, true);
  ctx.body = handleSuccess(undefined);
}

export default showTopicController;