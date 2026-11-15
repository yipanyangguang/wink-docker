import { IUserRowDocument } from "@/interface/mongoCollection/userRow";
import { tokenCollection, userCollection } from "@/services/mongodb";

/**
 * @description 验证token是否合法，并且返回token对应的用户信息
 */
const verifyToken = async (token: string) => {
  const documentsCount = await tokenCollection.countDocuments({ token });
  if (!token || !documentsCount) {
    return {
      error: -1,
      msg: "身份验证失败",
    };
  }

  const { userId } =
    (await tokenCollection.findOne({
      token,
    })) || {};

  const userInfo = await userCollection.findOne<IUserRowDocument>({
    userId,
  });

  // 禁用成员不能继续持有有效会话
  if (userInfo?.status === "disabled") {
    return {
      error: -1,
      msg: "身份验证失败",
    };
  }

  return {
    error: null,
    msg: "success",
    data: userInfo,
  };
};

export default verifyToken;
