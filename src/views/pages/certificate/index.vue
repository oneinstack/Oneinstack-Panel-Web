<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import {
  CircleClose,
  Delete,
  Document,
  Download,
  EditPen,
  Link,
  Plus,
  Refresh,
  Upload,
  View
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Api } from '@/api/modules'
import type {
  CertificateAlgorithm,
  CertificateTask,
  DnsAccount,
  DnsProviderOption,
  ManagedCertificate
} from '@/api/modules'
import type { ColumnItem } from '@/components/custom-table.vue'
import { useConfigStore } from '@/stores/modules/config'
import CertificateDetailDrawer from './components/CertificateDetailDrawer.vue'
import CertificateFormDrawer from './components/CertificateFormDrawer.vue'
import CertificateBindDrawer from './components/CertificateBindDrawer.vue'
import CertificateTaskDrawer from './components/CertificateTaskDrawer.vue'
import DnsAccountDrawer from './components/DnsAccountDrawer.vue'
import i18n from '@/lang'

const sconfig = useConfigStore()
const activeTab = ref('certificates')
const algorithms = ref<CertificateAlgorithm[]>([])
const dnsProviders = ref<DnsProviderOption[]>([])
const certificates = ref<ManagedCertificate[]>([])
const tasks = ref<CertificateTask[]>([])
const dnsAccounts = ref<DnsAccount[]>([])
const certificateLoading = ref(false)
const taskLoading = ref(false)
const dnsLoading = ref(false)
const certificateTotal = ref(0)
const taskTotal = ref(0)
const formDrawer = reactive({ visible: false, mode: 'upload' as 'upload' | 'self-signed' })
const detailDrawer = reactive({ visible: false, certificateId: '' })
const bindDrawer = reactive({ visible: false, certificateId: '' })
const taskDrawer = reactive({ visible: false, taskId: '' })
const dnsDrawer = reactive({ visible: false, account: null as DnsAccount | null })
const certificateQuery = reactive({ page: 1, pageSize: 20 })
const taskQuery = reactive({ page: 1, pageSize: 20, status: '' })
let taskPollTimer: number | undefined

const t = (key: string, fallback?: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params)
  return value && value !== key ? value : fallback || key
}

const canRead = computed(() =>
  sconfig.hasActionAccess('certificate.read') || sconfig.hasScopeAccess('certificate', 'read')
)
const canWrite = computed(() =>
  sconfig.hasActionAccess('certificate.write') || sconfig.hasScopeAccess('certificate', 'write')
)
const activeStatuses = new Set(['queued', 'running', 'canceling'])
const hasActiveTasks = computed(() => tasks.value.some((item) => activeStatuses.has(item.status)))

const providerLabel = (value?: string) => {
  if (value === 'self-signed') return t('certificate.providers.selfSigned', value)
  return value ? t(`certificate.providers.${value}`, value) : '—'
}
const statusLabel = (value?: string) => value ? t(`certificate.status.${value}`, value) : '—'
const operationLabel = (value?: string) => value ? t(`certificate.operations.${value}`, value) : '—'
const statusType = (status?: string) => {
  if (status === 'active' || status === 'succeeded') return 'success'
  if (status === 'expiring' || status === 'queued' || status === 'running' || status === 'canceling') return 'warning'
  if (status === 'disabled' || status === 'canceled' || status === 'interrupted') return 'info'
  return 'danger'
}
const formatTime = (value?: string) => value ? new Date(value).toLocaleString() : '—'
const firstDomain = (domains?: string) => domains?.split(',').map((item) => item.trim()).find(Boolean) || '—'

