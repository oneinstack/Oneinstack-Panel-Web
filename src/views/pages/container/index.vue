<script setup lang="ts">
import { computed, h, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import {
  Delete,
  Document,
  Monitor,
  Plus,
  Refresh,
  SwitchButton,
  VideoPause,
  VideoPlay
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, type FormRules } from 'element-plus'
import { Api } from '@/api/Api'
import sconfig from '@/sstore/sconfig'
import RuntimeSummary from './components/RuntimeSummary.vue'
import ContainerCreateDrawer from './components/ContainerCreateDrawer.vue'
import ContainerResourceDialog from './components/ContainerResourceDialog.vue'
import ContainerDetailDrawer from './components/ContainerDetailDrawer.vue'
import ContainerLogsDialog from './components/ContainerLogsDialog.vue'
import ContainerTerminalDrawer from './components/ContainerTerminalDrawer.vue'
import ContainerTaskDrawer from './components/ContainerTaskDrawer.vue'
import containerTaskStore from '@/sstore/containerTask'
import type {
  ContainerAction,
  ContainerItem,
  ContainerStats,
  DetailType,
  DialogType,
  ImageItem,
  ListState,
  MountMode,
  MountPermission,
  NetworkItem,
  PortProtocol,
  PortPublishMode,
  RegistryItem,
  ResourceTab,
  RuntimeInfo,
  TemplateItem,
  VolumeItem
} from './types'
import i18n from '@/lang'

const t = (key: string, fallback?: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params)
  return value && value !== key ? value : fallback || key
}

const activeTab = ref<ResourceTab>('containers')
const runtime = ref<RuntimeInfo | null>(null)
const runtimeLoading = ref(false)
const listLoading = ref(false)
const actionLoading = ref('')
const containers = ref<ContainerItem[]>([])
const images = ref<ImageItem[]>([])
const networks = ref<NetworkItem[]>([])
const volumes = ref<VolumeItem[]>([])
const composeProjects = ref<Record<string, any>[]>([])
const registries = ref<RegistryItem[]>([])
const templates = ref<TemplateItem[]>([])
const templatesSupported = ref(true)
const templatesMessage = ref('')
const dockerConfig = ref<Record<string, any> | null>(null)
const loadedTabs = reactive<Record<ResourceTab, boolean>>({
  containers: false,
  images: false,
  networks: false,
  volumes: false,
  compose: false,
  templates: false,
  registries: false,
  config: false
})
const listState = reactive<Record<'containers' | 'images' | 'networks' | 'volumes' | 'registries', ListState>>({
  containers: { page: 1, pageSize: 10, total: 0, search: '', status: '' },
  images: { page: 1, pageSize: 10, total: 0, search: '' },
  networks: { page: 1, pageSize: 10, total: 0, search: '' },
  volumes: { page: 1, pageSize: 10, total: 0, search: '' },
  registries: { page: 1, pageSize: 10, total: 0, search: '' }
})

const createDrawerRef = ref<InstanceType<typeof ContainerCreateDrawer>>()
const resourceDialogRef = ref<InstanceType<typeof ContainerResourceDialog>>()
const dialogVisible = ref(false)
const dialogType = ref<DialogType>('container')
const saving = ref(false)
const selectedContainers = ref<ContainerItem[]>([])
const selectedNetworks = ref<NetworkItem[]>([])
const selectedVolumes = ref<VolumeItem[]>([])
const logsVisible = ref(false)
const logsLoading = ref(false)
const logDownloading = ref(false)
const logTarget = ref<ContainerItem | null>(null)
const logsText = ref('')
const logTail = ref(100)
const logTimeFilter = ref('all')
const logTimestamps = ref(true)
const dialogTarget = ref<any>(null)
const importFile = ref<File | null>(null)
const detailVisible = ref(false)
const detailLoading = ref(false)
const detailType = ref<DetailType>('container')
const detailTarget = ref<any>(null)
const detailData = ref<Record<string, any> | null>(null)
const detailStats = ref<ContainerStats | null>(null)
const terminalDrawer = reactive({
  show: false,
  target: null as ContainerItem | null
})
const taskDrawer = reactive({
  show: false
})
let statsTimer: ReturnType<typeof setInterval> | undefined

const form = reactive({
  name: '',
  image: '',
  manualImage: false,
  reference: '',
  driver: '',
  portPublishMode: 'ports' as PortPublishMode,
  ports: [
    { host: '', container: '', protocol: 'tcp' as PortProtocol }
  ],
  networksText: 'bridge',
  ipv4: '',
  ipv6: '',
  mounts: [
    { mode: 'bind' as MountMode, source: '', target: '', permission: 'rw' as MountPermission }
  ],
  commandText: '',
  entrypointText: '',
  restart: 'no',
  cpuWeight: 1000,
  cpuLimit: 0,
  memoryLimitMB: 0,
  networkIpv4: false,
  networkIpv4Subnet: '',
  networkIpv4Gateway: '',
  networkIpv4IpRange: '',
  networkIpv4AuxAddressesText: '',
  networkIpv6: false,
  networkIpv6Subnet: '',
  networkIpv6Gateway: '',
  networkIpv6IpRange: '',
  networkIpv6AuxAddressesText: '',
  optionsText: '',
  volumeNfs: false,
  labelsText: '',
  environmentText: '',
  autoRemove: false,
  privileged: false,
  tty: false,
  openStdin: false
})

const imageActionForm = reactive({
  pullMode: 'reference' as 'reference' | 'registry',
  reference: '',
  registryId: undefined as number | string | undefined,
  imageName: '',
  buildMode: 'dockerfile' as 'dockerfile' | 'path',
  buildName: '',
  dockerfile: 'FROM nginx:1.27\nCOPY ./dist /usr/share/nginx/html',
  contextPath: '',
  dockerfilePath: '',
  labelsText: '',
  tagReference: '',
  removeOther: false,
  pushMode: 'reference' as 'reference' | 'registry',
  pushReference: '',
  pushImageName: ''
})

const registryForm = reactive({
  name: '',
  address: '',
  protocol: 'https' as 'http' | 'https',
  authEnabled: false,
  username: '',
  password: ''
})

const templateForm = reactive({
  name: '',
  description: '',
  content: 'services:\n  web:\n    image: nginx:1.27\n'
})

const configForm = reactive({
  raw: ''
})

const containerScope = computed(() => sconfig.scopeAccess?.container || {})
const canRead = computed(() => sconfig.hasScopeAccess('container', 'read'))
const canWrite = computed(() => containerScope.value.write || sconfig.hasScopeAccess('container', 'write'))
const canDelete = computed(() => containerScope.value.delete || sconfig.hasScopeAccess('container', 'delete'))
const canForceAction = computed(() => sconfig.hasActionAccess('container.force_action'))
const canReadLogs = computed(() => containerScope.value.logsRead || sconfig.hasScopeAccess('container', 'logsRead'))
const canUseTerminal = computed(() =>
  sconfig.hasActionAccess('container.terminal') || sconfig.hasScopeAccess('container', 'terminal')
)
const canCreateContainer = computed(() => canWrite.value || sconfig.hasActionAccess('container.create'))
const canImageWrite = computed(() => containerScope.value.imageWrite || sconfig.hasScopeAccess('container', 'imageWrite'))
const canNetworkWrite = computed(() => containerScope.value.networkWrite || sconfig.hasScopeAccess('container', 'networkWrite'))
const canVolumeWrite = computed(() => containerScope.value.volumeWrite || sconfig.hasScopeAccess('container', 'volumeWrite'))
const canComposeWrite = computed(() => containerScope.value.composeWrite || sconfig.hasScopeAccess('container', 'composeWrite'))
const canRegistryWrite = computed(() => containerScope.value.registryWrite || sconfig.hasScopeAccess('container', 'registryWrite'))
const canConfigWrite = computed(() => containerScope.value.configWrite || sconfig.hasScopeAccess('container', 'configWrite'))
const canCleanup = computed(() =>
  sconfig.hasActionAccess('container.dangerous.cleanup') ||
  containerScope.value.dangerousCleanup ||
  sconfig.hasScopeAccess('container', 'dangerousCleanup')
)

const runtimeAvailable = computed(() => runtime.value?.available !== false)
const runtimeStatusText = computed(() => {
  if (runtimeLoading.value) return t('container.checking', 'Checking')
  return runtimeAvailable.value ? t('container.runtimeAvailable', 'Runtime available') : t('container.runtimeUnavailable', 'Runtime unavailable')
})
const runningContainers = computed(() =>
  containers.value.filter((item) => String(item.Status || '').toLowerCase().startsWith('up')).length
)
const canReadContainerTask = computed(() =>
  sconfig.hasMenuAccess('task.read')
  && (
    sconfig.hasScopeAccess('task', 'readAll')
    || sconfig.hasScopeAccess('task', 'readSelf')
  )
)
const activeTaskCount = computed(() =>
  containerTaskStore.order.filter((id) => {
    const task = containerTaskStore.tasks[id]
    return task && !containerTaskStore.isTerminal(task.status)
  }).length
)
const totalImagesSize = computed(() => images.value.map((item) => item.Size).filter(Boolean).join(' / ') || '--')
const pageableTabs = ['containers', 'images', 'networks', 'volumes', 'registries'] as const
const hasPagination = computed(() => pageableTabs.includes(activeTab.value as typeof pageableTabs[number]))
const activeListState = computed(() => listState[activeTab.value as keyof typeof listState] || listState.containers)
const detailTitle = computed(() => {
  const target = detailTarget.value || {}
  if (detailType.value === 'container') return t('container.detailTitle', '{name} details', { name: target.Names || shortId(target.ID) })
  if (detailType.value === 'image') return t('container.detailTitle', '{name} details', { name: target.Repository ? imageReference(target) : shortId(target.ID) })
  if (detailType.value === 'network') return t('container.detailTitle', '{name} details', { name: target.Name || shortId(target.ID) })
  return t('container.detailTitle', '{name} details', { name: target.Name || t('container.volume', 'Volume') })
})

const rules = computed<FormRules>(() => ({
  name: [{ required: ['container', 'network', 'volume'].includes(dialogType.value), message: t('common.inputPlaceholder', 'Enter'), trigger: 'blur' }],
  image: [
    {
      validator: (_rule: unknown, value: string, callback: (error?: Error) => void) => {
        if (dialogType.value !== 'container') {
          callback()
          return
        }
        if (typeof value === 'string' && value.trim()) {
          callback()
          return
        }
        callback(new Error(form.manualImage ? t('container.searchPlaceholders.images', 'Enter image ID, repository, or tag') : t('container.create.selectImage', 'Select image')))
      },
      trigger: ['blur', 'change'],
    },
  ]
}))

const normalizeList = <T>(data: any): T[] => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.items)) return data.items
  return []
}

const updateListState = (tab: keyof typeof listState, data: any) => {
  const state = listState[tab]
  state.total = Number(data?.total ?? normalizeList(data).length ?? 0)
  state.page = Number(data?.page || state.page || 1)
  state.pageSize = Number(data?.pageSize || state.pageSize || 10)
}

