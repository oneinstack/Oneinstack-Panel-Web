<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, watch } from 'vue'
import { Api } from '@/api/modules'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CircleClose, Delete, Document, Download, RefreshLeft } from '@element-plus/icons-vue'
import type { ColumnItem } from '@/components/custom-table.vue'
import i18n from '@/lang'

const props = defineProps<{
  modelValue: boolean
  website?: Record<string, any> | null
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

let timer: number | undefined

const activeStatuses = new Set(['queued', 'running', 'canceling'])
const selectedWebsiteId = computed(() => Number(props.website?.id || 0))
const title = computed(() =>
  selectedWebsiteId.value
    ? `整站备份 · ${props.website?.name || ''}`
    : '整站备份管理'
)

const backupColumns = computed<ColumnItem[]>(() => [
  { prop: 'websiteName', label: '网站', minWidth: 150 },
  { prop: 'source', label: '来源', width: 150, slot: 'source' },
  { prop: 'databaseName', label: '数据库', minWidth: 130, slot: 'databaseName' },
  { prop: 'sizeBytes', label: '大小', width: 110, slot: 'sizeBytes' },
  { prop: 'createdAt', label: '创建时间', width: 180, slot: 'backupCreatedAt' },
  { prop: 'backupAction', label: '操作', width: 240, fixed: 'right', slot: 'backupAction', className: 'table-action-column' }
])

const taskColumns = computed<ColumnItem[]>(() => [
  { prop: 'websiteName', label: '网站', minWidth: 150 },
  { prop: 'operation', label: '操作', width: 110, slot: 'operation' },
  { prop: 'status', label: '状态', width: 110, slot: 'status' },
  { prop: 'progress', label: '进度', minWidth: 180, slot: 'progress' },
  { prop: 'createdAt', label: '创建时间', width: 180, slot: 'taskCreatedAt' },
  { prop: 'taskAction', label: '操作', width: 170, fixed: 'right', slot: 'taskAction', className: 'table-action-column' }
])

const statusLabel = (status: string) => ({
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

const operationLabel = (operation: string) => ({
  backup: '备份',
  restore: '恢复',
  delete: '安全删除'
}[operation] || operation)

const sourceLabel = (source: string) => ({
  manual: '手动备份',
  pre_restore: '恢复前安全快照',
  pre_delete: '删除前强制快照'
}[source] || source)

const formatBytes = (value: number) => {
  if (!value) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1)
  return `${(value / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 2)} ${units[index]}`
}

const formatTime = (value?: string) => value ? new Date(value).toLocaleString() : '-'

const loadDatabases = async () => {
  const { data } = await Api.getDatabaseList({
    type: 'mysql',
    page: 1,
    pageSize: 100
  })
  state.databases = data?.data || []
}

const loadData = async (silent = false) => {
  if (!props.modelValue) return
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
  if (!selectedWebsiteId.value) return
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
  try {
    const { value } = await ElMessageBox.prompt(
      `恢复会先创建当前站点的安全快照，再替换网站文件、重新生成 Nginx 配置${backup.databaseId ? '并恢复关联数据库' : ''}。证书私钥不在备份包内。请输入网站名 ${backup.websiteName} 确认：`,
      '恢复整站备份',
      {
        type: 'warning',
        confirmButtonText: '开始恢复',
        cancelButtonText: '取消',
        inputPlaceholder: backup.websiteName,
        inputValidator: (value: string) => value === backup.websiteName || '网站名不匹配'
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
  try {
    const { value } = await ElMessageBox.prompt(
      `永久删除备份 ${backup.fileName}。请输入网站名 ${backup.websiteName} 确认：`,
      '删除整站备份',
      {
        type: 'warning',
        confirmButtonText: '永久删除',
        cancelButtonText: '取消',
        inputPlaceholder: backup.websiteName,
        inputValidator: (value: string) => value === backup.websiteName || '网站名不匹配'
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
  window.location.assign(`/v1/website/backups/${encodeURIComponent(backup.id)}/download`)
}

const cancelTask = async (task: Record<string, any>) => {
  await Api.cancelWebsiteTask(task.id)
  ElMessage.success(i18n.t('website.notifications.cancelSubmitted'))
  await loadData()
}

const showLog = async (task: Record<string, any>) => {
  const { data } = await Api.getWebsiteTaskLog(task.id, { cursor: 0, limit: 65536 })
  state.logTitle = `${task.websiteName} · ${operationLabel(task.operation)}日志`
  state.logContent = data?.content || '暂无日志'
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
      title="备份包使用逐文件摘要和整包 SHA-256 校验，包含网站文件、网站元数据、Nginx 配置快照及一个可选 MySQL 数据库；证书私钥不会写入备份。"
      type="info"
      show-icon
      :closable="false"
      class="backup-tip"
    />

    <div class="toolbar">
      <template v-if="selectedWebsiteId">
        <el-select v-model="state.databaseId" style="width: 260px" placeholder="可选：关联一个 MySQL 数据库">
          <el-option label="不包含数据库" :value="0" />
          <el-option
            v-for="database in state.databases"
            :key="database.id"
            :label="database.name"
            :value="database.id"
          />
        </el-select>
        <el-button type="primary" :loading="state.submitting" @click="createBackup">
          立即备份
        </el-button>
      </template>
      <span v-else class="toolbar-note">这里保留已删除网站的强制快照，可直接重新恢复站点。</span>
      <el-button @click="loadData()">刷新</el-button>
    </div>

    <el-tabs>
      <el-tab-pane label="备份文件">
        <custom-table v-loading="state.loading" :data="state.backups" :columns="backupColumns" :pagination="false" empty-text="暂无整站备份">
          <template #source="{ row }">{{ sourceLabel(row.source) }}</template>
          <template #databaseName="{ row }">{{ row.databaseName || '未包含' }}</template>
          <template #sizeBytes="{ row }">{{ formatBytes(row.sizeBytes) }}</template>
          <template #backupCreatedAt="{ row }">{{ formatTime(row.createdAt) }}</template>
          <template #backupAction="{ row }">
              <div class="table-row-actions">
                <el-button type="primary" plain :icon="Download" @click="downloadBackup(row)">下载</el-button>
                <el-button type="primary" link :icon="RefreshLeft" @click="restoreBackup(row)">恢复</el-button>
                <el-button type="danger" link :icon="Delete" @click="deleteBackup(row)">删除</el-button>
              </div>
          </template>
        </custom-table>
      </el-tab-pane>

      <el-tab-pane label="任务记录">
        <custom-table v-loading="state.loading" :data="state.tasks" :columns="taskColumns" :pagination="false" empty-text="暂无网站任务">
          <template #operation="{ row }">{{ operationLabel(row.operation) }}</template>
          <template #status="{ row }">
              <el-tag :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag>
          </template>
          <template #progress="{ row }">
              <el-progress :percentage="row.progress || 0" :status="row.status === 'failed' ? 'exception' : undefined" />
              <div class="task-message">{{ row.errorMessage || row.message }}</div>
          </template>
          <template #taskCreatedAt="{ row }">{{ formatTime(row.createdAt) }}</template>
          <template #taskAction="{ row }">
              <div class="table-row-actions">
                <el-button type="primary" plain :icon="Document" @click="showLog(row)">日志</el-button>
                <el-button
                  v-if="activeStatuses.has(row.status)"
                  type="danger"
                  link
                  :icon="CircleClose"
                  @click="cancelTask(row)"
                >
                  取消
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
</style>
