import { Context } from "koa";

import { getWinkShareList } from "@/services/wink/share";
import { handleSuccess } from "@/utils/errorCode";

const getWinkShareListController = async (ctx: Context) => {
  const userId = ctx.state.curUserInfo.userId;
  ctx.body = handleSuccess(await getWinkShareList(userId));
};

export default getWinkShareListController;
