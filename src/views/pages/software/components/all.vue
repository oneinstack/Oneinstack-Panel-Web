<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox, FormInstance } from 'element-plus'
import { ChildEmits, ChildProps } from '../index.vue'
import CustomDrawer from '@/components/custom-drawer.vue'
import CustomForm, { type FormItem, type Props as FormProps } from '@/components/custom-form.vue'
import { Api } from '@/api/Api'
import softwareTaskStore, { type SoftwareTask } from '@/sstore/softwareTask'
import InstallTaskDrawer from './InstallTaskDrawer.vue'
import ServiceConfigDrawer from './ServiceConfigDrawer.vue'

type ServiceAction = 'start' | 'stop' | 'restart' | 'reload'

interface ComponentServiceStatus {
  component: string
  softwareKey: string
  displayName: string
  serviceName: string
  installed: boolean
  recordedVersion?: string
  runtimeVersion?: string
  state: 'not_installed' | 'running' | 'stopped' | 'failed' | 'transitioning' | 'unknown'
  activeState?: string
  subState?: string
  canReload: boolean
  availableActions: ServiceAction[]
  busy: boolean
  activeTaskId?: string
  probeError?: string
}

const emit = defineEmits<ChildEmits>()
const props = withDefaults(defineProps<ChildProps>(), {
  list: () => []
})

const formRef = ref<FormInstance | null>(null)
const submitting = ref(false)
const serviceLoading = ref(false)
const serviceStatuses = ref<Record<string, ComponentServiceStatus>>({})
const selectedItem = ref<any>()
const taskDrawer = reactive({
  show: false,
  taskId: ''
})
const configDrawer = reactive({
  show: false,
  component: ''
})

const installForm = reactive<FormProps['data']>({
  value: {
    key: '',
    version: ''
  },
  items: []
})

const drawer = reactive({
  show: false,
  title: '安装参数',
  onClose: () => {
    formRef.value?.clearValidate()
    drawer.show = false
  },
  onConfirm: () => {
    formRef.value?.validate(async (valid: boolean) => {
      if (!valid) return
      await handleInstall()
    })
  }
})

const versionDialog = reactive({
  show: false,
  currentItem: null as any,
  onClose: () => {
    versionDialog.show = false
    versionDialog.currentItem = null
  },
  onConfirm: () => {
    const item = versionDialog.currentItem
    versionDialog.show = false
    openInstallForm(item)
  }
})

const recentTasks = computed(() => softwareTaskStore.recentTasks())

const activeTask = (item: any) => softwareTaskStore.activeForKey(item.key)

const taskStatusLabel = (task?: SoftwareTask) => {
  if (!task) return ''
  const labels: Record<string, string> = {
    queued: '排队中',
    resolving: '获取安装包',
    prechecking: '环境预检',
    installing: '安装中',
    upgrading: '升级中',
    uninstalling: '卸载中',
    starting: '启动中',
    stopping: '停止中',
    restarting: '重启中',
    reloading: '重载中',
    configuring: '配置中',
    verifying: '验证中',
    finalizing: '即将完成',
    canceling: '取消中',
    rolling_back: '回滚中'
  }
  return labels[task.status] || task.status
}

const serviceStatus = (item: any) => serviceStatuses.value[item.key]
const isInstalled = (item: any) =>
  item.installed === true || serviceStatus(item)?.installed === true

const serviceStateLabel = (status?: ComponentServiceStatus) => {
  if (!status) return '正在读取状态'
  if (status.probeError) return status.probeError
  const labels: Record<string, string> = {
    running: '运行中',
    stopped: '已停止',
    failed: '运行失败',
    transitioning: '状态切换中',
    unknown: '状态未知',
    not_installed: '未安装'
  }
  return labels[status.state] || '状态未知'
}

const serviceStateType = (status?: ComponentServiceStatus) => {
  if (!status || status.state === 'unknown' || status.state === 'transitioning') return 'warning'
  if (status.state === 'running') return 'success'
  if (status.state === 'failed') return 'danger'
  return 'info'
}

const loadServiceStatuses = async () => {
  serviceLoading.value = true
  try {
    const { data } = await Api.getComponentServices()
    serviceStatuses.value = Object.fromEntries(
      ((data || []) as ComponentServiceStatus[]).map((status) => [status.softwareKey, status])
    )
  } finally {
    serviceLoading.value = false
  }
}

const serviceActionAllowed = (status: ComponentServiceStatus | undefined, action: ServiceAction) =>
  !!status?.availableActions?.includes(action) &&
  !(action === 'reload' && !status.canReload)

