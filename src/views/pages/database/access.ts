import { useConfigStore } from '@/stores/modules/config'

type DatabaseAccessNode = {
  key?: string
  enabled?: boolean
  children?: DatabaseAccessNode[]
}

const findNode = (nodes: DatabaseAccessNode[] = [], key: string): DatabaseAccessNode | undefined => {
  for (const node of nodes) {
    if (!node) continue
    if (node.key === key) return node
    const child = findNode(node.children || [], key)
    if (child) return child
  }
  return undefined
}

const toDatabaseButtonKey = (key: string) => {
  const normalized = String(key || '').trim()
  if (!normalized) return ''
  if (normalized.startsWith('button.')) return normalized
  if (normalized.startsWith('database.')) return `button.${normalized}`
  return `button.database.${normalized}`
}

/**
 * Database permissions are resolved from database.children only.
 * An undeclared child is not a restriction; an explicitly disabled child is.
 */
export const hasDatabaseButtonAccess = (key: string) => {
  const config = useConfigStore()
  if (config.isAdministrator()) return true

  const database = findNode(config.menuTree as DatabaseAccessNode[], 'database')
  const children = database?.children
  if (!Array.isArray(children) || children.length === 0) return true

  const button = children.find((node) => node?.key === toDatabaseButtonKey(key))
  return !button || button.enabled !== false
}
