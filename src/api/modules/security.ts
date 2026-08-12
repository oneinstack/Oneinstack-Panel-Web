import http from "@/api";

const withLanguage = (language = "en-US") => ({
  headers: {
    "Accept-Language": language,
  },
});

export const securityApi = {
  /** 获取防火墙信息 */
  getFirewallInfo: (obj: any) => {
    return http.get("/safe/info", obj);
  },
  /** 未检测到受支持的防火墙时，创建默认 firewalld 安装任务 */
  installFirewall: () => {
    return http.post("/safe/install", {});
  },
  /** 获取防火墙规则 */
  getFirewallRule: (obj: any) => {
    return http.post("/safe/rules", obj);
  },
  /** 设置是否禁止外部 Ping */
  setFirewallPing: (obj: { blocked: boolean }) => {
    return http.post("/safe/blockping", obj);
  },
  /** 设置防火墙目标状态；关闭时 confirm 必须为 DISABLE FIREWALL */
  setFirewallEnabled: (obj: { enabled: boolean; confirm?: string }) => {
    return http.post("/safe/stop", obj);
  },
  /** 删除防火墙规则 */
  deleteFirewallRule: (obj: { id: number }) => {
    return http.post("/safe/del", obj);
  },
  /** 添加防火墙规则 */
  addFirewallRule: (obj: any) => {
    return http.post("/safe/add", obj);
  },
  /** 修改防火墙规则 */
  updateFirewallRule: (obj: any) => {
    return http.post("/safe/update", obj);
  },
  /** 启用或停用单条防火墙规则 */
  setFirewallRuleState: (obj: { id: number; enabled: boolean }) => {
    return http.post("/safe/rules/state", obj);
  },
  /** 批量启用、停用或删除防火墙规则 */
  batchFirewallRules: (obj: {
    ids: number[];
    action: "enable" | "disable" | "delete";
  }) => {
    return http.post("/safe/rules/batch", obj);
  },
  /** 清理已到期的临时规则 */
  cleanupFirewallRules: () => {
    return http.post("/safe/rules/cleanup", {});
  },
  /** 导入防火墙规则 */
  importFirewallRules: (obj: { rules: any[] }) => {
    return http.post("/safe/rules/import", obj);
  },
  /** 导出防火墙规则 */
  exportFirewallRules: (ruleType: string) => {
    return http.download("/safe/rules/export", {
      params: { ruleType },
      filename: `oneinstack-firewall-${ruleType}.json`,
      headers: { Accept: "application/json" },
    });
  },
  /** 获取端口转发列表 */
  getFirewallForwards: (obj: any) => {
    return http.post("/safe/forwards", obj);
  },
  addFirewallForward: (obj: any) => {
    return http.post("/safe/forwards/add", obj);
  },
  updateFirewallForward: (obj: any) => {
    return http.post("/safe/forwards/update", obj);
  },
  deleteFirewallForward: (obj: { id: number }) => {
    return http.post("/safe/forwards/del", obj);
  },
  setFirewallForwardState: (obj: { id: number; enabled: boolean }) => {
    return http.post("/safe/forwards/state", obj);
  },
  /** SSH 恶意 IP 自动封禁配置 */
  getFirewallAutoBlock: () => {
    return http.get("/safe/auto-block");
  },
  saveFirewallAutoBlock: (obj: {
    enabled: boolean;
    threshold: number;
    windowMinutes: number;
    banMinutes: number;
  }) => {
    return http.post("/safe/auto-block", obj);
  },
  runFirewallAutoBlock: () => {
    return http.post("/safe/auto-block/run", {});
  },
  /** 获取 Fail2ban 实时状态 */
  getFail2banStatus: (language?: string) => {
    return http.get(
      "/security/fail2ban/status",
      undefined,
      withLanguage(language),
    );
  },
  /** 获取 Fail2ban 策略模板 */
  getFail2banTemplates: (language?: string) => {
    return http.get(
      "/security/fail2ban/templates",
      undefined,
      withLanguage(language),
    );
  },
  /** 获取 Fail2ban 策略列表 */
  getFail2banPolicies: (language?: string) => {
    return http.get(
      "/security/fail2ban/policies",
      undefined,
      withLanguage(language),
    );
  },
  /** 获取 Fail2ban 当前封禁 */
  getFail2banBans: (language?: string) => {
    return http.get(
      "/security/fail2ban/bans",
      undefined,
      withLanguage(language),
    );
  },
  /** 获取 Fail2ban 异常事件 */
  getFail2banIncidents: (
    params?: {
      page?: number;
      pageSize?: number;
      status?: string;
      remoteIp?: string;
    },
    language?: string,
  ) => {
    return http.get(
      "/security/fail2ban/incidents",
      params,
      withLanguage(language),
    );
  },
  /** 标记异常事件为误报 */
  dismissFail2banIncident: (id: string, language?: string) => {
    return http.post(
      `/security/fail2ban/incidents/${encodeURIComponent(id)}/dismiss`,
      {},
      withLanguage(language),
    );
  },
  /** 获取 Fail2ban 任务列表 */
  getFail2banTasks: (
    params?: {
      active?: boolean;
      page?: number;
      pageSize?: number;
    },
    language?: string,
  ) => {
    return http.get("/security/fail2ban/tasks", params, withLanguage(language));
  },
  /** 获取 Fail2ban 任务事件 */
  getFail2banTaskEvents: (
    taskId: string,
    params?: { after?: number },
    language?: string,
  ) => {
    return http.get(
      `/security/fail2ban/tasks/${encodeURIComponent(taskId)}/events`,
      params,
      withLanguage(language),
    );
  },
};
