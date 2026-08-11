import http from "@/api";

export const authApi = {
  /** 登录 */
  login: (obj?: any) => {
    return http.post("/login", obj);
  },
  /** 退出并清除服务端会话 */
  logout: () => {
    return http.post("/logout", {});
  },
  /** 获取当前账号安全状态 */
  getSecurityStatus: () => {
    return http.get("/security/status");
  },
  /** 创建待确认的 TOTP 配置 */
  setupTOTP: () => {
    return http.post("/security/totp/setup", {});
  },
  /** 确认并启用 TOTP */
  confirmTOTP: (obj: { password: string; code: string }) => {
    return http.post("/security/totp/confirm", obj);
  },
  /** 停用 TOTP（成功后所有会话失效） */
  disableTOTP: (obj: { password: string; code: string }) => {
    return http.post("/security/totp/disable", obj);
  },
  /** 重新生成恢复码 */
  regenerateRecoveryCodes: (obj: { password: string; code: string }) => {
    return http.post("/security/totp/recovery-codes/regenerate", obj);
  },
  /** 获取当前账号的有效会话 */
  getSessions: () => {
    return http.get("/sessions");
  },
  /** 吊销指定会话 */
  revokeSession: (id: string) => {
    return http.post(`/sessions/${encodeURIComponent(id)}/revoke`, {});
  },
  /** 吊销当前会话之外的所有会话 */
  revokeOtherSessions: () => {
    return http.post("/sessions/revoke-others", {});
  },
};
