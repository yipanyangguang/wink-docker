import { message } from "antd";
import axios from "axios";

import { axiosGet, axiosPost, axiosPut } from "./myaxios.js";

interface userLoginResponse {
  error?: string | number;
  msg?: string;
  data?: {
    token: string;
    userId: number;
    userName: string;
    avatar: string;
    role?: string;
  };
}

/** 用户登录 */
export const userLogin = (userName: string, password: string) => {
  return axios
    .post("/api/user/login", { userName, password })
    .then((res) => res.data) as Promise<userLoginResponse>;
};

export interface userInfo {
  error?: string;
  avatar: string;
  userId: number;
  userName: string;
  role?: string;
}

/** 获取自己的用户信息 */
export const getMyUserInfo = () => {
  return axiosGet("/api/user/info") as Promise<userInfo>;
};

/** 获取用户信息 通过userId */
export const getUserInfo = (userId: number) => {
  return axiosGet(`/api/user/info?userId=${userId}`) as Promise<userInfo>;
};

/** 设置用户头像 */
export const setAvatar = (avatar: string) => {
  return axiosPut("/api/user/update_avatar", { avatar });
};

/** 退出登录 */
export const logout = () => {
  return axiosGet("/api/user/login_out");
};

/** 获取所有用户信息 */
export const getAllUserInfo = () => {
  return axiosGet("/api/user/all") as Promise<{
    data: userInfo[];
    error?: string;
  }>;
};

/** 获取所有用户信息，不带自动重定向功能 */
export const getAllUserInfoWithoutRedirect = () => {
  return axios
    .get("/api/user/all", {
      headers: {
        token: localStorage.getItem("token") || "",
      },
    })
    .then((res) => res.data)
    .catch((err) => message.error(err.message));
};

/** 修改自己的密码 */
export const changePassword = (oldPassword: string, newPassword: string) => {
  return axiosPost("/api/user/change_password", {
    oldPassword,
    newPassword,
  }) as Promise<{ error?: number; msg?: string; data?: string }>;
};
