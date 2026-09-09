<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
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
import CertificateDetailDrawer from './components/CertificateDetailDrawer.vue'
import CertificateFormDrawer from './components/CertificateFormDrawer.vue'
import CertificateBindDrawer from './components/CertificateBindDrawer.vue'
import CertificateTaskDrawer from './components/CertificateTaskDrawer.vue'
import DnsAccountDrawer from './components/DnsAccountDrawer.vue'
import CertificateIssueDrawer from './components/CertificateIssueDrawer.vue'
import SystemManagementTabs from '@/views/pages/system-management/components/system-management-tabs.vue'
import {
  certificateDnsProviderLabel,
  certificateOperationLabel,
  certificateProviderLabel,
  certificateStatusLabel,
  certificateTaskTarget,
  certificateTime
} from './utils'
import { getCertificateCapabilities } from './access'
import i18n from '@/lang'

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
const issueDrawer = reactive({ visible: false })
const detailDrawer = reactive({ visible: false, certificateId: '' })
const bindDrawer = reactive({ visible: false, certificateId: '' })
const taskDrawer = reactive({ visible: false, taskId: '' })
const dnsDrawer = reactive({ visible: false, account: null as DnsAccount | null })
const certificateQuery = reactive({ page: 1, pageSize: 20 })
const taskQuery = reactive({ page: 1, pageSize: 20, status: '' })
let taskPollTimer: number | undefined
let approvalPollTimer: number | undefined
const pendingApprovalIds = ref<string[]>([])

const t = (key: string, fallback?: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params)
  return value && value !== key ? value : fallback || key
}

const certificateCapabilities = computed(() => getCertificateCapabilities())
const canReadCertificate = computed(() => certificateCapabilities.value.canReadCertificate)
const canViewCertificateDetail = computed(() => certificateCapabilities.value.canViewCertificateDetail)
const canApplyCertificate = computed(() => certificateCapabilities.value.canApplyCertificate)
const canUploadCertificate = computed(() => certificateCapabilities.value.canUploadCertificate)
const canCreateSelfSigned = computed(() => certificateCapabilities.value.canCreateSelfSigned)
const canBindWebsite = computed(() => certificateCapabilities.value.canBindWebsite)
const canDownloadCertificate = computed(() => certificateCapabilities.value.canDownloadCertificate)
const canDeleteCertificate = computed(() => certificateCapabilities.value.canDeleteCertificate)
const canReadTask = computed(() => certificateCapabilities.value.canReadTask)
const canManageTask = computed(() => certificateCapabilities.value.canManageTask)
const canReadDnsAccount = computed(() => certificateCapabilities.value.canReadDnsAccount)
const canManageDnsAccount = computed(() => certificateCapabilities.value.canManageDnsAccount)

const certificateTabItems = computed(() => [
  { key: 'certificates', label: t('certificate.tabs.certificates', 'Certificates'), labelKey: 'certificate.tabs.certificates', visible: canReadCertificate.value },
  { key: 'tasks', label: t('certificate.tabs.tasks', 'Tasks'), labelKey: 'certificate.tabs.tasks', visible: canReadTask.value },
  { key: 'dnsAccounts', label: t('certificate.tabs.dnsAccounts', 'DNS accounts'), labelKey: 'certificate.tabs.dnsAccounts', visible: canReadDnsAccount.value }
].filter((item) => item.visible))
const canReadAnyTab = computed(() => certificateTabItems.value.length > 0)
const canReadActiveTab = computed(() => {
  if (activeTab.value === 'tasks') return canReadTask.value
  if (activeTab.value === 'dnsAccounts') return canReadDnsAccount.value
  return canReadCertificate.value
})
const activeStatuses = new Set(['queued', 'running', 'canceling'])
const hasActiveTasks = computed(() => tasks.value.some((item) => activeStatuses.has(item.status)))

