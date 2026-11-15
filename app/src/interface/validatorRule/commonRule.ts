/**
 * 公共校验规则 单个参数规则生成器
*/
export const signStringValidator = (key: string, size?: number) => {
  if (size) {
    return {
      [key]: `required|string|minLength:${size}|maxLength:${size}`,
    }
  } else {
    return {
      [key]: "required|string",
    }
  }
};

export const signStringSize24Validator = (key: string) => {
  return {
    [key]: `required|string|minLength:${24}|maxLength:${24}`,
  }
}

/**
 * @description 必填且字段长度是24
*/
export const SIGN_STRING_LENGTH_24_RULE = 'required|string|minLength:24|maxLength:24'

export enum MethodEnum {
  GET = "GET",
  POST = "POST",
  DELETE = "DELETE",
  PUT = "PUT",
}