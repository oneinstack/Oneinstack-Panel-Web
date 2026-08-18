<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Api } from '@/api/modules'
import type { DnsAccount, DnsProviderOption } from '@/api/modules'
import i18n from '@/lang'

const props = defineProps<{
  visible: boolean
  account?: DnsAccount | null
  providers: DnsProviderOption[]
}>()

const emit = defineEmits<{
  (event: 'update:visible', value: boolean): void
  (event: 'saved'): void
}>()

const formRef = ref<any>()
const loading = ref(false)
const form = reactive({
  name: '',
  provider: '',
  credentialOne: '',
  credentialTwo: '',
  enabled: true
})

const t = (key: string, fallback?: string) => {
  const value = (i18n.t as any)(key)
  return value && value !== key ? value : fallback || key
}
const isEdit = computed(() => Boolean(props.account?.id))
const title = computed(() => isEdit.value ? t('certificate.actions.editDnsAccount') : t('certificate.actions.addDnsAccount'))
const rules = computed(() => ({
  name: [{ required: true, message: t('certificate.messages.dnsNameRequired'), trigger: 'blur' }],
  provider: [{ required: true, message: t('certificate.messages.dnsProviderRequired'), trigger: 'change' }],
  credentialOne: isEdit.value ? [] : [{ required: true, message: t('certificate.messages.credentialRequired'), trigger: 'blur' }]
}))

const reset = () => {
  form.name = props.account?.name || ''
  form.provider = props.account?.provider || props.providers[0]?.value || ''
  form.credentialOne = ''
  form.credentialTwo = ''
  form.enabled = props.account?.enabled ?? true
  formRef.value?.clearValidate?.()
}

const close = () => {
  form.credentialOne = ''
  form.credentialTwo = ''
  emit('update:visible', false)
}

const submit = async () => {
  const valid = await formRef.value?.validate?.().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    const payload: Record<string, any> = {
      name: form.name.trim(),
      provider: form.provider,
      enabled: form.enabled
    }
    if (props.account?.id) payload.id = props.account.id
    if (form.credentialOne.trim()) payload.credentialOne = form.credentialOne.trim()
    if (form.credentialTwo.trim()) payload.credentialTwo = form.credentialTwo.trim()
    await Api.saveCertificateDnsAccount(payload)
    ElMessage.success(t('certificate.messages.dnsSaved'))
    emit('saved')
    close()
  } finally {
    loading.value = false
  }
}

watch(() => [props.visible, props.account, props.providers] as const, ([visible]) => {
  if (visible) reset()
}, { deep: true })
</script>

<template>
  <custom-drawer
    :visible="visible"
    :title="title"
    size="580px"
    destroy-on-close
    :loading="loading"
    :on-close="close"
    :on-confirm="submit"
  >
    <el-alert
      class="drawer-alert"
      :title="$t('certificate.form.dnsHint')"
      type="info"
      show-icon
      :closable="false"
    />
    <el-form ref="formRef" class="dns-form" :model="form" :rules="rules" label-position="top">
      <el-form-item prop="name" :label="$t('certificate.form.accountName')" required>
        <el-input v-model="form.name" :maxlength="128" />
      </el-form-item>
      <el-form-item prop="provider" :label="$t('certificate.form.dnsProvider')" required>
        <el-select v-model="form.provider" style="width: 100%">
          <el-option v-for="item in providers" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-alert
        v-if="isEdit && account?.credentialConfigured"
        class="credential-hint"
        :title="$t('certificate.form.credentialKeepHint')"
        type="success"
        :closable="false"
      />
      <el-form-item prop="credentialOne" :label="$t('certificate.form.credentialOne')" :required="!isEdit">
        <el-input v-model="form.credentialOne" type="password" show-password autocomplete="new-password" />
      </el-form-item>
      <el-form-item :label="$t('certificate.form.credentialTwo')">
        <el-input v-model="form.credentialTwo" type="password" show-password autocomplete="new-password" />
      </el-form-item>
      <el-form-item :label="$t('certificate.form.enabled')">
        <el-switch v-model="form.enabled" />
      </el-form-item>
    </el-form>
  </custom-drawer>
</template>

<style scoped lang="less">
.drawer-alert,
.credential-hint {
  margin-bottom: 22px;
}

.dns-form {
  padding-bottom: 64px;

  :deep(.el-form-item) {
    margin-bottom: 22px;
  }

  :deep(.el-form-item__label) {
    color: var(--text-secondary);
    font-weight: 650;
  }
}
</style>
