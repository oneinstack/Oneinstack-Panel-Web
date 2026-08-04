<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import type { EChartsOption } from 'echarts'
import { Delete, Edit, Plus, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Api } from '@/api/Api'
import BasicChart from '@/components/echarts/basic-chart.vue'
import sconfig from '@/sstore/sconfig'

type BastionStatus = 'online' | 'offline' | 'error' | 'unknown'
type AuthMethod = 'password' | 'key'
type TimeRange = '1h' | '6h' | '24h' | '7d'

interface BastionServer {
  id: number
  name: string
  host: string
  port: number
  username: string
  authMethod: AuthMethod
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
const testResult = ref<ConnectionTestResult | null>(null)

const form = reactive({
  name: '',
  host: '',
  port: 22,
  username: 'root',
  authMethod: 'password' as AuthMethod,
  password: '',
  keyPath: '',
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
  name: [{ required: true, message: '请输入服务器名称', trigger: 'blur' }],
  host: [{ required: true, message: '请输入 IP 地址或主机名', trigger: 'blur' }],
  port: [{ required: true, message: '请输入 SSH 端口', trigger: 'blur' }],
  username: [{ required: true, message: '请输入 SSH 用户名', trigger: 'blur' }],
  password: [{
    required: !editingId.value && form.authMethod === 'password',
    message: '请输入 SSH 密码',
    trigger: 'blur'
  }],
  keyPath: [{
    required: form.authMethod === 'key',
    message: '请输入私钥路径',
    trigger: 'blur'
  }]
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

const timeRangeOptions: Array<{ label: string; value: TimeRange; hours: number; limit: number }> = [
  { label: '1 小时', value: '1h', hours: 1, limit: 120 },
  { label: '6 小时', value: '6h', hours: 6, limit: 360 },
  { label: '24 小时', value: '24h', hours: 24, limit: 720 },
  { label: '7 天', value: '7d', hours: 24 * 7, limit: 1200 }
]

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
  legend: { data: ['CPU', '内存', '磁盘'] },
  grid: { left: 42, right: 18, top: 42, bottom: 34 },
  xAxis: { type: 'category', boundaryGap: false, data: chartLabels.value },
  yAxis: { type: 'value', min: 0, max: 100, axisLabel: { formatter: '{value}%' } },
  series: [
    { name: 'CPU', type: 'line', smooth: true, showSymbol: false, data: metrics.value.map((item) => item.cpuPercent) },
    { name: '内存', type: 'line', smooth: true, showSymbol: false, data: metrics.value.map((item) => item.memoryPercent) },
    { name: '磁盘', type: 'line', smooth: true, showSymbol: false, data: metrics.value.map((item) => item.diskPercent) }
  ]
}))

const networkChartOption = computed<EChartsOption>(() => ({
  tooltip: {
    trigger: 'axis',
    valueFormatter: (value) => formatRate(Number(value))
  },
  legend: { data: ['接收', '发送', '磁盘读', '磁盘写'] },
  grid: { left: 54, right: 18, top: 42, bottom: 34 },
  xAxis: { type: 'category', boundaryGap: false, data: chartLabels.value },
  yAxis: { type: 'value', axisLabel: { formatter: (value: number) => formatRate(value) } },
  series: [
    { name: '接收', type: 'line', smooth: true, showSymbol: false, areaStyle: {}, data: metrics.value.map((item) => item.networkReceiveBps) },
    { name: '发送', type: 'line', smooth: true, showSymbol: false, areaStyle: {}, data: metrics.value.map((item) => item.networkSendBps) },
    { name: '磁盘读', type: 'line', smooth: true, showSymbol: false, data: metrics.value.map((item) => item.diskReadBps) },
    { name: '磁盘写', type: 'line', smooth: true, showSymbol: false, data: metrics.value.map((item) => item.diskWriteBps) }
  ]
}))

const loadChartOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['load1', 'load5', 'load15'] },
  grid: { left: 42, right: 18, top: 42, bottom: 34 },
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
    const option = timeRangeOptions.find((item) => item.value === timeRange.value)!
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
  await loadMetrics(server.id)
}

