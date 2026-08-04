<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import type { EChartsOption, EChartsType } from 'echarts'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Api } from '@/api/Api'
import BasicChart from '@/components/echarts/basic-chart.vue'
import sconfig from '@/sstore/sconfig'

interface MetricSample {
  id: number
  capturedAt: string
  cpuPercent: number
  memoryPercent: number
  diskPercent: number
  load1: number
  load5: number
  load15: number
  networkReceiveBps: number
  networkSendBps: number
  diskReadBps: number
  diskWriteBps: number
}

type MonitorHistoryGroup = 'cpu' | 'memory' | 'load' | 'network' | 'disk'

interface MonitorHistoryPoint {
  capturedAt: string
  value: number
}

interface MonitorHistorySeries {
  group: MonitorHistoryGroup
  key: string
  label: string
  unit?: string
  points: MonitorHistoryPoint[]
}

interface MonitorHistoryRange {
  from: string
  to: string
  bucketSeconds: number
  sampleCount: number
  bucketCount: number
}

interface MonitorHistoryData {
  range: MonitorHistoryRange
  series: MonitorHistorySeries[]
}

interface MonitorSummary {
  latest?: MetricSample
  ruleCount: number
  enabledRules: number
  firingCount: number
  pendingCount: number
  serviceFiringCount: number
  servicePendingCount: number
  last24Hours: number
}

interface ComponentHealthState {
  component: string
  displayName: string
  softwareKey: string
  serviceName: string
  softwareVersion?: string
  runtimeVersion?: string
  installed: boolean
  busy: boolean
  healthState: 'normal' | 'pending' | 'firing'
  serviceState: 'running' | 'stopped' | 'failed' | 'transitioning' | 'unknown'
  loadState?: string
  activeState?: string
  subState?: string
  consecutiveFailures: number
  lastError?: string
  lastCheckedAt: string
  firingSince?: string
  silencedUntil?: string
}

interface MonitorRule {
  id: number
  name: string
  metric: string
  operator: string
  threshold: number
  recoveryThreshold: number
  consecutiveSamples: number
  cooldownMinutes: number
  severity: 'info' | 'warning' | 'critical'
  enabled: boolean
  silencedUntil?: string
  state: 'normal' | 'pending' | 'firing'
  lastValue: number
  lastEvaluatedAt?: string
  firingSince?: string
}

interface AlertEvent {
  id: number
  ruleName: string
  metric: string
  severity: 'info' | 'warning' | 'critical'
  eventType: 'triggered' | 'reminder' | 'resolved'
  value: number
  threshold: number
  startedAt: string
  occurredAt: string
  resolvedAt?: string
  message: string
}

interface NotificationChannel {
  id: string
  name: string
  type: string
  enabled: boolean
  targetHint: string
  hasSecret: boolean
  updatedAt: string
}

interface NotificationDelivery {
  id: number
  eventId: number
  channelName: string
  status: 'success' | 'failed'
  error?: string
  attemptedAt: string
}

const metricOptions = [
  { value: 'cpu', label: 'CPU 使用率', unit: '%' },
  { value: 'memory', label: '内存使用率', unit: '%' },
  { value: 'disk', label: '根分区使用率', unit: '%' },
  { value: 'load1', label: '1 分钟负载', unit: '' },
  { value: 'network_receive', label: '网络接收速率', unit: 'B/s' },
  { value: 'network_send', label: '网络发送速率', unit: 'B/s' },
  { value: 'disk_read', label: '磁盘读取速率', unit: 'B/s' },
  { value: 'disk_write', label: '磁盘写入速率', unit: 'B/s' }
]

const historyGroups: Array<{
  key: MonitorHistoryGroup
  label: string
  description: string
}> = [
  { key: 'cpu', label: 'CPU', description: '处理器使用率趋势' },
  { key: 'memory', label: '内存', description: '内存占用比例趋势' },
  { key: 'load', label: '负载', description: '1 / 5 / 15 分钟系统负载' },
  { key: 'network', label: '网络', description: '接收与发送吞吐速率' },
  { key: 'disk', label: '磁盘', description: '根分区使用率与磁盘读写速率' }
]

const historyRangePresets = [
  { label: '1 小时', hours: 1 },
  { label: '6 小时', hours: 6 },
  { label: '24 小时', hours: 24 },
  { label: '7 天', hours: 24 * 7 },
  { label: '30 天', hours: 24 * 30 }
]

const summary = ref<MonitorSummary>({
  ruleCount: 0,
  enabledRules: 0,
  firingCount: 0,
  pendingCount: 0,
  serviceFiringCount: 0,
  servicePendingCount: 0,
  last24Hours: 0
})
const metrics = ref<MetricSample[]>([])
const historyLoading = ref(false)
const historyData = ref<MonitorHistoryData>({
  range: {
    from: '',
    to: '',
    bucketSeconds: 60,
    sampleCount: 0,
    bucketCount: 0
  },
  series: []
})
const historyTimeRange = ref<[Date, Date]>([
  new Date(Date.now() - 24 * 60 * 60 * 1000),
  new Date()
])
const serviceHealth = ref<ComponentHealthState[]>([])
const rules = ref<MonitorRule[]>([])
const events = ref<AlertEvent[]>([])
const channels = ref<NotificationChannel[]>([])
const deliveries = ref<NotificationDelivery[]>([])
const dashboardLoading = ref(false)
const serviceChecking = ref(false)
const tableLoading = ref(false)
const activeTab = ref('rules')
const eventTotal = ref(0)
const deliveryTotal = ref(0)
const eventFilters = reactive({
  page: 1,
  pageSize: 20,
  eventType: '',
  severity: ''
})
const deliveryFilters = reactive({
  page: 1,
  pageSize: 20,
  status: ''
})

