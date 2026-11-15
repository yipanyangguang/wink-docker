import { topicCollection, winkListCollection } from "../mongodb";

/** 记录或者更新topic信息 */
export const recordTopicInfo = async (topic: string) => {
  const res = await topicCollection.updateOne(
    {
      topic,
    },
    {
      $set: {
        topic,
        lastTime: Date.now(),
      },
    },
    {
      upsert: true,
    }
  );
  return res;
};

/** 修改话题的是否在首页显示的状态 */
export const changeTopicStatus = async (topic: string, status: boolean) => {
  await topicCollection.updateOne(
    {
      topic,
    },
    {
      $set: {
        showIndex: status,
      },
    }
  );
};

/** 仅删除话题，不会删除帖子 */
export const deleteTopic = async (topic: string) => {
  await topicCollection.deleteOne({
    topic,
  });
};

/** 修改话题背景图 */
export const changeTopicBackground = async (topic: string, background: string) => {
  const res = await topicCollection.updateOne(
    {
      topic,
    },
    {
      $set: {
        background,
      },
    }
  );
  return res;
};

/** 获取话题的背景图 */
export const getTopicBackground = async (topic: string) => {
  const res = await topicCollection.findOne(
    {
      topic,
    },
    {
      projection: {
        _id: 0,
        background: 1,
      },
    }
  );
  return res?.background || null;
};

type RenameTopicResult =
  | { status: "renamed"; updatedWinkCount: number }
  | { status: "not_found" | "duplicate" | "same" };

/** 修改话题名称，并同步更新所有帖子中的话题引用。 */
export const renameTopic = async (
  topic: string,
  newTopic: string,
): Promise<RenameTopicResult> => {
  const oldName = topic.trim();
  const nextName = newTopic.trim();
  if (oldName === nextName) return { status: "same" };

  const current = await topicCollection.findOne({ topic: oldName });
  if (!current) return { status: "not_found" };
  if (await topicCollection.findOne({ topic: nextName })) {
    return { status: "duplicate" };
  }

  const winkResult = await winkListCollection.updateMany(
    { topics: oldName },
    [
      {
        $set: {
          topics: {
            $map: {
              input: "$topics",
              as: "itemTopic",
              in: {
                $cond: [{ $eq: ["$$itemTopic", oldName] }, nextName, "$$itemTopic"],
              },
            },
          },
        },
      },
    ],
  );

  const topicResult = await topicCollection.updateOne(
    { _id: current._id, topic: oldName },
    { $set: { topic: nextName } },
  );
  if (!topicResult.modifiedCount) {
    throw new Error("话题名称更新失败，请重试");
  }

  return { status: "renamed", updatedWinkCount: winkResult.modifiedCount };
};
