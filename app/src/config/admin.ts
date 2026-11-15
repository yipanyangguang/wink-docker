/** 操作者上下文：从 auth 中间件构造，随请求传入 service 做归属判定 */
export interface IOperator {
  userId: number;
  role?: string;
}

/** 是否管理员角色 */
export const isAdminRole = (role?: string) => role === "admin";

/** 内容归属判定：本人或管理员。管理员可操作所有内容。 */
export const isOwnerOrAdmin = (operator: IOperator, ownerUserId: number) =>
  operator.userId === ownerUserId || isAdminRole(operator.role);