const ruleDialogVisible = ref(false)
const editingRuleID = ref<number | null>(null)
const savingRule = ref(false)
const ruleForm = reactive({
  name: '',
  metric: 'cpu',
  operator: 'gte',
  threshold: 90,
  recoveryThreshold: 80,
  consecutiveSamples: 3,
  cooldownMinutes: 60,
  severity: 'warning',
  enabled: true
})

const channelDialogVisible = ref(false)
const editingChannelID = ref('')
const editingChannelHasSecret = ref(false)
const savingChannel = ref(false)
const channelForm = reactive({
  name: '',
  type: 'webhook',
  enabled: true,
  webhookUrl: '',
  secret: '',
  clearSecret: false
})

const trendOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['CPU', '内存', '根分区', '1 分钟负载'] },
  grid: { left: 48, right: 24, top: 48, bottom: 40 },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: metrics.value.map((item) => new Date(item.capturedAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    }))
  },
  yAxis: [
    { type: 'value', min: 0, max: 100, axisLabel: { formatter: '{value}%' } },
    { type: 'value', min: 0, position: 'right', name: '负载' }
  ],
  series: [
    { name: 'CPU', type: 'line', smooth: true, showSymbol: false, data: metrics.value.map((item) => item.cpuPercent) },
    { name: '内存', type: 'line', smooth: true, showSymbol: false, data: metrics.value.map((item) => item.memoryPercent) },
    { name: '根分区', type: 'line', smooth: true, showSymbol: false, data: metrics.value.map((item) => item.diskPercent) },
    { name: '1 分钟负载', type: 'line', smooth: true, showSymbol: false, yAxisIndex: 1, data: metrics.value.map((item) => item.load1) }
  ]
}))

const groupedHistorySeries = computed(() => {
  const groups = Object.fromEntries(
    historyGroups.map((group) => [group.key, [] as MonitorHistorySeries[]])
  ) as Record<MonitorHistoryGroup, MonitorHistorySeries[]>
  historyData.value.series.forEach((series) => {
    if (groups[series.group]) groups[series.group].push(series)
  })
  return groups
})

const canReadMonitorHistory = computed(() =>
  sconfig.hasScopeAccess('monitoring', 'read') ||
  Boolean((sconfig.scopeAccess as any)?.['monitoring.read']) ||
  sconfig.hasActionAccess('monitoring.read')
)

const historyChartOptions = computed<Record<MonitorHistoryGroup, EChartsOption>>(() => {
  return Object.fromEntries(historyGroups.map((group) => {
    const seriesList = groupedHistorySeries.value[group.key]
    const hasPercent = seriesList.some((series) => series.unit === '%')
    const hasRate = seriesList.some((series) => series.unit === 'B/s')
    const yAxis = []
    if (hasPercent) {
      yAxis.push({
        type: 'value',
        min: 0,
        max: 100,
        axisLabel: { formatter: '{value}%' }
      })
    }
    if (hasRate) {
      yAxis.push({
        type: 'value',
        position: hasPercent ? 'right' : 'left',
        axisLabel: { formatter: (value: number) => formatRate(value).replace('/s', '') }
      })
    }
    if (!yAxis.length) yAxis.push({ type: 'value', min: 0 })

    return [group.key, {
      tooltip: {
        trigger: 'axis',
        valueFormatter: (value: unknown) => {
          const numeric = Number(value)
          return Number.isFinite(numeric) ? numeric.toFixed(2) : String(value)
        }
      },
      legend: {
        top: 0,
        type: 'scroll',
        data: seriesList.map((series) => series.label)
      },
      grid: { left: 48, right: hasPercent && hasRate ? 58 : 24, top: 44, bottom: 34 },
      xAxis: { type: 'time' },
      yAxis,
      series: seriesList.map((series) => ({
        name: series.label,
        type: 'line',
        smooth: true,
        showSymbol: false,
        yAxisIndex: series.unit === 'B/s' && hasPercent ? 1 : 0,
        data: series.points.map((point) => [point.capturedAt, point.value])
      }))
    } as EChartsOption]
  })) as Record<MonitorHistoryGroup, EChartsOption>
})

