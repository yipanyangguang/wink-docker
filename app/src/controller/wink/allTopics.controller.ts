import { getAllTopics } from "@/services/wink";
import { Context } from "koa";

const getAllTopicsController = async (ctx: Context) => {
  ctx.body = {
    error: 0,
    msg: "success",
    data: await getAllTopics(),
  };
};

export default getAllTopicsController;
