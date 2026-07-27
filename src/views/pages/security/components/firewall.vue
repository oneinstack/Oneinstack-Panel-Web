<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import { Api } from '@/api/Api'
import SearchInput from '@/components/search-input.vue'
import softwareTaskStore from '@/sstore/softwareTask'
import InstallTaskDrawer from '../../software/components/InstallTaskDrawer.vue'
import Addfirewall from './addfirewall.vue'

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
}

interface FirewallRule {
  id: number
  direction: 'in' | 'out'
  protocol: 'tcp' | 'udp' | 'icmp'
  strategy: 'allow' | 'deny'
  ips: string
  ports: string
  state: number
  remark: string
  backend: string
  protected: boolean
}

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
  managedRuleCount: 0
})

const status = ref<FirewallStatus>(defaultStatus())
const tableData = ref<FirewallRule[]>([])
const statusLoading = ref(false)
const tableLoading = ref(false)
const firewallChanging = ref(false)
const pingChanging = ref(false)
const installSubmitting = ref(false)
const installTaskVisible = ref(false)
const installTaskId = ref('')
const refreshedTerminalTasks = new Set<string>()
const addRuleModal = ref(false)
const isAdd = ref(true)
const currentRow = ref<Partial<FirewallRule>>({})
const filterDirection = ref('')
const searchValue = ref('')
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

const backendNames: Record<string, string> = {
  ufw: 'UFW',
  firewalld: 'firewalld',
  iptables: 'iptables',
  none: '未检测到'
}

const activeInstallTask = computed(() => softwareTaskStore.activeForKey('firewalld'))
const installButtonText = computed(() =>
  activeInstallTask.value
    ? '查看任务进度'
    : status.value.repairRequired
    ? '修复 firewalld'
    : '安装 firewalld'
)

const getFirewallInfo = async () => {
  statusLoading.value = true
  try {
    const { data } = await Api.getFirewallInfo({})
    status.value = { ...defaultStatus(), ...(data?.info || {}) }
  } catch {
    status.value = defaultStatus()
  } finally {
    statusLoading.value = false
  }
}

const getData = async () => {
  tableLoading.value = true
  try {
    const { data } = await Api.getFirewallRule({
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
      direction: filterDirection.value,
      q: searchValue.value
    })
    tableData.value = data?.data || []
    pagination.total = data?.total || 0
  } catch {
    tableData.value = []
    pagination.total = 0
  } finally {
    tableLoading.value = false
  }
}

const handleFirewallChange = async (value: string | number | boolean) => {
  const enabled = Boolean(value)
  const previous = !enabled
  firewallChanging.value = true
  try {
    let confirm = ''
    if (!enabled) {
      const { value } = await ElMessageBox.prompt(
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
      confirm = value
    }
    await Api.setFirewallEnabled({ enabled, confirm })
    ElMessage.success(enabled ? '防火墙已启用' : '防火墙已关闭')
    await Promise.all([getFirewallInfo(), getData()])
  } catch (error) {
    status.value.enabled = previous
    if (error !== 'cancel' && error !== 'close') {
      await getFirewallInfo()
    }
  } finally {
    firewallChanging.value = false
  }
}

const handlePingChange = async (value: string | number | boolean) => {
  const blocked = Boolean(value)
  const previous = !blocked
  pingChanging.value = true
  try {
    await Api.setFirewallPing({ blocked })
    ElMessage.success(blocked ? '已禁止外部 Ping' : '已允许外部 Ping')
    await getFirewallInfo()
  } catch {
    status.value.pingBlocked = previous
    await getFirewallInfo()
  } finally {
    pingChanging.value = false
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
        ? '系统将通过受校验脚本补齐协议数据库并重新校验 firewalld 配置。修复完成后仍会保持关闭。'
        : '系统将通过受校验的独立脚本安装 firewalld。安装完成后会保持关闭，首次启用时面板会先放行当前管理端口。',
      status.value.repairRequired ? '修复 firewalld' : '安装默认防火墙',
      {
        type: 'info',
        confirmButtonText: status.value.repairRequired ? '开始修复' : '开始安装',
        cancelButtonText: '取消'
      }
    )
  } catch {
    return
  }
  installSubmitting.value = true
  try {
    const { data } = await Api.installFirewall()
    softwareTaskStore.acceptCreated(data, { key: 'firewalld', version: '1.0.0' })
    installTaskId.value = data.taskId
    installTaskVisible.value = true
    ElMessage.success(status.value.repairRequired ? 'firewalld 修复任务已创建' : 'firewalld 安装任务已创建')
  } finally {
    installSubmitting.value = false
  }
}

