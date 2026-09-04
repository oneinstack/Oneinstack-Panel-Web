<script setup lang="ts">
import CustomTable, { type ColumnItem } from '@/components/custom-table.vue'
import SearchInput from '@/components/search-input.vue'
import SystemManagementTabs from '@/views/pages/system-management/components/system-management-tabs.vue'
import RoleMenuTreeNode from './components/role-menu-tree-node.vue'
import { Api, type AccessMenuNode, type AccessPermission, type AccessRole as ApiAccessRole } from '@/api/modules'
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowRight, CircleCheck, CollectionTag, Delete, Edit, Key, Plus, User } from '@element-plus/icons-vue'
import i18n from '@/lang'
import { menuPathKeyMap } from '@/utils/access'

interface AccessRole {
  code?: string
  key: string
  name: string
  description?: string
  builtin?: boolean
  permissions?: string[]
  menuTree?: AccessMenuNode[]
}

interface AccessUser {
  id: number
  username: string
  isAdmin?: boolean
  isSuperAdmin?: boolean
  mustChangePassword?: boolean
  passwordChangeReason?: 'initial' | 'admin_reset' | string
  createdAt?: string
  roles?: AccessRole[]
}

interface RoleEditorForm {
  key: string
  name: string
  description: string
  permissionCodes: string[]
}

interface MenuEditorForm {
  key: string
  parentKey: string
  type: 'directory' | 'page' | 'button'
  name: string
  nameEn: string
  targetType: 'route' | 'action' | ''
  targetKey: string
  iconKey: string
  sort: number
  enabled: boolean
  superAdminOnly: boolean
  featureKey: 'terminal' | 'bastion' | ''
  permissionCodes: string[]
}

interface PermissionGroup {
  module: string
  label: string
  items: AccessPermission[]
}

const t = (key: string, fallback?: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params)
  return value && value !== key ? value : fallback || key
}

const loading = reactive({
  bootstrap: false,
  users: false,
  createUser: false,
  updateRoles: false,
  resetPassword: false,
  deleteUserId: 0,
  menuStatusKey: ''
})

const currentUser = ref<any>(null)
const roles = ref<ApiAccessRole[]>([])
const permissions = ref<AccessPermission[]>([])
const menus = ref<AccessMenuNode[]>([])
const expandedMenuKey = ref<string | null>(null)
const roleMenuTreeRef = ref<HTMLElement | null>(null)
const expandedRoleMenuKeys = ref<Set<string>>(new Set())
const roleAdvancedOpen = ref(false)
const activeTab = ref('users')
const accessTabItems = [
  { key: 'users', label: '用户管理', labelKey: 'userManagement.userTab' },
  { key: 'permissions', label: '权限管理', labelKey: 'userManagement.permissionTab' },
  { key: 'menus', label: '菜单管理', labelKey: 'userManagement.menuTab' }
]

const userState = reactive({
  keyword: '',
  filters: {
    page: 1,
    pageSize: 10,
    keyword: ''
  },
  total: 0,
  list: [] as AccessUser[],
  columns: computed<ColumnItem[]>(() => [
    { prop: 'username', label: t('userManagement.account', 'Account'), minWidth: 160 },
    { prop: 'roles', label: t('userManagement.role', 'Role'), minWidth: 240 },
    { prop: 'scope', label: t('userManagement.scope', 'Permission scope'), minWidth: 140 },
    { prop: 'mustChangePassword', label: t('common.status', 'Status'), minWidth: 220, className: 'user-status-column' },
    { prop: 'createdAt', label: t('userManagement.createdAt', 'Created at'), minWidth: 180 },
    { prop: 'action', label: t('common.action', 'Action'), width: 300, fixed: 'right' }
  ])
})

const roleColumns = computed<ColumnItem[]>(() => [
  { prop: 'key', label: t('userManagement.roleKey', 'Role key'), minWidth: 180 },
  { prop: 'name', label: t('userManagement.roleName', 'Role name'), minWidth: 180 },
  { prop: 'description', label: t('userManagement.roleDescription', 'Description'), minWidth: 240, showOverflowTooltip: true },
  { prop: 'permissionCount', label: t('userManagement.permissionCount', 'Permissions'), width: 140, slot: 'permissionCount', align: 'center' },
  { prop: 'status', label: t('common.status', 'Status'), width: 140, slot: 'status', align: 'center' },
  { prop: 'action', label: t('common.action', 'Action'), width: 220, fixed: 'right', slot: 'action' }
])

const createUserDialog = reactive({
  show: false,
  form: {
    username: '',
    password: '',
    isAdmin: false,
    roleCodes: [] as string[]
  },
  open: () => {
    createUserDialog.form.username = ''
    createUserDialog.form.password = ''
    createUserDialog.form.isAdmin = false
    createUserDialog.form.roleCodes = []
    createUserDialog.show = true
  }
})

const roleDialog = reactive({
  show: false,
  user: null as AccessUser | null,
  roleCodes: [] as string[],
  open: (user: AccessUser) => {
    roleDialog.user = user
    roleDialog.roleCodes = (user.roles || []).map((item) => item.key || item.code || '').filter(Boolean)
    roleDialog.show = true
  }
})

const roleEditorDialog = reactive({
  show: false,
  loading: false,
  mode: 'create' as 'create' | 'edit',
  detailLoading: false,
  detail: null as (AccessRole & { menuTree?: AccessMenuNode[] }) | null,
  form: {
    key: '',
    name: '',
    description: '',
    permissionCodes: [] as string[]
  } as RoleEditorForm,
  open: async (role?: AccessRole | null) => {
    roleEditorDialog.mode = role ? 'edit' : 'create'
    roleEditorDialog.form.key = String(role?.key || role?.code || '').trim()
    roleEditorDialog.form.name = role?.name || ''
    roleEditorDialog.form.description = role?.description || ''
    roleEditorDialog.form.permissionCodes = normalizeRolePermissionCodes(role?.permissions || [])
    roleEditorDialog.detail = role ? role : null
    expandedRoleMenuKeys.value = new Set(roleMenuExpandableKeys.value)
    roleAdvancedOpen.value = false
    roleEditorDialog.show = true
    if (!role?.key) return
    roleEditorDialog.detailLoading = true
    try {
      const response = await Api.getAccessRoleDetail(role.key)
      roleEditorDialog.detail = response.data || roleEditorDialog.detail
      roleEditorDialog.form.permissionCodes = normalizeRolePermissionCodes(
        response.data?.permissions || roleEditorDialog.form.permissionCodes
      )
    } catch {
      roleEditorDialog.detail = roleEditorDialog.detail || role
    } finally {
      roleEditorDialog.detailLoading = false
    }
  }
})

const menuEditorDialog = reactive({
  show: false,
  loading: false,
  mode: 'create' as 'create' | 'edit',
  detailLoading: false,
  detail: null as AccessMenuNode | null,
  form: {
    key: '',
    parentKey: '',
    type: 'page' as 'directory' | 'page' | 'button',
    name: '',
    nameEn: '',
    targetType: 'route' as 'route' | 'action' | '',
    targetKey: '',
    iconKey: '',
    sort: 0,
    enabled: true,
    superAdminOnly: false,
    featureKey: '' as 'terminal' | 'bastion' | '',
    permissionCodes: [] as string[]
  } as MenuEditorForm,
  open: async (menu?: AccessMenuNode | null) => {
    menuEditorDialog.mode = menu ? 'edit' : 'create'
    menuEditorDialog.form.key = String(menu?.key || '').trim()
    menuEditorDialog.form.parentKey = String(menu?.parentKey || '').trim()
    menuEditorDialog.form.type = (menu?.type as 'directory' | 'page' | 'button') || 'page'
    menuEditorDialog.form.name = menu?.name || ''
    menuEditorDialog.form.nameEn = menu?.nameEn || ''
    menuEditorDialog.form.targetType = (menu?.targetType as 'route' | 'action' | '') || ''
    menuEditorDialog.form.targetKey = menu?.targetKey || ''
    menuEditorDialog.form.iconKey = menu?.iconKey || ''
    menuEditorDialog.form.sort = typeof menu?.sort === 'number' ? menu.sort : Number(menu?.sort || 0)
    menuEditorDialog.form.enabled = menu?.enabled !== false
    menuEditorDialog.form.superAdminOnly = Boolean(menu?.superAdminOnly)
    menuEditorDialog.form.featureKey = (menu?.featureKey as 'terminal' | 'bastion' | '') || ''
    menuEditorDialog.form.permissionCodes = [...(menu?.permissionCodes || menu?.permissions?.map((item) => item.code) || [])]
    menuEditorDialog.detail = menu || null
    menuEditorDialog.show = true
    if (!menu?.key) return
    menuEditorDialog.detailLoading = true
    try {
      const response = await Api.getAccessMenus()
      menuEditorDialog.detail = findMenuByKey(Array.isArray(response.data) ? response.data : [], menu.key) || menuEditorDialog.detail
    } finally {
      menuEditorDialog.detailLoading = false
    }
  }
})

const passwordDialog = reactive({
  show: false,
  user: null as AccessUser | null,
  password: '',
  open: (user: AccessUser) => {
    passwordDialog.user = user
    passwordDialog.password = ''
    passwordDialog.show = true
  }
})

const canManageUsers = computed(() => Boolean(currentUser.value?.isSuperAdmin))
const canManageRoles = computed(() => Boolean(currentUser.value?.isSuperAdmin))
const canManageMenus = computed(() => Boolean(currentUser.value?.isSuperAdmin))
const roleTagList = computed(() => currentUser.value?.roles || [])
const totalAssignedUsers = computed(() => userState.list.filter((item) => (item.roles || []).length > 0).length)
const totalPendingUsers = computed(() => userState.list.filter((item) => item.mustChangePassword).length)
const allRoleCodes = computed(() => roles.value.map((item) => item.key || item.code || '').filter(Boolean))
const createRoleAllChecked = computed(
  () => allRoleCodes.value.length > 0 && createUserDialog.form.roleCodes.length === allRoleCodes.value.length
)
const createRoleIndeterminate = computed(
  () => createUserDialog.form.roleCodes.length > 0 && createUserDialog.form.roleCodes.length < allRoleCodes.value.length
)
const roleAllChecked = computed(
  () => allRoleCodes.value.length > 0 && roleDialog.roleCodes.length === allRoleCodes.value.length
)
const roleIndeterminate = computed(
  () => roleDialog.roleCodes.length > 0 && roleDialog.roleCodes.length < allRoleCodes.value.length
)
const permissionGroups = computed<PermissionGroup[]>(() => {
  const grouped = permissions.value.reduce<Record<string, AccessPermission[]>>((acc, permission) => {
    const groupKey = permission.module || 'misc'
    if (!acc[groupKey]) acc[groupKey] = []
    acc[groupKey].push(permission)
    return acc
  }, {})
  return Object.entries(grouped).map(([module, items]) => ({
    module,
    label: module,
    items: items.sort((left, right) => left.code.localeCompare(right.code))
  }))
})

const permissionGroupAllChecked = (group: PermissionGroup) =>
  group.items.length > 0 && group.items.every((item) => roleEditorDialog.form.permissionCodes.includes(item.code))

const permissionGroupIndeterminate = (group: PermissionGroup) => {
  const selectedCount = group.items.filter((item) => roleEditorDialog.form.permissionCodes.includes(item.code)).length
  return selectedCount > 0 && selectedCount < group.items.length
}

const togglePermissionGroup = (group: PermissionGroup, value: string | number | boolean) => {
  const groupCodes = new Set(group.items.map((item) => item.code))
  const remainingCodes = roleEditorDialog.form.permissionCodes.filter((code) => !groupCodes.has(code))
  roleEditorDialog.form.permissionCodes = Boolean(value)
    ? [...remainingCodes, ...group.items.map((item) => item.code)]
    : remainingCodes
}

const flattenMenuNodes = (nodes: AccessMenuNode[] = [], depth = 0): Array<AccessMenuNode & { depth: number }> =>
  nodes.flatMap((node) => {
    if (!node) return []
    const current = { ...node, depth }
    const children = node.children?.length ? flattenMenuNodes(node.children, depth + 1) : []
    return [current, ...children]
  })

const findMenuByKey = (nodes: AccessMenuNode[], key: string): AccessMenuNode | null => {
  for (const node of nodes || []) {
    if (node.key === key) return node
    if (node.children?.length) {
      const child = findMenuByKey(node.children, key)
      if (child) return child
    }
  }
  return null
}

