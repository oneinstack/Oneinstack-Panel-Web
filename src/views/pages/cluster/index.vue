<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import type { EChartsOption } from 'echarts'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  Connection, CopyDocument, DataAnalysis, Delete, EditPen, Grid, Key,
  List, MoreFilled, Plus, Refresh, Search, SwitchButton
} from '@element-plus/icons-vue'
import { Api } from '@/api/modules'
import BasicChart from '@/components/echarts/basic-chart.vue'
import i18n from '@/lang'
import { useAppStore } from '@/stores/modules/app'
import { useConfigStore } from '@/stores/modules/config'
import { canAccessPath, getFirstAccessiblePath } from '@/utils/access'

type ClusterRole = 'unconfigured' | 'controller' | 'node'

interface AgentRuntime {
  status: string
  lastRegisteredAt?: string
  lastHeartbeatAt?: string
  lastTaskPollAt?: string
  lastError?: string
  lastErrorAt?: string
}

interface AgentSettings {
  role: ClusterRole
  selected: boolean
  enabled: boolean
  controllerUrl: string
  tokenConfigured: boolean
  intervalSeconds: number
  requestTimeoutSeconds: number
  runtime: AgentRuntime
}

interface ClusterNode {
  id: number | string
  local?: boolean
  role: 'controller' | 'node'
  name: string
  endpoint?: string
  group?: string
  tags?: string
  enabled: boolean
  status: string
  hostname?: string
  systemId?: string
  systemVersion?: string
  architecture?: string
  panelVersion?: string
  agentVersion?: string
  lastRegisteredAt?: string
  lastSeenAt?: string
  cpuPercent?: number
  cpuTotalCores?: number
  cpuUsedCores?: number
  memoryPercent?: number
  memoryUsedBytes?: number
  memoryTotalBytes?: number
  diskPercent?: number
  diskUsedBytes?: number
  diskTotalBytes?: number
  networkReceiveBps?: number
  networkSendBps?: number
  uptimeSeconds?: number
  ipAddress?: string
  subnetMask?: string
  gateway?: string
  macAddress?: string
  interfaceName?: string
}

interface Metric {
  id: number
  capturedAt: string
  cpuPercent: number
  memoryPercent: number
  diskPercent: number
  networkReceiveBps?: number
  networkSendBps?: number
}

interface TaskSummary {
  id: number
  nodeId?: number
  type: string
  status: string
  attempts: number
  maxAttempts: number
  error?: string
  queuedAt?: string
  startedAt?: string
  finishedAt?: string
  createdAt: string
  updatedAt?: string
  websiteId?: number
}

interface TaskEvent {
  stage: string
  status: string
  attempt?: number
  occurredAt: string
  message?: string
}

interface TaskDetail extends TaskSummary {
  progress: number
  events: TaskEvent[]
}

const t = (key: string, params?: Record<string, unknown>) => (i18n.t as any)(`cluster.${key}`, params)
const router = useRouter()
const appStore = useAppStore()
const configStore = useConfigStore()

const initialLoading = ref(true)
const loadError = ref(false)
const settings = ref<AgentSettings | null>(null)
const roleDialogVisible = ref(false)
const roleSelection = ref<'controller' | 'node'>('controller')
const roleSaving = ref(false)
const nodes = ref<ClusterNode[]>([])
const nodesLoading = ref(false)
const nodesError = ref(false)
const viewMode = ref<'table' | 'card'>('table')
const keyword = ref('')
const roleFilter = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

const formVisible = ref(false)
const formRef = ref<FormInstance>()
const agentFormRef = ref<FormInstance>()
const formSaving = ref(false)
const editingId = ref<number | null>(null)
const nodeForm = reactive({ name: '', endpoint: '', group: '', tags: '', enabled: true })

const tokenVisible = ref(false)
const generatedToken = ref('')
const detailVisible = ref(false)
const detailLoading = ref(false)
const detailTab = ref('basic')
const selectedNode = ref<ClusterNode | null>(null)
const metrics = ref<Metric[]>([])
const metricsUpdatedAt = ref('')
const metricsRefreshing = ref(false)
const metricsRefreshError = ref(false)
const tasks = ref<TaskSummary[]>([])
const taskDetailVisible = ref(false)
const taskDetailLoading = ref(false)
const taskDetailError = ref(false)
const taskDetail = ref<TaskDetail | null>(null)
const taskDetailNodeId = ref<number | null>(null)

const dispatching = ref(false)
const dispatchHistoryLoading = ref(false)
const dispatchHistoryError = ref(false)
const dispatchTasks = ref<TaskSummary[]>([])
const lastDispatch = ref<{ websiteId: number; taskIds: number[] } | null>(null)
const dispatch = reactive({ websiteId: 1, strategy: 'least_load', nodeIds: [] as number[], tags: '', includeContent: false })
const agentSaving = ref(false)
const agentForm = reactive({ controllerUrl: '', token: '', intervalSeconds: 30, requestTimeoutSeconds: 10 })
const agentFormSnapshot = reactive({ controllerUrl: '', intervalSeconds: 30, requestTimeoutSeconds: 10 })

const restartTracking = reactive<Record<string, { registeredAt: string; startedAt: number }>>({})
let pollTimer: number | undefined
let detailPollTimer: number | undefined
let dispatchPollTimer: number | undefined
let taskDetailPollTimer: number | undefined

const canAction = (action: string) => configStore.isAdministrator() || configStore.hasActionAccess(action)
const asNode = (row: unknown) => row as ClusterNode
const asTask = (row: unknown) => row as TaskSummary
const canResetRole = computed(() => canAction('cluster.role.reset'))
const canSelectRole = computed(() => canAction('cluster.role.select'))
const hasActiveFilters = computed(() => Boolean(keyword.value || roleFilter.value || statusFilter.value))

const validateHttpUrl = (value: string) => {
  try {
    const parsed = new URL(value.trim())
    return ['http:', 'https:'].includes(parsed.protocol) && Boolean(parsed.host) && !parsed.username && !parsed.password && !parsed.search && !parsed.hash
  } catch {
    return false
  }
}

const endpointValidator = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (!String(value || '').trim()) callback(new Error(t('endpointRequired')))
  else if (!validateHttpUrl(value)) callback(new Error(t('endpointInvalid')))
  else callback()
}

const controllerValidator = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (!String(value || '').trim()) callback(new Error(t('controllerRequired')))
  else if (!validateHttpUrl(value)) callback(new Error(t('controllerInvalid')))
  else callback()
}

const tokenValidator = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (!settings.value?.tokenConfigured && !String(value || '').trim()) callback(new Error(t('tokenRequired')))
  else callback()
}

const formRules = computed<FormRules>(() => ({
  name: [{ required: true, message: t('nameRequired'), trigger: 'blur' }],
  endpoint: [{ validator: endpointValidator, trigger: ['blur', 'change'] }]
}))

const agentFormRules = computed<FormRules>(() => ({
  controllerUrl: [{ validator: controllerValidator, trigger: ['blur', 'change'] }],
  token: [{ validator: tokenValidator, trigger: 'blur' }]
}))

const filteredNodes = computed(() => {
  const search = keyword.value.trim().toLowerCase()
  return nodes.value.filter((node) => {
    if (roleFilter.value && node.role !== roleFilter.value) return false
    if (statusFilter.value && node.status !== statusFilter.value) return false
    if (!search) return true
    return [node.name, node.hostname, node.ipAddress, node.endpoint]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search))
  })
})

const paginatedNodes = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredNodes.value.slice(start, start + pageSize.value)
})

