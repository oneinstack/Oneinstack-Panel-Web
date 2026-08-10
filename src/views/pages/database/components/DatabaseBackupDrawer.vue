<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Api } from '@/api/Api'
import System from '@/utils/System'
import i18n from '@/lang'

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
const t = (key: string, fallback: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params)
  return value && value !== key ? value : fallback
}

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
    ElMessage.success(t('database.backup.backupTaskCreated', 'Backup task created'))
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
      t('database.backup.restoreConfirmMessage', 'Restore will overwrite existing contents of database "{name}". The system creates a safety backup first. Enter the database name to confirm:', { name: props.library.name }),
      t('database.backup.restoreDatabase', 'Restore database'),
      {
        type: 'warning',
        confirmButtonText: t('database.backup.createSafetyBackupAndRestore', 'Create safety backup and restore'),
        cancelButtonText: t('common.cancel', 'Cancel'),
        inputPlaceholder: props.library.name,
        inputValidator: (value: string) => value === props.library?.name || t('database.backup.databaseNameMismatch', 'Database name does not match')
      }
    )
    await Api.restoreDatabaseBackup({
      libraryId: props.library.id,
      backupId: backup.id,
      confirmName: value
    })
    ElMessage.success(t('database.backup.restoreTaskCreated', 'Restore task created'))
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
      t('database.backup.deleteConfirmMessage', 'This only deletes the backup file and does not delete the database. Enter database name "{name}" to confirm:', { name: props.library.name }),
      t('database.backup.deleteBackup', 'Delete backup'),
      {
        type: 'warning',
        confirmButtonText: t('database.backup.deleteBackup', 'Delete backup'),
        cancelButtonText: t('common.cancel', 'Cancel'),
        inputPlaceholder: props.library.name,
        inputValidator: (value: string) => value === props.library?.name || t('database.backup.databaseNameMismatch', 'Database name does not match')
      }
    )
    await Api.deleteDatabaseBackup(backup.id, { confirmName: value })
    ElMessage.success(t('database.backup.backupDeleted', 'Backup deleted'))
    await loadData(true)
  } catch (error: any) {
    if (error === 'cancel' || error === 'close') return
    throw error
  }
}

const cancelTask = async (task: DatabaseTask) => {
  await Api.cancelDatabaseTask(task.id)
  ElMessage.success(t('database.backup.cancelSubmitted', 'Cancel request submitted'))
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
    let message = t('database.backup.downloadFailedWithStatus', 'Failed to download backup (HTTP {status})', { status: response.status })
    try {
      const body = await response.json()
      message = body?.message || body?.error?.message || message
    } catch {
      // Keep the status-based error.
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
  queued: t('database.backup.status.queued', 'Queued'),
  running: t('database.backup.status.running', 'Running'),
  canceling: t('database.backup.status.canceling', 'Canceling'),
  succeeded: t('common.success', 'Success'),
  failed: t('common.failed', 'Failed'),
  canceled: t('database.backup.status.canceled', 'Canceled'),
  interrupted: t('database.backup.status.interrupted', 'Interrupted')
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
  <custom-drawer
    :visible="modelValue"
    :title="library ? $t('database.backup.titleWithName', { name: library.name }) : $t('database.backup.title')"
    size="820px"
    destroy-on-close
    :show-footer="false"
    :on-close="close"
  >
    <el-alert
      type="info"
      :closable="false"
      show-icon
      :title="$t('database.backup.safetyTip')"
      style="margin-bottom: 16px"
    />
    <div class="backup-toolbar">
      <el-button type="primary" :loading="state.submitting" :disabled="hasActiveTask" @click="createBackup">
        {{ $t('database.backup.backupNow') }}
      </el-button>
      <el-button :loading="state.loading" @click="loadData()">{{ $t('common.refresh') }}</el-button>
      <span v-if="hasActiveTask" class="active-hint">{{ $t('database.backup.activeTaskHint') }}</span>
    </div>

    <el-tabs v-model="state.activeTab">
      <el-tab-pane :label="$t('database.backup.backupFiles')" name="backups">
        <el-table v-loading="state.loading" :data="state.backups" height="calc(100vh - 260px)">
          <el-table-column prop="fileName" :label="$t('database.backup.file')" min-width="220" show-overflow-tooltip />
          <el-table-column :label="$t('common.type')" width="110">
            <template #default="{ row }">
              <el-tag :type="row.source === 'pre_restore' ? 'warning' : 'success'">
                {{ row.source === 'pre_restore' ? $t('database.backup.preRestoreBackup') : $t('database.backup.manualBackup') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="$t('common.size')" width="100">
            <template #default="{ row }">{{ formatBytes(row.sizeBytes) }}</template>
          </el-table-column>
          <el-table-column :label="$t('database.backup.createdAt')" width="180">
            <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column :label="$t('common.action')" width="190" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link @click="downloadBackup(row)">{{ $t('common.download') }}</el-button>
              <el-button type="warning" link :disabled="hasActiveTask" @click="restoreBackup(row)">{{ $t('database.backup.restore') }}</el-button>
              <el-button type="danger" link :disabled="hasActiveTask" @click="deleteBackup(row)">{{ $t('common.delete') }}</el-button>
            </template>
          </el-table-column>
          <template #empty>{{ $t('database.backup.noBackups') }}</template>
        </el-table>
      </el-tab-pane>

      <el-tab-pane :label="$t('database.backup.taskProgress')" name="tasks">
        <div v-loading="state.loading" class="task-list">
          <div v-for="task in state.tasks" :key="task.id" class="task-card">
            <div class="task-header">
              <div>
                <el-tag :type="task.operation === 'restore' ? 'warning' : 'primary'">
                  {{ task.operation === 'restore' ? $t('database.backup.restore') : $t('database.backup.backup') }}
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
                {{ $t('database.backup.cancelTask') }}
              </el-button>
              <span v-if="task.safetyBackupId">{{ $t('database.backup.safetyBackupCreated') }}</span>
            </div>
          </div>
          <el-empty v-if="!state.tasks.length" :description="$t('database.backup.noTasks')" />
        </div>
      </el-tab-pane>
    </el-tabs>
  </custom-drawer>
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
