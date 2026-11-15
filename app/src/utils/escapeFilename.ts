/**
 * @description 文件名转义,方便使用终端选择文件
 */
const escapeFilename = (filename: string) => {
  // eslint-disable-next-line no-useless-escape
  const specialChars = /([\s\*\?\[\]\(\)&|;<>\'\"\\$#])/g;
  return filename.replace(specialChars, "\\$1");
};

export default escapeFilename;