const onlineWorkers = computed(() => nodes.value.filter((node) => !node.local && node.enabled && node.status === 'online'))
const activeDispatchTasks = computed(() => dispatchTasks.value.filter((task) => task.status === 'queued' || task.status === 'running'))
const lastDispatchTasks = computed(() => {
  const taskIds = new Set(lastDispatch.value?.taskIds || [])
  return dispatchTasks.value.filter((task) => taskIds.has(Number(task.id)))
})
const lastDispatchProgress = computed(() => {
  const rows = lastDispatchTasks.value
  return {
    total: rows.length,
    succeeded: rows.filter((task) => task.status === 'succeeded').length,
    failed: rows.filter((task) => task.status === 'failed').length,
    active: rows.filter((task) => task.status === 'queued' || task.status === 'running').length
  }
})
const dispatchProgressType = computed(() => {
  if (lastDispatchProgress.value.failed) return 'error'
  if (lastDispatchProgress.value.total > 0 && lastDispatchProgress.value.succeeded === lastDispatchProgress.value.total) return 'success'
  return 'info'
})
const runtime = computed(() => settings.value?.runtime || { status: 'not_configured' })
const lastRuntimeSuccess = computed(() => runtime.value.lastHeartbeatAt || runtime.value.lastRegisteredAt)
const sortedMetrics = computed(() => [...metrics.value].sort((left, right) => new Date(left.capturedAt).getTime() - new Date(right.capturedAt).getTime()))
const metricChartTheme = computed(() => {
  const isDark = appStore.theme === 'dark'
  return {
    text: isDark ? '#cbd5e1' : '#475569',
    muted: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? '#334155' : '#dbe3ee',
    tooltipBackground: isDark ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 0.98)'
  }
})
const formatMetricTooltipValue = (value: unknown) => {
  const metricValue = Array.isArray(value) ? value[value.length - 1] : value
  return `${Number(metricValue || 0).toFixed(1)}%`
}
const metricChartOption = computed<EChartsOption>(() => ({
  color: ['#ff7a1a', '#409eff', '#67c23a'],
  animationDuration: 450,
  tooltip: {
    trigger: 'axis',
    confine: true,
    backgroundColor: metricChartTheme.value.tooltipBackground,
    borderColor: metricChartTheme.value.border,
    textStyle: { color: metricChartTheme.value.text },
    axisPointer: { type: 'line', lineStyle: { color: metricChartTheme.value.border } }
  },
  legend: {
    top: 0,
    right: 0,
    data: [t('cpu'), t('memory'), t('disk')],
    textStyle: { color: metricChartTheme.value.text },
    inactiveColor: metricChartTheme.value.muted
  },
  grid: { left: 48, right: 20, top: 48, bottom: 42 },
  xAxis: {
    type: 'time',
    axisLabel: { color: metricChartTheme.value.muted, hideOverlap: true },
    axisLine: { lineStyle: { color: metricChartTheme.value.border } },
    axisTick: { lineStyle: { color: metricChartTheme.value.border } },
    splitLine: { show: false }
  },
  yAxis: {
    type: 'value',
    min: 0,
    max: 100,
    axisLabel: { formatter: '{value}%', color: metricChartTheme.value.muted },
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { color: metricChartTheme.value.border, opacity: 0.7 } }
  },
  series: [
    {
      name: t('cpu'),
      type: 'line',
      smooth: true,
      showSymbol: false,
      emphasis: { focus: 'series' },
      lineStyle: { width: 2 },
      valueFormatter: formatMetricTooltipValue,
      data: sortedMetrics.value.map((item) => [new Date(item.capturedAt).getTime(), Number(item.cpuPercent || 0)])
    },
    {
      name: t('memory'),
      type: 'line',
      smooth: true,
      showSymbol: false,
      emphasis: { focus: 'series' },
      lineStyle: { width: 2 },
      valueFormatter: formatMetricTooltipValue,
      data: sortedMetrics.value.map((item) => [new Date(item.capturedAt).getTime(), Number(item.memoryPercent || 0)])
    },
    {
      name: t('disk'),
      type: 'line',
      smooth: true,
      showSymbol: false,
      emphasis: { focus: 'series' },
      lineStyle: { width: 2 },
      valueFormatter: formatMetricTooltipValue,
      data: sortedMetrics.value.map((item) => [new Date(item.capturedAt).getTime(), Number(item.diskPercent || 0)])
    }
  ]
}))

watch([keyword, roleFilter, statusFilter, pageSize], () => { currentPage.value = 1 })

const resetFilters = () => {
  keyword.value = ''
  roleFilter.value = ''
  statusFilter.value = ''
  currentPage.value = 1
}

const hasAgentFormDraft = () => (
  agentForm.token !== '' ||
  agentForm.controllerUrl !== agentFormSnapshot.controllerUrl ||
  agentForm.intervalSeconds !== agentFormSnapshot.intervalSeconds ||
  agentForm.requestTimeoutSeconds !== agentFormSnapshot.requestTimeoutSeconds
)

const syncAgentForm = (data: AgentSettings) => {
  const controllerUrl = data.controllerUrl || ''
  const intervalSeconds = data.intervalSeconds || 30
  const requestTimeoutSeconds = data.requestTimeoutSeconds || 10
  Object.assign(agentForm, { controllerUrl, token: '', intervalSeconds, requestTimeoutSeconds })
  Object.assign(agentFormSnapshot, { controllerUrl, intervalSeconds, requestTimeoutSeconds })
}

const applySettings = (data: AgentSettings, forceFormSync = false) => {
  settings.value = data
  if (forceFormSync || !hasAgentFormDraft()) syncAgentForm(data)
  roleDialogVisible.value = !data.selected || data.role === 'unconfigured'
}

const loadSettings = async (showInitial = false) => {
  if (showInitial) initialLoading.value = true
  try {
    const { data } = await Api.getClusterAgentSettings()
    applySettings(data as AgentSettings, showInitial)
    loadError.value = false
  } catch {
    if (showInitial) loadError.value = true
  } finally {
    if (showInitial) initialLoading.value = false
  }
}

const checkRestartRecovery = () => {
  const now = Date.now()
  Object.entries(restartTracking).forEach(([id, tracking]) => {
    const node = nodes.value.find((item) => String(item.id) === id)
    const registeredChanged = Boolean(node?.lastRegisteredAt && node.lastRegisteredAt !== tracking.registeredAt && new Date(node.lastRegisteredAt).getTime() >= tracking.startedAt)
    if (node?.status === 'online' && registeredChanged) {
      delete restartTracking[id]
      ElMessage.success(t('restartRecovered'))
    } else if (now - tracking.startedAt >= 120000) {
      delete restartTracking[id]
      ElMessage.warning(t('restartTimeout'))
    }
  })
}

const loadNodes = async (silent = false) => {
  if (!silent) nodesLoading.value = true
  try {
    const { data } = await Api.listClusterNodes()
    const controller = data?.controller ? [{ ...data.controller, id: 'local', local: true, role: 'controller' as const }] : []
    const workers = Array.isArray(data?.items) ? data.items.map((node: ClusterNode) => ({ ...node, local: false, role: 'node' as const })) : []
    nodes.value = [...controller, ...workers]
    nodesError.value = false
    checkRestartRecovery()
  } catch {
    nodesError.value = true
  } finally {
    nodesLoading.value = false
  }
}

const stopPolling = () => {
  if (pollTimer) window.clearInterval(pollTimer)
  pollTimer = undefined
}

const startPolling = () => {
  stopPolling()
  if (document.hidden || !settings.value?.selected) return
  if (settings.value.role === 'controller') {
    pollTimer = window.setInterval(() => void loadNodes(true), 30000)
  } else if (settings.value.role === 'node') {
    pollTimer = window.setInterval(() => void loadSettings(false), 10000)
  }
}

const canRefreshMetrics = () => (
  !document.hidden &&
  detailVisible.value &&
  detailTab.value === 'metrics' &&
  Boolean(selectedNode.value && !selectedNode.value.local)
)

const loadMetrics = async () => {
  const node = selectedNode.value
  if (!node || node.local || metricsRefreshing.value) return
  const nodeId = String(node.id)
  metricsRefreshing.value = true
  try {
    const { data } = await Api.getClusterNodeMetrics(node.id)
    if (detailVisible.value && String(selectedNode.value?.id) === nodeId) {
      metrics.value = data?.items || []
      metricsUpdatedAt.value = new Date().toISOString()
      metricsRefreshError.value = false
    }
  } catch {
    if (detailVisible.value && String(selectedNode.value?.id) === nodeId) metricsRefreshError.value = true
  } finally {
    metricsRefreshing.value = false
  }
}

const stopDetailPolling = () => {
  if (detailPollTimer) window.clearInterval(detailPollTimer)
  detailPollTimer = undefined
}

const startDetailPolling = () => {
  stopDetailPolling()
  if (!canRefreshMetrics()) return
  detailPollTimer = window.setInterval(() => void loadMetrics(), 30000)
}

const isWebsiteDispatchTask = (task: TaskSummary) => task.type === 'website.sync' || task.type === 'website.content_sync'

const mergeDispatchTasks = (freshTasks: TaskSummary[], replace = false) => {
  const existingByID = new Map(dispatchTasks.value.map((task) => [Number(task.id), task]))
  const candidates = freshTasks
    .filter(isWebsiteDispatchTask)
    .map((task) => ({ ...task, websiteId: task.websiteId || existingByID.get(Number(task.id))?.websiteId }))
  const combined = replace ? candidates : [...candidates, ...dispatchTasks.value]
  const unique = new Map<number, TaskSummary>()
  combined.forEach((task) => {
    const id = Number(task.id)
    if (id && !unique.has(id)) unique.set(id, task)
  })
  dispatchTasks.value = [...unique.values()]
    .sort((left, right) => new Date(right.updatedAt || right.createdAt).getTime() - new Date(left.updatedAt || left.createdAt).getTime())
    .slice(0, 30)
}