const buildMenuTree = (nodes: AccessMenuNode[]) => {
  const flatNodes: AccessMenuNode[] = []
  const collectNodes = (items: AccessMenuNode[], inheritedParentKey?: string) => {
    items.forEach((node) => {
      if (!node?.key) return
      const { children, ...menu } = node
      flatNodes.push({
        ...menu,
        parentKey: menu.parentKey || inheritedParentKey,
        children: []
      })
      if (children?.length) collectNodes(children, node.key)
    })
  }
  collectNodes(nodes)

  const nodeMap = new Map(flatNodes.map((node) => [node.key, node]))
  const roots: AccessMenuNode[] = []
  flatNodes.forEach((node) => {
    const parent = node.parentKey && node.parentKey !== node.key ? nodeMap.get(node.parentKey) : undefined
    if (parent) parent.children!.push(node)
    else roots.push(node)
  })
  return roots
}

const menuTree = computed(() => buildMenuTree(menus.value || []))
const menuRows = computed(() => flattenMenuNodes(menuTree.value))
const registeredPermissionCodeSet = computed(() => new Set(permissions.value.map((permission) => permission.code)))
const normalizeRolePermissionCodes = (codes: string[] = []) => Array.from(new Set(
  codes.map((code) => String(code).trim()).filter((code) => registeredPermissionCodeSet.value.has(code))
))
const menuNodePermissionCodes = (node: AccessMenuNode) => {
  const buttonCode = node.type === 'button' && node.key.startsWith('button.')
    ? node.key.slice('button.'.length)
    : ''
  if (buttonCode && registeredPermissionCodeSet.value.has(buttonCode)) return [buttonCode]

  return Array.from(new Set([
    ...(node.permissionCodes || []),
    ...(node.permissions || []).map((permission) => permission.code)
  ].filter((code) => Boolean(code) && registeredPermissionCodeSet.value.has(code))))
}
const roleMenuTree = computed(() => {
  const build = (nodes: AccessMenuNode[]): AccessMenuNode[] => nodes
    .filter((node) => node.type !== 'button')
    .map((node) => {
      const menu = { ...node, children: [] as AccessMenuNode[] }
      const childMenus = build(node.children || [])
      // Use the menu's registered permission records so labels and codes match the summary.
      const permissionNodes = menuNodePermissionCodes(menu).map((code) => ({
        key: `${menu.key}::${code}`,
        name: permissions.value.find((permission) => permission.code === code)?.name || code,
        type: 'button' as const,
        parentKey: menu.key,
        permissionCodes: [code],
        children: []
      }))

      return { ...menu, children: [...childMenus, ...permissionNodes] }
    })

  return build(menuTree.value)
})
const roleMenuExpandableKeys = computed(() => {
  const keys: string[] = []
  const collect = (nodes: AccessMenuNode[]) => {
    nodes.forEach((node) => {
      if (node.children?.length) {
        keys.push(node.key)
        collect(node.children)
      }
    })
  }
  collect(roleMenuTree.value)
  return keys
})
const descendantPermissionCodes = (node: AccessMenuNode): string[] => Array.from(new Set([
  ...menuNodePermissionCodes(node),
  ...(node.children || []).flatMap((child) => descendantPermissionCodes(child))
]))
const roleMenuSelectionCodes = (node: AccessMenuNode) => node.type === 'directory'
  ? descendantPermissionCodes(node)
  : menuNodePermissionCodes(node)
const toggleRoleMenuNode = (node: AccessMenuNode) => {
  const codes = roleMenuSelectionCodes(node).filter((code) => registeredPermissionCodeSet.value.has(code))
  if (!codes.length) return

  const selectedCodes = new Set(normalizeRolePermissionCodes(roleEditorDialog.form.permissionCodes))
  const shouldSelect = codes.some((code) => !selectedCodes.has(code))
  codes.forEach((code) => {
    if (shouldSelect) selectedCodes.add(code)
    else selectedCodes.delete(code)
  })
  roleEditorDialog.form.permissionCodes = Array.from(selectedCodes)
}
const toggleRoleMenuExpand = (key: string) => {
  const nextKeys = new Set(expandedRoleMenuKeys.value)
  if (nextKeys.has(key)) nextKeys.delete(key)
  else nextKeys.add(key)
  expandedRoleMenuKeys.value = nextKeys
}
const roleMenuNodes = computed(() => flattenMenuNodes(roleMenuTree.value))
const roleSelectedPermissionCodes = computed(() => permissions.value
  .filter((permission) => roleEditorDialog.form.permissionCodes.includes(permission.code))
  .map((permission) => permission.code))
const roleSelectedMenuNodes = computed(() => roleMenuNodes.value.filter((node) =>
  node.type !== 'button' && roleMenuSelectionCodes(node).some((code) => roleSelectedPermissionCodes.value.includes(code))
))
const rolePermissionSummary = computed(() => roleSelectedPermissionCodes.value.map((code) => {
  const permission = permissions.value.find((item) => item.code === code)
  return {
    code,
    name: permission?.name || code
  }
}))
const findMenuPath = (nodes: AccessMenuNode[], key: string, parents: string[] = []): string[] => {
  for (const node of nodes) {
    if (node.key === key) return parents
    if (node.children?.length) {
      const path = findMenuPath(node.children, key, [...parents, node.key])
      if (path.length) return path
    }
  }
  return []
}
const findMenuKeyByPermission = (code: string, nodes: AccessMenuNode[] = roleMenuTree.value): string | null => {
  for (const node of nodes) {
    if (menuNodePermissionCodes(node).includes(code)) return node.key
    if (node.children?.length) {
      const key = findMenuKeyByPermission(code, node.children)
      if (key) return key
    }
  }
  return null
}
const locateRoleMenu = async (key: string) => {
  const nextKeys = new Set(expandedRoleMenuKeys.value)
  findMenuPath(roleMenuTree.value, key).forEach((parentKey) => nextKeys.add(parentKey))
  expandedRoleMenuKeys.value = nextKeys
  await nextTick()

  const target = Array.from(roleMenuTreeRef.value?.querySelectorAll<HTMLElement>('[data-menu-key]') || [])
    .find((element) => element.dataset.menuKey === key)
  if (!target) return
  target.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  target.classList.add('is-located')
  window.setTimeout(() => target.classList.remove('is-located'), 1200)
}
const locateRolePermission = (code: string) => {
  const key = findMenuKeyByPermission(code)
  if (key) locateRoleMenu(key)
}
const visibleMenuRows = computed(() => {
  const rows: Array<AccessMenuNode & { depth: number; hasChildren: boolean }> = []
  const appendVisibleRows = (nodes: AccessMenuNode[], depth = 0) => {
    nodes.forEach((node) => {
      if (!node) return
      const hasChildren = Boolean(node.children?.length)
      const { children, ...menu } = node
      rows.push({ ...menu, depth, hasChildren })
      if (node.children?.length && expandedMenuKey.value === node.key) {
        appendVisibleRows(node.children, depth + 1)
      }
    })
  }
  appendVisibleRows(menuTree.value)
  return rows
})
const toggleMenuExpanded = (key: string) => {
  expandedMenuKey.value = expandedMenuKey.value === key ? null : key
}
const handleMenuKeyClick = (row: AccessMenuNode & { hasChildren?: boolean }) => {
  if (row.hasChildren) toggleMenuExpanded(row.key)
}
const menuPermissionCount = (row: AccessMenuNode) => (row.permissionCodes?.length || row.permissions?.length || 0)
const menuTypeTagType = (type?: AccessMenuNode['type']) => {
  if (type === 'directory') return 'warning'
  if (type === 'button') return 'info'
  return 'primary'
}
const updateMenuStatus = async (menu: AccessMenuNode, value: boolean | string | number) => {
  const key = String(menu?.key || '').trim()
  if (!key || !canManageMenus.value || loading.menuStatusKey) return

  const enabled = value === true || value === 'true' || value === 1 || value === '1'
  loading.menuStatusKey = key
  try {
    await Api.setAccessMenuStatus(key, enabled)
    ElMessage.success(
      enabled
        ? t('userManagement.enableMenuSuccess', 'Menu enabled')
        : t('userManagement.disableMenuSuccess', 'Menu disabled')
    )
    const response = await Api.getAccessMenus()
    menus.value = Array.isArray(response.data) ? response.data : []
  } catch (error: any) {
    // ElMessage.error(error?.message || t('userManagement.updateMenuStatusFailed', 'Failed to update menu status'))
  } finally {
    loading.menuStatusKey = ''
  }
}
const menuCellStyle = ({ column }: { column?: { property?: string } }) => {
  if (column?.property !== 'action') return undefined
  return {
    background: 'var(--surface-card)',
    backgroundColor: 'var(--surface-card)'
  }
}
const menuParentOptions = computed(() =>
  menuRows.value
    .filter((item) => item.type !== 'button' && item.key !== menuEditorDialog.form.key)
    .map((item) => ({
      label: `${'　'.repeat(item.depth)}${item.name}`,
      value: item.key,
      disabled: Boolean(item.type === 'button')
    }))
)
const routeTargetOptions = computed(() =>
  menuPathKeyMap.map((item) => ({
    label: `${item.path} · ${item.key}`,
    value: item.path
  }))
)
const menuColumns = computed<ColumnItem[]>(() => [
  { prop: 'key', label: t('userManagement.menuKey', 'Menu key'), minWidth: 240, className: 'menu-key-column' },
  { prop: 'name', label: t('userManagement.menuName', 'Menu name'), minWidth: 210, className: 'menu-name-column' },
  { prop: 'type', label: t('userManagement.menuType', 'Type'), width: 126, slot: 'type', align: 'center', className: 'menu-type-column' },
  { prop: 'target', label: t('userManagement.menuTarget', 'Target'), minWidth: 220, slot: 'target', className: 'menu-target-column' },
  { prop: 'permissionCodes', label: t('userManagement.menuPermissions', 'Permissions'), width: 140, slot: 'permissionCount', align: 'center' },
  { prop: 'enabled', label: t('common.status', 'Status'), width: 150, slot: 'enabled', align: 'center' },
  { prop: 'action', label: t('common.action', 'Action'), width: 230, fixed: 'right', slot: 'action' }
])

const formatTime = (value?: string) => value ? new Date(value).toLocaleString() : '—'
const roleKeyByCode: Record<string, string> = {
  read_only_observer: 'readOnlyObserver',
  readonly_observer: 'readOnlyObserver',
  observer: 'readOnlyObserver',
  security_auditor: 'securityAuditor',
  security_audit: 'securityAuditor',
  system_operator: 'systemOperator',
  system_ops: 'systemOperator',
  database_manager: 'databaseManager',
  db_manager: 'databaseManager',
  operation_approver: 'operationApprover',
  ops_approver: 'operationApprover',
  website_manager: 'websiteManager',
  site_manager: 'websiteManager'
}
const roleKeyByName: Record<string, string> = {
  '\u53ea\u8bfb\u89c2\u5bdf\u5458': 'readOnlyObserver',
  '\u5b89\u5168\u5ba1\u8ba1\u5458': 'securityAuditor',
  '\u7cfb\u7edf\u8fd0\u7ef4': 'systemOperator',
  '\u6570\u636e\u5e93\u7ba1\u7406\u5458': 'databaseManager',
  '\u64cd\u4f5c\u5ba1\u6279\u5458': 'operationApprover',
  '\u7f51\u7ad9\u7ba1\u7406\u5458': 'websiteManager'
}
const normalizeRoleCode = (value?: string) => String(value || '').trim().replace(/-/g, '_').toLowerCase()
const roleLabel = (role: AccessRole) => {
  const roleKey = roleKeyByCode[normalizeRoleCode(role.code)] || roleKeyByName[role.name]
  if (roleKey) return t(`userManagement.roles.${roleKey}`, role.name || role.code || role.key)
  return role.name || role.code || role.key
}
const userScopeLabel = (row: AccessUser) => {
  if (row.isSuperAdmin) return t('userManagement.superAdmin', 'Super administrator')
  if (!(row.roles || []).length) return t('userManagement.unauthorized', 'Unauthorized')
  return t('userManagement.roleAuthorized', 'Role authorized')
}
const currentLoginUserId = computed(() =>
  Number(currentUser.value?.id || currentUser.value?.user?.id || 0)
)
const currentLoginUsername = computed(() =>
  String(currentUser.value?.username || currentUser.value?.user?.username || '')
)
const isCurrentLoginUser = (row: AccessUser) =>
  Boolean((currentLoginUserId.value && row.id === currentLoginUserId.value) || (currentLoginUsername.value && row.username === currentLoginUsername.value))
