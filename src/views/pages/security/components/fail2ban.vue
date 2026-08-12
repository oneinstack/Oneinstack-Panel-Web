<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { DocumentAdd, Lock, Plus, Refresh, Warning } from '@element-plus/icons-vue'

import { Api } from '@/api/modules'
import i18n from '@/lang'
import CustomTable, { type ColumnItem } from '@/components/custom-table.vue'
import { submitOperation, isOperationCancelled } from '@/utils/operationPreview'
import { useSoftwareTaskStore } from '@/stores/modules/softwareTask'
import InstallTaskDrawer from '../../software/components/InstallTaskDrawer.vue'
import System from '@/utils/System'

type EnforcementMode = 'observe' | 'autoBan'
type TaskStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'interrupted'
type PolicyTemplate = 'sshd' | 'panel-login' | 'nginx-http-auth' | 'nginx-botsearch'

interface Fail2banCapabilities {
  showSecurityMenu: boolean
  showFail2banTab: boolean
  canChangePolicy: boolean
  canBan: boolean
  canUnban: boolean
  canInstall: boolean
  canReadAuditEvidence: boolean
}

interface Fail2banTemplate {
  key: PolicyTemplate
  name: string
  description: string
  defaultMaxRetry: number
  defaultFindTimeSeconds: number
  defaultBanTimeSeconds: number
  protectedPorts: string
  supportsDetection: boolean
}

interface Fail2banPolicy {
  id: string
  template: PolicyTemplate
  name: string
  enabled: boolean
  enforcementMode: EnforcementMode
  maxRetry: number
  findTimeSeconds: number
  banTimeSeconds: number
  ignoreIps: string[]
  effectiveIgnoreIps: string[]
  jailName: string
  detectorJail?: string
  revision: string
  actualEnabled: boolean
  drifted: boolean
  createdBy: number
  updatedBy: number
  lastAppliedAt?: string
  lastApplyError?: string
  createdAt: string
  updatedAt: string
}

interface SecurityIncident {
  id: string
  policyId: string
  source: PolicyTemplate
  remoteIp: string
  attempts: number
  severity: 'medium' | 'high' | 'critical'
  status: 'open' | 'blocked' | 'dismissed'
  evidence?: number[]
  auditEvidence?: Array<{
    id: number
    sequence: number
    action: string
    outcome: string
    remoteIp: string
    message: string
    createdAt: string
  }>
  taskId?: string
  firstSeenAt: string
  lastSeenAt: string
  resolvedAt?: string
  resolvedBy?: number
  createdAt: string
  updatedAt: string
}

interface ActiveBan {
  policyId: string
  policy: string
  jail: string
  ip: string
  managed: true
  banTimeSeconds: number
}

interface Fail2banTask {
  id: string
  operation: 'apply_policy' | 'delete_policy' | 'ban_ip' | 'unban_ip'
  policyId?: string
  incidentId?: string
  targetIp?: string
  status: TaskStatus
  phase: string
  progress: number
  message: string
  errorCode?: string
  errorMessage?: string
  requestedBy: number
  triggeredBy: 'user' | 'system'
  eventSeq: number
  startedAt?: string
  finishedAt?: string
  createdAt: string
  updatedAt: string
}

interface Fail2banStatus {
  installed: boolean
  serviceActive: boolean
  version?: string
  jails: string[]
  managedPolicies: number
  activeBans: number
  migration?: {
    auditSequence?: number
    eventFileOffset?: number
    migrationStatus?: 'pending' | 'completed' | 'not_required'
    migrationError?: string
    migratedAt?: string
    updatedAt?: string
  }
  warning?: string
}

interface Fail2banTaskEvent {
  taskId: string
  seq: number
  type: string
  level: string
  status: TaskStatus | ''
  phase: string
  progress: number
  code?: string
  message: string
  createdAt: string
}

const props = defineProps<{
  capabilities: Fail2banCapabilities
}>()

const softwareTaskStore = useSoftwareTaskStore()

const t = (key: string, fallback?: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params)
  return value && value !== key ? value : fallback || key
}

const requestLanguage = computed(() =>
  String(i18n.locale || 'zh-CN').toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US'
)

const loading = reactive({
  status: false,
  templates: false,
  policies: false,
  incidents: false,
  bans: false,
  tasks: false,
  install: false,
  policySubmit: false,
  manualBanSubmit: false
})

const status = ref<Fail2banStatus>({
  installed: false,
  serviceActive: false,
  version: '',
  jails: [],
  managedPolicies: 0,
  activeBans: 0,
  migration: {},
  warning: ''
})
const templates = ref<Fail2banTemplate[]>([])
const policies = ref<Fail2banPolicy[]>([])
const incidents = ref<SecurityIncident[]>([])
const bans = ref<ActiveBan[]>([])
const tasks = ref<Fail2banTask[]>([])
const incidentTotal = ref(0)
const taskTotal = ref(0)

const incidentFilters = reactive({
  page: 1,
  pageSize: 10,
  status: '',
  remoteIp: ''
})
const taskPagination = reactive({
  page: 1,
  pageSize: 20
})

const policyDialogVisible = ref(false)
const policyDialogMode = ref<'create' | 'edit'>('create')
const policyForm = reactive({
  id: '',
  baseRevision: '',
  template: 'panel-login' as PolicyTemplate,
  name: '',
  enabled: false,
  enforcementMode: 'observe' as EnforcementMode,
  maxRetry: 8,
  findTimeSeconds: 600,
  banTimeSeconds: 86400,
  ignoreIpsText: ''
})