const loadDispatchHistory = async () => {
  const workerIDs = nodes.value
    .filter((node) => !node.local && Number(node.id) > 0)
    .map((node) => Number(node.id))
  if (!workerIDs.length) {
    dispatchTasks.value = []
    dispatchHistoryError.value = false
    return
  }
  dispatchHistoryLoading.value = true
  try {
    const results = await Promise.allSettled(workerIDs.map((nodeID) => Api.listClusterTasks(nodeID)))
    const successfulNodeIDs = new Set<number>()
    const freshTasks: TaskSummary[] = []
    results.forEach((result, index) => {
      if (result.status !== 'fulfilled') return
      successfulNodeIDs.add(workerIDs[index])
      const items = Array.isArray(result.value.data?.items) ? result.value.data.items : []
      freshTasks.push(...items)
    })
    const retainedTasks = dispatchTasks.value.filter((task) => task.nodeId && !successfulNodeIDs.has(Number(task.nodeId)))
    mergeDispatchTasks([...freshTasks, ...retainedTasks], true)
    dispatchHistoryError.value = successfulNodeIDs.size !== workerIDs.length
  } finally {
    dispatchHistoryLoading.value = false
  }
}

const refreshActiveDispatchTasks = async () => {
  const nodeIDs = [...new Set(activeDispatchTasks.value.map((task) => Number(task.nodeId)).filter(Boolean))]
  if (!nodeIDs.length) return
  const results = await Promise.allSettled(nodeIDs.map((nodeID) => Api.listClusterTasks(nodeID)))
  const freshByID = new Map<number, TaskSummary>()
  results.forEach((result) => {
    if (result.status !== 'fulfilled') return
    const items = Array.isArray(result.value.data?.items) ? result.value.data.items : []
    items.filter(isWebsiteDispatchTask).forEach((task: TaskSummary) => freshByID.set(Number(task.id), task))
  })
  if (!freshByID.size) return
  dispatchTasks.value = dispatchTasks.value.map((task) => {
    const fresh = freshByID.get(Number(task.id))
    return fresh ? { ...fresh, websiteId: task.websiteId } : task
  })
}

const stopDispatchPolling = () => {
  if (dispatchPollTimer) window.clearInterval(dispatchPollTimer)
  dispatchPollTimer = undefined
}

const startDispatchPolling = () => {
  stopDispatchPolling()
  if (document.hidden || !activeDispatchTasks.value.length) return
  dispatchPollTimer = window.setInterval(() => void refreshActiveDispatchTasks(), 5000)
}

const refreshControllerData = async () => {
  await loadNodes()
  await loadDispatchHistory()
}

const refreshCurrentRole = async () => {
  if (settings.value?.role === 'controller') await loadNodes()
  else await loadSettings(false)
}

const selectRole = async () => {
  if (!canSelectRole.value) return
  roleSaving.value = true
  try {
    const { data } = await Api.selectClusterRole(roleSelection.value)
    applySettings(data as AgentSettings, true)
    roleDialogVisible.value = false
    if (roleSelection.value === 'controller') await refreshControllerData()
    startPolling()
  } catch {
    ElMessage.error(t('selectRoleFailed'))
  } finally {
    roleSaving.value = false
  }
}

const leaveCluster = () => {
  roleDialogVisible.value = false
  const historyBack = String(window.history.state?.back || '')
  if (historyBack && !historyBack.includes('/cluster')) {
    router.back()
    return
  }
  const accessible = getFirstAccessiblePath()
  if (accessible !== '/cluster') {
    void router.replace(accessible)
    return
  }
  const fallback = ['/home', '/website', '/database', '/software', '/container', '/file', '/terminal', '/task', '/monitor', '/bastion', '/runtime-log', '/security', '/certificate', '/approval-center', '/log', '/config-snapshots', '/system-management']
    .find((path) => canAccessPath(path)) || '/not-found'
  void router.replace(fallback)
}

const cancelRoleSelection = (done?: () => void) => {
  if (done) done()
  void nextTick(leaveCluster)
}

const resetRole = async () => {
  await ElMessageBox.confirm(t('resetRoleConfirm'), t('resetRoleTitle'), { type: 'warning', confirmButtonText: t('confirm'), cancelButtonText: t('cancel') })
  const { data } = await Api.resetClusterRole()
  applySettings(data as AgentSettings, true)
  nodes.value = []
  dispatchTasks.value = []
  lastDispatch.value = null
  stopPolling()
  stopDispatchPolling()
  roleDialogVisible.value = true
  ElMessage.success(t('roleReset'))
}

const openCreate = () => {
  editingId.value = null
  Object.assign(nodeForm, { name: '', endpoint: '', group: '', tags: '', enabled: true })
  formVisible.value = true
}

const openEdit = (node: ClusterNode) => {
  if (node.local) return
  editingId.value = Number(node.id)
  Object.assign(nodeForm, { name: node.name, endpoint: node.endpoint || '', group: node.group || '', tags: node.tags || '', enabled: node.enabled })
  formVisible.value = true
}

const saveNode = async () => {
  if (!(await formRef.value?.validate())) return
  formSaving.value = true
  try {
    const payload = {
      name: nodeForm.name.trim(),
      endpoint: nodeForm.endpoint.trim(),
      group: nodeForm.group.trim(),
      tags: nodeForm.tags.trim(),
      enabled: nodeForm.enabled
    }
    const response = editingId.value
      ? await Api.updateClusterNode(editingId.value, payload)
      : await Api.createClusterNode({ name: payload.name, endpoint: payload.endpoint, group: payload.group, tags: payload.tags })
    if (!editingId.value && response.data?.token) {
      generatedToken.value = response.data.token
      tokenVisible.value = true
    }
    ElMessage.success(t(editingId.value ? 'nodeUpdated' : 'nodeAdded'))
    formVisible.value = false
    await loadNodes()
  } finally {
    formSaving.value = false
  }
}

const updateNodeEnabled = async (node: ClusterNode, enabled: boolean) => {
  await Api.updateClusterNode(node.id, { name: node.name, endpoint: node.endpoint, group: node.group || '', tags: node.tags || '', enabled })
  ElMessage.success(t(enabled ? 'nodeEnabled' : 'nodeDisabled'))
  await loadNodes()
}

const rotateToken = async (node: ClusterNode) => {
  await ElMessageBox.confirm(t('rotateConfirm', { name: node.name }), t('rotateTitle'), { type: 'warning' })
  const { data } = await Api.rotateClusterNodeToken(node.id)
  generatedToken.value = data?.token || ''
  tokenVisible.value = true
  await loadNodes()
}

const deleteNode = async (node: ClusterNode) => {
  await ElMessageBox.confirm(t('deleteConfirm', { name: node.name }), t('deleteTitle'), { type: 'warning', confirmButtonClass: 'el-button--danger' })
  await Api.deleteClusterNode(node.id)
  ElMessage.success(t('nodeDeleted'))
  await loadNodes()
}

const restartNode = async (node: ClusterNode) => {
  await ElMessageBox.confirm(t('restartConfirm', { name: node.name }), t('restartTitle'), { type: 'warning' })
  await Api.restartClusterNode(node.id)
  restartTracking[String(node.id)] = { registeredAt: node.lastRegisteredAt || '', startedAt: Date.now() }
  ElMessage.success(t('restartScheduled'))
}

const handleMore = async (command: string, node: ClusterNode) => {
  if (command === 'toggle') await updateNodeEnabled(node, !node.enabled)
  else if (command === 'token') await rotateToken(node)
  else if (command === 'delete') await deleteNode(node)
}

const openDetail = async (node: ClusterNode) => {
  selectedNode.value = node
  detailTab.value = 'basic'
  detailVisible.value = true
  metrics.value = []
  metricsUpdatedAt.value = ''
  metricsRefreshError.value = false
  tasks.value = []
  if (node.local) return
  detailLoading.value = true
  try {
    const [metricResult, taskResult] = await Promise.allSettled([Api.getClusterNodeMetrics(node.id), Api.listClusterTasks(node.id)])
    if (metricResult.status === 'fulfilled') {
      metrics.value = metricResult.value.data?.items || []
      metricsUpdatedAt.value = new Date().toISOString()
    } else {
      metricsRefreshError.value = true
    }
    if (taskResult.status === 'fulfilled') tasks.value = taskResult.value.data?.items || []
  } finally {
    detailLoading.value = false
  }
}

