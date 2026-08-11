<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import type { EChartsOption } from 'echarts'
import { Delete, Edit, InfoFilled, Plus, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Api } from '@/api/modules'
import BasicChart from '@/components/echarts/basic-chart.vue'
import { useConfigStore } from '@/stores/modules/config';
import i18n from '@/lang'

const sconfig = useConfigStore()

type BastionStatus = 'online' | 'offline' | 'error' | 'unknown'
type AuthMethod = 'password' | 'key'
type TimeRange = '1h' | '6h' | '24h' | '7d'

const t = (key: string, fallback?: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params)
  return value && value !== key ? value : fallback || key
}

interface BastionServer {
  id: number
  name: string
  host: string
  port: number
  username: string
  authMethod: AuthMethod
  keyConfigured?: boolean
  tags?: string
  enabled: boolean
  status: BastionStatus
  statusError?: string
  osInfo?: string
  lastSeenAt?: string
  createdAt?: string
  updatedAt?: string
  latestCpu?: number
  latestMemory?: number
  latestDisk?: number
  latestNetworkRecv?: number
  latestNetworkSend?: number
  latestCapturedAt?: string
}

interface BastionMetric {
  id: number
  serverId: number
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
  uptimeSeconds: number
}

interface ConnectionTestResult {
  reachable: boolean
  osInfo?: string
  hostname?: string
  error?: string
}

const servers = ref<BastionServer[]>([])
const loading = ref(false)
const metricsLoading = ref(false)
const saving = ref(false)
const testingId = ref<number | null>(null)
const detailVisible = ref(false)
const formVisible = ref(false)
const formRef = ref<FormInstance>()
const selectedServer = ref<BastionServer | null>(null)
const metrics = ref<BastionMetric[]>([])
const timeRange = ref<TimeRange>('24h')
const editingId = ref<number | null>(null)
const formLoading = ref(false)
const testResult = ref<ConnectionTestResult | null>(null)
const groupFilter = ref('')
const statusFilter = ref<BastionStatus | ''>('')

const form = reactive({
  name: '',
  host: '',
  port: 22,
  username: 'root',
  authMethod: 'password' as AuthMethod,
  password: '',
  privateKey: '',
  keyConfigured: false,
  tags: '',
  enabled: true
})

const canWrite = computed(() =>
  {
    if (sconfig.userInfo?.user?.isAdmin || sconfig.userInfo?.user?.isSuperAdmin) return true
    const bastionScope = sconfig.scopeAccess?.bastion as any
    return Boolean(
      bastionScope?.write ||
      (sconfig.scopeAccess as any)?.['bastion.write'] ||
      sconfig.actionAccess?.['bastion.write']
    )
  }
)

const rules = computed<FormRules>(() => ({
  name: [{ required: true, message: t('bastion.serverNameRequired', '请输入服务器名称'), trigger: 'blur' }],
  host: [{ required: true, message: t('bastion.hostRequired', '请输入 IP 地址或主机名'), trigger: 'blur' }],
  port: [{ required: true, message: t('bastion.portRequired', '请输入 SSH 端口'), trigger: 'blur' }],
  username: [{ required: true, message: t('bastion.usernameRequired', '请输入 SSH 用户名'), trigger: 'blur' }],
  password: [{
    required: !editingId.value && form.authMethod === 'password',
    message: t('bastion.passwordRequired', '请输入 SSH 密码'),
    trigger: 'blur'
  }],
  privateKey: [
    {
      required: form.authMethod === 'key' && (!editingId.value || !form.keyConfigured),
      message: t('bastion.privateKeyRequired', '请输入完整 SSH 私钥文本'),
      trigger: 'blur'
    },
    {
      validator: (_rule, value, callback) => {
        if (form.authMethod !== 'key' || !value) return callback()
        if (String(value).length > 64 * 1024) return callback(new Error(t('bastion.privateKeyTooLong', '私钥文本不能超过 64KB')))
        callback()
      },
      trigger: 'blur'
    }
  ]
}))

const totalCount = computed(() => servers.value.length)
const onlineCount = computed(() => servers.value.filter((item) => item.status === 'online').length)
const abnormalCount = computed(() =>
  servers.value.filter((item) => ['offline', 'error'].includes(item.status)).length
)
const enabledCount = computed(() => servers.value.filter((item) => item.enabled).length)
const avgCpu = computed(() => {
  const values = servers.value
    .map((item) => item.latestCpu)
    .filter((value): value is number => Number.isFinite(value))
  if (!values.length) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
})
const avgMemory = computed(() => averageMetric(servers.value, 'latestMemory'))
const avgDisk = computed(() => averageMetric(servers.value, 'latestDisk'))
const totalNetworkRecv = computed(() =>
  servers.value.reduce((sum, server) => sum + (server.latestNetworkRecv || 0), 0)
)
const totalNetworkSend = computed(() =>
  servers.value.reduce((sum, server) => sum + (server.latestNetworkSend || 0), 0)
)

