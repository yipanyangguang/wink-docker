import {
  ITopicItem,
  getOpenTopics,
  getTopics,
  hideTopic,
  renameTopic,
  showTopic,
} from "@/APIS/wink";
import Bar from "@/components/Bar";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./index.module.less";
import windowFunc from "@/utils/windowFunc";
import { Skeleton, Toast } from "antd-mobile";
import { getMyUserInfo } from "@/APIS/user";
import { thumbImage } from "@/utils/handleImage";
import ImgCrop from "antd-img-crop";
import { Upload } from "antd";
import type { UserCenterInfoProps } from "@/components/userCenter/Info/interface";
import ActionSheet from "@/components/ActionSheet";

interface TopicProps {
  showBar?: boolean;
  profile?: UserCenterInfoProps;
}

const Topic = ({ showBar = true, profile }: TopicProps) => {
  const [showList, setShowList] = useState<ITopicItem[]>([]);
  const [hideList, setHideList] = useState<ITopicItem[]>([]);
  const [openList, setOpenList] = useState<string[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [showAllHidden, setShowAllHidden] = useState(false);
  const [showAllOpen, setShowAllOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [avatar, setAvatar] = useState(
    profile?.avatar || localStorage.getItem("avatar") || "404.png"
  );
  const [userName, setUserName] = useState(
    profile?.userName || localStorage.getItem("userName") || ""
  );
  const [loading, setLoading] = useState(true);
  const [renameTarget, setRenameTarget] = useState<ITopicItem | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renaming, setRenaming] = useState(false);

  const init = async () => {
    const { data: topicsList } = await getTopics();
    setShowList(topicsList.filter((item) => item.showIndex !== false));
    setHideList(topicsList.filter((item) => item.showIndex === false));
    setLoading(false);
  };

  const loadOpenTopics = async () => {
    try {
      const res = await getOpenTopics();
      if (res?.data?.info) setOpenList(res.data.info);
    } catch {
      // 开放话题失败时不影响普通话题使用。
    }
  };

  useEffect(() => {
    void init();
    void loadOpenTopics();
    if (profile) {
      setAvatar(profile.avatar || "404.png");
      setUserName(profile.userName || "");
      return;
    }

    getMyUserInfo().then((res) => {
      if (res.error) return;
      setAvatar(res.avatar);
      setUserName(res.userName);
      localStorage.setItem("avatar", res.avatar);
      localStorage.setItem("userName", res.userName);
    });
  }, [profile?.avatar, profile?.userName]);

  const orderedShowList = [...showList].reverse();
  const visibleShowList = showAll ? orderedShowList : orderedShowList.slice(0, 6);
  const remainingShowCount = Math.max(orderedShowList.length - 6, 0);
  const visibleHideList = showAllHidden ? hideList : hideList.slice(0, 6);
  const remainingHideCount = Math.max(hideList.length - 6, 0);
  const visibleOpenList = showAllOpen ? openList : openList.slice(0, 6);
  const remainingOpenCount = Math.max(openList.length - 6, 0);
  const avatarSrc = profile?.avatar ? avatar : thumbImage(avatar);
  const searchResults = useMemo(() => {
    const keyword = searchText.trim().toLocaleLowerCase();
    if (!keyword) return [];

    const resultMap = new Map<string, { topic: string; source: string }>();
    showList.forEach((item) => {
      if (item.topic.toLocaleLowerCase().includes(keyword)) {
        resultMap.set(item.topic, { topic: item.topic, source: "首页展示" });
      }
    });
    hideList.forEach((item) => {
      if (item.topic.toLocaleLowerCase().includes(keyword) && !resultMap.has(item.topic)) {
        resultMap.set(item.topic, { topic: item.topic, source: "已隐藏" });
      }
    });
    openList.forEach((topic) => {
      if (topic.toLocaleLowerCase().includes(keyword) && !resultMap.has(topic)) {
        resultMap.set(topic, { topic, source: "开放话题" });
      }
    });
    return Array.from(resultMap.values());
  }, [hideList, openList, searchText, showList]);

  const openTopic = (topic: string) => {
    windowFunc.open(`#/channel?topic=${encodeURIComponent(topic)}`);
  };

  const toggleTopic = async (topic: string, visible: boolean) => {
    await ActionSheet.confirm({
      content: visible ? "是否隐藏该话题？" : "是否显示该话题？",
      confirmText: visible ? "隐藏" : "显示",
      onConfirm: async () => {
        if (visible) await hideTopic(topic);
        else await showTopic(topic);
        await init();
      },
    });
  };

  const openRename = (item: ITopicItem) => {
    setRenameTarget(item);
    setRenameValue(item.topic);
  };

  const closeRename = () => {
    if (renaming) return;
    setRenameTarget(null);
    setRenameValue("");
  };

  const submitRename = async () => {
    if (!renameTarget || renaming) return;
    const nextName = renameValue.trim();
    if (!nextName || nextName === renameTarget.topic) return;
    setRenaming(true);
    try {
      const result = await renameTopic(renameTarget.topic, nextName);
      if (result.error) {
        Toast.show({ content: result.msg || "话题改名失败", icon: "fail" });
        return;
      }
      setRenameTarget(null);
      setRenameValue("");
      await init();
      Toast.show({ content: "话题改名成功", icon: "success" });
    } catch {
      Toast.show({ content: "话题改名失败，请稍后重试", icon: "fail" });
    } finally {
      setRenaming(false);
    }
  };

  const renderTopicRow = (item: ITopicItem, visible: boolean) => (
    <div
      key={item._id}
      className={`${styles.topicRow} ${!visible ? styles.topicRowMuted : ""}`}
      role="button"
      tabIndex={0}
      onClick={() => {
        if (!editMode) openTopic(item.topic);
      }}
      onKeyDown={(event) => {
        if (!editMode && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          openTopic(item.topic);
        }
      }}
    >
      <span className={styles.topicMark}>#</span>
      <span className={styles.topicName}>{item.topic}</span>
      {editMode ? (
        <div className={styles.rowActions}>
          <button
            type="button"
            className={styles.rowActionRename}
            onClick={(event) => {
              event.stopPropagation();
              openRename(item);
            }}
          >
            改名
          </button>
          <button
            type="button"
            className={`${styles.rowAction} ${visible ? styles.rowActionHide : styles.rowActionShow}`}
            onClick={(event) => {
              event.stopPropagation();
              void toggleTopic(item.topic, visible);
            }}
          >
            {visible ? "隐藏" : "显示"}
          </button>
        </div>
      ) : (
        <span className={styles.rowArrow} aria-hidden="true">
          ›
        </span>
      )}
    </div>
  );

  return (
    <div className={styles.warp}>
      {loading ? (
        <div className={styles.loading}>
          <Skeleton.Title animated />
          <Skeleton.Paragraph animated lineCount={5} />
          <Skeleton.Title animated style={{ marginTop: 24 }} />
          <Skeleton.Paragraph animated lineCount={3} />
        </div>
      ) : (
        <>
          <header className={styles.pageHeader}>
            <div className={styles.identity}>
              {profile?.isMeCenter && profile.uploadProps ? (
                <ImgCrop rotationSlider>
                  <Upload {...profile.uploadProps}>
                    <button type="button" className={styles.avatarButton} aria-label="更换头像">
                      <img className={styles.avatar} src={avatarSrc} alt="" />
                    </button>
                  </Upload>
                </ImgCrop>
              ) : (
                <img className={styles.avatar} src={avatarSrc} alt="" />
              )}
              <span className={styles.userName}>{userName || "我的话题"}</span>
              {(!profile || profile.isMeCenter) && (
                <button
                  type="button"
                  className={styles.shareManageButton}
                  onClick={() => windowFunc.open("#/wink-shares")}
                >
                  管理分享
                </button>
              )}
            </div>
            <div className={styles.modeToggle} role="tablist" aria-label="话题模式">
              <div
                className={styles.modeSlider}
                style={{ transform: editMode ? "translateX(100%)" : "translateX(0)" }}
              />
              <button
                type="button"
                role="tab"
                aria-selected={!editMode}
                className={`${styles.modeBtn} ${!editMode ? styles.modeBtnActive : ""}`}
                onClick={() => setEditMode(false)}
              >
                浏览
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={editMode}
                className={`${styles.modeBtn} ${editMode ? styles.modeBtnActive : ""}`}
                onClick={() => setEditMode(true)}
              >
                编辑
              </button>
            </div>
          </header>

          <div className={styles.searchArea}>
            <div className={styles.searchBox}>
              <span className={styles.searchIcon} aria-hidden="true">⌕</span>
              <input
                ref={searchInputRef}
                value={searchText}
                type="search"
                placeholder="搜索话题"
                aria-label="搜索话题"
                autoComplete="off"
                onChange={(event) => setSearchText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setSearchText("");
                    searchInputRef.current?.blur();
                  }
                }}
              />
              {searchText && (
                <button
                  type="button"
                  className={styles.searchClear}
                  aria-label="清除搜索"
                  onClick={() => setSearchText("")}
                >
                  ×
                </button>
              )}
            </div>
            {searchText.trim() && (
              <button
                type="button"
                className={styles.searchCancel}
                onClick={() => {
                  setSearchText("");
                  searchInputRef.current?.blur();
                }}
              >
                取消
              </button>
            )}
          </div>

          {searchText.trim() ? (
            <section className={`${styles.section} ${styles.searchResults}`}>
              <div className={styles.searchResultsHeader}>
                <h2>搜索结果</h2>
                <span>{searchResults.length} 个话题</span>
              </div>
              <div className={styles.topicList}>
                {searchResults.map((result) => (
                  <div
                    key={`${result.source}-${result.topic}`}
                    className={styles.topicRow}
                    role="button"
                    tabIndex={0}
                    onClick={() => openTopic(result.topic)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openTopic(result.topic);
                      }
                    }}
                  >
                    <span className={styles.topicMark}>#</span>
                    <span className={styles.topicName}>{result.topic}</span>
                    <span className={styles.searchSource}>{result.source}</span>
                    <span className={styles.rowArrow} aria-hidden="true">›</span>
                  </div>
                ))}
                {searchResults.length === 0 && (
                  <div className={styles.searchEmpty}>没有找到相关话题，换个关键词试试</div>
                )}
              </div>
            </section>
          ) : (
            <>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <h2>首页展示</h2>
                <p>常用话题会出现在首页</p>
              </div>
              <span className={styles.sectionCount}>{showList.length}</span>
            </div>
            <div className={styles.topicList}>
              {visibleShowList.map((item) => renderTopicRow(item, true))}
              {showList.length === 0 && <span className={styles.emptyHint}>暂无展示话题</span>}
              {remainingShowCount > 0 && (
                <button
                  type="button"
                  className={styles.expandRow}
                  onClick={() => setShowAll((expanded) => !expanded)}
                >
                  {showAll ? "收起" : `查看全部（剩余 ${remainingShowCount} 条）`}
                </button>
              )}
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <h2>已隐藏</h2>
                <p>隐藏后不会出现在首页</p>
              </div>
              <span className={styles.sectionCount}>{hideList.length}</span>
            </div>
            <div className={styles.topicList}>
              {visibleHideList.map((item) => renderTopicRow(item, false))}
              {hideList.length === 0 && <span className={styles.emptyHint}>暂无隐藏话题</span>}
              {remainingHideCount > 0 && (
                <button
                  type="button"
                  className={styles.expandRow}
                  onClick={() => setShowAllHidden((expanded) => !expanded)}
                >
                  {showAllHidden ? "收起" : `查看全部（剩余 ${remainingHideCount} 条）`}
                </button>
              )}
            </div>
          </section>

          {openList.length > 0 && (
            <section className={`${styles.section} ${styles.openSection}`}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2>开放话题</h2>
                  <p>来自社区的公开讨论</p>
                </div>
                <button
                  type="button"
                  className={styles.sectionLink}
                  onClick={() => windowFunc.open("#/open-topics")}
                >
                  查看全部 <span aria-hidden="true">›</span>
                </button>
              </div>
              <div className={styles.topicList}>
                {visibleOpenList.map((topic) => (
                  <div
                    key={topic}
                    className={styles.topicRow}
                    role="button"
                    tabIndex={0}
                    onClick={() => openTopic(topic)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openTopic(topic);
                      }
                    }}
                  >
                    <span className={`${styles.topicMark} ${styles.topicMarkOpen}`}>#</span>
                    <span className={styles.topicName}>{topic}</span>
                    <span className={styles.rowArrow} aria-hidden="true">›</span>
                  </div>
                ))}
                {remainingOpenCount > 0 && (
                  <button
                    type="button"
                    className={styles.expandRow}
                    onClick={() => setShowAllOpen((expanded) => !expanded)}
                  >
                    {showAllOpen ? "收起" : `查看全部（剩余 ${remainingOpenCount} 条）`}
                  </button>
                )}
              </div>
            </section>
          )}
            </>
          )}
        </>
      )}

      {renameTarget && (
        <div className={styles.renameMask} role="dialog" aria-modal="true" aria-labelledby="rename-topic-title">
          <button type="button" className={styles.renameBackdrop} aria-label="关闭改名弹窗" onClick={closeRename} />
          <div className={styles.renameDialog}>
            <h2 id="rename-topic-title">修改话题名称</h2>
            <p className={styles.renameCurrent}>当前名称：#{renameTarget.topic}</p>
            <input
              autoFocus
              className={styles.renameInput}
              value={renameValue}
              maxLength={30}
              aria-label="新话题名称"
              onChange={(event) => setRenameValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void submitRename();
                if (event.key === "Escape") closeRename();
              }}
            />
            <p className={styles.renameHint}>所有使用该话题的帖子会同步更新</p>
            <div className={styles.renameActions}>
              <button type="button" disabled={renaming} onClick={closeRename}>取消</button>
              <button
                type="button"
                disabled={renaming || !renameValue.trim() || renameValue.trim() === renameTarget.topic}
                onClick={() => void submitRename()}
              >
                {renaming ? "保存中…" : "保存"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showBar && <Bar />}
    </div>
  );
};

export default Topic;
