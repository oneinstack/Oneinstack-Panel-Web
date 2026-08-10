<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import { Back, Download, Refresh } from '@element-plus/icons-vue'
import { Api } from '@/api/Api'
import System from '@/utils/System'
import { ElMessage, ElMessageBox } from 'element-plus'
import i18n from '@/lang'

const taskID = Number(System.getRouterParams().id || 0)
const t = (key: string, fallback?: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params)
  return value && value !== key ? value : fallback || key
}
const loading = ref(false)
const exporting = ref(false)
const cleaning = ref(false)
const tableData = ref<any[]>([])
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })
const status = ref('')
const dateRange = ref<[Date, Date] | undefined>()
let refreshTimer: ReturnType<typeof setInterval> | undefined

const filterParams = () => ({
  status: status.value || undefined,
  start_at: dateRange.value?.[0]?.toISOString(),
  end_at: dateRange.value?.[1]?.toISOString()
})

const getData = async () => {
  if (!taskID) return
  loading.value = true
  try {
    const { data } = await Api.getPlanTaskLog({
      id: taskID,
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...filterParams()
    })
    tableData.value = data.data || []
    pagination.total = data.total || 0
  } finally {
    loading.value = false
  }
}

const search = () => {
  pagination.page = 1
  void getData()
}

const reset = () => {
  status.value = ''
  dateRange.value = undefined
  search()
}

const cancelExecution = async (execution: any) => {
  await ElMessageBox.confirm(
    t('task.log.cancelConfirm', 'Cancel this execution?'),
    t('task.log.cancelTitle', 'Cancel task execution'),
    { confirmButtonText: t('task.log.confirmCancel', 'Confirm cancel'), cancelButtonText: t('task.log.back', 'Back'), type: 'warning' }
  )
  await Api.cancelPlanTaskExecution(execution.id)
  ElMessage.success(t('task.log.cancelSubmitted', 'Cancel request submitted'))
  await getData()
}

const cleanupLogs = async () => {
  await ElMessageBox.confirm(
    t('task.log.cleanupConfirm', 'Clean expired scheduled-task execution logs?'),
    t('task.log.cleanupTitle', 'Clean expired logs'),
    { confirmButtonText: t('task.log.confirmCleanup', 'Confirm cleanup'), cancelButtonText: t('task.log.back', 'Back'), type: 'warning' }
  )
  cleaning.value = true
  try {
    const { data } = await Api.cleanupPlanTaskLogs()
    ElMessage.success(t('task.log.cleanupSuccess', '{count} expired execution logs cleaned', { count: data.deleted || 0 }))
    await getData()
  } finally {
    cleaning.value = false
  }
}

