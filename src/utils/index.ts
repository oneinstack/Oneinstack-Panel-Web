import { dayjs } from "element-plus";
export function timeFormat(
  time: string | number | Date,
  format: string = "YYYY-MM-DD HH:mm:ss"
) {
  return dayjs(time).format(format);
}
export const fileType = {
  image: [".jpg", ".peg", ".png", ".gif",".svg",".jpeg"],
  video: [".mp4", ".avi", ".rmvb", ".flv", ".mkv"],
  audio: [".mp3", ".wav", ".flac", ".aac"],
  pdf: [".pdf"],
  word: [".doc", ".docx"],
  excel: [".xls", ".xlsx"],
  ppt: [".ppt", ".pptx"],
  zip: [".zip", ".rar", ".7z"],
  txt: [".txt"],
  html: [".html"],
  js: [".js"],
  css: [".css"],
  json: [".json"],
  xml: [".xml"],
  md: [".md"],
  sql: [".sql"],
  java: [".java"],
  php: [".php"],
  python: [".py"],
  c: [".c"],
  cpp: [".cpp"],
  csharp: [".cs"],
  go: [".go"],
  ruby: [".rb"],
  perl: [".pl"],
  lua: [".lua"],
  swift: [".swift"],
  kotlin: [".kt"],
  typescript: [".ts"],
  javascript: [".js"],
  bash: [".sh"],
  powershell: [".ps1"],
}
export function getFileType(fileName: string) {
  const ext = fileName.split(".").pop();
  for (const key in fileType) {
    if (fileType[key as keyof typeof fileType].includes(`.${ext}`)) {
      return key;
    }
  }
  return "other";
}
