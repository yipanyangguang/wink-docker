import { InfiniteScroll, Input, PullToRefresh } from "antd-mobile";
import { useCallback, useEffect, useRef, useState } from "react";
import { SearchOutline } from "antd-mobile-icons";

import { searchWinkList, winkItem } from "@/APIS/wink";
import WinkItem from "@/components/WinkItem";
import FeedSkeleton from "@/components/FeedSkeleton";

import styles from "./index.module.less";

const SEARCH_KEYWORD_STORAGE_KEY = "family-node-search-keyword";

const Search: React.FC = () => {
  const [list, setList] = useState<winkItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [keyWord, setKeyWord] = useState<string>(
    () => sessionStorage.getItem(SEARCH_KEYWORD_STORAGE_KEY) || ""
  );
  const [focused, setFocused] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [failedPage, setFailedPage] = useState<number | null>(null);
  const requestIdRef = useRef(0);

  // progressWrap
  const [visibleIndex, setVisibleIndex] = useState(1);
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);

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

  const getNewData = async (page: number) => {
    if (!keyWord.trim()) return;
    const requestId = ++requestIdRef.current;
    if (page === 1) {
      setSearching(true);
      setHasMore(false);
    }
    setSearchError("");
    setFailedPage(null);
    try {
      const result = await searchWinkList({
        page,
        size: 10,
        keyword: keyWord,
      });
      if (requestId !== requestIdRef.current) return;
      if (result.error) throw new Error(result.msg || "搜索失败，请稍后重试");

      const nextData = result.data || [];
      const nextTotal = result.total || 0;
      setList((current) => (page === 1 ? nextData : current.concat(nextData)));
      setTotal(nextTotal);
      setPage(page);
      setHasMore(page * 10 < nextTotal);
    } catch {
      if (requestId !== requestIdRef.current) return;
      if (page === 1) {
        setList([]);
        setTotal(0);
      }
      setHasMore(false);
      setFailedPage(page);
      setSearchError(page === 1 ? "搜索失败，请稍后重试" : "加载失败，请重试");
    } finally {
      if (requestId === requestIdRef.current) {
        setSearching(false);
        setSearched(true);
      }
    }
  };

  /** 下拉刷新 */
  const onRefresh = async () => {
    await getNewData(1);
  };

  /** 加载更多 */
  const loadMore = async () => {
    await getNewData(page + 1);
  };

  useEffect(() => {
    sessionStorage.setItem(SEARCH_KEYWORD_STORAGE_KEY, keyWord);
    setPage(1);
    setList([]);
    setTotal(0);
    setHasMore(false);
    setSearched(false);
    setSearchError("");
    setFailedPage(null);
    setVisibleIndex(1);
  }, [keyWord]);

  useEffect(() => {
    if (keyWord.trim()) void getNewData(1);
    return () => { requestIdRef.current += 1; };
  }, []);

  return (
    <div className={styles.app}>
      <div
        className={`${styles.inputWrap} ${
          focused ? styles.inputWrapFocused : ""
        }`}
      >
        <div className={styles.searchBar}>
          <SearchOutline className={styles.searchIcon} />
          <Input
            className={styles.searchInput}
            placeholder="搜索内容..."
            value={keyWord}
            onChange={(val) => {
              requestIdRef.current += 1;
              setSearching(false);
              setKeyWord(val);
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                void onRefresh();
              }
            }}
            clearable
          />
          {keyWord.trim() && (
            <button type="button" className={styles.searchBtn} onClick={onRefresh}>
              搜索
            </button>
          )}
        </div>
      </div>
      <PullToRefresh
        onRefresh={async () => {
          await onRefresh();
        }}
      >
        {searching ? (
          <FeedSkeleton count={3} />
        ) : (
          list.map((item, idx) => (
            <div
              key={item._id}
              data-idx={idx}
              ref={(el) => setItemRef(idx, el)}
            >
              <WinkItem keyword={keyWord} {...item} />
            </div>
          ))
        )}
        <InfiniteScroll loadMore={loadMore} hasMore={hasMore} threshold={0}>
          {searchError && (
            <div className={styles.errorState} role="alert">
              <span>{searchError}</span>
              <button type="button" onClick={() => void getNewData(failedPage || 1)}>重试</button>
            </div>
          )}
          {!searchError && keyWord.trim() &&
            list.length === 0 &&
            searched &&
            !searching &&
            `未找到与“${keyWord}”相关的瞬间`}
          {!searchError && !keyWord.trim() && list.length === 0 && `请输入关键词搜索`}
          {!searchError && keyWord.trim() && list.length > 0 && hasMore && `上划加载更多数据`}
          {!searchError && keyWord.trim() && list.length > 0 && !hasMore && `没有更多数据啦`}
        </InfiniteScroll>
      </PullToRefresh>

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
};

export default Search;
