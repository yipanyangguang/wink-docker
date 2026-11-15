import windowFunc from "@/utils/windowFunc";
import { getRouteLocation, isLoginRoute } from "@/utils/routes";
import { message } from "antd";
import axios from "axios";

const AUTH_EXPIRED_MESSAGE = "登录已过期，请重新登录";
const NOT_INITIALIZED_MESSAGE = "系统尚未初始化";
let redirectingToLogin = false;
let redirectingToSetup = false;

export const isAuthExpired = (data: unknown) => {
  if (!data || typeof data !== "object" || !("error" in data)) return false;

  return Number((data as { error?: unknown }).error) === -2;
};

/** 新增错误码 -5：系统尚未初始化 */
export const isNotInitialized = (data: unknown) => {
  if (!data || typeof data !== "object" || !("error" in data)) return false;

  return Number((data as { error?: unknown }).error) === -5;
};

export const redirectToLogin = () => {
  // 已经到达登录页就复位标志，否则下次过期会被永久挡住
  if (isLoginRoute()) {
    redirectingToLogin = false;
    return;
  }
  if (redirectingToLogin) return;

  redirectingToLogin = true;
  localStorage.removeItem("token");
  windowFunc.replace("#/login");
};

/**
 * 跳到首次运行向导。用 replaceState + 自定义导航事件做 SPA 跳转，
 * 不依赖 windowFunc，避免与路由/导航模块形成循环 import。
 */
export const redirectToSetup = () => {
  if (getRouteLocation().path === "/setup") {
    redirectingToSetup = false;
    return;
  }
  if (redirectingToSetup) return;

  redirectingToSetup = true;
  localStorage.removeItem("token");
  history.replaceState(null, "", `${import.meta.env.BASE_URL}#/setup`);
  window.dispatchEvent(new Event("app:navigation"));
};

export const ensureAuthenticatedResponse = <T>(data: T) => {
  // -5 优先：系统还没初始化时先去向导，不能走登录重定向
  if (isNotInitialized(data)) {
    redirectToSetup();
    throw new Error(NOT_INITIALIZED_MESSAGE);
  }

  if (isAuthExpired(data)) {
    redirectToLogin();
    throw new Error(AUTH_EXPIRED_MESSAGE);
  }

  return data;
};

axios.interceptors.response.use((response) => {
  try {
    ensureAuthenticatedResponse(response.data);
    return response;
  } catch (error) {
    return Promise.reject(error);
  }
});

const handleRequestError = (err: unknown) => {
  const error = err instanceof Error ? err : new Error("请求失败，请稍后重试");

  if (
    error.message !== AUTH_EXPIRED_MESSAGE &&
    error.message !== NOT_INITIALIZED_MESSAGE
  ) {
    message.error(error.message);
  }
  return Promise.reject(error);
};

export const axiosPost = (url: string, params: any, headers?: any) =>
  axios
    .post(
      url,
      { ...params },
      {
        headers: {
          token: localStorage.getItem("token") || "",
          ...headers,
        },
      }
    )
    .then((res) => res.data)
    .catch(handleRequestError);

export const axiosGet = (url: string, options?: { showError?: boolean }) =>
  axios
    .get(url, {
      headers: {
        token: localStorage.getItem("token") || "",
      },
    })
    .then((res) => res.data)
    .catch((error) =>
      options?.showError === false ? Promise.reject(error) : handleRequestError(error)
    );

export const axiosPut = (url: string, params: any) =>
  axios
    .put(
      url,
      { ...params },
      {
        headers: {
          token: localStorage.getItem("token") || "",
        },
      }
    )
    .then((res) => res.data)
    .catch(handleRequestError);

export const axiosDelete = (url: string) =>
  axios
    .delete(url, {
      headers: {
        token: localStorage.getItem("token") || "",
      },
    })
    .then((res) => res.data)
    .catch(handleRequestError);
