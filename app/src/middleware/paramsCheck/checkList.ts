import baseRule from "@/interface/validatorRule/base";
import { MethodEnum } from "@/interface/validatorRule/commonRule";
import userRule from "@/interface/validatorRule/user";
import winkRule from "@/interface/validatorRule/wink";

const generateCheckListConfig = (rule: {
  [key in string]: {
    _method: MethodEnum;
    [key: string]: string;
  };
}) => {
  const keys = Object.keys(rule);
  return keys.map((key) => {
    const { _method, ...restParams } = rule[key];

    return {
      path: key,
      method: _method,
      rule: restParams,
    };
  });
};

const checkListConfig = [
  ...generateCheckListConfig(winkRule),
  ...generateCheckListConfig(userRule),
  ...generateCheckListConfig(baseRule),
];

export default checkListConfig;
