<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Connection, CopyDocument, Download, Link, Unlock } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Api } from '@/api/modules'
import type { CertificateBinding, CertificateTask, ManagedCertificate } from '@/api/modules'
import type { ColumnItem } from '@/components/custom-table.vue'
import CertificateBindDrawer from './CertificateBindDrawer.vue'
import i18n from '@/lang'

const props = defineProps<{
  visible: boolean
  certificateId: string
  canWrite: boolean
}>()

const emit = defineEmits<{
  (event: 'update:visible', value: boolean): void
  (event: 'changed'): void
  (event: 'task-created', task: CertificateTask): void
}>()

const loading = ref(false)
const materialLoading = ref(false)
const activeTab = ref('info')
const certificate = ref<ManagedCertificate | null>(null)
const bindings = ref<CertificateBinding[]>([])
const certificatePem = ref('')
const privateKeyPem = ref('')
const bindVisible = ref(false)

const t = (key: string, fallback?: string) => {
  const value = (i18n.t as any)(key)
  return value && value !== key ? value : fallback || key
}
const formatTime = (value?: string) => value ? new Date(value).toLocaleString() : '—'
const label = (group: 'status' | 'providers', value?: string) => value ? t(`certificate.${group}.${value.replace('-', '')}`, value) : '—'
const providerLabel = (value?: string) => {
  if (value === 'self-signed') return t('certificate.providers.selfSigned')
  return value ? t(`certificate.providers.${value}`, value) : '—'
}
const statusType = (status?: string) => {
  if (status === 'active') return 'success'
  if (status === 'expiring') return 'warning'
  if (status === 'disabled') return 'info'
  return 'danger'
}
const activeBindingIds = computed(() => bindings.value.filter((item) => item.status === 'active').map((item) => item.websiteId))
const bindingColumns = computed<ColumnItem<CertificateBinding>[]>(() => [
  { prop: 'websiteId', label: t('certificate.columns.website'), minWidth: 130, slot: 'website' },
  { prop: 'status', label: t('common.status'), width: 105, slot: 'status' },
  { prop: 'forceHttps', label: t('certificate.columns.forceHttps'), width: 125, slot: 'forceHttps' },
  { prop: 'deployedAt', label: t('certificate.columns.deployedAt'), minWidth: 170, slot: 'deployedAt' },
  { prop: 'actionColumn', label: t('common.action'), width: 110, fixed: 'right', slot: 'actionColumn', className: 'table-action-column' }
])

const loadDetail = async () => {
  if (!props.certificateId) return
  loading.value = true
  try {
    const response = await Api.getCertificateDetail(props.certificateId)
    certificate.value = response.data?.certificate || null
    bindings.value = response.data?.bindings || []
  } finally {
    loading.value = false
  }
}

const readBlobText = async (request: Promise<{ blob: Blob }>) => {
  const response = await request
  return response.blob.text()
}

const loadCertificatePem = async () => {
  if (certificatePem.value || !props.certificateId) return
  materialLoading.value = true
  try {
    certificatePem.value = await readBlobText(Api.getCertificatePem(props.certificateId))
  } finally {
    materialLoading.value = false
  }
}

const loadPrivateKey = async () => {
  if (privateKeyPem.value || !props.certificateId) return
  materialLoading.value = true
  try {
    privateKeyPem.value = await readBlobText(Api.getCertificatePrivateKey(props.certificateId))
  } finally {
    materialLoading.value = false
  }
}

const onTabChange = (name: string | number) => {
  if (name === 'certificate') void loadCertificatePem()
}

const fallbackCopy = (content: string) => {
  const textarea = document.createElement('textarea')
  textarea.className = 'certificate-copy-helper'
  textarea.value = content
  document.body.appendChild(textarea)
  textarea.select()
  const copied = document.execCommand('copy')
  textarea.remove()
  if (!copied) throw new Error('copy failed')
}

