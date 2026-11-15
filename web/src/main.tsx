import ReactDOM from "react-dom/client";
import Router from "@/Router";
import "@/index.module.less";
import "antd/dist/reset.css";
import { initializeNavigation } from "@/utils/navigation";
import { getSetupStatus } from "@/APIS/system";
import { getRouteLocation } from "@/utils/routes";

const render = () => {
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <Router />
  );
};

initializeNavigation();

const runSetupGuard = async () => {
  try {
    // 失败或超时都照常渲染，交给页面自己的错误态兜底，避免白屏
    const res = await Promise.race([
      getSetupStatus(),
      new Promise<never>((_, reject) =>
        window.setTimeout(() => reject(new Error("启动守卫超时")), 4000)
      ),
    ]);
    const status = res?.data;
    if (!status) return;

    const path = getRouteLocation().path;
    if (!status.initialized && path !== "/setup") {
      history.replaceState(null, "", `${import.meta.env.BASE_URL}#/setup`);
    } else if (status.initialized && path === "/setup") {
      history.replaceState(null, "", `${import.meta.env.BASE_URL}#/login`);
    }
  } catch {
    // 守卫请求异常：不改变路由，继续渲染
  } finally {
    render();
  }
};

void runSetupGuard();
