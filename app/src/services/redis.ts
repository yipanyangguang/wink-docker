import Redis from "ioredis";

import {
  REDIS_DB,
  REDIS_HOST,
  REDIS_PASSWORD,
  REDIS_PORT,
} from "@/config/env";
import logger from "@/utils/logger";

const redis = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD || undefined,
  db: REDIS_DB,
  // 容器启动时 redis 可能还没就绪，保留有限重试而不是无限刷错误日志
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 200, 5000),
});

redis.on("connect", () => {
  logger.info({
    title: "redis",
    message: "connect to Redis successfully",
  });
});

redis.on("error", (error) => {
  logger.error({
    title: "redis",
    message: "Error connecting to Redis",
    more: error,
  });
});

/** 健康检查 / 向导自检用（P2、P3 复用） */
export const pingRedis = async () => {
  return await redis.ping();
};

export default redis;