const handleServiceAction = async (item: any, action: ServiceAction) => {
  const status = serviceStatus(item)
  if (!status || !serviceActionAllowed(status, action) || submitting.value) return
  if (status.activeTaskId) {
    showTask(status.activeTaskId)
    return
  }
  const actionLabels: Record<ServiceAction, string> = {
    start: '启动',
    stop: '停止',
    restart: '重启',
    reload: '平滑重载'
  }
  try {
    await ElMessageBox.confirm(
      `确定${actionLabels[action]} ${status.displayName} 服务？该操作将通过已签名的组件脚本执行并记录完整任务日志。`,
      `确认${actionLabels[action]}服务`,
      {
        type: action === 'stop' ? 'warning' : 'info',
        confirmButtonText: `确认${actionLabels[action]}`,
        cancelButtonText: '取消'
      }
    )
  } catch {
    return
  }
  submitting.value = true
  try {
    const { data: result } = await Api.runComponentServiceAction(status.component, { action })
    softwareTaskStore.acceptCreated(result, {
      key: status.softwareKey,
      version: status.recordedVersion || item.install_version || '',
      action
    })
    taskDrawer.taskId = result.taskId
    taskDrawer.show = true
    serviceStatuses.value[status.softwareKey] = {
      ...status,
      busy: true,
      activeTaskId: result.taskId
    }
    ElMessage.success(`${actionLabels[action]}任务已创建，可在后台继续运行`)
  } finally {
    submitting.value = false
  }
}

const openServiceConfiguration = (item: any) => {
  const status = serviceStatus(item)
  if (!status) return
  const task = activeTask(item)
  if (task || status.activeTaskId) {
    showTask(task?.id || status.activeTaskId!)
    return
  }
  configDrawer.component = status.component
  configDrawer.show = true
}

const handleConfigurationTaskCreated = (result: any) => {
  const status = Object.values(serviceStatuses.value)
    .find((candidate) => candidate.component === result.component)
  softwareTaskStore.acceptCreated(result, {
    key: result.softwareKey,
    version: result.version,
    action: 'configure'
  })
  taskDrawer.taskId = result.taskId
  taskDrawer.show = true
  if (status) {
    serviceStatuses.value[status.softwareKey] = {
      ...status,
      busy: true,
      activeTaskId: result.taskId
    }
  }
}

const handleInstallClick = (item: any) => {
  if (activeTask(item)) {
    showTask(activeTask(item)!.id)
    return
  }
  selectedItem.value = item
  installForm.value.key = item.key
  installForm.value.version = item.install_version || item.versions?.[0] || ''
  if (item.versions?.length > 1) {
    versionDialog.currentItem = item
    versionDialog.show = true
    return
  }
  openInstallForm(item)
}

const openInstallForm = (item: any) => {
  if (!item) return
  selectedItem.value = item
  installForm.value.key = item.key
  installForm.value.version = installForm.value.version || item.versions?.[0] || ''
  // MySQL uses fixed local defaults (root / 3306) and a server-generated
  // password. Never render legacy catalog fields for those secrets.
  const config = item.key === 'db' ? [] : parseParams(item.params)
  installForm.items = config.map<FormItem>((field: any) => ({
    label: field.value || field.name || field.key,
    type: ['pwd', 'password', 'secret'].some((value) =>
      String(field.key || field.type).toLowerCase().includes(value)
    ) ? 'password' : 'input',
    prop: field.key,
    rules: [{
      required: field.required === true || field.required === 'true',
      message: `请输入${field.value || field.name || field.key}`,
      trigger: 'blur'
    }]
  }))
  if (installForm.items.length === 0) {
    void handleInstall()
    return
  }
  drawer.title = `安装 ${item.name} ${installForm.value.version}`
  drawer.show = true
}

const parseParams = (params: any): any[] => {
  if (!params) return []
  if (Array.isArray(params)) return params
  try {
    return JSON.parse(params)
  } catch {
    return []
  }
}

const handleInstall = async () => {
  if (submitting.value) return
  submitting.value = true
  const request = { ...installForm.value }
  try {
    const { data: result } = await Api.installSoft(request)
    softwareTaskStore.acceptCreated(result, request)
    taskDrawer.taskId = result.taskId
    taskDrawer.show = true
    drawer.show = false
    clearSecretFields()
  } finally {
    submitting.value = false
  }
}