const listQuery = (tab: keyof typeof listState) => {
  const state = listState[tab]
  return {
    page: state.page,
    pageSize: state.pageSize,
    search: state.search.trim() || undefined,
    ...(tab === 'containers' && state.status && state.status !== 'all' ? { status: state.status } : {})
  }
}

const resetForm = () => {
  form.name = ''
  form.image = ''
  form.manualImage = false
  form.reference = ''
  form.driver = ''
  form.portPublishMode = 'ports'
  form.ports = [
    { host: '', container: '', protocol: 'tcp' }
  ]
  form.networksText = 'bridge'
  form.ipv4 = ''
  form.ipv6 = ''
  form.mounts = [
    { mode: 'bind', source: '', target: '', permission: 'rw' }
  ]
  form.commandText = ''
  form.entrypointText = ''
  form.restart = 'no'
  form.cpuWeight = 1000
  form.cpuLimit = 0
  form.memoryLimitMB = 0
  form.networkIpv4 = false
  form.networkIpv4Subnet = ''
  form.networkIpv4Gateway = ''
  form.networkIpv4IpRange = ''
  form.networkIpv4AuxAddressesText = ''
  form.networkIpv6 = false
  form.networkIpv6Subnet = ''
  form.networkIpv6Gateway = ''
  form.networkIpv6IpRange = ''
  form.networkIpv6AuxAddressesText = ''
  form.optionsText = ''
  form.volumeNfs = false
  form.labelsText = ''
  form.environmentText = ''
  form.autoRemove = false
  form.privileged = false
  form.tty = false
  form.openStdin = false
  imageActionForm.pullMode = 'reference'
  imageActionForm.reference = ''
  imageActionForm.registryId = undefined
  imageActionForm.imageName = ''
  imageActionForm.buildMode = 'dockerfile'
  imageActionForm.buildName = ''
  imageActionForm.dockerfile = 'FROM nginx:1.27\nCOPY ./dist /usr/share/nginx/html'
  imageActionForm.contextPath = ''
  imageActionForm.dockerfilePath = ''
  imageActionForm.labelsText = ''
  imageActionForm.tagReference = ''
  imageActionForm.removeOther = false
  imageActionForm.pushMode = 'reference'
  imageActionForm.pushReference = ''
  imageActionForm.pushImageName = ''
  registryForm.name = ''
  registryForm.address = ''
  registryForm.protocol = 'https'
  registryForm.authEnabled = false
  registryForm.username = ''
  registryForm.password = ''
  templateForm.name = ''
  templateForm.description = ''
  templateForm.content = 'services:\n  web:\n    image: nginx:1.27\n'
  importFile.value = null
  dialogTarget.value = null
  createDrawerRef.value?.clearValidate()
  resourceDialogRef.value?.clearValidate()
}

const getRowKey = (row: Record<string, any>) =>
  row.ID || row.Id || row.id || row.Name || row.name || row.Project || row.NameWithTag || JSON.stringify(row)

const statusType = (status?: string) => {
  const value = String(status || '').toLowerCase()
  if (value.startsWith('up')) return 'success'
  if (value.includes('paused')) return 'warning'
  if (value.includes('exited') || value.includes('dead')) return 'danger'
  return 'info'
}

const normalizedContainerStatus = (row: ContainerItem) => String(row.Status || '').toLowerCase()
const isContainerPaused = (row: ContainerItem) => normalizedContainerStatus(row).includes('paused')
const isContainerRunning = (row: ContainerItem) =>
  normalizedContainerStatus(row).startsWith('up') && !isContainerPaused(row)
const isContainerRestarting = (row: ContainerItem) => normalizedContainerStatus(row).includes('restarting')
const isContainerRemoving = (row: ContainerItem) => normalizedContainerStatus(row).includes('removing')
const canStartContainer = (row: ContainerItem) =>
  !isContainerRunning(row) && !isContainerPaused(row) && !isContainerRestarting(row) && !isContainerRemoving(row)
const canStopContainer = (row: ContainerItem) =>
  isContainerRunning(row) || isContainerPaused(row) || isContainerRestarting(row)
const canRestartContainer = (row: ContainerItem) => isContainerRunning(row) || isContainerRestarting(row)
const canPauseContainer = (row: ContainerItem) => isContainerRunning(row)
const canUnpauseContainer = (row: ContainerItem) => isContainerPaused(row)
const canDeleteContainer = (row: ContainerItem) =>
  !isContainerRunning(row) && !isContainerPaused(row) && !isContainerRestarting(row) && !isContainerRemoving(row)
const canOpenContainerTerminal = (row: ContainerItem) => canUseTerminal.value && isContainerRunning(row)

const imageReference = (row: ImageItem) => {
  const repo = row.Repository || '<none>'
  const tag = row.Tag || '<none>'
  return `${repo}:${tag}`
}

const registryLabel = (row: RegistryItem) => `${row.protocol}://${row.address}`

const shortId = (id?: string) => String(id || '').replace(/^sha256:/, '').slice(0, 12) || '--'

const loadRuntime = async () => {
  runtimeLoading.value = true
  try {
    const { data } = await Api.getContainerRuntime()
    runtime.value = data || { available: false, message: '未获取到 Docker 运行时信息' }
  } finally {
    runtimeLoading.value = false
  }
}

const loadActiveTab = async (force = false) => {
  if (!canRead.value) return
  if (!force && loadedTabs[activeTab.value]) return
  listLoading.value = true
  try {
    if (activeTab.value === 'containers') {
      const { data } = await Api.getContainers(listQuery('containers'))
      containers.value = normalizeList<ContainerItem>(data)
      updateListState('containers', data)
    }
    if (activeTab.value === 'images') {
      const { data } = await Api.getContainerImages(listQuery('images'))
      images.value = normalizeList<ImageItem>(data)
      updateListState('images', data)
    }
    if (activeTab.value === 'networks') {
      const { data } = await Api.getContainerNetworks(listQuery('networks'))
      networks.value = normalizeList<NetworkItem>(data)
      updateListState('networks', data)
    }
    if (activeTab.value === 'volumes') {
      const { data } = await Api.getContainerVolumes(listQuery('volumes'))
      volumes.value = normalizeList<VolumeItem>(data)
      updateListState('volumes', data)
    }
    if (activeTab.value === 'compose') {
      const { data } = await Api.getContainerCompose()
      composeProjects.value = normalizeList<Record<string, any>>(data)
    }
    if (activeTab.value === 'templates') {
      const { data } = await Api.getContainerTemplates()
      templates.value = normalizeList<TemplateItem>(data)
      templatesSupported.value = data?.supported !== false
      templatesMessage.value = data?.message || ''
    }
    if (activeTab.value === 'registries') {
      const { data } = await Api.getContainerRegistries(listQuery('registries'))
      registries.value = normalizeList<RegistryItem>(data)
      updateListState('registries', data)
    }
    if (activeTab.value === 'config') {
      const { data } = await Api.getContainerConfig()
      dockerConfig.value = data || null
      configForm.raw = data?.raw || '{}'
    }
    loadedTabs[activeTab.value] = true
  } finally {
    listLoading.value = false
  }
}

const refreshAll = async () => {
  await loadRuntime()
  Object.keys(loadedTabs).forEach((key) => {
    loadedTabs[key as ResourceTab] = false
  })
  await loadActiveTab(true)
}

const ensureVolumesLoaded = async () => {
  if (volumes.value.length || loadedTabs.volumes) return
  try {
    const { data } = await Api.getContainerVolumes({ page: 1, pageSize: 100 })
    volumes.value = normalizeList<VolumeItem>(data)
    loadedTabs.volumes = true
  } catch (error) {
    console.warn('加载存储卷列表失败', error)
  }
}

const ensureImagesLoaded = async () => {
  if (images.value.length || loadedTabs.images) return
  try {
    const { data } = await Api.getContainerImages({ page: 1, pageSize: 100 })
    images.value = normalizeList<ImageItem>(data)
    loadedTabs.images = true
  } catch (error) {
    console.warn('加载镜像列表失败', error)
  }
}

const ensureNetworksLoaded = async () => {
  if (networks.value.length || loadedTabs.networks) return
  try {
    const { data } = await Api.getContainerNetworks({ page: 1, pageSize: 100 })
    networks.value = normalizeList<NetworkItem>(data)
    loadedTabs.networks = true
  } catch (error) {
    console.warn('加载网络列表失败', error)
  }
}

const ensureRegistriesLoaded = async () => {
  if (registries.value.length || loadedTabs.registries) return
  try {
    const { data } = await Api.getContainerRegistries({ page: 1, pageSize: 100 })
    registries.value = normalizeList<RegistryItem>(data)
    loadedTabs.registries = true
  } catch (error) {
    console.warn('加载 Registry 列表失败', error)
  }
}

const openDialog = (type: DialogType, target?: any) => {
  resetForm()
  dialogType.value = type
  dialogTarget.value = target || null
  form.driver = type === 'network' ? 'bridge' : type === 'volume' ? 'local' : ''
  if (type === 'image-tag' && target) imageActionForm.tagReference = imageReference(target)
  if (type === 'image-push' && target) imageActionForm.pushReference = imageReference(target)
  if (type === 'registry' && target) {
    registryForm.name = target.name || ''
    registryForm.address = target.address || ''
    registryForm.protocol = target.protocol || 'https'
    registryForm.authEnabled = !!target.authEnabled
    registryForm.username = target.username || ''
  }
  if (type === 'template' && target) {
    templateForm.name = target.name || ''
    templateForm.description = target.description || ''
    templateForm.content = target.content || ''
  }
  dialogVisible.value = true
  if (type === 'container') {
    void ensureImagesLoaded()
    void ensureNetworksLoaded()
    void ensureVolumesLoaded()
  }
  if (['image', 'image-push'].includes(type)) void ensureRegistriesLoaded()
}

const splitTokens = (value: string) =>
  value.split(/[\n,]+/).map((item) => item.trim()).filter(Boolean)

const parseStringList = (value: string, fieldLabel: string) => {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) return parsed
    } catch {
      // fall through to validation error below
    }
    throw new Error(`${fieldLabel} 请输入 JSON 字符串数组，或每行一个参数`)
  }
  return splitTokens(value)
}

const parseKeyValueMap = (value: string, fieldLabel: string) => {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return Object.fromEntries(
          Object.entries(parsed).map(([key, item]) => [key, String(item ?? '')])
        )
      }
    } catch {
      // fall through to validation error below
    }
    throw new Error(`${fieldLabel} 请输入 JSON 对象，或每行一个 key=value`)
  }

  const result: Record<string, string> = {}
  splitTokens(value).forEach((line) => {
    const equalIndex = line.indexOf('=')
    if (equalIndex <= 0) throw new Error(`${fieldLabel} 格式应为 key=value`)
    result[line.slice(0, equalIndex).trim()] = line.slice(equalIndex + 1).trim()
  })
  return Object.keys(result).length ? result : undefined
}

