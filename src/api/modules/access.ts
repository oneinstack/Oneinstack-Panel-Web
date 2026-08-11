import http from "@/api";

export const accessApi = {
  /** 获取当前登录用户的角色、权限与可见范围 */
  getCurrentUserAccess: () => {
    return http.get("/auth/me");
  },
  /** 获取菜单、按钮与审批策略矩阵 */
  getAccessMatrix: () => {
    return http.get("/access/matrix");
  },
  /** 获取用户列表 */
  getAccessUsers: (obj?: any) => {
    return http.get("/access/users", obj);
  },
  /** 获取角色列表 */
  getAccessRoles: () => {
    return http.get("/access/roles");
  },
  /** 创建用户并分配角色 */
  createAccessUser: (obj: any) => {
    return http.post("/access/users", obj);
  },
  /** 更新指定用户角色 */
  updateAccessUserRoles: (
    id: number | string,
    obj: { roleCodes: string[] },
  ) => {
    return http.put(`/access/users/${id}/roles`, obj);
  },
  /** 重置指定用户密码 */
  resetAccessUserPassword: (id: number | string, obj: { password: string }) => {
    return http.post(`/access/users/${id}/reset-password`, obj);
  },
  /** 获取审批列表 */
  getApprovals: (obj?: any) => {
    return http.get("/approvals", obj);
  },
  /** 获取审批详情 */
  getApprovalDetail: (id: string) => {
    return http.get(`/approvals/${encodeURIComponent(id)}`);
  },
  /** 审批通过 */
  approveApproval: (id: string, obj: { comment?: string }) => {
    return http.post(`/approvals/${encodeURIComponent(id)}/approve`, obj);
  },
  /** 审批拒绝 */
  rejectApproval: (id: string, obj: { comment?: string }) => {
    return http.post(`/approvals/${encodeURIComponent(id)}/reject`, obj);
  },
};
