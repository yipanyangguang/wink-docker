import { ObjectId } from "mongodb";

import { topicCollection, winkListCollection } from "@/services/mongodb";

export interface ITopicPhotoListParams {
  topicId: string;
  page?: number;
  pageSize?: number;
}

export interface ITopicPhotoItem {
  _id: string;
  photoPath: string;
  content: string;
  sourceWinkId: string;
  imageIndex: number;
  time: number;
}

export interface ITopicPhotoListResult {
  list: ITopicPhotoItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  topic: string;
}

const getTopicName = async (topicId: string) => {
  if (!ObjectId.isValid(topicId)) return null;
  const topic = await topicCollection.findOne({
    _id: ObjectId.createFromHexString(topicId),
  });
  return topic?.topic || null;
};

export const getTopicNameById = getTopicName;

export const getTopicPhotoList = async ({
  topicId,
  page: rawPage,
  pageSize: rawPageSize,
}: ITopicPhotoListParams): Promise<ITopicPhotoListResult | null> => {
  const topic = await getTopicName(topicId);
  if (!topic) return null;

  const page = Math.max(1, Number(rawPage) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(rawPageSize) || 40));
  const pipeline = [
    {
      $match: {
        topics: topic,
        images: { $exists: true, $ne: [] },
      },
    },
    {
      $unwind: {
        path: "$images",
        includeArrayIndex: "imageIndex",
      },
    },
    {
      $sort: {
        time: -1,
        _id: -1,
        imageIndex: 1,
      },
    },
    {
      $facet: {
        data: [
          { $skip: (page - 1) * pageSize },
          { $limit: pageSize },
          {
            $project: {
              _id: 1,
              photoPath: "$images",
              content: 1,
              imageIndex: 1,
              time: 1,
            },
          },
        ],
        total: [{ $count: "value" }],
      },
    },
  ];

  const [result] = await winkListCollection.aggregate(pipeline).toArray();
  const total = result?.total?.[0]?.value || 0;
  const list: ITopicPhotoItem[] = (result?.data || []).map((item: any) => {
    const sourceWinkId = item._id.toString();
    return {
      _id: `${sourceWinkId}:${item.imageIndex}`,
      photoPath: item.photoPath,
      content: item.content || "",
      sourceWinkId,
      imageIndex: Number(item.imageIndex) || 0,
      time: item.time,
    };
  });

  return {
    list,
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
    topic,
  };
};
