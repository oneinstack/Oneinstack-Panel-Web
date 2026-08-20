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
  operation: SnapshotOperation | string;
  status: SnapshotStatus | string;
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
  resourceName?: string;
  resourceDisplayName?: string;
  configPath?: string;
  resourceMissing?: boolean;
  operationLabel?: string;
  statusLabel?: string;
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

export type CertificateProvider = "uploaded" | "self-signed" | "acme";
export type CertificateStatus =
  | "active"
  | "expiring"
  | "expired"
  | "disabled"
  | "error";
export type CertificateTaskStatus =
  | "queued"
  | "running"
  | "canceling"
  | "succeeded"
  | "failed"
  | "canceled"
  | "interrupted";
export type CertificateTaskOperation =
  | "issue"
  | "renew"
  | "upload"
  | "self_signed"
  | "bind";

export interface CertificateAlgorithm {
  value: string;
  label: string;
  keyType: "ec" | "rsa";
  bits: number;
}

export interface DnsProviderOption {
  value: string;
  label: string;
}

export interface ManagedCertificate {
  id: string;
  provider: CertificateProvider;
  domains: string;
  serialNumber?: string;
  issuer?: string;
  algorithm?: string;
  status: CertificateStatus;
  autoRenew: boolean;
  renewBeforeDays: number;
  notBefore?: string;
  notAfter?: string;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CertificateBinding {
  id: string;
  certificateId: string;
  websiteId: number;
  status: "active" | "disabled" | "error";
  forceHttps: boolean;
  lastError?: string;
  deployedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CertificateTask {
  id: string;
  operation: CertificateTaskOperation;
  websiteId?: number;
  websiteName?: string;
  certificateId?: string;
  managedId?: string;
  email?: string;
  domains?: string;
  autoRenew?: boolean;
  renewBeforeDays?: number;
  forceHttps?: boolean;
  algorithm?: string;
  validityYears?: number;
  remark?: string;
  status: CertificateTaskStatus;
  progress: number;
  message?: string;
  errorCode?: string;
  errorMessage?: string;
  requestedBy?: number;
  cancelRequested?: boolean;
  startedAt?: string;
  finishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DnsAccount {
  id: string;
  name: string;
  provider: string;
  credentialConfigured: boolean;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}
