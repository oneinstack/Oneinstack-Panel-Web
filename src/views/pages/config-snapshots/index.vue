<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Delete, Plus, Refresh, RefreshLeft, View } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Api } from '@/api/modules'
import type {
  ConfigurationSnapshot,
  SnapshotDiff,
  SnapshotResourceType,
  SnapshotStatus
} from '@/api/modules'
import { useConfigStore } from '@/stores/modules/config';
import i18n from '@/lang'
import type { ColumnItem } from '@/components/custom-table.vue'

const sconfig = useConfigStore()

interface SnapshotDetail {
  snapshot?: ConfigurationSnapshot
  before?: unknown
  after?: unknown
  diff?: SnapshotDiff
}

interface RestorePreview {
  snapshot?: ConfigurationSnapshot
  current?: unknown
  target?: unknown
  diff?: SnapshotDiff
  hasDrift?: boolean
  requiresForce?: boolean
}

interface SnapshotResourceOption {
  label: string
  value: string
  description?: string
}

const t = (key: string, fallback?: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params)
  return value && value !== key ? value : fallback || key
}

const loading = ref(false)
const detailLoading = ref(false)
const restoreLoading = ref(false)
const deletingId = ref('')
const snapshots = ref<ConfigurationSnapshot[]>([])
const total = ref(0)
const detailVisible = ref(false)
const detail = ref<SnapshotDetail | null>(null)
const restoreVisible = ref(false)
const restorePreview = ref<RestorePreview | null>(null)
const selectedSnapshot = ref<ConfigurationSnapshot | null>(null)
const createVisible = ref(false)
const createLoading = ref(false)
const createResourceLoading = ref(false)
const forceRestoreConfirmed = ref(false)
const websiteResourceOptions = ref<SnapshotResourceOption[]>([])
const nginxResourceOptions = ref<SnapshotResourceOption[]>([])

const filters = reactive({
  page: 1,
  pageSize: 20,
  resourceType: '' as '' | SnapshotResourceType,
  resourceId: '',
  status: '' as '' | SnapshotStatus
})

const createForm = reactive({
  resourceType: 'website' as SnapshotResourceType,
  resourceId: '',
  name: '',
  version: t('configSnapshots.currentConfig', 'Current configuration'),
  backupAccount: t('configSnapshots.serverDisk', 'Server disk'),
  description: ''
})

const resourceOptions = computed(() => [
  { label: t('configSnapshots.allResources', 'All resources'), value: '' },
  { label: t('configSnapshots.resources.website', 'Website configuration'), value: 'website' },
  { label: t('configSnapshots.resources.nginx', 'Nginx configuration'), value: 'nginx' },
  { label: t('configSnapshots.resources.firewall', 'Firewall rules'), value: 'firewall' },
  { label: t('configSnapshots.resources.panelAccess', 'Panel access'), value: 'panel_access' }
])

const statusOptions = computed(() => [
  { label: t('configSnapshots.allStatus', 'All statuses'), value: '' },
  { label: t('configSnapshots.status.pending', 'Pending'), value: 'pending' },
  { label: t('configSnapshots.status.applying', 'Applying'), value: 'applying' },
  { label: t('common.success', 'Success'), value: 'succeeded' },
  { label: t('common.failed', 'Failed'), value: 'failed' },
  { label: t('configSnapshots.status.rolledBack', 'Rolled back'), value: 'rolled_back' },
  { label: t('configSnapshots.status.rollbackFailed', 'Rollback failed'), value: 'rollback_failed' }
])

const canRead = computed(() =>
  sconfig.hasActionAccess('config.snapshot.read') ||
  Boolean((sconfig.scopeAccess as any)?.config?.snapshot?.read) ||
  Boolean((sconfig.scopeAccess as any)?.['config.snapshot']?.read)
)
const canWrite = computed(() =>
  sconfig.hasActionAccess('config.snapshot.write') ||
  Boolean((sconfig.scopeAccess as any)?.config?.snapshot?.write) ||
  Boolean((sconfig.scopeAccess as any)?.['config.snapshot']?.write)
)

const succeededCount = computed(() => snapshots.value.filter((item) => item.status === 'succeeded').length)
const failedCount = computed(() =>
  snapshots.value.filter((item) => ['failed', 'rollback_failed'].includes(item.status)).length
)
const restoreCount = computed(() => snapshots.value.filter((item) => item.operation === 'restore').length)
const restoreRequiresForce = computed(() => Boolean(restorePreview.value?.hasDrift || restorePreview.value?.requiresForce))
const columns = computed<ColumnItem<ConfigurationSnapshot>[]>(() => [
  { prop: 'name', label: t('configSnapshots.snapshot'), minWidth: 240, slot: 'snapshotName' },
  { prop: 'resourceType', label: t('configSnapshots.resource'), minWidth: 320, slot: 'resource' },
  { prop: 'version', label: t('configSnapshots.versionBackupAccount'), minWidth: 220, slot: 'versionBackupAccount' },
  { prop: 'sizeBytes', label: t('common.size'), width: 110, slot: 'sizeBytes' },
  { prop: 'operation', label: t('configSnapshots.action'), minWidth: 240, slot: 'operation' },
  { prop: 'status', label: t('common.status'), width: 120, slot: 'status' },
  { prop: 'revision', label: t('configSnapshots.revisionChange', 'Before / after revision'), minWidth: 240, slot: 'revision' },
  { prop: 'artifactSha256', label: t('configSnapshots.artifactHash'), width: 150, slot: 'artifactSha256' },
  { prop: 'createdAt', label: t('configSnapshots.createdAt'), minWidth: 170, slot: 'createdAt' },
  { prop: 'actionColumn', label: t('common.action'), width: 270, fixed: 'right', slot: 'actionColumn', className: 'table-action-column' }
])

const resourceLabel = (value?: string) => ({
  website: t('configSnapshots.resources.website', 'Website configuration'),
  nginx: t('configSnapshots.resources.nginx', 'Nginx configuration'),
  firewall: t('configSnapshots.resources.firewall', 'Firewall rules'),
  panel_access: t('configSnapshots.resources.panelAccess', 'Panel access')
}[value || ''] || value || '—')

const operationLabel = (value?: string, localized?: string) => localized || ({
  create: t('common.create', 'Create'),
  'settings.update': t('configSnapshots.operations.settingsUpdate', 'Update website settings'),
  'config.update': t('configSnapshots.operations.configUpdate', 'Update website config'),
  toggle: t('configSnapshots.operations.toggle', 'Toggle website status'),
  update: t('configSnapshots.operations.update', 'Update'),
  delete: t('common.delete', 'Delete'),
  restore: t('configSnapshots.operations.restore', 'Rollback')
}[value || ''] || t('configSnapshots.operations.change', 'Config change'))

