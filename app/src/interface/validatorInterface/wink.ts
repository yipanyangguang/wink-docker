/** 该文件由脚本生成,定义不能完整覆盖需求,可自行修改,当前文件生成时间2024/1/18 14:42:40 */

import { WinkRouterPathEnum } from "@/routers/wink";

export interface IWinkRuleInterface {
  [WinkRouterPathEnum.List]: {
    /** 页码 */
    page: number;
    /** 页尺寸 */
    pageSize: number;
    /** 地点 */
    location?: string;
    /** 话题 */
    topic?: string;
  };
  [WinkRouterPathEnum.Search]: {
    /** 页码 */
    page: number;
    /** 页尺寸 */
    pageSize: number;
    /** 关键字 */
    keyword: string;
  };
  [WinkRouterPathEnum.New]: {
    /** 可选发布时间，Unix 秒级时间戳；不传则使用服务器当前时间 */
    time?: number;
    /** 正文 */
    content?: string;
    /** 图片列表 */
    images?: string[];
    /** 视频信息 */
    video?: {
      path: string;
      cover: string;
    };
    /** 地点信息 */
    location?: string;
    /** 话题列表 */
    topics?: string[];
  };
  [WinkRouterPathEnum.Delete]: {
    /** 瞬间ID */
    id: string;
  };
  [WinkRouterPathEnum.Edit]: {
    /** 瞬间ID */
    winkId: string;
    /** 正文 */
    content: string;
    /** 图片列表 */
    images: string[];
    /** 视频信息 */
    video: {
      path: string;
      cover: string;
    };
    /** 地点信息 */
    location: string;
    /** 话题列表 */
    topics: string[];
    /** 发布时间，Unix 秒级时间戳 */
    time: number;
  };
  [WinkRouterPathEnum.Detail]: {
    /** 瞬间的ID */
    winkId: string;
  };
  [WinkRouterPathEnum.HideTopic]: {
    /** 话题 */
    topic: string;
  };
  [WinkRouterPathEnum.ShowTopic]: {
    /** 话题 */
    topic: string;
  };
  [WinkRouterPathEnum.DeleteTopic]: {
    /** 话题 */
    topic: string;
  };
  [WinkRouterPathEnum.RenameTopic]: {
    topic: string;
    newTopic: string;
  };
  [WinkRouterPathEnum.Comment]: {
    /** 瞬间ID */
    winkId: string;
    /** 评论内容 */
    content?: string;
    /** 评论图片 */
    image?: string;
  };
  [WinkRouterPathEnum.DeleteComment]: {
    /** 评论ID */
    commentId: string;
  };
  [WinkRouterPathEnum.GetComments]: {
    /** 瞬间ID */
    winkId: string;
  };
  [WinkRouterPathEnum.SetTopicBackground]: {
    /** 话题 */
    topic: string;
    /** 背景图 */
    background: string;
  },
  [WinkRouterPathEnum.GetTopicBackground]: {
    /** 话题 */
    topic: string;
  }
  [WinkRouterPathEnum.TopicInfo]: {
    topic: string;
  };
  [WinkRouterPathEnum.TopicPhotoList]: {
    topicId: string;
    page?: number;
    pageSize?: number;
  };
  [WinkRouterPathEnum.TopicPhotoListNoAuth]: {
    topicId: string;
    page?: number;
    pageSize?: number;
  };
  [WinkRouterPathEnum.CreateShare]: {
    winkId: string;
  };
  [WinkRouterPathEnum.ShareDetail]: {
    shareId: string;
  };
  [WinkRouterPathEnum.ShareList]: Record<string, never>;
  [WinkRouterPathEnum.DeleteShare]: {
    shareId: string;
  };
}
