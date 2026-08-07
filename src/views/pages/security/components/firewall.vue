<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import { Api } from '@/api/Api'
import SearchInput from '@/components/search-input.vue'
import softwareTaskStore from '@/sstore/softwareTask'
import System from '@/utils/System'
import { isOperationCancelled, submitOperation } from '@/utils/operationPreview'
import InstallTaskDrawer from '../../software/components/InstallTaskDrawer.vue'
import Addfirewall from './addfirewall.vue'

type RuleTab = 'port' | 'ip' | 'forward' | 'region' | 'auto_block'

interface FirewallCounts {
  portRules: number
  ipRules: number
  portForwards: number
  regionRules: number
  autoBlockRules: number
}

interface FirewallStatus {
  install: boolean
  enabled: boolean
  pingBlocked: boolean
  backend: 'ufw' | 'firewalld' | 'iptables' | 'none'
  persistent: boolean
  canToggle: boolean
  repairRequired: boolean
  warning?: string
  panelPort: number
  panelPortProtected: boolean
  managedRuleCount: number
  counts: FirewallCounts
}

interface FirewallRule {
  id: number
  ruleType: Exclude<RuleTab, 'forward'>
  direction: 'in' | 'out'
  protocol: 'tcp' | 'udp' | 'icmp' | 'all'
  strategy: 'allow' | 'deny'
  ips: string
  ports: string
  state: number
  remark: string
  location: string
  expiresAt?: string | null
  backend: string
  protected: boolean
  create_time: string
}

interface PortForward {
  id: number
  protocol: 'tcp' | 'udp'
  sourcePort: number
  destinationIp: string
  destinationPort: number
  state: number
  remark: string
  backend: string
  create_time: string
}

interface AutoBlockConfig {
  enabled: boolean
  threshold: number
  windowMinutes: number
  banMinutes: number
  lastRunAt?: string | null
}

const emptyCounts = (): FirewallCounts => ({
  portRules: 0,
  ipRules: 0,
  portForwards: 0,
  regionRules: 0,
  autoBlockRules: 0
})

const defaultStatus = (): FirewallStatus => ({
  install: false,
  enabled: false,
  pingBlocked: false,
  backend: 'none',
  persistent: false,
  canToggle: false,
  repairRequired: false,
  panelPort: 8089,
  panelPortProtected: false,
  managedRuleCount: 0,
  counts: emptyCounts()
})

const tabs: Array<{ key: RuleTab; label: string; countKey: keyof FirewallCounts }> = [
  { key: 'port', label: '端口规则', countKey: 'portRules' },
  { key: 'ip', label: 'IP 规则', countKey: 'ipRules' },
  { key: 'forward', label: '端口转发', countKey: 'portForwards' },
  { key: 'region', label: '地区规则', countKey: 'regionRules' },
  { key: 'auto_block', label: '恶意 IP 自动封禁', countKey: 'autoBlockRules' }
]

const backendNames: Record<string, string> = {
  ufw: 'UFW',
  firewalld: 'firewalld',
  iptables: 'iptables',
  none: '未检测到'
}

const status = ref<FirewallStatus>(defaultStatus())
const activeTab = ref<RuleTab>('port')
const ruleRows = ref<FirewallRule[]>([])
const forwardRows = ref<PortForward[]>([])
const selectedRows = ref<FirewallRule[]>([])
const statusLoading = ref(false)
const tableLoading = ref(false)
const firewallChanging = ref(false)
const pingChanging = ref(false)
const cleanupLoading = ref(false)
const installSubmitting = ref(false)
const batchAction = ref<'enable' | 'disable' | 'delete' | ''>('')
const searchValue = ref('')
const pagination = reactive({ currentPage: 1, pageSize: 20, total: 0 })

const installTaskVisible = ref(false)
const installTaskId = ref('')
const refreshedTerminalTasks = new Set<string>()
const activeInstallTask = computed(() => softwareTaskStore.activeForKey('firewalld'))
const installButtonText = computed(() =>
  activeInstallTask.value
    ? '查看任务进度'
    : status.value.repairRequired
      ? '修复 firewalld'
      : '安装 firewalld'
)

const portDialogVisible = ref(false)
const portDialogIsAdd = ref(true)
const currentPortRule = ref<Record<string, any>>({})

const ipDialogVisible = ref(false)
const ipDialogIsAdd = ref(true)
const ipSubmitting = ref(false)
const ipForm = reactive({
  id: 0,
  ips: '',
  strategy: 'deny' as 'allow' | 'deny',
  location: '',
  remark: '',
  expiresAt: undefined as Date | string | undefined,
  enabled: true
})

