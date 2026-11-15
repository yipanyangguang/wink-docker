import { ObjectId } from "mongodb";

export interface IWinkListDocument { 
  _id: ObjectId;
  userId: number;
  content: string;
  images: string[];
  video: {
    path: string;
    cover: string;
  },
  time: number;
  location: string;
  topics: string[];
}