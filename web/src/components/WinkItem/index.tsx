import { EllipsisOutlined } from "@ant-design/icons";
import { Dialog, Image, ImageViewer, Toast } from "antd-mobile";
import { Fragment, useState } from "react";

import { createWinkShareApi, winkDelete, winkItem } from "@/APIS/wink";
import iconLocation from "@/icons/location.svg";
import { formatDateTimeWithWeekday, truncateString } from "@/utils";
import handleImage, { thumbImage } from "@/utils/handleImage";
import windowFunc from "@/utils/windowFunc";
import { getRouteLocation } from "@/utils/routes";
import ActionSheet from "@/components/ActionSheet";
import { buildWinkShareUrl, copyText } from "@/utils/winkShare";

import styles from "./index.module.less";

interface IWinkItem extends winkItem {
  noAuth?: boolean;
  hideActions?: boolean;
  className?: string;
}

const WinkItem = (props: IWinkItem) => {
  const {
    time,
    content,
    images,
    topics,
    location,
    _id,
    video,
    avatar,
    userName,
    latestComment,
    commentCount,
    keyword,
    noAuth,
    hideActions,
    className,
  } = props;

  const [deleted, setDelete] = useState<boolean>(false);
  const hasTopics = Boolean(topics?.some((item) => item.trim()));
  const hasContent = Boolean(content?.trim());
  const hasImages = Boolean(images?.length);
  const hasVideo = Boolean(video?.path);
  const hasLocation = Boolean(location?.trim());

  /** 删除帖子 */
  const handleWinkDelete = async (winkId: string) => {
    const { error } = await winkDelete(winkId);
    if (!error) {
      Toast.show("删除成功");
      setDelete(true);
    }
  };

  const handleWinkShare = async () => {
    const loading = Toast.show({ content: "生成分享链接…", icon: "loading", duration: 0 });
    try {
      const result = await createWinkShareApi(_id);
      if (result.error || !result.data?.shareId) {
        loading.close();
        Toast.show({ content: result.msg || "分享失败", icon: "fail" });
        return;
      }
      const shareUrl = buildWinkShareUrl(result.data.shareId);
      const isIOS =
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      const copied = isIOS ? false : await copyText(shareUrl);
      loading.close();
      if (copied) {
        Toast.show({ content: "分享链接已复制", icon: "success" });
      } else {
        window.setTimeout(() => {
          const dialog = Dialog.show({
            title: "分享链接",
            content: (
              <div className={styles.shareDialogContent}>
                <p>请长按下面的链接，选择“拷贝”</p>
                <textarea
                  className={styles.shareDialogUrl}
                  value={shareUrl}
                  readOnly
                  onClick={(event) => event.currentTarget.select()}
                  onFocus={(event) => event.currentTarget.select()}
                  aria-label="分享链接"
                />
              </div>
            ),
            actions: [
              {
                key: "close",
                text: "我知道了",
                onClick: () => dialog.close(),
              },
              {
                key: "manage",
                text: "分享管理",
                onClick: () => {
                  dialog.close();
                  windowFunc.open("#/wink-shares");
                },
              },
            ],
          });
        }, 260);
      }
    } catch {
      loading.close();
      Toast.show({ content: "分享失败，请稍后重试", icon: "fail" });
    }
  };

  const goToDetail = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (noAuth) return;

    // 图片、话题、地点、个人信息和其他已有交互的控件保留各自的行为，
    // 其余文字及卡片空白区域均可进入帖子详情。
    const target = e.target as HTMLElement;
    if (
      target.closest(
        '[data-detail-ignore], a, button, img, video, input, textarea, select'
      )
    ) {
      return;
    }

    if (getRouteLocation().path === "/wink") {
      return;
    }
    windowFunc.open("#/wink?winkId=" + encodeURIComponent(_id));
  };

  const handleContent = (content: string) => {
    const urlRegex = /https?:\/\/[^\s]+/g;
    const escapeRegExp = (text: string) =>
      text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const processKeyword = (text: string) => {
      if (!keyword) return text;
      const reg = new RegExp(escapeRegExp(keyword), "g");
      const result: React.ReactNode[] = [];
      let lastIndex = 0;
      text.replace(reg, (match, offset: number) => {
        result.push(text.slice(lastIndex, offset));
        result.push(
          <span key={offset} className={styles.keyword}>{match}</span>
        );
        lastIndex = offset + match.length;
        return match;
      });
      result.push(text.slice(lastIndex));
      return result;
    };

    const parts = content.split(urlRegex);
    const urls = content.match(urlRegex) || [];

    return parts.map((part, index) => {
      let link: React.ReactNode = null;
      if (urls[index]) {
        try {
          const url = urls[index];
          const domain = new URL(url).hostname;
          link = (
            <a href={url} target="_blank" rel="noopener noreferrer" className={styles.urlLink}>
              {domain}
            </a>
          );
        } catch {
          link = processKeyword(urls[index]);
        }
      }
      return <Fragment key={index}>{processKeyword(part)}{link}</Fragment>;
    });
  };

  return (
    <div
      className={`${styles.winkWarp} ${className ?? ""}`}
      style={{ display: deleted ? "none" : "block" }}
      onClick={goToDetail}
    >
      <div className={styles.header}>
        <img src={avatar ? thumbImage(avatar) : "/icons/icon-192.png"} alt="" />
        <div className={styles.info} data-detail-ignore="true">
          <p className={styles.name}>{userName}</p>
          <p className={styles.time}>{formatDateTimeWithWeekday(time * 1000)}</p>
        </div>
        {!noAuth && !hideActions && <button
          type="button"
          className={styles.delete}
          aria-label="更多操作"
          onClick={(e) => {
            e.stopPropagation();
            ActionSheet.show({
              actions: [
                {
                  text: "分享",
                  key: "share",
                  onClick: handleWinkShare,
                },
                {
                  text: "编辑",
                  key: "edit",
                  onClick: () => {
                    const topicQuery = topics?.[0]
                      ? `&topic=${encodeURIComponent(topics[0])}`
                      : "";
                    windowFunc.replace(
                      `#/send?editWinkId=${encodeURIComponent(_id)}${topicQuery}`
                    );
                  },
                },
                {
                  text: "删除",
                  key: "delete",
                  danger: true,
                  onClick: async () => {
                    const confirmed = await ActionSheet.confirm({
                      content: "确认删除这条帖子吗？删除后不可恢复。",
                      confirmText: "删除",
                      cancelText: "取消",
                      danger: true,
                    });
                    if (confirmed) await handleWinkDelete(_id);
                  },
                },
              ],
              cancelText: "取消",
              closeOnAction: true,
            });
          }}
        >
          <EllipsisOutlined />
        </button>}
        
      </div>
      {(hasTopics || hasContent || hasImages || hasVideo || hasLocation) && (
        <div className={styles.body}>
          {hasTopics && (
            <div className={styles.topics}>
              {topics?.filter((item) => item.trim()).map((item) => (
                <span
                  key={item}
                  className={styles.topic}
                  data-detail-ignore="true"
                  onClick={() => {
                    if (getRouteLocation().path === "/channel") {
                      windowFunc.replace("#/channel?topic=" + encodeURIComponent(item));
                      return;
                    }
                    // 否则就打开新页面
                    windowFunc.open("#/channel?topic=" + encodeURIComponent(item));
                  }}
                >
                  #{item}#
                </span>
              ))}
            </div>
          )}
          {hasContent && (
            <div className={styles.content}>
              {handleContent(content)}
            </div>
          )}
          {hasImages && <div className={styles.images}>
        {images &&
          images.length > 1 &&
          images.map((item, index) => {
            return (
              (index < 8 || images.length === 9) && (
                <Image
                  key={item}
                  lazy
                  src={thumbImage(item)}
                  className={styles.img}
                  fit="cover"
                  onClick={() => {
                    ImageViewer.Multi.show({
                      images: images.map((item) => handleImage(item)),
                      defaultIndex: index,
                    });
                  }}
                />
              )
            );
          })}

        {images.length > 9 && (
          <div
            className={styles.imgMoreBox}
            data-detail-ignore="true"
            onClick={() => {
              ImageViewer.Multi.show({
                images: images.map((item) => handleImage(item)),
                defaultIndex: 8,
              });
            }}
          >
            <Image
              lazy
              src={thumbImage(images[8])}
              className={styles.imgMore}
              fit="cover"
            />
            <p>+{images.length - 9}</p>
          </div>
        )}

        {images.length === 1 && (
          <img
            className={styles.signImg}
            src={thumbImage(images[0], true)}
            onClick={() =>
              ImageViewer.show({
                image: handleImage(images[0]),
              })
            }
          />
        )}
          </div>}

          {hasVideo && (
        <video
          data-detail-ignore="true"
          src={`/static/${video.path}`}
          controls
          style={{
            maxWidth: "100%",
            maxHeight: "300px",
          }}
          preload="metadata"
          poster={thumbImage(
            video.cover ??
              "2023-5-22-23-4-22~88f428c08eb06a9ee3c8e4404927e7dc.jpeg"
          )}
        />
          )}

          {hasLocation && (
        <div className={styles.location} data-detail-ignore="true">
          <img src={iconLocation} alt="地点" />
          <span>{handleContent(location)}</span>
        </div>
          )}
        </div>
      )}

      {latestComment && (
        <div className={styles.latestComment}>
          <div className={styles.commentHeader}>
            <span>最新评论 · 共{commentCount}条</span>
            <span className={styles.viewComments}>查看全部 ›</span>
          </div>
          <p className={styles.userInfo}>
            {latestComment.userName} ·{" "}
            {formatDateTimeWithWeekday(latestComment.time)}
          </p>
          {latestComment.content?.trim() && (
            <p className={styles.content}>
              {truncateString(latestComment.content, 100)}
            </p>
          )}
          {latestComment.image && (
            <img
              onClick={(e) => {
                e.stopPropagation();
                ImageViewer.show({
                  image: handleImage(latestComment.image as string),
                });
              }}
              src={thumbImage(latestComment.image)}
              alt="评论图片"
            />
          )}
        </div>
      )}
    </div>
  );
};

export default WinkItem;
