import Koa from 'koa';

export interface IDefaultContext extends Koa.DefaultState {
  state: {
    /** 当前请求的用户信息 */
    curUserInfo: {
      /** 用户ID */
      userId: number;
      /** 用户头像 */
      avatar: string;
      /** 用户名称 */
      userName: string;
      /** 角色 */
      role: string;
      /** 账号状态 */
      status: string;
    };
  };
}