const expandPortRange = (value: string, fieldLabel: string) => {
  const text = value.trim()
  if (!text) return []
  if (!/^\d+(-\d+)?$/.test(text)) throw new Error(`${fieldLabel} 端口格式应为 80 或 80-88`)
  const [startText, endText] = text.split('-')
  const start = Number(startText)
  const end = endText ? Number(endText) : start
  if (start < 1 || end > 65535 || start > end) throw new Error(`${fieldLabel} 端口范围应在 1-65535 之间`)
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

const parseHostPortInput = (value: string) => {
  const text = value.trim()
  if (!text) return { hostIp: undefined as string | undefined, ports: [] as number[] }
  const colonIndex = text.lastIndexOf(':')
  if (colonIndex > -1) {
    const hostIp = text.slice(0, colonIndex).trim()
    const portText = text.slice(colonIndex + 1).trim()
    if (!hostIp || !portText) throw new Error('服务器端口格式应为 80、80-88、IP:80 或 IP:80-88')
    return { hostIp, ports: expandPortRange(portText, '服务器') }
  }
  return { hostIp: undefined, ports: expandPortRange(text, '服务器') }
}

const buildPorts = () => {
  if (form.portPublishMode === 'all') return undefined
  const rows = form.ports.filter((item) => item.host.trim() || item.container.trim())
  if (!rows.length) return undefined
  return rows.flatMap((item) => {
    if (!item.host.trim() || !item.container.trim()) throw new Error('端口映射请同时填写服务器端口和容器端口')
    const { hostIp, ports: hostPorts } = parseHostPortInput(item.host)
    const containerPorts = expandPortRange(item.container, '容器')
    if (hostPorts.length !== containerPorts.length) throw new Error('服务器端口范围和容器端口范围数量需要一致')
    return hostPorts.map((hostPort, index) => ({
      hostPort,
      containerPort: containerPorts[index],
      protocol: item.protocol,
      ...(hostIp ? { hostIp } : {})
    }))
  })
}

const buildMounts = () => {
  const rows = form.mounts
    .map((item) => ({
      source: item.source.trim(),
      target: item.target.trim(),
      readOnly: item.permission === 'ro'
    }))
    .filter((item) => item.source || item.target)
  rows.forEach((item) => {
    if (!item.source || !item.target) throw new Error('挂载请同时填写来源和容器目录')
  })
  if (!rows.length) return undefined
  return rows.map((item) => ({
    source: item.source,
    target: item.target,
    readOnly: item.readOnly
  }))
}

const addMount = () => {
  form.mounts.push({ mode: 'bind', source: '', target: '', permission: 'rw' })
}

const removeMount = (index: number) => {
  if (form.mounts.length === 1) {
    form.mounts[0] = { mode: 'bind', source: '', target: '', permission: 'rw' }
    return
  }
  form.mounts.splice(index, 1)
}

const addPort = () => {
  form.ports.push({ host: '', container: '', protocol: 'tcp' })
}

const removePort = (index: number) => {
  if (form.ports.length === 1) {
    form.ports[0] = { host: '', container: '', protocol: 'tcp' }
    return
  }
  form.ports.splice(index, 1)
}

const buildContainerPayload = () => {
  const payload = {
    name: form.name.trim(),
    image: form.image.trim(),
    ports: buildPorts(),
    networks: splitTokens(form.networksText),
    ipv4: form.ipv4.trim() || undefined,
    ipv6: form.ipv6.trim() || undefined,
    mounts: buildMounts(),
    command: parseStringList(form.commandText, '命令'),
    entrypoint: parseStringList(form.entrypointText, 'EntryPoint') || [],
    autoRemove: form.autoRemove,
    privileged: form.privileged,
    tty: form.tty,
    openStdin: form.openStdin,
    restart: form.restart,
    cpuWeight: form.cpuWeight,
    cpuLimit: form.cpuLimit,
    memoryLimitMB: form.memoryLimitMB,
    labels: parseKeyValueMap(form.labelsText, 'Labels'),
    environment: parseKeyValueMap(form.environmentText, '环境变量')
  }
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => {
      if (Array.isArray(value)) return true
      return value !== undefined && value !== ''
    })
  ) as Parameters<typeof Api.createContainer>[0]
}

const confirmContainerCreate = async (payload: Parameters<typeof Api.createContainer>[0]) => {
  const previewRows = [
    ['容器名称', payload.name],
    ['镜像', payload.image],
    [
      '端口映射',
      form.portPublishMode === 'all'
        ? '暴露所有'
        : payload.ports?.map((item) => `${item.hostIp ? `${item.hostIp}:` : ''}${item.hostPort}:${item.containerPort}/${item.protocol || 'tcp'}`).join('，') || '无'
    ],
    ['网络', payload.networks?.join('，') || '默认 Docker 网络'],
    ['挂载', payload.mounts?.map((item) => `${item.source}:${item.target}${item.readOnly ? ':ro' : ''}`).join('，') || '无'],
    ['重启策略', payload.restart || '默认'],
    ['资源限制', `CPU ${payload.cpuLimit ?? '不限制'} / 内存 ${payload.memoryLimitMB ?? '不限制'} MB`],
    ['高风险选项', payload.privileged ? '特权模式' : '无']
  ]
  const message = h('div', { class: 'container-create-preview' }, [
    h('div', { class: 'container-create-preview__notice' }, '该操作会创建 Docker 容器，可能拉取镜像并占用网络和磁盘空间。'),
    h('div', { class: 'container-create-preview__grid' }, previewRows.map(([label, value]) =>
      h('div', { class: 'container-create-preview__row' }, [
        h('span', { class: 'container-create-preview__label' }, label),
        h('span', {
          class: [
            'container-create-preview__value',
            label === '高风险选项' && value !== '无' ? 'is-danger' : ''
          ]
        }, value)
      ])
    ))
  ])
  await ElMessageBox.confirm(message, '创建容器操作预览', {
    type: payload.privileged ? 'warning' : 'info',
    confirmButtonText: '确认创建',
    cancelButtonText: '取消'
  })
}

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

const getExportFilename = (disposition: string, fallback: string) => {
  const matched = disposition.match(/filename="?([^"]+)"?/i)
  return matched?.[1] || fallback
}

const buildImagePullPayload = () => {
  if (imageActionForm.pullMode === 'registry') {
    if (!imageActionForm.registryId || !imageActionForm.imageName.trim()) {
      throw new Error('请选择 Registry 并填写仓库内镜像名')
    }
    return {
      registryId: Number(imageActionForm.registryId),
      imageName: imageActionForm.imageName.trim()
    }
  }
  if (!imageActionForm.reference.trim()) throw new Error('请输入完整镜像引用')
  return { reference: imageActionForm.reference.trim() }
}

const buildImagePushPayload = () => {
  if (imageActionForm.pushMode === 'registry') {
    if (!imageActionForm.registryId || !imageActionForm.pushImageName.trim()) {
      throw new Error('请选择 Registry 并填写仓库内镜像名')
    }
    return {
      registryId: Number(imageActionForm.registryId),
      imageName: imageActionForm.pushImageName.trim()
    }
  }
  if (!imageActionForm.pushReference.trim()) throw new Error('请输入完整镜像引用')
  return { reference: imageActionForm.pushReference.trim() }
}

const buildImageBuildPayload = () => {
  if (!imageActionForm.buildName.trim()) throw new Error('请输入目标镜像名称和 Tag')
  if (imageActionForm.buildMode === 'path') {
    if (!imageActionForm.contextPath.trim()) throw new Error('请输入构建上下文目录')
    return {
      name: imageActionForm.buildName.trim(),
      contextPath: imageActionForm.contextPath.trim(),
      dockerfilePath: imageActionForm.dockerfilePath.trim() || undefined,
      labelsText: imageActionForm.labelsText.trim() || undefined
    }
  }
  if (!imageActionForm.dockerfile.trim()) throw new Error('请输入 Dockerfile 内容')
  return {
    name: imageActionForm.buildName.trim(),
    dockerfile: imageActionForm.dockerfile,
    labelsText: imageActionForm.labelsText.trim() || undefined
  }
}

const buildNetworkPayload = () => ({
  name: form.name.trim(),
  driver: form.driver.trim() || undefined,
  ipv4: form.networkIpv4 || undefined,
  ipv4Subnet: form.networkIpv4Subnet.trim() || undefined,
  ipv4Gateway: form.networkIpv4Gateway.trim() || undefined,
  ipv4IpRange: form.networkIpv4IpRange.trim() || undefined,
  ipv4AuxAddresses: parseKeyValueMap(form.networkIpv4AuxAddressesText, 'IPv4 保留地址'),
  ipv6: form.networkIpv6 || undefined,
  ipv6Subnet: form.networkIpv6Subnet.trim() || undefined,
  ipv6Gateway: form.networkIpv6Gateway.trim() || undefined,
  ipv6IpRange: form.networkIpv6IpRange.trim() || undefined,
  ipv6AuxAddresses: parseKeyValueMap(form.networkIpv6AuxAddressesText, 'IPv6 保留地址'),
  optionsText: form.optionsText.trim() || undefined,
  labelsText: form.labelsText.trim() || undefined
})

const buildVolumePayload = () => ({
  name: form.name.trim(),
  driver: form.driver.trim() || undefined,
  nfs: form.volumeNfs || undefined,
  optionsText: form.optionsText.trim() || undefined,
  labelsText: form.labelsText.trim() || undefined
})

const extractTaskResult = (response: any) => response?.data || response

const openContainerTask = (result: any, request: Record<string, any>, targetTab: 'containers' | 'images') => {
  const data = extractTaskResult(result)
  const taskId = data?.taskId || data?.id
  if (!taskId) throw new Error('后端未返回任务 ID')
  containerTaskStore.acceptCreated(data, request)
  taskDrawer.show = true
  dialogVisible.value = false
  activeTab.value = targetTab
}

const openTaskDrawer = () => {
  taskDrawer.show = true
}