const isSuperAdminUser = (row?: AccessUser | null) => Boolean(row?.isSuperAdmin)
const passwordStatusLabel = (row: AccessUser) => {
  if (!row.mustChangePassword) return t('userManagement.healthy', 'Normal')
  if (row.passwordChangeReason === 'admin_reset') {
    return t('userManagement.mustChangePasswordAfterReset', 'Password change required after admin reset')
  }
  if (row.passwordChangeReason === 'initial') {
    return t('userManagement.mustChangePasswordInitial', 'Initial password change required')
  }
  return t('userManagement.mustChangePassword', 'Password change required')
}

const loadBootstrap = async () => {
  loading.bootstrap = true
  try {
    const [userRes, roleRes, menuRes] = await Promise.all([
      Api.getCurrentUserAccess(),
      Api.getAccessRoles(),
      Api.getAccessMenus().catch(() => ({ data: [] }))
    ])
    currentUser.value = userRes.data
    roles.value = roleRes.data || []
    menus.value = Array.isArray(menuRes?.data) ? menuRes.data : []
    try {
      const permissionRes = await Api.getAccessPermissions()
      permissions.value = Array.isArray(permissionRes)
        ? permissionRes
        : Array.isArray(permissionRes?.data)
          ? permissionRes.data
          : []
    } catch {
      permissions.value = []
    }
  } finally {
    loading.bootstrap = false
  }
}

const loadUsers = async () => {
  loading.users = true
  try {
    const response = await Api.getAccessUsers(userState.filters)
    userState.list = response.data?.items || []
    userState.total = response.data?.total || 0
  } finally {
    loading.users = false
  }
}

const openRoleEditor = async (role?: AccessRole | null) => {
  await roleEditorDialog.open(role || null)
}

const submitRoleEditor = async () => {
  const key = roleEditorDialog.form.key.trim()
  const name = roleEditorDialog.form.name.trim()
  const description = roleEditorDialog.form.description.trim()

  if (roleEditorDialog.mode === 'create') {
    if (!key) {
      ElMessage.warning(t('userManagement.inputRoleKey', 'Enter a role key'))
      return
    }
    if (!/^[a-z][a-z0-9._-]{0,63}$/.test(key)) {
      ElMessage.warning(t('userManagement.roleKeyError', 'Role key must start with a lowercase letter and may contain lowercase letters, numbers, ".", "_" or "-"'))
      return
    }
  }

  if (!name) {
    ElMessage.warning(t('userManagement.inputRoleName', 'Enter a role name'))
    return
  }

  roleEditorDialog.loading = true
  try {
    const permissionCodes = normalizeRolePermissionCodes(roleEditorDialog.form.permissionCodes)
    const payload = {
      name,
      description,
      permissionCodes
    }
    if (roleEditorDialog.mode === 'create') {
      await Api.createAccessRole({ key, code: key, ...payload })
      ElMessage.success(t('userManagement.createRoleSuccess', 'Role created'))
    } else {
      await Api.updateAccessRole(key, payload)
      ElMessage.success(t('userManagement.updateRoleSuccess', 'Role updated'))
    }
    roleEditorDialog.show = false
    await loadBootstrap()
  } catch (error: any) {
    // ElMessage.error(error?.message || t('userManagement.updateRoleFailed', 'Failed to save role'))
  } finally {
    roleEditorDialog.loading = false
  }
}

const resetMenuEditorForm = () => {
  menuEditorDialog.form.key = ''
  menuEditorDialog.form.parentKey = ''
  menuEditorDialog.form.type = 'page'
  menuEditorDialog.form.name = ''
  menuEditorDialog.form.nameEn = ''
  menuEditorDialog.form.targetType = 'route'
  menuEditorDialog.form.targetKey = ''
  menuEditorDialog.form.iconKey = ''
  menuEditorDialog.form.sort = 0
  menuEditorDialog.form.enabled = true
  menuEditorDialog.form.superAdminOnly = false
  menuEditorDialog.form.featureKey = ''
  menuEditorDialog.form.permissionCodes = []
}

const handleMenuTypeChange = (value: MenuEditorForm['type']) => {
  if (value === 'directory') {
    menuEditorDialog.form.targetType = ''
    menuEditorDialog.form.targetKey = ''
    menuEditorDialog.form.permissionCodes = []
    return
  }

  menuEditorDialog.form.targetType = value === 'button' ? 'action' : 'route'
  menuEditorDialog.form.targetKey = ''
}

const openMenuEditor = async (menu?: AccessMenuNode | null) => {
  resetMenuEditorForm()
  await menuEditorDialog.open(menu || null)
}

const submitMenuEditor = async () => {
  const key = menuEditorDialog.form.key.trim()
  const name = menuEditorDialog.form.name.trim()
  const nameEn = menuEditorDialog.form.nameEn.trim()
  const targetKey = menuEditorDialog.form.targetKey.trim()
  const iconKey = menuEditorDialog.form.iconKey.trim()
  const parentKey = menuEditorDialog.form.parentKey.trim()
  const type = menuEditorDialog.form.type
  const targetType = menuEditorDialog.form.targetType
  const permissionCodes = [...new Set(menuEditorDialog.form.permissionCodes.map((item) => String(item).trim()).filter(Boolean))]

  if (menuEditorDialog.mode === 'create') {
    if (!key) {
      ElMessage.warning(t('userManagement.inputMenuKey', 'Enter a menu key'))
      return
    }
  }

  if (!name) {
    ElMessage.warning(t('userManagement.inputMenuName', 'Enter a menu name'))
    return
  }

  if (type !== 'directory') {
    if (!targetType) {
      ElMessage.warning(t('userManagement.inputMenuTargetType', 'Select a target type'))
      return
    }
    if (!targetKey) {
      ElMessage.warning(t('userManagement.inputMenuTargetKey', 'Enter a target key'))
      return
    }
  }

  if (type === 'button' && parentKey && findMenuByKey(menus.value, parentKey)?.type === 'button') {
    ElMessage.warning(t('userManagement.buttonParentError', 'Buttons cannot be used as parent nodes'))
    return
  }

  menuEditorDialog.loading = true
  try {
    const payload = {
      key,
      parentKey: parentKey || undefined,
      type,
      name,
      nameEn: nameEn || undefined,
      targetType: type === 'directory' ? undefined : targetType,
      targetKey: type === 'directory' ? undefined : targetKey,
      iconKey: iconKey || undefined,
      sort: Number(menuEditorDialog.form.sort || 0),
      enabled: menuEditorDialog.form.enabled,
      superAdminOnly: menuEditorDialog.form.superAdminOnly,
      featureKey: menuEditorDialog.form.featureKey || undefined,
      permissionCodes: type === 'directory' ? undefined : permissionCodes
    }
    if (menuEditorDialog.mode === 'create') {
      await Api.createAccessMenu(payload as any)
      ElMessage.success(t('userManagement.createMenuSuccess', 'Menu created'))
    } else {
      await Api.updateAccessMenu(key, payload as any)
      ElMessage.success(t('userManagement.updateMenuSuccess', 'Menu updated'))
    }
    menuEditorDialog.show = false
    await loadBootstrap()
  } finally {
    menuEditorDialog.loading = false
  }
}

const deleteMenu = async (menu: AccessMenuNode) => {
  const key = menu.key
  if (!key) {
    ElMessage.warning(t('userManagement.invalidMenuKey', 'Invalid menu key'))
    return
  }
  if (menu.builtin) {
    ElMessage.warning(t('userManagement.cannotDeleteBuiltinMenu', 'Built-in menus cannot be deleted'))
    return
  }
  if (menu.children?.length) {
    ElMessage.warning(t('userManagement.menuHasChildren', 'Menus with children cannot be edited directly here'))
    return
  }
  await ElMessageBox.confirm(
    t('userManagement.deleteMenuConfirm', 'Delete menu "{name}"? This action cannot be undone.', { name: menu.name || key }),
    t('userManagement.deleteMenu', 'Delete menu'),
    {
      type: 'warning',
      confirmButtonText: t('common.delete', 'Delete'),
      cancelButtonText: t('common.cancel', 'Cancel')
    }
  )
  await Api.deleteAccessMenu(key)
  ElMessage.success(t('userManagement.deleteMenuSuccess', 'Menu deleted'))
  await loadBootstrap()
}

const deleteRole = async (role: AccessRole) => {
  const key = role.key || role.code || ''
  if (!key) {
    ElMessage.warning(t('userManagement.invalidRoleKey', 'Invalid role key'))
    return
  }
  if (role.builtin || key === 'super_admin') {
    ElMessage.warning(t('userManagement.cannotDeleteBuiltinRole', 'Built-in roles cannot be deleted'))
    return
  }
  await ElMessageBox.confirm(
    t('userManagement.deleteRoleConfirm', 'Delete role "{name}"? This will remove the role from all users.', { name: role.name || key }),
    t('userManagement.deleteRole', 'Delete role'),
    {
      type: 'warning',
      confirmButtonText: t('common.delete', 'Delete'),
      cancelButtonText: t('common.cancel', 'Cancel')
    }
  )
  try {
    await Api.deleteAccessRole(key)
    ElMessage.success(t('userManagement.deleteRoleSuccess', 'Role deleted'))
    await loadBootstrap()
  } catch (error: any) {
    // ElMessage.error(error?.message || t('userManagement.deleteRoleFailed', 'Failed to delete role'))
  }
}

const searchUsers = () => {
  userState.filters.page = 1
  userState.filters.keyword = userState.keyword.trim()
  void loadUsers()
}

const resetUsers = () => {
  userState.keyword = ''
  userState.filters.page = 1
  userState.filters.keyword = ''
  void loadUsers()
}

const submitCreateUser = async () => {
  const username = createUserDialog.form.username.trim()
  if (!username) {
    ElMessage.warning(t('userManagement.inputUsername', 'Enter an account name'))
    return
  }
  if (username.length < 3) {
    ElMessage.warning(t('userManagement.usernameMinLength', 'Account name must be at least 3 characters'))
    return
  }
  if (!createUserDialog.form.password.trim()) {
    ElMessage.warning(t('userManagement.inputInitialPassword', 'Enter the initial password'))
    return
  }

  loading.createUser = true
  try {
    await Api.createAccessUser({
      username,
      password: createUserDialog.form.password,
      roleCodes: createUserDialog.form.isAdmin ? [] : createUserDialog.form.roleCodes,
      isAdmin: createUserDialog.form.isAdmin
    })
    ElMessage.success(t('userManagement.createSuccess', 'User created'))
    createUserDialog.show = false
    await loadUsers()
  } catch (error: any) {
    // ElMessage.error(error?.message || t('userManagement.createFailed', 'Failed to create user'))
  } finally {
    loading.createUser = false
  }
}

const submitRoleUpdate = async () => {
  if (!roleDialog.user) return
  loading.updateRoles = true
  try {
    await Api.updateAccessUserRoles(roleDialog.user.id, {
      roleCodes: roleDialog.roleCodes
    })
    ElMessage.success(t('userManagement.roleUpdateSuccess', 'Roles updated'))
    roleDialog.show = false
    await loadUsers()
  } catch (error: any) {
    // ElMessage.error(error?.message || t('userManagement.roleUpdateFailed', 'Failed to update roles'))
  } finally {
    loading.updateRoles = false
  }
}

const toggleAllRoles = (value: string | number | boolean) => {
  roleDialog.roleCodes = Boolean(value) ? [...allRoleCodes.value] : []
}

const toggleCreateAllRoles = (value: string | number | boolean) => {
  createUserDialog.form.roleCodes = Boolean(value) ? [...allRoleCodes.value] : []
}

const submitPasswordReset = async () => {
  if (!passwordDialog.user) return
  if (!passwordDialog.password.trim()) {
    ElMessage.warning(t('userManagement.inputNewPassword', 'Enter a new password'))
    return
  }

  loading.resetPassword = true
  try {
    await Api.resetAccessUserPassword(passwordDialog.user.id, {
      password: passwordDialog.password
    })
    passwordDialog.user.mustChangePassword = true
    passwordDialog.user.passwordChangeReason = 'admin_reset'
    ElMessage.success(t(
      'userManagement.resetPasswordSuccess',
      'Password reset. The user must change it at the next login.'
    ))
    passwordDialog.show = false
    await loadUsers()
  } catch (error: any) {
    // ElMessage.error(error?.message || t('userManagement.resetPasswordFailed', 'Failed to reset password'))
  } finally {
    loading.resetPassword = false
  }
}

