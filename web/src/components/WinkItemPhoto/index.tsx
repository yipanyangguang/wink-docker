import { thumbImage } from "@/utils/handleImage";
import styles from "./index.module.less";
import { Image } from "antd";
import { winkItem } from "@/APIS/wink";

const WinkItemPhoto = (props: winkItem) => {
  const { images } = props;

  return (
    <>
      {images &&
        images.map((item) => (
          <div
            className={styles.img}
            style={{ backgroundImage: `url(${thumbImage(item)})` }}
          >
            <Image
              className={styles.preview}
              width={"100%"}
              height={"100%"}
              preview={{ src: thumbImage(item, true) }}
            />
          </div>
        ))}
    </>
  );
};

export default WinkItemPhoto;
