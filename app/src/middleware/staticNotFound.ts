import Koa from "koa";

import { compressImageByGM, hasWebpFile } from "@/services/io";
import analyticPath from "@/utils/analyticPath";
import logger from "@/utils/logger";

/**
 * /static/ 资源兜底。
 * nginx 直出上传卷，只有 /static/compress/ 未命中时回源到这里：
 * 已有 webp → 302 过去；没有 → 用 gm 现场生成 webp 再 302。
 */
const staticNotFoundMiddleware = async (ctx: Koa.Context, next: Koa.Next) => {
  if (ctx.url.indexOf("/static") !== 0) {
    await next();
    return;
  }

  if (ctx.url.indexOf("/static/compress/") === 0) {
    const { isHasWebpFile, redirectUrl } = await hasWebpFile(ctx.url);
    if (isHasWebpFile && redirectUrl) {
      ctx.status = 302;
      ctx.redirect(redirectUrl);
      return;
    }

    try {
      const { size, quality, rawFileNameBuffer, compressFileName } =
        await analyticPath(ctx.url);

      const fileName = await compressImageByGM({
        fileBuffer: rawFileNameBuffer,
        size,
        quality,
        appointName: compressFileName,
      });

      ctx.status = 302;
      ctx.redirect(`/static/${fileName}`);
      return;
    } catch (error) {
      logger.error({
        title: "staticNotFoundMiddleware",
        message: "压缩图片失败",
        more: error,
      });
      ctx.status = 404;
      return;
    }
  }

  // 其余 /static/ 缺失资源直接 404，不再 302 到并不存在的 404.png
  ctx.status = 404;
};

export default staticNotFoundMiddleware;