const manualBanVisible = ref(false)
const manualBanForm = reactive({
  policyId: '',
  ip: '',
  reason: ''
})

const installTaskVisible = ref(false)
const installTaskId = ref('')
const taskSources = new Map<string, EventSource>()
const taskLastEventIds = reactive<Record<string, number>>({})
const terminalStatuses = new Set<TaskStatus>(['succeeded', 'failed', 'interrupted'])
const softwareTaskStatuses = new Map<string, string>()

const activeInstallTask = computed(() => softwareTaskStore.activeForKey('fail2ban'))
const canOperate = computed(() => status.value.installed && status.value.serviceActive)

const formatDateTime = (value?: string) => {
  if (!value) return '—'
  const time = new Date(value)
  if (Number.isNaN(time.getTime())) return value
  return new Intl.DateTimeFormat(String(i18n.locale || 'zh-CN').startsWith('zh') ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(time)
}

const secondsToText = (value: number) => {
  if (!value) return '0s'
  if (value < 60) return `${value}s`
  if (value < 3600) return `${Math.floor(value / 60)}m`
  if (value < 86400) return `${Math.floor(value / 3600)}h`
  return `${Math.floor(value / 86400)}d`
}

const getErrorCode = (error: unknown) =>
  typeof error === 'object' && error !== null && 'code' in error
    ? Number((error as any).code)
    : undefined

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'string') return error
  return fallback
}

const statusCards = computed(() => [
  { label: t('security.fail2ban.status.version', '版本'), value: status.value.version || '—' },
  { label: t('security.fail2ban.status.managedPolicies', '受管策略'), value: String(status.value.managedPolicies || 0) },
  { label: t('security.fail2ban.status.activeBans', '当前封禁'), value: String(status.value.activeBans || 0) },
  { label: t('security.fail2ban.status.migration', '迁移状态'), value: status.value.migration?.migrationStatus || '—' }
])

const policyColumns = computed<ColumnItem<Fail2banPolicy>[]>(() => [
  { prop: 'name', label: t('security.fail2ban.policy.name', '策略名称'), minWidth: 180, showOverflowTooltip: true },
  { prop: 'template', label: t('security.fail2ban.policy.template', '模板'), minWidth: 140 },
  { prop: 'enforcementMode', label: t('security.fail2ban.policy.mode', '模式'), width: 110, slot: 'mode' },
  { prop: 'enabled', label: t('security.fail2ban.policy.expected', '期望启用'), width: 100, slot: 'enabled' },
  { prop: 'actualEnabled', label: t('security.fail2ban.policy.actual', '实际启用'), width: 100, slot: 'actualEnabled' },
  { prop: 'drifted', label: t('security.fail2ban.policy.drifted', '漂移'), width: 100, slot: 'drifted' },
  { prop: 'updatedAt', label: t('common.time', '时间'), minWidth: 170, slot: 'updatedAt' },
  { prop: 'actionColumn', label: t('common.action', '操作'), width: 200, fixed: 'right', slot: 'actionColumn' }
])

const incidentColumns = computed<ColumnItem<SecurityIncident>[]>(() => [
  { prop: 'remoteIp', label: t('security.fail2ban.incident.remoteIp', '来源 IP'), minWidth: 145 },
  { prop: 'source', label: t('security.fail2ban.incident.source', '来源模板'), minWidth: 130 },
  { prop: 'attempts', label: t('security.fail2ban.incident.attempts', '尝试次数'), width: 92 },
  { prop: 'severity', label: t('security.fail2ban.incident.severity', '严重级别'), width: 100, slot: 'severity' },
  { prop: 'status', label: t('security.fail2ban.incident.status', '状态'), width: 100, slot: 'status' },
  { prop: 'lastSeenAt', label: t('security.fail2ban.incident.lastSeenAt', '发现时间'), minWidth: 170, slot: 'lastSeenAt' },
  { prop: 'actionColumn', label: t('common.action', '操作'), width: 220, fixed: 'right', slot: 'actionColumn' }
])

const banColumns = computed<ColumnItem<ActiveBan>[]>(() => [
  { prop: 'ip', label: t('security.fail2ban.ban.ip', 'IP 地址'), minWidth: 145 },
  { prop: 'policy', label: t('security.fail2ban.ban.policy', '策略'), minWidth: 180 },
  { prop: 'jail', label: t('security.fail2ban.ban.jail', 'Jail'), minWidth: 180 },
  { prop: 'banTimeSeconds', label: t('security.fail2ban.ban.duration', '封禁时长'), minWidth: 120, slot: 'banTimeSeconds' },
  { prop: 'actionColumn', label: t('common.action', '操作'), width: 120, fixed: 'right', slot: 'actionColumn' }
])

const taskColumns = computed<ColumnItem<Fail2banTask>[]>(() => [
  { prop: 'createdAt', label: t('common.time', '时间'), minWidth: 170, slot: 'createdAt' },
  { prop: 'operation', label: t('security.fail2ban.task.operation', '操作'), minWidth: 120, slot: 'operation' },
  { prop: 'status', label: t('security.fail2ban.task.status', '状态'), width: 100, slot: 'status' },
  { prop: 'phase', label: t('security.fail2ban.task.phase', '阶段'), minWidth: 120 },
  { prop: 'progress', label: t('security.fail2ban.task.progress', '进度'), minWidth: 140, slot: 'progress' },
  { prop: 'message', label: t('security.fail2ban.task.message', '消息'), minWidth: 220, showOverflowTooltip: true }
])