const groupKey = (server: BastionServer) => splitTags(server.tags)[0] || t('bastion.ungrouped', '未分组')
const statusOptions = computed(() => [
  { label: t('bastion.allStatus', '全部状态'), value: '' },
  { label: t('bastion.status.online', '在线'), value: 'online' },
  { label: t('bastion.status.offline', '离线'), value: 'offline' },
  { label: t('bastion.status.error', '异常'), value: 'error' },
  { label: t('bastion.status.unknown', '未知'), value: 'unknown' }
])
const groupOptions = computed(() => [
  { label: t('bastion.allGroups', '全部分组'), value: '' },
  ...Array.from(new Set(servers.value.map(groupKey))).map((group) => ({
    label: group,
    value: group
  }))
])
const filteredServers = computed(() =>
  servers.value.filter((server) =>
    (!groupFilter.value || groupKey(server) === groupFilter.value) &&
    (!statusFilter.value || server.status === statusFilter.value)
  )
)
const resourceGroups = computed(() => {
  const groups = new Map<string, BastionServer[]>()
  servers.value.forEach((server) => {
    const key = groupKey(server)
    groups.set(key, [...(groups.get(key) || []), server])
  })
  return Array.from(groups.entries()).map(([name, list]) => ({
    name,
    list,
    total: list.length,
    online: list.filter((item) => item.status === 'online').length,
    abnormal: list.filter((item) => item.status === 'offline' || item.status === 'error').length,
    avgCpu: averageMetric(list, 'latestCpu'),
    avgMemory: averageMetric(list, 'latestMemory'),
    avgDisk: averageMetric(list, 'latestDisk')
  }))
})

const timeRangeOptions = computed<Array<{ label: string; value: TimeRange; hours: number; limit: number }>>(() => [
  { label: t('bastion.timeRanges.1h', '1 小时'), value: '1h', hours: 1, limit: 120 },
  { label: t('bastion.timeRanges.6h', '6 小时'), value: '6h', hours: 6, limit: 360 },
  { label: t('bastion.timeRanges.24h', '24 小时'), value: '24h', hours: 24, limit: 720 },
  { label: t('bastion.timeRanges.7d', '7 天'), value: '7d', hours: 24 * 7, limit: 1200 }
])

const chartLabels = computed(() =>
  metrics.value.map((item) => new Date(item.capturedAt).toLocaleTimeString([], {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }))
)

const usageChartOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'axis' },
  legend: { show: false },
  grid: { left: 42, right: 18, top: 14, bottom: 34 },
  xAxis: { type: 'category', boundaryGap: false, data: chartLabels.value },
  yAxis: { type: 'value', min: 0, max: 100, axisLabel: { formatter: '{value}%' } },
  series: [
    { name: 'CPU', type: 'line', smooth: true, showSymbol: false, data: metrics.value.map((item) => item.cpuPercent) },
    { name: t('bastion.memory', '内存'), type: 'line', smooth: true, showSymbol: false, data: metrics.value.map((item) => item.memoryPercent) },
    { name: t('bastion.disk', '磁盘'), type: 'line', smooth: true, showSymbol: false, data: metrics.value.map((item) => item.diskPercent) }
  ]
}))

const networkChartOption = computed<EChartsOption>(() => ({
  tooltip: {
    trigger: 'axis',
    valueFormatter: (value) => formatRate(Number(value))
  },
  legend: { show: false },
  grid: { left: 78, right: 18, top: 14, bottom: 34 },
  xAxis: { type: 'category', boundaryGap: false, data: chartLabels.value },
  yAxis: { type: 'value', axisLabel: { align: 'right', formatter: (value: number) => formatRate(value) } },
  series: [
    { name: t('bastion.receive', '接收'), type: 'line', smooth: true, showSymbol: false, areaStyle: {}, data: metrics.value.map((item) => item.networkReceiveBps) },
    { name: t('bastion.send', '发送'), type: 'line', smooth: true, showSymbol: false, areaStyle: {}, data: metrics.value.map((item) => item.networkSendBps) },
    { name: t('bastion.diskRead', '磁盘读'), type: 'line', smooth: true, showSymbol: false, data: metrics.value.map((item) => item.diskReadBps) },
    { name: t('bastion.diskWrite', '磁盘写'), type: 'line', smooth: true, showSymbol: false, data: metrics.value.map((item) => item.diskWriteBps) }
  ]
}))

const loadChartOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'axis' },
  legend: { show: false },
  grid: { left: 42, right: 18, top: 14, bottom: 34 },
  xAxis: { type: 'category', boundaryGap: false, data: chartLabels.value },
  yAxis: { type: 'value' },
  series: [
    { name: 'load1', type: 'line', smooth: true, showSymbol: false, data: metrics.value.map((item) => item.load1) },
    { name: 'load5', type: 'line', smooth: true, showSymbol: false, data: metrics.value.map((item) => item.load5) },
    { name: 'load15', type: 'line', smooth: true, showSymbol: false, data: metrics.value.map((item) => item.load15) }
  ]
}))

const fetchServers = async () => {
  loading.value = true
  try {
    const { data } = await Api.getBastionOverview()
    servers.value = data || []
  } finally {
    loading.value = false
  }
}

const loadMetrics = async (serverId: number) => {
  metricsLoading.value = true
  try {
    const option = timeRangeOptions.value.find((item) => item.value === timeRange.value)!
    const to = new Date()
    const from = new Date(to.getTime() - option.hours * 60 * 60 * 1000)
    const { data } = await Api.getBastionMetrics(serverId, {
      from: from.toISOString(),
      to: to.toISOString(),
      limit: option.limit
    })
    metrics.value = data || []
  } finally {
    metricsLoading.value = false
  }
}

