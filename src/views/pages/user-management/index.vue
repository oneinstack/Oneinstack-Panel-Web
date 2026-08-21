<script setup lang="ts">
import CustomTable, { type ColumnItem } from '@/components/custom-table.vue'
import SearchInput from '@/components/search-input.vue'
import { Api } from '@/api/modules'
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { CircleCheck, CollectionTag, Key, User } from '@element-plus/icons-vue'
import i18n from '@/lang'

interface AccessRole {
  code: string
  name: string
}

interface AccessUser {
  id: number
  username: string
  isAdmin?: boolean
  isSuperAdmin?: boolean
  mustChangePassword?: boolean
  createdAt?: string
  roles?: AccessRole[]
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
  resetPassword: false
})

const currentUser = ref<any>(null)
const roles = ref<AccessRole[]>([])

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
    { prop: 'mustChangePassword', label: t('common.status', 'Status'), minWidth: 120 },
    { prop: 'createdAt', label: t('userManagement.createdAt', 'Created at'), minWidth: 180 },
    { prop: 'action', label: t('common.action', 'Action'), width: 220, fixed: 'right' }
  ])
})

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
    roleDialog.roleCodes = (user.roles || []).map((item) => item.code)
    roleDialog.show = true
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

const canManageUsers = computed(
  () => Boolean(currentUser.value?.isSuperAdmin || currentUser.value?.isAdmin)
)
const roleTagList = computed(() => currentUser.value?.roles || [])
const totalAssignedUsers = computed(() => userState.list.filter((item) => (item.roles || []).length > 0).length)
const totalPendingUsers = computed(() => userState.list.filter((item) => item.mustChangePassword).length)
const allRoleCodes = computed(() => roles.value.map((item) => item.code))
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
  if (roleKey) return t(`userManagement.roles.${roleKey}`, role.name || role.code)
  return role.name || role.code
}
const userScopeLabel = (row: AccessUser) => {
  if (row.isSuperAdmin || row.isAdmin) return t('userManagement.superAdmin', 'Super administrator')
  if (!(row.roles || []).length) return t('userManagement.unauthorized', 'Unauthorized')
  return t('userManagement.roleAuthorized', 'Role authorized')
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
    ElMessage.success(t('userManagement.resetPasswordSuccess', 'Password reset'))
    passwordDialog.show = false
    await loadUsers()
  } catch (error: any) {
    // ElMessage.error(error?.message || t('userManagement.resetPasswordFailed', 'Failed to reset password'))
  } finally {
    loading.resetPassword = false
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
            :key="item.code"
            effect="plain"
            round
          >
            {{ roleLabel(item) }}
          </el-tag>
          <el-tag v-if="currentUser?.isSuperAdmin || currentUser?.isAdmin" type="danger" round>
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

    <section class="panel-card">
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
                  :key="item.code"
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
            <el-tag :type="row.isSuperAdmin || row.isAdmin ? 'danger' : 'info'" effect="light" round>
              {{ userScopeLabel(row) }}
            </el-tag>
          </template>
          <template #mustChangePassword="{ row }">
            <el-tag :type="row.mustChangePassword ? 'warning' : 'success'" effect="light" round>
              {{ row.mustChangePassword ? $t('userManagement.mustChangePassword') : $t('userManagement.healthy') }}
            </el-tag>
          </template>
          <template #createdAt="{ row }">
            <span class="time-text">{{ formatTime(row.createdAt) }}</span>
          </template>
          <template #action="{ row }">
            <div class="action-wrap action-wrap--compact table-row-actions">
              <el-button link type="primary" :icon="CollectionTag" :disabled="!canManageUsers" @click="roleDialog.open(row)">{{ $t('userManagement.changeRole') }}</el-button>
              <el-button link type="primary" :icon="Key" :disabled="!canManageUsers" @click="passwordDialog.open(row)">{{ $t('userManagement.resetPassword') }}</el-button>
            </div>
          </template>
        </custom-table>
      </div>
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
                <el-checkbox v-for="item in roles" :key="item.code" :value="item.code">
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
          <el-checkbox v-for="item in roles" :key="item.code" :value="item.code">
            {{ roleLabel(item) }}
          </el-checkbox>
        </el-checkbox-group>
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
  }
}

.role-select-panel {
  width: 100%;

  .role-dialog-toolbar {
    margin-bottom: 12px;
  }
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
