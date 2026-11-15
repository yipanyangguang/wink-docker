import { UploadProps } from "antd";

export interface UserCenterInfoProps {
  /** 当前是否是自己的个人中心 */
  isMeCenter: boolean;
  /** 当前用户头像 */
  avatar: string;
  /** 当前用户名称 */
  userName: string;
  /** 当前上传组件的配置属性 */
  uploadProps: UploadProps;
}