const openDetail = async (server: BastionServer) => {
  selectedServer.value = server
  detailVisible.value = true
  metrics.value = []
  try {
    const { data } = await Api.getBastionServer(server.id)
    selectedServer.value = { ...server, ...(data || {}) }
  } catch {
    selectedServer.value = server
  }
  await loadMetrics(server.id)
}

const fillForm = (server?: BastionServer) => {
  editingId.value = server?.id ?? null
  testResult.value = null
  Object.assign(form, {
    name: server?.name || '',
    host: server?.host || '',
    port: server?.port || 22,
    username: server?.username || 'root',
    authMethod: server?.authMethod || 'password',
    password: '',
    privateKey: '',
    keyConfigured: Boolean(server?.keyConfigured),
    tags: server?.tags || '',
    enabled: server?.enabled ?? true
  })
  formVisible.value = true
}

const openForm = async (server?: BastionServer) => {
  if (!server) {
    formLoading.value = false
    fillForm()
    return
  }
  formVisible.value = true
  formLoading.value = true
  try {
    const { data } = await Api.getBastionServer(server.id)
    fillForm({ ...server, ...(data || {}) })
  } catch {
    fillForm(server)
    ElMessage.warning(t('bastion.detailReadFailedFallback', '读取服务器详情失败，已使用列表信息初始化表单'))
  } finally {
    formLoading.value = false
  }
}

const closeForm = () => {
  formVisible.value = false
  formRef.value?.clearValidate()
}

const submitForm = async () => {
  if (!canWrite.value) return
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    const payload: Record<string, any> = {
      name: form.name,
      host: form.host,
      port: Number(form.port) || 22,
      username: form.username,
      authMethod: form.authMethod,
      tags: form.tags,
      enabled: form.enabled
    }
    if (form.authMethod === 'password' && form.password) payload.password = form.password
    if (form.authMethod === 'key' && form.privateKey.trim()) payload.privateKey = form.privateKey
    if (editingId.value) {
      await Api.updateBastionServer(editingId.value, payload)
      ElMessage.success(t('bastion.serverUpdated', '服务器已更新'))
    } else {
      if (form.authMethod === 'password') payload.password = form.password
      if (form.authMethod === 'key') payload.privateKey = form.privateKey
      await Api.addBastionServer(payload)
      ElMessage.success(t('bastion.serverAdded', '服务器已添加'))
    }
    form.password = ''
    form.privateKey = ''
    await fetchServers()
    closeForm()
  } finally {
    saving.value = false
  }
}

const deleteServer = async (server: BastionServer) => {
  if (!canWrite.value) return
  try {
    await ElMessageBox.confirm(
      t('bastion.deleteConfirmMessage', '确定删除 {name}？该服务器的历史指标数据也会一起删除。', { name: server.name }),
      t('bastion.deleteConfirmTitle', '删除堡垒机服务器'),
      {
        type: 'warning',
        confirmButtonText: t('bastion.confirmDelete', '确认删除'),
        cancelButtonText: t('common.cancel', '取消')
      }
    )
  } catch {
    return
  }
  await Api.deleteBastionServer(server.id)
  ElMessage.success(t('bastion.serverDeleted', '服务器已删除'))
  if (selectedServer.value?.id === server.id) detailVisible.value = false
  await fetchServers()
}

const testConnection = async (server: BastionServer) => {
  try {
    let payload: { password?: string } = {}
    if (server.authMethod === 'password') {
      const { value } = await ElMessageBox.prompt(
        t('bastion.testPasswordPrompt', '请输入 {target} 的 SSH 密码', { target: `${server.username}@${server.host}:${server.port}` }),
        t('bastion.testPasswordTitle', '测试 SSH 密码连接'),
        {
          inputType: 'password',
          inputPlaceholder: t('bastion.sshPassword', 'SSH 密码'),
          confirmButtonText: t('bastion.testConnection', '测试连接'),
          cancelButtonText: t('common.cancel', '取消'),
          inputValidator: (value) => Boolean(value) || t('bastion.passwordRequired', '请输入 SSH 密码')
        }
      )
      payload = { password: value }
    }
    testingId.value = server.id
    const { data } = await Api.testBastionServer(server.id, payload)
    if (data?.reachable) {
      ElMessage.success(t('bastion.connectionReachableWithHost', '连接可达：{host}', { host: data.hostname || server.host }))
    } else {
      ElMessage.error(data?.error || t('bastion.connectionUnreachable', '连接不可达'))
    }
  } catch {
    // 用户取消密码输入时不提示错误。
  } finally {
    testingId.value = null
  }
}

const refreshDetailMetrics = async () => {
  if (!selectedServer.value) return
  await loadMetrics(selectedServer.value.id)
}

const statusLabel = (status?: BastionStatus) => ({
  online: t('bastion.status.online', '在线'),
  offline: t('bastion.status.offline', '离线'),
  error: t('bastion.status.error', '异常'),
  unknown: t('bastion.status.unknown', '未知')
}[status || 'unknown'])

const statusType = (status?: BastionStatus) => ({
  online: 'success',
  offline: 'info',
  error: 'danger',
  unknown: 'warning'
}[status || 'unknown']) as 'success' | 'info' | 'danger' | 'warning'

const splitTags = (tags?: string) =>
  (tags || '').split(',').map((item) => item.trim()).filter(Boolean)

