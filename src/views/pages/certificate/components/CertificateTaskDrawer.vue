<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { CircleClose, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Api } from '@/api/modules'
import type { CertificateTask } from '@/api/modules'
import i18n from '@/lang'

const props = defineProps<{
  visible: boolean
  taskId: string
  canWrite: boolean
}>()

const emit = defineEmits<{
  (event: 'update:visible', value: boolean): void
  (event: 'finished', task: CertificateTask): void
}>()

const loading = ref(false)
const canceling = ref(false)
const task = ref<CertificateTask | null>(null)
const log = ref('')
let pollTimer: number | undefined

const t = (key: string, fallback?: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params)
  return value && value !== key ? value : fallback || key
}

const activeStatuses = new Set(['queued', 'running', 'canceling'])
const isActive = computed(() => Boolean(task.value && activeStatuses.has(task.value.status)))
const statusType = (status?: string) => {
  if (status === 'succeeded') return 'success'
  if (status === 'queued' || status === 'running' || status === 'canceling') return 'warning'
  if (status === 'canceled' || status === 'interrupted') return 'info'
  return 'danger'
}
const formatTime = (value?: string) => value ? new Date(value).toLocaleString() : '—'
const label = (group: 'status' | 'operations', value?: string) => value ? t(`certificate.${group}.${value}`, value) : '—'

const clearPolling = () => {
  if (!pollTimer) return
  window.clearInterval(pollTimer)
  pollTimer = undefined
}

const loadTask = async (quiet = false) => {
  if (!props.taskId) return
  if (!quiet) loading.value = true
  try {
    const [taskResponse, logResponse] = await Promise.all([
      Api.getCertificateCenterTask(props.taskId),
      Api.getCertificateCenterTaskLog(props.taskId)
    ])
    const previousActive = isActive.value
    task.value = taskResponse.data
    log.value = logResponse.data?.content || ''
    if (!isActive.value) {
      clearPolling()
      if (previousActive) emit('finished', task.value as CertificateTask)
    }
  } finally {
    if (!quiet) loading.value = false
  }
}

const startPolling = () => {
  clearPolling()
  if (!props.visible || !props.taskId) return
  pollTimer = window.setInterval(() => void loadTask(true), 1800)
}

const cancelTask = async () => {
  if (!task.value || !isActive.value) return
  try {
    await ElMessageBox.confirm(
      t('certificate.confirm.cancelTask'),
      t('certificate.confirm.cancelTaskTitle'),
      {
        type: 'warning',
        confirmButtonText: t('certificate.actions.cancelTask'),
        cancelButtonText: t('common.cancel')
      }
    )
  } catch {
    return
  }
  canceling.value = true
  try {
    await Api.cancelCertificateCenterTask(task.value.id)
    ElMessage.success(t('certificate.messages.taskCanceled'))
    await loadTask(true)
  } finally {
    canceling.value = false
  }
}

const close = () => {
  clearPolling()
  emit('update:visible', false)
}

watch(
  () => [props.visible, props.taskId] as const,
  async ([visible, taskId]) => {
    clearPolling()
    if (!visible || !taskId) {
      task.value = null
      log.value = ''
      return
    }
    task.value = null
    log.value = ''
    await loadTask()
    if (isActive.value) startPolling()
  }
)

onBeforeUnmount(clearPolling)
</script>

<template>
  <custom-drawer
    :visible="visible"
    :title="$t('certificate.task.title')"
    size="700px"
    destroy-on-close
    :show-footer="false"
    :on-close="close"
  >
    <div v-loading="loading" class="task-detail">
      <template v-if="task">
        <div class="task-heading">
          <div>
            <span>{{ label('operations', task.operation) }}</span>
            <strong>{{ task.domains || task.websiteName || task.id }}</strong>
          </div>
          <div class="task-heading__actions">
            <el-tag :type="statusType(task.status)">{{ label('status', task.status) }}</el-tag>
            <el-button :icon="Refresh" @click="loadTask()">{{ $t('common.refresh') }}</el-button>
            <el-button
              v-if="isActive && canWrite"
              type="danger"
              plain
              :icon="CircleClose"
              :loading="canceling"
              @click="cancelTask"
            >
              {{ $t('certificate.actions.cancelTask') }}
            </el-button>
          </div>
        </div>

        <el-progress
          class="task-progress"
          :percentage="task.progress || 0"
          :status="task.status === 'failed' ? 'exception' : task.status === 'succeeded' ? 'success' : undefined"
        />

        <dl class="detail-list">
          <div><dt>{{ $t('certificate.columns.message') }}</dt><dd>{{ task.message || '—' }}</dd></div>
          <div><dt>{{ $t('certificate.task.managedId') }}</dt><dd>{{ task.managedId || task.certificateId || '—' }}</dd></div>
          <div><dt>{{ $t('certificate.task.websiteId') }}</dt><dd>{{ task.websiteId || '—' }}</dd></div>
          <div><dt>{{ $t('certificate.columns.createdAt') }}</dt><dd>{{ formatTime(task.createdAt) }}</dd></div>
          <div><dt>{{ $t('certificate.task.startedAt') }}</dt><dd>{{ formatTime(task.startedAt) }}</dd></div>
          <div><dt>{{ $t('certificate.task.finishedAt') }}</dt><dd>{{ formatTime(task.finishedAt) }}</dd></div>
          <div v-if="task.errorCode"><dt>{{ $t('certificate.task.errorCode') }}</dt><dd class="error-text">{{ task.errorCode }}</dd></div>
          <div v-if="task.errorMessage"><dt>{{ $t('certificate.task.errorMessage') }}</dt><dd class="error-text">{{ task.errorMessage }}</dd></div>
        </dl>

        <section class="log-section">
          <div class="section-title">{{ $t('certificate.task.log') }}</div>
          <pre>{{ log || $t('certificate.task.noLog') }}</pre>
        </section>
      </template>
    </div>
  </custom-drawer>
</template>

<style scoped lang="less">
.task-detail {
  min-height: 320px;
  padding-bottom: 44px;
}

.task-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding-bottom: 22px;
  border-bottom: 1px solid var(--border-subtle);

  > div:first-child {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  span {
    color: var(--text-tertiary);
    font-size: 12px;
  }

  strong {
    overflow: hidden;
    color: var(--text-primary);
    font-size: 18px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.task-heading__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.task-progress {
  margin: 26px 0;
}

.detail-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 0;
  border-top: 1px solid var(--border-subtle);

  > div {
    min-width: 0;
    padding: 16px 12px;
    border-bottom: 1px solid var(--border-subtle);
  }

  dt {
    margin-bottom: 7px;
    color: var(--text-tertiary);
    font-size: 12px;
  }

  dd {
    margin: 0;
    overflow-wrap: anywhere;
    color: var(--text-primary);
    font-size: 13px;
  }
}

.error-text {
  color: var(--el-color-danger) !important;
}

.log-section {
  margin-top: 28px;
}

.section-title {
  margin-bottom: 12px;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 700;
}

pre {
  min-height: 220px;
  max-height: 420px;
  margin: 0;
  padding: 16px;
  overflow: auto;
  border-radius: 8px;
  color: #d8dee9;
  background: #0d1728;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  line-height: 1.7;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

@media (max-width: 680px) {
  .task-heading,
  .task-heading__actions {
    align-items: stretch;
    flex-direction: column;
  }

  .detail-list {
    grid-template-columns: 1fr;
  }
}
</style>