const fail2banTaskURL = (path: string) => {
  const apiBase = new URL(System.env.API || '/v1', window.location.origin)
  const prefix = apiBase.pathname.replace(/\/$/, '')
  return new URL(`${prefix}/security/fail2ban/tasks/${path.replace(/^\//, '')}`, apiBase.origin).toString()
}

const applyTemplateDefaults = (templateKey: PolicyTemplate) => {
  const current = templates.value.find(item => item.key === templateKey)
  if (!current || policyDialogMode.value !== 'create') return
  policyForm.name = current.name
  policyForm.maxRetry = current.defaultMaxRetry
  policyForm.findTimeSeconds = current.defaultFindTimeSeconds
  policyForm.banTimeSeconds = current.defaultBanTimeSeconds
}

const resetPolicyForm = () => {
  policyForm.id = ''
  policyForm.baseRevision = ''
  policyForm.template = templates.value[0]?.key || 'panel-login'
  policyForm.name = templates.value[0]?.name || ''
  policyForm.enabled = false
  policyForm.enforcementMode = 'observe'
  policyForm.maxRetry = templates.value[0]?.defaultMaxRetry || 8
  policyForm.findTimeSeconds = templates.value[0]?.defaultFindTimeSeconds || 600
  policyForm.banTimeSeconds = templates.value[0]?.defaultBanTimeSeconds || 86400
  policyForm.ignoreIpsText = ''
}

const mergeTask = (task: Fail2banTask) => {
  const index = tasks.value.findIndex(item => item.id === task.id)
  if (index >= 0) {
    tasks.value[index] = { ...tasks.value[index], ...task }
    return
  }
  tasks.value.unshift(task)
}

const closeTaskSource = (taskId: string) => {
  const source = taskSources.get(taskId)
  if (!source) return
  source.close()
  taskSources.delete(taskId)
}

const loadStatus = async () => {
  loading.status = true
  try {
    const response = await Api.getFail2banStatus(requestLanguage.value)
    status.value = (response?.data || response || status.value) as Fail2banStatus
  } finally {
    loading.status = false
  }
}

const loadTemplates = async () => {
  loading.templates = true
  try {
    const response = await Api.getFail2banTemplates(requestLanguage.value)
    templates.value = (response?.data || response || []) as Fail2banTemplate[]
    if (templates.value.length) applyTemplateDefaults(templates.value[0].key)
  } finally {
    loading.templates = false
  }
}

const loadPolicies = async () => {
  loading.policies = true
  try {
    const response = await Api.getFail2banPolicies(requestLanguage.value)
    policies.value = (response?.data || response || []) as Fail2banPolicy[]
  } finally {
    loading.policies = false
  }
}

const loadIncidents = async () => {
  loading.incidents = true
  try {
    const response = await Api.getFail2banIncidents({
      page: incidentFilters.page,
      pageSize: incidentFilters.pageSize,
      status: incidentFilters.status || undefined,
      remoteIp: incidentFilters.remoteIp || undefined
    }, requestLanguage.value)
    incidents.value = (response?.data?.data || []) as SecurityIncident[]
    incidentTotal.value = response?.data?.total || incidents.value.length
  } finally {
    loading.incidents = false
  }
}

const loadBans = async () => {
  loading.bans = true
  try {
    const response = await Api.getFail2banBans(requestLanguage.value)
    bans.value = (response?.data || response || []) as ActiveBan[]
  } finally {
    loading.bans = false
  }
}

const refreshAfterTask = async () => {
  await Promise.allSettled([loadStatus(), loadPolicies(), loadIncidents(), loadBans(), loadTasks()])
}

const connectTaskStream = (taskId: string, streamUrl?: string) => {
  if (taskSources.has(taskId)) return
  const url = new URL(
    streamUrl
      ? new URL(streamUrl, window.location.origin).toString()
      : fail2banTaskURL(`${encodeURIComponent(taskId)}/events`),
    window.location.origin
  )
  const after = taskLastEventIds[taskId] || 0
  if (after > 0) url.searchParams.set('after', String(after))
  const source = new EventSource(url.toString(), { withCredentials: true })
  taskSources.set(taskId, source)

  source.onmessage = async (event) => {
    try {
      const payload = JSON.parse(event.data || '{}')
      taskLastEventIds[taskId] = Number(event.lastEventId || payload.seq || 0)
      mergeTask({
        id: payload.taskId || taskId,
        operation: payload.operation || 'apply_policy',
        policyId: payload.policyId,
        incidentId: payload.incidentId,
        targetIp: payload.targetIp,
        status: payload.status || 'running',
        phase: payload.phase || '',
        progress: Number(payload.progress || 0),
        message: payload.message || '',
        errorCode: payload.errorCode,
        errorMessage: payload.errorMessage,
        requestedBy: payload.requestedBy || 0,
        triggeredBy: payload.triggeredBy || 'user',
        eventSeq: payload.seq || 0,
        startedAt: payload.startedAt,
        finishedAt: payload.finishedAt,
        createdAt: payload.createdAt || new Date().toISOString(),
        updatedAt: payload.updatedAt || new Date().toISOString()
      })
      if (terminalStatuses.has(payload.status)) {
        closeTaskSource(taskId)
        await refreshAfterTask()
      }
    } catch {
      // ignore malformed events
    }
  }

  source.onerror = async () => {
    closeTaskSource(taskId)
    try {
      const response = await Api.getFail2banTaskEvents(
        taskId,
        { after: taskLastEventIds[taskId] || 0 },
        requestLanguage.value
      )
      const events = (response?.data || response || []) as Fail2banTaskEvent[]
      events.forEach((event) => {
        taskLastEventIds[taskId] = Math.max(taskLastEventIds[taskId] || 0, Number(event.seq || 0))
      })
    } catch {
      // ignore recovery errors
    }
    window.setTimeout(() => {
      connectTaskStream(taskId, streamUrl)
    }, 2000)
  }
}

