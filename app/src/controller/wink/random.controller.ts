import { getRandomWinkList } from "@/services/wink";
import Koa from "koa";

const getRandomListController = async (ctx: Koa.Context) => {
  const data = await getRandomWinkList(10);
  ctx.body = {
    error: 0,
    msg: "success",
    data,
    total: data.length,
  };
};

export default getRandomListController;
