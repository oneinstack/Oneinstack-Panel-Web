<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Delete, Plus, Refresh, RefreshLeft, View } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Api } from '@/api/Api'
import type {
  ConfigurationSnapshot,
  SnapshotDiff,
  SnapshotResourceType,
  SnapshotStatus
} from '@/api/Api'
import sconfig from '@/sstore/sconfig'

interface SnapshotDetail {
  snapshot?: ConfigurationSnapshot
  before?: unknown
  after?: unknown
  diff?: SnapshotDiff
}

interface RestorePreview {
  snapshot?: ConfigurationSnapshot
  current?: unknown
  target?: unknown
  diff?: SnapshotDiff
  hasDrift?: boolean
  requiresForce?: boolean
}

interface SnapshotResourceOption {
  label: string
  value: string
  description?: string
}

const loading = ref(false)
const detailLoading = ref(false)
const restoreLoading = ref(false)
const deletingId = ref('')
const snapshots = ref<ConfigurationSnapshot[]>([])
const total = ref(0)
const detailVisible = ref(false)
const detail = ref<SnapshotDetail | null>(null)
const restoreVisible = ref(false)
const restorePreview = ref<RestorePreview | null>(null)
const selectedSnapshot = ref<ConfigurationSnapshot | null>(null)
const createVisible = ref(false)
const createLoading = ref(false)
const createResourceLoading = ref(false)
const forceRestoreConfirmed = ref(false)
const websiteResourceOptions = ref<SnapshotResourceOption[]>([])
const nginxResourceOptions = ref<SnapshotResourceOption[]>([])

const filters = reactive({
  page: 1,
  pageSize: 20,
  resourceType: '' as '' | SnapshotResourceType,
  resourceId: '',
  status: '' as '' | SnapshotStatus
})

const createForm = reactive({
  resourceType: 'website' as SnapshotResourceType,
  resourceId: '',
  name: '',
  version: '当前配置',
  backupAccount: '服务器磁盘',
  description: ''
})

const resourceOptions = [
  { label: '全部资源', value: '' },
  { label: '网站配置', value: 'website' },
  { label: 'Nginx 配置', value: 'nginx' },
  { label: '防火墙规则', value: 'firewall' },
  { label: '面板访问', value: 'panel_access' }
]

const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '待处理', value: 'pending' },
  { label: '应用中', value: 'applying' },
  { label: '成功', value: 'succeeded' },
  { label: '失败', value: 'failed' },
  { label: '已回滚', value: 'rolled_back' },
  { label: '回滚失败', value: 'rollback_failed' }
]

const resourceGuideGroups = [
  {
    title: '网站',
    type: 'website',
    resourceId: '网站 ID，例如 12',
    note: '网站回滚会重新通过网站校验和 Nginx 发布流程。',
    fields: [
      { name: 'running_directory', type: 'string', description: '网站根目录下的运行目录' },
      { name: 'directory_listing', type: 'boolean', description: '是否允许目录浏览' },
      { name: 'default_documents', type: 'string', description: '默认首页，空格分隔' },
      { name: 'allowed_ips', type: 'string', description: '允许 IP/CIDR，每行一个' },
      { name: 'denied_ips', type: 'string', description: '拒绝 IP/CIDR，每行一个' },
      { name: 'rewrite_rules', type: 'string', description: 'rewrite 规则' },
      { name: 'bindings', type: 'array', description: '目录绑定' },
      { name: 'redirects', type: 'array', description: '重定向规则' },
      { name: 'proxy_rules', type: 'array', description: '反向代理规则' },
      { name: 'php_backend', type: 'string', description: 'PHP 后端地址' },
      { name: 'security_headers', type: 'boolean', description: '安全响应头开关' },
      { name: 'access_log_enabled', type: 'boolean', description: '访问日志开关' },
      { name: 'error_log_enabled', type: 'boolean', description: '错误日志开关' }
    ]
  },
  {
    title: 'Nginx',
    type: 'nginx',
    resourceId: '受管配置路径，例如 example.com.conf',
    note: 'Nginx 变更会先语法校验，再原子发布和 reload；前端不传递 Shell 命令。',
    fields: [
      { name: 'path', type: 'string', description: '受管配置路径' },
      { name: 'name', type: 'string', description: '配置文件名称' },
      { name: 'size', type: 'number', description: '文件大小' },
      { name: 'modifiedAt', type: 'string', description: '最近修改时间' },
      { name: 'revision', type: 'string', description: '版本摘要或版本号' },
      { name: 'main', type: 'boolean', description: '是否主配置' },
      { name: 'site', type: 'boolean', description: '是否站点配置' },
      { name: 'content', type: 'string', description: '配置文件内容' }
    ]
  },
  {
    title: '防火墙',
    type: 'firewall',
    resourceId: '固定为 host',
    note: '面板保护规则不会被快照恢复过程删除。',
    fields: [
      { name: 'ruleType', type: 'string', description: '规则类型，通常为 port' },
      { name: 'direction', type: 'string', description: '入站或出站' },
      { name: 'protocol', type: 'string', description: 'tcp、udp、icmp 等' },
      { name: 'strategy', type: 'string', description: 'allow 或 deny' },
      { name: 'ips', type: 'string', description: 'IP/CIDR' },
      { name: 'ports', type: 'string', description: '端口或范围' },
      { name: 'state', type: 'number', description: '启用状态' },
      { name: 'remark', type: 'string', description: '备注' },
      { name: 'expiresAt', type: 'string/null', description: '过期时间' },
      { name: 'location', type: 'string', description: '位置说明' }
    ]
  },
  {
    title: '面板访问',
    type: 'panel_access',
    resourceId: '固定为 panel',
    note: 'httpsPrivateKeyFile 只表示路径，接口不会返回私钥内容。端口变更后建议刷新面板访问配置获取最终运行状态。',
    fields: [
      { name: 'bindAddress', type: 'string', description: '监听地址' },
      { name: 'httpPort', type: 'string', description: 'HTTP 端口' },
      { name: 'httpsEnabled', type: 'boolean', description: 'HTTPS 开关' },
      { name: 'httpsPort', type: 'string', description: 'HTTPS 端口' },
      { name: 'httpsCertificateFile', type: 'string', description: '证书文件路径' },
      { name: 'httpsPrivateKeyFile', type: 'string', description: '私钥文件路径' },
      { name: 'trustedProxies', type: 'array', description: '可信代理列表' },
      { name: 'panelEntryEnabled', type: 'boolean', description: '安全入口开关' },
      { name: 'panelEntryPath', type: 'string', description: '安全入口路径' },
      { name: 'rotatePanelEntry', type: 'boolean', description: '是否轮换安全入口' }
    ]
  }
]