const submitDialog = async () => {
  if (dialogType.value === 'container') await createDrawerRef.value?.validate()
  else await resourceDialogRef.value?.validate()
  saving.value = true
  try {
    if (dialogType.value === 'container') {
      let payload: Parameters<typeof Api.createContainer>[0]
      try {
        payload = buildContainerPayload()
      } catch (error: any) {
        ElMessage.error(error?.message || '创建参数格式不正确')
        return
      }
      await confirmContainerCreate(payload)
      const result = await Api.createContainer(payload)
      openContainerTask(result, { ...payload, operation: 'create' }, 'containers')
      ElMessage.success('容器创建任务已创建，可在后台继续运行')
    }
    if (dialogType.value === 'image') {
      const payload = buildImagePullPayload()
      const result = await Api.pullContainerImage(payload)
      openContainerTask(result, { ...payload, operation: 'pull' }, 'images')
      ElMessage.success('镜像拉取任务已创建，可在后台继续运行')
    }
    if (dialogType.value === 'image-import') {
      if (!importFile.value) throw new Error('请选择 tar 镜像文件')
      await Api.importContainerImage(importFile.value)
      ElMessage.success('镜像导入成功')
      activeTab.value = 'images'
    }
    if (dialogType.value === 'image-build') {
      await ElMessageBox.confirm('构建镜像会读取构建上下文并占用 CPU、磁盘空间；失败后不会修改现有镜像标签。', '构建镜像操作预览', {
        type: 'warning',
        confirmButtonText: '确认构建',
        cancelButtonText: '取消'
      })
      const payload = buildImageBuildPayload()
      const result = await Api.buildContainerImage(payload)
      openContainerTask(result, { ...payload, buildName: payload.name, operation: 'build' }, 'images')
      ElMessage.success('镜像构建任务已创建，可在后台继续运行')
    }
    if (dialogType.value === 'image-tag') {
      if (!dialogTarget.value?.ID) throw new Error('未选择镜像')
      if (!imageActionForm.tagReference.trim()) throw new Error('请输入新标签')
      await Api.tagContainerImage(dialogTarget.value.ID, {
        reference: imageActionForm.tagReference.trim(),
        removeOther: imageActionForm.removeOther,
        confirm: imageActionForm.removeOther
      })
      ElMessage.success('镜像标签已更新')
      activeTab.value = 'images'
    }
    if (dialogType.value === 'image-push') {
      await ElMessageBox.confirm('推送镜像会向远端 Registry 上传镜像层，请确认 Registry 与镜像名正确。', '推送镜像操作预览', {
        type: 'info',
        confirmButtonText: '确认推送',
        cancelButtonText: '取消'
      })
      await Api.pushContainerImage(buildImagePushPayload())
      ElMessage.success('镜像推送成功')
      activeTab.value = 'images'
    }
    if (dialogType.value === 'network') {
      await Api.createContainerNetwork(buildNetworkPayload())
      ElMessage.success('网络创建成功')
      activeTab.value = 'networks'
    }
    if (dialogType.value === 'volume') {
      await Api.createContainerVolume(buildVolumePayload())
      ElMessage.success('存储卷创建成功')
      activeTab.value = 'volumes'
    }
    if (dialogType.value === 'registry') {
      if (!registryForm.name.trim() || !registryForm.address.trim()) throw new Error('请填写 Registry 名称和地址')
      const payload = {
        name: registryForm.name.trim(),
        address: registryForm.address.trim(),
        protocol: registryForm.protocol,
        authEnabled: registryForm.authEnabled,
        username: registryForm.authEnabled ? registryForm.username.trim() : undefined,
        password: registryForm.authEnabled ? registryForm.password : undefined
      }
      if (dialogTarget.value?.id) {
        await Api.updateContainerRegistry(dialogTarget.value.id, payload)
        ElMessage.success('Registry 已更新')
      } else {
        await Api.createContainerRegistry(payload)
        ElMessage.success('Registry 已创建')
      }
      activeTab.value = 'registries'
    }
    if (dialogType.value === 'template') {
      if (!templateForm.name.trim() || !templateForm.content.trim()) throw new Error('请填写模板名称和 YAML 内容')
      const payload = {
        name: templateForm.name.trim(),
        description: templateForm.description.trim() || undefined,
        content: templateForm.content
      }
      if (dialogTarget.value?.id) {
        await Api.updateContainerTemplate(dialogTarget.value.id, payload)
        ElMessage.success('模板已更新')
      } else {
        await Api.createContainerTemplate(payload)
        ElMessage.success('模板已创建')
      }
      activeTab.value = 'templates'
    }
    dialogVisible.value = false
    loadedTabs[activeTab.value] = false
    await loadActiveTab(true)
  } catch (error: any) {
    const isCancel = error === 'cancel' || error?.message === 'cancel' || error?.name === 'CanceledError'
    if (!isCancel) ElMessage.error(error?.message || '操作失败')
  } finally {
    saving.value = false
  }
}

const runContainerAction = async (
  row: ContainerItem,
  action: ContainerAction
) => {
  const actionLabels: Record<string, string> = {
    start: '启动',
    stop: '停止',
    restart: '重启',
    pause: '暂停',
    unpause: '恢复',
    kill: '强制停止',
    rm: '删除'
  }
  const dangerous = ['kill', 'rm'].includes(action)
  await ElMessageBox.confirm(
    `${actionLabels[action]}容器 ${row.Names || shortId(row.ID)}？${dangerous ? '该操作会改变容器运行状态，请确认后继续。' : ''}`,
    `${actionLabels[action]}容器`,
    {
      type: dangerous ? 'warning' : 'info',
      confirmButtonText: actionLabels[action],
      cancelButtonText: '取消'
    }
  )
  actionLoading.value = `${row.ID}:${action}`
  try {
    await Api.runContainerAction(row.ID, {
      action,
      confirm: dangerous,
      force: action === 'kill' || (action === 'rm' && canForceAction.value)
    })
    ElMessage.success(`${actionLabels[action]}成功`)
    loadedTabs.containers = false
    await loadActiveTab(true)
  } finally {
    actionLoading.value = ''
  }
}

const showBatchResult = async (data: any, fallbackMessage: string) => {
  const items = normalizeList<any>(data)
  const failed = items.filter((item) => item?.success === false || item?.error)
  if (!items.length || !failed.length) {
    ElMessage.success(fallbackMessage)
    return
  }
  const message = h('div', { class: 'batch-result' }, [
    h('p', `完成 ${items.length - failed.length} 项，失败 ${failed.length} 项。`),
    h('pre', failed.map((item) => {
      const id = item.id || item.ID || item.name || item.Name || '--'
      const error = item.error?.detail || item.error?.message || item.message || '操作失败'
      return `${id}: ${error}`
    }).join('\n'))
  ])
  await ElMessageBox.alert(message, '批量操作结果', { confirmButtonText: '知道了' })
}

const runBatchContainerAction = async (action: ContainerAction) => {
  if (!selectedContainers.value.length) return
  const actionLabels: Record<ContainerAction, string> = {
    start: '启动',
    stop: '停止',
    restart: '重启',
    pause: '暂停',
    unpause: '恢复',
    kill: '强制停止',
    rm: '删除'
  }
  const dangerous = ['kill', 'rm'].includes(action)
  await ElMessageBox.confirm(
    `${actionLabels[action]}选中的 ${selectedContainers.value.length} 个容器？${dangerous ? '该操作风险较高，请确认后继续。' : ''}`,
    `批量${actionLabels[action]}`,
    {
      type: dangerous ? 'warning' : 'info',
      confirmButtonText: `批量${actionLabels[action]}`,
      cancelButtonText: '取消'
    }
  )
  actionLoading.value = `batch:${action}`
  try {
    const { data } = await Api.batchRunContainerAction({
      ids: selectedContainers.value.map((item) => item.ID),
      action,
      confirm: dangerous,
      force: action === 'kill' || (action === 'rm' && canForceAction.value)
    })
    await showBatchResult(data, `批量${actionLabels[action]}完成`)
    loadedTabs.containers = false
    await loadActiveTab(true)
  } finally {
    actionLoading.value = ''
  }
}

const cleanupStoppedContainers = async () => {
  await ElMessageBox.confirm('清理已停止容器会删除退出状态的容器实例，但不会删除镜像和存储卷。', '清理已停止容器', {
    type: 'warning',
    confirmButtonText: '确认清理',
    cancelButtonText: '取消'
  })
  actionLoading.value = 'cleanup:containers'
  try {
    await Api.cleanupContainers()
    ElMessage.success('已清理停止的容器')
    loadedTabs.containers = false
    await loadActiveTab(true)
  } finally {
    actionLoading.value = ''
  }
}

const openLogs = async (row: ContainerItem) => {
  logTarget.value = row
  logsText.value = ''
  logsVisible.value = true
  await loadLogs(row)
}

const openTerminal = (row: ContainerItem) => {
  terminalDrawer.target = row
  terminalDrawer.show = true
}

const normalizeContainerLogTail = () => {
  const normalizedTail = [100, 200, 500, 1000, 10000].includes(Number(logTail.value)) ? Number(logTail.value) : 100
  logTail.value = normalizedTail
  return normalizedTail
}

const buildContainerLogFilters = () => {
  const normalizedTail = normalizeContainerLogTail()
  const since = logTimeFilter.value === 'all' ? undefined : logTimeFilter.value
  return {
    tail: normalizedTail,
    since,
    until: undefined,
    timestamps: logTimestamps.value
  }
}

const buildContainerLogQuery = () => {
  return {
    ...buildContainerLogFilters(),
    follow: false
  }
}

const loadLogs = async (row = logTarget.value) => {
  if (!row?.ID) return
  logsLoading.value = true
  try {
    const { data } = await Api.getContainerLogs(row.ID, buildContainerLogQuery())
    logsText.value = data?.logs || ''
  } finally {
    logsLoading.value = false
  }
}

const downloadLogs = async (row = logTarget.value) => {
  if (!row?.ID || logDownloading.value) return
  logDownloading.value = true
  try {
    const response = await fetch(Api.downloadContainerLogs(row.ID, buildContainerLogFilters()), {
      credentials: 'include',
      headers: { Accept: 'text/plain' }
    })
    if (!response.ok) throw new Error(`下载日志失败（HTTP ${response.status}）`)
    const blob = await response.blob()
    const objectURL = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = objectURL
    link.download = `${row.Names || row.ID}-container.log`
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(objectURL)
    ElMessage.success('容器日志下载已开始')
  } catch (error: any) {
    ElMessage.error(error?.message || '容器日志下载失败')
  } finally {
    logDownloading.value = false
  }
}

const clearStatsTimer = () => {
  if (!statsTimer) return
  clearInterval(statsTimer)
  statsTimer = undefined
}

const loadContainerStats = async (id: string) => {
  const { data } = await Api.getContainerStats(id)
  detailStats.value = data || null
}

const openDetail = async (type: DetailType, row: any) => {
  clearStatsTimer()
  detailType.value = type
  detailTarget.value = row
  detailData.value = null
  detailStats.value = null
  detailVisible.value = true
  detailLoading.value = true
  try {
    const id = row.ID || row.Id || row.id || row.Name || row.name
    if (type === 'container') {
      const { data } = await Api.getContainerDetail(id)
      detailData.value = data || {}
      await loadContainerStats(id).catch((error) => console.warn('加载容器资源统计失败', error))
      statsTimer = setInterval(() => {
        void loadContainerStats(id).catch((error) => console.warn('刷新容器资源统计失败', error))
      }, 5000)
    }
    if (type === 'image') {
      const { data } = await Api.getContainerImage(id)
      detailData.value = data || {}
    }
    if (type === 'network') {
      const { data } = await Api.getContainerNetwork(id)
      detailData.value = data || {}
    }
    if (type === 'volume') {
      const { data } = await Api.getContainerVolume(id)
      detailData.value = data || {}
    }
  } finally {
    detailLoading.value = false
  }
}

const handleDetailClose = () => {
  clearStatsTimer()
  detailVisible.value = false
}

