import http from "@/api";

export const bastionApi = {
  /** 获取堡垒机服务器总览 */
  getBastionOverview: () => {
    return http.get("/bastion/overview");
  },
  /** 获取堡垒机服务器列表 */
  getBastionServers: () => {
    return http.get("/bastion/servers");
  },
  /** 获取堡垒机服务器详情 */
  getBastionServer: (id: number | string) => {
    return http.get(`/bastion/servers/${id}`);
  },
  /** 添加堡垒机服务器 */
  addBastionServer: (obj: any) => {
    return http.post("/bastion/servers", obj);
  },
  /** 编辑堡垒机服务器 */
  updateBastionServer: (id: number | string, obj: any) => {
    return http.put(`/bastion/servers/${id}`, obj);
  },
  /** 删除堡垒机服务器及指标数据 */
  deleteBastionServer: (id: number | string) => {
    return http.delete(`/bastion/servers/${id}`);
  },
  /** 测试堡垒机服务器 SSH 连接 */
  testBastionServer: (id: number | string, obj: { password?: string } = {}) => {
    return http.post(`/bastion/servers/${id}/test`, obj);
  },
  /** 获取堡垒机服务器历史指标 */
  getBastionMetrics: (
    id: number | string,
    obj?: { from?: string; to?: string; limit?: number },
  ) => {
    return http.get(`/bastion/servers/${id}/metrics`, obj);
  },
};