const getSuperAdminCount = async () => {
  const response = await Api.getAccessUsers({
    page: 1,
    pageSize: 100,
    keyword: ''
  })
  const items = response.data?.items || []
  return items.filter((item: AccessUser) => isSuperAdminUser(item)).length
}

const deleteUser = async (row: AccessUser) => {
  if (!row?.id) {
    ElMessage.warning(t('userManagement.invalidUserId', 'Invalid user ID'))
    return
  }
  if (isCurrentLoginUser(row)) {
    ElMessage.warning(t('userManagement.cannotDeleteCurrentUser', 'You cannot delete the current signed-in account'))
    return
  }
  if (isSuperAdminUser(row)) {
    const superAdminCount = await getSuperAdminCount()
    if (superAdminCount <= 1) {
      ElMessage.warning(t('userManagement.cannotDeleteLastSuperAdmin', 'You cannot delete the last super administrator'))
      await loadUsers()
      return
    }
  }

  await ElMessageBox.confirm(
    t('userManagement.deleteConfirmMessage', 'Permanently delete user "{username}"? This action cannot be undone.', { username: row.username }),
    t('userManagement.deleteUser', 'Delete user'),
    {
      type: 'warning',
      confirmButtonText: t('userManagement.confirmDelete', 'Delete permanently'),
      cancelButtonText: t('common.cancel', 'Cancel')
    }
  )

  loading.deleteUserId = row.id
  try {
    await Api.deleteAccessUser(row.id)
    ElMessage.success(t('userManagement.deleteSuccess', 'User deleted'))
    await loadUsers()
  } catch (error: any) {
    const code = Number(error?.code || error?.response?.data?.code || 0)
    if (code === 1200) {
      ElMessage.warning(t('userManagement.cannotDeleteCurrentUser', 'You cannot delete the current signed-in account'))
    } else if (code === 1002) {
      ElMessage.warning(t('userManagement.cannotDeleteLastSuperAdmin', 'You cannot delete the last super administrator'))
    } else if (code === 2000) {
      ElMessage.warning(t('userManagement.userAlreadyDeleted', 'The user no longer exists. The list has been refreshed.'))
    }
    await loadUsers()
  } finally {
    loading.deleteUserId = 0
  }
}

onMounted(async () => {
  try {
    await loadBootstrap()
    await loadUsers()
  } catch (error: any) {
    // ElMessage.error(error?.message || t('userManagement.initFailed', 'Failed to initialize page'))
  }
})
</script>

