import useMain from "./useMain";
import UserCenterLogOut from "@/components/userCenter/LogOut";
import SettingsLinks from "@/components/userCenter/SettingsLinks";
import Topic from "../Topics";
import styles from "./index.module.less";

const UserCenter = () => {
  const { loginOut, ...restValue } = useMain();
  return (
    <div className={styles.page}>
      <Topic showBar={false} profile={restValue} />
      <SettingsLinks />
      <UserCenterLogOut isMeCenter={restValue.isMeCenter} loginOut={loginOut} />
    </div>
  );
};

export default UserCenter;
