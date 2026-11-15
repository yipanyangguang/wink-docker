import { Input } from "antd";
import {
  Button,
  ImageUploader,
  ImageUploaderRef,
  ImageUploadItem,
} from "antd-mobile";
import axios from "axios";
import { useEffect, useMemo, useRef, useState } from "react";

import styles from "./index.module.less";

interface IInputBarPops {
  onSend: (content: string, image: string) => void;
}

const InputBar = (props: IInputBarPops) => {
  const [fileList, setFileList] = useState<ImageUploadItem[]>([]);
  const ref = useRef<ImageUploaderRef>(null);
  const [inputValue, setInputValue] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    console.log(fileList);
  }, [fileList]);

  const imageUploadHandler = async (file: File) => {
    setIsLoading(true);
    const { data: filename } = await axios
      .post<{ error: number; data: string }>(
        "/api/base/uploader_image",
        { image: file },
        {
          headers: {
            token: localStorage.getItem("token") || "",
            "Content-Type": "multipart/form-data",
          },
        }
      )
      .then((res) => res.data)
      .finally(() => {
        setIsLoading(false);
      });
    return {
      url: `/static/${filename}`,
    };
  };

  /** 上传按钮 和 loading 和 图片缩略图的显示逻辑 */
  const showLogic = useMemo(() => {
    if (isLoading) {
      return 'showLoading';
    }

    if (fileList.length === 0) {
      return 'showUpload';
    }

    return 'showImage';

  }, [fileList, isLoading]);

  return (
    <div className={styles.bar}>
      <ImageUploader
        value={fileList}
        onChange={setFileList}
        upload={imageUploadHandler}
        className={styles.upload}
        ref={ref}
      />
      <div className={styles.inputBox}>
        <Input
          value={inputValue}
          placeholder="请输入内容"
          onInput={(e) => setInputValue(e.currentTarget.value)}
        />
      </div>

      {showLogic === 'showUpload' && (
        <Button
          size={"small"}
          onClick={() => {
            ref.current?.nativeElement?.click();
          }}
        >
          图片
        </Button>
      )}

      {showLogic === 'showLoading' && <div>上传中...</div>}

      {showLogic === 'showImage' && (
        <img
          height={30}
          src={fileList[0].url}
          onClick={() => setFileList([])}
        />
      )}

      <Button
        onClick={() => {
          props.onSend(inputValue, fileList.length ? fileList[0].url : "");
        }}
        className={styles.sendBtn}
        size={"small"}
        color="primary"
      >
        发布
      </Button>
    </div>
  );
};

export default InputBar;