const copyText = async (content: string) => {
  if (!content) return
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(content)
    else fallbackCopy(content)
    ElMessage.success(t('common.copied'))
  } catch {
    try {
      fallbackCopy(content)
      ElMessage.success(t('common.copied'))
    } catch {
      ElMessage.error(t('certificate.messages.copyFailed'))
    }
  }
}

const download = async () => {
  if (props.certificateId) await Api.downloadCertificate(props.certificateId)
}

const unbind = async (binding: CertificateBinding) => {
  try {
    await ElMessageBox.confirm(t('certificate.confirm.unbind'), t('certificate.confirm.unbindTitle'), {
      type: 'warning',
      confirmButtonText: t('certificate.actions.unbind'),
      cancelButtonText: t('common.cancel')
    })
  } catch {
    return
  }
  await Api.unbindCertificateWebsite(props.certificateId, binding.websiteId)
  ElMessage.success(t('certificate.messages.unbound'))
  await loadDetail()
  emit('changed')
}

const handleTaskCreated = (task: CertificateTask) => {
  bindVisible.value = false
  close()
  emit('task-created', task)
}

const close = () => {
  certificatePem.value = ''
  privateKeyPem.value = ''
  activeTab.value = 'info'
  emit('update:visible', false)
}

watch(
  () => [props.visible, props.certificateId] as const,
  ([visible, id]) => {
    certificatePem.value = ''
    privateKeyPem.value = ''
    activeTab.value = 'info'
    certificate.value = null
    bindings.value = []
    if (visible && id) void loadDetail()
  }
)
</script>

<template>
  <custom-drawer
    :visible="visible"
    :title="$t('certificate.detail.title')"
    size="780px"
    destroy-on-close
    :show-footer="false"
    :on-close="close"
  >
    <div v-loading="loading" class="certificate-detail">
      <div v-if="certificate" class="detail-heading">
        <div>
          <span>{{ providerLabel(certificate.provider) }}</span>
          <strong>{{ certificate.domains }}</strong>
          <small>{{ certificate.remark || certificate.issuer || '—' }}</small>
        </div>
        <el-tag :type="statusType(certificate.status)">{{ label('status', certificate.status) }}</el-tag>
      </div>

      <el-tabs v-model="activeTab" class="detail-tabs" @tab-change="onTabChange">
        <el-tab-pane :label="$t('certificate.detail.info')" name="info">
          <template v-if="certificate">
            <dl class="detail-list">
              <div><dt>{{ $t('certificate.columns.provider') }}</dt><dd>{{ providerLabel(certificate.provider) }}</dd></div>
              <div><dt>{{ $t('certificate.columns.algorithm') }}</dt><dd>{{ certificate.algorithm || '—' }}</dd></div>
              <div><dt>{{ $t('certificate.detail.serialNumber') }}</dt><dd>{{ certificate.serialNumber || '—' }}</dd></div>
              <div><dt>{{ $t('certificate.columns.issuer') }}</dt><dd>{{ certificate.issuer || '—' }}</dd></div>
              <div><dt>{{ $t('certificate.detail.effectiveAt') }}</dt><dd>{{ formatTime(certificate.notBefore) }}</dd></div>
              <div><dt>{{ $t('certificate.detail.expiresAt') }}</dt><dd>{{ formatTime(certificate.notAfter) }}</dd></div>
              <div><dt>{{ $t('certificate.detail.renewPolicy') }}</dt><dd>{{ certificate.autoRenew ? $t('common.enabled') : $t('common.disabled') }} · {{ certificate.renewBeforeDays }}d</dd></div>
              <div><dt>{{ $t('common.remark') }}</dt><dd>{{ certificate.remark || '—' }}</dd></div>
            </dl>

            <section class="binding-section">
              <div class="section-heading">
                <div>
                  <strong>{{ $t('certificate.detail.bindings') }}</strong>
                  <span>{{ bindings.length }}</span>
                </div>
                <el-button v-if="canWrite" type="primary" :icon="Link" @click="bindVisible = true">
                  {{ $t('certificate.actions.bind') }}
                </el-button>
              </div>
              <custom-table
                :data="bindings"
                :columns="bindingColumns"
                :pagination="false"
                :empty-text="$t('certificate.detail.noBindings')"
                size="small"
              >
                <template #website="{ row }">#{{ row.websiteId }}</template>
                <template #status="{ row }">
                  <el-tag size="small" :type="statusType(row.status)">{{ label('status', row.status) }}</el-tag>
                </template>
                <template #forceHttps="{ row }">{{ row.forceHttps ? $t('common.enabled') : $t('common.disabled') }}</template>
                <template #deployedAt="{ row }">{{ formatTime(row.deployedAt) }}</template>
                <template #actionColumn="{ row }">
                  <div class="table-row-actions">
                    <el-button v-if="canWrite && row.status === 'active'" link type="danger" :icon="Connection" @click="unbind(row)">
                      {{ $t('certificate.actions.unbind') }}
                    </el-button>
                  </div>
                </template>
              </custom-table>
            </section>
          </template>
        </el-tab-pane>

        <el-tab-pane :label="$t('certificate.detail.certificate')" name="certificate">
          <div v-loading="materialLoading" class="material-panel">
            <div class="material-actions">
              <el-button :icon="CopyDocument" :disabled="!certificatePem" @click="copyText(certificatePem)">
                {{ $t('certificate.actions.copyCertificate') }}
              </el-button>
              <el-button :icon="Download" @click="download">{{ $t('common.download') }}</el-button>
            </div>
            <pre>{{ certificatePem || $t('certificate.detail.materialEmpty') }}</pre>
          </div>
        </el-tab-pane>

        <el-tab-pane :label="$t('certificate.detail.privateKey')" name="private-key">
          <div v-loading="materialLoading" class="material-panel">
            <el-alert
              :title="$t('certificate.detail.privateKeyWarning')"
              type="warning"
              show-icon
              :closable="false"
            />
            <div class="material-actions private-actions">
              <el-button v-if="!privateKeyPem" type="warning" :icon="Unlock" @click="loadPrivateKey">
                {{ $t('certificate.detail.privateKeyConsent') }}
              </el-button>
              <el-button v-else :icon="CopyDocument" @click="copyText(privateKeyPem)">
                {{ $t('certificate.actions.copyPrivateKey') }}
              </el-button>
            </div>
            <pre v-if="privateKeyPem">{{ privateKeyPem }}</pre>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </custom-drawer>

  <certificate-bind-drawer
    v-model:visible="bindVisible"
    :certificate-id="certificateId"
    :bound-website-ids="activeBindingIds"
    @created="handleTaskCreated"
  />
