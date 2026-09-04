<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, watch } from 'vue'
import { Api } from '@/api/modules'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CircleClose, Delete, Document, Download, RefreshLeft } from '@element-plus/icons-vue'
import type { ColumnItem } from '@/components/custom-table.vue'
import i18n from '@/lang'
import { hasOperationAccess } from '@/utils/access'

const props = defineProps<{
  modelValue: boolean
  website?: Record<string, any> | null
  canRead?: boolean
  canWrite?: boolean
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'changed'): void
}>()

const state = reactive({
  loading: false,
  submitting: false,
  databaseId: 0,
  databases: [] as Record<string, any>[],
  backups: [] as Record<string, any>[],
  tasks: [] as Record<string, any>[],
  logVisible: false,
  logTitle: '',
  logContent: ''
})
const t = i18n.t as any

let timer: number | undefined

const activeStatuses = new Set(['queued', 'running', 'canceling'])
const selectedWebsiteId = computed(() => Number(props.website?.id || 0))
const canReadWebsite = computed(() => props.canRead === true)
const canWriteWebsite = computed(() => props.canWrite === true)
const canReadDatabase = computed(() => hasOperationAccess('database', 'read'))
const title = computed(() =>
  selectedWebsiteId.value
    ? t('website.backupDrawer.title', { name: props.website?.name || '' })
    : t('website.backupDrawer.manager')
)

const backupColumns = computed<ColumnItem[]>(() => [
  { prop: 'websiteName', label: t('website.backupDrawer.website'), minWidth: 150 },
  { prop: 'source', label: t('website.backupDrawer.source'), width: 150, slot: 'source' },
  { prop: 'databaseName', label: t('website.backupDrawer.database'), minWidth: 130, slot: 'databaseName' },
  { prop: 'sizeBytes', label: t('website.backupDrawer.size'), width: 110, slot: 'sizeBytes' },
  { prop: 'createdAt', label: t('website.backupDrawer.createdAt'), width: 180, slot: 'backupCreatedAt' },
  { prop: 'backupAction', label: t('website.backupDrawer.action'), width: 240, fixed: 'right', slot: 'backupAction', className: 'table-action-column' }
])

const taskColumns = computed<ColumnItem[]>(() => [
  { prop: 'websiteName', label: t('website.backupDrawer.website'), minWidth: 150 },
  { prop: 'operation', label: t('website.backupDrawer.action'), width: 110, slot: 'operation' },
  { prop: 'status', label: t('website.backupDrawer.status'), width: 110, slot: 'status' },
  { prop: 'progress', label: t('website.backupDrawer.progress'), minWidth: 180, slot: 'progress' },
  { prop: 'createdAt', label: t('website.backupDrawer.createdAt'), width: 180, slot: 'taskCreatedAt' },
  { prop: 'taskAction', label: t('website.backupDrawer.action'), width: 170, fixed: 'right', slot: 'taskAction', className: 'table-action-column' }
])

const statusLabel = (status: string) => t(`website.backupDrawer.statuses.${status}`) || status

const statusType = (status: string) => {
  if (status === 'succeeded') return 'success'
  if (status === 'failed' || status === 'interrupted') return 'danger'
  if (status === 'canceled') return 'info'
  return 'warning'
}

const operationLabel = (operation: string) => t(`website.backupDrawer.operations.${operation}`) || operation

const sourceLabel = (source: string) => t(`website.backupDrawer.sources.${source}`) || source

const formatBytes = (value: number) => {
  if (!value) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1)
  return `${(value / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 2)} ${units[index]}`
}

const formatTime = (value?: string) => value ? new Date(value).toLocaleString() : '-'

const loadDatabases = async () => {
  if (!canReadDatabase.value) return
  const { data } = await Api.getDatabaseList({
    type: 'mysql',
    page: 1,
    pageSize: 100
  })
  state.databases = data?.data || []
}

const loadData = async (silent = false) => {
  if (!props.modelValue || !canReadWebsite.value) return
  if (!silent) state.loading = true
  try {
    const params: Record<string, any> = { page: 1, pageSize: 100 }
    if (selectedWebsiteId.value) params.websiteId = selectedWebsiteId.value
    const [{ data: backups }, { data: tasks }] = await Promise.all([
      Api.getWebsiteBackups(params),
      Api.getWebsiteTasks(params)
    ])
    state.backups = backups?.data || []
    state.tasks = tasks?.data || []
  } finally {
    if (!silent) state.loading = false
  }
}

const startPolling = () => {
  if (timer) window.clearInterval(timer)
  timer = window.setInterval(async () => {
    if (state.tasks.some((task) => activeStatuses.has(task.status))) {
      await loadData(true)
      emit('changed')
    }
  }, 2000)
}

const createBackup = async () => {
  if (!selectedWebsiteId.value || !canWriteWebsite.value) return
  state.submitting = true
  try {
    await Api.createWebsiteBackup({
      websiteId: selectedWebsiteId.value,
      databaseId: state.databaseId || undefined
    })
    ElMessage.success(i18n.t('website.notifications.backupTaskCreated'))
    await loadData()
  } finally {
    state.submitting = false
  }
}

