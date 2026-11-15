import { navigateWithTransition, prefetchPage } from "@/utils/navigation";
import { getCurrentRoute, isLoginRoute, resolveNavigationTarget } from "@/utils/routes";

const isChannelTarget = (href: string) => {
  try {
    return new URL(href).hash.startsWith("#/channel");
  } catch {
    return false;
  }
};

const withReturnRoute = (href: string) => {
  const target = new URL(href);
  const hash = target.hash || "#/channel";
  const queryIndex = hash.indexOf("?");
  const path = queryIndex >= 0 ? hash.slice(0, queryIndex) : hash;
  const params = new URLSearchParams(queryIndex >= 0 ? hash.slice(queryIndex + 1) : "");
  params.set("returnTo", `#${getCurrentRoute()}`);
  target.hash = `${path}?${params.toString()}`;
  return target.href;
};

const getLoginTarget = () => {
  const params = new URLSearchParams();
  if (!isLoginRoute()) params.set("returnTo", `#${getCurrentRoute()}`);
  return `#/login${params.toString() ? `?${params}` : ""}`;
};

const windowFunc = {
  prefetch: (path: string) => {
    prefetchPage(path);
  },
  replace: (path: string) => {
    const normalized = path.replace(/^\/+/, "");
    const isLoginTarget = normalized === "login.html" || normalized === "#/login";
    const target = resolveNavigationTarget(isLoginTarget ? getLoginTarget() : path);
    if (isChannelTarget(target.href)) {
      // 频道链接通过整页跳转打开，保持导航状态独立。
      window.location.replace(target.href);
      return;
    }
    navigateWithTransition(isLoginTarget ? getLoginTarget() : path, { replace: true });
  },
  open: (path: string) => {
    const target = resolveNavigationTarget(path);
    if (isChannelTarget(target.href)) {
      // 频道链接在新标签页打开，保留当前页面。
      prefetchPage(path);
      window.open(withReturnRoute(target.href), "_blank", "noopener,noreferrer");
      return;
    }
    if (target.isAppRoute) {
      navigateWithTransition(target.href);
      return;
    }

    prefetchPage(path);
    window.open(target.href, "_blank", "noopener,noreferrer");
  },
};

export default windowFunc;
