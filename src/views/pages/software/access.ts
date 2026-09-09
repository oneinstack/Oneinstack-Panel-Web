import { useConfigStore } from '@/stores/modules/config'

type SoftwareAccessNode = {
  key?: string
  enabled?: boolean
  children?: SoftwareAccessNode[]
}

const findNode = (nodes: SoftwareAccessNode[] = [], key: string): SoftwareAccessNode | undefined => {
  for (const node of nodes) {
    if (!node) continue
    if (node.key === key) return node
    const child = findNode(node.children || [], key)
    if (child) return child
  }
  return undefined
}

const toSoftwareButtonKey = (key: string) => {
  const normalized = String(key || '').trim()
  if (!normalized) return ''
  if (normalized.startsWith('button.')) return normalized
  if (normalized.startsWith('software.')) return `button.${normalized}`
  return `button.software.${normalized}`
}

/**
 * An undeclared software child is allowed; only an explicitly disabled child
 * removes the corresponding operation from the UI.
 */
export const hasSoftwareButtonAccess = (key: string) => {
  const config = useConfigStore()
  if (config.isAdministrator()) return true

  const software = findNode(config.menuTree as SoftwareAccessNode[], 'software')
  const children = software?.children
  if (!Array.isArray(children) || children.length === 0) return true

  const button = children.find((node) => node?.key === toSoftwareButtonKey(key))
  return !button || button.enabled !== false
}
