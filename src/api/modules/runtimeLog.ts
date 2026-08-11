import http from "@/api";

export const runtimeLogApi = {
  /** 按游标查询面板运行日志 */
  getRuntimeLogs: (obj?: any) => {
    return http.get("/log/runtime", obj);
  },
  /** 获取运行日志统计和来源 */
  getRuntimeLogStats: () => {
    return http.get("/log/runtime/stats");
  },
};
