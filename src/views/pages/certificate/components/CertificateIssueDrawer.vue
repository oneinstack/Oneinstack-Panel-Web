<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { HttpRequestError } from '@/api'
import { Api } from '@/api/modules'
import type { CertificateTask, DnsAccount } from '@/api/modules'
import i18n from '@/lang'

interface WebsiteOption {
  id: number
  name: string
  domain: string
}

interface SubmitMeta {
  task?: CertificateTask | null
  taskId?: string
  approvalId?: string
  status?: string
}

interface ChallengeOption {
  value: 'dns-01' | 'http-01'
  label: string
  description: string
}

const props = defineProps<{
  visible: boolean
  dnsAccounts: DnsAccount[]
}>()

const emit = defineEmits<{
  (event: 'update:visible', value: boolean): void
  (event: 'submitted', value: SubmitMeta): void
  (event: 'manage-dns'): void
}>()

const formRef = ref<any>()
const loading = ref(false)
const websitesLoading = ref(false)
const websites = ref<WebsiteOption[]>([])
const submitErrorMessage = ref('')
const submitErrorDetail = ref('')
const submitErrorCode = ref('')
const fieldErrors = reactive<Record<string, string>>({
  challengeType: '',
  domains: '',
  dnsAccountId: '',
  websiteId: '',
  email: '',
  renewBeforeDays: '',
  remark: ''
})
const form = reactive({
  challengeType: 'dns-01' as 'dns-01' | 'http-01',
  domains: '',
  dnsAccountId: '',
  websiteId: undefined as number | undefined,
  email: '',
  autoRenew: true,
  renewBeforeDays: 30,
  remark: ''
})

const t = (key: string, fallback?: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params)
  return value && value !== key ? value : fallback || key
}

