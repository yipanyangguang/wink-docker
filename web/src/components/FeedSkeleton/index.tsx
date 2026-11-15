import { Skeleton } from "antd-mobile";
import styles from "./index.module.less";

interface FeedSkeletonProps {
  count?: number;
}

const FeedSkeleton = ({ count = 3 }: FeedSkeletonProps) => {
  return (
    <div className={styles.wrap}>
      {Array.from({ length: count }).map((_, i) => (
        <div className={styles.card} key={i}>
          <div className={styles.header}>
            <Skeleton
              animated
              style={{ "--width": "36px", "--height": "36px", "--border-radius": "50%" }}
            />
            <div className={styles.meta}>
              <Skeleton animated style={{ "--width": "120px", "--height": "14px", "--border-radius": "4px" }} />
              <Skeleton animated style={{ "--width": "80px", "--height": "12px", "--border-radius": "4px" }} />
            </div>
          </div>
          <div className={styles.body}>
            <Skeleton.Paragraph animated lineCount={3} />
          </div>
          {i % 2 === 0 && (
            <Skeleton
              animated
              style={{ "--width": "100%", "--height": "180px", "--border-radius": "8px" }}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default FeedSkeleton;