const certificateColumns = computed<ColumnItem<ManagedCertificate>[]>(() => [
  { prop: 'domains', label: t('certificate.columns.domains'), minWidth: 250, slot: 'domains' },
  { prop: 'provider', label: t('certificate.columns.provider'), width: 120, slot: 'provider' },
  { prop: 'status', label: t('common.status'), width: 110, slot: 'status' },
  { prop: 'issuer', label: t('certificate.columns.issuer'), minWidth: 170, showOverflowTooltip: true },
  { prop: 'algorithm', label: t('certificate.columns.algorithm'), width: 120 },
  { prop: 'notAfter', label: t('certificate.columns.expiresAt'), minWidth: 170, slot: 'notAfter' },
  { prop: 'actionColumn', label: t('common.action'), width: 330, fixed: 'right', slot: 'actionColumn', className: 'table-action-column' }
])
const taskColumns = computed<ColumnItem<CertificateTask>[]>(() => [
  { prop: 'operation', label: t('certificate.columns.operation'), width: 130, slot: 'operation' },
  { prop: 'domains', label: t('certificate.columns.domains'), minWidth: 220, slot: 'taskTarget' },
  { prop: 'status', label: t('common.status'), width: 110, slot: 'status' },
  { prop: 'progress', label: t('certificate.columns.progress'), width: 150, slot: 'progress' },
  { prop: 'message', label: t('certificate.columns.message'), minWidth: 220, slot: 'message' },
  { prop: 'createdAt', label: t('certificate.columns.createdAt'), minWidth: 170, slot: 'createdAt' },
  { prop: 'actionColumn', label: t('common.action'), width: 190, fixed: 'right', slot: 'actionColumn', className: 'table-action-column' }
])
const dnsColumns = computed<ColumnItem<DnsAccount>[]>(() => [
  { prop: 'name', label: t('common.name'), minWidth: 220 },
  { prop: 'provider', label: t('certificate.columns.dnsProvider'), minWidth: 170, slot: 'provider' },
  { prop: 'credentialConfigured', label: t('certificate.columns.credentials'), width: 130, slot: 'credentials' },
  { prop: 'enabled', label: t('common.status'), width: 110, slot: 'enabled' },
  { prop: 'updatedAt', label: t('certificate.columns.updatedAt'), minWidth: 180, slot: 'updatedAt' },
  { prop: 'actionColumn', label: t('common.action'), width: 180, fixed: 'right', slot: 'actionColumn', className: 'table-action-column' }
])

const loadMetadata = async () => {
  const [algorithmResult, providerResult] = await Promise.allSettled([
    Api.getCertificateAlgorithms(),
    Api.getCertificateDnsProviders()
  ])
  if (algorithmResult.status === 'fulfilled') {
    algorithms.value = Array.isArray(algorithmResult.value.data) ? algorithmResult.value.data : []
  }
  if (providerResult.status === 'fulfilled') {
    dnsProviders.value = Array.isArray(providerResult.value.data) ? providerResult.value.data : []
  }
}

const loadCertificates = async (quiet = false) => {
  if (!canRead.value) return
  if (!quiet) certificateLoading.value = true
  try {
    const response = await Api.getCertificates(certificateQuery)
    certificates.value = response.data?.data || []
    certificateTotal.value = response.data?.total || 0
  } finally {
    if (!quiet) certificateLoading.value = false
  }
}

const loadTasks = async (quiet = false) => {
  if (!canRead.value) return
  if (!quiet) taskLoading.value = true
  try {
    const response = await Api.getCertificateCenterTasks({
      page: taskQuery.page,
      pageSize: taskQuery.pageSize,
      status: taskQuery.status || undefined
    })
    tasks.value = response.data?.data || []
    taskTotal.value = response.data?.total || 0
  } finally {
    if (!quiet) taskLoading.value = false
  }
}

const loadDnsAccounts = async () => {
  if (!canRead.value) return
  dnsLoading.value = true
  try {
    const response = await Api.getCertificateDnsAccounts()
    dnsAccounts.value = Array.isArray(response.data) ? response.data : []
  } finally {
    dnsLoading.value = false
  }
}

const refreshCurrent = () => {
  if (activeTab.value === 'tasks') return loadTasks()
  if (activeTab.value === 'dnsAccounts') return loadDnsAccounts()
  return loadCertificates()
}

