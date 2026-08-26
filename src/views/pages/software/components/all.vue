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
import { useConfigStore } from '@/stores/modules/config'

const softwareTaskStore = useSoftwareTaskStore()
const sconfig = useConfigStore()

type ServiceAction = 'start' | 'stop' | 'restart' | 'reload'

interface ComponentServiceStatus {
  component: string
  softwareKey: string
  displayName: string
  serviceName: string
  manageScopes?: string[]
  canConfigure?: boolean
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
  缓存: 'software.componentTags.cache',
  实用工具: 'software.componentTags.utility',
  安全: 'software.componentTags.security',
  云存储: 'software.componentTags.cloudStorage',
  'AI / 大模型': 'software.componentTags.ai',
  其他: 'software.componentTags.other'
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
const taskPopoverVisible = ref(false)
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
const canReadSoftware = computed(() =>
  sconfig.hasActionAccess('software.read') ||
  sconfig.hasScopeAccess('software', 'read') ||
  Boolean((sconfig.scopeAccess as any)?.software?.read) ||
  Boolean((sconfig.scopeAccess as any)?.['software.read'])
)
const canWriteSoftware = computed(() =>
  sconfig.hasActionAccess('software.write') ||
  sconfig.hasScopeAccess('software', 'write') ||
  Boolean((sconfig.scopeAccess as any)?.software?.write) ||
  Boolean((sconfig.scopeAccess as any)?.['software.write'])
)
const canReadSoftwareService = computed(() =>
  sconfig.hasActionAccess('software.service.read') ||
  sconfig.hasScopeAccess('software.service', 'read') ||
  Boolean((sconfig.scopeAccess as any)?.software?.service?.read) ||
  Boolean((sconfig.scopeAccess as any)?.['software.service.read']) ||
  Boolean((sconfig.scopeAccess as any)?.['software.service']?.read)
)
const canWriteSoftwareService = computed(() =>
  sconfig.hasActionAccess('software.service.write') ||
  sconfig.hasScopeAccess('software.service', 'write') ||
  Boolean((sconfig.scopeAccess as any)?.software?.service?.write) ||
  Boolean((sconfig.scopeAccess as any)?.['software.service.write']) ||
  Boolean((sconfig.scopeAccess as any)?.['software.service']?.write)
)
const canReadWebsite = computed(() =>
  sconfig.hasMenuAccess('website') ||
  sconfig.hasActionAccess('website.read') ||
  Boolean((sconfig.scopeAccess as any)?.website?.read) ||
  Boolean((sconfig.scopeAccess as any)?.['website.read'])
)
const canReadDatabase = computed(() =>
  sconfig.hasMenuAccess('database') ||
  sconfig.hasActionAccess('database.read') ||
  Boolean((sconfig.scopeAccess as any)?.database?.read) ||
  Boolean((sconfig.scopeAccess as any)?.['database.read'])
)
const allowedManageScopes = computed(() => {
  if (canWriteSoftware.value) return new Set<string>(['*'])
  const scopes = new Set<string>()
  if (canReadWebsite.value) {
    scopes.add('web_service')
    scopes.add('runtime')
  }
  if (canReadDatabase.value) {
    scopes.add('database')
    scopes.add('cache')
  }
  return scopes
})

const activeTask = (item: any) => softwareTaskStore.activeForKey(item.key)

const latestTerminalTask = (softwareKey: string) =>
  softwareTaskStore.order
    .map((id) => softwareTaskStore.tasks[id])
    .filter((task): task is SoftwareTask =>
      !!task &&
      task.softwareKey === softwareKey &&
      softwareTaskStore.isTerminal(task.status)
    )
    .sort((left, right) =>
      Date.parse(right.updatedAt || right.finishedAt || right.createdAt) -
      Date.parse(left.updatedAt || left.finishedAt || left.createdAt)
    )[0]

const shouldShowInstallFailure = (item: any) => {
  if (isInstalled(item)) return false
  if (item.status !== 3) return false

  const task = latestTerminalTask(item.key)
  if (!task) return true

  if (task.operation === 'uninstall' && task.status === 'succeeded') return false

  return ['install', 'upgrade'].includes(task.operation) &&
    ['failed', 'interrupted', 'canceled'].includes(task.status)
}

const statusBadge = (item: any) => {
  if (activeTask(item)) return null
  if (isInstalled(item)) {
    return {
      text: item.status === 3
        ? t('software.installedWithFailure', 'Installed · operation failed')
        : t('software.installed', 'Installed'),
      className: item.status === 3 ? 'error' : 'success'
    }
  }

  if (shouldShowInstallFailure(item)) {
    return {
      text: t('software.installFailed', 'Install failed'),
      className: 'error'
    }
  }

  return null
}

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
  !!recommendedVersion(item) && (recommendedVersion(item) !== item.install_version || item.installedPackageVersion !== item.latestPackageVersion)

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

const getManageScopes = (item: any, status?: ComponentServiceStatus) => {
  const scopes = status?.manageScopes ?? item?.manageScopes
  return Array.isArray(scopes)
    ? scopes.map((scope) => String(scope || '').trim()).filter(Boolean)
    : []
}

const canManageService = (item: any, status?: ComponentServiceStatus) => {
  if (!canReadSoftwareService.value || !canWriteSoftwareService.value) return false
  if (allowedManageScopes.value.has('*')) return true
  const scopes = getManageScopes(item, status)
  if (!scopes.length) return false
  return scopes.some((scope) => allowedManageScopes.value.has(scope))
}

const loadServiceStatuses = async () => {
  if (!canReadSoftwareService.value) {
    serviceStatuses.value = {}
    return
  }
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

const canShowConfigureButton = (item: any, status?: ComponentServiceStatus) =>
  Boolean(status?.canConfigure) && canManageService(item, status)

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
  if (!status || !canManageService(item, status) || !serviceActionAllowed(status, action) || submitting.value) return
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
  if (!status || !canManageService(item, status)) return
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
  if (!canWriteSoftware.value) return
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
  if (submitting.value || !canWriteSoftware.value) return
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
  taskPopoverVisible.value = false
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
  if (submitting.value || !canWriteSoftware.value) return
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
  if (!canWriteSoftware.value) return
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
    if (canReadSoftwareService.value) {
      void loadServiceStatuses().catch(() => undefined)
    }
  }
)