<template>
  <div v-loading="loading.bootstrap" class="access-page">
    <section class="hero-card">
      <div class="hero-main">
        <div class="hero-copy">
          <!-- <span class="eyebrow">{{ $t('userManagement.eyebrow') }}</span> -->
          <h2>{{ $t('userManagement.title') }}</h2>
          <p>{{ $t('userManagement.fullDescription') }}</p>
        </div>
        <div class="role-tags">
          <el-tag
            v-for="item in roleTagList"
            :key="item.key || item.code"
            class="hero-role-tag"
            effect="plain"
            round
          >
            {{ roleLabel(item) }}
          </el-tag>
        </div>
        <div class="hero-metrics">
          <div class="metric-chip metric-chip--total">
            <div class="metric-chip__accent"></div>
            <div class="metric-chip__icon">
              <el-icon><User /></el-icon>
            </div>
            <div class="metric-chip__content">
              <span>{{ $t('userManagement.userTotal') }}</span>
              <strong>{{ userState.total }}</strong>
            </div>
          </div>
          <div class="metric-chip metric-chip--granted">
            <div class="metric-chip__accent"></div>
            <div class="metric-chip__icon">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="metric-chip__content">
              <span>{{ $t('userManagement.grantedUsers') }}</span>
              <strong>{{ totalAssignedUsers }}</strong>
            </div>
          </div>
          <div class="metric-chip metric-chip--pending">
            <div class="metric-chip__accent"></div>
            <div class="metric-chip__icon">
              <el-icon><Key /></el-icon>
            </div>
            <div class="metric-chip__content">
              <span>{{ $t('userManagement.pendingPasswordUsers') }}</span>
              <strong>{{ totalPendingUsers }}</strong>
            </div>
          </div>
          <div class="metric-chip metric-chip--roles">
            <div class="metric-chip__accent"></div>
            <div class="metric-chip__icon">
              <el-icon><CollectionTag /></el-icon>
            </div>
            <div class="metric-chip__content">
              <span>{{ $t('userManagement.roleRepository') }}</span>
              <strong>{{ roles.length }}</strong>
            </div>
          </div>
        </div>
      </div>
    </section>

    <SystemManagementTabs
      :items="accessTabItems"
      :active-key="activeTab"
      @update:active-key="activeTab = $event"
    />

    <section v-if="activeTab === 'users'" class="panel-card">
      <div class="panel-head">
        <div>
          <!-- <span class="panel-kicker">{{ $t('userManagement.accountDirectory') }}</span> -->
          <h3>{{ $t('userManagement.userAndRole') }}</h3>
        </div>
        <div class="panel-summary">
          <span>{{ $t('userManagement.panelHint') }}</span>
        </div>
      </div>
      <div class="toolbar-shell">
        <div class="toolbar">
          <div class="toolbar-left">
            <search-input v-model:model-value="userState.keyword" :placeholder="$t('userManagement.searchPlaceholder')" @search="searchUsers" />
          </div>
          <div class="toolbar-right">
            <el-button @click="resetUsers">{{ $t('common.reset') }}</el-button>
            <el-button type="primary" :disabled="!canManageUsers" @click="createUserDialog.open()">{{ $t('userManagement.createUser') }}</el-button>
          </div>
        </div>
        <div class="toolbar-note">
          <span>{{ $t('userManagement.toolbarCount', { count: userState.total }) }}</span>
          <span>{{ $t('userManagement.toolbarHint') }}</span>
        </div>
      </div>

      <div class="table-shell">
        <custom-table
          v-model:page="userState.filters.page"
          v-model:page-size="userState.filters.pageSize"
          :loading="loading.users"
          :columns="userState.columns"
          :data="userState.list"
          :total="userState.total"
          :auto-pagination="false"
          @update:page="(page) => { userState.filters.page = page; loadUsers() }"
          @update:page-size="() => { userState.filters.page = 1; loadUsers() }"
        >
          <template #roles="{ row }">
            <div class="role-cell">
              <div v-if="(row.roles || []).length" class="tag-list tag-list--roles">
                <el-tag
                  v-for="item in row.roles || []"
                  :key="item.key || item.code"
                  effect="plain"
                  size="small"
                  class="role-pill"
                >
                  {{ roleLabel(item) }}
                </el-tag>
              </div>
              <span v-else class="role-empty">{{ $t('userManagement.unassigned') }}</span>
            </div>
          </template>
          <template #scope="{ row }">
            <el-tag class="scope-pill" :type="row.isSuperAdmin ? 'danger' : 'info'" effect="light" round>
              {{ userScopeLabel(row) }}
            </el-tag>
          </template>
          <template #mustChangePassword="{ row }">
            <el-tag
              class="user-status-tag"
              :type="row.mustChangePassword ? 'warning' : 'success'"
              effect="light"
              round
            >
              {{ passwordStatusLabel(row) }}
            </el-tag>
          </template>
          <template #createdAt="{ row }">
            <span class="time-text">{{ formatTime(row.createdAt) }}</span>
          </template>
          <template #action="{ row }">
            <div class="action-wrap action-wrap--compact table-row-actions">
              <el-button link type="primary" :icon="CollectionTag" :disabled="!canManageUsers" @click="roleDialog.open(row)">{{ $t('userManagement.changeRole') }}</el-button>
              <el-button link type="primary" :icon="Key" :disabled="!canManageUsers" @click="passwordDialog.open(row)">{{ $t('userManagement.resetPassword') }}</el-button>
              <el-button
                link
                type="danger"
                :icon="Delete"
                :disabled="!canManageUsers || isCurrentLoginUser(row)"
                :loading="loading.deleteUserId === row.id"
                @click="deleteUser(row)"
              >
                {{ $t('common.delete') }}
              </el-button>
            </div>
          </template>
        </custom-table>
      </div>
    </section>

    <section v-else-if="activeTab === 'permissions'" class="panel-card">
      <div class="panel-head">
        <div>
          <h3>{{ t('userManagement.roleRepositoryTitle', 'Role repository') }}</h3>
        </div>
        <div class="panel-head__actions">
          <div class="panel-summary">
            <span>{{ t('userManagement.roleRepositoryHint', 'Manage role permissions and the menus derived from them') }}</span>
          </div>
          <el-button
            type="primary"
            :icon="Plus"
            :disabled="!canManageRoles"
            @click="openRoleEditor()"
          >
            {{ t('userManagement.createRole', 'Create role') }}
          </el-button>
        </div>
      </div>

      <custom-table
        :data="roles"
        :columns="roleColumns"
        :pagination="false"
        :auto-pagination="false"
        border
        class="role-table"
        :empty-text="t('common.noData', 'No roles')"
      >
        <template #permissionCount="{ row }">
          <el-tag class="permission-count-tag" type="primary" effect="light" round>
            {{ (row.permissions || []).length }}
          </el-tag>
        </template>
        <template #status="{ row }">
          <el-tag :type="row.builtin ? 'info' : 'success'" effect="light" round>
            {{ row.builtin ? t('userManagement.builtinRole', 'Built-in') : t('userManagement.customRole', 'Custom') }}
          </el-tag>
        </template>
        <template #action="{ row }">
          <div class="table-row-actions">
            <el-button
              link
              type="primary"
              :icon="Edit"
              :disabled="!canManageRoles || row.builtin"
              @click="openRoleEditor(row)"
            >
              {{ t('common.edit', 'Edit') }}
            </el-button>
            <el-button
              link
              type="danger"
              :icon="Delete"
              :disabled="!canManageRoles || row.builtin"
              @click="deleteRole(row)"
            >
              {{ t('common.delete', 'Delete') }}
            </el-button>
          </div>
        </template>
      </custom-table>
    </section>

    <section v-else class="panel-card">
      <div class="panel-head">
        <div>
          <h3>{{ t('userManagement.menuRepositoryTitle', 'Menu repository') }}</h3>
        </div>
        <div class="panel-head__actions">
          <div class="panel-summary">
            <span>{{ t('userManagement.menuRepositoryHint', 'Manage backend menu nodes and the permissions attached to them') }}</span>
          </div>
          <el-button
            type="primary"
            :icon="Plus"
            :disabled="!canManageMenus"
            @click="openMenuEditor()"
          >
            {{ t('userManagement.createMenu', 'Create menu') }}
          </el-button>
        </div>
      </div>

      <custom-table
        :data="visibleMenuRows"
        :columns="menuColumns"
        :pagination="false"
        :auto-pagination="false"
        border
        row-key="key"
        :tree-props="{ children: '__menuChildren__' }"
        :cell-style="menuCellStyle"
        class="menu-table"
        :empty-text="t('common.noData', 'No menus')"
      >
        <template #key="{ row }">
          <div
            class="menu-key-cell"
            :class="{ 'is-expandable': row.hasChildren }"
            :style="{ paddingLeft: `${row.depth * 24}px` }"
            @click.stop="handleMenuKeyClick(row)"
            >
            <span class="menu-key-value">
              <span class="menu-key-text">{{ row.key }}</span>
              <button
                v-if="row.hasChildren"
                class="menu-expand-button"
                :class="{ 'is-expanded': expandedMenuKey === row.key }"
                :style="{ marginLeft: '12px' }"
                type="button"
                :aria-label="expandedMenuKey === row.key ? 'Collapse menu' : 'Expand menu'"
                :aria-expanded="expandedMenuKey === row.key"
                @click.stop="handleMenuKeyClick(row)"
              >
              <el-icon
                class="menu-expand-icon"
                aria-hidden="true"
                :style="{ transform: expandedMenuKey === row.key ? 'rotate(90deg)' : 'rotate(0deg)' }"
              ><ArrowRight /></el-icon>
            </button>
            </span>
          </div>
        </template>
        <template #type="{ row }">
          <el-tag class="menu-type-tag" :type="menuTypeTagType(row.type)" effect="light" round>
            {{ t(`userManagement.menuTypes.${row.type}`, row.type) }}
          </el-tag>
        </template>
        <template #target="{ row }">
          <div class="menu-target">
            <span>{{ row.targetKey || '—' }}</span>
            <small v-if="row.targetType">{{ row.targetType }}</small>
          </div>
        </template>
        <template #permissionCount="{ row }">
          <el-tag class="permission-count-tag" type="primary" effect="light" round>
            {{ menuPermissionCount(row) }}
          </el-tag>
        </template>
        <template #enabled="{ row }">
          <div class="menu-status-control">
            <el-switch
              :model-value="row.enabled !== false"
              :loading="loading.menuStatusKey === row.key"
              :disabled="!canManageMenus || Boolean(loading.menuStatusKey && loading.menuStatusKey !== row.key)"
              :aria-label="row.enabled === false ? t('userManagement.enableMenu', 'Enable menu') : t('userManagement.disableMenu', 'Disable menu')"
              @change="updateMenuStatus(row, $event)"
            />
            <span class="menu-status-label" :class="{ 'is-disabled': row.enabled === false }">
            {{ row.enabled === false ? t('common.disabled', 'Disabled') : t('common.enabled', 'Enabled') }}
            </span>
          </div>
        </template>
        <template #action="{ row }">
          <div class="table-row-actions">
            <el-button
              link
              type="primary"
              :icon="Edit"
              :disabled="!canManageMenus || row.builtin"
              @click="openMenuEditor(row)"
            >
              {{ t('common.edit', 'Edit') }}
            </el-button>
            <el-button
              link
              type="danger"
              :icon="Delete"
              :disabled="!canManageMenus || row.builtin || Boolean(row.children?.length)"
              @click="deleteMenu(row)"
            >
              {{ t('common.delete', 'Delete') }}
            </el-button>
          </div>
        </template>
      </custom-table>
    </section>

    <custom-drawer
      :visible="createUserDialog.show"
      :title="$t('userManagement.createUser')"
      size="720px"
      :confirm-text="$t('userManagement.create')"
      :loading="loading.createUser"
      :on-close="() => { createUserDialog.show = false }"
      :on-confirm="submitCreateUser"
    >
      <div class="dialog-form">
        <el-form label-position="top">
          <el-form-item :label="$t('userManagement.accountName')">
            <el-input v-model="createUserDialog.form.username" :placeholder="$t('login.usernamePlaceholder')" />
          </el-form-item>
          <el-form-item :label="$t('userManagement.initialPassword')">
            <el-input v-model="createUserDialog.form.password" type="password" show-password :placeholder="$t('userManagement.inputInitialPassword')" />
          </el-form-item>
          <el-form-item :label="$t('userManagement.isSuperAdmin')">
            <el-switch v-model="createUserDialog.form.isAdmin" />
          </el-form-item>
          <el-form-item v-if="!createUserDialog.form.isAdmin" :label="$t('userManagement.roleAssignment')">
            <div class="role-select-panel">
              <div class="role-dialog-toolbar">
                <el-checkbox
                  :model-value="createRoleAllChecked"
                  :indeterminate="createRoleIndeterminate"
                  @change="toggleCreateAllRoles"
                >
                  {{ $t('userManagement.selectAll') }}
                </el-checkbox>
                <span class="role-dialog-count">{{ $t('userManagement.selectedCount', { selected: createUserDialog.form.roleCodes.length, total: allRoleCodes.length }) }}</span>
              </div>
              <el-checkbox-group v-model="createUserDialog.form.roleCodes" class="checkbox-grid">
                <el-checkbox v-for="item in roles" :key="item.key || item.code" :value="item.key || item.code">
                  {{ roleLabel(item) }}
                </el-checkbox>
              </el-checkbox-group>
            </div>
          </el-form-item>
        </el-form>
      </div>
    </custom-drawer>

    <custom-drawer
      :visible="roleDialog.show"
      :title="$t('userManagement.editRole')"
      size="720px"
      :confirm-text="$t('common.save')"
      :loading="loading.updateRoles"
      :on-close="() => { roleDialog.show = false }"
      :on-confirm="submitRoleUpdate"
    >
      <div class="dialog-form">
        <el-alert
          :title="$t('userManagement.currentAccount', { username: roleDialog.user?.username || '—' })"
          type="info"
          :closable="false"
          show-icon
          style="margin-bottom: 16px"
        />
        <div class="role-dialog-toolbar">
          <el-checkbox
            :model-value="roleAllChecked"
            :indeterminate="roleIndeterminate"
            @change="toggleAllRoles"
          >
            {{ $t('userManagement.selectAll') }}
          </el-checkbox>
          <span class="role-dialog-count">{{ $t('userManagement.selectedCount', { selected: roleDialog.roleCodes.length, total: allRoleCodes.length }) }}</span>
        </div>
        <el-checkbox-group v-model="roleDialog.roleCodes" class="checkbox-grid">
          <el-checkbox v-for="item in roles" :key="item.key || item.code" :value="item.key || item.code">
            {{ roleLabel(item) }}
          </el-checkbox>
        </el-checkbox-group>
      </div>
    </custom-drawer>

    <custom-drawer
      :visible="roleEditorDialog.show"
      :title="roleEditorDialog.mode === 'create' ? t('userManagement.createRole', 'Create role') : t('userManagement.editRole', 'Edit role')"
      size="1180px"
      :confirm-text="$t('common.save')"
      :loading="roleEditorDialog.loading"
      :on-close="() => { roleEditorDialog.show = false }"
      :on-confirm="submitRoleEditor"
    >
      <div class="dialog-form role-editor-dialog-body">
        <div v-loading="roleEditorDialog.detailLoading" class="role-editor-layout">
          <div class="role-editor-main">
            <section class="role-info-panel">
              <div class="role-editor-section-head">
                <h3>{{ t('userManagement.roleInfo', 'Role information') }}</h3>
              </div>
              <el-form label-position="left" label-width="108px" class="role-info-form">
                <el-form-item :label="$t('userManagement.roleKey', 'Role key')" required>
                  <el-input
                    v-model="roleEditorDialog.form.key"
                    :readonly="roleEditorDialog.mode === 'edit'"
                    :placeholder="t('userManagement.inputRoleKey', 'Enter a role key')"
                  />
                </el-form-item>
                <el-form-item :label="$t('userManagement.roleName', 'Role name')" required>
                  <el-input
                    v-model="roleEditorDialog.form.name"
                    :placeholder="t('userManagement.inputRoleName', 'Enter a role name')"
                  />
                </el-form-item>
                <el-form-item :label="$t('userManagement.roleDescription', 'Description')">
                  <el-input
                    v-model="roleEditorDialog.form.description"
                    type="textarea"
                    :rows="3"
                    :placeholder="t('userManagement.roleDescriptionPlaceholder', 'Describe what this role can access')"
                  />
                </el-form-item>
              </el-form>
            </section>

            <section class="role-menu-panel">
              <div class="role-editor-section-head">
                <div>
                  <h3>{{ t('userManagement.menuPermissionTitle', 'Menu permissions') }}</h3>
                  <p>{{ t('userManagement.rolePermissionTip', 'Select menus first. Page and button permissions can be adjusted independently.') }}</p>
                </div>
                <span class="role-menu-count">
                  {{ t('userManagement.permissionCountSummary', '{selected} / {total} permission codes', { selected: roleSelectedPermissionCodes.length, total: permissions.length }) }}
                </span>
              </div>
              <div ref="roleMenuTreeRef" class="role-menu-tree-scroll">
                <role-menu-tree-node
                  v-if="roleMenuTree.length"
                  :nodes="roleMenuTree"
                  :selected-codes="roleSelectedPermissionCodes"
                  :available-codes="registeredPermissionCodeSet"
                  :expanded-keys="expandedRoleMenuKeys"
                  @toggle="toggleRoleMenuNode"
                  @toggle-expand="toggleRoleMenuExpand"
                />
                <el-empty v-else :description="t('common.noData', 'No data')" />
              </div>
            </section>

            <section class="role-advanced-panel">
              <button
                type="button"
                class="role-advanced-toggle"
                :aria-expanded="roleAdvancedOpen"
                @click="roleAdvancedOpen = !roleAdvancedOpen"
              >
                <span>
                  <strong>{{ t('userManagement.advancedPermissionCodes', 'Advanced: view permission codes') }}</strong>
                  <small>{{ t('userManagement.advancedPermissionCodesHint', 'Only permissionCodes will be submitted; menus are calculated from permissions.') }}</small>
                </span>
                <el-icon :class="{ 'is-expanded': roleAdvancedOpen }"><ArrowRight /></el-icon>
              </button>
              <div v-if="roleAdvancedOpen" class="role-advanced-content">
                <code v-for="code in roleSelectedPermissionCodes" :key="code">{{ code }}</code>
                <span v-if="!roleSelectedPermissionCodes.length" class="menu-preview__empty">
                  {{ t('userManagement.noPermissionCodes', 'No permission codes selected') }}
                </span>
              </div>
            </section>
          </div>

          <aside class="role-summary-panel">
            <div class="role-summary-head">
              <h3>{{ t('userManagement.roleSelectionSummary', 'Selected {menus} menus / {permissions} permission codes', { menus: roleSelectedMenuNodes.length, permissions: roleSelectedPermissionCodes.length }) }}</h3>
            </div>
            <div class="role-summary-section">
              <strong>{{ t('userManagement.selectedMenus', 'Selected menus') }}</strong>
              <div v-if="roleSelectedMenuNodes.length" class="role-summary-chip-list">
                <button
                  v-for="menu in roleSelectedMenuNodes"
                  :key="menu.key"
                  type="button"
                  class="role-summary-chip"
                  @click="locateRoleMenu(menu.key)"
                >
                  <span>{{ menu.name }}</span>
                </button>
              </div>
              <span v-else class="role-summary-empty">
                {{ t('userManagement.noMenusSelected', 'No menus selected') }}
              </span>
            </div>
            <div class="role-summary-section">
              <strong>{{ t('userManagement.selectedPermissionCodes', 'Selected permission codes') }}</strong>
              <div v-if="rolePermissionSummary.length" class="role-summary-permission-list">
                <button
                  v-for="permission in rolePermissionSummary"
                  :key="permission.code"
                  type="button"
                  class="role-summary-permission"
                  @click="locateRolePermission(permission.code)"
                >
                  <code>{{ permission.code }}</code>
                  <span>{{ permission.name }}</span>
                </button>
              </div>
              <span v-else class="role-summary-empty">
                {{ t('userManagement.noPermissionCodes', 'No permission codes selected') }}
              </span>
            </div>
          </aside>
        </div>
      </div>
    </custom-drawer>

    <custom-drawer
      :visible="menuEditorDialog.show"
      :title="menuEditorDialog.mode === 'create' ? t('userManagement.createMenu', 'Create menu') : t('userManagement.editMenu', 'Edit menu')"
      size="980px"
      :confirm-text="$t('common.save')"
      :loading="menuEditorDialog.loading"
      :on-close="() => { menuEditorDialog.show = false }"
      :on-confirm="submitMenuEditor"
    >
      <div class="dialog-form">
        <el-alert
          :title="t('userManagement.menuFormTip', 'Target type and target key are validated against the backend contract.')"
          type="info"
          :closable="false"
          show-icon
          style="margin-bottom: 16px"
        />
        <el-form label-position="top" class="role-editor-form menu-editor-form">
          <el-form-item
            v-if="menuEditorDialog.mode === 'create'"
            :label="$t('userManagement.menuKey', 'Menu key')"
            required
          >
            <el-input
              v-model="menuEditorDialog.form.key"
              :placeholder="t('userManagement.inputMenuKey', 'Enter a menu key')"
            />
          </el-form-item>
          <el-form-item :label="$t('userManagement.menuName', 'Menu name')" required>
            <el-input
              v-model="menuEditorDialog.form.name"
              :placeholder="t('userManagement.inputMenuName', 'Enter a menu name')"
            />
          </el-form-item>
          <el-form-item :label="$t('userManagement.menuNameEn', 'English name')">
            <el-input
              v-model="menuEditorDialog.form.nameEn"
              :placeholder="t('userManagement.inputMenuNameEn', 'Enter an English name')"
            />
          </el-form-item>
          <el-form-item :label="$t('userManagement.menuParent', 'Parent menu')">
            <el-select v-model="menuEditorDialog.form.parentKey" filterable clearable :placeholder="$t('common.select', 'Select')">
              <el-option
                v-for="option in menuParentOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
                :disabled="option.disabled"
              />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('userManagement.menuType', 'Type')" required>
            <el-segmented
              v-model="menuEditorDialog.form.type"
              class="menu-type-segmented"
              @change="handleMenuTypeChange"
              :options="[
                { label: t('userManagement.menuTypes.directory', 'Directory'), value: 'directory' },
                { label: t('userManagement.menuTypes.page', 'Page'), value: 'page' },
                { label: t('userManagement.menuTypes.button', 'Button'), value: 'button' }
              ]"
            />
          </el-form-item>
          <el-form-item v-if="menuEditorDialog.form.type !== 'directory'" :label="$t('userManagement.menuTargetType', 'Target type')" required>
            <el-select v-model="menuEditorDialog.form.targetType" :placeholder="$t('common.select', 'Select')">
              <el-option :label="t('userManagement.targetTypes.route', 'Route')" value="route" />
              <el-option :label="t('userManagement.targetTypes.action', 'Action')" value="action" />
            </el-select>
          </el-form-item>
          <el-form-item v-if="menuEditorDialog.form.type !== 'directory'" :label="$t('userManagement.menuTargetKey', 'Target key')" required>
            <el-input
              v-if="menuEditorDialog.form.targetType === 'action'"
              v-model="menuEditorDialog.form.targetKey"
              :placeholder="t('userManagement.inputMenuTargetKey', 'Enter a target key')"
            />
            <el-select
              v-else
              v-model="menuEditorDialog.form.targetKey"
              filterable
              allow-create
              default-first-option
              :placeholder="t('userManagement.inputMenuTargetKey', 'Enter a target key')"
            >
              <el-option
                v-for="option in routeTargetOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('userManagement.menuIconKey', 'Icon key')">
            <el-input
              v-model="menuEditorDialog.form.iconKey"
              :placeholder="t('userManagement.inputMenuIconKey', 'Enter an icon key')"
            />
          </el-form-item>
          <el-form-item :label="$t('userManagement.menuSort', 'Sort')">
            <el-input-number v-model="menuEditorDialog.form.sort" :min="0" :step="10" />
          </el-form-item>
          <el-form-item :label="$t('common.status', 'Status')">
            <el-switch v-model="menuEditorDialog.form.enabled" />
          </el-form-item>
          <el-form-item :label="$t('userManagement.superAdminOnly', 'Super admin only')">
            <el-switch v-model="menuEditorDialog.form.superAdminOnly" />
          </el-form-item>
          <el-form-item :label="$t('userManagement.featureKey', 'Feature key')">
            <el-select v-model="menuEditorDialog.form.featureKey" clearable :placeholder="$t('common.select', 'Select')">
              <el-option :label="t('userManagement.featureKeys.terminal', 'Terminal')" value="terminal" />
              <el-option :label="t('userManagement.featureKeys.bastion', 'Bastion')" value="bastion" />
            </el-select>
          </el-form-item>
          <el-form-item
            v-if="menuEditorDialog.form.type !== 'directory'"
            :label="$t('userManagement.permissionSelection', 'Permission codes')"
          >
            <div class="permission-panel">
              <div class="permission-panel__summary">
                <span>{{ t('userManagement.menuPermissionSelectionHint', 'Select the backend permission codes bound to this menu.') }}</span>
                <strong>{{ t('userManagement.selectedCount', '{selected} / {total} selected', { selected: menuEditorDialog.form.permissionCodes.length, total: permissions.length }) }}</strong>
              </div>
              <el-scrollbar class="permission-panel__scroll">
                <div v-for="group in permissionGroups" :key="group.module" class="permission-group">
                  <div class="permission-group__head">
                    <div class="permission-group__title">
                      <strong>{{ group.label }}</strong>
                    </div>
                    <span>{{ group.items.length }}</span>
                  </div>
                  <el-checkbox-group v-model="menuEditorDialog.form.permissionCodes" class="permission-grid">
                    <el-checkbox
                      v-for="permission in group.items"
                      :key="permission.code"
                      :value="permission.code"
                      class="permission-item"
                    >
                      <span class="permission-item__name">{{ permission.name }}</span>
                      <span class="permission-item__code">{{ permission.code }}</span>
                    </el-checkbox>
                  </el-checkbox-group>
                </div>
              </el-scrollbar>
            </div>
          </el-form-item>
        </el-form>
      </div>
    </custom-drawer>

    <custom-drawer
      :visible="passwordDialog.show"
      :title="$t('userManagement.resetPassword')"
      size="640px"
      :confirm-text="$t('userManagement.confirmResetPassword')"
      :loading="loading.resetPassword"
      :on-close="() => { passwordDialog.show = false }"
      :on-confirm="submitPasswordReset"
    >
      <div class="dialog-form">
        <el-alert
          :title="$t('userManagement.resetPasswordWarning', { username: passwordDialog.user?.username || $t('userManagement.thisAccount') })"
          type="warning"
          :closable="false"
          show-icon
          style="margin-bottom: 16px"
        />
        <el-form label-position="top">
          <el-form-item :label="$t('userManagement.newPassword')">
            <el-input v-model="passwordDialog.password" type="password" show-password :placeholder="$t('userManagement.inputNewPassword')" />
          </el-form-item>
        </el-form>
      </div>
    </custom-drawer>
  </div>
