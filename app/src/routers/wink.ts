import Router from "koa-router";

import {
  createCommentController,
  createWinkController,
  deleteCommentController,
  deleteTopicController,
  renameTopicController,
  deleteWinkController,
  editWinkController,
  getAllTopicsController,
  getCommentsController,
  getListController,
  getRandomListController,
  getListNoAuthController,
  getWinkDetailController,
  hideTopicController,
  searchWinkController,
  showTopicController,
} from "@/controller/wink";
import setTopicBGController from "@/controller/wink/setTopicBG.controller";
import getTopicBGController from "@/controller/wink/getTopicBG.controller";
import getTopicInfoController from "@/controller/wink/getTopicInfo.controller";
import getTopicPhotoListController from "@/controller/wink/getTopicPhotoList.controller";
import getTopicPhotoListNoAuthController from "@/controller/wink/getTopicPhotoListNoAuth.controller";
import createWinkShareController from "@/controller/wink/createWinkShare.controller";
import getWinkShareDetailController from "@/controller/wink/getWinkShareDetail.controller";
import getWinkShareListController from "@/controller/wink/getWinkShareList.controller";
import deleteWinkShareController from "@/controller/wink/deleteWinkShare.controller";

const router = new Router();

export enum WinkRouterPathEnum {
  /** 获取瞬间列表 */
  List = "/api/wink/list",
  /** 从全部瞬间中随机获取内容 */
  Random = "/api/wink/random",
  /** 获取瞬间列表-无鉴权 */
  ListNoAuth = "/api/wink/list_no_auth", 
  /** 搜索瞬间 */
  Search = "/api/wink/search",
  /** 获取所有的话题 */
  AllTopics = "/api/wink/topics",
  /** 发布一个瞬间 */
  New = "/api/wink/new",
  /** 删除一个瞬间 */
  Delete = "/api/wink/delete",
  /** 编辑一个瞬间 */
  Edit = "/api/wink/edit",
  /** 获取瞬间的详情 */
  Detail = "/api/wink/detail",
  /** 隐藏话题 */
  HideTopic = "/api/wink/hide_topic",
  /** 显示话题 */
  ShowTopic = "/api/wink/show_topic",
  /** 删除话题 */
  DeleteTopic = "/api/wink/delete_topic",
  /** 修改话题名称 */
  RenameTopic = "/api/wink/rename_topic",
  /** 评论帖子 */
  Comment = "/api/wink/comment",
  /** 删除评论 */
  DeleteComment = "/api/wink/comment_delete",
  /** 获取帖子下所有的评论 */
  GetComments = "/api/wink/comment_list",
  /** 设置话题的主题背景图 todo 验证器还未处理 */
  SetTopicBackground = "/api/wink/set_topic_background",
  /** 获取话题的主题背景图 todo 验证器还未处理 */
  GetTopicBackground = "/api/wink/get_topic_background",
  /** 根据话题名查询话题信息 */
  TopicInfo = "/api/wink/topic_info",
  /** 获取话题下的照片分页 */
  TopicPhotoList = "/api/wink/topic_photo_list",
  /** 无鉴权获取话题下的照片分页 */
  TopicPhotoListNoAuth = "/api/wink/topic_photo_list_no_auth",
  /** 创建帖子分享 */
  CreateShare = "/api/wink/share",
  /** 通过分享 ID 获取帖子详情 */
  ShareDetail = "/api/wink/share/detail",
  /** 获取当前用户的帖子分享列表 */
  ShareList = "/api/wink/share/list",
  /** 删除帖子分享 */
  DeleteShare = "/api/wink/share/delete",
}

router.get(WinkRouterPathEnum.List, getListController);
router.get(WinkRouterPathEnum.Random, getRandomListController);
router.get(WinkRouterPathEnum.ListNoAuth, getListNoAuthController);
router.get(WinkRouterPathEnum.Search, searchWinkController);
router.get(WinkRouterPathEnum.AllTopics, getAllTopicsController);
router.post(WinkRouterPathEnum.New, createWinkController);
router.delete(WinkRouterPathEnum.Delete, deleteWinkController);
router.put(WinkRouterPathEnum.Edit, editWinkController);
router.get(WinkRouterPathEnum.Detail, getWinkDetailController);
router.get(WinkRouterPathEnum.HideTopic, hideTopicController);
router.get(WinkRouterPathEnum.ShowTopic, showTopicController);
router.delete(WinkRouterPathEnum.DeleteTopic, deleteTopicController);
router.put(WinkRouterPathEnum.RenameTopic, renameTopicController);
router.post(WinkRouterPathEnum.Comment, createCommentController);
router.delete(WinkRouterPathEnum.DeleteComment, deleteCommentController);
router.get(WinkRouterPathEnum.GetComments, getCommentsController);
router.post(WinkRouterPathEnum.SetTopicBackground, setTopicBGController);
router.get(WinkRouterPathEnum.GetTopicBackground, getTopicBGController);
router.get(WinkRouterPathEnum.TopicInfo, getTopicInfoController);
router.get(WinkRouterPathEnum.TopicPhotoList, getTopicPhotoListController);
router.get(WinkRouterPathEnum.TopicPhotoListNoAuth, getTopicPhotoListNoAuthController);
router.post(WinkRouterPathEnum.CreateShare, createWinkShareController);
router.get(WinkRouterPathEnum.ShareDetail, getWinkShareDetailController);
router.get(WinkRouterPathEnum.ShareList, getWinkShareListController);
router.delete(WinkRouterPathEnum.DeleteShare, deleteWinkShareController);

export default router;
