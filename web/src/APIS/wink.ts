import { axiosDelete, axiosGet, axiosPost, axiosPut } from "./myaxios";

interface winkListReq {
  page: number;
  location: string;
  topic: string;
  size?: number;
  desc?: 1;
}

export interface ICommentItem {
  _id: string;
  winkId: string;
  content?: string;
  image?: string;
  time: number;
  userId: number;
  avatar: string;
  userName: string;
}

export interface winkItem {
  _id: string;
  userId: number;
  content: string;
  images: string[];
  time: number;
  location: string;
  topics: string[];
  video: {
    path: string;
    cover: string;
  };
  avatar: string;
  userName: string;
  /** 评论的数量 */
  commentCount: number;
  /** 最新评论 */
  latestComment: ICommentItem;
  /** 高亮搜索词 */
  keyword?: string;
  /** 分享链接的过期时间，仅分享详情返回 */
  shareExpiresAt?: number;
}

interface winkListRes {
  data: winkItem[];
  error?: string;
  total: number;
  msg: string;
}

/** 获取wink列表 */
export const getWinkList = (params: winkListReq) => {
  const { page, location, topic, size = "", desc } = params;
  const path = localStorage.getItem("token") ? '/api/wink/list' : '/api/wink/list_no_auth'
  const descQuery = desc === 1 ? "&desc=1" : "";
  return axiosGet(
    `${path}?page=${page}&location=${location}&topic=${topic}&pageSize=${size}${descQuery}`
  ) as Promise<winkListRes>;
};

/** 从全部瞬间中随机获取 10 条内容，不受话题展示状态影响。 */
export const getRandomWinkList = () =>
  axiosGet("/api/wink/random") as Promise<winkListRes>;

/** 搜索wink列表 */
export const searchWinkList = (params: { keyword: string; page: number; size: number }) => {
  const { page, size, keyword } = params;
  return axiosGet(
    `/api/wink/search?page=${page}&pageSize=${size}&keyword=${encodeURIComponent(keyword)}`,
    { showError: false }
  ) as Promise<winkListRes>;
};

/** 发表wink */
export const winkNew = (
  content: string,
  images: string[],
  location: string,
  topics: string[],
  video?: {
    path: string;
    cover: string;
  },
  time?: number
) => {
  return axiosPost("/api/wink/new", {
    content,
    images,
    location,
    topics,
    video,
    ...(time !== undefined ? { time } : {}),
  });
};

export interface WinkEditParams {
  winkId: string;
  content: string;
  images: string[];
  location: string;
  topics: string[];
  video: {
    path: string;
    cover: string;
  };
  time: number;
}

/** 编辑 wink */
export const winkEdit = (params: WinkEditParams) => {
  return axiosPut("/api/wink/edit", params) as Promise<{
    data: string;
    error?: string | number;
    msg?: string;
  }>;
};

/** 删除wink */
export const winkDelete = (winkId: string) => {
  return axiosDelete(`/api/wink/delete?id=${winkId}`) as Promise<{
    error?: string;
  }>;
};

export interface ITopicItem {
  _id: string;
  topic: string;
  /** 类型 */
  type?: string;
  /** 是否在首页展示 */
  showIndex?: boolean;
  /** 最后使用时间 */
  lastTime?: number;
}
/** 获取所有的话题 */
export const getTopics = () => {
  return axiosGet("/api/wink/topics") as Promise<{
    data: ITopicItem[];
    error?: string;
  }>;
};

/** 根据话题名称获取话题ID */
export const getTopicInfoApi = (topic: string) => {
  return axiosGet(`/api/wink/topic_info?topic=${encodeURIComponent(topic)}`) as Promise<{
    data: { _id: string; topic: string } | null;
    error?: string | number;
  }>;
};

/** 隐藏话题 */
export const hideTopic = (topic: string) =>
  axiosGet(`/api/wink/hide_topic?topic=${topic}`);
/** 显示话题 */
export const showTopic = (topic: string) =>
  axiosGet(`/api/wink/show_topic?topic=${topic}`);
/** 仅删除话题 */
export const deleteTopic = (topic: string) =>
  axiosDelete(`/api/wink/delete_topic?topic=${topic}`);

/** 修改话题名称，并同步更新帖子中的话题引用 */
export const renameTopic = (topic: string, newTopic: string) =>
  axiosPut("/api/wink/rename_topic", { topic, newTopic }) as Promise<{
    data?: { oldTopic: string; newTopic: string; updatedWinkCount: number };
    error?: string | number;
    msg?: string;
  }>;

/** 获取开放话题列表 */
export const getOpenTopics = () =>
  axiosGet("/api/base/open_topic") as Promise<{
    data: { info: string[] };
    error: number;
  }>;

/** 获取瞬间详情 */
export const getWinkDetailApi = (winkId: string) => {
  return axiosGet(`/api/wink/detail?winkId=${winkId}`) as Promise<{
    data: winkItem;
    error?: string;
    msg?: string;
  }>;
};

/** 创建帖子分享链接 */
export const createWinkShareApi = (winkId: string) =>
  axiosPost("/api/wink/share", { winkId }) as Promise<{
    data: { shareId: string; expiresAt: number };
    error?: string | number;
    msg?: string;
  }>;

/** 通过临时分享 ID 获取帖子详情，无需登录 */
export const getWinkShareDetailApi = (shareId: string) =>
  axiosGet(`/api/wink/share/detail?shareId=${encodeURIComponent(shareId)}`) as Promise<{
    data: winkItem;
    error?: string | number;
    msg?: string;
  }>;

export interface WinkShareItem {
  shareId: string;
  winkId: string;
  contentPreview: string;
  image: string;
  expiresAt: number;
  createdAt: number;
}

/** 获取当前用户的帖子分享列表 */
export const getWinkShareListApi = () =>
  axiosGet("/api/wink/share/list") as Promise<{
    data: WinkShareItem[];
    error?: string | number;
  }>;

/** 删除帖子分享 */
export const deleteWinkShareApi = (shareId: string) =>
  axiosDelete(`/api/wink/share/delete?shareId=${encodeURIComponent(shareId)}`) as Promise<{
    error?: string | number;
    msg?: string;
  }>;

/** 获取评论列表 */
export const getCommentListApi = (winkId: string) => {
  return axiosGet(`/api/wink/comment_list?winkId=${winkId}`) as Promise<{
    data: ICommentItem[];
    error?: string;
  }>;
};

/** 评论帖子 */
export const commentApi = (winkId: string, content: string, image: string) => {
  return axiosPost(`/api/wink/comment`, {
    winkId,
    content,
    image,
  });
};

/** 删除帖子 */
export const deleteCommentApi = (commentId: string) => {
  return axiosDelete(`/api/wink/comment_delete?commentId=${commentId}`);
};

/** 获取话题的背景图 */
export const getTopicBgApi = (topic: string) => {
  return axiosGet(`/api/wink/get_topic_background?topic=${topic}`) as Promise<{
    data: string;
    error?: string;
  }>;
};

/** 设置话题背景图 */
export const setTopicBgApi = (topic: string, background: string) => {
  return axiosPost(`/api/wink/set_topic_background`, {
    topic,
    background,
  }) as Promise<{
    error?: string;
    msg?: string;
  }>;
};
