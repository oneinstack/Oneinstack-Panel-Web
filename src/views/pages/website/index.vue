<script setup lang="ts">
import { computed, reactive, ref, toRaw } from 'vue'
import SearchInput from '@/components/search-input.vue'
import {
  ArrowDown,
  Delete,
  FolderAdd,
  FolderOpened,
  Lock,
  Refresh,
  RefreshRight,
  Setting,
  SwitchButton,
  VideoPlay
} from '@element-plus/icons-vue'
import CardTabs from '@/components/card-tabs.vue'
import CustomTable from '@/components/custom-table.vue'
import { Api } from '@/api/modules'
import type { FormItem } from '@/components/custom-form.vue'
import { FormInstance } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import WebsiteCertificateDrawer from './components/WebsiteCertificateDrawer.vue'
import WebsiteBackupDrawer from './components/WebsiteBackupDrawer.vue'
import WebServerConfigDrawer from './components/WebServerConfigDrawer.vue'
import { isOperationCancelled, submitOperation } from '@/utils/operationPreview'
import i18n from '@/lang'
import WebsiteSettingsDrawer from './components/WebsiteSettingsDrawer.vue'
import System from '@/utils/System'
import { useConfigStore } from '@/stores/modules/config'
import { getWebsiteEngineLabel, getWebsiteEngineTagStyle } from '@/utils/websiteEngine'

const t = (key: string, fallback?: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params)
  return value && value !== key ? value : fallback || key
}
const sconfig = useConfigStore()
const canReadDatabase = () =>
  sconfig.hasMenuAccess('database') ||
  sconfig.hasActionAccess('database.read') ||
  Boolean((sconfig.scopeAccess as any)?.database?.read) ||
  Boolean((sconfig.scopeAccess as any)?.['database.read'])

const websiteRootDirPattern = /^(?!\.)(?!.*(?:^|\/)\.\.(?:\/|$))[A-Za-z0-9][A-Za-z0-9._/-]*$/
const rootDirForbiddenCharacters = /[\0\r\n\t ;{}"'$]/

const normalizeWebsiteRootDirInput = (value: unknown) =>
  typeof value === 'string' ? value.trim() : ''

const buildWebsitePayload = (source: Record<string, any>) => ({
  id: source.id,
  name: source.name,
  domain: source.domain,
  root_dir: source.root_dir,
  dir: source.dir,
  remark: source.remark,
  type: source.type,
  class: source.class,
  pact: source.pact,
  tar_url: source.tar_url,
  send_url: source.send_url,
  enabled: source.enabled,
  expires_at: source.expires_at
})

const validateManagedWebsiteRootDir = (_rule: unknown, value: unknown, callback: (error?: Error) => void) => {
  const rootDir = normalizeWebsiteRootDirInput(value)
  if (!rootDir) {
    callback(new Error(t('website.rootDirRequired', '请选择根目录')))
    return
  }
  if (rootDir.startsWith('/')) {
    callback(new Error(t('website.rootDirMustBeRelative', '网站根目录必须填写受管目录下的相对路径')))
    return
  }
  if (rootDir.includes('\\')) {
    callback(new Error(t('website.rootDirBackslashNotAllowed', '网站根目录不能包含反斜杠')))
    return
  }
  if (rootDirForbiddenCharacters.test(rootDir)) {
    callback(new Error(t('website.rootDirUnsafeCharacters', '网站根目录包含不安全字符')))
    return
  }
  if (!websiteRootDirPattern.test(rootDir) || rootDir.split('/').some((segment) => segment === '.' || segment === '..' || !segment)) {
    callback(new Error(t('website.rootDirTraversalNotAllowed', '网站根目录不能包含越界路径')))
    return
  }
  callback()
}

const extractWebsiteOperationMeta = (payload: any) => {
  const root = payload?.data ?? payload ?? {}
  const result = root?.result || root?.data?.result || {}
  const meta = root?.meta || root?.data?.meta || {}
  const taskCandidates = [
    root?.taskId,
    root?.task_id,
    root?.id,
    root?.boundTaskId,
    root?.bound_task_id,
    root?.task?.id,
    root?.task?.taskId,
    root?.task?.task_id,
    result?.taskId,
    result?.task_id,
    result?.id,
    result?.boundTaskId,
    result?.task?.id,
    meta?.taskId,
    meta?.task_id,
    meta?.boundTaskId
  ]
  const approvalCandidates = [
    root?.approvalId,
    root?.approval_id,
    root?.approvalRequestId,
    root?.approval_request_id,
    root?.requestId,
    root?.request_id,
    root?.approval?.id,
    root?.approvalRequest?.id,
    result?.approvalId,
    result?.approval_id,
    result?.approvalRequestId,
    result?.approval_request_id,
    result?.requestId,
    result?.request_id,
    result?.approval?.id,
    result?.approvalRequest?.id,
    meta?.approvalId,
    meta?.approval_id,
    meta?.approvalRequestId,
    meta?.approval_request_id
  ]
  const statusCandidates = [
    root?.status,
    root?.state,
    root?.phase,
    root?.approvalStatus,
    root?.approval_status,
    root?.approval?.status,
    result?.status,
    result?.state,
    result?.phase,
    result?.approvalStatus,
    result?.approval_status,
    result?.approval?.status,
    meta?.status,
    meta?.state,
    meta?.phase
  ]
  const taskId = taskCandidates.find((item) => typeof item === 'string' || typeof item === 'number')
  const approvalId = approvalCandidates.find((item) => typeof item === 'string' || typeof item === 'number')
  const status = statusCandidates.find((item) => typeof item === 'string')

  return {
    taskId: taskId ? String(taskId) : '',
    approvalId: approvalId ? String(approvalId) : '',
    status: typeof status === 'string' ? status.toLowerCase() : ''
  }
}

const extractWebsiteTaskId = (payload: any): string => {
  return extractWebsiteOperationMeta(payload).taskId
}

const extractWebsiteApprovalId = (payload: any): string => {
  return extractWebsiteOperationMeta(payload).approvalId
}

const openWebsiteRoot = (rootDir: unknown) => {
  const path = typeof rootDir === 'string' ? rootDir.trim() : ''
  if (!path) {
    ElMessage.warning(t('website.noManagedRoot', 'The current website has no manageable root directory'))
    return
  }
  System.router.push({
    path: '/file',
      query: { path }
    })
}

const webServer = reactive({
  loading: true,
  data: {
    available: false,
    running: false,
    configurationAvailable: false
  } as Record<string, any>,
  menuVisible: false,
  configVisible: false,
  load: async () => {
    webServer.loading = true
    try {
      const { data } = await Api.getWebsiteWebServer()
      webServer.data = data
    } catch {
      webServer.data = {
        available: false,
        running: false,
        configurationAvailable: false
      }
    } finally {
      webServer.loading = false
    }
  }
})

const websiteTypeOptions = computed(() => [
  { label: t('website.categoryAll', '全部分类'), value: conf.website.params.type },
  { label: t('website.tabs.php', 'PHP 项目'), value: 'php' },
  { label: t('website.tabs.proxy', '反向代理'), value: 'proxy' },
  { label: t('website.tabs.static', 'HTML 项目'), value: 'static' }
])

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

const allowedManageScopes = computed(() => {
  if (sconfig.isAdministrator()) return new Set(['*'])
  const scopes = new Set<string>()
  const entries = Object.entries((sconfig.scopeAccess as any) || {})
  for (const [scopeKey, value] of entries as Array<[string, any]>) {
    if (value?.write === true || value === true) {
      scopes.add(scopeKey)
    }
  }
  return scopes
})

const serviceStatuses = ref<Record<string, ComponentServiceStatus>>({})
const serviceLoading = ref(false)
const serviceSubmitting = ref<ServiceAction | ''>('')

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
  } catch {
    serviceStatuses.value = {}
  } finally {
    serviceLoading.value = false
  }
}

