import { ObjectId } from "mongodb";

import { winkListCollection } from "../mongodb";

interface ISendWink {
  userId: number;
  content?: string;
  images?: string[];
  video?: {
    path: string;
    cover: string;
  };
  location?: string;
  topics?: string[];
  time?: number;
}

/** 发表帖子,返回当前帖子ID */
const sendWink = async (params: ISendWink) => {
  const {
    content = "",
    images = [],
    video = { path: "", cover: "" },
    location = "",
    topics = [],
  } = params;
  const now = Math.floor(Date.now() / 1000);
  // 未来时间一律钳制为当前时间
  const effectiveTime = Math.max(0, Math.min(params.time ?? now, now));

  const newId = new ObjectId();
  await winkListCollection.insertOne({
    _id: newId,
    userId: params.userId,
    content,
    images,
    video,
    location,
    topics,
    time: effectiveTime,
  });

  return newId.toHexString();
};

export default sendWink;