const deleteImage = async (row: ImageItem) => {
  await ElMessageBox.confirm(`删除镜像 ${imageReference(row)}？该操作不可撤销。`, '删除镜像', {
    type: 'warning',
    confirmButtonText: '删除',
    cancelButtonText: '取消'
  })
  actionLoading.value = row.ID
  try {
    await Api.deleteContainerImage(row.ID)
    ElMessage.success('镜像已删除')
    loadedTabs.images = false
    await loadActiveTab(true)
  } finally {
    actionLoading.value = ''
  }
}

const deleteNetwork = async (row: NetworkItem) => {
  await ElMessageBox.confirm(`删除网络 ${row.Name}？正在使用中的网络会被后端拦截。`, '删除网络', {
    type: 'warning',
    confirmButtonText: '删除',
    cancelButtonText: '取消'
  })
  actionLoading.value = row.ID
  try {
    await Api.deleteContainerNetwork(row.ID)
    ElMessage.success('网络已删除')
    loadedTabs.networks = false
    await loadActiveTab(true)
  } finally {
    actionLoading.value = ''
  }
}

const deleteVolume = async (row: VolumeItem) => {
  await ElMessageBox.confirm(`删除存储卷 ${row.Name}？卷数据删除后无法恢复。`, '删除存储卷', {
    type: 'warning',
    confirmButtonText: '删除',
    cancelButtonText: '取消'
  })
  actionLoading.value = row.Name
  try {
    await Api.deleteContainerVolume(row.Name)
    ElMessage.success('存储卷已删除')
    loadedTabs.volumes = false
    await loadActiveTab(true)
  } finally {
    actionLoading.value = ''
  }
}

const batchDeleteNetworks = async () => {
  if (!selectedNetworks.value.length) return
  await ElMessageBox.confirm(`删除选中的 ${selectedNetworks.value.length} 个网络？系统网络或使用中的网络会被后端拦截。`, '批量删除网络', {
    type: 'warning',
    confirmButtonText: '批量删除',
    cancelButtonText: '取消'
  })
  actionLoading.value = 'batch:networks'
  try {
    const { data } = await Api.batchDeleteContainerNetworks(selectedNetworks.value.map((item) => item.ID || item.Name))
    await showBatchResult(data, '网络批量删除完成')
    loadedTabs.networks = false
    await loadActiveTab(true)
  } finally {
    actionLoading.value = ''
  }
}

const batchDeleteVolumes = async () => {
  if (!selectedVolumes.value.length) return
  await ElMessageBox.confirm(`删除选中的 ${selectedVolumes.value.length} 个存储卷？卷数据删除后无法恢复。`, '批量删除存储卷', {
    type: 'warning',
    confirmButtonText: '批量删除',
    cancelButtonText: '取消'
  })
  actionLoading.value = 'batch:volumes'
  try {
    const { data } = await Api.batchDeleteContainerVolumes(selectedVolumes.value.map((item) => item.Name))
    await showBatchResult(data, '存储卷批量删除完成')
    loadedTabs.volumes = false
    await loadActiveTab(true)
  } finally {
    actionLoading.value = ''
  }
}

const pruneNetworks = async () => {
  await ElMessageBox.confirm('清理无用网络会删除未被容器使用的自定义网络，系统网络会被后端保留。', '清理无用网络', {
    type: 'warning',
    confirmButtonText: '确认清理',
    cancelButtonText: '取消'
  })
  actionLoading.value = 'prune:networks'
  try {
    await Api.pruneContainerNetworks()
    ElMessage.success('无用网络清理完成')
    loadedTabs.networks = false
    await loadActiveTab(true)
  } finally {
    actionLoading.value = ''
  }
}

const pruneVolumes = async () => {
  await ElMessageBox.confirm('清理无用存储卷会删除未被容器使用的卷数据，该操作不可恢复。', '清理无用存储卷', {
    type: 'warning',
    confirmButtonText: '确认清理',
    cancelButtonText: '取消'
  })
  actionLoading.value = 'prune:volumes'
  try {
    await Api.pruneContainerVolumes()
    ElMessage.success('无用存储卷清理完成')
    loadedTabs.volumes = false
    await loadActiveTab(true)
  } finally {
    actionLoading.value = ''
  }
}

const handleImportFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  importFile.value = input.files?.[0] || null
}

const handleContainerSelectionChange = (rows: ContainerItem[]) => {
  selectedContainers.value = rows
}

const handleNetworkSelectionChange = (rows: NetworkItem[]) => {
  selectedNetworks.value = rows
}

const handleVolumeSelectionChange = (rows: VolumeItem[]) => {
  selectedVolumes.value = rows
}

const exportImage = async (row: ImageItem) => {
  actionLoading.value = `export:${row.ID}`
  try {
    const { blob, disposition } = await Api.exportContainerImage(row.ID)
    downloadBlob(blob, getExportFilename(disposition, `${imageReference(row).replace(/[/:]/g, '_')}.tar`))
  } finally {
    actionLoading.value = ''
  }
}

const pruneImages = async (type: 'images' | 'build-cache') => {
  const label = type === 'images' ? '清理悬空镜像' : '清理构建缓存'
  await ElMessageBox.confirm(
    `${label} 会释放 Docker 磁盘空间，但可能影响后续构建或镜像复用；失败时不会删除已使用资源。`,
    `${label}操作预览`,
    {
      type: 'warning',
      confirmButtonText: label,
      cancelButtonText: '取消'
    }
  )
  actionLoading.value = `prune:${type}`
  try {
    if (type === 'images') await Api.pruneContainerImages()
    else await Api.pruneContainerBuildCache()
    ElMessage.success(`${label}完成`)
    loadedTabs.images = false
    await loadActiveTab(true)
  } finally {
    actionLoading.value = ''
  }
}

const deleteRegistry = async (row: RegistryItem) => {
  await ElMessageBox.confirm(`删除 Registry ${row.name}？已保存的密码凭据也会移除。`, '删除 Registry', {
    type: 'warning',
    confirmButtonText: '删除',
    cancelButtonText: '取消'
  })
  actionLoading.value = `registry:${row.id}`
  try {
    await Api.deleteContainerRegistry(row.id)
    ElMessage.success('Registry 已删除')
    loadedTabs.registries = false
    await loadActiveTab(true)
  } finally {
    actionLoading.value = ''
  }
}

const testRegistry = async (row: RegistryItem) => {
  actionLoading.value = `registry-test:${row.id}`
  try {
    await Api.testContainerRegistry(row.id)
    ElMessage.success('Registry 连通性正常')
    loadedTabs.registries = false
    await loadActiveTab(true)
  } finally {
    actionLoading.value = ''
  }
}

const deleteTemplate = async (row: TemplateItem) => {
  if (!row.id) return
  await ElMessageBox.confirm(`删除编排模板 ${row.name}？`, '删除模板', {
    type: 'warning',
    confirmButtonText: '删除',
    cancelButtonText: '取消'
  })
  actionLoading.value = `template:${row.id}`
  try {
    await Api.deleteContainerTemplate(row.id)
    ElMessage.success('模板已删除')
    loadedTabs.templates = false
    await loadActiveTab(true)
  } finally {
    actionLoading.value = ''
  }
}

const saveDockerConfig = async () => {
  let parsed: Record<string, any>
  try {
    parsed = JSON.parse(configForm.raw || '{}')
  } catch {
    ElMessage.error('Docker 配置必须是 JSON 对象')
    return
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    ElMessage.error('Docker 配置必须是 JSON 对象')
    return
  }
  await ElMessageBox.confirm(
    `将写入 Docker daemon 配置文件 ${dockerConfig.value?.configPath || 'daemon.json'}。该操作不会自动重启 Docker；如需生效请再手动重启服务。失败时后端会保留原配置。`,
    '保存 Docker 配置操作预览',
    {
      type: 'warning',
      confirmButtonText: '确认保存',
      cancelButtonText: '取消'
    }
  )
  actionLoading.value = 'config:save'
  try {
    await Api.saveContainerConfig({ raw: JSON.stringify(parsed, null, 2) })
    ElMessage.success('Docker 配置已保存')
    loadedTabs.config = false
    await loadActiveTab(true)
  } finally {
    actionLoading.value = ''
  }
}

const runRuntimeAction = async (action: 'stop' | 'restart') => {
  const label = action === 'restart' ? '重启 Docker 服务' : '停止 Docker 服务'
  await ElMessageBox.confirm(
    `${label} 会影响当前所有容器和 Docker API 连接。执行前不会写配置文件；失败时请通过系统服务管理工具检查 Docker 状态。`,
    `${label}操作预览`,
    {
      type: 'warning',
      confirmButtonText: label,
      cancelButtonText: '取消'
    }
  )
  actionLoading.value = `runtime:${action}`
  try {
    await Api.runContainerRuntimeAction({ action, confirm: true })
    ElMessage.success(`${label}命令已执行`)
    await refreshAll()
  } finally {
    actionLoading.value = ''
  }
}

const handleTabChange = () => {
  void loadActiveTab()
}

const resetCurrentList = () => {
  if (!hasPagination.value) return
  activeListState.value.page = 1
  loadedTabs[activeTab.value] = false
  void loadActiveTab(true)
}

const handlePageChange = (page: number) => {
  if (!hasPagination.value) return
  activeListState.value.page = page
  loadedTabs[activeTab.value] = false
  void loadActiveTab(true)
}

const handlePageSizeChange = (pageSize: number) => {
  if (!hasPagination.value) return
  activeListState.value.pageSize = pageSize
  activeListState.value.page = 1
  loadedTabs[activeTab.value] = false
  void loadActiveTab(true)
}

const refreshTaskAffectedLists = async () => {
  loadedTabs.containers = false
  loadedTabs.images = false
  if (activeTab.value === 'containers' || activeTab.value === 'images') {
    await loadActiveTab(true)
  }
}

watch(
  () => containerTaskStore.terminalRevision,
  () => {
    void refreshTaskAffectedLists()
  }
)

onMounted(async () => {
  await loadRuntime()
  await loadActiveTab()
  void containerTaskStore.loadActive()
})

onBeforeUnmount(() => {
  clearStatsTimer()
})
</script>

