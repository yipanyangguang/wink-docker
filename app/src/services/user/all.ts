import { userCollection } from "../mongodb";

/**
 * @description 获取所有用户的信息
 */
const allServices = async () => {
  return await userCollection.find({}, {
    // 白名单投影：绝不返回 password / secret
    projection: {
      userName: true,
      userId: true,
      avatar: true,
      role: true,
      status: true
    }
  }).toArray();
};

export default allServices;