const statusType = (status?: string) => {
  if (status === 'active' || status === 'succeeded') return 'success'
  if (status === 'expiring' || status === 'queued' || status === 'running' || status === 'canceling') return 'warning'
  if (status === 'disabled' || status === 'canceled' || status === 'interrupted') return 'info'
  return 'danger'
}
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
  if (!canReadCertificate.value) return
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
  if (!canReadTask.value) return
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
  if (!canReadDnsAccount.value) return
  dnsLoading.value = true
  try {
    const response = await Api.getCertificateDnsAccounts()
    dnsAccounts.value = Array.isArray(response.data) ? response.data : []
  } finally {
    dnsLoading.value = false
  }
}

const refreshCurrent = () => {
  if (activeTab.value === 'tasks') return canReadTask.value ? loadTasks() : undefined
  if (activeTab.value === 'dnsAccounts') return canReadDnsAccount.value ? loadDnsAccounts() : undefined
  if (!canReadCertificate.value) return undefined
  return loadCertificates()
}

const ensureActiveTab = () => {
  if (certificateTabItems.value.some((item) => item.key === activeTab.value)) return
  activeTab.value = certificateTabItems.value[0]?.key || ''
}

const handleTabChange = (value: string) => {
  if (!certificateTabItems.value.some((item) => item.key === value)) return
  activeTab.value = value
  void refreshCurrent()
}

watch(certificateTabItems, ensureActiveTab)

const openCreate = (mode: 'upload' | 'self-signed') => {
  if (mode === 'upload' && !canUploadCertificate.value) return
  if (mode === 'self-signed' && !canCreateSelfSigned.value) return
  formDrawer.mode = mode
  formDrawer.visible = true
}
const openIssue = () => {
  if (!canApplyCertificate.value) return
  issueDrawer.visible = true
}
const openDetail = (certificate: ManagedCertificate) => {
  if (!canViewCertificateDetail.value) return
  detailDrawer.certificateId = certificate.id
  detailDrawer.visible = true
}
const openBind = (certificate: ManagedCertificate) => {
  if (!canBindWebsite.value) return
  bindDrawer.certificateId = certificate.id
  bindDrawer.visible = true
}
const openTask = (task: CertificateTask) => {
  if (!canReadTask.value) return
  taskDrawer.taskId = task.id
  taskDrawer.visible = true
}
const downloadCertificate = (certificate: ManagedCertificate) => {
  if (!canDownloadCertificate.value) return
  void Api.downloadCertificate(certificate.id)
}
const handleTaskCreated = (task: CertificateTask) => {
  bindDrawer.visible = false
  if (canReadTask.value) {
    taskDrawer.taskId = task.id
    taskDrawer.visible = true
  }
  void loadTasks(true)
  void loadCertificates(true)
}

const extractApprovalBoundTaskId = (payload: any) => {
  const envelope = payload?.data ?? payload ?? {}
  const root = envelope?.data ?? envelope ?? {}
  const result = root?.result || envelope?.result || root?.data?.result || {}
  const meta = root?.meta || envelope?.meta || root?.data?.meta || {}
  const candidates = [
    root?.boundTaskId,
    root?.bound_task_id,
    root?.taskId,
    root?.task_id,
    root?.task?.id,
    result?.boundTaskId,
    result?.bound_task_id,
    result?.taskId,
    result?.task_id,
    result?.task?.id,
    meta?.boundTaskId,
    meta?.bound_task_id,
    meta?.taskId,
    meta?.task_id
  ]
  const taskId = candidates.find((item) => typeof item === 'string' || typeof item === 'number')
  return taskId ? String(taskId) : ''
}

const extractApprovalStatus = (payload: any) => {
  const envelope = payload?.data ?? payload ?? {}
  const root = envelope?.data ?? envelope ?? {}
  const result = root?.result || envelope?.result || root?.data?.result || {}
  const meta = root?.meta || envelope?.meta || root?.data?.meta || {}
  const candidates = [
    root?.status,
    root?.state,
    root?.phase,
    result?.status,
    result?.state,
    result?.phase,
    meta?.status,
    meta?.state,
    meta?.phase
  ]
  const status = candidates.find((item) => typeof item === 'string')
  return typeof status === 'string' ? status.toLowerCase() : ''
}

