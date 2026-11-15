import { MethodEnum } from "./commonRule";

/**
 * /api/base/uploader_image 是 multipart 上传，文件校验由 multer 与 io 服务完成；
 * nacos / open_topic 的参数在 controller 内自行校验。
 */
const baseRule: {
  [key in string]: {
    _method: MethodEnum;
    [key: string]: string;
  };
} = {};

export default baseRule;
