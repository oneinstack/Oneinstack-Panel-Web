<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Api } from '@/api/modules'
import i18n from '@/lang'
import ClusterPagination from './ClusterPagination.vue'

interface HealthResource {
  id: number
  nodeId: number
  resourceType: string
  resourceId: string
  check: string
  name: string
  present: boolean
  target?: string
  status: string
  localStatus: string
  localReason?: string
  entryStatus?: string
  entryReason?: string
  reason?: string
  observedAt?: string
  entryCheckedAt?: string
  notificationEnabled: boolean
  incidentOpen: boolean
}
interface HealthEvent {
  id: number
  ruleName: string
  resourceId: string
  eventType: string
  occurredAt: string
  message: string
}
interface HealthSummary {
  total: number
  healthy: number
  warning: number
  critical: number
  unknown: number
  unprotected: number
  disabled: number
  unsupportedNodes: number
  awaitingNodes: number
}
interface NodeInfo { id: number | string; name: string; enabled?: boolean; capabilities?: string[] }

const props = defineProps<{ nodes: NodeInfo[]; canManage: boolean; canDiagnose: boolean }>()
const emit = defineEmits<{
  (event: 'open-node', nodeId: number): void
  (event: 'diagnose-node', nodeId: number): void
  (event: 'open-task', nodeId: number, taskId: number): void
}>()
const t = (key: string, params?: Record<string, unknown>) => (i18n.t as any)(`cluster.health.${key}`, params)
const tableScrollHint = () => (i18n.t as any)('cluster.tableScrollHint')
const loading = ref(false)
const error = ref(false)
const summary = ref<HealthSummary>({ total: 0, healthy: 0, warning: 0, critical: 0, unknown: 0, unprotected: 0, disabled: 0, unsupportedNodes: 0, awaitingNodes: 0 })
const resources = ref<HealthResource[]>([])
const events = ref<HealthEvent[]>([])
const total = ref(0)
const eventTotal = ref(0)
const page = ref(1)
const eventPage = ref(1)
const pageSize = ref(10)
const eventPageSize = ref(10)
const filters = reactive({ resourceType: '', status: '' })
const tab = ref('resources')
const selected = ref<HealthResource | null>(null)
const detailVisible = ref(false)
const saving = ref<number | null>(null)
let timer: number | undefined

const unsupportedNodes = computed(() => props.nodes.filter((node) =>
  String(node.id) !== 'local' && node.enabled !== false && !(node.capabilities || []).includes('cluster.health.v1')))
const nodeName = (id: number) => id === 0 ? t('controller') : props.nodes.find((node) => Number(node.id) === id)?.name || `#${id}`
const label = (group: string, key?: string) => key ? t(`${group}.${key}`) : '—'
const reason = (key?: string) => {
  if (!key) return '—'
  const value = t(`reasons.${key}`)
  return value === `cluster.health.reasons.${key}` ? key : value
}
const time = (value?: string) => value ? new Date(value).toLocaleString(i18n.locale) : '—'
const eventResourceName = (event: HealthEvent) => event.ruleName.replace(/^集群：/, '')
const eventReason = (event: HealthEvent) => {
  const code = event.message.match(/：([a-z][a-z0-9_]*)$/)?.[1]
  return code ? reason(code) : event.message || '—'
}

