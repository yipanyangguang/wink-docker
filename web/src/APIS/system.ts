import {
  axiosDelete,
  axiosGet,
  axiosPost,
  axiosPut,
} from "./myaxios.js";

/** 统一响应包装 */
export interface ApiResponse<T> {
  error: number;
  msg: string;
  data: T;
}

/** GET /api/setup/status */
export interface SetupStatus {
  initialized: boolean;
  adminPreset: boolean;
  adminUserName: string;
  hasAdmin: boolean;
  checks: {
    mongo: boolean;
    redis: boolean;
    storage: boolean;
  };
  siteName: string;
  version: string;
}

/** POST /api/setup/init */
export interface SetupInitResult {
  userName: string;
  userId: number;
  role: "admin";
}

/** GET /api/admin/members */
export interface Member {
  userId: number;
  userName: string;
  avatar: string;
  role: "admin" | "member";
  status: "active" | "disabled";
}

/** POST /api/admin/members */
export interface AddMemberResult {
  userId: number;
  userName: string;
  role: "member";
}

/** GET / PUT /api/admin/settings */
export interface SiteSettings {
  dbBackup: boolean;
  cleanUnusedFiles: boolean;
}

export type SettingsPatch = Partial<SiteSettings>;

/** 启动守卫用：失败不弹 toast */
export const getSetupStatus = () =>
  axiosGet("/api/setup/status", { showError: false }) as Promise<
    ApiResponse<SetupStatus>
  >;

export const setupInit = (userName: string, password: string) =>
  axiosPost("/api/setup/init", { userName, password }) as Promise<
    ApiResponse<SetupInitResult>
  >;

export const getMembers = () =>
  axiosGet("/api/admin/members") as Promise<ApiResponse<Member[]>>;

export const addMember = (userName: string, password: string) =>
  axiosPost("/api/admin/members", { userName, password }) as Promise<
    ApiResponse<AddMemberResult>
  >;

export const removeMember = (userId: number) =>
  axiosDelete(`/api/admin/members?userId=${userId}`) as Promise<
    ApiResponse<null>
  >;

export const getSettings = () =>
  axiosGet("/api/admin/settings") as Promise<ApiResponse<SiteSettings>>;

export const saveSettings = (patch: SettingsPatch) =>
  axiosPut("/api/admin/settings", patch) as Promise<ApiResponse<SiteSettings>>;
