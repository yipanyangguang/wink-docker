import { IWinkListReq } from "@/interface/winkInterface";
import { getWinkList, getWinkListCount } from "@/services/wink";
import { isNoAuthWinkTopic } from "@/services/nacos";
import Koa from "koa";
import { ErrorCodeEnum, handleError } from "@/utils/errorCode";

const getListController = async (ctx: Koa.Context) => {
  const reqParams: IWinkListReq = {
    page: Number(ctx.request.query.page),
    pageSize: Number(ctx.request.query.pageSize),
  };
  
  if (ctx.request.query.topic) {
    reqParams.topic = ctx.request.query.topic as string;
  }

  if (ctx.request.query.desc) {
    reqParams.desc = ctx.request.query.desc as string;
  }

  if (!reqParams.topic || !(await isNoAuthWinkTopic(reqParams.topic))) {
    ctx.body = handleError(ErrorCodeEnum.NO_PERMISSION, "没有权限访问这个话题");
    return;
  }


  const list = await getWinkList(reqParams);
  const total = await getWinkListCount(reqParams);
  ctx.body = {
    error: 0,
    msg: "success",
    data: list,
    total: total,
  };
};

export default getListController;
