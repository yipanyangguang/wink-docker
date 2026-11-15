import { Context } from "koa";

import { getTopicInfo } from "@/services/wink/topicInfo";

const getTopicInfoController = async (ctx: Context) => {
  const topic = String(ctx.query.topic || "");
  const data = await getTopicInfo(topic);
  ctx.body = {
    error: 0,
    msg: "success",
    data,
  };
};

export default getTopicInfoController;
