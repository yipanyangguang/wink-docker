export interface ChanelHeaderProps {
  /** 话题名称 */
  topic: string;
  /** 顶部固定模糊层使用的话题背景图 */
  backgroundImage?: string;
  /** 显示设置背景图按钮 */
  showSetBgBtn?: boolean;
  /** 点击设置背景图 */
  onSetBg?: () => void;
  /** 倒序按钮是否激活 */
  descActive?: boolean;
  /** 倒序按钮切换回调 */
  onDescChange?: (active: boolean) => void;
  /** 当前模式 (仅 ChanelBodyCommon 使用) */
  mode?: "list" | "photo";
  /** 模式切换回调 */
  onModeChange?: (mode: "list" | "photo") => void;
}
