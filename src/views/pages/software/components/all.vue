<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, FormInstance } from 'element-plus'
import { ChildEmits, ChildProps } from '../index.vue'
import CustomDrawer from '@/components/custom-drawer.vue'
import CustomForm, { type FormItem, type Props as FormProps } from '@/components/custom-form.vue'
import { Api } from '@/api/modules'
import { useSoftwareTaskStore, type SoftwareTask } from '@/stores/modules/softwareTask';
import InstallTaskDrawer from './InstallTaskDrawer.vue'
import ServiceConfigDrawer from './ServiceConfigDrawer.vue'
import { isOperationCancelled, submitOperation } from '@/utils/operationPreview'
import i18n from '@/lang'

const softwareTaskStore = useSoftwareTaskStore()

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

const t = (key: string, fallback?: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params)
  return value && value !== key ? value : fallback || key
}

const softwareTagKeys: Record<string, string> = {
  运行环境: 'software.componentTags.runtime',
  数据库: 'software.componentTags.database',
  容器: 'software.componentTags.container',
  建站: 'software.componentTags.website',
  Web服务器: 'software.componentTags.webServer',
  实用工具: 'software.componentTags.utility'
}

const softwareDescriptionKeys: Record<string, string> = {
  php: 'software.componentDescriptions.php',
  db: 'software.componentDescriptions.mysql',
  mysql: 'software.componentDescriptions.mysql',
  docker: 'software.componentDescriptions.docker',
  'docker-engine': 'software.componentDescriptions.docker'
}

const softwareDescriptionTextKeys: Record<string, string> = {
  'OneinStack PHP-FPM 运行环境': 'software.componentDescriptions.php',
  'MySQL 数据库，默认端口 3306，root 密码由 Panel 随机生成': 'software.componentDescriptions.mysql',
  '容器运行环境与 Docker 服务管理': 'software.componentDescriptions.docker'
}

const localizedSoftwareTags = (tags?: string) => {
  if (!tags) return ''
  return String(tags)
    .split(/[,，]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => t(softwareTagKeys[tag] || '', tag))
    .join(', ')
}

const localizedSoftwareDescription = (item: any) => {
  const raw = String(item?.describe || '')
  const key = softwareDescriptionKeys[String(item?.key || '').toLowerCase()] || softwareDescriptionTextKeys[raw]
  return key ? t(key, raw) : raw
}

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
  title: t('software.install', 'Install'),
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
    queued: t('software.taskStatuses.queued', 'Queued'),
    resolving: t('software.taskStatuses.resolving', 'Resolving package'),
    prechecking: t('software.taskStatuses.prechecking', 'Environment precheck'),
    installing: t('software.taskStatuses.installing', 'Installing'),
    upgrading: t('software.taskStatuses.upgrading', 'Upgrading'),
    uninstalling: t('software.taskStatuses.uninstalling', 'Uninstalling'),
    starting: t('software.taskStatuses.starting', 'Starting'),
    stopping: t('software.taskStatuses.stopping', 'Stopping'),
    restarting: t('software.taskStatuses.restarting', 'Restarting'),
    reloading: t('software.taskStatuses.reloading', 'Reloading'),
    configuring: t('software.taskStatuses.configuring', 'Configuring'),
    verifying: t('software.taskStatuses.verifying', 'Verifying'),
    finalizing: t('software.taskStatuses.finalizing', 'Finalizing'),
    canceling: t('software.taskStatuses.canceling', 'Canceling'),
    rolling_back: t('software.taskStatuses.rollingBack', 'Rolling back')
  }
  return labels[task.status] || task.status
}

const serviceStatus = (item: any) => serviceStatuses.value[item.key]
const isInstalled = (item: any) =>
  item.installed === true || serviceStatus(item)?.installed === true

const recommendedVersion = (item: any) =>
  item.recommendedVersion || item.versions?.[0] || ''

const hasUpgrade = (item: any) =>
  isInstalled(item) && item.isUpdate === true &&
  !!recommendedVersion(item) && recommendedVersion(item) !== item.install_version

