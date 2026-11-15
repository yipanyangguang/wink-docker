import { DeleteOutlined, LeftOutlined } from "@ant-design/icons";
import { Image, Skeleton, Toast } from "antd-mobile";
import { useEffect, useState } from "react";

import {
  deleteWinkShareApi,
  getWinkShareListApi,
  WinkShareItem,
} from "@/APIS/wink";
import ActionSheet from "@/components/ActionSheet";
import { formatDateTimeWithWeekday, truncateString } from "@/utils";
import { thumbImage } from "@/utils/handleImage";
import windowFunc from "@/utils/windowFunc";

import styles from "./index.module.less";

const WinkShares = () => {
  const [items, setItems] = useState<WinkShareItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const response = await getWinkShareListApi();
      setItems(response.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      windowFunc.replace("#/login");
      return;
    }
    void load();
  }, []);

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    windowFunc.replace("#/center");
  };

  const remove = (item: WinkShareItem) => {
    ActionSheet.confirm({
      content: "删除后该分享链接将立即失效，确定删除吗？",
      confirmText: "删除",
      danger: true,
      onConfirm: async () => {
        const loadingToast = Toast.show({ content: "删除中…", icon: "loading", duration: 0 });
        try {
          const response = await deleteWinkShareApi(item.shareId);
          if (response.error) {
            Toast.show({ content: response.msg || "删除失败", icon: "fail" });
            return;
          }
          setItems((current) => current.filter((share) => share.shareId !== item.shareId));
          Toast.show({ content: "分享已删除", icon: "success" });
        } finally {
          loadingToast.close();
        }
      },
    });
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button type="button" className={styles.backButton} onClick={handleBack} aria-label="返回">
          <LeftOutlined />
        </button>
        <h1>管理分享</h1>
        <span className={styles.headerSpace} />
      </header>

      {loading ? (
        <div className={styles.loading}>
          <Skeleton.Title animated />
          <Skeleton.Paragraph animated lineCount={4} />
          <Skeleton.Title animated />
          <Skeleton.Paragraph animated lineCount={4} />
        </div>
      ) : items.length > 0 ? (
        <section className={styles.list}>
          {items.map((item) => (
            <article
              className={styles.card}
              key={item.shareId}
              onClick={() => windowFunc.open(`#/wink?shareId=${encodeURIComponent(item.shareId)}`)}
            >
              {item.image ? (
                <Image className={styles.thumb} src={thumbImage(item.image)} fit="cover" lazy />
              ) : (
                <div className={styles.noImage}>瞬间</div>
              )}
              <div className={styles.cardBody}>
                <p className={styles.preview}>{truncateString(item.contentPreview || "无文字内容", 56)}</p>
                <p className={styles.date}>创建于 {formatDateTimeWithWeekday(item.createdAt)}</p>
                <p className={styles.expire}>有效期至 {formatDateTimeWithWeekday(item.expiresAt)}</p>
              </div>
              <button
                type="button"
                className={styles.deleteButton}
                aria-label="删除分享"
                onClick={(event) => {
                  event.stopPropagation();
                  remove(item);
                }}
              >
                <DeleteOutlined />
              </button>
            </article>
          ))}
        </section>
      ) : (
        <div className={styles.empty}>还没有创建过分享</div>
      )}
    </main>
  );
};

export default WinkShares;