const exportLogs = async () => {
  exporting.value = true
  try {
    const params = new URLSearchParams()
    if (status.value) params.set('status', status.value)
    if (dateRange.value?.[0]) params.set('startAt', dateRange.value[0].toISOString())
    if (dateRange.value?.[1]) params.set('endAt', dateRange.value[1].toISOString())
    const api = String(System.env.API || '/v1').replace(/\/$/, '')
    const response = await fetch(`${api}/cron/${taskID}/log/export?${params.toString()}`, {
      credentials: 'include'
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `cron-${taskID}-executions.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  } catch {
    ElMessage.error(t('task.log.exportFailed', 'Failed to export execution logs'))
  } finally {
    exporting.value = false
  }
}

const formatDate = (value: string) => value ? new Date(value).toLocaleString() : '-'
const formatDuration = (value: number) => value >= 1000
  ? t('task.log.second', '{value} s', { value: (value / 1000).toFixed(2) })
  : t('task.log.millisecond', '{value} ms', { value: value || 0 })

const statusText = (status: string) => ({
  running: t('task.log.statuses.running', 'Running'),
  success: t('task.log.statuses.success', 'Success'),
  failed: t('task.log.statuses.failed', 'Failed'),
  timeout: t('task.log.statuses.timeout', 'Timeout'),
  canceled: t('task.log.statuses.canceled', 'Canceled'),
  skipped: t('task.log.statuses.skipped', 'Skipped')
}[status] || status)

const statusType = (status: string) => {
  if (status === 'success') return 'success'
  if (status === 'running') return 'warning'
  if (status === 'skipped' || status === 'canceled') return 'info'
  return 'danger'
}

onMounted(() => {
  void getData()
  refreshTimer = setInterval(() => {
    if (tableData.value.some((execution) => execution.status === 'running')) void getData()
  }, 3000)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>

<template>
  <div class="task-container">
    <el-card>
      <div class="toolbar">
        <el-button :icon="Back" @click="System.router.back()">{{ t('task.log.back', 'Back') }}</el-button>
        <strong>{{ t('task.log.title', 'Task #{id} execution logs', { id: taskID }) }}</strong>
        <el-button :icon="Download" :loading="exporting" @click="exportLogs">{{ t('task.log.exportCsv', 'Export CSV') }}</el-button>
        <el-button :loading="cleaning" @click="cleanupLogs">{{ t('task.log.cleanupExpired', 'Clean expired logs') }}</el-button>
        <el-button :icon="Refresh" :loading="loading" @click="getData">{{ t('task.log.refresh', 'Refresh') }}</el-button>
      </div>
      <div class="filters">
        <el-select v-model="status" clearable :placeholder="t('task.log.statusPlaceholder', 'Execution status')" @change="search">
          <el-option :label="t('task.log.statuses.running', 'Running')" value="running" />
          <el-option :label="t('task.log.statuses.success', 'Success')" value="success" />
          <el-option :label="t('task.log.statuses.failed', 'Failed')" value="failed" />
          <el-option :label="t('task.log.statuses.timeout', 'Timeout')" value="timeout" />
          <el-option :label="t('task.log.statuses.canceled', 'Canceled')" value="canceled" />
          <el-option :label="t('task.log.statuses.skipped', 'Skipped')" value="skipped" />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="datetimerange"
          :start-placeholder="t('task.log.startTime', 'Start time')"
          :end-placeholder="t('task.log.endTime', 'End time')"
          :range-separator="t('task.log.rangeSeparator', 'to')"
        />
        <el-button type="primary" @click="search">{{ t('task.log.search', 'Search') }}</el-button>
        <el-button @click="reset">{{ t('task.log.reset', 'Reset') }}</el-button>
      </div>
      <el-table
        v-loading="loading"
        :data="tableData"
        border
        :empty-text="t('task.log.empty', 'No execution records')"
        :row-key="(row: any) => row.id"
      >
        <el-table-column :label="t('task.status', 'Status')" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('task.log.trigger', 'Trigger')" width="100">
          <template #default="{ row }">{{ row.trigger === 'manual' ? t('task.log.manual', 'Manual') : t('task.log.scheduled', 'Scheduled') }}</template>
        </el-table-column>
        <el-table-column :label="t('task.log.executionTime', 'Execution time')" width="320">
          <template #default="{ row }">
            {{ formatDate(row.start_time) }} {{ t('task.log.rangeSeparator', 'to') }} {{ row.status === 'running' ? t('task.log.statuses.running', 'Running') : formatDate(row.end_time) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('task.log.duration', 'Duration')" width="110">
          <template #default="{ row }">{{ formatDuration(row.duration_ms) }}</template>
        </el-table-column>
        <el-table-column prop="exit_code" :label="t('task.log.exitCode', 'Exit code')" width="80" />
        <el-table-column :label="t('task.action', 'Action')" width="100">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'running'"
              link type="danger"
              @click="cancelExecution(row)"
            >
              {{ t('task.log.cancel', 'Cancel') }}
            </el-button>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('task.log.output', 'Output logs')" min-width="360">
          <template #default="{ row }">
            <pre class="execution-output">{{ row.output || (row.status === 'running' ? t('task.log.runningOutput', 'Task running...') : t('task.log.noOutput', 'No output')) }}</pre>
            <el-tag v-if="row.output_truncated" type="warning" size="small">{{ t('task.log.outputTruncated', 'Output truncated') }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        style="margin-top: 16px; justify-content: flex-end"
        @current-change="getData"
        @size-change="getData"
      />
    </el-card>
  </div>
</template>

<style scoped lang="less">
.task-container {
  padding: 22px;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  background: var(--surface-card);
  box-shadow: var(--shadow-xs);
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 18px;

  strong {
    flex: 1;
  }
}

.filters {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;

  .el-select {
    width: 150px;
  }
}

@media (max-width: 760px) {
  .toolbar,
  .filters {
    align-items: flex-start;
    flex-wrap: wrap;
  }
}

.execution-output {
  max-height: 240px;
  padding: 10px;
  margin: 0 0 6px;
  overflow: auto;
  color: #d4d4d4;
  white-space: pre-wrap;
  word-break: break-word;
  background: #1e1e1e;
  border: 1px solid #2c3950;
  border-radius: 10px;
}
</style>