const restoreBackup = async (backup: Record<string, any>) => {
  if (!canWriteWebsite.value) return
  try {
    const { value } = await ElMessageBox.prompt(
      t('website.backupDrawer.restorePrompt', { database: backup.databaseId ? t('website.backupDrawer.restoreDatabase') : '', name: backup.websiteName }),
      t('website.backupDrawer.restoreTitle'),
      {
        type: 'warning',
        confirmButtonText: t('website.backupDrawer.startRestore'),
        cancelButtonText: t('website.backupDrawer.cancel'),
        inputPlaceholder: backup.websiteName,
        inputValidator: (value: string) => value === backup.websiteName || t('website.backupDrawer.nameMismatch')
      }
    )
    await Api.restoreWebsiteBackup({ backupId: backup.id, confirmName: value })
    ElMessage.success(i18n.t('website.notifications.restoreTaskCreated'))
    await loadData()
  } catch (error: any) {
    if (error === 'cancel' || error === 'close') return
    throw error
  }
}

const deleteBackup = async (backup: Record<string, any>) => {
  if (!canWriteWebsite.value) return
  try {
    const { value } = await ElMessageBox.prompt(
      t('website.backupDrawer.deletePrompt', { file: backup.fileName, name: backup.websiteName }),
      t('website.backupDrawer.deleteTitle'),
      {
        type: 'warning',
        confirmButtonText: t('website.backupDrawer.permanentDelete'),
        cancelButtonText: t('website.backupDrawer.cancel'),
        inputPlaceholder: backup.websiteName,
        inputValidator: (value: string) => value === backup.websiteName || t('website.backupDrawer.nameMismatch')
      }
    )
    await Api.deleteWebsiteBackup(backup.id, { confirmName: value })
    ElMessage.success(i18n.t('website.notifications.backupDeleted'))
    await loadData()
  } catch (error: any) {
    if (error === 'cancel' || error === 'close') return
    throw error
  }
}

const downloadBackup = (backup: Record<string, any>) => {
  if (!canReadWebsite.value) return
  window.location.assign(`/v1/website/backups/${encodeURIComponent(backup.id)}/download`)
}

const cancelTask = async (task: Record<string, any>) => {
  if (!canWriteWebsite.value) return
  await Api.cancelWebsiteTask(task.id)
  ElMessage.success(i18n.t('website.notifications.cancelSubmitted'))
  await loadData()
}

const showLog = async (task: Record<string, any>) => {
  if (!canReadWebsite.value) return
  const { data } = await Api.getWebsiteTaskLog(task.id, { cursor: 0, limit: 65536 })
  state.logTitle = `${task.websiteName} · ${operationLabel(task.operation)}${t('website.backupDrawer.logSuffix')}`
  state.logContent = data?.content || t('website.backupDrawer.noLog')
  state.logVisible = true
}

watch(
  () => props.modelValue,
  async (visible) => {
    if (!visible) {
      if (timer) window.clearInterval(timer)
      timer = undefined
      return
    }
    state.databaseId = 0
    await Promise.all([loadDatabases(), loadData()])
    startPolling()
  }
)

watch(selectedWebsiteId, () => {
  if (props.modelValue) loadData()
})

onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer)
})
</script>