const ensureApprovalPolling = () => {
  if (approvalPollTimer || !pendingApprovalIds.value.length) return
  approvalPollTimer = window.setInterval(async () => {
    const currentIds = [...pendingApprovalIds.value]
    for (const approvalId of currentIds) {
      try {
        const response = await Api.getApprovalDetail(approvalId)
        const taskId = extractApprovalBoundTaskId(response)
        const status = extractApprovalStatus(response)
        if (taskId) {
          pendingApprovalIds.value = pendingApprovalIds.value.filter((item) => item !== approvalId)
          if (canReadTask.value) {
            taskDrawer.taskId = taskId
            taskDrawer.visible = true
          }
          void loadTasks(true)
          void loadCertificates(true)
          continue
        }
        if (['rejected', 'expired', 'canceled', 'failed'].includes(status)) {
          pendingApprovalIds.value = pendingApprovalIds.value.filter((item) => item !== approvalId)
        }
      } catch {
        // 审批轮询失败时保留当前条目，下一轮继续尝试。
      }
    }
    if (!pendingApprovalIds.value.length && approvalPollTimer) {
      window.clearInterval(approvalPollTimer)
      approvalPollTimer = undefined
    }
  }, 3500)
}

const handleIssueSubmitted = (payload: {
  task?: CertificateTask | null
  taskId?: string
  approvalId?: string
  status?: string
}) => {
  issueDrawer.visible = false
  const taskId = payload.task?.id || payload.taskId || ''
  if (taskId) {
    if (payload.task?.id) {
      handleTaskCreated(payload.task)
    } else if (canReadTask.value) {
      taskDrawer.taskId = taskId
      taskDrawer.visible = true
      void loadTasks(true)
      void loadCertificates(true)
    }
    return
  }
  if (payload.approvalId) {
    if (!pendingApprovalIds.value.includes(payload.approvalId)) {
      pendingApprovalIds.value = [...pendingApprovalIds.value, payload.approvalId]
    }
    ensureApprovalPolling()
  }
}

const deleteCertificate = async (certificate: ManagedCertificate) => {
  if (!canDeleteCertificate.value) return
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
  if (!canManageTask.value) return
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
  if (!canManageDnsAccount.value) return
  dnsDrawer.account = account || null
  dnsDrawer.visible = true
}
const openDnsManagerFromIssue = () => {
  if (!canManageDnsAccount.value) return
  issueDrawer.visible = false
  activeTab.value = 'dnsAccounts'
  editDnsAccount()
}
const deleteDnsAccount = async (account: DnsAccount) => {
  if (!canManageDnsAccount.value) return
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
  ensureActiveTab()
  if (!canReadAnyTab.value && !canApplyCertificate.value && !canUploadCertificate.value && !canCreateSelfSigned.value) return
  await Promise.allSettled([loadMetadata(), loadCertificates(), loadTasks(), loadDnsAccounts()])
  taskPollTimer = window.setInterval(() => {
    if (hasActiveTasks.value) void loadTasks(true)
  }, 3500)
  ensureApprovalPolling()
})