type WebServerKind = 'nginx' | 'openresty' | 'caddy' | 'unknown'

const webServerKind = computed<WebServerKind>(() => {
  const identity = [
    webServer.data.component,
    webServer.data.name,
    webServer.data.binaryPath,
    webServer.data.serviceName
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  if (identity.includes('openresty')) return 'openresty'
  if (identity.includes('caddy')) return 'caddy'
  if (identity.includes('nginx') || /(^|\s)ng(\s|$)/.test(identity)) return 'nginx'
  return 'unknown'
})

const webServerAliases = computed(() => {
  const aliases = new Set<string>()
  const component = String(webServer.data.component || '').trim().toLowerCase()
  const name = String(webServer.data.name || '').trim().toLowerCase()
  for (const key of [component, name]) {
    if (!key) continue
    aliases.add(key)
    if (key.includes('nginx')) aliases.add('nginx')
    if (key.includes('openresty')) aliases.add('openresty')
    if (key.includes('caddy')) aliases.add('caddy')
  }
  if (webServerKind.value !== 'unknown') aliases.add(webServerKind.value)
  return Array.from(aliases)
})

const webServerServiceStatus = computed(() => {
  const aliases = webServerAliases.value
  if (!aliases.length) return undefined
  return Object.values(serviceStatuses.value).find((status) => {
    const candidates = [
      String(status.component || '').toLowerCase(),
      String(status.softwareKey || '').toLowerCase(),
      String(status.displayName || '').toLowerCase(),
      String(status.serviceName || '').toLowerCase()
    ]
    return candidates.some((candidate) =>
      candidate && aliases.some((alias) => candidate === alias || candidate.includes(alias) || alias.includes(candidate))
    )
  })
})

const getManageScopes = (status?: ComponentServiceStatus) => {
  if (!status) return []
  const scopes = (status.manageScopes || []).filter(Boolean)
  if (scopes.length) return scopes
  return [
    `software.${status.softwareKey}`,
    `software.service.${status.softwareKey}`,
    `software.${status.component}`,
    `software.service.${status.component}`
  ].filter(Boolean)
}

const canManageService = (status?: ComponentServiceStatus) => {
  if (!status || !canReadSoftwareService.value || !canWriteSoftwareService.value) return false
  if (allowedManageScopes.value.has('*')) return true
  const scopes = getManageScopes(status)
  if (!scopes.length) return true
  return scopes.some((scope) => allowedManageScopes.value.has(scope))
}

const serviceActionAllowed = (status: ComponentServiceStatus | undefined, action: ServiceAction) =>
  !!status?.availableActions?.includes(action) &&
  !(action === 'reload' && !status.canReload)

const webServerDisplayName = computed(() =>
  webServer.data.available
    ? webServer.data.name || webServerServiceStatus.value?.displayName || webServer.data.component || 'Web Server'
    : t('website.webServerNotDetected', '未检测到 Nginx、OpenResty 或 Caddy')
)

const webServerVersionText = computed(() =>
  webServer.data.version ||
  webServerServiceStatus.value?.runtimeVersion ||
  webServerServiceStatus.value?.recordedVersion ||
  t('website.versionUnknown', '版本未知')
)

const webServerLogoText = computed(() => {
  if (webServerKind.value === 'openresty') return 'O'
  if (webServerKind.value === 'caddy') return 'C'
  if (webServerKind.value === 'nginx') return 'N'
  return webServer.data.available ? 'W' : '?'
})

const webServerState = computed(() => {
  if (!webServer.data.available) return 'not_installed'
  return webServer.data.running ? 'running' : 'stopped'
})

const webServerStatusLabel = computed(() => {
  switch (webServerState.value) {
    case 'running':
      return t('website.running', '运行中')
    case 'not_installed':
      return t('website.notInstalled', '未安装')
    default:
      return t('website.serviceStopped', '服务已停止')
  }
})

const canManageCurrentWebServer = computed(() => canManageService(webServerServiceStatus.value))

const runtimeDropdownDisabled = computed(() =>
  !webServer.data.available ||
  !webServerServiceStatus.value ||
  !canManageCurrentWebServer.value ||
  serviceLoading.value
)

const runtimeDropdownDisabledReason = computed(() => {
  if (webServer.loading || serviceLoading.value) {
    return t('container.checking', '检测中')
  }
  if (!webServer.data.available) {
    return webServer.data.message || t('website.installWebServerTip', '请先安装 Nginx、OpenResty 或 Caddy，网站模块会自动识别并使用已安装的服务。')
  }
  if (!webServerServiceStatus.value) {
    return t('website.webServerRuntimeNotManaged', '当前 Web 服务暂未接入可管理状态')
  }
  if (!canManageCurrentWebServer.value) {
    return t('common.noPermission', '暂无权限')
  }
  return ''
})

const runtimeActionLabels: Record<ServiceAction, string> = {
  start: t('website.startService', '启动服务'),
  stop: t('website.stopService', '停止服务'),
  restart: t('website.restartService', '重启服务'),
  reload: t('website.reloadService', '重载配置')
}

const websiteMetrics = computed(() => {
  const list = (Array.isArray(conf.website.data) ? conf.website.data : []) as Array<Record<string, any>>
  const sslCount = list.filter((item) => Boolean(item?.ssl_enabled)).length
  const runningCount = list.filter((item) => Boolean(item?.enabled)).length
  const expiringCount = list.filter((item) => {
    if (!item?.expires_at) return false
    const expiresAt = new Date(item.expires_at).getTime()
    if (!Number.isFinite(expiresAt)) return false
    const remain = expiresAt - Date.now()
    return remain > 0 && remain <= 30 * 24 * 60 * 60 * 1000
  }).length
  return {
    total: Number(conf.website.total || list.length || 0),
    sslCount,
    runningCount,
    expiringCount
  }
})

const selectedCategory = computed({
  get: () => conf.website.params.type,
  set: (value: string) => {
    const target = conf.tabs.list.find((item) => item.value === value)
    if (target) {
      conf.tabs.clickActive(target)
    }
  }
})

const waitForServiceTask = async (taskId: string, timeoutMs = 5 * 60 * 1000) => {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const { data: task } = await Api.getSoftwareTask(taskId)
    if (['succeeded', 'failed', 'canceled', 'cancelled', 'interrupted'].includes(String(task?.status || '').toLowerCase())) {
      return task
    }
    await new Promise((resolve) => window.setTimeout(resolve, 800))
  }
  throw new Error(t('website.serviceActionTimeout', '等待服务操作完成超时，请到右上角任务中心查看执行结果'))
}

