import { UserUpdateAvatarResponse } from "@/interface/userInterface";
import { updateUserAvatar } from "@/services/user";
import koa from "koa";

const updateInfoController = async (ctx: koa.Context) => {
  const { avatar } = ctx.request.body as UserUpdateAvatarResponse;
  await updateUserAvatar(ctx.state.curUserInfo.userId, avatar);
  return (ctx.body = {
    error: 0,
    msg: "更新成功",
  });
};

export default updateInfoController;
