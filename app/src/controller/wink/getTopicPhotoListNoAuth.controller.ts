import { Context } from "koa";

import { isNoAuthWinkTopic } from "@/services/nacos";
import {
  getTopicNameById,
  getTopicPhotoList,
} from "@/services/wink/topicPhoto";
import { ErrorCodeEnum, handleError } from "@/utils/errorCode";

const getTopicPhotoListNoAuthController = async (ctx: Context) => {
  const topicId = String(ctx.query.topicId || "");
  const topic = await getTopicNameById(topicId);
  if (!topic) {
    ctx.body = handleError(ErrorCodeEnum.BUSINESS_ERROR, "话题不存在");
    return;
  }

  if (!(await isNoAuthWinkTopic(topic))) {
    ctx.body = handleError(ErrorCodeEnum.NO_PERMISSION, "没有权限访问这个话题");
    return;
  }

  const result = await getTopicPhotoList({
    topicId,
    page: Number(ctx.query.page),
    pageSize: Number(ctx.query.pageSize),
  });
  ctx.body = {
    error: 0,
    msg: "success",
    data: result?.list || [],
    total: result?.total || 0,
    page: result?.page || 1,
    pageSize: result?.pageSize || 40,
    hasMore: result?.hasMore || false,
  };
};

export default getTopicPhotoListNoAuthController;
