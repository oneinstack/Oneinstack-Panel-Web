<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { Api } from '@/api/Api'
import System from '@/utils/System'
import { ElMessage } from 'element-plus'

interface AuditEvent {
  id: number
  sequence: number
  requestId: string
  eventType: string
  action: string
  method: string
  route: string
  path: string
  status: number
  outcome: 'success' | 'failure'
  sensitive: boolean
  userId: number
  username: string
  authMode: string
  remoteIp: string
  userAgent: string
  contentLength: number
  durationMs: number
  message: string
  createdAt: string
  previousHash: string
  entryHash: string
  chainVersion: number
}

interface AuditStats {
  counts: {
    total: number
    success: number
    failure: number
    sensitive: number
    last24Hours: number
    latestSequence: number
  }
  retentionDays: number
  cleanupSchedule: string
  exportMaxRows: number
}

const loading = ref(false)
const verifying = ref(false)
const exporting = ref(false)
const events = ref<AuditEvent[]>([])
const total = ref(0)
const detail = ref<AuditEvent | null>(null)
const detailVisible = ref(false)
const dateRange = ref<[Date, Date] | undefined>()
const verification = ref<any>(null)
const stats = ref<AuditStats>({
  counts: { total: 0, success: 0, failure: 0, sensitive: 0, last24Hours: 0, latestSequence: 0 },
  retentionDays: 0,
  cleanupSchedule: '',
  exportMaxRows: 0
})
const filters = reactive({
  page: 1,
  pageSize: 20,
  q: '',
  username: '',
  outcome: '',
  method: '',
  sensitive: ''
})

const queryParams = (includePage = true) => {
  const params: Record<string, any> = {
    q: filters.q || undefined,
    username: filters.username || undefined,
    outcome: filters.outcome || undefined,
    method: filters.method || undefined,
    sensitive: filters.sensitive || undefined,
    startAt: dateRange.value?.[0]?.toISOString(),
    endAt: dateRange.value?.[1]?.toISOString()
  }
  if (includePage) {
    params.page = filters.page
    params.pageSize = filters.pageSize
  }
  return params
}

const loadEvents = async () => {
  loading.value = true
  try {
    const { data } = await Api.getAuditEvents(queryParams())
    events.value = data?.items || []
    total.value = data?.total || 0
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  const { data } = await Api.getAuditStats()
  stats.value = data
}

const search = () => {
  filters.page = 1
  void loadEvents()
}

const reset = () => {
  Object.assign(filters, {
    page: 1,
    pageSize: 20,
    q: '',
    username: '',
    outcome: '',
    method: '',
    sensitive: ''
  })
  dateRange.value = undefined
  void loadEvents()
}

const showDetail = async (row: AuditEvent) => {
  const { data } = await Api.getAuditEvent(row.id)
  detail.value = data
  detailVisible.value = true
}

const verifyChain = async () => {
  verifying.value = true
  try {
    const { data } = await Api.verifyAuditChain()
    verification.value = data
    if (data.valid) ElMessage.success(`审计链完整，已校验 ${data.checkedEntries} 条记录`)
    else ElMessage.error(`审计链校验失败：${data.message}`)
    await Promise.all([loadEvents(), loadStats()])
  } finally {
    verifying.value = false
  }
}

const exportEvents = async () => {
  exporting.value = true
  try {
    const searchParams = new URLSearchParams()
    Object.entries(queryParams(false)).forEach(([key, value]) => {
      if (value !== undefined && value !== '') searchParams.set(key, String(value))
    })
    const response = await fetch(`${System.env.API}/audit/export?${searchParams.toString()}`, {
      credentials: 'include'
    })
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      throw new Error(payload.message || '导出审计日志失败')
    }
    const blob = await response.blob()
    const disposition = response.headers.get('Content-Disposition') || ''
    const filename = disposition.match(/filename="([^"]+)"/)?.[1] || `oneinstack-audit-${Date.now()}.csv`
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(url)
    ElMessage.success('审计日志已导出')
    await Promise.all([loadEvents(), loadStats()])
  } catch (error: any) {
    ElMessage.error(error?.message || '导出审计日志失败')
  } finally {
    exporting.value = false
  }
}

