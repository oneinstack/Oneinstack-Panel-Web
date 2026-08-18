import http from "@/api";

export const fileApi = {
  /** 获取文件列表 */
  getFileList: (obj: any) => {
    return http.post("/ftp/list", obj);
  },
  /** 获取当前用户收藏列表 */
  getFileFavorites: () => {
    return http.get("/ftp/favorites");
  },
  /** 收藏文件或目录 */
  favoriteFile: (obj: { path: string }) => {
    return http.post("/ftp/favorite", obj);
  },
  /** 取消收藏文件或目录 */
  cancelFileFavorite: (obj: { path?: string; id?: number }) => {
    return http.post("/ftp/favorite/cancel", obj);
  },
  /** 读取目录树 */
  getFileTree: (obj: { path?: string } = {}) => {
    return http.post("/ftp/tree", obj);
  },
  /** 搜索服务器文件或目录 */
  searchFiles: (obj: {
    path: string;
    query: string;
    type?: "all" | "file" | "dir";
    maxResults?: number;
    maxDepth?: number;
  }) => {
    return http.post("/ftp/search", obj);
  },
  /** 获取文件操作记录 */
  getFileOperations: (obj?: {
    page?: number;
    pageSize?: number;
    q?: string;
    action?: string;
    outcome?: "success" | "failure" | "";
    username?: string;
  }) => {
    return http.get("/ftp/operations", obj);
  },
  /** 读取文本文件 */
  getFileContent: (obj: { path: string }) => {
    return http.post("/ftp/content", obj);
  },
  /** 为当前登录会话创建短期图片预览票据 */
  createImagePreviewTicket: (obj: { path: string }) => {
    return http.post("/ftp/preview-ticket", obj);
  },
  /** 保存文本文件 */
  saveFileContent: (obj: {
    path: string;
    content: string;
    revision?: string;
  }) => {
    return http.post("/ftp/save", obj);
  },
  /** 创建文件或文件夹 */
  createFile: (obj: any) => {
    return http.post("/ftp/create", obj);
  },
  /** 删除文件或文件夹 */
  deleteFile: (obj: any) => {
    return http.post("/ftp/delete", obj);
  },
  /** 复制文件或目录（目标同名时不会覆盖） */
  copyFile: (obj: {
    sourcePath: string;
    targetPath: string;
    overwrite?: boolean;
  }) => {
    return http.post("/ftp/copy", obj);
  },
  /** 移动文件或目录（用于剪切/粘贴） */
  moveFile: (obj: { sourcePath: string; targetPath: string }) => {
    return http.post("/ftp/move", obj);
  },
  /** 重命名文件或目录 */
  renameFile: (obj: { path: string; newName: string }) => {
    return http.post("/ftp/rename", obj);
  },
  /** 创建 tar.gz 压缩包 */
  archiveFile: (obj: {
    path: string;
    targetDir: string;
    archiveName: string;
  }, options: Record<string, any> = {}) => {
    return http.post("/ftp/archive", obj, options);
  },
  /** 获取当前用户归档任务列表 */
  getArchiveTasks: (
    obj?: {
      page?: number;
      pageSize?: number;
      status?: "queued" | "running" | "succeeded" | "failed";
    },
    options: Record<string, any> = {},
  ) => {
    return http.get("/ftp/archive/tasks", obj, options);
  },
  /** 获取单个归档任务详情 */
  getArchiveTask: (taskId: string, options: Record<string, any> = {}) => {
    return http.get(
      `/ftp/archive/tasks/${encodeURIComponent(taskId)}`,
      undefined,
      options,
    );
  },
  /** 获取文件属性 */
  getFileProperties: (obj: { path: string }) => {
    return http.post("/ftp/properties", obj);
  },
  /** 创建带有效期的文件外链 */
  createFileShare: (obj: { path: string; expiryHours: number }) => {
    return http.post("/ftp/shares", obj);
  },
  /** 获取外链分享记录 */
  getFileShares: () => {
    return http.get("/ftp/shares");
  },
  /** 取消外链分享 */
  revokeFileShare: (id: string) => {
    return http.post(`/ftp/shares/${encodeURIComponent(id)}/revoke`, {});
  },
  /** 获取文件存储容量和配额 */
  getFileCapacity: () => {
    return http.get("/ftp/capacity");
  },
  /** 获取回收站 */
  getTrashList: () => {
    return http.get("/ftp/trash/list");
  },
  /** 恢复回收站文件 */
  restoreTrash: (obj: any) => {
    return http.post("/ftp/trash/restore", obj);
  },
  /** 彻底删除回收站文件 */
  deleteTrashPermanently: (obj: any) => {
    return http.post("/ftp/trash/delete", obj);
  },
  /** 清空回收站 */
  emptyTrash: () => {
    return http.post("/ftp/trash/empty", { confirm: true });
  },
  /** URL 下载 */
  urlDownloadFile: (obj: any) => {
    return http.post("/ftp/urldownload", obj);
  },
  /** 二次认证并创建一次性终端票据 */
  createTerminalTicket: (obj: { password: string }) => {
    return http.post("/ssh/ticket", obj);
  },
  /** 获取 Root 终端运行与并发状态 */
  getTerminalStatus: () => {
    return http.get("/ssh/status");
  },
  /** 获取当前活动终端会话 */
  getTerminalSessions: () => {
    return http.get("/ssh/sessions");
  },
  /** 下载文件 */
  downloadFile: (obj: { path: string; filename?: string }) => {
    return http.download("/ftp/download", {
      method: "POST",
      data: { path: obj.path },
      filename: obj.filename,
      headers: { Accept: "application/octet-stream" },
    });
  },
  /** 读取文件二进制内容 */
  getFileBlob: (path: string, accept = "application/octet-stream") => {
    return http.blob("/ftp/download", {
      method: "POST",
      data: { path },
      headers: { Accept: accept },
    });
  },
  /** 修改文件权限 */
  updateFilePerm: (obj: any) => {
    return http.post("/ftp/modify", obj);
  },
};
