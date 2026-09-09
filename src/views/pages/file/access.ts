import { useConfigStore } from '@/stores/modules/config'

type FileAccessNode = {
  key?: string
  enabled?: boolean
  children?: FileAccessNode[]
}

const findNode = (nodes: FileAccessNode[] = [], key: string): FileAccessNode | undefined => {
  for (const node of nodes) {
    if (!node) continue
    if (node.key === key) return node
    const child = findNode(node.children || [], key)
    if (child) return child
  }
  return undefined
}

const toFileButtonKey = (key: string) => {
  const normalized = String(key || '').trim()
  if (!normalized) return ''
  if (normalized.startsWith('button.')) return normalized
  if (normalized.startsWith('file.')) return `button.${normalized}`
  return `button.file.${normalized}`
}

/**
 * File permissions are resolved from file.children only.
 * An undeclared child is allowed; an explicitly disabled child is hidden.
 */
export const hasFileButtonAccess = (key: string) => {
  const config = useConfigStore()
  if (config.isAdministrator()) return true

  const file = findNode(config.menuTree as FileAccessNode[], 'file')
  const children = file?.children
  if (!Array.isArray(children) || children.length === 0) return true

  const button = children.find((node) => node?.key === toFileButtonKey(key))
  return !button || button.enabled !== false
}
