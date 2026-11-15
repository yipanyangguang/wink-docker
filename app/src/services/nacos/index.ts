import { nacosCollection } from "../mongodb";

/** 新包只允许这两个配置项，避免通用配置中心被当成任意 KV 使用 */
export const NACOS_KEYS = ["noAuthWinkTopics", "maintenance"] as const;
export type NacosKey = (typeof NACOS_KEYS)[number];

export const isAllowedNacosKey = (key: string): key is NacosKey =>
  (NACOS_KEYS as readonly string[]).includes(key);

/** 获取内容 */
export const getNacosInfoAndRemark = async (key: string) => {
  return await nacosCollection.findOne({ key });
};

/** 判断话题是否允许免鉴权访问瞬间内容（开放话题与无鉴权照片墙共用这一套判定） */
export const isNoAuthWinkTopic = async (topic: string) => {
  const data = await getNacosInfoAndRemark("noAuthWinkTopics");
  return Array.isArray(data?.info) && data.info.includes(topic);
};

/** 存储/更新内容 */
export const setNacosInfo = async (
  key: string,
  info: object,
  remark: string,
) => {
  await nacosCollection.updateOne(
    { key },
    { $set: { info, key, remark } },
    { upsert: true },
  );
  return await getNacosInfoAndRemark(key);
};