const forwardDialogVisible = ref(false)
const forwardDialogIsAdd = ref(true)
const forwardSubmitting = ref(false)
const forwardForm = reactive({
  id: 0,
  protocol: 'tcp' as 'tcp' | 'udp',
  sourcePort: 0,
  destinationIp: '',
  destinationPort: 0,
  remark: '',
  enabled: true
})

const importInput = ref<HTMLInputElement>()
const autoSaving = ref(false)
const autoRunning = ref(false)
const autoConfig = reactive<AutoBlockConfig>({
  enabled: false,
  threshold: 8,
  windowMinutes: 10,
  banMinutes: 1440,
  lastRunAt: null
})

const isRuleTab = computed(() => activeTab.value !== 'forward')
const canManageRules = computed(() =>
  status.value.install && status.value.enabled && status.value.persistent
)

const getFirewallInfo = async () => {
  statusLoading.value = true
  try {
    const { data } = await Api.getFirewallInfo({})
    status.value = {
      ...defaultStatus(),
      ...(data?.info || {}),
      counts: { ...emptyCounts(), ...(data?.info?.counts || {}) }
    }
  } catch {
    status.value = defaultStatus()
  } finally {
    statusLoading.value = false
  }
}

const getData = async () => {
  tableLoading.value = true
  selectedRows.value = []
  try {
    if (activeTab.value === 'forward') {
      const { data } = await Api.getFirewallForwards({
        page: pagination.currentPage,
        pageSize: pagination.pageSize,
        q: searchValue.value
      })
      forwardRows.value = data?.data || []
      pagination.total = data?.total || 0
      return
    }
    const { data } = await Api.getFirewallRule({
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
      ruleType: activeTab.value,
      q: searchValue.value
    })
    ruleRows.value = data?.data || []
    pagination.total = data?.total || 0
  } catch {
    ruleRows.value = []
    forwardRows.value = []
    pagination.total = 0
  } finally {
    tableLoading.value = false
  }
}

const refreshAll = async () => {
  await Promise.all([getFirewallInfo(), getData()])
}

const handleFirewallChange = async (value: string | number | boolean) => {
  const enabled = Boolean(value)
  const previous = !enabled
  firewallChanging.value = true
  try {
    let confirm = ''
    if (!enabled) {
      const result = await ElMessageBox.prompt(
        '关闭防火墙会扩大服务器暴露面。请输入 DISABLE FIREWALL 继续。',
        '关闭防火墙',
        {
          type: 'warning',
          inputPlaceholder: 'DISABLE FIREWALL',
          inputValidator: (input) => input === 'DISABLE FIREWALL' || '确认文本不正确',
          confirmButtonText: '确认关闭',
          cancelButtonText: '取消'
        }
      )
      confirm = result.value
    }
    await submitOperation('firewall.toggle', { enabled, confirm })
    ElMessage.success(enabled ? '防火墙已启用' : '防火墙已关闭')
  } catch (error) {
    status.value.enabled = previous
    if (!isOperationCancelled(error)) {
      await getFirewallInfo()
    }
  } finally {
    await refreshAll()
    firewallChanging.value = false
  }
}

const handlePingChange = async (value: string | number | boolean) => {
  const blocked = Boolean(value)
  const previous = !blocked
  pingChanging.value = true
  try {
    await submitOperation('firewall.rule_change', { action: 'set_ping', blocked })
    ElMessage.success(blocked ? '已禁止外部 Ping' : '已允许外部 Ping')
  } catch (error) {
    status.value.pingBlocked = previous
    if (!isOperationCancelled(error)) {
      await getFirewallInfo()
    }
  } finally {
    await getFirewallInfo()
    pingChanging.value = false
  }
}

const handleCleanup = async () => {
  cleanupLoading.value = true
  try {
    const { data } = await Api.cleanupFirewallRules()
    ElMessage.success(`清理完成，共移除 ${data?.cleaned || 0} 条过期规则`)
    await refreshAll()
  } finally {
    cleanupLoading.value = false
  }
}

const handleInstallFirewall = async () => {
  if (activeInstallTask.value) {
    installTaskId.value = activeInstallTask.value.id
    installTaskVisible.value = true
    return
  }
  try {
    await ElMessageBox.confirm(
      status.value.repairRequired
        ? '系统将通过受校验脚本修复 firewalld 配置，完成后仍保持关闭。'
        : '系统将安装默认 firewalld，完成后保持关闭，首次启用时自动保护面板端口。',
      status.value.repairRequired ? '修复 firewalld' : '安装默认防火墙',
      { type: 'info', confirmButtonText: '开始', cancelButtonText: '取消' }
    )
  } catch {
    return
  }
  installSubmitting.value = true
  try {
    const { data } = await submitOperation('software.install', {
      key: 'firewalld',
      name: 'firewalld',
      repair: status.value.repairRequired
    })
    softwareTaskStore.acceptCreated(data, { key: 'firewalld', version: '1.0.0' })
    installTaskId.value = data.taskId
    installTaskVisible.value = true
    ElMessage.success(
      status.value.repairRequired ? 'firewalld 修复任务已创建' : 'firewalld 安装任务已创建'
    )
  } catch (error) {
    if (!isOperationCancelled(error)) throw error
  } finally {
    installSubmitting.value = false
  }
}

