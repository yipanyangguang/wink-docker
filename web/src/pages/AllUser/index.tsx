import { useEffect, useState } from "react";
import styles from "./index.module.less";
import { getAllUserInfo, userInfo } from "@/APIS/user";
import { thumbImage } from "@/utils/handleImage";
import Bar from "@/components/Bar";
import windowFunc from "@/utils/windowFunc";

const App = () => {
  const [userList, setUserList] = useState<userInfo[]>([]);

  const init = async () => {
    const { data } = await getAllUserInfo();
    setUserList(data);
  };

  useEffect(() => {
    init();
  }, []);

  const goToCenter = (userId: number) => {
    windowFunc.replace(`#/center?id=${userId}`);
  };

  return (
    <div className={styles.allUserWarp}>
      {userList.map((item) => {
        return (
          <div
            key={item.userId}
            className={styles.item}
            onClick={() => goToCenter(item.userId)}
          >
            <div
              className={styles.avatar}
              style={{ backgroundImage: `url(${thumbImage(item.avatar)})` }}
            ></div>
            <div className={styles.name}>{item.userName}</div>
          </div>
        );
      })}
      <Bar />
    </div>
  );
};

export default App;