const serviceStateLabel = (status?: ComponentServiceStatus) => {
  if (!status) return t('software.statusReading', 'Reading status')
  if (status.probeError) return status.probeError
  const labels: Record<string, string> = {
    running: t('software.serviceStates.running', 'Running'),
    stopped: t('software.serviceStates.stopped', 'Stopped'),
    failed: t('software.serviceStates.failed', 'Failed'),
    transitioning: t('software.serviceStates.transitioning', 'Changing status'),
    unknown: t('software.serviceStates.unknown', 'Unknown status'),
    not_installed: t('software.serviceStates.notInstalled', 'Not installed')
  }
  return labels[status.state] || t('software.serviceStates.unknown', 'Unknown status')
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

const waitForServiceTask = async (taskId: string, timeoutMs = 5 * 60 * 1000) => {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const { data: task } = await Api.getSoftwareTask(taskId)
    softwareTaskStore.upsert(task)
    if (softwareTaskStore.isTerminal(task.status)) return task as SoftwareTask
    await new Promise((resolve) => window.setTimeout(resolve, 800))
  }
  throw new Error(t('software.serviceActionTimeout', 'Timed out waiting for service operation. Check the result in the task center at the top right.'))
}

const handleServiceAction = async (item: any, action: ServiceAction) => {
  const status = serviceStatus(item)
  if (!status || !serviceActionAllowed(status, action) || submitting.value) return
  if (status.activeTaskId) {
    showTask(status.activeTaskId)
    return
  }
  const actionLabels: Record<ServiceAction, string> = {
    start: t('software.actionLabels.start', 'Start'),
    stop: t('software.actionLabels.stop', 'Stop'),
    restart: t('software.actionLabels.restart', 'Restart'),
    reload: t('software.actionLabels.reload', 'Reload')
  }
  submitting.value = true
  try {
    const { data: result } = await submitOperation('software.service_action', {
      component: status.component,
      softwareKey: status.softwareKey,
      action
    })
    softwareTaskStore.acceptCreated(result, {
      key: status.softwareKey,
      version: status.recordedVersion || item.install_version || '',
      action
    })
    serviceStatuses.value[status.softwareKey] = {
      ...status,
      busy: true,
      activeTaskId: result.taskId
    }
    if (action === 'restart') {
      const task = await waitForServiceTask(result.taskId)
      if (task.status === 'succeeded') {
        ElMessage.success(t('software.serviceActionSuccess', '{name} {action} succeeded', { name: status.displayName, action: actionLabels[action] }))
      } else {
        ElMessage.error(task.errorMessage || task.message || t('software.serviceActionFailed', '{name} {action} failed', { name: status.displayName, action: actionLabels[action] }))
      }
      await loadServiceStatuses()
      return
    }
    taskDrawer.taskId = result.taskId
    taskDrawer.show = true
    ElMessage.success(t('software.serviceActionTaskCreated', '{action} task created and can continue in the background', { action: actionLabels[action] }))
  } catch (error) {
    if (!isOperationCancelled(error)) throw error
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
  if (item.installable === false) {
    ElMessage.warning(t('software.installPaused', 'Center has paused installation for this software'))
    return
  }
  selectedItem.value = item
  installForm.value.key = item.key
  installForm.value.version = item.install_version || recommendedVersion(item)
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
      message: t('software.inputField', 'Enter {field}', { field: field.value || field.name || field.key }),
      trigger: 'blur'
    }]
  }))
  if (installForm.items.length === 0) {
    void handleInstall()
    return
  }
  drawer.title = t('software.installTitle', 'Install {name} {version}', { name: item.name, version: installForm.value.version })
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
    const { data: result } = await submitOperation('software.install', request)
    softwareTaskStore.acceptCreated(result, request)
    taskDrawer.taskId = result.taskId
    taskDrawer.show = true
    drawer.show = false
    clearSecretFields()
  } catch (error) {
    if (!isOperationCancelled(error)) throw error
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
  submitting.value = true
  try {
    const request = { name: item.key, key: item.key, version }
    const { data: result } = await submitOperation('software.uninstall', request)
    softwareTaskStore.acceptCreated(result, request)
    taskDrawer.taskId = result.taskId
    taskDrawer.show = true
    ElMessage.success(t('software.uninstallTaskCreated', 'Uninstall task created and can continue in the background'))
  } catch (error) {
    if (!isOperationCancelled(error)) throw error
  } finally {
    submitting.value = false
  }
}

