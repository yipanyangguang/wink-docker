export interface ChanelBodyCommonProps {
  /** 话题名称 */
  topic: string;
  /** 当前显示模式 */
  mode: "list" | "photo";
  /** 未登录模式 */
  noAuth?: boolean;
  /** 是否倒序请求 */
  descActive?: boolean;
}