const loadTasks = async () => {
  loading.tasks = true
  try {
    const response = await Api.getFail2banTasks({ page: taskPagination.page, pageSize: taskPagination.pageSize }, requestLanguage.value)
    tasks.value = (response?.data?.data || []) as Fail2banTask[]
    taskTotal.value = response?.data?.total || tasks.value.length

    const activeResponse = await Api.getFail2banTasks({ active: true, page: 1, pageSize: 100 }, requestLanguage.value)
    const activeTasks = (activeResponse?.data?.data || []) as Fail2banTask[]
    activeTasks.forEach(task => {
      mergeTask(task)
      connectTaskStream(task.id)
    })
  } finally {
    loading.tasks = false
  }
}

const loadAll = async () => {
  await Promise.all([loadStatus(), loadTemplates(), loadPolicies(), loadIncidents(), loadBans(), loadTasks()])
}

const submitTaskOperation = async (operation: string, payload: unknown) => {
  const response: any = await submitOperation(operation, payload)
  const result = response?.data || response
  if (result?.taskId) {
    await loadTasks()
    connectTaskStream(result.taskId, result.streamUrl)
  }
  return result
}

const openCreatePolicy = (templateKey?: PolicyTemplate) => {
  policyDialogMode.value = 'create'
  resetPolicyForm()
  if (templateKey) {
    policyForm.template = templateKey
    applyTemplateDefaults(templateKey)
  }
  policyDialogVisible.value = true
}

const openEditPolicy = (row: Fail2banPolicy) => {
  policyDialogMode.value = 'edit'
  policyForm.id = row.id
  policyForm.baseRevision = row.revision
  policyForm.template = row.template
  policyForm.name = row.name
  policyForm.enabled = row.enabled
  policyForm.enforcementMode = row.enforcementMode
  policyForm.maxRetry = row.maxRetry
  policyForm.findTimeSeconds = row.findTimeSeconds
  policyForm.banTimeSeconds = row.banTimeSeconds
  policyForm.ignoreIpsText = row.ignoreIps.join('\n')
  policyDialogVisible.value = true
}

const submitPolicy = async () => {
  loading.policySubmit = true
  try {
    await submitTaskOperation('fail2ban.policy_change', {
      action: policyDialogMode.value,
      policy: {
        ...(policyDialogMode.value === 'edit'
          ? { id: policyForm.id, baseRevision: policyForm.baseRevision }
          : {}),
        template: policyForm.template,
        name: policyForm.name,
        enabled: policyForm.enabled,
        enforcementMode: policyForm.enforcementMode,
        maxRetry: policyForm.maxRetry,
        findTimeSeconds: policyForm.findTimeSeconds,
        banTimeSeconds: policyForm.banTimeSeconds,
        ignoreIps: policyForm.ignoreIpsText.split(/\n|,/).map(item => item.trim()).filter(Boolean)
      }
    })
    ElMessage.success(
      policyDialogMode.value === 'create'
        ? t('security.fail2ban.policy.createQueued', '策略创建任务已进入队列')
        : t('security.fail2ban.policy.updateQueued', '策略更新任务已进入队列')
    )
    policyDialogVisible.value = false
  } catch (error) {
    if (!isOperationCancelled(error)) {
      if ([1002, 2006].includes(getErrorCode(error) || 0)) await loadPolicies()
      ElMessage.error(getErrorMessage(error, t('common.operationFailed', '操作失败')))
    }
  } finally {
    loading.policySubmit = false
  }
}

const deletePolicy = async (row: Fail2banPolicy) => {
  try {
    await ElMessageBox.confirm(
      t('security.fail2ban.policy.deleteConfirm', '确定删除这条策略吗？'),
      t('security.fail2ban.policy.deleteTitle', '删除策略'),
      { type: 'warning' }
    )
    await submitTaskOperation('fail2ban.policy_change', {
      action: 'delete',
      policy: { id: row.id, baseRevision: row.revision }
    })
    ElMessage.success(t('security.fail2ban.policy.deleteQueued', '策略删除任务已进入队列'))
  } catch (error) {
    if (!isOperationCancelled(error) && error !== 'cancel' && error !== 'close') {
      ElMessage.error(getErrorMessage(error, t('common.operationFailed', '操作失败')))
    }
  }
}

const dismissIncident = async (row: SecurityIncident) => {
  try {
    await Api.dismissFail2banIncident(row.id, requestLanguage.value)
    ElMessage.success(t('security.fail2ban.incident.dismissed', '异常事件已标记为误报'))
    await loadIncidents()
  } catch (error) {
    ElMessage.error(getErrorMessage(error, t('common.operationFailed', '操作失败')))
  }
}

const banIncident = async (row: SecurityIncident) => {
  try {
    const { value } = await ElMessageBox.prompt(
      t('security.fail2ban.ban.reasonPrompt', '请输入封禁原因'),
      t('security.fail2ban.ban.reasonTitle', '封禁 IP'),
      {
        inputPlaceholder: t('security.fail2ban.ban.reasonPlaceholder', '说明为什么确认该来源需要封禁'),
        inputValidator: value => Boolean(value) || t('security.fail2ban.ban.reasonRequired', '请输入原因')
      }
    )
    await submitTaskOperation('fail2ban.ban', {
      incidentId: row.id,
      policyId: row.policyId,
      reason: value
    })
    ElMessage.success(t('security.fail2ban.ban.queued', '封禁任务已进入队列'))
  } catch (error) {
    if (!isOperationCancelled(error) && error !== 'cancel' && error !== 'close') {
      ElMessage.error(getErrorMessage(error, t('common.operationFailed', '操作失败')))
    }
  }
}