const integrationChecklist = [
  {
    text: '登录会话、CSRF、权限请求正常。'
  },
  {
    text: '点击“创建快照”调用',
    code: 'POST /v1/config-snapshots',
    suffix: '并传递资源类型、资源 ID、名称和描述。'
  },
  {
    text: '手动创建成功后列表显示名称、版本、备份位置、大小、状态、描述和时间。'
  },
  {
    text: '网站配置变更产生',
    code: 'resourceType=website',
    suffix: '快照。'
  },
  {
    text: 'Nginx 受管配置变更产生',
    code: 'resourceType=nginx',
    suffix: '快照。'
  },
  {
    text: '防火墙规则变更产生',
    code: 'resourceType=firewall',
    suffix: '快照。'
  },
  {
    text: '面板端口变更产生',
    code: 'resourceType=panel_access',
    suffix: '快照。'
  },
  {
    text: '详情包含',
    codes: ['before', 'after', 'diff'],
    suffix: '。'
  },
  {
    text: '漂移时显示强制覆盖确认。'
  },
  {
    text: '回滚成功后列表新增',
    code: 'operation=restore',
    suffix: '快照。'
  },
  {
    text: '审计日志能看到',
    code: 'config.snapshot.update/restore/delete',
    suffix: '事件。'
  },
  {
    text: '页面不展示密码、令牌、私钥原文。'
  },
  {
    text: '不把',
    code: 'failureMessage',
    suffix: '当 HTML 渲染。'
  }
]

const canRead = computed(() =>
  sconfig.hasActionAccess('config.snapshot.read') ||
  Boolean((sconfig.scopeAccess as any)?.config?.snapshot?.read) ||
  Boolean((sconfig.scopeAccess as any)?.['config.snapshot']?.read)
)
const canWrite = computed(() =>
  sconfig.hasActionAccess('config.snapshot.write') ||
  Boolean((sconfig.scopeAccess as any)?.config?.snapshot?.write) ||
  Boolean((sconfig.scopeAccess as any)?.['config.snapshot']?.write)
)

const succeededCount = computed(() => snapshots.value.filter((item) => item.status === 'succeeded').length)
const failedCount = computed(() =>
  snapshots.value.filter((item) => ['failed', 'rollback_failed'].includes(item.status)).length
)
const restoreCount = computed(() => snapshots.value.filter((item) => item.operation === 'restore').length)
const restoreRequiresForce = computed(() => Boolean(restorePreview.value?.hasDrift || restorePreview.value?.requiresForce))

const resourceLabel = (value?: string) => ({
  website: '网站配置',
  nginx: 'Nginx 配置',
  firewall: '防火墙规则',
  panel_access: '面板访问'
}[value || ''] || value || '—')