onBeforeUnmount(() => {
  if (taskPollTimer) window.clearInterval(taskPollTimer)
  if (approvalPollTimer) window.clearInterval(approvalPollTimer)
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
        <el-button v-if="canReadActiveTab" :icon="Refresh" @click="refreshCurrent">{{ $t('common.refresh') }}</el-button>
        <el-button v-if="canApplyCertificate" type="primary" :icon="Plus" @click="openIssue">
          {{ $t('certificate.actions.issue') }}
        </el-button>
        <el-button v-if="canUploadCertificate" :icon="Upload" @click="openCreate('upload')">
          {{ $t('certificate.actions.upload') }}
        </el-button>
        <el-button v-if="canCreateSelfSigned" :icon="Plus" @click="openCreate('self-signed')">
          {{ $t('certificate.actions.selfSigned') }}
        </el-button>
      </div>
    </section>

    <el-alert
      v-if="!canReadAnyTab"
      :title="$t('certificate.permissions.read')"
      type="warning"
      show-icon
      :closable="false"
    />

    <section v-else class="certificate-content">
      <SystemManagementTabs
        :items="certificateTabItems"
        :active-key="activeTab"
        @update:active-key="handleTabChange"
      />
      <section class="certificate-panel">
        <div v-if="activeTab === 'certificates'" class="certificate-tab-content">
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
            <template #provider="{ row }"><el-tag effect="plain" class="certificate-source-tag">{{ certificateProviderLabel(row.provider) }}</el-tag></template>
            <template #status="{ row }"><el-tag :type="statusType(row.status)">{{ certificateStatusLabel(row.status) }}</el-tag></template>
            <template #notAfter="{ row }">{{ certificateTime(row.notAfter) }}</template>
            <template #actionColumn="{ row }">
              <div class="table-row-actions">
                <el-button v-if="canViewCertificateDetail" link type="primary" :icon="View" @click="openDetail(row)">{{ $t('common.detail') }}</el-button>
                <el-button v-if="canBindWebsite" link type="primary" :icon="Link" @click="openBind(row)">{{ $t('certificate.actions.bind') }}</el-button>
                <el-button v-if="canDownloadCertificate" link type="primary" :icon="Download" @click="downloadCertificate(row)">{{ $t('common.download') }}</el-button>
                <el-button v-if="canDeleteCertificate" link type="danger" :icon="Delete" @click="deleteCertificate(row)">{{ $t('common.delete') }}</el-button>
              </div>
            </template>
          </custom-table>
        </div>

        <div v-else-if="activeTab === 'tasks'" class="certificate-tab-content">
          <div class="tab-tools">
            <el-select v-model="taskQuery.status" clearable style="width: 180px" :placeholder="$t('certificate.status.all')" @change="taskQuery.page = 1; loadTasks()">
              <el-option v-for="status in ['queued', 'running', 'canceling', 'succeeded', 'failed', 'canceled', 'interrupted']" :key="status" :label="certificateStatusLabel(status)" :value="status" />
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
            <template #operation="{ row }">{{ certificateOperationLabel(row.operation) }}</template>
            <template #taskTarget="{ row }">
              <div class="primary-cell"><strong>{{ certificateTaskTarget(row.domains, row.websiteName, row.id) }}</strong><span>{{ row.managedId || row.certificateId || row.id }}</span></div>
            </template>
            <template #status="{ row }"><el-tag :type="statusType(row.status)">{{ certificateStatusLabel(row.status) }}</el-tag></template>
            <template #progress="{ row }"><el-progress :percentage="row.progress || 0" :stroke-width="7" /></template>
            <template #message="{ row }"><span class="message-cell">{{ row.errorMessage || row.message || '—' }}</span></template>
            <template #createdAt="{ row }">{{ certificateTime(row.createdAt) }}</template>
            <template #actionColumn="{ row }">
              <div class="table-row-actions">
                <el-button v-if="canReadTask" link type="primary" :icon="Document" @click="openTask(row)">{{ $t('common.detail') }}</el-button>
                <el-button v-if="canManageTask && activeStatuses.has(row.status)" link type="danger" :icon="CircleClose" @click="cancelTask(row)">
                  {{ $t('certificate.actions.cancelTask') }}
                </el-button>
              </div>
            </template>
          </custom-table>
        </div>

        <div v-else-if="activeTab === 'dnsAccounts'" class="certificate-tab-content">
          <div class="tab-tools tab-tools--right">
            <el-button v-if="canManageDnsAccount" type="primary" :icon="Plus" @click="editDnsAccount()">
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
            <template #provider="{ row }">{{ certificateDnsProviderLabel(row.provider, dnsProviders.find((item) => item.value === row.provider)?.label) }}</template>
            <template #credentials="{ row }"><el-tag :type="row.credentialConfigured ? 'success' : 'info'">{{ row.credentialConfigured ? $t('certificate.dns.configured') : $t('certificate.dns.notConfigured') }}</el-tag></template>
            <template #enabled="{ row }"><el-tag :type="row.enabled ? 'success' : 'info'">{{ row.enabled ? $t('certificate.dns.enabled') : $t('certificate.dns.disabled') }}</el-tag></template>
            <template #updatedAt="{ row }">{{ certificateTime(row.updatedAt) }}</template>
            <template #actionColumn="{ row }">
              <div class="table-row-actions">
                <el-button v-if="canManageDnsAccount" link type="primary" :icon="EditPen" @click="editDnsAccount(row)">{{ $t('common.edit') }}</el-button>
                <el-button v-if="canManageDnsAccount" link type="danger" :icon="Delete" @click="deleteDnsAccount(row)">{{ $t('common.delete') }}</el-button>
              </div>
            </template>
          </custom-table>
        </div>
      </section>
    </section>

    <certificate-form-drawer
      v-model:visible="formDrawer.visible"
      :mode="formDrawer.mode"
      :algorithms="algorithms"
      :can-submit="formDrawer.mode === 'upload' ? canUploadCertificate : canCreateSelfSigned"
      @created="handleTaskCreated"
    />
    <certificate-issue-drawer
      v-model:visible="issueDrawer.visible"
      :dns-accounts="dnsAccounts"
      :can-submit="canApplyCertificate"
      :can-manage-dns="canManageDnsAccount"
      @manage-dns="openDnsManagerFromIssue"
      @submitted="handleIssueSubmitted"
    />
    <certificate-detail-drawer
      v-model:visible="detailDrawer.visible"
      :certificate-id="detailDrawer.certificateId"
      :can-bind-website="canBindWebsite"
      :can-download="canDownloadCertificate"
      @changed="loadCertificates"
      @task-created="handleTaskCreated"
    />
    <certificate-bind-drawer
      v-model:visible="bindDrawer.visible"
      :certificate-id="bindDrawer.certificateId"
      :can-submit="canBindWebsite"
      @created="handleTaskCreated"
    />
    <certificate-task-drawer
      v-model:visible="taskDrawer.visible"
      :task-id="taskDrawer.taskId"
      :can-manage="canManageTask"
      @finished="() => { loadTasks(true); loadCertificates(true) }"
    />
    <dns-account-drawer
      v-model:visible="dnsDrawer.visible"
      :account="dnsDrawer.account"
      :providers="dnsProviders"
      :can-submit="canManageDnsAccount"
      @saved="loadDnsAccounts"
    />
  </div>
</template>

<style scoped lang="less">
.certificate-page {
  min-height: 100%;
}

.certificate-content {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.certificate-tab-content {
  min-width: 0;
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
  padding: 18px;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  background: var(--surface-card);
  box-shadow: var(--shadow-xs);
}

.tab-tools {
  min-height: 58px;
  margin-bottom: 14px;
  padding: 8px 12px;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  background: var(--surface-subtle);
  box-shadow: var(--shadow-xs);
}

.tab-tools--right {
  justify-content: flex-end;
}

.tab-tools .el-select {
  max-width: 100%;
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

@media (max-width: 560px) {
  .certificate-panel {
    padding: 12px;
  }

  .tab-tools {
    align-items: stretch;
    flex-direction: column;
    padding: 10px;
  }

  .tab-tools .el-select,
  .tab-tools--right .el-button {
    width: 100% !important;
  }
}
</style>
