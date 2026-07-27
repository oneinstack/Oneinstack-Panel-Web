<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Api } from '@/api/Api'
import System from '@/utils/System'

interface DatabaseLibrary {
  id: number
  name: string
  p_addr?: string
}

interface DatabaseBackup {
  id: string
  databaseName: string
  source: 'manual' | 'pre_restore'
  fileName: string
  sizeBytes: number
  sha256: string
  createdAt: string
}

interface DatabaseTask {
  id: string
  operation: 'backup' | 'restore'
  status: string
  progress: number
  message: string
  errorMessage?: string
  resultBackupId?: string
  safetyBackupId?: string
  createdAt: string
}

const props = defineProps<{
  modelValue: boolean
  library: DatabaseLibrary | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const terminalStatuses = new Set(['succeeded', 'failed', 'canceled', 'interrupted'])
let pollTimer = 0

const state = reactive({
  activeTab: 'backups',
  loading: false,
  submitting: false,
  backups: [] as DatabaseBackup[],
  tasks: [] as DatabaseTask[]
})

const hasActiveTask = computed(() =>
  state.tasks.some((task) => !terminalStatuses.has(task.status))
)

const loadData = async (quiet = false) => {
  if (!props.library) return
  if (!quiet) state.loading = true
  try {
    const [backupResponse, taskResponse] = await Promise.all([
      Api.getDatabaseBackups({ libraryId: props.library.id, page: 1, pageSize: 100 }),
      Api.getDatabaseTasks({ libraryId: props.library.id, page: 1, pageSize: 100 })
    ])
    state.backups = backupResponse.data.data || []
    state.tasks = taskResponse.data.data || []
    configurePolling()
  } finally {
    if (!quiet) state.loading = false
  }
}

const configurePolling = () => {
  window.clearInterval(pollTimer)
  pollTimer = 0
  if (!props.modelValue || !hasActiveTask.value) return
  pollTimer = window.setInterval(() => {
    void loadData(true).catch(() => undefined)
  }, 2000)
}

const close = () => {
  emit('update:modelValue', false)
}

const createBackup = async () => {
  if (!props.library || state.submitting) return
  state.submitting = true
  try {
    await Api.createDatabaseBackup({ libraryId: props.library.id })
    ElMessage.success('备份任务已创建')
    state.activeTab = 'tasks'
    await loadData(true)
  } finally {
    state.submitting = false
  }
}

const restoreBackup = async (backup: DatabaseBackup) => {
  if (!props.library) return
  try {
    const { value } = await ElMessageBox.prompt(
      `恢复会覆盖数据库“${props.library.name}”的现有内容。系统会先自动创建安全备份。请输入数据库名确认：`,
      '恢复数据库',
      {
        type: 'warning',
        confirmButtonText: '创建安全备份并恢复',
        cancelButtonText: '取消',
        inputPlaceholder: props.library.name,
        inputValidator: (value: string) => value === props.library?.name || '数据库名不匹配'
      }
    )
    await Api.restoreDatabaseBackup({
      libraryId: props.library.id,
      backupId: backup.id,
      confirmName: value
    })
    ElMessage.success('恢复任务已创建')
    state.activeTab = 'tasks'
    await loadData(true)
  } catch (error: any) {
    if (error === 'cancel' || error === 'close') return
    throw error
  }
}

const deleteBackup = async (backup: DatabaseBackup) => {
  if (!props.library) return
  try {
    const { value } = await ElMessageBox.prompt(
      `此操作只删除备份文件，不会删除数据库。请输入数据库名“${props.library.name}”确认：`,
      '删除备份',
      {
        type: 'warning',
        confirmButtonText: '删除备份',
        cancelButtonText: '取消',
        inputPlaceholder: props.library.name,
        inputValidator: (value: string) => value === props.library?.name || '数据库名不匹配'
      }
    )
    await Api.deleteDatabaseBackup(backup.id, { confirmName: value })
    ElMessage.success('备份已删除')
    await loadData(true)
  } catch (error: any) {
    if (error === 'cancel' || error === 'close') return
    throw error
  }
}

const cancelTask = async (task: DatabaseTask) => {
  await Api.cancelDatabaseTask(task.id)
  ElMessage.success('已提交取消请求')
  await loadData(true)
}

const downloadBackup = async (backup: DatabaseBackup) => {
  const apiBase = new URL(System.env.API || '/v1', window.location.origin)
  const prefix = apiBase.pathname.replace(/\/$/, '')
  const url = new URL(
    `${prefix}/storage/backups/${encodeURIComponent(backup.id)}/download`,
    apiBase.origin
  )
  const response = await fetch(url, { credentials: 'include', headers: { Accept: 'application/gzip' } })
  if (!response.ok) {
    let message = `下载备份失败（HTTP ${response.status}）`
    try {
      const body = await response.json()
      message = body?.message || body?.error?.message || message
    } catch {
      // 保留 HTTP 状态错误。
    }
    throw new Error(message)
  }
  const blob = await response.blob()
  const objectURL = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectURL
  link.download = backup.fileName
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(objectURL)
}

const formatBytes = (value: number) => {
  if (!value) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1)
  return `${(value / Math.pow(1024, index)).toFixed(index ? 2 : 0)} ${units[index]}`
}

