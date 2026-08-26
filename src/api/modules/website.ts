import http from "@/api";

export const websiteApi = {
  /** 获取网站列表 */
  getWebsiteList: (obj: any) => {
    return http.post("/website/list", obj);
  },
  /** 获取当前网站模块使用的 Nginx、OpenResty 或 Caddy 运行时 */
  getWebsiteWebServer: () => {
    return http.get("/website/web-server");
  },
  /** 获取当前 Web 服务器的受管配置文件 */
  getWebsiteWebServerConfigs: () => {
    return http.get("/website/web-server/configs");
  },
  /** 读取一个受管 Web 服务器配置文件 */
  getWebsiteWebServerConfig: (path: string) => {
    return http.get("/website/web-server/config", { path });
  },
  /** 保存配置，后端会先备份、校验并在运行时平滑重载 */
  updateWebsiteWebServerConfig: (obj: {
    path: string;
    content: string;
    revision: string;
  }) => {
    return http.put("/website/web-server/config", obj);
  },
  /** 新增站点 */
  addWebsite: (obj: any) => {
    return http.post("/website/add", obj);
  },
  /** 更新站点 */
  updateWebsite: (obj: any) => {
    return http.post("/website/update", obj);
  },
  /** 平滑启用或停用单个网站 */
  setWebsiteStatus: (websiteId: number, enabled: boolean) => {
    return http.post(`/website/${websiteId}/status`, { enabled });
  },
  /** 读取单站点结构化设置 */
  getWebsiteSettings: (websiteId: number) => {
    return http.get(`/website/${websiteId}/settings`);
  },
  /** 保存单站点设置，后端校验配置后平滑重载 */
  updateWebsiteSettings: (websiteId: number, obj: any) => {
    return http.put(`/website/${websiteId}/settings`, obj);
  },
  /** 读取单站点访问或错误日志 */
  getWebsiteLog: (
    websiteId: number,
    obj?: { type?: "access" | "error"; lines?: number },
  ) => {
    return http.get(`/website/${websiteId}/log`, obj);
  },
  /** 读取单站点实际运行配置 */
  getWebsiteManagedConfig: (websiteId: number) => {
    return http.get(`/website/${websiteId}/config`);
  },
  /** 更新单站点实际运行配置 */
  updateWebsiteManagedConfig: (
    websiteId: number,
    obj: { content: string; revision: string },
  ) => {
    return http.put(`/website/${websiteId}/config`, obj);
  },
  /** 删除站点 */
  delWebsite: (obj: any) => {
    return http.post("/website/del", obj);
  },
  /** 创建整站备份任务，可选关联一个 MySQL 数据库 */
  createWebsiteBackup: (obj: { websiteId: number; databaseId?: number }) => {
    return http.post("/website/backups", obj);
  },
  /** 获取整站备份 */
  getWebsiteBackups: (obj?: any) => {
    return http.get("/website/backups", obj);
  },
  /** 删除整站备份 */
  deleteWebsiteBackup: (backupId: string, obj: { confirmName: string }) => {
    return http.post(`/website/backups/${backupId}/delete`, obj);
  },
  /** 从整站备份恢复网站 */
  restoreWebsiteBackup: (obj: { backupId: string; confirmName: string }) => {
    return http.post("/website/restores", obj);
  },
  /** 获取网站备份、恢复和安全删除任务 */
  getWebsiteTasks: (obj?: any) => {
    return http.get("/website/tasks", obj);
  },
  /** 获取网站任务 */
  getWebsiteTask: (taskId: string) => {
    return http.get(`/website/tasks/${taskId}`);
  },
  /** 获取网站任务日志 */
  getWebsiteTaskLog: (taskId: string, obj?: any) => {
    return http.get(`/website/tasks/${taskId}/log`, obj);
  },
  /** 取消网站任务 */
  cancelWebsiteTask: (taskId: string) => {
    return http.post(`/website/tasks/${taskId}/cancel`, {});
  },
  /** 签发并部署网站 ACME 证书 */
  issueWebsiteCertificate: (obj: any) => {
    return http.post("/website/certificates/acme", obj);
  },
  /** 获取网站证书 */
  getWebsiteCertificate: (websiteId: number) => {
    return http.get(`/website/certificates/${websiteId}`);
  },
  /** 立即续签网站证书 */
  renewWebsiteCertificate: (certificateId: string) => {
    return http.post(`/website/certificates/${certificateId}/renew`, {});
  },
  /** 关闭网站 SSL */
  disableWebsiteCertificate: (certificateId: string, obj: any) => {
    return http.post(`/website/certificates/${certificateId}/disable`, obj);
  },
  /** 获取证书任务 */
  getCertificateTasks: (obj?: any) => {
    return http.get("/website/certificate-tasks", obj);
  },
  /** 获取证书任务详情 */
  getCertificateTask: (taskId: string) => {
    return http.get(`/website/certificate-tasks/${taskId}`);
  },
  /** 获取证书任务日志 */
  getCertificateTaskLog: (taskId: string) => {
    return http.get(`/website/certificate-tasks/${taskId}/log`);
  },
  /** 取消证书任务 */
  cancelCertificateTask: (taskId: string) => {
    return http.post(`/website/certificate-tasks/${taskId}/cancel`, {});
  },
};