const switchTab = (tab: RuleTab) => {
  activeTab.value = tab
  pagination.currentPage = 1
  searchValue.value = ''
}

const openAddDialog = () => {
  if (activeTab.value === 'port') {
    portDialogIsAdd.value = true
    currentPortRule.value = {}
    portDialogVisible.value = true
    return
  }
  if (activeTab.value === 'forward') {
    forwardDialogIsAdd.value = true
    Object.assign(forwardForm, {
      id: 0, protocol: 'tcp', sourcePort: 0, destinationIp: '',
      destinationPort: 0, remark: '', enabled: true
    })
    forwardDialogVisible.value = true
    return
  }
  if (activeTab.value === 'ip' || activeTab.value === 'region') {
    ipDialogIsAdd.value = true
    Object.assign(ipForm, {
      id: 0, ips: '', strategy: 'deny',
      location: '', remark: '', expiresAt: undefined, enabled: true
    })
    ipDialogVisible.value = true
  }
}

const editRule = (row: FirewallRule) => {
  if (row.protected) return
  if (row.ruleType === 'port') {
    portDialogIsAdd.value = false
    currentPortRule.value = { ...row }
    portDialogVisible.value = true
    return
  }
  ipDialogIsAdd.value = false
  Object.assign(ipForm, {
    id: row.id,
    ips: row.ips.replaceAll(',', '\n'),
    strategy: row.strategy,
    location: row.location,
    remark: row.remark,
    expiresAt: row.expiresAt || undefined,
    enabled: row.state === 1
  })
  ipDialogVisible.value = true
}

const saveIPRule = async () => {
  const ips = ipForm.ips.split(/[\n,]+/).map((item) => item.trim()).filter(Boolean)
  if (!ips.length) {
    ElMessage.warning('请输入至少一个 IPv4 地址或 CIDR 网段')
    return
  }
  if (activeTab.value === 'region' && !ipForm.location.trim()) {
    ElMessage.warning('地区规则必须填写地区名称')
    return
  }
  ipSubmitting.value = true
  try {
    const payload = {
      id: ipDialogIsAdd.value ? undefined : ipForm.id,
      ruleType: activeTab.value,
      direction: 'in',
      protocol: 'all',
      strategy: ipForm.strategy,
      ips: ips.join(','),
      ports: '',
      state: ipForm.enabled ? 1 : 0,
      location: ipForm.location.trim(),
      remark: ipForm.remark.trim(),
      expiresAt: ipForm.expiresAt ? new Date(ipForm.expiresAt).toISOString() : null
    }
    if (ipDialogIsAdd.value) await Api.addFirewallRule(payload)
    else await Api.updateFirewallRule(payload)
    ElMessage.success(ipDialogIsAdd.value ? '规则已添加' : '规则已更新')
    ipDialogVisible.value = false
    await refreshAll()
  } finally {
    ipSubmitting.value = false
  }
}

const editForward = (row: PortForward) => {
  forwardDialogIsAdd.value = false
  Object.assign(forwardForm, {
    id: row.id,
    protocol: row.protocol,
    sourcePort: row.sourcePort,
    destinationIp: row.destinationIp,
    destinationPort: row.destinationPort,
    remark: row.remark,
    enabled: row.state === 1
  })
  forwardDialogVisible.value = true
}

const saveForward = async () => {
  if (
    forwardForm.sourcePort < 1 || forwardForm.sourcePort > 65535 ||
    forwardForm.destinationPort < 1 || forwardForm.destinationPort > 65535 ||
    !forwardForm.destinationIp.trim()
  ) {
    ElMessage.warning('请填写有效的源端口、目标 IPv4 和目标端口')
    return
  }
  forwardSubmitting.value = true
  try {
    const payload = {
      id: forwardDialogIsAdd.value ? undefined : forwardForm.id,
      protocol: forwardForm.protocol,
      sourcePort: forwardForm.sourcePort,
      destinationIp: forwardForm.destinationIp.trim(),
      destinationPort: forwardForm.destinationPort,
      state: forwardForm.enabled ? 1 : 0,
      remark: forwardForm.remark.trim()
    }
    if (forwardDialogIsAdd.value) await Api.addFirewallForward(payload)
    else await Api.updateFirewallForward(payload)
    ElMessage.success(forwardDialogIsAdd.value ? '端口转发已添加' : '端口转发已更新')
    forwardDialogVisible.value = false
    await refreshAll()
  } finally {
    forwardSubmitting.value = false
  }
}