</template>

<style scoped lang="less">
.certificate-detail {
  min-height: 360px;
  padding-bottom: 44px;
}

.detail-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-subtle);

  > div {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  span,
  small {
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

.detail-tabs {
  margin-top: 12px;
}

.detail-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 4px 0 0;

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

.binding-section {
  margin-top: 28px;
}

.section-heading,
.section-heading > div,
.material-actions {
  display: flex;
  align-items: center;
}

.section-heading {
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;

  > div {
    gap: 9px;
  }

  strong {
    color: var(--text-primary);
    font-size: 14px;
  }

  span {
    min-width: 24px;
    padding: 2px 7px;
    border-radius: 999px;
    color: var(--text-tertiary);
    font-size: 11px;
    text-align: center;
    background: var(--surface-muted);
  }
}

.material-panel {
  min-height: 320px;
  padding-top: 8px;
}

.material-actions {
  justify-content: flex-end;
  gap: 10px;
  margin-bottom: 14px;
}

.private-actions {
  justify-content: flex-start;
  margin-top: 18px;
}

pre {
  min-height: 300px;
  max-height: 540px;
  margin: 0;
  padding: 16px;
  overflow: auto;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  color: #d8dee9;
  background: #0d1728;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  line-height: 1.7;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

:global(.certificate-copy-helper) {
  position: fixed;
  top: -10000px;
  left: -10000px;
  width: 1px;
  height: 1px;
  opacity: 0;
}

@media (max-width: 680px) {
  .detail-list {
    grid-template-columns: 1fr;
  }
}
</style>