const averageMetric = (list: BastionServer[], key: keyof BastionServer) => {
  const values = list
    .map((item) => item[key])
    .filter((value): value is number => Number.isFinite(value))
  if (!values.length) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

const formatPercent = (value?: number) =>
  Number.isFinite(value) ? `${Number(value).toFixed(1)}%` : '—'

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

const formatTime = (value?: string) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString()
}

const openServerLink = (server: BastionServer) =>
  `ssh://${encodeURIComponent(server.username)}@${server.host}:${server.port}`

const formatUptime = (seconds?: number) => {
  if (!Number.isFinite(seconds)) return '—'
  const days = Math.floor(Number(seconds) / 86400)
  const hours = Math.floor((Number(seconds) % 86400) / 3600)
  if (days > 0) return t('bastion.uptimeDaysHours', '{days} 天 {hours} 小时', { days, hours })
  return t('bastion.uptimeHours', '{hours} 小时', { hours })
}

onMounted(() => {
  void fetchServers()
})
</script>

<template>
  <div class="bastion-page">
    <section class="bastion-toolbar">
      <div>
        <h2>{{ $t('bastion.title') }}</h2>
        <p>{{ $t('bastion.description') }}</p>
      </div>
      <div class="toolbar-actions">
        <el-button :icon="Refresh" :loading="loading" @click="fetchServers">{{ $t('common.refresh') }}</el-button>
        <el-button v-if="canWrite" type="primary" :icon="Plus" @click="openForm()">{{ $t('bastion.addServer') }}</el-button>
      </div>
    </section>

    <section class="summary-grid">
      <div class="summary-card">
        <small>{{ $t('bastion.serverTotal') }}</small>
        <strong>{{ totalCount }}</strong>
      </div>
      <div class="summary-card success">
        <small>{{ $t('bastion.onlineServers') }}</small>
        <strong>{{ onlineCount }}</strong>
      </div>
      <div class="summary-card warning">
        <small>{{ $t('bastion.abnormalOffline') }}</small>
        <strong>{{ abnormalCount }}</strong>
      </div>
      <div class="summary-card">
        <small>{{ $t('bastion.averageCpu') }}</small>
        <strong>{{ formatPercent(avgCpu) }}</strong>
      </div>
      <div class="summary-card">
        <small>{{ $t('bastion.averageMemory') }}</small>
        <strong>{{ formatPercent(avgMemory) }}</strong>
      </div>
      <div class="summary-card">
        <small>{{ $t('bastion.averageDisk') }}</small>
        <strong>{{ formatPercent(avgDisk) }}</strong>
      </div>
      <div class="summary-card">
        <small>{{ $t('bastion.networkReceive') }}</small>
        <strong>{{ formatRate(totalNetworkRecv) }}</strong>
      </div>
      <div class="summary-card">
        <small>{{ $t('bastion.networkSend') }}</small>
        <strong>{{ formatRate(totalNetworkSend) }}</strong>
      </div>
      <div class="summary-card">
        <small>{{ $t('bastion.enableCollection') }}</small>
        <strong>{{ enabledCount }}</strong>
      </div>
    </section>

    <section v-if="servers.length" class="group-overview">
      <div class="section-heading">
        <div>
          <h3>{{ $t('bastion.resourceGroupOverview') }}</h3>
          <span>{{ $t('bastion.groupHint') }}</span>
        </div>
      </div>
      <div class="group-grid">
        <button
          v-for="group in resourceGroups"
          :key="group.name"
          type="button"
          class="group-card"
          :class="{ active: groupFilter === group.name }"
          @click="groupFilter = groupFilter === group.name ? '' : group.name"
        >
          <div class="group-card__top">
            <strong>{{ group.name }}</strong>
            <span>{{ $t('bastion.onlineRatio', { online: group.online, total: group.total }) }}</span>
          </div>
          <div class="group-card__bars">
            <div>
              <small>CPU</small>
              <span><i :style="{ width: `${Math.min(group.avgCpu, 100)}%` }" /></span>
              <em>{{ formatPercent(group.avgCpu) }}</em>
            </div>
            <div>
              <small>{{ $t('bastion.memory') }}</small>
              <span><i :style="{ width: `${Math.min(group.avgMemory, 100)}%` }" /></span>
              <em>{{ formatPercent(group.avgMemory) }}</em>
            </div>
            <div>
              <small>{{ $t('bastion.disk') }}</small>
              <span><i :style="{ width: `${Math.min(group.avgDisk, 100)}%` }" /></span>
              <em>{{ formatPercent(group.avgDisk) }}</em>
            </div>
          </div>
          <div class="group-card__nodes">
            <span
              v-for="server in group.list.slice(0, 18)"
              :key="server.id"
              :class="`is-${server.status}`"
              :title="`${server.name} · ${statusLabel(server.status)}`"
            />
          </div>
        </button>
      </div>
    </section>

    <section v-if="servers.length" class="resource-filters">
      <div>
        <h3>{{ $t('bastion.serverResources') }}</h3>
        <span>{{ $t('bastion.serverResourcesDescription') }}</span>
      </div>
      <div class="filter-actions">
        <el-select v-model="groupFilter" :placeholder="$t('bastion.group')" style="width: 150px">
          <el-option
            v-for="item in groupOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-select v-model="statusFilter" :placeholder="$t('common.status')" style="width: 130px">
          <el-option
            v-for="item in statusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </div>
    </section>

    <section v-loading="loading" class="server-section">
      <div v-if="filteredServers.length" class="server-grid">
        <article
          v-for="server in filteredServers"
          :key="server.id"
          class="server-card"
          :class="[`status-${server.status}`, { disabled: !server.enabled }]"
        >
          <button class="server-card__main" type="button" @click="openDetail(server)">
            <div class="server-card__header">
              <div class="server-identity">
                <span class="server-initial">{{ server.name.slice(0, 1).toUpperCase() }}</span>
                <div>
                  <strong>{{ server.name }}</strong>
                  <a :href="openServerLink(server)" @click.stop>
                    {{ server.host }}:{{ server.port }}
                  </a>
                </div>
              </div>
              <el-tag :type="statusType(server.status)" effect="light">
                {{ statusLabel(server.status) }}
              </el-tag>
            </div>

            <div v-if="server.statusError" class="server-error">{{ server.statusError }}</div>
            <div class="metric-triplet">
              <div>
                <small>CPU</small>
                <strong>{{ formatPercent(server.latestCpu) }}</strong>
                <span><i :style="{ width: `${Math.min(server.latestCpu || 0, 100)}%` }" /></span>
              </div>
              <div>
                <small>{{ $t('bastion.memory') }}</small>
                <strong>{{ formatPercent(server.latestMemory) }}</strong>
                <span><i :style="{ width: `${Math.min(server.latestMemory || 0, 100)}%` }" /></span>
              </div>
              <div>
                <small>{{ $t('bastion.disk') }}</small>
                <strong>{{ formatPercent(server.latestDisk) }}</strong>
                <span><i :style="{ width: `${Math.min(server.latestDisk || 0, 100)}%` }" /></span>
              </div>
            </div>

            <div class="network-row">
              <span>↓ {{ formatRate(server.latestNetworkRecv) }}</span>
              <span>↑ {{ formatRate(server.latestNetworkSend) }}</span>
            </div>
            <div class="server-meta">
              <span>{{ server.osInfo || $t('bastion.waitingForSystemInfo') }}</span>
              <span>{{ $t('bastion.latestCollection', { time: formatTime(server.latestCapturedAt || server.lastSeenAt) }) }}</span>
            </div>
            <div v-if="splitTags(server.tags).length" class="tag-row">
              <el-tag v-for="tag in splitTags(server.tags)" :key="tag" size="small" effect="plain">
                {{ tag }}
              </el-tag>
            </div>
          </button>

          <div class="server-actions">
            <el-button link type="primary" :loading="testingId === server.id" @click="testConnection(server)">
              {{ $t('bastion.testConnection') }}
            </el-button>
            <template v-if="canWrite">
              <el-button link type="primary" :icon="Edit" @click="openForm(server)">{{ $t('common.edit') }}</el-button>
              <el-button link type="danger" :icon="Delete" @click="deleteServer(server)">{{ $t('common.delete') }}</el-button>
            </template>
          </div>
        </article>
      </div>
      <div v-else-if="servers.length" class="empty-state">
        <img src="/static/images/empty.webp" alt="" />
        <strong>{{ $t('bastion.noMatchedServers') }}</strong>
        <span>{{ $t('bastion.noMatchedServersDescription') }}</span>
        <el-button @click="groupFilter = ''; statusFilter = ''">{{ $t('bastion.clearFilters') }}</el-button>
      </div>
      <div v-else class="empty-state">
        <img src="/static/images/empty.webp" alt="" />
        <strong>{{ $t('bastion.noServers') }}</strong>
        <span>{{ $t('bastion.noServersDescription') }}</span>
        <el-button v-if="canWrite" type="primary" :icon="Plus" @click="openForm()">{{ $t('bastion.addServer') }}</el-button>
      </div>
    </section>

    <custom-drawer
      :visible="formVisible"
      :title="editingId ? $t('bastion.editServer') : $t('bastion.addServer')"
      size="760px"
      :confirm-text="editingId ? $t('common.save') : $t('bastion.confirmAdd')"
      :loading="saving"
      :on-close="closeForm"
      :on-confirm="submitForm"
    >
      <el-form
        ref="formRef"
        v-loading="formLoading"
        :model="form"
        :rules="rules"
        label-width="112px"
        class="server-form"
      >
        <el-form-item :label="$t('bastion.serverName')" prop="name">
          <el-input v-model="form.name" placeholder="web-prod-01" />
        </el-form-item>
        <el-form-item :label="$t('bastion.hostAddress')" prop="host">
          <el-input v-model="form.host" :placeholder="$t('bastion.hostPlaceholder')" />
        </el-form-item>
        <div class="form-grid">
          <el-form-item :label="$t('bastion.sshPort')" prop="port">
            <el-input-number v-model="form.port" :min="1" :max="65535" controls-position="right" />
          </el-form-item>
          <el-form-item :label="$t('common.username')" prop="username">
            <el-input v-model="form.username" />
          </el-form-item>
        </div>
        <el-form-item :label="$t('bastion.authMethod')" prop="authMethod">
          <el-segmented
            v-model="form.authMethod"
            :options="[
              { label: $t('bastion.password'), value: 'password' },
              { label: $t('bastion.privateKey'), value: 'key' }
            ]"
          />
        </el-form-item>
        <el-form-item v-if="form.authMethod === 'password'" :label="$t('bastion.sshPassword')" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            show-password
            :placeholder="editingId ? $t('bastion.keepPasswordPlaceholder') : $t('bastion.passwordRequired')"
          />
        </el-form-item>
        <el-form-item v-else :label="$t('bastion.sshPrivateKey')" prop="privateKey">
          <div class="private-key-field">
            <el-alert
              v-if="editingId && form.keyConfigured"
              type="info"
              :title="$t('bastion.privateKeyConfiguredTip')"
              :closable="false"
              show-icon
            />
            <el-input
              v-model="form.privateKey"
              type="textarea"
              :rows="8"
              resize="vertical"
              maxlength="65536"
              show-word-limit
              :placeholder="editingId ? $t('bastion.privateKeyReplacePlaceholder') : '-----BEGIN OPENSSH PRIVATE KEY-----\n...\n-----END OPENSSH PRIVATE KEY-----'"
            />
            <span class="private-key-field__hint">
              {{ $t('bastion.privateKeyHint') }}
            </span>
          </div>
        </el-form-item>
        <el-form-item :label="$t('bastion.tags')" prop="tags">
          <el-input v-model="form.tags" :placeholder="$t('bastion.tagsPlaceholder')" />
        </el-form-item>
        <el-form-item v-if="editingId" :label="$t('bastion.enableCollection')" prop="enabled">
          <el-switch v-model="form.enabled" />
        </el-form-item>
        <el-alert
          v-if="testResult"
          :type="testResult.reachable ? 'success' : 'error'"
          :title="testResult.reachable ? $t('bastion.connectionReachable') : $t('bastion.connectionUnreachable')"
          :description="testResult.reachable ? testResult.osInfo : testResult.error"
          show-icon
          :closable="false"
        />
      </el-form>
    </custom-drawer>

    <custom-drawer
      :visible="detailVisible"
      :title="$t('bastion.serverDetailTitle', { name: selectedServer?.name || '—' })"
      size="860px"
      :show-footer="false"
      :destroy-on-close="false"
      :on-close="() => { detailVisible = false }"
    >
      <div v-if="selectedServer" class="detail-content">
        <div class="detail-status-row">
          <span>{{ selectedServer.host }}:{{ selectedServer.port }}</span>
          <el-tag :type="statusType(selectedServer.status)" effect="light">
            {{ statusLabel(selectedServer.status) }}
          </el-tag>
        </div>
        <section class="detail-info">
          <div>
            <small>{{ $t('bastion.connectionAddress') }}</small>
            <strong>{{ selectedServer.username }}@{{ selectedServer.host }}:{{ selectedServer.port }}</strong>
          </div>
          <div>
            <small>{{ $t('bastion.authMethod') }}</small>
            <strong>
              {{ selectedServer.authMethod === 'key'
                ? $t('bastion.privateKeyConfigStatus', { status: selectedServer.keyConfigured ? $t('common.enabled') : $t('common.disabled') })
                : $t('bastion.password')
              }}
            </strong>
          </div>
          <div>
            <small>{{ $t('bastion.lastOnline') }}</small>
            <strong>{{ formatTime(selectedServer.lastSeenAt) }}</strong>
          </div>
          <div>
            <small>{{ $t('bastion.systemInfo') }}</small>
            <strong>{{ selectedServer.osInfo || '—' }}</strong>
          </div>
        </section>

        <div class="detail-toolbar">
          <el-segmented
            v-model="timeRange"
            :options="timeRangeOptions.map((item) => ({ label: item.label, value: item.value }))"
            @change="refreshDetailMetrics"
          />
          <el-button :icon="Refresh" :loading="metricsLoading" @click="refreshDetailMetrics">{{ $t('bastion.refreshMetrics') }}</el-button>
        </div>

        <div v-loading="metricsLoading" class="chart-grid">
          <section class="chart-card">
            <div class="chart-title">{{ $t('bastion.usageChartTitle') }}</div>
            <div class="chart-legend">
              <span class="chart-legend__item is-blue">CPU</span>
              <span class="chart-legend__item is-green">{{ $t('bastion.memory') }}</span>
              <span class="chart-legend__item is-yellow">{{ $t('bastion.disk') }}</span>
            </div>
            <div class="chart-body">
              <basic-chart v-if="metrics.length" :option="usageChartOption" />
              <div v-if="!metrics.length" class="chart-empty">{{ $t('common.noData') }}</div>
            </div>
          </section>
          <section class="chart-card">
            <div class="chart-title">{{ $t('bastion.networkDiskThroughput') }}</div>
            <div class="chart-legend">
              <span class="chart-legend__item is-blue">{{ $t('bastion.receive') }}</span>
              <span class="chart-legend__item is-green">{{ $t('bastion.send') }}</span>
              <span class="chart-legend__item is-yellow">{{ $t('bastion.diskRead') }}</span>
              <span class="chart-legend__item is-red">{{ $t('bastion.diskWrite') }}</span>
            </div>
            <div class="chart-body">
              <basic-chart v-if="metrics.length" :option="networkChartOption" />
              <div v-if="!metrics.length" class="chart-empty">{{ $t('common.noData') }}</div>
            </div>
          </section>
          <section class="chart-card">
            <div class="chart-title">
              <span>{{ $t('bastion.systemLoad') }}</span>
              <el-tooltip placement="top" effect="light" popper-class="load-help-tooltip">
                <template #content>
                  <div class="load-help">
                    <p>{{ $t('bastion.loadHelp.intro') }}</p>
                    <p><strong>load1</strong>{{ $t('bastion.loadHelp.load1') }}</p>
                    <p><strong>load5</strong>{{ $t('bastion.loadHelp.load5') }}</p>
                    <p><strong>load15</strong>{{ $t('bastion.loadHelp.load15') }}</p>
                    <p>{{ $t('bastion.loadHelp.reference') }}</p>
                  </div>
                </template>
                <el-icon class="chart-title__help"><InfoFilled /></el-icon>
              </el-tooltip>
            </div>
            <div class="chart-legend">
              <span class="chart-legend__item is-blue">load1</span>
              <span class="chart-legend__item is-green">load5</span>
              <span class="chart-legend__item is-yellow">load15</span>
            </div>
            <div class="chart-body">
              <basic-chart v-if="metrics.length" :option="loadChartOption" />
              <div v-if="!metrics.length" class="chart-empty">{{ $t('common.noData') }}</div>
            </div>
          </section>
          <section class="health-card">
            <div class="health-card__time">
              <small>{{ $t('bastion.latestCollected') }}</small>
              <strong>{{ formatTime(selectedServer.latestCapturedAt) }}</strong>
            </div>
            <div>
              <small>CPU</small>
              <strong>{{ formatPercent(selectedServer.latestCpu) }}</strong>
            </div>
            <div>
              <small>{{ $t('bastion.memory') }}</small>
              <strong>{{ formatPercent(selectedServer.latestMemory) }}</strong>
            </div>
            <div>
              <small>{{ $t('bastion.disk') }}</small>
              <strong>{{ formatPercent(selectedServer.latestDisk) }}</strong>
            </div>
            <div v-if="metrics[metrics.length - 1]">
              <small>{{ $t('bastion.uptime') }}</small>
              <strong>{{ formatUptime(metrics[metrics.length - 1].uptimeSeconds) }}</strong>
            </div>
          </section>
        </div>
      </div>
    </custom-drawer>
  </div>
