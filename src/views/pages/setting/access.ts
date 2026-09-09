import { useConfigStore } from '@/stores/modules/config'

type PanelSettingsAccessNode = {
  key?: string
  enabled?: boolean
  children?: PanelSettingsAccessNode[]
}

const findNode = (
  nodes: PanelSettingsAccessNode[] = [],
  key: string
): PanelSettingsAccessNode | undefined => {
  for (const node of nodes) {
    if (!node) continue
    if (node.key === key) return node
    const child = findNode(node.children || [], key)
    if (child) return child
  }
  return undefined
}

const toPanelButtonKey = (key: string) => {
  const normalized = String(key || '').trim()
  if (!normalized) return ''
  if (normalized.startsWith('button.')) return normalized
  if (normalized.startsWith('panel.')) return `button.${normalized}`
  return `button.panel.${normalized}`
}

/**
 * Panel-setting operations are resolved from the panel node's direct children.
 * Missing operation nodes intentionally remain allowed; only enabled=false denies access.
 */
export const hasPanelSettingsButtonAccess = (key: string) => {
  const config = useConfigStore()
  if (config.isAdministrator()) return true

  const parent = ['panelSettings', 'panel', 'panel-settings']
    .map(parentKey => findNode(config.menuTree as PanelSettingsAccessNode[], parentKey))
    .find(Boolean)
  const children = parent?.children
  if (!Array.isArray(children) || children.length === 0) return true

  const button = children.find(node => node?.key === toPanelButtonKey(key))
  return !button || button.enabled !== false
}

export interface PanelSettingsCapabilities {
  canReadAppearance: boolean
  canUpdateAppearance: boolean
  canReadPanelSettings: boolean
  canUpdatePanelAlias: boolean
  canUpdatePanelUsername: boolean
  canUpdatePanelPassword: boolean
  canUpdatePanelEntry: boolean
  canReadPanelNetwork: boolean
  canUpdatePanelNetwork: boolean
  canReadAccountSecurity: boolean
  canSetupTotp: boolean
  canDisableTotp: boolean
  canRegenerateRecoveryCodes: boolean
  canRevokeSession: boolean
  canReadPanelBackups: boolean
  canCreatePanelBackup: boolean
  canImportPanelBackup: boolean
  canDownloadPanelBackup: boolean
  canRestorePanelBackup: boolean
  canDeletePanelBackup: boolean
  canReadPanelUpdate: boolean
  canCheckPanelUpdate: boolean
  canApplyPanelUpdate: boolean
}

export const getPanelSettingsCapabilities = (): PanelSettingsCapabilities => ({
  canReadAppearance: hasPanelSettingsButtonAccess('appearance.read'),
  canUpdateAppearance: hasPanelSettingsButtonAccess('appearance.update'),
  canReadPanelSettings: hasPanelSettingsButtonAccess('settings.read'),
  canUpdatePanelAlias: hasPanelSettingsButtonAccess('settings.alias.update'),
  canUpdatePanelUsername: hasPanelSettingsButtonAccess('settings.username.update'),
  canUpdatePanelPassword: hasPanelSettingsButtonAccess('settings.password.update'),
  canUpdatePanelEntry: hasPanelSettingsButtonAccess('settings.entry.update'),
  canReadPanelNetwork: hasPanelSettingsButtonAccess('network.read'),
  canUpdatePanelNetwork: hasPanelSettingsButtonAccess('network.update'),
  canReadAccountSecurity: hasPanelSettingsButtonAccess('account-security.read'),
  canSetupTotp: hasPanelSettingsButtonAccess('account-security.totp.setup'),
  canDisableTotp: hasPanelSettingsButtonAccess('account-security.totp.disable'),
  canRegenerateRecoveryCodes: hasPanelSettingsButtonAccess('account-security.recovery-codes.regenerate'),
  canRevokeSession: hasPanelSettingsButtonAccess('account-security.session.revoke'),
  canReadPanelBackups: hasPanelSettingsButtonAccess('backup.read'),
  canCreatePanelBackup: hasPanelSettingsButtonAccess('backup.create'),
  canImportPanelBackup: hasPanelSettingsButtonAccess('backup.import'),
  canDownloadPanelBackup: hasPanelSettingsButtonAccess('backup.download'),
  canRestorePanelBackup: hasPanelSettingsButtonAccess('backup.restore'),
  canDeletePanelBackup: hasPanelSettingsButtonAccess('backup.delete'),
  canReadPanelUpdate: hasPanelSettingsButtonAccess('update.read'),
  canCheckPanelUpdate: hasPanelSettingsButtonAccess('update.check'),
  canApplyPanelUpdate: hasPanelSettingsButtonAccess('update.apply')
})