const handleUpgrade = (item: any) => {
  const task = activeTask(item)
  if (task) {
    showTask(task.id)
    return
  }
  selectedItem.value = item
  installForm.value.key = item.key
  installForm.value.version = recommendedVersion(item)
  openInstallForm(item)
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
      <div class="title">{{ t('software.apps', 'Apps') }}</div>
      <el-popover
        v-if="recentTasks.length"
        placement="bottom-end"
        width="360"
        trigger="click"
        popper-class="software-task-popover"
      >
        <template #reference>
          <el-button plain>
            {{ t('software.softwareTasks', 'Software tasks') }}
            <el-badge
              :value="recentTasks.filter((task) => !softwareTaskStore.isTerminal(task.status)).length"
              :hidden="!recentTasks.some((task) => !softwareTaskStore.isTerminal(task.status))"
              class="task-badge"
            />
          </el-button>
        </template>
        <div class="task-center-list">
          <div v-if="softwareTaskStore.stats" class="task-stats">
            <span>{{ t('software.recentTaskCount', '{count} tasks in the last 30 days', { count: softwareTaskStore.stats.total }) }}</span>
            <strong>{{ t('software.successRate', 'Success rate {rate}%', { rate: softwareTaskStore.stats.successRate }) }}</strong>
          </div>
          <div class="task-center-scroll">
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
        </div>
      </el-popover>
    </div>

    <div class="list">
      <template v-if="list.length">
        <div v-for="item in list" :key="item.key" class="item">
          <div class="item-inner">
            <div class="sundry">
              <div class="icon">
                <img v-if="item.icon" :src="item.icon" alt="" />
                <span v-else class="icon-fallback">{{ item.name?.slice(0, 1)?.toUpperCase() }}</span>
              </div>
              <div class="content">
                <div>
                  <span class="menuTitle">{{ item.name }}</span>
                  <span v-if="item.tags" class="remark">（{{ localizedSoftwareTags(item.tags) }}）</span>
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
                        ? item.status === 3 ? t('software.installedWithFailure', 'Installed · operation failed') : t('software.installed', 'Installed')
                        : t('software.installFailed', 'Install failed')
                    }}
                  </span>
                </div>
                <div class="tip">{{ localizedSoftwareDescription(item) }}</div>
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
                    {{ t('software.runtimeVersion', 'Runtime version {version}', { version: serviceStatus(item)?.runtimeVersion }) }}
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
                  {{ t('common.refresh', 'Refresh') }}
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
                  {{ t('software.configure', 'Configure') }}
                </el-button>
                <el-button
                  v-if="serviceStatus(item)?.state !== 'running'"
                  size="small"
                  :disabled="!!activeTask(item) || serviceStatus(item)?.busy"
                  @click="handleServiceAction(item, 'start')"
                >
                  {{ t('software.actionLabels.start', 'Start') }}
                </el-button>
                <el-button
                  v-if="serviceStatus(item)?.state === 'running'"
                  size="small"
                  :disabled="!!activeTask(item) || serviceStatus(item)?.busy"
                  @click="handleServiceAction(item, 'stop')"
                >
                  {{ t('software.actionLabels.stop', 'Stop') }}
                </el-button>
                <el-button
                  size="small"
                  :disabled="!!activeTask(item) || serviceStatus(item)?.busy"
                  @click="handleServiceAction(item, 'restart')"
                >
                  {{ t('software.actionLabels.restart', 'Restart') }}
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
                  {{ t('software.reload', 'Reload') }}
                </el-button>
              </div>
            </div>
            <div v-else class="divider" />

            <div class="below">
              <div class="version-info">
                <template v-if="!isInstalled(item)">{{ t('software.notInstalled', 'Not installed') }}</template>
                <template v-else>
                  {{ t('software.installedVersion', 'Installed version: {version}', { version: item.install_version || item.versions?.[0] }) }}
                  <span v-if="hasUpgrade(item)"> · {{ t('software.upgradeTo', 'Upgradeable to {version}', { version: recommendedVersion(item) }) }}</span>
                </template>
              </div>
              <div class="software-card-actions">
                <button
                  v-if="activeTask(item)"
                  type="button"
                  class="btn task"
                  @click="showTask(activeTask(item)!.id)"
                >
                  {{ t('software.viewProgress', 'View progress') }}
                </button>
                <template v-else-if="isInstalled(item)">
                  <button
                    v-if="hasUpgrade(item)"
                    type="button"
                    class="btn upgrade"
                    @click="handleUpgrade(item)"
                  >
                    {{ t('software.upgrade', 'Upgrade') }}
                  </button>
                  <button
                    type="button"
                    class="btn uninstall"
                    :disabled="submitting"
                    @click="handleUninstall(item)"
                  >
                    {{ t('software.uninstall', 'Uninstall') }}
                  </button>
                </template>
                <button
                  v-else
                  type="button"
                  class="btn"
                  :disabled="item.installable === false"
                  :class="{ disabled: item.installable === false }"
                  @click="handleInstallClick(item)"
                >
                  {{ item.installable === false ? t('software.disabled', 'Disabled') : t('software.install', 'Install') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>
      <div v-else class="no-data">
        <img src="/static/images/empty.webp" alt="" />
        <span>{{ t('software.noApps', 'No apps') }}</span>
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
      :title="t('software.versionSelect', 'Version select')"
      :on-close="versionDialog.onClose"
    >
      <div class="version-select-container">
        <div class="version-label">{{ t('software.version', 'Version') }}</div>
        <el-select v-model="installForm.value.version" :placeholder="t('software.selectVersion', 'Select version')" style="width: 100%">
          <el-option
            v-for="version in versionDialog.currentItem?.versions"
            :key="version"
            :label="version"
            :value="version"
          />
        </el-select>
      </div>
      <template #footer>
        <el-button @click="versionDialog.onClose">{{ t('common.cancel', 'Cancel') }}</el-button>
        <el-button type="primary" @click="versionDialog.onConfirm">{{ t('software.install', 'Install') }}</el-button>
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
  max-height: min(520px, calc(100vh - 120px));
  overflow: visible;
}

.task-center-scroll {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 6px;
  min-height: 0;
  max-height: min(450px, calc(100vh - 190px));
  padding: 8px 4px 12px;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 999px;
    background: rgba(148, 163, 184, 0.45);
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }
}

