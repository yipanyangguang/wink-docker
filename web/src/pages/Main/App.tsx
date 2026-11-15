import { InfiniteScroll, PullToRefresh } from "antd-mobile";
import { useCallback, useEffect, useRef, useState } from "react";

import { getWinkList, winkItem } from "@/APIS/wink";
import FeedSkeleton from "@/components/FeedSkeleton";
import WinkItem from "@/components/WinkItem";
import {
  AUTH_CHANGED_EVENT,
  HOME_TAB_REFRESH_EVENT,
  HOME_TAB_RESELECT_EVENT,
} from "@/utils/navigation";
import windowFunc from "@/utils/windowFunc";
import styles from "./index.module.less";

function App() {
  const PAGE_SIZE = 10;
  const [list, setList] = useState<winkItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [visibleIndex, setVisibleIndex] = useState(1);
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const homeTabScrollPositionRef = useRef<number | null>(null);

  useEffect(() => {
    const handleHomeTabReselect = () => {
      if (window.scrollY > 0) {
        homeTabScrollPositionRef.current = window.scrollY;
        window.scrollTo({ top: 0, behavior: "auto" });
        return;
      }

      if (homeTabScrollPositionRef.current !== null) {
        window.scrollTo({
          top: homeTabScrollPositionRef.current,
          behavior: "auto",
        });
      }
    };

    window.addEventListener(HOME_TAB_RESELECT_EVENT, handleHomeTabReselect);
    return () => {
      window.removeEventListener(HOME_TAB_RESELECT_EVENT, handleHomeTabReselect);
    };
  }, []);

  useEffect(() => {
    const handleHomeRefresh = () => {
      setLoading(true);
      void init(1);
    };
    window.addEventListener(HOME_TAB_REFRESH_EVENT, handleHomeRefresh);
    return () => window.removeEventListener(HOME_TAB_REFRESH_EVENT, handleHomeRefresh);
  }, []);

  /** 注册 item DOM 节点 */
  const setItemRef = useCallback((index: number, el: HTMLDivElement | null) => {
    if (el) {
      itemRefs.current.set(index, el);
      observerRef.current?.observe(el);
    } else {
      const old = itemRefs.current.get(index);
      if (old) observerRef.current?.unobserve(old);
      itemRefs.current.delete(index);
    }
  }, []);

  /** 初始化 IntersectionObserver */
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        let minVisible = Infinity;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute("data-idx"));
            if (!isNaN(idx) && idx < minVisible) minVisible = idx;
          }
        });
        if (minVisible !== Infinity) {
          setVisibleIndex(minVisible + 1);
        }
      },
      { root: null, rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  const init = async (initialPage = 1) => {
    const { data, total: t } = await getWinkList({
      page: initialPage,
      location: "",
      topic: "",
      size: PAGE_SIZE,
    });
    if (data) {
      setList(data);
      setHasMore(data.length < t);
    }
    setTotal(t);
    setPage(initialPage);
    setLoading(false);
  };

  useEffect(() => {
    const loadHome = () => {
      if (!localStorage.getItem("token")) return;

      setLoading(true);
      void init(1);
    };

    loadHome();
    window.addEventListener(AUTH_CHANGED_EVENT, loadHome);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, loadHome);
  }, []);

  const getNewData = async (page: number) => {
    return new Promise(async (resolve) => {
      const { data, total: t } = await getWinkList({
        page,
        location: "",
        topic: "",
        size: PAGE_SIZE,
      });
      if (data)
        setList((current) => (page === 1 ? data : current.concat(data)));
      setTotal(t);
      setPage(page);
      setHasMore(page * PAGE_SIZE < t);
      resolve(true);
    });
  };

  /** 下拉刷新 */
  const onRefresh = async () => {
    homeTabScrollPositionRef.current = null;
    await getNewData(1);
  };

  /** 加载更多 */
  const loadMore = async () => {
    await getNewData(page + 1);
  };

  return (
    <div className={styles.app}>
      <PullToRefresh
        onRefresh={async () => {
          await onRefresh();
        }}
      >
        <button
          type="button"
          className={styles.randomTip}
          onClick={() => windowFunc.open("#/random-winks")}
        >
          <span className={styles.randomTipText}>
            <strong>随机发现瞬间</strong>
            <small>从所有内容中挑选 10 条，左右滑动浏览</small>
          </span>
          <span className={styles.randomTipAction}>去看看</span>
        </button>
        {loading ? (
          <FeedSkeleton count={4} />
        ) : list.length > 0 ? (
          <div className={styles.list}>
            {list.map((item, idx) => (
              <div
                key={item._id}
                data-idx={idx}
                ref={(el) => setItemRef(idx, el)}
              >
                <WinkItem {...item} />
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.noData}>木有数据啊</div>
        )}
        <InfiniteScroll loadMore={loadMore} hasMore={hasMore} threshold={0} />
      </PullToRefresh>

      {/* 加载进度条 */}
      {total > 0 && (
        <div className={styles.progressWrap}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{
                width: `${Math.min((visibleIndex / total) * 100, 100)}%`,
              }}
            />
          </div>
          <span className={styles.progressText}>
            {visibleIndex}/{total}
          </span>
        </div>
      )}
    </div>
  );
}

export default App;
