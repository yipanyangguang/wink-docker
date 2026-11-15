import { EllipsisOutlined } from "@ant-design/icons";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";

import ActionSheet from "@/components/ActionSheet";
import iconChannelList from "@/icons/channel-list.svg";
import iconChannelSort from "@/icons/channel-sort.svg";
import iconChannelThumbnails from "@/icons/channel-thumbnails.svg";
import windowFunc from "@/utils/windowFunc";
import { getRouteSearchParams } from "@/utils/routes";

import styles from "./index.module.less";
import { ChanelHeaderProps } from "./interface";

const ChanelHeader = (props: ChanelHeaderProps) => {
  const [hasToken, setHasToken] = useState<boolean>(false);
  const [moreVisible, setMoreVisible] = useState(false);
  const [compact, setCompact] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLButtonElement>(null);
  const descRef = useRef<HTMLButtonElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const fullWidthRef = useRef(0);
  const headerStyle = props.backgroundImage
    ? ({ "--channel-background": `url("${props.backgroundImage}")` } as CSSProperties)
    : undefined;

  useEffect(() => {
    const token = localStorage.getItem("token");
    setHasToken(!!token);
  }, []);

  const handleTopicClick = () => {
    if (!hasToken) return;

    const returnTo = getRouteSearchParams().get("returnTo");
    const isStandalonePwa =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    if (isStandalonePwa && returnTo?.startsWith("#/")) {
      windowFunc.replace(returnTo);
      return;
    }

    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    try {
      const referrer = document.referrer ? new URL(document.referrer) : null;
      if (referrer && referrer.origin === window.location.origin && referrer.href !== window.location.href) {
        window.location.replace(referrer.href);
        return;
      }
    } catch {
      // 无法解析来源地址时继续使用首页兜底。
    }

    windowFunc.replace("#/");
  };

  useEffect(() => {
    const updateScrollState = () => setScrolled(window.scrollY > 8);

    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });
    return () => window.removeEventListener("scroll", updateScrollState);
  }, []);

  useLayoutEffect(() => {
    const updateLayout = () => {
      const header = headerRef.current;
      const title = titleRef.current;
      if (!header || !title) return;

      if (!compact) {
        const styles = window.getComputedStyle(header);
        const padding = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
        const descWidth = descRef.current?.offsetWidth ?? 0;
        const tabsWidth = tabsRef.current?.offsetWidth ?? 0;
        const actionsWidth = actionsRef.current?.offsetWidth ?? 0;
        fullWidthRef.current = title.scrollWidth + descWidth + tabsWidth + actionsWidth + padding + 16;
      }
      setCompact(fullWidthRef.current > header.clientWidth);
    };

    updateLayout();
    const observer = new ResizeObserver(updateLayout);
    if (headerRef.current) observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, [compact, hasToken, props.mode, props.showSetBgBtn, props.topic]);

  return (
    <>
      <div
        ref={headerRef}
        className={`${styles.warp} ${props.backgroundImage ? styles.withBackground : ""} ${scrolled ? styles.scrolled : ""} ${compact ? styles.compact : ""}`}
        style={headerStyle}
      >
        <div className={styles.leftTitle}>
        <button
          ref={titleRef}
          type="button"
          className={`${styles.title} ${hasToken ? styles.titleClickable : ""}`}
          onClick={handleTopicClick}
          disabled={!hasToken}
          aria-label={hasToken ? `${props.topic}，返回上一页` : undefined}
        >
          {props.topic}
        </button>
        <button
          ref={descRef}
          className={`${styles.descBtn} ${props.descActive ? styles.descBtnActive : ""}`}
          onClick={() => props.onDescChange?.(!props.descActive)}
          aria-label="切换排序"
          title="切换排序"
          type="button"
        >
          <img className={styles.sortIcon} src={iconChannelSort} alt="" aria-hidden="true" />
        </button>
        </div>
      {props.mode && props.onModeChange && (
        <div ref={tabsRef} className={styles.tabs}>
          <div
            className={styles.tabSlider}
            style={{ transform: props.mode === "photo" ? "translateX(100%)" : "translateX(0)" }}
          />
          <div
            className={`${styles.tab} ${props.mode === "list" ? styles.tabActive : ""}`}
            onClick={() => props.onModeChange!("list")}
            aria-label="列表模式"
            title="列表模式"
          >
            <img className={styles.tabIcon} src={iconChannelList} alt="" aria-hidden="true" />
          </div>
          <div
            className={`${styles.tab} ${props.mode === "photo" ? styles.tabActive : ""}`}
            onClick={() => props.onModeChange!("photo")}
            aria-label="照片模式"
            title="照片模式"
          >
            <img className={styles.tabIcon} src={iconChannelThumbnails} alt="" aria-hidden="true" />
          </div>
        </div>
      )}
      <div ref={actionsRef} className={`${styles.actions} ${styles.desktopActions}`}>
        {props.showSetBgBtn && hasToken && (
          <button className={styles.actionButton} type="button" onClick={props.onSetBg}>
            背景图
          </button>
        )}
        {hasToken && (
          <button
            className={`${styles.actionButton} ${styles.actionButtonAccent}`}
            type="button"
            onClick={() => windowFunc.replace(`#/send?topic=${encodeURIComponent(props.topic)}`)}
          >
            发表
          </button>
        )}
      </div>
      <button className={styles.moreButton} type="button" onClick={() => setMoreVisible(true)} aria-label="更多选项">
        <EllipsisOutlined />
      </button>
      </div>
      <ActionSheet
        visible={moreVisible}
        cancelText="取消"
        actions={[
          ...(props.showSetBgBtn && hasToken ? [{ text: "设置背景图", key: "background" }] : []),
          ...(hasToken ? [{ text: "发表", key: "publish" }] : []),
          { text: props.descActive ? "切换正序" : "切换倒序", key: "desc" },
          ...(props.mode && props.onModeChange
            ? [{ text: props.mode === "list" ? "切换照片模式" : "切换列表模式", key: "mode" }]
            : []),
        ]}
        onClose={() => setMoreVisible(false)}
        onAction={(action) => {
          setMoreVisible(false);
          if (action.key === "background") props.onSetBg?.();
          if (action.key === "publish") windowFunc.replace(`#/send?topic=${encodeURIComponent(props.topic)}`);
          if (action.key === "desc") props.onDescChange?.(!props.descActive);
          if (action.key === "mode" && props.onModeChange && props.mode) {
            props.onModeChange(props.mode === "list" ? "photo" : "list");
          }
        }}
      />
    </>
  );
};

export default ChanelHeader;
