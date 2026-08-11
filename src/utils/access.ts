import { useConfigStore } from '@/stores/modules/config'
import i18n from '@/lang'

export const menuKeyLabelMap: Record<string, string> = {
  dashboard: 'Home',
  website: 'Websites',
  database: 'Databases',
  monitoring: 'Monitoring',
  bastion: 'Bastion',
  container: 'Containers',
  security: 'Security',
  file: 'Files',
  audit: 'Audit logs',
  runtimeLog: 'Runtime logs',
  cron: 'Scheduled tasks',
  software: 'Software store',
  panelSettings: 'Panel settings',
  configSnapshots: 'Config snapshots',
  systemManagement: 'System management',
  userManagement: 'User management',
  approval: 'Approval center',
  logout: 'Logout'
}

export const menuPathKeyMap: Array<{ path: string; key: string }> = [
  { path: '/home', key: 'dashboard' },
  { path: '/website', key: 'website' },
  { path: '/database', key: 'database' },
  { path: '/monitor', key: 'monitoring' },
  { path: '/bastion', key: 'bastion' },
  { path: '/container', key: 'container' },
  { path: '/security', key: 'security' },
  { path: '/file', key: 'file' },
  { path: '/log', key: 'audit' },
  { path: '/runtime-log', key: 'runtimeLog' },
  { path: '/task', key: 'cron' },
  { path: '/software', key: 'software' },
  { path: '/setting', key: 'panelSettings' },
  { path: '/config-snapshots', key: 'configSnapshots' },
  { path: '/system-management', key: 'systemManagement' },
  { path: '/user-management', key: 'userManagement' },
  { path: '/approval-center', key: 'approval' }
]

export const resolveMenuKeyByPath = (path: string) => {
  const matched = menuPathKeyMap.find((item) => path === item.path || path.startsWith(`${item.path}/`))
  return matched?.key || ''
}

export const resolveMenuLabelByKey = (key?: string) => {
  if (!key) return ''
  const i18nKey = `layout.menu.${key}`
  const label = i18n.t(i18nKey)
  return label && label !== i18nKey ? label : menuKeyLabelMap[key] || key
}

const hasConfigSnapshotAccess = () => {
  const sconfig = useConfigStore()
  return sconfig.hasMenuAccess('configSnapshots') ||
    sconfig.hasActionAccess('config.snapshot.read') ||
    Boolean((sconfig.scopeAccess as any)?.config?.snapshot?.read) ||
    Boolean((sconfig.scopeAccess as any)?.['config.snapshot']?.read)
}

const hasSystemManagementAccess = () => {
  const sconfig = useConfigStore()
  return sconfig.hasMenuAccess('systemManagement') ||
    sconfig.hasActionAccess('system.settings.read') ||
    Boolean((sconfig.scopeAccess as any)?.system?.settings?.read) ||
    Boolean((sconfig.scopeAccess as any)?.['system.settings']?.read)
}

export const canAccessPath = (path: string) => {
  const sconfig = useConfigStore()
  const key = resolveMenuKeyByPath(path)
  if (!key) return true
  if (key === 'configSnapshots') return hasConfigSnapshotAccess()
  if (key === 'systemManagement') return hasSystemManagementAccess()
  return sconfig.hasMenuAccess(key)
}

export const getFirstAccessiblePath = () => {
  const sconfig = useConfigStore()
  const firstAccessible = menuPathKeyMap.find((item) => sconfig.hasMenuAccess(item.key))
  return firstAccessible?.path || '/home'
}