const saveAgent = async () => {
  if (!(await agentFormRef.value?.validate())) return
  agentSaving.value = true
  try {
    const { data } = await Api.updateClusterAgentSettings({
      controllerUrl: agentForm.controllerUrl.trim(),
      token: agentForm.token.trim() || undefined,
      intervalSeconds: agentForm.intervalSeconds,
      requestTimeoutSeconds: agentForm.requestTimeoutSeconds
    })
    applySettings(data as AgentSettings, true)
    ElMessage.success(t('connectionSaved'))
  } finally {
    agentSaving.value = false
  }
}

const dispatchWebsite = async () => {
  if (!dispatch.websiteId) {
    ElMessage.warning(t('websiteRequired'))
    return
  }
  dispatching.value = true
  try {
    const websiteId = dispatch.websiteId
    const { data } = await Api.dispatchWebsiteToCluster({
      websiteId,
      strategy: dispatch.strategy,
      nodeIds: dispatch.nodeIds,
      tags: dispatch.tags.split(',').map((item) => item.trim()).filter(Boolean),
      includeContent: dispatch.includeContent,
      idempotencyKey: `website-${websiteId}-${Date.now()}`
    })
    const createdTasks = (Array.isArray(data?.tasks) ? data.tasks : [])
      .map((task: TaskSummary) => ({ ...task, websiteId }))
    mergeDispatchTasks(createdTasks)
    lastDispatch.value = { websiteId, taskIds: createdTasks.map((task: TaskSummary) => Number(task.id)) }
    ElMessage.success(t('dispatchCreated', { count: createdTasks.length }))
    startDispatchPolling()
  } finally {
    dispatching.value = false
  }
}

const dispatchNodeName = (nodeId?: number) => {
  if (!nodeId) return '-'
  const node = nodes.value.find((item) => Number(item.id) === Number(nodeId))
  return node ? `${node.name} · ${node.ipAddress || node.endpoint || '-'}` : `#${nodeId}`
}

const dispatchTaskTypeLabel = (type: string) => type === 'website.content_sync' ? t('websiteContentTask') : t('websiteConfigTask')

const taskTypeLabel = (type: string) => {
  if (type === 'website.sync') return t('websiteConfigTask')
  if (type === 'website.content_sync') return t('websiteContentTask')
  if (type === 'panel.restart') return t('panelRestartTask')
  return type
}

const taskEventStageLabel = (stage: string) => {
  const value = t(`taskEvents.${stage}`)
  return value === `cluster.taskEvents.${stage}` ? stage : value
}

const isTerminalTaskStatus = (status?: string) => ['succeeded', 'failed', 'canceled', 'cancelled'].includes(String(status || '').toLowerCase())

const stopTaskDetailPolling = () => {
  if (taskDetailPollTimer) window.clearInterval(taskDetailPollTimer)
  taskDetailPollTimer = undefined
}

const loadTaskDetail = async (nodeId: number, taskId: number, silent = false) => {
  if (!silent) taskDetailLoading.value = true
  try {
    const { data } = await Api.getClusterTask(nodeId, taskId)
    if (taskDetailVisible.value && taskDetailNodeId.value === nodeId && Number(taskDetail.value?.id || taskId) === taskId) {
      taskDetail.value = data as TaskDetail
      taskDetailError.value = false
      if (isTerminalTaskStatus(taskDetail.value.status)) stopTaskDetailPolling()
    }
  } catch {
    if (taskDetailVisible.value && taskDetailNodeId.value === nodeId) taskDetailError.value = true
  } finally {
    taskDetailLoading.value = false
  }
}

const startTaskDetailPolling = () => {
  stopTaskDetailPolling()
  if (document.hidden || !taskDetailVisible.value || !taskDetail.value || !taskDetailNodeId.value || isTerminalTaskStatus(taskDetail.value.status)) return
  taskDetailPollTimer = window.setInterval(() => {
    if (taskDetail.value && taskDetailNodeId.value) void loadTaskDetail(taskDetailNodeId.value, Number(taskDetail.value.id), true)
  }, 5000)
}

const openTaskDetail = async (task: TaskSummary, nodeId?: number) => {
  const resolvedNodeId = Number(nodeId || task.nodeId)
  if (!resolvedNodeId) return
  taskDetailNodeId.value = resolvedNodeId
  taskDetail.value = { ...task, progress: 0, events: [] }
  taskDetailError.value = false
  taskDetailVisible.value = true
  await loadTaskDetail(resolvedNodeId, Number(task.id))
  startTaskDetailPolling()
}

const retryTaskDetail = () => {
  if (taskDetail.value && taskDetailNodeId.value) void loadTaskDetail(taskDetailNodeId.value, Number(taskDetail.value.id))
}

const writeClipboardText = async (text: string) => {
  if (window.isSecureContext && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return
    } catch {
      // Fall through for browsers that expose the API but reject permission.
    }
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', 'readonly')
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  textarea.style.top = '-9999px'
  textarea.style.opacity = '0'
  textarea.style.pointerEvents = 'none'
  document.body.appendChild(textarea)
  let copied = false
  try {
    textarea.focus()
    textarea.select()
    textarea.setSelectionRange(0, textarea.value.length)
    copied = document.execCommand('copy')
  } finally {
    textarea.remove()
  }
  if (!copied) throw new Error('copy failed')
}

const copyToken = async () => {
  if (!generatedToken.value) return
  try {
    await writeClipboardText(generatedToken.value)
    ElMessage.success(t('copied'))
  } catch {
    ElMessage.error(t('copyFailed'))
  }
}

const statusLabel = (status: string) => t(status === 'online' ? 'online' : status === 'offline' ? 'offline' : status === 'pending' ? 'pending' : status === 'error' ? 'error' : 'notConfigured')
const statusType = (status: string) => status === 'online' ? 'success' : status === 'pending' || status === 'connecting' ? 'warning' : status === 'error' ? 'danger' : 'info'
const runtimeLabel = (status: string) => status === 'online' ? t('online') : status === 'connecting' ? t('connecting') : status === 'controller' ? t('controllerStatus') : status === 'error' ? t('error') : t('notConfigured')
const taskStatusLabel = (status: string) => {
  const value = t(`taskStatuses.${status}`)
  return value === `cluster.taskStatuses.${status}` ? status : value
}
const formatTime = (value?: string) => value ? new Date(value).toLocaleString() : '-'
const formatPercent = (value?: number) => `${Number(value || 0).toFixed(0)}%`
const formatBytes = (value?: number) => {
  if (!value) return '-'
  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB']
  let size = value
  let unit = 0
  while (size >= 1024 && unit < units.length - 1) { size /= 1024; unit += 1 }
  return `${size.toFixed(unit > 1 ? 1 : 0)} ${units[unit]}`
}
const formatRate = (value?: number) => value ? `${formatBytes(value)}/s` : '-'
const formatUptime = (seconds?: number) => {
  if (!seconds) return '-'
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor(seconds % 86400 / 3600)
  const minutes = Math.floor(seconds % 3600 / 60)
  return days ? t('dayHourMinute', { days, hours, minutes }) : t('hourMinute', { hours, minutes })
}

watch([detailVisible, detailTab, () => selectedNode.value?.id], ([visible, tab]) => {
  if (visible && tab === 'metrics' && !document.hidden) void loadMetrics()
  startDetailPolling()
})

watch(() => activeDispatchTasks.value.map((task) => task.id).join(','), startDispatchPolling)

watch(taskDetailVisible, (visible) => {
  if (visible) startTaskDetailPolling()
  else stopTaskDetailPolling()
})

const handleVisibility = () => {
  if (!document.hidden) {
    void refreshCurrentRole()
    if (canRefreshMetrics()) void loadMetrics()
    if (activeDispatchTasks.value.length) void refreshActiveDispatchTasks()
    if (taskDetailVisible.value && taskDetail.value && taskDetailNodeId.value) void loadTaskDetail(taskDetailNodeId.value, Number(taskDetail.value.id), true)
  }
  startPolling()
  startDetailPolling()
  startDispatchPolling()
  startTaskDetailPolling()
}

onMounted(async () => {
  document.addEventListener('visibilitychange', handleVisibility)
  await loadSettings(true)
  if (settings.value?.role === 'controller') await refreshControllerData()
  startPolling()
})

onUnmounted(() => {
  stopPolling()
  stopDetailPolling()
  stopDispatchPolling()
  stopTaskDetailPolling()
  document.removeEventListener('visibilitychange', handleVisibility)
})
</script>

