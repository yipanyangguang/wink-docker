import schedule, { Job } from "node-schedule";

import { getMaintenanceSettings } from "@/services/setup";
import logger from "@/utils/logger";

import { runBackupJob } from "./backup";
import { runCleanJob } from "./clearUnusedFiles";

/** 备份任务：每天 0:00（进程本地时间，容器统一注入 TZ） */
const BACKUP_CRON = "0 0 * * *";
/** 清理任务：每天 3:00 */
const CLEAN_CRON = "0 3 * * *";

let backupJob: Job | null = null;
let cleanJob: Job | null = null;

/** 任务本体必须 try/catch：异常不能让 node-schedule 静默吞掉 */
const wrapJob = (name: string, task: () => Promise<unknown>) => async () => {
  try {
    await task();
  } catch (err) {
    logger.error({
      title: name,
      message: "任务执行失败",
      more: err,
    });
  }
};

export const registerBackupJob = () => {
  cancelBackupJob();
  backupJob = schedule.scheduleJob(
    "wink-db-backup",
    BACKUP_CRON,
    wrapJob("dbBackupJob", runBackupJob),
  );
  logger.info({
    title: "jobRegistry",
    message: `已注册数据库备份任务（每天 0:00）`,
  });
};

export const cancelBackupJob = () => {
  if (backupJob) {
    backupJob.cancel();
    backupJob = null;
    logger.info({
      title: "jobRegistry",
      message: "已注销数据库备份任务",
    });
  }
};

export const registerCleanJob = () => {
  cancelCleanJob();
  cleanJob = schedule.scheduleJob(
    "wink-clean-files",
    CLEAN_CRON,
    wrapJob("clearFileTask", runCleanJob),
  );
  logger.info({
    title: "jobRegistry",
    message: `已注册无引用文件清理任务（每天 3:00）`,
  });
};

export const cancelCleanJob = () => {
  if (cleanJob) {
    cleanJob.cancel();
    cleanJob = null;
    logger.info({
      title: "jobRegistry",
      message: "已注销无引用文件清理任务",
    });
  }
};

/**
 * 按维护开关同步任务注册状态，幂等：
 * - 服务启动时调用一次；
 * - 管理端改开关后立即调用，即时注册/注销，无需重启容器。
 */
export const syncJobsWithSettings = async () => {
  const settings = await getMaintenanceSettings();
  if (settings.dbBackup) {
    registerBackupJob();
  } else {
    cancelBackupJob();
  }
  if (settings.cleanUnusedFiles) {
    registerCleanJob();
  } else {
    cancelCleanJob();
  }
  return settings;
};
