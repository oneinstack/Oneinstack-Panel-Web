import http, { type RequestOptions } from "@/api";

type SilentRequestOptions = Pick<
  RequestOptions,
  "silentError" | "ignoreUnauthorizedLogout"
>;

export const systemApi = {
  /** 获取系统信息/面板设置 */
  getSystemInfo: () => {
    return http.get("/sys/systeminfo");
  },
  /** 获取当前面板构建版本 */
  getPanelVersion: (options: SilentRequestOptions = {}) => {
    return http.get("/sys/version", undefined, options);
  },
  /** 获取最近一次面板更新状态 */
  getPanelUpdateStatus: (options: SilentRequestOptions = {}) => {
    return http.get("/sys/update/status", undefined, options);
  },
  /** 校验签名清单并检查面板更新 */
  checkPanelUpdate: (options: SilentRequestOptions = {}) => {
    return http.post("/sys/update/check", {}, options);
  },
  /** 交给独立 systemd 单元执行面板更新 */
  applyPanelUpdate: (
    obj: { confirm: string },
    options: SilentRequestOptions = {},
  ) => {
    return http.post("/sys/update/apply", obj, options);
  },
  /** 静默轮询面板更新状态，用于更新期间等待服务重启 */
  pollPanelUpdateStatus: () => {
    return http.get("/sys/update/status", undefined, {
      ignoreUnauthorizedLogout: true,
      silentError: true,
    });
  },
  /** 获取 Panel 配置、数据库与证书备份 */
  getPanelBackups: () => {
    return http.get("/sys/backups");
  },
  /** 创建密码加密的 Panel 灾备包 */
  createPanelBackup: (obj: {
    passphrase: string;
    includeCertificates: boolean;
  }) => {
    return http.post("/sys/backups", obj);
  },
  /** 导入 Panel 灾备包 */
  importPanelBackup: (data: FormData) => {
    return http.post("/sys/backups/import", data);
  },
  /** 下载 Panel 灾备包 */
  downloadPanelBackup: (id: string, filename: string) => {
    return http.download(`/sys/backups/${encodeURIComponent(id)}/download`, {
      filename,
    });
  },
  /** 校验灾备包密码、清单、配置和 SQLite 完整性 */
  preflightPanelBackup: (id: string, obj: { passphrase: string }) => {
    return http.post(`/sys/backups/${encodeURIComponent(id)}/preflight`, obj);
  },
  /** 删除 Panel 灾备包 */
  deletePanelBackup: (id: string) => {
    return http.post(`/sys/backups/${encodeURIComponent(id)}/delete`, {
      confirm: true,
    });
  },
  /** 交给独立 systemd 单元恢复 Panel 数据 */
  restorePanelBackup: (
    id: string,
    obj: { passphrase: string; confirm: string },
  ) => {
    return http.post(`/sys/backups/${encodeURIComponent(id)}/restore`, obj);
  },
  /** 获取最近一次 Panel 恢复状态 */
  getPanelRestoreStatus: (options: SilentRequestOptions = {}) => {
    return http.get("/sys/restore/status", undefined, options);
  },
  /** 更新系统信息/修改端口*/
  updatePort: (obj: any) => {
    return http.post("/sys/updateport", obj);
  },
  /** 获取面板 HTTP/HTTPS 访问配置 */
  getPanelNetwork: () => {
    return http.get("/sys/network");
  },
  /** 原子校验并保存面板 HTTP/HTTPS 访问配置 */
  updatePanelNetwork: (obj: any) => {
    return http.post("/sys/network", obj);
  },
  /** 获取面板访问配置自动应用/恢复事务 */
  getPanelNetworkTransaction: (transactionId: string) => {
    return http.get(`/sys/network/transactions/${transactionId}`);
  },
  /** 获取系统进程列表 */
  getSystemProcesses: (obj?: {
    offset?: number;
    limit?: number;
    keyword?: string;
    sort?: "pid" | "cpu" | "memory" | "name";
    order?: "asc" | "desc";
  }) => {
    return http.get("/sys/processes", obj);
  },
  /** 获取系统进程详情 */
  getSystemProcessDetail: (pid: number | string) => {
    return http.get(`/sys/processes/${encodeURIComponent(String(pid))}`);
  },
  /** 获取系统磁盘信息 */
  getSystemDisks: () => {
    return http.get("/sys/disks");
  },
  /** 获取系统 SSH 配置 */
  getSystemSshConfig: () => {
    return http.get("/sys/ssh/config");
  },
  /** 修改标题 */
  updateSystemTitley: (obj: any) => {
    return http.post("/sys/updatesystemtitle", obj);
  },
  /** 更新用户密码 */
  updateResetpassword: (obj: any) => {
    return http.post("/sys/resetpassword", obj);
  },
  /** 更新用户账号 */
  updateUpdateuser: (obj: any) => {
    return http.post("/sys/updateuser", obj);
  },
  /** 获取基础信息 */
  getBaseInfo: () => {
    return http.get("/sys/getbaseinfo");
  },
};