</template>

<style scoped lang="less">
.bastion-page {
  min-height: 100%;
}

.bastion-toolbar,
.server-card__header,
.server-actions,
.detail-status-row,
.detail-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.bastion-toolbar {
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

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
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
}

.group-overview,
.resource-filters {
  margin-bottom: 18px;
  padding: 18px;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  background: var(--surface-card);
  box-shadow: var(--shadow-xs);
}

.section-heading,
.resource-filters {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  h3 {
    margin: 0 0 4px;
    color: var(--text-primary);
    font-size: 16px;
    font-weight: 700;
  }

  span {
    color: var(--text-tertiary);
    font-size: 12px;
  }
}

.group-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.group-card {
  min-width: 0;
  padding: 14px;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  background: var(--surface-subtle);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;

  &:hover,
  &.active {
    border-color: rgba(var(--primary-color), 0.34);
    background: color-mix(in srgb, rgb(var(--primary-color)) 5%, var(--surface-card));
    box-shadow: var(--shadow-xs);
  }
}

.group-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;

  strong {
    overflow: hidden;
    color: var(--text-primary);
    font-size: 14px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span {
    flex: 0 0 auto;
    color: var(--text-tertiary);
    font-size: 12px;
  }
}

.group-card__bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 13px;

  div {
    display: grid;
    grid-template-columns: 34px minmax(0, 1fr) 48px;
    align-items: center;
    gap: 8px;
  }

  small,
  em {
    color: var(--text-tertiary);
    font-size: 11px;
    font-style: normal;
  }

  span {
    height: 5px;
    overflow: hidden;
    border-radius: 999px;
    background: var(--surface-muted);
  }

  i {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: rgb(var(--primary-color));
  }
}

