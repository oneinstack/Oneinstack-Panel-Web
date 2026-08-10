<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Api } from '@/api/Api'
import System from '@/utils/System'
import i18n from '@/lang'

interface RuntimeLogEntry {
  id: number
  occurredAt: string
  level: 'debug' | 'info' | 'warning' | 'error'
  source: string
  message: string
}

interface RuntimeLogResult {
  items: RuntimeLogEntry[]
  nextCursor: number
  oldestId: number
  hasMore: boolean
}

interface RuntimeLogStats {
  total: number
  last24Hours: number
  errorCount: number
  latestId: number
  dropped: number
  retentionDays: number
  sources: Array<{ source: string; count: number }>
}

const t = (key: string, fallback?: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params)
  return value && value !== key ? value : fallback || key
}

const entries = ref<RuntimeLogEntry[]>([])
const stats = ref<RuntimeLogStats>({
  total: 0,
  last24Hours: 0,
  errorCount: 0,
  latestId: 0,
  dropped: 0,
  retentionDays: 0,
  sources: []
})
const loading = ref(false)
const loadingOlder = ref(false)
const streamState = ref<'connecting' | 'live' | 'reconnecting' | 'paused' | 'history'>('connecting')
const level = ref('')
const source = ref('')
const keyword = ref('')
const appliedKeyword = ref('')
const dateRange = ref<[Date, Date] | undefined>()
const hasOlder = ref(false)
const oldestID = ref(0)
const latestID = ref(0)
const autoScroll = ref(true)
const consoleBox = ref<HTMLElement>()
let eventSource: EventSource | undefined
let statsTimer: ReturnType<typeof setInterval> | undefined

const historicalMode = computed(() => Boolean(dateRange.value?.length))
const streamLabel = computed(() => ({
  connecting: t('runtimeLog.connecting', '正在连接'),
  live: t('runtimeLog.live', '实时连接'),
  reconnecting: t('runtimeLog.reconnecting', '断线重连'),
  paused: t('runtimeLog.paused', '已暂停'),
  history: t('runtimeLog.history', '历史查询')
}[streamState.value]))
const streamType = computed(() => ({
  connecting: 'warning',
  live: 'success',
  reconnecting: 'danger',
  paused: 'info',
  history: 'info'
}[streamState.value]) as 'warning' | 'success' | 'danger' | 'info')

const queryParams = (extra: Record<string, any> = {}) => ({
  level: level.value || undefined,
  source: source.value || undefined,
  q: appliedKeyword.value || undefined,
  startAt: dateRange.value?.[0]?.toISOString(),
  endAt: dateRange.value?.[1]?.toISOString(),
  ...extra
})

const loadStats = async () => {
  const { data } = await Api.getRuntimeLogStats()
  stats.value = data
}

const appendEntry = (entry: RuntimeLogEntry) => {
  if (entries.value.some((item) => item.id === entry.id)) return
  entries.value.push(entry)
  entries.value.sort((left, right) => left.id - right.id)
  latestID.value = Math.max(latestID.value, entry.id)
  if (!oldestID.value || entry.id < oldestID.value) oldestID.value = entry.id
  if (entries.value.length > 2000) {
    entries.value.splice(0, entries.value.length - 2000)
    oldestID.value = entries.value[0]?.id || 0
    hasOlder.value = true
  }
  if (autoScroll.value) void scrollToBottom()
}

const mergeResult = (result: RuntimeLogResult, prepend = false) => {
  const known = new Set(entries.value.map((entry) => entry.id))
  const incoming = (result.items || []).filter((entry) => !known.has(entry.id))
  entries.value = prepend ? [...incoming, ...entries.value] : [...entries.value, ...incoming]
  entries.value.sort((left, right) => left.id - right.id)
  oldestID.value = entries.value[0]?.id || 0
  latestID.value = entries.value[entries.value.length - 1]?.id || latestID.value
  hasOlder.value = result.hasMore
}

