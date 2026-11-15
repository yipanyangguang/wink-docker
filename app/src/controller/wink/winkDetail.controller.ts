import { getWinkDetail } from "@/services/wink";
import { Context } from "koa";

const getWinkDetailController = async (ctx: Context) => {
  const winkId = ctx.query.winkId as string;
  const res = await getWinkDetail(winkId);
  ctx.body = {
    error: 0,
    msg: "success",
    data: res,
  };
};

export default getWinkDetailController;
