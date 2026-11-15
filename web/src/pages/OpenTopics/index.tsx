import { useEffect, useState } from "react";

import { getOpenTopics } from "@/APIS/wink";
import windowFunc from "@/utils/windowFunc";

import styles from "./index.module.less";

const animationClasses = [
  styles.top,
  styles.bottom,
  styles.left,
  styles.right,
  styles.topLeft,
  styles.topRight,
  styles.bottomLeft,
  styles.bottomRight,
];

const OpenTopics = () => {
  const [topics, setTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getOpenTopics()
      .then((res) => setTopics(res.data?.info ?? []))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className={styles.page}>
      <p className={styles.title}># 话题广场</p>
      <div className={styles.cloud}>
        {loading && <span className={styles.tip}>加载中…</span>}
        {!loading && failed && <span className={styles.tip}>加载失败</span>}
        {!loading && !failed && topics.length === 0 && (
          <span className={styles.tip}>暂无话题</span>
        )}
        {topics.map((topic, index) => {
          const size = 14 + ((index * 7) % 17);
          return (
            <button
              key={topic}
              type="button"
              className={`${styles.item} ${animationClasses[index % animationClasses.length]}`}
              style={{
                fontSize: `${size}px`,
                opacity: 0.55 + ((size - 14) / 16) * 0.45,
                animationDelay: `${(index % 5) * 0.08}s`,
              }}
              onClick={() => windowFunc.open(`#/channel?topic=${encodeURIComponent(topic)}`)}
            >
              # {topic}
            </button>
          );
        })}
      </div>
    </main>
  );
};

export default OpenTopics;
