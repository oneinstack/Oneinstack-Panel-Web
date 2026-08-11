import http from "@/api";

export const databaseApi = {
  /** 获取数据库列表 */
  getDatabaseList: (obj: any) => {
    return http.post("/storage/liblist", obj);
  },
  /** 获取远程服务器列表 */
  getConnlist: (obj: any) => {
    return http.get("/storage/connlist", obj);
  },
  /** 获取本机 MySQL、Redis 安装状态 */
  getStorageInfo: () => {
    return http.post("/storage/info", {});
  },
  /** 添加远程服务器 */
  addDatabaseConn: (obj: any) => {
    return http.post("/storage/addconn", obj);
  },
  /** 测试数据库连接 */
  testDatabaseConn: (obj: any) => {
    return http.post("/storage/testconn", obj);
  },
  /** 同步远程服务器 */
  syncDatabaseConn: (obj: any) => {
    return http.post("/storage/sync", obj);
  },
  /** 修改远程服务器 */
  updateDatabaseConn: (obj: any) => {
    return http.post("/storage/updateconn", obj);
  },
  /** 删除数据库连接（不删除远端数据库） */
  deleteDatabaseConn: (obj: { id: number }) => {
    return http.post("/storage/delconn", obj);
  },
  /** 添加远程服务器 */
  addDatabaseLib: (obj: any) => {
    return http.post("/storage/addlib", obj);
  },
  /** 删除 MySQL 数据库及其专用用户 */
  deleteDatabaseLib: (obj: { id: number; confirmName: string }) => {
    return http.post("/storage/dellib", obj);
  },
  /** 校验当前面板登录密码 */
  verifyPanelPassword: (obj: { password: string }) => {
    return http.post("/auth/verify-password", obj, {
      ignoreUnauthorizedLogout: true,
    });
  },
  /** 二次认证后查看数据库专用账号 */
  revealDatabaseCredential: (
    libraryId: number,
    obj: { panelPassword: string },
  ) => {
    return http.post(`/storage/libraries/${libraryId}/credential/reveal`, obj);
  },
  /** 修改数据库专用账号密码；密码留空时由服务端安全生成 */
  updateDatabaseCredential: (
    libraryId: number,
    obj: { panelPassword: string; password?: string },
  ) => {
    return http.post(`/storage/libraries/${libraryId}/credential/update`, obj);
  },
  /** 创建 MySQL 备份任务 */
  createDatabaseBackup: (obj: { libraryId: number }) => {
    return http.post("/storage/backups", obj);
  },
  /** 获取 MySQL 备份文件 */
  getDatabaseBackups: (obj: any) => {
    return http.get("/storage/backups", obj);
  },
  /** 下载 MySQL 备份文件 */
  downloadDatabaseBackup: (backupId: string, filename: string) => {
    return http.download(
      `/storage/backups/${encodeURIComponent(backupId)}/download`,
      { filename, headers: { Accept: "application/gzip" } },
    );
  },
  /** 删除 MySQL 备份文件 */
  deleteDatabaseBackup: (backupId: string, obj: { confirmName: string }) => {
    return http.post(`/storage/backups/${backupId}/delete`, obj);
  },
  /** 创建 MySQL 恢复任务 */
  restoreDatabaseBackup: (obj: {
    libraryId: number;
    backupId: string;
    confirmName: string;
  }) => {
    return http.post("/storage/restores", obj);
  },
  /** 获取数据库备份/恢复任务 */
  getDatabaseTasks: (obj: any) => {
    return http.get("/storage/tasks", obj);
  },
  /** 取消数据库备份/恢复任务 */
  cancelDatabaseTask: (taskId: string) => {
    return http.post(`/storage/tasks/${taskId}/cancel`, {});
  },
  /** 获取redis列表 */
  getRedisList: (obj: any) => {
    return http.post("/storage/rklist", obj);
  },
};
