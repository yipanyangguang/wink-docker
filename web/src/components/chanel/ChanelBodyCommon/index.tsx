/**
 * @description 话题频道的主体 - 通用类型
 */

import { Button, message } from "antd";
import { ImageViewer, InfiniteScroll, PullToRefresh } from "antd-mobile";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { deleteTopic, getWinkList, winkItem } from "@/APIS/wink";
import WinkItem from "@/components/WinkItem";
import FeedSkeleton from "@/components/FeedSkeleton";
import { thumbImage } from "@/utils/handleImage";

import styles from "./index.module.less";
import { ChanelBodyCommonProps } from "./interface";

const PAGE_SIZE = 15;

const ChanelBodyCommon = (props: ChanelBodyCommonProps) => {
  const [list, setList] = useState<winkItem[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const pageRef = useRef(1);
  const [visibleIndex, setVisibleIndex] = useState(1);
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);

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

  /** 初始化 IntersectionObserver，追踪当前可见的最靠上的 item */
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        // 找到所有在视口中可见的 item，取 index 最小的那个
        let minVisible = Infinity;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute("data-idx"));
            if (!isNaN(idx) && idx < minVisible) minVisible = idx;
          }
        });
        if (minVisible !== Infinity) {
          setVisibleIndex(minVisible + 1); // 1-based
        }
      },
      { root: null, rootMargin: "-40% 0px -55% 0px", threshold: 0 },
    );

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  /** 收集所有图片用于预览组 */
  const allImages = useMemo(() => {
    const imgs: string[] = [];
    list.forEach((item) => {
      if (item.images) {
        item.images.forEach((img) => imgs.push(img));
      }
    });
    return imgs;
  }, [list]);

  const fetchList = async (page: number, reset = false) => {
    const { data, total: t, msg } = await getWinkList({
      page,
      location: "",
      topic: props.topic,
      size: PAGE_SIZE,
      desc: props.descActive ? 1 : undefined,
    });

    if (page === 1 && data == null) {
      message.warning(msg);
      return;
    }

    const safeData = data ?? [];
    let nextList: winkItem[] = [];
    setList((prev) => {
      nextList = reset ? safeData : prev.concat(safeData);
      return nextList;
    });
    setTotal(t);
    setHasMore(nextList.length < t);
    setLoading(false);
  };

  /** mode 切换时重置 observer 和可见索引 */
  useEffect(() => {
    itemRefs.current.clear();
    setVisibleIndex(1);
  }, [props.mode]);

  useEffect(() => {
    pageRef.current = 1;
    setVisibleIndex(1);
    setLoading(true);
    fetchList(1, true);
  }, [props.topic, props.descActive]);

  /** 下拉刷新 */
  const onRefresh = async () => {
    pageRef.current = 1;
    await fetchList(1, true);
  };

  /** 加载更多 */
  const loadMore = async () => {
    pageRef.current += 1;
    await fetchList(pageRef.current);
  };

  return (
    <div className={styles.warp}>
      <div className={styles.content}>
        {loading ? (
          <FeedSkeleton count={4} />
        ) : (
          <>
            {list.length === 0 && total === 0 && !props.noAuth && (
              <Button
                className={styles.deleteBtn}
                onClick={async () => {
                  await deleteTopic(props.topic);
                  message.success("仅删除话题成功");
                }}
              >
                仅删除此话题
              </Button>
            )}

            {/* 帖子列表模式 */}
            {props.mode === "list" && (
              <PullToRefresh onRefresh={onRefresh}>
                <div className={styles.list}>
                  {list.map((item, idx) => (
                    <div
                      key={item._id}
                      data-idx={idx}
                      ref={(el) => setItemRef(idx, el)}
                    >
                      <WinkItem {...item} noAuth={props.noAuth} />
                    </div>
                  ))}
                </div>
                <InfiniteScroll loadMore={loadMore} hasMore={hasMore} threshold={0} />
              </PullToRefresh>
            )}

            {/* 照片墙模式 */}
            {props.mode === "photo" && (
              <>
                <div className={styles.photosWarp}>
                  {allImages.map((img, idx) => (
                    <div
                      key={idx}
                      data-idx={idx}
                      ref={(el) => setItemRef(idx, el)}
                      className={styles.photoItem}
                      style={{ backgroundImage: `url(${thumbImage(img)})` }}
                      onClick={() => {
                        ImageViewer.Multi.show({
                          images: allImages.map((i) => thumbImage(i, true)),
                          defaultIndex: idx,
                        });
                      }}
                    />
                  ))}
                </div>
                <InfiniteScroll loadMore={loadMore} hasMore={hasMore} threshold={0} />
              </>
            )}
          </>
        )}

        {/* 加载进度条 */}
        {total > 0 && (
          <div className={styles.progressWrap}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{
                  width: `${Math.min(
                    (visibleIndex /
                      (props.mode === "photo" ? allImages.length || 1 : total)) *
                      100,
                    100,
                  )}%`,
                }}
              />
            </div>
            <span className={styles.progressText}>
              {visibleIndex}/
              {props.mode === "photo" ? allImages.length : total}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChanelBodyCommon;
