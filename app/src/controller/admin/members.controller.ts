import Koa from "koa";

import { userCollection } from "@/services/mongodb";
import {
  createUser,
  disableMember,
  validateNewUser,
} from "@/services/setup";
import { ErrorCodeEnum, handleError, handleSuccess } from "@/utils/errorCode";

/** 成员列表：白名单投影，绝不含 password / secret */
export const listMembersController = async (ctx: Koa.Context) => {
  const list = await userCollection
    .find(
      {},
      {
        projection: {
          _id: 0,
          userId: true,
          userName: true,
          avatar: true,
          role: true,
          status: true,
        },
      },
    )
    .toArray();
  ctx.body = handleSuccess(list);
};

/** 新增普通成员 */
export const createMemberController = async (ctx: Koa.Context) => {
  const { userName, password } = (ctx.request.body ?? {}) as {
    userName?: unknown;
    password?: unknown;
  };

  const invalid = validateNewUser(userName, password);
  if (invalid) {
    ctx.body = handleError(ErrorCodeEnum.PARAMS_VALIDATION_FAILED, invalid);
    return;
  }

  try {
    const user = await createUser({
      userName: userName as string,
      password: password as string,
      role: "member",
    });
    ctx.body = handleSuccess({
      userId: user.userId,
      userName: user.userName,
      role: "member",
    });
  } catch (error) {
    ctx.body = handleError(
      ErrorCodeEnum.BUSINESS_ERROR,
      error instanceof Error ? error.message : "创建成员失败",
    );
  }
};

/** 禁用成员：只禁用账号并清会话，帖子/评论/头像全部保留 */
export const disableMemberController = async (ctx: Koa.Context) => {
  const userId = Number(ctx.request.query.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    ctx.body = handleError(ErrorCodeEnum.PARAMS_VALIDATION_FAILED, "参数不合法");
    return;
  }

  const result = await disableMember(userId, ctx.state.curUserInfo.userId);
  if (result === "not_found") {
    ctx.body = handleError(ErrorCodeEnum.BUSINESS_ERROR, "成员不存在");
    return;
  }
  if (result === "cannot_disable_self") {
    ctx.body = handleError(ErrorCodeEnum.BUSINESS_ERROR, "不能禁用自己");
    return;
  }
  if (result === "cannot_disable_admin") {
    ctx.body = handleError(ErrorCodeEnum.BUSINESS_ERROR, "不能禁用管理员");
    return;
  }
  ctx.body = handleSuccess(undefined);
};
