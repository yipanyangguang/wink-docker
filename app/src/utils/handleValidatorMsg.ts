import Koa from "koa";
/**
 * @description 处理验证器返回的错误信息
 */
import { Validator } from "node-input-validator";

import { ErrorCodeEnum, handleError } from "./errorCode";
import logger from "./logger";

const handleValidatorMsg = (v: Validator) => {
  const errors = v.errors;
  const keys = Object.keys(errors);
  const msg = keys.map((key) => {
    return errors[key].message;
  });
  return msg.join(",");
};

interface IHandleValidatorParams {
  data: object;
  rule: object;
  ctx: Koa.Context;
}

const handleValidator = async (params: IHandleValidatorParams) => {
  const v = new Validator(params.data, params.rule);

  try {
    const res = await v.check();
    if (!res) {
      params.ctx.body = handleError(
        ErrorCodeEnum.PARAMS_VALIDATION_FAILED,
        handleValidatorMsg(v),
      );
    }

    return res;
  } catch (err) {
    logger.error({
      title: "handleValidator",
      message: "验证器出错",
      more: err,
    });
  }
};

export default handleValidator;