const openForm = (server?: BastionServer) => {
  editingId.value = server?.id || null
  testResult.value = null
  Object.assign(form, {
    name: server?.name || '',
    host: server?.host || '',
    port: server?.port || 22,
    username: server?.username || 'root',
    authMethod: server?.authMethod || 'password',
    password: '',
    keyPath: '',
    tags: server?.tags || '',
    enabled: server?.enabled ?? true
  })
  formVisible.value = true
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
    if (form.authMethod === 'key') payload.keyPath = form.keyPath
    if (editingId.value) {
      await Api.updateBastionServer(editingId.value, payload)
      ElMessage.success('服务器已更新')
    } else {
      if (form.authMethod === 'password') payload.password = form.password
      await Api.addBastionServer(payload)
      ElMessage.success('服务器已添加')
    }
    form.password = ''
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
      `确定删除 ${server.name}？该服务器的历史指标数据也会一起删除。`,
      '删除堡垒机服务器',
      {
        type: 'warning',
        confirmButtonText: '确认删除',
        cancelButtonText: '取消'
      }
    )
  } catch {
    return
  }
  await Api.deleteBastionServer(server.id)
  ElMessage.success('服务器已删除')
  if (selectedServer.value?.id === server.id) detailVisible.value = false
  await fetchServers()
}

const testConnection = async (server: BastionServer) => {
  testingId.value = server.id
  try {
    const { data } = await Api.testBastionServer(server.id)
    if (data?.reachable) {
      ElMessage.success(`连接可达：${data.hostname || server.host}`)
    } else {
      ElMessage.error(data?.error || '连接不可达')
    }
  } finally {
    testingId.value = null
  }
}

const refreshDetailMetrics = async () => {
  if (!selectedServer.value) return
  await loadMetrics(selectedServer.value.id)
}

const statusLabel = (status?: BastionStatus) => ({
  online: '在线',
  offline: '离线',
  error: '异常',
  unknown: '未知'
}[status || 'unknown'])

const statusType = (status?: BastionStatus) => ({
  online: 'success',
  offline: 'info',
  error: 'danger',
  unknown: 'warning'
}[status || 'unknown']) as 'success' | 'info' | 'danger' | 'warning'

const splitTags = (tags?: string) =>
  (tags || '').split(',').map((item) => item.trim()).filter(Boolean)

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

const formatUptime = (seconds?: number) => {
  if (!Number.isFinite(seconds)) return '—'
  const days = Math.floor(Number(seconds) / 86400)
  const hours = Math.floor((Number(seconds) % 86400) / 3600)
  if (days > 0) return `${days} 天 ${hours} 小时`
  return `${hours} 小时`
}

onMounted(() => {
  void fetchServers()
})
</script>

