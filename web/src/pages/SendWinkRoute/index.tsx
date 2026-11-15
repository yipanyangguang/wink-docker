import SendWink from "@/pages/SendWink";
import { getRouteSearchParams } from "@/utils/routes";

const SendWinkRoute = () => {
  const topic = getRouteSearchParams().get("topic") ?? "";
  const editWinkId = getRouteSearchParams().get("editWinkId") ?? "";

  if (editWinkId) {
    return <SendWink prefixTopic={topic || undefined} />;
  }

  return <SendWink prefixTopic={topic} />;
};

export default SendWinkRoute;
