import http from "@/api";

export const monitorApi = {
  /** 获取监控与告警摘要 */
  getMonitorSummary: () => {
    return http.get("/monitor/summary");
  },
  /** 获取已安装组件的服务健康状态 */
  getMonitorServiceHealth: (obj?: { includeNotInstalled?: boolean }) => {
    return http.get("/monitor/services", obj);
  },
  /** 立即执行一次组件服务健康检查 */
  checkMonitorServiceHealth: () => {
    return http.post("/monitor/services/check", {});
  },
  /** 静默或解除静默组件服务健康告警 */
  silenceMonitorServiceHealth: (component: string, minutes: number) => {
    return http.post(
      `/monitor/services/${encodeURIComponent(component)}/silence`,
      { minutes },
    );
  },
  /** 获取历史监控指标 */
  getMonitorMetrics: (obj?: any) => {
    return http.get("/monitor/metrics", obj);
  },
  /** 获取分组监控历史样本 */
  getMonitorHistory: (obj?: { from?: string; to?: string }) => {
    return http.get("/monitor/history", obj);
  },
  /** 获取告警规则 */
  getMonitorRules: () => {
    return http.get("/monitor/rules");
  },
  /** 创建告警规则 */
  createMonitorRule: (obj: any) => {
    return http.post("/monitor/rules", obj);
  },
  /** 更新告警规则 */
  updateMonitorRule: (id: number, obj: any) => {
    return http.post(`/monitor/rules/${id}/update`, obj);
  },
  /** 删除告警规则 */
  deleteMonitorRule: (id: number) => {
    return http.post(`/monitor/rules/${id}/delete`, {});
  },
  /** 静默或解除静默告警规则 */
  silenceMonitorRule: (id: number, minutes: number) => {
    return http.post(`/monitor/rules/${id}/silence`, { minutes });
  },
  /** 获取告警事件 */
  getMonitorEvents: (obj?: any) => {
    return http.get("/monitor/events", obj);
  },
  /** 获取通知投递记录 */
  getMonitorDeliveries: (obj?: any) => {
    return http.get("/monitor/deliveries", obj);
  },
  /** 获取通知通道 */
  getMonitorChannels: () => {
    return http.get("/monitor/channels");
  },
  /** 创建通知通道 */
  createMonitorChannel: (obj: any) => {
    return http.post("/monitor/channels", obj);
  },
  /** 更新通知通道 */
  updateMonitorChannel: (id: string, obj: any) => {
    return http.post(`/monitor/channels/${encodeURIComponent(id)}/update`, obj);
  },
  /** 删除通知通道 */
  deleteMonitorChannel: (id: string) => {
    return http.post(`/monitor/channels/${encodeURIComponent(id)}/delete`, {});
  },
  /** 测试通知通道 */
  testMonitorChannel: (id: string) => {
    return http.post(`/monitor/channels/${encodeURIComponent(id)}/test`, {});
  },
};