const operationLabel = (value?: string) => ({
  create: '创建',
  update: '更新',
  delete: '删除',
  restore: '回滚'
}[value || ''] || value || '—')

const statusLabel = (value?: string) => ({
  pending: '待处理',
  applying: '应用中',
  succeeded: '成功',
  failed: '失败',
  rolled_back: '已回滚',
  rollback_failed: '回滚失败'
}[value || ''] || value || '—')

const statusType = (value?: string) => {
  if (value === 'succeeded' || value === 'rolled_back') return 'success'
  if (value === 'pending' || value === 'applying') return 'warning'
  if (value === 'failed' || value === 'rollback_failed') return 'danger'
  return 'info'
}

const formatTime = (value?: string | null) => value ? new Date(value).toLocaleString() : '—'
const formatJson = (value: unknown) => JSON.stringify(value ?? {}, null, 2)
const shortHash = (value?: string) => value ? value.replace(/^sha256:?/, '').slice(0, 12) : '—'
const formatBytes = (value?: number) => {
  if (!Number.isFinite(value)) return '—'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = Number(value)
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }
  return `${size >= 10 || unitIndex === 0 ? size.toFixed(0) : size.toFixed(1)} ${units[unitIndex]}`
}

const diffCount = (diff?: SnapshotDiff) =>
  (diff?.added?.length || 0) + (diff?.changed?.length || 0) + (diff?.removed?.length || 0)

const snapshotErrorMessages: Record<string, string> = {
  BAD_REQUEST: '请求参数无效，请检查资源类型和资源标识',
  CONFIG_ERROR: '目标配置校验失败，请检查当前配置是否可读取或格式是否正确',
  UNAUTHORIZED: '登录会话已失效，请重新登录',
  FORBIDDEN: '当前账号没有配置快照权限',
  NOT_FOUND: '快照不存在或当前账号无权访问',
  CONFLICT: '检测到配置漂移，请重新预览；确认覆盖时需要强制回滚',
  INTERNAL_ERROR: '系统应用失败，请稍后重试或查看运行日志',
  400: '请求参数无效，请检查资源类型和资源标识',
  401: '登录会话已失效，请重新登录',
  403: '当前账号没有配置快照权限',
  404: '快照不存在或当前账号无权访问',
  409: '检测到配置漂移，请重新预览；确认覆盖时需要强制回滚',
  500: '系统应用失败，请稍后重试或查看运行日志'
}

const getSnapshotErrorMessage = (error: any, fallback: string) => {
  const data = error?.response?.data || error?.data || error?.xhr?.data || {}
  const code = data?.error?.code || data?.code || error?.code || error?.message
  const status = error?.response?.status || data?.status || error?.status
  const detail = data?.error?.detail || data?.detail
  const rawMessage = data?.error?.message || data?.message || error?.message
  const mapped = snapshotErrorMessages[String(code)] || snapshotErrorMessages[String(status)]
  if (mapped && detail) return `${mapped}：${detail}`
  return mapped || rawMessage || fallback
}

const createResourceOptions = computed(() => resourceOptions.filter((item) => item.value))
const useResourceSelect = computed(() => createForm.resourceType === 'website' || createForm.resourceType === 'nginx')
const currentCreateResourceOptions = computed(() => {
  if (createForm.resourceType === 'website') return websiteResourceOptions.value
  if (createForm.resourceType === 'nginx') return nginxResourceOptions.value
  return []
})
const resourceIdPlaceholder = computed(() => {
  const placeholders: Record<SnapshotResourceType, string> = {
    website: '请选择网站',
    nginx: '请选择受管配置文件',
    firewall: '请输入资源标识',
    panel_access: '请输入资源标识'
  }
  return placeholders[createForm.resourceType] || '请输入资源标识'
})
const resourceIdHelp = computed(() => {
  const helpText: Record<SnapshotResourceType, string> = {
    website: '选择网站，提交时使用网站 ID。',
    nginx: '选择 Nginx 受管配置文件，提交时使用 resourceId。',
    firewall: '防火墙规则固定填写 host。',
    panel_access: '面板访问配置固定填写 panel。'
  }
  return helpText[createForm.resourceType] || ''
})

const normalizeArray = (value: any): any[] => {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.items)) return value.items
  if (Array.isArray(value?.list)) return value.list
  if (Array.isArray(value?.rows)) return value.rows
  if (Array.isArray(value?.data)) return value.data
  if (Array.isArray(value?.files)) return value.files
  return []
}

const formatWebsiteOption = (item: any): SnapshotResourceOption | null => {
  const id = item?.id ?? item?.ID ?? item?.websiteId ?? item?.siteId
  if (id === undefined || id === null || id === '') return null
  const domain = item?.primaryDomain || item?.domain || item?.mainDomain || item?.siteName || item?.name || `网站 ${id}`
  const remark = item?.remark || item?.note || item?.description || ''
  return {
    label: remark ? `${domain} (${remark})` : String(domain),
    value: String(id),
    description: `ID: ${id}`
  }
}

