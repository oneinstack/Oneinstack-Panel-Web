import http from "@/api";

export interface AccessPermission {
  code: string;
  name: string;
  description?: string;
  module?: string;
  action?: string;
}

export interface AccessMenuNode {
  id?: number;
  key: string;
  code?: string;
  parentKey?: string;
  type: "directory" | "page" | "button" | string;
  name: string;
  nameEn?: string;
  targetType?: "route" | "action" | string;
  targetKey?: string;
  iconKey?: string;
  sort?: number;
  enabled?: boolean;
  builtin?: boolean;
  superAdminOnly?: boolean;
  featureKey?: string;
  permissionCodes?: string[];
  permissions?: AccessPermission[];
  children?: AccessMenuNode[];
}

export interface AccessRole {
  code?: string;
  key: string;
  name: string;
  description?: string;
  builtin?: boolean;
  permissions?: string[];
  menuTree?: AccessMenuNode[];
}

export const accessApi = {
  /** 获取当前登录用户的角色、权限与可见范围 */
  getCurrentUserAccess: () => {
    return http.get("/auth/me");
  },
  /** 获取菜单、按钮与审批策略矩阵 */
  getAccessMatrix: () => {
    return http.get("/access/matrix");
  },
  /** 获取当前后台已登记权限清单 */
  getAccessPermissions: () => {
    return http.get("/access/permissions");
  },
  /** 获取完整菜单树 */
  getAccessMenus: () => {
    return http.get("/access/menus");
  },
  /** 创建菜单 */
  createAccessMenu: (obj: Partial<AccessMenuNode> & { key: string; type: AccessMenuNode["type"]; name: string }) => {
    return http.post("/access/menus", obj);
  },
  /** 更新菜单 */
  updateAccessMenu: (key: string, obj: Partial<AccessMenuNode> & { key?: string; code?: string }) => {
    return http.put(`/access/menus/${encodeURIComponent(key)}`, obj);
  },
  /** 独立启用或禁用菜单 */
  setAccessMenuStatus: (key: string, enabled: boolean) => {
    return http.post(`/access/menus/${encodeURIComponent(key)}/status`, { enabled });
  },
  /** 删除菜单 */
  deleteAccessMenu: (key: string) => {
    return http.delete(`/access/menus/${encodeURIComponent(key)}`);
  },
  /** 获取用户列表 */
  getAccessUsers: (obj?: any) => {
    return http.get("/access/users", obj);
  },
  /** 获取角色列表 */
  getAccessRoles: () => {
    return http.get("/access/roles");
  },
  /** 获取角色详情 */
  getAccessRoleDetail: (key: string) => {
    return http.get(`/access/roles/${encodeURIComponent(key)}`);
  },
  /** 创建角色 */
  createAccessRole: (obj: { key?: string; code?: string; name: string; description?: string; permissionCodes?: string[]; permissions?: string[] }) => {
    return http.post("/access/roles", obj);
  },
  /** 更新角色 */
  updateAccessRole: (key: string, obj: { key?: string; code?: string; name: string; description?: string; permissionCodes?: string[]; permissions?: string[] }) => {
    return http.put(`/access/roles/${encodeURIComponent(key)}`, obj);
  },
  /** 删除角色 */
  deleteAccessRole: (key: string) => {
    return http.delete(`/access/roles/${encodeURIComponent(key)}`);
  },
  /** 创建用户并分配角色 */
  createAccessUser: (obj: any) => {
    return http.post("/access/users", obj);
  },
  /** 删除指定用户 */
  deleteAccessUser: (id: number | string) => {
    return http.delete(`/access/users/${id}?confirm=true`);
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
