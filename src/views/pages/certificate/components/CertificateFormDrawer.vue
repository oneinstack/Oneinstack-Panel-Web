<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { HttpRequestError } from '@/api'
import { Api } from '@/api/modules'
import type { CertificateAlgorithm, CertificateTask } from '@/api/modules'
import i18n from '@/lang'

const props = defineProps<{
  visible: boolean
  mode: 'upload' | 'self-signed'
  algorithms: CertificateAlgorithm[]
}>()

const emit = defineEmits<{
  (event: 'update:visible', value: boolean): void
  (event: 'created', task: CertificateTask): void
}>()

const formRef = ref<any>()
const loading = ref(false)
const submitErrorMessage = ref('')
const submitErrorDetail = ref('')
const submitErrorCode = ref('')
const fieldErrors = reactive<Record<string, string>>({
  domains: '',
  certificate: '',
  privateKey: '',
  algorithm: ''
})
const form = reactive({
  domains: '',
  certificate: '',
  privateKey: '',
  algorithm: '',
  validityYears: 10,
  remark: '',
  autoRenew: false,
  renewBeforeDays: 30
})

const t = (key: string, fallback?: string) => {
  const value = (i18n.t as any)(key)
  return value && value !== key ? value : fallback || key
}

const isUpload = computed(() => props.mode === 'upload')
const title = computed(() => isUpload.value ? t('certificate.actions.upload') : t('certificate.actions.selfSigned'))
const domains = computed(() => form.domains.split(/[\n,]/).map((item) => item.trim()).filter(Boolean))
const rules = computed(() => ({
  domains: isUpload.value ? [] : [{ required: true, message: t('certificate.messages.domainsRequired'), trigger: 'blur' }],
  certificate: [{ required: isUpload.value, message: t('certificate.messages.certificateRequired'), trigger: 'blur' }],
  privateKey: [{ required: isUpload.value, message: t('certificate.messages.privateKeyRequired'), trigger: 'blur' }],
  algorithm: [{ required: !isUpload.value, message: t('certificate.messages.algorithmRequired'), trigger: 'change' }]
}))

const clearSubmitErrors = () => {
  submitErrorMessage.value = ''
  submitErrorDetail.value = ''
  submitErrorCode.value = ''
  fieldErrors.domains = ''
  fieldErrors.certificate = ''
  fieldErrors.privateKey = ''
  fieldErrors.algorithm = ''
}

const normalizeFieldName = (field?: string) => {
  if (!field) return ''
  const mapping: Record<string, string> = {
    domains: 'domains',
    certificate: 'certificate',
    certificatePem: 'certificate',
    privateKey: 'privateKey',
    private_key: 'privateKey',
    privateKeyPem: 'privateKey',
    algorithm: 'algorithm'
  }
  return mapping[field] || ''
}

