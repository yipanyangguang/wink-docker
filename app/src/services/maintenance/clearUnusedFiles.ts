import fs from "fs";
import path from "path";

import { STORAGE_DIR, TRASH_DIR } from "@/config/env";
import {
  topicCollection,
  userCollection,
  winkCommentCollection,
  winkListCollection,
} from "@/services/mongodb";
import logger from "@/utils/logger";

/**
 * 判断文件是否仍被数据库引用。
 * 全量引用判定只有 6 处字段：wink_list.images / video.path / video.cover、
 * wink_comment.image、topics.background、user_row.avatar。
 */
const isUsed = async (filename: string) => {
  const [wink, comment, topic, user] = await Promise.all([
    winkListCollection.countDocuments({
      $or: [
        { images: filename },
        { "video.path": filename },
        { "video.cover": filename },
      ],
    }),
    winkCommentCollection.countDocuments({ image: filename }),
    topicCollection.countDocuments({ background: filename }),
    userCollection.countDocuments({ avatar: filename }),
  ]);
  return wink + comment + topic + user > 0;
};

/** 目标重名时加序号，避免覆盖回收目录里已有的同名文件 */
const uniqueTrashPath = (filename: string) => {
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  let dest = path.join(TRASH_DIR, filename);
  let index = 1;
  while (fs.existsSync(dest)) {
    dest = path.join(TRASH_DIR, `${base}-${index}${ext}`);
    index += 1;
  }
  return dest;
};

/**
 * 清理无引用文件：只扫 STORAGE_DIR 顶层文件（不递归），
 * compress/ 与 _trash/ 是子目录天然不参与；无引用者移入 _trash/，
 * 不物理删除，可手工找回。
 * 核心逻辑独立成函数，cron 只在 jobRegistry 包一层调度，外部可手动调用。
 */
export const runCleanJob = async () => {
  if (!fs.existsSync(STORAGE_DIR)) {
    logger.warn({
      title: "clearFileTask",
      message: `上传目录不存在，跳过清理：${STORAGE_DIR}`,
    });
    return { moved: 0 };
  }

  fs.mkdirSync(TRASH_DIR, { recursive: true });

  const entries = fs.readdirSync(STORAGE_DIR, { withFileTypes: true });
  let moved = 0;

  for (const entry of entries) {
    // 只处理顶层普通文件，目录（compress/、_trash/）跳过
    if (!entry.isFile()) continue;
    if (entry.name === ".DS_Store") continue;

    if (await isUsed(entry.name)) continue;

    const source = path.join(STORAGE_DIR, entry.name);
    const dest = uniqueTrashPath(entry.name);
    // rename 移动而非 unlinkSync 物理删除，误判可从 _trash 找回
    fs.renameSync(source, dest);
    moved += 1;
    logger.warn({
      title: "clearFileTask",
      message: `无引用文件移入回收目录：${entry.name} -> ${path.basename(dest)}`,
    });
  }

  logger.info({
    title: "clearFileTask",
    message: `清理完成，共移入回收目录 ${moved} 个文件`,
    more: { trashDir: TRASH_DIR, moved },
  });

  return { moved };
};
