import bcrypt from "bcryptjs";
import fs from "fs";
import { ObjectId } from "mongodb";

import { isAdminRole } from "@/config/admin";
import {
  ADMIN_PASSWORD,
  ADMIN_USERNAME,
  SITE_NAME,
  STORAGE_DIR,
} from "@/config/env";
import { UserRole, UserStatus } from "@/interface/mongoCollection/userRow";
import {
  ensureIndexes,
  pingDatabase,
  systemCollection,
  tokenCollection,
  userCollection,
} from "@/services/mongodb";
import { getNacosInfoAndRemark, setNacosInfo } from "@/services/nacos";
import { seedGuideContent } from "@/services/setup/seedGuide";

const INIT_KEY = "initialized";

/** 维护开关默认值：本轮只读写状态，不注册任何定时任务 */
const DEFAULT_MAINTENANCE = {
  dbBackup: false,
  cleanUnusedFiles: false,
};

export interface IMaintenanceSettings {
  dbBackup: boolean;
  cleanUnusedFiles: boolean;
}

export interface IHealthChecks {
  mongo: boolean;
  redis: boolean;
  storage: boolean;
}

/**
 * 模块级缓存：auth 中间件每个请求都会读初始化状态，
 * 首次查库后缓存，markInitialized() 更新，避免反复查库。
 */
let initializedCache: boolean | null = null;

/** 文档不存在或 value 非 true 都视为未初始化 */
export const getInitialized = async (): Promise<boolean> => {
  if (initializedCache !== null) return initializedCache;
  const doc = await systemCollection.findOne({ key: INIT_KEY });
  initializedCache = doc?.value === true;
  return initializedCache;
};

export const markInitialized = () => {
  initializedCache = true;
};

const isDuplicateKeyError = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  (error as { code?: number }).code === 11000;

/** 新建用户参数校验：返回错误文案，合法时返回 null */
export const validateNewUser = (
  userName: unknown,
  password: unknown,
): string | null => {
  if (typeof userName !== "string" || typeof password !== "string") {
    return "参数不合法";
  }
  const name = userName.trim();
  if (name.length < 2 || name.length > 30) {
    return "用户名长度需为 2~30 个字符";
  }
  if (password.length < 6) {
    return "密码长度至少 6 位";
  }
  return null;
};

export interface ICreateUserParams {
  userName: string;
  password: string;
  role: UserRole;
}

export interface ICreatedUser {
  userId: number;
  userName: string;
  role: UserRole;
}

/** 新建用户的唯一入口：绝不返回 password */
export const createUser = async ({
  userName,
  password,
  role,
}: ICreateUserParams): Promise<ICreatedUser> => {
  const invalid = validateNewUser(userName, password);
  if (invalid) throw new Error(invalid);

  const name = userName.trim();
  // 先查一次，给出明确的业务错误；唯一索引兜底并发
  if (await userCollection.findOne({ userName: name })) {
    throw new Error("用户名已存在");
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const last = await userCollection.findOne({}, { sort: { userId: -1 } });
    const userId = (last?.userId ?? 0) + 1;
    try {
      await userCollection.insertOne({
        _id: new ObjectId(),
        userName: name,
        password: hashedPassword,
        avatar: "",
        userId,
        role,
        status: "active" as UserStatus,
      });
      return { userId, userName: name, role };
    } catch (error) {
      if (!isDuplicateKeyError(error)) throw error;
      // 用户名被并发占用则报业务错误，否则是 userId 冲突，重新取最大值重试
      if (await userCollection.findOne({ userName: name })) {
        throw new Error("用户名已存在");
      }
    }
  }

  throw new Error("创建用户失败，请重试");
};

export interface IInitializeResult {
  ok: boolean;
  reason?: "already_initialized";
  user?: ICreatedUser;
}

/**
 * 初始化系统（幂等）：以 system.initialized 由 false → true 的一次
 * updateOne 抢占作为唯一赢家，两人同时点只会建一个管理员。
 */