const setRuleState = async (row: FirewallRule, enabled: boolean) => {
  try {
    await Api.setFirewallRuleState({ id: row.id, enabled })
    ElMessage.success(enabled ? '规则已启用' : '规则已停用')
  } finally {
    await refreshAll()
  }
}

const setForwardState = async (row: PortForward, enabled: boolean) => {
  try {
    await Api.setFirewallForwardState({ id: row.id, enabled })
    ElMessage.success(enabled ? '端口转发已启用' : '端口转发已停用')
  } finally {
    await refreshAll()
  }
}

const deleteRule = async (row: FirewallRule) => {
  if (row.protected) {
    ElMessage.warning('系统保护规则不能删除')
    return
  }
  try {
    await submitOperation('firewall.rule_change', { action: 'delete', id: row.id })
    ElMessage.success('规则已删除')
    await refreshAll()
  } catch (error) {
    if (!isOperationCancelled(error)) {
      await getData()
    }
  }
}

const deleteForward = async (row: PortForward) => {
  try {
    await ElMessageBox.confirm('确定删除这条端口转发吗？', '删除端口转发', {
      type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消'
    })
    await Api.deleteFirewallForward({ id: row.id })
    ElMessage.success('端口转发已删除')
    await refreshAll()
  } catch {
    // 用户取消时保持页面不变。
  }
}

const handleBatch = async () => {
  if (!batchAction.value || !selectedRows.value.length) {
    ElMessage.warning('请选择规则和批量操作')
    return
  }
  if (batchAction.value === 'delete') {
    try {
      await ElMessageBox.confirm(
        `确定删除选中的 ${selectedRows.value.length} 条规则吗？`,
        '批量删除',
        { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
      )
    } catch {
      return
    }
  }
  const { data } = await Api.batchFirewallRules({
    ids: selectedRows.value.map((row) => row.id),
    action: batchAction.value
  })
  ElMessage.success(`批量操作完成，共处理 ${data?.completed || 0} 条规则`)
  batchAction.value = ''
  await refreshAll()
}

const exportRules = async () => {
  if (!isRuleTab.value) return
  const apiBase = String(System.env.API || '/v1').replace(/\/$/, '')
  const response = await fetch(
    `${apiBase}/safe/rules/export?ruleType=${encodeURIComponent(activeTab.value)}`,
    { credentials: 'include', headers: { Accept: 'application/json' } }
  )
  if (!response.ok) throw new Error(`export failed: ${response.status}`)
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `oneinstack-firewall-${activeTab.value}.json`
  anchor.click()
  URL.revokeObjectURL(url)
  ElMessage.success('规则已导出')
}

const chooseImport = () => importInput.value?.click()

const importRules = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  try {
    const parsed = JSON.parse(await file.text())
    const rules = Array.isArray(parsed) ? parsed : parsed?.rules
    if (!Array.isArray(rules)) throw new Error('rules is not an array')
    const { data } = await Api.importFirewallRules({ rules })
    ElMessage.success(`成功导入 ${data?.imported || 0} 条规则`)
    await refreshAll()
  } catch {
    ElMessage.error('导入失败，请检查文件格式和规则内容')
  }
}

const loadAutoConfig = async () => {
  try {
    const { data } = await Api.getFirewallAutoBlock()
    Object.assign(autoConfig, data?.config || {})
  } catch {
    // 保留安全的默认关闭状态。
  }
}

const saveAutoConfig = async () => {
  autoSaving.value = true
  try {
    const { data } = await Api.saveFirewallAutoBlock({
      enabled: autoConfig.enabled,
      threshold: Number(autoConfig.threshold),
      windowMinutes: Number(autoConfig.windowMinutes),
      banMinutes: Number(autoConfig.banMinutes)
    })
    Object.assign(autoConfig, data?.config || {})
    ElMessage.success(autoConfig.enabled ? '自动封禁已启用' : '自动封禁已关闭')
  } finally {
    autoSaving.value = false
  }
}

const runAutoBlock = async () => {
  autoRunning.value = true
  try {
    const { data } = await Api.runFirewallAutoBlock()
    ElMessage.success(`检测完成，本次新增封禁 ${data?.blocked || 0} 个 IP`)
    await refreshAll()
  } finally {
    autoRunning.value = false
  }
}

const formatTime = (value?: string | null) => {
  if (!value) return '永久'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN', { hour12: false })
}

