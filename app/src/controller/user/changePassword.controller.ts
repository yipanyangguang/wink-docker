/**
 * @description 修改密码
 */
import Koa from "koa";
import { verifyUserPassword, updateUserPassword } from "@/services/user";
import { ErrorCodeEnum, handleError, handleSuccess } from "@/utils/errorCode";

const changePasswordController = async (ctx: Koa.Context) => {
  const { oldPassword, newPassword } = ctx.request.body as {
    oldPassword: string;
    newPassword: string;
  };

  // 获取当前用户信息
  const userId = ctx.state.curUserInfo.userId;
  const userName = ctx.state.curUserInfo.userName;

  // 验证旧密码是否正确
  const userInfo = await verifyUserPassword(userName, oldPassword);
  if (!userInfo) {
    return (ctx.body = handleError(
      ErrorCodeEnum.BUSINESS_ERROR,
      "原密码错误",
    ));
  }

  // 验证新密码不能与旧密码相同
  if (oldPassword === newPassword) {
    return (ctx.body = handleError(
      ErrorCodeEnum.BUSINESS_ERROR,
      "新密码不能与原密码相同",
    ));
  }

  // 验证新密码长度
  if (newPassword.length < 6) {
    return (ctx.body = handleError(
      ErrorCodeEnum.BUSINESS_ERROR,
      "新密码长度不能少于6位",
    ));
  }

  // 更新密码
  await updateUserPassword(userId, newPassword);

  return (ctx.body = handleSuccess("密码修改成功"));
};

export default changePasswordController;
