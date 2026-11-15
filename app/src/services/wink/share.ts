import crypto from "crypto";
import { ObjectId } from "mongodb";

import { IOperator, isOwnerOrAdmin } from "@/config/admin";
import redis from "@/services/redis";
import { winkListCollection } from "@/services/mongodb";
import { getWinkDetail } from "@/services/wink";

const SHARE_TTL_SECONDS = 60 * 60 * 24 * 3;
const SHARE_KEY_PREFIX = "wink:share:";
const USER_SHARE_KEY_PREFIX = "wink:share:user:";

interface WinkShareRecord {
  winkId: string;
  userId: number;
  createdAt: number;
  expiresAt: number;
}

const getShareKey = (shareId: string) => `${SHARE_KEY_PREFIX}${shareId}`;
const getUserShareKey = (userId: number) => `${USER_SHARE_KEY_PREFIX}${userId}`;

export const createWinkShare = async (winkId: string, userId: number) => {
  if (!ObjectId.isValid(winkId)) return null;
  const wink = await winkListCollection.findOne({ _id: new ObjectId(winkId) });
  if (!wink) return null;

  const now = Date.now();
  const record: WinkShareRecord = {
    winkId,
    userId,
    createdAt: now,
    expiresAt: now + SHARE_TTL_SECONDS * 1000,
  };

  let shareId = "";
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const candidate = crypto.randomBytes(16).toString("hex");
    const created = await redis.set(
      getShareKey(candidate),
      JSON.stringify(record),
      "EX",
      SHARE_TTL_SECONDS,
      "NX",
    );
    if (created === "OK") {
      shareId = candidate;
      break;
    }
  }

  if (!shareId) throw new Error("创建分享链接失败");
  await redis.zadd(getUserShareKey(userId), record.expiresAt, shareId);
  return { shareId, expiresAt: record.expiresAt };
};

const readShareRecord = async (shareId: string) => {
  const value = await redis.get(getShareKey(shareId));
  if (!value) return null;
  try {
    return JSON.parse(value) as WinkShareRecord;
  } catch {
    await redis.del(getShareKey(shareId));
    return null;
  }
};

export const getWinkShareDetail = async (shareId: string) => {
  const record = await readShareRecord(shareId);
  if (!record || record.expiresAt <= Date.now()) return null;
  const detail = await getWinkDetail(record.winkId);
  if (!detail) return null;
  return { ...detail, shareExpiresAt: record.expiresAt };
};

export const getWinkShareList = async (userId: number) => {
  await redis.zremrangebyscore(getUserShareKey(userId), "-inf", Date.now());
  const shareIds = await redis.zrevrangebyscore(
    getUserShareKey(userId),
    "+inf",
    Date.now(),
  );
  const result: Array<{
    shareId: string;
    winkId: string;
    contentPreview: string;
    image: string;
    expiresAt: number;
    createdAt: number;
  }> = [];

  for (const shareId of shareIds) {
    const record = await readShareRecord(shareId);
    if (!record) {
      await redis.zrem(getUserShareKey(userId), shareId);
      continue;
    }
    const wink = await winkListCollection.findOne({ _id: new ObjectId(record.winkId) });
    if (!wink) {
      await redis.del(getShareKey(shareId));
      await redis.zrem(getUserShareKey(userId), shareId);
      continue;
    }
    result.push({
      shareId,
      winkId: record.winkId,
      contentPreview: (wink.content || "").replace(/\s+/g, " ").trim().slice(0, 56),
      image: wink.images?.[0] || "",
      expiresAt: record.expiresAt,
      createdAt: record.createdAt,
    });
  }
  return result;
};

/** 删除分享：仅创建者本人或管理员（管理员可删所有分享） */
export const deleteWinkShare = async (shareId: string, operator: IOperator) => {
  const record = await readShareRecord(shareId);
  if (!record) return false;
  if (!isOwnerOrAdmin(operator, record.userId)) return false;
  await redis.del(getShareKey(shareId));
  // 从分享真正所属用户的有序集合里移除，而不是操作者的
  await redis.zrem(getUserShareKey(record.userId), shareId);
  return true;
};
