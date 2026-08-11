import http from "@/api";

export const taskApi = {
  /** 获取计划任务列表 */
  getPlanTaskList: (obj: any) => {
    return http.post("/cron/list", obj);
  },
  /** 新增计划任务 */
  addPlanTask: (obj: any) => {
    return http.post("/cron/add", obj);
  },
  /** 启用计划任务 */
  enablePlanTask: (obj: any) => {
    return http.post("/cron/enable", obj);
  },
  /** 禁用计划任务 */
  disablePlanTask: (obj: any) => {
    return http.post("/cron/disable", obj);
  },
  /** 立即执行计划任务 */
  runPlanTask: (obj: { id: number }) => {
    return http.post("/cron/run", obj);
  },
  /** 删除计划任务 */
  deletePlanTask: (obj: any) => {
    return http.post("/cron/del", obj);
  },
  /** 更新计划任务 */
  updataPlanTask: (obj: any) => {
    return http.post("/cron/update", obj);
  },
  /** 查看计划任务详情/日志 */
  getPlanTaskLog: (obj: any) => {
    return http.post("/cron/log", obj);
  },
  /** 获取白名单计划任务模板 */
  getPlanTaskTemplates: () => {
    return http.get("/cron/templates");
  },
  /** 获取当前运行中的执行记录 */
  getRunningPlanTaskExecutions: () => {
    return http.get("/cron/executions/running");
  },
  /** 主动取消运行中的执行 */
  cancelPlanTaskExecution: (executionId: number) => {
    return http.post(`/cron/executions/${executionId}/cancel`, {});
  },
  /** 按配置保留期清理计划任务日志 */
  cleanupPlanTaskLogs: () => {
    return http.post("/cron/log/cleanup", {});
  },
  /** 导出计划任务执行日志 */
  exportPlanTaskLogs: (
    taskId: number,
    params: Record<string, any>,
    filename: string,
  ) => {
    return http.download(`/cron/${taskId}/log/export`, { params, filename });
  },
};
