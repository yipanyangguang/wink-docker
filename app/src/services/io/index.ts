import fs from "fs";
import GM from "gm";
import nodePath from "path";

import {
  COMPRESS_DIR,
  IMAGE_EXTENSIONS,
  MAX_UPLOAD_MB,
  STORAGE_DIR,
  VIDEO_EXTENSIONS,
} from "@/config/env";
import generatePictureName from "@/utils/generatePictureName";
import logger from "@/utils/logger";

// 容器里装的是 ImageMagick 6（convert / identify），不是 IM7 的 magick
const gm = GM.subClass({ imageMagick: true });

const ALLOWED_EXTENSIONS = new Set<string>([
  ...IMAGE_EXTENSIONS,
  ...VIDEO_EXTENSIONS,
]);
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

/** 上传校验失败单独一类错误，controller 据此返回可读的中文提示 */
export class UploadError extends Error {}

export const getFileExtension = (originalName: string) =>
  (originalName.split(".").pop() ?? "").toLowerCase();

export const isAllowedUploadName = (originalName: string) =>
  ALLOWED_EXTENSIONS.has(getFileExtension(originalName));

const assertUploadFile = (file?: UploadedFile) => {
  if (!file || !file.buffer?.length) {
    throw new UploadError("没有收到有效的上传文件");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadError(`文件不能超过 ${MAX_UPLOAD_MB}MB`);
  }
  const ext = getFileExtension(file.originalname);
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new UploadError("仅支持常见图片格式与 mp4 视频");
  }
  return ext;
};

/**
 * 上传统一分派：图片压缩成 webp；mp4 跳过压缩、原样落盘。
 * 解决了原实现「压缩分支下 mp4 只返回文件名、文件根本没写盘」的问题。
 */
const writeFile = async (params: IWriteFileParams) => {
  const { file } = params;
  const ext = assertUploadFile(file);
  const name = await generatePictureName();

  if ((VIDEO_EXTENSIONS as readonly string[]).includes(ext)) {
    const filename = `${name}.${ext}`;
    await fs.promises.writeFile(nodePath.join(STORAGE_DIR, filename), file.buffer);
    return filename;
  }

  return await compressImageByGM({
    fileBuffer: file.buffer,
    quality: 75,
  });
};

/** gm 压缩并写入 webp；任何一步失败都要 reject，不能静默返回一个不存在的文件名 */
export const compressImageByGM = async (params: ICompressImageGMPrams) => {
  const {
    fileBuffer,
    size,
    quality = 100,
    path = STORAGE_DIR,
    appointName,
  } = params;
  const { width } = await getImageSize(fileBuffer);
  // 有 size 参数时按等比缩放，且不超过原图宽度；没有 size 就不缩放
  const useSize = size ? Math.min(size, width) : undefined;
  const fileName = appointName ?? (await generatePictureName());
  const targetPath = nodePath.join(path, `${fileName}.webp`);

  return new Promise<string>((resolve, reject) => {
    let chain = gm(fileBuffer).autoOrient().quality(quality);
    if (useSize && useSize > 0) chain = chain.resize(useSize);
    chain.write(targetPath, (err) => {
      if (err) {
        logger.error({
          title: "compressImageByGM",
          message: "gm图片压缩失败",
          more: err,
        });
        reject(err);
        return;
      }
      resolve(`${fileName}.webp`);
    });
  });
};

const getImageSize = async (fileBuffer: Buffer) =>
  new Promise<GM.Dimensions>((resolve, reject) => {
    gm(fileBuffer).size((err, size) => {
      if (err) {
        logger.error({
          title: "getImageSize",
          message: "获取图片尺寸失败",
          more: err,
        });
        reject(err);
        return;
      }
      resolve(size);
    });
  });

/**
 * 通过访问路径判断对应的 webp 是否已生成。
 * /static/compress/2023-10-27-...<quality=10,size=400>.png
 */
export const hasWebpFile = async (url: string) => {
  const fileName = decodeURIComponent(url).match(/\/static\/compress\/(.*)\./)?.[1] ?? "";
  // 压缩名来自上传文件名，不允许出现路径分隔符或向上跳转
  if (!fileName || /[\\/]|\.\./.test(fileName)) {
    return { isHasWebpFile: false, redirectUrl: "" };
  }
  const filePath = nodePath.join(COMPRESS_DIR, `${fileName}.webp`);
  return {
    isHasWebpFile: fs.existsSync(filePath),
    redirectUrl: `/static/compress/${fileName}.webp`,
  };
};

/** 删除上传卷中的单个文件（P4 的清理任务会改为先移入 _trash） */
export const deleteFile = async (fileName: string) => {
  if (!fileName || /[\\/]|\.\./.test(fileName)) {
    throw new UploadError("非法文件名");
  }
  const filePath = nodePath.join(STORAGE_DIR, fileName);
  try {
    await fs.promises.unlink(filePath);
  } catch (err) {
    logger.error({
      title: "deleteFile",
      message: "删除文件失败",
      more: filePath,
    });
    throw err;
  }
};

export default writeFile;

interface ICompressImageGMPrams {
  fileBuffer: Buffer;
  /** 等比缩放的宽度 */
  size?: number;
  /** 图片质量 */
  quality?: number;
  /** 存储路径 */
  path?: string;
  /** 指定文件名（可含 compress/ 前缀） */
  appointName?: string;
}

/** 与 @koa/multer 的 File 结构兼容，避免为类型再引入一个运行时包 */
export interface UploadedFile {
  originalname: string;
  buffer: Buffer;
  size: number;
}

interface IWriteFileParams {
  file: UploadedFile;
}