</template>

<style scoped lang="less">
.access-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-bottom: 32px;
}

.hero-card,
.panel-card {
  border: 1px solid var(--border-subtle);
  border-radius: 24px;
  background: var(--surface-card);
  // box-shadow: 0 18px 44px rgba(3, 10, 24, 0.28);
}

.hero-card {
  padding: 28px;
  background:
    radial-gradient(circle at top right, rgba(var(--primary-color), 0.16), transparent 30%),
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--surface-card) 92%, rgba(var(--primary-color), 0.08)),
      color-mix(in srgb, var(--surface-card) 100%, transparent)
    );
}

.hero-main {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.hero-copy {
  max-width: 760px;
}

.hero-main h2 {
  margin: 10px 0 12px;
  color: var(--text-primary);
  font-size: 40px;
  line-height: 1.08;
  font-weight: 760;
}

.hero-main p,
.eyebrow {
  color: var(--text-secondary);
}

.eyebrow {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.metric-chip span,
.panel-kicker {
  display: block;
  margin-bottom: 8px;
  color: var(--text-tertiary);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.metric-chip strong {
  display: block;
  color: var(--text-primary);
  font-size: 24px;
  font-weight: 740;
  line-height: 1.1;
}

.hero-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.metric-chip {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 108px;
  padding: 20px 22px;
  border-radius: 24px;
  border: 1px solid var(--border-subtle);
  overflow: hidden;
  box-shadow: 0 14px 32px rgba(3, 10, 24, 0.2);
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 18px 34px rgba(3, 10, 24, 0.26);
  }
}

.metric-chip--total {
  background: linear-gradient(
    145deg,
    color-mix(in srgb, var(--surface-card) 86%, rgba(255, 120, 64, 0.18)),
    color-mix(in srgb, var(--surface-card) 94%, rgba(255, 120, 64, 0.08))
  );
  border-color: color-mix(in srgb, var(--border-subtle) 76%, rgba(255, 120, 64, 0.32));

  &:hover {
    border-color: rgba(255, 120, 64, 0.28);
  }
}

.metric-chip--granted {
  background: linear-gradient(
    145deg,
    color-mix(in srgb, var(--surface-card) 86%, rgba(34, 197, 94, 0.18)),
    color-mix(in srgb, var(--surface-card) 94%, rgba(34, 197, 94, 0.08))
  );
  border-color: color-mix(in srgb, var(--border-subtle) 76%, rgba(34, 197, 94, 0.28));

  &:hover {
    border-color: rgba(22, 163, 74, 0.28);
  }
}

.metric-chip--pending {
  background: linear-gradient(
    145deg,
    color-mix(in srgb, var(--surface-card) 86%, rgba(245, 158, 11, 0.18)),
    color-mix(in srgb, var(--surface-card) 94%, rgba(245, 158, 11, 0.08))
  );
  border-color: color-mix(in srgb, var(--border-subtle) 76%, rgba(245, 158, 11, 0.3));

  &:hover {
    border-color: rgba(245, 158, 11, 0.3);
  }
}

.metric-chip--roles {
  background: linear-gradient(
    145deg,
    color-mix(in srgb, var(--surface-card) 86%, rgba(129, 140, 248, 0.18)),
    color-mix(in srgb, var(--surface-card) 94%, rgba(129, 140, 248, 0.08))
  );
  border-color: color-mix(in srgb, var(--border-subtle) 76%, rgba(129, 140, 248, 0.28));

  &:hover {
    border-color: rgba(99, 102, 241, 0.28);
  }
}

.metric-chip__accent {
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  border-radius: 24px 0 0 24px;
  opacity: 0.9;
}

.metric-chip__icon {
  width: 48px;
  height: 48px;
  margin-left: 2px;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  background: color-mix(in srgb, var(--surface-hover) 78%, transparent);
  border: 1px solid color-mix(in srgb, var(--border-subtle) 92%, transparent);
  box-shadow: none;
}

.metric-chip__icon :deep(.el-icon) {
  font-size: 24px;
}

.metric-chip__content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.metric-chip__content span {
  margin-bottom: 0;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: none;
}

.metric-chip__content strong {
  font-size: 42px;
  line-height: 1;
  font-weight: 780;
  letter-spacing: -0.03em;
}

.metric-chip--total .metric-chip__accent {
  background: linear-gradient(180deg, rgb(var(--primary-color)), var(--primary-gradient-end));
}

.metric-chip--granted .metric-chip__accent {
  background: linear-gradient(180deg, #22c55e, #0f9f6e);
}

.metric-chip--pending .metric-chip__accent {
  background: linear-gradient(180deg, #f59e0b, #ea580c);
}

.metric-chip--roles .metric-chip__accent {
  background: linear-gradient(180deg, #818cf8, #5b67d6);
}

.metric-chip--total .metric-chip__content strong {
  color: rgb(var(--primary-color));
}

.metric-chip--granted .metric-chip__content strong {
  color: #1d9f6e;
}

.metric-chip--pending .metric-chip__content strong {
  color: #d97706;
}

.metric-chip--roles .metric-chip__content strong {
  color: #5b67d6;
}

.metric-chip--total .metric-chip__icon {
  color: #ff6b2c;
}

.metric-chip--granted .metric-chip__icon {
  color: #12a167;
}

.metric-chip--pending .metric-chip__icon {
  color: #de7a10;
}

.metric-chip--roles .metric-chip__icon {
  color: #6674e8;
}

.toolbar,
.toolbar-left,
.toolbar-right,
.role-tags,
.tag-list,
.action-wrap,
.role-dialog-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
}

.hero-role-tag {
  min-height: 30px;
  padding: 3px 12px;
  border: 1px solid color-mix(in srgb, rgb(var(--primary-color)) 42%, var(--border-subtle));
  border-radius: 999px;
  background: color-mix(in srgb, var(--surface-card) 82%, rgb(var(--primary-color)) 18%) !important;
  background-color: color-mix(in srgb, var(--surface-card) 82%, rgb(var(--primary-color)) 18%) !important;
  color: color-mix(in srgb, rgb(var(--primary-color)) 72%, var(--text-primary)) !important;
  font-size: 13px;
  font-weight: 700;
  line-height: 22px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.toolbar {
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.toolbar-left,
.toolbar-right,
.role-tags,
.tag-list,
.action-wrap {
  flex-wrap: wrap;
}

.panel-card {
  padding: 24px;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 20px;
}

.panel-head__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.panel-head h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 24px;
  font-weight: 740;
}

.panel-summary span,
.toolbar-note span,
.time-text {
  color: var(--text-secondary);
  font-size: 13px;
}

.toolbar-shell {
  margin-bottom: 20px;
  padding: 16px 18px;
  border-radius: 20px;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--surface-card) 96%, rgba(255, 255, 255, 0.02)),
    color-mix(in srgb, var(--surface-hover) 86%, transparent)
  );
  border: 1px solid var(--border-subtle);
}

.toolbar-note {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 18px;
  margin-top: 12px;
}

.table-shell {
  padding: 8px;
  border-radius: 22px;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--surface-card) 98%, transparent),
    color-mix(in srgb, var(--surface-hover) 82%, transparent)
  );
  border: 1px solid var(--border-subtle);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