const handleWebServerAction = async (action: ServiceAction) => {
  const status = webServerServiceStatus.value
  if (!status || !canManageCurrentWebServer.value || !serviceActionAllowed(status, action) || serviceSubmitting.value) {
    return
  }
  if (status.activeTaskId || status.busy) {
    ElMessage.warning(t('website.serviceBusy', '已有服务任务执行中，请到任务中心查看'))
    return
  }
  serviceSubmitting.value = action
  try {
    const { data: result } = await submitOperation('software.service_action', {
      component: status.component,
      softwareKey: status.softwareKey,
      action
    })
    serviceStatuses.value[status.softwareKey] = {
      ...status,
      busy: true,
      activeTaskId: result.taskId
    }
    if (action === 'restart') {
      const task = await waitForServiceTask(result.taskId)
      if (String(task?.status || '').toLowerCase() === 'succeeded') {
        ElMessage.success(t('website.serviceActionSuccess', '{name}{action}成功', { name: status.displayName, action: runtimeActionLabels[action] }))
      } else {
        ElMessage.error(task?.errorMessage || task?.message || t('website.serviceActionFailed', '{name}{action}失败', { name: status.displayName, action: runtimeActionLabels[action] }))
      }
    } else {
      ElMessage.success(t('website.serviceActionTaskCreated', '{action}任务已创建，可在后台继续执行', { action: runtimeActionLabels[action] }))
    }
  } catch (error: any) {
    if (!isOperationCancelled(error)) {
      // ElMessage.error(error?.message || t('common.operationFailed', '操作失败'))
    }
  } finally {
    serviceSubmitting.value = ''
    await Promise.all([webServer.load(), loadServiceStatuses()])
  }
}

const runWebServerAction = (action: ServiceAction) => {
  webServer.menuVisible = false
  void handleWebServerAction(action)
}

const openWebServerConfig = () => {
  webServer.menuVisible = false
  webServer.configVisible = true
}

const handleWebsitePageRefresh = () => {
  conf.website.getData()
  webServer.load()
  loadServiceStatuses()
}

const addSiteDisabledReason = computed(() => {
  if (webServer.loading) {
    return t('container.checking', '检测中')
  }
  if (!webServer.data.available) {
    return webServer.data.message || t('website.addSiteDisabledReason', '未检测到 Nginx、OpenResty 或 Caddy，暂不可添加站点')
  }
  return ''
})

const certificateDrawer = reactive({
  show: false,
  website: {} as Record<string, any>,
  open: (website: Record<string, any>) => {
    certificateDrawer.website = website
    certificateDrawer.show = true
  }
})

const backupDrawer = reactive({
  show: false,
  website: null as Record<string, any> | null,
  open: (website?: Record<string, any>) => {
    backupDrawer.website = website || null
    backupDrawer.show = true
  }
})

const settingsDrawer = reactive({
  show: false,
  website: null as Record<string, any> | null,
  open: (website: Record<string, any>) => {
    settingsDrawer.website = website
    settingsDrawer.show = true
  }
})

const statusLoading = reactive(new Set<number>())
const toggleWebsiteStatus = async (row: Record<string, any>, enabled: boolean) => {
  statusLoading.add(row.id)
  try {
    await submitOperation('website.toggle', {
      id: row.id,
      enabled
    })
    ElMessage.success(t(enabled ? 'website.notifications.enabled' : 'website.notifications.disabled'))
    await conf.website.getData()
  } catch (error: any) {
    if (isOperationCancelled(error)) return
    // ElMessage.error(error?.message || t('common.operationFailed', '操作失败'))
  } finally {
    statusLoading.delete(row.id)
  }
}

const formatWebsiteTraffic = (value: unknown) => {
  let bytes = Number(value || 0)
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let index = 0
  while (bytes >= 1024 && index < units.length - 1) {
    bytes /= 1024
    index++
  }
  return `${bytes >= 100 || index === 0 ? bytes.toFixed(0) : bytes.toFixed(2)} ${units[index]}`
}

const formatWebsiteExpiration = (value?: string | null) => {
  if (!value) return t('website.settingsDrawer.permanent')
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString(i18n.locale, { hour12: false })
}

