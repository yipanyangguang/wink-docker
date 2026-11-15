import md5 from 'md5';

/** 生成随机用户token */
const generateUserToken = (userName: string, password: string): string => {
  const timestamp = Date.now();
  return md5(`${userName}${md5(password)}${md5(timestamp)}`)
};

export default generateUserToken;
