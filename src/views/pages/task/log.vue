<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import { Back, Download, Refresh } from '@element-plus/icons-vue'
import { Api } from '@/api/Api'
import System from '@/utils/System'
import { ElMessage, ElMessageBox } from 'element-plus'

const taskID = Number(System.getRouterParams().id || 0)
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
    '取消会终止本次执行及其子进程，已经产生的外部副作用不会自动回滚。确定继续吗？',
    '取消计划任务执行',
    { confirmButtonText: '确认取消', cancelButtonText: '返回', type: 'warning' }
  )
  await Api.cancelPlanTaskExecution(execution.id)
  ElMessage.success('已提交取消请求')
  await getData()
}

const cleanupLogs = async () => {
  await ElMessageBox.confirm(
    '将按照服务器配置的保留天数清理所有计划任务的过期执行日志，运行中的记录不会删除。',
    '清理过期日志',
    { confirmButtonText: '确认清理', cancelButtonText: '返回', type: 'warning' }
  )
  cleaning.value = true
  try {
    const { data } = await Api.cleanupPlanTaskLogs()
    ElMessage.success(`已清理 ${data.deleted || 0} 条过期执行日志`)
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
    ElMessage.error('导出执行日志失败')
  } finally {
    exporting.value = false
  }
}

const formatDate = (value: string) => value ? new Date(value).toLocaleString() : '-'
const formatDuration = (value: number) => value >= 1000
  ? `${(value / 1000).toFixed(2)} 秒`
  : `${value || 0} 毫秒`

const statusText = (status: string) => ({
  running: '执行中',
  success: '成功',
  failed: '失败',
  timeout: '超时',
  canceled: '已取消',
  skipped: '已跳过'
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
        <el-button :icon="Back" @click="System.router.back()">返回</el-button>
        <strong>任务 #{{ taskID }} 执行日志</strong>
        <el-button :icon="Download" :loading="exporting" @click="exportLogs">导出 CSV</el-button>
        <el-button :loading="cleaning" @click="cleanupLogs">清理过期日志</el-button>
        <el-button :icon="Refresh" :loading="loading" @click="getData">刷新</el-button>
      </div>
      <div class="filters">
        <el-select v-model="status" clearable placeholder="执行状态" @change="search">
          <el-option label="执行中" value="running" />
          <el-option label="成功" value="success" />
          <el-option label="失败" value="failed" />
          <el-option label="超时" value="timeout" />
          <el-option label="已取消" value="canceled" />
          <el-option label="已跳过" value="skipped" />
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
      <el-table
        v-loading="loading"
        :data="tableData"
        border
        empty-text="暂无执行记录"
        :row-key="(row: any) => row.id"
      >
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="触发方式" width="100">
          <template #default="{ row }">{{ row.trigger === 'manual' ? '手动' : '调度' }}</template>
        </el-table-column>
        <el-table-column label="执行时间" width="320">
          <template #default="{ row }">
            {{ formatDate(row.start_time) }} 至 {{ row.status === 'running' ? '执行中' : formatDate(row.end_time) }}
          </template>
        </el-table-column>
        <el-table-column label="耗时" width="110">
          <template #default="{ row }">{{ formatDuration(row.duration_ms) }}</template>
        </el-table-column>
        <el-table-column prop="exit_code" label="退出码" width="80" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'running'"
              link type="danger"
              @click="cancelExecution(row)"
            >
              取消
            </el-button>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column label="输出日志" min-width="360">
          <template #default="{ row }">
            <pre class="execution-output">{{ row.output || (row.status === 'running' ? '任务执行中…' : '无输出') }}</pre>
            <el-tag v-if="row.output_truncated" type="warning" size="small">输出已截断</el-tag>
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