onMounted(() => {
  void softwareTaskStore.loadAll()
  if (canReadSoftwareService.value) {
    void loadServiceStatuses().catch(() => undefined)
  }
})

watch(
  () => i18n.locale,
  () => {
    void softwareTaskStore.loadAll()
    if (canReadSoftwareService.value) {
      void loadServiceStatuses().catch(() => undefined)
    }
  }
)
</script>

<template>
  <div>
    <div class="section-header">
      <div class="title">{{ t('software.apps', 'Apps') }}</div>
      <el-popover
        v-if="recentTasks.length"
        v-model:visible="taskPopoverVisible"
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
                    v-else-if="statusBadge(item)"
                    class="status"
                    :class="statusBadge(item)?.className"
                  >
                    {{ statusBadge(item)?.text }}
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
            <div
              v-if="isInstalled(item) && serviceStatus(item) && canReadSoftwareService"
              class="service-control"
            >
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
              <div v-if="canManageService(item, serviceStatus(item))" class="service-actions">
                <el-button
                  v-if="canShowConfigureButton(item, serviceStatus(item))"
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
                  <span v-if="item.port !== undefined && item.port !== null && item.port !== ''">
                    · {{ t('software.servicePort', 'Service port: {port}', { port: item.port }) }}
                  </span>
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
                    v-if="hasUpgrade(item) && canWriteSoftware"
                    type="button"
                    class="btn upgrade"
                    @click="handleUpgrade(item)"
                  >
                    {{ t('software.upgrade', 'Upgrade') }}
                  </button>
                  <button
                    v-if="canWriteSoftware"
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
                  v-if="canWriteSoftware"
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

  strong,
  small,
  span:last-child {
    color: inherit;
  }
}