const applyRequestError = (error: unknown) => {
  clearSubmitErrors()
  if (!(error instanceof HttpRequestError)) {
    submitErrorMessage.value = t('certificate.messages.submitFailed')
    return
  }

  submitErrorMessage.value = error.message || t('certificate.messages.submitFailed')

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

const reset = () => {
  clearSubmitErrors()
  form.domains = ''
  form.certificate = ''
  form.privateKey = ''
  form.algorithm = props.algorithms[0]?.value || ''
  form.validityYears = 10
  form.remark = ''
  form.autoRenew = false
  form.renewBeforeDays = 30
  formRef.value?.clearValidate?.()
}

const close = () => {
  clearSubmitErrors()
  form.certificate = ''
  form.privateKey = ''
  emit('update:visible', false)
}

const submit = async () => {
  const valid = await formRef.value?.validate?.().catch(() => false)
  if (!valid) return
  clearSubmitErrors()
  loading.value = true
  try {
    const common = {
      domains: domains.value,
      remark: form.remark.trim(),
      autoRenew: form.autoRenew,
      renewBeforeDays: form.renewBeforeDays
    }
    const response = isUpload.value
      ? await Api.uploadCertificate({ ...common, certificate: form.certificate.trim(), privateKey: form.privateKey.trim() })
      : await Api.createSelfSignedCertificate({
          ...common,
          algorithm: form.algorithm,
          validityYears: form.validityYears
        })
    ElMessage.success(t('certificate.messages.taskCreated'))
    emit('created', response.data)
    close()
  } catch (error) {
    applyRequestError(error)
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.visible, props.mode, props.algorithms] as const,
  ([visible]) => {
    if (visible) reset()
  },
  { deep: true }
)

watch(() => form.domains, () => {
  fieldErrors.domains = ''
})

watch(() => form.certificate, () => {
  fieldErrors.certificate = ''
})

watch(() => form.privateKey, () => {
  fieldErrors.privateKey = ''
})

watch(() => form.algorithm, () => {
  fieldErrors.algorithm = ''
})
</script>

<template>
  <custom-drawer
    :visible="visible"
    :title="title"
    size="680px"
    destroy-on-close
    :loading="loading"
    :on-close="close"
    :on-confirm="submit"
  >
    <el-alert
      class="drawer-alert"
      :title="isUpload ? $t('certificate.form.uploadHint') : $t('certificate.form.selfSignedHint')"
      :type="isUpload ? 'info' : 'warning'"
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
    <el-form ref="formRef" class="certificate-form" :model="form" :rules="rules" label-position="top">
      <el-form-item prop="domains" :label="$t('certificate.form.domains')" :required="!isUpload" :error="fieldErrors.domains">
        <el-input
          v-model="form.domains"
          type="textarea"
          :rows="3"
          :placeholder="$t('certificate.form.domainsPlaceholder')"
        />
      </el-form-item>

      <template v-if="isUpload">
        <el-form-item prop="certificate" :label="$t('certificate.form.certificatePem')" required :error="fieldErrors.certificate">
          <el-input
            v-model="form.certificate"
            class="pem-input"
            type="textarea"
            :rows="8"
            :placeholder="$t('certificate.form.certificatePlaceholder')"
          />
        </el-form-item>
        <el-form-item prop="privateKey" :label="$t('certificate.form.privateKeyPem')" required :error="fieldErrors.privateKey">
          <el-input
            v-model="form.privateKey"
            class="pem-input"
            type="textarea"
            :rows="7"
            :placeholder="$t('certificate.form.privateKeyPlaceholder')"
          />
        </el-form-item>
      </template>

      <div v-else class="form-grid">
        <el-form-item prop="algorithm" :label="$t('certificate.form.algorithm')" required :error="fieldErrors.algorithm">
          <el-select v-model="form.algorithm" style="width: 100%">
            <el-option v-for="item in algorithms" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('certificate.form.validityYears')">
          <el-input-number v-model="form.validityYears" :min="1" :max="30" controls-position="right" />
        </el-form-item>
      </div>

      <el-form-item :label="$t('common.remark')">
        <el-input v-model="form.remark" :maxlength="256" show-word-limit />
      </el-form-item>
      <div class="form-grid">
        <el-form-item :label="$t('certificate.form.autoRenew')">
          <el-switch v-model="form.autoRenew" />
        </el-form-item>
        <el-form-item :label="$t('certificate.form.renewBeforeDays')">
          <el-input-number v-model="form.renewBeforeDays" :min="1" :max="90" controls-position="right" />
        </el-form-item>
      </div>
    </el-form>
  </custom-drawer>
</template>

<style scoped lang="less">
.drawer-alert {
  margin-bottom: 24px;
}

.drawer-alert--error {
  :deep(.el-alert__description) {
    margin-top: 8px;
  }
}

.submit-error-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.5;
}

.certificate-form {
  padding-bottom: 52px;

  :deep(.el-form-item) {
    margin-bottom: 22px;
  }

  :deep(.el-form-item__label) {
    color: var(--text-secondary);
    font-weight: 650;
  }

  :deep(.el-input__wrapper),
  :deep(.el-textarea__inner) {
    border-radius: 8px;
  }

  :deep(.pem-input textarea) {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    line-height: 1.65;
  }
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

@media (max-width: 680px) {
  .form-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }
}
</style>
