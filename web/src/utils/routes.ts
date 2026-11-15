export const APP_BASE = import.meta.env.BASE_URL;

export type AppRoute =
  | "/"
  | "/login"
  | "/center"
  | "/send"
  | "/channel"
  | "/users"
  | "/topics"
  | "/open-topics"
  | "/wink"
  | "/search"
  | "/random-winks"
  | "/wink-shares"
  | "/setup"
  | "/admin";

export interface RouteLocation {
  path: AppRoute;
  search: string;
  searchParams: URLSearchParams;
  hash: string;
  key: string;
}

const LEGACY_ROUTES: Record<string, AppRoute> = {
  "": "/",
  "index.html": "/",
  "login.html": "/login",
  "center.html": "/center",
  "sendWink.html": "/send",
  "chanel.html": "/channel",
  "allUser.html": "/users",
  "topics.html": "/topics",
  "openTopics.html": "/open-topics",
  "winkDetail.html": "/wink",
  "search.html": "/search",
  "randomWinks.html": "/random-winks",
  "winkShares.html": "/wink-shares",
  "setup.html": "/setup",
  "admin.html": "/admin",
};

const ROUTES = new Set<AppRoute>(Object.values(LEGACY_ROUTES));

const normalizeHash = (hash: string) => {
  const value = hash.replace(/^#/, "");
  if (!value) return "/";
  return value.startsWith("/") ? value : `/${value}`;
};

export const getRouteLocation = (hash = window.location.hash): RouteLocation => {
  const normalized = normalizeHash(hash);
  const queryIndex = normalized.indexOf("?");
  const rawPath = queryIndex >= 0 ? normalized.slice(0, queryIndex) : normalized;
  const search = queryIndex >= 0 ? normalized.slice(queryIndex) : "";
  const path = (ROUTES.has(rawPath as AppRoute) ? rawPath : "/") as AppRoute;

  return {
    path,
    search,
    searchParams: new URLSearchParams(search),
    hash: `#${path}${search}`,
    key: `${path}${search}`,
  };
};

export const getRouteSearchParams = () => getRouteLocation().searchParams;

export const getCurrentRoute = () => getRouteLocation().key;

export const isLoginRoute = () => getRouteLocation().path === "/login";

export const resolveNavigationTarget = (target: string) => {
  if (target.startsWith("#")) {
    const route = normalizeHash(target);
    return {
      isAppRoute: true,
      href: `${window.location.origin}${APP_BASE}#${route}`,
    };
  }

  const url = new URL(target, `${window.location.origin}${APP_BASE}`);
  if (url.origin !== window.location.origin) {
    return { isAppRoute: false, href: url.toString() };
  }

  if (url.hash && (url.pathname === APP_BASE || url.pathname === `${APP_BASE}index.html`)) {
    return {
      isAppRoute: true,
      href: `${window.location.origin}${APP_BASE}${url.hash}`,
    };
  }

  const fileName = url.pathname.split("/").filter(Boolean).pop() || "";
  const route = LEGACY_ROUTES[fileName];
  if (!route) return { isAppRoute: false, href: url.toString() };
  return {
    isAppRoute: true,
    href: `${window.location.origin}${APP_BASE}#${route}${url.search}`,
  };
};

export const routeTitle: Record<AppRoute, string> = {
  "/": "首页",
  "/login": "登录",
  "/center": "我的",
  "/send": "发布",
  "/channel": "频道",
  "/users": "用户",
  "/topics": "话题",
  "/open-topics": "话题广场",
  "/wink": "详情",
  "/search": "搜索",
  "/random-winks": "随机瞬间",
  "/wink-shares": "管理分享",
  "/setup": "初始化",
  "/admin": "管理端",
};
