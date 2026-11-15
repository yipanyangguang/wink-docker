import type { ComponentType } from "react";
import type { AppRoute } from "@/utils/routes";

type PageModule = { default: ComponentType<any> };
type PageLoader = () => Promise<PageModule>;

export const routeLoaders: Record<AppRoute, PageLoader> = {
  "/": () => import("@/pages/Main/App"),
  "/login": () => import("@/pages/Login"),
  "/center": () => import("@/pages/UserCenter"),
  "/send": () => import("@/pages/SendWinkRoute"),
  "/channel": () => import("@/pages/Chanel"),
  "/users": () => import("@/pages/AllUser"),
  "/topics": () => import("@/pages/Topics"),
  "/open-topics": () => import("@/pages/OpenTopics"),
  "/wink": () => import("@/pages/WinkDetail"),
  "/search": () => import("@/pages/Search"),
  "/random-winks": () => import("@/pages/RandomWinks"),
  "/wink-shares": () => import("@/pages/WinkShares"),
  "/setup": () => import("@/pages/Setup"),
  "/admin": () => import("@/pages/Admin"),
};

export const preloadRoute = (route: AppRoute) => routeLoaders[route]();