const openCreate = (mode: 'upload' | 'self-signed') => {
  formDrawer.mode = mode
  formDrawer.visible = true
}
const openDetail = (certificate: ManagedCertificate) => {
  detailDrawer.certificateId = certificate.id
  detailDrawer.visible = true
}
const openBind = (certificate: ManagedCertificate) => {
  bindDrawer.certificateId = certificate.id
  bindDrawer.visible = true
}
const openTask = (task: CertificateTask) => {
  taskDrawer.taskId = task.id
  taskDrawer.visible = true
}
const handleTaskCreated = (task: CertificateTask) => {
  bindDrawer.visible = false
  taskDrawer.taskId = task.id
  taskDrawer.visible = true
  void loadTasks(true)
}

const deleteCertificate = async (certificate: ManagedCertificate) => {
  const detailResponse = await Api.getCertificateDetail(certificate.id)
  const activeBindings = (detailResponse.data?.bindings || []).filter((item: any) => item.status === 'active')
  if (activeBindings.length) {
    ElMessage.warning(t('certificate.detail.activeBindingsHint'))
    openDetail(certificate)
    return
  }
  try {
    await ElMessageBox.confirm(
      t('certificate.confirm.deleteCertificate', '', { name: firstDomain(certificate.domains) }),
      t('certificate.confirm.deleteCertificateTitle'),
      {
        type: 'warning',
        confirmButtonText: t('common.delete'),
        cancelButtonText: t('common.cancel')
      }
    )
  } catch {
    return
  }
  await Api.deleteCertificate(certificate.id)
  ElMessage.success(t('certificate.messages.certificateDeleted'))
  await loadCertificates()
}

const cancelTask = async (task: CertificateTask) => {
  try {
    await ElMessageBox.confirm(t('certificate.confirm.cancelTask'), t('certificate.confirm.cancelTaskTitle'), {
      type: 'warning',
      confirmButtonText: t('certificate.actions.cancelTask'),
      cancelButtonText: t('common.cancel')
    })
  } catch {
    return
  }
  await Api.cancelCertificateCenterTask(task.id)
  ElMessage.success(t('certificate.messages.taskCanceled'))
  await loadTasks(true)
}

const editDnsAccount = (account?: DnsAccount) => {
  dnsDrawer.account = account || null
  dnsDrawer.visible = true
}
const deleteDnsAccount = async (account: DnsAccount) => {
  try {
    await ElMessageBox.confirm(
      t('certificate.confirm.deleteDns', '', { name: account.name }),
      t('certificate.confirm.deleteDnsTitle'),
      {
        type: 'warning',
        confirmButtonText: t('common.delete'),
        cancelButtonText: t('common.cancel')
      }
    )
  } catch {
    return
  }
  await Api.deleteCertificateDnsAccount(account.id)
  ElMessage.success(t('certificate.messages.dnsDeleted'))
  await loadDnsAccounts()
}

const onCertificatePage = () => void loadCertificates()
const onCertificatePageSize = () => {
  certificateQuery.page = 1
  void loadCertificates()
}
const onTaskPage = () => void loadTasks()
const onTaskPageSize = () => {
  taskQuery.page = 1
  void loadTasks()
}

onMounted(async () => {
  if (!canRead.value) return
  await Promise.allSettled([loadMetadata(), loadCertificates(), loadTasks(), loadDnsAccounts()])
  taskPollTimer = window.setInterval(() => {
    if (hasActiveTasks.value) void loadTasks(true)
  }, 3500)
})

onBeforeUnmount(() => {
  if (taskPollTimer) window.clearInterval(taskPollTimer)
})
</script>