const statusLabel = (value?: string, localized?: string) => localized || ({
  pending: t('configSnapshots.status.pending', 'Pending'),
  applying: t('configSnapshots.status.applying', 'Applying'),
  succeeded: t('common.success', 'Success'),
  failed: t('common.failed', 'Failed'),
  rolled_back: t('configSnapshots.status.rolledBack', 'Rolled back'),
  rollback_failed: t('configSnapshots.status.rollbackFailed', 'Rollback failed')
}[value || ''] || value || '—')

const statusType = (value?: string) => {
  if (value === 'succeeded' || value === 'rolled_back') return 'success'
  if (value === 'pending' || value === 'applying') return 'warning'
  if (value === 'failed' || value === 'rollback_failed') return 'danger'
  return 'info'
}

const snapshotTextKeys: Record<string, string> = {
  当前配置: 'configSnapshots.currentConfig',
  服务器磁盘: 'configSnapshots.serverDisk'
}

const localizedSnapshotText = (value?: string | null) => {
  if (!value) return '—'
  const key = snapshotTextKeys[value]
  return key ? t(key, value) : value
}

const resourcePrimaryName = (row: ConfigurationSnapshot) =>
  row.resourceName || row.resourceDisplayName || localizedSnapshotText(row.description) || row.resourceId || resourceLabel(row.resourceType)

const resourceSecondaryText = (row: ConfigurationSnapshot) => {
  const secondary = row.resourceDisplayName && row.resourceDisplayName !== row.resourceName
    ? row.resourceDisplayName
    : row.resourceId
  if (!secondary || secondary === resourcePrimaryName(row)) return ''
  return String(secondary)
}

const resourceTertiaryText = (row: ConfigurationSnapshot) => {
  if (row.configPath) {
    return t('configSnapshots.configPathValue', 'Config path: {path}', {
      path: row.configPath
    })
  }
  if (row.resourceMissing) return t('configSnapshots.resourceMissing', 'Resource no longer exists')
  if (row.resourceId) {
    return t('configSnapshots.resourceIdValue', 'Resource ID: {id}', {
      id: row.resourceId
    })
  }
  return '—'
}

const formatTime = (value?: string | null) => value ? new Date(value).toLocaleString() : '—'
const formatJson = (value: unknown) => JSON.stringify(value ?? {}, null, 2)
const shortHash = (value?: string) => value ? value.replace(/^sha256:?/, '').slice(0, 12) : '—'
const formatBytes = (value?: number) => {
  if (!Number.isFinite(value)) return '—'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = Number(value)
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }
  return `${size >= 10 || unitIndex === 0 ? size.toFixed(0) : size.toFixed(1)} ${units[unitIndex]}`
}

const diffCount = (diff?: SnapshotDiff) =>
  (diff?.added?.length || 0) + (diff?.changed?.length || 0) + (diff?.removed?.length || 0)

const snapshotErrorMessages = computed<Record<string, string>>(() => ({
  BAD_REQUEST: t('configSnapshots.errors.badRequest', 'Invalid request parameters. Check the resource type and identifier.'),
  CONFIG_ERROR: t('configSnapshots.errors.configError', 'Target configuration validation failed. Check whether the current configuration can be read and parsed.'),
  UNAUTHORIZED: t('configSnapshots.errors.unauthorized', 'Login session expired. Sign in again.'),
  FORBIDDEN: t('configSnapshots.errors.forbidden', 'This account does not have configuration snapshot permission.'),
  NOT_FOUND: t('configSnapshots.errors.notFound', 'Snapshot does not exist or this account cannot access it.'),
  CONFLICT: t('configSnapshots.errors.conflict', 'Configuration drift detected. Preview again; forced rollback is required to overwrite.'),
  INTERNAL_ERROR: t('configSnapshots.errors.internalError', 'System apply failed. Try again later or check runtime logs.'),
  400: t('configSnapshots.errors.badRequest', 'Invalid request parameters. Check the resource type and identifier.'),
  401: t('configSnapshots.errors.unauthorized', 'Login session expired. Sign in again.'),
  403: t('configSnapshots.errors.forbidden', 'This account does not have configuration snapshot permission.'),
  404: t('configSnapshots.errors.notFound', 'Snapshot does not exist or this account cannot access it.'),
  409: t('configSnapshots.errors.conflict', 'Configuration drift detected. Preview again; forced rollback is required to overwrite.'),
  500: t('configSnapshots.errors.internalError', 'System apply failed. Try again later or check runtime logs.')
}))

const getSnapshotErrorMessage = (error: any, fallback: string) => {
  const data = error?.response?.data || error?.data || error?.xhr?.data || {}
  const code = data?.error?.code || data?.code || error?.code || error?.message
  const status = error?.response?.status || data?.status || error?.status
  const detail = data?.error?.detail || data?.detail
  const rawMessage = data?.error?.message || data?.message || error?.message
  const mapped = snapshotErrorMessages.value[String(code)] || snapshotErrorMessages.value[String(status)]
  if (mapped && detail) return `${mapped}：${detail}`
  return mapped || rawMessage || fallback
}

const createResourceOptions = computed(() => resourceOptions.value.filter((item) => item.value))
const useResourceSelect = computed(() => createForm.resourceType === 'website' || createForm.resourceType === 'nginx')
const currentCreateResourceOptions = computed(() => {
  if (createForm.resourceType === 'website') return websiteResourceOptions.value
  if (createForm.resourceType === 'nginx') return nginxResourceOptions.value
  return []
})
const resourceIdPlaceholder = computed(() => {
  const placeholders: Record<SnapshotResourceType, string> = {
    website: t('configSnapshots.placeholders.selectWebsite', 'Select a website'),
    nginx: t('configSnapshots.placeholders.selectManagedConfig', 'Select a managed configuration file'),
    firewall: t('configSnapshots.placeholders.inputResourceIdentifier', 'Enter a resource identifier'),
    panel_access: t('configSnapshots.placeholders.inputResourceIdentifier', 'Enter a resource identifier')
  }
  return placeholders[createForm.resourceType] || t('configSnapshots.placeholders.inputResourceIdentifier', 'Enter a resource identifier')
})
const resourceIdHelp = computed(() => {
  const helpText: Record<SnapshotResourceType, string> = {
    website: t('configSnapshots.resourceHelp.website', 'Select a website. The website ID is submitted.'),
    nginx: t('configSnapshots.resourceHelp.nginx', 'Select a managed Nginx configuration file. resourceId is submitted.'),
    firewall: t('configSnapshots.resourceHelp.firewall', 'Firewall rules always use host.'),
    panel_access: t('configSnapshots.resourceHelp.panelAccess', 'Panel access configuration always uses panel.')
  }
  return helpText[createForm.resourceType] || ''
})

const normalizeArray = (value: any): any[] => {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.items)) return value.items
  if (Array.isArray(value?.list)) return value.list
  if (Array.isArray(value?.rows)) return value.rows
  if (Array.isArray(value?.data)) return value.data
  if (Array.isArray(value?.files)) return value.files
  return []
}

