<script setup lang="ts">
import CustomTable, { type ColumnItem } from '@/components/custom-table.vue'
import SearchInput from '@/components/search-input.vue'
import { Api } from '@/api/Api'
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { CircleCheck, CollectionTag, Key, User } from '@element-plus/icons-vue'

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
  columns: [
    { prop: 'username', label: '账号', minWidth: 160 },
    { prop: 'roles', label: '角色', minWidth: 240 },
    { prop: 'scope', label: '权限范围', minWidth: 140 },
    { prop: 'mustChangePassword', label: '状态', minWidth: 120 },
    { prop: 'createdAt', label: '创建时间', minWidth: 180 },
    { prop: 'action', label: '操作', width: 220 }
  ] as ColumnItem[]
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
const roleAllChecked = computed(
  () => allRoleCodes.value.length > 0 && roleDialog.roleCodes.length === allRoleCodes.value.length
)
const roleIndeterminate = computed(
  () => roleDialog.roleCodes.length > 0 && roleDialog.roleCodes.length < allRoleCodes.value.length
)

const formatTime = (value?: string) => value ? new Date(value).toLocaleString() : '—'
const userScopeLabel = (row: AccessUser) => {
  if (row.isSuperAdmin || row.isAdmin) return '超级管理员'
  if (!(row.roles || []).length) return '未授权'
  return '角色授权'
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
    ElMessage.warning('请输入账号名')
    return
  }
  if (username.length < 3) {
    ElMessage.warning('账号名长度不能少于3个字符')
    return
  }
  if (!createUserDialog.form.password.trim()) {
    ElMessage.warning('请输入初始密码')
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
    ElMessage.success('用户创建成功')
    createUserDialog.show = false
    await loadUsers()
  } catch (error: any) {
    ElMessage.error(error?.message || '创建用户失败')
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
    ElMessage.success('角色更新成功')
    roleDialog.show = false
    await loadUsers()
  } catch (error: any) {
    ElMessage.error(error?.message || '角色更新失败')
  } finally {
    loading.updateRoles = false
  }
}

const toggleAllRoles = (value: string | number | boolean) => {
  roleDialog.roleCodes = Boolean(value) ? [...allRoleCodes.value] : []
}

const submitPasswordReset = async () => {
  if (!passwordDialog.user) return
  if (!passwordDialog.password.trim()) {
    ElMessage.warning('请输入新密码')
    return
  }

  loading.resetPassword = true
  try {
    await Api.resetAccessUserPassword(passwordDialog.user.id, {
      password: passwordDialog.password
    })
    ElMessage.success('密码重置成功')
    passwordDialog.show = false
    await loadUsers()
  } catch (error: any) {
    ElMessage.error(error?.message || '密码重置失败')
  } finally {
    loading.resetPassword = false
  }
}

onMounted(async () => {
  try {
    await loadBootstrap()
    await loadUsers()
  } catch (error: any) {
    ElMessage.error(error?.message || '页面初始化失败')
  }
})
</script>