const loadInitial = async () => {
  disconnectStream()
  loading.value = true
  try {
    const { data } = await Api.getRuntimeLogs(queryParams({ limit: 500 }))
    const result = data as RuntimeLogResult
    entries.value = result.items || []
    oldestID.value = result.oldestId || entries.value[0]?.id || 0
    latestID.value = result.nextCursor || entries.value[entries.value.length - 1]?.id || 0
    hasOlder.value = result.hasMore
    await nextTick()
    await scrollToBottom()
    if (historicalMode.value) streamState.value = 'history'
    else connectStream()
  } finally {
    loading.value = false
  }
}

const loadOlder = async () => {
  if (!oldestID.value || loadingOlder.value) return
  loadingOlder.value = true
  try {
    const { data } = await Api.getRuntimeLogs(queryParams({
      beforeId: oldestID.value,
      limit: 500
    }))
    mergeResult(data as RuntimeLogResult, true)
  } finally {
    loadingOlder.value = false
  }
}

const catchUp = async () => {
  let cursor = latestID.value
  for (let page = 0; page < 10; page++) {
    const { data } = await Api.getRuntimeLogs(queryParams({ afterId: cursor, limit: 1000 }))
    const result = data as RuntimeLogResult
    for (const entry of result.items || []) appendEntry(entry)
    cursor = result.nextCursor || cursor
    if (!result.hasMore) break
  }
}

const streamURL = () => {
  const params = new URLSearchParams()
  if (latestID.value) params.set('afterId', String(latestID.value))
  if (level.value) params.set('level', level.value)
  if (source.value) params.set('source', source.value)
  if (appliedKeyword.value) params.set('q', appliedKeyword.value)
  const api = String(System.env.API || '/v1').replace(/\/$/, '')
  return `${api}/log/runtime/stream?${params.toString()}`
}

const connectStream = () => {
  if (historicalMode.value || streamState.value === 'paused') return
  disconnectStream(false)
  streamState.value = 'connecting'
  eventSource = new EventSource(streamURL(), { withCredentials: true })
  eventSource.onopen = () => {
    streamState.value = 'live'
  }
  eventSource.addEventListener('log', (event) => {
    try {
      appendEntry(JSON.parse((event as MessageEvent).data) as RuntimeLogEntry)
    } catch {
      streamState.value = 'reconnecting'
    }
  })
  eventSource.onerror = () => {
    if (streamState.value !== 'paused') streamState.value = 'reconnecting'
  }
}

const disconnectStream = (markPaused = false) => {
  eventSource?.close()
  eventSource = undefined
  if (markPaused) streamState.value = 'paused'
}

const toggleStream = async () => {
  if (streamState.value === 'paused') {
    streamState.value = 'connecting'
    await catchUp()
    connectStream()
  } else {
    disconnectStream(true)
  }
}

const applyFilters = async () => {
  appliedKeyword.value = keyword.value.trim()
  await loadInitial()
}

const resetFilters = async () => {
  level.value = ''
  source.value = ''
  keyword.value = ''
  appliedKeyword.value = ''
  dateRange.value = undefined
  await loadInitial()
}

const clearView = () => {
  entries.value = []
  oldestID.value = 0
  hasOlder.value = false
  ElMessage.success(t('runtimeLog.clearViewSuccess', '已清空浏览器中的当前视图，服务器日志未删除'))
}

const exportVisible = () => {
  if (!entries.value.length) {
    ElMessage.warning(t('runtimeLog.noExportLogs', '当前没有可导出的日志'))
    return
  }
  const content = entries.value.map((entry) =>
    `${entry.occurredAt}\t${entry.level.toUpperCase()}\t${entry.source}\t${entry.message}`
  ).join('\n')
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `oneinstack-runtime-${Date.now()}.log`
  anchor.click()
  URL.revokeObjectURL(url)
}

const copyVisible = async () => {
  if (!entries.value.length) {
    ElMessage.warning(t('runtimeLog.noCopyLogs', '当前没有可复制的日志'))
    return
  }
  const content = entries.value.map((entry) =>
    `${formatTime(entry.occurredAt)} ${entry.level.toUpperCase()} [${entry.source}] ${entry.message}`
  ).join('\n')
  try {
    let copied = false
    if (window.isSecureContext && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(content)
        copied = true
      } catch {
        // Continue with the compatibility copy below.
      }
    }

    if (!copied) {
      const textarea = document.createElement('textarea')
      textarea.value = content
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      textarea.style.pointerEvents = 'none'
      document.body.appendChild(textarea)
      try {
        textarea.focus()
        textarea.select()
        copied = document.execCommand('copy')
      } finally {
        textarea.remove()
      }
    }

    if (!copied) throw new Error(t('runtimeLog.copyRejected', '浏览器拒绝复制'))
    ElMessage.success(t('runtimeLog.copied', '当前视图已复制'))
  } catch (error: any) {
    ElMessage.error(error?.message || t('runtimeLog.copyFailed', '复制失败，请检查浏览器剪贴板权限'))
  }
}

