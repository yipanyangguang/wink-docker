import multer from "@koa/multer";
import Router from "koa-router";

import uploaderImage from "@/controller/base/uploader";
import openTopicController from "@/controller/base/openTopic.controller";
import {
  getNacosContentController,
  setNacosContentController,
} from "@/controller/nacos/nacos";
import { isAllowedUploadName, MAX_UPLOAD_BYTES, UploadError } from "@/services/io";
import { ErrorCodeEnum, handleError } from "@/utils/errorCode";

const router = new Router();
const upload = multer({
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!isAllowedUploadName(file.originalname)) {
      callback(new UploadError("仅支持常见图片格式与 mp4 视频"), false);
      return;
    }
    callback(null, true);
  },
});
const uploadSingleImage = upload.single("image");

export enum BaseRouterPathEnum {
  /** 上传图片 */
  UploaderImage = "/api/base/uploader_image",
  /** 获取nacos的内容 */
  NacosContent = "/api/base/nacos",
  /** 获取开放话题列表 */
  OpenTopic = "/api/base/open_topic",
}

router.post(
  BaseRouterPathEnum.UploaderImage,
  async (ctx, next) => {
    try {
      await uploadSingleImage(ctx, next);
    } catch (error) {
      const tooLarge =
        error instanceof Error && error.name === "MulterError";
      ctx.status = tooLarge ? 413 : 400;
      ctx.body = handleError(
        ErrorCodeEnum.BUSINESS_ERROR,
        error instanceof UploadError
          ? error.message
          : tooLarge
            ? "上传文件超出大小限制"
            : "上传失败，请稍后重试",
      );
    }
  },
  uploaderImage,
);
router.get(BaseRouterPathEnum.NacosContent, getNacosContentController);
router.post(BaseRouterPathEnum.NacosContent, setNacosContentController);
router.get(BaseRouterPathEnum.OpenTopic, openTopicController);

export default router;
