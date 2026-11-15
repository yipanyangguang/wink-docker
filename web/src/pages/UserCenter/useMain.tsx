import { useEffect, useState } from "react";
import {
  getMyUserInfo,
  getUserInfo,
  setAvatar as setMyAvatar,
  logout,
} from "@/APIS/user";
import { thumbImage } from "@/utils/handleImage";
import windowFunc from "@/utils/windowFunc";
import { UploadProps, message } from "antd";
import { ensureAuthenticatedResponse } from "@/APIS/myaxios";
import { getRouteSearchParams } from "@/utils/routes";

const useMain = () => {
  const query = getRouteSearchParams();
  const queryUserId = query.get("id");

  const [isMeCenter, setIsMeCenter] = useState(false);
  const [userName, setUserName] = useState<string>("加载中...");
  const [avatar, setAvatar] = useState("");

  const init = async () => {
    // 获取当前页面query中的userid的用户信息
    const { userId, avatar, userName } = queryUserId
      ? await getUserInfo(Number(queryUserId))
      : { userId: 0, avatar: undefined, userName: undefined };

    // 获取自己的用户信息
    const {
      userId: myUserId,
      avatar: myAvatar,
      userName: myUserName,
    } = await getMyUserInfo();

    setIsMeCenter(!queryUserId || userId === myUserId);
    setUserName(userName ?? myUserName);
    setAvatar(avatar || myAvatar ? thumbImage(avatar ?? myAvatar) : "/icons/icon-192.png");
  };

  const uploadProps: UploadProps = {
    name: "image",
    action: "/api/base/uploader_image",
    headers: {
      token: localStorage.getItem("token") || "",
    },
    accept: "image/*",
    maxCount: 1,
    listType: "text",
    onChange: async (info) => {
      const { status } = info.file;
      if (status === "done") {
        ensureAuthenticatedResponse(info.file.response);
        const url = info.file.response.data;
        setAvatar(thumbImage(url));
        await setMyAvatar(url);
        console.log("更新成功");
      }
    },
  };

  const loginOut = async () => {
    try {
      await logout();
    } finally {
      localStorage.removeItem("token");
      windowFunc.replace("#/login");
    }
  };

  useEffect(() => {
    init();
  }, []);

  return {
    // 是否是自己的个人中心
    isMeCenter,
    // 当前个人中心的用户名
    userName,
    // 当前个人中心的头像
    avatar,
    // 返回上传图片的组件的属性
    uploadProps,
    // 退出登录的函数
    loginOut,
  };
};

export default useMain;
