<script setup lang="ts">
import { computed, h, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import {
  Delete,
  Document,
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
const logTarget = ref<ContainerItem | null>(null)
const logsText = ref('')
const logTail = ref(500)
const dialogTarget = ref<any>(null)
const importFile = ref<File | null>(null)
const detailVisible = ref(false)
const detailLoading = ref(false)
const detailType = ref<DetailType>('container')
const detailTarget = ref<any>(null)
const detailData = ref<Record<string, any> | null>(null)
const detailStats = ref<ContainerStats | null>(null)
const taskDrawer = reactive({
  show: false,
  taskId: ''
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
  if (runtimeLoading.value) return '检测中'
  return runtimeAvailable.value ? '运行时可用' : '运行时不可用'
})
const runningContainers = computed(() =>
  containers.value.filter((item) => String(item.Status || '').toLowerCase().startsWith('up')).length
)
const totalImagesSize = computed(() => images.value.map((item) => item.Size).filter(Boolean).join(' / ') || '--')
const pageableTabs = ['containers', 'images', 'networks', 'volumes', 'registries'] as const
const hasPagination = computed(() => pageableTabs.includes(activeTab.value as typeof pageableTabs[number]))
const activeListState = computed(() => listState[activeTab.value as keyof typeof listState] || listState.containers)
const detailTitle = computed(() => {
  const target = detailTarget.value || {}
  if (detailType.value === 'container') return `${target.Names || shortId(target.ID)} 详情`
  if (detailType.value === 'image') return `${target.Repository ? imageReference(target) : shortId(target.ID)} 详情`
  if (detailType.value === 'network') return `${target.Name || shortId(target.ID)} 详情`
  return `${target.Name || '存储卷'} 详情`
})

const rules = computed<FormRules>(() => ({
  name: [{ required: ['container', 'network', 'volume'].includes(dialogType.value), message: '请输入名称', trigger: 'blur' }],
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
        callback(new Error(form.manualImage ? '请输入镜像引用' : '请选择镜像'))
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
  taskDrawer.taskId = taskId
  taskDrawer.show = true
  dialogVisible.value = false
  activeTab.value = targetTab
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
  await loadLogs(row, logTail.value)
}

const loadLogs = async (row = logTarget.value, tail = logTail.value) => {
  if (!row?.ID) return
  logsLoading.value = true
  try {
    const normalizedTail = Math.min(10000, Math.max(1, Number(tail) || 500))
    logTail.value = normalizedTail
    const { data } = await Api.getContainerLogs(row.ID, { tail: normalizedTail })
    logsText.value = data?.logs || ''
  } finally {
    logsLoading.value = false
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
        <h2>容器管理</h2>
        <p>管理 Docker 容器、镜像、网络、存储卷和 Compose 项目。</p>
      </div>
      <div class="hero-actions">
        <el-button :icon="Refresh" :loading="runtimeLoading || listLoading" @click="refreshAll">刷新</el-button>
        <el-button
          type="primary"
          :icon="Plus"
          :disabled="!runtimeAvailable || !canCreateContainer"
          @click="openDialog('container')"
        >
          创建容器
        </el-button>
      </div>
    </section>

    <el-alert
      v-if="!canRead"
      class="container-alert"
      title="当前账号没有容器读取权限"
      type="warning"
      show-icon
      :closable="false"
    />
    <el-alert
      v-else-if="runtime && !runtime.available"
      class="container-alert"
      :title="runtime.message || 'Docker 运行时不可用'"
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
          <el-tab-pane label="容器" name="containers" />
          <el-tab-pane label="镜像" name="images" />
          <el-tab-pane label="网络" name="networks" />
          <el-tab-pane label="存储卷" name="volumes" />
          <el-tab-pane label="Compose" name="compose" />
          <el-tab-pane label="模板" name="templates" />
          <el-tab-pane label="Registry" name="registries" />
          <el-tab-pane label="Docker 配置" name="config" />
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
            清理已停止
          </el-button>
          <el-button
            v-if="activeTab === 'images'"
            type="primary"
            :icon="Plus"
            :disabled="!runtimeAvailable || !canImageWrite"
            @click="openDialog('image')"
          >
            拉取镜像
          </el-button>
          <el-button
            v-if="activeTab === 'images'"
            :disabled="!runtimeAvailable || !canImageWrite"
            @click="openDialog('image-import')"
          >
            导入
          </el-button>
          <el-button
            v-if="activeTab === 'images'"
            :disabled="!runtimeAvailable || !canImageWrite"
            @click="openDialog('image-build')"
          >
            构建
          </el-button>
          <el-button
            v-if="activeTab === 'images'"
            type="warning"
            plain
            :loading="actionLoading === 'prune:images'"
            :disabled="!runtimeAvailable || !canCleanup"
            @click="pruneImages('images')"
          >
            清理镜像
          </el-button>
          <el-button
            v-if="activeTab === 'images'"
            plain
            :loading="actionLoading === 'prune:build-cache'"
            :disabled="!runtimeAvailable || !canCleanup"
            @click="pruneImages('build-cache')"
          >
            清理构建缓存
          </el-button>
          <el-button
            v-if="activeTab === 'networks'"
            type="primary"
            :icon="Plus"
            :disabled="!runtimeAvailable || !canNetworkWrite"
            @click="openDialog('network')"
          >
            创建网络
          </el-button>
          <el-button
            v-if="activeTab === 'networks'"
            plain
            type="warning"
            :loading="actionLoading === 'prune:networks'"
            :disabled="!runtimeAvailable || !canCleanup"
            @click="pruneNetworks"
          >
            清理无用网络
          </el-button>
          <el-button
            v-if="activeTab === 'volumes'"
            type="primary"
            :icon="Plus"
            :disabled="!runtimeAvailable || !canVolumeWrite"
            @click="openDialog('volume')"
          >
            创建存储卷
          </el-button>
          <el-button
            v-if="activeTab === 'volumes'"
            plain
            type="warning"
            :loading="actionLoading === 'prune:volumes'"
            :disabled="!runtimeAvailable || !canCleanup"
            @click="pruneVolumes"
          >
            清理无用卷
          </el-button>
          <el-button
            v-if="activeTab === 'templates'"
            type="primary"
            :icon="Plus"
            :disabled="!runtimeAvailable || !canComposeWrite || !templatesSupported"
            @click="openDialog('template')"
          >
            创建模板
          </el-button>
          <el-button
            v-if="activeTab === 'registries'"
            type="primary"
            :icon="Plus"
            :disabled="!runtimeAvailable || !canRegistryWrite"
            @click="openDialog('registry')"
          >
            新增 Registry
          </el-button>
          <el-button
            v-if="activeTab === 'config'"
            type="primary"
            :loading="actionLoading === 'config:save'"
            :disabled="!runtimeAvailable || !canConfigWrite"
            @click="saveDockerConfig"
          >
            保存配置
          </el-button>
          <el-button
            v-if="activeTab === 'config'"
            type="warning"
            plain
            :loading="actionLoading === 'runtime:restart'"
            :disabled="!runtimeAvailable || !canConfigWrite"
            @click="runRuntimeAction('restart')"
          >
            重启 Docker
          </el-button>
        </div>
      </div>

      <div v-if="hasPagination" class="table-toolbar">
        <div class="table-toolbar__filters">
          <el-input
            v-model.trim="activeListState.search"
            clearable
            :placeholder="activeTab === 'containers'
              ? '请输入容器名称或镜像'
              : activeTab === 'images'
                ? '请输入镜像 ID、仓库或 Tag'
                : activeTab === 'networks'
                  ? '请输入网络名称、驱动或子网'
                  : activeTab === 'volumes'
                    ? '请输入存储卷名称、驱动或挂载点'
                    : '请输入 Registry 名称或地址'"
            @clear="resetCurrentList"
            @keyup.enter="resetCurrentList"
          />
          <el-select
            v-if="activeTab === 'containers'"
            v-model="listState.containers.status"
            class="status-filter"
            placeholder="请选择状态"
            @change="resetCurrentList"
          >
            <el-option label="所有" value="" />
            <el-option label="已创建" value="created" />
            <el-option label="运行中" value="up" />
            <el-option label="已退出" value="exited" />
            <el-option label="重启中" value="restarting" />
            <el-option label="已暂停" value="paused" />
            <el-option label="移除中" value="removing" />
            <el-option label="异常终止" value="dead" />
          </el-select>
          <el-button :loading="listLoading" @click="resetCurrentList">查询</el-button>
        </div>
        <div class="table-toolbar__batch">
          <template v-if="activeTab === 'containers'">
            <span v-if="selectedContainers.length">已选 {{ selectedContainers.length }} 个容器</span>
            <el-dropdown
              :disabled="!selectedContainers.length || !runtimeAvailable || !canWrite"
              @command="(command: ContainerAction) => runBatchContainerAction(command)"
            >
              <el-button :loading="actionLoading.startsWith('batch:')">
                批量操作
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="start">启动</el-dropdown-item>
                  <el-dropdown-item command="stop">停止</el-dropdown-item>
                  <el-dropdown-item command="restart">重启</el-dropdown-item>
                  <el-dropdown-item command="pause">暂停</el-dropdown-item>
                  <el-dropdown-item command="unpause">恢复</el-dropdown-item>
                  <el-dropdown-item command="kill" :disabled="!canForceAction">强制停止</el-dropdown-item>
                  <el-dropdown-item command="rm" :disabled="!canDelete" divided>删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template v-if="activeTab === 'networks'">
            <span v-if="selectedNetworks.length">已选 {{ selectedNetworks.length }} 个网络</span>
            <el-button
              :loading="actionLoading === 'batch:networks'"
              :disabled="!selectedNetworks.length || !runtimeAvailable || !canNetworkWrite"
              @click="batchDeleteNetworks"
            >
              批量删除
            </el-button>
          </template>
          <template v-if="activeTab === 'volumes'">
            <span v-if="selectedVolumes.length">已选 {{ selectedVolumes.length }} 个存储卷</span>
            <el-button
              :loading="actionLoading === 'batch:volumes'"
              :disabled="!selectedVolumes.length || !runtimeAvailable || !canVolumeWrite"
              @click="batchDeleteVolumes"
            >
              批量删除
            </el-button>
          </template>
        </div>
      </div>

      <el-table
        v-if="activeTab === 'containers'"
        v-loading="listLoading"
        :data="containers"
        :row-key="getRowKey"
        empty-text="暂无容器"
        @selection-change="handleContainerSelectionChange"
      >
        <el-table-column type="selection" width="44" />
        <el-table-column label="名称" min-width="170">
          <template #default="{ row }">
            <div class="primary-cell">
              <strong>{{ row.Names || shortId(row.ID) }}</strong>
              <span>{{ shortId(row.ID) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="Image" label="镜像" min-width="180" show-overflow-tooltip />
        <el-table-column label="状态" min-width="130">
          <template #default="{ row }">
            <el-tag :type="statusType(row.Status)" effect="light">{{ row.Status || '--' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="Ports" label="端口" min-width="190" show-overflow-tooltip />
        <el-table-column prop="Networks" label="网络" min-width="120" show-overflow-tooltip />
        <el-table-column prop="Mounts" label="挂载" min-width="180" show-overflow-tooltip />
        <el-table-column fixed="right" label="操作" width="420">
          <template #default="{ row }">
            <div class="row-actions">
              <el-button
                link
                type="primary"
                :icon="Document"
                @click="openDetail('container', row)"
              >
                详情
              </el-button>
              <el-button
                link
                type="primary"
                :icon="Document"
                :disabled="!canReadLogs"
                @click="openLogs(row)"
              >
                日志
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
                启动
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
                停止
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
                暂停
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
                恢复
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
                重启
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
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <el-table
        v-if="activeTab === 'images'"
        v-loading="listLoading"
        :data="images"
        :row-key="getRowKey"
        empty-text="暂无镜像"
      >
        <el-table-column label="镜像" min-width="260">
          <template #default="{ row }">
            <div class="primary-cell">
              <strong>{{ imageReference(row) }}</strong>
              <span>{{ shortId(row.ID) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="CreatedSince" label="创建时间" min-width="150" />
        <el-table-column prop="Size" label="大小" width="120" />
        <el-table-column prop="Containers" label="关联容器" width="110" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.used ? 'success' : 'info'" effect="light">{{ row.used ? '已使用' : '未使用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column fixed="right" label="操作" width="310">
          <template #default="{ row }">
            <div class="row-actions">
              <el-button link type="primary" @click="openDetail('image', row)">详情</el-button>
              <el-button link type="primary" :disabled="!runtimeAvailable || !canImageWrite" @click="openDialog('image-tag', row)">标签</el-button>
              <el-button link type="primary" :disabled="!runtimeAvailable || !canImageWrite" @click="openDialog('image-push', row)">推送</el-button>
              <el-button
                link
                type="primary"
                :loading="actionLoading === `export:${row.ID}`"
                :disabled="!runtimeAvailable"
                @click="exportImage(row)"
              >
                导出
              </el-button>
              <el-button
                link
                type="danger"
                :icon="Delete"
                :loading="actionLoading === row.ID"
                :disabled="!runtimeAvailable || !canDelete"
                @click="deleteImage(row)"
              >
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <el-table
        v-if="activeTab === 'networks'"
        v-loading="listLoading"
        :data="networks"
        :row-key="getRowKey"
        empty-text="暂无网络"
        @selection-change="handleNetworkSelectionChange"
      >
        <el-table-column type="selection" width="44" />
        <el-table-column prop="Name" label="名称" min-width="180" />
        <el-table-column label="ID" min-width="140">
          <template #default="{ row }">{{ shortId(row.ID) }}</template>
        </el-table-column>
        <el-table-column prop="Driver" label="驱动" width="130" />
        <el-table-column prop="Scope" label="范围" width="130" />
        <el-table-column prop="Subnet" label="IPv4 子网" min-width="160" show-overflow-tooltip />
        <el-table-column prop="Gateway" label="网关" min-width="140" show-overflow-tooltip />
        <el-table-column label="IPv6" width="90">
          <template #default="{ row }">
            <el-tag :type="row.EnableIPv6 ? 'success' : 'info'" effect="light">{{ row.EnableIPv6 ? '启用' : '关闭' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column fixed="right" label="操作" width="170">
          <template #default="{ row }">
            <div class="row-actions">
              <el-button link type="primary" @click="openDetail('network', row)">详情</el-button>
              <el-button
                link
                type="danger"
                :icon="Delete"
                :loading="actionLoading === row.ID"
                :disabled="!runtimeAvailable || !canNetworkWrite"
                @click="deleteNetwork(row)"
              >
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <el-table
        v-if="activeTab === 'volumes'"
        v-loading="listLoading"
        :data="volumes"
        :row-key="getRowKey"
        empty-text="暂无存储卷"
        @selection-change="handleVolumeSelectionChange"
      >
        <el-table-column type="selection" width="44" />
        <el-table-column prop="Name" label="名称" min-width="220" />
        <el-table-column prop="Driver" label="驱动" width="130" />
        <el-table-column prop="Scope" label="范围" width="130" />
        <el-table-column prop="Mountpoint" label="挂载点" min-width="260" show-overflow-tooltip />
        <el-table-column label="Options" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ row.Options ? Object.keys(row.Options).join('，') : '--' }}</template>
        </el-table-column>
        <el-table-column fixed="right" label="操作" width="170">
          <template #default="{ row }">
            <div class="row-actions">
              <el-button link type="primary" @click="openDetail('volume', row)">详情</el-button>
              <el-button
                link
                type="danger"
                :icon="Delete"
                :loading="actionLoading === row.Name"
                :disabled="!runtimeAvailable || !canVolumeWrite"
                @click="deleteVolume(row)"
              >
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <el-table
        v-if="activeTab === 'compose'"
        v-loading="listLoading"
        :data="composeProjects"
        :row-key="getRowKey"
        empty-text="暂无 Compose 项目"
      >
        <el-table-column prop="Name" label="项目" min-width="180" />
        <el-table-column prop="Status" label="状态" min-width="160" />
        <el-table-column prop="ConfigFiles" label="配置文件" min-width="260" show-overflow-tooltip />
        <el-table-column prop="WorkingDir" label="工作目录" min-width="260" show-overflow-tooltip />
        <el-table-column label="操作" width="140">
          <template #default>
            <el-tooltip content="后端暂未启用 Compose 写操作">
              <el-button link type="info" :icon="SwitchButton" disabled>暂未启用</el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <el-alert
        v-if="activeTab === 'templates' && !templatesSupported"
        class="container-alert"
        :title="templatesMessage || '编排模板暂未启用'"
        type="info"
        show-icon
        :closable="false"
      />

      <el-table
        v-if="activeTab === 'templates'"
        v-loading="listLoading"
        :data="templates"
        :row-key="getRowKey"
        empty-text="暂无编排模板"
      >
        <el-table-column prop="name" label="模板名称" min-width="180" />
        <el-table-column prop="description" label="说明" min-width="260" show-overflow-tooltip />
        <el-table-column label="内容" min-width="260" show-overflow-tooltip>
          <template #default="{ row }">{{ row.content || '--' }}</template>
        </el-table-column>
        <el-table-column fixed="right" label="操作" width="160">
          <template #default="{ row }">
            <div class="row-actions">
              <el-button link type="primary" :disabled="!canComposeWrite || !templatesSupported" @click="openDialog('template', row)">编辑</el-button>
              <el-button
                link
                type="danger"
                :loading="actionLoading === `template:${row.id}`"
                :disabled="!canDelete || !row.id || !templatesSupported"
                @click="deleteTemplate(row)"
              >
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <el-table
        v-if="activeTab === 'registries'"
        v-loading="listLoading"
        :data="registries"
        :row-key="getRowKey"
        empty-text="暂无 Registry"
      >
        <el-table-column prop="name" label="名称" min-width="160" />
        <el-table-column label="地址" min-width="240">
          <template #default="{ row }">{{ registryLabel(row) }}</template>
        </el-table-column>
        <el-table-column prop="username" label="用户名" min-width="140" />
        <el-table-column label="认证" width="90">
          <template #default="{ row }">
            <el-tag :type="row.authEnabled ? 'success' : 'info'" effect="light">{{ row.authEnabled ? '已启用' : '未启用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120" />
        <el-table-column fixed="right" label="操作" width="230">
          <template #default="{ row }">
            <div class="row-actions">
              <el-button
                link
                type="primary"
                :loading="actionLoading === `registry-test:${row.id}`"
                :disabled="!runtimeAvailable || !canRegistryWrite"
                @click="testRegistry(row)"
              >
                测试
              </el-button>
              <el-button link type="primary" :disabled="!canRegistryWrite" @click="openDialog('registry', row)">编辑</el-button>
              <el-button
                link
                type="danger"
                :loading="actionLoading === `registry:${row.id}`"
                :disabled="!canDelete"
                @click="deleteRegistry(row)"
              >
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="activeTab === 'config'" v-loading="listLoading" class="config-editor">
        <div class="config-editor__meta">
          <span>配置文件：{{ dockerConfig?.configPath || '--' }}</span>
          <el-tag :type="dockerConfig?.exists ? 'success' : 'info'" effect="light">
            {{ dockerConfig?.exists ? '已存在' : '未创建' }}
          </el-tag>
        </div>
        <el-input
          v-model="configForm.raw"
          type="textarea"
          :rows="16"
          placeholder="请输入 Docker 配置 JSON，例如 {\n  &quot;log-driver&quot;: &quot;json-file&quot;\n}"
        />
        <div class="field-help">
          保存只写入 daemon.json，不会自动重启 Docker。需要生效时请点击“重启 Docker”并确认操作预览。
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
        <span v-if="activeTab === 'containers'">共 {{ listState.containers.total }} 个容器，当前页 {{ runningContainers }} 个运行中</span>
        <span v-if="activeTab === 'images'">共 {{ listState.images.total }} 个镜像，当前页大小 {{ totalImagesSize }}</span>
        <span v-if="activeTab === 'networks'">共 {{ listState.networks.total }} 个网络</span>
        <span v-if="activeTab === 'volumes'">共 {{ listState.volumes.total }} 个存储卷</span>
        <span v-if="activeTab === 'compose'">共 {{ composeProjects.length }} 个 Compose 项目，只支持读取</span>
        <span v-if="activeTab === 'templates'">共 {{ templates.length }} 个模板</span>
        <span v-if="activeTab === 'registries'">共 {{ listState.registries.total }} 个 Registry</span>
        <span v-if="activeTab === 'config'">Docker 配置读取与保存</span>
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
      :target="logTarget"
      :logs-text="logsText"
      :tail="logTail"
      @update:tail="logTail = $event"
      @refresh="loadLogs()"
    />

    <ContainerTaskDrawer
      v-model="taskDrawer.show"
      :task-id="taskDrawer.taskId"
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
