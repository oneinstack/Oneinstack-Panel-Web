<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import type { EChartsOption, EChartsType } from 'echarts'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Bell, Delete, EditPen } from '@element-plus/icons-vue'
import { Api } from '@/api/modules'
import BasicChart from '@/components/echarts/basic-chart.vue'
import { useAppStore } from '@/stores/modules/app'
import { useConfigStore } from '@/stores/modules/config';
import i18n from '@/lang'
import type { ColumnItem } from '@/components/custom-table.vue'

const sapp = useAppStore()
const sconfig = useConfigStore()

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

const t = (key: string, fallback?: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params)
  return value && value !== key ? value : fallback || key
}

const metricOptions = computed(() => [
  { value: 'cpu', label: t('monitor.cpuUsage', 'CPU usage'), unit: '%' },
  { value: 'memory', label: t('monitor.memoryUsage', 'Memory usage'), unit: '%' },
  { value: 'disk', label: t('monitor.diskUsage', 'Root partition usage'), unit: '%' },
  { value: 'load1', label: t('monitor.load1', '1-minute load'), unit: '' },
  { value: 'network_receive', label: t('monitor.networkReceiveRate', 'Network receive rate'), unit: 'B/s' },
  { value: 'network_send', label: t('monitor.networkSendRate', 'Network send rate'), unit: 'B/s' },
  { value: 'disk_read', label: t('monitor.diskReadRate', 'Disk read rate'), unit: 'B/s' },
  { value: 'disk_write', label: t('monitor.diskWriteRate', 'Disk write rate'), unit: 'B/s' }
])

const historyGroups = computed<Array<{
  key: MonitorHistoryGroup
  label: string
  description: string
}>>(() => [
  { key: 'cpu', label: 'CPU', description: t('monitor.history.cpuDescription', 'Processor usage trend') },
  { key: 'memory', label: t('monitor.memory', 'Memory'), description: t('monitor.history.memoryDescription', 'Memory usage trend') },
  { key: 'load', label: t('monitor.load', 'Load'), description: t('monitor.history.loadDescription', '1 / 5 / 15 minute system load') },
  { key: 'network', label: t('monitor.network', 'Network'), description: t('monitor.history.networkDescription', 'Receive and send throughput') },
  { key: 'disk', label: t('monitor.disk', 'Disk'), description: t('monitor.history.diskDescription', 'Root partition and disk I/O trend') }
])

const historyRangePresets = computed(() => [
  { label: t('monitor.timeRanges.1h', '1 hour'), hours: 1 },
  { label: t('monitor.timeRanges.6h', '6 hours'), hours: 6 },
  { label: t('monitor.timeRanges.24h', '24 hours'), hours: 24 },
  { label: t('monitor.timeRanges.7d', '7 days'), hours: 24 * 7 },
  { label: t('monitor.timeRanges.30d', '30 days'), hours: 24 * 30 }
])

const chartTheme = computed(() => {
  const isDark = sapp.theme === 'dark'
  return {
    textPrimary: isDark ? '#f8fafc' : '#334155',
    textSecondary: isDark ? '#cbd5e1' : '#475569',
    textMuted: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? '#334155' : '#cbd5e1',
    tooltipBackground: isDark ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 0.98)',
    tooltipBorder: isDark ? '#334155' : '#cbd5e1'
  }
})

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
const ruleColumns = computed<ColumnItem<MonitorRule>[]>(() => [
  { prop: 'name', label: t('monitor.rule'), minWidth: 180 },
  { prop: 'metricThreshold', label: t('monitor.metricAndThreshold'), minWidth: 190, slot: 'metricThreshold' },
  { prop: 'recoveryThreshold', label: t('monitor.recoveryThreshold'), minWidth: 120, slot: 'recoveryThreshold' },
  { prop: 'state', label: t('common.status'), width: 105, align: 'center', slot: 'state' },
  { prop: 'lastValue', label: t('monitor.currentValue'), minWidth: 115, slot: 'lastValue' },
  { prop: 'strategy', label: t('monitor.strategy'), minWidth: 180, slot: 'strategy' },
  { prop: 'severity', label: t('monitor.severity'), width: 90, align: 'center', slot: 'severity' },
  { prop: 'silencedUntil', label: t('monitor.silence'), minWidth: 170, slot: 'silencedUntil' },
  { prop: 'actionColumn', label: t('common.action'), width: 270, fixed: 'right', slot: 'actionColumn', className: 'table-action-column' }
])
const eventColumns = computed<ColumnItem<AlertEvent>[]>(() => [
  { prop: 'occurredAt', label: t('monitor.occurredAt'), minWidth: 170, slot: 'occurredAt' },
  { prop: 'ruleName', label: t('monitor.rule'), minWidth: 180 },
  { prop: 'eventType', label: t('common.type'), width: 105, slot: 'eventType' },
  { prop: 'metric', label: t('monitor.metric'), minWidth: 150, slot: 'metric' },
  { prop: 'valueThreshold', label: t('monitor.valueThreshold'), minWidth: 160, slot: 'valueThreshold' },
  { prop: 'message', label: t('common.description'), minWidth: 280, showOverflowTooltip: true }
])
const channelColumns = computed<ColumnItem<NotificationChannel>[]>(() => [
  { prop: 'name', label: t('common.name'), minWidth: 180 },
  { prop: 'type', label: t('common.type'), width: 110 },
  { prop: 'targetHint', label: t('monitor.targetHost'), minWidth: 200 },
  { prop: 'hasSecret', label: t('monitor.signingSecret'), width: 110, slot: 'hasSecret' },
  { prop: 'enabled', label: t('common.status'), width: 90, slot: 'enabled' },
  { prop: 'updatedAt', label: t('monitor.updatedAt'), minWidth: 170, slot: 'updatedAt' },
  { prop: 'actionColumn', label: t('common.action'), width: 200, fixed: 'right', slot: 'actionColumn', className: 'table-action-column' }
])
const deliveryColumns = computed<ColumnItem<NotificationDelivery>[]>(() => [
  { prop: 'attemptedAt', label: t('monitor.deliveryTime'), minWidth: 180, slot: 'attemptedAt' },
  { prop: 'eventId', label: t('monitor.eventId'), width: 110 },
  { prop: 'channelName', label: t('monitor.channels'), minWidth: 180 },
  { prop: 'status', label: t('monitor.result'), width: 100, slot: 'status' },
  { prop: 'error', label: t('monitor.error'), minWidth: 300, slot: 'error' }
])

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
  color: ['#60a5fa', '#4ade80', '#fbbf24', '#fb7185'],
  tooltip: {
    trigger: 'axis',
    backgroundColor: chartTheme.value.tooltipBackground,
    borderColor: chartTheme.value.tooltipBorder,
    textStyle: { color: chartTheme.value.textPrimary },
    axisPointer: {
      type: 'line',
      lineStyle: { color: chartTheme.value.border }
    }
  },
  legend: {
    data: ['CPU', t('monitor.memory', 'Memory'), t('monitor.rootPartition', 'Root partition'), t('monitor.load1', '1-minute load')],
    textStyle: { color: chartTheme.value.textSecondary },
    inactiveColor: chartTheme.value.textMuted
  },
  grid: { left: 48, right: 24, top: 48, bottom: 40 },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    axisLabel: { color: chartTheme.value.textMuted },
    axisLine: { lineStyle: { color: chartTheme.value.border } },
    axisTick: { lineStyle: { color: chartTheme.value.border } },
    data: metrics.value.map((item) => new Date(item.capturedAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    }))
  },
  yAxis: [
    {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: { formatter: '{value}%', color: chartTheme.value.textMuted },
      axisLine: { lineStyle: { color: chartTheme.value.border } },
      axisTick: { lineStyle: { color: chartTheme.value.border } },
      splitLine: { lineStyle: { color: chartTheme.value.border, opacity: 0.55 } }
    },
    {
      type: 'value',
      min: 0,
      position: 'right',
      name: t('monitor.load', 'Load'),
      nameTextStyle: { color: chartTheme.value.textMuted },
      axisLabel: { color: chartTheme.value.textMuted },
      axisLine: { lineStyle: { color: chartTheme.value.border } },
      axisTick: { lineStyle: { color: chartTheme.value.border } }
    }
  ],
  series: [
    { name: 'CPU', type: 'line', smooth: true, showSymbol: false, data: metrics.value.map((item) => item.cpuPercent) },
    { name: t('monitor.memory', 'Memory'), type: 'line', smooth: true, showSymbol: false, data: metrics.value.map((item) => item.memoryPercent) },
    { name: t('monitor.rootPartition', 'Root partition'), type: 'line', smooth: true, showSymbol: false, data: metrics.value.map((item) => item.diskPercent) },
    { name: t('monitor.load1', '1-minute load'), type: 'line', smooth: true, showSymbol: false, yAxisIndex: 1, data: metrics.value.map((item) => item.load1) }
  ]
}))

