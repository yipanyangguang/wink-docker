import "./bootstrap";

import fs from "fs";
import Koa from "koa";
import bodyParser from "koa-bodyparser";
import koaMount from "koa-mount";
import koaRange from "koa-range";
import koaStatic from "koa-static";

import {
  APP_PORT,
  BACKUP_DIR,
  COMPRESS_DIR,
  STORAGE_DIR,
  TRASH_DIR,
} from "@/config/env";
import authMiddleware from "@/middleware/auth";
import staticNotFoundMiddleware from "@/middleware/staticNotFound";
import adminRouter from "@/routers/admin";
import baseRouter from "@/routers/base";
import setupRouter from "@/routers/setup";
import userRouter from "@/routers/user";
import winkRouter from "@/routers/wink";
import { bootstrapAdminFromEnv } from "@/services/setup";
import { syncJobsWithSettings } from "@/services/maintenance/jobRegistry";
import { connectDatabase } from "@/services/mongodb";

import { IDefaultContext } from "./interface";
import paramsCheckMiddleware from "./middleware/paramsCheck";
import logger from "./utils/logger";

const ensureDirectories = () => {
  [STORAGE_DIR, COMPRESS_DIR, TRASH_DIR, BACKUP_DIR].forEach((dir) => {
    fs.mkdirSync(dir, { recursive: true });
  });
};

const start = async () => {
  ensureDirectories();
  await connectDatabase();
  await bootstrapAdminFromEnv();
  // 按维护开关注册 0:00 备份 / 3:00 清理两个任务（默认关）
  await syncJobsWithSettings();

  const app = new Koa<Koa.DefaultState, IDefaultContext>();

  app.on("error", (err) => {
    logger.error({
      title: "server",
      message: "server error",
      more: err,
    });
  });

  app.use(koaRange);

  // nginx 直出 /static/，只有 /static/compress/ 未命中时会回源到这里
  app.use(koaMount("/static/compress", koaStatic(COMPRESS_DIR)));
  app.use(koaMount("/static", koaStatic(STORAGE_DIR)));

  app.use(staticNotFoundMiddleware);
  app.use(bodyParser());
  app.use(authMiddleware);
  app.use(paramsCheckMiddleware);

  app.use(userRouter.routes());
  app.use(winkRouter.routes());
  app.use(baseRouter.routes());
  app.use(setupRouter.routes());
  app.use(adminRouter.routes());

  app.listen(APP_PORT);
  logger.info({
    title: "server",
    message: "server start",
    more: { port: APP_PORT, storageDir: STORAGE_DIR, backupDir: BACKUP_DIR },
  });
};

void start().catch((err) => {
  logger.error({ title: "server", message: "启动失败", more: err });
  process.exitCode = 1;
});
