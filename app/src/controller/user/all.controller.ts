import { IDefaultContext } from "@/interface";
import allServices from "@/services/user/all";
import { handleSuccess } from "@/utils/errorCode";

/** 获取所有的用户信息 */
const allController = async (ctx: IDefaultContext) => {
  const res = await allServices();

  const { userId } = ctx.state.curUserInfo;

  // 过滤掉 userId 相同的数据
  const result = res.filter((item) => item.userId !== userId);

  ctx.body = handleSuccess(result);
};

export default allController;