const openManualBan = () => {
  manualBanForm.policyId = policies.value[0]?.id || ''
  manualBanForm.ip = ''
  manualBanForm.reason = ''
  manualBanVisible.value = true
}

const submitManualBan = async () => {
  loading.manualBanSubmit = true
  try {
    await submitTaskOperation('fail2ban.ban', {
      policyId: manualBanForm.policyId,
      ip: manualBanForm.ip.trim(),
      reason: manualBanForm.reason.trim()
    })
    ElMessage.success(t('security.fail2ban.ban.queued', '封禁任务已进入队列'))
    manualBanVisible.value = false
  } catch (error) {
    if (!isOperationCancelled(error)) {
      ElMessage.error(getErrorMessage(error, t('common.operationFailed', '操作失败')))
    }
  } finally {
    loading.manualBanSubmit = false
  }
}

const unban = async (row: ActiveBan) => {
  try {
    const { value } = await ElMessageBox.prompt(
      t('security.fail2ban.ban.unbanReasonPrompt', '请输入解除封禁原因'),
      t('security.fail2ban.ban.unbanTitle', '解除封禁'),
      {
        inputPlaceholder: t('security.fail2ban.ban.unbanReasonPlaceholder', '说明为什么解除该封禁'),
        inputValidator: value => Boolean(value) || t('security.fail2ban.ban.reasonRequired', '请输入原因')
      }
    )
    await submitTaskOperation('fail2ban.unban', {
      policyId: row.policyId,
      ip: row.ip,
      reason: value
    })
    ElMessage.success(t('security.fail2ban.ban.unbanQueued', '解封任务已进入队列'))
  } catch (error) {
    if (!isOperationCancelled(error) && error !== 'cancel' && error !== 'close') {
      ElMessage.error(getErrorMessage(error, t('common.operationFailed', '操作失败')))
    }
  }
}

const installFail2ban = async () => {
  loading.install = true
  try {
    const response: any = await Api.installSoft({ key: 'fail2ban', version: 'system' })
    const data = response?.data || response
    if (data?.taskId) {
      softwareTaskStore.acceptCreated(data, { key: 'fail2ban', version: 'system' })
      installTaskId.value = data.taskId
      installTaskVisible.value = true
      ElMessage.success(t('security.fail2ban.install.taskCreated', '安装任务已创建'))
    }
  } catch (error) {
    ElMessage.error(getErrorMessage(error, t('security.fail2ban.install.failed', '创建安装任务失败')))
  } finally {
    loading.install = false
  }
}

const openInstallTask = () => {
  installTaskId.value = activeInstallTask.value?.id || installTaskId.value
  if (!installTaskId.value) return
  installTaskVisible.value = true
}

const openAudit = (row: SecurityIncident) => {
  System.router.push({
    path: '/log',
    query: {
      remoteIp: row.remoteIp,
      startAt: row.firstSeenAt,
      endAt: row.lastSeenAt
    }
  })
}

watch(() => policyForm.template, (value) => {
  if (policyDialogMode.value === 'create') applyTemplateDefaults(value)
})

watch(
  () => Object.values(softwareTaskStore.tasks)
    .filter(item => item.softwareKey === 'fail2ban')
    .map(item => `${item.id}:${item.status}`)
    .sort()
    .join('|'),
  () => {
    Object.values(softwareTaskStore.tasks)
      .filter(item => item.softwareKey === 'fail2ban')
      .forEach(task => {
        const previous = softwareTaskStatuses.get(task.id)
        softwareTaskStatuses.set(task.id, task.status)
        if (!previous || previous === task.status) return
        if (softwareTaskStore.isTerminal(task.status)) {
          void loadStatus()
        }
      })
  }
)

onMounted(() => {
  void softwareTaskStore.loadActive().catch(() => undefined)
  void loadAll().catch((error) => {
    ElMessage.error(getErrorMessage(error, t('security.fail2ban.loadFailed', '入侵防御数据加载失败')))
  })
})

onBeforeUnmount(() => {
  Array.from(taskSources.keys()).forEach(closeTaskSource)
})
</script>

