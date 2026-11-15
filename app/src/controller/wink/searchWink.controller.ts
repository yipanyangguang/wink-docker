import { IWinkRuleInterface } from '@/interface/validatorInterface/wink';
import { WinkRouterPathEnum } from '@/routers/wink';
import searchWinkService from '@/services/wink/search';
import { Context } from 'koa';

const searchWinkController = async (ctx: Context) => {
  const params = ctx.request.query as unknown as IWinkRuleInterface[WinkRouterPathEnum.Search];
  const { data, total } = await searchWinkService(params);
  ctx.body = {
    error: 0,
    msg: 'success',
    data,
    total,
  }
}

export default searchWinkController;