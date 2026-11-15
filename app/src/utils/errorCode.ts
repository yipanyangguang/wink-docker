export enum ErrorCodeEnum {
  /** 成功 */
  SUCCESS = 0,
  /** 参数校验不通过 */
  PARAMS_VALIDATION_FAILED = -1,
  /** token过期 */
  TOKEN_EXPIRED = -2,
  /** 正常业务失败 */
  BUSINESS_ERROR = -3,
  /** 没有权限 */
  NO_PERMISSION = -4,
  /** 系统尚未初始化 */
  NOT_INITIALIZED = -5,
  /** 未知错误 */
  UNKNOWN_ERROR = -100,
}

const errorMsgMap = {
  [ErrorCodeEnum.SUCCESS]: "success",
  [ErrorCodeEnum.PARAMS_VALIDATION_FAILED]: "参数校验不通过",
  [ErrorCodeEnum.TOKEN_EXPIRED]: "token过期",
  [ErrorCodeEnum.BUSINESS_ERROR]: "fail",
  [ErrorCodeEnum.NO_PERMISSION]: "没有权限",
  [ErrorCodeEnum.NOT_INITIALIZED]: "系统尚未初始化",
  [ErrorCodeEnum.UNKNOWN_ERROR]: "未知错误",
}

/**
 * @description: 通用成功的响应
*/
export const handleSuccess = (data: unknown, total?: number) => {
  let obj: { error: ErrorCodeEnum; msg: string; data: unknown; total?: number } = {
    error: ErrorCodeEnum.SUCCESS,
    msg: errorMsgMap[ErrorCodeEnum.SUCCESS],
    data,
  }
  if (total !== undefined) {
    obj = {
      ...obj,
      total: total,
    }
  }
  return obj
}

/**
 * @description: 通用失败的响应
*/
export const handleError = (error: ErrorCodeEnum, msg?: string) => {
  return {
    error,
    msg: msg || errorMsgMap[error],
  }
}
