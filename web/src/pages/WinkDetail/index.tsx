import { ImageViewer, List, Popover, Toast } from "antd-mobile";
import { Action } from "antd-mobile/es/components/popover";
import { useEffect, useState } from "react";

import {
  commentApi,
  deleteCommentApi,
  getCommentListApi,
  getWinkDetailApi,
  getWinkShareDetailApi,
  ICommentItem,
  winkItem,
} from "@/APIS/wink";
import WinkItem from "@/components/WinkItem";
import handleImage, { thumbImage } from "@/utils/handleImage";
import { formatDateTimeWithWeekday } from "@/utils";

import styles from "./index.module.less";
import InputBar from "./inputBar";
import { getRouteSearchParams } from "@/utils/routes";
import ActionSheet from "@/components/ActionSheet";

const WinkDetailApp = () => {
  const [winkId, setWinkId] = useState(() => getRouteSearchParams().get("winkId") || "");
  const [shareId, setShareId] = useState(() => getRouteSearchParams().get("shareId") || "");
  const [winkDetail, setWinkDetail] = useState<winkItem>();
  const [commentList, setCommentList] = useState<ICommentItem[]>([]);
  const [detailLoading, setDetailLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(
    () => !getRouteSearchParams().get("shareId")
  );
  const [detailError, setDetailError] = useState("");

  useEffect(() => {
    if (!shareId) {
      document.title = "详情";
      return;
    }

    const topic = winkDetail?.topics
      ?.map((item) => item.trim())
      .filter(Boolean)
      .join("、");
    const content = winkDetail?.content?.replace(/\s+/g, " ").trim();
    const titleParts = [topic, content].filter(Boolean) as string[];
    document.title = titleParts.length > 0
      ? titleParts.join(" · ").slice(0, 80)
      : "分享一个帖子给你";

    return () => {
      document.title = "详情";
    };
  }, [shareId, winkDetail]);

  const getWinkDetail = async (winkId: string) => {
    try {
      const detail = await getWinkDetailApi(winkId);
      setWinkDetail(detail.data);
      setDetailError(detail.error ? detail.msg || "帖子加载失败，请返回重试" : "");
    } finally {
      setDetailLoading(false);
    }
  };

  const getSharedWinkDetail = async (shareId: string) => {
    try {
      const detail = await getWinkShareDetailApi(shareId);
      setWinkDetail(detail.data);
      setDetailError(detail.error ? detail.msg || "分享已过期或已被删除" : "");
    } catch {
      setDetailError("分享已过期或已被删除");
    } finally {
      setDetailLoading(false);
    }
  };

  const getCommentList = async (winkId: string) => {
    try {
      const list = await getCommentListApi(winkId);
      setCommentList(list.data || []);
    } finally {
      setCommentsLoading(false);
    }
  };

  useEffect(() => {
    const routeWinkId = getRouteSearchParams().get("winkId") || "";
    const routeShareId = getRouteSearchParams().get("shareId") || "";
    setWinkId(routeWinkId);
    setShareId(routeShareId);
  }, []);

  useEffect(() => {
    if (!winkId && !shareId) {
      setDetailLoading(false);
      setCommentsLoading(false);
      return;
    }

    setDetailLoading(true);
    setDetailError("");
    if (shareId) {
      setCommentsLoading(false);
      setCommentList([]);
      void getSharedWinkDetail(shareId).catch(() => undefined);
      return;
    }
    setCommentsLoading(true);
    void getWinkDetail(winkId).catch(() => undefined);
    void getCommentList(winkId).catch(() => undefined);
  }, [shareId, winkId]);

  const actions: Action[] = [{ key: "delete", text: "删除" }];

  /** \n 转 br */
  const handleContent = (content?: string) => {
    if (!content) return "";
    return content.replace(/\n/g, "<br>");
  };

  return (
    <div className={styles.winkDetail}>
      <div className={styles.winkItemBox}>
        {detailLoading ? (
          <DetailSkeleton />
        ) : winkDetail ? (
          <WinkItem {...winkDetail} hideActions={Boolean(shareId)} />
        ) : (
          <div className={styles.detailError}>{detailError || "帖子加载失败，请返回重试"}</div>
        )}
      </div>

      {shareId && winkDetail?.shareExpiresAt && (
        <div className={styles.shareExpireHint}>
          此分享将在 {formatDateTimeWithWeekday(winkDetail.shareExpiresAt)} 前有效
        </div>
      )}

      {commentsLoading ? (
        <CommentSkeleton />
      ) : commentList.length > 0 ? (
        <div className={styles.commentBox}>
          <List header="评论列表">
            {commentList.map((item) => {
              return (
                <List.Item key={item._id}>
                <div className={styles.header}>
                  <img src={thumbImage(item.avatar)} alt="" />
                  <div className={styles.info}>
                    <p className={styles.name}>{item.userName}</p>
                    <p className={styles.time}>
                      {formatDateTimeWithWeekday(item.time)}
                    </p>
                  </div>
                  <span
                    className={styles.delete}
                    onClick={() => {
                      ActionSheet.show({
                        actions: [
                          {
                            text: "删除",
                            key: "delete",
                            danger: true,
                            onClick: async () => {
                              const loading = Toast.show({
                                icon: "loading",
                                content: "加载中…",
                                duration: 0,
                              });
                              await deleteCommentApi(item._id);
                              loading.close();
                              Toast.show({
                                icon: "success",
                                content: "删除成功",
                              });
                              window.location.reload();
                            },
                          },
                        ],
                        cancelText: "取消",
                        closeOnAction: true,
                      });
                    }}
                  >
                    删除
                  </span>
                </div>

                <p
                  className={styles.content}
                  dangerouslySetInnerHTML={{
                    __html: handleContent(item.content),
                  }}
                ></p>
                {item.image && (
                  <img
                    onClick={() => {
                      ImageViewer.show({
                        image: handleImage(item.image as string),
                      });
                    }}
                    height={100}
                    src={handleImage(item.image)}
                    alt=""
                  />
                )}
                </List.Item>
              );
            })}
          </List>
        </div>
      ) : null}

      {!shareId && <InputBar
        onSend={async (content, image) => {
          const loading = Toast.show({
            icon: "loading",
            content: "加载中…",
            duration: 0,
          });

          // image 是 /static/xxx.jpg 的形式,只要 xxx.jpg

          await commentApi(winkId, content, image.replace("/static/", ""));
          loading.close();
          Toast.show({
            icon: "success",
            content: "评论成功",
          });
          window.location.reload();
        }}
      />}
    </div>
  );
};

const DetailSkeleton = () => (
  <div className={styles.detailSkeleton} aria-hidden="true">
    <div className={styles.skeletonHeader}>
      <span className={`${styles.skeletonBlock} ${styles.skeletonAvatar}`} />
      <div className={styles.skeletonMeta}>
        <span className={`${styles.skeletonBlock} ${styles.skeletonName}`} />
        <span className={`${styles.skeletonBlock} ${styles.skeletonTime}`} />
      </div>
      <span className={`${styles.skeletonBlock} ${styles.skeletonAction}`} />
    </div>
    <div className={styles.skeletonBody}>
      <span className={`${styles.skeletonBlock} ${styles.skeletonLine} ${styles.skeletonLineLong}`} />
      <span className={`${styles.skeletonBlock} ${styles.skeletonLine} ${styles.skeletonLineMedium}`} />
      <span className={`${styles.skeletonBlock} ${styles.skeletonLine} ${styles.skeletonLineShort}`} />
    </div>
  </div>
);

const CommentSkeleton = () => (
  <div className={styles.commentSkeleton} aria-hidden="true">
    <span className={`${styles.skeletonBlock} ${styles.commentSkeletonTitle}`} />
    {Array.from({ length: 2 }).map((_, index) => (
      <div className={styles.commentSkeletonItem} key={index}>
        <span className={`${styles.skeletonBlock} ${styles.commentSkeletonAvatar}`} />
        <div className={styles.commentSkeletonContent}>
          <span className={`${styles.skeletonBlock} ${styles.commentSkeletonName}`} />
          <span className={`${styles.skeletonBlock} ${styles.commentSkeletonText}`} />
          <span className={`${styles.skeletonBlock} ${styles.commentSkeletonTextShort}`} />
        </div>
      </div>
    ))}
  </div>
);

export default WinkDetailApp;
