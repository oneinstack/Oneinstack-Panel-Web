export type SnapshotResourceType =
  | "website"
  | "nginx"
  | "firewall"
  | "panel_access";
export type SnapshotOperation = "create" | "update" | "delete" | "restore";
export type SnapshotStatus =
  | "pending"
  | "applying"
  | "succeeded"
  | "failed"
  | "rolled_back"
  | "rollback_failed";

export interface ConfigurationSnapshot {
  id: string;
  resourceType: SnapshotResourceType;
  resourceId: string;
  operation: SnapshotOperation;
  status: SnapshotStatus;
  beforeRevision?: string;
  afterRevision?: string;
  artifactSha256?: string;
  taskId?: string;
  requestedBy: number;
  failureMessage?: string;
  createdAt: string;
  finishedAt?: string;
  name?: string;
  version?: string;
  backupAccount?: string;
  sizeBytes?: number;
  description?: string;
}

export interface SnapshotDiff {
  added: string[];
  changed: string[];
  removed: string[];
  summary: string;
}

export interface SnapshotListParams {
  page?: number;
  pageSize?: number;
  resourceType?: SnapshotResourceType | "";
  resourceId?: string;
  status?: SnapshotStatus | "";
}

export interface CreateConfigurationSnapshotPayload {
  resourceType: SnapshotResourceType;
  resourceId: string;
  name?: string;
  version?: string;
  backupAccount?: string;
  description?: string;
}

export interface SystemProcessItem {
  pid: number;
  ppid: number;
  name: string;
  username?: string;
  status: string;
  cpuPercent: number;
  memoryRss: number;
  createTime: number;
}

export interface SystemProcessDetail extends SystemProcessItem {
  executable?: string;
  command?: string;
  cwd?: string;
  children?: number[];
}

export interface SystemProcessListData {
  items: SystemProcessItem[];
  total: number;
  offset: number;
  limit: number;
}

export interface SystemDiskDevice {
  device: string;
  mountpoint: string;
  fsType: string;
  options: string;
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
  uuid?: string;
  persistent: boolean;
}

export interface SystemDiskData {
  devices: SystemDiskDevice[];
  fstab: string[];
}

export interface SystemSshConfig {
  supported: boolean;
  service?: string;
  configPath?: string;
  port?: string;
  passwordAuthentication?: string;
  permitRootLogin?: string;
  pubkeyAuthentication?: string;
  permitEmptyPasswords?: string;
  listenAddress?: string;
  error?: string;
}
