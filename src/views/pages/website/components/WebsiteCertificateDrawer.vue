<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Api } from '@/api/modules'
import { CircleClose, Document } from '@element-plus/icons-vue'
import type { ColumnItem } from '@/components/custom-table.vue'
import i18n from '@/lang'

const props = defineProps<{
  modelValue: boolean
  website: Record<string, any>
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'changed'): void
}>()

const loading = ref(false)
const submitting = ref(false)
const t = i18n.t as any
const certificate = ref<Record<string, any> | null>(null)
const tasks = ref<Record<string, any>[]>([])
const logDialog = reactive({
  show: false,
  title: t('website.certificateDrawer.taskLog'),
  content: '',
  loading: false
})
const form = reactive({
  email: '',
  autoRenew: true,
  renewBeforeDays: 30,
  forceHttps: false
})
let pollTimer: number | undefined

const activeStatuses = ['queued', 'running', 'canceling']
const activeTask = computed(() => tasks.value.find((item) => activeStatuses.includes(item.status)))
const certificateEnabled = computed(() => certificate.value && certificate.value.status !== 'disabled')
const taskColumns = computed<ColumnItem[]>(() => [
  { prop: 'type', label: t('website.certificateDrawer.type'), width: 75, slot: 'type' },
  { prop: 'status', label: t('website.status'), width: 90, slot: 'status' },
  { prop: 'progress', label: t('website.certificateDrawer.progress'), width: 145, slot: 'progress' },
  { prop: 'message', label: t('website.certificateDrawer.info'), minWidth: 180, showOverflowTooltip: true },
  { prop: 'createdAt', label: t('website.certificateDrawer.time'), width: 170, slot: 'createdAt' },
  { prop: 'actionColumn', label: t('website.certificateDrawer.action'), width: 170, fixed: 'right', slot: 'actionColumn', className: 'table-action-column' }
])

const statusText = computed<Record<string, string>>(() => Object.fromEntries(
  ['active', 'expiring', 'expired', 'disabled', 'error', 'queued', 'running', 'canceling', 'succeeded', 'failed', 'canceled', 'interrupted']
    .map((status) => [status, t(`website.certificateDrawer.statuses.${status}`)])
))

const statusType = (status: string) => {
  if (status === 'active' || status === 'succeeded') return 'success'
  if (status === 'expiring' || status === 'queued' || status === 'running' || status === 'canceling') return 'warning'
  if (status === 'disabled' || status === 'canceled' || status === 'interrupted') return 'info'
  return 'danger'
}

const formatTime = (value?: string) => {
  if (!value) return '-'
  return new Date(value).toLocaleString()
}

const loadData = async (quiet = false) => {
  if (!props.website?.id) return
  if (!quiet) loading.value = true
  try {
    const [certificateResponse, taskResponse] = await Promise.all([
      Api.getWebsiteCertificate(props.website.id),
      Api.getCertificateTasks({ websiteId: props.website.id, page: 1, pageSize: 20 })
    ])
    certificate.value = certificateResponse.data || null
    tasks.value = taskResponse.data?.data || []
    if (certificate.value) {
      form.email = certificate.value.email || form.email
      form.autoRenew = certificate.value.autoRenew ?? true
      form.renewBeforeDays = certificate.value.renewBeforeDays || 30
      form.forceHttps = certificate.value.forceHttps ?? false
    }
    updatePolling()
  } catch (error: any) {
    // if (!quiet) ElMessage.error(error.message || i18n.t('website.notifications.certificateLoadFailed'))
  } finally {
    if (!quiet) loading.value = false
  }
}

const updatePolling = () => {
  if (pollTimer) {
    window.clearInterval(pollTimer)
    pollTimer = undefined
  }
  if (props.modelValue && activeTask.value) {
    pollTimer = window.setInterval(async () => {
      await loadData(true)
      if (!activeTask.value) {
        emit('changed')
      }
    }, 2000)
  }
}