const formatWebsiteOption = (item: any): SnapshotResourceOption | null => {
  const id = item?.id ?? item?.ID ?? item?.websiteId ?? item?.siteId
  if (id === undefined || id === null || id === '') return null
  const domain = item?.primaryDomain || item?.domain || item?.mainDomain || item?.siteName || item?.name || t('configSnapshots.websiteFallbackName', 'Website {id}', { id })
  const remark = item?.remark || item?.note || item?.description || ''
  return {
    label: remark ? `${domain} (${remark})` : String(domain),
    value: String(id),
    description: `ID: ${id}`
  }
}

const formatNginxOption = (item: any): SnapshotResourceOption | null => {
  const resourceId = item?.resourceId || item?.path || item?.filePath || item?.name
  if (!resourceId) return null
  const path = item?.path || item?.filePath || item?.name || resourceId
  const name = item?.name || String(path).split('/').pop() || resourceId
  const tags = [item?.main ? t('configSnapshots.mainConfig', 'Main config') : '', item?.site ? t('configSnapshots.siteConfig', 'Site config') : ''].filter(Boolean)
  return {
    label: name,
    value: String(resourceId),
    description: tags.length ? `${path} · ${tags.join(' / ')}` : String(path)
  }
}

const loadCreateResourceOptions = async (type = createForm.resourceType) => {
  if (type !== 'website' && type !== 'nginx') return
  if (type === 'website' && websiteResourceOptions.value.length) return
  if (type === 'nginx' && nginxResourceOptions.value.length) return

  createResourceLoading.value = true
  try {
    if (type === 'website') {
      const { data } = await Api.getWebsiteList({ page: 1, pageSize: 100 })
      websiteResourceOptions.value = normalizeArray(data)
        .map(formatWebsiteOption)
        .filter(Boolean) as SnapshotResourceOption[]
    } else {
      const { data } = await Api.getConfigurationSnapshotResources('nginx')
      nginxResourceOptions.value = normalizeArray(data)
        .map(formatNginxOption)
        .filter(Boolean) as SnapshotResourceOption[]
    }
  } catch (error: any) {
    // ElMessage.error(getSnapshotErrorMessage(error, t('configSnapshots.messages.resourceListReadFailed', 'Failed to read resource list')))
  } finally {
    createResourceLoading.value = false
  }
}

const buildParams = () => ({
  page: filters.page,
  pageSize: filters.pageSize,
  resourceType: filters.resourceType || undefined,
  resourceId: filters.resourceId.trim() || undefined,
  status: filters.status || undefined
})

