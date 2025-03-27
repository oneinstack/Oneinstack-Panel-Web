export function checkIPStr(rule: any, value: string, callback: any) {
  const ipRegex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])(?:\s*,\s*(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9]))*$/;
  if (!ipRegex.test(value)) {
    callback(new Error("请输入正确的IP地址"));
  } else {
    callback();
  }
}
export function checkLink(rule: any, value: string, callback: any) {
  const linkRegex = /^https?:\/\/[\w\-]+(\.[\w\-]+)+[/#?]?.*$/;
  if (value && !linkRegex.test(value)) {
    callback(new Error("请输入正确的URL地址"));
  } else {
    callback();
  }
}
