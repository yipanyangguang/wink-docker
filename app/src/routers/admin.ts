import Router from "koa-router";

import {
  createMemberController,
  disableMemberController,
  listMembersController,
} from "@/controller/admin/members.controller";
import {
  getSettingsController,
  putSettingsController,
} from "@/controller/admin/settings.controller";
import adminOnly from "@/middleware/adminOnly";

const router = new Router();

export enum AdminRouterPathEnum {
  /** 成员列表 / 新增 / 禁用 */
  Members = "/api/admin/members",
  /** 维护开关 */
  Settings = "/api/admin/settings",
}

router.get(AdminRouterPathEnum.Members, adminOnly, listMembersController);
router.post(AdminRouterPathEnum.Members, adminOnly, createMemberController);
router.delete(AdminRouterPathEnum.Members, adminOnly, disableMemberController);
router.get(AdminRouterPathEnum.Settings, adminOnly, getSettingsController);
router.put(AdminRouterPathEnum.Settings, adminOnly, putSettingsController);

export default router;