.role-cell {
  display: flex;
  align-items: center;
  min-height: 44px;
}

:deep(.user-status-column) {
  .cell {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 44px;
    white-space: normal;
  }
}

.user-status-tag {
  height: auto;
  min-height: 28px;
  max-width: 100%;
  padding: 4px 10px;
  line-height: 18px;
  text-align: center;
  white-space: normal;
}

.scope-pill {
  min-height: 30px;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  line-height: 20px;
  white-space: nowrap;
}

.scope-pill.el-tag--info {
  --el-tag-bg-color: color-mix(in srgb, var(--surface-muted) 76%, var(--surface-card));
  --el-tag-border-color: color-mix(in srgb, var(--border-strong) 72%, transparent);
  --el-tag-text-color: var(--text-primary);
}

.scope-pill.el-tag--danger {
  --el-tag-bg-color: color-mix(in srgb, #ef4444 18%, var(--surface-card));
  --el-tag-border-color: color-mix(in srgb, #f87171 60%, var(--border-subtle));
  --el-tag-text-color: #fca5a5;
}

.tag-list--roles {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 6px;
  align-items: flex-start;
}

.role-pill {
  --el-tag-bg-color: rgba(var(--primary-color), 0.08);
  --el-tag-border-color: rgba(var(--primary-color), 0.18);
  --el-tag-text-color: rgb(var(--primary-color));
  min-height: 30px;
  border-radius: 999px;
  padding: 3px 10px;
  font-size: 13px;
  font-weight: 700;
  line-height: 22px;
}

.placeholder-text,
.role-dialog-count {
  color: var(--text-secondary);
  font-size: 12px;
}

.role-empty {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 12px;
  border: 1px solid color-mix(in srgb, var(--border-strong) 70%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--surface-muted) 82%, var(--surface-card));
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 700;
}

.action-wrap--compact {
  gap: 12px;
}

.action-divider {
  width: 1px;
  height: 12px;
  background: rgba(148, 163, 184, 0.4);
}

.checkbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px 18px;

  :deep(.el-checkbox) {
    min-width: 0;
    margin-right: 0;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border: 1px solid var(--border-subtle);
    border-radius: 14px;
    background: color-mix(in srgb, var(--surface-hover) 82%, transparent);
    cursor: pointer;
    user-select: none;
    transition:
      transform 0.2s ease,
      border-color 0.2s ease,
      background 0.2s ease;
  }

  :deep(.el-checkbox:hover) {
    transform: translateY(-1px);
    border-color: rgba(var(--primary-color), 0.28);
    background: rgba(var(--primary-color), 0.08);
  }

  :deep(.el-checkbox__input) {
    flex: 0 0 auto;
    margin: 0;
  }

  :deep(.el-checkbox__label) {
    flex: 1;
    display: inline-flex;
    align-items: center;
    min-width: 0;
    padding-left: 0;
    line-height: 1.45;
    white-space: normal;
    color: var(--text-primary);
  }
}

.role-select-panel {
  width: 100%;

  .role-dialog-toolbar {
    margin-bottom: 12px;
  }
}

.role-table {
  width: 100%;
  margin-top: 4px;

  :deep(.el-table__inner-wrapper) {
    overflow: hidden;
    border: 1px solid var(--border-subtle);
    border-radius: 18px;
    background: var(--surface-card);
  }

  :deep(.el-table__header-wrapper th.el-table__cell) {
    height: 52px;
    padding: 0;
    color: var(--text-tertiary);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
    background: var(--surface-subtle);
    border-bottom: 1px solid var(--border-subtle);
  }

  :deep(.el-table__body-wrapper td.el-table__cell) {
    height: 64px;
    padding: 0;
    color: var(--text-secondary);
    background: var(--surface-card);
    border-bottom: 1px solid var(--border-subtle);
    transition: background 0.2s ease;
  }

  :deep(.el-table__body tr:last-child td.el-table__cell) {
    border-bottom: none;
  }

  :deep(.el-table__body tr:hover > td.el-table__cell) {
    background: color-mix(in srgb, var(--surface-hover) 78%, var(--surface-card)) !important;
  }

  :deep(.el-table__body tr:hover > td.el-table-fixed-column--right) {
    background: color-mix(in srgb, var(--surface-hover) 78%, var(--surface-card)) !important;
  }

  :deep(.el-table__fixed-right-patch) {
    background: var(--surface-subtle);
    border-bottom: 1px solid var(--border-subtle);
  }

  :deep(.el-table__fixed-right) {
    position: relative;
    z-index: 4;
    background: var(--surface-card) !important;
  }

  :deep(.el-table__fixed-right .el-table__fixed-body-wrapper),
  :deep(.el-table__fixed-right .el-table__body-wrapper),
  :deep(.el-table__fixed-right .el-table__body),
  :deep(.el-table__fixed-right .el-table__body tr),
  :deep(.el-table__fixed-right .el-table__body td.el-table__cell) {
    background: var(--surface-card) !important;
    background-color: var(--surface-card) !important;
    background-image: none !important;
  }

  // :deep(.el-table__fixed-right .el-table__body tr:hover > td.el-table__cell),
  // :deep(.el-table__fixed-right .el-table__body tr.hover-row:hover > td.el-table__cell),
  // :deep(.el-table__fixed-right .el-table__body tr.current-row:hover > td.el-table__cell) {
  //   background: color-mix(in srgb, var(--surface-hover) 78%, var(--surface-card)) !important;
  //   background-color: color-mix(in srgb, var(--surface-hover) 78%, var(--surface-card)) !important;
  //   background-image: none !important;
  // }

  :deep(.cell) {
    padding: 0 18px;
    line-height: 1.45;
  }

  :deep(.el-table__empty-block) {
    min-height: 150px;
    background: var(--surface-card);
  }
}

.role-table :deep(.el-table__body td:first-child .cell) {
  color: var(--text-primary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  font-weight: 650;
}

.role-table :deep(.el-table__body td:nth-child(2) .cell) {
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 650;
}

.role-table :deep(.el-table__body td:nth-child(3) .cell) {
  color: var(--text-secondary);
}

.role-table :deep(.el-table__body td:nth-child(4) .cell) {
  display: flex;
  align-items: center;
}

.menu-table {
  width: 100%;
  margin-top: 4px;
  --el-table-bg-color: var(--surface-card);
  --el-table-tr-bg-color: var(--surface-card);
  --el-table-row-hover-bg-color: color-mix(in srgb, var(--surface-hover) 78%, var(--surface-card));
  --el-table-current-row-bg-color: var(--surface-card);

  :deep(.el-table__inner-wrapper) {
    overflow: hidden;
    border: 1px solid color-mix(in srgb, var(--border-subtle) 88%, rgba(var(--primary-color), 0.12));
    border-radius: 18px;
    background: var(--surface-card);
  }

  :deep(.el-table__header-wrapper th.el-table__cell) {
    height: 54px;
    padding: 0;
    color: var(--text-tertiary);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
    background: color-mix(in srgb, var(--surface-subtle) 86%, rgba(var(--primary-color), 0.04));
    border-bottom: 1px solid var(--border-subtle);
  }

  :deep(.el-table__body-wrapper td.el-table__cell) {
    height: 62px;
    padding: 0;
    color: var(--text-secondary);
    background: var(--surface-card);
    background-color: var(--surface-card) !important;
    border-bottom: 1px solid color-mix(in srgb, var(--border-subtle) 82%, transparent);
    transition: none;
  }

  :deep(.el-table__body tr),
  :deep(.el-table__body tr > td.el-table__cell) {
    background-color: var(--surface-card) !important;
    background-image: none !important;
  }

  :deep(.el-table__body tr:hover > td.el-table__cell) {
    background: color-mix(in srgb, var(--surface-hover) 78%, var(--surface-card)) !important;
    background-color: color-mix(in srgb, var(--surface-hover) 78%, var(--surface-card)) !important;
  }

  // :deep(.el-table__body tr.current-row > td.el-table__cell),
  // :deep(.el-table__body tr.hover-row > td.el-table__cell),
  // :deep(.el-table__body tr.el-table__row--striped > td.el-table__cell) {
  //   background: var(--surface-card) !important;
  // }

  // :deep(.el-table__body tr.current-row:hover > td.el-table__cell),
  // :deep(.el-table__body tr.hover-row:hover > td.el-table__cell) {
  //   background: color-mix(in srgb, var(--surface-hover) 78%, var(--surface-card)) !important;
  //   background-color: color-mix(in srgb, var(--surface-hover) 78%, var(--surface-card)) !important;
  // }

  :deep(.el-table__body tr:last-child td.el-table__cell) {
    border-bottom: none;
  }

  :deep(.cell) {
    padding: 0 18px;
    line-height: 1.45;
  }

  :deep(.menu-key-column .cell) {
    display: flex !important;
    align-items: center;
    color: var(--text-primary);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 13px;
    font-weight: 650;
  }

  :deep(.menu-key-cell) {
    display: flex;
    align-items: center;
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
  }

  :deep(.menu-key-cell.is-expandable) {
    cursor: pointer;
  }

  :deep(.menu-expand-button) {
    display: inline-flex !important;
    align-items: center;
    justify-content: center;
    order: 3;
    position: relative;
    width: 18px;
    height: 24px;
    flex: 0 0 18px;
    margin-left: 0 !important;
    padding: 0;
    border: 0;
    color: var(--text-tertiary);
    background: transparent;
    cursor: pointer;
    transition: color 0.18s ease;
  }

  :deep(.menu-expand-icon) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    color: var(--text-tertiary) !important;
    font-size: 14px;
    line-height: 1;
    opacity: 1;
    visibility: visible;
    transition: transform 0.2s ease;
  }

  :deep(.menu-expand-button.is-expanded .menu-expand-icon) {
    transform: rotate(90deg);
  }

  :deep(.menu-expand-button:hover) {
    color: rgb(var(--primary-color));
  }

  :deep(.menu-key-value) {
    display: inline-flex;
    align-items: center;
    order: 1;
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    white-space: nowrap;
  }

  :deep(.menu-key-text) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  :deep(.menu-key-column .cell > .menu-expand-button) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  :deep(.menu-key-column .cell > .menu-key-value) {
    display: inline-flex;
    align-items: center;
  }

  /* Keep the tree column aligned with the navigation: text first, chevron last. */
  :deep(.menu-key-column .el-table__expand-icon) {
    display: none !important;
  }

  :deep(.menu-key-column .cell .menu-expand-button) {
    order: 3 !important;
    flex: 0 0 auto;
  }

  :deep(.menu-name-column .cell) {
    color: var(--text-primary);
    font-size: 14px;
    font-weight: 650;
  }

  :deep(.menu-type-column .cell) {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  :deep(.menu-type-tag) {
    min-width: 58px;
    justify-content: center;
    font-weight: 700;
  }

  :deep(.menu-status-control) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    white-space: nowrap;
  }

  :deep(.menu-status-label) {
    color: rgb(var(--success-color));
    font-size: 12px;
    font-weight: 650;
  }

  :deep(.menu-status-label.is-disabled) {
    color: var(--text-tertiary);
  }

  :deep(.menu-target-column .cell) {
    display: flex;
    align-items: center;
    min-width: 0;
    overflow: hidden;
  }
}

/* Keep accordion redraws from reusing a stale hover-row background. Element
   Plus keeps the class on the old row, so only a physically hovered row may
   use the hover color. */
.access-page :deep(.smart-table) {
  --el-table-row-hover-bg-color: color-mix(in srgb, var(--surface-hover) 78%, var(--surface-card));
  --el-table-current-row-bg-color: var(--surface-card);
}

.access-page :deep(.smart-table .el-table__body tr.hover-row:not(:hover) > td.el-table__cell),
.access-page :deep(.smart-table .el-table__body tr.current-row:not(:hover) > td.el-table__cell) {
  background: var(--surface-card) !important;
  background-color: var(--surface-card) !important;
  background-image: none !important;
}

.access-page :deep(.smart-table .el-table__body tr:hover > td.el-table__cell) {
  background: var(--el-table-row-hover-bg-color) !important;
  background-color: var(--el-table-row-hover-bg-color) !important;
  background-image: none !important;
}

/* Element Plus implements fixed columns with sticky cells. Keep the right
   action cells opaque so scrolling content cannot show through or overlap
   their buttons. */