const scrollToBottom = async () => {
  await nextTick()
  if (consoleBox.value) consoleBox.value.scrollTop = consoleBox.value.scrollHeight
}

const formatTime = (value: string) => new Date(value).toLocaleString()

onMounted(async () => {
  await Promise.all([loadStats(), loadInitial()])
  statsTimer = setInterval(() => void loadStats(), 30_000)
})

onUnmounted(() => {
  disconnectStream()
  if (statsTimer) clearInterval(statsTimer)
})
</script>

<template>
  <div class="runtime-page">
    <div class="page-heading">
      <div>
        <h2>{{ $t('runtimeLog.title') }}</h2>
        <p>{{ $t('runtimeLog.fullDescription') }}</p>
      </div>
      <div class="heading-actions">
        <el-tag :type="streamType" effect="dark">{{ streamLabel }}</el-tag>
        <el-button v-if="!historicalMode" @click="toggleStream">
          {{ streamState === 'paused' ? $t('runtimeLog.resumeLive') : $t('runtimeLog.pauseLive') }}
        </el-button>
        <el-button type="primary" :loading="loading" @click="applyFilters">{{ $t('common.refresh') }}</el-button>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <span>{{ $t('runtimeLog.currentRetention') }}</span>
        <strong>{{ stats.total }}</strong>
        <small>{{ $t('runtimeLog.retentionDays', { days: stats.retentionDays || '—' }) }}</small>
      </div>
      <div class="stat-card success">
        <span>{{ $t('runtimeLog.last24Hours') }}</span>
        <strong>{{ stats.last24Hours }}</strong>
        <small>{{ $t('runtimeLog.latestCursor', { cursor: stats.latestId || 0 }) }}</small>
      </div>
      <div class="stat-card danger">
        <span>{{ $t('runtimeLog.errorLogs') }}</span>
        <strong>{{ stats.errorCount }}</strong>
        <small>{{ $t('runtimeLog.retentionCycleHint') }}</small>
      </div>
      <div class="stat-card warning">
        <span>{{ $t('runtimeLog.droppedWrites') }}</span>
        <strong>{{ stats.dropped }}</strong>
        <small>{{ $t('runtimeLog.droppedHint') }}</small>
      </div>
    </div>

    <div class="log-panel">
      <div class="filters">
        <el-select v-model="level" clearable :placeholder="$t('runtimeLog.level')">
          <el-option label="DEBUG" value="debug" />
          <el-option label="INFO" value="info" />
          <el-option label="WARNING" value="warning" />
          <el-option label="ERROR" value="error" />
        </el-select>
        <el-select v-model="source" clearable filterable :placeholder="$t('runtimeLog.source')">
          <el-option
            v-for="item in stats.sources"
            :key="item.source"
            :label="`${item.source}（${item.count}）`"
            :value="item.source"
          />
        </el-select>
        <el-input v-model="keyword" clearable :placeholder="$t('runtimeLog.keyword')" @keyup.enter="applyFilters" />
        <el-date-picker
          v-model="dateRange"
          type="datetimerange"
          :start-placeholder="$t('runtimeLog.startTime')"
          :end-placeholder="$t('runtimeLog.endTime')"
          :range-separator="$t('runtimeLog.rangeSeparator')"
        />
        <el-button class="filter-action" type="primary" @click="applyFilters">{{ $t('common.query') }}</el-button>
        <el-button class="filter-action" @click="resetFilters">{{ $t('common.reset') }}</el-button>
      </div>

      <div class="console-toolbar">
        <div>
          <el-button :disabled="!hasOlder || !oldestID" :loading="loadingOlder" @click="loadOlder">
            {{ $t('runtimeLog.loadOlder') }}
          </el-button>
          <span>{{ $t('runtimeLog.visibleCount', { count: entries.length }) }}</span>
        </div>
        <div>
          <el-switch v-model="autoScroll" :active-text="$t('runtimeLog.autoScroll')" />
          <el-button link type="primary" @click="scrollToBottom">{{ $t('runtimeLog.scrollBottom') }}</el-button>
          <el-button link type="primary" @click="copyVisible">{{ $t('common.copy') }}</el-button>
          <el-button link type="primary" @click="exportVisible">{{ $t('runtimeLog.exportVisible') }}</el-button>
          <el-button link @click="clearView">{{ $t('runtimeLog.clearView') }}</el-button>
        </div>
      </div>

      <div ref="consoleBox" v-loading="loading" class="log-console">
        <div v-for="entry in entries" :key="entry.id" class="log-line" :class="`level-${entry.level}`">
          <span class="cursor">#{{ entry.id }}</span>
          <span class="time">{{ formatTime(entry.occurredAt) }}</span>
          <span class="level">{{ entry.level.toUpperCase() }}</span>
          <span class="source">[{{ entry.source }}]</span>
          <span class="message">{{ entry.message }}</span>
        </div>
        <el-empty v-if="!loading && !entries.length" :description="$t('runtimeLog.noLogs')" />
      </div>

      <el-alert
        v-if="stats.dropped > 0"
        class="drop-alert"
        type="warning"
        :closable="false"
        show-icon
        :title="$t('runtimeLog.droppedTitle', { count: stats.dropped })"
      />
    </div>
  </div>