.task-stats {
  display: flex;
  flex: 0 0 auto;
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
  min-height: 60px;
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
    max-width: 250px;
    margin-top: 4px;
    overflow: hidden;
    color: var(--font-color-gray-light);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

:global(.software-task-popover.el-popper) {
  max-height: calc(100vh - 96px);
  overflow: hidden;
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
    object-fit: contain;
  }
}

.icon-fallback {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  color: rgb(var(--primary-color));
  background: rgba(var(--primary-color), 0.08);
  font-size: 24px;
  font-weight: 750;
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
  gap: 14px;
  margin-top: 20px;
  color: var(--text-tertiary);
  font-size: 11px;
}

.version-info {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.software-card-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
}

.btn {
  display: flex;
  min-width: 68px;
  height: 36px;
  padding: 0 14px;
  align-items: center;
  justify-content: center;
  color: var(--el-color-primary);
  border: 1px solid var(--el-color-primary);
  border-radius: 9px;
  background: transparent;
  cursor: pointer;

  &:hover {
    color: #fff;
    background: rgb(var(--primary-color));
    box-shadow: 0 5px 12px rgba(var(--primary-color), 0.16);
  }

  &:disabled,
  &.disabled {
    cursor: not-allowed;
    opacity: 0.58;
  }

  &.upgrade {
    color: #fff;
    border-color: var(--el-color-success);
    background: var(--el-color-success);
  }

  &.uninstall {
    color: var(--el-color-danger);
    border-color: color-mix(in srgb, var(--el-color-danger) 50%, var(--border-subtle));
    background: transparent;

    &:hover:not(:disabled) {
      color: #fff;
      border-color: var(--el-color-danger);
      background: var(--el-color-danger);
      box-shadow: 0 5px 12px color-mix(in srgb, var(--el-color-danger) 18%, transparent);
    }
  }

  &.task {
    color: #fff;
    background: rgb(var(--primary-color));
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
