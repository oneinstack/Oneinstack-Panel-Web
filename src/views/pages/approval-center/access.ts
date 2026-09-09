import { useConfigStore } from '@/stores/modules/config'

type ApprovalAccessNode = {
  key?: string
  enabled?: boolean
  children?: ApprovalAccessNode[]
}

const findNode = (nodes: ApprovalAccessNode[] = [], key: string): ApprovalAccessNode | undefined => {
  for (const node of nodes) {
    if (!node) continue
    if (node.key === key) return node
    const child = findNode(node.children || [], key)
    if (child) return child
  }
  return undefined
}

const toApprovalButtonKey = (key: string) => {
  const normalized = String(key || '').trim()
  if (!normalized) return ''
  if (normalized.startsWith('button.')) return normalized
  if (normalized.startsWith('approval.')) return `button.${normalized}`
  return `button.approval.${normalized}`
}

/**
 * Approval operation permissions are resolved from approval.children only.
 * Missing operation nodes intentionally remain allowed; only enabled=false denies access.
 */
export const hasApprovalButtonAccess = (key: string) => {
  const config = useConfigStore()
  if (config.isAdministrator()) return true

  const approval = findNode(config.menuTree as ApprovalAccessNode[], 'approval')
  const children = approval?.children
  if (!Array.isArray(children) || children.length === 0) return true

  const button = children.find((node) => node?.key === toApprovalButtonKey(key))
  return !button || button.enabled !== false
}

export interface ApprovalCapabilities {
  canReadMine: boolean
  canReadAll: boolean
  canViewDetail: boolean
  canReadPayload: boolean
  canApprove: boolean
  canReject: boolean
}

export const getApprovalCapabilities = (): ApprovalCapabilities => ({
  canReadMine: hasApprovalButtonAccess('read.mine'),
  canReadAll: hasApprovalButtonAccess('read.all'),
  canViewDetail: hasApprovalButtonAccess('detail'),
  canReadPayload: hasApprovalButtonAccess('payload.read'),
  canApprove: hasApprovalButtonAccess('approve'),
  canReject: hasApprovalButtonAccess('reject')
})
