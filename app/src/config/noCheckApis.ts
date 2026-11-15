import { UserRouterPathEnum } from "@/routers/user";
import { BaseRouterPathEnum } from "@/routers/base";
import { WinkRouterPathEnum } from "@/routers/wink";
import { SetupRouterPathEnum } from "@/routers/setup";

/** 未初始化阶段仍可访问的路径：健康检查与初始化向导 */
export const setupFreePaths = [
  SetupRouterPathEnum.Health,
  SetupRouterPathEnum.Status,
  SetupRouterPathEnum.Init,
] as Array<string>;

/**
 * 不需要验证的接口列表
 * 这些接口不需要token验证，也不需要权限校验
 */
export const noCheckApis = [
  UserRouterPathEnum.Login,
  WinkRouterPathEnum.ListNoAuth,
  WinkRouterPathEnum.TopicInfo,
  WinkRouterPathEnum.TopicPhotoListNoAuth,
  WinkRouterPathEnum.GetTopicBackground,
  WinkRouterPathEnum.ShareDetail,
  BaseRouterPathEnum.OpenTopic,
  ...setupFreePaths,
] as Array<string>;