const formatNginxOption = (item: any): SnapshotResourceOption | null => {
  const resourceId = item?.resourceId || item?.path || item?.filePath || item?.name
  if (!resourceId) return null
  const path = item?.path || item?.filePath || item?.name || resourceId
  const name = item?.name || String(path).split('/').pop() || resourceId
  const tags = [item?.main ? '主配置' : '', item?.site ? '站点配置' : ''].filter(Boolean)
  return {
    label: name,
    value: String(resourceId),
    description: tags.length ? `${path} · ${tags.join(' / ')}` : String(path)
  }
}

const loadCreateResourceOptions = async (type = createForm.resourceType) => {
  if (type !== 'website' && type !== 'nginx') return
  if (type === 'website' && websiteResourceOptions.value.length) return
  if (type === 'nginx' && nginxResourceOptions.value.length) return

  createResourceLoading.value = true
  try {
    if (type === 'website') {
      const { data } = await Api.getWebsiteList({ page: 1, pageSize: 100 })
      websiteResourceOptions.value = normalizeArray(data)
        .map(formatWebsiteOption)
        .filter(Boolean) as SnapshotResourceOption[]
    } else {
      const { data } = await Api.getConfigurationSnapshotResources('nginx')
      nginxResourceOptions.value = normalizeArray(data)
        .map(formatNginxOption)
        .filter(Boolean) as SnapshotResourceOption[]
    }
  } catch (error: any) {
    ElMessage.error(getSnapshotErrorMessage(error, '读取资源列表失败'))
  } finally {
    createResourceLoading.value = false
  }
}

const buildParams = () => ({
  page: filters.page,
  pageSize: filters.pageSize,
  resourceType: filters.resourceType || undefined,
  resourceId: filters.resourceId.trim() || undefined,
  status: filters.status || undefined
})