const clearSecretFields = () => {
  Object.keys(installForm.value).forEach((key) => {
    const normalized = key.toLowerCase()
    if (normalized.includes('pwd') || normalized.includes('password') ||
      normalized.includes('secret') || normalized.includes('token')) {
      installForm.value[key] = ''
    }
  })
}

const showTask = (taskId: string) => {
  taskDrawer.taskId = taskId
  taskDrawer.show = true
}

const retryTask = (taskId: string) => {
  const task = softwareTaskStore.tasks[taskId]
  taskDrawer.show = false
  const item = props.list.find((candidate: any) => candidate.key === task?.softwareKey)
  if (item) {
    installForm.value.version = task.requestedVersion
    openInstallForm(item)
  }
}

const handleUninstall = async (item: any) => {
  if (submitting.value) return
  const version = item.install_version || item.versions?.[0] || ''
  try {
    await ElMessageBox.confirm(
      `确定卸载 ${item.name} ${version}？组件程序和服务配置将被移除，网站、数据库等业务数据默认保留。`,
      '确认卸载软件',
      {
        type: 'warning',
        confirmButtonText: '确认卸载',
        cancelButtonText: '取消'
      }
    )
  } catch {
    return
  }

  submitting.value = true
  try {
    const request = { name: item.key, key: item.key, version }
    const { data: result } = await Api.removeSoft(request)
    softwareTaskStore.acceptCreated(result, request)
    taskDrawer.taskId = result.taskId
    taskDrawer.show = true
    ElMessage.success('卸载任务已创建，可在后台继续运行')
  } finally {
    submitting.value = false
  }
}

const handleSoftwareAction = (item: any) => {
  const task = activeTask(item)
  if (task) {
    showTask(task.id)
    return
  }
  if (isInstalled(item)) {
    void handleUninstall(item)
    return
  }
  handleInstallClick(item)
}

watch(
  () => softwareTaskStore.terminalRevision,
  () => {
    emit('refresh')
    void loadServiceStatuses().catch(() => undefined)
  }
)

onMounted(() => {
  void softwareTaskStore.loadAll()
  void loadServiceStatuses().catch(() => undefined)
})
</script>

