import dayjs, { ConfigType } from "dayjs";

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

/** 格式化为 YYYY-MM-DD HH:mm(周几) */
export const formatDateTimeWithWeekday = (value: ConfigType) => {
  const date = dayjs(value);
  return `${date.format("YYYY-MM-DD HH:mm")}（周${WEEKDAYS[date.day()]}）`;
};

export const truncateString = (str: string, maxLength: number) => {
  if (str.length > maxLength) {
    return str.substring(0, maxLength) + "...";
  } else {
    return str;
  }
};