const formatTime = (value: string) => value ? new Date(value).toLocaleString() : '-'

const statusText = (status: string) => ({
  queued: '排队中',
  running: '执行中',
  canceling: '取消中',
  succeeded: '成功',
  failed: '失败',
  canceled: '已取消',
  interrupted: '已中断'
}[status] || status)

const statusType = (status: string) => {
  if (status === 'succeeded') return 'success'
  if (status === 'failed' || status === 'interrupted') return 'danger'
  if (status === 'canceled') return 'info'
  return 'warning'
}

watch(
  () => [props.modelValue, props.library?.id],
  async ([visible]) => {
    window.clearInterval(pollTimer)
    pollTimer = 0
    if (visible) await loadData()
  }
)

onBeforeUnmount(() => window.clearInterval(pollTimer))
</script>

<template>
  <el-drawer
    :model-value="modelValue"
    :title="library ? `${library.name} · 备份与恢复` : '备份与恢复'"
    size="820px"
    destroy-on-close
    @close="close"
  >
    <el-alert
      type="info"
      :closable="false"
      show-icon
      title="恢复前会自动创建安全备份；所有备份下载前都会校验 SHA-256 完整性。"
      style="margin-bottom: 16px"
    />
    <div class="backup-toolbar">
      <el-button type="primary" :loading="state.submitting" :disabled="hasActiveTask" @click="createBackup">
        立即备份
      </el-button>
      <el-button :loading="state.loading" @click="loadData()">刷新</el-button>
      <span v-if="hasActiveTask" class="active-hint">当前数据库有任务执行中</span>
    </div>

    <el-tabs v-model="state.activeTab">
      <el-tab-pane label="备份文件" name="backups">
        <el-table v-loading="state.loading" :data="state.backups" height="calc(100vh - 260px)">
          <el-table-column prop="fileName" label="文件" min-width="220" show-overflow-tooltip />
          <el-table-column label="类型" width="110">
            <template #default="{ row }">
              <el-tag :type="row.source === 'pre_restore' ? 'warning' : 'success'">
                {{ row.source === 'pre_restore' ? '恢复前安全备份' : '手动备份' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="大小" width="100">
            <template #default="{ row }">{{ formatBytes(row.sizeBytes) }}</template>
          </el-table-column>
          <el-table-column label="创建时间" width="180">
            <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="190" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link @click="downloadBackup(row)">下载</el-button>
              <el-button type="warning" link :disabled="hasActiveTask" @click="restoreBackup(row)">恢复</el-button>
              <el-button type="danger" link :disabled="hasActiveTask" @click="deleteBackup(row)">删除</el-button>
            </template>
          </el-table-column>
          <template #empty>暂无备份</template>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="任务进度" name="tasks">
        <div v-loading="state.loading" class="task-list">
          <div v-for="task in state.tasks" :key="task.id" class="task-card">
            <div class="task-header">
              <div>
                <el-tag :type="task.operation === 'restore' ? 'warning' : 'primary'">
                  {{ task.operation === 'restore' ? '恢复' : '备份' }}
                </el-tag>
                <el-tag :type="statusType(task.status)" style="margin-left: 8px">
                  {{ statusText(task.status) }}
                </el-tag>
              </div>
              <span>{{ formatTime(task.createdAt) }}</span>
            </div>
            <el-progress
              :percentage="task.progress"
              :status="task.status === 'failed' || task.status === 'interrupted' ? 'exception' : task.status === 'succeeded' ? 'success' : undefined"
              style="margin: 14px 0 8px"
            />
            <div class="task-message">{{ task.errorMessage || task.message }}</div>
            <div class="task-actions">
              <el-button
                v-if="!terminalStatuses.has(task.status)"
                type="danger"
                link
                @click="cancelTask(task)"
              >
                取消任务
              </el-button>
              <span v-if="task.safetyBackupId">已创建恢复前安全备份</span>
            </div>
          </div>
          <el-empty v-if="!state.tasks.length" description="暂无备份或恢复任务" />
        </div>
      </el-tab-pane>
    </el-tabs>
  </el-drawer>
</template>

<style scoped lang="less">
.backup-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.active-hint {
  color: var(--el-color-warning);
  font-size: 13px;
}

.task-list {
  min-height: 240px;
  max-height: calc(100vh - 260px);
  overflow: auto;
}

.task-card {
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
}

.task-header,
.task-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--font-color-gray);
  font-size: 13px;
}

.task-message {
  color: var(--font-color-black);
  word-break: break-word;
}

.task-actions {
  min-height: 26px;
  margin-top: 8px;
}
</style>
