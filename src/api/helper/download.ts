/**
 * 从 Content-Disposition 响应头中解析下载文件名。
 * @param disposition Content-Disposition 响应头内容
 */
export const filenameFromDisposition = (disposition: string) => {
  const encodedName = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encodedName) {
    try {
      return decodeURIComponent(encodedName);
    } catch {
      return encodedName;
    }
  }
  return disposition.match(/filename="?([^";]+)"?/i)?.[1] || "";
};

/**
 * 将 Blob 转换为临时 URL，并触发浏览器下载。
 * @param blob 需要下载的二进制内容
 * @param disposition 服务端返回的 Content-Disposition
 * @param fallbackName 无法解析服务端文件名时使用的备用名称
 */
export const downloadBlob = (
  blob: Blob,
  disposition: string,
  fallbackName: string,
) => {
  const objectURL = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectURL;
  anchor.download = filenameFromDisposition(disposition) || fallbackName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(objectURL), 1000);
};