<template>
  <div class="fail2ban-page">
    <section class="hero-card">
      <div class="hero-card__main">
        <div class="hero-card__title">
          <el-icon><Lock /></el-icon>
          <div>
            <h2>{{ $t('security.fail2ban.title') }}</h2>
            <p>{{ $t('security.fail2ban.description') }}</p>
          </div>
        </div>
        <div class="hero-card__chips">
          <el-tag :type="status.installed ? 'success' : 'info'" effect="light">
            {{ status.installed ? $t('security.fail2ban.status.installed') : $t('security.fail2ban.status.notInstalled') }}
          </el-tag>
          <el-tag :type="status.serviceActive ? 'success' : 'warning'" effect="light">
            {{ status.serviceActive ? $t('security.fail2ban.status.serviceActive') : $t('security.fail2ban.status.serviceInactive') }}
          </el-tag>
          <el-tag v-if="status.warning" type="warning" effect="light">{{ status.warning }}</el-tag>
        </div>
      </div>
      <div class="hero-card__actions">
        <el-button :icon="Refresh" @click="loadAll">{{ $t('common.refresh', '刷新') }}</el-button>
        <el-button
          v-if="status.installed && activeInstallTask"
          type="primary"
          @click="openInstallTask"
        >
          {{ $t('security.fail2ban.install.viewTask', '查看安装任务') }}
        </el-button>
        <el-button
          v-else-if="!status.installed && props.capabilities.canInstall"
          type="primary"
          :loading="loading.install"
          @click="installFail2ban"
        >
          {{ $t('security.fail2ban.install.action', '安装 Fail2ban') }}
        </el-button>
      </div>
    </section>

    <el-alert
      v-if="!status.installed"
      type="info"
      :closable="false"
      class="page-alert"
    >
      <template #title>{{ $t('security.fail2ban.install.title') }}</template>
      {{ $t('security.fail2ban.install.description') }}
    </el-alert>

    <el-alert
      v-else-if="!status.serviceActive"
      type="warning"
      :closable="false"
      class="page-alert"
    >
      <template #title>{{ $t('security.fail2ban.status.serviceInactive') }}</template>
      {{ $t('security.fail2ban.status.serviceInactiveDescription') }}
    </el-alert>

    <section class="status-grid" v-loading="loading.status">
      <article v-for="item in statusCards" :key="item.label" class="status-card">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
      </article>
    </section>

    <section class="panel-section" v-loading="loading.templates">
      <div class="section-head">
        <div>
          <h3>{{ $t('security.fail2ban.templates.title') }}</h3>
          <p>{{ $t('security.fail2ban.templates.description') }}</p>
        </div>
      </div>
      <div class="template-grid">
        <article v-for="item in templates" :key="item.key" class="template-card">
          <div class="template-card__head">
            <strong>{{ item.name }}</strong>
            <el-tag size="small" effect="plain">{{ item.key }}</el-tag>
          </div>
          <p>{{ item.description }}</p>
          <dl>
            <div>
              <dt>{{ $t('security.fail2ban.policy.maxRetry') }}</dt>
              <dd>{{ item.defaultMaxRetry }}</dd>
            </div>
            <div>
              <dt>{{ $t('security.fail2ban.policy.findTimeSeconds') }}</dt>
              <dd>{{ item.defaultFindTimeSeconds }}</dd>
            </div>
            <div>
              <dt>{{ $t('security.fail2ban.policy.banTimeSeconds') }}</dt>
              <dd>{{ item.defaultBanTimeSeconds }}</dd>
            </div>
            <div>
              <dt>{{ $t('security.fail2ban.templates.protectedPorts') }}</dt>
              <dd>{{ item.protectedPorts || '—' }}</dd>
            </div>
          </dl>
          <el-button
            v-if="props.capabilities.canChangePolicy && canOperate"
            type="primary"
            plain
            :icon="DocumentAdd"
            @click="openCreatePolicy(item.key)"
          >
            {{ $t('security.fail2ban.policy.createFromTemplate', '从模板创建') }}
          </el-button>
        </article>
      </div>
    </section>

    <section class="panel-section">
      <div class="section-head">
        <div>
          <h3>{{ $t('security.fail2ban.policy.title') }}</h3>
          <p>{{ $t('security.fail2ban.policy.description') }}</p>
        </div>
        <el-button
          v-if="props.capabilities.canChangePolicy"
          type="primary"
          :icon="Plus"
          @click="openCreatePolicy()"
        >
          {{ $t('security.fail2ban.policy.create') }}
        </el-button>
      </div>

      <custom-table
        :loading="loading.policies"
        :columns="policyColumns"
        :data="policies"
        :pagination="false"
        :empty-text="$t('security.fail2ban.policy.empty')"
      >
        <template #mode="{ row }">
          <el-tag :type="row.enforcementMode === 'autoBan' ? 'danger' : 'info'" effect="light">
            {{ row.enforcementMode === 'autoBan' ? $t('security.fail2ban.policy.modeAutoBan') : $t('security.fail2ban.policy.modeObserve') }}
          </el-tag>
        </template>
        <template #enabled="{ row }">
          <el-tag :type="row.enabled ? 'success' : 'info'" effect="light">
            {{ row.enabled ? $t('common.enabled', '已启用') : $t('common.disabled', '已停用') }}
          </el-tag>
        </template>
        <template #actualEnabled="{ row }">
          <el-tag :type="row.actualEnabled ? 'success' : 'warning'" effect="light">
            {{ row.actualEnabled ? $t('common.enabled', '已启用') : $t('common.disabled', '已停用') }}
          </el-tag>
        </template>
        <template #drifted="{ row }">
          <el-tag :type="row.drifted ? 'warning' : 'success'" effect="light">
            {{ row.drifted ? $t('security.fail2ban.policy.driftedYes') : $t('security.fail2ban.policy.driftedNo') }}
          </el-tag>
        </template>
        <template #updatedAt="{ row }">
          {{ formatDateTime(row.updatedAt) }}
        </template>
        <template #actionColumn="{ row }">
          <div class="table-actions">
            <el-button link type="primary" :disabled="!props.capabilities.canChangePolicy || !canOperate" @click="openEditPolicy(row)">
              {{ $t('common.edit', '编辑') }}
            </el-button>
            <el-button link type="danger" :disabled="!props.capabilities.canChangePolicy || !canOperate" @click="deletePolicy(row)">
              {{ $t('common.delete', '删除') }}
            </el-button>
          </div>
        </template>
      </custom-table>
    </section>

    <section class="panel-section">
      <div class="section-head">
        <div>
          <h3>{{ $t('security.fail2ban.incident.title') }}</h3>
          <p>{{ $t('security.fail2ban.incident.description') }}</p>
        </div>
        <div class="section-filters">
          <el-select v-model="incidentFilters.status" clearable style="width: 140px" @change="incidentFilters.page = 1; loadIncidents()">
            <el-option :label="$t('security.fail2ban.incident.statusOpen')" value="open" />
            <el-option :label="$t('security.fail2ban.incident.statusBlocked')" value="blocked" />
            <el-option :label="$t('security.fail2ban.incident.statusDismissed')" value="dismissed" />
          </el-select>
          <el-input
            v-model="incidentFilters.remoteIp"
            clearable
            style="width: 180px"
            :placeholder="$t('security.fail2ban.incident.remoteIpPlaceholder')"
            @keyup.enter="incidentFilters.page = 1; loadIncidents()"
            @clear="incidentFilters.page = 1; loadIncidents()"
          />
          <el-button :icon="Refresh" @click="incidentFilters.page = 1; loadIncidents()">{{ $t('common.search', '搜索') }}</el-button>
        </div>
      </div>

      <custom-table
        :loading="loading.incidents"
        :columns="incidentColumns"
        :data="incidents"
        :pagination="false"
        :empty-text="$t('security.fail2ban.incident.empty')"
      >
        <template #severity="{ row }">
          <el-tag :type="row.severity === 'critical' ? 'danger' : row.severity === 'high' ? 'warning' : 'info'" effect="light">
            {{ row.severity }}
          </el-tag>
        </template>
        <template #status="{ row }">
          <el-tag :type="row.status === 'blocked' ? 'danger' : row.status === 'dismissed' ? 'info' : 'warning'" effect="light">
            {{ row.status }}
          </el-tag>
        </template>
        <template #lastSeenAt="{ row }">
          <div class="time-stack">
            <span>{{ formatDateTime(row.firstSeenAt) }}</span>
            <small>{{ formatDateTime(row.lastSeenAt) }}</small>
          </div>
        </template>
        <template #actionColumn="{ row }">
          <div class="table-actions">
            <el-button
              v-if="row.status === 'open' && props.capabilities.canBan"
              link
              type="danger"
              :disabled="!canOperate"
              @click="banIncident(row)"
            >
              {{ $t('security.fail2ban.ban.fromIncident', '立即封禁') }}
            </el-button>
            <el-button
              v-if="row.status === 'open' && props.capabilities.canChangePolicy"
              link
              @click="dismissIncident(row)"
            >
              {{ $t('security.fail2ban.incident.dismiss') }}
            </el-button>
            <el-button
              v-if="props.capabilities.canReadAuditEvidence"
              link
              type="primary"
              @click="openAudit(row)"
            >
              {{ $t('security.fail2ban.incident.openAudit', '查看审计') }}
            </el-button>
          </div>
        </template>
      </custom-table>
      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="incidentFilters.page"
          v-model:page-size="incidentFilters.pageSize"
          background
          layout="total, sizes, prev, pager, next"
          :total="incidentTotal"
          :page-sizes="[10, 20, 50]"
          @current-change="loadIncidents"
          @size-change="incidentFilters.page = 1; loadIncidents()"
        />
      </div>
    </section>

    <section class="panel-section">
      <div class="section-head">
        <div>
          <h3>{{ $t('security.fail2ban.ban.title') }}</h3>
          <p>{{ $t('security.fail2ban.ban.description') }}</p>
        </div>
        <el-button
          v-if="props.capabilities.canBan"
          type="primary"
          plain
          :icon="Warning"
          :disabled="!canOperate || !policies.length"
          @click="openManualBan"
        >
          {{ $t('security.fail2ban.ban.manual') }}
        </el-button>
      </div>

      <custom-table
        :loading="loading.bans"
        :columns="banColumns"
        :data="bans"
        :pagination="false"
        :empty-text="$t('security.fail2ban.ban.empty')"
      >
        <template #banTimeSeconds="{ row }">
          {{ secondsToText(row.banTimeSeconds) }}
        </template>
        <template #actionColumn="{ row }">
          <el-button
            link
            type="primary"
            :disabled="!props.capabilities.canUnban || !canOperate"
            @click="unban(row)"
          >
            {{ $t('security.fail2ban.ban.unban') }}
          </el-button>
        </template>
      </custom-table>
    </section>

    <section class="panel-section">
      <div class="section-head">
        <div>
          <h3>{{ $t('security.fail2ban.task.title') }}</h3>
          <p>{{ $t('security.fail2ban.task.description') }}</p>
        </div>
      </div>

      <custom-table
        :loading="loading.tasks"
        :columns="taskColumns"
        :data="tasks"
        :pagination="false"
        :empty-text="$t('security.fail2ban.task.empty')"
      >
        <template #createdAt="{ row }">
          {{ formatDateTime(row.createdAt) }}
        </template>
        <template #operation="{ row }">
          {{ $t(`security.fail2ban.task.operations.${row.operation}`, row.operation) }}
        </template>
        <template #status="{ row }">
          <el-tag :type="row.status === 'succeeded' ? 'success' : row.status === 'failed' || row.status === 'interrupted' ? 'danger' : 'info'" effect="light">
            {{ row.status }}
          </el-tag>
        </template>
        <template #progress="{ row }">
          <el-progress :percentage="Math.max(0, Math.min(100, row.progress || 0))" :stroke-width="8" />
        </template>
      </custom-table>
      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="taskPagination.page"
          v-model:page-size="taskPagination.pageSize"
          background
          layout="total, sizes, prev, pager, next"
          :total="taskTotal"
          :page-sizes="[20, 50, 100]"
          @current-change="loadTasks"
          @size-change="taskPagination.page = 1; loadTasks()"
        />
      </div>
    </section>

    <el-dialog
      v-model="policyDialogVisible"
      :title="policyDialogMode === 'create' ? $t('security.fail2ban.policy.create') : $t('security.fail2ban.policy.edit')"
      width="720px"
      destroy-on-close
    >
      <el-form label-width="150px">
        <el-form-item :label="$t('security.fail2ban.policy.template')">
          <el-select v-model="policyForm.template" :disabled="policyDialogMode === 'edit'" style="width: 100%">
            <el-option v-for="item in templates" :key="item.key" :label="item.name" :value="item.key" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('security.fail2ban.policy.name')">
          <el-input v-model="policyForm.name" />
        </el-form-item>
        <el-form-item :label="$t('security.fail2ban.policy.expected')">
          <el-switch v-model="policyForm.enabled" />
        </el-form-item>
        <el-form-item :label="$t('security.fail2ban.policy.mode')">
          <el-radio-group v-model="policyForm.enforcementMode">
            <el-radio label="observe">{{ $t('security.fail2ban.policy.modeObserve') }}</el-radio>
            <el-radio label="autoBan">{{ $t('security.fail2ban.policy.modeAutoBan') }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="$t('security.fail2ban.policy.maxRetry')">
          <el-input-number v-model="policyForm.maxRetry" :min="3" :max="100" />
        </el-form-item>
        <el-form-item :label="$t('security.fail2ban.policy.findTimeSeconds')">
          <el-input-number v-model="policyForm.findTimeSeconds" :min="60" :max="86400" />
        </el-form-item>
        <el-form-item :label="$t('security.fail2ban.policy.banTimeSeconds')">
          <el-input-number v-model="policyForm.banTimeSeconds" :min="300" :max="31536000" />
        </el-form-item>
        <el-form-item :label="$t('security.fail2ban.policy.ignoreIps')">
          <el-input
            v-model="policyForm.ignoreIpsText"
            type="textarea"
            :rows="4"
            :placeholder="$t('security.fail2ban.policy.ignoreIpsPlaceholder')"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="policyDialogVisible = false">{{ $t('common.cancel', '取消') }}</el-button>
        <el-button type="primary" :loading="loading.policySubmit" @click="submitPolicy">
          {{ $t('common.confirm', '确认') }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="manualBanVisible"
      :title="$t('security.fail2ban.ban.manual')"
      width="600px"
      destroy-on-close
    >
      <el-form label-width="120px">
        <el-form-item :label="$t('security.fail2ban.ban.policy')">
          <el-select v-model="manualBanForm.policyId" style="width: 100%">
            <el-option v-for="item in policies" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('security.fail2ban.ban.ip')">
          <el-input v-model="manualBanForm.ip" />
        </el-form-item>
        <el-form-item :label="$t('security.fail2ban.ban.reason')">
          <el-input v-model="manualBanForm.reason" type="textarea" :rows="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="manualBanVisible = false">{{ $t('common.cancel', '取消') }}</el-button>
        <el-button type="primary" :loading="loading.manualBanSubmit" @click="submitManualBan">
          {{ $t('common.confirm', '确认') }}
        </el-button>
      </template>
    </el-dialog>

    <install-task-drawer v-model="installTaskVisible" :task-id="installTaskId" />
  </div>
</template>

<style scoped lang="less">
.fail2ban-page {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.hero-card,
.panel-section {
  border: 1px solid var(--border-subtle);
  border-radius: 18px;
  background: var(--surface-card);
  box-shadow: var(--shadow-xs);
}

.hero-card {
  padding: 22px 24px;
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: center;
  background:
    radial-gradient(circle at top right, rgba(var(--primary-color), 0.12), transparent 34%),
    linear-gradient(135deg, rgba(var(--primary-color), 0.04), transparent 45%),
    var(--surface-card);
}

.hero-card__main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hero-card__title {
  display: flex;
  align-items: center;
  gap: 14px;
}

.hero-card__title .el-icon {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-size: 22px;
  color: rgb(var(--primary-color));
  background: rgba(var(--primary-color), 0.1);
}

.hero-card__title h2 {
  margin: 0;
  font-size: 20px;
}

.hero-card__title p {
  margin: 6px 0 0;
  color: var(--text-secondary);
  line-height: 1.5;
}

.hero-card__chips,
.hero-card__actions,
.section-filters,
.table-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.page-alert {
  border-radius: 16px;
}

.status-grid,
.template-grid {
  display: grid;
  gap: 14px;
}

.status-grid {
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}

.status-card {
  padding: 18px;
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  background: var(--surface-card);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-card span {
  color: var(--text-secondary);
  font-size: 13px;
}

.status-card strong {
  font-size: 22px;
}

.panel-section {
  padding: 22px 24px;
}

.section-head {
  margin-bottom: 18px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.section-head h3 {
  margin: 0;
  font-size: 17px;
}

.section-head p {
  margin: 6px 0 0;
  color: var(--text-secondary);
}

.template-grid {
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.template-card {
  padding: 18px;
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(var(--primary-color), 0.03), transparent 65%);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.template-card__head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.template-card p {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.5;
}

.template-card dl {
  margin: 0;
  display: grid;
  gap: 10px;
}

.template-card dl div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: var(--text-secondary);
}

.template-card dt,
.template-card dd {
  margin: 0;
}

.time-stack {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.time-stack small {
  color: var(--text-tertiary);
}

.pagination-wrap {
  padding-top: 16px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 900px) {
  .hero-card,
  .section-head {
    flex-direction: column;
    align-items: stretch;
  }

  .panel-section,
  .hero-card {
    padding: 18px;
  }
}
</style>
