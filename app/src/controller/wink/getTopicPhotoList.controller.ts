import { Context } from "koa";

import { getTopicPhotoList } from "@/services/wink/topicPhoto";
import { ErrorCodeEnum, handleError } from "@/utils/errorCode";

const getTopicPhotoListController = async (ctx: Context) => {
  const result = await getTopicPhotoList({
    topicId: String(ctx.query.topicId || ""),
    page: Number(ctx.query.page),
    pageSize: Number(ctx.query.pageSize),
  });
  if (!result) {
    ctx.body = handleError(ErrorCodeEnum.BUSINESS_ERROR, "话题不存在");
    return;
  }
  ctx.body = {
    error: 0,
    msg: "success",
    data: result.list,
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    hasMore: result.hasMore,
  };
};

export default getTopicPhotoListController;
