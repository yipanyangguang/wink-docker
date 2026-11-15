import { LogOutProps } from "./interface";
import styles from "./index.module.less";
import windowFunc from "@/utils/windowFunc";
import ActionSheet from "@/components/ActionSheet";

const UserCenterLogOut = (props: LogOutProps) => {
  const { isMeCenter, loginOut } = props;

  return (
    <div className={styles.warp}>
      {isMeCenter ? (
        <button
          className={styles.logoutBtn}
          onClick={() =>
            ActionSheet.confirm({
              content: "确定退出登录？",
              confirmText: "退出登录",
              danger: true,
              onConfirm: loginOut,
            })
          }
        >
          退出登录
        </button>
      ) : (
        <button
          className={styles.selfBtn}
          onClick={() => windowFunc.replace("#/center")}
        >
          去自己的个人中心
        </button>
      )}
    </div>
  );
};

export default UserCenterLogOut;
