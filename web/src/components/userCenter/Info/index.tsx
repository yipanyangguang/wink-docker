import { UserCenterInfoProps } from "./interface";
import styles from "./index.module.less";
import { Upload } from "antd";
import ImgCrop from "antd-img-crop";

const UserCenterInfo = (props: UserCenterInfoProps) => {
  const { isMeCenter, avatar, uploadProps, userName } = props;

  return (
    <div className={styles.warp}>
      {!isMeCenter ? (
        <div
          className={styles.avatar}
          style={{ backgroundImage: `url(${avatar})` }}
        />
      ) : (
        <ImgCrop rotationSlider>
          <Upload {...uploadProps}>
            <div
              className={styles.avatar}
              style={{ backgroundImage: `url(${avatar})` }}
            />
          </Upload>
        </ImgCrop>
      )}
      {isMeCenter && <span className={styles.editHint}>点击更换头像</span>}
      <p>{userName}</p>
    </div>
  );
};

export default UserCenterInfo;
