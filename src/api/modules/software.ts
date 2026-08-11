import http from "@/api";

export const softwareApi = {
  /** 获取软件列表 */
  getSoftList: (obj: any) => {
    return http.post("/soft/list", obj);
  },
  /** 创建系统变更操作预览票据 */
  previewOperation: (obj: { operation: string; payload: unknown }) => {
    return http.post("/operations/preview", obj);
  },
  /** 执行已确认的系统变更操作 */
  executeOperation: (previewId: string) => {
    return http.post(`/operations/${encodeURIComponent(previewId)}/execute`, {
      confirm: true,
    });
  },
  /** 获取 Center 软件商城目录同步状态 */
  getSoftwareCatalogStatus: () => {
    return http.get("/soft/catalog/status");
  },
  /** 立即从 Center 同步软件商城目录 */
  syncSoftwareCatalog: () => {
    return http.post("/soft/catalog/sync");
  },
  /** 安装软件 */
  installSoft: (obj: any) => {
    return http.post("/soft/install", obj);
  },
  /** 卸载软件 */
  removeSoft: (obj: { name: string; version: string }) => {
    return http.post("/soft/remove", obj);
  },
  /** 获取受管组件的 systemd 运行状态 */
  getComponentServices: () => {
    return http.get("/soft/services");
  },
  /** 创建组件服务启动、停止、重启或重载任务 */
  runComponentServiceAction: (
    component: string,
    obj: { action: "start" | "stop" | "restart" | "reload" },
  ) => {
    return http.post(`/soft/services/${component}/actions`, obj);
  },
  /** 读取组件的结构化受管配置 */
  getComponentServiceConfiguration: (component: string) => {
    return http.get(`/soft/services/${component}/config`);
  },
  /** 校验组件配置并返回字段级变更预览 */
  previewComponentServiceConfiguration: (
    component: string,
    obj: { revision: string; values: Record<string, string> },
  ) => {
    return http.post(`/soft/services/${component}/config/preview`, obj);
  },
  /** 创建组件配置安全发布任务 */
  applyComponentServiceConfiguration: (
    component: string,
    obj: { revision: string; values: Record<string, string> },
  ) => {
    return http.post(`/soft/services/${component}/config/apply`, obj);
  },
  /** 获取组件配置发布历史 */
  getComponentServiceConfigurationHistory: (
    component: string,
    obj?: { page?: number; pageSize?: number },
  ) => {
    return http.get(`/soft/services/${component}/config/history`, obj);
  },
  /** 预览恢复到一次历史发布前的配置 */
  previewComponentServiceConfigurationRestore: (
    component: string,
    historyId: string,
  ) => {
    return http.post(
      `/soft/services/${component}/config/history/${historyId}/preview`,
    );
  },
  /** 创建组件配置历史恢复任务 */
  restoreComponentServiceConfiguration: (
    component: string,
    historyId: string,
  ) => {
    return http.post(
      `/soft/services/${component}/config/history/${historyId}/restore`,
    );
  },
  /** 获取安装日志 */
  getInstallLog: (obj: any) => {
    return http.get("/soft/getlog", obj);
  },
  /** 获取安装任务列表 */
  getSoftwareTasks: (obj?: any) => {
    return http.get("/soft/tasks", obj);
  },
  /** 获取安装任务统计 */
  getSoftwareTaskStats: (obj?: any) => {
    return http.get("/soft/tasks/stats", obj);
  },
  /** 下载软件任务日志 */
  downloadSoftwareTaskLog: (taskId: string) => {
    return http.download(
      `/soft/tasks/${encodeURIComponent(taskId)}/log/download`,
      {
        filename: `oneinstack-software-${taskId}.log`,
        headers: { Accept: "text/plain" },
      },
    );
  },
  /** 获取安装任务快照 */
  getSoftwareTask: (taskId: string) => {
    return http.get(`/soft/tasks/${taskId}`);
  },
  /** 增量读取安装日志 */
  getSoftwareTaskLog: (taskId: string, obj?: any) => {
    return http.get(`/soft/tasks/${taskId}/log`, obj);
  },
  /** 取消安装任务 */
  cancelSoftwareTask: (taskId: string) => {
    return http.post(`/soft/tasks/${taskId}/cancel`, {});
  },
  /** 获取软件运行状态 */
  getSoftRunState: (obj: any) => {
    return http.post("/soft/exploration", obj);
  },
};
