<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { InfoFilled, Refresh, Search, WarningFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import CustomDrawer from '@/components/custom-drawer.vue'
import { Api, type SystemDiskDevice, type SystemProcessDetail, type SystemProcessItem, type SystemSshConfig } from '@/api/Api'
import sconfig from '@/sstore/sconfig'
import { formatBytes } from '@/utils/fileSize'

type ProcessSort = 'pid' | 'cpu' | 'memory' | 'name'
type SortOrder = 'asc' | 'desc'

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

const defaultProcessPageSize = 50

const processFilters = reactive({
  keyword: '',
  sort: 'cpu' as ProcessSort,
  order: 'desc' as SortOrder,
  page: 1,
  pageSize: defaultProcessPageSize
})

const processSortOptions: Array<{ label: string; value: ProcessSort }> = [
  { label: 'PID', value: 'pid' },
  { label: 'CPU', value: 'cpu' },
  { label: '内存', value: 'memory' },
  { label: '名称', value: 'name' }
]

const orderOptions: Array<{ label: string; value: SortOrder }> = [
  { label: '降序', value: 'desc' },
  { label: '升序', value: 'asc' }
]

const canRead = computed(() =>
  sconfig.hasActionAccess('system.settings.read') ||
  Boolean((sconfig.scopeAccess as any)?.system?.settings?.read) ||
  Boolean((sconfig.scopeAccess as any)?.['system.settings']?.read)
)

const processOffset = computed(() => Math.max((processFilters.page - 1) * processFilters.pageSize, 0))
const highCpuCount = computed(() => processes.value.filter((item) => Number(item.cpuPercent) >= 20).length)
const persistentDiskCount = computed(() => disks.value.filter((item) => item.persistent).length)
const sshStatusText = computed(() => {
  if (sshLoading.value) return '读取中'
  if (sshConfig.value?.supported === false) return '当前系统不支持'
  if (sshConfig.value?.error) return '探测异常'
  return sshConfig.value?.service ? '已检测服务' : '未检测到'
})
const sshStatusType = computed(() => {
  if (sshConfig.value?.supported === false || sshConfig.value?.error) return 'warning'
  return sshConfig.value?.service ? 'success' : 'info'
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

const getErrorMessage = (error: any, fallback: string) => {
  const data = error?.response?.data || error?.data || error?.xhr?.data || {}
  return data?.message || data?.error?.message || error?.message || fallback
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
    running: '运行中',
    run: '运行中',
    sleep: '休眠',
    sleeping: '休眠',
    disk_sleep: '磁盘等待',
    stopped: '已停止',
    stop: '已停止',
    zombie: '僵尸',
    dead: '异常终止',
    idle: '空闲',
    lock: '锁等待',
    tracing_stop: '跟踪暂停',
    wake_kill: '唤醒终止',
    waking: '唤醒中',
    parked: '挂起'
  }
  return labels[key] || status || '未知'
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
    processError.value = getErrorMessage(error, '获取进程列表失败')
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
    diskError.value = getErrorMessage(error, '获取磁盘信息失败')
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
    sshError.value = getErrorMessage(error, '获取 SSH 配置失败')
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

const openProcessDetail = async (row: SystemProcessItem) => {
  processDrawerVisible.value = true
  processDetailLoading.value = true
  processDetail.value = null
  try {
    const { data } = await Api.getSystemProcessDetail(row.pid)
    processDetail.value = data || null
  } catch (error: any) {
    processDrawerVisible.value = false
    processError.value = isNotFoundError(error) ? '该进程可能已退出，列表已刷新' : getErrorMessage(error, '读取进程详情失败')
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
          <h1 class="system-hero__title">系统管理</h1>
          <p class="system-hero__desc">集中查看系统进程、SSH 生效配置与磁盘挂载状态，所有数据以当前接口最新响应为准。</p>
        </div>
        <el-button class="hero-refresh" :icon="Refresh" @click="loadPage">刷新全部</el-button>
      </section>

      <section class="summary-grid">
        <article class="summary-card">
          <span class="summary-card__label">进程总数</span>
          <strong>{{ processTotal }}</strong>
          <small>当前筛选结果</small>
        </article>
        <article class="summary-card">
          <span class="summary-card__label">高 CPU 进程</span>
          <strong>{{ highCpuCount }}</strong>
          <small>当前页 CPU ≥ 20%</small>
        </article>
        <article class="summary-card">
          <span class="summary-card__label">已挂载磁盘</span>
          <strong>{{ disks.length }}</strong>
          <small>{{ persistentDiskCount }} 个已持久化</small>
        </article>
        <article class="summary-card">
          <span class="summary-card__label">SSH 状态</span>
          <strong>{{ sshStatusText }}</strong>
          <small>{{ sshConfig?.configPath || '等待读取配置' }}</small>
        </article>
      </section>

      <section class="system-card">
        <div class="section-heading">
          <div>
            <h2>进程管理</h2>
            <p>支持关键字、排序和分页查询，点击进程行查看详情。</p>
          </div>
          <el-button :icon="Refresh" @click="loadProcesses">刷新进程</el-button>
        </div>

        <el-alert v-if="processError" type="error" :closable="false" show-icon>
          <template #title>{{ processError }}</template>
        </el-alert>

        <div class="process-toolbar">
          <el-input
            v-model="processFilters.keyword"
            placeholder="请输入进程名、PID 或关键字"
            clearable
            @keyup.enter="queryProcesses"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-select v-model="processFilters.sort" placeholder="请选择排序字段">
            <el-option v-for="item in processSortOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
          <el-select v-model="processFilters.order" placeholder="请选择排序方式">
            <el-option v-for="item in orderOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
          <el-button type="primary" @click="queryProcesses">查询</el-button>
          <el-button @click="resetProcessFilters">重置</el-button>
        </div>

        <el-table
          v-loading="processLoading"
          :data="processes"
          class="data-table process-table"
          empty-text="暂无进程数据"
          @row-click="openProcessDetail"
        >
          <el-table-column prop="pid" label="PID" min-width="86" />
          <el-table-column prop="name" label="名称" min-width="180" />
          <el-table-column prop="username" label="用户" min-width="120">
            <template #default="{ row }">{{ row.username || '--' }}</template>
          </el-table-column>
          <el-table-column prop="status" label="状态" min-width="120">
            <template #default="{ row }">
              <el-tag :type="processStatusType(row.status)" effect="light">{{ processStatusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="cpuPercent" label="CPU" min-width="110">
            <template #default="{ row }">{{ formatPercent(row.cpuPercent) }}</template>
          </el-table-column>
          <el-table-column prop="memoryRss" label="内存" min-width="130">
            <template #default="{ row }">{{ formatBytes(row.memoryRss) }}</template>
          </el-table-column>
          <el-table-column prop="createTime" label="启动时间" min-width="176">
            <template #default="{ row }">{{ formatDateTime(row.createTime) }}</template>
          </el-table-column>
          <el-table-column label="操作" min-width="120" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click.stop="openProcessDetail(row)">查看详情</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="table-footer">
          <span>共 {{ processTotal }} 个进程</span>
          <el-pagination
            v-model:current-page="processFilters.page"
            v-model:page-size="processFilters.pageSize"
            layout="total, sizes, prev, pager, next"
            :page-sizes="[50, 100, 200]"
            :total="processTotal"
            @current-change="loadProcesses"
            @size-change="() => { processFilters.page = 1; loadProcesses() }"
          />
        </div>
      </section>

      <section class="system-grid">
        <article class="system-card">
          <div class="section-heading">
            <div>
              <h2>SSH 快速配置</h2>
              <p>展示当前 <code>sshd -T</code> 生效配置，配置项只读，写操作接口尚未开放。</p>
            </div>
            <div class="section-actions">
              <el-button :icon="Refresh" @click="loadSshConfig">刷新 SSH</el-button>
              <el-button type="primary" plain @click="openSshDrawer">查看配置</el-button>
            </div>
          </div>

          <el-alert
            v-if="sshError || sshConfig?.error || sshConfig?.supported === false"
            :type="sshConfig?.supported === false ? 'warning' : 'error'"
            :closable="false"
            show-icon
          >
            <template #title>
              {{ sshError || sshConfig?.error || '当前系统不支持 SSH 配置探测能力' }}
            </template>
          </el-alert>

          <div v-loading="sshLoading" class="ssh-overview">
            <div class="ssh-item">
              <span>服务</span>
              <strong>{{ sshConfig?.service || '--' }}</strong>
            </div>
            <div class="ssh-item">
              <span>配置文件</span>
              <strong>{{ sshConfig?.configPath || '--' }}</strong>
            </div>
            <div class="ssh-item">
              <span>监听端口</span>
              <strong>{{ sshConfig?.port || '--' }}</strong>
              <em>风险项</em>
            </div>
            <div class="ssh-item">
              <span>密码登录</span>
              <strong>{{ sshConfig?.passwordAuthentication || '--' }}</strong>
              <em>风险项</em>
            </div>
            <div class="ssh-item">
              <span>Root 登录</span>
              <strong>{{ sshConfig?.permitRootLogin || '--' }}</strong>
              <em>风险项</em>
            </div>
            <div class="ssh-item">
              <span>监听地址</span>
              <strong>{{ sshConfig?.listenAddress || '--' }}</strong>
            </div>
          </div>

          <div class="risk-list">
            <div class="risk-item">
              <el-icon><InfoFilled /></el-icon>
              <span>端口、Root 登录和密码认证仅展示当前生效值，暂不允许前端直接修改。</span>
            </div>
            <div class="risk-item">
              <el-icon><WarningFilled /></el-icon>
              <span>服务探测失败时保留错误原文，不把空字符串误判为未配置。</span>
            </div>
          </div>
        </article>

        <article class="system-card">
          <div class="section-heading">
            <div>
              <h2>磁盘管理</h2>
              <p>展示已挂载分区、容量、挂载点与 fstab 持久化状态。</p>
            </div>
            <el-button :icon="Refresh" @click="loadDisks">刷新磁盘</el-button>
          </div>

          <el-alert v-if="diskError" type="error" :closable="false" show-icon>
            <template #title>{{ diskError }}</template>
          </el-alert>

          <div class="disk-protection">
            <span class="disk-protection__title">保护性挂载点</span>
            <div class="disk-protection__list">
              <el-tag v-for="item in rootMounts" :key="`${item.device}-${item.mountpoint}`" effect="light" type="warning">
                {{ item.mountpoint }}
              </el-tag>
              <span v-if="!rootMounts.length">暂无重点挂载点</span>
            </div>
            <small>根分区、Panel 数据目录相关挂载点仅展示，不提供危险写操作。</small>
          </div>

          <el-table v-loading="diskLoading" :data="disks" class="data-table" empty-text="暂无磁盘数据">
            <el-table-column prop="device" label="设备" min-width="150" />
            <el-table-column prop="mountpoint" label="挂载点" min-width="140" />
            <el-table-column prop="fsType" label="文件系统" min-width="100" />
            <el-table-column label="容量使用" min-width="220">
              <template #default="{ row }">
                <div class="usage-cell">
                  <el-progress :percentage="usagePercent(row)" :stroke-width="8" />
                  <span>{{ formatBytes(row.usedBytes) }} / {{ formatBytes(row.totalBytes) }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="persistent" label="持久化" min-width="100">
              <template #default="{ row }">
                <el-tag :type="row.persistent ? 'success' : 'info'" effect="light">
                  {{ row.persistent ? '已写入 fstab' : '未匹配 fstab' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" min-width="120" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="openDiskDetail(row)">查看详情</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="coming-soon">
            <span>未挂载设备、格式化、挂载与卸载操作：后续开放</span>
            <small><code>persistent=false</code> 仅表示未在 fstab 中匹配，不等同于故障。</small>
          </div>
        </article>
      </section>

      <custom-drawer
        :visible="processDrawerVisible"
        title="进程详情"
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
              <span>父进程</span>
              <strong>{{ processDetail.ppid }}</strong>
            </div>
            <div class="detail-item">
              <span>名称</span>
              <strong>{{ processDetail.name }}</strong>
            </div>
            <div class="detail-item">
              <span>用户</span>
              <strong>{{ processDetail.username || '--' }}</strong>
            </div>
            <div class="detail-item">
              <span>状态</span>
              <strong>{{ processStatusLabel(processDetail.status) }}</strong>
            </div>
            <div class="detail-item">
              <span>CPU</span>
              <strong>{{ formatPercent(processDetail.cpuPercent) }}</strong>
            </div>
            <div class="detail-item">
              <span>内存</span>
              <strong>{{ formatBytes(processDetail.memoryRss) }}</strong>
            </div>
            <div class="detail-item">
              <span>启动时间</span>
              <strong>{{ formatDateTime(processDetail.createTime) }}</strong>
            </div>
          </div>

          <div class="detail-block">
            <label>可执行文件</label>
            <pre>{{ processDetail.executable || '--' }}</pre>
          </div>
          <div class="detail-block">
            <label>工作目录</label>
            <pre>{{ processDetail.cwd || '--' }}</pre>
          </div>
          <div class="detail-block">
            <label>命令行（脱敏）</label>
            <pre>{{ processDetail.command || '--' }}</pre>
          </div>
          <div class="detail-block">
            <label>直接子进程</label>
            <div class="children-tags">
              <el-tag v-for="pid in processDetail.children || []" :key="pid" effect="light">{{ pid }}</el-tag>
              <span v-if="!(processDetail.children || []).length">无直接子进程</span>
            </div>
          </div>
        </div>
      </custom-drawer>

      <custom-drawer
        :visible="sshDrawerVisible"
        title="SSH 当前配置"
        :show-footer="false"
        size="620px"
        :on-close="() => { sshDrawerVisible = false }"
      >
        <div class="detail-drawer">
          <div class="detail-grid">
            <div class="detail-item">
              <span>支持状态</span>
              <strong>{{ sshConfig?.supported === false ? '不支持' : '支持' }}</strong>
            </div>
            <div class="detail-item">
              <span>服务名</span>
              <strong>{{ sshConfig?.service || '--' }}</strong>
            </div>
            <div class="detail-item">
              <span>配置路径</span>
              <strong>{{ sshConfig?.configPath || '--' }}</strong>
            </div>
            <div class="detail-item">
              <span>监听端口</span>
              <strong>{{ sshConfig?.port || '--' }}</strong>
            </div>
            <div class="detail-item">
              <span>密码认证</span>
              <strong>{{ sshConfig?.passwordAuthentication || '--' }}</strong>
            </div>
            <div class="detail-item">
              <span>Root 登录</span>
              <strong>{{ sshConfig?.permitRootLogin || '--' }}</strong>
            </div>
            <div class="detail-item">
              <span>公钥认证</span>
              <strong>{{ sshConfig?.pubkeyAuthentication || '--' }}</strong>
            </div>
            <div class="detail-item">
              <span>空密码</span>
              <strong>{{ sshConfig?.permitEmptyPasswords || '--' }}</strong>
            </div>
            <div class="detail-item">
              <span>监听地址</span>
              <strong>{{ sshConfig?.listenAddress || '--' }}</strong>
            </div>
          </div>

          <div class="detail-block" v-if="sshConfig?.error">
            <label>诊断信息</label>
            <pre>{{ sshConfig.error }}</pre>
          </div>
        </div>
      </custom-drawer>

      <custom-drawer
        :visible="diskDrawerVisible"
        :title="activeDisk ? `${activeDisk.mountpoint} 磁盘详情` : '磁盘详情'"
        :show-footer="false"
        size="760px"
        :on-close="() => { diskDrawerVisible = false }"
      >
        <div v-if="activeDisk" class="detail-drawer">
          <div class="detail-grid">
            <div class="detail-item">
              <span>设备</span>
              <strong>{{ activeDisk.device }}</strong>
            </div>
            <div class="detail-item">
              <span>挂载点</span>
              <strong>{{ activeDisk.mountpoint }}</strong>
            </div>
            <div class="detail-item">
              <span>文件系统</span>
              <strong>{{ activeDisk.fsType }}</strong>
            </div>
            <div class="detail-item">
              <span>挂载选项</span>
              <strong>{{ activeDisk.options || '--' }}</strong>
            </div>
            <div class="detail-item">
              <span>总容量</span>
              <strong>{{ formatBytes(activeDisk.totalBytes) }}</strong>
            </div>
            <div class="detail-item">
              <span>已使用</span>
              <strong>{{ formatBytes(activeDisk.usedBytes) }}</strong>
            </div>
            <div class="detail-item">
              <span>可用</span>
              <strong>{{ formatBytes(activeDisk.freeBytes) }}</strong>
            </div>
            <div class="detail-item">
              <span>持久化</span>
              <strong>{{ activeDisk.persistent ? '已写入 fstab' : '未匹配 fstab' }}</strong>
            </div>
          </div>

          <div class="detail-block">
            <label>容量进度</label>
            <div class="disk-progress-card">
              <el-progress :percentage="usagePercent(activeDisk)" :stroke-width="10" />
              <span>{{ formatBytes(activeDisk.usedBytes) }} / {{ formatBytes(activeDisk.totalBytes) }}</span>
            </div>
          </div>

          <div class="detail-block">
            <label>/etc/fstab 当前条目</label>
            <pre>{{ fstabLines.length ? fstabLines.join('\n') : '暂无有效 fstab 配置' }}</pre>
          </div>
        </div>
      </custom-drawer>
    </template>

    <el-empty v-else description="当前账号没有系统管理读取权限" />
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
.system-card,
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

.system-hero__eyebrow {
  margin: 0 0 8px;
  color: rgb(var(--primary-color));
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.24em;
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
    border-color: rgba(255, 111, 20, 0.42);
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

.system-card {
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.system-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

.section-heading,
.section-actions,
.process-toolbar,
.table-footer,
.risk-item,
.disk-progress-card {
  display: flex;
  align-items: center;
}

.section-heading {
  justify-content: space-between;
  gap: 16px;

  h2 {
    margin: 0;
    color: var(--text-primary);
    font-size: 18px;
  }

  p {
    margin: 8px 0 0;
    color: var(--text-secondary);
    line-height: 1.7;

    code {
      padding: 2px 6px;
      border-radius: 6px;
      background: rgba(100, 116, 139, 0.08);
      color: var(--text-primary);
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
      font-size: 12px;
    }
  }
}

.section-actions {
  gap: 10px;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.process-toolbar {
  padding: 16px;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  background: rgba(248, 250, 252, 0.72);
  gap: 12px;
  flex-wrap: wrap;

  .el-input {
    width: 320px;
    max-width: 100%;
  }

  .el-select {
    width: 160px;
  }
}

.data-table {
  width: 100%;
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
}

.process-table :deep(.el-table__row) {
  cursor: pointer;
}

.table-footer {
  padding-top: 2px;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  color: var(--text-secondary);
}

.usage-cell {
  display: flex;
  flex-direction: column;
  gap: 8px;

  span {
    color: var(--text-secondary);
    font-size: 12px;
  }
}

.ssh-overview {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.ssh-item,
.detail-item {
  min-height: 88px;
  padding: 16px;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  background: var(--surface-base);

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

  em {
    display: inline-flex;
    margin-top: 8px;
    padding: 2px 8px;
    border-radius: 999px;
    background: rgba(245, 158, 11, 0.1);
    color: #d97706;
    font-size: 12px;
    font-style: normal;
    line-height: 1.6;
  }
}

.risk-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.risk-item {
  gap: 10px;
  color: var(--text-secondary);
  line-height: 1.7;
}

.disk-protection {
  padding: 14px 16px;
  border-radius: 14px;
  background: var(--surface-base);
  border: 1px solid var(--border-subtle);
}

.disk-protection__title {
  display: block;
  margin-bottom: 10px;
  color: var(--text-primary);
  font-weight: 600;
}

.disk-protection__list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  color: var(--text-secondary);
}

.disk-protection small {
  display: block;
  margin-top: 10px;
  color: var(--text-tertiary);
  line-height: 1.6;
}

.coming-soon {
  padding: 14px 16px;
  border-radius: 14px;
  background: rgba(100, 116, 139, 0.06);
  border: 1px dashed var(--border-subtle);
  color: var(--text-secondary);
  line-height: 1.7;

  span,
  small {
    display: block;
  }

  span {
    color: var(--text-primary);
    font-weight: 600;
  }

  small {
    margin-top: 4px;
    color: var(--text-tertiary);
  }

  code {
    padding: 2px 6px;
    border-radius: 6px;
    background: rgba(100, 116, 139, 0.08);
    color: var(--text-primary);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
    font-size: 12px;
  }
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

.detail-block {
  padding: 16px;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  background: var(--surface-base);

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
  gap: 14px;

  .el-progress {
    flex: 1;
  }

  span {
    color: var(--text-secondary);
    white-space: nowrap;
  }
}

@media (max-width: 1440px) {
  .system-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1280px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .system-hero,
  .section-heading,
  .table-footer,
  .disk-progress-card {
    flex-direction: column;
    align-items: stretch;
  }

  .summary-grid,
  .system-grid,
  .ssh-overview,
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
