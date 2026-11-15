import bcrypt from "bcryptjs";
import md5 from "md5";

import { tokenCollection, userCollection } from "@/services/mongodb";
import redis from "../redis";

/** 验证账户密码是否匹配 */
export const verifyUserPassword = async (
  userName: string,
  password: string,
) => {
  const userInfo = await userCollection.findOne({ userName });
  if (!userInfo) return null;
  // 禁用成员不能登录
  if (userInfo.status === "disabled") return null;

  // 迁移：如果仍是 md5 存储(32位十六进制)，先用 md5 验证，通过后升级为 bcrypt
  const storedPassword = userInfo.password as string;
  const isMd5Hash = /^[a-f0-9]{32}$/i.test(storedPassword);
  if (isMd5Hash) {
    if (storedPassword !== md5(md5(password))) return null;
    const newHash = await bcrypt.hash(password, 12);
    await userCollection.updateOne({ userName }, { $set: { password: newHash } });
    return userInfo;
  }

  const isMatch = await bcrypt.compare(password, storedPassword);
  return isMatch ? userInfo : null;
};

interface IRecordUserTokenParams {
  userAgent: string;
  token: string;
  userId: number;
}
/** 记录token和其他信息 */
export const recordUserToken = async (params: IRecordUserTokenParams) => {
  const { userAgent, token, userId } = params;
  const res = await tokenCollection.findOneAndUpdate(
    { userAgent, userId },
    {
      $set: {
        loginTime: Date.now(),
        token,
      },
    },
    { upsert: true },
  );
  return res;
};

/** 登出：删除当前会话（设备管理的批量接口已移除，这里只保留登出必需的能力） */
export const deleteUserToken = async (token: string, userId: number) => {
  await tokenCollection.deleteOne({ token, userId });
};

/**
 * 更新用户头像
 */
export const updateUserAvatar = async (userId: number, avatar: string) => {
  return await userCollection.findOneAndUpdate(
    { userId },
    {
      $set: {
        avatar,
      },
    },
  );
};

/**
 * 更新用户密码
 */
export const updateUserPassword = async (userId: number, newPassword: string) => {
  const hash = await bcrypt.hash(newPassword, 12);
  return await userCollection.findOneAndUpdate(
    { userId },
    {
      $set: {
        password: hash,
      },
    },
  );
};

/**
 * 获取用户名称和头像
 */
export const getUserInfo = async (userId: number) => {
  const res = await userCollection.findOne({
    userId,
  });
  return res;
};

/**
 * 获取所有用户信息
 */
export const getAllUserInfo = async () => {
  const res = await userCollection.find({}).toArray();
  return res;
};

/**
 * 更新token的最后使用时间
 */
export const updateTokenLastUseTime = async (token: string) => {
  const curTime = Date.now();
  // 7天过期
  redis.set(token, curTime, 'EX', 60 * 60 * 24 * 7);
};

/**
 * @description 获取用户的所有token（活跃时间统计依赖）
 */
export const getUserTokens = async (userId: number) => {
  const res = await tokenCollection
    .find(
      { userId },
      {
        projection: {
          _id: 0,
        },
      },
    )
    .toArray();

  for (let i = 0; i < res.length; i++) {
    const lastUseTime = await redis.get(res[i].token)
    res[i].lastUseTime = Number(lastUseTime) ?? 0;
  }

  return res;
};

/**
 * @description 获取指定用户的最近的一条活跃时间
 * 数据有很多条，只要时间最近的一条
*/
export const getUserActiveTime = async (userId: number) => {
  const res = await getUserTokens(userId);
  // 找出res所有数据中 lastUseTime 最大的一条
  let maxTime = 0;
  for (let i = 0; i < res.length; i++) {
    if (res[i].lastUseTime > maxTime) {
      maxTime = res[i].lastUseTime;
    }
  }
  return maxTime;
};
