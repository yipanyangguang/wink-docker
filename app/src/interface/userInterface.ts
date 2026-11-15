/** 用户登录请求体 */
export interface UserLoginRequest {
  userName: string;
  password: string;
}

/** 用户更新头像响应体 */
export interface UserUpdateAvatarResponse {
  avatar: string;
}