.group-card__nodes {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 13px;

  span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--el-color-warning);

    &.is-online {
      background: var(--el-color-success);
    }

    &.is-offline {
      background: var(--text-placeholder);
    }

    &.is-error {
      background: var(--el-color-danger);
    }
  }
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.server-section {
  min-height: 360px;
}

.server-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.server-card {
  min-height: 244px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  background: var(--surface-card);
  box-shadow: var(--shadow-xs);
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;

  &:hover {
    border-color: color-mix(in srgb, rgb(var(--primary-color)) 24%, var(--border-subtle));
    box-shadow: var(--shadow-sm);
    transform: translateY(-1px);
  }

  &.disabled {
    opacity: 0.68;
  }

  &.status-online {
    border-color: color-mix(in srgb, var(--el-color-success) 18%, var(--border-subtle));
  }

  &.status-error {
    border-color: color-mix(in srgb, var(--el-color-danger) 20%, var(--border-subtle));
  }
}

.server-card__main {
  flex: 1;
  width: 100%;
  padding: 16px 18px 14px;
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.server-card__header {
  min-height: 42px;
  gap: 12px;

  :deep(.el-tag) {
    min-width: 46px;
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
}

.server-identity {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;

  > div {
    min-width: 0;
  }

  strong,
  a {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    color: var(--text-primary);
    font-size: 15px;
    font-weight: 680;
  }

  a {
    margin-top: 4px;
    color: rgb(var(--primary-color));
    font-size: 12px;
  }
}

.server-initial {
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(var(--primary-color), 0.16);
  border-radius: 12px;
  color: rgb(var(--primary-color));
  background: rgba(var(--primary-color), 0.08);
  font-weight: 760;
}

.server-error {
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

.metric-triplet {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 17px;

  > div {
    min-width: 0;
  }

  small {
    color: var(--text-tertiary);
    font-size: 11px;
  }

  strong {
    display: block;
    min-height: 20px;
    margin: 6px 0;
    color: var(--text-primary);
    font-size: 15px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  span {
    display: block;
    height: 5px;
    overflow: hidden;
    border-radius: 999px;
    background: var(--surface-muted);
  }

  i {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: rgb(var(--primary-color));
  }

  > div:nth-child(1) i {
    background: #5b7fd3;
  }

  > div:nth-child(2) i {
    background: #83c56c;
  }

  > div:nth-child(3) i {
    background: #ffc44d;
  }
}

.network-row {
  min-height: 18px;
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-secondary);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.server-meta {
  min-height: 34px;
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  color: var(--text-tertiary);
  font-size: 11px;
}

.tag-row {
  margin-top: 14px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.server-actions {
  min-height: 50px;
  padding: 9px 14px;
  border-top: 1px solid var(--border-subtle);
  justify-content: flex-end;
  background: var(--surface-subtle);

  :deep(.el-button) {
    height: 32px;
    padding: 0 10px;
    border-radius: 7px;
    font-weight: 600;
  }
}

.empty-state {
  min-height: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 1px dashed var(--border-subtle);
  border-radius: 14px;
  color: var(--text-tertiary);
  background: var(--surface-card);

  img {
    width: 120px;
    opacity: 0.76;
  }

  strong {
    color: var(--text-primary);
    font-size: 16px;
  }
}

.server-form {
  :deep(.el-input-number) {
    width: 100%;
  }
}

.private-key-field {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;

  :deep(.el-textarea__inner) {
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
    line-height: 1.45;
  }

  &__hint {
    color: var(--text-tertiary);
    font-size: 12px;
    line-height: 1.5;
  }
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-status-row {
  padding: 12px 14px;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: var(--surface-subtle);

  span {
    color: var(--text-secondary);
    font-size: 13px;
    font-weight: 650;
  }
}

.detail-info {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;

  > div {
    min-width: 0;
    padding: 12px 14px;
    border: 1px solid var(--border-subtle);
    border-radius: 12px;
    background: var(--surface-card);
  }

  small {
    color: var(--text-tertiary);
    font-size: 11px;
  }

  strong {
    display: block;
    margin-top: 7px;
    overflow: hidden;
    color: var(--text-primary);
    font-size: 13px;
    font-weight: 650;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.detail-toolbar {
  padding: 10px 12px;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  background: var(--surface-card);
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.chart-card,
.health-card {
  min-height: 260px;
  padding: 14px;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  background: var(--surface-card);
  box-shadow: var(--shadow-xs);
}

.chart-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 680;
}

.chart-title__help {
  color: var(--text-tertiary);
  cursor: help;
  font-size: 15px;
  transition: color 0.18s ease;

  &:hover {
    color: rgb(var(--primary-color));
  }
}

:global(.load-help-tooltip) {
  max-width: 360px;
}

:global(.load-help) {
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.65;

  p {
    margin: 0;

    + p {
      margin-top: 6px;
    }
  }

  strong {
    color: var(--text-primary);
    font-weight: 700;
  }
}

.chart-card {
  height: 300px;
  display: flex;
  flex-direction: column;
}

.chart-body {
  position: relative;
  flex: 1;
  min-height: 0;
}

.chart-body :deep(.chart-box) {
  height: 100%;
}

.chart-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  font-size: 13px;
  font-weight: 650;
  letter-spacing: 0;
  pointer-events: none;
}

.chart-legend {
  min-height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin-bottom: 6px;
  color: var(--text-secondary);
  font-size: 12px;
}

.chart-legend__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;

  &::before {
    width: 22px;
    height: 12px;
    border-bottom: 3px solid currentColor;
    border-radius: 999px;
    content: '';
  }

  &.is-blue {
    color: #5470c6;
  }

  &.is-green {
    color: #91cc75;
  }

  &.is-yellow {
    color: #fac858;
  }

  &.is-red {
    color: #ee6666;
  }
}

.health-card {
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(190px, 1.35fr) repeat(4, minmax(0, 1fr));
  grid-column: 1 / -1;
  gap: 8px;

  > div {
    min-width: 0;
    padding: 10px 12px;
    border-radius: 10px;
    background: var(--surface-subtle);
  }

  small {
    color: var(--text-tertiary);
    font-size: 11px;
  }

  strong {
    display: block;
    margin-top: 7px;
    overflow: hidden;
    color: var(--text-primary);
    font-weight: 680;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.health-card__time {
  strong {
    overflow: visible;
    text-overflow: clip;
    white-space: normal;
    word-break: keep-all;
  }
}

@media (max-width: 1280px) {
  .server-grid,
  .group-grid,
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .detail-info {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .health-card {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .bastion-toolbar,
  .resource-filters,
  .detail-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .toolbar-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .server-grid,
  .group-grid,
  .summary-grid,
  .chart-grid,
  .detail-info,
  .health-card,
  .form-grid {
    grid-template-columns: 1fr;
  }

  .filter-actions,
  .filter-actions :deep(.el-select) {
    width: 100%;
  }
}
</style>
