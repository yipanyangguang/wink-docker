import Koa from "koa";

import { deleteUserToken } from "@/services/user";

const loginOutController = async (ctx: Koa.Context) => {
  await deleteUserToken(
    ctx.request.header.token as string,
    ctx.state.curUserInfo.userId,
  );
  ctx.body = {
    error: 0,
    msg: "登出成功",
  };
};

export default loginOutController;
