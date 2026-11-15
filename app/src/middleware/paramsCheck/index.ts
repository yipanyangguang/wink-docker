import Koa from "koa";
import checkListConfig from "./checkList";
import handleValidator from "@/utils/handleValidatorMsg";
import logger from "@/utils/logger";

const paramsCheckMiddleware = async (ctx: Koa.Context, next: Koa.Next) => {
  const { path, method } = ctx.request;
  const checkItem = checkListConfig.find((item) => item.path === path && item.method === method);

  // 判断 ctx.request.query 上是否有 page 和 pageSize 有则转换为number
  if (ctx.request.query.page) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    ctx.request.query.page = Number(ctx.request.query.page);
  }
  if (ctx.request.query.pageSize) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    ctx.request.query.pageSize = Number(ctx.request.query.pageSize);
  }

  // todo 这边没必要,后续将这类接口从 [] => data:[] 即可
  if (Array.isArray(ctx.request.body)) {
    ctx.request.body = {
      RAW_ARRAY: ctx.request.body,
    }
  }

  if (checkItem) {
    const { rule } = checkItem;

    if (method === 'POST' || method === 'PUT') {
      const ValidatorRes = await handleValidator({
        data: ctx.request.body as object,
        rule,
        ctx,
      });
      if (!ValidatorRes) {
        logger.error({
          title: "paramsCheckMiddleware",
          message: "校验失败",
          more: {
            data: ctx.request.body,
            rule,
          },
        });
        return;
      }
    } else if (method === 'GET' || method === 'DELETE') {
      const query = Object.assign({}, ctx.request.query);
      const ValidatorRes = await handleValidator({
        data: query,
        rule,
        ctx,
      });
      if (!ValidatorRes) {
        logger.error({
          title: "paramsCheckMiddleware",
          message: "校验失败",
          more: {
            data: ctx.request.body,
            rule,
          },
        });
        return;
      }
    }
  }

  await next();
}

export default paramsCheckMiddleware;