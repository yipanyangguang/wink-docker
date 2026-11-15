import { getNacosInfoAndRemark } from "@/services/nacos";
import { Context } from "koa";
import { handleSuccess } from "@/utils/errorCode";

/** 获取开放话题列表 */
const openTopicController = async (ctx: Context) => {
  const result = await getNacosInfoAndRemark("noAuthWinkTopics");
  ctx.body = handleSuccess(result);
};

export default openTopicController;
