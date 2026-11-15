import Koa from "koa";

import writeFile, { UploadError } from "@/services/io";
import { ErrorCodeEnum, handleError } from "@/utils/errorCode";

const uploaderImage = async (ctx: Koa.Context) => {
  const file = ctx.request.file;

  try {
    const fileName = await writeFile({ file });
    ctx.body = {
      error: 0,
      msg: "上传成功",
      data: fileName,
    };
  } catch (error) {
    // 失败时 error 必须非 0，否则前端会拿一个空文件名当成功
    const isValidationError = error instanceof UploadError;
    ctx.status = isValidationError ? 400 : 500;
    ctx.body = handleError(
      ErrorCodeEnum.BUSINESS_ERROR,
      isValidationError ? error.message : "上传失败，请稍后重试",
    );
  }
};

export default uploaderImage;