</template>

<style scoped lang="less">
.runtime-page {
  padding-bottom: 28px;
}

.page-heading, .heading-actions, .console-toolbar, .console-toolbar > div {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-heading {
  justify-content: space-between;
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
  strong { margin: 6px 0; font-size: 28px; line-height: 1; }
  &.success strong { color: #37a878; }
  &.danger strong { color: #e25d5d; }
  &.warning strong { color: #d89532; }
}

.log-panel {
  padding: 20px;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  background: var(--surface-card);
  box-shadow: var(--shadow-xs);
}

.filters {
  display: grid;
  grid-template-columns: 140px 180px minmax(220px, 1fr) minmax(320px, 1.3fr) auto auto;
  gap: 10px;
  margin-bottom: 16px;

  .filter-action {
    margin-left: 0;
  }
}

.console-toolbar {
  justify-content: space-between;
  margin-bottom: 10px;
  color: var(--text-tertiary);
  font-size: 13px;
}

.log-console {
  min-height: 460px;
  max-height: calc(100vh - 430px);
  overflow: auto;
  padding: 12px 0;
  border: 1px solid #273349;
  border-radius: 11px;
  background: #0f172a;
  color: #d7deea;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  line-height: 1.65;
}

.log-line {
  display: grid;
  grid-template-columns: 72px 164px 76px 100px minmax(320px, 1fr);
  gap: 8px;
  padding: 2px 12px;

  &:hover { background: rgba(255, 255, 255, .05); }
  .cursor, .time, .source { color: #8490a4; }
  .level { font-weight: 700; }
  .message { white-space: pre-wrap; overflow-wrap: anywhere; }

  &.level-debug .level { color: #8a97aa; }
  &.level-info .level { color: #61afef; }
  &.level-warning .level { color: #e5c07b; }
  &.level-error .level, &.level-error .message { color: #ef6b73; }
}

.drop-alert {
  margin-top: 14px;
}

@media (max-width: 1250px) {
  .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .filters { grid-template-columns: repeat(3, minmax(180px, 1fr)); }
}

@media (max-width: 760px) {
  .page-heading, .console-toolbar { align-items: flex-start; flex-direction: column; }
  .heading-actions { flex-wrap: wrap; }
  .stats-grid, .filters { grid-template-columns: 1fr; }
  .log-panel { padding: 12px; }
  .log-console { max-height: 65vh; }
  .log-line {
    grid-template-columns: 70px 1fr;
    .message { grid-column: 1 / -1; }
  }
}
</style>