<template>
  <div v-loading="loading.bootstrap" class="access-page">
    <section class="hero-card">
      <div class="hero-main">
        <div class="hero-copy">
          <span class="eyebrow">Access Control</span>
          <h2>账号权限中心</h2>
          <p>统一管理用户账号、角色分配与密码重置，支持按角色模型快速联调。</p>
        </div>
        <div class="role-tags">
          <el-tag
            v-for="item in roleTagList"
            :key="item.code"
            effect="plain"
            round
          >
            {{ item.name || item.code }}
          </el-tag>
          <el-tag v-if="currentUser?.isSuperAdmin || currentUser?.isAdmin" type="danger" round>
            超级管理员
          </el-tag>
        </div>
        <div class="hero-metrics">
          <div class="metric-chip metric-chip--total">
            <div class="metric-chip__accent"></div>
            <div class="metric-chip__icon">
              <el-icon><User /></el-icon>
            </div>
            <div class="metric-chip__content">
              <span>用户总数</span>
              <strong>{{ userState.total }}</strong>
            </div>
          </div>
          <div class="metric-chip metric-chip--granted">
            <div class="metric-chip__accent"></div>
            <div class="metric-chip__icon">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="metric-chip__content">
              <span>已授权用户</span>
              <strong>{{ totalAssignedUsers }}</strong>
            </div>
          </div>
          <div class="metric-chip metric-chip--pending">
            <div class="metric-chip__accent"></div>
            <div class="metric-chip__icon">
              <el-icon><Key /></el-icon>
            </div>
            <div class="metric-chip__content">
              <span>待改密账号</span>
              <strong>{{ totalPendingUsers }}</strong>
            </div>
          </div>
          <div class="metric-chip metric-chip--roles">
            <div class="metric-chip__accent"></div>
            <div class="metric-chip__icon">
              <el-icon><CollectionTag /></el-icon>
            </div>
            <div class="metric-chip__content">
              <span>角色仓库</span>
              <strong>{{ roles.length }}</strong>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="panel-card">
      <div class="panel-head">
        <div>
          <span class="panel-kicker">Account Directory</span>
          <h3>用户与角色</h3>
        </div>
        <div class="panel-summary">
          <span>支持账号检索、角色授权与密码重置</span>
        </div>
      </div>
      <div class="toolbar-shell">
        <div class="toolbar">
          <div class="toolbar-left">
            <search-input v-model:model-value="userState.keyword" placeholder="搜索账号名" @search="searchUsers" />
          </div>
          <div class="toolbar-right">
            <el-button @click="resetUsers">重置</el-button>
            <el-button type="primary" :disabled="!canManageUsers" @click="createUserDialog.open()">新建用户</el-button>
          </div>
        </div>
        <div class="toolbar-note">
          <span>当前列表 {{ userState.total }} 个账号</span>
          <span>支持按角色模型进行快速授权</span>
        </div>
      </div>

      <div class="table-shell">
        <custom-table
          :loading="loading.users"
          :columns="userState.columns"
          :data="userState.list"
          :total="userState.total"
          :auto-pagination="false"
          @update:page="(page) => { userState.filters.page = page; loadUsers() }"
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
                  {{ item.name || item.code }}
                </el-tag>
              </div>
              <span v-else class="role-empty">未分配</span>
            </div>
          </template>
          <template #scope="{ row }">
            <el-tag :type="row.isSuperAdmin || row.isAdmin ? 'danger' : 'info'" effect="light" round>
              {{ userScopeLabel(row) }}
            </el-tag>
          </template>
          <template #mustChangePassword="{ row }">
            <el-tag :type="row.mustChangePassword ? 'warning' : 'success'" effect="light" round>
              {{ row.mustChangePassword ? '需改密' : '正常' }}
            </el-tag>
          </template>
          <template #createdAt="{ row }">
            <span class="time-text">{{ formatTime(row.createdAt) }}</span>
          </template>
          <template #action="{ row }">
            <div class="action-wrap action-wrap--compact">
              <el-button link type="primary" :disabled="!canManageUsers" @click="roleDialog.open(row)">改角色</el-button>
              <span class="action-divider"></span>
              <el-button link :disabled="!canManageUsers" @click="passwordDialog.open(row)">重置密码</el-button>
            </div>
          </template>
        </custom-table>
      </div>
    </section>

    <custom-dialog v-model:show="createUserDialog.show" title="新建用户" width="640px">
      <div class="dialog-form">
        <el-form label-position="top">
          <el-form-item label="账号名">
            <el-input v-model="createUserDialog.form.username" placeholder="请输入用户名" />
          </el-form-item>
          <el-form-item label="初始密码">
            <el-input v-model="createUserDialog.form.password" type="password" show-password placeholder="请输入初始密码" />
          </el-form-item>
          <el-form-item label="是否超级管理员">
            <el-switch v-model="createUserDialog.form.isAdmin" />
          </el-form-item>
          <el-form-item v-if="!createUserDialog.form.isAdmin" label="角色分配">
            <el-checkbox-group v-model="createUserDialog.form.roleCodes" class="checkbox-grid">
              <el-checkbox v-for="item in roles" :key="item.code" :value="item.code">
                {{ item.name }}
              </el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="createUserDialog.show = false">取消</el-button>
        <el-button type="primary" :loading="loading.createUser" @click="submitCreateUser">创建</el-button>
      </template>
    </custom-dialog>

    <custom-dialog v-model:show="roleDialog.show" title="修改角色" width="640px">
      <div class="dialog-form">
        <el-alert
          :title="`当前账号：${roleDialog.user?.username || '—'}`"
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
            全选
          </el-checkbox>
          <span class="role-dialog-count">已选 {{ roleDialog.roleCodes.length }} / {{ allRoleCodes.length }}</span>
        </div>
        <el-checkbox-group v-model="roleDialog.roleCodes" class="checkbox-grid">
          <el-checkbox v-for="item in roles" :key="item.code" :value="item.code">
            {{ item.name }}
          </el-checkbox>
        </el-checkbox-group>
      </div>
      <template #footer>
        <el-button @click="roleDialog.show = false">取消</el-button>
        <el-button type="primary" :loading="loading.updateRoles" @click="submitRoleUpdate">保存</el-button>
      </template>
    </custom-dialog>

    <custom-dialog v-model:show="passwordDialog.show" title="重置密码" width="560px">
      <div class="dialog-form">
        <el-alert
          :title="`将为 ${passwordDialog.user?.username || '该账号'} 设置新的登录密码`"
          type="warning"
          :closable="false"
          show-icon
          style="margin-bottom: 16px"
        />
        <el-form label-position="top">
          <el-form-item label="新密码">
            <el-input v-model="passwordDialog.password" type="password" show-password placeholder="请输入新密码" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="passwordDialog.show = false">取消</el-button>
        <el-button type="primary" :loading="loading.resetPassword" @click="submitPasswordReset">确认重置</el-button>
      </template>
    </custom-dialog>
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
  border: 1px solid rgba(218, 225, 236, 0.9);
  border-radius: 24px;
  background: var(--surface-card);
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.05);
}

.hero-card {
  padding: 28px;
  background:
    radial-gradient(circle at top right, rgba(var(--primary-color), 0.12), transparent 28%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(246, 248, 252, 0.98));
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
  border: 1px solid transparent;
  overflow: hidden;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.84),
    0 14px 30px rgba(15, 23, 42, 0.04);
}

.metric-chip--total {
  background: linear-gradient(145deg, #fff8f5, #fff2eb);
  border-color: rgba(255, 120, 64, 0.14);
}

.metric-chip--granted {
  background: linear-gradient(145deg, #f3fdf7, #e9f9f0);
  border-color: rgba(22, 163, 74, 0.14);
}

.metric-chip--pending {
  background: linear-gradient(145deg, #fffaf0, #fff2dc);
  border-color: rgba(245, 158, 11, 0.16);
}

.metric-chip--roles {
  background: linear-gradient(145deg, #f5f7ff, #edf1ff);
  border-color: rgba(99, 102, 241, 0.14);
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
  color: #6b7280;
  background: rgba(255, 255, 255, 0.76);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.92);
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
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.96), rgba(244, 247, 251, 0.9));
  border: 1px solid rgba(218, 225, 236, 0.86);
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
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(247, 249, 252, 0.96));
  border: 1px solid rgba(218, 225, 236, 0.82);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
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
