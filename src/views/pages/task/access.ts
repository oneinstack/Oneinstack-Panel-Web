import { useConfigStore } from '@/stores/modules/config'

type TaskAccessNode = {
  key?: string
  enabled?: boolean
  children?: TaskAccessNode[]
}

const findNode = (nodes: TaskAccessNode[] = [], key: string): TaskAccessNode | undefined => {
  for (const node of nodes) {
    if (!node) continue
    if (node.key === key) return node
    const child = findNode(node.children || [], key)
    if (child) return child
  }
  return undefined
}

const toTaskButtonKey = (key: string) => {
  const normalized = String(key || '').trim()
  if (!normalized) return ''
  if (normalized.startsWith('button.')) return normalized
  if (normalized.startsWith('task.')) return `button.${normalized}`
  return `button.task.${normalized}`
}

/**
 * Task permissions are resolved from task.children only.
 * An undeclared child is allowed; an explicitly disabled child is hidden.
 */
export const hasTaskButtonAccess = (key: string) => {
  const config = useConfigStore()
  if (config.isAdministrator()) return true

  const nodes = config.menuTree as TaskAccessNode[]
  const task = findNode(nodes, 'task') || findNode(nodes, 'cron')
  const children = task?.children
  if (!Array.isArray(children) || children.length === 0) return true

  const button = children.find((node) => node?.key === toTaskButtonKey(key))
  return !button || button.enabled !== false
}