<template>
  <div>
    <div class="section-header">
      <div class="title">应用</div>
      <el-popover v-if="recentTasks.length" placement="bottom-end" width="360" trigger="click">
        <template #reference>
          <el-button plain>
            软件任务
            <el-badge
              :value="recentTasks.filter((task) => !softwareTaskStore.isTerminal(task.status)).length"
              :hidden="!recentTasks.some((task) => !softwareTaskStore.isTerminal(task.status))"
              class="task-badge"
            />
          </el-button>
        </template>
        <div class="task-center-list">
          <div v-if="softwareTaskStore.stats" class="task-stats">
            <span>近 30 天 {{ softwareTaskStore.stats.total }} 个任务</span>
            <strong>成功率 {{ softwareTaskStore.stats.successRate }}%</strong>
          </div>
          <button
            v-for="task in recentTasks"
            :key="task.id"
            class="task-center-item"
            type="button"
            @click="showTask(task.id)"
          >
            <span>
              <strong>{{ task.component }}</strong>
              <small>{{ task.requestedVersion }} · {{ task.message }}</small>
            </span>
            <span>{{ task.progress }}%</span>
          </button>
        </div>
      </el-popover>
    </div>

    <div class="list">
      <template v-if="list.length">
        <div v-for="item in list" :key="item.key" class="item">
          <div class="item-inner">
            <div class="sundry">
              <div class="icon">
                <img :src="item.icon" alt="" />
              </div>
              <div class="content">
                <div>
                  <span class="menuTitle">{{ item.name }}</span>
                  <span v-if="item.tags" class="remark">（{{ item.tags }}）</span>
                  <span
                    v-if="activeTask(item)"
                    class="status installing"
                    @click="showTask(activeTask(item)!.id)"
                  >
                    {{ taskStatusLabel(activeTask(item)) }} {{ activeTask(item)!.progress }}%
                  </span>
                  <span
                    v-else-if="isInstalled(item) || item.status === 3"
                    class="status"
                    :class="{ error: item.status === 3, success: item.status === 2 }"
                  >
                    {{
                      isInstalled(item)
                        ? item.status === 3 ? '已安装 · 操作失败' : '已安装'
                        : '安装失败'
                    }}
                  </span>
                </div>
                <div class="tip">{{ item.describe }}</div>
              </div>
            </div>

            <el-progress
              v-if="activeTask(item)"
              class="card-progress"
              :percentage="activeTask(item)!.progress"
              :stroke-width="6"
              :show-text="false"
            />
            <div v-if="isInstalled(item) && serviceStatus(item)" class="service-control">
              <div class="service-overview">
                <span>
                  <el-tag
                    size="small"
                    :type="serviceStateType(serviceStatus(item))"
                    effect="light"
                  >
                    {{ serviceStateLabel(serviceStatus(item)) }}
                  </el-tag>
                  <small v-if="serviceStatus(item)?.runtimeVersion">
                    运行版本 {{ serviceStatus(item)?.runtimeVersion }}
                  </small>
                  <small v-else-if="serviceStatus(item)?.subState">
                    {{ serviceStatus(item)?.subState }}
                  </small>
                </span>
                <el-button
                  link
                  type="primary"
                  :loading="serviceLoading"
                  @click="loadServiceStatuses"
                >
                  刷新
                </el-button>
              </div>
              <div class="service-actions">
                <el-button
                  size="small"
                  type="primary"
                  plain
                  :disabled="!!activeTask(item) || serviceStatus(item)?.busy"
                  @click="openServiceConfiguration(item)"
                >
                  配置
                </el-button>
                <el-button
                  v-if="serviceStatus(item)?.state !== 'running'"
                  size="small"
                  :disabled="!!activeTask(item) || serviceStatus(item)?.busy"
                  @click="handleServiceAction(item, 'start')"
                >
                  启动
                </el-button>
                <el-button
                  v-if="serviceStatus(item)?.state === 'running'"
                  size="small"
                  :disabled="!!activeTask(item) || serviceStatus(item)?.busy"
                  @click="handleServiceAction(item, 'stop')"
                >
                  停止
                </el-button>
                <el-button
                  size="small"
                  :disabled="!!activeTask(item) || serviceStatus(item)?.busy"
                  @click="handleServiceAction(item, 'restart')"
                >
                  重启
                </el-button>
                <el-button
                  v-if="serviceActionAllowed(serviceStatus(item), 'reload')"
                  size="small"
                  :disabled="
                    serviceStatus(item)?.state !== 'running' ||
                    !!activeTask(item) ||
                    serviceStatus(item)?.busy
                  "
                  @click="handleServiceAction(item, 'reload')"
                >
                  平滑重载
                </el-button>
              </div>
            </div>
            <div v-else class="divider" />

            <div class="below">
              <div class="version-info">
                <template v-if="!isInstalled(item)">未安装</template>
                <template v-else>
                  已安装版本：{{ item.install_version || item.versions?.[0] }}
                </template>
              </div>
              <button
                type="button"
                class="btn"
                :class="{ installed: isInstalled(item), disabled: !!activeTask(item) }"
                @click="handleSoftwareAction(item)"
              >
                {{ activeTask(item) ? '查看进度' : isInstalled(item) ? '卸载' : '安装' }}
              </button>
            </div>
          </div>
        </div>
      </template>
      <div v-else class="no-data">
        <img src="/static/images/empty.webp" alt="" />
        <span>暂无应用</span>
      </div>
    </div>

    <custom-drawer
      :visible="drawer.show"
      :title="drawer.title"
      :on-close="drawer.onClose"
      :on-confirm="drawer.onConfirm"
    >
      <custom-form :data="installForm" :on-init="(el) => (formRef = el)" />
    </custom-drawer>

    <custom-dialog
      v-model:show="versionDialog.show"
      title="版本选择"
      :on-close="versionDialog.onClose"
    >
      <div class="version-select-container">
        <div class="version-label">版本</div>
        <el-select v-model="installForm.value.version" placeholder="请选择版本" style="width: 100%">
          <el-option
            v-for="version in versionDialog.currentItem?.versions"
            :key="version"
            :label="version"
            :value="version"
          />
        </el-select>
      </div>
      <template #footer>
        <el-button @click="versionDialog.onClose">取消</el-button>
        <el-button type="primary" @click="versionDialog.onConfirm">安装</el-button>
      </template>
    </custom-dialog>

    <install-task-drawer
      v-model="taskDrawer.show"
      :task-id="taskDrawer.taskId"
      @retry="retryTask"
    />
    <service-config-drawer
      v-model="configDrawer.show"
      :component="configDrawer.component"
      @task-created="handleConfigurationTaskCreated"
    />
  </div>
</template>

<style scoped lang="less">
.section-header,
.below,
.sundry,
.task-center-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-header {
  min-height: 34px;
}

.title {
  color: var(--text-primary);
  font-size: 17px;
  font-weight: 650;
}