<template>
  <div class="certificate-page">
    <section class="page-toolbar">
      <div>
        <h2>{{ $t('certificate.title') }}</h2>
        <p>{{ $t('certificate.pageDescription') }}</p>
      </div>
      <div class="toolbar-actions">
        <el-button :icon="Refresh" @click="refreshCurrent">{{ $t('common.refresh') }}</el-button>
        <el-button v-if="canWrite" :icon="Upload" @click="openCreate('upload')">
          {{ $t('certificate.actions.upload') }}
        </el-button>
        <el-button v-if="canWrite" type="primary" :icon="Plus" @click="openCreate('self-signed')">
          {{ $t('certificate.actions.selfSigned') }}
        </el-button>
      </div>
    </section>

    <el-alert
      v-if="!canRead"
      :title="$t('certificate.permissions.read')"
      type="warning"
      show-icon
      :closable="false"
    />

    <section v-else class="certificate-panel">
      <el-tabs v-model="activeTab" class="certificate-tabs">
        <el-tab-pane :label="$t('certificate.tabs.certificates')" name="certificates">
          <custom-table
            v-model:page="certificateQuery.page"
            v-model:page-size="certificateQuery.pageSize"
            :loading="certificateLoading"
            :data="certificates"
            :columns="certificateColumns"
            :auto-pagination="false"
            :total="certificateTotal"
            :empty-text="$t('certificate.empty.certificates')"
            row-key="id"
            @update:page="onCertificatePage"
            @update:page-size="onCertificatePageSize"
          >
            <template #domains="{ row }">
              <div class="primary-cell">
                <strong>{{ firstDomain(row.domains) }}</strong>
                <span>{{ row.domains }}</span>
              </div>
            </template>
            <template #provider="{ row }"><el-tag effect="plain">{{ providerLabel(row.provider) }}</el-tag></template>
            <template #status="{ row }"><el-tag :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag></template>
            <template #notAfter="{ row }">{{ formatTime(row.notAfter) }}</template>
            <template #actionColumn="{ row }">
              <div class="table-row-actions">
                <el-button link type="primary" :icon="View" @click="openDetail(row)">{{ $t('common.detail') }}</el-button>
                <el-button v-if="canWrite" link type="primary" :icon="Link" @click="openBind(row)">{{ $t('certificate.actions.bind') }}</el-button>
                <el-button link type="primary" :icon="Download" @click="Api.downloadCertificate(row.id)">{{ $t('common.download') }}</el-button>
                <el-button v-if="canWrite" link type="danger" :icon="Delete" @click="deleteCertificate(row)">{{ $t('common.delete') }}</el-button>
              </div>
            </template>
          </custom-table>
        </el-tab-pane>

        <el-tab-pane :label="$t('certificate.tabs.tasks')" name="tasks">
          <div class="tab-tools">
            <el-select v-model="taskQuery.status" clearable style="width: 180px" :placeholder="$t('certificate.status.all')" @change="taskQuery.page = 1; loadTasks()">
              <el-option v-for="status in ['queued', 'running', 'canceling', 'succeeded', 'failed', 'canceled', 'interrupted']" :key="status" :label="statusLabel(status)" :value="status" />
            </el-select>
          </div>
          <custom-table
            v-model:page="taskQuery.page"
            v-model:page-size="taskQuery.pageSize"
            :loading="taskLoading"
            :data="tasks"
            :columns="taskColumns"
            :auto-pagination="false"
            :total="taskTotal"
            :empty-text="$t('certificate.empty.tasks')"
            row-key="id"
            @update:page="onTaskPage"
            @update:page-size="onTaskPageSize"
          >
            <template #operation="{ row }">{{ operationLabel(row.operation) }}</template>
            <template #taskTarget="{ row }">
              <div class="primary-cell"><strong>{{ row.domains || row.websiteName || '—' }}</strong><span>{{ row.managedId || row.certificateId || row.id }}</span></div>
            </template>
            <template #status="{ row }"><el-tag :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag></template>
            <template #progress="{ row }"><el-progress :percentage="row.progress || 0" :stroke-width="7" /></template>
            <template #message="{ row }"><span class="message-cell">{{ row.errorMessage || row.message || '—' }}</span></template>
            <template #createdAt="{ row }">{{ formatTime(row.createdAt) }}</template>
            <template #actionColumn="{ row }">
              <div class="table-row-actions">
                <el-button link type="primary" :icon="Document" @click="openTask(row)">{{ $t('common.detail') }}</el-button>
                <el-button v-if="canWrite && activeStatuses.has(row.status)" link type="danger" :icon="CircleClose" @click="cancelTask(row)">
                  {{ $t('certificate.actions.cancelTask') }}
                </el-button>
              </div>
            </template>
          </custom-table>
        </el-tab-pane>

        <el-tab-pane :label="$t('certificate.tabs.dnsAccounts')" name="dnsAccounts">
          <div class="tab-tools tab-tools--right">
            <el-button v-if="canWrite" type="primary" :icon="Plus" @click="editDnsAccount()">
              {{ $t('certificate.actions.addDnsAccount') }}
            </el-button>
          </div>
          <el-alert class="dns-note" :title="$t('certificate.form.dnsHint')" type="info" show-icon :closable="false" />
          <custom-table
            :loading="dnsLoading"
            :data="dnsAccounts"
            :columns="dnsColumns"
            :pagination="false"
            :empty-text="$t('certificate.empty.dnsAccounts')"
            row-key="id"
          >
            <template #provider="{ row }">{{ dnsProviders.find((item) => item.value === row.provider)?.label || row.provider }}</template>
            <template #credentials="{ row }"><el-tag :type="row.credentialConfigured ? 'success' : 'info'">{{ row.credentialConfigured ? $t('certificate.dns.configured') : $t('certificate.dns.notConfigured') }}</el-tag></template>
            <template #enabled="{ row }"><el-tag :type="row.enabled ? 'success' : 'info'">{{ row.enabled ? $t('certificate.dns.enabled') : $t('certificate.dns.disabled') }}</el-tag></template>
            <template #updatedAt="{ row }">{{ formatTime(row.updatedAt) }}</template>
            <template #actionColumn="{ row }">
              <div class="table-row-actions">
                <el-button v-if="canWrite" link type="primary" :icon="EditPen" @click="editDnsAccount(row)">{{ $t('common.edit') }}</el-button>
                <el-button v-if="canWrite" link type="danger" :icon="Delete" @click="deleteDnsAccount(row)">{{ $t('common.delete') }}</el-button>
              </div>
            </template>
          </custom-table>
        </el-tab-pane>
      </el-tabs>
    </section>

    <certificate-form-drawer
      v-model:visible="formDrawer.visible"
      :mode="formDrawer.mode"
      :algorithms="algorithms"
      @created="handleTaskCreated"
    />
    <certificate-detail-drawer
      v-model:visible="detailDrawer.visible"
      :certificate-id="detailDrawer.certificateId"
      :can-write="canWrite"
      @changed="loadCertificates"
      @task-created="handleTaskCreated"
    />
    <certificate-bind-drawer
      v-model:visible="bindDrawer.visible"
      :certificate-id="bindDrawer.certificateId"
      @created="handleTaskCreated"
    />
    <certificate-task-drawer
      v-model:visible="taskDrawer.visible"
      :task-id="taskDrawer.taskId"
      :can-write="canWrite"
      @finished="() => { loadTasks(true); loadCertificates(true) }"
    />
    <dns-account-drawer
      v-model:visible="dnsDrawer.visible"
      :account="dnsDrawer.account"
      :providers="dnsProviders"
      @saved="loadDnsAccounts"
    />
  </div>
