import {
  Button,
  Input,
  message,
  Spin,
  Tag,
  Upload,
  UploadFile,
  UploadProps,
} from "antd";
import TextArea from "antd/es/input/TextArea";
import dayjs, { Dayjs } from "dayjs";
import { useEffect, useRef, useState } from "react";

import {
  getTopics,
  getWinkDetailApi,
  ITopicItem,
  winkEdit,
  winkNew,
} from "@/APIS/wink";
import { ensureAuthenticatedResponse } from "@/APIS/myaxios";
import iconAdd from "@/icons/addImage.svg";
import iconLocation from "@/icons/location.svg";
import { thumbImage } from "@/utils/handleImage";
import windowFunc from "@/utils/windowFunc";
import { getRouteSearchParams } from "@/utils/routes";
import { HOME_TAB_REFRESH_EVENT } from "@/utils/navigation";
import PublishTimeSetting from "@/components/PublishTimeSetting";

import styles from "./index.module.less";

const SEND_DRAFT_STORAGE_KEY = "family-node-send-draft";
const RECENT_TOPIC_STORAGE_KEY = "family-node-recent-topics";

const getRecentTopics = (): string[] => {
  try {
    const value = JSON.parse(localStorage.getItem(RECENT_TOPIC_STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
};

type SendDraft = {
  content?: string;
  location?: string;
  selectTopics?: string[];
  mode?: "video" | "image";
};

/** 统一兼容上传接口返回的文件名、/static 路径或对象格式。 */
const normalizeUploadedPath = (response: unknown): string => {
  let value: unknown = response;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    value = record.data ?? record.url ?? record.path ?? record.filename ?? record.fileName;
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    value = record.url ?? record.path ?? record.filename ?? record.fileName;
  }
  if (typeof value !== "string") return "";

  const path = value.trim();
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) {
    try {
      return normalizeUploadedPath(new URL(path).pathname);
    } catch {
      return "";
    }
  }
  return path.replace(/^\/+/, "").replace(/^static\//i, "");
};

const staticFileUrl = (path: string) =>
  path.startsWith("/") || /^https?:\/\//i.test(path) ? path : `/static/${path}`;

const toUploadFile = (path: string): UploadFile => ({
  uid: path,
  name: path.split("/").pop() || path,
  status: "done",
  url: thumbImage(path),
  response: { data: path },
});

const getSendDraft = (): SendDraft => {
  try {
    return JSON.parse(localStorage.getItem(SEND_DRAFT_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
};

const SendWink = ({ prefixTopic }: { prefixTopic?: string }) => {
  const editWinkId = getRouteSearchParams().get("editWinkId") ?? "";
  const isEditMode = Boolean(editWinkId);
  const draft = useRef(getSendDraft()).current;
  const [imageList, setImageList] = useState<string[]>([]);
  const [uploadFileList, setUploadFileList] = useState<UploadFile[]>([]);
  const [content, setContent] = useState<string>(isEditMode ? "" : draft.content || "");
  const [location, setLocation] = useState<string>(isEditMode ? "" : draft.location || "");
  /** 输入框内容 */
  const [topic, setTopic] = useState<string>("");
  const [showLocationInput, setShowLocationInput] = useState<boolean>(
    Boolean(draft.location)
  );
  // 当前服务器存在的话题们
  const [curTopics, setCurTopics] = useState<ITopicItem[]>([]);
  const [recentTopics, setRecentTopics] = useState<string[]>(getRecentTopics);
  const hiddenTopicsRef = useRef<Set<string>>(new Set());
  const skipNextDraftSaveRef = useRef(false);
  /** 显示已经选中的话题 */
  const [selectTopics, setSelectTopics] = useState<string[]>(
    isEditMode ? [] : prefixTopic ? [prefixTopic] : draft.selectTopics || []
  );
  /** 显示/隐藏 话题添加框 */
  const [showTopicInput, setShowTopicInput] = useState<boolean>(false);
  const [canSendWink, setCanSendWink] = useState<boolean>(false);

  // 视频上传
  const [video, setVideo] = useState<string>("");
  const [videoCover, setVideoCover] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  // 记录通过 createObjectURL 创建的预览 URL，用于及时释放，避免内存泄漏
  const objectUrlMapRef = useRef<Map<string, string>>(new Map());

  const [mode, setMode] = useState<"video" | "image">(
    isEditMode ? "image" : draft.mode || "image"
  );
  const [publishTime, setPublishTime] = useState<Dayjs>(dayjs());
  const [customPublishTime, setCustomPublishTime] = useState<Date>();
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [editLoading, setEditLoading] = useState(isEditMode);

  const base64ToFile = async (base64: string, filename: string) => {
    const res = await fetch(base64);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type });
  };

  // 监听当视频载入完成时，获取视频的第一帧作为封面
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.addEventListener("loadeddata", () => {
        // 设置视频自动播放
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current!.videoWidth;
        canvas.height = videoRef.current!.videoHeight;

        setTimeout(async () => {
          canvas
            .getContext("2d")!
            .drawImage(videoRef.current!, 0, 0, canvas.width, canvas.height);
          const cover = canvas.toDataURL("image/png");
          const file = await base64ToFile(cover, "cover.png");

          // 通过表单的方式,将 base64 的这个cover上传到服务器/api/base/uploader_image
          // 发送一个表单请求
          const formData = new FormData();
          formData.append("image", file);
          const res = await fetch("/api/base/uploader_image", {
            method: "POST",
            headers: {
              token: localStorage.getItem("token") || "",
            },
            body: formData,
          })
            .then((response) => response.json())
            .then(ensureAuthenticatedResponse);
          setVideoCover(res.data);
        }, 2000);
      });
    }
  }, [videoRef]);

  const init = async () => {
    const { data: topics } = await getTopics();
    setCurTopics(topics);
    hiddenTopicsRef.current = new Set(
      topics.filter((item) => item.showIndex === false).map((item) => item.topic)
    );
  };

  useEffect(() => {
    init();
  }, []);

  const recentTopicRank = new Map(recentTopics.map((item, index) => [item, index]));
  const sortedTopics = [...curTopics].sort((a, b) => {
    const aRank = recentTopicRank.get(a.topic);
    const bRank = recentTopicRank.get(b.topic);
    if (aRank !== undefined || bRank !== undefined) {
      return (aRank ?? Number.MAX_SAFE_INTEGER) - (bRank ?? Number.MAX_SAFE_INTEGER);
    }
    return (b.lastTime ?? 0) - (a.lastTime ?? 0);
  });
  const topicKeyword = topic.trim().toLocaleLowerCase();
  const topicResults = sortedTopics.filter((item) =>
    !topicKeyword || item.topic.toLocaleLowerCase().includes(topicKeyword)
  );
  const exactTopicExists = sortedTopics.some(
    (item) => item.topic.toLocaleLowerCase() === topicKeyword
  );

  const rememberTopic = (topicName: string) => {
    const next = [topicName, ...recentTopics.filter((item) => item !== topicName)].slice(0, 12);
    setRecentTopics(next);
    localStorage.setItem(RECENT_TOPIC_STORAGE_KEY, JSON.stringify(next));
  };

  const addTopic = (value: string) => {
    const topicUse = value.replace(/\s*/g, "");
    if (!topicUse) return;
    setSelectTopics((items) => Array.from(new Set([...items, topicUse])));
    rememberTopic(topicUse);
    setTopic("");
    setShowTopicInput(false);
  };

  useEffect(() => {
    if (!editWinkId) return;

    const loadWink = async () => {
      try {
        const { data } = await getWinkDetailApi(editWinkId);
        setContent(data.content || "");
        setLocation(data.location || "");
        setShowLocationInput(Boolean(data.location));
        setSelectTopics(data.topics || []);
        const imagePaths = (data.images || [])
          .map(normalizeUploadedPath)
          .filter(Boolean);
        setImageList(imagePaths);
        setUploadFileList(imagePaths.map(toUploadFile));
        setVideo(data.video?.path || "");
        setVideoCover(data.video?.cover || "");
        setMode(data.video?.path ? "video" : "image");
        setPublishTime(dayjs(data.time * 1000));
      } catch {
        message.error("获取帖子详情失败");
      } finally {
        setEditLoading(false);
      }
    };

    loadWink();
  }, [editWinkId]);

  // 组件卸载时释放所有未清理的 object URL，防止内存泄漏
  useEffect(() => {
    return () => {
      objectUrlMapRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlMapRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (content === "" && location === "" && imageList.length === 0 && !video) {
      setCanSendWink(false);
    } else {
      setCanSendWink(true);
    }
  }, [selectTopics, content, location, imageList, video]);

  useEffect(() => {
    if (mode === "image") {
      // 清空视频
      setVideo("");
      setVideoCover("");
    } else {
      // 清空图片
      setImageList([]);
      setUploadFileList([]);
    }
  }, [mode]);

  useEffect(() => {
    if (isEditMode) return;
    if (skipNextDraftSaveRef.current) {
      skipNextDraftSaveRef.current = false;
      return;
    }
    localStorage.setItem(
      SEND_DRAFT_STORAGE_KEY,
      JSON.stringify({
        content,
        location,
        selectTopics,
        mode,
      } satisfies SendDraft)
    );
  }, [content, location, selectTopics, mode, isEditMode]);

  const resetAfterPublish = () => {
    skipNextDraftSaveRef.current = true;
    localStorage.removeItem(SEND_DRAFT_STORAGE_KEY);
    setImageList([]);
    setUploadFileList([]);
    setContent("");
    setLocation("");
    setTopic("");
    setSelectTopics([]);
    setShowLocationInput(false);
    setShowTopicInput(false);
    setVideo("");
    setVideoCover("");
    setMode("image");
    setCustomPublishTime(undefined);
    setPublishTime(dayjs());
  };

  const props: UploadProps = {
    name: "image",
    action: "/api/base/uploader_image",
    headers: {
      token: localStorage.getItem("token") || "",
    },
    accept: "image/*",
    maxCount: video ? 1 : 100,
    listType: "picture-card",
    multiple: video ? false : true,
    fileList: mode === "image" ? uploadFileList : undefined,
    // 用 createObjectURL 替代默认的 FileReader.readAsDataURL，
    // 避免多张大图并发读入 JS 堆导致 Safari 内存溢出白屏
    previewFile(file) {
      const blob = file instanceof Blob ? file : new Blob([file]);
      const uid =
        (file as File & { uid?: string }).uid ?? String(Math.random());
      if (objectUrlMapRef.current.has(uid)) {
        URL.revokeObjectURL(objectUrlMapRef.current.get(uid)!);
      }
      const url = URL.createObjectURL(blob);
      objectUrlMapRef.current.set(uid, url);
      return Promise.resolve(url);
    },
    onChange(info) {
      const { status, uid } = info.file;
      setUploadFileList(info.fileList);
      if (status === "done") {
        ensureAuthenticatedResponse(info.file.response);
        // 判断是否都上传成功
        if (info.fileList.every((file) => file.status === "done")) {
          message.success("上传成功");
          const res = info.fileList
            .map((item) => normalizeUploadedPath(item.response))
            .filter(Boolean);
          setImageList(res);
        }
      }
      if (status === "removed") {
        // 释放该文件对应的 object URL，避免内存泄漏
        if (objectUrlMapRef.current.has(uid)) {
          URL.revokeObjectURL(objectUrlMapRef.current.get(uid)!);
          objectUrlMapRef.current.delete(uid);
        }
        message.success("删除成功");
        const res = info.fileList
          .map((item) => normalizeUploadedPath(item.response))
          .filter(Boolean);
        setImageList(res);
      }
    },
  };

  const videoProps: UploadProps = {
    ...props,
    fileList: undefined,
    action: "/api/base/uploader_image",
    // 仅运行mp4格式
    accept: "video/mp4",
    maxCount: 1,
    multiple: false,
    onChange(info) {
      const { status } = info.file;
      if (status === "done") {
        ensureAuthenticatedResponse(info.file.response);
        // 判断是否都上传成功
        const path = normalizeUploadedPath(info.file.response);
        if (!path) {
          message.error("上传成功但未获取文件地址");
          return;
        }
        setVideo(path);
        message.success("上传成功,请点下播放获取封面图");
      }
      if (status === "removed") {
        console.log(info);
      }
    },
  };

  const handleSend = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      if (isEditMode) {
        const { error, msg } = await winkEdit({
          winkId: editWinkId,
          content,
          images: imageList,
          location,
          topics: selectTopics,
          video: {
            path: video,
            cover: videoCover,
          },
          time: publishTime.unix(),
        });

        if (error) {
          message.error(msg || "编辑失败");
          return;
        }

        message.success("编辑成功");
      } else {
        const { error, msg } = await winkNew(
          content, imageList, location, selectTopics,
          { path: video, cover: videoCover },
          customPublishTime ? dayjs(customPublishTime).unix() : undefined
        );
        if (error) {
          message.error(msg || "发表失败");
          return;
        }
        message.success("发表成功");
      }

      const hiddenTopic = selectTopics.find((item) => hiddenTopicsRef.current.has(item));
      resetAfterPublish();

      if (hiddenTopic) {
        windowFunc.replace(
          `#/channel?topic=${encodeURIComponent(hiddenTopic)}`
        );
        return;
      }
      window.dispatchEvent(new Event(HOME_TAB_REFRESH_EVENT));
      windowFunc.replace("#/");
    } catch {
      message.error(isEditMode ? "编辑失败，请稍后重试" : "发表失败，请稍后重试");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.sendWrap}>
      <div className={styles.header}>
        <div className={styles.headerTitleGroup}>
          <span className={styles.headerCaption}>{isEditMode ? "编辑" : "新动态"}</span>
          <span className={styles.headerTitle}>{isEditMode ? "编辑动态" : "发布动态"}</span>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.modeSwitch} role="group" aria-label="内容类型">
          <div
            className={`${styles.modeSwitchSlider} ${
              mode === "video" ? styles.modeSwitchSliderRight : ""
            }`}
          />
          <button
            type="button"
            className={`${styles.modeSwitchItem} ${
              mode === "image" ? styles.modeSwitchItemActive : ""
            }`}
            aria-pressed={mode === "image"}
            onClick={() => setMode("image")}
          >
            图片
          </button>
          <button
            type="button"
            className={`${styles.modeSwitchItem} ${
              mode === "video" ? styles.modeSwitchItemActive : ""
            }`}
            aria-pressed={mode === "video"}
            onClick={() => setMode("video")}
          >
            视频
          </button>
          </div>
          <Button
            className={styles.sendBtn}
            disabled={!canSendWink || editLoading || submitting}
            loading={editLoading || submitting}
            onClick={handleSend}
          >
            {isEditMode ? "保存" : "发表"}
          </Button>
        </div>
      </div>
      <div className={styles.content}>
        <section className={styles.editorCard}>
          <div className={styles.sectionHeader}>
            <div>
              <span className={styles.sectionEyebrow}>正文</span>
              <span className={styles.sectionHint}>分享此刻的想法</span>
            </div>
            <span className={styles.contentCount}>{content.length} 字</span>
          </div>
          <TextArea
            className={styles.textarea}
            rows={6}
            placeholder="分享你的想法..."
            value={content}
            onInput={(e) => setContent(e.currentTarget.value)}
          />
          <div className={styles.toolsRow}>
            <span className={styles.toolsLabel}>添加信息</span>
            <div className={styles.toolActions}>
            <button
              type="button"
              className={`${styles.toolPill} ${
                showLocationInput ? styles.toolPillActive : ""
              }`}
              aria-expanded={showLocationInput}
              onClick={() => setShowLocationInput(!showLocationInput)}
            >
              <img src={iconLocation} alt="" />
              {location !== "" ? location : "地点"}
            </button>
            <button
              type="button"
              className={`${styles.toolPill} ${
                showTopicInput ? styles.toolPillActive : ""
              }`}
              aria-expanded={showTopicInput}
              onClick={() => setShowTopicInput(!showTopicInput)}
            >
              # 话题
            </button>
            </div>
          </div>

          {selectTopics.length > 0 && (
            <div className={styles.selectedTopicsWrap} aria-label="已选话题">
              {selectTopics.map((item) => (
                <Tag
                  className={styles.topicTag}
                  key={item}
                  closable
                  onClose={() => {
                    const res = selectTopics.filter((i) => i !== item);
                    setSelectTopics(res);
                  }}
                >
                  #{item}#
                </Tag>
              ))}
            </div>
          )}
        </section>

        <PublishTimeSetting
          editing={isEditMode}
          value={isEditMode ? publishTime.toDate() : customPublishTime}
          disabled={editLoading || submitting}
          onChange={(value) => {
            if (isEditMode) {
              if (value) setPublishTime(dayjs(value));
            } else setCustomPublishTime(value);
          }}
        />

        {showLocationInput && (
          <div className={styles.locationInput}>
            <Input
              placeholder="输入地点"
              onInput={(e) => setLocation(e.currentTarget.value)}
              value={location}
              autoFocus
              allowClear
            />
          </div>
        )}

        {showTopicInput && (
          <div className={styles.selectTopicWarp}>
            <div className={styles.topicPanelHeader}>
              <span className={styles.sectionEyebrow}>添加话题</span>
              <button
                type="button"
                className={styles.panelClose}
                onClick={() => setShowTopicInput(false)}
              >
                完成
              </button>
            </div>
            <Input
              className={styles.topicSearch}
              allowClear
              value={topic}
              placeholder="搜索话题或输入新话题"
              onChange={(e) => setTopic(e.target.value)}
            />
            <div className={styles.existingTopics}>
              {topicResults.length > 0 ? (
                topicResults.map((item) => (
                  <button
                    type="button"
                    key={item.topic}
                    className={styles.existingTopicTag}
                    aria-pressed={selectTopics.includes(item.topic)}
                    onClick={() => addTopic(item.topic)}
                  >
                    #{item.topic}#
                  </button>
                ))
              ) : (
                <span className={styles.topicEmpty}>没有匹配的话题</span>
              )}
            </div>
            {topicKeyword && !exactTopicExists && (
              <button type="button" className={styles.createTopic} onClick={() => addTopic(topic)}>
                新建 #{topic.replace(/\s*/g, "")}#
              </button>
            )}
          </div>
        )}

        <section className={styles.mediaSection}>
          <div className={styles.sectionHeader}>
            <div>
              <span className={styles.sectionEyebrow}>媒体</span>
              <span className={styles.sectionHint}>
                {mode === "image" ? "可选择多张图片" : "上传一个 MP4 视频"}
              </span>
            </div>
            <span className={styles.mediaMode}>{mode === "image" ? "图片" : "视频"}</span>
          </div>

          <div
            className={styles.imagesWarp}
            style={{ display: mode === "image" ? "block" : "none" }}
          >
            <Upload {...props}>
              <div className={styles.upload}>
                <img src={iconAdd} alt="" />
                <span>添加图片</span>
              </div>
            </Upload>
          </div>

          <div
            className={styles.imagesWarp}
            style={{ display: mode === "video" ? "block" : "none" }}
          >
            {!video && (
              <Upload {...videoProps}>
                <Button className={styles.videoUploadButton}>选择视频</Button>
              </Upload>
            )}

            {video && (
              <button
                type="button"
                className={styles.replaceVideoButton}
                onClick={() => {
                  setVideo("");
                  setVideoCover("");
                }}
              >
                移除视频并重新选择
              </button>
            )}

            <div className={styles.videoPreview}>
              <video
                src={video ? staticFileUrl(video) : undefined}
                controls
                ref={videoRef}
                style={{ display: video ? "block" : "none" }}
              />
              <Spin spinning={Boolean(video && !videoCover)} tip={"封面图获取中"}>
                <img
                  style={{ opacity: videoCover ? 1 : 0 }}
                  src={videoCover ? thumbImage(videoCover) : undefined}
                  alt="视频封面"
                />
              </Spin>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SendWink;
