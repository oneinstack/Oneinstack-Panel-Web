<script setup lang="ts">
import { computed, markRaw, onMounted, reactive, ref } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import CustomDrawer from '@/components/custom-drawer.vue'
import {
  Api,
  type SystemDiskDevice,
  type SystemProcessDetail,
  type SystemProcessItem,
  type SystemSshConfig
} from '@/api/modules'
import { useConfigStore } from '@/stores/modules/config'
import { formatBytes } from '@/utils/fileSize'
import i18n from '@/lang'
import type { ColumnItem } from '@/components/custom-table.vue'
import SystemManagementTabs from './components/system-management-tabs.vue'
import ProcessManagementSection from './components/process-management-section.vue'
import SshConfigSection from './components/ssh-config-section.vue'
import DiskManagementSection from './components/disk-management-section.vue'

const sconfig = useConfigStore()

type ProcessSort = 'pid' | 'cpu' | 'memory' | 'name'
type SortOrder = 'asc' | 'desc'

const t = (key: string, fallback?: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params)
  return value && value !== key ? value : fallback || key
}

const processLoading = ref(false)
const processError = ref('')
const diskLoading = ref(false)
const diskError = ref('')
const sshLoading = ref(false)
const sshError = ref('')

const processes = ref<SystemProcessItem[]>([])
const processTotal = ref(0)
const disks = ref<SystemDiskDevice[]>([])
const fstabLines = ref<string[]>([])
const sshConfig = ref<SystemSshConfig | null>(null)

const processDrawerVisible = ref(false)
const processDetailLoading = ref(false)
const processDetail = ref<SystemProcessDetail | null>(null)

const diskDrawerVisible = ref(false)
const activeDisk = ref<SystemDiskDevice | null>(null)

const sshDrawerVisible = ref(false)
const activeTabKey = ref('processes')

const defaultProcessPageSize = 20

const processFilters = reactive({
  keyword: '',
  sort: 'cpu' as ProcessSort,
  order: 'desc' as SortOrder,
  page: 1,
  pageSize: defaultProcessPageSize
})

const tabItems = markRaw([
  { key: 'processes', label: '进程管理', labelKey: 'systemManagement.tabs.processes' },
  { key: 'ssh', label: 'SSH 配置', labelKey: 'systemManagement.tabs.ssh' },
  { key: 'disks', label: '磁盘管理', labelKey: 'systemManagement.tabs.disks' }
])

const processSortOptions = computed<Array<{ label: string; value: ProcessSort }>>(() => [
  { label: 'PID', value: 'pid' },
  { label: 'CPU', value: 'cpu' },
  { label: t('home.memory', '内存'), value: 'memory' },
  { label: t('common.name', '名称'), value: 'name' }
])

const orderOptions = computed<Array<{ label: string; value: SortOrder }>>(() => [
  { label: t('systemManagement.desc', '降序'), value: 'desc' },
  { label: t('systemManagement.asc', '升序'), value: 'asc' }
])

const canRead = computed(() =>
  sconfig.hasActionAccess('system.settings.read') ||
  Boolean((sconfig.scopeAccess as any)?.system?.settings?.read) ||
  Boolean((sconfig.scopeAccess as any)?.['system.settings']?.read)
)

