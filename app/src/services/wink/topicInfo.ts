import { topicCollection } from "@/services/mongodb";

export const getTopicInfo = async (topic: string) => {
  const result = await topicCollection.findOne({ topic });
  if (!result) return null;
  return {
    _id: result._id.toHexString(),
    topic: result.topic,
  };
};