const conf = reactive({
  tabs: {
    activeIndex: 0,
    list: [
      {
        name: 'PHP',
        nameKey: 'website.tabs.php',
        index: 0,
        value: 'php'
      },
      // {
      //   name: 'JAVA项目',
      //   index: 1
      // },
      // {
      //   name: 'Node项目',
      //   index: 2
      // },
      // {
      //   name: 'Go项目',
      //   index: 3
      // },
      // {
      //   name: 'Python项目',
      //   index: 4
      // },
      {
        name: 'Proxy',
        nameKey: 'website.tabs.proxy',
        index: 5,
        value: 'proxy'
      },
      {
        name: 'HTML',
        nameKey: 'website.tabs.static',
        index: 6,
        value: 'static'
      }
      // {
      //   name: '其他项目',
      //   index: 7
      // }
    ],
    clickActive: (item: any) => {
      conf.tabs.activeIndex = item.index
      conf.website.params.type = item.value
      conf.website.getData()
    }
  },
  website: {
    data: [],
    total: 0,
    columns: computed(() => [
      { prop: 'name', label: t('website.websiteName', 'Website name'), width: 180 },
      { prop: 'domain', label: t('website.domain', 'Domain'), width: 180 },
      { prop: 'engine', label: t('website.webServerOwner', '归属 Web Server'), width: 170 },
      { prop: 'root_dir', label: t('website.rootDir', '根目录') },
      { prop: 'status', label: t('website.status', 'Status'), width: 130 },
      { prop: 'traffic', label: t('website.todayTraffic', 'Today traffic'), width: 120 },
      { prop: 'expiration', label: t('website.expiration', 'Expiration'), width: 180 },
      { prop: 'ssl', label: 'SSL', width: 100 },
      { prop: 'action', label: t('common.action', 'Action'), width: 320, fixed: 'right' as const }
    ]),
    params: {
      type: 'php',
      page: 1,
      pageSize: 10
    } as any,
    loading: true,
    getData: async () => {
      conf.website.loading = true
      const { data: res } = await Api.getWebsiteList(conf.website.params)
      conf.website.loading = false
      conf.website.total = res.total
      conf.website.data = res.data
    },
    handleAdd: () => {
      conf.drawer.open('add')
      conf.form.data.value = { type: conf.website.params.type, expires_at: null }
    }
  },
  drawer: {
    show: false,
    title: t('website.createWebsite'),
    type: 'add',
    loading: false,
    open: (type: 'add' | 'edit', row?: any) => {
      conf.drawer.title = t('website.createWebsite', '创建网站')
      conf.drawer.type = type
      if (type === 'edit') {
        conf.drawer.title = t('website.setWebsite', '设置网站')
        const cloneRow = structuredClone(toRaw(row))
        const domain = cloneRow.domain?.split(',')
        conf.form.data.value = cloneRow
        conf.form.data.value.hostDomain = domain[0].trim()
        domain.shift()
        conf.form.data.value.otherDomain = domain.join('\n')
      }
      conf.drawer.show = true
    },
    onConfirm: () => {
      conf.form.instance?.validate(async (valid) => {
        if (!valid) return
        conf.form.data.value.hostDomain = typeof conf.form.data.value.hostDomain === 'string'
          ? conf.form.data.value.hostDomain.trim()
          : conf.form.data.value.hostDomain
        conf.form.data.value.otherDomain = typeof conf.form.data.value.otherDomain === 'string'
          ? conf.form.data.value.otherDomain.trim()
          : conf.form.data.value.otherDomain
        conf.form.data.value.root_dir = normalizeWebsiteRootDirInput(conf.form.data.value.root_dir)
        let otherDomain = ''
        if (conf.form.data.value.otherDomain) {
          otherDomain = conf.form.data.value.otherDomain?.split('\n')
        } else {
          otherDomain = ''
        }


        conf.form.data.value.domain = otherDomain != ''
          ? `${conf.form.data.value.hostDomain.trim()},${otherDomain}`
          : conf.form.data.value.hostDomain

        try {
          conf.drawer.loading = true
          const operation = conf.drawer.type === 'add' ? 'website.create' : 'website.update'
          await submitOperation(operation, buildWebsitePayload(structuredClone(toRaw(conf.form.data.value))))
          ElMessage({
            type: 'success',
            message: conf.drawer.type === 'add' ? t('website.createSuccess', '创建网站成功') : t('website.updateSuccess', '更新网站成功')
          })
          conf.drawer.show = false
          conf.website.getData()
        } catch (error: any) {
          if (isOperationCancelled(error)) return
          ElMessage({
            type: 'error',
            message: error.message || t('common.operationFailed', '操作失败')
          })
        } finally {
          conf.drawer.loading = false
        }

      })
    },
    onClose: () => {
      conf.form.data.value = {}
      conf.form.instance?.resetFields()
      conf.form.instance?.clearValidate()
      conf.drawer.show = false
    }
  },
  form: {
    instance: null as FormInstance | null,
    data: {
      value: {} as any,
      items: computed<FormItem[]>(() => {
        switch (conf.website.params.type) {
          case 'php':
          case 'static':
            return [
              {
                label: t('website.primaryDomain', '主域名'),
                type: 'input',
                placeholder: t('website.domainPortPlaceholder', '支持域名:端口'),
                prop: 'hostDomain',
                rules: [
                  { required: true, message: t('website.primaryDomainRequired', '请输入主域名'), trigger: 'blur' },
                  {
                    pattern: /^(([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))(:\d{1,5})?$/,
                    message: t('website.domainFormatError', '域名格式错误'),
                    trigger: 'blur'
                  }
                ],
                change: (value) => {
                  // 当域名改变时，自动设置目录
                  const domainPattern = /^(([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))(:\d{1,5})?$/
                  if (value && !conf.form.data.value.root_dir && domainPattern.test(value)) {
                    // 如果有端口号，去掉端口号
                    const domainWithoutPort = value.split(':')[0]
                    conf.form.data.value.root_dir = domainWithoutPort
                  }
                }
              },
              {
                label: t('website.otherDomains', '其他域名'),
                type: 'textarea',
                placeholder: t('website.otherDomainsPlaceholder', '一行一个域名，支持*和IP地址，支持"域名:端口"'),
                prop: 'otherDomain'
              },
              {
                label: t('website.rootDir', '根目录'),
                type: 'input',
                placeholder: t('website.rootDirPlaceholder', '相对于受管网站根目录的目录，例如 example.com'),
                prop: 'root_dir',
                rules: [
                  { required: true, message: t('website.rootDirRequired', '请选择根目录'), trigger: 'blur' },
                  { validator: validateManagedWebsiteRootDir, trigger: ['blur', 'change'] }
                ]
              },
              {
                label: t('common.remark', '备注'),
                type: 'textarea',
                prop: 'remark'
              },
              {
                label: t('website.expiration'),
                type: 'custom',
                prop: 'expires_at'
              }
            ]
          case 'proxy':
            conf.form.data.value.pact ||= 'http'
            conf.form.data.value.tar_url ||= '$http_host'
            return [
              {
                label: t('website.primaryDomain', '主域名'),
                type: 'input',
                placeholder: t('website.domainPortPlaceholder', '支持域名:端口'),
                prop: 'hostDomain',
                rules: [
                  { required: true, message: t('website.primaryDomainRequired', '请输入主域名'), trigger: 'blur' },
                  { pattern: /^([0-9a-zA-Z-]{1,}\.)+([a-zA-Z]{2,})$/, message: t('website.domainFormatError', '域名格式错误'), trigger: 'blur' }
                ]
              },
              {
                label: t('website.otherDomains', '其他域名'),
                type: 'textarea',
                placeholder: t('website.otherDomainsPlaceholder', '一行一个域名，支持*和IP地址，支持"域名:端口"'),
                prop: 'otherDomain'
              },
              {
                label: t('website.proxyAddress', '代理地址'),
                type: 'custom',
                placeholder: t('website.proxyAddressPlaceholder', '例：127.0.0.1:8080'),
                prop: 'send_url',
                rules: [{ required: true, message: t('website.proxyAddressRequired', '请输入代理地址'), trigger: 'blur' }]
              },
              {
                label: t('common.remark', '备注'),
                type: 'textarea',
                prop: 'remark'
              },
              {
                label: t('website.expiration'),
                type: 'custom',
                prop: 'expires_at'
              }
            ]
          default:
            return []
        }
      })
    }
  },
  dialog: {
    show: false,
    title: t('website.deleteConfirmTitle', '网站删除确认'),
    type: 'delete',
    row: {} as any,
    loading: false,
    confirmName: '',
    databaseId: 0,
    deleteFiles: false,
    databases: [] as any[],
    open: (type: 'delete', row?: any) => {
      conf.dialog.type = type
      conf.dialog.row = row
      conf.dialog.confirmName = ''
      conf.dialog.databaseId = 0
      conf.dialog.deleteFiles = false
      switch (type) {
        case 'delete':
          conf.dialog.title = t('website.deleteConfirmTitle', '网站删除确认')
          break
      }
      conf.dialog.show = true
      conf.dialog.databases = []
      if (!canReadDatabase()) return
      Api.getDatabaseList({ type: 'mysql', page: 1, pageSize: 100 })
        .then(({ data }) => {
          conf.dialog.databases = data?.data || []
        })
        .catch(() => {
          conf.dialog.databases = []
          ElMessage.warning(t('website.databaseListUnavailable', '当前角色无法读取数据库列表，将按“不关联数据库”继续删除'))
        })
    },
    close: () => {
      conf.dialog.show = false
    },
    confirm: async () => {
      if (conf.dialog.confirmName !== conf.dialog.row.name) {
        ElMessage.error(t('website.websiteNameMismatch', '网站名不匹配'))
        return
      }
      conf.dialog.loading = true
      try {
        const response = await Api.delWebsite({
          id: conf.dialog.row.id,
          confirmName: conf.dialog.confirmName,
          databaseId: conf.dialog.databaseId || undefined,
          deleteFiles: conf.dialog.deleteFiles
        })
        const { taskId, approvalId, status } = extractWebsiteOperationMeta(response)
        const responseMessage = [
          response?.message,
          response?.detail,
          response?.data?.message,
          response?.data?.detail
        ].find((item) => typeof item === 'string' && item.trim())
        if (taskId) {
          ElMessage.success(t('website.deleteTaskCreated', '安全删除任务已创建，完整快照验证成功后才会删除网站'))
          backupDrawer.open(conf.dialog.row)
          conf.dialog.show = false
          conf.website.getData()
          return
        }

        if (
          approvalId ||
          ['pending', 'waiting_approval', 'awaiting_approval', 'approval_pending'].includes(status) ||
          /审批|approval/i.test(String(responseMessage || ''))
        ) {
          ElMessage.success(t('website.deleteApprovalCreated', '已提交删除审批申请，等待审批通过后会自动生成删除任务'))
          conf.dialog.show = false
          conf.website.getData()
          return
        }

        if (!extractWebsiteTaskId(response) && !extractWebsiteApprovalId(response)) {
          ElMessage.error(t('website.deleteTaskMissing', '后端未返回删除任务，网站未确认进入删除流程'))
          return
        }
      } finally {
        conf.dialog.loading = false
      }
    }
  }
})

conf.website.getData()
webServer.load()
loadServiceStatuses()
</script>

<template>
  <div class="website-container">
    <card-tabs :list="conf.tabs.list" :active-index="conf.tabs.activeIndex" :click-active="conf.tabs.clickActive" />
    <section class="website-console">
      <div class="website-console__main">
        <div class="website-console__actions">
          <div class="action-with-reason">
            <el-tooltip :content="addSiteDisabledReason" :disabled="!addSiteDisabledReason">
              <span class="disabled-action-wrapper">
                <el-button type="primary" :disabled="!webServer.data.available" @click="conf.website.handleAdd">{{ $t('website.addSite') }}</el-button>
              </span>
            </el-tooltip>
            <!-- <div v-if="addSiteDisabledReason" class="action-disabled-reason" role="note">
              <el-icon><WarningFilled /></el-icon>
              <span>{{ addSiteDisabledReason }}</span>
            </div> -->
          </div>

          <el-dropdown trigger="click" placement="bottom-start">
            <el-button class="website-console__ghost-btn">
              <span>{{ $t('website.advancedActions', '高级设置') }}</span>
              <el-icon><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="backupDrawer.open()">
                  {{ $t('website.fullBackupManagement') }}
                </el-dropdown-item>
                <el-dropdown-item :disabled="!webServer.data.configurationAvailable" @click="webServer.configVisible = true">
                  {{ $t('website.manageConfigFiles') }}
                </el-dropdown-item>
                <el-dropdown-item @click="handleWebsitePageRefresh">
                  {{ $t('website.refreshStatus') }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <el-tooltip
            :content="runtimeDropdownDisabledReason || `${webServerStatusLabel} · ${$t('website.siteConfigDir')} ${webServer.data.siteConfigDir || '-'}`"
            placement="top"
          >
            <span class="disabled-action-wrapper">
              <el-popover
                v-model:visible="webServer.menuVisible"
                trigger="click"
                placement="top-start"
                :width="'auto'"
                popper-class="website-webserver-popover"
                :disabled="!webServer.data.available"
              >
                <div class="website-server-actions">
                  <el-button
                    v-if="webServerState === 'running'"
                    link
                    :icon="SwitchButton"
                    :loading="serviceSubmitting === 'stop'"
                    :disabled="runtimeDropdownDisabled || !serviceActionAllowed(webServerServiceStatus, 'stop')"
                    @click="runWebServerAction('stop')"
                  >{{ $t('website.stopService') }}</el-button>
                  <el-button
                    v-else
                    link
                    :icon="VideoPlay"
                    :loading="serviceSubmitting === 'start'"
                    :disabled="runtimeDropdownDisabled || !serviceActionAllowed(webServerServiceStatus, 'start')"
                    @click="runWebServerAction('start')"
                  >{{ $t('website.startService') }}</el-button>
                  <el-button
                    link
                    :icon="RefreshRight"
                    :loading="serviceSubmitting === 'restart'"
                    :disabled="runtimeDropdownDisabled || !serviceActionAllowed(webServerServiceStatus, 'restart')"
                    @click="runWebServerAction('restart')"
                  >{{ $t('website.restartService') }}</el-button>
                  <el-button
                    link
                    :icon="Refresh"
                    :loading="serviceSubmitting === 'reload'"
                    :disabled="runtimeDropdownDisabled || !serviceActionAllowed(webServerServiceStatus, 'reload')"
                    @click="runWebServerAction('reload')"
                  >{{ $t('website.reloadService') }}</el-button>
                  <el-button
                    link
                    :icon="Setting"
                    :disabled="!webServer.data.configurationAvailable"
                    @click="openWebServerConfig"
                  >{{ $t('website.webServerConfigAction') }}</el-button>
                </div>
                <template #reference>
                  <button
                    type="button"
                    class="website-console__runtime-chip"
                    :class="`is-${webServerState}`"
                    :disabled="!webServer.data.available"
                    :aria-label="$t('website.webServerMenuLabel', { name: webServerDisplayName })"
                  >
                    <span class="website-console__runtime-badge">{{ webServerLogoText }}</span>
                    <span class="website-console__runtime-name">{{ webServerDisplayName }}</span>
                    <span class="website-console__runtime-version">{{ webServerVersionText }}</span>
                    <span class="website-console__runtime-state" aria-hidden="true"></span>
                    <el-icon><ArrowDown /></el-icon>
                  </button>
                </template>
              </el-popover>
            </span>
          </el-tooltip>

          <button class="website-console__metric" type="button">
            <span>{{ $t('website.metricTotal', '网站统计总览') }}</span>
            <strong>{{ websiteMetrics.total }}</strong>
          </button>
          <button class="website-console__metric" type="button">
            <span>{{ $t('website.metricRunning', '运行中') }}</span>
            <strong>{{ websiteMetrics.runningCount }}</strong>
          </button>
          <button class="website-console__metric" type="button">
            <span>{{ $t('website.metricSsl', 'SSL 已启用') }}</span>
            <strong>{{ websiteMetrics.sslCount }}</strong>
          </button>
          <button class="website-console__metric" type="button">
            <span>{{ $t('website.metricExpiring', '即将到期') }}</span>
            <strong>{{ websiteMetrics.expiringCount }}</strong>
          </button>
        </div>

      </div>

      <div class="website-console__search">
        <div class="website-console__category">
          <el-select v-model="selectedCategory" style="width: 160px">
            <el-option
              v-for="item in websiteTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>
        <div class="website-search-panel">
          <search-input
            v-model="conf.website.params.name"
            class="website-search-panel__input"
            :placeholder="$t('website.searchPlaceholder', '请输入域名或备注')"
            @search="conf.website.getData()"
          />
          <el-button class="website-search-panel__refresh" :icon="Refresh" @click="handleWebsitePageRefresh" />
          <el-button class="website-search-panel__refresh" :icon="Setting" @click="webServer.configVisible = true" />
        </div>
      </div>
    </section>
    <div class="website-table-panel">
      <custom-table v-model:page="conf.website.params.page" v-model:page-size="conf.website.params.pageSize" :loading="conf.website.loading" :empty-text="$t('common.noData')" :data="conf.website.data"
        :columns="conf.website.columns" :auto-pagination="false" :total="conf.website.total"
        @update:page="conf.website.getData" @update:page-size="() => { conf.website.params.page = 1; conf.website.getData() }">
        <template #summary>
          <div class="website-table-summary">
            <span>{{ $t('website.metricTotal', '网站统计总览') }} {{ websiteMetrics.total }}</span>
            <span>{{ $t('website.metricRunning', '运行中') }} {{ websiteMetrics.runningCount }}</span>
            <span>{{ $t('website.metricSsl', 'SSL 已启用') }} {{ websiteMetrics.sslCount }}</span>
          </div>
        </template>
        <template #root_dir="{ row }">
          <el-link
            v-if="row.root_dir"
            class="website-root-link"
            type="primary"
            :underline="false"
            :title="row.root_dir"
            @click="openWebsiteRoot(row.root_dir)"
          >
            <el-icon><FolderOpened /></el-icon>
            <span class="website-root-link__path">{{ row.root_dir }}</span>
          </el-link>
          <span v-else class="website-root-link__empty">—</span>
        </template>
        <template #engine="{ row }">
          <el-tag
            class="website-engine-tag"
            effect="plain"
            :style="getWebsiteEngineTagStyle(row.engine)"
          >
            {{ getWebsiteEngineLabel(row.engine) }}
          </el-tag>
        </template>
        <template #action="{ row }">
          <div class="table-row-actions">
            <el-button
              class="website-action-btn website-action-btn--ssl"
              type="primary"
              link
              :icon="Lock"
              @click="certificateDrawer.open(row)"
            >
              <span class="website-action-btn__label">SSL</span>
            </el-button>
            <el-button
              class="website-action-btn website-action-btn--backup"
              type="primary"
              link
              :icon="FolderAdd"
              @click="backupDrawer.open(row)"
            >
              <span class="website-action-btn__label">{{ $t('website.backup') }}</span>
            </el-button>
            <el-button
              class="website-action-btn website-action-btn--settings"
              type="primary"
              link
              :icon="Setting"
              @click="settingsDrawer.open(row)"
            >
              <span class="website-action-btn__label">{{ $t('website.settings') }}</span>
            </el-button>
            <el-button
              class="website-action-btn website-action-btn--danger"
              type="danger"
              link
              :icon="Delete"
              @click="conf.dialog.open('delete', row)"
            >
              <span class="website-action-btn__label">{{ $t('common.delete') }}</span>
            </el-button>
          </div>
        </template>
        <template #status="{ row }">
          <div class="website-status">
            <el-switch
              :model-value="Boolean(row.enabled)"
              :loading="statusLoading.has(row.id)"
              @change="toggleWebsiteStatus(row, Boolean($event))"
            />
            <span :class="{ expired: row.disabled_reason === 'expired' }">
              {{ row.enabled ? $t('website.running') : row.disabled_reason === 'expired' ? $t('website.expired') : $t('common.disabled') }}
            </span>
          </div>
        </template>
        <template #traffic="{ row }">
          <div class="website-traffic">
            <strong>{{ formatWebsiteTraffic(row.today_traffic_bytes) }}</strong>
            <span>{{ t('website.requestCount', '', { count: Number(row.today_requests || 0).toLocaleString() }) }}</span>
          </div>
        </template>
        <template #expiration="{ row }">
          <el-tag
            class="website-expiration-tag website-chip"
            :type="row.expires_at && new Date(row.expires_at).getTime() <= Date.now() ? 'danger' : row.expires_at ? 'warning' : 'info'"
            effect="plain"
          >
            {{ formatWebsiteExpiration(row.expires_at) }}
          </el-tag>
        </template>
        <template #ssl="{ row }">
          <el-tag v-if="row.ssl_enabled" class="website-chip" :type="row.certificate_status === 'active' ? 'success' : 'warning'">
            {{ row.certificate_status === 'active' ? $t('common.enabled') : row.certificate_status === 'expired' ? $t('website.expired') : $t('website.expiringSoon') }}
          </el-tag>
          <el-tag v-else class="website-chip" type="info">{{ $t('common.disabled') }}</el-tag>
        </template>
      </custom-table>
    </div>
    <!--创建网站弹窗-->
    <custom-drawer class="website-create-drawer" :visible="conf.drawer.show" :title="conf.drawer.title" :empty-text="$t('common.noData')" :loading="conf.drawer.loading"
      size="820px" :on-close="conf.drawer.onClose" :on-confirm="conf.drawer.onConfirm">
      <custom-form v-if="conf.drawer.show" :data="conf.form.data" :on-init="(el) => (conf.form.instance = el)">
        <template #send_url="{ row }">
          <el-input v-model="conf.form.data.value.send_url" :placeholder="row.placeholder">
            <template #prepend>
              <el-select v-model="conf.form.data.value.pact" style="width: 80px">
                <el-option label="http" value="http" />
                <el-option label="https" value="https" />
              </el-select>
            </template>
          </el-input>
        </template>
        <template #expires_at>
          <el-date-picker
            v-model="conf.form.data.value.expires_at"
            type="datetime"
            :placeholder="t('website.settingsDrawer.expirationPlaceholder')"
            clearable
            style="width: 100%"
          />
        </template>
      </custom-form>
    </custom-drawer>

    <custom-dialog v-model="conf.dialog.show" :title="conf.dialog.title">
      <template v-if="conf.dialog.type === 'delete'">
        <el-alert
          :title="$t('website.deleteSnapshotTip')"
          type="warning"
          show-icon
          :closable="false"
        />
        <el-form label-position="top" class="delete-form">
          <el-form-item :label="$t('website.databaseOptional')">
            <el-select v-model="conf.dialog.databaseId" style="width: 100%" :placeholder="$t('website.noDatabase')">
              <el-option :label="$t('website.noDatabase')" :value="0" />
              <el-option
                v-for="database in conf.dialog.databases"
                :key="database.id"
                :label="database.name"
                :value="database.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('website.fileHandling')">
            <el-checkbox v-model="conf.dialog.deleteFiles">
              {{ $t('website.deleteFilesAfterSnapshot') }}
            </el-checkbox>
          </el-form-item>
          <el-form-item :label="$t('website.confirmWebsiteName', { name: conf.dialog.row.name || '' })">
            <el-input v-model="conf.dialog.confirmName" :placeholder="conf.dialog.row.name" />
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <el-button @click="conf.dialog.close">{{ $t('common.cancel') }}</el-button>
        <el-button
          type="danger"
          :loading="conf.dialog.loading"
          :disabled="conf.dialog.confirmName !== conf.dialog.row.name"
          @click="conf.dialog.confirm"
        >
          {{ $t('website.createSnapshotAndDelete') }}
        </el-button>
      </template>
    </custom-dialog>

    <website-certificate-drawer
      v-model="certificateDrawer.show"
      :website="certificateDrawer.website"
      @changed="conf.website.getData()"
    />
    <website-backup-drawer
      v-model="backupDrawer.show"
      :website="backupDrawer.website"
      @changed="conf.website.getData()"
    />
    <web-server-config-drawer
      v-model="webServer.configVisible"
      @changed="webServer.load"
    />
    <website-settings-drawer
      v-model="settingsDrawer.show"
      :website="settingsDrawer.website"
      @changed="conf.website.getData()"
    />
  </div>
</template>

<style scoped lang="less">
.website-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.website-console {
  padding: 16px;
  border: 1px solid var(--border-subtle);
  border-radius: 20px;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--surface-card) 92%, #0f172a 8%), var(--surface-card));
  box-shadow:
    inset 0 0 0 1px rgba(148, 163, 184, 0.06),
    0 14px 30px rgba(15, 23, 42, 0.06);
}

.website-console__main,
.website-console__search {
  display: flex;
  align-items: center;
  gap: 12px;
}

.website-console__search {
  margin-top: 14px;
}

.website-console__actions {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.website-console__ghost-btn {
  min-height: 40px;
}

.website-console__metric {
  min-width: 124px;
  padding: 10px 14px;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  background: color-mix(in srgb, var(--surface-card) 94%, transparent);
  color: var(--text-secondary);

  span {
    font-size: 12px;
    white-space: nowrap;
  }

  strong {
    color: var(--text-primary);
    font-size: 16px;
    font-weight: 700;
  }
}

.website-console__runtime-chip {
  min-height: 40px;
  padding: 0 14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(34, 197, 94, 0.28);
  border-radius: 8px;
  background: rgba(34, 197, 94, 0.07);
  color: #15803d;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.18s ease, background-color 0.18s ease;

  &:hover,
  &:focus-visible {
    border-color: rgba(34, 197, 94, 0.48);
    background: rgba(34, 197, 94, 0.12);
    outline: none;
  }

  &.is-stopped,
  &.is-unknown,
  &.is-transitioning {
    border-color: rgba(245, 158, 11, 0.3);
    background: rgba(245, 158, 11, 0.08);
    color: #b45309;
  }

  &.is-failed {
    border-color: rgba(239, 68, 68, 0.28);
    background: rgba(239, 68, 68, 0.07);
    color: #dc2626;
  }

  &.is-not_installed {
    border-color: var(--border-subtle);
    background: var(--surface-subtle);
    color: var(--text-secondary);
  }
}

.website-console__runtime-badge {
  width: 18px;
  height: 18px;
  display: inline-grid;
  place-items: center;
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.18);
  font-size: 11px;
  font-weight: 800;
}

.website-console__runtime-name {
  max-width: 126px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.website-console__runtime-version {
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
}

.website-console__runtime-state {
  width: 7px;
  height: 7px;
  flex: 0 0 7px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 0 3px color-mix(in srgb, currentColor 12%, transparent);
}

.website-server-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  white-space: nowrap;

  :deep(.el-button) {
    min-height: 30px;
    margin-left: 0;
    padding: 0 8px;
    color: var(--text-secondary);
    font-size: 12px;
  }

  :deep(.el-button:hover) {
    color: var(--el-color-primary);
    background: color-mix(in srgb, var(--el-color-primary) 8%, transparent);
  }
}

:global(.website-webserver-popover.el-popper) {
  min-width: 0;
  padding: 6px 8px;
  border-radius: 8px;
}

.website-console__category {
  flex: 0 0 auto;
}

.website-table-panel {
  padding: 14px;
  border: 1px solid var(--border-subtle);
  border-radius: 20px;
  background: var(--surface-card);
  box-shadow:
    inset 0 0 0 1px rgba(148, 163, 184, 0.06),
    0 14px 30px rgba(15, 23, 42, 0.05);
}

.website-table-summary {
  display: inline-flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;

  span {
    color: var(--text-tertiary);
    font-size: 12px;
    white-space: nowrap;
  }
}

.website-search-panel {
  width: 100%;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.website-search-panel__input {
  flex: 1 1 auto;
  min-width: 0;
}

.website-search-panel__refresh {
  flex: 0 0 auto;
  min-width: 44px;
  padding-inline: 14px;
}

.action-with-reason {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex-wrap: wrap;
}

.disabled-action-wrapper {
  display: inline-flex;
}

.action-disabled-reason {
  max-width: 320px;
  padding: 7px 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid rgba(250, 173, 20, 0.24);
  border-radius: 999px;
  background: rgba(255, 247, 230, 0.92);
  color: #b45309;
  font-size: 12px;
  line-height: 1.4;
  white-space: nowrap;

  .el-icon {
    flex: 0 0 auto;
    font-size: 14px;
    color: #f97316;
  }

  span {
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.website-root-link {
  max-width: 100%;
  vertical-align: middle;
}

.website-root-link :deep(.el-link__inner) {
  max-width: 100%;
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.website-root-link__path {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.website-root-link__empty {
  color: var(--text-tertiary, #94a3b8);
}

.website-engine-tag {
  min-width: 112px;
  justify-content: center;
  padding-inline: 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.website-expiration-tag {
  min-width: 74px;
  justify-content: center;
  padding-inline: 10px;
  border-radius: 999px;
  font-weight: 500;
  letter-spacing: 0.01em;
}

.table-row-actions {
  gap: 8px !important;
}

.website-action-btn.is-link:not(.is-disabled) {
  --website-action-color: #f97316;
  --website-action-icon-color: color-mix(in srgb, var(--website-action-color) 82%, white 18%);
  --website-action-hover-bg: color-mix(in srgb, var(--website-action-color) 12%, transparent);
  --table-action-color: var(--website-action-color);
  --table-action-hover-color: var(--website-action-color);
  --el-button-text-color: var(--website-action-color);
  --el-button-hover-text-color: var(--website-action-color);
  --el-button-active-color: var(--website-action-color);
  min-height: 28px !important;
  padding: 4px 6px !important;
  border: 0 !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  color: var(--website-action-color) !important;
  font-size: 12px !important;
  font-weight: 700 !important;
  letter-spacing: 0.01em;
  line-height: 1.2;
  transition:
    color 0.18s ease,
    opacity 0.18s ease,
    transform 0.18s ease,
    background-color 0.18s ease;

  &:hover,
  &:focus-visible,
  &:active {
    background: var(--website-action-hover-bg) !important;
    color: var(--website-action-color) !important;
    box-shadow: none !important;
  }

  :deep(.el-icon) {
    color: var(--website-action-icon-color) !important;
    opacity: 1;
    font-size: 13px;
  }

  :deep(.el-button__text),
  :deep(.el-button__content),
  :deep(> span) {
    color: inherit !important;
    -webkit-text-fill-color: currentColor !important;
  }
}

.website-action-btn__label {
  color: inherit;
  font-weight: 700;
  -webkit-text-fill-color: currentColor;
}

.website-action-btn--ssl.is-link:not(.is-disabled) {
  --website-action-color: #ea580c;
}

.website-action-btn--backup.is-link:not(.is-disabled) {
  --website-action-color: #2563eb;
}

.website-action-btn--settings.is-link:not(.is-disabled) {
  --website-action-color: #7c3aed;
}

.website-action-btn--danger.is-link:not(.is-disabled) {
  --website-action-color: #dc2626;
  --website-action-icon-color: color-mix(in srgb, var(--website-action-color) 84%, white 16%);
  --website-action-hover-bg: color-mix(in srgb, var(--website-action-color) 14%, transparent);
  --table-action-danger-color: var(--website-action-color);
  --table-action-danger-hover-color: var(--website-action-color);
  --el-button-text-color: var(--website-action-color);
  --el-button-hover-text-color: var(--website-action-color);
  --el-button-active-color: var(--website-action-color);
}

.website-action-btn--danger.is-link:not(.is-disabled) :deep(.el-icon) {
  color: var(--website-action-icon-color) !important;
}

.website-action-btn--danger.is-link:not(.is-disabled):hover,
.website-action-btn--danger.is-link:not(.is-disabled):focus-visible,
.website-action-btn--danger.is-link:not(.is-disabled):active {
  background: var(--website-action-hover-bg) !important;
  color: var(--website-action-color) !important;
}

.website-status,
.website-traffic {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.website-status span {
  color: var(--text-secondary);
  font-size: 12px;

  &.expired {
    color: var(--el-color-danger);
  }
}

.website-traffic {
  align-items: flex-start;
  flex-direction: column;
  gap: 2px;

  strong {
    color: var(--text-primary);
    font-size: 13px;
  }

  span {
    color: var(--text-tertiary);
    font-size: 10px;
  }
}

.delete-form {
  margin-top: 16px;

  :deep(.el-select) {
    --el-select-input-color: var(--text-primary);
    --el-select-placeholder-color: var(--text-placeholder);
    --el-text-color-regular: var(--text-primary);
  }

  :deep(.el-select .el-select__wrapper) {
    background: var(--surface-card);
  }

  :deep(.el-input__inner),
  :deep(.el-select .el-select__selected-item),
  :deep(.el-select .el-select__selected-item > span),
  :deep(.el-select .el-select__placeholder),
  :deep(.el-select .el-select__placeholder > span) {
    color: var(--text-primary) !important;
    -webkit-text-fill-color: var(--text-primary) !important;
  }

  :deep(.el-input__inner::placeholder),
  :deep(.el-select .el-select__placeholder),
  :deep(.el-select .el-select__placeholder > span),
  :deep(.el-select .el-select__selected-item.is-placeholder),
  :deep(.el-select .el-select__selected-item.is-placeholder > span) {
    color: var(--text-placeholder) !important;
    -webkit-text-fill-color: var(--text-placeholder) !important;
  }

  :deep(.el-select .el-select__caret) {
    color: var(--text-tertiary);
  }
}

.website-create-drawer {
  :deep(.el-input-group__prepend) {
    background: transparent !important;
    box-shadow: none !important;
  }

  :deep(.el-input-group__prepend .el-select__wrapper) {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }
}

:deep(.el-form-item__label) {
  color: var(--text-primary);
}

@media (max-width: 1100px) {
  .website-console__main,
  .website-console__search {
    align-items: stretch;
    flex-direction: column;
  }

  .website-search-panel {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .website-console {
    padding: 14px;
  }

  .website-console__actions {
    width: 100%;
  }

  .website-console__metric {
    flex: 1 1 calc(50% - 5px);
    min-width: 0;
  }

  .website-search-panel {
    padding: 0;
    gap: 10px;
  }

  .action-disabled-reason {
    max-width: 100%;
    white-space: normal;
    border-radius: 12px;
  }
}

@media (max-width: 560px) {
  .website-console__metric,
  .website-console__runtime-chip {
    width: 100%;
  }

  .website-console__search {
    margin-top: 12px;
  }

  .website-search-panel {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 40px 40px;
    align-items: stretch;
  }

  .website-search-panel__refresh {
    width: 40px;
    min-width: 40px;
    margin-left: 0;
  }
}

:deep(.el-input-group--prepend .el-input-group__prepend .el-select .el-select__wrapper) {
  border-radius: 0 !important;
}
</style>