export const initializeSystem = async ({
  userName,
  password,
}: {
  userName: string;
  password: string;
}): Promise<IInitializeResult> => {
  await systemCollection.updateOne(
    { key: INIT_KEY },
    { $setOnInsert: { key: INIT_KEY, value: false } },
    { upsert: true },
  );

  const claim = await systemCollection.updateOne(
    { key: INIT_KEY, value: false },
    { $set: { value: true } },
  );
  if (claim.matchedCount !== 1) {
    return { ok: false, reason: "already_initialized" };
  }

  try {
    await ensureIndexes();
    const user = await createUser({ userName, password, role: "admin" });
    await setNacosInfo("noAuthWinkTopics", [], "开放话题");
    await setNacosInfo("maintenance", { ...DEFAULT_MAINTENANCE }, "维护开关");
    // 首次初始化写入「欢迎使用」话题与引导瞬间（内部自兜底，失败不影响初始化）
    await seedGuideContent(user.userId);
    markInitialized();
    return { ok: true, user };
  } catch (error) {
    // 中途失败必须把标记回滚成 false，否则系统永久不可用
    await systemCollection.updateOne(
      { key: INIT_KEY },
      { $set: { value: false } },
    );
    initializedCache = false;
    throw error;
  }
};

/** 环境中预置管理员账号时，启动阶段自动完成初始化 */
export const bootstrapAdminFromEnv = async () => {
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) return;
  if (await getInitialized()) return;
  await initializeSystem({
    userName: ADMIN_USERNAME,
    password: ADMIN_PASSWORD,
  });
};

/** 轻量健康探测：每项单独 try/catch，失败置 false 且不抛 */
export const getHealthChecks = async (): Promise<IHealthChecks> => {
  const checks: IHealthChecks = {
    mongo: false,
    redis: false,
    storage: false,
  };

  try {
    await pingDatabase();
    checks.mongo = true;
  } catch {
    checks.mongo = false;
  }

  try {
    // 动态加载，避免仅 require 路由模块时就建立 Redis 连接
    const { pingRedis } = await import("@/services/redis");
    await pingRedis();
    checks.redis = true;
  } catch {
    checks.redis = false;
  }

  try {
    fs.accessSync(STORAGE_DIR, fs.constants.W_OK);
    checks.storage = true;
  } catch {
    checks.storage = false;
  }

  return checks;
};

/** 向导/状态页可读的系统信息 */
export const getSystemStatus = async () => {
  const initialized = await getInitialized();
  const checks = await getHealthChecks();

  let hasAdmin = false;
  try {
    hasAdmin = (await userCollection.countDocuments({ role: "admin" })) > 0;
  } catch {
    hasAdmin = false;
  }

  return {
    initialized,
    adminPreset: Boolean(ADMIN_USERNAME && ADMIN_PASSWORD),
    adminUserName: ADMIN_USERNAME,
    hasAdmin,
    checks,
    siteName: SITE_NAME,
    version: "1.0.0",
  };
};

export type DisableMemberResult =
  | "ok"
  | "cannot_disable_self"
  | "cannot_disable_admin"
  | "not_found";

/** 禁用成员：清会话，保留其帖子/评论/头像 */
export const disableMember = async (
  userId: number,
  operatorUserId: number,
): Promise<DisableMemberResult> => {
  if (userId === operatorUserId) return "cannot_disable_self";

  const target = await userCollection.findOne(
    { userId },
    { projection: { role: 1 } },
  );
  if (!target) return "not_found";
  if (isAdminRole(target.role)) return "cannot_disable_admin";

  await userCollection.updateOne(
    { userId },
    { $set: { status: "disabled" as UserStatus } },
  );
  await tokenCollection.deleteMany({ userId });
  return "ok";
};

/** 读维护开关，缺失或字段非法时回落到默认值 */
export const getMaintenanceSettings =
  async (): Promise<IMaintenanceSettings> => {
    const doc = await getNacosInfoAndRemark("maintenance");
    const info = doc?.info;
    const source: Record<string, unknown> =
      info && typeof info === "object"
        ? (info as Record<string, unknown>)
        : {};
    return {
      dbBackup:
        typeof source.dbBackup === "boolean"
          ? source.dbBackup
          : DEFAULT_MAINTENANCE.dbBackup,
      cleanUnusedFiles:
        typeof source.cleanUnusedFiles === "boolean"
          ? source.cleanUnusedFiles
          : DEFAULT_MAINTENANCE.cleanUnusedFiles,
    };
  };

/** 合并后写回维护开关；任务注册由 settings 控制器调用 syncJobsWithSettings 完成 */
export const updateMaintenanceSettings = async (
  patch: Partial<IMaintenanceSettings>,
): Promise<IMaintenanceSettings> => {
  const merged = { ...(await getMaintenanceSettings()), ...patch };
  await setNacosInfo("maintenance", merged, "维护开关");
  return merged;
};
