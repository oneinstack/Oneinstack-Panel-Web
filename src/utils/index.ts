import { dayjs } from "element-plus";
export function timeFormat(
  time: string | number | Date,
  format: string = "YYYY-MM-DD HH:mm:ss"
) {
  return dayjs(time).format(format);
}