const formatTime = (value?: string) => value ? new Date(value).toLocaleString() : '—'

onMounted(async () => {
  await Promise.all([loadEvents(), loadStats()])
})
</script>

<template>
  <div class="audit-page">
    <div class="page-heading">
      <div>
        <h2>审计日志</h2>
        <p>记录登录、安全操作和失败请求；请求正文、密码、Token 与查询参数不会写入审计库。</p>
      </div>
      <div class="heading-actions">
        <el-button :loading="verifying" @click="verifyChain">校验完整性</el-button>
        <el-button type="primary" :loading="exporting" @click="exportEvents">导出 CSV</el-button>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <span>当前保留</span>
        <strong>{{ stats.counts.total }}</strong>
        <small>最新序号 #{{ stats.counts.latestSequence || 0 }}</small>
      </div>
      <div class="stat-card success">
        <span>成功操作</span>
        <strong>{{ stats.counts.success }}</strong>
        <small>最近 24 小时 {{ stats.counts.last24Hours }} 条</small>
      </div>
      <div class="stat-card danger">
        <span>失败请求</span>
        <strong>{{ stats.counts.failure }}</strong>
        <small>用于发现认证和权限异常</small>
      </div>
      <div class="stat-card warning">
        <span>敏感操作</span>
        <strong>{{ stats.counts.sensitive }}</strong>
        <small>保留 {{ stats.retentionDays || '—' }} 天</small>
      </div>
    </div>

    <el-alert
      v-if="verification"
      class="integrity-alert"
      :type="verification.valid ? 'success' : 'error'"
      :closable="false"
      show-icon
      :title="verification.valid ? '审计链完整' : '审计链校验失败'"
      :description="`${verification.message}；校验 ${verification.checkedEntries} 条，检查点序号 ${verification.checkpointSequence || 0}`"
    />

    <div class="audit-panel">
      <div class="filters">
        <el-input v-model="filters.q" clearable placeholder="请求 ID、动作、路径或 IP" @keyup.enter="search" />
        <el-input v-model="filters.username" clearable placeholder="操作用户" @keyup.enter="search" />
        <el-select v-model="filters.outcome" clearable placeholder="执行结果">
          <el-option label="成功" value="success" />
          <el-option label="失败" value="failure" />
        </el-select>
        <el-select v-model="filters.method" clearable placeholder="请求方法">
          <el-option v-for="method in ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']" :key="method" :label="method" :value="method" />
        </el-select>
        <el-select v-model="filters.sensitive" clearable placeholder="敏感级别">
          <el-option label="敏感操作" value="true" />
          <el-option label="普通操作" value="false" />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="datetimerange"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          range-separator="至"
        />
        <el-button type="primary" @click="search">查询</el-button>
        <el-button @click="reset">重置</el-button>
      </div>

      <el-table v-loading="loading" :data="events" border row-key="id" @row-dblclick="showDetail">
        <el-table-column prop="sequence" label="序号" width="92">
          <template #default="{ row }">#{{ row.sequence }}</template>
        </el-table-column>
        <el-table-column prop="createdAt" label="时间" min-width="170">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column prop="username" label="用户" width="120">
          <template #default="{ row }">{{ row.username || '未认证' }}</template>
        </el-table-column>
        <el-table-column prop="action" label="动作" min-width="260" show-overflow-tooltip />
        <el-table-column prop="remoteIp" label="来源 IP" min-width="135">
          <template #default="{ row }">{{ row.remoteIp || '—' }}</template>
        </el-table-column>
        <el-table-column label="结果" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.outcome === 'success' ? 'success' : 'danger'" size="small">
              {{ row.status }} {{ row.outcome === 'success' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="级别" width="90" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.sensitive" type="warning" size="small">敏感</el-tag>
            <span v-else>普通</span>
          </template>
        </el-table-column>
        <el-table-column prop="durationMs" label="耗时" width="90" align="right">
          <template #default="{ row }">{{ row.durationMs }} ms</template>
        </el-table-column>
        <el-table-column label="操作" width="82" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="showDetail(row)">详情</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="当前筛选条件下没有审计记录" />
        </template>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="filters.page"
          v-model:page-size="filters.pageSize"
          background
          layout="total, sizes, prev, pager, next"
          :page-sizes="[20, 50, 100]"
          :total="total"
          @current-change="loadEvents"
          @size-change="search"
        />
      </div>
      <div class="policy-note">
        每日按 <code>{{ stats.cleanupSchedule || '—' }}</code> 自动清理，单次最多导出
        {{ stats.exportMaxRows || '—' }} 条。清理前会校验完整性并写入签名检查点。
      </div>
    </div>

    <el-drawer v-model="detailVisible" title="审计记录详情" size="600px">
      <el-descriptions v-if="detail" :column="2" border>
        <el-descriptions-item label="序号">#{{ detail.sequence }}</el-descriptions-item>
        <el-descriptions-item label="时间">{{ formatTime(detail.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="用户">{{ detail.username || '未认证' }}（ID {{ detail.userId || 0 }}）</el-descriptions-item>
        <el-descriptions-item label="认证方式">{{ detail.authMode || '—' }}</el-descriptions-item>
        <el-descriptions-item label="动作" :span="2">{{ detail.action }}</el-descriptions-item>
        <el-descriptions-item label="路由" :span="2">{{ detail.route || detail.path }}</el-descriptions-item>
        <el-descriptions-item label="结果">{{ detail.status }} / {{ detail.outcome }}</el-descriptions-item>
        <el-descriptions-item label="耗时">{{ detail.durationMs }} ms</el-descriptions-item>
        <el-descriptions-item label="来源 IP">{{ detail.remoteIp || '—' }}</el-descriptions-item>
        <el-descriptions-item label="请求大小">{{ detail.contentLength }} bytes</el-descriptions-item>
        <el-descriptions-item label="请求 ID" :span="2"><code>{{ detail.requestId }}</code></el-descriptions-item>
        <el-descriptions-item label="User-Agent" :span="2">{{ detail.userAgent || '—' }}</el-descriptions-item>
        <el-descriptions-item label="说明" :span="2">{{ detail.message || '—' }}</el-descriptions-item>
        <el-descriptions-item label="前置摘要" :span="2"><code class="hash">{{ detail.previousHash }}</code></el-descriptions-item>
        <el-descriptions-item label="记录摘要" :span="2"><code class="hash">{{ detail.entryHash }}</code></el-descriptions-item>
      </el-descriptions>
    </el-drawer>
  </div>
</template>

<style scoped lang="less">
.audit-page {
  padding-bottom: 28px;
}

.page-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
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

.heading-actions {
  display: flex;
  flex-shrink: 0;
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

  span, small {
    color: var(--text-tertiary);
  }

  strong {
    margin: 6px 0;
    font-size: 28px;
    line-height: 1;
  }

  &.success strong { color: #37a878; }
  &.danger strong { color: #e25d5d; }
  &.warning strong { color: #d89532; }
}

.integrity-alert {
  margin-bottom: 14px;
}

.audit-panel {
  padding: 20px;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  background: var(--surface-card);
  box-shadow: var(--shadow-xs);
}

.filters {
  display: grid;
  grid-template-columns: minmax(200px, 1.4fr) minmax(120px, .8fr) 120px 120px 120px minmax(300px, 1.5fr) auto auto;
  gap: 10px;
  align-items: center;
  margin-bottom: 18px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
}

.policy-note {
  margin-top: 14px;
  color: var(--text-tertiary);
  font-size: 13px;
  text-align: right;
}

code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.hash {
  word-break: break-all;
}

@media (max-width: 1350px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .filters {
    grid-template-columns: repeat(3, minmax(150px, 1fr));
  }
}

@media (max-width: 760px) {
  .page-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .stats-grid, .filters {
    grid-template-columns: 1fr;
  }

  .audit-panel {
    padding: 12px;
  }
}
</style>
