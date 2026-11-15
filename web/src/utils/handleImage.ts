export default (path: string) => `/static/${path}`;

/** 获取缩略图 */
export const thumbImage = (path: string, HD?: boolean) => {
  try {
    const { name } = splitFileName(path);
    if (HD) {
      return `/static/compress/${name}<quality=50,size=800>.webp`;
    }
    return `/static/compress/${name}<quality=10,size=400>.webp`;
  } catch {
    return `/static/${path}`;
  }
};

/** 拆分文件名称和文件扩展名 */
const splitFileName = (fileName: string) => {
  const index = fileName.lastIndexOf(".");
  return {
    name: fileName.slice(0, index),
    ext: fileName.slice(index + 1),
  };
};