:global(.software-task-popover.el-popper) {
  max-height: calc(100vh - 96px);
  overflow: hidden;
}

:global(html.dark .software-task-popover.el-popper) {
  border: 1px solid var(--border-default);
  background:
    linear-gradient(180deg, rgba(18, 27, 41, 0.98), rgba(12, 19, 31, 0.98));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.03),
    0 18px 40px rgba(0, 0, 0, 0.32);
}

:global(html.dark .software-task-popover.el-popper .el-popper__arrow::before) {
  border-color: var(--border-default);
  background: #152033;
}

:global(html.dark .software-task-popover .task-stats) {
  color: #c7d2e1;
  border-bottom-color: rgba(148, 163, 184, 0.16);
}

:global(html.dark .software-task-popover .task-stats strong) {
  color: #86efac;
}

:global(html.dark .software-task-popover .task-center-scroll) {
  scrollbar-color: rgba(148, 163, 184, 0.36) transparent;
}

:global(html.dark .software-task-popover .task-center-item) {
  color: #e5edf8;
  border: 1px solid transparent;
  background:
    linear-gradient(180deg, rgba(19, 29, 45, 0.66), rgba(15, 23, 42, 0.66));
}

:global(html.dark .software-task-popover .task-center-item small) {
  color: #93a4ba;
}

:global(html.dark .software-task-popover .task-center-item span:last-child) {
  color: #cdd8e7;
  font-weight: 700;
}

:global(html.dark .software-task-popover .task-center-item:hover) {
  border-color: rgba(var(--primary-color), 0.24);
  background:
    linear-gradient(180deg, rgba(var(--primary-color), 0.14), rgba(30, 41, 59, 0.82));
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
  display: inline-block;
  margin-top: 3px;
  color: rgb(var(--primary-color));
  font-size: 11px;
}

.tip {
  margin-top: 14px;
  color: var(--font-color-gray-light);
  font-size: 12px;
  line-height: 1.5;
  display: -webkit-box;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
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
  flex-wrap: wrap;
  gap: 8px;
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
  flex-wrap: wrap;
  justify-content: flex-end;
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

@media (max-width: 900px) {
  .section-header {
    gap: 12px;
    align-items: stretch;
    flex-direction: column;
  }

  .section-header :deep(.el-button) {
    width: 100%;
    justify-content: center;
  }

  .task-stats {
    gap: 6px;
    align-items: flex-start;
    flex-direction: column;
  }

  .task-center-item {
    gap: 10px;
    align-items: flex-start;
    flex-direction: column;

    small {
      max-width: 100%;
    }
  }

  .service-overview {
    gap: 10px;
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 680px) {
  .list {
    grid-template-columns: 1fr;
  }

  .item-inner {
    padding: 18px;
  }

  .sundry {
    align-items: flex-start;
  }

  .content {
    margin-left: 14px;
  }

  .menuTitle {
    font-size: 16px;
    line-height: 1.4;
  }

  .status {
    margin-top: 8px;
    margin-left: 0;
  }

  .below {
    align-items: stretch;
    flex-direction: column;
  }

  .version-info {
    overflow: visible;
    white-space: normal;
  }

  .software-card-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 560px) {
  .item {
    min-height: 0;
  }

  .item-inner {
    padding: 16px;
  }

  .sundry {
    gap: 12px;
    flex-direction: column;
  }

  .content {
    width: 100%;
    margin-left: 0;
  }

  .service-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .service-actions :deep(.el-button) {
    width: 100%;
    margin-left: 0;
  }

  .software-card-actions {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .btn {
    width: 100%;
    min-width: 0;
    padding: 0 10px;
  }

  .version-select-container {
    min-width: 0;
    padding: 0;
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
