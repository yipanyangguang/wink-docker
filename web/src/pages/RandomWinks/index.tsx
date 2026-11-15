import { LeftOutlined, ReloadOutlined } from "@ant-design/icons";
import { Swiper } from "antd-mobile";
import { useCallback, useEffect, useRef, useState } from "react";

import { getRandomWinkList, winkItem } from "@/APIS/wink";
import WinkItem from "@/components/WinkItem";
import windowFunc from "@/utils/windowFunc";

import styles from "./index.module.less";

const RANDOM_SIZE = 10;

const RandomWinks = () => {
  const [items, setItems] = useState<winkItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const swiperRef = useRef<React.ElementRef<typeof Swiper>>(null);
  const requestIdRef = useRef(0);

  const loadRandomWinks = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(false);

    try {
      const response = await getRandomWinkList();
      if (requestId !== requestIdRef.current) return;

      setItems((response.data || []).slice(0, RANDOM_SIZE));
      setCurrentIndex(0);
      requestAnimationFrame(() => swiperRef.current?.swipeTo(0));
    } catch {
      if (requestId === requestIdRef.current) setError(true);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      windowFunc.replace("#/login");
      return;
    }
    void loadRandomWinks();
  }, [loadRandomWinks]);

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    windowFunc.replace("#/");
  };

  const total = items.length;
  const showSkeleton = loading && total === 0;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.iconButton}
          onClick={handleBack}
          aria-label="返回"
          title="返回"
        >
          <LeftOutlined />
        </button>
        <span className={styles.counter} aria-live="polite">
          {total > 0 ? `${currentIndex + 1} / ${total}` : "随机瞬间"}
        </span>
        <button
          type="button"
          className={`${styles.iconButton} ${loading ? styles.loadingButton : ""}`}
          onClick={() => void loadRandomWinks()}
          disabled={loading}
          aria-label="刷新随机瞬间"
          title="刷新随机瞬间"
        >
          <ReloadOutlined />
        </button>
      </header>

      <section className={styles.content} aria-label="随机瞬间浏览">
        {showSkeleton && <RandomSkeleton />}

        {!loading && total === 0 && (
          <div className={styles.emptyState}>
            <p>{error ? "获取失败，请重试" : "暂时没有可浏览的瞬间"}</p>
            <button type="button" onClick={() => void loadRandomWinks()}>
              重新获取
            </button>
          </div>
        )}

        {total > 0 && (
          <Swiper
            ref={swiperRef}
            className={styles.swiper}
            defaultIndex={0}
            slideSize={80}
            trackOffset={10}
            stuckAtBoundary
            loop={false}
            rubberband
            onIndexChange={setCurrentIndex}
            indicator={() => null}
          >
            {items.map((item) => (
              <Swiper.Item key={item._id}>
                <div className={styles.cardViewport}>
                  <WinkItem {...item} hideActions className={styles.winkCard} />
                </div>
              </Swiper.Item>
            ))}
          </Swiper>
        )}
      </section>
    </main>
  );
};

const RandomSkeleton = () => (
  <div className={styles.skeletonCard} aria-label="正在加载随机瞬间" aria-busy="true">
    <div className={styles.skeletonHeader}>
      <span className={`${styles.skeletonBlock} ${styles.skeletonAvatar}`} />
      <div className={styles.skeletonMeta}>
        <span className={`${styles.skeletonBlock} ${styles.skeletonName}`} />
        <span className={`${styles.skeletonBlock} ${styles.skeletonTime}`} />
      </div>
    </div>
    <span className={`${styles.skeletonBlock} ${styles.skeletonLine} ${styles.skeletonLineLong}`} />
    <span className={`${styles.skeletonBlock} ${styles.skeletonLine} ${styles.skeletonLineMedium}`} />
    <span className={`${styles.skeletonBlock} ${styles.skeletonLine} ${styles.skeletonLineShort}`} />
  </div>
);

export default RandomWinks;
