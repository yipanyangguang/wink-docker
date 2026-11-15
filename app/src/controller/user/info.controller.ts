import { getUserInfo } from "@/services/user";
import Koa from "koa";

const getInfoController = async (ctx: Koa.Context) => {
  // 判断query上是否有 userId
  if (!ctx.query.userId) {
    // 返回自己的信息
    ctx.body = ctx.state.curUserInfo;
    return;
  }
  // 返回指定用户的信息
  const info = await getUserInfo(Number(ctx.query.userId));
  ctx.body = info
    ? {
        userId: info.userId,
        avatar: info.avatar,
        userName: info.userName,
        role: info.role,
        status: info.status ?? "active",
      }
    : null;
};

export default getInfoController;
