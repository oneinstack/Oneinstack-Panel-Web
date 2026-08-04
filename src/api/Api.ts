/**
 * The legacy HTTP transport resolves only status 200. Task creation APIs
 * correctly return 202 Accepted, so bridge their success callback into a
 * normal Promise until the transport itself supports every successful 2xx.
 */
const postAccepted = (url: string, payload: Record<string, any> = {}) => {
  return new Promise<any>((resolve, reject) => {
    let settled = false
    const resolveOnce = (response: any) => {
      if (settled) return
      settled = true
      resolve(response)
    }
    http.post(url, { ...payload, success: resolveOnce })
      .then(resolveOnce)
      .catch((error: any) => {
        if (!settled) reject(error)
      })
  })
}

const requestJson = async (
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  payload?: Record<string, any>
) => {
  const request = {
    url,
    method,
    headers: method === 'GET' ? undefined : { 'Content-Type': 'application/json' }
  }
  return await http.get(request as any, payload || {})
}

export const Api = {
  /** 登录 */
  login: (obj?: any) => {
    return http.post('/login', obj)
  },
  /** 退出并清除服务端会话 */
  logout: () => {
    return http.post('/logout', {})
  },
  /** 获取当前账号安全状态 */
  getSecurityStatus: () => {
    return http.get('/security/status')
  },
  /** 创建待确认的 TOTP 配置 */
  setupTOTP: () => {
    return http.post('/security/totp/setup', {})
  },
  /** 确认并启用 TOTP */
  confirmTOTP: (obj: { password: string; code: string }) => {
    return http.post('/security/totp/confirm', obj)
  },
  /** 停用 TOTP（成功后所有会话失效） */
  disableTOTP: (obj: { password: string; code: string }) => {
    return http.post('/security/totp/disable', obj)
  },
  /** 重新生成恢复码 */
  regenerateRecoveryCodes: (obj: { password: string; code: string }) => {
    return http.post('/security/totp/recovery-codes/regenerate', obj)
  },
  /** 获取当前账号的有效会话 */
  getSessions: () => {
    return http.get('/sessions')
  },
  /** 吊销指定会话 */
  revokeSession: (id: string) => {
    return http.post(`/sessions/${encodeURIComponent(id)}/revoke`, {})
  },
  /** 吊销当前会话之外的所有会话 */
  revokeOtherSessions: () => {
    return http.post('/sessions/revoke-others', {})
  },
  /** 获取系统信息 */
  getSysinfo: () => {
    return http.get('/sys/info')
  },
  /** 获取监控信息 */
  getSysMonitor: () => {
    return http.get('/sys/monitor')
  },
  /** 获取备注信息 */
  getSysRemark: (id = 1) => {
    return http.get(`/sys/remark/${id}`)
  },
  /** 更新备注信息 */
  updateSysRemark: (obj: any) => {
    return http.post('/sys/remark/update', obj)
  },
  /** 获取网站统计 */
  getWebsiteCount: () => {
    return http.get('/sys/websitecount')
  },
  /** 获取数据库统计 */
  getDatabaseCount: () => {
    return http.get('/sys/libcount')
  },
  /** 获取文件列表 */
  getFileList: (obj: any) => {
    return http.post('/ftp/list', obj)
  },
  /** 获取当前用户收藏列表 */
  getFileFavorites: () => {
    return http.get('/ftp/favorites')
  },
  /** 收藏文件或目录 */
  favoriteFile: (obj: { path: string }) => {
    return http.post('/ftp/favorite', obj)
  },
  /** 取消收藏文件或目录 */
  cancelFileFavorite: (obj: { path?: string; id?: number }) => {
    return http.post('/ftp/favorite/cancel', obj)
  },
  /** 读取目录树 */
  getFileTree: (obj: { path?: string } = {}) => {
    return http.post('/ftp/tree', obj)
  },
  /** 搜索服务器文件或目录 */
  searchFiles: (obj: {
    path: string
    query: string
    type?: 'all' | 'file' | 'dir'
    maxResults?: number
    maxDepth?: number
  }) => {
    return http.post('/ftp/search', obj)
  },
  /** 获取文件操作记录 */
  getFileOperations: (obj?: {
    page?: number
    pageSize?: number
    q?: string
    action?: string
    outcome?: 'success' | 'failure' | ''
    username?: string
  }) => {
    return http.get('/ftp/operations', obj)
  },
  /** 读取文本文件 */
  getFileContent: (obj: { path: string }) => {
    return http.post('/ftp/content', obj)
  },
  /** 为当前登录会话创建短期图片预览票据 */
  createImagePreviewTicket: (obj: { path: string }) => {
    return http.post('/ftp/preview-ticket', obj)
  },
  /** 保存文本文件 */
  saveFileContent: (obj: { path: string; content: string; revision?: string }) => {
    return http.post('/ftp/save', obj)
  },
  /** 创建文件或文件夹 */
  createFile: (obj: any) => {
    return http.post('/ftp/create', obj)
  },
  /** 删除文件或文件夹 */
  deleteFile: (obj: any) => {
    return http.post('/ftp/delete', obj)
  },
  /** 复制文件或目录（目标同名时不会覆盖） */
  copyFile: (obj: { sourcePath: string; targetPath: string; overwrite?: boolean }) => {
    return http.post('/ftp/copy', obj)
  },
  /** 移动文件或目录（用于剪切/粘贴） */
  moveFile: (obj: { sourcePath: string; targetPath: string }) => {
    return http.post('/ftp/move', obj)
  },
  /** 重命名文件或目录 */
  renameFile: (obj: { path: string; newName: string }) => {
    return http.post('/ftp/rename', obj)
  },
  /** 创建 tar.gz 压缩包 */
  archiveFile: (obj: { path: string; targetDir: string; archiveName: string }) => {
    return http.post('/ftp/archive', obj)
  },
  /** 获取文件属性 */
  getFileProperties: (obj: { path: string }) => {
    return http.post('/ftp/properties', obj)
  },
  /** 创建带有效期的文件外链 */
  createFileShare: (obj: { path: string; expiryHours: number }) => {
    return http.post('/ftp/shares', obj)
  },
  /** 获取外链分享记录 */
  getFileShares: () => {
    return http.get('/ftp/shares')
  },
  /** 取消外链分享 */
  revokeFileShare: (id: string) => {
    return http.post(`/ftp/shares/${encodeURIComponent(id)}/revoke`, {})
  },
  /** 获取文件存储容量和配额 */
  getFileCapacity: () => {
    return http.get('/ftp/capacity')
  },
  /** 获取回收站 */
  getTrashList: () => {
    return http.get('/ftp/trash/list')
  },
  /** 恢复回收站文件 */
  restoreTrash: (obj: any) => {
    return http.post('/ftp/trash/restore', obj)
  },
  /** 彻底删除回收站文件 */
  deleteTrashPermanently: (obj: any) => {
    return http.post('/ftp/trash/delete', obj)
  },
  /** 清空回收站 */
  emptyTrash: () => {
    return http.post('/ftp/trash/empty', { confirm: true })
  },
  /** URL 下载 */
  urlDownloadFile: (obj: any) => {
    return http.post('/ftp/urldownload', obj)
  },
  /** 二次认证并创建一次性终端票据 */
  createTerminalTicket: (obj: { password: string }) => {
    return http.post('/ssh/ticket', obj)
  },
  /** 获取低权限终端隔离与并发状态 */
  getTerminalStatus: () => {
    return http.get('/ssh/status')
  },
  /** 获取当前活动终端会话 */
  getTerminalSessions: () => {
    return http.get('/ssh/sessions')
  },
  /** 下载文件 */
  downloadFile: (obj: any) => {
    return http.post('/ftp/download', { ...obj, isBlob: true })
  },
  /** 修改文件权限 */
  updateFilePerm: (obj: any) => {
    return http.post('/ftp/modify', obj)
  },
  /** 获取软件列表 */
  getSoftList: (obj: any) => {
    return http.post('/soft/list', obj)
  },
  /** 获取 Center 软件商城目录同步状态 */
  getSoftwareCatalogStatus: () => {
    return http.get('/soft/catalog/status')
  },
  /** 立即从 Center 同步软件商城目录 */
  syncSoftwareCatalog: () => {
    return http.post('/soft/catalog/sync')
  },
  /** 安装软件 */
  installSoft: (obj: any) => {
    return postAccepted('/soft/install', obj)
  },
  /** 卸载软件 */
  removeSoft: (obj: { name: string; version: string }) => {
    return postAccepted('/soft/remove', obj)
  },
  /** 获取受管组件的 systemd 运行状态 */
  getComponentServices: () => {
    return http.get('/soft/services')
  },
  /** 创建组件服务启动、停止、重启或重载任务 */
  runComponentServiceAction: (
    component: string,
    obj: { action: 'start' | 'stop' | 'restart' | 'reload' }
  ) => {
    return postAccepted(`/soft/services/${component}/actions`, obj)
  },
  /** 读取组件的结构化受管配置 */
  getComponentServiceConfiguration: (component: string) => {
    return http.get(`/soft/services/${component}/config`)
  },
  /** 校验组件配置并返回字段级变更预览 */
  previewComponentServiceConfiguration: (
    component: string,
    obj: { revision: string; values: Record<string, string> }
  ) => {
    return http.post(`/soft/services/${component}/config/preview`, obj)
  },
  /** 创建组件配置安全发布任务 */
  applyComponentServiceConfiguration: (
    component: string,
    obj: { revision: string; values: Record<string, string> }
  ) => {
    return postAccepted(`/soft/services/${component}/config/apply`, obj)
  },
  /** 获取组件配置发布历史 */
  getComponentServiceConfigurationHistory: (
    component: string,
    obj?: { page?: number; pageSize?: number }
  ) => {
    return http.get(`/soft/services/${component}/config/history`, obj)
  },
  /** 预览恢复到一次历史发布前的配置 */
  previewComponentServiceConfigurationRestore: (component: string, historyId: string) => {
    return http.post(`/soft/services/${component}/config/history/${historyId}/preview`)
  },
  /** 创建组件配置历史恢复任务 */
  restoreComponentServiceConfiguration: (component: string, historyId: string) => {
    return postAccepted(`/soft/services/${component}/config/history/${historyId}/restore`)
  },
  /** 获取安装日志 */
  getInstallLog: (obj: any) => {
    return http.get('/soft/getlog', obj)
  },
  /** 获取堡垒机服务器总览 */
  getBastionOverview: () => {
    return http.get('/bastion/overview')
  },
  /** 获取堡垒机服务器列表 */
  getBastionServers: () => {
    return http.get('/bastion/servers')
  },
  /** 获取堡垒机服务器详情 */
  getBastionServer: (id: number | string) => {
    return http.get(`/bastion/servers/${id}`)
  },
  /** 添加堡垒机服务器 */
  addBastionServer: (obj: any) => {
    return http.post('/bastion/servers', obj)
  },
  /** 编辑堡垒机服务器 */
  updateBastionServer: (id: number | string, obj: any) => {
    return requestJson('PUT', `/bastion/servers/${id}`, obj)
  },
  /** 删除堡垒机服务器及指标数据 */
  deleteBastionServer: (id: number | string) => {
    return requestJson('DELETE', `/bastion/servers/${id}`)
  },
  /** 测试堡垒机服务器 SSH 连接 */
  testBastionServer: (id: number | string, obj: { password?: string } = {}) => {
    return http.post(`/bastion/servers/${id}/test`, obj)
  },
  /** 获取堡垒机服务器历史指标 */
  getBastionMetrics: (
    id: number | string,
    obj?: { from?: string; to?: string; limit?: number }
  ) => {
    return http.get(`/bastion/servers/${id}/metrics`, obj)
  },
  /** 获取安装任务列表 */
  getSoftwareTasks: (obj?: any) => {
    return http.get('/soft/tasks', obj)
  },
  /** 获取安装任务统计 */
  getSoftwareTaskStats: (obj?: any) => {
    return http.get('/soft/tasks/stats', obj)
  },
  /** 获取安装任务快照 */
  getSoftwareTask: (taskId: string) => {
    return http.get(`/soft/tasks/${taskId}`)
  },
  /** 增量读取安装日志 */
  getSoftwareTaskLog: (taskId: string, obj?: any) => {
    return http.get(`/soft/tasks/${taskId}/log`, obj)
  },
  /** 取消安装任务 */
  cancelSoftwareTask: (taskId: string) => {
    return http.post(`/soft/tasks/${taskId}/cancel`, {})
  },
  /** 获取软件运行状态 */
  getSoftRunState: (obj: any) => {
    return http.post('/soft/exploration', obj)
  },
  /** 获取网站列表 */
  getWebsiteList: (obj: any) => {
    return http.post('/website/list', obj)
  },
  /** 获取当前网站模块使用的 Nginx/OpenResty 运行时 */
  getWebsiteWebServer: () => {
    return http.get('/website/web-server')
  },
  /** 获取当前 Web 服务器的受管配置文件 */
  getWebsiteWebServerConfigs: () => {
    return http.get('/website/web-server/configs')
  },
  /** 读取一个受管 Web 服务器配置文件 */
  getWebsiteWebServerConfig: (path: string) => {
    return http.get('/website/web-server/config', { path })
  },
  /** 保存配置，后端会先备份、校验并在运行时平滑重载 */
  updateWebsiteWebServerConfig: (obj: {
    path: string
    content: string
    revision: string
  }) => {
    return requestJson('PUT', '/website/web-server/config', obj)
  },
  /** 新增站点 */
  addWebsite: (obj: any) => {
    return http.post('/website/add', obj)
  },
  /** 更新站点 */
  updateWebsite: (obj: any) => {
    return http.post('/website/update', obj)
  },
  /** 删除站点 */
  delWebsite: (obj: any) => {
    return postAccepted('/website/del', obj)
  },
  /** 创建整站备份任务，可选关联一个 MySQL 数据库 */
  createWebsiteBackup: (obj: { websiteId: number; databaseId?: number }) => {
    return postAccepted('/website/backups', obj)
  },
  /** 获取整站备份 */
  getWebsiteBackups: (obj?: any) => {
    return http.get('/website/backups', obj)
  },
  /** 删除整站备份 */
  deleteWebsiteBackup: (backupId: string, obj: { confirmName: string }) => {
    return http.post(`/website/backups/${backupId}/delete`, obj)
  },
  /** 从整站备份恢复网站 */
  restoreWebsiteBackup: (obj: { backupId: string; confirmName: string }) => {
    return postAccepted('/website/restores', obj)
  },
  /** 获取网站备份、恢复和安全删除任务 */
  getWebsiteTasks: (obj?: any) => {
    return http.get('/website/tasks', obj)
  },
  /** 获取网站任务 */
  getWebsiteTask: (taskId: string) => {
    return http.get(`/website/tasks/${taskId}`)
  },
  /** 获取网站任务日志 */
  getWebsiteTaskLog: (taskId: string, obj?: any) => {
    return http.get(`/website/tasks/${taskId}/log`, obj)
  },
  /** 取消网站任务 */
  cancelWebsiteTask: (taskId: string) => {
    return http.post(`/website/tasks/${taskId}/cancel`, {})
  },
  /** 签发并部署网站 ACME 证书 */
  issueWebsiteCertificate: (obj: any) => {
    return postAccepted('/website/certificates/acme', obj)
  },
  /** 获取网站证书 */
  getWebsiteCertificate: (websiteId: number) => {
    return http.get(`/website/certificates/${websiteId}`)
  },
  /** 立即续签网站证书 */
  renewWebsiteCertificate: (certificateId: string) => {
    return postAccepted(`/website/certificates/${certificateId}/renew`, {})
  },
  /** 关闭网站 SSL */
  disableWebsiteCertificate: (certificateId: string, obj: any) => {
    return http.post(`/website/certificates/${certificateId}/disable`, obj)
  },
  /** 获取证书任务 */
  getCertificateTasks: (obj?: any) => {
    return http.get('/website/certificate-tasks', obj)
  },
  /** 获取证书任务详情 */
  getCertificateTask: (taskId: string) => {
    return http.get(`/website/certificate-tasks/${taskId}`)
  },
  /** 获取证书任务日志 */
  getCertificateTaskLog: (taskId: string) => {
    return http.get(`/website/certificate-tasks/${taskId}/log`)
  },
  /** 取消证书任务 */
  cancelCertificateTask: (taskId: string) => {
    return http.post(`/website/certificate-tasks/${taskId}/cancel`, {})
  },
  /** 获取数据库列表 */
  getDatabaseList: (obj: any) => {
    return http.post('/storage/liblist', obj)
  },
  /** 获取远程服务器列表 */
  getConnlist: (obj: any) => {
    return http.get('/storage/connlist', obj)
  },
  /** 添加远程服务器 */
  addDatabaseConn: (obj: any) => {
    return http.post('/storage/addconn', obj)
  },
  /** 测试数据库连接 */
  testDatabaseConn: (obj: any) => {
    return http.post('/storage/testconn', obj)
  },
  /** 同步远程服务器 */
  syncDatabaseConn: (obj: any) => {
    return http.post('/storage/sync', obj)
  },
  /** 修改远程服务器 */
  updateDatabaseConn: (obj: any) => {
    return http.post('/storage/updateconn', obj)
  },
  /** 删除数据库连接（不删除远端数据库） */
  deleteDatabaseConn: (obj: { id: number }) => {
    return http.post('/storage/delconn', obj)
  },
  /** 添加远程服务器 */
  addDatabaseLib: (obj: any) => {
    return http.post('/storage/addlib', obj)
  },
  /** 删除 MySQL 数据库及其专用用户 */
  deleteDatabaseLib: (obj: { id: number; confirmName: string }) => {
    return http.post('/storage/dellib', obj)
  },
  /** 二次认证后查看数据库专用账号 */
  revealDatabaseCredential: (libraryId: number, obj: { panelPassword: string }) => {
    return http.post(`/storage/libraries/${libraryId}/credential/reveal`, obj)
  },
  /** 修改数据库专用账号密码；密码留空时由服务端安全生成 */
  updateDatabaseCredential: (
    libraryId: number,
    obj: { panelPassword: string; password?: string }
  ) => {
    return http.post(`/storage/libraries/${libraryId}/credential/update`, obj)
  },
  /** 创建 MySQL 备份任务 */
  createDatabaseBackup: (obj: { libraryId: number }) => {
    return postAccepted('/storage/backups', obj)
  },
  /** 获取 MySQL 备份文件 */
  getDatabaseBackups: (obj: any) => {
    return http.get('/storage/backups', obj)
  },
  /** 删除 MySQL 备份文件 */
  deleteDatabaseBackup: (backupId: string, obj: { confirmName: string }) => {
    return http.post(`/storage/backups/${backupId}/delete`, obj)
  },
  /** 创建 MySQL 恢复任务 */
  restoreDatabaseBackup: (obj: { libraryId: number; backupId: string; confirmName: string }) => {
    return postAccepted('/storage/restores', obj)
  },
  /** 获取数据库备份/恢复任务 */
  getDatabaseTasks: (obj: any) => {
    return http.get('/storage/tasks', obj)
  },
  /** 取消数据库备份/恢复任务 */
  cancelDatabaseTask: (taskId: string) => {
    return http.post(`/storage/tasks/${taskId}/cancel`, {})
  },
  /** 获取redis列表 */
  getRedisList: (obj: any) => {
    return http.post('/storage/rklist', obj)
  },
  /** 获取防火墙信息 */
  getFirewallInfo: (obj: any) => {
    return http.get('/safe/info', obj)
  },
  /** 未检测到受支持的防火墙时，创建默认 firewalld 安装任务 */
  installFirewall: () => {
    return postAccepted('/safe/install', {})
  },
  /** 获取防火墙规则 */
  getFirewallRule: (obj: any) => {
    return http.post('/safe/rules', obj)
  },
  /** 设置是否禁止外部 Ping */
  setFirewallPing: (obj: { blocked: boolean }) => {
    return http.post('/safe/blockping', obj)
  },
  /** 设置防火墙目标状态；关闭时 confirm 必须为 DISABLE FIREWALL */
  setFirewallEnabled: (obj: { enabled: boolean; confirm?: string }) => {
    return http.post('/safe/stop', obj)
  },
  /** 删除防火墙规则 */
  deleteFirewallRule: (obj: { id: number }) => {
    return http.post('/safe/del', obj)
  },
  /** 添加防火墙规则 */
  addFirewallRule: (obj: any) => {
    return http.post('/safe/add', obj)
  },
  /** 修改防火墙规则 */
  updateFirewallRule: (obj: any) => {
    return http.post('/safe/update', obj)
  },
  /** 获取计划任务列表 */
  getPlanTaskList: (obj: any) => {
    return http.post('/cron/list', obj)
  },
  /** 新增计划任务 */
  addPlanTask: (obj: any) => {
    return http.post('/cron/add', obj)
  },
  /** 启用计划任务 */
  enablePlanTask: (obj: any) => {
    return http.post('/cron/enable', obj)
  },
  /** 禁用计划任务 */
  disablePlanTask: (obj: any) => {
    return http.post('/cron/disable', obj)
  },
  /** 立即执行计划任务 */
  runPlanTask: (obj: { id: number }) => {
    return postAccepted('/cron/run', obj)
  },
  /** 删除计划任务 */
  deletePlanTask: (obj: any) => {
    return http.post('/cron/del', obj)
  },
  /** 更新计划任务 */
  updataPlanTask: (obj: any) => {
    return http.post('/cron/update', obj)
  },
   /** 查看计划任务详情/日志 */
  getPlanTaskLog: (obj: any) => {
    return http.post('/cron/log', obj)
  },
  /** 获取白名单计划任务模板 */
  getPlanTaskTemplates: () => {
    return http.get('/cron/templates')
  },
  /** 获取当前运行中的执行记录 */
  getRunningPlanTaskExecutions: () => {
    return http.get('/cron/executions/running')
  },
  /** 主动取消运行中的执行 */
  cancelPlanTaskExecution: (executionId: number) => {
    return postAccepted(`/cron/executions/${executionId}/cancel`, {})
  },
  /** 按配置保留期清理计划任务日志 */
  cleanupPlanTaskLogs: () => {
    return http.post('/cron/log/cleanup', {})
  },
  /** 获取系统信息/面板设置 */
  getSystemInfo: () => {
    return http.get('/sys/systeminfo')
  },
  /** 获取当前面板构建版本 */
  getPanelVersion: () => {
    return http.get('/sys/version')
  },
  /** 获取最近一次面板更新状态 */
  getPanelUpdateStatus: () => {
    return http.get('/sys/update/status')
  },
  /** 校验签名清单并检查面板更新 */
  checkPanelUpdate: () => {
    return http.post('/sys/update/check', {})
  },
  /** 交给独立 systemd 单元执行面板更新 */
  applyPanelUpdate: (obj: { confirm: string }) => {
    return http.post('/sys/update/apply', obj)
  },
  /** 获取 Panel 配置、数据库与证书备份 */
  getPanelBackups: () => {
    return http.get('/sys/backups')
  },
  /** 创建密码加密的 Panel 灾备包 */
  createPanelBackup: (obj: { passphrase: string; includeCertificates: boolean }) => {
    return http.post('/sys/backups', obj)
  },
  /** 校验灾备包密码、清单、配置和 SQLite 完整性 */
  preflightPanelBackup: (id: string, obj: { passphrase: string }) => {
    return http.post(`/sys/backups/${encodeURIComponent(id)}/preflight`, obj)
  },
  /** 删除 Panel 灾备包 */
  deletePanelBackup: (id: string) => {
    return http.post(`/sys/backups/${encodeURIComponent(id)}/delete`, { confirm: true })
  },
  /** 交给独立 systemd 单元恢复 Panel 数据 */
  restorePanelBackup: (id: string, obj: { passphrase: string; confirm: string }) => {
    return http.post(`/sys/backups/${encodeURIComponent(id)}/restore`, obj)
  },
  /** 获取最近一次 Panel 恢复状态 */
  getPanelRestoreStatus: () => {
    return http.get('/sys/restore/status')
  },
  /** 更新系统信息/修改端口*/
  updatePort: (obj: any) => {
    return http.post('/sys/updateport', obj)
  },
  /** 获取面板 HTTP/HTTPS 访问配置 */
  getPanelNetwork: () => {
    return http.get('/sys/network')
  },
  /** 原子校验并保存面板 HTTP/HTTPS 访问配置 */
  updatePanelNetwork: (obj: any) => {
    return http.post('/sys/network', obj)
  },
  /** 获取面板访问配置自动应用/恢复事务 */
  getPanelNetworkTransaction: (transactionId: string) => {
    return http.get(`/sys/network/transactions/${transactionId}`)
  },
  /** 修改标题 */
  updateSystemTitley: (obj: any) => {
    return http.post('/sys/updatesystemtitle', obj)
  },
  /** 更新用户密码 */
  updateResetpassword: (obj: any) => {
    return http.post('/sys/resetpassword', obj)
  },
  /** 更新用户账号 */
  updateUpdateuser: (obj: any) => {
    return http.post('/sys/updateuser', obj)
  },
  /** 获取基础信息 */
  getBaseInfo: () => {
    return http.get('/sys/getbaseinfo')
  },
  /** 获取当前登录用户的角色、权限与可见范围 */
  getCurrentUserAccess: () => {
    return requestJson('GET', '/auth/me')
  },
  /** 获取菜单、按钮与审批策略矩阵 */
  getAccessMatrix: () => {
    return requestJson('GET', '/access/matrix')
  },
  /** 获取用户列表 */
  getAccessUsers: (obj?: any) => {
    return requestJson('GET', '/access/users', obj)
  },
  /** 获取角色列表 */
  getAccessRoles: () => {
    return requestJson('GET', '/access/roles')
  },
  /** 创建用户并分配角色 */
  createAccessUser: (obj: any) => {
    return requestJson('POST', '/access/users', obj)
  },
  /** 更新指定用户角色 */
  updateAccessUserRoles: (id: number | string, obj: { roleCodes: string[] }) => {
    return requestJson('PUT', `/access/users/${id}/roles`, obj)
  },
  /** 重置指定用户密码 */
  resetAccessUserPassword: (id: number | string, obj: { password: string }) => {
    return requestJson('POST', `/access/users/${id}/reset-password`, obj)
  },
  /** 获取审批列表 */
  getApprovals: (obj?: any) => {
    return requestJson('GET', '/approvals', obj)
  },
  /** 获取审批详情 */
  getApprovalDetail: (id: string) => {
    return requestJson('GET', `/approvals/${encodeURIComponent(id)}`)
  },
  /** 审批通过 */
  approveApproval: (id: string, obj: { comment?: string }) => {
    return requestJson('POST', `/approvals/${encodeURIComponent(id)}/approve`, obj)
  },
  /** 审批拒绝 */
  rejectApproval: (id: string, obj: { comment?: string }) => {
    return requestJson('POST', `/approvals/${encodeURIComponent(id)}/reject`, obj)
  },
  /** 分页查询持久化审计日志 */
  getAuditEvents: (obj?: any) => {
    return http.get('/audit/events', obj)
  },
  /** 获取单条审计日志 */
  getAuditEvent: (id: number) => {
    return http.get(`/audit/events/${id}`)
  },
  /** 获取审计统计与保留策略 */
  getAuditStats: () => {
    return http.get('/audit/stats')
  },
  /** 校验审计哈希链 */
  verifyAuditChain: () => {
    return http.post('/audit/verify', {})
  },
  /** 获取监控与告警摘要 */
  getMonitorSummary: () => {
    return http.get('/monitor/summary')
  },
  /** 获取已安装组件的服务健康状态 */
  getMonitorServiceHealth: (obj?: { includeNotInstalled?: boolean }) => {
    return http.get('/monitor/services', obj)
  },
  /** 立即执行一次组件服务健康检查 */
  checkMonitorServiceHealth: () => {
    return http.post('/monitor/services/check', {})
  },
  /** 静默或解除静默组件服务健康告警 */
  silenceMonitorServiceHealth: (component: string, minutes: number) => {
    return http.post(`/monitor/services/${encodeURIComponent(component)}/silence`, { minutes })
  },
  /** 获取历史监控指标 */
  getMonitorMetrics: (obj?: any) => {
    return http.get('/monitor/metrics', obj)
  },
  /** 获取告警规则 */
  getMonitorRules: () => {
    return http.get('/monitor/rules')
  },
  /** 创建告警规则 */
  createMonitorRule: (obj: any) => {
    return http.post('/monitor/rules', obj)
  },
  /** 更新告警规则 */
  updateMonitorRule: (id: number, obj: any) => {
    return http.post(`/monitor/rules/${id}/update`, obj)
  },
  /** 删除告警规则 */
  deleteMonitorRule: (id: number) => {
    return http.post(`/monitor/rules/${id}/delete`, {})
  },
  /** 静默或解除静默告警规则 */
  silenceMonitorRule: (id: number, minutes: number) => {
    return http.post(`/monitor/rules/${id}/silence`, { minutes })
  },
  /** 获取告警事件 */
  getMonitorEvents: (obj?: any) => {
    return http.get('/monitor/events', obj)
  },
  /** 获取通知投递记录 */
  getMonitorDeliveries: (obj?: any) => {
    return http.get('/monitor/deliveries', obj)
  },
  /** 获取通知通道 */
  getMonitorChannels: () => {
    return http.get('/monitor/channels')
  },
  /** 创建通知通道 */
  createMonitorChannel: (obj: any) => {
    return http.post('/monitor/channels', obj)
  },
  /** 更新通知通道 */
  updateMonitorChannel: (id: string, obj: any) => {
    return http.post(`/monitor/channels/${encodeURIComponent(id)}/update`, obj)
  },
  /** 删除通知通道 */
  deleteMonitorChannel: (id: string) => {
    return http.post(`/monitor/channels/${encodeURIComponent(id)}/delete`, {})
  },
  /** 测试通知通道 */
  testMonitorChannel: (id: string) => {
    return http.post(`/monitor/channels/${encodeURIComponent(id)}/test`, {})
  },
  /** 按游标查询面板运行日志 */
  getRuntimeLogs: (obj?: any) => {
    return http.get('/log/runtime', obj)
  },
  /** 获取运行日志统计和来源 */
  getRuntimeLogStats: () => {
    return http.get('/log/runtime/stats')
  }
}