const loadSnapshots = async () => {
  if (!canRead.value) return
  loading.value = true
  try {
    const { data } = await Api.getConfigurationSnapshots(buildParams())
    snapshots.value = data?.items || []
    total.value = data?.total || 0
    filters.page = data?.page || filters.page
    filters.pageSize = data?.pageSize || filters.pageSize
  } catch (error: any) {
    // ElMessage.error(getSnapshotErrorMessage(error, t('configSnapshots.messages.snapshotListReadFailed', 'Failed to read configuration snapshots')))
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.page = 1
  filters.resourceType = ''
  filters.resourceId = ''
  filters.status = ''
  void loadSnapshots()
}

const resetCreateForm = () => {
  createForm.resourceType = 'website'
  createForm.resourceId = ''
  createForm.name = ''
  createForm.version = t('configSnapshots.currentConfig', 'Current configuration')
  createForm.backupAccount = t('configSnapshots.serverDisk', 'Server disk')
  createForm.description = ''
}

const openCreateSnapshot = () => {
  resetCreateForm()
  createVisible.value = true
  void loadCreateResourceOptions()
}

const syncCreateResourceId = () => {
  if (createForm.resourceType === 'firewall') {
    createForm.resourceId = 'host'
    return
  }
  if (createForm.resourceType === 'panel_access') {
    createForm.resourceId = 'panel'
    return
  }
  createForm.resourceId = ''
  void loadCreateResourceOptions()
}

const submitCreateSnapshot = async () => {
  if (!createForm.resourceType || !createForm.resourceId.trim()) {
    ElMessage.warning(useResourceSelect.value ? t('configSnapshots.messages.selectResourceIdentifier', 'Select a resource identifier') : t('configSnapshots.messages.selectTypeAndIdentifier', 'Select a resource type and enter a resource identifier'))
    return
  }
  createLoading.value = true
  try {
    await Api.createConfigurationSnapshot({
      resourceType: createForm.resourceType,
      resourceId: createForm.resourceId.trim(),
      name: createForm.name.trim() || undefined,
      version: createForm.version.trim() || undefined,
      backupAccount: createForm.backupAccount.trim() || undefined,
      description: createForm.description.trim() || undefined
    })
    ElMessage.success(t('configSnapshots.messages.snapshotCreated', 'Configuration snapshot created'))
    createVisible.value = false
    filters.page = 1
    await loadSnapshots()
  } catch (error: any) {
    // ElMessage.error(getSnapshotErrorMessage(error, t('configSnapshots.messages.createFailed', 'Failed to create configuration snapshot')))
  } finally {
    createLoading.value = false
  }
}

const openDetail = async (row: ConfigurationSnapshot) => {
  detailVisible.value = true
  selectedSnapshot.value = row
  detail.value = null
  detailLoading.value = true
  try {
    const [detailResponse, diffResponse] = await Promise.all([
      Api.getConfigurationSnapshot(row.id),
      Api.getConfigurationSnapshotDiff(row.id).catch(() => ({ data: null }))
    ])
    detail.value = {
      ...detailResponse.data,
      diff: detailResponse.data?.diff || diffResponse.data?.diff || diffResponse.data
    }
  } catch (error: any) {
    // ElMessage.error(getSnapshotErrorMessage(error, t('configSnapshots.messages.detailReadFailed', 'Failed to read snapshot details')))
  } finally {
    detailLoading.value = false
  }
}

const openRestore = async (row: ConfigurationSnapshot) => {
  selectedSnapshot.value = row
  restoreVisible.value = true
  restorePreview.value = null
  forceRestoreConfirmed.value = false
  restoreLoading.value = true
  try {
    const { data } = await Api.previewConfigurationSnapshotRestore(row.id)
    restorePreview.value = data || {}
  } catch (error: any) {
    // ElMessage.error(getSnapshotErrorMessage(error, t('configSnapshots.messages.restorePreviewReadFailed', 'Failed to read rollback preview')))
  } finally {
    restoreLoading.value = false
  }
}

const executeRestore = async () => {
  if (!selectedSnapshot.value || !restorePreview.value) return
  const force = restoreRequiresForce.value && forceRestoreConfirmed.value
  if (restoreRequiresForce.value && !forceRestoreConfirmed.value) {
    ElMessage.warning(t('configSnapshots.messages.confirmOverwriteFirst', 'Confirm overwriting current manual changes first'))
    return
  }
  if (!force) {
    await ElMessageBox.confirm(t('configSnapshots.restoreConfirmMessage', 'Rollback to this configuration snapshot? Rollback creates a new restore snapshot record.'), t('configSnapshots.rollbackConfig', 'Rollback configuration'), {
      type: 'warning',
      confirmButtonText: t('configSnapshots.confirmRollback', 'Confirm rollback'),
      cancelButtonText: t('common.cancel', 'Cancel')
    })
  }
  restoreLoading.value = true
  try {
    await Api.restoreConfigurationSnapshot(selectedSnapshot.value.id, { force })
    ElMessage.success(t('configSnapshots.messages.restoreExecuted', 'Rollback executed'))
    restoreVisible.value = false
    forceRestoreConfirmed.value = false
    await loadSnapshots()
  } catch (error: any) {
    // ElMessage.error(getSnapshotErrorMessage(error, t('configSnapshots.messages.restoreFailed', 'Failed to execute rollback')))
  } finally {
    restoreLoading.value = false
  }
}

const deleteSnapshot = async (row: ConfigurationSnapshot) => {
  await ElMessageBox.confirm(t('configSnapshots.deleteConfirmMessage', 'Delete snapshot {id}? Active snapshots cannot be deleted.', { id: row.id }), t('configSnapshots.deleteSnapshot', 'Delete configuration snapshot'), {
    type: 'warning',
    confirmButtonText: t('common.delete', 'Delete'),
    cancelButtonText: t('common.cancel', 'Cancel')
  })
  deletingId.value = row.id
  try {
    await Api.deleteConfigurationSnapshot(row.id)
    ElMessage.success(t('configSnapshots.messages.snapshotDeleted', 'Snapshot deleted'))
    await loadSnapshots()
  } catch (error: any) {
    // ElMessage.error(getSnapshotErrorMessage(error, t('configSnapshots.messages.deleteFailed', 'Failed to delete configuration snapshot')))
  } finally {
    deletingId.value = ''
  }
}

onMounted(() => {
  void loadSnapshots()
})
</script>

<template>
  <div class="snapshot-page">
    <section class="snapshot-toolbar">
      <div>
        <h2>{{ $t('configSnapshots.title') }}</h2>
        <p>{{ $t('configSnapshots.pageDescription') }}</p>
      </div>
      <div class="toolbar-actions">
        <el-button type="primary" :icon="Plus" :disabled="!canWrite" @click="openCreateSnapshot">{{ $t('configSnapshots.createSnapshot') }}</el-button>
        <el-button :icon="Refresh" :loading="loading" @click="loadSnapshots">{{ $t('common.refresh') }}</el-button>
      </div>
    </section>

    <el-alert
      v-if="!canRead"
      class="snapshot-alert"
      :title="$t('configSnapshots.noReadPermission')"
      type="warning"
      show-icon
      :closable="false"
    />

    <!-- <section class="summary-grid">
      <div class="summary-card">
        <small>{{ $t('configSnapshots.currentPageSnapshots') }}</small>
        <strong>{{ snapshots.length }}</strong>
      </div>
      <div class="summary-card">
        <small>{{ $t('configSnapshots.allRecords') }}</small>
        <strong>{{ total }}</strong>
      </div>
      <div class="summary-card success">
        <small>{{ $t('configSnapshots.succeededSnapshots') }}</small>
        <strong>{{ succeededCount }}</strong>
      </div>
      <div class="summary-card warning">
        <small>{{ $t('configSnapshots.restoreRecords') }}</small>
        <strong>{{ restoreCount }}</strong>
      </div>
      <div class="summary-card danger">
        <small>{{ $t('configSnapshots.failedRecords') }}</small>
        <strong>{{ failedCount }}</strong>
      </div>
    </section> -->

    <section class="snapshot-panel">
      <div class="filter-bar">
        <el-select v-model="filters.resourceType" :placeholder="$t('configSnapshots.resourceType')" clearable style="width: 170px">
          <el-option
            v-for="item in resourceOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-input v-model="filters.resourceId" :placeholder="$t('configSnapshots.resourceId')" clearable style="width: 220px" />
        <el-select v-model="filters.status" :placeholder="$t('common.status')" clearable style="width: 150px">
          <el-option
            v-for="item in statusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-button type="primary" @click="filters.page = 1; loadSnapshots()">{{ $t('common.query') }}</el-button>
        <el-button @click="resetFilters">{{ $t('common.reset') }}</el-button>
      </div>

      <custom-table v-loading="loading" :data="snapshots" :columns="columns" :pagination="false" :auto-pagination="false" row-key="id" :empty-text="$t('configSnapshots.noSnapshots')">
        <template #snapshotName="{ row }">
            <div class="snapshot-name-cell">
              <el-tooltip :content="localizedSnapshotText(row.name) || row.id" placement="top" :show-after="350">
                <strong class="cell-title">{{ localizedSnapshotText(row.name) || row.id }}</strong>
              </el-tooltip>
              <el-tooltip :content="localizedSnapshotText(row.description) || row.id" placement="top" :show-after="350">
                <span class="cell-subtitle">{{ localizedSnapshotText(row.description) || row.id }}</span>
              </el-tooltip>
            </div>
        </template>
        <template #resource="{ row }">
            <div class="resource-cell">
              <el-tooltip :content="resourcePrimaryName(row)" placement="top" :show-after="350">
                <strong class="cell-title">{{ resourcePrimaryName(row) }}</strong>
              </el-tooltip>
              <div class="resource-meta-line">
                <span class="meta-chip">{{ resourceLabel(row.resourceType) }}</span>
                <el-tooltip v-if="resourceSecondaryText(row)" :content="resourceSecondaryText(row)" placement="top" :show-after="350">
                  <span class="meta-text">{{ resourceSecondaryText(row) }}</span>
                </el-tooltip>
              </div>
              <el-tooltip :content="resourceTertiaryText(row)" placement="top" :show-after="350">
                <span class="path-text">{{ resourceTertiaryText(row) }}</span>
              </el-tooltip>
            </div>
        </template>
        <template #versionBackupAccount="{ row }">
            <div class="snapshot-meta-cell">
              <el-tooltip :content="localizedSnapshotText(row.version)" placement="top" :show-after="350">
                <strong class="cell-code">{{ localizedSnapshotText(row.version) }}</strong>
              </el-tooltip>
              <el-tooltip :content="localizedSnapshotText(row.backupAccount)" placement="top" :show-after="350">
                <span class="meta-chip meta-chip--ghost">{{ localizedSnapshotText(row.backupAccount) }}</span>
              </el-tooltip>
            </div>
        </template>
        <template #sizeBytes="{ row }">
          <el-tooltip :content="formatBytes(row.sizeBytes)" placement="top" :show-after="350">
            <span class="mono-text">{{ formatBytes(row.sizeBytes) }}</span>
          </el-tooltip>
        </template>
        <template #operation="{ row }">
          <el-tooltip :content="operationLabel(row.operation, row.operationLabel)" placement="top" :show-after="350">
            <span class="meta-chip meta-chip--action">{{ operationLabel(row.operation, row.operationLabel) }}</span>
          </el-tooltip>
        </template>
        <template #status="{ row }">
            <el-tag :type="statusType(row.status)" effect="light">{{ statusLabel(row.status, row.statusLabel) }}</el-tag>
        </template>
        <template #revision="{ row }">
            <div class="revision-cell">
              <div class="revision-item">
                <label>{{ $t('configSnapshots.beforeRevision', { hash: '' }).replace(/\s+$/, '') }}</label>
                <el-tooltip :content="row.beforeRevision || '—'" placement="top" :show-after="350">
                  <span class="cell-code">{{ shortHash(row.beforeRevision) }}</span>
                </el-tooltip>
              </div>
              <div class="revision-item revision-item--after">
                <label>{{ $t('configSnapshots.afterRevision', { hash: '' }).replace(/\s+$/, '') }}</label>
                <el-tooltip :content="row.afterRevision || '—'" placement="top" :show-after="350">
                  <span class="cell-code">{{ shortHash(row.afterRevision) }}</span>
                </el-tooltip>
              </div>
            </div>
        </template>
        <template #artifactSha256="{ row }">
          <el-tooltip :content="row.artifactSha256 || '—'" placement="top" :show-after="350">
            <span class="mono-text">{{ shortHash(row.artifactSha256) }}</span>
          </el-tooltip>
        </template>
        <template #createdAt="{ row }">
          <el-tooltip :content="formatTime(row.createdAt)" placement="top" :show-after="350">
            <span class="mono-text mono-text--muted">{{ formatTime(row.createdAt) }}</span>
          </el-tooltip>
        </template>
        <template #actionColumn="{ row }">
            <div class="action-group">
              <el-button link type="primary" :icon="View" @click="openDetail(row)">{{ $t('common.detail') }}</el-button>
              <el-button
                link
                type="warning"
                :icon="RefreshLeft"
                :disabled="!canWrite || row.status !== 'succeeded'"
                @click="openRestore(row)"
              >
                {{ $t('configSnapshots.operations.restore') }}
              </el-button>
              <el-button
                link
                type="danger"
                :icon="Delete"
                :loading="deletingId === row.id"
                :disabled="!canWrite || row.status === 'pending' || row.status === 'applying'"
                @click="deleteSnapshot(row)"
              >
                {{ $t('common.delete') }}
              </el-button>
            </div>
        </template>
      </custom-table>

      <div class="pagination-row">
        <el-pagination
          v-model:current-page="filters.page"
          v-model:page-size="filters.pageSize"
          background
          layout="total, sizes, prev, pager, next"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          @size-change="() => { filters.page = 1; loadSnapshots() }"
          @current-change="loadSnapshots"
        />
      </div>
    </section>
    

    <custom-drawer
      :visible="createVisible"
      :title="$t('configSnapshots.createSnapshot')"
      size="760px"
      :confirm-text="$t('common.confirm')"
      :loading="createLoading"
      :on-close="() => { createVisible = false }"
      :on-confirm="submitCreateSnapshot"
    >
      <el-form class="snapshot-create-form" label-width="108px">
        <el-form-item :label="$t('configSnapshots.resourceType')" required>
          <el-select
            v-model="createForm.resourceType"
            :placeholder="$t('configSnapshots.placeholders.selectResourceType')"
            style="width: 100%"
            @change="syncCreateResourceId"
          >
            <el-option
              v-for="item in createResourceOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('configSnapshots.resourceIdentifier')" required>
          <el-select
            v-if="useResourceSelect"
            v-model="createForm.resourceId"
            :placeholder="resourceIdPlaceholder"
            :loading="createResourceLoading"
            popper-class="snapshot-resource-select-dropdown"
            filterable
            clearable
            style="width: 100%"
            @visible-change="(visible: boolean) => visible && loadCreateResourceOptions()"
          >
            <el-option
              v-for="item in currentCreateResourceOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            >
              <div class="resource-option">
                <strong>{{ item.label }}</strong>
                <span>{{ item.description }}</span>
              </div>
            </el-option>
          </el-select>
          <el-input v-else v-model="createForm.resourceId" :placeholder="resourceIdPlaceholder" />
          <p class="form-help">{{ resourceIdHelp }}</p>
        </el-form-item>
        <el-form-item :label="$t('configSnapshots.snapshotName')">
          <el-input v-model="createForm.name" :placeholder="$t('configSnapshots.placeholders.inputSnapshotName')" maxlength="128" />
        </el-form-item>
        <el-form-item :label="$t('configSnapshots.version')">
          <el-input v-model="createForm.version" :placeholder="$t('configSnapshots.placeholders.inputVersion')" maxlength="64" />
        </el-form-item>
        <el-form-item :label="$t('configSnapshots.backupAccount')">
          <el-input v-model="createForm.backupAccount" :placeholder="$t('configSnapshots.placeholders.inputBackupAccount')" maxlength="64" />
        </el-form-item>
        <el-form-item :label="$t('common.description')">
          <el-input
            v-model="createForm.description"
            type="textarea"
            :rows="4"
            maxlength="255"
            show-word-limit
            :placeholder="$t('common.inputPlaceholder')"
          />
        </el-form-item>
      </el-form>
    </custom-drawer>

    <custom-drawer
      :visible="detailVisible"
      :title="$t('configSnapshots.snapshotDetailTitle', { id: selectedSnapshot?.id || '' })"
      size="960px"
      :cancel-text="$t('common.close')"
      :show-confirm="false"
      :on-close="() => { detailVisible = false }"
    >
      <div v-loading="detailLoading" class="snapshot-detail">
        <div class="diff-summary">
          <el-tag type="primary" effect="light">{{ detail?.diff?.summary || $t('configSnapshots.noDiffSummary') }}</el-tag>
          <span>{{ $t('configSnapshots.changedFieldsCount', { count: diffCount(detail?.diff) }) }}</span>
        </div>
        <div class="diff-lists">
          <div><strong>{{ $t('configSnapshots.diffAdded') }}</strong><span>{{ detail?.diff?.added?.join('，') || $t('configSnapshots.none') }}</span></div>
          <div><strong>{{ $t('configSnapshots.diffChanged') }}</strong><span>{{ detail?.diff?.changed?.join('，') || $t('configSnapshots.none') }}</span></div>
          <div><strong>{{ $t('configSnapshots.diffRemoved') }}</strong><span>{{ detail?.diff?.removed?.join('，') || $t('configSnapshots.none') }}</span></div>
        </div>
        <div class="json-grid">
          <section>
            <h4>{{ $t('configSnapshots.beforeChange') }}</h4>
            <pre>{{ formatJson(detail?.before) }}</pre>
          </section>
          <section>
            <h4>{{ $t('configSnapshots.afterChange') }}</h4>
            <pre>{{ formatJson(detail?.after) }}</pre>
          </section>
        </div>
      </div>
    </custom-drawer>

    <custom-drawer
      :visible="restoreVisible"
      :title="$t('configSnapshots.rollbackPreview')"
      size="960px"
      confirm-type="warning"
      :confirm-text="restoreRequiresForce ? $t('configSnapshots.forceOverwriteAndRollback') : $t('configSnapshots.confirmRollback')"
      :loading="restoreLoading"
      :confirm-disabled="!restorePreview || (restoreRequiresForce && !forceRestoreConfirmed)"
      :on-close="() => { restoreVisible = false }"
      :on-confirm="executeRestore"
    >
      <div v-loading="restoreLoading" class="snapshot-detail">
        <el-alert
          v-if="restoreRequiresForce"
          :title="$t('configSnapshots.driftWarningTitle')"
          :description="$t('configSnapshots.driftWarningDescription')"
          type="warning"
          show-icon
          :closable="false"
        />
        <div v-if="restoreRequiresForce" class="force-restore-box">
          <el-checkbox v-model="forceRestoreConfirmed">
            {{ $t('configSnapshots.confirmOverwriteManualChanges') }}
          </el-checkbox>
          <span>{{ $t('configSnapshots.forceSubmitTip') }} <code>{"force":true}</code></span>
        </div>
        <div class="diff-summary">
          <el-tag :type="restoreRequiresForce ? 'warning' : 'success'" effect="light">
            {{ restorePreview?.diff?.summary || $t('configSnapshots.noRestoreDiffSummary') }}
          </el-tag>
          <span>{{ $t('configSnapshots.changedFieldsCount', { count: diffCount(restorePreview?.diff) }) }}</span>
        </div>
        <div class="json-grid">
          <section>
            <h4>{{ $t('configSnapshots.currentConfig') }}</h4>
            <pre>{{ formatJson(restorePreview?.current) }}</pre>
          </section>
          <section>
            <h4>{{ $t('configSnapshots.targetConfig') }}</h4>
            <pre>{{ formatJson(restorePreview?.target) }}</pre>
          </section>
        </div>
      </div>
    </custom-drawer>
  </div>
</template>

<style scoped lang="less">
.snapshot-page {
  min-height: 100%;
}

.snapshot-toolbar,
.toolbar-actions,
.filter-bar,
.pagination-row,
.diff-summary {
  display: flex;
  align-items: center;
  gap: 12px;
}

.snapshot-toolbar {
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

.snapshot-alert {
  margin-bottom: 18px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.summary-card {
  min-height: 92px;
  padding: 16px;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  background: var(--surface-card);
  box-shadow: var(--shadow-xs);
  transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;

  small {
    color: var(--text-tertiary);
    font-size: 12px;
  }

  strong {
    display: block;
    margin-top: 10px;
    color: var(--text-primary);
    font-size: 26px;
    font-weight: 760;
  }

  &.success strong {
    color: rgb(var(--success-color));
  }

  &.warning strong {
    color: var(--el-color-warning);
  }

  &.danger strong {
    color: var(--el-color-danger);
  }

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(var(--primary-color), 0.42);
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
  }
}

.snapshot-panel {
  padding: 18px;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  background: var(--surface-card);
  box-shadow: var(--shadow-xs);
}

.filter-bar {
  flex-wrap: wrap;
  margin-bottom: 16px;
}

:deep(.snapshot-panel .smart-table td.el-table__cell) {
  height: auto;
  padding: 16px 0;
  vertical-align: top;
}

:deep(.snapshot-panel .smart-table th.el-table__cell) {
  height: 54px;
}

.resource-cell,
.revision-cell,
.snapshot-name-cell,
.snapshot-meta-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;

  strong,
  label,
  span {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  span {
    color: var(--text-tertiary);
    font-size: 12px;
  }
}

.cell-title {
  color: var(--text-primary);
  font-size: 17px;
  font-weight: 750;
  line-height: 1.3;
  white-space: nowrap;
}

.cell-subtitle {
  white-space: nowrap;
}

.cell-code,
.mono-text {
  font-family: ui-monospace, SFMono-Regular, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  letter-spacing: 0.01em;
}

.cell-code {
  color: #334155;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
}

.mono-text {
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 600;
}

.mono-text--muted {
  color: var(--text-secondary);
  font-weight: 500;
}

.resource-meta-line {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.meta-text {
  min-width: 0;
  white-space: nowrap;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  max-width: 100%;
  min-height: 24px;
  padding: 0 10px;
  border-radius: 9px;
  border: 1px solid var(--border-subtle);
  // background: rgba(248, 250, 252, 0.96);
  color: #6b7280;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}

.meta-chip--ghost {
  border-style: dashed;
  background: transparent;
}

.meta-chip--action {
  color: rgb(var(--primary-color));
  border-color: rgba(var(--primary-color), 0.18);
  background: rgba(var(--primary-color), 0.08);
}

.path-text {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  line-height: 1.45;
  white-space: normal;
  word-break: break-all;
}

.revision-cell {
  gap: 8px;
}

.revision-item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 7px 10px;
  border-radius: 12px;
  background: var(--surface-page);
  border: 1px solid var(--border-subtle);

  label {
    flex: 0 0 auto;
    color: var(--text-primary) !important;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  span {
    min-width: 0;
  }
}

.revision-item--after {
  background: rgba(var(--primary-color), 0.05);
  border-color: rgba(var(--primary-color), 0.12);
}

.action-group {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 2px 10px;
}

.snapshot-create-form {
  max-width: 640px;
  margin: 0 auto;
  padding: 18px 6px 80px;

  :deep(.el-form-item) {
    margin-bottom: 24px;
    align-items: flex-start;
  }

  :deep(.el-form-item__label) {
    padding-right: 18px;
    color: var(--text-secondary);
    font-size: 15px;
    font-weight: 680;
    line-height: 44px;
  }

  :deep(.el-input__wrapper),
  :deep(.el-select .el-input__wrapper) {
    min-height: 44px;
    border-radius: 12px;
  }

  :deep(.el-textarea__inner) {
    min-height: 128px;
    border-radius: 12px;
  }

  .form-help {
    width: 100%;
    margin: 6px 0 0;
    color: var(--text-tertiary);
    font-size: 12px;
    line-height: 1.5;
  }
}

:global(html.dark) {
  .snapshot-page {
    .snapshot-panel {
      background: linear-gradient(180deg, rgba(17, 24, 39, 0.98), rgba(11, 17, 32, 0.98));
      border-color: rgba(52, 64, 84, 0.9);
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.03),
        0 14px 30px rgba(0, 0, 0, 0.22);
    }

    .snapshot-toolbar h2,
    .guide-title strong,
    .guide-card h3,
    .resource-cell .cell-title,
    .snapshot-name-cell .cell-title,
    .snapshot-meta-cell .cell-code,
    .snapshot-meta-cell .mono-text,
    .resource-option strong,
    .resource-option span,
    .diff-summary span,
    .force-restore-box span,
    .check-text,
    .snapshot-create-form :deep(.el-form-item__label),
    .snapshot-create-form .form-help,
    .resource-guide-panel :deep(.el-collapse-item__header),
    .integration-checklist-panel :deep(.el-collapse-item__header) {
      color: var(--text-primary);
    }

    .snapshot-toolbar p,
    .resource-cell span,
    .snapshot-name-cell span,
    .snapshot-meta-cell span,
    .guide-title span,
    .guide-card p,
    .guide-card code,
    .integration-checklist,
    .integration-checklist code,
    .diff-lists span,
    .mono-text--muted,
    .path-text,
    .resource-option span,
    .form-help {
      color: var(--text-tertiary);
    }

    .resource-cell .cell-title,
    .snapshot-name-cell .cell-title {
      color: #f8fafc;
    }

    .resource-cell .meta-text,
    .resource-cell .path-text,
    .snapshot-name-cell .cell-subtitle,
    .snapshot-meta-cell .meta-chip--ghost,
    .snapshot-meta-cell .mono-text--muted {
      color: #cbd5e1;
    }

    .resource-cell .meta-text {
      color: #f8fafc;
      font-weight: 600;
    }

    .resource-cell .path-text {
      color: #cbd5e1;
    }

    .resource-cell .meta-chip,
    .snapshot-meta-cell .meta-chip {
      border-color: rgba(148, 163, 184, 0.28);
      background: rgba(255, 255, 255, 0.05);
      color: #f8fafc;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
    }

    .resource-cell .meta-chip--ghost {
      border-color: rgba(148, 163, 184, 0.22);
      background: rgba(255, 255, 255, 0.03);
    }

    .resource-cell .meta-chip--action {
      color: #fdba74;
      border-color: rgba(var(--primary-color), 0.34);
      background: rgba(var(--primary-color), 0.16);
    }

    .cell-code,
    .mono-text {
      color: #f8fafc;
    }

    .cell-code {
      font-weight: 700;
    }

    .mono-text {
      font-weight: 600;
    }

    .meta-chip {
      border-color: rgba(71, 84, 103, 0.92);
      background: rgba(17, 24, 39, 0.96);
      color: #e2e8f0;
    }

    .meta-chip--ghost {
      background: rgba(15, 23, 42, 0.88);
    }

    .meta-chip--action {
      color: #fdba74;
      border-color: rgba(var(--primary-color), 0.28);
      background: rgba(var(--primary-color), 0.12);
    }

    .revision-item {
      border-color: rgba(71, 84, 103, 0.72);
      background: rgba(15, 23, 42, 0.96);

      label {
        color: #cbd5e1;
      }

      span {
        color: #f8fafc;
      }
    }

    .revision-item--after {
      border-color: rgba(var(--primary-color), 0.26);
      background: rgba(var(--primary-color), 0.14);
    }

    .snapshot-panel :deep(.el-tag--light) {
      border-color: rgba(71, 84, 103, 0.92);
      background: rgba(17, 24, 39, 0.95);
      color: #e2e8f0;
    }

    .snapshot-panel :deep(.el-tag--light.el-tag--success) {
      border-color: rgba(34, 197, 94, 0.28);
      background: rgba(20, 83, 45, 0.35);
      color: #bbf7d0;
    }

    .snapshot-panel :deep(.el-tag--light.el-tag--warning) {
      border-color: rgba(245, 158, 11, 0.28);
      background: rgba(120, 53, 15, 0.35);
      color: #fdba74;
    }

    .snapshot-panel :deep(.el-tag--light.el-tag--danger) {
      border-color: rgba(239, 68, 68, 0.28);
      background: rgba(127, 29, 29, 0.34);
      color: #fca5a5;
    }

    :deep(.snapshot-panel .smart-table .resource-cell .cell-title),
    :deep(.snapshot-panel .smart-table .snapshot-name-cell .cell-title),
    :deep(.snapshot-panel .smart-table .snapshot-meta-cell .cell-code),
    :deep(.snapshot-panel .smart-table .snapshot-meta-cell .mono-text) {
      color: #f8fafc !important;
    }

    :deep(.snapshot-panel .smart-table .resource-cell .meta-text),
    :deep(.snapshot-panel .smart-table .resource-cell .path-text),
    :deep(.snapshot-panel .smart-table .snapshot-name-cell .cell-subtitle),
    :deep(.snapshot-panel .smart-table .snapshot-meta-cell .meta-chip--ghost),
    :deep(.snapshot-panel .smart-table .snapshot-meta-cell .mono-text--muted) {
      color: #cbd5e1 !important;
    }

    :deep(.snapshot-panel .smart-table .resource-cell .meta-chip),
    :deep(.snapshot-panel .smart-table .snapshot-meta-cell .meta-chip) {
      min-height: 34px;
      padding: 0 14px;
      border-color: rgba(75, 85, 99, 0.96);
      background: rgba(17, 24, 39, 0.98);
      color: #cbd5e1;
      font-size: 14px;
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.02);
    }

    :deep(.snapshot-panel .smart-table .resource-cell .meta-chip--action) {
      color: #fdba74;
      border-color: rgba(var(--primary-color), 0.28);
      background: rgba(var(--primary-color), 0.12);
    }

    :deep(.snapshot-panel .smart-table .action-group) {
      gap: 6px 12px;
    }

    :deep(.snapshot-panel .smart-table .action-group .el-button) {
      min-height: 28px;
      padding: 0 2px;
      color: #e2e8f0;
      font-weight: 600;
      letter-spacing: 0.01em;
    }

    :deep(.snapshot-panel .smart-table .action-group .el-button .el-icon) {
      color: inherit;
    }

    :deep(.snapshot-panel .smart-table .action-group .el-button--primary.is-link) {
      color: #f59e0b;
    }

    :deep(.snapshot-panel .smart-table .action-group .el-button--warning.is-link) {
      color: #fbbf24;
    }

    :deep(.snapshot-panel .smart-table .action-group .el-button--danger.is-link) {
      color: #fca5a5;
    }

    :deep(.snapshot-panel .smart-table .action-group .el-button:hover),
    :deep(.snapshot-panel .smart-table .action-group .el-button:focus-visible) {
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.05);
    }

    .diff-summary {
      background: rgba(23, 32, 51, 0.9);
      color: var(--text-secondary);
    }

    .force-restore-box {
      border-color: rgba(251, 191, 36, 0.28);
      background: rgba(120, 82, 12, 0.18);

      span {
        color: #cbd5e1;
      }

      code {
        background: rgba(17, 24, 39, 0.92);
        color: #fbbf24;
      }
    }

    .guide-card {
      border-color: rgba(52, 64, 84, 0.9);
      background: rgba(17, 24, 39, 0.96);

      code {
        border-color: rgba(52, 64, 84, 0.9);
        background: rgba(23, 32, 51, 0.95);
        color: #cbd5e1;
      }
    }

    .resource-guide-panel,
    .integration-checklist-panel {
      border-color: rgba(52, 64, 84, 0.9);
      background: rgba(17, 24, 39, 0.96);

      :deep(.el-collapse-item__header) {
        border-bottom-color: rgba(52, 64, 84, 0.82);
        background: rgba(17, 24, 39, 0.96);
      }

      :deep(.el-collapse-item__content) {
        color: var(--text-secondary);
      }
    }

    .integration-checklist {
      li {
        color: var(--text-secondary);
      }

      code {
        border-color: rgba(52, 64, 84, 0.9);
        background: rgba(23, 32, 51, 0.96);
        color: #cbd5e1;
      }
    }

    .check-dot {
      background: #64748b;
      opacity: 0.8;
    }

    .check-box {
      border-color: rgba(71, 84, 103, 0.9);
      background: rgba(17, 24, 39, 0.96);
      box-shadow: inset 0 0 0 2px rgba(17, 24, 39, 0.96);
    }

    .snapshot-create-form {
      :deep(.el-form-item__label) {
        color: #e5e7eb;
      }

      :deep(.el-input__wrapper),
      :deep(.el-select .el-input__wrapper) {
        border-color: rgba(71, 84, 103, 0.82);
        background: rgba(17, 24, 39, 0.96);
      }

      :deep(.el-textarea__inner) {
        border-color: rgba(71, 84, 103, 0.82);
        background: rgba(17, 24, 39, 0.96);
        color: #e5e7eb;
      }

      :deep(.el-input__inner),
      :deep(.el-select__selected-item) {
        color: #e5e7eb;
      }

      .form-help {
        color: #94a3b8;
      }
    }

    :deep(.snapshot-panel .smart-table td.el-table__cell) {
      color: #e5e7eb;
    }

    :deep(.snapshot-panel .smart-table th.el-table__cell) {
      color: #cbd5e1;
    }
  }
}

.resource-option {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  min-height: 42px;
  line-height: 1.35;

  strong,
  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    color: var(--text-primary);
    font-size: 13px;
    font-weight: 650;
  }

  span {
    color: var(--text-tertiary);
    font-size: 12px;
  }
}

