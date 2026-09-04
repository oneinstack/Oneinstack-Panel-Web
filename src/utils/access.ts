import { useConfigStore } from '@/stores/modules/config'
import i18n from '@/lang'

type AccessAliases = {
  scopes?: string[]
  actions?: string[]
}

/**
 * Resolve an operation against the access matrix without treating menu visibility
 * as write permission. Aliases keep the UI compatible with old matrix key names.
 */
export const hasOperationAccess = (
  scope: string,
  action: string,
  aliases: AccessAliases = {}
) => {
  const sconfig = useConfigStore()
  if (sconfig.isAdministrator()) return true

  const scopes = sconfig.scopeAccess as Record<string, any>
  const actions = sconfig.actionAccess as Record<string, boolean>
  const hasOwn = (value: unknown, key: string) =>
    Boolean(value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, key))
  const readScopeValue = (scopeKey: string, actionKey: string) => {
    const scopeValue = scopes?.[scopeKey]
    if (hasOwn(scopeValue, actionKey)) return { found: true, value: Boolean(scopeValue[actionKey]) }

    const flatKey = `${scopeKey}.${actionKey}`
    if (hasOwn(scopes, flatKey)) return { found: true, value: Boolean(scopes[flatKey]) }

    const nestedScope = scopeKey.split('.').reduce<any>((value, part) => value?.[part], scopes)
    if (hasOwn(nestedScope, actionKey)) return { found: true, value: Boolean(nestedScope[actionKey]) }
    return { found: false, value: false }
  }
  const readActionValue = (key: string) =>
    hasOwn(actions, key) ? { found: true, value: Boolean(actions[key]) } : { found: false, value: false }

  const primaryScopeValue = readScopeValue(scope, action)
  if (primaryScopeValue.found) return primaryScopeValue.value
  const primaryActionValue = readActionValue(`${scope}.${action}`)
  if (primaryActionValue.found) return primaryActionValue.value

  const aliasScopeKeys = [
    ...(aliases.scopes || []),
    ...(aliases.actions || []).map((key) => key.split('.').slice(0, -1).join('.')).filter(Boolean)
  ]
  const aliasActionKeys = [...(aliases.actions || [])]
  for (const aliasScope of aliasScopeKeys) {
    const aliasScopeAction = aliasActionKeys
      .map((key) => key.split('.').pop() || key)
      .find((key) => readScopeValue(aliasScope, key).found)
    if (aliasScopeAction) return readScopeValue(aliasScope, aliasScopeAction).value

    const aliasScopeValue = readScopeValue(aliasScope, action)
    if (aliasScopeValue.found) return aliasScopeValue.value
  }

  for (const aliasAction of aliasActionKeys) {
    const aliasActionValue = readActionValue(aliasAction)
    if (aliasActionValue.found) return aliasActionValue.value
  }

  return false
}

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
  terminal: 'Secure terminal',
  configSnapshots: 'Config snapshots',
  systemManagement: 'System management',
  userManagement: 'User management',
  approval: 'Approval center',
  certificate: 'Certificates',
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
  { path: '/terminal', key: 'terminal' },
  { path: '/task', key: 'cron' },
  { path: '/software', key: 'software' },
  { path: '/setting', key: 'panelSettings' },
  { path: '/config-snapshots', key: 'configSnapshots' },
  { path: '/system-management', key: 'systemManagement' },
  { path: '/user-management', key: 'userManagement' },
  { path: '/approval-center', key: 'approval' },
  { path: '/certificate', key: 'certificate' }
]

const menuKeyPathMap = menuPathKeyMap.reduce<Record<string, string>>((acc, item) => {
  acc[item.key] = item.path
  return acc
}, {})

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

const hasCertificateAccess = () => {
  const sconfig = useConfigStore()
  return sconfig.hasMenuAccess('certificate') ||
    sconfig.hasActionAccess('certificate.read') ||
    sconfig.hasScopeAccess('certificate', 'read')
}

export const hasTerminalAccess = () => {
  const sconfig = useConfigStore()
  return sconfig.hasMenuAccess('terminal') ||
    sconfig.hasActionAccess('terminal.access') ||
    Boolean((sconfig.scopeAccess as any)?.terminal?.access) ||
    Boolean((sconfig.scopeAccess as any)?.['terminal.access'])
}

export const canAccessPath = (path: string) => {
  const sconfig = useConfigStore()
  const key = resolveMenuKeyByPath(path)
  if (!key) return true
  if (key === 'terminal') return hasTerminalAccess()
  if (key === 'configSnapshots') return hasConfigSnapshotAccess()
  if (key === 'systemManagement') return hasSystemManagementAccess()
  if (key === 'certificate') return hasCertificateAccess()
  return sconfig.hasMenuAccess(key)
}

export const getFirstAccessiblePath = () => {
  const sconfig = useConfigStore()
  const firstAccessibleKey = String(sconfig.firstAccessibleMenu || '').trim()
  if (firstAccessibleKey && menuKeyPathMap[firstAccessibleKey]) {
    return menuKeyPathMap[firstAccessibleKey]
  }
  const firstAccessible = menuPathKeyMap.find((item) => canAccessPath(item.path))
  return firstAccessible?.path || '/home'
}