const loadSnapshots = async () => {
  if (!canRead.value) return
  loading.value = true
  try {
    const { data } = await Api.getConfigurationSnapshots(buildParams())
    snapshots.value = data?.items || []
    total.value = data?.total || 0
    filters.page = data?.page || filters.page
    filters.pageSize = data?.pageSize || filters.pageSize
  } catch (error: any) {
    ElMessage.error(getSnapshotErrorMessage(error, '读取配置快照失败'))
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.page = 1
  filters.resourceType = ''
  filters.resourceId = ''
  filters.status = ''
  void loadSnapshots()
}

const resetCreateForm = () => {
  createForm.resourceType = 'website'
  createForm.resourceId = ''
  createForm.name = ''
  createForm.version = '当前配置'
  createForm.backupAccount = '服务器磁盘'
  createForm.description = ''
}

const openCreateSnapshot = () => {
  resetCreateForm()
  createVisible.value = true
  void loadCreateResourceOptions()
}

const syncCreateResourceId = () => {
  if (createForm.resourceType === 'firewall') {
    createForm.resourceId = 'host'
    return
  }
  if (createForm.resourceType === 'panel_access') {
    createForm.resourceId = 'panel'
    return
  }
  createForm.resourceId = ''
  void loadCreateResourceOptions()
}

const submitCreateSnapshot = async () => {
  if (!createForm.resourceType || !createForm.resourceId.trim()) {
    ElMessage.warning(useResourceSelect.value ? '请选择资源标识' : '请选择资源类型并填写资源标识')
    return
  }
  createLoading.value = true
  try {
    await Api.createConfigurationSnapshot({
      resourceType: createForm.resourceType,
      resourceId: createForm.resourceId.trim(),
      name: createForm.name.trim() || undefined,
      version: createForm.version.trim() || undefined,
      backupAccount: createForm.backupAccount.trim() || undefined,
      description: createForm.description.trim() || undefined
    })
    ElMessage.success('配置快照已创建')
    createVisible.value = false
    filters.page = 1
    await loadSnapshots()
  } catch (error: any) {
    ElMessage.error(getSnapshotErrorMessage(error, '创建配置快照失败'))
  } finally {
    createLoading.value = false
  }
}

const openDetail = async (row: ConfigurationSnapshot) => {
  detailVisible.value = true
  selectedSnapshot.value = row
  detail.value = null
  detailLoading.value = true
  try {
    const [detailResponse, diffResponse] = await Promise.all([
      Api.getConfigurationSnapshot(row.id),
      Api.getConfigurationSnapshotDiff(row.id).catch(() => ({ data: null }))
    ])
    detail.value = {
      ...detailResponse.data,
      diff: detailResponse.data?.diff || diffResponse.data?.diff || diffResponse.data
    }
  } catch (error: any) {
    ElMessage.error(getSnapshotErrorMessage(error, '读取快照详情失败'))
  } finally {
    detailLoading.value = false
  }
}

const openRestore = async (row: ConfigurationSnapshot) => {
  selectedSnapshot.value = row
  restoreVisible.value = true
  restorePreview.value = null
  forceRestoreConfirmed.value = false
  restoreLoading.value = true
  try {
    const { data } = await Api.previewConfigurationSnapshotRestore(row.id)
    restorePreview.value = data || {}
  } catch (error: any) {
    ElMessage.error(getSnapshotErrorMessage(error, '读取回滚预览失败'))
  } finally {
    restoreLoading.value = false
  }
}

const executeRestore = async () => {
  if (!selectedSnapshot.value || !restorePreview.value) return
  const force = restoreRequiresForce.value && forceRestoreConfirmed.value
  if (restoreRequiresForce.value && !forceRestoreConfirmed.value) {
    ElMessage.warning('请先确认覆盖当前人工修改')
    return
  }
  if (!force) {
    await ElMessageBox.confirm('确认回滚到该配置快照？回滚会创建新的 restore 快照记录。', '回滚配置', {
      type: 'warning',
      confirmButtonText: '确认回滚',
      cancelButtonText: '取消'
    })
  }
  restoreLoading.value = true
  try {
    await Api.restoreConfigurationSnapshot(selectedSnapshot.value.id, { force })
    ElMessage.success('回滚已执行')
    restoreVisible.value = false
    forceRestoreConfirmed.value = false
    await loadSnapshots()
  } catch (error: any) {
    ElMessage.error(getSnapshotErrorMessage(error, '执行回滚失败'))
  } finally {
    restoreLoading.value = false
  }
}

const deleteSnapshot = async (row: ConfigurationSnapshot) => {
  await ElMessageBox.confirm(`删除快照 ${row.id}？活动中的快照不能删除。`, '删除配置快照', {
    type: 'warning',
    confirmButtonText: '删除',
    cancelButtonText: '取消'
  })
  deletingId.value = row.id
  try {
    await Api.deleteConfigurationSnapshot(row.id)
    ElMessage.success('快照已删除')
    await loadSnapshots()
  } catch (error: any) {
    ElMessage.error(getSnapshotErrorMessage(error, '删除配置快照失败'))
  } finally {
    deletingId.value = ''
  }
}

onMounted(() => {
  void loadSnapshots()
})
</script>

<template>
  <div class="snapshot-page">
    <section class="snapshot-toolbar">
      <div>
        <h2>配置快照</h2>
        <p>查看网站、Nginx、防火墙和面板访问配置的快照差异，并在确认后安全回滚。</p>
      </div>
      <div class="toolbar-actions">
        <el-button type="primary" :icon="Plus" :disabled="!canWrite" @click="openCreateSnapshot">创建快照</el-button>
        <el-button :icon="Refresh" :loading="loading" @click="loadSnapshots">刷新</el-button>
      </div>
    </section>

    <el-alert
      v-if="!canRead"
      class="snapshot-alert"
      title="当前账号没有配置快照读取权限"
      type="warning"
      show-icon
      :closable="false"
    />

    <section class="summary-grid">
      <div class="summary-card">
        <small>当前页快照</small>
        <strong>{{ snapshots.length }}</strong>
      </div>
      <div class="summary-card">
        <small>全部记录</small>
        <strong>{{ total }}</strong>
      </div>
      <div class="summary-card success">
        <small>成功快照</small>
        <strong>{{ succeededCount }}</strong>
      </div>
      <div class="summary-card warning">
        <small>回滚记录</small>
        <strong>{{ restoreCount }}</strong>
      </div>
      <div class="summary-card danger">
        <small>失败记录</small>
        <strong>{{ failedCount }}</strong>
      </div>
    </section>

    <section class="snapshot-panel">
      <div class="filter-bar">
        <el-select v-model="filters.resourceType" placeholder="资源类型" clearable style="width: 170px">
          <el-option
            v-for="item in resourceOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-input v-model="filters.resourceId" placeholder="资源 ID / 配置路径" clearable style="width: 220px" />
        <el-select v-model="filters.status" placeholder="状态" clearable style="width: 150px">
          <el-option
            v-for="item in statusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-button type="primary" @click="filters.page = 1; loadSnapshots()">查询</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </div>

      <el-table v-loading="loading" :data="snapshots" row-key="id" empty-text="暂无配置快照">
        <el-table-column label="快照" min-width="240">
          <template #default="{ row }">
            <div class="snapshot-name-cell">
              <strong>{{ row.name || row.id }}</strong>
              <span>{{ row.description || row.id }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="资源" min-width="210">
          <template #default="{ row }">
            <div class="resource-cell">
              <strong>{{ resourceLabel(row.resourceType) }}</strong>
              <span>{{ row.resourceId || '—' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="版本 / 备份账号" min-width="190">
          <template #default="{ row }">
            <div class="snapshot-meta-cell">
              <strong>{{ row.version || '—' }}</strong>
              <span>{{ row.backupAccount || '—' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="大小" width="110">
          <template #default="{ row }">{{ formatBytes(row.sizeBytes) }}</template>
        </el-table-column>
        <el-table-column label="动作" width="100">
          <template #default="{ row }">{{ operationLabel(row.operation) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" effect="light">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="版本" min-width="210">
          <template #default="{ row }">
            <div class="revision-cell">
              <span>前 {{ shortHash(row.beforeRevision) }}</span>
              <span>后 {{ shortHash(row.afterRevision) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="制品摘要" width="150">
          <template #default="{ row }">{{ shortHash(row.artifactSha256) }}</template>
        </el-table-column>
        <el-table-column label="创建时间" min-width="170">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column fixed="right" label="操作" width="230">
          <template #default="{ row }">
            <el-button link type="primary" :icon="View" @click="openDetail(row)">详情</el-button>
            <el-button
              link
              type="warning"
              :icon="RefreshLeft"
              :disabled="!canWrite || row.status !== 'succeeded'"
              @click="openRestore(row)"
            >
              回滚
            </el-button>
            <el-button
              link
              type="danger"
              :icon="Delete"
              :loading="deletingId === row.id"
              :disabled="!canWrite || row.status === 'pending' || row.status === 'applying'"
              @click="deleteSnapshot(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-row">
        <el-pagination
          v-model:current-page="filters.page"
          v-model:page-size="filters.pageSize"
          background
          layout="total, sizes, prev, pager, next"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          @size-change="() => { filters.page = 1; loadSnapshots() }"
          @current-change="loadSnapshots"
        />
      </div>
    </section>
    

    <custom-drawer
      :visible="createVisible"
      title="创建配置快照"
      size="760px"
      confirm-text="确认"
      :loading="createLoading"
      :on-close="() => { createVisible = false }"
      :on-confirm="submitCreateSnapshot"
    >
      <el-form class="snapshot-create-form" label-width="108px">
        <el-form-item label="资源类型" required>
          <el-select
            v-model="createForm.resourceType"
            placeholder="请选择资源类型"
            style="width: 100%"
            @change="syncCreateResourceId"
          >
            <el-option
              v-for="item in createResourceOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="资源标识" required>
          <el-select
            v-if="useResourceSelect"
            v-model="createForm.resourceId"
            :placeholder="resourceIdPlaceholder"
            :loading="createResourceLoading"
            filterable
            clearable
            style="width: 100%"
            @visible-change="(visible: boolean) => visible && loadCreateResourceOptions()"
          >
            <el-option
              v-for="item in currentCreateResourceOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            >
              <div class="resource-option">
                <strong>{{ item.label }}</strong>
                <span>{{ item.description }}</span>
              </div>
            </el-option>
          </el-select>
          <el-input v-else v-model="createForm.resourceId" :placeholder="resourceIdPlaceholder" />
          <p class="form-help">{{ resourceIdHelp }}</p>
        </el-form-item>
        <el-form-item label="快照名称">
          <el-input v-model="createForm.name" placeholder="请输入快照名称" maxlength="128" />
        </el-form-item>
        <el-form-item label="版本">
          <el-input v-model="createForm.version" placeholder="请输入版本" maxlength="64" />
        </el-form-item>
        <el-form-item label="备份账号">
          <el-input v-model="createForm.backupAccount" placeholder="请输入备份账号" maxlength="64" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="createForm.description"
            type="textarea"
            :rows="4"
            maxlength="255"
            show-word-limit
            placeholder="请输入描述"
          />
        </el-form-item>
      </el-form>
    </custom-drawer>

    <custom-drawer
      :visible="detailVisible"
      :title="`快照详情 · ${selectedSnapshot?.id || ''}`"
      size="960px"
      cancel-text="关闭"
      :show-confirm="false"
      :on-close="() => { detailVisible = false }"
    >
      <div v-loading="detailLoading" class="snapshot-detail">
        <div class="diff-summary">
          <el-tag type="primary" effect="light">{{ detail?.diff?.summary || '暂无差异摘要' }}</el-tag>
          <span>变更字段 {{ diffCount(detail?.diff) }} 项</span>
        </div>
        <div class="diff-lists">
          <div><strong>新增</strong><span>{{ detail?.diff?.added?.join('，') || '无' }}</span></div>
          <div><strong>修改</strong><span>{{ detail?.diff?.changed?.join('，') || '无' }}</span></div>
          <div><strong>删除</strong><span>{{ detail?.diff?.removed?.join('，') || '无' }}</span></div>
        </div>
        <div class="json-grid">
          <section>
            <h4>变更前</h4>
            <pre>{{ formatJson(detail?.before) }}</pre>
          </section>
          <section>
            <h4>变更后</h4>
            <pre>{{ formatJson(detail?.after) }}</pre>
          </section>
        </div>
      </div>
    </custom-drawer>

    <custom-drawer
      :visible="restoreVisible"
      title="回滚预览"
      size="960px"
      confirm-type="warning"
      :confirm-text="restoreRequiresForce ? '强制覆盖并回滚' : '确认回滚'"
      :loading="restoreLoading"
      :confirm-disabled="!restorePreview || (restoreRequiresForce && !forceRestoreConfirmed)"
      :on-close="() => { restoreVisible = false }"
      :on-confirm="executeRestore"
    >
      <div v-loading="restoreLoading" class="snapshot-detail">
        <el-alert
          v-if="restoreRequiresForce"
          title="检测到配置漂移，执行回滚需要强制覆盖当前配置"
          description="只有明确确认覆盖人工修改后，才会向后端发送 force=true。回滚会创建新的 operation=restore 快照，不会覆盖原历史记录。"
          type="warning"
          show-icon
          :closable="false"
        />
        <div v-if="restoreRequiresForce" class="force-restore-box">
          <el-checkbox v-model="forceRestoreConfirmed">
            我确认用历史快照覆盖当前人工修改
          </el-checkbox>
          <span>确认后将提交 <code>{"force":true}</code></span>
        </div>
        <div class="diff-summary">
          <el-tag :type="restoreRequiresForce ? 'warning' : 'success'" effect="light">
            {{ restorePreview?.diff?.summary || '暂无回滚差异摘要' }}
          </el-tag>
          <span>变更字段 {{ diffCount(restorePreview?.diff) }} 项</span>
        </div>
        <div class="json-grid">
          <section>
            <h4>当前配置</h4>
            <pre>{{ formatJson(restorePreview?.current) }}</pre>
          </section>
          <section>
            <h4>目标配置</h4>
            <pre>{{ formatJson(restorePreview?.target) }}</pre>
          </section>
        </div>
      </div>
    </custom-drawer>
  </div>
</template>

<style scoped lang="less">
.snapshot-page {
  min-height: 100%;
}

.snapshot-toolbar,
.toolbar-actions,
.filter-bar,
.pagination-row,
.diff-summary {
  display: flex;
  align-items: center;
  gap: 12px;
}

.snapshot-toolbar {
  justify-content: space-between;
  margin-bottom: 18px;

  h2 {
    color: var(--text-primary);
    font-size: 22px;
    font-weight: 720;
  }

  p {
    margin-top: 6px;
    color: var(--text-tertiary);
    font-size: 13px;
  }
}

.snapshot-alert {
  margin-bottom: 18px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.summary-card {
  min-height: 92px;
  padding: 16px;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  background: var(--surface-card);
  box-shadow: var(--shadow-xs);
  transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;

  small {
    color: var(--text-tertiary);
    font-size: 12px;
  }

  strong {
    display: block;
    margin-top: 10px;
    color: var(--text-primary);
    font-size: 26px;
    font-weight: 760;
  }

  &.success strong {
    color: rgb(var(--success-color));
  }

  &.warning strong {
    color: var(--el-color-warning);
  }

  &.danger strong {
    color: var(--el-color-danger);
  }

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(var(--primary-color), 0.42);
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
  }
}

.snapshot-panel {
  padding: 18px;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  background: var(--surface-card);
  box-shadow: var(--shadow-xs);
}

.filter-bar {
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.resource-cell,
.revision-cell,
.snapshot-name-cell,
.snapshot-meta-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;

  strong,
  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span {
    color: var(--text-tertiary);
    font-size: 12px;
  }
}

.snapshot-create-form {
  max-width: 640px;
  margin: 0 auto;
  padding: 18px 6px 80px;

  :deep(.el-form-item) {
    margin-bottom: 24px;
    align-items: flex-start;
  }

  :deep(.el-form-item__label) {
    padding-right: 18px;
    color: var(--text-secondary);
    font-size: 15px;
    font-weight: 680;
    line-height: 44px;
  }

  :deep(.el-input__wrapper),
  :deep(.el-select .el-input__wrapper) {
    min-height: 44px;
    border-radius: 12px;
  }

  :deep(.el-textarea__inner) {
    min-height: 128px;
    border-radius: 12px;
  }

  .form-help {
    width: 100%;
    margin: 6px 0 0;
    color: var(--text-tertiary);
    font-size: 12px;
    line-height: 1.5;
  }
}

.resource-option {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  min-height: 42px;
  line-height: 1.35;

  strong,
  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    color: var(--text-primary);
    font-size: 13px;
    font-weight: 650;
  }

  span {
    color: var(--text-tertiary);
    font-size: 12px;
  }
}

.pagination-row {
  justify-content: flex-end;
  margin-top: 16px;
}

.resource-guide-panel,
.integration-checklist-panel {
  margin-top: 18px;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  background: var(--surface-card);
  box-shadow: var(--shadow-xs);
  overflow: hidden;

  :deep(.el-collapse) {
    border: 0;
  }

  :deep(.el-collapse-item__header) {
    height: auto;
    padding: 16px 18px;
    border-bottom-color: var(--border-subtle);
    background: var(--surface-card);
  }

  :deep(.el-collapse-item__wrap) {
    border-bottom: 0;
  }

  :deep(.el-collapse-item__content) {
    padding: 18px;
  }
}

.guide-title {
  display: flex;
  flex-direction: column;
  gap: 4px;
  line-height: 1.35;

  strong {
    color: var(--text-primary);
    font-size: 16px;
    font-weight: 720;
  }

  span {
    color: var(--text-tertiary);
    font-size: 12px;
  }
}

.guide-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.guide-card {
  min-width: 0;
  padding: 14px;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  background: var(--surface-subtle);

  header {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;

    div {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  h3,
  p {
    margin: 0;
  }

  h3 {
    color: var(--text-primary);
    font-size: 16px;
    font-weight: 720;
  }

  p {
    color: var(--text-tertiary);
    font-size: 13px;
    line-height: 1.55;
  }

  code {
    padding: 2px 6px;
    border: 1px solid var(--border-subtle);
    border-radius: 6px;
    background: var(--surface-card);
    color: var(--text-secondary);
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
    font-size: 12px;
  }
}

.guide-note {
  margin-top: 10px !important;
}

.integration-checklist {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    display: grid;
    grid-template-columns: 10px 18px minmax(0, 1fr);
    align-items: start;
    gap: 12px;
    color: var(--text-secondary);
    font-size: 15px;
    line-height: 1.8;
  }

  code {
    display: inline-flex;
    align-items: center;
    max-width: 100%;
    margin: 0 4px;
    padding: 2px 8px;
    border: 1px solid var(--border-subtle);
    border-radius: 7px;
    background: var(--surface-subtle);
    color: var(--text-secondary);
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
    font-size: 0.92em;
    line-height: 1.45;
    overflow-wrap: anywhere;
    vertical-align: middle;
  }
}

.check-dot {
  width: 6px;
  height: 6px;
  margin-top: 13px;
  border-radius: 999px;
  background: var(--border-strong);
  opacity: 0.55;
}

.check-box {
  width: 18px;
  height: 18px;
  margin-top: 7px;
  border: 1px solid var(--border-strong);
  border-radius: 6px;
  background: var(--surface-card);
  box-shadow: inset 0 0 0 2px var(--surface-card);
}

.check-text {
  min-width: 0;
}

.snapshot-detail {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.diff-summary {
  justify-content: space-between;
  padding: 12px;
  border-radius: 10px;
  background: var(--surface-subtle);
  color: var(--text-tertiary);
}

.force-restore-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--el-color-warning-light-5);
  border-radius: 10px;
  background: var(--el-color-warning-light-9);

  span {
    color: var(--text-tertiary);
    font-size: 12px;
  }

  code {
    padding: 2px 6px;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.75);
    color: var(--el-color-warning-dark-2);
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
  }
}

.diff-lists {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;

  div {
    min-width: 0;
    padding: 12px;
    border: 1px solid var(--border-subtle);
    border-radius: 10px;
    background: var(--surface-card);
  }

  strong,
  span {
    display: block;
  }

  span {
    margin-top: 8px;
    color: var(--text-tertiary);
    word-break: break-all;
  }
}

.json-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  section {
    min-width: 0;
    border: 1px solid var(--border-subtle);
    border-radius: 10px;
    overflow: hidden;
  }

  h4 {
    margin: 0;
    padding: 10px 12px;
    background: var(--surface-subtle);
    color: var(--text-primary);
  }

  pre {
    min-height: 320px;
    max-height: 520px;
    margin: 0;
    padding: 12px;
    overflow: auto;
    background: #0b1220;
    color: #e5edf6;
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
    font-size: 12px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-word;
  }
}

@media (max-width: 980px) {
  .snapshot-toolbar,
  .diff-summary,
  .force-restore-box {
    align-items: flex-start;
    flex-direction: column;
  }

  .summary-grid,
  .guide-grid,
  .diff-lists,
  .json-grid {
    grid-template-columns: 1fr;
  }
}
</style>