<template>
  <custom-drawer
    :visible="modelValue"
    :title="title"
    size="78%"
    destroy-on-close
    :show-footer="false"
    :on-close="() => emit('update:modelValue', false)"
  >
    <el-alert
      :title="t('website.backupDrawer.tip')"
      type="info"
      show-icon
      :closable="false"
      class="backup-tip"
    />

    <div class="toolbar">
      <template v-if="selectedWebsiteId">
        <el-select v-model="state.databaseId" style="width: 260px" :disabled="!canWriteWebsite || !canReadDatabase" :placeholder="t('website.backupDrawer.databasePlaceholder')">
          <el-option :label="t('website.backupDrawer.excludeDatabase')" :value="0" />
          <el-option
            v-for="database in state.databases"
            :key="database.id"
            :label="database.name"
            :value="database.id"
          />
        </el-select>
        <el-button v-if="canWriteWebsite" type="primary" :loading="state.submitting" @click="createBackup">
          {{ t('website.backupDrawer.backupNow') }}
        </el-button>
      </template>
      <span v-else class="toolbar-note">{{ t('website.backupDrawer.deletedSiteTip') }}</span>
      <el-button v-if="canReadWebsite" @click="loadData()">{{ t('website.backupDrawer.refresh') }}</el-button>
    </div>

    <el-tabs class="backup-tabs">
      <el-tab-pane :label="t('website.backupDrawer.backupFiles')">
        <custom-table v-loading="state.loading" :data="state.backups" :columns="backupColumns" :pagination="false" :empty-text="t('website.backupDrawer.noBackups')">
          <template #source="{ row }">{{ sourceLabel(row.source) }}</template>
          <template #databaseName="{ row }">{{ row.databaseName || t('website.backupDrawer.notIncluded') }}</template>
          <template #sizeBytes="{ row }">{{ formatBytes(row.sizeBytes) }}</template>
          <template #backupCreatedAt="{ row }">{{ formatTime(row.createdAt) }}</template>
          <template #backupAction="{ row }">
              <div class="table-row-actions">
                <el-button v-if="canReadWebsite" type="primary" link :icon="Download" @click="downloadBackup(row)">{{ t('website.backupDrawer.download') }}</el-button>
                <el-button v-if="canWriteWebsite" type="primary" link :icon="RefreshLeft" @click="restoreBackup(row)">{{ t('website.backupDrawer.restore') }}</el-button>
                <el-button v-if="canWriteWebsite" type="danger" link :icon="Delete" @click="deleteBackup(row)">{{ t('website.backupDrawer.delete') }}</el-button>
              </div>
          </template>
        </custom-table>
      </el-tab-pane>

      <el-tab-pane :label="t('website.backupDrawer.taskRecords')">
        <custom-table v-loading="state.loading" :data="state.tasks" :columns="taskColumns" :pagination="false" :empty-text="t('website.backupDrawer.noTasks')">
          <template #operation="{ row }">{{ operationLabel(row.operation) }}</template>
          <template #status="{ row }">
              <el-tag class="website-chip" :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag>
          </template>
          <template #progress="{ row }">
              <el-progress :percentage="row.progress || 0" :status="row.status === 'failed' ? 'exception' : undefined" />
              <div class="task-message">{{ row.errorMessage || row.message }}</div>
          </template>
          <template #taskCreatedAt="{ row }">{{ formatTime(row.createdAt) }}</template>
          <template #taskAction="{ row }">
              <div class="table-row-actions">
                <el-button v-if="canReadWebsite" type="primary" link :icon="Document" @click="showLog(row)">{{ t('website.backupDrawer.log') }}</el-button>
                <el-button
                  v-if="activeStatuses.has(row.status) && canWriteWebsite"
                  type="danger"
                  link
                  :icon="CircleClose"
                  @click="cancelTask(row)"
                >
                  {{ t('website.backupDrawer.cancel') }}
                </el-button>
              </div>
          </template>
        </custom-table>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="state.logVisible" :title="state.logTitle" width="760px" append-to-body>
      <pre class="task-log">{{ state.logContent }}</pre>
    </el-dialog>
  </custom-drawer>
</template>

<style scoped lang="less">
.backup-tip {
  margin-bottom: 18px;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.toolbar-note {
  flex: 1;
  color: var(--el-text-color-secondary);
}

.backup-tabs {
  margin-top: 18px;

  :deep(.el-tabs__header) {
    margin: 0;
  }

  :deep(.el-tabs__nav-wrap::after) {
    display: none;
  }

  :deep(.el-tabs__nav) {
    display: flex;
    align-items: center;
    max-width: 100%;
    gap: 4px;
    padding: 4px;
    border: 1px solid var(--border-subtle);
    border-radius: 12px;
    background: var(--surface-muted);
    box-shadow: inset 0 1px 0 color-mix(in srgb, white 5%, transparent);
    overflow-x: auto;
    scrollbar-width: none;
  }

  :deep(.el-tabs__nav::-webkit-scrollbar) {
    display: none;
  }

  :deep(.el-tabs__item) {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 96px;
    height: 38px;
    padding: 0 20px;
    border-radius: 9px;
    color: var(--text-tertiary);
    font-size: 13px;
    font-weight: 650;
    line-height: normal;
    white-space: nowrap;
    transition: color 0.18s ease, background-color 0.18s ease;
  }

  :deep(.el-tabs__item:hover) {
    color: var(--text-primary);
    background: color-mix(in srgb, var(--surface-card) 72%, transparent);
  }

  :deep(.el-tabs__item.is-active) {
    color: rgb(var(--primary-color));
    background: color-mix(in srgb, rgb(var(--primary-color)) 22%, var(--surface-card));
    box-shadow:
      inset 0 0 0 1px color-mix(in srgb, rgb(var(--primary-color)) 28%, transparent),
      0 3px 10px color-mix(in srgb, rgb(var(--primary-color)) 12%, transparent);
  }

  :deep(.el-tabs__item:focus-visible) {
    outline: 2px solid color-mix(in srgb, rgb(var(--primary-color)) 45%, transparent);
    outline-offset: -2px;
  }

  :deep(.el-tabs__active-bar) {
    display: none;
  }

  :deep(.el-tabs__content) {
    padding-top: 14px;
  }
}

.task-message {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  word-break: break-all;
}

.task-log {
  min-height: 220px;
  max-height: 56vh;
  overflow: auto;
  margin: 0;
  padding: 14px;
  border-radius: 6px;
  background: #111827;
  color: #d1fae5;
  white-space: pre-wrap;
  word-break: break-all;
}

@media (max-width: 640px) {
  .backup-tabs {
    :deep(.el-tabs__item) {
      flex: 1;
      min-width: 0;
      padding: 0 12px;
      text-align: center;
    }
  }
}
</style>
