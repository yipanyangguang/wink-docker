import Koa from "koa";

import { IUserRuleInterface } from "@/interface/validatorInterface/user";
import { UserRouterPathEnum } from "@/routers/user";
import { recordUserToken, verifyUserPassword } from "@/services/user";
import { ErrorCodeEnum, handleError, handleSuccess } from "@/utils/errorCode";
import generateUserToken from "@/utils/generateUserToken";

const loginController = async (ctx: Koa.Context) => {
  // 验证账户是否匹配密码
  const { userName, password } = ctx.request
    .body as IUserRuleInterface[UserRouterPathEnum.Login];
  const userInfo = await verifyUserPassword(userName, password);
  if (!userInfo) {
    return (ctx.body = handleError(
      ErrorCodeEnum.BUSINESS_ERROR,
      "用户名或密码错误",
    ));
  }

  // 生成token
  const token = generateUserToken(userName, password);
  // 记录token
  await recordUserToken({
    userAgent: ctx.request.header["user-agent"] ?? "",
    token,
    userId: userInfo.userId,
  });

  const { userName: username, userId, avatar, role } = userInfo;

  return (ctx.body = handleSuccess({
    userName: username,
    userId,
    avatar,
    role,
    token,
  }));
};

export default loginController;