const availableDnsAccounts = computed(() =>
  props.dnsAccounts.filter((item) => item.enabled && item.credentialConfigured)
)
const selectedWebsite = computed(() =>
  websites.value.find((item) => item.id === form.websiteId) || null
)
const websiteDomains = computed(() =>
  String(selectedWebsite.value?.domain || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
)
const parsedDomains = computed(() =>
  form.domains
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
)

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ipv4Pattern =
  /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/
const ipv6Pattern = /^[a-fA-F0-9:]+$/
const isIpAddress = (value: string) => ipv4Pattern.test(value) || (value.includes(':') && ipv6Pattern.test(value))

const challengeOptions = computed<ChallengeOption[]>(() => [
  {
    value: 'dns-01',
    label: t('certificate.issue.challengeDns', 'DNS account'),
    description: t('certificate.issue.challengeDnsDesc', 'Use a DNS account to issue certificates, including wildcard domains.')
  },
  {
    value: 'http-01',
    label: t('certificate.issue.challengeHttp', 'Verify by website'),
    description: t('certificate.issue.challengeHttpDesc', 'Use the selected website domain and complete HTTP validation on this server.')
  }
])

const clearSubmitErrors = () => {
  submitErrorMessage.value = ''
  submitErrorDetail.value = ''
  submitErrorCode.value = ''
  Object.keys(fieldErrors).forEach((key) => {
    fieldErrors[key] = ''
  })
}

const normalizeFieldName = (field?: string) => {
  if (!field) return ''
  const mapping: Record<string, string> = {
    challengeType: 'challengeType',
    domains: 'domains',
    dnsAccountId: 'dnsAccountId',
    dns_account_id: 'dnsAccountId',
    websiteId: 'websiteId',
    website_id: 'websiteId',
    email: 'email',
    renewBeforeDays: 'renewBeforeDays',
    renew_before_days: 'renewBeforeDays',
    remark: 'remark'
  }
  return mapping[field] || ''
}

const applyRequestError = (error: unknown) => {
  clearSubmitErrors()
  if (!(error instanceof HttpRequestError)) {
    submitErrorMessage.value = t('certificate.messages.issueFailed')
    return
  }

  submitErrorMessage.value = error.message || t('certificate.messages.issueFailed')
  const payload = error.data && typeof error.data === 'object' ? error.data as any : null
  const detail = payload?.error?.detail
  const code = payload?.error?.code ?? payload?.code ?? error.code
  if (detail && detail !== submitErrorMessage.value) {
    submitErrorDetail.value = String(detail)
  }
  if (code !== undefined && code !== null && code !== '') {
    submitErrorCode.value = String(code)
  }

  const allErrors = Array.isArray(payload?.errors) ? payload.errors : []
  const primaryField = normalizeFieldName(payload?.error?.field || allErrors[0]?.field)
  if (primaryField && payload?.error?.message) {
    fieldErrors[primaryField] = String(payload.error.message)
  }
  allErrors.forEach((item: any) => {
    const field = normalizeFieldName(item?.field)
    if (field && item?.message && !fieldErrors[field]) {
      fieldErrors[field] = String(item.message)
    }
  })
}

const rules = computed(() => ({
  challengeType: [{ required: true, message: t('certificate.messages.challengeTypeRequired'), trigger: 'change' }],
  domains: form.challengeType === 'dns-01'
    ? [{ validator: (_rule: unknown, _value: unknown, callback: (error?: Error) => void) => {
      if (!parsedDomains.value.length) {
        callback(new Error(t('certificate.messages.domainsRequired')))
        return
      }
      const invalidIp = parsedDomains.value.find((item) => isIpAddress(item.replace(/^\[(.*)\]$/, '$1')))
      if (invalidIp) {
        callback(new Error(t('certificate.messages.acmeDnsNoIp')))
        return
      }
      callback()
    }, trigger: 'blur' }]
    : [],
  dnsAccountId: form.challengeType === 'dns-01'
    ? [{ required: true, message: t('certificate.messages.dnsAccountRequired'), trigger: 'change' }]
    : [],
  websiteId: form.challengeType === 'http-01'
    ? [{ required: true, message: t('certificate.messages.websiteRequired'), trigger: 'change' }]
    : [],
  email: [
    { required: true, message: t('certificate.messages.acmeEmailRequired'), trigger: 'blur' },
    {
      validator: (_rule: unknown, value: string, callback: (error?: Error) => void) => {
        emailPattern.test(String(value || '').trim())
          ? callback()
          : callback(new Error(t('certificate.messages.invalidAcmeEmail')))
      },
      trigger: ['blur', 'change']
    }
  ],
  renewBeforeDays: [{
    validator: (_rule: unknown, value: number, callback: (error?: Error) => void) => {
      const days = Number(value)
      if (Number.isInteger(days) && days >= 1 && days <= 90) {
        callback()
        return
      }
      callback(new Error(t('certificate.messages.renewBeforeDaysRequired')))
    },
    trigger: 'change'
  }],
  remark: [{ max: 512, message: t('certificate.messages.remarkTooLong'), trigger: 'blur' }]
}))

const reset = () => {
  clearSubmitErrors()
  form.challengeType = 'dns-01'
  form.domains = ''
  form.dnsAccountId = availableDnsAccounts.value[0]?.id || ''
  form.websiteId = undefined
  form.email = ''
  form.autoRenew = true
  form.renewBeforeDays = 30
  form.remark = ''
  formRef.value?.clearValidate?.()
}

const close = () => {
  clearSubmitErrors()
  emit('update:visible', false)
}

const extractSubmitMeta = (payload: any): SubmitMeta => {
  const envelope = payload?.data ?? payload ?? {}
  const root = envelope?.data ?? envelope ?? {}
  const result = root?.result || envelope?.result || root?.data?.result || {}
  const meta = root?.meta || envelope?.meta || root?.data?.meta || {}
  const task = root?.id ? root as CertificateTask : result?.id ? result as CertificateTask : null
  const taskCandidates = [
    root?.taskId,
    root?.task_id,
    root?.id,
    root?.boundTaskId,
    root?.bound_task_id,
    root?.task?.id,
    result?.taskId,
    result?.task_id,
    result?.id,
    result?.boundTaskId,
    meta?.taskId,
    meta?.task_id,
    meta?.boundTaskId
  ]
  const approvalCandidates = [
    root?.approvalId,
    root?.approval_id,
    root?.approvalRequestId,
    root?.approval_request_id,
    root?.requestId,
    root?.request_id,
    result?.approvalId,
    result?.approval_id,
    result?.approvalRequestId,
    result?.approval_request_id,
    meta?.approvalId,
    meta?.approval_id
  ]
  const statusCandidates = [
    root?.mode,
    root?.status,
    root?.state,
    result?.mode,
    result?.status,
    result?.state,
    meta?.mode,
    meta?.status,
    meta?.state
  ]
  const taskId = taskCandidates.find((item) => typeof item === 'string' || typeof item === 'number')
  const approvalId = approvalCandidates.find((item) => typeof item === 'string' || typeof item === 'number')
  const status = statusCandidates.find((item) => typeof item === 'string')

  return {
    task,
    taskId: taskId ? String(taskId) : '',
    approvalId: approvalId ? String(approvalId) : '',
    status: typeof status === 'string' ? status.toLowerCase() : ''
  }
}

const loadWebsites = async () => {
  websitesLoading.value = true
  try {
    const types = ['php', 'static', 'proxy']
    const results = await Promise.allSettled(
      types.map((type) => Api.getWebsiteList({ type, page: 1, pageSize: 200 }))
    )
    const items: WebsiteOption[] = []
    const seen = new Set<number>()
    results.forEach((result) => {
      if (result.status !== 'fulfilled') return
      const data = result.value?.data?.data || []
      if (!Array.isArray(data)) return
      data.forEach((item: any) => {
        const id = Number(item?.id)
        if (!Number.isFinite(id) || seen.has(id)) return
        seen.add(id)
        items.push({
          id,
          name: String(item?.name || item?.domain || id),
          domain: String(item?.domain || '')
        })
      })
    })
    websites.value = items
  } finally {
    websitesLoading.value = false
  }
}

const submit = async () => {
  const valid = await formRef.value?.validate?.().catch(() => false)
  if (!valid) return
  clearSubmitErrors()
  loading.value = true
  try {
    const payload =
      form.challengeType === 'dns-01'
        ? {
            challengeType: 'dns-01' as const,
            domains: parsedDomains.value,
            email: form.email.trim(),
            dnsAccountId: form.dnsAccountId,
            autoRenew: form.autoRenew,
            renewBeforeDays: form.renewBeforeDays,
            remark: form.remark.trim()
          }
        : {
            challengeType: 'http-01' as const,
            websiteId: form.websiteId,
            email: form.email.trim(),
            autoRenew: form.autoRenew,
            renewBeforeDays: form.renewBeforeDays,
            remark: form.remark.trim()
          }
    const response = await Api.issueManagedCertificate(payload)
    const meta = extractSubmitMeta(response)
    if (meta.taskId || meta.task?.id) {
      ElMessage.success(t('certificate.messages.taskCreated'))
    } else if (meta.approvalId || meta.status === 'approval_pending' || meta.status === 'pending') {
      ElMessage.success(t('certificate.messages.approvalSubmitted'))
    } else {
      ElMessage.success(t('common.success', 'Success'))
    }
    emit('submitted', meta)
    close()
  } catch (error) {
    applyRequestError(error)
  } finally {
    loading.value = false
  }
}

watch(
  () => props.visible,
  async (visible) => {
    if (!visible) return
    reset()
    if (!websites.value.length) {
      await loadWebsites()
    }
  }
)

watch(() => form.challengeType, (value) => {
  clearSubmitErrors()
  formRef.value?.clearValidate?.()
  if (value === 'dns-01') {
    form.websiteId = undefined
    form.dnsAccountId = form.dnsAccountId || availableDnsAccounts.value[0]?.id || ''
  } else {
    form.domains = ''
    form.dnsAccountId = ''
  }
})
</script>

<template>
  <custom-drawer
    :visible="visible"
    :title="$t('certificate.actions.issue')"
    size="720px"
    destroy-on-close
    :loading="loading"
    :on-close="close"
    :on-confirm="submit"
  >
    <el-alert
      class="drawer-alert"
      :title="
        form.challengeType === 'dns-01'
          ? $t('certificate.form.issueDnsHint')
          : $t('certificate.form.issueHttpHint')
      "
      :type="form.challengeType === 'dns-01' ? 'info' : 'warning'"
      show-icon
      :closable="false"
    />
    <el-alert
      v-if="submitErrorMessage"
      class="drawer-alert drawer-alert--error"
      :title="submitErrorMessage"
      type="error"
      show-icon
      :closable="false"
    >
      <template v-if="submitErrorCode || submitErrorDetail" #default>
        <div class="submit-error-details">
          <div v-if="submitErrorCode">
            {{ $t('certificate.messages.errorCodeLabel') }}: {{ submitErrorCode }}
          </div>
          <div v-if="submitErrorDetail">
            {{ submitErrorDetail }}
          </div>
        </div>
      </template>
    </el-alert>
    <el-form ref="formRef" class="issue-form" :model="form" :rules="rules" label-position="top">
      <el-form-item prop="challengeType" :label="$t('certificate.form.challengeType')" required :error="fieldErrors.challengeType">
        <div class="challenge-grid">
          <button
            v-for="item in challengeOptions"
            :key="item.value"
            type="button"
            class="challenge-card"
            :class="{ 'is-active': form.challengeType === item.value }"
            @click="form.challengeType = item.value"
          >
            <strong>{{ item.label }}</strong>
            <span>{{ item.description }}</span>
          </button>
        </div>
      </el-form-item>

      <template v-if="form.challengeType === 'dns-01'">
        <el-form-item prop="domains" :label="$t('certificate.form.domains')" required :error="fieldErrors.domains">
          <el-input
            v-model="form.domains"
            type="textarea"
            :rows="4"
            :placeholder="$t('certificate.form.acmeDomainsPlaceholder')"
          />
        </el-form-item>
        <el-form-item prop="dnsAccountId" :label="$t('certificate.form.dnsAccount')" required :error="fieldErrors.dnsAccountId">
          <div class="inline-field">
            <el-select v-model="form.dnsAccountId" style="width: 100%" :placeholder="$t('certificate.form.selectDnsAccount')">
              <el-option
                v-for="item in availableDnsAccounts"
                :key="item.id"
                :label="`${item.name} · ${item.provider}`"
                :value="item.id"
              />
            </el-select>
            <el-button @click="emit('manage-dns')">{{ $t('certificate.actions.addDnsAccount') }}</el-button>
          </div>
          <div v-if="!availableDnsAccounts.length" class="field-tip field-tip--warning">
            {{ $t('certificate.form.noDnsAccountHint') }}
          </div>
        </el-form-item>
      </template>

      <template v-else>
        <el-form-item prop="websiteId" :label="$t('certificate.form.website')" required :error="fieldErrors.websiteId">
          <el-select
            v-model="form.websiteId"
            filterable
            style="width: 100%"
            :loading="websitesLoading"
            :placeholder="$t('certificate.form.selectWebsite')"
          >
            <el-option
              v-for="item in websites"
              :key="item.id"
              :label="`${item.name} · ${item.domain}`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('certificate.form.websiteDomains')">
          <div class="readonly-box">
            <template v-if="websiteDomains.length">
              <el-tag v-for="domain in websiteDomains" :key="domain" effect="plain" round>
                {{ domain }}
              </el-tag>
            </template>
            <span v-else>{{ t('common.noData', 'No data') }}</span>
          </div>
        </el-form-item>
      </template>

      <div class="form-grid">
        <el-form-item prop="email" :label="$t('certificate.form.accountEmail')" required :error="fieldErrors.email">
          <el-input v-model="form.email" placeholder="admin@example.com" />
        </el-form-item>
        <el-form-item prop="renewBeforeDays" :label="$t('certificate.form.renewBeforeDays')" :error="fieldErrors.renewBeforeDays">
          <el-input-number v-model="form.renewBeforeDays" :min="1" :max="90" style="width: 100%" />
        </el-form-item>
      </div>

      <div class="form-grid form-grid--compact">
        <el-form-item :label="$t('certificate.form.autoRenew')">
          <el-switch v-model="form.autoRenew" />
        </el-form-item>
      </div>

      <el-form-item prop="remark" :label="t('common.remark', 'Remark')" :error="fieldErrors.remark">
        <el-input
          v-model="form.remark"
          type="textarea"
          :rows="3"
          :maxlength="512"
          show-word-limit
          :placeholder="$t('certificate.form.issueRemarkPlaceholder')"
        />
      </el-form-item>
    </el-form>
  </custom-drawer>
</template>

<style scoped lang="less">
.drawer-alert {
  margin-bottom: 22px;
}

.issue-form {
  padding-bottom: 64px;

  :deep(.el-form-item) {
    margin-bottom: 22px;
  }

  :deep(.el-form-item__label) {
    color: var(--text-secondary);
    font-weight: 650;
  }
}

.challenge-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.challenge-card {
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 7px;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  color: inherit;
  text-align: left;
  cursor: pointer;
  background: color-mix(in srgb, var(--surface-subtle) 84%, var(--surface-card) 16%);
  transition:
    border-color 0.18s ease,
    background 0.18s ease,
    transform 0.18s ease,
    box-shadow 0.18s ease;

  strong {
    color: var(--text-primary);
    font-size: 14px;
    font-weight: 700;
  }

  span {
    color: var(--text-tertiary);
    font-size: 12px;
    line-height: 1.6;
  }

  &:hover {
    transform: translateY(-1px);
    border-color: color-mix(in srgb, rgb(var(--primary-color)) 22%, var(--border-subtle));
  }

  &.is-active {
    border-color: rgba(var(--primary-color), 0.38);
    background: color-mix(in srgb, rgba(var(--primary-color), 0.12) 100%, var(--surface-card));
    box-shadow: 0 0 0 3px rgba(var(--primary-color), 0.08);
  }
}

.inline-field {
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
}

.readonly-box {
  min-height: 44px;
  padding: 10px 12px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  background: color-mix(in srgb, var(--surface-subtle) 84%, var(--surface-card) 16%);
  color: var(--text-tertiary);
}

.field-tip {
  margin-top: 8px;
  color: var(--text-tertiary);
  font-size: 12px;
  line-height: 1.6;

  &--warning {
    color: var(--el-color-warning);
  }
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.form-grid--compact {
  grid-template-columns: minmax(0, 1fr);
}

.submit-error-details {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.6;
}

@media (max-width: 720px) {
  .challenge-grid,
  .form-grid,
  .inline-field {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
