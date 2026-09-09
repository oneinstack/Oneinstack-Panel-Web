import { useConfigStore } from '@/stores/modules/config'

type MonitorAccessNode = {
  key?: string
  enabled?: boolean
  children?: MonitorAccessNode[]
}

const findNode = (
  nodes: MonitorAccessNode[] = [],
  key: string,
): MonitorAccessNode | undefined => {
  for (const node of nodes) {
    if (!node) continue
    if (node.key === key) return node
    const child = findNode(node.children || [], key)
    if (child) return child
  }
  return undefined
}

const toMonitorButtonKey = (key: string) => {
  const normalized = String(key || '').trim()
  if (!normalized) return ''
  if (normalized.startsWith('button.')) return normalized
  if (normalized.startsWith('monitor.')) return `button.${normalized}`
  return `button.monitor.${normalized}`
}

/**
 * An undeclared monitor child is allowed. Only an explicitly disabled child
 * hides the corresponding operation from the monitoring module.
 */
export const hasMonitorButtonAccess = (key: string) => {
  const config = useConfigStore()
  if (config.isAdministrator()) return true

  const nodes = config.menuTree as MonitorAccessNode[]
  const monitor = findNode(nodes, 'monitor') || findNode(nodes, 'monitoring')
  const children = monitor?.children
  if (!Array.isArray(children) || children.length === 0) return true

  const button = children.find((node) => node?.key === toMonitorButtonKey(key))
  return !button || button.enabled !== false
}