<template>
  <div class="container-page">
    <section class="container-hero">
      <div>
        <h2>{{ t('container.title', 'Containers') }}</h2>
        <p>{{ t('container.description', 'Manage containers, images, networks, volumes, templates, and registries') }}</p>
      </div>
      <div class="hero-actions">
        <el-button :icon="Refresh" :loading="runtimeLoading || listLoading" @click="refreshAll">{{ t('common.refresh', 'Refresh') }}</el-button>
        <el-button v-if="canReadContainerTask" @click="openTaskDrawer">
          {{ t('container.task.containerTask', 'Container task') }}<span v-if="activeTaskCount">（{{ activeTaskCount }}）</span>
        </el-button>
        <el-button
          type="primary"
          :icon="Plus"
          :disabled="!runtimeAvailable || !canCreateContainer"
          @click="openDialog('container')"
        >
          {{ t('container.createContainer', 'Create container') }}
        </el-button>
      </div>
    </section>

    <el-alert
      v-if="!canRead"
      class="container-alert"
      :title="t('container.noReadPermission', 'The current account does not have container read permission')"
      type="warning"
      show-icon
      :closable="false"
    />
    <el-alert
      v-else-if="runtime && !runtime.available"
      class="container-alert"
      :title="runtime.message || t('container.dockerRuntimeUnavailable', 'Docker runtime unavailable')"
      type="warning"
      show-icon
      :closable="false"
    />

    <RuntimeSummary
      :runtime="runtime"
      :runtime-loading="runtimeLoading"
      :running-containers="runningContainers"
      :container-count="containers.length"
    />

    <section class="resource-panel">
      <div class="panel-top">
        <el-tabs v-model="activeTab" @tab-change="handleTabChange">
          <el-tab-pane :label="t('container.containers', 'Containers')" name="containers" />
          <el-tab-pane :label="t('container.images', 'Images')" name="images" />
          <el-tab-pane :label="t('container.networks', 'Networks')" name="networks" />
          <el-tab-pane :label="t('container.volumes', 'Volumes')" name="volumes" />
          <el-tab-pane :label="t('container.composeRuntime', 'Compose')" name="compose" />
          <el-tab-pane :label="t('container.templates', 'Templates')" name="templates" />
          <el-tab-pane :label="t('container.registries', 'Registries')" name="registries" />
          <el-tab-pane :label="t('container.dockerConfig', 'Docker config')" name="config" />
        </el-tabs>
        <div class="panel-actions">
          <el-button
            v-if="activeTab === 'containers'"
            type="warning"
            plain
            :loading="actionLoading === 'cleanup:containers'"
            :disabled="!runtimeAvailable || !canCleanup"
            @click="cleanupStoppedContainers"
          >
            {{ t('container.cleanupStopped', 'Clean stopped') }}
          </el-button>
          <el-button
            v-if="activeTab === 'images'"
            type="primary"
            :icon="Plus"
            :disabled="!runtimeAvailable || !canImageWrite"
            @click="openDialog('image')"
          >
            {{ t('container.pullImage', 'Pull image') }}
          </el-button>
          <el-button
            v-if="activeTab === 'images'"
            :disabled="!runtimeAvailable || !canImageWrite"
            @click="openDialog('image-import')"
          >
            {{ t('container.import', 'Import') }}
          </el-button>
          <el-button
            v-if="activeTab === 'images'"
            :disabled="!runtimeAvailable || !canImageWrite"
            @click="openDialog('image-build')"
          >
            {{ t('container.build', 'Build') }}
          </el-button>
          <el-button
            v-if="activeTab === 'images'"
            type="warning"
            plain
            :loading="actionLoading === 'prune:images'"
            :disabled="!runtimeAvailable || !canCleanup"
            @click="pruneImages('images')"
          >
            {{ t('container.cleanupImages', 'Clean images') }}
          </el-button>
          <el-button
            v-if="activeTab === 'images'"
            plain
            :loading="actionLoading === 'prune:build-cache'"
            :disabled="!runtimeAvailable || !canCleanup"
            @click="pruneImages('build-cache')"
          >
            {{ t('container.cleanupBuildCache', 'Clean build cache') }}
          </el-button>
          <el-button
            v-if="activeTab === 'networks'"
            type="primary"
            :icon="Plus"
            :disabled="!runtimeAvailable || !canNetworkWrite"
            @click="openDialog('network')"
          >
            {{ t('container.createNetwork', 'Create network') }}
          </el-button>
          <el-button
            v-if="activeTab === 'networks'"
            plain
            type="warning"
            :loading="actionLoading === 'prune:networks'"
            :disabled="!runtimeAvailable || !canCleanup"
            @click="pruneNetworks"
          >
            {{ t('container.cleanupUnusedNetworks', 'Clean unused networks') }}
          </el-button>
          <el-button
            v-if="activeTab === 'volumes'"
            type="primary"
            :icon="Plus"
            :disabled="!runtimeAvailable || !canVolumeWrite"
            @click="openDialog('volume')"
          >
            {{ t('container.createVolume', 'Create volume') }}
          </el-button>
          <el-button
            v-if="activeTab === 'volumes'"
            plain
            type="warning"
            :loading="actionLoading === 'prune:volumes'"
            :disabled="!runtimeAvailable || !canCleanup"
            @click="pruneVolumes"
          >
            {{ t('container.cleanupUnusedVolumes', 'Clean unused volumes') }}
          </el-button>
          <el-button
            v-if="activeTab === 'templates'"
            type="primary"
            :icon="Plus"
            :disabled="!runtimeAvailable || !canComposeWrite || !templatesSupported"
            @click="openDialog('template')"
          >
            {{ t('container.createTemplate', 'Create template') }}
          </el-button>
          <el-button
            v-if="activeTab === 'registries'"
            type="primary"
            :icon="Plus"
            :disabled="!runtimeAvailable || !canRegistryWrite"
            @click="openDialog('registry')"
          >
            {{ t('container.addRegistry', 'Add Registry') }}
          </el-button>
          <el-button
            v-if="activeTab === 'config'"
            type="primary"
            :loading="actionLoading === 'config:save'"
            :disabled="!runtimeAvailable || !canConfigWrite"
            @click="saveDockerConfig"
          >
            {{ t('container.saveConfig', 'Save config') }}
          </el-button>
          <el-button
            v-if="activeTab === 'config'"
            type="warning"
            plain
            :loading="actionLoading === 'runtime:restart'"
            :disabled="!runtimeAvailable || !canConfigWrite"
            @click="runRuntimeAction('restart')"
          >
            {{ t('container.restartDocker', 'Restart Docker') }}
          </el-button>
        </div>
      </div>

      <div v-if="hasPagination" class="table-toolbar">
        <div class="table-toolbar__filters">
          <el-input
            v-model.trim="activeListState.search"
            clearable
            :placeholder="activeTab === 'containers'
              ? t('container.searchPlaceholders.containers', 'Enter container name or image')
              : activeTab === 'images'
                ? t('container.searchPlaceholders.images', 'Enter image ID, repository, or tag')
                : activeTab === 'networks'
                  ? t('container.searchPlaceholders.networks', 'Enter network name, driver, or subnet')
                  : activeTab === 'volumes'
                    ? t('container.searchPlaceholders.volumes', 'Enter volume name, driver, or mount point')
                    : t('container.searchPlaceholders.registries', 'Enter Registry name or address')"
            @clear="resetCurrentList"
            @keyup.enter="resetCurrentList"
          />
          <el-select
            v-if="activeTab === 'containers'"
            v-model="listState.containers.status"
            class="status-filter"
            :placeholder="t('container.statusFilterPlaceholder', 'Select status')"
            @change="resetCurrentList"
          >
            <el-option :label="t('container.statusOptions.all', 'All')" value="" />
            <el-option :label="t('container.statusOptions.created', 'Created')" value="created" />
            <el-option :label="t('container.statusOptions.up', 'Running')" value="up" />
            <el-option :label="t('container.statusOptions.exited', 'Exited')" value="exited" />
            <el-option :label="t('container.statusOptions.restarting', 'Restarting')" value="restarting" />
            <el-option :label="t('container.statusOptions.paused', 'Paused')" value="paused" />
            <el-option :label="t('container.statusOptions.removing', 'Removing')" value="removing" />
            <el-option :label="t('container.statusOptions.dead', 'Dead')" value="dead" />
          </el-select>
          <el-button :loading="listLoading" @click="resetCurrentList">{{ t('common.query', 'Query') }}</el-button>
        </div>
        <div class="table-toolbar__batch">
          <template v-if="activeTab === 'containers'">
            <span v-if="selectedContainers.length">{{ t('container.selectedContainers', '{count} containers selected', { count: selectedContainers.length }) }}</span>
            <el-dropdown
              :disabled="!selectedContainers.length || !runtimeAvailable || !canWrite"
              popper-class="table-action-popper"
              @command="(command: ContainerAction) => runBatchContainerAction(command)"
            >
              <el-button :loading="actionLoading.startsWith('batch:')">
                {{ t('container.batchActions', 'Batch actions') }}
              </el-button>
              <template #dropdown>
                <el-dropdown-menu class="table-action-menu">
                  <el-dropdown-item command="start">{{ t('container.start', 'Start') }}</el-dropdown-item>
                  <el-dropdown-item command="stop">{{ t('container.stop', 'Stop') }}</el-dropdown-item>
                  <el-dropdown-item command="restart">{{ t('container.restart', 'Restart') }}</el-dropdown-item>
                  <el-dropdown-item command="pause">{{ t('container.pause', 'Pause') }}</el-dropdown-item>
                  <el-dropdown-item command="unpause">{{ t('container.resume', 'Resume') }}</el-dropdown-item>
                  <el-dropdown-item command="kill" :disabled="!canForceAction">{{ t('container.forceStop', 'Force stop') }}</el-dropdown-item>
                  <el-dropdown-item class="table-action-menu__danger" command="rm" :disabled="!canDelete" divided>{{ t('container.delete', 'Delete') }}</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template v-if="activeTab === 'networks'">
            <span v-if="selectedNetworks.length">{{ t('container.selectedNetworks', '{count} networks selected', { count: selectedNetworks.length }) }}</span>
            <el-button
              :loading="actionLoading === 'batch:networks'"
              :disabled="!selectedNetworks.length || !runtimeAvailable || !canNetworkWrite"
              @click="batchDeleteNetworks"
            >
              {{ t('container.batchDelete', 'Batch delete') }}
            </el-button>
          </template>
          <template v-if="activeTab === 'volumes'">
            <span v-if="selectedVolumes.length">{{ t('container.selectedVolumes', '{count} volumes selected', { count: selectedVolumes.length }) }}</span>
            <el-button
              :loading="actionLoading === 'batch:volumes'"
              :disabled="!selectedVolumes.length || !runtimeAvailable || !canVolumeWrite"
              @click="batchDeleteVolumes"
            >
              {{ t('container.batchDelete', 'Batch delete') }}
            </el-button>
          </template>
        </div>
      </div>

      <custom-table
        v-if="activeTab === 'containers'"
        v-loading="listLoading"
        :data="containers"
        :row-key="getRowKey"
        :empty-text="t('container.empty.containers', 'No containers')"
        @selection-change="handleContainerSelectionChange"
      >
        <el-table-column type="selection" width="44" />
        <el-table-column :label="t('container.columns.name', 'Name')" min-width="170">
          <template #default="{ row }">
            <div class="primary-cell">
              <strong>{{ row.Names || shortId(row.ID) }}</strong>
              <span>{{ shortId(row.ID) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="Image" :label="t('container.columns.image', 'Image')" min-width="180" show-overflow-tooltip />
        <el-table-column :label="t('container.columns.status', 'Status')" min-width="130">
          <template #default="{ row }">
            <el-tag :type="statusType(row.Status)" effect="light">{{ row.Status || '--' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="Ports" :label="t('container.columns.ports', 'Ports')" min-width="190" show-overflow-tooltip />
        <el-table-column prop="Networks" :label="t('container.columns.networks', 'Networks')" min-width="120" show-overflow-tooltip />
        <el-table-column prop="Mounts" :label="t('container.columns.mounts', 'Mounts')" min-width="180" show-overflow-tooltip />
        <el-table-column fixed="right" :label="t('container.columns.action', 'Actions')" width="500" class-name="table-action-column">
          <template #default="{ row }">
            <div class="row-actions table-row-actions">
              <el-button
                link
                type="primary"
                :icon="Document"
                @click="openDetail('container', row)"
              >
                {{ t('container.detail', 'Details') }}
              </el-button>
              <el-button
                link
                type="primary"
                :icon="Document"
                :disabled="!canReadLogs"
                @click="openLogs(row)"
              >
                {{ t('container.logs', 'Logs') }}
              </el-button>
              <el-button
                link
                type="primary"
                :icon="Monitor"
                :disabled="!runtimeAvailable || !canOpenContainerTerminal(row)"
                @click="openTerminal(row)"
              >
                {{ t('container.terminal.entry', 'Terminal') }}
              </el-button>
              <el-button
                v-if="canStartContainer(row)"
                link
                type="primary"
                :icon="VideoPlay"
                :loading="actionLoading === `${row.ID}:start`"
                :disabled="!runtimeAvailable || !canWrite"
                @click="runContainerAction(row, 'start')"
              >
                {{ t('container.start', 'Start') }}
              </el-button>
              <el-button
                v-if="canStopContainer(row)"
                link
                type="primary"
                :icon="SwitchButton"
                :loading="actionLoading === `${row.ID}:stop`"
                :disabled="!runtimeAvailable || !canWrite"
                @click="runContainerAction(row, 'stop')"
              >
                {{ t('container.stop', 'Stop') }}
              </el-button>
              <el-button
                v-if="canPauseContainer(row)"
                link
                type="primary"
                :icon="VideoPause"
                :loading="actionLoading === `${row.ID}:pause`"
                :disabled="!runtimeAvailable || !canWrite"
                @click="runContainerAction(row, 'pause')"
              >
                {{ t('container.pause', 'Pause') }}
              </el-button>
              <el-button
                v-if="canUnpauseContainer(row)"
                link
                type="primary"
                :icon="VideoPlay"
                :loading="actionLoading === `${row.ID}:unpause`"
                :disabled="!runtimeAvailable || !canWrite"
                @click="runContainerAction(row, 'unpause')"
              >
                {{ t('container.resume', 'Resume') }}
              </el-button>
              <el-button
                v-if="canRestartContainer(row)"
                link
                type="primary"
                :icon="Refresh"
                :loading="actionLoading === `${row.ID}:restart`"
                :disabled="!runtimeAvailable || !canWrite"
                @click="runContainerAction(row, 'restart')"
              >
                {{ t('container.restart', 'Restart') }}
              </el-button>
              <el-button
                v-if="canDeleteContainer(row)"
                link
                type="danger"
                :icon="Delete"
                :loading="actionLoading === `${row.ID}:rm`"
                :disabled="!runtimeAvailable || !canDelete"
                @click="runContainerAction(row, 'rm')"
              >
                {{ t('container.delete', 'Delete') }}
              </el-button>
            </div>
          </template>
        </el-table-column>
      </custom-table>

      <custom-table
        v-if="activeTab === 'images'"
        v-loading="listLoading"
        :data="images"
        :row-key="getRowKey"
        :empty-text="t('container.empty.images', 'No images')"
      >
        <el-table-column :label="t('container.columns.image', 'Image')" min-width="260">
          <template #default="{ row }">
            <div class="primary-cell">
              <strong>{{ imageReference(row) }}</strong>
              <span>{{ shortId(row.ID) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="CreatedSince" :label="t('container.columns.createdAt', 'Created at')" min-width="150" />
        <el-table-column prop="Size" :label="t('container.columns.size', 'Size')" width="120" />
        <el-table-column prop="Containers" :label="t('container.columns.linkedContainers', 'Linked containers')" width="110" />
        <el-table-column :label="t('container.columns.status', 'Status')" width="100">
          <template #default="{ row }">
            <el-tag :type="row.used ? 'success' : 'info'" effect="light">{{ row.used ? t('container.used', 'Used') : t('container.unused', 'Unused') }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column fixed="right" :label="t('container.columns.action', 'Actions')" width="310" class-name="table-action-column">
          <template #default="{ row }">
            <div class="row-actions table-row-actions">
              <el-button link type="primary" @click="openDetail('image', row)">{{ t('container.detail', 'Details') }}</el-button>
              <el-button link type="primary" :disabled="!runtimeAvailable || !canImageWrite" @click="openDialog('image-tag', row)">{{ t('container.tag', 'Tag') }}</el-button>
              <el-button link type="primary" :disabled="!runtimeAvailable || !canImageWrite" @click="openDialog('image-push', row)">{{ t('container.push', 'Push') }}</el-button>
              <el-button
                link
                type="primary"
                :loading="actionLoading === `export:${row.ID}`"
                :disabled="!runtimeAvailable"
                @click="exportImage(row)"
              >
                {{ t('container.export', 'Export') }}
              </el-button>
              <el-button
                link
                type="danger"
                :icon="Delete"
                :loading="actionLoading === row.ID"
                :disabled="!runtimeAvailable || !canDelete"
                @click="deleteImage(row)"
              >
                {{ t('container.delete', 'Delete') }}
              </el-button>
            </div>
          </template>
        </el-table-column>
      </custom-table>

      <custom-table
        v-if="activeTab === 'networks'"
        v-loading="listLoading"
        :data="networks"
        :row-key="getRowKey"
        :empty-text="t('container.empty.networks', 'No networks')"
        @selection-change="handleNetworkSelectionChange"
      >
        <el-table-column type="selection" width="44" />
        <el-table-column prop="Name" :label="t('container.columns.name', 'Name')" min-width="180" />
        <el-table-column label="ID" min-width="140">
          <template #default="{ row }">{{ shortId(row.ID) }}</template>
        </el-table-column>
        <el-table-column prop="Driver" :label="t('container.columns.driver', 'Driver')" width="130" />
        <el-table-column prop="Scope" :label="t('container.columns.scope', 'Scope')" width="130" />
        <el-table-column prop="Subnet" :label="t('container.columns.ipv4Subnet', 'IPv4 subnet')" min-width="160" show-overflow-tooltip />
        <el-table-column prop="Gateway" :label="t('container.columns.gateway', 'Gateway')" min-width="140" show-overflow-tooltip />
        <el-table-column label="IPv6" width="90">
          <template #default="{ row }">
            <el-tag :type="row.EnableIPv6 ? 'success' : 'info'" effect="light">{{ row.EnableIPv6 ? t('container.enabledShort', 'Enabled') : t('container.closed', 'Off') }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column fixed="right" :label="t('container.columns.action', 'Actions')" width="170" class-name="table-action-column">
          <template #default="{ row }">
            <div class="row-actions table-row-actions">
              <el-button link type="primary" @click="openDetail('network', row)">{{ t('container.detail', 'Details') }}</el-button>
              <el-button
                link
                type="danger"
                :icon="Delete"
                :loading="actionLoading === row.ID"
                :disabled="!runtimeAvailable || !canNetworkWrite"
                @click="deleteNetwork(row)"
              >
                {{ t('container.delete', 'Delete') }}
              </el-button>
            </div>
          </template>
        </el-table-column>
      </custom-table>

      <custom-table
        v-if="activeTab === 'volumes'"
        v-loading="listLoading"
        :data="volumes"
        :row-key="getRowKey"
        :empty-text="t('container.empty.volumes', 'No volumes')"
        @selection-change="handleVolumeSelectionChange"
      >
        <el-table-column type="selection" width="44" />
        <el-table-column prop="Name" :label="t('container.columns.name', 'Name')" min-width="220" />
        <el-table-column prop="Driver" :label="t('container.columns.driver', 'Driver')" width="130" />
        <el-table-column prop="Scope" :label="t('container.columns.scope', 'Scope')" width="130" />
        <el-table-column prop="Mountpoint" :label="t('container.columns.mountPoint', 'Mount point')" min-width="260" show-overflow-tooltip />
        <el-table-column :label="t('container.columns.options', 'Options')" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ row.Options ? Object.keys(row.Options).join('，') : '--' }}</template>
        </el-table-column>
        <el-table-column fixed="right" :label="t('container.columns.action', 'Actions')" width="170" class-name="table-action-column">
          <template #default="{ row }">
            <div class="row-actions table-row-actions">
              <el-button link type="primary" @click="openDetail('volume', row)">{{ t('container.detail', 'Details') }}</el-button>
              <el-button
                link
                type="danger"
                :icon="Delete"
                :loading="actionLoading === row.Name"
                :disabled="!runtimeAvailable || !canVolumeWrite"
                @click="deleteVolume(row)"
              >
                {{ t('container.delete', 'Delete') }}
              </el-button>
            </div>
          </template>
        </el-table-column>
      </custom-table>

      <custom-table
        v-if="activeTab === 'compose'"
        v-loading="listLoading"
        :data="composeProjects"
        :row-key="getRowKey"
        :empty-text="t('container.empty.compose', 'No Compose projects')"
      >
        <el-table-column prop="Name" :label="t('container.columns.project', 'Project')" min-width="180" />
        <el-table-column prop="Status" :label="t('container.columns.status', 'Status')" min-width="160" />
        <el-table-column prop="ConfigFiles" :label="t('container.columns.configFiles', 'Config files')" min-width="260" show-overflow-tooltip />
        <el-table-column prop="WorkingDir" :label="t('container.columns.workDir', 'Working directory')" min-width="260" show-overflow-tooltip />
        <el-table-column :label="t('container.columns.action', 'Actions')" width="140" class-name="table-action-column">
          <template #default>
            <el-tooltip :content="t('container.composeWriteDisabled', 'Compose write operations are not enabled by the backend')">
              <el-button link type="info" :icon="SwitchButton" disabled>{{ t('container.notEnabled', 'Not enabled') }}</el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </custom-table>

      <el-alert
        v-if="activeTab === 'templates' && !templatesSupported"
        class="container-alert"
        :title="templatesMessage || t('container.templatesDisabled', 'Compose templates are not enabled')"
        type="info"
        show-icon
        :closable="false"
      />

      <custom-table
        v-if="activeTab === 'templates'"
        v-loading="listLoading"
        :data="templates"
        :row-key="getRowKey"
        :empty-text="t('container.empty.templates', 'No templates')"
      >
        <el-table-column prop="name" :label="t('container.columns.templateName', 'Template name')" min-width="180" />
        <el-table-column prop="description" :label="t('container.columns.description', 'Description')" min-width="260" show-overflow-tooltip />
        <el-table-column :label="t('container.columns.content', 'Content')" min-width="260" show-overflow-tooltip>
          <template #default="{ row }">{{ row.content || '--' }}</template>
        </el-table-column>
        <el-table-column fixed="right" :label="t('container.columns.action', 'Actions')" width="160" class-name="table-action-column">
          <template #default="{ row }">
            <div class="row-actions table-row-actions">
              <el-button link type="primary" :disabled="!canComposeWrite || !templatesSupported" @click="openDialog('template', row)">{{ t('container.edit', 'Edit') }}</el-button>
              <el-button
                link
                type="danger"
                :loading="actionLoading === `template:${row.id}`"
                :disabled="!canDelete || !row.id || !templatesSupported"
                @click="deleteTemplate(row)"
              >
                {{ t('container.delete', 'Delete') }}
              </el-button>
            </div>
          </template>
        </el-table-column>
      </custom-table>

      <custom-table
        v-if="activeTab === 'registries'"
        v-loading="listLoading"
        :data="registries"
        :row-key="getRowKey"
        :empty-text="t('container.empty.registries', 'No registries')"
      >
        <el-table-column prop="name" :label="t('container.columns.name', 'Name')" min-width="160" />
        <el-table-column :label="t('container.columns.address', 'Address')" min-width="240">
          <template #default="{ row }">{{ registryLabel(row) }}</template>
        </el-table-column>
        <el-table-column prop="username" :label="t('container.columns.username', 'Username')" min-width="140" />
        <el-table-column :label="t('container.columns.auth', 'Auth')" width="90">
          <template #default="{ row }">
            <el-tag :type="row.authEnabled ? 'success' : 'info'" effect="light">{{ row.authEnabled ? t('container.enabled', 'Enabled') : t('container.disabled', 'Disabled') }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" :label="t('container.columns.status', 'Status')" width="120" />
        <el-table-column fixed="right" :label="t('container.columns.action', 'Actions')" width="230" class-name="table-action-column">
          <template #default="{ row }">
            <div class="row-actions table-row-actions">
              <el-button
                link
                type="primary"
                :loading="actionLoading === `registry-test:${row.id}`"
                :disabled="!runtimeAvailable || !canRegistryWrite"
                @click="testRegistry(row)"
              >
                {{ t('container.test', 'Test') }}
              </el-button>
              <el-button link type="primary" :disabled="!canRegistryWrite" @click="openDialog('registry', row)">{{ t('container.edit', 'Edit') }}</el-button>
              <el-button
                link
                type="danger"
                :loading="actionLoading === `registry:${row.id}`"
                :disabled="!canDelete"
                @click="deleteRegistry(row)"
              >
                {{ t('container.delete', 'Delete') }}
              </el-button>
            </div>
          </template>
        </el-table-column>
      </custom-table>

      <div v-if="activeTab === 'config'" v-loading="listLoading" class="config-editor">
        <div class="config-editor__meta">
          <span>{{ t('container.configFile', 'Config file: {path}', { path: dockerConfig?.configPath || '--' }) }}</span>
          <el-tag :type="dockerConfig?.exists ? 'success' : 'info'" effect="light">
            {{ dockerConfig?.exists ? t('container.exists', 'Exists') : t('container.notCreated', 'Not created') }}
          </el-tag>
        </div>
        <el-input
          v-model="configForm.raw"
          type="textarea"
          :rows="16"
          :placeholder="t('container.configPlaceholder', 'Enter Docker config JSON, for example {\\n  &quot;log-driver&quot;: &quot;json-file&quot;\\n}')"
        />
        <div class="field-help">
          {{ t('container.configSaveTip', 'Saving only writes daemon.json and does not restart Docker automatically. To apply changes, click &quot;Restart Docker&quot; and confirm the operation preview.') }}
        </div>
      </div>

      <el-pagination
        v-if="hasPagination"
        class="resource-pagination"
        :current-page="activeListState.page"
        :page-size="activeListState.pageSize"
        :total="activeListState.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        @current-change="handlePageChange"
        @size-change="handlePageSizeChange"
      />

      <div class="panel-foot">
        <span v-if="activeTab === 'containers'">{{ t('container.footer.containers', '{total} containers, {running} running on current page', { total: listState.containers.total, running: runningContainers }) }}</span>
        <span v-if="activeTab === 'images'">{{ t('container.footer.images', '{total} images, current page size {size}', { total: listState.images.total, size: totalImagesSize }) }}</span>
        <span v-if="activeTab === 'networks'">{{ t('container.footer.networks', '{total} networks', { total: listState.networks.total }) }}</span>
        <span v-if="activeTab === 'volumes'">{{ t('container.footer.volumes', '{total} volumes', { total: listState.volumes.total }) }}</span>
        <span v-if="activeTab === 'compose'">{{ t('container.footer.compose', '{total} Compose projects, read-only', { total: composeProjects.length }) }}</span>
        <span v-if="activeTab === 'templates'">{{ t('container.footer.templates', '{total} templates', { total: templates.length }) }}</span>
        <span v-if="activeTab === 'registries'">{{ t('container.footer.registries', '{total} registries', { total: listState.registries.total }) }}</span>
        <span v-if="activeTab === 'config'">{{ t('container.footer.config', 'Docker config read and save') }}</span>
      </div>
    </section>

    <ContainerCreateDrawer
      ref="createDrawerRef"
      :visible="dialogVisible && dialogType === 'container'"
      :saving="saving"
      :form="form"
      :rules="rules"
      :images="images"
      :networks="networks"
      :volumes="volumes"
      :image-reference="imageReference"
      @confirm="submitDialog"
      @update:visible="dialogVisible = $event"
      @add-port="addPort"
      @remove-port="removePort"
      @add-mount="addMount"
      @remove-mount="removeMount"
    />

    <ContainerResourceDialog
      ref="resourceDialogRef"
      :visible="dialogVisible && dialogType !== 'container'"
      :dialog-type="dialogType"
      :dialog-target="dialogTarget"
      :saving="saving"
      :form="form"
      :rules="rules"
      :image-action-form="imageActionForm"
      :registry-form="registryForm"
      :template-form="templateForm"
      :registries="registries"
      :image-reference="imageReference"
      :registry-label="registryLabel"
      @confirm="submitDialog"
      @update:visible="dialogVisible = $event"
      @import-file-change="handleImportFileChange"
    />

    <ContainerDetailDrawer
      v-model:visible="detailVisible"
      :title="detailTitle"
      :loading="detailLoading"
      :detail-type="detailType"
      :detail-data="detailData"
      :detail-stats="detailStats"
      @close="handleDetailClose"
    />

    <ContainerLogsDialog
      v-model:visible="logsVisible"
      :loading="logsLoading"
      :downloading="logDownloading"
      :target="logTarget"
      :logs-text="logsText"
      :tail="logTail"
      :time-filter="logTimeFilter"
      :timestamps="logTimestamps"
      @update:tail="logTail = $event"
      @update:time-filter="logTimeFilter = $event"
      @update:timestamps="logTimestamps = $event"
      @refresh="loadLogs()"
      @download="downloadLogs()"
    />

    <ContainerTerminalDrawer
      v-model="terminalDrawer.show"
      :target="terminalDrawer.target"
    />

    <ContainerTaskDrawer
      v-model="taskDrawer.show"
      @finished="refreshTaskAffectedLists"
    />
  </div>
</template>

<style scoped lang="less">
.container-page {
  min-height: 100%;
  color: var(--text-primary);
}

.container-alert,
.resource-panel {
  width: 100%;
  max-width: none;
  margin: 0 0 16px;
}

.container-hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 18px;

  h2 {
    color: var(--text-primary);
    font-size: 22px;
    font-weight: 720;
  }

  p {
    margin-top: 6px;
    color: var(--text-tertiary);
    font-size: 13px;
  }
}

.hero-actions,
.panel-actions,
.row-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.resource-panel {
  padding: 18px 20px 16px;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: var(--surface-card);
  box-shadow: var(--shadow-soft);
}

.panel-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  min-height: 52px;
  margin-bottom: 14px;
  border-bottom: 1px solid var(--border-subtle);
}

.panel-top :deep(.el-tabs__header) {
  margin: 0;
}

.panel-top :deep(.el-tabs__nav-wrap::after) {
  display: none;
}

.panel-top :deep(.el-tabs__item) {
  height: 48px;
  padding: 0 18px;
  font-weight: 700;
}

.panel-actions {
  min-height: 48px;
  padding-bottom: 8px;
  justify-content: flex-end;
}

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 14px;
  padding: 12px;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: color-mix(in srgb, var(--surface-page) 72%, var(--surface-card));
}

.table-toolbar__filters,
.table-toolbar__batch {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.table-toolbar__filters {
  flex: 1;
  min-width: 0;

  :deep(.el-input) {
    width: min(360px, 100%);
  }
}

.status-filter {
  width: 128px;
}

.table-toolbar__batch {
  justify-content: flex-end;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 700;
}

.resource-panel :deep(.el-table) {
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  overflow: hidden;
}

.resource-panel :deep(.el-table th.el-table__cell) {
  background: color-mix(in srgb, var(--surface-page) 70%, var(--surface-card));
  color: var(--text-secondary);
  font-weight: 700;
}

.resource-panel :deep(.el-table__empty-block) {
  min-height: 104px;
}

.primary-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;

  span {
    color: var(--text-secondary);
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
    font-size: 12px;
  }
}

.panel-foot {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
  color: var(--text-secondary);
  font-weight: 600;
}

.resource-pagination {
  margin-top: 16px;
  justify-content: flex-end;
}

.config-editor {
  padding: 4px 0 0;

  :deep(.el-textarea__inner) {
    border-radius: 8px;
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
    line-height: 1.6;
  }
}

.config-editor__meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  color: var(--text-secondary);
  font-weight: 700;
}

:global(.el-message-box:has(.container-create-preview)) {
  width: 560px;
  max-width: calc(100vw - 32px);
}

:global(.container-create-preview) {
  display: flex;
  flex-direction: column;
  gap: 14px;
  color: var(--text-primary);
}

:global(.container-create-preview__notice) {
  padding: 10px 12px;
  border: 1px solid color-mix(in srgb, var(--accent-color) 22%, transparent);
  border-radius: 8px;
  background: color-mix(in srgb, var(--accent-color) 8%, var(--surface-card));
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.6;
}

:global(.container-create-preview__grid) {
  display: grid;
  gap: 8px;
}

:global(.container-create-preview__row) {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  padding: 9px 10px;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: color-mix(in srgb, var(--surface-page) 58%, var(--surface-card));
}

:global(.container-create-preview__label) {
  color: var(--text-tertiary);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.6;
}

:global(.container-create-preview__value) {
  color: var(--text-primary);
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
  font-size: 13px;
  font-weight: 650;
  line-height: 1.6;
  overflow-wrap: anywhere;
  word-break: break-word;
}

:global(.container-create-preview__value.is-danger) {
  color: var(--danger-color);
}

.field-help {
  flex-basis: 100%;
  margin-top: 8px;
  color: var(--text-tertiary);
  font-size: 13px;
  line-height: 1.5;
}

@media (max-width: 980px) {
  .container-page {
    padding: 16px;
  }

  .container-hero,
  .panel-top {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
