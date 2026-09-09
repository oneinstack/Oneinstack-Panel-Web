import { useConfigStore } from '@/stores/modules/config'

type UserManagementAccessNode = {
  key?: string
  enabled?: boolean
  children?: UserManagementAccessNode[]
}

const findNode = (nodes: UserManagementAccessNode[] = [], key: string): UserManagementAccessNode | undefined => {
  for (const node of nodes) {
    if (!node) continue
    if (node.key === key) return node
    const child = findNode(node.children || [], key)
    if (child) return child
  }
  return undefined
}

const toUserManagementButtonKey = (key: string) => {
  const normalized = String(key || '').trim()
  if (!normalized) return ''
  if (normalized.startsWith('button.')) return normalized
  if (normalized.startsWith('user.user.') || normalized.startsWith('user.permission.')) {
    return `button.${normalized}`
  }
  return `button.user.${normalized}`
}

/**
 * User-management operation permissions are resolved from the page children.
 * Missing operation nodes intentionally remain allowed; only enabled=false denies access.
 */
export const hasUserManagementButtonAccess = (key: string) => {
  const config = useConfigStore()
  if (config.isAdministrator()) return true

  const nodes = config.menuTree as UserManagementAccessNode[]
  const userManagement = ['userManagement', 'user', 'user-management']
    .map((parentKey) => findNode(nodes, parentKey))
    .find(Boolean)
  const children = userManagement?.children
  if (!Array.isArray(children) || children.length === 0) return true

  const button = children.find((node) => node?.key === toUserManagementButtonKey(key))
  return !button || button.enabled !== false
}

export interface UserManagementCapabilities {
  canReadUsers: boolean
  canCreateUser: boolean
  canAssignUserRole: boolean
  canResetUserPassword: boolean
  canDeleteUser: boolean
  canReadPermissions: boolean
  canCreateRole: boolean
  canUpdateRole: boolean
  canAssignRolePermissions: boolean
  canDeleteRole: boolean
}

export const getUserManagementCapabilities = (): UserManagementCapabilities => ({
  canReadUsers: hasUserManagementButtonAccess('user.read'),
  canCreateUser: hasUserManagementButtonAccess('user.create'),
  canAssignUserRole: hasUserManagementButtonAccess('user.role.assign'),
  canResetUserPassword: hasUserManagementButtonAccess('user.password.reset'),
  canDeleteUser: hasUserManagementButtonAccess('user.delete'),
  canReadPermissions: hasUserManagementButtonAccess('permission.read'),
  canCreateRole: hasUserManagementButtonAccess('permission.role.create'),
  canUpdateRole: hasUserManagementButtonAccess('permission.role.update'),
  canAssignRolePermissions: hasUserManagementButtonAccess('permission.role.assign'),
  canDeleteRole: hasUserManagementButtonAccess('permission.role.delete')
})