.task-badge {
  margin-left: 8px;
}

.task-center-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.task-stats {
  display: flex;
  padding: 6px 10px 10px;
  align-items: center;
  justify-content: space-between;
  color: var(--font-color-gray-light);
  font-size: 12px;
  border-bottom: 1px solid rgba(128, 128, 128, 0.18);

  strong {
    color: var(--el-color-success);
  }
}

.task-center-item {
  width: 100%;
  padding: 10px;
  color: var(--font-color-black);
  text-align: left;
  border: 0;
  border-radius: 9px;
  background: transparent;
  cursor: pointer;

  &:hover {
    background: rgba(var(--category-item-bg-color), 0.8);
  }

  span:first-child {
    display: flex;
    min-width: 0;
    flex-direction: column;
  }

  small {
    max-width: 270px;
    margin-top: 4px;
    overflow: hidden;
    color: var(--font-color-gray-light);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  width: 100%;
  margin-top: 20px;
}

.item {
  width: auto;
  min-width: 0;
  min-height: 226px;
  margin: 0;
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  background: var(--surface-card);
  box-shadow: var(--shadow-xs);
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-3px);
    border-color: rgba(var(--primary-color), 0.3);
    box-shadow: var(--shadow-sm);
  }

  &:nth-of-type(3n-2) {
    margin-left: 0;
  }
}

.item-inner {
  padding: 22px;
}

.sundry {
  justify-content: flex-start;
  margin-bottom: 20px;
}

.icon {
  width: 64px;
  height: 64px;
  overflow: hidden;
  flex: 0 0 auto;
  border: 1px solid var(--border-subtle);
  border-radius: 13px;
  background: #fff;

  img {
    width: 100%;
    height: 100%;
  }
}

.content {
  min-width: 0;
  margin-left: 16px;
}

.menuTitle {
  color: var(--text-primary);
  font-size: 17px;
  font-weight: 650;
}

.remark {
  margin-top: 3px;
  color: rgb(var(--primary-color));
  font-size: 11px;
}

.tip {
  margin-top: 14px;
  overflow: hidden;
  color: var(--font-color-gray-light);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 8px;
  border: 1px solid;
  border-radius: 20px;
  font-size: 12px;

  &.error {
    color: rgb(var(--error-color));
    border-color: rgb(var(--error-color));
  }

  &.success {
    color: rgb(var(--success-color));
    border-color: rgb(var(--success-color));
  }

  &.installing {
    color: rgb(var(--primary-color));
    border-color: rgb(var(--primary-color));
    cursor: pointer;
  }
}

.divider {
  border-bottom: 1px solid var(--border-subtle);
}

.card-progress {
  height: 1px;
  margin: 0 0 5px;
}

.service-control {
  min-height: 66px;
  padding: 12px 0;
  border-top: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
}

.service-overview,
.service-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.service-overview {
  small {
    margin-left: 8px;
    color: var(--font-color-gray-light);
  }
}

.service-actions {
  margin-top: 10px;
  justify-content: flex-start;
}

.below {
  margin-top: 20px;
  color: var(--text-tertiary);
  font-size: 11px;
}

.version-info {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn {
  display: flex;
  width: 78px;
  height: 36px;
  align-items: center;
  justify-content: center;
  color: var(--el-color-primary);
  border: 1px solid var(--el-color-primary);
  border-radius: 9px;
  background: transparent;
  cursor: pointer;

  &:hover,
  &.installed {
    color: #fff;
    background: rgb(var(--primary-color));
    box-shadow: 0 5px 12px rgba(var(--primary-color), 0.16);
  }

  &.disabled {
    opacity: 0.82;
  }
}

.no-data {
  display: flex;
  width: 100%;
  flex-flow: column nowrap;
  align-items: center;
  justify-content: center;
  color: var(--font-color-gray-light);
}

.version-select-container {
  display: flex;
  min-width: 300px;
  padding: 20px;
  align-items: center;
  gap: 12px;
}

.version-label {
  color: var(--font-color-black);
  font-size: 14px;
  white-space: nowrap;
}

@media (max-width: 1200px) {
  .list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .item {
    width: auto;
    margin-left: 0;

    &:nth-of-type(3n-2) {
      margin-left: 2%;
    }

    &:nth-of-type(2n-1) {
      margin-left: 0;
    }
  }
}

@media (max-width: 680px) {
  .list {
    grid-template-columns: 1fr;
  }

  .item-inner {
    padding: 18px;
  }
}
</style>