const issue = async () => {
  const email = form.email.trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    ElMessage.warning(i18n.t('website.notifications.invalidAcmeEmail'))
    return
  }
  try {
    await ElMessageBox.confirm(
      t('website.certificateDrawer.issueConfirm', { domain: props.website.domain }),
      t(certificate.value ? 'website.certificateDrawer.reissueTitle' : 'website.certificateDrawer.issueTitle'),
      { type: 'warning', confirmButtonText: t('website.certificateDrawer.startIssue') }
    )
    submitting.value = true
    await Api.issueWebsiteCertificate({
      websiteId: props.website.id,
      email,
      autoRenew: form.autoRenew,
      renewBeforeDays: form.renewBeforeDays,
      forceHttps: form.forceHttps
    })
    ElMessage.success(i18n.t('website.notifications.certificateTaskCreated'))
    await loadData(true)
  } catch (error: any) {
    if (error !== 'cancel' && error !== 'close') {
      // ElMessage.error(error.message || i18n.t('website.notifications.certificateTaskCreateFailed'))
    }
  } finally {
    submitting.value = false
  }
}

const renew = async () => {
  if (!certificate.value?.id) return
  try {
    await Api.renewWebsiteCertificate(certificate.value.id)
    ElMessage.success(i18n.t('website.notifications.renewalTaskCreated'))
    await loadData(true)
  } catch (error: any) {
    // ElMessage.error(error.message || i18n.t('website.notifications.renewalTaskCreateFailed'))
  }
}

const disable = async () => {
  if (!certificate.value?.id) return
  try {
    const result = await ElMessageBox.prompt(
      t('website.certificateDrawer.disableConfirm', { domain: props.website.name }),
      t('website.certificateDrawer.disableTitle'),
      {
        type: 'warning',
        inputPlaceholder: props.website.name,
        inputValidator: (value) => value === props.website.name || t('website.certificateDrawer.domainMismatch')
      }
    )
    await Api.disableWebsiteCertificate(certificate.value.id, { confirmDomain: result.value })
    ElMessage.success(i18n.t('website.notifications.sslDisabled'))
    await loadData(true)
    emit('changed')
  } catch (error: any) {
    if (error !== 'cancel' && error !== 'close') {
      // ElMessage.error(error.message || i18n.t('website.notifications.sslDisableFailed'))
    }
  }
}

const cancelTask = async (task: Record<string, any>) => {
  try {
    await Api.cancelCertificateTask(task.id)
    ElMessage.success(i18n.t('website.notifications.cancelSubmitted'))
    await loadData(true)
  } catch (error: any) {
    // ElMessage.error(error.message || i18n.t('website.notifications.certificateTaskCancelFailed'))
  }
}

const showLog = async (task: Record<string, any>) => {
  logDialog.show = true
  logDialog.title = `${task.websiteName} · ${t(`website.certificateDrawer.${task.operation === 'renew' ? 'renew' : 'issue'}`)}${t('website.certificateDrawer.logSuffix')}`
  logDialog.loading = true
  try {
    const response = await Api.getCertificateTaskLog(task.id)
    logDialog.content = response.data?.content || t('website.certificateDrawer.noLog')
  } catch (error: any) {
    logDialog.content = error.message || t('website.certificateDrawer.logReadFailed')
  } finally {
    logDialog.loading = false
  }
}

const close = () => emit('update:modelValue', false)

watch(
  () => props.modelValue,
  async (visible) => {
    if (visible) {
      certificate.value = null
      tasks.value = []
      form.email = ''
      form.autoRenew = true
      form.renewBeforeDays = 30
      form.forceHttps = false
      await loadData()
    } else {
      updatePolling()
    }
  }
)

onBeforeUnmount(() => {
  if (pollTimer) window.clearInterval(pollTimer)
})
</script>