const handleAdd = () => {
  isAdd.value = true
  currentRow.value = {}
  addRuleModal.value = true
}

const handleSet = (row: FirewallRule) => {
  if (row.protected) return
  isAdd.value = false
  currentRow.value = { ...row }
  addRuleModal.value = true
}

const handleDelete = async (row: FirewallRule) => {
  if (row.protected) {
    ElMessage.warning('系统保护规则不能删除')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确定删除 ${row.protocol.toUpperCase()} ${row.ports || '全部端口'} 规则吗？系统规则和面板记录会一起删除。`,
      '删除防火墙规则',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await Api.deleteFirewallRule({ id: row.id })
    ElMessage.success('规则已删除')
    await Promise.all([getData(), getFirewallInfo()])
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      await getData()
    }
  }
}

const handleDirection = (value: string) => {
  filterDirection.value = value
  pagination.currentPage = 1
  getData()
}

const handleCurrentChange = (page: number) => {
  pagination.currentPage = page
  getData()
}

const handleDialogClose = (visible: boolean) => {
  addRuleModal.value = visible
}

const handleRuleSaved = async () => {
  addRuleModal.value = false
  await Promise.all([getData(), getFirewallInfo()])
}

onMounted(() => {
  getData()
  getFirewallInfo()
  softwareTaskStore.loadActive().then(() => {
    if (activeInstallTask.value) {
      installTaskId.value = activeInstallTask.value.id
    }
  }).catch(() => undefined)
})

watch(
  () => softwareTaskStore.terminalRevision,
  () => {
    const taskId = installTaskId.value
    const task = taskId ? softwareTaskStore.tasks[taskId] : undefined
    if (!task || !softwareTaskStore.isTerminal(task.status) || refreshedTerminalTasks.has(taskId)) return
    refreshedTerminalTasks.add(taskId)
    void Promise.all([getFirewallInfo(), getData()])
  }
)
</script>

<template>
  <div>
    <div class="status-card" v-loading="statusLoading">
      <div class="status-switches">
        <div class="switch-item">
          <span>防火墙</span>
          <el-switch
            v-model="status.enabled"
            :loading="firewallChanging"
            :disabled="!status.install || !status.canToggle || status.backend === 'iptables' || firewallChanging"
            :title="!status.canToggle ? status.warning : ''"
            @change="handleFirewallChange"
          />
        </div>
        <div class="switch-item">
          <span>禁止 Ping</span>
          <el-switch
            v-model="status.pingBlocked"
            :loading="pingChanging"
            :disabled="!status.install || !status.enabled || !status.persistent || pingChanging"
            @change="handlePingChange"
          />
        </div>
      </div>
      <div class="status-meta">
        <el-tag :type="status.install ? 'success' : 'danger'">
          {{ backendNames[status.backend] || status.backend }}
        </el-tag>
        <el-tag :type="status.persistent ? 'success' : 'warning'">
          {{ status.persistent ? '规则持久化' : '未持久化' }}
        </el-tag>
        <el-tag :type="status.panelPortProtected ? 'success' : 'warning'">
          面板端口 {{ status.panelPort }}
          {{ status.panelPortProtected ? '已保护' : '待保护' }}
        </el-tag>
        <span class="rule-count">面板管理规则 {{ status.managedRuleCount }} 条</span>
      </div>
    </div>

    <section v-if="!status.install || status.repairRequired" class="firewall-install-card">
      <div class="firewall-install-card__mark">FW</div>
      <div class="firewall-install-card__copy">
        <strong>
          {{ status.repairRequired ? 'firewalld 需要修复' : '未检测到受支持的防火墙' }}
        </strong>
        <span>
          {{
            status.repairRequired
              ? '检测到系统协议数据库或离线配置不完整。修复过程可实时查看，完成后不会自动开启。'
              : 'OneinStack Panel 默认使用 firewalld。安装过程可实时查看，安装后不会自动开启。'
          }}
        </span>
      </div>
      <el-button
        type="primary"
        :loading="installSubmitting"
        @click="handleInstallFirewall"
      >
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

    <div class="tool-bar">
      <el-space class="btn-group">
        <el-button type="primary" :disabled="!status.install || !status.enabled || !status.persistent" @click="handleAdd">
          添加规则
        </el-button>
        <el-button-group>
          <el-button :type="filterDirection === '' ? 'primary' : 'default'" @click="handleDirection('')">
            所有方向
          </el-button>
          <el-button :type="filterDirection === 'in' ? 'primary' : 'default'" @click="handleDirection('in')">
            入站
          </el-button>
          <el-button :type="filterDirection === 'out' ? 'primary' : 'default'" @click="handleDirection('out')">
            出站
          </el-button>
        </el-button-group>
      </el-space>
      <search-input v-model="searchValue" placeholder="按备注搜索" @search="getData" />
    </div>

    <div class="box2">
      <el-table
        v-loading="tableLoading"
        :data="tableData"
        border
        row-key="id"
        empty-text="暂无规则"
        :header-cell-style="{ 'text-align': 'center' }"
      >
        <el-table-column label="方向" width="90" align="center">
          <template #default="{ row }">{{ row.direction === 'in' ? '入站' : '出站' }}</template>
        </el-table-column>
        <el-table-column label="协议" width="90" align="center">
          <template #default="{ row }">{{ row.protocol.toUpperCase() }}</template>
        </el-table-column>
        <el-table-column label="策略" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.strategy === 'allow' ? 'success' : 'danger'">
              {{ row.strategy === 'allow' ? '放行' : '拒绝' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="ports" label="端口" min-width="120">
          <template #default="{ row }">{{ row.protocol === 'icmp' ? '—' : (row.ports || '全部') }}</template>
        </el-table-column>
        <el-table-column prop="ips" label="来源/目标" min-width="180">
          <template #default="{ row }">{{ row.ips === '0.0.0.0/0' ? '全部 IPv4' : row.ips }}</template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="180">
          <template #default="{ row }">
            <span>{{ row.remark || '—' }}</span>
            <el-tag v-if="row.protected" class="protected-tag" size="small" type="warning">系统保护</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="backend" label="后端" width="100" align="center" />
        <el-table-column label="操作" width="130" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" :disabled="row.protected || !status.enabled" @click="handleSet(row)">
              编辑
            </el-button>
            <el-button link type="danger" size="small" :disabled="row.protected || !status.enabled" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          :page-size="pagination.pageSize"
          background
          layout="total, prev, pager, next"
          :total="pagination.total"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>

  <Addfirewall
    v-if="addRuleModal"
    v-model="addRuleModal"
    :type="isAdd"
    :form-data="currentRow"
    :panel-port="status.panelPort"
    @close="handleDialogClose"
    @saved="handleRuleSaved"
  />

  <InstallTaskDrawer
    v-model="installTaskVisible"
    :task-id="installTaskId"
  />
</template>

<style scoped lang="less">
.status-card {
  display: flex;
  min-height: 74px;
  padding: 16px 20px;
  margin-bottom: 12px;
  border-radius: 6px;
  background: rgba(var(--category-item-bg-color), 0.6);
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.status-switches,
.status-meta,
.switch-item {
  display: flex;
  align-items: center;
}

.status-switches {
  gap: 30px;
}

.switch-item {
  gap: 10px;
  white-space: nowrap;
}

.status-meta {
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.rule-count {
  color: var(--font-color-black);
  font-size: 13px;
}

.status-warning {
  margin-bottom: 12px;
}

.firewall-install-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  margin-bottom: 16px;
  border: 1px solid rgba(var(--primary-color), 0.2);
  border-radius: 14px;
  background:
    radial-gradient(circle at 0 0, rgba(var(--primary-color), 0.12), transparent 38%),
    var(--surface-card);
  box-shadow: var(--shadow-card);

  &__mark {
    width: 44px;
    height: 44px;
    flex: 0 0 44px;
    display: grid;
    place-items: center;
    border-radius: 12px;
    color: rgb(var(--primary-color));
    background: rgba(var(--primary-color), 0.11);
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.08em;
  }

  &__copy {
    min-width: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;

    strong {
      color: var(--text-primary);
      font-size: 15px;
    }

    span {
      color: var(--text-secondary);
      font-size: 13px;
      line-height: 1.6;
    }
  }
}

.protected-tag {
  margin-left: 8px;
}

@media (max-width: 900px) {
  .status-card {
    align-items: flex-start;
    flex-direction: column;
  }

  .status-meta {
    justify-content: flex-start;
  }

  .firewall-install-card {
    align-items: flex-start;
    flex-wrap: wrap;

    .el-button {
      width: 100%;
    }
  }
}
</style>
