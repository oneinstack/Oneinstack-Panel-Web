import { useConfigStore } from '@/stores/modules/config'

type WebsiteAccessNode = {
  key?: string
  enabled?: boolean
  children?: WebsiteAccessNode[]
}

const findNode = (nodes: WebsiteAccessNode[] = [], key: string): WebsiteAccessNode | undefined => {
  for (const node of nodes) {
    if (!node) continue
    if (node.key === key) return node
    const child = findNode(node.children || [], key)
    if (child) return child
  }
  return undefined
}

const toWebsiteButtonKey = (key: string) => {
  const normalized = String(key || '').trim()
  if (!normalized) return ''
  if (normalized.startsWith('button.')) return normalized
  if (normalized.startsWith('website.')) return `button.${normalized}`
  return `button.website.${normalized}`
}

/**
 * Website permissions are intentionally resolved from website.children only.
 * An undeclared child is not a restriction; an explicitly disabled child is.
 */
export const hasWebsiteButtonAccess = (key: string) => {
  const config = useConfigStore()
  if (config.isAdministrator()) return true

  const website = findNode(config.menuTree as WebsiteAccessNode[], 'website')
  const children = website?.children
  if (!Array.isArray(children) || children.length === 0) return true

  const button = children.find((node) => node?.key === toWebsiteButtonKey(key))
  return !button || button.enabled !== false
}
