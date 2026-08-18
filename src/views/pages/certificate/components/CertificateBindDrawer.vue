<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Api } from '@/api/modules'
import type { CertificateTask } from '@/api/modules'
import i18n from '@/lang'

interface WebsiteOption {
  id: number
  label: string
  domains: string
}

const props = defineProps<{
  visible: boolean
  certificateId: string
  boundWebsiteIds?: number[]
}>()

const emit = defineEmits<{
  (event: 'update:visible', value: boolean): void
  (event: 'created', task: CertificateTask): void
}>()

const formRef = ref<any>()
const loading = ref(false)
const websiteLoading = ref(false)
const websites = ref<WebsiteOption[]>([])
const form = reactive({ websiteId: undefined as number | undefined, forceHttps: true })

const t = (key: string, fallback?: string) => {
  const value = (i18n.t as any)(key)
  return value && value !== key ? value : fallback || key
}

const availableWebsites = computed(() => {
  const bound = new Set(props.boundWebsiteIds || [])
  return websites.value.filter((item) => !bound.has(item.id))
})

const normalizeList = (value: any): any[] => {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.data)) return value.data
  if (Array.isArray(value?.items)) return value.items
  if (Array.isArray(value?.list)) return value.list
  return []
}

const loadWebsites = async () => {
  websiteLoading.value = true
  try {
    const response = await Api.getWebsiteList({ page: 1, pageSize: 100 })
    websites.value = normalizeList(response.data).map((item: any) => {
      const id = Number(item.id ?? item.websiteId)
      const domains = String(item.domain || item.domains || item.name || '')
      return {
        id,
        domains,
        label: item.remark ? `${domains} (${item.remark})` : domains || `#${id}`
      }
    }).filter((item: WebsiteOption) => Number.isInteger(item.id) && item.id > 0)
  } finally {
    websiteLoading.value = false
  }
}

const close = () => emit('update:visible', false)

const submit = async () => {
  const valid = await formRef.value?.validate?.().catch(() => false)
  if (!valid || !form.websiteId) return
  loading.value = true
  try {
    const response = await Api.bindCertificateWebsite(props.certificateId, {
      websiteId: form.websiteId,
      forceHttps: form.forceHttps
    })
    ElMessage.success(t('certificate.messages.taskCreated'))
    emit('created', response.data)
    close()
  } finally {
    loading.value = false
  }
}

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    form.websiteId = undefined
    form.forceHttps = true
    formRef.value?.clearValidate?.()
    void loadWebsites()
  }
)
</script>

<template>
  <custom-drawer
    :visible="visible"
    :title="$t('certificate.actions.bind')"
    size="560px"
    destroy-on-close
    :loading="loading"
    :on-close="close"
    :on-confirm="submit"
  >
    <el-form ref="formRef" class="bind-form" :model="form" label-position="top">
      <el-form-item
        prop="websiteId"
        :label="$t('certificate.form.website')"
        required
        :rules="[{ required: true, message: $t('certificate.messages.websiteRequired'), trigger: 'change' }]"
      >
        <el-select
          v-model="form.websiteId"
          :loading="websiteLoading"
          filterable
          style="width: 100%"
          :placeholder="$t('common.selectPlaceholder')"
        >
          <el-option v-for="item in availableWebsites" :key="item.id" :label="item.label" :value="item.id">
            <div class="website-option">
              <strong>{{ item.label }}</strong>
              <span>ID: {{ item.id }}</span>
            </div>
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('certificate.form.forceHttps')">
        <div class="switch-row">
          <el-switch v-model="form.forceHttps" />
          <span>{{ form.forceHttps ? $t('common.enabled') : $t('common.disabled') }}</span>
        </div>
      </el-form-item>
    </el-form>
  </custom-drawer>
</template>

<style scoped lang="less">
.bind-form {
  padding: 8px 0 72px;

  :deep(.el-form-item) {
    margin-bottom: 26px;
  }

  :deep(.el-form-item__label) {
    color: var(--text-secondary);
    font-weight: 650;
  }
}

.switch-row {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-tertiary);
  font-size: 13px;
}

.website-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;

  span {
    color: var(--text-tertiary);
    font-size: 12px;
  }
}
</style>