<template>
  <div class="cluster-page" v-loading="initialLoading">
    <el-result v-if="!initialLoading && loadError" icon="error" :title="t('loadFailed')">
      <template #extra><el-button type="primary" @click="loadSettings(true)">{{ t('retry') }}</el-button></template>
    </el-result>

    <template v-else-if="settings?.selected && settings.role === 'controller'">
      <header class="page-header">
        <div><h1>{{ t('title') }}</h1><p>{{ t('description') }}</p></div>
        <el-button v-if="canResetRole" :icon="SwitchButton" @click="resetRole">{{ t('resetRole') }}</el-button>
      </header>

      <section class="panel-card node-panel">
        <div class="section-header">
          <h2>{{ t('nodeList') }}</h2>
          <div class="header-actions">
            <el-button :icon="Refresh" :loading="nodesLoading || dispatchHistoryLoading" @click="refreshControllerData()">{{ t('refresh') }}</el-button>
            <el-button v-if="canAction('cluster.node.create')" type="primary" :icon="Plus" @click="openCreate">{{ t('addNode') }}</el-button>
          </div>
        </div>
        <div class="filters">
          <el-input v-model="keyword" :prefix-icon="Search" :placeholder="t('searchPlaceholder')" clearable />
          <el-select v-model="roleFilter" :placeholder="t('allRoles')"><el-option :label="t('allRoles')" value="" /><el-option :label="t('master')" value="controller" /><el-option :label="t('worker')" value="node" /></el-select>
          <el-select v-model="statusFilter" :placeholder="t('allStatus')"><el-option :label="t('allStatus')" value="" /><el-option :label="t('online')" value="online" /><el-option :label="t('offline')" value="offline" /><el-option :label="t('pending')" value="pending" /><el-option :label="t('error')" value="error" /></el-select>
          <div class="filter-actions"><el-button :disabled="!hasActiveFilters" @click="resetFilters">{{ t('resetFilters') }}</el-button><div class="view-switch"><el-button :class="{ active: viewMode === 'card' }" :icon="Grid" :title="t('cardView')" @click="viewMode = 'card'" /><el-button :class="{ active: viewMode === 'table' }" :icon="List" :title="t('tableView')" @click="viewMode = 'table'" /></div></div>
        </div>
        <el-alert v-if="nodesError" :title="t('loadFailed')" type="error" show-icon :closable="false" class="load-alert" />

        <el-table v-if="viewMode === 'table'" v-loading="nodesLoading" :data="paginatedNodes" row-key="id" class="node-table" :empty-text="t('empty')">
          <el-table-column type="selection" width="44" :selectable="(row: ClusterNode) => !row.local" />
          <el-table-column :label="t('nodeName')" min-width="200">
            <template #default="scope"><div class="node-identity"><span class="status-dot" :class="scope.row.status" /><div><strong>{{ scope.row.name }}<span v-if="scope.row.local">（{{ t('master') }}）</span></strong><small>{{ scope.row.hostname || scope.row.endpoint || '-' }}</small></div></div></template>
          </el-table-column>
          <el-table-column :label="t('ipAddress')" min-width="135"><template #default="scope">{{ scope.row.ipAddress || '-' }}</template></el-table-column>
          <el-table-column :label="t('role')" width="112"><template #default="scope"><el-tag :type="scope.row.local ? 'warning' : 'info'" effect="light">{{ scope.row.local ? t('master') : t('worker') }}</el-tag></template></el-table-column>
          <el-table-column :label="t('status')" width="105"><template #default="scope"><el-tag :type="statusType(scope.row.status)" effect="light">{{ statusLabel(scope.row.status) }}</el-tag></template></el-table-column>
          <el-table-column :label="t('cpu')" min-width="145"><template #default="scope"><div class="usage-cell"><span>{{ formatPercent(scope.row.cpuPercent) }}</span><el-progress :percentage="Math.round(scope.row.cpuPercent || 0)" :show-text="false" :stroke-width="5" color="#ff7a1a" /></div></template></el-table-column>
          <el-table-column :label="t('memory')" min-width="145"><template #default="scope"><div class="usage-cell"><span>{{ formatPercent(scope.row.memoryPercent) }}</span><el-progress :percentage="Math.round(scope.row.memoryPercent || 0)" :show-text="false" :stroke-width="5" /></div></template></el-table-column>
          <el-table-column :label="t('lastReport')" min-width="170"><template #default="scope">{{ formatTime(scope.row.lastSeenAt) }}</template></el-table-column>
          <el-table-column :label="t('operations')" min-width="270" fixed="right">
            <template #default="scope">
              <el-button link type="primary" @click="openDetail(asNode(scope.row))">{{ t('detail') }}</el-button>
              <template v-if="!scope.row.local">
                <el-button v-if="canAction('cluster.node.update')" link @click="openEdit(asNode(scope.row))">{{ t('edit') }}</el-button>
                <el-button v-if="canAction('cluster.node.restart')" link :disabled="scope.row.status !== 'online' || !scope.row.enabled" :loading="Boolean(restartTracking[String(scope.row.id)])" @click="restartNode(asNode(scope.row))">{{ t('restart') }}</el-button>
                <el-dropdown v-if="canAction('cluster.node.update') || canAction('cluster.node.token.rotate') || canAction('cluster.node.delete')" trigger="click" @command="(command: string) => handleMore(command, asNode(scope.row))">
                  <el-button link>{{ t('more') }}<el-icon><MoreFilled /></el-icon></el-button>
                  <template #dropdown><el-dropdown-menu><el-dropdown-item v-if="canAction('cluster.node.update')" command="toggle">{{ scope.row.enabled ? t('disable') : t('enable') }}</el-dropdown-item><el-dropdown-item v-if="canAction('cluster.node.token.rotate')" command="token" :icon="Key">{{ t('rotateToken') }}</el-dropdown-item><el-dropdown-item v-if="canAction('cluster.node.delete')" command="delete" :icon="Delete" divided class="danger-item">{{ t('delete') }}</el-dropdown-item></el-dropdown-menu></template>
                </el-dropdown>
              </template>
            </template>
          </el-table-column>
        </el-table>

        <div v-else v-loading="nodesLoading" class="node-grid">
          <article v-for="node in paginatedNodes" :key="node.id" class="node-card">
            <div class="node-card-head"><div class="node-identity"><span class="status-dot" :class="node.status" /><div><strong>{{ node.name }}</strong><small>{{ node.hostname || node.endpoint || '-' }}</small></div></div><el-tag :type="node.local ? 'warning' : 'info'">{{ node.local ? t('master') : t('worker') }}</el-tag></div>
            <div class="node-card-ip">{{ node.ipAddress || '-' }} · {{ statusLabel(node.status) }}</div>
            <div class="card-resource"><span>CPU {{ formatPercent(node.cpuPercent) }}</span><el-progress :percentage="Math.round(node.cpuPercent || 0)" :show-text="false" :stroke-width="6" color="#ff7a1a" /></div>
            <div class="card-resource"><span>{{ t('memory') }} {{ formatPercent(node.memoryPercent) }}</span><el-progress :percentage="Math.round(node.memoryPercent || 0)" :show-text="false" :stroke-width="6" /></div>
            <footer><el-button link type="primary" @click="openDetail(node)">{{ t('detail') }}</el-button><el-button v-if="!node.local && canAction('cluster.node.update')" link @click="openEdit(node)">{{ t('edit') }}</el-button><el-button v-if="!node.local && canAction('cluster.node.restart')" link :disabled="node.status !== 'online'" @click="restartNode(node)">{{ t('restart') }}</el-button></footer>
          </article>
          <el-empty v-if="!paginatedNodes.length" :description="t('empty')" />
        </div>

        <div class="pagination"><span>{{ t('totalItems', { count: filteredNodes.length }) }}</span><el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" layout="prev, pager, next, sizes" :page-sizes="[10, 20, 50]" :total="filteredNodes.length" /></div>
      </section>

      <section v-if="canAction('cluster.website.dispatch')" class="panel-card dispatch-panel">
        <div class="section-header"><div><h2>{{ t('websiteDispatch') }}</h2><p>{{ t('dispatchDescription') }}</p></div><el-button text :icon="Refresh" :loading="dispatchHistoryLoading" @click="loadDispatchHistory">{{ t('refreshDispatchHistory') }}</el-button></div>
        <el-form class="dispatch-form" label-position="top">
          <el-form-item :label="t('websiteId')"><el-input-number v-model="dispatch.websiteId" :min="1" controls-position="right" /></el-form-item>
          <el-form-item :label="t('strategy')"><el-select v-model="dispatch.strategy"><el-option :label="t('leastLoad')" value="least_load" /><el-option :label="t('fixedNodes')" value="fixed" /><el-option :label="t('byTags')" value="tag" /></el-select></el-form-item>
          <el-form-item v-if="dispatch.strategy === 'fixed'" :label="t('fixedNodes')"><el-select v-model="dispatch.nodeIds" multiple collapse-tags :placeholder="t('onlineWorkersOnly')"><el-option v-for="node in onlineWorkers" :key="node.id" :label="node.name" :value="Number(node.id)" /></el-select></el-form-item>
          <el-form-item v-if="dispatch.strategy === 'tag'" :label="t('tags')"><el-input v-model="dispatch.tags" placeholder="prod,cn-east" /></el-form-item>
          <el-form-item :label="t('content')"><el-checkbox v-model="dispatch.includeContent">{{ t('includeContent') }}</el-checkbox></el-form-item>
          <el-button type="primary" :loading="dispatching" @click="dispatchWebsite">{{ t('dispatch') }}</el-button>
        </el-form>
        <el-alert v-if="lastDispatch" class="dispatch-progress" :type="dispatchProgressType" :closable="false" show-icon :title="t('dispatchProgress', { websiteId: lastDispatch.websiteId, total: lastDispatchProgress.total, succeeded: lastDispatchProgress.succeeded, failed: lastDispatchProgress.failed, active: lastDispatchProgress.active })" />
        <el-alert v-if="dispatchHistoryError" class="dispatch-history-alert" type="warning" :closable="false" show-icon :title="t('dispatchHistoryPartial')" />
        <div class="dispatch-history-head"><h3>{{ t('dispatchHistory') }}</h3><span>{{ t('dispatchHistoryHint') }}</span></div>
        <el-table v-if="dispatchTasks.length" :data="dispatchTasks" size="small" class="dispatch-table">
          <el-table-column prop="id" :label="t('taskId')" width="90" />
          <el-table-column :label="t('dispatchWebsiteId')" width="100"><template #default="scope">{{ scope.row.websiteId || '-' }}</template></el-table-column>
          <el-table-column :label="t('dispatchTargetNode')" min-width="190"><template #default="scope">{{ dispatchNodeName(scope.row.nodeId) }}</template></el-table-column>
          <el-table-column :label="t('taskType')" min-width="150"><template #default="scope">{{ dispatchTaskTypeLabel(scope.row.type) }}</template></el-table-column>
          <el-table-column :label="t('taskStatus')" width="110"><template #default="scope"><el-tag :type="statusType(scope.row.status === 'succeeded' ? 'online' : scope.row.status === 'failed' ? 'error' : 'pending')">{{ taskStatusLabel(scope.row.status) }}</el-tag></template></el-table-column>
          <el-table-column :label="t('taskAttempts')" width="90"><template #default="scope">{{ scope.row.attempts }}/{{ scope.row.maxAttempts }}</template></el-table-column>
          <el-table-column :label="t('dispatchUpdatedAt')" min-width="170"><template #default="scope">{{ formatTime(scope.row.updatedAt || scope.row.createdAt) }}</template></el-table-column>
          <el-table-column :label="t('dispatchResult')" min-width="180"><template #default="scope"><span :class="{ 'task-error': scope.row.error }">{{ scope.row.error || (scope.row.status === 'succeeded' ? t('dispatchApplied') : '-') }}</span></template></el-table-column>
          <el-table-column :label="t('operations')" width="90" fixed="right"><template #default="scope"><el-button link type="primary" @click="openTaskDetail(asTask(scope.row))">{{ t('detail') }}</el-button></template></el-table-column>
        </el-table>
        <el-empty v-else :description="t('noDispatchHistory')" :image-size="72" />
      </section>
    </template>

    <template v-else-if="settings?.selected && settings.role === 'node'">
      <header class="page-header"><div><h1>{{ t('nodeModeTitle') }}</h1><p>{{ t('nodeModeDescription') }}</p></div><el-button v-if="canResetRole" :icon="SwitchButton" @click="resetRole">{{ t('resetRole') }}</el-button></header>
      <div class="node-mode-grid">
        <section class="panel-card connection-card">
          <div class="section-header"><h2>{{ t('nodeModeTitle') }}</h2><el-icon class="section-icon"><Connection /></el-icon></div>
          <el-form ref="agentFormRef" :model="agentForm" :rules="agentFormRules" label-position="top">
            <el-form-item :label="t('controllerUrl')" prop="controllerUrl"><el-input v-model="agentForm.controllerUrl" placeholder="https://controller.example.com/v1" /></el-form-item>
            <el-form-item :label="t('token')" prop="token"><el-input v-model="agentForm.token" type="password" show-password :placeholder="settings.tokenConfigured ? t('tokenConfigured') : t('token')" /></el-form-item>
            <div class="two-columns"><el-form-item :label="t('interval')"><el-input-number v-model="agentForm.intervalSeconds" :min="5" :max="3600" controls-position="right" /></el-form-item><el-form-item :label="t('timeout')"><el-input-number v-model="agentForm.requestTimeoutSeconds" :min="1" :max="120" controls-position="right" /></el-form-item></div>
            <el-button v-if="canAction('cluster.agent.settings.update')" type="primary" :loading="agentSaving" @click="saveAgent">{{ t('saveConnection') }}</el-button>
          </el-form>
        </section>
        <section class="panel-card runtime-card">
          <div class="section-header"><h2>{{ t('runtimeStatus') }}</h2><el-tag :type="statusType(runtime.status)">{{ runtimeLabel(runtime.status) }}</el-tag></div>
          <el-descriptions :column="1" border><el-descriptions-item :label="t('connectionStatus')">{{ runtimeLabel(runtime.status) }}</el-descriptions-item><el-descriptions-item :label="t('lastSuccess')">{{ formatTime(lastRuntimeSuccess) }}</el-descriptions-item><el-descriptions-item :label="t('lastHeartbeat')">{{ formatTime(runtime.lastHeartbeatAt) }}</el-descriptions-item><el-descriptions-item :label="t('lastTaskPoll')">{{ formatTime(runtime.lastTaskPollAt) }}</el-descriptions-item><el-descriptions-item :label="t('lastError')"><span class="runtime-error">{{ runtime.lastError || '-' }}</span></el-descriptions-item></el-descriptions>
        </section>
      </div>
    </template>

    <el-dialog v-model="roleDialogVisible" :title="t('roleDialogTitle')" width="620px" :close-on-click-modal="false" :close-on-press-escape="false" :before-close="cancelRoleSelection" destroy-on-close>
      <p class="role-hint">{{ t('roleDialogHint') }}</p>
      <div class="role-options">
        <button type="button" class="role-option" :class="{ selected: roleSelection === 'controller' }" @click="roleSelection = 'controller'"><span class="role-visual controller"><i /><i /></span><span><strong>{{ t('controller') }}</strong><small>{{ t('controllerDescription') }}</small></span><span class="role-check">✓</span></button>
        <button type="button" class="role-option" :class="{ selected: roleSelection === 'node' }" @click="roleSelection = 'node'"><span class="role-visual worker"><i /><i /><i /></span><span><strong>{{ t('node') }}</strong><small>{{ t('nodeDescription') }}</small></span><span class="role-check">✓</span></button>
      </div>
      <template #footer><el-button @click="leaveCluster">{{ t('cancel') }}</el-button><el-button type="primary" :loading="roleSaving" :disabled="!canSelectRole" @click="selectRole">{{ t('confirm') }}</el-button></template>
    </el-dialog>

    <el-dialog v-model="formVisible" :title="t(editingId ? 'nodeDialogEdit' : 'nodeDialogAdd')" width="520px">
      <el-form ref="formRef" :model="nodeForm" :rules="formRules" label-position="top"><el-form-item :label="t('nodeName')" prop="name"><el-input v-model="nodeForm.name" /></el-form-item><el-form-item :label="t('endpoint')" prop="endpoint"><el-input v-model="nodeForm.endpoint" placeholder="https://node.example.com" /></el-form-item><div class="two-columns"><el-form-item :label="t('group')"><el-input v-model="nodeForm.group" /></el-form-item><el-form-item :label="t('tags')"><el-input v-model="nodeForm.tags" placeholder="prod,cn-east" /></el-form-item></div><el-form-item v-if="editingId" :label="t('status')"><el-switch v-model="nodeForm.enabled" :active-text="t('enable')" :inactive-text="t('disable')" /></el-form-item></el-form>
      <template #footer><el-button @click="formVisible = false">{{ t('cancel') }}</el-button><el-button type="primary" :loading="formSaving" @click="saveNode">{{ t('save') }}</el-button></template>
    </el-dialog>

    <el-dialog v-model="tokenVisible" :title="t('tokenTitle')" width="560px"><el-alert :title="t('tokenWarning')" type="warning" :closable="false" show-icon /><el-input class="token-input" :model-value="generatedToken" readonly><template #append><el-button :icon="CopyDocument" :disabled="!generatedToken" @click="copyToken">{{ t('copy') }}</el-button></template></el-input></el-dialog>

    <el-drawer v-model="detailVisible" :size="'min(720px, 100vw)'" :with-header="false" class="cluster-drawer">
      <template v-if="selectedNode"><div class="drawer-head"><div class="node-identity"><span class="status-dot" :class="selectedNode.status" /><div><h2>{{ selectedNode.name }}<span v-if="selectedNode.local">（{{ t('master') }}）</span></h2><small>{{ selectedNode.hostname || '-' }}　·　{{ selectedNode.ipAddress || '-' }}</small></div></div><el-button circle text @click="detailVisible = false">×</el-button></div>
      <el-tabs v-model="detailTab" class="drawer-tabs"><el-tab-pane :label="t('basicInfo')" name="basic" /><el-tab-pane :label="t('resourceMonitor')" name="resource" /><el-tab-pane v-if="!selectedNode.local" :label="t('metrics')" name="metrics" /><el-tab-pane v-if="!selectedNode.local" :label="t('logs')" name="tasks" /></el-tabs>
      <el-skeleton v-if="detailLoading" :rows="8" animated />
      <template v-else>
        <div v-if="detailTab === 'basic'" class="drawer-stack"><section class="detail-card"><div class="detail-title"><span>{{ t('nodeInfo') }}</span><el-tag :type="selectedNode.local ? 'warning' : 'info'">{{ selectedNode.local ? t('master') : t('worker') }}</el-tag></div><el-descriptions :column="1"><el-descriptions-item :label="t('nodeName')">{{ selectedNode.name }}</el-descriptions-item><el-descriptions-item :label="t('hostname')">{{ selectedNode.hostname || '-' }}</el-descriptions-item><el-descriptions-item :label="t('ipAddress')">{{ selectedNode.ipAddress || '-' }}</el-descriptions-item><el-descriptions-item :label="t('architecture')">{{ selectedNode.architecture || '-' }}</el-descriptions-item><el-descriptions-item :label="t('panelVersion')">{{ selectedNode.panelVersion || '-' }}</el-descriptions-item><el-descriptions-item :label="t('status')"><el-tag :type="statusType(selectedNode.status)">{{ statusLabel(selectedNode.status) }}</el-tag></el-descriptions-item><el-descriptions-item :label="t('lastRegistered')">{{ formatTime(selectedNode.lastRegisteredAt) }}</el-descriptions-item><el-descriptions-item :label="t('uptime')">{{ formatUptime(selectedNode.uptimeSeconds) }}</el-descriptions-item></el-descriptions></section><section class="detail-card"><div class="detail-title">{{ t('networkInfo') }}</div><el-descriptions :column="1"><el-descriptions-item :label="t('ipAddress')">{{ selectedNode.ipAddress || '-' }}</el-descriptions-item><el-descriptions-item :label="t('subnetMask')">{{ selectedNode.subnetMask || '-' }}</el-descriptions-item><el-descriptions-item :label="t('gateway')">{{ selectedNode.gateway || '-' }}</el-descriptions-item><el-descriptions-item :label="t('macAddress')">{{ selectedNode.macAddress || '-' }}</el-descriptions-item></el-descriptions></section></div>
        <section v-else-if="detailTab === 'resource'" class="detail-card"><div class="detail-title">{{ t('currentResources') }}</div><div class="resource-circles"><el-progress type="circle" :percentage="Math.round(selectedNode.cpuPercent || 0)" color="#ff7a1a"><template #default><strong>{{ formatPercent(selectedNode.cpuPercent) }}</strong><small>{{ t('cpu') }}</small></template></el-progress><el-progress type="circle" :percentage="Math.round(selectedNode.memoryPercent || 0)"><template #default><strong>{{ formatPercent(selectedNode.memoryPercent) }}</strong><small>{{ t('memory') }}</small></template></el-progress></div><div class="resource-lines"><div><span>{{ t('cpuCores') }}</span><strong>{{ Number(selectedNode.cpuUsedCores || 0).toFixed(1) }} / {{ selectedNode.cpuTotalCores || '-' }}</strong></div><div><span>{{ t('memory') }}</span><strong>{{ formatBytes(selectedNode.memoryUsedBytes) }} / {{ formatBytes(selectedNode.memoryTotalBytes) }}</strong></div><div><span>{{ t('disk') }}</span><strong>{{ formatBytes(selectedNode.diskUsedBytes) }} / {{ formatBytes(selectedNode.diskTotalBytes) }}</strong></div><div><span>{{ t('networkTraffic') }}</span><strong>{{ formatRate(selectedNode.networkReceiveBps) }} / {{ formatRate(selectedNode.networkSendBps) }}</strong></div></div></section>
        <section v-else-if="detailTab === 'metrics'" class="detail-card metric-card"><div class="metric-meta"><span class="live-indicator" :class="{ error: metricsRefreshError }"><i />{{ metricsRefreshError ? t('metricRefreshFailed') : t('metricAutoRefresh') }}</span><span>{{ t('metricLastUpdated', { time: formatTime(metricsUpdatedAt) }) }}</span></div><div v-if="metrics.length" class="metric-chart"><BasicChart :option="metricChartOption" /></div><el-empty v-else :description="t('noMetrics')" /></section>
        <section v-else-if="detailTab === 'tasks'" class="detail-card"><el-table v-if="tasks.length" :data="tasks" size="small"><el-table-column prop="id" :label="t('taskId')" width="90" /><el-table-column :label="t('taskType')" min-width="150"><template #default="scope">{{ taskTypeLabel(scope.row.type) }}</template></el-table-column><el-table-column :label="t('taskStatus')" width="110"><template #default="scope"><el-tag :type="statusType(scope.row.status === 'succeeded' ? 'online' : scope.row.status === 'failed' ? 'error' : 'pending')">{{ taskStatusLabel(scope.row.status) }}</el-tag></template></el-table-column><el-table-column :label="t('taskAttempts')" width="90"><template #default="scope">{{ scope.row.attempts }}/{{ scope.row.maxAttempts }}</template></el-table-column><el-table-column :label="t('taskTime')" min-width="170"><template #default="scope">{{ formatTime(scope.row.createdAt) }}</template></el-table-column><el-table-column :label="t('operations')" width="80" fixed="right"><template #default="scope"><el-button link type="primary" @click="openTaskDetail(asTask(scope.row), Number(selectedNode?.id))">{{ t('detail') }}</el-button></template></el-table-column></el-table><el-empty v-else :description="t('noTasks')" /></section>
      </template></template>
    </el-drawer>

    <el-dialog v-model="taskDetailVisible" :title="t('taskDetailTitle', { id: taskDetail?.id || '' })" width="640px" append-to-body>
      <div v-loading="taskDetailLoading" class="task-detail-dialog">
        <el-alert v-if="taskDetailError" type="error" :closable="false" show-icon :title="t('taskDetailLoadFailed')">
          <template #default><el-button link type="primary" @click="retryTaskDetail">{{ t('retry') }}</el-button></template>
        </el-alert>
        <template v-if="taskDetail">
          <el-descriptions :column="2" border>
            <el-descriptions-item :label="t('taskType')">{{ taskTypeLabel(taskDetail.type) }}</el-descriptions-item>
            <el-descriptions-item :label="t('taskStatus')"><el-tag :type="statusType(taskDetail.status === 'succeeded' ? 'online' : taskDetail.status === 'failed' ? 'error' : 'pending')">{{ taskStatusLabel(taskDetail.status) }}</el-tag></el-descriptions-item>
            <el-descriptions-item :label="t('taskAttempts')">{{ taskDetail.attempts }}/{{ taskDetail.maxAttempts }}</el-descriptions-item>
            <el-descriptions-item :label="t('taskTime')">{{ formatTime(taskDetail.createdAt) }}</el-descriptions-item>
            <el-descriptions-item :label="t('taskStartedAt')">{{ formatTime(taskDetail.startedAt) }}</el-descriptions-item>
            <el-descriptions-item :label="t('taskFinishedAt')">{{ formatTime(taskDetail.finishedAt) }}</el-descriptions-item>
          </el-descriptions>
          <div class="task-progress-block"><div><strong>{{ t('taskProgress') }}</strong><span>{{ Math.max(0, Math.min(100, Number(taskDetail.progress || 0))) }}%</span></div><el-progress :percentage="Math.max(0, Math.min(100, Number(taskDetail.progress || 0)))" :status="taskDetail.status === 'failed' ? 'exception' : taskDetail.status === 'succeeded' ? 'success' : undefined" /></div>
          <el-alert v-if="taskDetail.error" type="error" :closable="false" show-icon :title="taskDetail.error" />
          <h3 class="task-timeline-title">{{ t('taskTimeline') }}</h3>
          <el-timeline v-if="taskDetail.events?.length">
            <el-timeline-item v-for="(event, index) in taskDetail.events" :key="`${event.occurredAt}-${index}`" :timestamp="formatTime(event.occurredAt)" placement="top" :type="event.status === 'failed' ? 'danger' : event.status === 'succeeded' ? 'success' : 'primary'">
              <strong>{{ taskEventStageLabel(event.stage) }} · {{ taskStatusLabel(event.status) }}</strong><p v-if="event.message">{{ event.message }}</p>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-else :description="t('noTaskEvents')" :image-size="64" />
        </template>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped lang="less">
