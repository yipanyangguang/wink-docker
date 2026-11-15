import fs from "fs";
import nodePath from "path";

import { STORAGE_DIR } from "@/config/env";

/**
 * @description 解析图片路径用于图片压缩
 * /static/compress/2023-5-10-22-44-22~617f22<size=100,quality=20>.jpeg
 * → { compressFileName: "compress/2023-5-10-22-44-22~617f22<size=100,quality=20>", size:100, quality:20 }
 */
const analyticPath = async (rawPath: string) => {
  // 浏览器会把 <quality=...,size=...> 编码成 %3C / %3E，必须完整解码
  let path: string;
  try {
    path = decodeURIComponent(rawPath);
  } catch {
    throw new Error("非法的压缩图片路径");
  }
  const ext = path.match(/\.(\w+)$/)?.[1] ?? "";

  // 获取 compress/ 与 < 之间的原始文件名
  const name = path.match(/compress\/(.*)</)?.[1];
  if (!name || /[\\/]|\.\./.test(name)) {
    throw new Error("非法的压缩图片路径");
  }

  const rawParams = path.match(/<(.*)>/)?.[1] ?? "";
  const params = rawParams
    .split(",")
    .filter(Boolean)
    .reduce(
      (pre, cur) => {
        const [key, value] = cur.split("=");
        return { ...pre, [key]: value };
      },
      {} as Record<string, string>,
    );

  const filePath = [
    nodePath.join(STORAGE_DIR, `${name}.${ext}`),
    nodePath.join(STORAGE_DIR, `${name}.png`),
    nodePath.join(STORAGE_DIR, `${name}.jpg`),
    nodePath.join(STORAGE_DIR, `${name}.jpeg`),
    nodePath.join(STORAGE_DIR, `${name}.webp`),
  ];

  const firstExistFilePath = filePath.find((item) => fs.existsSync(item));
  if (!firstExistFilePath) {
    throw new Error(`文件不存在: ${filePath[0]}`);
  }

  const buffer = fs.readFileSync(firstExistFilePath);

  // /static 之后的内容去掉扩展名，作为压缩产物的文件名（含 compress/ 前缀）
  const compressFileNameWithExt = path.match(/\/static\/(.*)/)?.[1];
  const compressFileName = compressFileNameWithExt?.split(".")[0];
  if (!compressFileName || /[\\/]|\.\./.test(compressFileName.replace(/^compress\//, ""))) {
    throw new Error("非法的压缩产物文件名");
  }

  return {
    compressFileName,
    size: params.size ? Number(params.size) : undefined,
    quality: Number(params.quality) || 100,
    rawFileNameBuffer: buffer,
  };
};

export default analyticPath;
