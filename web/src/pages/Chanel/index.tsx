import { useEffect, useRef, useState } from "react";

import { getTopicBgApi, setTopicBgApi } from "@/APIS/wink";
import { ensureAuthenticatedResponse } from "@/APIS/myaxios";
import ChanelBodyCommon from "@/components/chanel/ChanelBodyCommon";
import ChanelHeader from "@/components/chanel/ChanelHeader";
import ActionSheet from "@/components/ActionSheet";
import handleImage from "@/utils/handleImage";
import { setChannelFavicon } from "@/utils/channelFavicon";
import { message } from "antd";

import styles from "./index.module.less";
import { getRouteSearchParams } from "@/utils/routes";

const App = () => {
  // 从当前的url上取出 topic
  const searchParams = getRouteSearchParams();
  const topic = searchParams.get("topic") ?? "请正确进入该页面";

  const [currentTopicType] = useState("");
  const [mode, setMode] = useState<"list" | "photo">("list");
  const [descActive, setDescActive] = useState(false);
  const hasToken = !!localStorage.getItem("token");
  const [topicBg, setTopicBg] = useState("");
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [bgActionVisible, setBgActionVisible] = useState(false);

  const refreshTopicBg = async () => {
    const { data, error } = await getTopicBgApi(topic);
    setTopicBg(!error && data ? data : "");
  };

  const init = async () => {
    await refreshTopicBg();
  };

  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch("/api/base/uploader_image", {
      method: "POST",
      headers: {
        token: localStorage.getItem("token") || "",
      },
      body: formData,
    }).then((response) => response.json()).then(ensureAuthenticatedResponse);

    return res?.data as string;
  };

  const handleSetBackground = async (background: string) => {
    const res = await setTopicBgApi(topic, background);
    if (res?.error) return;
    await refreshTopicBg();
    message.success(background ? "背景图设置成功" : "背景图已删除");
  };

  const handleUploadBg = async (file: File) => {
    try {
      const background = await uploadImage(file);
      if (!background) {
        message.error("图片上传失败");
        return;
      }
      await handleSetBackground(background);
    } catch (error) {
      message.error("图片上传失败");
    }
  };

  const handleInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await handleUploadBg(file);
    event.target.value = "";
  };

  const openUploadSelector = () => {
    uploadInputRef.current?.click();
  };

  const handleTopicBgClick = async () => {
    if (!hasToken || !topicBg) return;
    setBgActionVisible(true);
  };

  const handleDeleteBg = async () => {
    const confirmed = await ActionSheet.confirm({
      content: "确认删除当前话题背景图吗？",
      confirmText: "删除",
      cancelText: "取消",
      danger: true,
    });
    if (!confirmed) return;
    await handleSetBackground("");
  };

  useEffect(() => {
    init();
  }, [topic]);

  useEffect(() => setChannelFavicon(topicBg), [topicBg]);

  return (
    <div>
      <ChanelHeader
        topic={topic}
        backgroundImage={topicBg ? handleImage(topicBg) : undefined}
        showSetBgBtn={!topicBg}
        onSetBg={openUploadSelector}
        descActive={descActive}
        onDescChange={setDescActive}
        mode={currentTopicType === "" ? mode : undefined}
        onModeChange={currentTopicType === "" ? setMode : undefined}
      />
      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleInputChange}
      />
      {topicBg && (
        <div className={styles.topicBgBox} onClick={handleTopicBgClick}>
          <img className={styles.topicBg} src={handleImage(topicBg)} />
        </div>
      )}
      <ActionSheet
        visible={bgActionVisible}
        cancelText="取消"
        actions={[{ text: "更换背景图", key: "replace" }, { text: "删除背景图", key: "delete", danger: true }]}
        onClose={() => setBgActionVisible(false)}
        onAction={async (action) => {
          setBgActionVisible(false);
          if (action.key === "replace") {
            openUploadSelector();
            return;
          }
          if (action.key === "delete") {
            await handleDeleteBg();
          }
        }}
      />

      {currentTopicType === "" && (
        <ChanelBodyCommon
          topic={topic}
          mode={mode}
          noAuth={!hasToken}
          descActive={descActive}
        />
      )}
    </div>
  );
};

export default App;
