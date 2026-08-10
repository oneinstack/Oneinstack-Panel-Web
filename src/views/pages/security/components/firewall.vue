<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

import { Api } from '@/api/Api'
import SearchInput from '@/components/search-input.vue'
import softwareTaskStore from '@/sstore/softwareTask'
import InstallTaskDrawer from '../../software/components/InstallTaskDrawer.vue'
import Addfirewall from './addfirewall.vue'
import { isOperationCancelled, submitOperation } from '@/utils/operationPreview'
import i18n from '@/lang'

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

const t = (key: string, fallback?: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params)
  return value && value !== key ? value : fallback || key
}

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
  none: t('security.backendNotDetected', 'Not detected')
}

const activeInstallTask = computed(() => softwareTaskStore.activeForKey('firewalld'))
const installButtonText = computed(() =>
  activeInstallTask.value
    ? t('security.viewTaskProgress', 'View task progress')
    : status.value.repairRequired
    ? t('security.repairFirewalld', 'Repair firewalld')
    : t('security.installFirewalld', 'Install firewalld')
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
    await submitOperation('firewall.toggle', { enabled })
    ElMessage.success(enabled ? t('security.firewallEnabled', 'Firewall enabled') : t('security.firewallDisabled', 'Firewall disabled'))
    await Promise.all([getFirewallInfo(), getData()])
  } catch (error) {
    status.value.enabled = previous
    if (!isOperationCancelled(error)) {
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
    await submitOperation('firewall.rule_change', { action: 'set_ping', blocked })
    ElMessage.success(blocked ? t('security.pingBlocked', 'External Ping blocked') : t('security.pingAllowed', 'External Ping allowed'))
    await getFirewallInfo()
  } catch (error) {
    status.value.pingBlocked = previous
    if (!isOperationCancelled(error)) {
      await getFirewallInfo()
    }
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
    ElMessage.success(status.value.repairRequired ? t('security.repairTaskCreated', 'firewalld repair task created') : t('security.installTaskCreated', 'firewalld install task created'))
  } catch (error) {
    if (!isOperationCancelled(error)) throw error
    return
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
    ElMessage.warning(t('security.protectedRuleDeleteDenied', 'System protected rules cannot be deleted'))
    return
  }
  try {
    await submitOperation('firewall.rule_change', { action: 'delete', id: row.id })
    ElMessage.success(t('security.ruleDeleted', 'Rule deleted'))
    await Promise.all([getData(), getFirewallInfo()])
  } catch (error) {
    if (!isOperationCancelled(error)) {
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
          <span>{{ t('security.firewall', 'Firewall') }}</span>
          <el-switch
            v-model="status.enabled"
            :loading="firewallChanging"
            :disabled="!status.install || !status.canToggle || status.backend === 'iptables' || firewallChanging"
            :title="!status.canToggle ? status.warning : ''"
            @change="handleFirewallChange"
          />
        </div>
        <div class="switch-item">
          <span>{{ t('security.blockPing', 'Block Ping') }}</span>
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
          {{ status.persistent ? t('security.rulesPersistent', 'Rules persistent') : t('security.notPersistent', 'Not persistent') }}
        </el-tag>
        <el-tag :type="status.panelPortProtected ? 'success' : 'warning'">
          {{ status.panelPortProtected ? t('security.panelPortProtected', 'Panel port {port} protected', { port: status.panelPort }) : t('security.panelPortUnprotected', 'Panel port {port} pending protection', { port: status.panelPort }) }}
        </el-tag>
        <span class="rule-count">{{ t('security.managedRuleCount', '{count} panel-managed rules', { count: status.managedRuleCount }) }}</span>
      </div>
    </div>

    <section v-if="!status.install || status.repairRequired" class="firewall-install-card">
      <div class="firewall-install-card__mark">FW</div>
      <div class="firewall-install-card__copy">
        <strong>
          {{ status.repairRequired ? t('security.firewalldRepairRequired', 'firewalld repair required') : t('security.unsupportedFirewall', 'No supported firewall detected') }}
        </strong>
        <span>
          {{
            status.repairRequired
              ? t('security.firewalldRepairDescription', 'The system protocol database or offline configuration is incomplete. Repair progress can be viewed in real time and will not enable the firewall automatically.')
              : t('security.firewalldInstallDescription', 'OneinStack Panel uses firewalld by default. Installation progress can be viewed in real time and will not enable the firewall automatically.')
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
          {{ t('security.addRule', 'Add rule') }}
        </el-button>
        <el-button-group>
          <el-button :type="filterDirection === '' ? 'primary' : 'default'" @click="handleDirection('')">
            {{ t('security.allDirections', 'All directions') }}
          </el-button>
          <el-button :type="filterDirection === 'in' ? 'primary' : 'default'" @click="handleDirection('in')">
            {{ t('security.inbound', 'Inbound') }}
          </el-button>
          <el-button :type="filterDirection === 'out' ? 'primary' : 'default'" @click="handleDirection('out')">
            {{ t('security.outbound', 'Outbound') }}
          </el-button>
        </el-button-group>
      </el-space>
      <search-input v-model="searchValue" :placeholder="t('security.searchRemark', 'Search remarks')" @search="getData" />
    </div>

    <div class="box2">
      <el-table
        v-loading="tableLoading"
        :data="tableData"
        border
        row-key="id"
        :empty-text="t('security.noRules', 'No rules')"
        :header-cell-style="{ 'text-align': 'center' }"
      >
        <el-table-column :label="t('security.direction', 'Direction')" width="90" align="center">
          <template #default="{ row }">{{ row.direction === 'in' ? t('security.inbound', 'Inbound') : t('security.outbound', 'Outbound') }}</template>
        </el-table-column>
        <el-table-column :label="t('security.protocol', 'Protocol')" width="90" align="center">
          <template #default="{ row }">{{ row.protocol.toUpperCase() }}</template>
        </el-table-column>
        <el-table-column :label="t('security.strategy', 'Policy')" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.strategy === 'allow' ? 'success' : 'danger'">
              {{ row.strategy === 'allow' ? t('security.allow', 'Allow') : t('security.reject', 'Reject') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="ports" :label="t('security.ports', 'Ports')" min-width="120">
          <template #default="{ row }">{{ row.protocol === 'icmp' ? '—' : (row.ports || t('security.allPorts', 'All')) }}</template>
        </el-table-column>
        <el-table-column prop="ips" :label="t('security.sourceTarget', 'Source/Target')" min-width="180">
          <template #default="{ row }">{{ row.ips === '0.0.0.0/0' ? t('security.allIpv4', 'All IPv4') : row.ips }}</template>
        </el-table-column>
        <el-table-column prop="remark" :label="t('security.remark', 'Remark')" min-width="180">
          <template #default="{ row }">
            <span>{{ row.remark || '—' }}</span>
            <el-tag v-if="row.protected" class="protected-tag" size="small" type="warning">{{ t('security.systemProtected', 'System protected') }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="backend" :label="t('security.backend', 'Backend')" width="100" align="center" />
        <el-table-column :label="t('common.action', 'Action')" width="130" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" :disabled="row.protected || !status.enabled" @click="handleSet(row)">
              {{ t('common.edit', 'Edit') }}
            </el-button>
            <el-button link type="danger" size="small" :disabled="row.protected || !status.enabled" @click="handleDelete(row)">
              {{ t('common.delete', 'Delete') }}
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