const refresh = async (silent = false) => {
  if (document.hidden && silent) return
  if (!silent) loading.value = true
  try {
    const [summaryResult, resourceResult, eventResult] = await Promise.all([
      Api.getClusterHealthSummary(),
      Api.listClusterHealthResources({ page: page.value, pageSize: pageSize.value, resourceType: filters.resourceType || undefined, status: filters.status || undefined }),
      Api.listClusterHealthEvents({ page: eventPage.value, pageSize: eventPageSize.value })
    ])
    summary.value = summaryResult.data as HealthSummary
    const resourcePage = resourceResult.data as { items?: HealthResource[]; total?: number }
    resources.value = resourcePage.items || []
    total.value = Number(resourcePage.total || 0)
    const eventPageResult = eventResult.data as { items?: HealthEvent[]; total?: number }
    events.value = eventPageResult.items || []
    eventTotal.value = Number(eventPageResult.total || 0)
    if (selected.value) selected.value = resources.value.find((row) => row.id === selected.value?.id) || selected.value
    error.value = false
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

const updateNotification = async (row: HealthResource, enabled: boolean) => {
  saving.value = row.id
  try {
    const { data } = await Api.updateClusterHealthNotification(row.id, enabled)
    row.notificationEnabled = Boolean((data as HealthResource).notificationEnabled)
    ElMessage.success(t('saved'))
  } catch {
    row.notificationEnabled = !enabled
    ElMessage.error(t('saveFailed'))
  } finally {
    saving.value = null
  }
}

const openResource = (row: HealthResource) => { selected.value = row; detailVisible.value = true }
const asResource = (row: unknown) => row as HealthResource
const asEvent = (row: unknown) => row as HealthEvent
const openEventResource = async (event: HealthEvent) => {
  const row = resources.value.find((item) => String(item.id) === event.resourceId)
  if (row) { openResource(row); return }
  try {
    const { data } = await Api.getClusterHealthResource(event.resourceId)
    openResource(data as HealthResource)
  } catch {
    ElMessage.error(t('loadFailed'))
  }
}
watch([() => filters.resourceType, () => filters.status], () => { page.value = 1; void refresh() })
watch([page, pageSize, eventPage, eventPageSize], () => { void refresh() })
onMounted(() => { void refresh(); timer = window.setInterval(() => void refresh(true), 60_000) })
onUnmounted(() => { if (timer) window.clearInterval(timer) })
</script>

<template>
  <section class="panel-card cluster-health" v-loading="loading">
    <div class="health-heading"><div><h2>{{ t('title') }}</h2><p>{{ t('description') }}</p></div><el-button @click="refresh()">{{ t('refresh') }}</el-button></div>
    <el-alert v-if="error" :title="t('loadFailed')" type="error" show-icon :closable="false" />
    <div class="health-summary">
      <div v-for="item in [
        { key: 'critical', value: summary.critical }, { key: 'warning', value: summary.warning },
        { key: 'unknown', value: summary.unknown }, { key: 'unprotected', value: summary.unprotected },
        { key: 'healthy', value: summary.healthy }, { key: 'disabled', value: summary.disabled }
      ]" :key="item.key" class="health-stat" :class="item.key"><strong>{{ item.value }}</strong><span>{{ label('statuses', item.key) }}</span></div>
    </div>
    <div class="health-pending"><span>{{ t('pending', { count: summary.critical + summary.warning }) }}</span><el-button link type="primary" @click="filters.status = filters.status === 'attention' ? '' : 'attention'">{{ filters.status === 'attention' ? t('showAll') : t('showPending') }}</el-button></div>
    <el-alert v-if="unsupportedNodes.length" :title="t('unsupported', { count: unsupportedNodes.length, names: unsupportedNodes.map((item) => item.name).join('、') })" type="info" :closable="false" class="health-unsupported" />
    <el-alert v-if="summary.awaitingNodes" :title="t('awaiting', { count: summary.awaitingNodes })" type="info" :closable="false" class="health-unsupported" />
    <el-tabs v-model="tab">
      <el-tab-pane :label="t('resources')" name="resources">
        <div class="health-filters">
          <el-select v-model="filters.resourceType" :placeholder="t('allTypes')"><el-option :label="t('allTypes')" value="" /><el-option v-for="kind in ['node', 'task', 'website', 'certificate', 'database', 'service', 'backup']" :key="kind" :label="label('types', kind)" :value="kind" /></el-select>
          <el-select v-model="filters.status" :placeholder="t('allStatuses')"><el-option :label="t('allStatuses')" value="" /><el-option :label="t('showPending')" value="attention" /><el-option v-for="state in ['critical', 'warning', 'unknown', 'unprotected', 'healthy', 'disabled']" :key="state" :label="label('statuses', state)" :value="state" /></el-select>
        </div>
        <p class="health-table-scroll-hint">{{ tableScrollHint() }}</p>
        <el-table :data="resources" row-key="id" size="small" class="health-table" :max-height="440">
          <el-table-column :label="t('resource')" min-width="170"><template #default="{ row }"><el-button link type="primary" @click="openResource(asResource(row))">{{ row.name }}</el-button><div class="health-muted">{{ label('types', row.resourceType) }} · {{ nodeName(row.nodeId) }}</div></template></el-table-column>
          <el-table-column :label="t('status')" width="115"><template #default="{ row }"><el-tag :type="row.status === 'critical' ? 'danger' : row.status === 'warning' || row.status === 'unprotected' ? 'warning' : row.status === 'healthy' ? 'success' : 'info'">{{ label('statuses', row.status) }}</el-tag></template></el-table-column>
          <el-table-column :label="t('reason')" min-width="190"><template #default="{ row }">{{ reason(row.reason) }}</template></el-table-column>
          <el-table-column :label="t('checkedAt')" min-width="165"><template #default="{ row }">{{ time(row.observedAt || row.entryCheckedAt) }}</template></el-table-column>
          <el-table-column :label="t('notification')" width="115"><template #default="{ row }"><span v-if="row.resourceType === 'node' || row.resourceType === 'task'">{{ t('defaultOn') }}</span><el-switch v-else v-model="row.notificationEnabled" :disabled="!canManage || saving === row.id" @change="(value: boolean | string | number) => updateNotification(asResource(row), Boolean(value))" /></template></el-table-column>
        </el-table>
        <el-empty v-if="!resources.length && !loading" :description="t('empty')" />
        <ClusterPagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" />
      </el-tab-pane>
      <el-tab-pane :label="t('events')" name="events">
        <p class="health-table-scroll-hint">{{ tableScrollHint() }}</p>
        <el-table :data="events" row-key="id" size="small" class="health-table" :max-height="440"><el-table-column :label="t('resource')" min-width="150"><template #default="{ row }">{{ eventResourceName(asEvent(row)) }}</template></el-table-column><el-table-column :label="t('event')" width="110"><template #default="{ row }">{{ label('eventTypes', row.eventType) }}</template></el-table-column><el-table-column :label="t('reason')" min-width="220"><template #default="{ row }"><span class="health-event-reason">{{ eventReason(asEvent(row)) }}</span></template></el-table-column><el-table-column :label="t('checkedAt')" width="165"><template #default="{ row }">{{ time(row.occurredAt) }}</template></el-table-column><el-table-column :label="t('operation')" width="95"><template #default="{ row }"><el-button link type="primary" @click="openEventResource(asEvent(row))">{{ t('detail') }}</el-button></template></el-table-column></el-table>
        <el-empty v-if="!events.length && !loading" :description="t('noEvents')" />
        <ClusterPagination v-model:current-page="eventPage" v-model:page-size="eventPageSize" :total="eventTotal" />
      </el-tab-pane>
    </el-tabs>
    <el-drawer v-model="detailVisible" :title="selected?.name || t('detail')" size="min(560px, 100vw)" class="cluster-health-drawer">
      <template v-if="selected">
        <el-alert v-if="!selected.present" :title="t('removed')" type="info" :closable="false" class="health-unsupported" />
        <el-descriptions :column="1" border>
          <el-descriptions-item :label="t('node')">{{ nodeName(selected.nodeId) }}</el-descriptions-item>
          <el-descriptions-item :label="t('type')">{{ label('types', selected.resourceType) }}</el-descriptions-item>
          <el-descriptions-item :label="t('status')">{{ label('statuses', selected.status) }}</el-descriptions-item>
          <el-descriptions-item :label="t('reason')">{{ reason(selected.reason) }}</el-descriptions-item>
          <el-descriptions-item :label="t('localResult')">{{ label('statuses', selected.localStatus) }} · {{ reason(selected.localReason) }} · {{ time(selected.observedAt) }}</el-descriptions-item>
          <el-descriptions-item v-if="selected.resourceType === 'website'" :label="t('entryResult')">{{ label('statuses', selected.entryStatus) }} · {{ reason(selected.entryReason) }} · {{ time(selected.entryCheckedAt) }}</el-descriptions-item>
          <el-descriptions-item v-if="selected.target" :label="t('target')">{{ selected.target }}</el-descriptions-item>
        </el-descriptions>
        <div class="health-actions"><el-button v-if="selected.nodeId > 0" @click="emit('open-node', selected.nodeId)">{{ t('nodeDetail') }}</el-button><el-button v-if="selected.nodeId > 0 && canDiagnose" @click="emit('diagnose-node', selected.nodeId)">{{ t('diagnoseNode') }}</el-button><el-button v-if="selected.resourceType === 'task' && selected.nodeId > 0" type="primary" @click="emit('open-task', selected.nodeId, Number(selected.resourceId))">{{ t('taskDetail') }}</el-button></div>
      </template>
    </el-drawer>
  </section>
</template>

<style scoped>
.cluster-health { box-sizing: border-box; min-width: 0; max-width: 100%; padding: 24px; }
:global(.cluster-health-drawer.el-drawer) {
  --el-drawer-bg-color: var(--surface-raised);
  color: var(--text-secondary);
  background: var(--surface-raised) !important;
}
:global(.cluster-health-drawer .el-drawer__header),
:global(.cluster-health-drawer .el-drawer__title),
:global(.cluster-health-drawer .el-drawer__close-btn) {
  color: var(--text-primary);
}
:global(.cluster-health-drawer .el-drawer__body) {
  color: var(--text-secondary);
  background: var(--surface-raised);
}
:global(.cluster-health-drawer .el-descriptions) {
  --el-descriptions-table-border: 1px solid var(--border-subtle);
  --el-descriptions-item-bordered-label-background: var(--surface-subtle);
}
:global(.cluster-health-drawer .el-descriptions__body),
:global(.cluster-health-drawer .el-descriptions__table) {
  background: transparent !important;
}
:global(.cluster-health-drawer .el-descriptions__table) { width: 100%; table-layout: fixed; }
:global(.cluster-health-drawer .el-descriptions__cell) {
  border-color: var(--border-subtle) !important;
  overflow-wrap: anywhere;
}
:global(.cluster-health-drawer .el-descriptions__label.el-descriptions__cell) {
  color: var(--text-tertiary) !important;
  background: var(--surface-subtle) !important;
}
:global(.cluster-health-drawer .el-descriptions__content.el-descriptions__cell) {
  color: var(--text-primary) !important;
  background: var(--surface-card) !important;
}
.health-heading, .health-actions { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; }
.health-heading h2 { margin: 0; }.health-heading p, .health-muted { color: var(--el-text-color-secondary); font-size: 12px; }
.health-summary { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 10px; margin: 16px 0; }
.health-stat { display: flex; flex-direction: column; min-width: 0; gap: 3px; padding: 13px; border: 1px solid var(--el-border-color-light); border-radius: 8px; }
.health-stat strong { font-size: 22px; }.health-stat.critical strong { color: var(--el-color-danger); }.health-stat.warning strong, .health-stat.unprotected strong { color: var(--el-color-warning); }
.health-unsupported { margin-bottom: 12px; }.health-filters { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; }.health-filters :deep(.el-select) { width: 160px; max-width: 100%; }
.health-pending { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-bottom: 12px; font-weight: 600; }
.health-table-scroll-hint { display: none; margin: 8px 0; color: var(--text-tertiary); font-size: 12px; }
.cluster-health :deep(.el-alert__content), .cluster-health :deep(.el-alert__title) { min-width: 0; overflow-wrap: anywhere; }
.health-event-reason { overflow-wrap: anywhere; }
.cluster-health :deep(.health-table) {
  width: 100%;
  max-width: 100%;
  --el-table-bg-color: var(--surface-card);
  --el-table-tr-bg-color: var(--surface-card);
  --el-table-header-bg-color: var(--surface-subtle);
  --el-table-row-hover-bg-color: var(--surface-hover);
  --el-table-text-color: var(--text-secondary);
  --el-table-header-text-color: var(--text-tertiary);
  --el-table-border-color: var(--border-subtle);
}
.cluster-health :deep(.health-table .el-table__inner-wrapper),
.cluster-health :deep(.health-table .el-table__header-wrapper),
.cluster-health :deep(.health-table .el-table__body-wrapper),
.cluster-health :deep(.health-table .el-table__body),
.cluster-health :deep(.health-table .el-table__body tr),
.cluster-health :deep(.health-table .el-table__body td.el-table__cell),
.cluster-health :deep(.health-table .el-table__fixed-right),
.cluster-health :deep(.health-table .el-table__fixed-right-patch) {
  background: var(--surface-card) !important;
}
.cluster-health :deep(.health-table .el-table__header-wrapper tr),
.cluster-health :deep(.health-table .el-table__header-wrapper th.el-table__cell) {
  background: var(--surface-subtle) !important;
}
.cluster-health :deep(.health-table .el-table__body tr:hover > td.el-table__cell) {
  background: var(--surface-hover) !important;
}
.cluster-health :deep(.health-table .el-loading-mask) {
  background: var(--surface-overlay) !important;
}
.health-actions { justify-content: flex-start; margin-top: 18px; }
@media (max-width: 760px) { .cluster-health { padding: 16px; } }
@media (max-width: 700px) { .health-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); }.health-filters { flex-wrap: wrap; } }
@container cluster-content (max-width: 950px) { .health-summary { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@container cluster-content (max-width: 1080px) { .health-table-scroll-hint { display: block; } }
@container cluster-content (max-width: 620px) { .health-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); }.health-filters :deep(.el-select) { width: 100%; } }
</style>
