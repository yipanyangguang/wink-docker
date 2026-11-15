import { IWinkListReq } from "@/interface/winkInterface";
import { getWinkList, getWinkListCount } from "@/services/wink";
import Koa from "koa";

const getListController = async (ctx: Koa.Context) => {
  const reqParams: IWinkListReq = {
    page: Number(ctx.request.query.page),
    pageSize: Number(ctx.request.query.pageSize),
  };
  if (ctx.request.query.location) {
    reqParams.location = ctx.request.query.location as string;
  }
  if (ctx.request.query.topic) {
    reqParams.topic = ctx.request.query.topic as string;
  }
  if (ctx.request.query.desc) {
    reqParams.desc = ctx.request.query.desc as string;
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