<template>
  <div class="bastion-page">
    <section class="bastion-toolbar">
      <div>
        <h2>堡垒机</h2>
        <p>通过短连接采集远端服务器资源状态，集中查看 SSH 接入和健康指标。</p>
      </div>
      <div class="toolbar-actions">
        <el-button :icon="Refresh" :loading="loading" @click="fetchServers">刷新</el-button>
        <el-button v-if="canWrite" type="primary" :icon="Plus" @click="openForm()">添加服务器</el-button>
      </div>
    </section>

    <section class="summary-grid">
      <div class="summary-card">
        <small>服务器总数</small>
        <strong>{{ totalCount }}</strong>
      </div>
      <div class="summary-card success">
        <small>在线服务器</small>
        <strong>{{ onlineCount }}</strong>
      </div>
      <div class="summary-card warning">
        <small>异常/离线</small>
        <strong>{{ abnormalCount }}</strong>
      </div>
      <div class="summary-card">
        <small>平均 CPU</small>
        <strong>{{ formatPercent(avgCpu) }}</strong>
      </div>
      <div class="summary-card">
        <small>启用采集</small>
        <strong>{{ enabledCount }}</strong>
      </div>
    </section>

    <section v-loading="loading" class="server-section">
      <div v-if="servers.length" class="server-grid">
        <article
          v-for="server in servers"
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
                  <a :href="`ssh://${server.username}@${server.host}:${server.port}`" @click.stop>
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
                <small>内存</small>
                <strong>{{ formatPercent(server.latestMemory) }}</strong>
                <span><i :style="{ width: `${Math.min(server.latestMemory || 0, 100)}%` }" /></span>
              </div>
              <div>
                <small>磁盘</small>
                <strong>{{ formatPercent(server.latestDisk) }}</strong>
                <span><i :style="{ width: `${Math.min(server.latestDisk || 0, 100)}%` }" /></span>
              </div>
            </div>

            <div class="network-row">
              <span>↓ {{ formatRate(server.latestNetworkRecv) }}</span>
              <span>↑ {{ formatRate(server.latestNetworkSend) }}</span>
            </div>
            <div class="server-meta">
              <span>{{ server.osInfo || '等待采集系统信息' }}</span>
              <span>最近采集 {{ formatTime(server.latestCapturedAt || server.lastSeenAt) }}</span>
            </div>
            <div v-if="splitTags(server.tags).length" class="tag-row">
              <el-tag v-for="tag in splitTags(server.tags)" :key="tag" size="small" effect="plain">
                {{ tag }}
              </el-tag>
            </div>
          </button>

          <div class="server-actions">
            <el-button link type="primary" :loading="testingId === server.id" @click="testConnection(server)">
              测试连接
            </el-button>
            <template v-if="canWrite">
              <el-button link type="primary" :icon="Edit" @click="openForm(server)">编辑</el-button>
              <el-button link type="danger" :icon="Delete" @click="deleteServer(server)">删除</el-button>
            </template>
          </div>
        </article>
      </div>
      <div v-else class="empty-state">
        <img src="/static/images/empty.webp" alt="" />
        <strong>还没有堡垒机服务器</strong>
        <span>添加第一台服务器后，面板会按配置周期采集资源指标。</span>
        <el-button v-if="canWrite" type="primary" :icon="Plus" @click="openForm()">添加服务器</el-button>
      </div>
    </section>

    <custom-dialog
      v-model:show="formVisible"
      :title="editingId ? '编辑服务器' : '添加服务器'"
      width="640px"
      :on-close="closeForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="112px" class="server-form">
        <el-form-item label="服务器名称" prop="name">
          <el-input v-model="form.name" placeholder="web-prod-01" />
        </el-form-item>
        <el-form-item label="主机地址" prop="host">
          <el-input v-model="form.host" placeholder="192.168.1.10 或主机名" />
        </el-form-item>
        <div class="form-grid">
          <el-form-item label="SSH 端口" prop="port">
            <el-input-number v-model="form.port" :min="1" :max="65535" controls-position="right" />
          </el-form-item>
          <el-form-item label="用户名" prop="username">
            <el-input v-model="form.username" />
          </el-form-item>
        </div>
        <el-form-item label="认证方式" prop="authMethod">
          <el-segmented
            v-model="form.authMethod"
            :options="[
              { label: '密码', value: 'password' },
              { label: '私钥', value: 'key' }
            ]"
          />
        </el-form-item>
        <el-form-item v-if="form.authMethod === 'password'" label="SSH 密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            show-password
            :placeholder="editingId ? '留空表示不修改密码' : '请输入 SSH 密码'"
          />
        </el-form-item>
        <el-form-item v-else label="私钥路径" prop="keyPath">
          <el-input v-model="form.keyPath" placeholder="/root/.ssh/id_rsa" />
        </el-form-item>
        <el-form-item label="标签" prop="tags">
          <el-input v-model="form.tags" placeholder="生产环境,Web 服务器" />
        </el-form-item>
        <el-form-item v-if="editingId" label="启用采集" prop="enabled">
          <el-switch v-model="form.enabled" />
        </el-form-item>
        <el-alert
          v-if="testResult"
          :type="testResult.reachable ? 'success' : 'error'"
          :title="testResult.reachable ? '连接可达' : '连接不可达'"
          :description="testResult.reachable ? testResult.osInfo : testResult.error"
          show-icon
          :closable="false"
        />
      </el-form>
      <template #footer>
        <el-button @click="closeForm">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitForm">
          {{ editingId ? '保存' : '确认添加' }}
        </el-button>
      </template>
    </custom-dialog>

    <el-drawer
      v-model="detailVisible"
      class="bastion-detail-drawer"
      size="860px"
      :destroy-on-close="false"
    >
      <template #header>
        <div class="detail-header">
          <div>
            <span>服务器详情</span>
            <strong>{{ selectedServer?.name || '—' }}</strong>
          </div>
          <el-tag v-if="selectedServer" :type="statusType(selectedServer.status)" effect="light">
            {{ statusLabel(selectedServer.status) }}
          </el-tag>
        </div>
      </template>

      <div v-if="selectedServer" class="detail-content">
        <section class="detail-info">
          <div>
            <small>连接地址</small>
            <strong>{{ selectedServer.username }}@{{ selectedServer.host }}:{{ selectedServer.port }}</strong>
          </div>
          <div>
            <small>认证方式</small>
            <strong>{{ selectedServer.authMethod === 'key' ? '私钥' : '密码' }}</strong>
          </div>
          <div>
            <small>最后在线</small>
            <strong>{{ formatTime(selectedServer.lastSeenAt) }}</strong>
          </div>
          <div>
            <small>系统信息</small>
            <strong>{{ selectedServer.osInfo || '—' }}</strong>
          </div>
        </section>

        <div class="detail-toolbar">
          <el-segmented
            v-model="timeRange"
            :options="timeRangeOptions.map((item) => ({ label: item.label, value: item.value }))"
            @change="refreshDetailMetrics"
          />
          <el-button :icon="Refresh" :loading="metricsLoading" @click="refreshDetailMetrics">刷新指标</el-button>
        </div>

        <div v-loading="metricsLoading" class="chart-grid">
          <section class="chart-card">
            <div class="chart-title">CPU / 内存 / 磁盘</div>
            <basic-chart :option="usageChartOption" />
          </section>
          <section class="chart-card">
            <div class="chart-title">网络与磁盘吞吐</div>
            <basic-chart :option="networkChartOption" />
          </section>
          <section class="chart-card">
            <div class="chart-title">系统负载</div>
            <basic-chart :option="loadChartOption" />
          </section>
          <section class="health-card">
            <div>
              <small>最新采集</small>
              <strong>{{ formatTime(selectedServer.latestCapturedAt) }}</strong>
            </div>
            <div>
              <small>CPU</small>
              <strong>{{ formatPercent(selectedServer.latestCpu) }}</strong>
            </div>
            <div>
              <small>内存</small>
              <strong>{{ formatPercent(selectedServer.latestMemory) }}</strong>
            </div>
            <div>
              <small>磁盘</small>
              <strong>{{ formatPercent(selectedServer.latestDisk) }}</strong>
            </div>
            <div v-if="metrics[metrics.length - 1]">
              <small>运行时长</small>
              <strong>{{ formatUptime(metrics[metrics.length - 1].uptimeSeconds) }}</strong>
            </div>
          </section>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped lang="less">
