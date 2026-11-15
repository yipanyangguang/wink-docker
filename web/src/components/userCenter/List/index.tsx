/**
 * @description 个人中心用列表组件
 */
import iconTopic from "@/icons/topic.svg";
import styles from "./index.module.less";
import windowFunc from "@/utils/windowFunc";

const UserCenterList = () => (
  <div className={styles.list}>
    <div
      className={styles.item}
      onClick={() => windowFunc.replace("#/topics")}
    >
      <img src={iconTopic} alt="所有话题" />
      所有话题
    </div>
  </div>
);

export default UserCenterList;