const processOffset = computed(() => Math.max((processFilters.page - 1) * processFilters.pageSize, 0))
const highCpuCount = computed(() => processes.value.filter((item) => Number(item.cpuPercent) >= 20).length)
const persistentDiskCount = computed(() => disks.value.filter((item) => item.persistent).length)
const sshStatusText = computed(() => {
  if (sshLoading.value) return t('systemManagement.reading', '读取中')
  if (sshConfig.value?.supported === false) return t('systemManagement.unsupported', '当前系统不支持')
  if (sshConfig.value?.error) return t('systemManagement.probeFailed', '探测异常')
  return sshConfig.value?.service ? t('systemManagement.serviceDetected', '已检测服务') : t('systemManagement.notDetected', '未检测到')
})
const isProtectedMount = (mountpoint?: string) => {
  const path = String(mountpoint || '')
  return (
    path === '/' ||
    path.includes('/www') ||
    path.includes('/oneinstack') ||
    path.includes('/panel') ||
    path.includes('/data')
  )
}
const rootMounts = computed(() => disks.value.filter((item) => isProtectedMount(item.mountpoint)))
const processColumns = computed<ColumnItem<SystemProcessItem>[]>(() => [
  { prop: 'pid', label: 'PID', minWidth: 86 },
  { prop: 'name', label: t('common.name'), minWidth: 180 },
  { prop: 'username', label: t('common.user'), minWidth: 120, slot: 'username' },
  { prop: 'status', label: t('common.status'), minWidth: 120, slot: 'status' },
  { prop: 'cpuPercent', label: 'CPU', minWidth: 110, slot: 'cpuPercent' },
  { prop: 'memoryRss', label: t('home.memory'), minWidth: 130, slot: 'memoryRss' },
  { prop: 'createTime', label: t('systemManagement.startTime'), minWidth: 176, slot: 'createTime' },
  { prop: 'actionColumn', label: t('common.action'), width: 120, fixed: 'right', slot: 'actionColumn', className: 'table-action-column' }
])
const diskColumns = computed<ColumnItem<SystemDiskDevice>[]>(() => [
  { prop: 'device', label: t('systemManagement.device'), minWidth: 150 },
  { prop: 'mountpoint', label: t('systemManagement.mountpoint'), minWidth: 140 },
  { prop: 'fsType', label: t('systemManagement.fileSystem'), minWidth: 100 },
  { prop: 'capacityUsage', label: t('systemManagement.capacityUsage'), minWidth: 220, slot: 'capacityUsage' },
  { prop: 'persistent', label: t('systemManagement.persistent'), minWidth: 100, slot: 'persistent' },
  { prop: 'actionColumn', label: t('common.action'), width: 120, fixed: 'right', slot: 'actionColumn', className: 'table-action-column' }
])

const getErrorMessage = (error: any, fallback: string) => {
  const data = error?.response?.data || error?.data || error?.xhr?.data || {}
  return data?.message || data?.error?.message || error?.message || fallback
}

const localizedSshError = (message?: string | null) => {
  const value = String(message || '')
  if (!value) return ''
  if (value.includes('无法读取 sshd 生效配置')) {
    return t('systemManagement.sshReadEffectiveConfigFailed', '无法读取 sshd 生效配置')
  }
  return value
}

const isNotFoundError = (error: any) => {
  const data = error?.response?.data || error?.data || error?.xhr?.data || {}
  const code = String(data?.code || data?.error?.code || error?.code || '')
  const message = String(data?.message || data?.error?.message || error?.message || '')
  return error?.status === 404 || error?.response?.status === 404 || code === 'NOT_FOUND' || message.includes('404')
}

const processStatusLabel = (status?: string) => {
  const key = String(status || '').toLowerCase()
  const labels: Record<string, string> = {
    running: t('systemManagement.running', '运行中'),
    run: t('systemManagement.running', '运行中'),
    sleep: t('systemManagement.sleeping', '休眠'),
    sleeping: t('systemManagement.sleeping', '休眠'),
    disk_sleep: t('systemManagement.diskSleep', '磁盘等待'),
    stopped: t('systemManagement.stopped', '已停止'),
    stop: t('systemManagement.stopped', '已停止'),
    zombie: t('systemManagement.zombie', '僵尸'),
    dead: t('systemManagement.dead', '异常终止'),
    idle: t('systemManagement.idle', '空闲'),
    lock: t('systemManagement.lock', '锁等待'),
    tracing_stop: t('systemManagement.tracingStop', '跟踪暂停'),
    wake_kill: t('systemManagement.wakeKill', '唤醒终止'),
    waking: t('systemManagement.waking', '唤醒中'),
    parked: t('systemManagement.parked', '挂起')
  }
  return labels[key] || status || t('systemManagement.unknown', '未知')
}

const processStatusType = (status?: string) => {
  const key = String(status || '').toLowerCase()
  if (['running', 'run'].includes(key)) return 'success'
  if (['zombie', 'dead'].includes(key)) return 'danger'
  if (['stopped', 'stop', 'tracing_stop'].includes(key)) return 'warning'
  return 'info'
}