:global(.snapshot-resource-select-dropdown .el-select-dropdown__item) {
  display: flex;
  align-items: center;
  min-height: 56px;
  padding-top: 8px;
  padding-bottom: 8px;
  line-height: normal;
}

:global(.snapshot-resource-select-dropdown .el-select-dropdown__item.hover),
:global(.snapshot-resource-select-dropdown .el-select-dropdown__item.is-hovering) {
  height: auto;
}

:global(.snapshot-resource-select-dropdown .resource-option) {
  width: 100%;
  min-height: 40px;
}

:global(.snapshot-resource-select-dropdown .resource-option strong),
:global(.snapshot-resource-select-dropdown .resource-option span) {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.snapshot-panel .smart-table .resource-cell .cell-title),
:deep(.snapshot-panel .smart-table .snapshot-name-cell .cell-title) {
  line-height: 1.35;
}

.resource-meta-line {
  flex-wrap: wrap;
}

.pagination-row {
  justify-content: flex-end;
  margin-top: 16px;
}

.resource-guide-panel,
.integration-checklist-panel {
  margin-top: 18px;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  background: var(--surface-card);
  box-shadow: var(--shadow-xs);
  overflow: hidden;

  :deep(.el-collapse) {
    border: 0;
  }

  :deep(.el-collapse-item__header) {
    height: auto;
    padding: 16px 18px;
    border-bottom-color: var(--border-subtle);
    background: var(--surface-card);
  }

  :deep(.el-collapse-item__wrap) {
    border-bottom: 0;
  }

  :deep(.el-collapse-item__content) {
    padding: 18px;
  }
}