.bastion-page {
  min-height: 100%;
}

.bastion-toolbar,
.server-card__header,
.server-actions,
.detail-header,
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

.server-section {
  min-height: 360px;
}

.server-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.server-card {
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  background: var(--surface-card);
  box-shadow: var(--shadow-xs);
  transition: border-color 0.18s ease, box-shadow 0.18s ease;

  &:hover {
    border-color: rgba(var(--primary-color), 0.28);
    box-shadow: var(--shadow-sm);
  }

  &.disabled {
    opacity: 0.68;
  }
}

.server-card__main {
  width: 100%;
  padding: 18px;
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
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
  margin-top: 14px;
  padding: 9px 11px;
  border-radius: 9px;
  color: var(--el-color-danger);
  background: color-mix(in srgb, var(--el-color-danger) 8%, var(--surface-card));
  font-size: 12px;
  line-height: 1.5;
}

.metric-triplet {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 18px;

  > div {
    min-width: 0;
  }

  small {
    color: var(--text-tertiary);
    font-size: 11px;
  }

  strong {
    display: block;
    margin: 6px 0;
    color: var(--text-primary);
    font-size: 15px;
    font-weight: 700;
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
}

.network-row {
  margin-top: 18px;
  display: flex;
  gap: 10px;
  color: var(--text-secondary);
  font-size: 12px;
}

.server-meta {
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
  padding: 11px 16px;
  border-top: 1px solid var(--border-subtle);
  justify-content: flex-end;
  background: var(--surface-subtle);
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

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

:deep(.bastion-detail-drawer) {
  border-left: 1px solid var(--border-subtle);
  background: var(--surface-page);
}

:deep(.bastion-detail-drawer .el-drawer__header) {
  margin: 0;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--surface-card);
}

:deep(.bastion-detail-drawer .el-drawer__body) {
  padding: 22px 24px 24px;
  background: var(--surface-page);
}

.detail-header {
  width: 100%;

  span {
    display: block;
    color: var(--text-tertiary);
    font-size: 11px;
    font-weight: 650;
  }

  strong {
    display: block;
    margin-top: 5px;
    color: var(--text-primary);
    font-size: 18px;
    font-weight: 720;
  }
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-info {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;

  > div {
    min-width: 0;
    padding: 14px;
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
  padding: 12px 14px;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  background: var(--surface-card);
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.chart-card,
.health-card {
  min-height: 300px;
  padding: 16px;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  background: var(--surface-card);
  box-shadow: var(--shadow-xs);
}

.chart-title {
  margin-bottom: 12px;
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 680;
}

.health-card {
  min-height: auto;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;

  > div {
    padding: 12px;
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
    color: var(--text-primary);
    font-weight: 680;
  }
}

@media (max-width: 1280px) {
  .server-grid,
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .detail-info {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .bastion-toolbar,
  .detail-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .toolbar-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .server-grid,
  .summary-grid,
  .chart-grid,
  .detail-info,
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