</template>

<style scoped lang="less">
.certificate-page {
  min-height: 100%;
}

.page-toolbar,
.toolbar-actions,
.tab-tools {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-toolbar {
  justify-content: space-between;
  margin-bottom: 18px;

  h2 {
    color: var(--text-primary);
    font-size: 22px;
    font-weight: 720;
  }

  p {
    margin-top: 6px;
    color: var(--text-tertiary);
    font-size: 13px;
  }
}

.certificate-panel {
  padding: 0 18px 18px;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  background: var(--surface-card);
  box-shadow: var(--shadow-xs);
}

.certificate-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 18px;
  }

  :deep(.el-tabs__item) {
    height: 54px;
    padding: 0 24px;
    font-weight: 650;
  }
}

.tab-tools {
  margin-bottom: 14px;
}

.tab-tools--right {
  justify-content: flex-end;
}

.dns-note {
  margin-bottom: 14px;
}

.primary-cell {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;

  strong,
  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    color: var(--text-primary);
    font-weight: 650;
  }

  span {
    color: var(--text-tertiary);
    font-size: 12px;
  }
}

.message-cell {
  display: block;
  overflow: hidden;
  color: var(--text-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 900px) {
  .page-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .toolbar-actions {
    width: 100%;
    flex-wrap: wrap;
  }
}
</style>