.guide-title {
  display: flex;
  flex-direction: column;
  gap: 4px;
  line-height: 1.35;

  strong {
    color: var(--text-primary);
    font-size: 16px;
    font-weight: 720;
  }

  span {
    color: var(--text-tertiary);
    font-size: 12px;
  }
}

.guide-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.guide-card {
  min-width: 0;
  padding: 14px;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  background: var(--surface-subtle);

  header {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;

    div {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  h3,
  p {
    margin: 0;
  }

  h3 {
    color: var(--text-primary);
    font-size: 16px;
    font-weight: 720;
  }

  p {
    color: var(--text-tertiary);
    font-size: 13px;
    line-height: 1.55;
  }

  code {
    padding: 2px 6px;
    border: 1px solid var(--border-subtle);
    border-radius: 6px;
    background: var(--surface-card);
    color: var(--text-secondary);
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
    font-size: 12px;
  }
}

.guide-note {
  margin-top: 10px !important;
}

.integration-checklist {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    display: grid;
    grid-template-columns: 10px 18px minmax(0, 1fr);
    align-items: start;
    gap: 12px;
    color: var(--text-secondary);
    font-size: 15px;
    line-height: 1.8;
  }

  code {
    display: inline-flex;
    align-items: center;
    max-width: 100%;
    margin: 0 4px;
    padding: 2px 8px;
    border: 1px solid var(--border-subtle);
    border-radius: 7px;
    background: var(--surface-subtle);
    color: var(--text-secondary);
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
    font-size: 0.92em;
    line-height: 1.45;
    overflow-wrap: anywhere;
    vertical-align: middle;
  }
}

.check-dot {
  width: 6px;
  height: 6px;
  margin-top: 13px;
  border-radius: 999px;
  background: var(--border-strong);
  opacity: 0.55;
}

.check-box {
  width: 18px;
  height: 18px;
  margin-top: 7px;
  border: 1px solid var(--border-strong);
  border-radius: 6px;
  background: var(--surface-card);
  box-shadow: inset 0 0 0 2px var(--surface-card);
}

.check-text {
  min-width: 0;
}

.snapshot-detail {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.diff-summary {
  justify-content: space-between;
  padding: 12px;
  border-radius: 10px;
  background: var(--surface-subtle);
  color: var(--text-tertiary);
}

.force-restore-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  background: var(--surface-card);

  :deep(.el-checkbox__label){
    color: var(--text-tertiary) !important;
  }

  span {
    color: var(--primary-color) !important;
    font-size: 12px;
  }

  code {
    padding: 2px 6px;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.75);
    color: var(--el-color-warning-dark-2);
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
  }
}

.diff-lists {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;

  div {
    min-width: 0;
    padding: 12px;
    border: 1px solid var(--border-subtle);
    border-radius: 10px;
    background: var(--surface-card);
  }

  strong,
  span {
    display: block;
  }

  span {
    margin-top: 8px;
    color: var(--text-tertiary);
    word-break: break-all;
  }
}

.json-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  section {
    min-width: 0;
    border: 1px solid var(--border-subtle);
    border-radius: 10px;
    overflow: hidden;
  }

  h4 {
    margin: 0;
    padding: 10px 12px;
    background: var(--surface-subtle);
    color: var(--text-primary);
  }

  pre {
    min-height: 320px;
    max-height: 520px;
    margin: 0;
    padding: 12px;
    overflow: auto;
    background: #0b1220;
    color: #e5edf6;
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
    font-size: 12px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-word;
  }
}

@media (max-width: 980px) {
  .snapshot-toolbar,
  .diff-summary,
  .force-restore-box {
    align-items: flex-start;
    flex-direction: column;
  }

  .summary-grid,
  .guide-grid,
  .diff-lists,
  .json-grid {
    grid-template-columns: 1fr;
  }
}
</style>