const formatPercent = (value?: number, digits = 2) => {
  const numeric = Number(value || 0)
  if (!Number.isFinite(numeric)) return '--'
  return `${numeric.toFixed(digits)}%`
}

const formatDateTime = (value?: number | string) => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`
}

const usagePercent = (device: SystemDiskDevice) => {
  const total = Number(device.totalBytes || 0)
  const used = Number(device.usedBytes || 0)
  if (!total) return 0
  return Math.min(100, Math.max(0, Number(((used / total) * 100).toFixed(2))))
}

const loadProcesses = async () => {
  if (!canRead.value) return
  processLoading.value = true
  processError.value = ''
  try {
    const { data } = await Api.getSystemProcesses({
      offset: processOffset.value,
      limit: processFilters.pageSize,
      keyword: processFilters.keyword.trim() || undefined,
      sort: processFilters.sort,
      order: processFilters.order
    })
    processes.value = Array.isArray(data?.items) ? data.items : []
    processTotal.value = Number(data?.total || 0)
  } catch (error: any) {
    processError.value = getErrorMessage(error, t('systemManagement.processListFailed', '获取进程列表失败'))
  } finally {
    processLoading.value = false
  }
}

const loadDisks = async () => {
  if (!canRead.value) return
  diskLoading.value = true
  diskError.value = ''
  try {
    const { data } = await Api.getSystemDisks()
    disks.value = Array.isArray(data?.devices) ? data.devices : []
    fstabLines.value = Array.isArray(data?.fstab) ? data.fstab : []
  } catch (error: any) {
    diskError.value = getErrorMessage(error, t('systemManagement.diskInfoFailed', '获取磁盘信息失败'))
  } finally {
    diskLoading.value = false
  }
}

const loadSshConfig = async () => {
  if (!canRead.value) return
  sshLoading.value = true
  sshError.value = ''
  try {
    const { data } = await Api.getSystemSshConfig()
    sshConfig.value = data || null
  } catch (error: any) {
    sshError.value = getErrorMessage(error, t('systemManagement.sshConfigFailed', '获取 SSH 配置失败'))
  } finally {
    sshLoading.value = false
  }
}

const loadPage = async () => {
  await Promise.all([loadProcesses(), loadDisks(), loadSshConfig()])
}

const queryProcesses = async () => {
  processFilters.page = 1
  await loadProcesses()
}

const resetProcessFilters = async () => {
  processFilters.keyword = ''
  processFilters.sort = 'cpu'
  processFilters.order = 'desc'
  processFilters.page = 1
  processFilters.pageSize = defaultProcessPageSize
  await loadProcesses()
}

const handleProcessPageSizeChange = async () => {
  processFilters.page = 1
  await loadProcesses()
}

const openProcessDetail = async (row: SystemProcessItem) => {
  processDrawerVisible.value = true
  processDetailLoading.value = true
  processDetail.value = null
  try {
    const { data } = await Api.getSystemProcessDetail(row.pid)
    processDetail.value = data || null
  } catch (error: any) {
    processDrawerVisible.value = false
    processError.value = isNotFoundError(error)
      ? t('systemManagement.processExited', '该进程可能已退出，列表已刷新')
      : getErrorMessage(error, t('systemManagement.processDetailFailed', '读取进程详情失败'))
    ElMessage.warning(processError.value)
    await loadProcesses()
  } finally {
    processDetailLoading.value = false
  }
}

const openDiskDetail = (row: SystemDiskDevice) => {
  activeDisk.value = row
  diskDrawerVisible.value = true
}

const openSshDrawer = () => {
  sshDrawerVisible.value = true
}

onMounted(() => {
  void loadPage()
})
</script>

<template>
  <div class="system-page">
    <template v-if="canRead">
      <section class="system-hero">
        <div>
          <h1 class="system-hero__title">{{ $t('systemManagement.title') }}</h1>
          <p class="system-hero__desc">{{ $t('systemManagement.description') }}</p>
        </div>
        <el-button class="hero-refresh" :icon="Refresh" @click="loadPage">{{ $t('systemManagement.refreshAll') }}</el-button>
      </section>

      <section class="summary-grid">
        <article class="summary-card">
          <span class="summary-card__label">{{ $t('systemManagement.processManagement') }}</span>
          <strong>{{ processTotal }}</strong>
          <small>{{ $t('systemManagement.currentFilterResult') }}</small>
        </article>
        <article class="summary-card">
          <span class="summary-card__label">{{ $t('systemManagement.highCpuProcesses') }}</span>
          <strong>{{ highCpuCount }}</strong>
          <small>{{ $t('systemManagement.currentPageCpuHint') }}</small>
        </article>
        <article class="summary-card">
          <span class="summary-card__label">{{ $t('systemManagement.mountedDisks') }}</span>
          <strong>{{ disks.length }}</strong>
          <small>{{ $t('systemManagement.persistedCount', { count: persistentDiskCount }) }}</small>
        </article>
        <article class="summary-card">
          <span class="summary-card__label">{{ $t('systemManagement.sshStatus') }}</span>
          <strong>{{ sshStatusText }}</strong>
          <small>{{ sshConfig?.configPath || $t('systemManagement.waitingConfig') }}</small>
        </article>
      </section>

      <SystemManagementTabs
        :items="tabItems"
        :active-key="activeTabKey"
        @update:active-key="activeTabKey = $event"
      />

      <ProcessManagementSection
        v-if="activeTabKey === 'processes'"
        :process-error="processError"
        :process-loading="processLoading"
        :process-filters="processFilters"
        :process-sort-options="processSortOptions"
        :order-options="orderOptions"
        :process-columns="processColumns"
        :processes="processes"
        :process-total="processTotal"
        :on-query="queryProcesses"
        :on-reset="resetProcessFilters"
        :on-refresh="loadProcesses"
        :on-open-detail="openProcessDetail"
        :on-page-change="loadProcesses"
        :on-page-size-change="handleProcessPageSizeChange"
        :process-status-label="processStatusLabel"
        :process-status-type="processStatusType"
        :format-percent="formatPercent"
        :format-date-time="formatDateTime"
        :format-bytes="formatBytes"
      />

      <SshConfigSection
        v-else-if="activeTabKey === 'ssh'"
        :ssh-error="sshError"
        :ssh-loading="sshLoading"
        :ssh-config="sshConfig"
        :localized-ssh-error="localizedSshError"
        :on-refresh="loadSshConfig"
        :on-open-drawer="openSshDrawer"
      />

      <DiskManagementSection
        v-else
        :disk-error="diskError"
        :disk-loading="diskLoading"
        :disks="disks"
        :disk-columns="diskColumns"
        :root-mounts="rootMounts"
        :on-refresh="loadDisks"
        :on-open-detail="openDiskDetail"
        :usage-percent="usagePercent"
        :format-bytes="formatBytes"
      />

      <custom-drawer
        :visible="processDrawerVisible"
        :title="$t('systemManagement.processDetail')"
        :loading="processDetailLoading"
        :show-footer="false"
        size="640px"
        :on-close="() => { processDrawerVisible = false }"
      >
        <div v-if="processDetail" class="detail-drawer">
          <div class="detail-grid">
            <div class="detail-item">
              <span>PID</span>
              <strong>{{ processDetail.pid }}</strong>
            </div>
            <div class="detail-item">
              <span>{{ $t('systemManagement.parentProcess') }}</span>
              <strong>{{ processDetail.ppid }}</strong>
            </div>
            <div class="detail-item">
              <span>{{ $t('common.name') }}</span>
              <strong>{{ processDetail.name }}</strong>
            </div>
            <div class="detail-item">
              <span>{{ $t('common.user') }}</span>
              <strong>{{ processDetail.username || '--' }}</strong>
            </div>
            <div class="detail-item">
              <span>{{ $t('common.status') }}</span>
              <strong>{{ processStatusLabel(processDetail.status) }}</strong>
            </div>
            <div class="detail-item">
              <span>CPU</span>
              <strong>{{ formatPercent(processDetail.cpuPercent) }}</strong>
            </div>
            <div class="detail-item">
              <span>{{ $t('home.memory') }}</span>
              <strong>{{ formatBytes(processDetail.memoryRss) }}</strong>
            </div>
            <div class="detail-item">
              <span>{{ $t('systemManagement.startTime') }}</span>
              <strong>{{ formatDateTime(processDetail.createTime) }}</strong>
            </div>
          </div>

          <div class="detail-block">
            <label>{{ $t('systemManagement.executable') }}</label>
            <pre>{{ processDetail.executable || '--' }}</pre>
          </div>
          <div class="detail-block">
            <label>{{ $t('systemManagement.workingDirectory') }}</label>
            <pre>{{ processDetail.cwd || '--' }}</pre>
          </div>
          <div class="detail-block">
            <label>{{ $t('systemManagement.commandMasked') }}</label>
            <pre>{{ processDetail.command || '--' }}</pre>
          </div>
          <div class="detail-block">
            <label>{{ $t('systemManagement.directChildren') }}</label>
            <div class="children-tags">
              <el-tag v-for="pid in processDetail.children || []" :key="pid" effect="light">{{ pid }}</el-tag>
              <span v-if="!(processDetail.children || []).length">{{ $t('systemManagement.noDirectChildren') }}</span>
            </div>
          </div>
        </div>
      </custom-drawer>

      <custom-drawer
        :visible="sshDrawerVisible"
        :title="$t('systemManagement.currentSshConfig')"
        :show-footer="false"
        size="620px"
        :on-close="() => { sshDrawerVisible = false }"
      >
        <div class="detail-drawer">
          <div class="detail-grid">
            <div class="detail-item">
              <span>{{ $t('systemManagement.supportStatus') }}</span>
              <strong>{{ sshConfig?.supported === false ? $t('systemManagement.unsupported') : $t('systemManagement.supported') }}</strong>
            </div>
            <div class="detail-item">
              <span>{{ $t('systemManagement.serviceName') }}</span>
              <strong>{{ sshConfig?.service || '--' }}</strong>
            </div>
            <div class="detail-item">
              <span>{{ $t('systemManagement.configPath') }}</span>
              <strong>{{ sshConfig?.configPath || '--' }}</strong>
            </div>
            <div class="detail-item">
              <span>{{ $t('systemManagement.listenPort') }}</span>
              <strong>{{ sshConfig?.port || '--' }}</strong>
            </div>
            <div class="detail-item">
              <span>{{ $t('systemManagement.passwordAuthentication') }}</span>
              <strong>{{ sshConfig?.passwordAuthentication || '--' }}</strong>
            </div>
            <div class="detail-item">
              <span>{{ $t('systemManagement.rootLogin') }}</span>
              <strong>{{ sshConfig?.permitRootLogin || '--' }}</strong>
            </div>
            <div class="detail-item">
              <span>{{ $t('systemManagement.pubkeyAuthentication') }}</span>
              <strong>{{ sshConfig?.pubkeyAuthentication || '--' }}</strong>
            </div>
            <div class="detail-item">
              <span>{{ $t('systemManagement.emptyPassword') }}</span>
              <strong>{{ sshConfig?.permitEmptyPasswords || '--' }}</strong>
            </div>
            <div class="detail-item">
              <span>{{ $t('systemManagement.listenAddress') }}</span>
              <strong>{{ sshConfig?.listenAddress || '--' }}</strong>
            </div>
          </div>

          <div class="detail-block" v-if="sshConfig?.error">
            <label>{{ $t('systemManagement.diagnosticInfo') }}</label>
            <pre>{{ localizedSshError(sshConfig.error) }}</pre>
          </div>
        </div>
      </custom-drawer>

      <custom-drawer
        :visible="diskDrawerVisible"
        :title="activeDisk ? $t('systemManagement.diskDetailTitle', { mountpoint: activeDisk.mountpoint }) : $t('systemManagement.diskDetail')"
        :show-footer="false"
        size="760px"
        :on-close="() => { diskDrawerVisible = false }"
      >
        <div v-if="activeDisk" class="detail-drawer">
          <div class="detail-grid">
            <div class="detail-item">
              <span>{{ $t('systemManagement.device') }}</span>
              <strong>{{ activeDisk.device }}</strong>
            </div>
            <div class="detail-item">
              <span>{{ $t('systemManagement.mountpoint') }}</span>
              <strong>{{ activeDisk.mountpoint }}</strong>
            </div>
            <div class="detail-item">
              <span>{{ $t('systemManagement.fileSystem') }}</span>
              <strong>{{ activeDisk.fsType }}</strong>
            </div>
            <div class="detail-item">
              <span>{{ $t('systemManagement.mountOptions') }}</span>
              <strong>{{ activeDisk.options || '--' }}</strong>
            </div>
            <div class="detail-item">
              <span>{{ $t('systemManagement.totalCapacity') }}</span>
              <strong>{{ formatBytes(activeDisk.totalBytes) }}</strong>
            </div>
            <div class="detail-item">
              <span>{{ $t('systemManagement.usedCapacity') }}</span>
              <strong>{{ formatBytes(activeDisk.usedBytes) }}</strong>
            </div>
            <div class="detail-item">
              <span>{{ $t('systemManagement.available') }}</span>
              <strong>{{ formatBytes(activeDisk.freeBytes) }}</strong>
            </div>
            <div class="detail-item">
              <span>{{ $t('systemManagement.persistent') }}</span>
              <strong>{{ activeDisk.persistent ? $t('systemManagement.writtenFstab') : $t('systemManagement.unmatchedFstab') }}</strong>
            </div>
          </div>

          <div class="detail-block">
            <label>{{ $t('systemManagement.progress') }}</label>
            <div class="disk-progress-card">
              <el-progress :percentage="usagePercent(activeDisk)" :stroke-width="10" />
              <span>{{ formatBytes(activeDisk.usedBytes) }} / {{ formatBytes(activeDisk.totalBytes) }}</span>
            </div>
          </div>

          <div class="detail-block">
            <label>{{ $t('systemManagement.fstabEntries') }}</label>
            <pre>{{ fstabLines.length ? fstabLines.join('\n') : $t('systemManagement.noFstabEntries') }}</pre>
          </div>
        </div>
      </custom-drawer>
    </template>

    <el-empty v-else :description="$t('systemManagement.noReadPermission')" />
  </div>
</template>

<style scoped lang="less">
.system-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-height: 100%;
  padding: 4px 0 28px;
}

.system-hero,
.summary-card {
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  background: var(--surface-raised);
  box-shadow: var(--shadow-card);
}

.system-hero {
  padding: 0;
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-start;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.system-hero__title {
  margin: 0;
  color: var(--text-primary);
  font-size: 24px;
  font-weight: 700;
}

.system-hero__desc {
  margin: 10px 0 0;
  max-width: 760px;
  color: var(--text-secondary);
  line-height: 1.75;
}

.hero-refresh {
  flex-shrink: 0;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.summary-card {
  min-height: 108px;
  padding: 18px 20px;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(var(--primary-color), 0.42);
    box-shadow: 0 18px 32px rgba(15, 23, 42, 0.08);
  }

  strong {
    display: block;
    margin-top: 12px;
    color: var(--text-primary);
    font-size: 20px;
    font-weight: 700;
  }

  small {
    display: block;
    margin-top: 8px;
    color: var(--text-tertiary);
  }
}

.summary-card__label {
  color: var(--text-secondary);
}

.detail-drawer {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.detail-item,
.detail-block {
  padding: 16px;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  background: var(--surface-base);
}

.detail-item {
  min-height: 88px;

  span {
    display: block;
    color: var(--text-secondary);
    font-size: 13px;
  }

  strong {
    display: block;
    margin-top: 10px;
    color: var(--text-primary);
    line-height: 1.55;
    overflow-wrap: anywhere;
  }
}

.detail-block {
  label {
    display: block;
    margin-bottom: 12px;
    color: var(--text-primary);
    font-weight: 600;
  }

  pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    color: var(--text-secondary);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
    line-height: 1.75;
  }
}

.children-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  color: var(--text-secondary);
}

.disk-progress-card {
  display: flex;
  align-items: center;
  gap: 14px;

  .el-progress {
    flex: 1;
  }

  span {
    color: var(--text-secondary);
    white-space: nowrap;
  }
}

@media (max-width: 1280px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .system-hero,
  .disk-progress-card {
    flex-direction: column;
    align-items: stretch;
  }

  .summary-grid,
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
