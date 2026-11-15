import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Skeleton } from "antd-mobile";
import { flushSync } from "react-dom";

import { routeLoaders } from "@/routeLoaders";
import { getRouteLocation, routeTitle, type AppRoute } from "@/utils/routes";
import Bar from "@/components/Bar";

const TAB_ROUTES = ["/", "/search", "/send", "/center"] as const;
const TAB_ROUTE_SET = new Set<AppRoute>(TAB_ROUTES);

const pages = Object.fromEntries(
  Object.entries(routeLoaders).map(([route, loader]) => [route, lazy(loader)])
) as Record<AppRoute, ReturnType<typeof lazy>>;

const RouteLoading = () => (
  <div style={{ padding: "calc(env(safe-area-inset-top) + 24px) 16px 16px" }}>
    <Skeleton.Title animated />
    <Skeleton.Paragraph animated lineCount={5} />
  </div>
);

interface TabRoutePageProps {
  route: AppRoute;
  active: boolean;
}

/**
 * Tab 页面只在第一次访问时挂载，后续切换通过 hidden 隐藏，保留组件状态、
 * 已加载的数据以及 DOM。这样从其他 Tab 回到首页时不会重新请求和渲染列表。
 */
const TabRoutePage = ({ route, active }: TabRoutePageProps) => {
  const Page = pages[route];

  return (
    <div
      className="spa-route-page"
      hidden={!active}
      aria-hidden={!active}
    >
      <Suspense fallback={active ? <RouteLoading /> : null}>
        <Page />
      </Suspense>
    </div>
  );
};

const Router = () => {
  const [location, setLocation] = useState(getRouteLocation);
  const [visitedTabRoutes, setVisitedTabRoutes] = useState<Set<AppRoute>>(
    () => {
      const initialLocation = getRouteLocation();
      return TAB_ROUTE_SET.has(initialLocation.path)
        ? new Set([initialLocation.path])
        : new Set<AppRoute>();
    }
  );

  useEffect(() => {
    if (!window.location.hash) {
      history.replaceState(null, "", `${import.meta.env.BASE_URL}#/`);
    }

    const handleRouteChange = () => {
      flushSync(() => setLocation(getRouteLocation()));
    };
    window.addEventListener("hashchange", handleRouteChange);
    window.addEventListener("popstate", handleRouteChange);
    window.addEventListener("app:navigation", handleRouteChange);
    return () => {
      window.removeEventListener("hashchange", handleRouteChange);
      window.removeEventListener("popstate", handleRouteChange);
      window.removeEventListener("app:navigation", handleRouteChange);
    };
  }, []);

  useEffect(() => {
    document.title = location.path === "/channel"
      ? location.searchParams.get("topic")?.trim() || routeTitle[location.path]
      : routeTitle[location.path];
  }, [location.key]);

  const isTabRoute = TAB_ROUTE_SET.has(location.path);
  useEffect(() => {
    if (!isTabRoute) return;

    setVisitedTabRoutes((current) => {
      if (current.has(location.path)) return current;
      const next = new Set(current);
      next.add(location.path);
      return next;
    });
  }, [isTabRoute, location.path]);

  const mountedTabRoutes = useMemo(() => {
    const routes = new Set(visitedTabRoutes);
    if (isTabRoute) routes.add(location.path);
    return routes;
  }, [isTabRoute, location.path, visitedTabRoutes]);
  const Page = pages[location.path];

  return (
    <>
      {Array.from(mountedTabRoutes).map((route) => (
        <TabRoutePage
          key={route}
          route={route}
          active={isTabRoute && location.path === route}
        />
      ))}
      {!isTabRoute && (
        <Suspense fallback={<RouteLoading />}>
          <div
            key={location.key}
            className={`spa-route-page ${location.path === "/channel" ? "channel-route-page" : ""}`}
          >
            <Page />
          </div>
        </Suspense>
      )}
      {isTabRoute && <Bar activePath={location.path} />}
    </>
  );
};

export default Router;
