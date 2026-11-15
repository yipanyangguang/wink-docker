import { MongoClient } from "mongodb";

import { MONGO_DB, MONGO_URI } from "@/config/env";
import { INacosDocument } from "@/interface/mongoCollection/nacos";
import { ISystemDocument } from "@/interface/mongoCollection/system";
import { ITokenListDocument } from "@/interface/mongoCollection/tokenList";
import { ITopicDocument } from "@/interface/mongoCollection/topic";
import { IUserRowDocument } from "@/interface/mongoCollection/userRow";
import { IWinkCommentDocument } from "@/interface/mongoCollection/winkComment";
import { IWinkListDocument } from "@/interface/mongoCollection/winkList";
import logger from "@/utils/logger";

const client = new MongoClient(MONGO_URI, {
  serverSelectionTimeoutMS: 5000,
});
const db = client.db(MONGO_DB);

/** 新包只使用这 7 个集合 */
export const tokenCollection = db.collection<ITokenListDocument>("token_list");
export const userCollection = db.collection<IUserRowDocument>("user_row");
export const winkListCollection = db.collection<IWinkListDocument>("wink_list");
export const winkCommentCollection =
  db.collection<IWinkCommentDocument>("wink_comment");
export const topicCollection = db.collection<ITopicDocument>("topics");
export const nacosCollection = db.collection<INacosDocument>("nacos");
/** 初始化标记与版本信息（P2 的 /setup 使用） */
export const systemCollection = db.collection<ISystemDocument>("system");

let connected = false;

/** 索引方向：升序 */
const ASC = 1 as const;

/** 幂等建立全部索引：启动阶段与初始化向导都会调用 */
export const ensureIndexes = async () => {
  await Promise.all([
    tokenCollection.createIndex({ token: 1 }, { unique: true, sparse: true }),
    userCollection.createIndex({ userName: 1 }, { unique: true }),
    userCollection.createIndex({ userId: ASC }, { unique: true }),
    winkListCollection.createIndex({ topics: 1 }),
    winkListCollection.createIndex({ userId: ASC }),
    winkListCollection.createIndex({ time: -1 }),
    winkListCollection.createIndex({ topics: 1, time: -1, _id: -1 }),
    winkCommentCollection.createIndex({ winkId: 1, time: -1 }),
    winkCommentCollection.createIndex({ userId: ASC }),
    topicCollection.createIndex({ topic: 1 }, { unique: true }),
    topicCollection.createIndex({ showIndex: 1, lastTime: -1 }),
    nacosCollection.createIndex({ key: 1 }, { unique: true }),
    systemCollection.createIndex({ key: 1 }, { unique: true }),
  ]);
  logger.info({ title: "MongoDB", message: "索引就绪" });
};

/** 启动阶段显式 await，避免「进程起来了但数据库还没连上」 */
export const connectDatabase = async () => {
  if (connected) return client;
  await client.connect();
  connected = true;
  logger.info({
    title: "MongoDB",
    message: "Connected successfully to MongoDB",
    more: { db: MONGO_DB },
  });

  try {
    await ensureIndexes();
  } catch (err) {
    // 索引失败不阻断服务启动，但必须可见
    logger.error({ title: "MongoDB", message: "创建索引失败", more: err });
  }

  return client;
};

/** 健康检查 / 向导自检用（P2、P3 复用） */
export const pingDatabase = async () => {
  await db.command({ ping: 1 });
};

export const closeDatabase = async () => {
  if (connected) await client.close();
  connected = false;
};

export { client, db };
