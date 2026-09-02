<script setup lang="ts">
import CustomTable, { type ColumnItem } from '@/components/custom-table.vue'
import SearchInput from '@/components/search-input.vue'
import SystemManagementTabs from '@/views/pages/system-management/components/system-management-tabs.vue'
import { Api, type AccessMenuNode, type AccessPermission, type AccessRole as ApiAccessRole } from '@/api/modules'
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CircleCheck, CollectionTag, Delete, Edit, Key, Plus, User } from '@element-plus/icons-vue'
import i18n from '@/lang'

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
  deleteUserId: 0
})

const currentUser = ref<any>(null)
const roles = ref<ApiAccessRole[]>([])
const permissions = ref<AccessPermission[]>([])
const activeTab = ref('users')
const accessTabItems = [
  { key: 'users', label: '用户管理', labelKey: 'userManagement.userTab' },
  { key: 'permissions', label: '权限管理', labelKey: 'userManagement.permissionTab' }
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
    roleEditorDialog.form.permissionCodes = [...(role?.permissions || [])]
    roleEditorDialog.detail = role ? role : null
    roleEditorDialog.show = true
    if (!role?.key) return
    roleEditorDialog.detailLoading = true
    try {
      const response = await Api.getAccessRoleDetail(role.key)
      roleEditorDialog.detail = response.data || roleEditorDialog.detail
      roleEditorDialog.form.permissionCodes = [...(response.data?.permissions || roleEditorDialog.form.permissionCodes)]
    } catch {
      roleEditorDialog.detail = roleEditorDialog.detail || role
    } finally {
      roleEditorDialog.detailLoading = false
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
const permissionGroups = computed(() => {
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

const flattenMenuTree = (nodes: AccessMenuNode[] = []): string[] =>
  nodes.flatMap((node) => {
    const current = node?.name ? [node.name] : []
    const children = node?.children?.length ? flattenMenuTree(node.children) : []
    return [...current, ...children]
  })

const roleMenuPreview = computed(() => flattenMenuTree(roleEditorDialog.detail?.menuTree || []))

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
    const [userRes, roleRes] = await Promise.all([
      Api.getCurrentUserAccess(),
      Api.getAccessRoles()
    ])
    currentUser.value = userRes.data
    roles.value = roleRes.data || []
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
    const payload = {
      key,
      code: key,
      name,
      description,
      permissionCodes: [...roleEditorDialog.form.permissionCodes],
      permissions: [...roleEditorDialog.form.permissionCodes]
    }
    if (roleEditorDialog.mode === 'create') {
      await Api.createAccessRole(payload)
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
            effect="plain"
            round
          >
            {{ roleLabel(item) }}
          </el-tag>
          <el-tag v-if="currentUser?.isSuperAdmin" type="danger" round>
            {{ $t('userManagement.superAdmin') }}
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
            <el-tag :type="row.isSuperAdmin ? 'danger' : 'info'" effect="light" round>
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

    <section v-else class="panel-card">
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
      size="980px"
      :confirm-text="$t('common.save')"
      :loading="roleEditorDialog.loading"
      :on-close="() => { roleEditorDialog.show = false }"
      :on-confirm="submitRoleEditor"
    >
      <div class="dialog-form">
        <el-alert
          :title="t('userManagement.rolePermissionTip', 'Role menus are computed from permission codes. Save the role to refresh its menuTree.')"
          type="info"
          :closable="false"
          show-icon
          style="margin-bottom: 16px"
        />
        <el-form label-position="top" class="role-editor-form">
          <el-form-item
            v-if="roleEditorDialog.mode === 'create'"
            :label="$t('userManagement.roleKey', 'Role key')"
            required
          >
            <el-input
              v-model="roleEditorDialog.form.key"
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
          <el-form-item :label="$t('userManagement.permissionSelection', 'Permission codes')">
            <div class="permission-panel">
              <div class="permission-panel__summary">
                <span>{{ t('userManagement.permissionSelectionHint', 'Select the backend permission codes that define this role.') }}</span>
                <strong>{{ t('userManagement.selectedCount', '{selected} / {total} selected', { selected: roleEditorDialog.form.permissionCodes.length, total: permissions.length }) }}</strong>
              </div>
              <el-scrollbar class="permission-panel__scroll">
                <div v-for="group in permissionGroups" :key="group.module" class="permission-group">
                  <div class="permission-group__head">
                    <strong>{{ group.label }}</strong>
                    <span>{{ group.items.length }}</span>
                  </div>
                  <el-checkbox-group v-model="roleEditorDialog.form.permissionCodes" class="permission-grid">
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
          <el-form-item :label="$t('userManagement.menuPreview', 'Menu preview')">
            <div class="menu-preview">
              <template v-if="roleEditorDialog.detailLoading">
                <el-skeleton :rows="2" animated />
              </template>
              <template v-else-if="roleMenuPreview.length">
                <el-tag
                  v-for="name in roleMenuPreview"
                  :key="name"
                  effect="plain"
                  round
                >
                  {{ name }}
                </el-tag>
              </template>
              <span v-else class="menu-preview__empty">
                {{ t('userManagement.menuPreviewEmpty', 'The backend will calculate menuTree from the saved permissions.') }}
              </span>
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
  height: 28px;
  border-radius: 999px;
  padding: 0 4px;
  font-size: 12px;
  font-weight: 600;
  line-height: 26px;
}

.placeholder-text,
.role-dialog-count {
  color: var(--text-secondary);
  font-size: 12px;
}

.role-empty {
  display: inline-flex;
  align-items: center;
  height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.08);
  color: #7c8597;
  font-size: 12px;
  font-weight: 600;
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
    background: var(--surface-card);
  }

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

.role-editor-form {
  display: grid;
  gap: 4px;
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
}

@media (max-width: 640px) {
  .hero-metrics {
    grid-template-columns: 1fr;
  }
}
</style>