const handleCurrentChange = (page: number) => {
  pagination.currentPage = page
  getData()
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.currentPage = 1
  getData()
}

watch(activeTab, (tab) => {
  if (tab === 'auto_block') void loadAutoConfig()
  void getData()
})

watch(
  () => softwareTaskStore.terminalRevision,
  () => {
    const taskId = installTaskId.value
    const task = taskId ? softwareTaskStore.tasks[taskId] : undefined
    if (!task || !softwareTaskStore.isTerminal(task.status) || refreshedTerminalTasks.has(taskId)) return
    refreshedTerminalTasks.add(taskId)
    void refreshAll()
  }
)

onMounted(() => {
  void refreshAll()
  void softwareTaskStore.loadActive().then(() => {
    if (activeInstallTask.value) installTaskId.value = activeInstallTask.value.id
  })
})
</script>

<template>
  <div class="firewall-page">
    <section class="control-card" v-loading="statusLoading">
      <div class="switch-row">
        <div class="switch-control">
          <span class="control-label">防火墙开关</span>
          <el-switch
            v-model="status.enabled"
            :loading="firewallChanging"
            :disabled="!status.install || !status.canToggle || status.backend === 'iptables'"
            @change="handleFirewallChange"
          />
        </div>
        <span class="divider" />
        <div class="switch-control">
          <span class="control-label">禁 Ping</span>
          <el-switch
            v-model="status.pingBlocked"
            :loading="pingChanging"
            :disabled="!status.install || !status.enabled || !status.persistent"
            @change="handlePingChange"
          />
        </div>
        <span class="divider" />
        <el-button :loading="cleanupLoading" @click="handleCleanup">清理缓存</el-button>
        <div class="status-summary">
          <el-tag :type="status.install ? 'success' : 'danger'">
            {{ backendNames[status.backend] || status.backend }}
          </el-tag>
          <el-tag :type="status.panelPortProtected ? 'success' : 'warning'">
            面板端口 {{ status.panelPort }} {{ status.panelPortProtected ? '已保护' : '待保护' }}
          </el-tag>
        </div>
      </div>
    </section>

    <section v-if="!status.install || status.repairRequired" class="install-card">
      <div class="install-mark">FW</div>
      <div class="install-copy">
        <strong>{{ status.repairRequired ? 'firewalld 需要修复' : '未检测到受支持的防火墙' }}</strong>
        <span>
          {{
            status.repairRequired
              ? '检测到 firewalld 配置异常，修复完成后仍保持关闭。'
              : 'OneinStack Panel 默认安装 firewalld，安装完成后由管理员手动启用。'
          }}
        </span>
      </div>
      <el-button type="primary" :loading="installSubmitting" @click="handleInstallFirewall">
        {{ installButtonText }}
      </el-button>
    </section>

    <el-alert
      v-if="status.install && status.warning"
      class="status-warning"
      :title="status.warning"
      type="warning"
      :closable="false"
      show-icon
    />

    <nav class="rule-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="rule-tab"
        :class="{ active: activeTab === tab.key }"
        @click="switchTab(tab.key)"
      >
        <span>{{ tab.label }}</span>
        <strong>{{ status.counts[tab.countKey] }}</strong>
      </button>
    </nav>

    <section v-if="activeTab === 'auto_block'" class="auto-card">
      <div class="auto-heading">
        <div>
          <h3>SSH 恶意 IP 自动封禁</h3>
          <p>统计 SSH 失败登录次数，达到阈值后生成带过期时间的防火墙拒绝规则。</p>
        </div>
        <el-switch v-model="autoConfig.enabled" active-text="启用" inactive-text="关闭" />
      </div>
      <div class="auto-fields">
        <label>
          <span>触发次数</span>
          <el-input-number v-model="autoConfig.threshold" :min="3" :max="100" />
        </label>
        <label>
          <span>统计周期（分钟）</span>
          <el-input-number v-model="autoConfig.windowMinutes" :min="1" :max="1440" />
        </label>
        <label>
          <span>封禁时长（分钟）</span>
          <el-input-number v-model="autoConfig.banMinutes" :min="5" :max="525600" />
        </label>
        <div class="auto-actions">
          <el-button :loading="autoRunning" :disabled="!autoConfig.enabled" @click="runAutoBlock">
            立即检测
          </el-button>
          <el-button type="primary" :loading="autoSaving" @click="saveAutoConfig">保存配置</el-button>
        </div>
      </div>
      <p class="last-run">上次检测：{{ formatTime(autoConfig.lastRunAt) }}</p>
    </section>

    <section class="rules-card">
      <header class="toolbar">
        <div class="toolbar-actions">
          <el-button
            v-if="activeTab !== 'auto_block'"
            type="primary"
            :disabled="!canManageRules || (activeTab === 'forward' && status.backend !== 'firewalld')"
            @click="openAddDialog"
          >
            {{ activeTab === 'ip' ? '添加 IP 规则' : activeTab === 'region' ? '添加地区规则' : activeTab === 'forward' ? '添加端口转发' : '添加端口规则' }}
          </el-button>
          <template v-if="isRuleTab">
            <el-button :disabled="!canManageRules" @click="chooseImport">导入规则</el-button>
            <el-button @click="exportRules">导出规则</el-button>
          </template>
        </div>
        <search-input
          v-model="searchValue"
          class="rule-search"
          :placeholder="activeTab === 'forward' ? '请输入目标 IP / 备注' : '请输入 IP / 备注'"
          @search="getData"
        />
      </header>

      <el-table
        v-if="activeTab !== 'forward'"
        v-loading="tableLoading"
        :data="ruleRows"
        row-key="id"
        empty-text="暂无规则"
        @selection-change="selectedRows = $event"
      >
        <el-table-column type="selection" width="48" :selectable="(row: FirewallRule) => !row.protected" />

        <template v-if="activeTab === 'port'">
          <el-table-column label="方向" width="82">
            <template #default="{ row }">{{ row.direction === 'in' ? '入站' : '出站' }}</template>
          </el-table-column>
          <el-table-column label="协议" width="82">
            <template #default="{ row }">{{ row.protocol.toUpperCase() }}</template>
          </el-table-column>
          <el-table-column label="端口" prop="ports" min-width="120">
            <template #default="{ row }">{{ row.protocol === 'icmp' ? '—' : (row.ports || '全部') }}</template>
          </el-table-column>
          <el-table-column label="来源 / 目标" prop="ips" min-width="180">
            <template #default="{ row }">{{ row.ips === '0.0.0.0/0' ? '全部 IPv4' : row.ips }}</template>
          </el-table-column>
        </template>

        <template v-else>
          <el-table-column label="IP 地址" prop="ips" min-width="190" />
          <el-table-column label="IP 归属地" prop="location" min-width="130">
            <template #default="{ row }">{{ row.location || '未知' }}</template>
          </el-table-column>
        </template>

        <el-table-column label="策略" width="94">
          <template #default="{ row }">
            <el-tag :type="row.strategy === 'allow' ? 'success' : 'danger'" effect="plain">
              {{ row.strategy === 'allow' ? '放行' : '拒绝' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="92">
          <template #default="{ row }">
            <el-switch
              :model-value="row.state === 1"
              :disabled="row.protected || !canManageRules"
              @change="setRuleState(row, Boolean($event))"
            />
          </template>
        </el-table-column>
        <el-table-column label="备注" prop="remark" min-width="160">
          <template #default="{ row }">
            {{ row.remark || '—' }}
            <el-tag v-if="row.protected" size="small" type="warning" class="protected-tag">系统保护</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="添加时间" min-width="168">
          <template #default="{ row }">{{ formatTime(row.create_time) }}</template>
        </el-table-column>
        <el-table-column label="过期时间" min-width="168">
          <template #default="{ row }">{{ formatTime(row.expiresAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="128" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :disabled="row.protected || !canManageRules" @click="editRule(row)">编辑</el-button>
            <el-button link type="danger" :disabled="row.protected || !canManageRules" @click="deleteRule(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-table
        v-else
        v-loading="tableLoading"
        :data="forwardRows"
        row-key="id"
        empty-text="暂无端口转发"
      >
        <el-table-column label="协议" width="90">
          <template #default="{ row }">{{ row.protocol.toUpperCase() }}</template>
        </el-table-column>
        <el-table-column label="源端口" prop="sourcePort" min-width="120" />
        <el-table-column label="转发目标" min-width="220">
          <template #default="{ row }">{{ row.destinationIp }}:{{ row.destinationPort }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              :model-value="row.state === 1"
              :disabled="!canManageRules || status.backend !== 'firewalld'"
              @change="setForwardState(row, Boolean($event))"
            />
          </template>
        </el-table-column>
        <el-table-column label="备注" prop="remark" min-width="180">
          <template #default="{ row }">{{ row.remark || '—' }}</template>
        </el-table-column>
        <el-table-column label="添加时间" min-width="180">
          <template #default="{ row }">{{ formatTime(row.create_time) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="128" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :disabled="!canManageRules" @click="editForward(row)">编辑</el-button>
            <el-button link type="danger" :disabled="!canManageRules" @click="deleteForward(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <footer class="table-footer">
        <div v-if="isRuleTab" class="batch-bar">
          <el-select v-model="batchAction" placeholder="请选择批量操作" clearable>
            <el-option label="启用规则" value="enable" />
            <el-option label="停用规则" value="disable" />
            <el-option label="删除规则" value="delete" />
          </el-select>
          <el-button
            type="primary"
            plain
            :disabled="!batchAction || !selectedRows.length || !canManageRules"
            @click="handleBatch"
          >
            批量操作
          </el-button>
          <span v-if="selectedRows.length">已选择 {{ selectedRows.length }} 条</span>
        </div>
        <span v-else />
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @current-change="handleCurrentChange"
          @size-change="handleSizeChange"
        />
      </footer>
    </section>

    <input ref="importInput" class="file-input" type="file" accept="application/json,.json" @change="importRules" />

    <Addfirewall
      v-if="portDialogVisible"
      v-model="portDialogVisible"
      :type="portDialogIsAdd"
      :form-data="currentPortRule"
      :panel-port="status.panelPort"
      @saved="portDialogVisible = false; refreshAll()"
    />

    <el-dialog
      v-model="ipDialogVisible"
      width="600px"
      :close-on-click-modal="false"
      :title="`${ipDialogIsAdd ? '添加' : '编辑'}${activeTab === 'region' ? '地区' : ' IP'}规则`"
    >
      <el-form label-position="top" class="dialog-form">
        <el-form-item :label="activeTab === 'region' ? 'IPv4 / CIDR 网段' : 'IP 地址 / CIDR 网段'" required>
          <el-input
            v-model="ipForm.ips"
            type="textarea"
            :rows="4"
            placeholder="每行一个地址，例如：&#10;192.168.1.20&#10;10.0.0.0/24"
          />
        </el-form-item>
        <el-form-item v-if="activeTab === 'region'" label="地区名称" required>
          <el-input v-model="ipForm.location" placeholder="例如：中国大陆 / 北京" />
        </el-form-item>
        <el-form-item label="访问策略">
          <el-radio-group v-model="ipForm.strategy">
            <el-radio-button value="allow">放行</el-radio-button>
            <el-radio-button value="deny">拒绝</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="过期时间">
          <el-date-picker v-model="ipForm.expiresAt" type="datetime" class="full-width" placeholder="不设置表示永久有效" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="ipForm.remark" maxlength="200" show-word-limit placeholder="可选" />
        </el-form-item>
        <el-form-item label="规则状态">
          <el-switch v-model="ipForm.enabled" active-text="立即启用" />
        </el-form-item>
        <el-alert
          title="为避免服务器失联，不允许添加拒绝全部 IPv4 入站流量的规则。"
          type="warning"
          :closable="false"
          show-icon
        />
      </el-form>
      <template #footer>
        <el-button @click="ipDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="ipSubmitting" @click="saveIPRule">保存规则</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="forwardDialogVisible"
      width="560px"
      :close-on-click-modal="false"
      :title="forwardDialogIsAdd ? '添加端口转发' : '编辑端口转发'"
    >
      <el-form label-position="top" class="dialog-form">
        <div class="form-grid">
          <el-form-item label="协议">
            <el-select v-model="forwardForm.protocol" class="full-width">
              <el-option label="TCP" value="tcp" />
              <el-option label="UDP" value="udp" />
            </el-select>
          </el-form-item>
          <el-form-item label="源端口" required>
            <el-input-number v-model="forwardForm.sourcePort" :min="1" :max="65535" class="full-width" />
          </el-form-item>
        </div>
        <div class="form-grid">
          <el-form-item label="目标 IPv4" required>
            <el-input v-model="forwardForm.destinationIp" placeholder="192.168.1.10" />
          </el-form-item>
          <el-form-item label="目标端口" required>
            <el-input-number v-model="forwardForm.destinationPort" :min="1" :max="65535" class="full-width" />
          </el-form-item>
        </div>
        <el-form-item label="备注">
          <el-input v-model="forwardForm.remark" maxlength="200" show-word-limit placeholder="可选" />
        </el-form-item>
        <el-form-item label="规则状态">
          <el-switch v-model="forwardForm.enabled" active-text="立即启用" />
        </el-form-item>
        <el-alert
          title="端口转发当前由 firewalld 提供，不能占用面板管理端口。"
          type="info"
          :closable="false"
          show-icon
        />
      </el-form>
      <template #footer>
        <el-button @click="forwardDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="forwardSubmitting" @click="saveForward">保存转发</el-button>
      </template>
    </el-dialog>

    <InstallTaskDrawer v-model="installTaskVisible" :task-id="installTaskId" />
  </div>
</template>

<style scoped lang="less">
.firewall-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.control-card,
.rules-card,
.auto-card {
  border: 1px solid var(--border-color);
  border-radius: 16px;
  background: var(--surface-card);
  box-shadow: var(--shadow-card);
}

.control-card {
  padding: 18px 22px;
}

.switch-row,
.switch-control,
.status-summary,
.toolbar,
.toolbar-actions,
.table-footer,
.batch-bar,
.auto-heading,
.auto-actions {
  display: flex;
  align-items: center;
}

.switch-row {
  gap: 22px;
}

.switch-control {
  gap: 12px;
}

.control-label {
  color: var(--text-primary);
  font-weight: 600;
  white-space: nowrap;
}

.divider {
  width: 1px;
  height: 28px;
  background: var(--border-color);
}

.status-summary {
  margin-left: auto;
  gap: 8px;
}

.status-warning {
  border-radius: 12px;
}

.install-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  border: 1px solid rgba(var(--primary-color), 0.2);
  border-radius: 14px;
  background: rgba(var(--primary-color), 0.05);
}

.install-mark {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  flex: 0 0 44px;
  border-radius: 12px;
  color: rgb(var(--primary-color));
  background: rgba(var(--primary-color), 0.12);
  font-weight: 800;
}

.install-copy {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;

  strong {
    color: var(--text-primary);
    font-size: 15px;
  }

  span {
    color: var(--text-secondary);
    font-size: 13px;
  }
}

.rule-tabs {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-radius: 14px;
  background: var(--surface-card);
}

.rule-tab {
  min-height: 62px;
  padding: 12px 16px;
  border: 0;
  border-right: 1px solid var(--border-color);
  color: var(--text-secondary);
  background: transparent;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;

  &:last-child {
    border-right: 0;
  }

  span,
  strong {
    display: inline-block;
  }

  strong {
    margin-left: 7px;
    color: var(--text-primary);
  }

  &.active {
    color: rgb(var(--primary-color));
    background: rgba(var(--primary-color), 0.08);
    box-shadow: inset 0 -2px 0 rgb(var(--primary-color));

    strong {
      color: rgb(var(--primary-color));
    }
  }
}

.rules-card {
  overflow: hidden;
}

.toolbar {
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--border-color);
}

