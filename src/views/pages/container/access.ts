import { useConfigStore } from '@/stores/modules/config'

type ContainerAccessNode = {
  key?: string
  enabled?: boolean
  children?: ContainerAccessNode[]
}

const findNode = (
  nodes: ContainerAccessNode[] = [],
  key: string,
): ContainerAccessNode | undefined => {
  for (const node of nodes) {
    if (!node) continue
    if (node.key === key) return node
    const child = findNode(node.children || [], key)
    if (child) return child
  }
  return undefined
}

const toContainerButtonKey = (key: string) => {
  const normalized = String(key || '').trim()
  if (!normalized) return ''
  if (normalized.startsWith('button.')) return normalized
  if (normalized.startsWith('container.')) return `button.${normalized}`
  return `button.container.${normalized}`
}

/**
 * An undeclared container child is allowed. Only an explicitly disabled child
 * hides the corresponding operation from the container module.
 */
export const hasContainerButtonAccess = (key: string) => {
  const config = useConfigStore()
  if (config.isAdministrator()) return true

  const container = findNode(config.menuTree as ContainerAccessNode[], 'container')
  const children = container?.children
  if (!Array.isArray(children) || children.length === 0) return true

  const button = children.find((node) => node?.key === toContainerButtonKey(key))
  return !button || button.enabled !== false
}
