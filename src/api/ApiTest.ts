import http from "@/api";

export const ApiTest = {
  /** 上传文件 */
  upload: (obj: any) => {
    const { onProgress, ...data } = obj || {};
    return http.post("/system/upload", data, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress(event) {
        if (!onProgress) return;
        const total = event.total || 0;
        onProgress(
          total ? Math.round((event.loaded / total) * 100) : 0,
          event.loaded,
          total,
        );
      },
    });
  },

  /** 获取系统时间 */
  getTime: (obj: any) => {
    return http.get("/system/getTime", obj);
  },
};