const initTrend = (instance: EChartsType) => instance.setOption(trendOption.value)
const formatTime = (value?: string) => value ? new Date(value).toLocaleString() : '—'
const formatPercent = (value?: number) => Number.isFinite(value) ? `${Number(value).toFixed(1)}%` : '—'
const formatRate = (value?: number) => {
  if (!Number.isFinite(value)) return '—'
  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s']
  let current = Number(value)
  let index = 0
  while (current >= 1024 && index < units.length - 1) {
    current /= 1024
    index++
  }
  return `${current.toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}
const metricMeta = (metric: string) => metricOptions.find((item) => item.value === metric)
const formatDuration = (seconds?: number) => {
  if (!Number.isFinite(seconds)) return '—'
  const value = Number(seconds)
  if (value < 60) return `${value} 秒`
  if (value < 3600) return `${Math.round(value / 60)} 分钟`
  return `${(value / 3600).toFixed(value % 3600 === 0 ? 0 : 1)} 小时`
}
const normalizeMonitorHistory = (response: any): MonitorHistoryData => {
  const payload = response?.data?.range
    ? response.data
    : response?.data?.data?.range
      ? response.data.data
      : response?.range
        ? response
        : response?.data || {}
  return {
    range: payload.range || historyData.value.range,
    series: Array.isArray(payload.series) ? payload.series : []
  }
}
const metricLabel = (metric: string) =>
  metric === 'service_health' ? '组件服务健康' : (metricMeta(metric)?.label || metric)
const metricValue = (metric: string, value: number) => {
  if (metric === 'service_health') return value >= 1 ? '正常' : '异常'
  const unit = metricMeta(metric)?.unit
  if (unit === '%') return `${Number(value).toFixed(1)}%`
  if (unit === 'B/s') return formatRate(value)
  return Number(value).toFixed(2)
}
const operatorLabel = (operator: string) => ({
  gt: '>',
  gte: '≥',
  lt: '<',
  lte: '≤'
}[operator] || operator)
const severityType = (severity: string) => ({
  info: 'info',
  warning: 'warning',
  critical: 'danger'
}[severity] || 'info') as 'info' | 'warning' | 'danger'
const eventTypeLabel = (type: string) => ({
  triggered: '触发',
  reminder: '持续提醒',
  resolved: '恢复'
}[type] || type)
const stateLabel = (rule: MonitorRule) => {
  if (!rule.enabled) return '已停用'
  if (rule.state === 'firing') return '告警中'
  if (rule.state === 'pending') return '待确认'
  return '正常'
}
const stateType = (rule: MonitorRule) => {
  if (!rule.enabled) return 'info'
  if (rule.state === 'firing') return 'danger'
  if (rule.state === 'pending') return 'warning'
  return 'success'
}
const isSilenced = (rule: MonitorRule) =>
  Boolean(rule.silencedUntil && new Date(rule.silencedUntil).getTime() > Date.now())
const totalFiring = computed(() =>
  summary.value.firingCount + (summary.value.serviceFiringCount || 0)
)
const totalPending = computed(() =>
  summary.value.pendingCount + (summary.value.servicePendingCount || 0)
)
const serviceStateLabel = (service: ComponentHealthState) => {
  if (service.busy) return '操作中'
  if (service.healthState === 'firing') return '异常'
  if (service.healthState === 'pending') return '待确认'
  if (service.serviceState === 'running') return '运行正常'
  return '状态未知'
}
const serviceStateType = (service: ComponentHealthState) => {
  if (service.busy) return 'info'
  if (service.healthState === 'firing') return 'danger'
  if (service.healthState === 'pending') return 'warning'
  return service.serviceState === 'running' ? 'success' : 'info'
}
const serviceSilenced = (service: ComponentHealthState) =>
  Boolean(service.silencedUntil && new Date(service.silencedUntil).getTime() > Date.now())

const loadDashboard = async () => {
  dashboardLoading.value = true
  try {
    const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const [summaryResponse, metricResponse, serviceResponse] = await Promise.all([
      Api.getMonitorSummary(),
      Api.getMonitorMetrics({ from, limit: 2000 }),
      Api.getMonitorServiceHealth()
    ])
    summary.value = summaryResponse.data
    metrics.value = metricResponse.data || []
    serviceHealth.value = serviceResponse.data || []
  } finally {
    dashboardLoading.value = false
  }
}

const loadMonitorHistory = async () => {
  if (!canReadMonitorHistory.value) {
    historyData.value = {
      ...historyData.value,
      series: []
    }
    return
  }
  historyLoading.value = true
  try {
    const [from, to] = historyTimeRange.value || []
    const response = await Api.getMonitorHistory({
      from: from?.toISOString(),
      to: to?.toISOString()
    })
    const normalized = normalizeMonitorHistory(response)
    historyData.value = normalized
    if (normalized.range?.from && normalized.range?.to) {
      historyTimeRange.value = [
        new Date(normalized.range.from),
        new Date(normalized.range.to)
      ]
    }
  } finally {
    historyLoading.value = false
  }
}

const applyHistoryPreset = (hours: number) => {
  const to = new Date()
  const from = new Date(to.getTime() - hours * 60 * 60 * 1000)
  historyTimeRange.value = [from, to]
  void loadMonitorHistory()
}

const checkServiceHealth = async () => {
  serviceChecking.value = true
  try {
    const { data } = await Api.checkMonitorServiceHealth()
    serviceHealth.value = data || []
    const { data: currentSummary } = await Api.getMonitorSummary()
    summary.value = currentSummary
    ElMessage.success('组件服务健康检查已完成')
  } finally {
    serviceChecking.value = false
  }
}

const silenceServiceHealth = async (service: ComponentHealthState, minutes: number) => {
  await Api.silenceMonitorServiceHealth(service.component, minutes)
  ElMessage.success(minutes ? `${service.displayName} 告警已静默 1 小时` : '组件告警静默已解除')
  const { data } = await Api.getMonitorServiceHealth()
  serviceHealth.value = data || []
}

const loadRules = async () => {
  tableLoading.value = true
  try {
    const { data } = await Api.getMonitorRules()
    rules.value = data || []
  } finally {
    tableLoading.value = false
  }
}

const loadEvents = async () => {
  tableLoading.value = true
  try {
    const { data } = await Api.getMonitorEvents(eventFilters)
    events.value = data?.data || []
    eventTotal.value = data?.total || 0
  } finally {
    tableLoading.value = false
  }
}

const loadChannels = async () => {
  tableLoading.value = true
  try {
    const { data } = await Api.getMonitorChannels()
    channels.value = data || []
  } finally {
    tableLoading.value = false
  }
}

const loadDeliveries = async () => {
  tableLoading.value = true
  try {
    const { data } = await Api.getMonitorDeliveries(deliveryFilters)
    deliveries.value = data?.data || []
    deliveryTotal.value = data?.total || 0
  } finally {
    tableLoading.value = false
  }
}

const refreshCurrentTab = () => {
  if (activeTab.value === 'rules') return loadRules()
  if (activeTab.value === 'events') return loadEvents()
  if (activeTab.value === 'channels') return loadChannels()
  return loadDeliveries()
}

const refreshAll = async () => {
  await Promise.all([loadDashboard(), loadMonitorHistory(), refreshCurrentTab()])
}

const openCreateRule = () => {
  editingRuleID.value = null
  Object.assign(ruleForm, {
    name: '',
    metric: 'cpu',
    operator: 'gte',
    threshold: 90,
    recoveryThreshold: 80,
    consecutiveSamples: 3,
    cooldownMinutes: 60,
    severity: 'warning',
    enabled: true
  })
  ruleDialogVisible.value = true
}

const openEditRule = (rule: MonitorRule) => {
  editingRuleID.value = rule.id
  Object.assign(ruleForm, {
    name: rule.name,
    metric: rule.metric,
    operator: rule.operator,
    threshold: rule.threshold,
    recoveryThreshold: rule.recoveryThreshold,
    consecutiveSamples: rule.consecutiveSamples,
    cooldownMinutes: rule.cooldownMinutes,
    severity: rule.severity,
    enabled: rule.enabled
  })
  ruleDialogVisible.value = true
}

const saveRule = async () => {
  if (!ruleForm.name.trim()) {
    ElMessage.warning('请输入规则名称')
    return
  }
  if ((ruleForm.operator === 'gt' || ruleForm.operator === 'gte') &&
    ruleForm.recoveryThreshold >= ruleForm.threshold) {
    ElMessage.warning('大于类规则的恢复阈值必须低于触发阈值')
    return
  }
  if ((ruleForm.operator === 'lt' || ruleForm.operator === 'lte') &&
    ruleForm.recoveryThreshold <= ruleForm.threshold) {
    ElMessage.warning('小于类规则的恢复阈值必须高于触发阈值')
    return
  }
  savingRule.value = true
  try {
    if (editingRuleID.value) await Api.updateMonitorRule(editingRuleID.value, { ...ruleForm })
    else await Api.createMonitorRule({ ...ruleForm })
    ElMessage.success(editingRuleID.value ? '告警规则已更新' : '告警规则已创建')
    ruleDialogVisible.value = false
    await Promise.all([loadRules(), loadDashboard()])
  } finally {
    savingRule.value = false
  }
}

const deleteRule = async (rule: MonitorRule) => {
  await ElMessageBox.confirm(
    `删除规则“${rule.name}”？历史告警事件会继续保留。`,
    '删除告警规则',
    { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
  )
  await Api.deleteMonitorRule(rule.id)
  ElMessage.success('告警规则已删除')
  await Promise.all([loadRules(), loadDashboard()])
}

const silenceRule = async (rule: MonitorRule, minutes: number) => {
  await Api.silenceMonitorRule(rule.id, minutes)
  ElMessage.success(minutes ? '规则已静默 1 小时' : '规则静默已解除')
  await loadRules()
}

const openCreateChannel = () => {
  editingChannelID.value = ''
  editingChannelHasSecret.value = false
  Object.assign(channelForm, {
    name: '',
    type: 'webhook',
    enabled: true,
    webhookUrl: '',
    secret: '',
    clearSecret: false
  })
  channelDialogVisible.value = true
}

const openEditChannel = (channel: NotificationChannel) => {
  editingChannelID.value = channel.id
  editingChannelHasSecret.value = channel.hasSecret
  Object.assign(channelForm, {
    name: channel.name,
    type: channel.type,
    enabled: channel.enabled,
    webhookUrl: '',
    secret: '',
    clearSecret: false
  })
  channelDialogVisible.value = true
}

const saveChannel = async () => {
  if (!channelForm.name.trim()) {
    ElMessage.warning('请输入通道名称')
    return
  }
  if (!editingChannelID.value && !channelForm.webhookUrl.trim()) {
    ElMessage.warning('新建通道必须填写 Webhook URL')
    return
  }
  savingChannel.value = true
  try {
    if (editingChannelID.value) {
      await Api.updateMonitorChannel(editingChannelID.value, { ...channelForm })
    } else {
      await Api.createMonitorChannel({ ...channelForm })
    }
    ElMessage.success(editingChannelID.value ? '通知通道已更新' : '通知通道已创建')
    channelDialogVisible.value = false
    await loadChannels()
  } finally {
    savingChannel.value = false
  }
}

const testChannel = async (channel: NotificationChannel) => {
  await Api.testMonitorChannel(channel.id)
  ElMessage.success('测试通知已发送')
}

const deleteChannel = async (channel: NotificationChannel) => {
  await ElMessageBox.confirm(
    `删除通知通道“${channel.name}”？`,
    '删除通知通道',
    { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
  )
  await Api.deleteMonitorChannel(channel.id)
  ElMessage.success('通知通道已删除')
  await loadChannels()
}

let refreshTimer: ReturnType<typeof setInterval> | undefined
onMounted(async () => {
  await Promise.all([loadDashboard(), loadMonitorHistory(), loadRules()])
  refreshTimer = setInterval(() => void loadDashboard(), 60_000)
})
onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>

<template>
  <div class="monitor-page">
    <div class="page-heading">
      <div>
        <h2>监控告警</h2>
        <p>每分钟采集服务器指标，按连续采样和恢复阈值判断告警，并通过加密配置的 Webhook 推送。</p>
      </div>
      <el-button type="primary" :loading="dashboardLoading" @click="refreshAll">刷新数据</el-button>
    </div>

    <div class="stats-grid" v-loading="dashboardLoading">
      <div class="stat-card">
        <span>CPU 使用率</span>
        <strong>{{ formatPercent(summary.latest?.cpuPercent) }}</strong>
        <small>1 分钟负载 {{ summary.latest ? summary.latest.load1.toFixed(2) : '—' }}</small>
      </div>
      <div class="stat-card">
        <span>内存使用率</span>
        <strong>{{ formatPercent(summary.latest?.memoryPercent) }}</strong>
        <small>采集于 {{ formatTime(summary.latest?.capturedAt) }}</small>
      </div>
      <div class="stat-card warning">
        <span>根分区使用率</span>
        <strong>{{ formatPercent(summary.latest?.diskPercent) }}</strong>
        <small>写入 {{ formatRate(summary.latest?.diskWriteBps) }}</small>
      </div>
      <div class="stat-card danger">
        <span>当前告警</span>
        <strong>{{ totalFiring }}</strong>
        <small>待确认 {{ totalPending }} / 24 小时事件 {{ summary.last24Hours }}</small>
      </div>
    </div>

    <div class="service-health-panel">
      <div class="panel-heading">
        <div>
          <h3>组件服务健康</h3>
          <span>连续两次异常后告警；安装、升级、配置和服务操作期间暂停判断。</span>
        </div>
        <el-button :loading="serviceChecking" @click="checkServiceHealth">立即检查</el-button>
      </div>
      <div v-if="serviceHealth.length" class="service-health-grid">
        <article
          v-for="service in serviceHealth"
          :key="service.component"
          class="service-health-card"
          :class="`is-${service.healthState}`"
        >
          <div class="service-health-card__top">
            <div>
              <strong>{{ service.displayName }}</strong>
              <span>{{ service.serviceName }}</span>
            </div>
            <el-tag :type="serviceStateType(service)" effect="light" size="small">
              {{ serviceStateLabel(service) }}
            </el-tag>
          </div>
          <dl>
            <div>
              <dt>安装版本</dt>
              <dd>{{ service.softwareVersion || '—' }}</dd>
            </div>
            <div>
              <dt>运行版本</dt>
              <dd>{{ service.runtimeVersion || '—' }}</dd>
            </div>
            <div>
              <dt>systemd</dt>
              <dd>{{ service.activeState || service.serviceState }}</dd>
            </div>
            <div>
              <dt>最近检查</dt>
              <dd>{{ formatTime(service.lastCheckedAt) }}</dd>
            </div>
          </dl>
          <p v-if="service.lastError" class="service-health-error">{{ service.lastError }}</p>
          <div class="service-health-card__footer">
            <span v-if="serviceSilenced(service)">已静默至 {{ formatTime(service.silencedUntil) }}</span>
            <span v-else-if="service.healthState === 'pending'">
              连续异常 {{ service.consecutiveFailures }}/2
            </span>
            <span v-else>自动检查与恢复通知已启用</span>
            <el-button
              v-if="!serviceSilenced(service)"
              link
              type="warning"
              @click="silenceServiceHealth(service, 60)"
            >
              静默 1 小时
            </el-button>
            <el-button
              v-else
              link
              type="success"
              @click="silenceServiceHealth(service, 0)"
            >
              解除静默
            </el-button>
          </div>
        </article>
      </div>
      <el-empty v-else description="暂无已安装的受管组件" :image-size="72" />
    </div>

    <div class="trend-panel">
      <div class="panel-heading">
        <div>
          <h3>最近 24 小时趋势</h3>
          <span>保留原始分钟级样本；CPU、内存、根分区共用百分比坐标。</span>
        </div>
        <span>网络接收 {{ formatRate(summary.latest?.networkReceiveBps) }} · 发送 {{ formatRate(summary.latest?.networkSendBps) }}</span>
      </div>
      <div v-if="metrics.length" class="chart-wrap">
        <BasicChart :option="trendOption" :on-init="initTrend" />
      </div>
      <el-empty v-else description="正在等待第一条监控样本" />
    </div>

    <div class="history-panel" v-loading="historyLoading">
      <div class="history-panel__heading">
        <div>
          <h3>历史样本</h3>
          <span>
            聚合粒度 {{ formatDuration(historyData.range.bucketSeconds) }} ·
            原始样本 {{ historyData.range.sampleCount }} ·
            趋势点 {{ historyData.range.bucketCount }}
          </span>
        </div>
        <div class="history-controls">
          <el-button-group>
            <el-button
              v-for="preset in historyRangePresets"
              :key="preset.label"
              :disabled="historyLoading || !canReadMonitorHistory"
              @click="applyHistoryPreset(preset.hours)"
            >
              {{ preset.label }}
            </el-button>
          </el-button-group>
          <el-date-picker
            v-model="historyTimeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            :clearable="false"
            :disabled="historyLoading || !canReadMonitorHistory"
          />
          <el-button
            type="primary"
            :loading="historyLoading"
            :disabled="!canReadMonitorHistory"
            @click="loadMonitorHistory"
          >
            查询
          </el-button>
        </div>
      </div>
      <el-alert
        v-if="!canReadMonitorHistory"
        title="当前账号暂无 monitoring.read 权限，不能查看监控历史样本"
        type="warning"
        :closable="false"
        show-icon
      />
      <div v-else-if="historyData.series.length" class="history-grid">
        <article
          v-for="group in historyGroups"
          :key="group.key"
          class="history-card"
        >
          <div class="history-card__header">
            <div>
              <h4>{{ group.label }}</h4>
              <span>{{ group.description }}</span>
            </div>
            <el-tag size="small" effect="light">
              {{ groupedHistorySeries[group.key].length }} 项
            </el-tag>
          </div>
          <div v-if="groupedHistorySeries[group.key].length" class="history-chart">
            <BasicChart :option="historyChartOptions[group.key]" />
          </div>
          <el-empty v-else description="该分组暂无样本" :image-size="58" />
        </article>
      </div>
      <el-empty v-else description="当前时间范围内暂无历史样本" />
    </div>

    <div class="management-panel">
      <el-tabs v-model="activeTab" @tab-change="refreshCurrentTab">
        <el-tab-pane name="rules">
          <template #label>告警规则（{{ summary.enabledRules }}/{{ summary.ruleCount }}）</template>
          <div class="toolbar">
            <span>修改阈值或条件会重置该规则当前状态，防止沿用过期判断。</span>
            <el-button type="primary" @click="openCreateRule">新建规则</el-button>
          </div>
          <el-table v-loading="tableLoading" :data="rules" border row-key="id">
            <el-table-column prop="name" label="规则" min-width="180" />
            <el-table-column label="指标与阈值" min-width="190">
              <template #default="{ row }">
                {{ metricLabel(row.metric) }} {{ operatorLabel(row.operator) }}
                {{ metricValue(row.metric, row.threshold) }}
              </template>
            </el-table-column>
            <el-table-column label="恢复阈值" min-width="120">
              <template #default="{ row }">{{ metricValue(row.metric, row.recoveryThreshold) }}</template>
            </el-table-column>
            <el-table-column label="状态" width="105" align="center">
              <template #default="{ row }">
                <el-tag :type="stateType(row)" size="small">{{ stateLabel(row) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="当前值" min-width="115">
              <template #default="{ row }">
                {{ row.lastEvaluatedAt ? metricValue(row.metric, row.lastValue) : '尚未评估' }}
              </template>
            </el-table-column>
            <el-table-column label="策略" min-width="180">
              <template #default="{ row }">
                连续 {{ row.consecutiveSamples }} 次 · {{ row.cooldownMinutes }} 分钟提醒
              </template>
            </el-table-column>
            <el-table-column label="级别" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="severityType(row.severity)" size="small">{{ row.severity }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="静默" min-width="170">
              <template #default="{ row }">
                <span v-if="isSilenced(row)">至 {{ formatTime(row.silencedUntil) }}</span>
                <span v-else>未静默</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="270" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="openEditRule(row)">编辑</el-button>
                <el-button v-if="!isSilenced(row)" link type="warning" @click="silenceRule(row, 60)">静默 1 小时</el-button>
                <el-button v-else link type="success" @click="silenceRule(row, 0)">解除静默</el-button>
                <el-button link type="danger" @click="deleteRule(row)">删除</el-button>
              </template>
            </el-table-column>
            <template #empty><el-empty description="还没有告警规则" /></template>
          </el-table>
        </el-tab-pane>

        <el-tab-pane name="events" label="告警事件">
          <div class="filters">
            <el-select v-model="eventFilters.eventType" clearable placeholder="事件类型" @change="eventFilters.page = 1; loadEvents()">
              <el-option label="触发" value="triggered" />
              <el-option label="持续提醒" value="reminder" />
              <el-option label="恢复" value="resolved" />
            </el-select>
            <el-select v-model="eventFilters.severity" clearable placeholder="级别" @change="eventFilters.page = 1; loadEvents()">
              <el-option label="信息" value="info" />
              <el-option label="警告" value="warning" />
              <el-option label="严重" value="critical" />
            </el-select>
            <el-button @click="loadEvents">刷新</el-button>
          </div>
          <el-table v-loading="tableLoading" :data="events" border row-key="id">
            <el-table-column prop="occurredAt" label="发生时间" min-width="170">
              <template #default="{ row }">{{ formatTime(row.occurredAt) }}</template>
            </el-table-column>
            <el-table-column prop="ruleName" label="规则" min-width="180" />
            <el-table-column label="类型" width="105">
              <template #default="{ row }">
                <el-tag :type="row.eventType === 'resolved' ? 'success' : severityType(row.severity)" size="small">
                  {{ eventTypeLabel(row.eventType) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="指标" min-width="150">
              <template #default="{ row }">{{ metricLabel(row.metric) }}</template>
            </el-table-column>
            <el-table-column label="值 / 阈值" min-width="160">
              <template #default="{ row }">
                {{ metricValue(row.metric, row.value) }} / {{ metricValue(row.metric, row.threshold) }}
              </template>
            </el-table-column>
            <el-table-column prop="message" label="说明" min-width="280" show-overflow-tooltip />
            <template #empty><el-empty description="没有告警事件" /></template>
          </el-table>
          <div class="pagination">
            <el-pagination
              v-model:current-page="eventFilters.page"
              v-model:page-size="eventFilters.pageSize"
              background
              layout="total, sizes, prev, pager, next"
              :page-sizes="[20, 50, 100]"
              :total="eventTotal"
              @current-change="loadEvents"
              @size-change="eventFilters.page = 1; loadEvents()"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane name="channels" label="通知通道">
          <div class="toolbar">
            <span>仅允许公网 HTTPS Webhook；完整 URL 和签名密钥均加密存储且不会回显。</span>
            <el-button type="primary" @click="openCreateChannel">新建通道</el-button>
          </div>
          <el-table v-loading="tableLoading" :data="channels" border row-key="id">
            <el-table-column prop="name" label="名称" min-width="180" />
            <el-table-column prop="type" label="类型" width="110" />
            <el-table-column prop="targetHint" label="目标主机" min-width="200" />
            <el-table-column label="签名密钥" width="110">
              <template #default="{ row }">{{ row.hasSecret ? '已配置' : '未配置' }}</template>
            </el-table-column>
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="row.enabled ? 'success' : 'info'" size="small">{{ row.enabled ? '启用' : '停用' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="updatedAt" label="更新时间" min-width="170">
              <template #default="{ row }">{{ formatTime(row.updatedAt) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="testChannel(row)">测试</el-button>
                <el-button link type="primary" @click="openEditChannel(row)">编辑</el-button>
                <el-button link type="danger" @click="deleteChannel(row)">删除</el-button>
              </template>
            </el-table-column>
            <template #empty><el-empty description="还没有通知通道" /></template>
          </el-table>
        </el-tab-pane>

        <el-tab-pane name="deliveries" label="投递记录">
          <div class="filters">
            <el-select v-model="deliveryFilters.status" clearable placeholder="投递结果" @change="deliveryFilters.page = 1; loadDeliveries()">
              <el-option label="成功" value="success" />
              <el-option label="失败" value="failed" />
            </el-select>
            <el-button @click="loadDeliveries">刷新</el-button>
          </div>
          <el-table v-loading="tableLoading" :data="deliveries" border row-key="id">
            <el-table-column prop="attemptedAt" label="投递时间" min-width="180">
              <template #default="{ row }">{{ formatTime(row.attemptedAt) }}</template>
            </el-table-column>
            <el-table-column prop="eventId" label="事件 ID" width="110" />
            <el-table-column prop="channelName" label="通知通道" min-width="180" />
            <el-table-column label="结果" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'success' ? 'success' : 'danger'" size="small">
                  {{ row.status === 'success' ? '成功' : '失败' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="error" label="错误" min-width="300">
              <template #default="{ row }">{{ row.error || '—' }}</template>
            </el-table-column>
            <template #empty><el-empty description="没有通知投递记录" /></template>
          </el-table>
          <div class="pagination">
            <el-pagination
              v-model:current-page="deliveryFilters.page"
              v-model:page-size="deliveryFilters.pageSize"
              background
              layout="total, sizes, prev, pager, next"
              :page-sizes="[20, 50, 100]"
              :total="deliveryTotal"
              @current-change="loadDeliveries"
              @size-change="deliveryFilters.page = 1; loadDeliveries()"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-dialog
      v-model="ruleDialogVisible"
      :title="editingRuleID ? '编辑告警规则' : '新建告警规则'"
      width="620px"
      destroy-on-close
    >
      <el-form label-position="top">
        <el-form-item label="规则名称" required>
          <el-input v-model="ruleForm.name" maxlength="120" show-word-limit placeholder="例如：CPU 持续过高" />
        </el-form-item>
        <div class="form-grid">
          <el-form-item label="监控指标" required>
            <el-select v-model="ruleForm.metric">
              <el-option v-for="item in metricOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="比较条件" required>
            <el-select v-model="ruleForm.operator">
              <el-option label="大于" value="gt" />
              <el-option label="大于等于" value="gte" />
              <el-option label="小于" value="lt" />
              <el-option label="小于等于" value="lte" />
            </el-select>
          </el-form-item>
          <el-form-item label="触发阈值" required>
            <el-input-number v-model="ruleForm.threshold" :min="0" :precision="2" controls-position="right" />
          </el-form-item>
          <el-form-item label="恢复阈值" required>
            <el-input-number v-model="ruleForm.recoveryThreshold" :min="0" :precision="2" controls-position="right" />
          </el-form-item>
          <el-form-item label="连续采样次数" required>
            <el-input-number v-model="ruleForm.consecutiveSamples" :min="1" :max="60" controls-position="right" />
          </el-form-item>
          <el-form-item label="重复提醒间隔（分钟）" required>
            <el-input-number v-model="ruleForm.cooldownMinutes" :min="1" :max="10080" controls-position="right" />
          </el-form-item>
          <el-form-item label="告警级别" required>
            <el-select v-model="ruleForm.severity">
              <el-option label="信息" value="info" />
              <el-option label="警告" value="warning" />
              <el-option label="严重" value="critical" />
            </el-select>
          </el-form-item>
          <el-form-item label="启用规则">
            <el-switch v-model="ruleForm.enabled" />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="ruleDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingRule" @click="saveRule">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="channelDialogVisible"
      :title="editingChannelID ? '编辑通知通道' : '新建通知通道'"
      width="620px"
      destroy-on-close
    >
      <el-alert
        type="info"
        :closable="false"
        title="支持接入自建告警网关；目标必须为公网 HTTPS 地址，重定向和内网地址会被拒绝。"
      />
      <el-form label-position="top" class="channel-form">
        <el-form-item label="通道名称" required>
          <el-input v-model="channelForm.name" maxlength="120" show-word-limit />
        </el-form-item>
        <el-form-item label="Webhook URL" :required="!editingChannelID">
          <el-input v-model="channelForm.webhookUrl" type="password" show-password autocomplete="new-password"
            :placeholder="editingChannelID ? '留空保留现有 URL' : 'https://alerts.example.com/hooks/...'" />
        </el-form-item>
        <el-form-item label="HMAC-SHA256 签名密钥（可选）">
          <el-input v-model="channelForm.secret" type="password" show-password autocomplete="new-password"
            :placeholder="editingChannelID ? '留空保留现有密钥' : '用于验证 X-Oneinstack-Signature'" />
        </el-form-item>
        <el-form-item v-if="editingChannelID && editingChannelHasSecret" label="清除现有签名密钥">
          <el-switch v-model="channelForm.clearSecret" :disabled="Boolean(channelForm.secret)" />
        </el-form-item>
        <el-form-item label="启用通道">
          <el-switch v-model="channelForm.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="channelDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingChannel" @click="saveChannel">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="less">
.monitor-page {
  padding-bottom: 28px;
}

.page-heading, .panel-heading, .toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.page-heading {
  margin-bottom: 18px;

  h2 {
    margin: 0 0 6px;
    font-size: 24px;
    font-weight: 700;
    letter-spacing: -0.035em;
  }

  p {
    margin: 0;
    color: var(--text-tertiary);
    line-height: 1.6;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 14px;
}

.stat-card {
  min-height: 102px;
  padding: 18px 20px;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  background: var(--surface-card);
  box-shadow: var(--shadow-xs);
  display: flex;
  flex-direction: column;

  span, small { color: var(--text-tertiary); }

  strong {
    margin: 6px 0;
    font-size: 28px;
    line-height: 1;
  }

  &.warning strong { color: #d89532; }
  &.danger strong { color: #e25d5d; }
}

.service-health-panel, .trend-panel, .history-panel, .management-panel {
  padding: 20px;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  background: var(--surface-card);
  box-shadow: var(--shadow-xs);
}

.service-health-panel, .trend-panel, .history-panel {
  margin-bottom: 14px;
}

.service-health-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.service-health-card {
  padding: 16px;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  background: var(--surface-subtle);

  &.is-firing {
    border-color: color-mix(in srgb, var(--el-color-danger) 32%, var(--border-subtle));
    background: color-mix(in srgb, var(--el-color-danger) 5%, var(--surface-card));
  }

  &.is-pending {
    border-color: color-mix(in srgb, var(--el-color-warning) 32%, var(--border-subtle));
    background: color-mix(in srgb, var(--el-color-warning) 5%, var(--surface-card));
  }
}

.service-health-card__top,
.service-health-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.service-health-card__top {
  > div {
    min-width: 0;
  }

  strong {
    display: block;
    color: var(--text-primary);
    font-size: 15px;
  }

  span {
    display: block;
    margin-top: 3px;
    color: var(--text-tertiary);
    font-size: 11px;
  }
}

.service-health-card dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 16px;
  margin: 16px 0 0;

  div {
    min-width: 0;
  }

  dt {
    color: var(--text-placeholder);
    font-size: 10px;
  }

  dd {
    overflow: hidden;
    margin: 4px 0 0;
    color: var(--text-secondary);
    font-size: 12px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.service-health-error {
  margin: 14px 0 0;
  padding: 9px 10px;
  border-radius: 8px;
  color: var(--el-color-danger);
  background: color-mix(in srgb, var(--el-color-danger) 7%, var(--surface-card));
  font-size: 11px;
  line-height: 1.5;
}

.service-health-card__footer {
  min-height: 30px;
  margin-top: 13px;
  padding-top: 12px;
  border-top: 1px solid var(--border-subtle);
  color: var(--text-placeholder);
  font-size: 10px;
}

.panel-heading {
  color: var(--text-tertiary);

  h3 {
    margin: 0 0 4px;
    color: var(--text-primary);
    font-size: 17px;
  }
}

.chart-wrap {
  height: 330px;
  margin-top: 12px;
}

.history-panel__heading,
.history-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.history-panel__heading {
  margin-bottom: 16px;

  h3 {
    margin: 0 0 4px;
    color: var(--text-primary);
    font-size: 17px;
  }

  span {
    color: var(--text-tertiary);
    font-size: 12px;
  }
}

.history-controls {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 10px;

  :deep(.el-date-editor) {
    width: 360px;
  }
}

.history-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.history-card {
  min-width: 0;
  padding: 14px;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  background: var(--surface-subtle);
}

.history-card__header {
  min-height: 42px;
  margin-bottom: 10px;

  h4 {
    margin: 0 0 3px;
    color: var(--text-primary);
    font-size: 14px;
  }

  span {
    color: var(--text-tertiary);
    font-size: 11px;
  }
}

.history-chart {
  height: 260px;
}

.toolbar {
  margin-bottom: 16px;
  color: var(--text-tertiary);
}

.filters {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;

  :deep(.el-select) { width: 180px; }
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 18px;

  :deep(.el-select), :deep(.el-input-number) { width: 100%; }
}

.channel-form {
  margin-top: 18px;
}

@media (max-width: 1100px) {
  .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .panel-heading,
  .history-panel__heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .history-controls {
    justify-content: flex-start;
    width: 100%;
  }
}

@media (max-width: 760px) {
  .page-heading, .toolbar { align-items: flex-start; flex-direction: column; }
  .stats-grid, .service-health-grid, .history-grid, .form-grid { grid-template-columns: 1fr; }
  .service-health-panel, .trend-panel, .history-panel, .management-panel { padding: 12px; }
  .filters { flex-wrap: wrap; }

  .history-controls {
    :deep(.el-button-group),
    :deep(.el-date-editor),
    .el-button {
      width: 100%;
    }
  }
}
</style>
