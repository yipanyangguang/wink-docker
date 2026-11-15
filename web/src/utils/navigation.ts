import { preloadRoute } from "@/routeLoaders";
import {
  getCurrentRoute,
  getRouteLocation,
  resolveNavigationTarget,
} from "@/utils/routes";

const TRANSITION_DURATION = 180;
const SCROLL_STORAGE_KEY = "family-node-spa-scroll-positions";
const PREFETCHED_ROUTES = new Set<string>();
const SCROLL_RESTORE_ROUTES = new Set(["/", "/search", "/send", "/center"]);

export const HOME_TAB_RESELECT_EVENT = "app:home-tab-reselect";
export const HOME_TAB_REFRESH_EVENT = "app:home-tab-refresh";
export const AUTH_CHANGED_EVENT = "app:auth-changed";

type NavigationOptions = {
  replace?: boolean;
};

const getScrollPositions = (): Record<string, number> => {
  try {
    return JSON.parse(sessionStorage.getItem(SCROLL_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
};

export const saveScrollPosition = () => {
  const positions = getScrollPositions();
  positions[getCurrentRoute()] = window.scrollY;
  sessionStorage.setItem(SCROLL_STORAGE_KEY, JSON.stringify(positions));
};

export const restoreScrollPosition = (restore = false) => {
  const savedPosition = getScrollPositions()[getCurrentRoute()];
  const target =
    restore && typeof savedPosition === "number" ? savedPosition : 0;
  let attempts = 0;

  const apply = () => {
    window.scrollTo(0, target);
    attempts += 1;

    // Feed routes render after an API response. Retry briefly so their saved
    // position is restored after the document regains its final height.
    const maxScroll = Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight
    );
    if (
      attempts < 24 &&
      (target > maxScroll + 1 || Math.abs(window.scrollY - target) > 1)
    ) {
      window.setTimeout(apply, 80);
    }
  };

  requestAnimationFrame(() => requestAnimationFrame(apply));
};

export const prefetchPage = (path: string) => {
  const target = resolveNavigationTarget(path);
  if (!target.isAppRoute) return;
  const route = getRouteLocation(new URL(target.href).hash).path;
  if (PREFETCHED_ROUTES.has(route)) return;
  PREFETCHED_ROUTES.add(route);
  void preloadRoute(route);
};

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void | Promise<void>) => {
    finished: Promise<void>;
  };
};

const commitSpaNavigation = (href: string, replace = false) => {
  if (replace) history.replaceState(null, "", href);
  else history.pushState(null, "", href);
  window.dispatchEvent(new Event("app:navigation"));
};

export const navigateWithTransition = (
  url: string,
  options: NavigationOptions = {}
) => {
  const target = resolveNavigationTarget(url);
  if (!target.isAppRoute) {
    if (options.replace) window.location.replace(target.href);
    else window.location.assign(target.href);
    return;
  }

  if (target.href === window.location.href) return;
  saveScrollPosition();
  prefetchPage(target.href);

  const navigate = () => {
    commitSpaNavigation(target.href, options.replace);
    const targetRoute = getRouteLocation(new URL(target.href).hash).path;
    restoreScrollPosition(SCROLL_RESTORE_ROUTES.has(targetRoute));
  };

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    navigate();
    return;
  }

  const transitionDocument = document as ViewTransitionDocument;
  if (transitionDocument.startViewTransition) {
    transitionDocument.startViewTransition(() => {
      navigate();
    });
    return;
  }

  document.documentElement.classList.add("page-leave");
  window.setTimeout(navigate, TRANSITION_DURATION);
  window.setTimeout(() => {
    document.documentElement.classList.remove("page-leave");
    document.body.classList.add("page-enter");
    requestAnimationFrame(() => document.body.classList.remove("page-enter"));
  }, TRANSITION_DURATION);
};

const initializeNavigation = () => {
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  document.body?.classList.add("page-enter");
  requestAnimationFrame(() => document.body?.classList.remove("page-enter"));

  let ticking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        saveScrollPosition();
        ticking = false;
      });
    },
    { passive: true }
  );
  window.addEventListener("pagehide", saveScrollPosition, { passive: true });
  window.addEventListener("popstate", () => restoreScrollPosition(true));

  const idle =
    window.requestIdleCallback ||
    ((callback: IdleRequestCallback) => window.setTimeout(callback, 800));
  idle(() => {
    ["#/", "#/search", "#/send", "#/center"].forEach(prefetchPage);
  });
};

export { initializeNavigation };