<template>
  <custom-drawer
    :visible="modelValue"
    :title="t('website.certificateDrawer.title', { name: website.name || '' })"
    size="720px"
    destroy-on-close
    :show-footer="false"
    :on-close="close"
  >
    <div v-loading="loading">
      <el-alert
        :title="t('website.certificateDrawer.acmeTip')"
        type="info"
        show-icon
        :closable="false"
        style="margin-bottom: 18px"
      />

      <el-descriptions v-if="certificate" class="certificate-summary" :column="2" border style="margin-bottom: 18px">
        <el-descriptions-item :label="t('website.status')">
          <el-tag class="website-chip" :type="statusType(certificate.status)">
            {{ statusText[certificate.status] || certificate.status }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="t('website.certificateDrawer.issuer')">{{ certificate.issuer || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="t('website.certificateDrawer.domains')" :span="2">{{ certificate.domains }}</el-descriptions-item>
        <el-descriptions-item :label="t('website.certificateDrawer.validFrom')">{{ formatTime(certificate.notBefore) }}</el-descriptions-item>
        <el-descriptions-item :label="t('website.certificateDrawer.validUntil')">{{ formatTime(certificate.notAfter) }}</el-descriptions-item>
        <el-descriptions-item :label="t('website.certificateDrawer.autoRenew')">{{ certificate.autoRenew ? t('website.certificateDrawer.on') : t('website.certificateDrawer.off') }}</el-descriptions-item>
        <el-descriptions-item :label="t('website.certificateDrawer.forceHttps')">{{ certificate.forceHttps ? t('website.certificateDrawer.on') : t('website.certificateDrawer.off') }}</el-descriptions-item>
        <el-descriptions-item v-if="certificate.lastError" :label="t('website.certificateDrawer.lastError')" :span="2">
          <span class="error-text">{{ certificate.lastError }}</span>
        </el-descriptions-item>
      </el-descriptions>

      <el-form class="certificate-form" label-width="110px" style="max-width: 620px">
        <el-form-item :label="t('website.certificateDrawer.accountEmail')" required>
          <el-input v-model="form.email" placeholder="admin@example.com" :disabled="!!activeTask" />
        </el-form-item>
        <el-form-item :label="t('website.certificateDrawer.autoRenew')">
          <el-switch v-model="form.autoRenew" :disabled="!!activeTask" />
        </el-form-item>
        <el-form-item :label="t('website.certificateDrawer.renewEarly')">
          <el-input-number v-model="form.renewBeforeDays" :min="1" :max="90" :disabled="!!activeTask" />
          <span class="form-tip">{{ t('website.certificateDrawer.days') }}</span>
        </el-form-item>
        <el-form-item :label="t('website.certificateDrawer.forceHttps')">
          <el-switch v-model="form.forceHttps" :disabled="!!activeTask" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="submitting" :disabled="!!activeTask" @click="issue">
            {{ certificateEnabled ? t('website.certificateDrawer.reissueApply') : t('website.certificateDrawer.issueDeploy') }}
          </el-button>
          <el-button v-if="certificateEnabled" :disabled="!!activeTask" @click="renew">{{ t('website.certificateDrawer.renewNow') }}</el-button>
          <el-button v-if="certificateEnabled" type="danger" plain :disabled="!!activeTask" @click="disable">
            {{ t('website.certificateDrawer.disableSsl') }}
          </el-button>
        </el-form-item>
      </el-form>

      <section class="recent-tasks">
        <div class="recent-tasks__header">
          <span class="recent-tasks__title">{{ t('website.certificateDrawer.recentTasks') }}</span>
        </div>
        <custom-table :data="tasks" :columns="taskColumns" :pagination="false" size="small" :empty-text="t('website.certificateDrawer.noTasks')">
          <template #type="{ row }">{{ t(`website.certificateDrawer.${row.operation === 'renew' ? 'renew' : 'issue'}`) }}</template>
          <template #status="{ row }">
              <el-tag class="website-chip" size="small" :type="statusType(row.status)">{{ statusText[row.status] || row.status }}</el-tag>
          </template>
          <template #progress="{ row }">
              <el-progress :percentage="row.progress || 0" :stroke-width="8" />
          </template>
          <template #createdAt="{ row }">{{ formatTime(row.createdAt) }}</template>
          <template #actionColumn="{ row }">
              <div class="table-row-actions">
                <el-button link type="primary" :icon="Document" @click="showLog(row)">{{ t('website.certificateDrawer.log') }}</el-button>
                <el-button
                  v-if="activeStatuses.includes(row.status)"
                  link
                  type="danger"
                  :icon="CircleClose"
                  @click="cancelTask(row)"
                >
                  {{ t('website.certificateDrawer.cancel') }}
                </el-button>
              </div>
          </template>
        </custom-table>
      </section>
    </div>
  </custom-drawer>

  <el-dialog v-model="logDialog.show" :title="logDialog.title" width="760px">
    <pre v-loading="logDialog.loading" class="task-log">{{ logDialog.content }}</pre>
  </el-dialog>
</template>

<style scoped>
.certificate-summary {
  border-radius: 14px;
  overflow: hidden;
}

.certificate-summary :deep(.el-descriptions__table) {
  border-color: var(--border-subtle);
}

.certificate-summary :deep(.el-descriptions__body) {
  background: var(--surface-card);
}

.certificate-summary :deep(.el-descriptions__cell) {
  border-color: var(--border-subtle) !important;
}

.certificate-summary :deep(.el-descriptions__label.el-descriptions__cell) {
  width: 110px;
  color: var(--text-secondary);
  font-weight: 700;
  background: color-mix(in srgb, var(--surface-subtle) 82%, transparent);
}

.certificate-summary :deep(.el-descriptions__content.el-descriptions__cell) {
  color: var(--text-primary);
  background: color-mix(in srgb, var(--surface-card) 92%, transparent);
}

.certificate-summary :deep(.el-descriptions__content .website-chip) {
  min-height: 28px;
  padding-inline: 10px;
  border-radius: 999px;
  font-weight: 700;
}

.certificate-form :deep(.el-input__wrapper),
.certificate-form :deep(.el-input-number__wrapper) {
  background: var(--surface-card);
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.certificate-form :deep(.el-input.is-disabled .el-input__wrapper),
.certificate-form :deep(.el-input-number.is-disabled .el-input__wrapper),
.certificate-form :deep(.el-input-number.is-disabled .el-input-number__wrapper) {
  background: color-mix(in srgb, var(--surface-card) 92%, black 8%) !important;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--border-subtle) 88%, transparent);
}

.certificate-form :deep(.el-input.is-disabled .el-input__inner),
.certificate-form :deep(.el-input-number.is-disabled .el-input__inner) {
  color: var(--text-secondary) !important;
  -webkit-text-fill-color: var(--text-secondary);
}

.certificate-form :deep(.el-input-number.is-disabled .el-input-number__decrease),
.certificate-form :deep(.el-input-number.is-disabled .el-input-number__increase) {
  background: color-mix(in srgb, var(--surface-subtle) 78%, transparent) !important;
  color: var(--text-tertiary) !important;
  border-color: var(--border-subtle) !important;
}

.form-tip {
  margin-left: 8px;
  color: var(--el-text-color-secondary);
}

.error-text {
  color: var(--el-color-danger);
  word-break: break-all;
}

.task-log {
  min-height: 220px;
  max-height: 480px;
  margin: 0;
  padding: 14px;
  overflow: auto;
  color: #d8dee9;
  background: #1f2329;
  border-radius: 6px;
  white-space: pre-wrap;
  word-break: break-all;
}

.recent-tasks {
  margin-top: 22px;
}

.recent-tasks__header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
}

.recent-tasks__header::after {
  content: '';
  flex: 1;
  height: 1px;
  background: color-mix(in srgb, var(--border-subtle) 86%, transparent);
}

.recent-tasks__title {
  flex: 0 0 auto;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
}
</style>
