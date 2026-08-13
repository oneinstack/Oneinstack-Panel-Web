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
const certificate = ref<Record<string, any> | null>(null)
const tasks = ref<Record<string, any>[]>([])
const logDialog = reactive({
  show: false,
  title: '证书任务日志',
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
  { prop: 'type', label: '类型', width: 75, slot: 'type' },
  { prop: 'status', label: '状态', width: 90, slot: 'status' },
  { prop: 'progress', label: '进度', width: 145, slot: 'progress' },
  { prop: 'message', label: '信息', minWidth: 180, showOverflowTooltip: true },
  { prop: 'createdAt', label: '时间', width: 170, slot: 'createdAt' },
  { prop: 'actionColumn', label: '操作', width: 170, fixed: 'right', slot: 'actionColumn', className: 'table-action-column' }
])

const statusText: Record<string, string> = {
  active: '有效',
  expiring: '即将到期',
  expired: '已过期',
  disabled: '已关闭',
  error: '异常',
  queued: '排队中',
  running: '执行中',
  canceling: '取消中',
  succeeded: '成功',
  failed: '失败',
  canceled: '已取消',
  interrupted: '已中断'
}

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
      `将为 ${props.website.domain} 发起 HTTP-01 验证，请确认所有域名均已解析到本服务器且公网 80 端口可访问。`,
      certificate.value ? '重新签发证书' : '申请证书',
      { type: 'warning', confirmButtonText: '开始签发' }
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
      `关闭后将移除 Nginx HTTPS 监听，但保留证书文件。请输入主域名 ${props.website.name} 确认。`,
      '关闭网站 SSL',
      {
        type: 'warning',
        inputPlaceholder: props.website.name,
        inputValidator: (value) => value === props.website.name || '主域名不匹配'
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
  logDialog.title = `${task.websiteName} · ${task.operation === 'renew' ? '续签' : '签发'}日志`
  logDialog.loading = true
  try {
    const response = await Api.getCertificateTaskLog(task.id)
    logDialog.content = response.data?.content || '暂无日志'
  } catch (error: any) {
    logDialog.content = error.message || '读取日志失败'
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
    :title="`SSL 证书 · ${website.name || ''}`"
    size="720px"
    destroy-on-close
    :show-footer="false"
    :on-close="close"
  >
    <div v-loading="loading">
      <el-alert
        title="ACME 使用 HTTP-01 验证：域名必须解析到本机，且公网 80 端口需要能够访问。私钥只保存在服务器，不会通过 API 返回。"
        type="info"
        show-icon
        :closable="false"
        style="margin-bottom: 18px"
      />

      <el-descriptions v-if="certificate" :column="2" border style="margin-bottom: 18px">
        <el-descriptions-item label="状态">
          <el-tag :type="statusType(certificate.status)">
            {{ statusText[certificate.status] || certificate.status }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="颁发机构">{{ certificate.issuer || '-' }}</el-descriptions-item>
        <el-descriptions-item label="覆盖域名" :span="2">{{ certificate.domains }}</el-descriptions-item>
        <el-descriptions-item label="生效时间">{{ formatTime(certificate.notBefore) }}</el-descriptions-item>
        <el-descriptions-item label="到期时间">{{ formatTime(certificate.notAfter) }}</el-descriptions-item>
        <el-descriptions-item label="自动续签">{{ certificate.autoRenew ? '已开启' : '已关闭' }}</el-descriptions-item>
        <el-descriptions-item label="强制 HTTPS">{{ certificate.forceHttps ? '已开启' : '已关闭' }}</el-descriptions-item>
        <el-descriptions-item v-if="certificate.lastError" label="最近错误" :span="2">
          <span class="error-text">{{ certificate.lastError }}</span>
        </el-descriptions-item>
      </el-descriptions>

      <el-form label-width="110px" style="max-width: 620px">
        <el-form-item label="账户邮箱" required>
          <el-input v-model="form.email" placeholder="admin@example.com" :disabled="!!activeTask" />
        </el-form-item>
        <el-form-item label="自动续签">
          <el-switch v-model="form.autoRenew" :disabled="!!activeTask" />
        </el-form-item>
        <el-form-item label="提前续签">
          <el-input-number v-model="form.renewBeforeDays" :min="1" :max="90" :disabled="!!activeTask" />
          <span class="form-tip">天</span>
        </el-form-item>
        <el-form-item label="强制 HTTPS">
          <el-switch v-model="form.forceHttps" :disabled="!!activeTask" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="submitting" :disabled="!!activeTask" @click="issue">
            {{ certificateEnabled ? '重新签发并应用设置' : '申请并部署证书' }}
          </el-button>
          <el-button v-if="certificateEnabled" :disabled="!!activeTask" @click="renew">立即续签</el-button>
          <el-button v-if="certificateEnabled" type="danger" plain :disabled="!!activeTask" @click="disable">
            关闭 SSL
          </el-button>
        </el-form-item>
      </el-form>

      <el-divider content-position="left">最近任务</el-divider>
      <custom-table :data="tasks" :columns="taskColumns" :pagination="false" size="small" empty-text="暂无证书任务">
        <template #type="{ row }">{{ row.operation === 'renew' ? '续签' : '签发' }}</template>
        <template #status="{ row }">
            <el-tag size="small" :type="statusType(row.status)">{{ statusText[row.status] || row.status }}</el-tag>
        </template>
        <template #progress="{ row }">
            <el-progress :percentage="row.progress || 0" :stroke-width="8" />
        </template>
        <template #createdAt="{ row }">{{ formatTime(row.createdAt) }}</template>
        <template #actionColumn="{ row }">
            <div class="table-row-actions">
              <el-button plain type="primary" :icon="Document" @click="showLog(row)">日志</el-button>
              <el-button
                v-if="activeStatuses.includes(row.status)"
                link
                type="danger"
                :icon="CircleClose"
                @click="cancelTask(row)"
              >
                取消
              </el-button>
            </div>
        </template>
      </custom-table>
    </div>
  </custom-drawer>

  <el-dialog v-model="logDialog.show" :title="logDialog.title" width="760px">
    <pre v-loading="logDialog.loading" class="task-log">{{ logDialog.content }}</pre>
  </el-dialog>
</template>

<style scoped>
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
</style>
