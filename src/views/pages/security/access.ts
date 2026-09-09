import { useConfigStore } from '@/stores/modules/config'

export type SecurityAccessNode = {
  key?: string
  enabled?: boolean
  children?: SecurityAccessNode[]
}

const findNode = (nodes: SecurityAccessNode[] = [], key: string): SecurityAccessNode | undefined => {
  for (const node of nodes) {
    if (!node) continue
    if (node.key === key) return node
    const child = findNode(node.children || [], key)
    if (child) return child
  }
  return undefined
}

const toSecurityButtonKey = (key: string) => {
  const normalized = String(key || '').trim()
  if (!normalized) return ''
  if (normalized.startsWith('button.')) return normalized
  if (normalized.startsWith('security.')) return `button.${normalized}`
  return `button.security.${normalized}`
}

/**
 * Security operation permissions are resolved from security.children only.
 * Missing operation nodes intentionally remain allowed; only enabled=false denies access.
 */
export const hasSecurityButtonAccess = (key: string) => {
  const config = useConfigStore()
  if (config.isAdministrator()) return true

  const security = findNode(config.menuTree as SecurityAccessNode[], 'security')
  const children = security?.children
  if (!Array.isArray(children) || children.length === 0) return true

  const button = children.find((node) => node?.key === toSecurityButtonKey(key))
  return !button || button.enabled !== false
}

export interface SecurityCapabilities {
  showSecurityMenu: boolean
  canReadSecurity: boolean
  canToggleFirewall: boolean
  canTogglePing: boolean
  canClearFirewallCache: boolean
  canInstallFirewall: boolean
  canReadPortRule: boolean
  canCreatePortRule: boolean
  canUpdatePortRule: boolean
  canDeletePortRule: boolean
  canImportPortRule: boolean
  canExportPortRule: boolean
  canManageIpRule: boolean
  canManagePortForward: boolean
  canManageRegionRule: boolean
  canManageMaliciousIp: boolean
  canReadIntrusion: boolean
  canManageIntrusion: boolean
  canReadAuditEvidence: boolean
}

export const getSecurityCapabilities = (): SecurityCapabilities => {
  const config = useConfigStore()
  return {
    showSecurityMenu: config.isMenuEnabled('security'),
    canReadSecurity: hasSecurityButtonAccess('firewall.read'),
    canToggleFirewall: hasSecurityButtonAccess('firewall.toggle'),
    canTogglePing: hasSecurityButtonAccess('firewall.ping.update'),
    canClearFirewallCache: hasSecurityButtonAccess('firewall.cache.clear'),
    // There is no dedicated install node in the security list, so it remains available by default.
    canInstallFirewall: hasSecurityButtonAccess('firewall.install'),
    canReadPortRule: hasSecurityButtonAccess('firewall.port-rule.read'),
    canCreatePortRule: hasSecurityButtonAccess('firewall.port-rule.create'),
    canUpdatePortRule: hasSecurityButtonAccess('firewall.port-rule.update'),
    canDeletePortRule: hasSecurityButtonAccess('firewall.port-rule.delete'),
    canImportPortRule: hasSecurityButtonAccess('firewall.port-rule.import'),
    canExportPortRule: hasSecurityButtonAccess('firewall.port-rule.export'),
    canManageIpRule: hasSecurityButtonAccess('firewall.ip-rule.manage'),
    canManagePortForward: hasSecurityButtonAccess('firewall.port-forward.manage'),
    canManageRegionRule: hasSecurityButtonAccess('firewall.region-rule.manage'),
    canManageMaliciousIp: hasSecurityButtonAccess('firewall.malicious-ip.manage'),
    canReadIntrusion: hasSecurityButtonAccess('intrusion.read'),
    canManageIntrusion: hasSecurityButtonAccess('intrusion.manage'),
    // Audit evidence is not part of the security permission list and remains available.
    canReadAuditEvidence: true,
  }
}