.cluster-page { min-height: 100%; padding: 22px; color: var(--el-text-color-primary); background: var(--el-bg-color-page); }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; margin-bottom: 18px; h1 { margin: 0 0 7px; font-size: 25px; } p { margin: 0; color: var(--el-text-color-secondary); } }
.panel-card { border: 1px solid var(--el-border-color-lighter); border-radius: 10px; background: var(--el-bg-color); box-shadow: 0 4px 18px rgb(20 35 60 / 4%); }
.node-panel { padding: 18px 20px 12px; }
.section-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; h2 { margin: 0; font-size: 18px; } }
.header-actions { display: flex; gap: 10px; }
.filters { display: grid; grid-template-columns: minmax(260px, 1.4fr) minmax(150px, .55fr) minmax(150px, .55fr) auto; gap: 10px; margin: 14px 0; }
.filter-actions { display: flex; align-items: center; gap: 10px; }
.view-switch { display: flex; .el-button { margin: 0; border-radius: 0; } .el-button:first-child { border-radius: 6px 0 0 6px; } .el-button:last-child { border-radius: 0 6px 6px 0; } .active { color: var(--el-color-primary); border-color: var(--el-color-primary); background: var(--el-color-primary-light-9); } }
.load-alert { margin-bottom: 12px; }
.node-table { border: 1px solid var(--el-border-color-lighter); border-radius: 8px; overflow: hidden; }
.node-identity { display: flex; align-items: center; min-width: 0; gap: 11px; strong, small { display: block; } strong { line-height: 22px; } small { overflow: hidden; color: var(--el-text-color-secondary); text-overflow: ellipsis; white-space: nowrap; } }
.status-dot { width: 10px; height: 10px; flex: 0 0 auto; border-radius: 50%; background: var(--el-color-info); &.online { background: var(--el-color-success); } &.offline, &.error { background: var(--el-color-danger); } &.pending { background: var(--el-color-warning); } }
.usage-cell { width: 100%; font-size: 12px; span { display: block; margin-bottom: 5px; } }
.pagination { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-top: 12px; color: var(--el-text-color-secondary); font-size: 13px; }
.node-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); min-height: 180px; gap: 14px; }
.node-card { padding: 16px; border: 1px solid var(--el-border-color-lighter); border-radius: 9px; background: var(--el-fill-color-blank); .node-card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; } .node-card-ip { margin: 14px 0; color: var(--el-text-color-secondary); font-size: 13px; } .card-resource { margin-top: 10px; font-size: 12px; span { display: block; margin-bottom: 5px; } } footer { display: flex; padding-top: 12px; margin-top: 14px; border-top: 1px solid var(--el-border-color-lighter); } }
.dispatch-panel { padding: 18px 20px 20px; margin-top: 14px; h2 { margin: 0; font-size: 17px; } .section-header p { margin: 6px 0 0; color: var(--el-text-color-secondary); font-size: 12px; } }
.dispatch-form { display: flex; align-items: flex-end; flex-wrap: wrap; gap: 12px 24px; :deep(.el-form-item) { min-width: 170px; margin: 0; } }
.dispatch-progress, .dispatch-history-alert { margin-top: 16px; }
.dispatch-history-head { display: flex; align-items: baseline; justify-content: space-between; gap: 14px; padding-top: 18px; margin-top: 18px; border-top: 1px solid var(--el-border-color-lighter); h3 { margin: 0; font-size: 15px; } span { color: var(--el-text-color-secondary); font-size: 12px; } }
.dispatch-table { margin-top: 12px; border: 1px solid var(--el-border-color-lighter); border-radius: 8px; overflow: hidden; }
.task-error { color: var(--el-color-danger); }
.task-detail-dialog { min-height: 180px; }
.task-progress-block { padding: 16px 0 8px; > div:first-child { display: flex; justify-content: space-between; margin-bottom: 8px; } }
.task-timeline-title { margin: 18px 0 14px; font-size: 15px; }
.task-detail-dialog :deep(.el-timeline-item__content p) { margin: 6px 0 0; color: var(--el-text-color-secondary); line-height: 1.6; word-break: break-word; }
.role-hint { margin: -4px 0 14px; color: var(--el-text-color-secondary); font-size: 13px; }
.role-options { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.role-option { position: relative; display: grid; grid-template-columns: 46px 1fr; align-items: center; min-height: 106px; padding: 16px; text-align: left; color: var(--el-text-color-primary); border: 1px solid var(--el-border-color); border-radius: 9px; background: var(--el-bg-color); cursor: pointer; transition: .18s; strong, small { display: block; } small { margin-top: 7px; color: var(--el-text-color-secondary); line-height: 20px; } &.selected { border: 2px solid var(--el-color-primary); background: var(--el-color-primary-light-9); } .role-check { position: absolute; top: 12px; right: 12px; display: none; width: 18px; height: 18px; text-align: center; color: white; border-radius: 50%; background: var(--el-color-primary); } &.selected .role-check { display: block; } }
.role-visual { position: relative; display: block; width: 34px; height: 36px; color: var(--el-color-info); i { position: absolute; box-sizing: border-box; display: block; border: 2px solid currentColor; } &.controller i { left: 3px; width: 28px; height: 11px; border-radius: 4px; &:first-child { top: 5px; } &:last-child { top: 20px; } } &.worker i { width: 17px; height: 17px; transform: rotate(30deg); &:nth-child(1) { top: 1px; left: 9px; } &:nth-child(2) { top: 17px; left: 0; } &:nth-child(3) { top: 17px; left: 18px; } } }
.role-option.selected .role-visual { color: var(--el-color-primary); }
.two-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.token-input { margin-top: 18px; }
.node-mode-grid { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(360px, .75fr); gap: 16px; .panel-card { padding: 22px; } .section-icon { font-size: 24px; color: var(--el-color-primary); } }
.connection-card :deep(.el-input-number) { width: 100%; }
.runtime-card :deep(.el-descriptions) { margin-top: 18px; } .runtime-error { color: var(--el-color-danger); word-break: break-word; }
.drawer-head { display: flex; align-items: flex-start; justify-content: space-between; padding: 22px 22px 10px; h2 { margin: 0; font-size: 21px; } }
.drawer-tabs { :deep(.el-tabs__header) { padding: 0 22px; } :deep(.el-tabs__content) { padding: 4px 22px 24px; } }
.drawer-stack { display: grid; gap: 14px; }
.detail-card { padding: 18px; border: 1px solid var(--el-border-color-lighter); border-radius: 9px; background: var(--el-fill-color-blank); }
.detail-title { display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px; font-weight: 600; }
.resource-circles { display: grid; grid-template-columns: 1fr 1fr; justify-items: center; gap: 24px; padding: 8px 0 22px; :deep(.el-progress__text) { display: flex; flex-direction: column; } strong { font-size: 22px; } small { margin-top: 5px; color: var(--el-text-color-secondary); font-size: 11px; } }
.resource-lines { display: grid; gap: 13px; > div { display: flex; justify-content: space-between; gap: 20px; padding-top: 12px; border-top: 1px solid var(--el-border-color-lighter); span { color: var(--el-text-color-secondary); } } }
.metric-card { min-height: 330px; }
.metric-meta { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 24px; color: var(--el-text-color-secondary); font-size: 12px; .live-indicator { display: inline-flex; align-items: center; gap: 7px; color: var(--el-color-success); &.error { color: var(--el-color-danger); } } i { width: 7px; height: 7px; border-radius: 50%; background: currentColor; box-shadow: 0 0 0 4px var(--el-color-success-light-9); } .error i { box-shadow: 0 0 0 4px var(--el-color-danger-light-9); } }
.metric-chart { width: 100%; height: 280px; }
.danger-item { color: var(--el-color-danger); }
@media (max-width: 1100px) { .node-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .node-mode-grid { grid-template-columns: 1fr; } }
@media (max-width: 760px) { .cluster-page { padding: 14px; } .page-header { flex-direction: column; } .filters { grid-template-columns: 1fr 1fr; } .filters > :first-child, .filter-actions { grid-column: 1 / -1; } .filter-actions { justify-content: space-between; } .node-grid, .role-options, .two-columns { grid-template-columns: 1fr; } .pagination { align-items: flex-start; flex-direction: column; overflow-x: auto; } .dispatch-form { display: grid; grid-template-columns: 1fr; :deep(.el-form-item) { width: 100%; } } .dispatch-history-head { align-items: flex-start; flex-direction: column; } }
</style>
