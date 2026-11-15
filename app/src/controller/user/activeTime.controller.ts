import { IDefaultContext } from "@/interface";
import { userCollection } from "@/services/mongodb";
import { getUserActiveTime } from "@/services/user";
import { handleSuccess } from "@/utils/errorCode";

const activeTimeController = async (ctx: IDefaultContext) => {
  const users = await userCollection
    .find({}, { projection: { userId: true } })
    .toArray();

  const res = await Promise.all(
    users.map(async (user) => ({
      userId: user.userId,
      lastUseTime: await getUserActiveTime(user.userId),
    })),
  );

  ctx.body = handleSuccess(res);
};

export default activeTimeController;
