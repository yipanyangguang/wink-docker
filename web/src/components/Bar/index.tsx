import styles from "./index.module.less";
import iconList from "@/icons/wink.svg";
import iconSend from "@/icons/publish.svg";
import iconTopicTab from "@/icons/topic-tab.svg";
import search from "@/icons/search.svg";
import { thumbImage } from "@/utils/handleImage";
import windowFunc from "@/utils/windowFunc";
import { useEffect, useState } from "react";
import { getMyUserInfo } from "@/APIS/user";
import cs from "classnames";
import type { AppRoute } from "@/utils/routes";
import { HOME_TAB_RESELECT_EVENT } from "@/utils/navigation";

interface BarProps {
  activePath?: AppRoute;
}

const Bar = ({ activePath }: BarProps) => {
  const [avatar, setAvatar] = useState(
    localStorage.getItem("avatar") ?? "404.png"
  );
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    getMyUserInfo().then((res) => {
      if (res.error) {
        setOpacity(0);
        return;
      }
      setAvatar(res.avatar);
      setOpacity(1);
      localStorage.setItem("avatar", res.avatar);
      localStorage.setItem("userName", res.userName);
    });
  }, []);

  return (
    <nav
      className={cs(styles.barWarp, activePath === "/send" && styles.sendRoute)}
      style={{ opacity }}
      aria-label="主导航"
    >
      <button
        type="button"
        className={cs(styles.item, activePath === "/search" && styles.active)}
        aria-current={activePath === "/search" ? "page" : undefined}
        onClick={() => windowFunc.replace("#/search")}
      >
        <img src={search} alt="帖子" />
        <span>搜索</span>
      </button>
      <button
        type="button"
        className={cs(styles.item, activePath === "/" && styles.active)}
        aria-current={activePath === "/" ? "page" : undefined}
        onClick={() => {
          if (activePath === "/") {
            window.dispatchEvent(new Event(HOME_TAB_RESELECT_EVENT));
            return;
          }
          windowFunc.replace("#/");
        }}
      >
        <img src={iconList} alt="帖子" />
        <span>首页</span>
      </button>
      <button
        type="button"
        className={cs(styles.item, activePath === "/send" && styles.active)}
        aria-current={activePath === "/send" ? "page" : undefined}
        onClick={() => windowFunc.replace("#/send")}
      >
        <img src={iconSend} alt="发布" />
        <span>发布</span>
      </button>
      <button
        type="button"
        className={cs(styles.item, activePath === "/center" && styles.active)}
        aria-current={activePath === "/center" ? "page" : undefined}
        onClick={() => windowFunc.replace("#/center")}
      >
        <img src={iconTopicTab} alt="话题" />
        <span>话题</span>
      </button>
    </nav>
  );
};

export default Bar;