.toolbar-actions {
  gap: 10px;
}

.rule-search {
  width: min(360px, 38vw);
}

.table-footer {
  min-height: 72px;
  justify-content: space-between;
  gap: 20px;
  padding: 14px 20px;
  border-top: 1px solid var(--border-color);
}

.batch-bar {
  gap: 10px;

  .el-select {
    width: 190px;
  }

  span {
    color: var(--text-secondary);
    font-size: 13px;
  }
}

.protected-tag {
  margin-left: 7px;
}

.auto-card {
  padding: 22px;
}

.auto-heading {
  justify-content: space-between;
  gap: 20px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--border-color);

  h3 {
    margin: 0 0 6px;
    color: var(--text-primary);
    font-size: 17px;
  }

  p {
    margin: 0;
    color: var(--text-secondary);
    font-size: 13px;
  }
}

.auto-fields {
  display: grid;
  grid-template-columns: repeat(3, minmax(160px, 1fr)) auto;
  gap: 18px;
  align-items: end;
  padding-top: 18px;

  label {
    display: flex;
    flex-direction: column;
    gap: 8px;
    color: var(--text-secondary);
    font-size: 13px;
  }

  .el-input-number {
    width: 100%;
  }
}

.auto-actions {
  gap: 10px;
}

.last-run {
  margin: 14px 0 0;
  color: var(--text-secondary);
  font-size: 12px;
}

.dialog-form {
  padding: 4px 4px 0;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.full-width {
  width: 100%;
}

.file-input {
  display: none;
}

:deep(.el-table th.el-table__cell) {
  height: 50px;
  color: var(--text-secondary);
  background: var(--surface-muted);
  font-weight: 600;
}

:deep(.el-table td.el-table__cell) {
  padding: 14px 0;
}

@media (max-width: 1100px) {
  .rule-tabs {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .rule-tab {
    border-bottom: 1px solid var(--border-color);
  }

  .auto-fields {
    grid-template-columns: repeat(2, minmax(160px, 1fr));
  }
}

@media (max-width: 760px) {
  .switch-row,
  .toolbar,
  .table-footer,
  .auto-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .switch-row {
    gap: 14px;
  }

  .divider {
    width: 100%;
    height: 1px;
  }

  .status-summary {
    margin-left: 0;
  }

  .rule-tabs,
  .auto-fields,
  .form-grid {
    grid-template-columns: 1fr;
  }

  .rule-search {
    width: 100%;
  }

  .batch-bar {
    flex-wrap: wrap;
  }
}
</style>
