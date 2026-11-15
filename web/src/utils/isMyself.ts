/**
 * @description 检查该用户是否为当前用户
 */
const isMyself = (userId: number | string) => {
  const myUserId = JSON.parse(localStorage.getItem("myInfo") ?? "{}").userId;
  if (myUserId === 1) return true;
  return myUserId === userId;
};

export default isMyself;
