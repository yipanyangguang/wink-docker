import crypto from "crypto";

/** 只保留 URL / 文件系统都安全的字符，去掉全角破折号等跨环境坑 */
export const sanitizeFileName = (name: string) =>
  name.replace(/[^A-Za-z0-9._~-]/g, "-");

const pad = (value: number) => String(value).padStart(2, "0");

/**
 * @description 生成上传文件名（纯 ASCII，时间前缀 + 随机串）
 */
const generatePictureName = () => {
  const t = new Date();
  const prefix =
    `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}` +
    `_${pad(t.getHours())}-${pad(t.getMinutes())}-${pad(t.getSeconds())}~`;
  const randomString = crypto
    .createHash("md5")
    .update(`${Date.now()}-${Math.random().toString(36)}`)
    .digest("hex");

  return sanitizeFileName(`${prefix}${randomString}`);
};

export default generatePictureName;
