import { useConfigStore } from '@/stores/modules/config'

type ConfigSnapshotAccessNode = {
  key?: string
  enabled?: boolean
  children?: ConfigSnapshotAccessNode[]
}

const findNode = (nodes: ConfigSnapshotAccessNode[] = [], key: string): ConfigSnapshotAccessNode | undefined => {
  for (const node of nodes) {
    if (!node) continue
    if (node.key === key) return node
    const child = findNode(node.children || [], key)
    if (child) return child
  }
  return undefined
}

const toConfigSnapshotButtonKey = (key: string) => {
  const normalized = String(key || '').trim()
  if (!normalized) return ''
  if (normalized.startsWith('button.')) return normalized
  if (normalized.startsWith('config.snapshot.')) return `button.${normalized}`
  return `button.config.snapshot.${normalized}`
}

/**
 * Configuration snapshot permissions are resolved from the snapshot page children.
 * Missing operation nodes intentionally remain allowed; only enabled=false denies access.
 */
export const hasConfigSnapshotButtonAccess = (key: string) => {
  const config = useConfigStore()
  if (config.isAdministrator()) return true

  const nodes = config.menuTree as ConfigSnapshotAccessNode[]
  const snapshot = ['config.snapshot', 'configSnapshots', 'config-snapshot']
    .map((parentKey) => findNode(nodes, parentKey))
    .find(Boolean)
  const children = snapshot?.children
  if (!Array.isArray(children) || children.length === 0) return true

  const button = children.find((node) => node?.key === toConfigSnapshotButtonKey(key))
  return !button || button.enabled !== false
}

export interface ConfigSnapshotCapabilities {
  canReadSnapshot: boolean
  canViewSnapshotDetail: boolean
  canReadSnapshotDiff: boolean
  canReadSnapshotResources: boolean
  canCreateSnapshot: boolean
  canPreviewRestore: boolean
  canRestoreSnapshot: boolean
  canForceRestore: boolean
  canDeleteSnapshot: boolean
}

export const getConfigSnapshotCapabilities = (): ConfigSnapshotCapabilities => ({
  canReadSnapshot: hasConfigSnapshotButtonAccess('read'),
  canViewSnapshotDetail: hasConfigSnapshotButtonAccess('detail'),
  canReadSnapshotDiff: hasConfigSnapshotButtonAccess('diff.read'),
  canReadSnapshotResources: hasConfigSnapshotButtonAccess('resource.read'),
  canCreateSnapshot: hasConfigSnapshotButtonAccess('create'),
  canPreviewRestore: hasConfigSnapshotButtonAccess('restore.preview'),
  canRestoreSnapshot: hasConfigSnapshotButtonAccess('restore'),
  canForceRestore: hasConfigSnapshotButtonAccess('restore.force'),
  canDeleteSnapshot: hasConfigSnapshotButtonAccess('delete')
})
