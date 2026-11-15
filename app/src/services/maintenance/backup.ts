import fs from "fs";
import path from "path";
import { EJSON } from "bson";

import { BACKUP_DIR } from "@/config/env";
import {
  nacosCollection,
  systemCollection,
  tokenCollection,
  topicCollection,
  userCollection,
  winkCommentCollection,
  winkListCollection,
} from "@/services/mongodb";
import logger from "@/utils/logger";

/** 保留最近 7 份备份，更早的整个目录删除 */
const KEEP_COUNT = 7;

const BACKUP_DIR_PATTERN = /^wink-\d{4}-\d{2}-\d{2}$/;

const pad2 = (n: number) => String(n).padStart(2, "0");

const todayFolderName = () => {
  const now = new Date();
  return `wink-${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(
    now.getDate(),
  )}`;
};

/** 删除超出保留份数的旧备份目录（按目录名排序，名字即日期） */
const pruneOldBackups = () => {
  if (!fs.existsSync(BACKUP_DIR)) return;
  const folders = fs
    .readdirSync(BACKUP_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && BACKUP_DIR_PATTERN.test(entry.name))
    .map((entry) => entry.name)
    .sort();
  const excess = folders.length - KEEP_COUNT;
  for (let i = 0; i < excess; i += 1) {
    const target = path.join(BACKUP_DIR, folders[i]);
    fs.rmSync(target, { recursive: true });
    logger.warn({
      title: "dbBackupJob",
      message: `删除过期备份 ${folders[i]}`,
    });
  }
};

/**
 * 导出 7 个集合为 EJSON（保留 _id / ObjectId / Date 类型，恢复不退化成字符串）。
 * 核心逻辑独立成函数，cron 只在 jobRegistry 包一层调度，外部可手动调用。
 *
 * 注意：只备份数据库，不含图片；图片在 STORAGE_DIR，恢复时必须一起带走。
 */
export const runBackupJob = async () => {
  const folderName = todayFolderName();
  const targetDir = path.join(BACKUP_DIR, folderName);
  fs.mkdirSync(targetDir, { recursive: true });

  const collections = [
    tokenCollection,
    userCollection,
    winkListCollection,
    topicCollection,
    nacosCollection,
    winkCommentCollection,
    systemCollection,
  ];

  // 顺序 await：修掉旧实现 forEach(async) 导致的「任务已返回、文件没写完」
  for (const collection of collections) {
    const data = await collection.find().toArray();
    fs.writeFileSync(
      path.join(targetDir, `${collection.collectionName}.json`),
      EJSON.stringify(data, undefined, 2),
      { mode: 0o600 },
    );
  }

  pruneOldBackups();

  logger.info({
    title: "dbBackupJob",
    message: `数据库备份完成：${collections.length} 个集合 -> ${targetDir}`,
    more: { folder: folderName, collections: collections.length },
  });

  return { folder: folderName, collections: collections.length, dir: targetDir };
};
