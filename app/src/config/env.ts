/**
 * 集中式运行配置。
 *
 * 唯一读取 process.env 的地方。默认值按 compose 内的固定值给出：
 * 服务名即主机名（mongo / redis）、数据卷固定挂 /data/uploads 与 /data/backups。
 * 安装者只需在 .env 里配置对外端口、两个宿主机目录与可选的管理员账号。
 */
import path from "path";

const readString = (key: string, fallback: string) => {
  const value = process.env[key];
  return value === undefined || value === "" ? fallback : value;
};

const readPositiveInt = (key: string, fallback: number) => {
  const value = Number(process.env[key]);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
};

const readInt = (key: string, fallback: number) => {
  const value = Number.parseInt(process.env[key] ?? "", 10);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
};

export const APP_PORT = readPositiveInt("APP_PORT", 3000);
export const NODE_ENV = readString("NODE_ENV", "production");
export const TZ = readString("TZ", "Asia/Shanghai");
export const SITE_NAME = readString("SITE_NAME", "瞬间");
/** 预置管理员账号：两者都配置时，启动时自动完成初始化 */
export const ADMIN_USERNAME = readString("ADMIN_USERNAME", "");
export const ADMIN_PASSWORD = readString("ADMIN_PASSWORD", "");

export const MONGO_HOST = readString("MONGO_HOST", "mongo");
export const MONGO_PORT = readPositiveInt("MONGO_PORT", 27017);
export const MONGO_DB = readString("MONGO_DB", "wink");
export const MONGO_USER = readString("MONGO_USER", "");
export const MONGO_PASSWORD = readString("MONGO_PASSWORD", "");

/** root 用户建在 admin 库，连接业务库时必须显式 authSource=admin */
export const MONGO_URI = (() => {
  const custom = process.env.MONGO_URI;
  if (custom) return custom;
  const hasAuth = Boolean(MONGO_USER && MONGO_PASSWORD);
  const auth = hasAuth
    ? `${encodeURIComponent(MONGO_USER)}:${encodeURIComponent(MONGO_PASSWORD)}@`
    : "";
  const query = hasAuth
    ? "?authSource=admin&maxPoolSize=20"
    : "?maxPoolSize=20";
  return `mongodb://${auth}${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}${query}`;
})();

export const REDIS_HOST = readString("REDIS_HOST", "redis");
export const REDIS_PORT = readPositiveInt("REDIS_PORT", 6379);
export const REDIS_PASSWORD = process.env.REDIS_PASSWORD || "";
export const REDIS_DB = readInt("REDIS_DB", 0);

/** 上传文件根目录，nginx 与 app 必须挂同一个宿主机目录 */
export const STORAGE_DIR = path.resolve(readString("STORAGE_DIR", "/data/uploads"));
export const COMPRESS_DIR = path.join(STORAGE_DIR, "compress");
export const TRASH_DIR = path.join(STORAGE_DIR, "_trash");
/** 数据库 JSON 备份目录 */
export const BACKUP_DIR = path.resolve(readString("BACKUP_DIR", "/data/backups"));
export const MAX_UPLOAD_MB = readPositiveInt("MAX_UPLOAD_MB", 100);

/** 上传扩展名白名单（小写） */
export const IMAGE_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "bmp",
] as const;
export const VIDEO_EXTENSIONS = ["mp4"] as const;
