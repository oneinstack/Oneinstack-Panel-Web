import { useConfigStore } from '@/stores/modules/config'

type BastionAccessNode = {
  key?: string
  enabled?: boolean
  children?: BastionAccessNode[]
}

const findNode = (
  nodes: BastionAccessNode[] = [],
  key: string,
): BastionAccessNode | undefined => {
  for (const node of nodes) {
    if (!node) continue
    if (node.key === key) return node
    const child = findNode(node.children || [], key)
    if (child) return child
  }
  return undefined
}

const toBastionButtonKey = (key: string) => {
  const normalized = String(key || '').trim()
  if (!normalized) return ''
  if (normalized.startsWith('button.')) return normalized
  if (normalized.startsWith('bastion.')) return `button.${normalized}`
  return `button.bastion.${normalized}`
}

/**
 * An undeclared bastion child is allowed. Only an explicitly disabled child
 * hides the corresponding operation from the bastion module.
 */
export const hasBastionButtonAccess = (key: string) => {
  const config = useConfigStore()
  if (config.isAdministrator()) return true

  const bastion = findNode(config.menuTree as BastionAccessNode[], 'bastion')
  const children = bastion?.children
  if (!Array.isArray(children) || children.length === 0) return true

  const button = children.find((node) => node?.key === toBastionButtonKey(key))
  return !button || button.enabled !== false
}