const groupedHistorySeries = computed(() => {
  const groups = Object.fromEntries(
    historyGroups.value.map((group) => [group.key, [] as MonitorHistorySeries[]])
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
  return Object.fromEntries(historyGroups.value.map((group) => {
    const seriesList = groupedHistorySeries.value[group.key]
    const hasPercent = seriesList.some((series) => series.unit === '%')
    const hasRate = seriesList.some((series) => series.unit === 'B/s')
    const yAxis = []
    if (hasPercent) {
      yAxis.push({
        type: 'value',
        min: 0,
        max: 100,
        axisLabel: { formatter: '{value}%', color: chartTheme.value.textMuted },
        axisLine: { lineStyle: { color: chartTheme.value.border } },
        axisTick: { lineStyle: { color: chartTheme.value.border } },
        splitLine: { lineStyle: { color: chartTheme.value.border, opacity: 0.55 } },
        nameTextStyle: { color: chartTheme.value.textMuted }
      })
    }
    if (hasRate) {
      yAxis.push({
        type: 'value',
        position: hasPercent ? 'right' : 'left',
        axisLabel: { formatter: (value: number) => formatRate(value).replace('/s', ''), color: chartTheme.value.textMuted },
        axisLine: { lineStyle: { color: chartTheme.value.border } },
        axisTick: { lineStyle: { color: chartTheme.value.border } },
        splitLine: { lineStyle: { color: chartTheme.value.border, opacity: 0.55 } },
        nameTextStyle: { color: chartTheme.value.textMuted }
      })
    }
    if (!yAxis.length) {
      yAxis.push({
        type: 'value',
        min: 0,
        axisLabel: { color: chartTheme.value.textMuted },
        axisLine: { lineStyle: { color: chartTheme.value.border } },
        axisTick: { lineStyle: { color: chartTheme.value.border } },
        splitLine: { lineStyle: { color: chartTheme.value.border, opacity: 0.55 } },
        nameTextStyle: { color: chartTheme.value.textMuted }
      })
    }

    return [group.key, {
      tooltip: {
        trigger: 'axis',
        backgroundColor: chartTheme.value.tooltipBackground,
        borderColor: chartTheme.value.tooltipBorder,
        textStyle: { color: chartTheme.value.textPrimary },
        axisPointer: {
          type: 'line',
          lineStyle: { color: chartTheme.value.border }
        },
        valueFormatter: (value: unknown) => {
          const numeric = Number(value)
          return Number.isFinite(numeric) ? numeric.toFixed(2) : String(value)
        }
      },
      legend: {
        top: 0,
        type: 'scroll',
        data: seriesList.map((series) => series.label),
        textStyle: { color: chartTheme.value.textSecondary },
        inactiveColor: chartTheme.value.textMuted
      },
      grid: { left: 48, right: hasPercent && hasRate ? 58 : 24, top: 44, bottom: 34 },
      xAxis: {
        type: 'time',
        axisLabel: { color: chartTheme.value.textMuted },
        axisLine: { lineStyle: { color: chartTheme.value.border } },
        axisTick: { lineStyle: { color: chartTheme.value.border } }
      },
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
const metricMeta = (metric: string) => metricOptions.value.find((item) => item.value === metric)
const formatDuration = (seconds?: number) => {
  if (!Number.isFinite(seconds)) return '—'
  const value = Number(seconds)
  if (value < 60) return t('monitor.duration.seconds', '{value} seconds', { value })
  if (value < 3600) return t('monitor.duration.minutes', '{value} minutes', { value: Math.round(value / 60) })
  return t('monitor.duration.hours', '{value} hours', { value: (value / 3600).toFixed(value % 3600 === 0 ? 0 : 1) })
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
  metric === 'service_health' ? t('monitor.serviceHealth', 'Component service health') : (metricMeta(metric)?.label || metric)
const metricValue = (metric: string, value: number) => {
  if (metric === 'service_health') return value >= 1 ? t('monitor.normalState', 'Normal') : t('monitor.abnormal', 'Abnormal')
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
  triggered: t('monitor.eventTypes.triggered', 'Triggered'),
  reminder: t('monitor.eventTypes.reminder', 'Reminder'),
  resolved: t('monitor.eventTypes.resolved', 'Resolved')
}[type] || type)
const stateLabel = (rule: MonitorRule) => {
  if (!rule.enabled) return t('monitor.disabledState', 'Disabled')
  if (rule.state === 'firing') return t('monitor.firing', 'Firing')
  if (rule.state === 'pending') return t('monitor.pendingConfirm', 'Pending')
  return t('monitor.normalState', 'Normal')
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
  if (service.busy) return t('monitor.operating', 'Operating')
  if (service.healthState === 'firing') return t('monitor.abnormal', 'Abnormal')
  if (service.healthState === 'pending') return t('monitor.pendingConfirm', 'Pending')
  if (service.serviceState === 'running') return t('monitor.runningNormally', 'Running normally')
  return t('monitor.unknownState', 'Unknown')
}
const serviceStateType = (service: ComponentHealthState) => {
  if (service.busy) return 'info'
  if (service.healthState === 'firing') return 'danger'
  if (service.healthState === 'pending') return 'warning'
  return 'success'
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
    ElMessage.success(t('monitor.messages.serviceHealthChecked', 'Component service health check completed'))
  } finally {
    serviceChecking.value = false
  }
}

const silenceServiceHealth = async (service: ComponentHealthState, minutes: number) => {
  await Api.silenceMonitorServiceHealth(service.component, minutes)
  ElMessage.success(minutes ? t('monitor.messages.serviceSilenced', '{name} alerts silenced for 1 hour', { name: service.displayName }) : t('monitor.messages.serviceSilenceCleared', 'Component alert silence cleared'))
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
    ElMessage.warning(t('monitor.messages.inputRuleName', 'Enter a rule name'))
    return
  }
  if ((ruleForm.operator === 'gt' || ruleForm.operator === 'gte') &&
    ruleForm.recoveryThreshold >= ruleForm.threshold) {
    ElMessage.warning(t('monitor.messages.greaterRecoveryThresholdInvalid', 'Recovery threshold must be lower than trigger threshold for greater-than rules'))
    return
  }
  if ((ruleForm.operator === 'lt' || ruleForm.operator === 'lte') &&
    ruleForm.recoveryThreshold <= ruleForm.threshold) {
    ElMessage.warning(t('monitor.messages.lessRecoveryThresholdInvalid', 'Recovery threshold must be higher than trigger threshold for less-than rules'))
    return
  }
  savingRule.value = true
  try {
    if (editingRuleID.value) await Api.updateMonitorRule(editingRuleID.value, { ...ruleForm })
    else await Api.createMonitorRule({ ...ruleForm })
    ElMessage.success(editingRuleID.value ? t('monitor.messages.ruleUpdated', 'Alert rule updated') : t('monitor.messages.ruleCreated', 'Alert rule created'))
    ruleDialogVisible.value = false
    await Promise.all([loadRules(), loadDashboard()])
  } finally {
    savingRule.value = false
  }
}

const deleteRule = async (rule: MonitorRule) => {
  await ElMessageBox.confirm(
    t('monitor.deleteRuleConfirmMessage', 'Delete rule "{name}"? Historical alert events will be retained.', { name: rule.name }),
    t('monitor.deleteRule', 'Delete alert rule'),
    { type: 'warning', confirmButtonText: t('common.delete', 'Delete'), cancelButtonText: t('common.cancel', 'Cancel') }
  )
  await Api.deleteMonitorRule(rule.id)
  ElMessage.success(t('monitor.messages.ruleDeleted', 'Alert rule deleted'))
  await Promise.all([loadRules(), loadDashboard()])
}

const silenceRule = async (rule: MonitorRule, minutes: number) => {
  await Api.silenceMonitorRule(rule.id, minutes)
  ElMessage.success(minutes ? t('monitor.messages.ruleSilenced', 'Rule silenced for 1 hour') : t('monitor.messages.ruleSilenceCleared', 'Rule silence cleared'))
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
    ElMessage.warning(t('monitor.messages.inputChannelName', 'Enter a channel name'))
    return
  }
  if (!editingChannelID.value && !channelForm.webhookUrl.trim()) {
    ElMessage.warning(t('monitor.messages.webhookRequired', 'Webhook URL is required for new channels'))
    return
  }
  savingChannel.value = true
  try {
    if (editingChannelID.value) {
      await Api.updateMonitorChannel(editingChannelID.value, { ...channelForm })
    } else {
      await Api.createMonitorChannel({ ...channelForm })
    }
    ElMessage.success(editingChannelID.value ? t('monitor.messages.channelUpdated', 'Notification channel updated') : t('monitor.messages.channelCreated', 'Notification channel created'))
    channelDialogVisible.value = false
    await loadChannels()
  } finally {
    savingChannel.value = false
  }
}

const testChannel = async (channel: NotificationChannel) => {
  await Api.testMonitorChannel(channel.id)
  ElMessage.success(t('monitor.messages.testSent', 'Test notification sent'))
}

const deleteChannel = async (channel: NotificationChannel) => {
  await ElMessageBox.confirm(
    t('monitor.deleteChannelConfirmMessage', 'Delete notification channel "{name}"?', { name: channel.name }),
    t('monitor.deleteChannel', 'Delete notification channel'),
    { type: 'warning', confirmButtonText: t('common.delete', 'Delete'), cancelButtonText: t('common.cancel', 'Cancel') }
  )
  await Api.deleteMonitorChannel(channel.id)
  ElMessage.success(t('monitor.messages.channelDeleted', 'Notification channel deleted'))
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
        <h2>{{ $t('monitor.title') }}</h2>
        <p>{{ $t('monitor.pageDescription') }}</p>
      </div>
      <el-button class="page-heading__action" type="primary" :loading="dashboardLoading" @click="refreshAll">{{ $t('monitor.refreshData') }}</el-button>
    </div>

    <div class="stats-grid" v-loading="dashboardLoading">
      <div class="stat-card">
        <span>{{ $t('monitor.cpuUsage') }}</span>
        <strong>{{ formatPercent(summary.latest?.cpuPercent) }}</strong>
        <small>{{ $t('monitor.oneMinuteLoadValue', { value: summary.latest ? summary.latest.load1.toFixed(2) : '—' }) }}</small>
      </div>
      <div class="stat-card">
        <span>{{ $t('monitor.memoryUsage') }}</span>
        <strong>{{ formatPercent(summary.latest?.memoryPercent) }}</strong>
        <small>{{ $t('monitor.collectedAt', { time: formatTime(summary.latest?.capturedAt) }) }}</small>
      </div>
      <div class="stat-card warning">
        <span>{{ $t('monitor.diskUsage') }}</span>
        <strong>{{ formatPercent(summary.latest?.diskPercent) }}</strong>
        <small>{{ $t('monitor.writeRateValue', { value: formatRate(summary.latest?.diskWriteBps) }) }}</small>
      </div>
      <div class="stat-card danger">
        <span>{{ $t('monitor.currentAlerts') }}</span>
        <strong>{{ totalFiring }}</strong>
        <small>{{ $t('monitor.pendingAnd24hEvents', { pending: totalPending, events: summary.last24Hours }) }}</small>
      </div>
    </div>

    <div class="service-health-panel">
      <div class="panel-heading">
        <div>
          <h3>{{ $t('monitor.serviceHealth') }}</h3>
          <span>{{ $t('monitor.serviceHealthDescription') }}</span>
        </div>
        <el-button :loading="serviceChecking" @click="checkServiceHealth">{{ $t('monitor.checkNow') }}</el-button>
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
            <el-tag class="service-status-tag" :type="serviceStateType(service)" effect="light" size="small">
              {{ serviceStateLabel(service) }}
            </el-tag>
          </div>
          <dl>
            <div>
              <dt>{{ $t('monitor.installedVersion') }}</dt>
              <dd>{{ service.softwareVersion || '—' }}</dd>
            </div>
            <div>
              <dt>{{ $t('monitor.runtimeVersion') }}</dt>
              <dd>{{ service.runtimeVersion || '—' }}</dd>
            </div>
            <div>
              <dt>systemd</dt>
              <dd>{{ service.activeState || service.serviceState }}</dd>
            </div>
            <div>
              <dt>{{ $t('monitor.lastChecked') }}</dt>
              <dd>{{ formatTime(service.lastCheckedAt) }}</dd>
            </div>
          </dl>
          <p v-if="service.lastError" class="service-health-error">{{ service.lastError }}</p>
          <div class="service-health-card__footer">
            <span v-if="serviceSilenced(service)">{{ $t('monitor.silencedUntil', { time: formatTime(service.silencedUntil) }) }}</span>
            <span v-else-if="service.healthState === 'pending'">
              {{ $t('monitor.consecutiveFailures', { count: service.consecutiveFailures }) }}
            </span>
            <span v-else>{{ $t('monitor.autoCheckEnabled') }}</span>
            <el-button
              v-if="!serviceSilenced(service)"
              link
              type="warning"
              @click="silenceServiceHealth(service, 60)"
            >
              {{ $t('monitor.silenceOneHour') }}
            </el-button>
            <el-button
              v-else
              link
              type="success"
              @click="silenceServiceHealth(service, 0)"
            >
              {{ $t('monitor.unsilence') }}
            </el-button>
          </div>
        </article>
      </div>
      <el-empty v-else :description="$t('monitor.noManagedComponents')" :image-size="72" />
    </div>

    <div class="trend-panel">
      <div class="panel-heading">
        <div>
          <h3>{{ $t('monitor.last24hTrend') }}</h3>
          <span>{{ $t('monitor.rawSamplesHint') }}</span>
        </div>
        <span>{{ $t('monitor.networkRates', { receive: formatRate(summary.latest?.networkReceiveBps), send: formatRate(summary.latest?.networkSendBps) }) }}</span>
      </div>
      <div v-if="metrics.length" class="chart-wrap">
        <BasicChart :option="trendOption" :on-init="initTrend" />
      </div>
      <el-empty v-else :description="$t('monitor.waitingSample')" />
    </div>

    <div class="history-panel" v-loading="historyLoading">
      <div class="history-panel__heading">
        <div>
          <h3>{{ $t('monitor.historySamples') }}</h3>
          <span>
            {{ $t('monitor.historySummary', {
              bucket: formatDuration(historyData.range.bucketSeconds),
              samples: historyData.range.sampleCount,
              points: historyData.range.bucketCount
            }) }}
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
            class="history-controls__date-range"
            type="datetimerange"
            :range-separator="$t('monitor.to')"
            :start-placeholder="$t('monitor.startTime')"
            :end-placeholder="$t('monitor.endTime')"
            :clearable="false"
            :disabled="historyLoading || !canReadMonitorHistory"
          />
          <el-button
            type="primary"
            :loading="historyLoading"
            :disabled="!canReadMonitorHistory"
            @click="loadMonitorHistory"
          >
            {{ $t('common.query') }}
          </el-button>
        </div>
      </div>
      <el-alert
        v-if="!canReadMonitorHistory"
        :title="$t('monitor.noReadPermission')"
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
            <el-tag class="history-count-tag" size="small" effect="light">
              {{ $t('monitor.itemCount', { count: groupedHistorySeries[group.key].length }) }}
            </el-tag>
          </div>
          <div v-if="groupedHistorySeries[group.key].length" class="history-chart">
            <BasicChart :option="historyChartOptions[group.key]" />
          </div>
          <el-empty v-else :description="$t('monitor.noGroupSamples')" :image-size="58" />
        </article>
      </div>
      <el-empty v-else :description="$t('monitor.noHistorySamples')" />
    </div>

    <div class="management-panel">
      <el-tabs v-model="activeTab" @tab-change="refreshCurrentTab">
        <el-tab-pane name="rules">
          <template #label>{{ $t('monitor.rulesTabLabel', { enabled: summary.enabledRules, total: summary.ruleCount }) }}</template>
          <div class="toolbar">
            <span>{{ $t('monitor.ruleResetHint') }}</span>
            <el-button type="primary" @click="openCreateRule">{{ $t('monitor.createRuleShort') }}</el-button>
          </div>
          <custom-table v-loading="tableLoading" :data="rules" :columns="ruleColumns" :pagination="false" border row-key="id">
            <template #metricThreshold="{ row }">
                {{ metricLabel(row.metric) }} {{ operatorLabel(row.operator) }}
                {{ metricValue(row.metric, row.threshold) }}
            </template>
            <template #recoveryThreshold="{ row }">{{ metricValue(row.metric, row.recoveryThreshold) }}</template>
            <template #state="{ row }">
                <el-tag :type="stateType(row)" size="small">{{ stateLabel(row) }}</el-tag>
            </template>
            <template #lastValue="{ row }">
                {{ row.lastEvaluatedAt ? metricValue(row.metric, row.lastValue) : $t('monitor.notEvaluated') }}
            </template>
            <template #strategy="{ row }">
                {{ $t('monitor.strategyValue', { samples: row.consecutiveSamples, minutes: row.cooldownMinutes }) }}
            </template>
            <template #severity="{ row }">
                <el-tag :type="severityType(row.severity)" size="small">{{ row.severity }}</el-tag>
            </template>
            <template #silencedUntil="{ row }">
                <span v-if="isSilenced(row)">{{ $t('monitor.untilTime', { time: formatTime(row.silencedUntil) }) }}</span>
                <span v-else>{{ $t('monitor.notSilenced') }}</span>
            </template>
            <template #actionColumn="{ row }">
                <div class="table-row-actions">
                  <el-button link type="primary" :icon="EditPen" @click="openEditRule(row)">{{ $t('common.edit') }}</el-button>
                  <el-button v-if="!isSilenced(row)" link type="warning" :icon="Bell" @click="silenceRule(row, 60)">{{ $t('monitor.silenceOneHour') }}</el-button>
                  <el-button v-else link type="success" :icon="Bell" @click="silenceRule(row, 0)">{{ $t('monitor.unsilence') }}</el-button>
                  <el-button link type="danger" :icon="Delete" @click="deleteRule(row)">{{ $t('common.delete') }}</el-button>
                </div>
            </template>
            <template #empty><el-empty :description="$t('monitor.noRules')" /></template>
          </custom-table>
        </el-tab-pane>

        <el-tab-pane name="events" :label="$t('monitor.events')">
          <div class="filters">
            <el-select v-model="eventFilters.eventType" clearable :placeholder="$t('monitor.eventType')" @change="eventFilters.page = 1; loadEvents()">
              <el-option :label="$t('monitor.eventTypes.triggered')" value="triggered" />
              <el-option :label="$t('monitor.eventTypes.reminder')" value="reminder" />
              <el-option :label="$t('monitor.eventTypes.resolved')" value="resolved" />
            </el-select>
            <el-select v-model="eventFilters.severity" clearable :placeholder="$t('monitor.severity')" @change="eventFilters.page = 1; loadEvents()">
              <el-option :label="$t('monitor.severities.info')" value="info" />
              <el-option :label="$t('monitor.severities.warning')" value="warning" />
              <el-option :label="$t('monitor.severities.critical')" value="critical" />
            </el-select>
            <el-button @click="loadEvents">{{ $t('common.refresh') }}</el-button>
          </div>
          <custom-table v-loading="tableLoading" :data="events" :columns="eventColumns" :pagination="false" :auto-pagination="false" border row-key="id">
            <template #occurredAt="{ row }">{{ formatTime(row.occurredAt) }}</template>
            <template #eventType="{ row }">
                <el-tag :type="row.eventType === 'resolved' ? 'success' : severityType(row.severity)" size="small">
                  {{ eventTypeLabel(row.eventType) }}
                </el-tag>
            </template>
            <template #metric="{ row }">{{ metricLabel(row.metric) }}</template>
            <template #valueThreshold="{ row }">
                {{ metricValue(row.metric, row.value) }} / {{ metricValue(row.metric, row.threshold) }}
            </template>
            <template #empty><el-empty :description="$t('monitor.noEvents')" /></template>
          </custom-table>
          <div class="pagination">
            <el-pagination
              v-model:current-page="eventFilters.page"
              v-model:page-size="eventFilters.pageSize"
              background
              layout="total, sizes, prev, pager, next"
              :page-sizes="[10, 20, 50, 100]"
              :total="eventTotal"
              @current-change="loadEvents"
              @size-change="eventFilters.page = 1; loadEvents()"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane name="channels" :label="$t('monitor.channels')">
          <div class="toolbar">
            <span>{{ $t('monitor.channelSecurityHint') }}</span>
            <el-button type="primary" @click="openCreateChannel">{{ $t('monitor.createChannelShort') }}</el-button>
          </div>
          <custom-table v-loading="tableLoading" :data="channels" :columns="channelColumns" :pagination="false" border row-key="id">
            <template #hasSecret="{ row }">{{ row.hasSecret ? $t('common.enabled') : $t('common.disabled') }}</template>
            <template #enabled="{ row }">
                <el-tag :type="row.enabled ? 'success' : 'info'" size="small">{{ row.enabled ? $t('common.enabled') : $t('common.disabled') }}</el-tag>
            </template>
            <template #updatedAt="{ row }">{{ formatTime(row.updatedAt) }}</template>
            <template #actionColumn="{ row }">
                <div class="table-row-actions">
                  <el-button link type="primary" :icon="Bell" @click="testChannel(row)">{{ $t('monitor.test') }}</el-button>
                  <el-button link type="primary" :icon="EditPen" @click="openEditChannel(row)">{{ $t('common.edit') }}</el-button>
                  <el-button link type="danger" :icon="Delete" @click="deleteChannel(row)">{{ $t('common.delete') }}</el-button>
                </div>
            </template>
            <template #empty><el-empty :description="$t('monitor.noChannels')" /></template>
          </custom-table>
        </el-tab-pane>

        <el-tab-pane name="deliveries" :label="$t('monitor.deliveries')">
          <div class="filters">
            <el-select v-model="deliveryFilters.status" clearable :placeholder="$t('monitor.deliveryResult')" @change="deliveryFilters.page = 1; loadDeliveries()">
              <el-option :label="$t('common.success')" value="success" />
              <el-option :label="$t('common.failed')" value="failed" />
            </el-select>
            <el-button @click="loadDeliveries">{{ $t('common.refresh') }}</el-button>
          </div>
          <custom-table v-loading="tableLoading" :data="deliveries" :columns="deliveryColumns" :pagination="false" :auto-pagination="false" border row-key="id">
            <template #attemptedAt="{ row }">{{ formatTime(row.attemptedAt) }}</template>
            <template #status="{ row }">
                <el-tag :type="row.status === 'success' ? 'success' : 'danger'" size="small">
                  {{ row.status === 'success' ? $t('common.success') : $t('common.failed') }}
                </el-tag>
            </template>
            <template #error="{ row }">{{ row.error || '—' }}</template>
            <template #empty><el-empty :description="$t('monitor.noDeliveries')" /></template>
          </custom-table>
          <div class="pagination">
            <el-pagination
              v-model:current-page="deliveryFilters.page"
              v-model:page-size="deliveryFilters.pageSize"
              background
              layout="total, sizes, prev, pager, next"
              :page-sizes="[10, 20, 50, 100]"
              :total="deliveryTotal"
              @current-change="loadDeliveries"
              @size-change="deliveryFilters.page = 1; loadDeliveries()"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <custom-drawer
      :visible="ruleDialogVisible"
      :title="editingRuleID ? $t('monitor.editRule') : $t('monitor.createRule')"
      size="720px"
      :confirm-text="$t('common.save')"
      :loading="savingRule"
      destroy-on-close
      :on-close="() => { ruleDialogVisible = false }"
      :on-confirm="saveRule"
    >
      <el-form label-position="top" class="monitor-drawer-form">
        <el-form-item :label="$t('monitor.ruleName')" required>
          <el-input v-model="ruleForm.name" maxlength="120" show-word-limit :placeholder="$t('monitor.ruleNamePlaceholder')" />
        </el-form-item>
        <div class="form-grid">
          <el-form-item :label="$t('monitor.metric')" required>
            <el-select v-model="ruleForm.metric">
              <el-option v-for="item in metricOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('monitor.operator')" required>
            <el-select v-model="ruleForm.operator">
              <el-option :label="$t('monitor.operators.gt')" value="gt" />
              <el-option :label="$t('monitor.operators.gte')" value="gte" />
              <el-option :label="$t('monitor.operators.lt')" value="lt" />
              <el-option :label="$t('monitor.operators.lte')" value="lte" />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('monitor.triggerThreshold')" required>
            <el-input-number v-model="ruleForm.threshold" :min="0" :precision="2" controls-position="right" />
          </el-form-item>
          <el-form-item :label="$t('monitor.recoveryThreshold')" required>
            <el-input-number v-model="ruleForm.recoveryThreshold" :min="0" :precision="2" controls-position="right" />
          </el-form-item>
          <el-form-item :label="$t('monitor.consecutiveSamples')" required>
            <el-input-number v-model="ruleForm.consecutiveSamples" :min="1" :max="60" controls-position="right" />
          </el-form-item>
          <el-form-item :label="$t('monitor.cooldownMinutes')" required>
            <el-input-number v-model="ruleForm.cooldownMinutes" :min="1" :max="10080" controls-position="right" />
          </el-form-item>
          <el-form-item :label="$t('monitor.severity')" required>
            <el-select v-model="ruleForm.severity">
              <el-option :label="$t('monitor.severities.info')" value="info" />
              <el-option :label="$t('monitor.severities.warning')" value="warning" />
              <el-option :label="$t('monitor.severities.critical')" value="critical" />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('monitor.enableRule')">
            <el-switch v-model="ruleForm.enabled" />
          </el-form-item>
        </div>
      </el-form>
    </custom-drawer>

    <custom-drawer
      :visible="channelDialogVisible"
      :title="editingChannelID ? $t('monitor.editChannel') : $t('monitor.createChannel')"
      size="720px"
      :confirm-text="$t('common.save')"
      :loading="savingChannel"
      destroy-on-close
      :on-close="() => { channelDialogVisible = false }"
      :on-confirm="saveChannel"
    >
      <el-alert
        type="info"
        :closable="false"
        :title="$t('monitor.channelFormTip')"
      />
      <el-form label-position="top" class="channel-form monitor-drawer-form">
        <el-form-item :label="$t('monitor.channelName')" required>
          <el-input v-model="channelForm.name" maxlength="120" show-word-limit />
        </el-form-item>
        <el-form-item label="Webhook URL" :required="!editingChannelID">
          <el-input v-model="channelForm.webhookUrl" type="password" show-password autocomplete="new-password"
            :placeholder="editingChannelID ? $t('monitor.keepCurrentUrl') : 'https://alerts.example.com/hooks/...'" />
        </el-form-item>
        <el-form-item :label="$t('monitor.hmacSecretOptional')">
          <el-input v-model="channelForm.secret" type="password" show-password autocomplete="new-password"
            :placeholder="editingChannelID ? $t('monitor.keepCurrentSecret') : $t('monitor.signaturePlaceholder')" />
        </el-form-item>
        <el-form-item v-if="editingChannelID && editingChannelHasSecret" :label="$t('monitor.clearExistingSecret')">
          <el-switch v-model="channelForm.clearSecret" :disabled="Boolean(channelForm.secret)" />
        </el-form-item>
        <el-form-item :label="$t('monitor.enableChannel')">
          <el-switch v-model="channelForm.enabled" />
        </el-form-item>
      </el-form>
    </custom-drawer>
  </div>
</template>

<style scoped lang="less">
.monitor-page {
  min-height: 100%;
  padding-bottom: 28px;
}

.page-heading, .panel-heading, .toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.page-heading {
  margin-bottom: 18px;

  h2 {
    margin: 0;
    color: var(--text-primary);
    font-size: 22px;
    font-weight: 720;
  }

  p {
    margin-top: 6px;
    color: var(--text-tertiary);
    font-size: 13px;
    line-height: 1.6;
  }

  &__action {
    min-width: 108px;
    height: 40px;
    padding-inline: 18px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 650;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.stat-card {
  min-height: 92px;
  padding: 16px;
  border: 1px solid var(--border-subtle);
  border-radius: 15px;
  background: var(--surface-card);
  box-shadow: var(--shadow-xs);
  display: flex;
  flex-direction: column;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-3px);
    border-color: rgba(var(--primary-color), 0.26);
    box-shadow: var(--shadow-sm);
  }

  span, small {
    color: var(--text-tertiary);
  }

  span {
    font-size: 12px;
  }

  strong {
    display: block;
    margin: 10px 0 0;
    color: var(--text-primary);
    font-size: 26px;
    font-weight: 760;
  }

  small {
    margin-top: 8px;
    font-size: 12px;
    line-height: 1.5;
  }

  &.warning strong { color: var(--el-color-warning); }
  &.danger strong { color: var(--el-color-danger); }

  &.warning:hover {
    border-color: color-mix(in srgb, var(--el-color-warning) 28%, var(--border-subtle));
  }

  &.danger:hover {
    border-color: color-mix(in srgb, var(--el-color-danger) 28%, var(--border-subtle));
  }
}

.service-health-panel, .trend-panel, .history-panel, .management-panel {
  padding: 18px;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  background: var(--surface-card);
  box-shadow: var(--shadow-xs);
}

.service-health-panel, .trend-panel, .history-panel {
  margin-bottom: 18px;
}

.service-health-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.service-health-card {
  min-height: 244px;
  padding: 16px 18px 14px;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  background: var(--surface-card);
  box-shadow: var(--shadow-xs);
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;

  &:hover {
    border-color: color-mix(in srgb, rgb(var(--primary-color)) 24%, var(--border-subtle));
    box-shadow: var(--shadow-sm);
    transform: translateY(-1px);
  }

  &.is-normal {
    border-color: color-mix(in srgb, var(--el-color-success) 18%, var(--border-subtle));
  }

  &.is-firing {
    border-color: color-mix(in srgb, var(--el-color-danger) 32%, var(--border-subtle));
    background: color-mix(in srgb, var(--el-color-danger) 4%, var(--surface-card));
  }

  &.is-pending {
    border-color: color-mix(in srgb, var(--el-color-warning) 32%, var(--border-subtle));
    background: color-mix(in srgb, var(--el-color-warning) 4%, var(--surface-card));
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
    font-weight: 680;
  }

  span {
    display: block;
    margin-top: 4px;
    color: var(--text-tertiary);
    font-size: 12px;
  }

  :deep(.service-status-tag) {
    min-width: 52px;
    height: 26px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 10px;
    border-radius: 7px;
    font-size: 12px;
    font-weight: 650;
    line-height: 1;
  }

  :deep(.service-status-tag.el-tag--success) {
    // color: rgb(var(--success-color));
    color: var(--el-color-success) !important;
  }

  :deep(.service-status-tag.el-tag--warning) {
    color: var(--el-color-warning);
  }

  :deep(.service-status-tag.el-tag--danger) {
    color: var(--el-color-danger);
  }

  :deep(.service-status-tag.el-tag--info) {
    color: var(--text-tertiary);
  }
}

.service-health-card dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 17px 0 0;

  div {
    min-width: 0;
    padding: 12px 14px;
    border: 1px solid var(--border-subtle);
    border-radius: 12px;
    background: var(--surface-subtle);
  }

  dt {
    color: var(--text-placeholder);
    font-size: 11px;
  }

  dd {
    overflow: hidden;
    margin: 7px 0 0;
    color: var(--text-primary);
    font-size: 13px;
    font-weight: 650;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.service-health-error {
  min-height: 36px;
  margin-top: 16px;
  padding: 9px 12px;
  overflow: hidden;
  border-radius: 9px;
  color: var(--el-color-danger);
  background: color-mix(in srgb, var(--el-color-danger) 7%, var(--surface-card));
  font-size: 12px;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.service-health-card__footer {
  min-height: 50px;
  margin-top: 14px;
  padding: 9px 0 0;
  border-top: 1px solid var(--border-subtle);
  align-items: center;
  color: var(--text-placeholder);
  font-size: 11px;
  justify-content: space-between;
  background: transparent;

  :deep(.el-button.is-link) {
    height: 32px;
    padding: 0 10px;
    border-radius: 7px;
    font-weight: 600;
  }
}

.panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  color: var(--text-tertiary);

  h3 {
    margin: 0 0 4px;
    color: var(--text-primary);
    font-size: 16px;
    font-weight: 700;
  }

  span {
    font-size: 12px;
  }

  :deep(.el-button) {
    height: 40px;
    border-radius: 12px;
    font-weight: 650;
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
    font-weight: 700;
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

  &__date-range {
    width: min(560px, 100%);
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
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-3px);
    border-color: rgba(var(--primary-color), 0.22);
    box-shadow: var(--shadow-sm);
  }
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

  :deep(.history-count-tag) {
    height: 24px;
    padding: 0 8px;
    border-radius: 7px;
    font-size: 11px;
    font-weight: 650;
  }
}

.history-chart {
  height: 260px;
}

.toolbar {
  margin-bottom: 16px;
  color: var(--text-tertiary);
  font-size: 12px;

  :deep(.el-button) {
    min-width: 104px;
    height: 40px;
    border-radius: 12px;
    font-weight: 650;
  }
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

.monitor-drawer-form {
  max-width: 620px;
  padding: 26px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 24px;
  background:
    radial-gradient(circle at top right, rgba(var(--primary-color), 0.08), transparent 28%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.78),
    0 20px 46px rgba(15, 23, 42, 0.08);

  :deep(.el-form-item__label) {
    color: var(--text-primary);
    font-size: 15px;
    font-weight: 650;
    line-height: 1.4;
    margin-bottom: 10px;
  }

  :deep(.el-form-item) {
    margin-bottom: 22px;
  }

  :deep(.el-form-item.is-required:not(.is-no-asterisk) > .el-form-item__label::before) {
    color: #ef4444;
  }

  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper),
  :deep(.el-textarea__inner),
  :deep(.el-input-number .el-input__wrapper) {
    border: 1px solid rgba(148, 163, 184, 0.22);
    background: rgba(255, 255, 255, 0.96);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.9),
      0 1px 2px rgba(15, 23, 42, 0.04);
    transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
  }

  :deep(.el-input__wrapper.is-focus),
  :deep(.el-select__wrapper.is-focused),
  :deep(.el-input-number .el-input__wrapper.is-focus),
  :deep(.el-textarea__inner:focus) {
    border-color: rgba(249, 115, 22, 0.72);
    box-shadow:
      0 0 0 1px rgba(249, 115, 22, 0.18),
      0 0 0 6px rgba(249, 115, 22, 0.1);
  }

  :deep(.el-input__inner),
  :deep(.el-select__selected-item),
  :deep(.el-input-number__input),
  :deep(.el-textarea__inner) {
    color: var(--text-primary);
  }

  :deep(.el-input__inner::placeholder),
  :deep(.el-textarea__inner::placeholder) {
    color: var(--text-placeholder);
  }

  :deep(.el-input-number) {
    width: 100%;
    border: none;
    background: transparent;
    box-shadow: none;
  }

  :deep(.el-input-number__increase),
  :deep(.el-input-number__decrease) {
    color: var(--text-secondary);
    background: rgba(248, 250, 252, 0.92);
    border-inline-start: 1px solid rgba(148, 163, 184, 0.16);
  }

  :deep(.el-input-number__increase:hover),
  :deep(.el-input-number__decrease:hover) {
    color: var(--el-color-primary);
    background: rgba(var(--primary-color), 0.12);
  }

  :deep(.el-input__count) {
    color: var(--text-tertiary);
  }

  :deep(.el-input__count-inner) {
    padding: 2px 8px;
    border: 1px solid rgba(148, 163, 184, 0.18);
    border-radius: 999px;
    background: rgba(248, 250, 252, 0.96);
  }

  :deep(.el-switch) {
    --el-switch-on-color: #f97316;
    --el-switch-off-color: rgba(148, 163, 184, 0.5);
  }
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

.monitor-page {
  :deep(.custom-drawer-shell .el-drawer),
  :deep(.custom-drawer-shell .drawerHeader),
  :deep(.custom-drawer-shell .drawerBody),
  :deep(.custom-drawer-shell .drawerFooter) {
    background:
      radial-gradient(circle at top right, rgba(var(--primary-color), 0.08), transparent 26%),
      linear-gradient(180deg, rgba(255, 255, 255, 0.99), rgba(244, 247, 251, 0.98));
  }

  :deep(.custom-drawer-shell .drawerBody) {
    padding: 30px 28px 24px;
  }

  :deep(.custom-drawer-shell .drawerFooter) {
    border-top-color: rgba(148, 163, 184, 0.16);
  }

  :deep(.custom-drawer-shell .el-alert) {
    border: 1px solid rgba(var(--primary-color), 0.14);
    background: rgba(var(--primary-color), 0.08);
    color: var(--text-secondary);
  }

  :deep(.custom-drawer-shell .el-alert__title),
  :deep(.custom-drawer-shell .el-alert__description),
  :deep(.custom-drawer-shell .el-alert__icon) {
    color: inherit;
  }

  :deep(.custom-drawer-shell .drawerHeader) {
    border-bottom: 1px solid rgba(148, 163, 184, 0.12);
  }

  :deep(.custom-drawer-shell .drawerTitle) {
    color: var(--text-primary);
  }
}

:root:root.dark .monitor-page {
  .monitor-drawer-form {
    border: 1px solid rgba(120, 141, 179, 0.16);
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.035), rgba(255, 255, 255, 0)),
      rgba(10, 16, 28, 0.82);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.04),
      0 20px 46px rgba(4, 10, 22, 0.28);

    :deep(.el-form-item__label) {
      color: rgba(236, 242, 255, 0.9);
    }

    :deep(.el-form-item.is-required:not(.is-no-asterisk) > .el-form-item__label::before) {
      color: #ff7d7d;
    }

    :deep(.el-input__wrapper),
    :deep(.el-select__wrapper),
    :deep(.el-textarea__inner),
    :deep(.el-input-number .el-input__wrapper) {
      border: 1px solid rgba(126, 148, 186, 0.18);
      background: rgba(13, 21, 36, 0.96);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
    }

    :deep(.el-input__inner),
    :deep(.el-select__selected-item),
    :deep(.el-input-number__input),
    :deep(.el-textarea__inner) {
      color: rgba(244, 247, 255, 0.96);
    }

    :deep(.el-input__inner::placeholder),
    :deep(.el-textarea__inner::placeholder) {
      color: rgba(144, 160, 193, 0.68);
    }

    :deep(.el-input-number__increase),
    :deep(.el-input-number__decrease) {
      color: rgba(194, 205, 229, 0.82);
      background: rgba(255, 255, 255, 0.04);
      border-inline-start: 1px solid rgba(126, 148, 186, 0.12);
    }

    :deep(.el-input-number__increase:hover),
    :deep(.el-input-number__decrease:hover) {
      color: #fff;
      background: rgba(249, 115, 22, 0.18);
    }

    :deep(.el-input__count) {
      color: rgba(148, 163, 184, 0.78);
    }

    :deep(.el-input__count-inner) {
      border: 1px solid rgba(126, 148, 186, 0.14);
      background: rgba(255, 255, 255, 0.04);
    }

    :deep(.el-switch) {
      --el-switch-off-color: rgba(120, 141, 179, 0.32);
    }
  }

  :deep(.custom-drawer-shell .el-drawer),
  :deep(.custom-drawer-shell .drawerHeader),
  :deep(.custom-drawer-shell .drawerBody),
  :deep(.custom-drawer-shell .drawerFooter) {
    background:
      radial-gradient(circle at top right, rgba(249, 115, 22, 0.08), transparent 28%),
      linear-gradient(180deg, rgba(18, 27, 45, 0.98), rgba(10, 16, 28, 0.98));
  }

  :deep(.custom-drawer-shell .drawerFooter) {
    border-top-color: rgba(120, 141, 179, 0.14);
  }

  :deep(.custom-drawer-shell .drawerHeader) {
    border-bottom-color: rgba(120, 141, 179, 0.12);
  }

  :deep(.custom-drawer-shell .el-alert) {
    border: 1px solid rgba(249, 115, 22, 0.14);
    background: rgba(249, 115, 22, 0.08);
    color: rgba(246, 249, 255, 0.88);
  }
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
  .monitor-drawer-form { padding: 18px; }

  .history-controls {
    :deep(.el-button-group),
    :deep(.el-date-editor),
    .el-button {
      width: 100%;
    }
  }
}
</style>
