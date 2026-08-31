export type ResourceTab = 'containers' | 'images' | 'networks' | 'volumes' | 'compose'
  | 'templates'
  | 'registries'
  | 'config'

export type DialogType = 'container'
  | 'image'
  | 'image-import'
  | 'image-build'
  | 'image-tag'
  | 'image-push'
  | 'compose-create'
  | 'compose-edit'
  | 'compose-template-deploy'
  | 'network'
  | 'volume'
  | 'registry'
  | 'template'

export type MountMode = 'bind' | 'volume'
export type MountPermission = 'rw' | 'ro'
export type PortPublishMode = 'ports' | 'all'
export type PortProtocol = 'tcp' | 'udp' | 'sctp'
export type DetailType = 'container' | 'image' | 'network' | 'volume'
export type ContainerAction = 'start' | 'stop' | 'restart' | 'pause' | 'unpause' | 'kill' | 'rm'
export type RuntimeCapabilityKey =
  | 'runtime'
  | 'containerManage'
  | 'imageManage'
  | 'networkManage'
  | 'volumeManage'
  | 'composeManage'
  | 'registryManage'
  | 'registryTest'
  | 'dockerConfig'

export interface RuntimeCapabilityInfo {
  available: boolean
  requiresDockerCli?: boolean
  requiresDockerDaemon?: boolean
  disabledReasonCode?: string
  disabledReason?: string
}

export interface RuntimeInfo {
  available: boolean
  installed?: boolean
  running?: boolean
  dockerVersion?: string
  composeVersion?: string
  serverVersion?: string
  message?: string
  capabilities?: Partial<Record<RuntimeCapabilityKey, RuntimeCapabilityInfo>>
}

export interface ContainerItem {
  ID: string
  Names: string
  Image: string
  Command?: string
  CreatedAt?: string
  Status?: string
  Ports?: string
  RunningFor?: string
  LocalVolumes?: string
  Size?: string
  Mounts?: string
  Networks?: string
  NetworkMode?: string
  NetworkHealth?: 'healthy' | 'unknown' | 'unhealthy'
  NetworkHealthCode?: string
  NetworkHealthMessage?: string
}

export interface ImageItem {
  ID: string
  Repository: string
  Tag: string
  CreatedSince?: string
  CreatedAt?: string
  Size?: string
  Containers?: string | number
  used?: boolean
}

export interface NetworkItem {
  ID: string
  Name: string
  Driver?: string
  Scope?: string
  Subnet?: string
  Gateway?: string
  IPv6Subnet?: string
  IPv6Gateway?: string
  Labels?: Record<string, string>
  Options?: Record<string, string>
  Internal?: boolean
  EnableIPv6?: boolean
  health?: 'healthy' | 'unknown' | 'unhealthy'
  healthCode?: string
  healthMessage?: string
  connectivityVerified?: boolean
  ipamVerified?: boolean
}

export interface VolumeItem {
  Name: string
  Driver?: string
  Scope?: string
  Mountpoint?: string
  Options?: Record<string, string>
  Labels?: Record<string, string>
}

export interface RegistryItem {
  id: number | string
  name: string
  address: string
  protocol: 'http' | 'https'
  authEnabled?: boolean
  username?: string
  status?: string
  createdAt?: string
  updatedAt?: string
}

export interface TemplateItem {
  id?: number | string
  name: string
  description?: string
  content?: string
  supported?: boolean
  message?: string
}

export interface ComposeProjectItem {
  Name?: string
  name?: string
  projectName?: string
  Status?: string
  status?: string
  ConfigFiles?: string[] | string
  configFiles?: string[] | string
  WorkingDir?: string
  workingDir?: string
  managed?: boolean
  configReadable?: boolean
  editable?: boolean
  editReason?: string
  safetyTips?: string[]
  actions?: string[]
  services?: Array<{
    name?: string
    status?: string
  }>
}

export interface ContainerStats {
  id?: string
  name?: string
  cpuPercent?: string
  memoryUsage?: string
  memoryPercent?: string
  networkIO?: string
  blockIO?: string
  pids?: string
}

export interface ListState {
  page: number
  pageSize: number
  total: number
  search: string
  status?: string
}