.access-page :deep(.smart-table .el-table__body-wrapper tr > td.el-table-fixed-column--right) {
  position: sticky !important;
  z-index: 4 !important;
  // background: var(--surface-card) !important;
  // background-color: var(--surface-card) !important;
  background-image: none !important;
  // box-shadow: -10px 0 18px -18px rgba(0, 0, 0, 0.9);
}

.access-page :deep(.smart-table .el-table__header-wrapper tr > th.el-table-fixed-column--right) {
  position: sticky !important;
  z-index: 4 !important;
  // background: var(--surface-subtle) !important;
  // background-color: var(--surface-subtle) !important;
  background-image: none !important;
}

.access-page :deep(.smart-table .el-table__body-wrapper tr.hover-row:not(:hover) > td.el-table-fixed-column--right),
.access-page :deep(.smart-table .el-table__body-wrapper tr.current-row:not(:hover) > td.el-table-fixed-column--right) {
  background: var(--surface-card) !important;
  background-color: var(--surface-card) !important;
}

.access-page :deep(.smart-table .el-table__body-wrapper tr:hover > td.el-table-fixed-column--right) {
  background: var(--el-table-row-hover-bg-color) !important;
  background-color: var(--el-table-row-hover-bg-color) !important;
}

.access-page :deep(.smart-table td.el-table-fixed-column--right .cell) {
  overflow: hidden;
  white-space: nowrap;
}

.menu-target {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  min-width: 0;
  gap: 3px;
}

.menu-target span,
.menu-target small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menu-target span {
  color: var(--text-primary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
}

.menu-target small {
  color: var(--text-tertiary);
  font-size: 11px;
  text-transform: uppercase;
}

.role-table :deep(.permission-count-tag) {
  min-width: 38px;
  justify-content: center;
  --el-tag-bg-color: rgba(var(--primary-color), 0.12);
  --el-tag-border-color: rgba(var(--primary-color), 0.32);
  --el-tag-text-color: rgb(var(--primary-color));
  font-weight: 700;
}

.role-table :deep(.el-table__body td:nth-child(5) .el-tag) {
  font-weight: 650;
}

.role-table :deep(.table-row-actions) {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.role-table :deep(.table-row-actions .el-button) {
  min-height: 30px;
  padding: 4px 8px;
  border-radius: 8px;
  font-weight: 650;
}

.role-table :deep(.table-row-actions .el-button:hover:not(.is-disabled)) {
  background: rgba(var(--primary-color), 0.1);
}

.role-table :deep(.table-row-actions .el-button--danger:hover:not(.is-disabled)) {
  background: rgba(248, 113, 113, 0.1);
}

/* Keep disabled action buttons semantically colored in dark mode instead of
   inheriting the global neutral disabled-button treatment. */
.role-table :deep(.table-row-actions .el-button.is-link.is-disabled) {
  border-color: transparent !important;
  background: transparent !important;
  box-shadow: none !important;
  opacity: 0.52 !important;
}

.role-table :deep(.table-row-actions .el-button--primary.is-link.is-disabled),
.role-table :deep(.table-row-actions .el-button--primary.is-link.is-disabled > span),
.role-table :deep(.table-row-actions .el-button--primary.is-link.is-disabled .el-icon) {
  --el-button-disabled-text-color: var(--table-action-color);
  color: var(--table-action-color) !important;
}

.role-table :deep(.table-row-actions .el-button--danger.is-link.is-disabled),
.role-table :deep(.table-row-actions .el-button--danger.is-link.is-disabled > span),
.role-table :deep(.table-row-actions .el-button--danger.is-link.is-disabled .el-icon) {
  --el-button-disabled-text-color: var(--table-action-danger-color);
  color: var(--table-action-danger-color) !important;
}

.role-editor-form {
  display: grid;
  gap: 4px;
}

.role-editor-dialog-body {
  padding-top: 0;
}

.role-editor-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 320px);
  align-items: start;
  gap: 18px;
}

.role-editor-main {
  display: grid;
  min-width: 0;
  gap: 16px;
}

.role-info-panel,
.role-menu-panel,
.role-advanced-panel,
.role-summary-panel {
  min-width: 0;
  border: 1px solid var(--border-subtle);
  border-radius: 18px;
  background: color-mix(in srgb, var(--surface-card) 94%, var(--surface-hover));
  box-shadow: var(--shadow-xs);
}

.role-info-panel,
.role-menu-panel,
.role-advanced-panel {
  padding: 20px;
}

.role-editor-section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;

  h3 {
    margin: 0;
    color: var(--text-primary);
    font-size: 17px;
    font-weight: 750;
  }

  p {
    margin: 6px 0 0;
    color: var(--text-tertiary);
    font-size: 12px;
    line-height: 1.5;
  }
}

.role-info-form {
  display: grid;
  gap: 2px;

  :deep(.el-form-item) {
    margin-bottom: 14px;
  }

  :deep(.el-form-item:last-child) {
    margin-bottom: 0;
  }

  :deep(.el-form-item__label) {
    color: var(--text-secondary);
    font-weight: 650;
  }
}

.role-menu-count {
  flex: 0 0 auto;
  padding: 5px 9px;
  border: 1px solid rgba(var(--primary-color), 0.22);
  border-radius: 999px;
  color: rgb(var(--primary-color));
  background: rgba(var(--primary-color), 0.08);
  font-size: 12px;
  font-weight: 650;
  white-space: nowrap;
}

.role-menu-tree-scroll {
  max-height: 470px;
  padding: 2px 6px 2px 0;
  overflow-y: auto;
  scrollbar-gutter: stable;
}

.role-summary-panel {
  position: sticky;
  top: 0;
  overflow: hidden;
}

.role-summary-head {
  padding: 20px 18px 16px;
  border-bottom: 1px solid var(--border-subtle);
  background: color-mix(in srgb, var(--surface-hover) 78%, var(--surface-card));

  h3 {
    margin: 0;
    color: var(--text-primary);
    font-size: 17px;
    line-height: 1.4;
  }
}

.role-summary-section {
  display: grid;
  gap: 12px;
  padding: 18px;
}

.role-summary-section + .role-summary-section {
  padding-top: 0;
}

.role-summary-section > strong {
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 700;
}

.role-summary-chip-list,
.role-summary-permission-list {
  max-height: 250px;
  overflow-y: auto;
}

.role-summary-chip-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.role-summary-permission-list {
  display: grid;
  gap: 8px;
}

.role-summary-chip,
.role-summary-permission {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid transparent;
  border-radius: 9px;
  color: var(--text-primary);
  background: color-mix(in srgb, var(--surface-hover) 82%, rgba(var(--primary-color), 0.08));
  text-align: left;
  cursor: pointer;
  transition: background-color 0.18s ease, border-color 0.18s ease;
}

.role-summary-chip:hover,
.role-summary-permission:hover {
  border-color: rgba(var(--primary-color), 0.26);
  background: rgba(var(--primary-color), 0.1);
}

.role-summary-chip span,
.role-summary-permission span,
.role-summary-permission code {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.role-summary-chip span,
.role-summary-permission span {
  color: var(--text-primary);
  font-size: 12px;
}

.role-summary-permission code {
  color: rgb(var(--primary-color));
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
}

.role-summary-empty {
  color: var(--text-tertiary);
  font-size: 12px;
}

.role-advanced-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 14px;
  padding: 0;
  border: 0;
  color: var(--text-primary);
  background: transparent;
  text-align: left;
  cursor: pointer;

  > span {
    display: grid;
    min-width: 0;
    gap: 5px;
  }

  strong {
    font-size: 14px;
    font-weight: 700;
  }

  small {
    color: var(--text-tertiary);
    font-size: 11px;
    line-height: 1.5;
  }

  > .el-icon {
    flex: 0 0 auto;
    color: var(--text-tertiary);
    transition: transform 0.18s ease;
  }

  > .el-icon.is-expanded {
    transform: rotate(90deg);
  }
}

.role-advanced-content {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-subtle);

  code {
    padding: 5px 8px;
    border: 1px solid rgba(var(--primary-color), 0.2);
    border-radius: 7px;
    color: rgb(var(--primary-color));
    background: rgba(var(--primary-color), 0.07);
    font-size: 11px;
  }
}

.menu-editor-form :deep(.menu-type-segmented) {
  --el-segmented-color: var(--text-secondary);
  --el-segmented-bg-color: var(--surface-subtle);
  --el-segmented-item-selected-color: var(--primary-button-text);
  --el-segmented-item-selected-bg-color: rgb(var(--primary-color));
  --el-segmented-item-selected-disabled-bg-color: rgba(var(--primary-color), 0.46);
  --el-segmented-item-hover-color: var(--text-primary);
  --el-segmented-item-hover-bg-color: var(--surface-hover);
  --el-segmented-item-active-bg-color: var(--surface-muted);
  --el-segmented-item-disabled-color: var(--text-placeholder);
  border: 1px solid var(--border-default);
  box-shadow: var(--shadow-xs);
}

.permission-panel {
  width: 100%;
  display: grid;
  gap: 14px;
}

.permission-panel__summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--text-secondary);
  font-size: 12px;

  strong {
    color: var(--text-primary);
    font-weight: 700;
  }
}

.permission-panel__scroll {
  max-height: 420px;
  padding-right: 6px;
}

.permission-group {
  display: grid;
  gap: 10px;
  margin-bottom: 18px;
  padding: 16px 16px 18px;
  border: 1px solid var(--border-subtle);
  border-radius: 18px;
  background: color-mix(in srgb, var(--surface-hover) 72%, var(--surface-card));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.permission-group__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  .permission-group__title {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  strong {
    color: var(--text-primary);
    font-size: 14px;
    font-weight: 700;
  }

  span {
    min-width: 28px;
    padding: 3px 8px;
    border: 1px solid var(--border-subtle);
    border-radius: 999px;
    color: var(--text-tertiary);
    font-size: 12px;
    line-height: 18px;
    text-align: center;
    background: var(--surface-card);
  }

  :deep(.el-checkbox) {
    height: auto;
    margin-right: 0;
  }

  :deep(.el-checkbox__label) {
    padding-left: 6px;
    color: var(--text-secondary);
    font-size: 12px;
    font-weight: 600;
  }
}

.permission-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;

  :deep(.el-checkbox) {
    min-width: 0;
    width: 100%;
    height: auto;
    min-height: 60px;
    margin-right: 0;
    padding: 12px 14px;
    border: 1px solid var(--border-subtle);
    border-radius: 14px;
    background: color-mix(in srgb, var(--surface-card) 88%, var(--surface-hover));
    align-items: flex-start;
    white-space: normal;
    transition: border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
  }

  :deep(.el-checkbox__label) {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 3px;
    width: 100%;
    min-width: 0;
    padding-left: 0;
    white-space: normal;
  }

  :deep(.el-checkbox__input) {
    flex: 0 0 auto;
    margin-top: 2px;
  }

  :deep(.el-checkbox:hover) {
    border-color: rgba(var(--primary-color), 0.36);
    background: rgba(var(--primary-color), 0.06);
  }

  :deep(.el-checkbox.is-checked) {
    border-color: rgba(var(--primary-color), 0.46);
    background: rgba(var(--primary-color), 0.1);
    box-shadow: inset 3px 0 0 rgb(var(--primary-color));
  }
}

.permission-item {
  display: flex !important;
  align-items: flex-start;
  gap: 10px;
  box-sizing: border-box;
}

.permission-item__name {
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 600;
  line-height: 18px;
}

.permission-item__code {
  color: var(--text-tertiary);
  font-size: 12px;
  line-height: 16px;
  word-break: break-all;
}

.menu-preview {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 14px 16px;
  border: 1px dashed var(--border-subtle);
  border-radius: 16px;
  background: color-mix(in srgb, var(--surface-hover) 76%, transparent);
}

.menu-preview__empty {
  color: var(--text-tertiary);
  font-size: 12px;
}

.dialog-form {
  padding-top: 6px;
}

@media (max-width: 960px) {
  .hero-card {
    padding: 22px;
  }

  .panel-card {
    padding: 18px;
  }

  .hero-main h2 {
    font-size: 30px;
  }

  .hero-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .toolbar-shell,
  .table-shell {
    padding: 12px;
  }

  .role-editor-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .role-summary-panel {
    position: static;
  }
}

@media (max-width: 640px) {
  .hero-metrics {
    grid-template-columns: 1fr;
  }
}
</style>
