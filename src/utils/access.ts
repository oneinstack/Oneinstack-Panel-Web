import sconfig from '@/sstore/sconfig'

export const menuKeyLabelMap: Record<string, string> = {
  dashboard: '首页',
  website: '网站',
  database: '数据库',
  monitoring: '监控告警',
  security: '安全',
  file: '文件',
  audit: '审计日志',
  runtimeLog: '运行日志',
  cron: '计划任务',
  software: '软件商店',
  panelSettings: '面板设置',
  userManagement: '用户管理',
  approval: '审批中心',
  logout: '退出'
}

export const menuPathKeyMap: Array<{ path: string; key: string }> = [
  { path: '/home', key: 'dashboard' },
  { path: '/website', key: 'website' },
  { path: '/database', key: 'database' },
  { path: '/monitor', key: 'monitoring' },
  { path: '/security', key: 'security' },
  { path: '/file', key: 'file' },
  { path: '/log', key: 'audit' },
  { path: '/runtime-log', key: 'runtimeLog' },
  { path: '/task', key: 'cron' },
  { path: '/software', key: 'software' },
  { path: '/setting', key: 'panelSettings' },
  { path: '/user-management', key: 'userManagement' },
  { path: '/approval-center', key: 'approval' }
]

export const resolveMenuKeyByPath = (path: string) => {
  const matched = menuPathKeyMap.find((item) => path === item.path || path.startsWith(`${item.path}/`))
  return matched?.key || ''
}

export const resolveMenuLabelByKey = (key?: string) => {
  if (!key) return ''
  return menuKeyLabelMap[key] || key
}

export const canAccessPath = (path: string) => {
  const key = resolveMenuKeyByPath(path)
  if (!key) return true
  return sconfig.hasMenuAccess(key)
}

export const getFirstAccessiblePath = () => {
  const firstAccessible = menuPathKeyMap.find((item) => sconfig.hasMenuAccess(item.key))
  return firstAccessible?.path || '/home'
}
