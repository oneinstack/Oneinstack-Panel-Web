import http from "@/api";

export const auditApi = {
  /** 分页查询持久化审计日志 */
  getAuditEvents: (obj?: any) => {
    return http.get("/audit/events", obj);
  },
  /** 获取单条审计日志 */
  getAuditEvent: (id: number) => {
    return http.get(`/audit/events/${id}`);
  },
  /** 获取审计统计与保留策略 */
  getAuditStats: () => {
    return http.get("/audit/stats");
  },
  /** 校验审计哈希链 */
  verifyAuditChain: () => {
    return http.post("/audit/verify", {});
  },
  /** 导出审计日志 */
  exportAuditEvents: (params: Record<string, any>, filename: string) => {
    return http.download("/audit/export", { params, filename });
  },
};
