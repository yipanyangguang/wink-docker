import { WinkRouterPathEnum } from "@/routers/wink";

import { MethodEnum, SIGN_STRING_LENGTH_24_RULE } from "./commonRule";

const winkRule: {
  [key in string]: {
    _method: MethodEnum;
    [key: string]: string;
  };
} = {
  /** auto-start */
  [WinkRouterPathEnum.List]: {
    _method: MethodEnum.GET,
    /** 页码 */
    page: "required|integer",
    /** 页尺寸 */
    pageSize: "required|integer",
    /** 地点 */
    location: "string",
    /** 话题 */
    topic: "string",
  },
  [WinkRouterPathEnum.Random]: {
    _method: MethodEnum.GET,
  },
  [WinkRouterPathEnum.Search]: {
    _method: MethodEnum.GET,
    /** 页码 */
    page: "required|integer",
    /** 页尺寸 */
    pageSize: "required|integer",
    /** 关键字 */
    keyword: "required|string",
  },
  [WinkRouterPathEnum.New]: {
    _method: MethodEnum.POST,
    /** 可选发布时间 */
    time: "integer",
    /** 正文 */
    content: "string",
    /** 图片列表<[type:string,test:hello]> */
    images: "array",
    /** 视频信息 */
    video: "object",
    "video.path": "string",
    "video.cover": "string",
    /** 地点信息 */
    location: "string",
    /** 话题列表<[type:string]> */
    topics: "array",
  },
  [WinkRouterPathEnum.Delete]: {
    _method: MethodEnum.DELETE,
    /** 瞬间ID */
    id: SIGN_STRING_LENGTH_24_RULE,
  },
  [WinkRouterPathEnum.Edit]: {
    _method: MethodEnum.PUT,
    /** 瞬间ID */
    winkId: SIGN_STRING_LENGTH_24_RULE,
    /** 正文 */
    content: "string",
    /** 图片列表 */
    images: "array",
    /** 视频信息 */
    video: "object",
    "video.path": "string",
    "video.cover": "string",
    /** 地点信息 */
    location: "string",
    /** 话题列表 */
    topics: "array",
    /** 发布时间，Unix 秒级时间戳 */
    time: "required|integer",
  },
  [WinkRouterPathEnum.Detail]: {
    _method: MethodEnum.GET,
    /** 瞬间的ID */
    winkId: SIGN_STRING_LENGTH_24_RULE,
  },
  [WinkRouterPathEnum.HideTopic]: {
    _method: MethodEnum.GET,
    /** 话题 */
    topic: "required|string",
  },
  [WinkRouterPathEnum.ShowTopic]: {
    _method: MethodEnum.GET,
    /** 话题 */
    topic: "required|string",
  },
  [WinkRouterPathEnum.DeleteTopic]: {
    _method: MethodEnum.DELETE,
    /** 话题 */
    topic: "required|string",
  },
  [WinkRouterPathEnum.RenameTopic]: {
    _method: MethodEnum.PUT,
    topic: "required|string",
    newTopic: "required|string",
  },
  [WinkRouterPathEnum.Comment]: {
    _method: MethodEnum.POST,
    /** 瞬间ID */
    winkId: SIGN_STRING_LENGTH_24_RULE,
    /** 评论内容 */
    content: "string",
    /** 评论图片 */
    image: "string",
  },
  [WinkRouterPathEnum.DeleteComment]: {
    _method: MethodEnum.DELETE,
    /** 评论ID */
    commentId: SIGN_STRING_LENGTH_24_RULE,
  },
  [WinkRouterPathEnum.GetComments]: {
    _method: MethodEnum.GET,
    /** 瞬间ID */
    winkId: SIGN_STRING_LENGTH_24_RULE,
  },
  [WinkRouterPathEnum.SetTopicBackground]: {
    _method: MethodEnum.POST,
    /** 话题 */
    topic: "required|string",
    /** 主题背景图的URL */
    background: "string",
  },
  [WinkRouterPathEnum.GetTopicBackground]: {
    _method: MethodEnum.GET,
    /** 话题 */
    topic: "required|string",
  },
  [WinkRouterPathEnum.TopicInfo]: {
    _method: MethodEnum.GET,
    topic: "required|string",
  },
  [WinkRouterPathEnum.TopicPhotoList]: {
    _method: MethodEnum.GET,
    topicId: SIGN_STRING_LENGTH_24_RULE,
    page: "integer",
    pageSize: "integer",
  },
  [WinkRouterPathEnum.TopicPhotoListNoAuth]: {
    _method: MethodEnum.GET,
    topicId: SIGN_STRING_LENGTH_24_RULE,
    page: "integer",
    pageSize: "integer",
  },
  [WinkRouterPathEnum.CreateShare]: {
    _method: MethodEnum.POST,
    winkId: SIGN_STRING_LENGTH_24_RULE,
  },
  [WinkRouterPathEnum.ShareDetail]: {
    _method: MethodEnum.GET,
    shareId: "required|string",
  },
  [WinkRouterPathEnum.ShareList]: {
    _method: MethodEnum.GET,
  },
  [WinkRouterPathEnum.DeleteShare]: {
    _method: MethodEnum.DELETE,
    shareId: "required|string",
  },
  /** auto-end */
};

export default winkRule;
