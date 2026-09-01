<script setup lang="ts">
import {
  computed,
  h,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from "vue";
import {
  Delete,
  Document,
  Download,
  EditPen,
  Connection,
  CollectionTag,
  Monitor,
  Plus,
  Refresh,
  SwitchButton,
  Upload,
  VideoPause,
  VideoPlay,
  WarningFilled,
} from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox, type FormRules } from "element-plus";
import { ElOption, ElSelect } from "element-plus";
import { Api } from "@/api/modules";
import { useConfigStore } from "@/stores/modules/config";
import RuntimeSummary from "./components/RuntimeSummary.vue";
import ContainerCreateDrawer from "./components/ContainerCreateDrawer.vue";
import ContainerResourceDialog from "./components/ContainerResourceDialog.vue";
import ContainerDetailDrawer from "./components/ContainerDetailDrawer.vue";
import ContainerLogsDialog from "./components/ContainerLogsDialog.vue";
import ContainerTerminalDrawer from "./components/ContainerTerminalDrawer.vue";
import ContainerTaskDrawer from "./components/ContainerTaskDrawer.vue";
import { useContainerTaskStore } from "@/stores/modules/containerTask";
import type {
  ComposeProjectItem,
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
  RuntimeCapabilityInfo,
  RuntimeCapabilityKey,
  RuntimeInfo,
  TemplateItem,
  VolumeItem,
} from "./types";
import i18n from "@/lang";
import type { ColumnItem } from "@/components/custom-table.vue";

const sconfig = useConfigStore()
const containerTaskStore = useContainerTaskStore()

const t = (key: string, fallback?: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params);
  return value && value !== key ? value : fallback || key;
};

const activeTab = ref<ResourceTab>("containers");
const runtime = ref<RuntimeInfo | null>(null);
const runtimeLoading = ref(false);
const listLoading = ref(false);
const actionLoading = ref("");
const containers = ref<ContainerItem[]>([]);
const images = ref<ImageItem[]>([]);
const networks = ref<NetworkItem[]>([]);
const volumes = ref<VolumeItem[]>([]);
const composeProjects = ref<ComposeProjectItem[]>([]);
const registries = ref<RegistryItem[]>([]);
const templates = ref<TemplateItem[]>([]);
const templatesSupported = ref(true);
const templatesMessage = ref("");
const dockerConfig = ref<Record<string, any> | null>(null);
const loadedTabs = reactive<Record<ResourceTab, boolean>>({
  containers: false,
  images: false,
  networks: false,
  volumes: false,
  compose: false,
  templates: false,
  registries: false,
  config: false,
});
const listState = reactive<
  Record<
    "containers" | "images" | "networks" | "volumes" | "registries",
    ListState
  >
>({
  containers: { page: 1, pageSize: 10, total: 0, search: "", status: "" },
  images: { page: 1, pageSize: 10, total: 0, search: "" },
  networks: { page: 1, pageSize: 10, total: 0, search: "" },
  volumes: { page: 1, pageSize: 10, total: 0, search: "" },
  registries: { page: 1, pageSize: 10, total: 0, search: "" },
});

const createDrawerRef = ref<InstanceType<typeof ContainerCreateDrawer>>();
const resourceDialogRef = ref<InstanceType<typeof ContainerResourceDialog>>();
const dialogVisible = ref(false);
const dialogType = ref<DialogType>("container");
const saving = ref(false);
const selectedContainers = ref<ContainerItem[]>([]);
const selectedNetworks = ref<NetworkItem[]>([]);
const selectedVolumes = ref<VolumeItem[]>([]);
const logsVisible = ref(false);
const logsLoading = ref(false);
const logDownloading = ref(false);
const logTarget = ref<{
  kind: "container" | "compose";
  id: string;
  name: string;
  canDownload: boolean;
} | null>(null);
const logsText = ref("");
const logTail = ref(100);
const logTimeFilter = ref("all");
const logCustomRange = ref<[Date, Date] | []>([]);
const logTimestamps = ref(true);
const dialogTarget = ref<any>(null);
const importFile = ref<File | null>(null);
const detailVisible = ref(false);
const detailLoading = ref(false);
const detailType = ref<DetailType>("container");
const detailTarget = ref<any>(null);
const detailData = ref<Record<string, any> | null>(null);
const detailStats = ref<ContainerStats | null>(null);
const terminalDrawer = reactive({
  show: false,
  target: null as ContainerItem | null,
});
const taskDrawer = reactive({
  show: false,
  taskId: "",
});
let statsTimer: ReturnType<typeof setInterval> | undefined;

const form = reactive({
  name: "",
  image: "",
  manualImage: false,
  reference: "",
  driver: "",
  portPublishMode: "ports" as PortPublishMode,
  ports: [{ host: "", container: "", protocol: "tcp" as PortProtocol }],
  networksText: "bridge",
  ipv4: "",
  ipv6: "",
  mounts: [
    {
      mode: "bind" as MountMode,
      source: "",
      target: "",
      permission: "rw" as MountPermission,
    },
  ],
  commandText: "",
  entrypointText: "",
  restart: "no",
  cpuWeight: 1000,
  cpuLimit: 0,
  memoryLimitMB: 0,
  networkIpv4: false,
  networkIpv4Subnet: "",
  networkIpv4Gateway: "",
  networkIpv4IpRange: "",
  networkIpv4AuxAddressesText: "",
  networkIpv6: false,
  networkIpv6Subnet: "",
  networkIpv6Gateway: "",
  networkIpv6IpRange: "",
  networkIpv6AuxAddressesText: "",
  optionsText: "",
  volumeNfs: false,
  labelsText: "",
  environmentText: "",
  autoRemove: false,
  privileged: false,
  tty: false,
  openStdin: false,
});

const imageActionForm = reactive({
  pullMode: "reference" as "reference" | "registry",
  reference: "",
  registryId: undefined as number | string | undefined,
  imageName: "",
  buildMode: "dockerfile" as "dockerfile" | "path",
  buildName: "",
  dockerfile: "FROM nginx:1.27\nCOPY ./dist /usr/share/nginx/html",
  contextPath: "",
  dockerfilePath: "",
  labelsText: "",
  tagReference: "",
  removeOther: false,
  pushMode: "reference" as "reference" | "registry",
  pushReference: "",
  pushImageName: "",
});

const registryForm = reactive({
  name: "",
  address: "",
  protocol: "https" as "http" | "https",
  authEnabled: false,
  username: "",
  password: "",
});

const templateForm = reactive({
  name: "",
  description: "",
  content: "services:\n  web:\n    image: nginx:1.27\n",
});

const composeForm = reactive({
  name: "",
  sourceMode: "yaml" as "yaml" | "upload",
  content: "services:\n  web:\n    image: nginx:1.27\n",
  templateId: undefined as number | string | undefined,
  templateName: "",
  templateDescription: "",
  sourceFileName: "",
  removeVolumes: false,
  contentMode: "redacted" as "redacted" | "plaintext",
  containsSensitiveConfig: false,
  redactionReason: "",
});

const configForm = reactive({
  raw: "",
});

const dockerConfigPlaceholder = computed(
  () =>
    `${t("container.configPlaceholder", "Enter Docker config JSON, for example")}
${JSON.stringify({ "log-driver": "json-file" }, null, 2)}`,
);

const containerScope = computed(() => sconfig.scopeAccess?.container || {});
const canRead = computed(() => sconfig.hasScopeAccess("container", "read"));
const canWrite = computed(
  () =>
    containerScope.value.write || sconfig.hasScopeAccess("container", "write"),
);
const canDelete = computed(
  () =>
    containerScope.value.delete ||
    sconfig.hasScopeAccess("container", "delete"),
);
const canForceAction = computed(() =>
  sconfig.hasActionAccess("container.force_action"),
);
const canReadLogs = computed(
  () =>
    containerScope.value.logsRead ||
    sconfig.hasScopeAccess("container", "logsRead"),
);
const canUseTerminal = computed(
  () =>
    sconfig.hasActionAccess("container.terminal") ||
    sconfig.hasScopeAccess("container", "terminal"),
);
const canCreateContainer = computed(
  () => canWrite.value || sconfig.hasActionAccess("container.create"),
);
const canImageWrite = computed(
  () =>
    containerScope.value.imageWrite ||
    sconfig.hasScopeAccess("container", "imageWrite"),
);
const canNetworkWrite = computed(
  () =>
    containerScope.value.networkWrite ||
    sconfig.hasScopeAccess("container", "networkWrite"),
);
const canVolumeWrite = computed(
  () =>
    containerScope.value.volumeWrite ||
    sconfig.hasScopeAccess("container", "volumeWrite"),
);
const canComposeWrite = computed(
  () =>
    containerScope.value.composeWrite ||
    sconfig.hasScopeAccess("container", "composeWrite"),
);
const canRegistryWrite = computed(
  () =>
    containerScope.value.registryWrite ||
    sconfig.hasScopeAccess("container", "registryWrite"),
);
const canConfigWrite = computed(
  () =>
    containerScope.value.configWrite ||
    sconfig.hasScopeAccess("container", "configWrite"),
);
const canCleanup = computed(
  () =>
    sconfig.hasActionAccess("container.dangerous.cleanup") ||
    containerScope.value.dangerousCleanup ||
    sconfig.hasScopeAccess("container", "dangerousCleanup"),
);

const capabilityFallbackAvailability: Record<RuntimeCapabilityKey, boolean> = {
  runtime: false,
  containerManage: false,
  imageManage: false,
  networkManage: false,
  volumeManage: false,
  composeManage: false,
  registryManage: true,
  registryTest: true,
  dockerConfig: true,
};

const getCapabilityState = (
  key: RuntimeCapabilityKey,
): RuntimeCapabilityInfo => {
  const capability = runtime.value?.capabilities?.[key];
  if (capability) return capability;
  return {
    available: capabilityFallbackAvailability[key]
      ? true
      : runtime.value?.available !== false,
  };
};

const getCapabilityDisabledReason = (
  key: RuntimeCapabilityKey,
  permissionAllowed: boolean,
  permissionReason: string,
) => {
  if (!permissionAllowed) return permissionReason;
  const capability = getCapabilityState(key);
  if (capability.available) return "";
  return (
    capability.disabledReason ||
    runtime.value?.message ||
    t("container.runtimeUnavailable", "Runtime unavailable")
  );
};

const runtimeAvailable = computed(() => runtime.value?.available !== false);
const registryManageAvailable = computed(
  () => getCapabilityState("registryManage").available,
);
const registryTestAvailable = computed(
  () => getCapabilityState("registryTest").available,
);
const dockerConfigAvailable = computed(
  () => getCapabilityState("dockerConfig").available,
);
const createContainerDisabledReason = computed(() => {
  if (runtimeLoading.value) return t("container.checking", "Checking");
  return getCapabilityDisabledReason(
    "containerManage",
    canCreateContainer.value,
    t(
      "container.createDisabledPermission",
      "当前账号没有创建容器权限",
    ),
  );
});
const registryManageDisabledReason = computed(() => {
  if (runtimeLoading.value) return t("container.checking", "Checking");
  return getCapabilityDisabledReason(
    "registryManage",
    canRegistryWrite.value,
    t(
      "container.registryWriteDisabled",
      "当前账号没有 Registry 管理权限",
    ),
  );
});
const registryTestDisabledReason = computed(() => {
  if (runtimeLoading.value) return t("container.checking", "Checking");
  return getCapabilityDisabledReason(
    "registryTest",
    canRegistryWrite.value,
    t(
      "container.registryWriteDisabled",
      "当前账号没有 Registry 管理权限",
    ),
  );
});
const dockerConfigDisabledReason = computed(() => {
  if (runtimeLoading.value) return t("container.checking", "Checking");
  return getCapabilityDisabledReason(
    "dockerConfig",
    canConfigWrite.value,
    t(
      "container.configWriteDisabled",
      "当前账号没有 Docker 配置写入权限",
    ),
  );
});
const runtimeStatusText = computed(() => {
  if (runtimeLoading.value) return t("container.checking", "Checking");
  return runtimeAvailable.value
    ? t("container.runtimeAvailable", "Runtime available")
    : t("container.runtimeUnavailable", "Runtime unavailable");
});
const runningContainers = computed(
  () =>
    containers.value.filter((item) =>
      String(item.Status || "")
        .toLowerCase()
        .startsWith("up"),
    ).length,
);
const canReadContainerTask = computed(
  () =>
    sconfig.hasMenuAccess("task.read") &&
    (sconfig.hasScopeAccess("task", "readAll") ||
      sconfig.hasScopeAccess("task", "readSelf")),
);
const activeTaskCount = computed(
  () =>
    containerTaskStore.order.filter((id) => {
      const task = containerTaskStore.tasks[id];
      return task && !containerTaskStore.isTerminal(task.status);
    }).length,
);
const totalImagesSize = computed(
  () =>
    images.value
      .map((item) => item.Size)
      .filter(Boolean)
      .join(" / ") || "--",
);
const pageableTabs = [
  "containers",
  "images",
  "networks",
  "volumes",
  "registries",
] as const;
const hasPagination = computed(() =>
  pageableTabs.includes(activeTab.value as (typeof pageableTabs)[number]),
);
const activeListState = computed(
  () =>
    listState[activeTab.value as keyof typeof listState] ||
    listState.containers,
);
const detailTitle = computed(() => {
  const target = detailTarget.value || {};
  if (detailType.value === "container")
    return t("container.detailTitle", "{name} details", {
      name: target.Names || shortId(target.ID),
    });
  if (detailType.value === "image")
    return t("container.detailTitle", "{name} details", {
      name: target.Repository ? imageReference(target) : shortId(target.ID),
    });
  if (detailType.value === "network")
    return t("container.detailTitle", "{name} details", {
      name: target.Name || shortId(target.ID),
    });
  return t("container.detailTitle", "{name} details", {
    name: target.Name || t("container.volume", "Volume"),
  });
});

const rules = computed<FormRules>(() => ({
  name: [
    {
      required: ["container", "network", "volume"].includes(dialogType.value),
      message: t("common.inputPlaceholder", "Enter"),
      trigger: "blur",
    },
  ],
  image: [
    {
      validator: (
        _rule: unknown,
        value: string,
        callback: (error?: Error) => void,
      ) => {
        if (dialogType.value !== "container") {
          callback();
          return;
        }
        if (typeof value === "string" && value.trim()) {
          callback();
          return;
        }
        callback(
          new Error(
            form.manualImage
              ? t(
                  "container.searchPlaceholders.images",
                  "Enter image ID, repository, or tag",
                )
              : t("container.create.selectImage", "Select image"),
          ),
        );
      },
      trigger: ["blur", "change"],
    },
  ],
}));

const normalizeList = <T,>(data: any): T[] => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

const updateListState = (tab: keyof typeof listState, data: any) => {
  const state = listState[tab];
  state.total = Number(data?.total ?? normalizeList(data).length ?? 0);
  state.page = Number(data?.page || state.page || 1);
  state.pageSize = Number(data?.pageSize || state.pageSize || 10);
};

const listQuery = (tab: keyof typeof listState) => {
  const state = listState[tab];
  return {
    page: state.page,
    pageSize: state.pageSize,
    search: state.search.trim() || undefined,
    ...(tab === "containers" && state.status && state.status !== "all"
      ? { status: state.status }
      : {}),
  };
};

const resetForm = () => {
  form.name = "";
  form.image = "";
  form.manualImage = false;
  form.reference = "";
  form.driver = "";
  form.portPublishMode = "ports";
  form.ports = [{ host: "", container: "", protocol: "tcp" }];
  form.networksText = "bridge";
  form.ipv4 = "";
  form.ipv6 = "";
  form.mounts = [{ mode: "bind", source: "", target: "", permission: "rw" }];
  form.commandText = "";
  form.entrypointText = "";
  form.restart = "no";
  form.cpuWeight = 1000;
  form.cpuLimit = 0;
  form.memoryLimitMB = 0;
  form.networkIpv4 = false;
  form.networkIpv4Subnet = "";
  form.networkIpv4Gateway = "";
  form.networkIpv4IpRange = "";
  form.networkIpv4AuxAddressesText = "";
  form.networkIpv6 = false;
  form.networkIpv6Subnet = "";
  form.networkIpv6Gateway = "";
  form.networkIpv6IpRange = "";
  form.networkIpv6AuxAddressesText = "";
  form.optionsText = "";
  form.volumeNfs = false;
  form.labelsText = "";
  form.environmentText = "";
  form.autoRemove = false;
  form.privileged = false;
  form.tty = false;
  form.openStdin = false;
  imageActionForm.pullMode = "reference";
  imageActionForm.reference = "";
  imageActionForm.registryId = undefined;
  imageActionForm.imageName = "";
  imageActionForm.buildMode = "dockerfile";
  imageActionForm.buildName = "";
  imageActionForm.dockerfile =
    "FROM nginx:1.27\nCOPY ./dist /usr/share/nginx/html";
  imageActionForm.contextPath = "";
  imageActionForm.dockerfilePath = "";
  imageActionForm.labelsText = "";
  imageActionForm.tagReference = "";
  imageActionForm.removeOther = false;
  imageActionForm.pushMode = "reference";
  imageActionForm.pushReference = "";
  imageActionForm.pushImageName = "";
  registryForm.name = "";
  registryForm.address = "";
  registryForm.protocol = "https";
  registryForm.authEnabled = false;
  registryForm.username = "";
  registryForm.password = "";
  templateForm.name = "";
  templateForm.description = "";
  templateForm.content = "services:\n  web:\n    image: nginx:1.27\n";
  composeForm.name = "";
  composeForm.sourceMode = "yaml";
  composeForm.content = "services:\n  web:\n    image: nginx:1.27\n";
  composeForm.templateId = undefined;
  composeForm.templateName = "";
  composeForm.templateDescription = "";
  composeForm.sourceFileName = "";
  composeForm.removeVolumes = false;
  composeForm.contentMode = "redacted";
  composeForm.containsSensitiveConfig = false;
  composeForm.redactionReason = "";
  importFile.value = null;
  dialogTarget.value = null;
  createDrawerRef.value?.clearValidate();
  resourceDialogRef.value?.clearValidate();
};

const getRowKey = (row: Record<string, any>) =>
  row.ID ||
  row.Id ||
  row.id ||
  row.Name ||
  row.name ||
  row.Project ||
  row.NameWithTag ||
  JSON.stringify(row);

const statusType = (status?: string) => {
  const value = String(status || "").toLowerCase();
  if (value.startsWith("up")) return "success";
  if (value.includes("paused")) return "warning";
  if (value.includes("exited") || value.includes("dead")) return "danger";
  return "info";
};

const isCustomDockerNetworkMode = (value?: string) => {
  const mode = String(value || "").trim().toLowerCase();
  return !!mode && !["default", "bridge", "host", "none", "container"].includes(mode);
};

const splitContainerStatus = (status?: string) => {
  const text = String(status || "--").trim();
  const match = text.match(/^(Up|Exited|Restarting|Paused|Created|Removing|Dead)(.*)$/i);
  if (!match) {
    return { primary: text, secondary: "" };
  }
  const primary = `${match[1]}${match[2]?.startsWith(" (") ? match[2].match(/^\s*\([^)]+\)/)?.[0] || "" : ""}`.trim();
  const secondary = text.slice(primary.length).trim();
  return { primary, secondary };
};

const normalizedContainerStatus = (row: ContainerItem) =>
  String(row.Status || "").toLowerCase();
const isContainerPaused = (row: ContainerItem) =>
  normalizedContainerStatus(row).includes("paused");
const isContainerRunning = (row: ContainerItem) =>
  normalizedContainerStatus(row).startsWith("up") && !isContainerPaused(row);
const isContainerRestarting = (row: ContainerItem) =>
  normalizedContainerStatus(row).includes("restarting");
const isContainerRemoving = (row: ContainerItem) =>
  normalizedContainerStatus(row).includes("removing");
const canStartContainer = (row: ContainerItem) =>
  !isContainerRunning(row) &&
  !isContainerPaused(row) &&
  !isContainerRestarting(row) &&
  !isContainerRemoving(row);
const canStopContainer = (row: ContainerItem) =>
  isContainerRunning(row) ||
  isContainerPaused(row) ||
  isContainerRestarting(row);
const canRestartContainer = (row: ContainerItem) =>
  isContainerRunning(row) || isContainerRestarting(row);
const canPauseContainer = (row: ContainerItem) => isContainerRunning(row);
const canUnpauseContainer = (row: ContainerItem) => isContainerPaused(row);
const canDeleteContainer = (row: ContainerItem) =>
  !isContainerRunning(row) &&
  !isContainerPaused(row) &&
  !isContainerRestarting(row) &&
  !isContainerRemoving(row);
const canOpenContainerTerminal = (row: ContainerItem) => canUseTerminal.value;

const networkHealthTagType = (health?: string) => {
  if (health === "healthy") return "success";
  if (health === "unhealthy") return "danger";
  return "warning";
};

const containerNetworkDisplay = (row: ContainerItem) => {
  const networks = String(row.Networks || "").trim();
  if (networks) return networks;
  const networkMode = String(row.NetworkMode || "").trim();
  if (isCustomDockerNetworkMode(networkMode)) {
    return `${networkMode} · ${t("container.notifications.networkMissing")}`;
  }
  return "--";
};

const imageReference = (row: ImageItem) => {
  const repo = row.Repository || "<none>";
  const tag = row.Tag || "<none>";
  return `${repo}:${tag}`;
};

const registryLabel = (row: RegistryItem) => `${row.protocol}://${row.address}`;

const composeProjectName = (row?: ComposeProjectItem | null) =>
  String(row?.projectName || row?.Name || row?.name || "").trim();

const composeProjectStatus = (row?: ComposeProjectItem | null) =>
  String(row?.Status || row?.status || "").trim();

const composeProjectConfigFiles = (row?: ComposeProjectItem | null) => {
  const value = row?.ConfigFiles ?? row?.configFiles;
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  return String(value || "").trim();
};

const composeProjectWorkingDir = (row?: ComposeProjectItem | null) =>
  String(row?.WorkingDir || row?.workingDir || "").trim();

const composeProjectActions = (row?: ComposeProjectItem | null) =>
  Array.isArray(row?.actions)
    ? row.actions.map((item) => String(item || "").toLowerCase())
    : [];

const hasComposeAction = (row: ComposeProjectItem, action: string) =>
  composeProjectActions(row).includes(action);

const composeStatusTagType = (row: ComposeProjectItem) => {
  const status = composeProjectStatus(row).toLowerCase();
  if (status.includes("running") || status.includes("healthy")) return "success";
  if (status.includes("stopped") || status.includes("exited")) return "info";
  if (status.includes("error") || status.includes("failed")) return "danger";
  return "warning";
};

const shortId = (id?: string) =>
  String(id || "")
    .replace(/^sha256:/, "")
    .slice(0, 12) || "--";

const containerColumns = computed<ColumnItem<ContainerItem>[]>(() => [
  { type: "selection", width: 44 },
  {
    prop: "Names",
    label: t("container.columns.name", "Name"),
    minWidth: 170,
    slot: "containerName",
  },
  {
    prop: "Image",
    label: t("container.columns.image", "Image"),
    minWidth: 180,
    showOverflowTooltip: true,
  },
  {
    prop: "Status",
    label: t("container.columns.status", "Status"),
    minWidth: 280,
    slot: "containerStatus",
  },
  {
    prop: "Ports",
    label: t("container.columns.ports", "Ports"),
    minWidth: 190,
    showOverflowTooltip: true,
  },
  {
    prop: "Networks",
    label: t("container.columns.networks", "Networks"),
    minWidth: 120,
    slot: "containerNetworks",
  },
  {
    prop: "Mounts",
    label: t("container.columns.mounts", "Mounts"),
    minWidth: 180,
    slot: "containerMounts",
  },
  {
    prop: "actionColumn",
    label: t("container.columns.action", "Actions"),
    width: 640,
    fixed: "right",
    slot: "containerAction",
    className: "table-action-column",
  },
]);
const imageColumns = computed<ColumnItem<ImageItem>[]>(() => [
  {
    prop: "Repository",
    label: t("container.columns.image", "Image"),
    minWidth: 260,
    slot: "imageName",
  },
  {
    prop: "CreatedSince",
    label: t("container.columns.createdAt", "Created at"),
    minWidth: 150,
  },
  { prop: "Size", label: t("container.columns.size", "Size"), width: 120 },
  {
    prop: "Containers",
    label: t("container.columns.linkedContainers", "Linked containers"),
    width: 110,
  },
  {
    prop: "used",
    label: t("container.columns.status", "Status"),
    width: 100,
    slot: "imageStatus",
  },
  {
    prop: "actionColumn",
    label: t("container.columns.action", "Actions"),
    width: 310,
    fixed: "right",
    slot: "imageAction",
    className: "table-action-column",
  },
]);
const networkColumns = computed<ColumnItem<NetworkItem>[]>(() => [
  { type: "selection", width: 44 },
  { prop: "Name", label: t("container.columns.name", "Name"), minWidth: 180 },
  { prop: "ID", label: "ID", minWidth: 140, slot: "networkId" },
  {
    prop: "Driver",
    label: t("container.columns.driver", "Driver"),
    width: 130,
  },
  { prop: "Scope", label: t("container.columns.scope", "Scope"), width: 130 },
  {
    prop: "Subnet",
    label: t("container.columns.ipv4Subnet", "IPv4 subnet"),
    minWidth: 160,
    showOverflowTooltip: true,
  },
  {
    prop: "Gateway",
    label: t("container.columns.gateway", "Gateway"),
    minWidth: 140,
    showOverflowTooltip: true,
  },
  { prop: "EnableIPv6", label: "IPv6", width: 90, slot: "ipv6" },
  {
    prop: "health",
    label: t("container.columns.networkHealth", "Network health"),
    minWidth: 140,
    slot: "networkHealth",
  },
  {
    prop: "actionColumn",
    label: t("container.columns.action", "Actions"),
    width: 170,
    fixed: "right",
    slot: "networkAction",
    className: "table-action-column",
  },
]);
const volumeColumns = computed<ColumnItem<VolumeItem>[]>(() => [
  { type: "selection", width: 44 },
  { prop: "Name", label: t("container.columns.name", "Name"), minWidth: 220 },
  {
    prop: "Driver",
    label: t("container.columns.driver", "Driver"),
    width: 130,
  },
  { prop: "Scope", label: t("container.columns.scope", "Scope"), width: 130 },
  {
    prop: "Mountpoint",
    label: t("container.columns.mountPoint", "Mount point"),
    minWidth: 260,
    showOverflowTooltip: true,
  },
  {
    prop: "Options",
    label: t("container.columns.options", "Options"),
    minWidth: 180,
    showOverflowTooltip: true,
    slot: "volumeOptions",
  },
  {
    prop: "actionColumn",
    label: t("container.columns.action", "Actions"),
    width: 170,
    fixed: "right",
    slot: "volumeAction",
    className: "table-action-column",
  },
]);
const composeColumns = computed<ColumnItem<ComposeProjectItem>[]>(() => [
  {
    prop: "projectName",
    label: t("container.columns.project", "Project"),
    minWidth: 180,
    slot: "composeProject",
  },
  {
    prop: "status",
    label: t("container.columns.status", "Status"),
    minWidth: 160,
    slot: "composeStatus",
  },
  {
    prop: "services",
    label: t("container.columns.services", "Services"),
    minWidth: 220,
    slot: "composeServices",
  },
  {
    prop: "configFiles",
    label: t("container.columns.configFiles", "Config files"),
    minWidth: 260,
    slot: "composeConfigFiles",
  },
  {
    prop: "workingDir",
    label: t("container.columns.workDir", "Working directory"),
    minWidth: 260,
    slot: "composeWorkingDir",
  },
  {
    prop: "actionColumn",
    label: t("container.columns.action", "Actions"),
    width: 420,
    fixed: "right",
    slot: "composeAction",
    className: "table-action-column",
  },
]);
const templateColumns = computed<ColumnItem<TemplateItem>[]>(() => [
  {
    prop: "name",
    label: t("container.columns.templateName", "Template name"),
    minWidth: 180,
  },
  {
    prop: "description",
    label: t("container.columns.description", "Description"),
    minWidth: 260,
    showOverflowTooltip: true,
  },
  {
    prop: "content",
    label: t("container.columns.content", "Content"),
    minWidth: 260,
    showOverflowTooltip: true,
    slot: "templateContent",
  },
  {
    prop: "actionColumn",
    label: t("container.columns.action", "Actions"),
    width: 160,
    fixed: "right",
    slot: "templateAction",
    className: "table-action-column",
  },
]);
const registryColumns = computed<ColumnItem<RegistryItem>[]>(() => [
  { prop: "name", label: t("container.columns.name", "Name"), minWidth: 160 },
  {
    prop: "address",
    label: t("container.columns.address", "Address"),
    minWidth: 240,
    slot: "registryAddress",
  },
  {
    prop: "username",
    label: t("container.columns.username", "Username"),
    minWidth: 140,
  },
  {
    prop: "authEnabled",
    label: t("container.columns.auth", "Auth"),
    width: 90,
    slot: "registryAuth",
  },
  {
    prop: "status",
    label: t("container.columns.status", "Status"),
    width: 120,
  },
  {
    prop: "actionColumn",
    label: t("container.columns.action", "Actions"),
    width: 230,
    fixed: "right",
    slot: "registryAction",
    className: "table-action-column",
  },
]);

const loadRuntime = async () => {
  runtimeLoading.value = true;
  try {
    const { data } = await Api.getContainerRuntime();
    runtime.value = data || {
      available: false,
      message: t("container.runtimeInfoUnavailable"),
    };
  } finally {
    runtimeLoading.value = false;
  }
};

const loadContainerSummary = async () => {
  const { data } = await Api.getContainers(listQuery("containers"));
  containers.value = normalizeList<ContainerItem>(data);
  updateListState("containers", data);
  loadedTabs.containers = true;
};

const loadActiveTab = async (force = false) => {
  if (!canRead.value) return;
  if (!force && loadedTabs[activeTab.value]) return;
  listLoading.value = true;
  try {
    if (activeTab.value === "containers") {
      await loadContainerSummary();
    }
    if (activeTab.value === "images") {
      const { data } = await Api.getContainerImages(listQuery("images"));
      images.value = normalizeList<ImageItem>(data);
      updateListState("images", data);
    }
    if (activeTab.value === "networks") {
      const { data } = await Api.getContainerNetworks(listQuery("networks"));
      networks.value = normalizeList<NetworkItem>(data);
      updateListState("networks", data);
    }
    if (activeTab.value === "volumes") {
      const { data } = await Api.getContainerVolumes(listQuery("volumes"));
      volumes.value = normalizeList<VolumeItem>(data);
      updateListState("volumes", data);
    }
    if (activeTab.value === "compose") {
      const { data } = await Api.getContainerCompose();
      composeProjects.value = normalizeList<Record<string, any>>(data);
    }
    if (activeTab.value === "templates") {
      const { data } = await Api.getContainerTemplates();
      templates.value = normalizeList<TemplateItem>(data);
      templatesSupported.value = data?.supported !== false;
      templatesMessage.value = data?.message || "";
    }
    if (activeTab.value === "registries") {
      const { data } = await Api.getContainerRegistries(
        listQuery("registries"),
      );
      registries.value = normalizeList<RegistryItem>(data);
      if (data?.capabilities) {
        runtime.value = {
          ...(runtime.value || { available: false }),
          capabilities: {
            ...(runtime.value?.capabilities || {}),
            ...data.capabilities,
          },
        };
      }
      updateListState("registries", data);
    }
    if (activeTab.value === "config") {
      try {
        const { data } = await Api.getContainerConfig();
        dockerConfig.value = data || null;
        configForm.raw = data?.raw || "{}";
      } catch {
        dockerConfig.value = null;
        configForm.raw = "{}";
        return;
      }
    }
    loadedTabs[activeTab.value] = true;
  } finally {
    listLoading.value = false;
  }
};

const refreshAll = async () => {
  await loadRuntime();
  Object.keys(loadedTabs).forEach((key) => {
    loadedTabs[key as ResourceTab] = false;
  });
  await loadActiveTab(true);
};

const ensureVolumesLoaded = async () => {
  if (volumes.value.length || loadedTabs.volumes) return;
  try {
    const { data } = await Api.getContainerVolumes({ page: 1, pageSize: 100 });
    volumes.value = normalizeList<VolumeItem>(data);
    loadedTabs.volumes = true;
  } catch (error) {
    console.warn("加载存储卷列表失败", error);
  }
};

const ensureImagesLoaded = async () => {
  if (images.value.length || loadedTabs.images) return;
  try {
    const { data } = await Api.getContainerImages({ page: 1, pageSize: 100 });
    images.value = normalizeList<ImageItem>(data);
    loadedTabs.images = true;
  } catch (error) {
    console.warn("加载镜像列表失败", error);
  }
};

const ensureNetworksLoaded = async () => {
  if (networks.value.length || loadedTabs.networks) return;
  try {
    const { data } = await Api.getContainerNetworks({ page: 1, pageSize: 100 });
    networks.value = normalizeList<NetworkItem>(data);
    loadedTabs.networks = true;
  } catch (error) {
    console.warn("加载网络列表失败", error);
  }
};

const ensureRegistriesLoaded = async () => {
  if (registries.value.length || loadedTabs.registries) return;
  try {
    const { data } = await Api.getContainerRegistries({
      page: 1,
      pageSize: 100,
    });
    registries.value = normalizeList<RegistryItem>(data);
    loadedTabs.registries = true;
  } catch (error) {
    console.warn("加载 Registry 列表失败", error);
  }
};

const ensureTemplatesLoaded = async () => {
  if (templates.value.length || loadedTabs.templates) return;
  try {
    const { data } = await Api.getContainerTemplates();
    templates.value = normalizeList<TemplateItem>(data);
    templatesSupported.value = data?.supported !== false;
    templatesMessage.value = data?.message || "";
    loadedTabs.templates = true;
  } catch (error) {
    console.warn("加载 Compose 模板列表失败", error);
  }
};

const openDialog = (type: DialogType, target?: any) => {
  resetForm();
  dialogType.value = type;
  dialogTarget.value = target || null;
  form.driver =
    type === "network" ? "bridge" : type === "volume" ? "local" : "";
  if (type === "image-tag" && target)
    imageActionForm.tagReference = imageReference(target);
  if (type === "image-push" && target)
    imageActionForm.pushReference = imageReference(target);
  if (type === "registry" && target) {
    registryForm.name = target.name || "";
    registryForm.address = target.address || "";
    registryForm.protocol = target.protocol || "https";
    registryForm.authEnabled = !!target.authEnabled;
    registryForm.username = target.username || "";
  }
  if (type === "template" && target) {
    templateForm.name = target.name || "";
    templateForm.description = target.description || "";
    templateForm.content = target.content || "";
  }
  if (type === "compose-template-deploy" && target) {
    composeForm.templateId = target.id;
    composeForm.templateName = target.name || "";
    composeForm.templateDescription = target.description || "";
    composeForm.content = target.content || "";
  }
  dialogVisible.value = true;
  if (type === "container") {
    void ensureImagesLoaded();
    void ensureNetworksLoaded();
    void ensureVolumesLoaded();
  }
  if (["image", "image-push"].includes(type)) void ensureRegistriesLoaded();
  if (type === "compose-template-deploy") void ensureTemplatesLoaded();
};

const openComposeEditDialog = async (row: ComposeProjectItem) => {
  const name = composeProjectName(row);
  if (!name) return;
  if (row.configReadable === false) {
    ElMessage.warning(
      row.editReason || t("container.compose.configUnreadable"),
    );
    return;
  }
  resetForm();
  dialogType.value = "compose-edit";
  dialogTarget.value = row;
  composeForm.name = name;
  saving.value = true;
  try {
    const { data } = await Api.getContainerComposeConfig(name);
    composeForm.content = String(data?.content || data?.raw || "");
    composeForm.contentMode = data?.contentMode === "plaintext" ? "plaintext" : "redacted";
    composeForm.containsSensitiveConfig = Boolean(data?.containsSensitiveConfig);
    composeForm.redactionReason = String(data?.redactionReason || "");
    dialogVisible.value = true;
  } catch (error: any) {
    ElMessage.error(
      error?.message || t("container.compose.configUnreadable"),
    );
  } finally {
    saving.value = false;
  }
};

const revealComposeConfig = async () => {
  const name = composeForm.name.trim();
  if (!name || composeForm.contentMode === "plaintext") return;
  try {
    const { value: panelPassword } = await ElMessageBox.prompt(
      t(
        "container.resourceDialog.revealSensitiveConfigMessage",
        "Sensitive values will be shown in plain text in the editor. Enter your current panel password to continue.",
      ),
      t("container.resourceDialog.revealSensitiveConfigTitle", "View sensitive Compose configuration"),
      {
        inputType: "password",
        inputPlaceholder: t("container.resourceDialog.panelPasswordPlaceholder", "Enter your current panel password"),
        confirmButtonText: t("common.confirm", "Confirm"),
        cancelButtonText: t("common.cancel", "Cancel"),
        inputValidator: (value) => Boolean(value?.trim()) || t("container.resourceDialog.panelPasswordRequired", "Enter your current panel password"),
      },
    );
    const { data } = await Api.revealContainerComposeConfig(name, panelPassword.trim());
    composeForm.content = String(data?.content || "");
    composeForm.contentMode = "plaintext";
    composeForm.containsSensitiveConfig = Boolean(data?.containsSensitiveConfig);
    composeForm.redactionReason = "";
  } catch (error: any) {
    if (error === "cancel" || error === "close") return;
    ElMessage.error(error?.message || t("container.resourceDialog.revealSensitiveConfigFailed", "Unable to view sensitive configuration"));
  }
};

const splitTokens = (value: string) =>
  value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);

const parseStringList = (value: string, fieldLabel: string) => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (
        Array.isArray(parsed) &&
        parsed.every((item) => typeof item === "string")
      )
        return parsed;
    } catch {
      // fall through to validation error below
    }
    throw new Error(
      t("container.validation.stringList", undefined, { field: fieldLabel }),
    );
  }
  return splitTokens(value);
};

const parseKeyValueMap = (value: string, fieldLabel: string) => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return Object.fromEntries(
          Object.entries(parsed).map(([key, item]) => [
            key,
            String(item ?? ""),
          ]),
        );
      }
    } catch {
      // fall through to validation error below
    }
    throw new Error(
      t("container.validation.keyValueObject", undefined, {
        field: fieldLabel,
      }),
    );
  }

  const result: Record<string, string> = {};
  splitTokens(value).forEach((line) => {
    const equalIndex = line.indexOf("=");
    if (equalIndex <= 0)
      throw new Error(
        t("container.validation.keyValueFormat", undefined, {
          field: fieldLabel,
        }),
      );
    result[line.slice(0, equalIndex).trim()] = line
      .slice(equalIndex + 1)
      .trim();
  });
  return Object.keys(result).length ? result : undefined;
};

const expandPortRange = (value: string, fieldLabel: string) => {
  const text = value.trim();
  if (!text) return [];
  if (!/^\d+(-\d+)?$/.test(text))
    throw new Error(
      t("container.validation.portFormat", undefined, { field: fieldLabel }),
    );
  const [startText, endText] = text.split("-");
  const start = Number(startText);
  const end = endText ? Number(endText) : start;
  if (start < 1 || end > 65535 || start > end)
    throw new Error(
      t("container.validation.portRange", undefined, { field: fieldLabel }),
    );
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
};

const parseHostPortInput = (value: string) => {
  const text = value.trim();
  if (!text)
    return { hostIp: undefined as string | undefined, ports: [] as number[] };
  const colonIndex = text.lastIndexOf(":");
  if (colonIndex > -1) {
    const hostIp = text.slice(0, colonIndex).trim();
    const portText = text.slice(colonIndex + 1).trim();
    if (!hostIp || !portText)
      throw new Error(t("container.validation.hostPortFormat"));
    return {
      hostIp,
      ports: expandPortRange(portText, t("container.validation.server")),
    };
  }
  return {
    hostIp: undefined,
    ports: expandPortRange(text, t("container.validation.server")),
  };
};

const buildPorts = () => {
  if (form.portPublishMode === "all") return undefined;
  const rows = form.ports.filter(
    (item) => item.host.trim() || item.container.trim(),
  );
  if (!rows.length) return undefined;
  return rows.flatMap((item) => {
    if (!item.host.trim() || !item.container.trim())
      throw new Error(t("container.validation.portPairRequired"));
    const { hostIp, ports: hostPorts } = parseHostPortInput(item.host);
    const containerPorts = expandPortRange(
      item.container,
      t("container.validation.container"),
    );
    if (hostPorts.length !== containerPorts.length)
      throw new Error(t("container.validation.portRangeMismatch"));
    return hostPorts.map((hostPort, index) => ({
      hostPort,
      containerPort: containerPorts[index],
      protocol: item.protocol,
      ...(hostIp ? { hostIp } : {}),
    }));
  });
};

const buildMounts = () => {
  const rows = form.mounts
    .map((item) => ({
      type: item.mode,
      mode: item.mode,
      source: item.source.trim(),
      target: item.target.trim(),
      readOnly: item.permission === "ro",
    }))
    .filter((item) => item.source || item.target);
  rows.forEach((item) => {
    if (!item.source || !item.target)
      throw new Error(t("container.validation.mountPairRequired"));
  });
  if (!rows.length) return undefined;
  return rows.map((item) => ({
    type: item.type,
    mode: item.mode,
    source: item.source,
    target: item.target,
    readOnly: item.readOnly,
  }));
};

const addMount = () => {
  form.mounts.push({ mode: "bind", source: "", target: "", permission: "rw" });
};

const removeMount = (index: number) => {
  if (form.mounts.length === 1) {
    form.mounts[0] = { mode: "bind", source: "", target: "", permission: "rw" };
    return;
  }
  form.mounts.splice(index, 1);
};

const addPort = () => {
  form.ports.push({ host: "", container: "", protocol: "tcp" });
};

const removePort = (index: number) => {
  if (form.ports.length === 1) {
    form.ports[0] = { host: "", container: "", protocol: "tcp" };
    return;
  }
  form.ports.splice(index, 1);
};

const buildContainerPayload = () => {
  const payload = {
    name: form.name.trim(),
    image: form.image.trim(),
    ports: buildPorts(),
    networks: splitTokens(form.networksText),
    ipv4: form.ipv4.trim() || undefined,
    ipv6: form.ipv6.trim() || undefined,
    mounts: buildMounts(),
    command: parseStringList(
      form.commandText,
      t("container.validation.command"),
    ),
    entrypoint: parseStringList(form.entrypointText, "EntryPoint") || [],
    autoRemove: form.autoRemove,
    privileged: form.privileged,
    tty: form.tty,
    openStdin: form.openStdin,
    restart: form.restart,
    cpuWeight: form.cpuWeight,
    cpuLimit: form.cpuLimit,
    memoryLimitMB: form.memoryLimitMB,
    labels: parseKeyValueMap(form.labelsText, "Labels"),
    environment: parseKeyValueMap(
      form.environmentText,
      t("container.validation.environment"),
    ),
  };
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => {
      if (Array.isArray(value)) return true;
      return value !== undefined && value !== "";
    }),
  ) as Parameters<typeof Api.createContainer>[0];
};

const confirmContainerCreate = async (
  payload: Parameters<typeof Api.createContainer>[0],
) => {
  const noneLabel = t("container.confirmations.none");
  const highRiskLabel = t("container.confirmations.highRiskOptions");
  const previewRows = [
    [t("container.confirmations.containerName"), payload.name],
    [t("container.columns.image"), payload.image],
    [
      t("container.confirmations.portMapping"),
      form.portPublishMode === "all"
        ? t("container.confirmations.exposeAll")
        : payload.ports
            ?.map(
              (item) =>
                `${item.hostIp ? `${item.hostIp}:` : ""}${item.hostPort}:${item.containerPort}/${item.protocol || "tcp"}`,
            )
            .join(", ") || noneLabel,
    ],
    [
      t("container.columns.networks"),
      payload.networks?.join(", ") ||
        t("container.confirmations.defaultNetwork"),
    ],
    [
      t("container.columns.mounts"),
      payload.mounts
        ?.map(
          (item) =>
            `${item.source}:${item.target}${item.readOnly ? ":ro" : ""}`,
        )
        .join(", ") || noneLabel,
    ],
    [
      t("container.confirmations.restartPolicy"),
      payload.restart || t("container.confirmations.defaultValue"),
    ],
    [
      t("container.confirmations.autoRemove"),
      payload.autoRemove
        ? t("container.confirmations.autoRemoveEnabled")
        : t("container.disabled"),
    ],
    [
      t("container.confirmations.resourceLimits"),
      `CPU ${payload.cpuLimit ?? t("container.confirmations.unlimited")} / ${t("container.resourceDetail.memory")} ${payload.memoryLimitMB ?? t("container.confirmations.unlimited")} MB`,
    ],
    [
      highRiskLabel,
      payload.privileged
        ? t("container.confirmations.privileged")
        : noneLabel,
    ],
  ];
  const message = h("div", { class: "container-create-preview" }, [
    h(
      "div",
      { class: "container-create-preview__notice" },
      t("container.confirmations.createNotice"),
    ),
    h(
      "div",
      { class: "container-create-preview__grid" },
      previewRows.map(([label, value]) =>
        h("div", { class: "container-create-preview__row" }, [
          h("span", { class: "container-create-preview__label" }, label),
          h(
            "span",
            {
              class: [
                "container-create-preview__value",
                label === highRiskLabel && value !== noneLabel ? "is-danger" : "",
              ],
            },
            value,
          ),
        ]),
      ),
    ),
  ]);
  await ElMessageBox.confirm(
    message,
    t("container.confirmations.containerCreateTitle"),
    {
    type: payload.privileged ? "warning" : "info",
      confirmButtonText: t("container.confirmations.confirmCreate"),
      cancelButtonText: t("common.cancel"),
    },
  );
};

const buildImagePullPayload = () => {
  if (imageActionForm.pullMode === "registry") {
    if (!imageActionForm.registryId || !imageActionForm.imageName.trim()) {
      throw new Error(t("container.validation.registryImageRequired"));
    }
    return {
      registryId: Number(imageActionForm.registryId),
      imageName: imageActionForm.imageName.trim(),
    };
  }
  if (!imageActionForm.reference.trim())
    throw new Error(t("container.validation.imageReferenceRequired"));
  return { reference: imageActionForm.reference.trim() };
};

const buildImagePushPayload = () => {
  if (imageActionForm.pushMode === "registry") {
    if (!imageActionForm.registryId || !imageActionForm.pushImageName.trim()) {
      throw new Error(t("container.validation.registryImageRequired"));
    }
    return {
      registryId: Number(imageActionForm.registryId),
      imageName: imageActionForm.pushImageName.trim(),
    };
  }
  if (!imageActionForm.pushReference.trim())
    throw new Error(t("container.validation.imageReferenceRequired"));
  return { reference: imageActionForm.pushReference.trim() };
};

const buildImageBuildPayload = () => {
  if (!imageActionForm.buildName.trim())
    throw new Error(t("container.validation.buildNameRequired"));
  if (imageActionForm.buildMode === "path") {
    if (!imageActionForm.contextPath.trim())
      throw new Error(t("container.validation.contextPathRequired"));
    return {
      name: imageActionForm.buildName.trim(),
      contextPath: imageActionForm.contextPath.trim(),
      dockerfilePath: imageActionForm.dockerfilePath.trim() || undefined,
      labelsText: imageActionForm.labelsText.trim() || undefined,
    };
  }
  if (!imageActionForm.dockerfile.trim())
    throw new Error(t("container.validation.dockerfileRequired"));
  return {
    name: imageActionForm.buildName.trim(),
    dockerfile: imageActionForm.dockerfile,
    labelsText: imageActionForm.labelsText.trim() || undefined,
  };
};

const truncatePreviewText = (value: string, maxLength = 88) => {
  const text = value.trim().replace(/\s+/g, " ");
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
};

const summarizeLabelEntries = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return t("container.confirmations.none");
  try {
    const parsed = parseKeyValueMap(trimmed, "Labels");
    if (!parsed) return t("container.confirmations.none");
    const entries = Object.entries(parsed);
    if (!entries.length) return t("container.confirmations.none");
    return entries
      .map(([key, item]) => `${key}=${truncatePreviewText(String(item), 48)}`)
      .join(", ");
  } catch {
    return truncatePreviewText(trimmed, 160);
  }
};

const summarizeDockerfile = (dockerfile: string) => {
  const lines = dockerfile
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) return t("container.confirmations.none");
  const preview = lines
    .slice(0, 3)
    .map((line) => truncatePreviewText(line, 72))
    .join(" | ");
  return lines.length > 3
    ? `${preview} … (+${lines.length - 3} ${t("container.resourceDialog.lines", "lines")})`
    : preview;
};

const createImageBuildPreview = () => {
  const noneLabel = t("container.confirmations.none");
  const buildModeLabel =
    imageActionForm.buildMode === "path"
      ? t("container.resourceDialog.serverPath")
      : t("container.resourceDialog.editDockerfile");
  const buildContextLabel =
    imageActionForm.buildMode === "path"
      ? imageActionForm.contextPath.trim() || noneLabel
      : t("container.confirmations.inlineDockerfile");
  const dockerfilePathLabel =
    imageActionForm.buildMode === "path"
      ? imageActionForm.dockerfilePath.trim() ||
        (imageActionForm.contextPath.trim()
          ? `${imageActionForm.contextPath.trim().replace(/\/+$/, "")}/Dockerfile`
          : noneLabel)
      : summarizeDockerfile(imageActionForm.dockerfile);
  const previewRows = [
    [t("container.confirmations.buildTargetImage"), imageActionForm.buildName.trim() || noneLabel],
    [t("container.confirmations.buildMode"), buildModeLabel],
    [t("container.confirmations.buildContext"), buildContextLabel],
    [
      imageActionForm.buildMode === "path"
        ? t("container.confirmations.dockerfilePath")
        : t("container.confirmations.dockerfileContent"),
      dockerfilePathLabel,
    ],
    [t("container.confirmations.labels"), summarizeLabelEntries(imageActionForm.labelsText)],
  ];

  return h("div", { class: "container-create-preview" }, [
    h(
      "div",
      { class: "container-create-preview__notice" },
      t(
        "container.confirmations.buildNotice",
        "Building an image reads the build context and consumes CPU and disk space. The preview below shows what will be built so you can verify the target image, context, Dockerfile source, and labels before continuing.",
      ),
    ),
    h(
      "div",
      { class: "container-create-preview__grid" },
      previewRows.map(([label, value]) =>
        h("div", { class: "container-create-preview__row" }, [
          h("span", { class: "container-create-preview__label" }, label),
          h("span", { class: "container-create-preview__value" }, value),
        ]),
      ),
    ),
  ]);
};

const buildNetworkPayload = () => ({
  name: form.name.trim(),
  driver: form.driver.trim() || undefined,
  ipv4: form.networkIpv4 || undefined,
  ipv4Subnet: form.networkIpv4Subnet.trim() || undefined,
  ipv4Gateway: form.networkIpv4Gateway.trim() || undefined,
  ipv4IpRange: form.networkIpv4IpRange.trim() || undefined,
  ipv4AuxAddresses: parseKeyValueMap(
    form.networkIpv4AuxAddressesText,
    t("container.validation.ipv4Reserved"),
  ),
  ipv6: form.networkIpv6 || undefined,
  ipv6Subnet: form.networkIpv6Subnet.trim() || undefined,
  ipv6Gateway: form.networkIpv6Gateway.trim() || undefined,
  ipv6IpRange: form.networkIpv6IpRange.trim() || undefined,
  ipv6AuxAddresses: parseKeyValueMap(
    form.networkIpv6AuxAddressesText,
    t("container.validation.ipv6Reserved"),
  ),
  optionsText: form.optionsText.trim() || undefined,
  labelsText: form.labelsText.trim() || undefined,
});

const buildVolumePayload = () => ({
  name: form.name.trim(),
  driver: form.driver.trim() || undefined,
  nfs: form.volumeNfs || undefined,
  optionsText: form.optionsText.trim() || undefined,
  labelsText: form.labelsText.trim() || undefined,
});

const buildComposeSourceLabel = () => {
  if (dialogType.value === "compose-template-deploy") {
    return composeForm.templateName
      ? `${t("container.confirmations.composeTemplate")} · ${composeForm.templateName}`
      : t("container.confirmations.composeTemplate");
  }
  if (dialogType.value === "compose-edit") {
    return t("container.confirmations.composeEditMode");
  }
  if (composeForm.sourceMode === "upload") {
    return composeForm.sourceFileName
      ? `${t("container.confirmations.composeFileMode")} · ${composeForm.sourceFileName}`
      : t("container.confirmations.composeFileMode");
  }
  return t("container.confirmations.composePasteMode");
};

const buildComposePreviewPayload = (
  action: "create" | "edit" | "update" | "delete",
) => {
  const name = composeForm.name.trim() || composeProjectName(dialogTarget.value);
  if (!name) throw new Error(t("container.validation.composeNameRequired"));
  if (dialogType.value === "compose-template-deploy") {
    if (!composeForm.templateId) {
      throw new Error(t("container.validation.composeTemplateRequired"));
    }
    return {
      action,
      name,
      templateId: composeForm.templateId,
      removeVolumes: composeForm.removeVolumes || undefined,
    };
  }
  if (action === "create" || action === "edit") {
    if (!composeForm.content.trim()) {
      throw new Error(t("container.validation.composeContentRequired"));
    }
  }
  return {
    action,
    name,
    content: composeForm.content,
    removeVolumes: composeForm.removeVolumes || undefined,
  };
};

const normalizeComposePreviewList = (value: unknown) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  }
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, any>).map(([key, item]) =>
      `${key}: ${Array.isArray(item) ? item.join(", ") : String(item ?? "")}`,
    );
  }
  if (typeof value === "string") {
    return value
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const composePreviewValue = (items: string[], fallbackKey: string) =>
  items.length ? items.join(", ") : t(fallbackKey);

const createComposePreviewMessage = (preview: any) => {
  const summary = preview?.summary || {};
  const warnings = normalizeComposePreviewList(summary.warnings);
  const ports = normalizeComposePreviewList(summary.ports);
  const networks = normalizeComposePreviewList(summary.networks);
  const volumesList = normalizeComposePreviewList(summary.volumes);
  const services = normalizeComposePreviewList(
    Array.isArray(summary.services)
      ? summary.services.map((item: any) =>
          item?.image ? `${item.name || "--"} (${item.image})` : item?.name,
        )
      : summary.services,
  );
  const rows = [
    [t("container.confirmations.composeProjectName"), preview?.name || composeForm.name.trim()],
    [t("container.confirmations.composeSource"), buildComposeSourceLabel()],
    [t("container.confirmations.composeServices"), composePreviewValue(services, "container.compose.noImpact")],
    [t("container.confirmations.composePorts"), composePreviewValue(ports, "container.confirmations.none")],
    [t("container.confirmations.composeNetworks"), composePreviewValue(networks, "container.confirmations.none")],
    [t("container.confirmations.composeVolumes"), composePreviewValue(volumesList, "container.confirmations.none")],
    [t("container.confirmations.composeWarnings"), composePreviewValue(warnings, "container.compose.noWarnings")],
    [
      t("container.confirmations.composeImpact"),
      truncatePreviewText(String(preview?.impact || preview?.message || t("container.compose.noImpact")), 180),
    ],
  ];

  return h("div", { class: "container-create-preview" }, [
    h("div", { class: "container-create-preview__notice" }, t("container.confirmations.composeNotice")),
    h(
      "div",
      { class: "container-create-preview__grid" },
      rows.map(([label, value]) =>
        h("div", { class: "container-create-preview__row" }, [
          h("span", { class: "container-create-preview__label" }, label),
          h("span", { class: "container-create-preview__value" }, value),
        ]),
      ),
    ),
  ]);
};

const getComposePreviewDialogMeta = (
  action: "create" | "edit" | "update" | "delete",
) => {
  if (action === "create") {
    return {
      title:
        dialogType.value === "compose-template-deploy"
          ? t("container.confirmations.composeCreateTitle")
          : t("container.confirmations.composeCreateTitle"),
      confirmText:
        dialogType.value === "compose-template-deploy"
          ? t("container.confirmations.composeConfirmCreate")
          : t("container.confirmations.composeConfirmCreate"),
    };
  }
  if (action === "edit") {
    return {
      title: t("container.confirmations.composeEditTitle"),
      confirmText: t("container.confirmations.composeConfirmEdit"),
    };
  }
  if (action === "update") {
    return {
      title: t("container.confirmations.composeUpdateTitle"),
      confirmText: t("container.confirmations.composeConfirmUpdate"),
    };
  }
  return {
    title: t("container.confirmations.composeDeleteTitle"),
    confirmText: t("container.confirmations.composeConfirmDelete"),
  };
};

const previewAndConfirmComposeAction = async (
  action: "create" | "edit" | "update" | "delete",
) => {
  const payload = buildComposePreviewPayload(action);
  const { data } = await Api.previewContainerCompose(payload);
  const preview = extractTaskResult({ data }) || data || {};
  const meta = getComposePreviewDialogMeta(action);
  await ElMessageBox.confirm(createComposePreviewMessage(preview), meta.title, {
    type: action === "delete" ? "warning" : "info",
    confirmButtonText: meta.confirmText,
    cancelButtonText: t("common.cancel"),
  });
  return {
    request: payload,
    preview,
    fingerprint: String(preview?.previewFingerprint || ""),
  };
};

const extractTaskResult = (response: any) => {
  const envelope = response?.data ?? response;
  return envelope?.data ?? envelope;
};

const extractContainerTaskId = (response: any) => {
  const envelope = response?.data ?? response ?? {};
  const payload = envelope?.data ?? envelope ?? {};
  return String(
    payload?.taskId ?? envelope?.taskId ?? payload?.id ?? envelope?.id ?? "",
  );
};

const openContainerTask = (
  result: any,
  request: Record<string, any>,
  targetTab: "containers" | "images" | "compose",
) => {
  const taskId = extractContainerTaskId(result);
  if (!taskId) throw new Error(t("container.validation.taskIdMissing"));
  containerTaskStore.acceptCreated(result, request);
  taskDrawer.taskId = String(taskId);
  taskDrawer.show = true;
  dialogVisible.value = false;
  activeTab.value = targetTab;
};

const openTaskDrawer = () => {
  taskDrawer.taskId = "";
  taskDrawer.show = true;
};

const handleDialogVisibleChange = (visible: boolean) => {
  dialogVisible.value = visible;
  if (visible) return;
  // Do not keep a revealed Compose secret in reactive state after the drawer closes.
  composeForm.content = "";
  composeForm.contentMode = "redacted";
  composeForm.containsSensitiveConfig = false;
  composeForm.redactionReason = "";
};

watch(
  () => taskDrawer.show,
  (show) => {
    if (show) return;
    taskDrawer.taskId = "";
  },
);

watch(
  () => composeForm.templateId,
  (templateId) => {
    if (!templateId) return;
    const current = templates.value.find((item) => item.id === templateId);
    if (!current) return;
    composeForm.templateName = current.name || "";
    composeForm.templateDescription = current.description || "";
    composeForm.content = current.content || "";
  },
);

const submitDialog = async () => {
  if (dialogType.value === "container") await createDrawerRef.value?.validate();
  else await resourceDialogRef.value?.validate();
  saving.value = true;
  try {
    if (dialogType.value === "container") {
      let payload: Parameters<typeof Api.createContainer>[0];
      try {
        payload = buildContainerPayload();
      } catch (error: any) {
        ElMessage.error(
          error?.message || t("container.notifications.invalidCreateParams"),
        );
        return;
      }
      await confirmContainerCreate(payload);
      const result = await Api.createContainer(payload);
      openContainerTask(
        result,
        {
          ...payload,
          operation: "create",
          startAfterCreate: Boolean(payload.autoRemove),
        },
        "containers",
      );
      ElMessage.success(t("container.notifications.containerTaskCreated"));
    }
    if (dialogType.value === "image") {
      const payload = buildImagePullPayload();
      const result = await Api.pullContainerImage(payload);
      openContainerTask(result, { ...payload, operation: "pull" }, "images");
      ElMessage.success(t("container.notifications.imagePullTaskCreated"));
    }
    if (dialogType.value === "image-import") {
      if (!importFile.value)
        throw new Error(t("container.validation.tarFileRequired"));
      await Api.importContainerImage(importFile.value);
      ElMessage.success(t("container.notifications.imageImportSuccess"));
      activeTab.value = "images";
    }
    if (dialogType.value === "image-build") {
      await ElMessageBox.confirm(
        createImageBuildPreview(),
        t("container.confirmations.buildTitle"),
        {
          type: "warning",
          confirmButtonText: t("container.confirmations.confirmBuild"),
          cancelButtonText: t("common.cancel"),
        },
      );
      const payload = buildImageBuildPayload();
      const result = await Api.buildContainerImage(payload);
      openContainerTask(
        result,
        { ...payload, buildName: payload.name, operation: "build" },
        "images",
      );
      ElMessage.success(t("container.notifications.imageBuildTaskCreated"));
    }
    if (dialogType.value === "image-tag") {
      if (!dialogTarget.value?.ID)
        throw new Error(t("container.validation.imageRequired"));
      if (!imageActionForm.tagReference.trim())
        throw new Error(t("container.validation.newTagRequired"));
      await Api.tagContainerImage(dialogTarget.value.ID, {
        reference: imageActionForm.tagReference.trim(),
        removeOther: imageActionForm.removeOther,
        confirm: imageActionForm.removeOther,
      });
      ElMessage.success(t("container.notifications.imageTagUpdated"));
      activeTab.value = "images";
    }
    if (dialogType.value === "image-push") {
      await ElMessageBox.confirm(
        t("container.confirmations.pushNotice"),
        t("container.confirmations.pushTitle"),
        {
          type: "info",
          confirmButtonText: t("container.confirmations.confirmPush"),
          cancelButtonText: t("common.cancel"),
        },
      );
      await Api.pushContainerImage(buildImagePushPayload());
      ElMessage.success(t("container.notifications.imagePushSuccess"));
      activeTab.value = "images";
    }
    if (
      dialogType.value === "compose-create" ||
      dialogType.value === "compose-template-deploy"
    ) {
      const { request, fingerprint } = await previewAndConfirmComposeAction("create");
      const result = await Api.createContainerCompose({
        name: request.name,
        content: request.content,
        templateId: request.templateId,
        previewFingerprint: fingerprint,
        confirm: true,
      });
      openContainerTask(
        result,
        {
          ...request,
          operation: "compose.create",
        },
        "compose",
      );
      ElMessage.success(
        t(
          dialogType.value === "compose-template-deploy"
            ? "container.notifications.composeTemplateDeployTaskCreated"
            : "container.notifications.composeTaskCreated",
        ),
      );
    }
    if (dialogType.value === "compose-edit") {
      const { request, fingerprint } = await previewAndConfirmComposeAction("edit");
      const result = await Api.updateContainerComposeConfig(request.name, {
        content: String(request.content || ""),
        previewFingerprint: fingerprint,
        confirm: true,
      });
      openContainerTask(
        result,
        {
          ...request,
          operation: "compose.edit",
        },
        "compose",
      );
      ElMessage.success(t("container.notifications.composeTaskCreated"));
    }
    if (dialogType.value === "network") {
      await Api.createContainerNetwork(buildNetworkPayload());
      ElMessage.success(t("container.notifications.networkCreated"));
      activeTab.value = "networks";
    }
    if (dialogType.value === "volume") {
      await Api.createContainerVolume(buildVolumePayload());
      ElMessage.success(t("container.notifications.volumeCreated"));
      activeTab.value = "volumes";
    }
    if (dialogType.value === "registry") {
      if (!registryForm.name.trim() || !registryForm.address.trim())
        throw new Error(t("container.validation.registryRequired"));
      const payload = {
        name: registryForm.name.trim(),
        address: registryForm.address.trim(),
        protocol: registryForm.protocol,
        authEnabled: registryForm.authEnabled,
        username: registryForm.authEnabled
          ? registryForm.username.trim()
          : undefined,
        password: registryForm.authEnabled ? registryForm.password : undefined,
      };
      if (dialogTarget.value?.id) {
        await Api.updateContainerRegistry(dialogTarget.value.id, payload);
        ElMessage.success(t("container.notifications.registryUpdated"));
      } else {
        await Api.createContainerRegistry(payload);
        ElMessage.success(t("container.notifications.registryCreated"));
      }
      activeTab.value = "registries";
    }
    if (dialogType.value === "template") {
      if (!templateForm.name.trim() || !templateForm.content.trim())
        throw new Error(t("container.validation.templateRequired"));
      const payload = {
        name: templateForm.name.trim(),
        description: templateForm.description.trim() || undefined,
        content: templateForm.content,
      };
      if (dialogTarget.value?.id) {
        await Api.updateContainerTemplate(dialogTarget.value.id, payload);
        ElMessage.success(t("container.notifications.templateUpdated"));
      } else {
        await Api.createContainerTemplate(payload);
        ElMessage.success(t("container.notifications.templateCreated"));
      }
      activeTab.value = "templates";
    }
    dialogVisible.value = false;
    loadedTabs[activeTab.value] = false;
    await loadActiveTab(true);
  } catch (error: any) {
    const isCancel =
      error === "cancel" ||
      error?.message === "cancel" ||
      error?.name === "CanceledError";
    if (!isCancel)
      ElMessage.error(
        error?.message || t("container.notifications.operationFailed"),
      );
  } finally {
    saving.value = false;
  }
};

const containerActionPollTokens = new Map<string, symbol>();

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const normalizeContainerRuntimeState = (source: any) => {
  const rawState =
    source?.State?.Status ??
    source?.status ??
    source?.stateCode ??
    source?.Status;
  return String(rawState || "")
    .trim()
    .toLowerCase();
};

const isContainerFailedState = (state: string) =>
  state === "exited" || state === "dead";

const isContainerPendingState = (state: string) =>
  state === "created" || state === "restarting" || state === "start" || state === "restart";

const formatContainerStateLabel = (state?: string) => {
  const normalized = String(state || "")
    .trim()
    .toLowerCase();
  if (!normalized) return "--";
  if (normalized === "running") {
    return t("container.statusOptions.up", "Running");
  }
  return t(`container.statusOptions.${normalized}`, normalized);
};

const buildContainerActionFailureMessage = (
  actionLabel: string,
  snapshot: {
    state?: string;
    exitCode?: number | null;
    stateMessage?: string;
  },
) => {
  if (snapshot.stateMessage) return snapshot.stateMessage;
  if (snapshot.exitCode !== undefined && snapshot.exitCode !== null) {
    return t("container.notifications.actionStateFailedWithExitCode", undefined, {
      action: actionLabel,
      state: formatContainerStateLabel(snapshot.state),
      exitCode: snapshot.exitCode,
    });
  }
  return t("container.notifications.actionStateFailed", undefined, {
    action: actionLabel,
    state: formatContainerStateLabel(snapshot.state),
  });
};

const readContainerActionSnapshot = (source: any) => {
  const state = normalizeContainerRuntimeState(source);
  const expectedNetwork =
    source?.networkMode ||
    source?.HostConfig?.NetworkMode ||
    source?.NetworkMode;
  const connectedNetworks = Array.isArray(source?.networks)
    ? source.networks
    : Object.keys(source?.NetworkSettings?.Networks || {});
  const inferredNetworkConnected =
    typeof source?.networkConnected === "boolean"
      ? source.networkConnected
      : isCustomDockerNetworkMode(expectedNetwork)
        ? connectedNetworks.includes(String(expectedNetwork))
        : true;
  const running =
    source?.running === true || source?.State?.Running === true || state === "running";
  const stateFailed =
    source?.stateFailed === true ||
    source?.stateCode === "CONTAINER_STARTUP_EXITED" ||
    source?.stateCode === "CONTAINER_STARTUP_FAILED" ||
    source?.stateCode === "CONTAINER_NETWORK_MISSING" ||
    (!inferredNetworkConnected && isCustomDockerNetworkMode(expectedNetwork)) ||
    (!running && isContainerFailedState(state));
  return {
    state,
    running,
    paused: source?.paused === true || source?.State?.Paused === true,
    exitCode:
      typeof source?.exitCode === "number"
        ? source.exitCode
        : typeof source?.State?.ExitCode === "number"
          ? source.State.ExitCode
          : null,
    stateFailed,
    actionSucceeded: source?.actionSucceeded,
    networkExpected: source?.networkExpected,
    networkConnected: inferredNetworkConnected,
    expectedNetwork,
    networks: connectedNetworks,
    dockerError:
      source?.dockerError ||
      source?.State?.Error ||
      source?.error?.detail ||
      "",
    stateCode: source?.stateCode,
    stateMessage: source?.stateMessage || source?.error,
  };
};

const resolveContainerActionErrorPayload = (error: any) => {
  const payload = error?.response?.data || error?.data || {};
  const diagnostic = payload?.data || {};
  return {
    status: Number(error?.status || error?.response?.status || payload?.status || 0),
    code: payload?.error?.code || payload?.code,
    detail:
      payload?.error?.detail ||
      diagnostic?.stateMessage ||
      error?.message ||
      t("container.notifications.operationFailed"),
    diagnostic,
  };
};

const createContainerStartupDiagnosticMessage = (
  actionLabel: string,
  snapshot: ReturnType<typeof readContainerActionSnapshot>,
) => {
  const rows = [
    [t("container.notifications.startupStatus"), formatContainerStateLabel(snapshot.state)],
    [t("container.notifications.startupExitCode"), snapshot.exitCode ?? "--"],
    [
      t("container.notifications.startupExpectedNetwork"),
      snapshot.expectedNetwork || "--",
    ],
    [
      t("container.notifications.startupConnectedNetworks"),
      snapshot.networks?.length ? snapshot.networks.join(", ") : "--",
    ],
    [
      t("container.notifications.startupDockerError"),
      snapshot.dockerError || snapshot.stateMessage || "--",
    ],
  ];

  return h("div", { class: "container-create-preview" }, [
    h(
      "div",
      { class: "container-create-preview__notice" },
      buildContainerActionFailureMessage(actionLabel, snapshot),
    ),
    h(
      "div",
      { class: "container-create-preview__grid" },
      rows.map(([label, value]) =>
        h("div", { class: "container-create-preview__row" }, [
          h("span", { class: "container-create-preview__label" }, String(label)),
          h("span", { class: "container-create-preview__value" }, String(value)),
        ]),
      ),
    ),
  ]);
};

const promptContainerActionFailure = async (
  row: ContainerItem,
  actionLabel: string,
  snapshot: ReturnType<typeof readContainerActionSnapshot>,
) => {
  await ElMessageBox.confirm(
    createContainerStartupDiagnosticMessage(actionLabel, snapshot),
    t("container.notifications.startupDiagnosticsTitle"),
    {
      type: "error",
      confirmButtonText: t("container.notifications.viewLogs"),
      cancelButtonText: t("common.cancel"),
    },
  )
    .then(() => openLogs(row))
    .catch(() => undefined);
};

const normalizeBatchContainerActionItems = (data: any) =>
  normalizeList<any>(data?.items || data);

const buildBatchContainerResultLine = (
  item: any,
  actionLabel: string,
  currentRows?: ContainerItem[],
) => {
  const id = item?.id || item?.ID || item?.name || item?.Name || "--";
  const row = currentRows?.find((entry) => entry.ID === id);
  const name = row?.Names || id;
  const snapshot = readContainerActionSnapshot(item);
  const failed =
    item?.success === false || snapshot.stateFailed || Boolean(item?.error);

  if (failed) {
    return `${name}: ${buildContainerActionFailureMessage(actionLabel, snapshot)}`;
  }

  if (snapshot.running) {
    return `${name}: ${t("container.notifications.actionSuccess", undefined, {
      action: actionLabel,
    })}`;
  }

  if (isContainerPendingState(snapshot.state)) {
    return `${name}: ${t("container.notifications.actionStateTimeout", undefined, {
      action: actionLabel,
    })}`;
  }

  return `${name}: ${formatContainerStateLabel(snapshot.state)}`;
};

const confirmBatchContainerActionStates = async (
  items: any[],
  action: Extract<ContainerAction, "start" | "restart">,
) => {
  const candidates = items.filter((item) => {
    const snapshot = readContainerActionSnapshot(item);
    return !snapshot.stateFailed && !snapshot.running && isContainerPendingState(snapshot.state);
  });

  if (!candidates.length) return items;

  const resultMap = new Map<string, any>();
  items.forEach((item) => {
    const id = item?.id || item?.ID;
    if (id) resultMap.set(id, item);
  });

  await Promise.all(
    candidates.map(async (item) => {
      const id = item?.id || item?.ID;
      if (!id) return;
      const result = await waitContainerStartup(
        id,
        action,
        readContainerActionSnapshot(item),
      );
      const previous = resultMap.get(id) || item;
      const mergedSnapshot = result.snapshot
        ? {
            ...previous,
            status: result.snapshot.state || previous?.status,
            running: result.snapshot.running,
            paused: result.snapshot.paused,
            exitCode: result.snapshot.exitCode,
            stateFailed: result.snapshot.stateFailed,
            stateCode: result.snapshot.stateCode,
            stateMessage: result.snapshot.stateMessage,
          }
        : previous;
      resultMap.set(id, {
        ...mergedSnapshot,
        success: result.success,
        timeout: result.timeout,
        canceled: result.canceled,
      });
    }),
  );

  return items.map((item) => {
    const id = item?.id || item?.ID;
    return (id && resultMap.get(id)) || item;
  });
};

const waitContainerStartup = async (
  id: string,
  action: Extract<ContainerAction, "start" | "restart">,
  initialSnapshot?: ReturnType<typeof readContainerActionSnapshot>,
) => {
  const deadline = Date.now() + 30_000;
  const token = Symbol(`${id}:${action}`);
  containerActionPollTokens.set(id, token);
  const requiredStableChecks = action === "restart" ? 2 : 1;
  let stableRunningChecks = 0;

  const ensureActive = () => containerActionPollTokens.get(id) === token;

  try {
    if (initialSnapshot?.stateFailed) {
      return { success: false, timeout: false, snapshot: initialSnapshot };
    }

    if (isContainerPendingState(initialSnapshot?.state || "")) {
      await sleep(1500);
    }

    while (Date.now() < deadline) {
      if (!ensureActive()) {
        return { success: false, timeout: true, canceled: true, snapshot: initialSnapshot };
      }
      const { data } = await Api.getContainerDetail(id);
      if (!ensureActive()) {
        return { success: false, timeout: true, canceled: true, snapshot: initialSnapshot };
      }
      const snapshot = readContainerActionSnapshot(data);

      if (snapshot.stateFailed) {
        return { success: false, timeout: false, snapshot };
      }

      if (snapshot.running) {
        stableRunningChecks += 1;
        if (stableRunningChecks >= requiredStableChecks) {
          return { success: true, timeout: false, snapshot };
        }
      } else {
        stableRunningChecks = 0;
      }

      await sleep(1500);
    }

    return { success: false, timeout: true, snapshot: initialSnapshot };
  } finally {
    if (ensureActive()) containerActionPollTokens.delete(id);
  }
};

const runContainerAction = async (
  row: ContainerItem,
  action: ContainerAction,
) => {
  const actionLabels: Record<string, string> = {
    start: t("container.start"),
    stop: t("container.stop"),
    restart: t("container.restart"),
    pause: t("container.pause"),
    unpause: t("container.resume"),
    kill: t("container.forceStop"),
    rm: t("container.delete"),
  };
  const dangerous = ["kill", "rm"].includes(action);
  await ElMessageBox.confirm(
    t("container.confirmations.containerActionMessage", undefined, {
      action: actionLabels[action],
      name: row.Names || shortId(row.ID),
      warning: dangerous
        ? t("container.confirmations.containerActionWarning")
        : "",
    }),
    t("container.confirmations.containerActionTitle", undefined, {
      action: actionLabels[action],
    }),
    {
      type: dangerous ? "warning" : "info",
      confirmButtonText: actionLabels[action],
      cancelButtonText: t("common.cancel"),
    },
  );
  actionLoading.value = `${row.ID}:${action}`;
  try {
    const { data } = await Api.runContainerAction(row.ID, {
      action,
      confirm: dangerous,
      force: action === "kill" || (action === "rm" && canForceAction.value),
    });

    if (action === "start" || action === "restart") {
      const initialSnapshot = readContainerActionSnapshot(data);
      if (initialSnapshot.stateFailed) {
        loadedTabs.containers = false;
        await loadActiveTab(true);
        await promptContainerActionFailure(row, actionLabels[action], initialSnapshot);
        return;
      }

      const result = await waitContainerStartup(row.ID, action, initialSnapshot);
      loadedTabs.containers = false;
      await loadActiveTab(true);

      if (result.success) {
        ElMessage.success(
          t("container.notifications.actionSuccess", undefined, {
            action: actionLabels[action],
          }),
        );
        return;
      }

      if (!result.canceled && !result.timeout && result.snapshot) {
        await promptContainerActionFailure(row, actionLabels[action], result.snapshot);
        return;
      }

      if (!result.canceled) {
        ElMessage.warning(
          t("container.notifications.actionStateTimeout", undefined, {
            action: actionLabels[action],
          }),
        );
      }
      return;
    }

    ElMessage.success(
      t("container.notifications.actionSuccess", undefined, {
        action: actionLabels[action],
      }),
    );
    loadedTabs.containers = false;
    await loadActiveTab(true);
  } catch (error: any) {
    if (action === "start" || action === "restart") {
      const failure = resolveContainerActionErrorPayload(error);
      const snapshot = readContainerActionSnapshot(failure.diagnostic);
      loadedTabs.containers = false;
      if (detailVisible.value && detailType.value === "container" && detailTarget.value?.ID === row.ID) {
        void openDetail("container", row).catch(() => undefined);
      }
      await loadActiveTab(true).catch(() => undefined);
      if (failure.status === 409) {
        await promptContainerActionFailure(row, actionLabels[action], snapshot);
        return;
      }
    }
    throw error;
  } finally {
    actionLoading.value = "";
  }
};

const showBatchResult = async (
  data: any,
  fallbackMessage: string,
  options: {
    actionLabel?: string;
    currentRows?: ContainerItem[];
  } = {},
) => {
  const items = normalizeBatchContainerActionItems(data);
  const lines = items.map((item) =>
    options.actionLabel
      ? buildBatchContainerResultLine(item, options.actionLabel, options.currentRows)
      : (() => {
          const id = item.id || item.ID || item.name || item.Name || "--";
          const error =
            item.error?.detail ||
            item.error?.message ||
            item.message ||
            t("common.operationFailed");
          return `${id}: ${error}`;
        })(),
  );
  const failed = items.filter((item) => {
    const snapshot = readContainerActionSnapshot(item);
    return item?.success === false || snapshot.stateFailed || item?.error;
  });
  const pending = items.filter((item) => {
    const snapshot = readContainerActionSnapshot(item);
    return !snapshot.stateFailed && !snapshot.running && isContainerPendingState(snapshot.state);
  });
  if (!items.length || (!failed.length && !pending.length)) {
    ElMessage.success(fallbackMessage);
    return;
  }
  const message = h("div", { class: "batch-result" }, [
    h(
      "p",
      t("container.confirmations.batchSummary", undefined, {
        success: items.length - failed.length - pending.length,
        failed: failed.length + pending.length,
      }),
    ),
    h("pre", lines.join("\n")),
  ]);
  await ElMessageBox.alert(
    message,
    t("container.confirmations.batchResultTitle"),
    {
      confirmButtonText: t("container.confirmations.understood"),
      customClass: "container-batch-result-message-box",
    },
  );
};

const runBatchContainerAction = async (action: ContainerAction) => {
  if (!selectedContainers.value.length) return;
  const actionLabels: Record<ContainerAction, string> = {
    start: t("container.start"),
    stop: t("container.stop"),
    restart: t("container.restart"),
    pause: t("container.pause"),
    unpause: t("container.resume"),
    kill: t("container.forceStop"),
    rm: t("container.delete"),
  };
  const dangerous = ["kill", "rm"].includes(action);
  await ElMessageBox.confirm(
    t("container.confirmations.batchActionMessage", undefined, {
      action: actionLabels[action],
      count: selectedContainers.value.length,
      warning: dangerous ? t("container.confirmations.batchRiskWarning") : "",
    }),
    t("container.confirmations.batchActionTitle", undefined, {
      action: actionLabels[action],
    }),
    {
      type: dangerous ? "warning" : "info",
      confirmButtonText: t(
        "container.confirmations.batchActionTitle",
        undefined,
        { action: actionLabels[action] },
      ),
      cancelButtonText: t("common.cancel"),
    },
  );
  actionLoading.value = `batch:${action}`;
  let shouldResetLoading = true;
  try {
    const { data } = await Api.batchRunContainerAction({
      ids: selectedContainers.value.map((item) => item.ID),
      action,
      confirm: dangerous,
      force: action === "kill" || (action === "rm" && canForceAction.value),
    });
    const batchItems =
      action === "start" || action === "restart"
        ? await confirmBatchContainerActionStates(
            normalizeBatchContainerActionItems(data),
            action,
          )
        : normalizeBatchContainerActionItems(data);
    await showBatchResult(
      { ...(data || {}), items: batchItems },
      t("container.confirmations.batchActionCompleted", undefined, {
        action: actionLabels[action],
      }),
      {
        actionLabel: actionLabels[action],
        currentRows: selectedContainers.value,
      },
    );
    actionLoading.value = "";
    shouldResetLoading = false;
    loadedTabs.containers = false;
    await loadActiveTab(true);
  } finally {
    if (shouldResetLoading) actionLoading.value = "";
  }
};

const cleanupStoppedContainers = async () => {
  await ElMessageBox.confirm(
    t("container.confirmations.cleanupStoppedNotice"),
    t("container.cleanupStopped"),
    {
      type: "warning",
      confirmButtonText: t("container.confirmations.confirmCleanup"),
      cancelButtonText: t("common.cancel"),
    },
  );
  actionLoading.value = "cleanup:containers";
  try {
    await Api.cleanupContainers();
    ElMessage.success(t("container.notifications.stoppedContainersCleaned"));
    loadedTabs.containers = false;
    await loadActiveTab(true);
  } finally {
    actionLoading.value = "";
  }
};

const openLogs = async (row: ContainerItem) => {
  logTarget.value = {
    kind: "container",
    id: row.ID,
    name: row.Names || shortId(row.ID),
    canDownload: true,
  };
  logsText.value = "";
  logsVisible.value = true;
  await loadLogs();
};

const openTerminal = (row: ContainerItem) => {
  terminalDrawer.target = row;
  terminalDrawer.show = true;
};

const normalizeContainerLogTail = () => {
  const normalizedTail = [100, 200, 500, 1000, 10000].includes(
    Number(logTail.value),
  )
    ? Number(logTail.value)
    : 100;
  logTail.value = normalizedTail;
  return normalizedTail;
};

const toContainerLogTimestamp = (value?: Date) => {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) return undefined;
  return value.toISOString();
};

const buildContainerLogFilters = () => {
  const normalizedTail = normalizeContainerLogTail();
  const isCustomRange = logTimeFilter.value === "custom";
  const since = isCustomRange
    ? toContainerLogTimestamp(logCustomRange.value[0])
    : logTimeFilter.value === "all"
      ? undefined
      : logTimeFilter.value;
  const until = isCustomRange
    ? toContainerLogTimestamp(logCustomRange.value[1])
    : undefined;
  return {
    tail: normalizedTail,
    since,
    until,
    timestamps: logTimestamps.value,
  };
};

const buildContainerLogQuery = () => {
  return {
    ...buildContainerLogFilters(),
    follow: false,
  };
};

const loadLogs = async (target = logTarget.value) => {
  if (!target?.id) return;
  logsLoading.value = true;
  try {
    if (target.kind === "compose") {
      const { data } = await Api.getContainerComposeLogs(target.id, {
        tail: normalizeContainerLogTail(),
        timestamps: logTimestamps.value,
        follow: false,
      });
      logsText.value = data?.logs || data?.content || "";
      return;
    }
    const { data } = await Api.getContainerLogs(target.id, buildContainerLogQuery());
    logsText.value = data?.logs || "";
  } finally {
    logsLoading.value = false;
  }
};

const downloadLogs = async (target = logTarget.value) => {
  if (!target?.id || logDownloading.value) return;
  if (target.kind === "compose") {
    ElMessage.info(t("container.notifications.composeLogDownloadUnsupported"));
    return;
  }
  logDownloading.value = true;
  try {
    await Api.downloadContainerLogs(
      target.id,
      buildContainerLogFilters(),
      `${target.name || target.id}-container.log`,
    );
    ElMessage.success(t("container.notifications.logDownloadStarted"));
  } catch (error: any) {
    // ElMessage.error(
    //   error?.message || t("container.notifications.logDownloadFailed"),
    // );
  } finally {
    logDownloading.value = false;
  }
};

const clearStatsTimer = () => {
  if (!statsTimer) return;
  clearInterval(statsTimer);
  statsTimer = undefined;
};

const loadContainerStats = async (id: string) => {
  const { data } = await Api.getContainerStats(id);
  detailStats.value = data || null;
};

const openDetail = async (type: DetailType, row: any) => {
  clearStatsTimer();
  detailType.value = type;
  detailTarget.value = row;
  detailData.value = null;
  detailStats.value = null;
  detailVisible.value = true;
  detailLoading.value = true;
  try {
    const id = row.ID || row.Id || row.id || row.Name || row.name;
    if (type === "container") {
      const { data } = await Api.getContainerDetail(id);
      detailData.value = data || {};
      await loadContainerStats(id).catch((error) =>
        console.warn("加载容器资源统计失败", error),
      );
      statsTimer = setInterval(() => {
        void loadContainerStats(id).catch((error) =>
          console.warn("刷新容器资源统计失败", error),
        );
      }, 5000);
    }
    if (type === "image") {
      const { data } = await Api.getContainerImage(id);
      detailData.value = data || {};
    }
    if (type === "network") {
      const { data } = await Api.getContainerNetwork(id);
      detailData.value = data || {};
    }
    if (type === "volume") {
      const { data } = await Api.getContainerVolume(id);
      detailData.value = data || {};
    }
  } finally {
    detailLoading.value = false;
  }
};

const handleDetailClose = () => {
  clearStatsTimer();
  detailVisible.value = false;
};

const deleteImage = async (row: ImageItem) => {
  await ElMessageBox.confirm(
    t("container.confirmations.deleteImageMessage", undefined, {
      name: imageReference(row),
    }),
    t("container.confirmations.deleteImageTitle"),
    {
      type: "warning",
      confirmButtonText: t("common.delete"),
      cancelButtonText: t("common.cancel"),
    },
  );
  actionLoading.value = row.ID;
  try {
    await Api.deleteContainerImage(row.ID);
    ElMessage.success(t("container.notifications.imageDeleted"));
    loadedTabs.images = false;
    await loadActiveTab(true);
  } finally {
    actionLoading.value = "";
  }
};

const deleteNetwork = async (row: NetworkItem) => {
  await ElMessageBox.confirm(
    t("container.confirmations.deleteNetworkMessage", undefined, {
      name: row.Name,
    }),
    t("container.confirmations.deleteNetworkTitle"),
    {
      type: "warning",
      confirmButtonText: t("common.delete"),
      cancelButtonText: t("common.cancel"),
    },
  );
  actionLoading.value = row.ID;
  try {
    await Api.deleteContainerNetwork(row.ID);
    ElMessage.success(t("container.notifications.networkDeleted"));
    loadedTabs.networks = false;
    await loadActiveTab(true);
  } finally {
    actionLoading.value = "";
  }
};

const deleteVolume = async (row: VolumeItem) => {
  await ElMessageBox.confirm(
    t("container.confirmations.deleteVolumeMessage", undefined, {
      name: row.Name,
    }),
    t("container.confirmations.deleteVolumeTitle"),
    {
      type: "warning",
      confirmButtonText: t("common.delete"),
      cancelButtonText: t("common.cancel"),
    },
  );
  actionLoading.value = row.Name;
  try {
    await Api.deleteContainerVolume(row.Name);
    ElMessage.success(t("container.notifications.volumeDeleted"));
    loadedTabs.volumes = false;
    await loadActiveTab(true);
  } finally {
    actionLoading.value = "";
  }
};

const batchDeleteNetworks = async () => {
  if (!selectedNetworks.value.length) return;
  await ElMessageBox.confirm(
    t("container.confirmations.batchDeleteNetworkMessage", undefined, {
      count: selectedNetworks.value.length,
    }),
    t("container.confirmations.batchDeleteNetworkTitle"),
    {
      type: "warning",
      confirmButtonText: t("container.batchDelete"),
      cancelButtonText: t("common.cancel"),
    },
  );
  actionLoading.value = "batch:networks";
  try {
    const { data } = await Api.batchDeleteContainerNetworks(
      selectedNetworks.value.map((item) => item.ID || item.Name),
    );
    await showBatchResult(
      data,
      t("container.confirmations.networkBatchDeleted"),
    );
    loadedTabs.networks = false;
    await loadActiveTab(true);
  } finally {
    actionLoading.value = "";
  }
};

const batchDeleteVolumes = async () => {
  if (!selectedVolumes.value.length) return;
  await ElMessageBox.confirm(
    t("container.confirmations.batchDeleteVolumeMessage", undefined, {
      count: selectedVolumes.value.length,
    }),
    t("container.confirmations.batchDeleteVolumeTitle"),
    {
      type: "warning",
      confirmButtonText: t("container.batchDelete"),
      cancelButtonText: t("common.cancel"),
    },
  );
  actionLoading.value = "batch:volumes";
  try {
    const { data } = await Api.batchDeleteContainerVolumes(
      selectedVolumes.value.map((item) => item.Name),
    );
    await showBatchResult(
      data,
      t("container.confirmations.volumeBatchDeleted"),
    );
    loadedTabs.volumes = false;
    await loadActiveTab(true);
  } finally {
    actionLoading.value = "";
  }
};

const pruneNetworks = async () => {
  await ElMessageBox.confirm(
    t("container.confirmations.cleanupNetworkNotice"),
    t("container.cleanupUnusedNetworks"),
    {
      type: "warning",
      confirmButtonText: t("container.confirmations.confirmCleanup"),
      cancelButtonText: t("common.cancel"),
    },
  );
  actionLoading.value = "prune:networks";
  try {
    await Api.pruneContainerNetworks();
    ElMessage.success(t("container.notifications.unusedNetworksCleaned"));
    loadedTabs.networks = false;
    await loadActiveTab(true);
  } finally {
    actionLoading.value = "";
  }
};

const pruneVolumes = async () => {
  await ElMessageBox.confirm(
    t("container.confirmations.cleanupVolumeNotice"),
    t("container.cleanupUnusedVolumes"),
    {
      type: "warning",
      confirmButtonText: t("container.confirmations.confirmCleanup"),
      cancelButtonText: t("common.cancel"),
    },
  );
  actionLoading.value = "prune:volumes";
  try {
    await Api.pruneContainerVolumes();
    ElMessage.success(t("container.notifications.unusedVolumesCleaned"));
    loadedTabs.volumes = false;
    await loadActiveTab(true);
  } finally {
    actionLoading.value = "";
  }
};

const handleImportFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0] || null;
  if (dialogType.value === "compose-create") {
    composeForm.sourceFileName = file?.name || "";
    if (file) {
      composeForm.content = await file.text();
    }
    return;
  }
  importFile.value = file;
};

const handleContainerSelectionChange = (rows: ContainerItem[]) => {
  selectedContainers.value = rows;
};

const handleNetworkSelectionChange = (rows: NetworkItem[]) => {
  selectedNetworks.value = rows;
};

const handleVolumeSelectionChange = (rows: VolumeItem[]) => {
  selectedVolumes.value = rows;
};

const pickReconnectTargetNetwork = async (row: ContainerItem) => {
  await ensureNetworksLoaded();
  const { data } = await Api.getContainerDetail(row.ID).catch(() => ({ data: null }));
  const expectedNetwork =
    String(
      data?.HostConfig?.NetworkMode ||
      row.NetworkMode ||
      "",
    ).trim();
  const connectedNetworks = Object.keys(data?.NetworkSettings?.Networks || {});
  const defaultNetwork =
    isCustomDockerNetworkMode(expectedNetwork)
      ? expectedNetwork
      : connectedNetworks[0] || networks.value[0]?.Name || "";
  const selected = ref(defaultNetwork);
  await ElMessageBox.confirm(
    h("div", { class: "container-create-preview" }, [
      h("div", { class: "container-create-preview__notice" }, t("container.confirmations.containerNetworkDialogNotice")),
      h(
        "div",
        { class: "container-network-picker" },
        [
          h("label", { class: "container-network-picker__label" }, t("container.confirmations.containerNetworkDialogLabel")),
          h(
            ElSelect,
            {
              modelValue: selected.value,
              "onUpdate:modelValue": (value: string) => {
                selected.value = value;
              },
              placeholder: t("container.confirmations.containerNetworkDialogLabel"),
              style: "width:100%;",
              filterable: true,
            },
            () =>
              networks.value.map((network) =>
                h(ElOption, {
                  key: network.ID || network.Name,
                  label: network.Name,
                  value: network.Name,
                }),
              ),
          ),
        ],
      ),
    ]),
    isCustomDockerNetworkMode(expectedNetwork)
      ? t("container.confirmations.containerNetworkReconnectTitle")
      : t("container.confirmations.containerNetworkConnectTitle"),
    {
      type: "warning",
      confirmButtonText: isCustomDockerNetworkMode(expectedNetwork)
        ? t("container.reconnectNetwork")
        : t("container.connectNetwork"),
      cancelButtonText: t("common.cancel"),
    },
  );
  if (!selected.value) {
    throw new Error(t("container.validation.networkRequired"));
  }
  return {
    network: selected.value,
    action: isCustomDockerNetworkMode(expectedNetwork) ? "reconnect" as const : "connect" as const,
  };
};

const reconnectContainerNetwork = async (row: ContainerItem) => {
  const selection = await pickReconnectTargetNetwork(row);
  const result = await Api.runContainerNetworkAction(row.ID, {
    action: selection.action,
    network: selection.network,
    confirm: selection.action !== "connect",
  });
  openContainerTask(
    result,
    {
      operation: `network.${selection.action}`,
      name: row.Names || row.ID,
      containerId: row.ID,
      network: selection.network,
    },
    "containers",
  );
  ElMessage.success(t("container.notifications.containerNetworkTaskCreated"));
};

const exportImage = async (row: ImageItem) => {
  actionLoading.value = `export:${row.ID}`;
  try {
    await Api.exportContainerImage(
      row.ID,
      `${imageReference(row).replace(/[/:]/g, "_")}.tar`,
    );
  } finally {
    actionLoading.value = "";
  }
};

const pruneImages = async (type: "images" | "build-cache") => {
  const label =
    type === "images"
      ? t("container.cleanupImages")
      : t("container.cleanupBuildCache");
  await ElMessageBox.confirm(
    t("container.confirmations.pruneNotice", undefined, { action: label }),
    t("container.confirmations.previewTitle", undefined, { action: label }),
    {
      type: "warning",
      confirmButtonText: label,
      cancelButtonText: t("common.cancel"),
    },
  );
  actionLoading.value = `prune:${type}`;
  try {
    if (type === "images") await Api.pruneContainerImages();
    else await Api.pruneContainerBuildCache();
    ElMessage.success(
      t("container.notifications.cleanupCompleted", undefined, {
        action: label,
      }),
    );
    loadedTabs.images = false;
    await loadActiveTab(true);
  } finally {
    actionLoading.value = "";
  }
};

const deleteRegistry = async (row: RegistryItem) => {
  await ElMessageBox.confirm(
    t("container.confirmations.deleteRegistryMessage", undefined, {
      name: row.name,
    }),
    t("container.confirmations.deleteRegistryTitle"),
    {
      type: "warning",
      confirmButtonText: t("common.delete"),
      cancelButtonText: t("common.cancel"),
    },
  );
  actionLoading.value = `registry:${row.id}`;
  try {
    await Api.deleteContainerRegistry(row.id);
    ElMessage.success(t("container.notifications.registryDeleted"));
    loadedTabs.registries = false;
    await loadActiveTab(true);
  } finally {
    actionLoading.value = "";
  }
};

const testRegistry = async (row: RegistryItem) => {
  actionLoading.value = `registry-test:${row.id}`;
  try {
    await Api.testContainerRegistry(row.id);
    ElMessage.success(t("container.notifications.registryConnectionOk"));
    loadedTabs.registries = false;
    await loadActiveTab(true);
  } finally {
    actionLoading.value = "";
  }
};

const deleteTemplate = async (row: TemplateItem) => {
  if (!row.id) return;
  await ElMessageBox.confirm(
    t("container.confirmations.deleteTemplateMessage", undefined, {
      name: row.name,
    }),
    t("container.confirmations.deleteTemplateTitle"),
    {
    type: "warning",
      confirmButtonText: t("common.delete"),
      cancelButtonText: t("common.cancel"),
    },
  );
  actionLoading.value = `template:${row.id}`;
  try {
    await Api.deleteContainerTemplate(row.id);
    ElMessage.success(t("container.notifications.templateDeleted"));
    loadedTabs.templates = false;
    await loadActiveTab(true);
  } finally {
    actionLoading.value = "";
  }
};

const openComposeLogs = async (row: ComposeProjectItem) => {
  const name = composeProjectName(row);
  if (!name) return;
  logTarget.value = {
    kind: "compose",
    id: name,
    name,
    canDownload: false,
  };
  logsText.value = "";
  logsVisible.value = true;
  await loadLogs();
};

const runComposeAction = async (
  row: ComposeProjectItem,
  action: "start" | "stop" | "restart" | "update" | "delete",
) => {
  const name = composeProjectName(row);
  if (!name) return;

  actionLoading.value = `compose:${name}:${action}`;
  try {
    if (action === "update" || action === "delete") {
      composeForm.name = name;
      composeForm.removeVolumes = false;
      const { request, fingerprint } = await previewAndConfirmComposeAction(action);
      const result = await Api.runContainerComposeAction(name, {
        action,
        previewFingerprint: fingerprint,
        confirm: true,
        removeVolumes: request.removeVolumes,
      });
      openContainerTask(
        result,
        { ...request, operation: `compose.${action}` },
        "compose",
      );
      ElMessage.success(t("container.notifications.composeTaskCreated"));
      return;
    }

    const result = await Api.runContainerComposeAction(name, { action });
    openContainerTask(
      result,
      { name, operation: `compose.${action}` },
      "compose",
    );
    ElMessage.success(
      t("container.notifications.composeTaskCreated"),
    );
  } catch (error) {
    throw error;
  } finally {
    actionLoading.value = "";
  }
};

const saveDockerConfig = async () => {
  let parsed: Record<string, any>;
  try {
    parsed = JSON.parse(configForm.raw || "{}");
  } catch {
    ElMessage.error(t("container.notifications.dockerConfigObjectRequired"));
    return;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    ElMessage.error(t("container.notifications.dockerConfigObjectRequired"));
    return;
  }
  await ElMessageBox.confirm(
    t("container.confirmations.saveConfigNotice", undefined, {
      path: dockerConfig.value?.configPath || "daemon.json",
    }),
    t("container.confirmations.saveConfigTitle"),
    {
      type: "warning",
      confirmButtonText: t("container.confirmations.confirmSave"),
      cancelButtonText: t("common.cancel"),
    },
  );
  actionLoading.value = "config:save";
  try {
    await Api.saveContainerConfig({ raw: JSON.stringify(parsed, null, 2) });
    ElMessage.success(t("container.notifications.dockerConfigSaved"));
    loadedTabs.config = false;
    await loadActiveTab(true);
  } finally {
    actionLoading.value = "";
  }
};

const runRuntimeAction = async (action: "stop" | "restart") => {
  const label =
    action === "restart"
      ? t("container.confirmations.restartService")
      : t("container.confirmations.stopService");
  await ElMessageBox.confirm(
    t("container.confirmations.runtimeActionNotice", undefined, {
      action: label,
    }),
    t("container.confirmations.previewTitle", undefined, { action: label }),
    {
      type: "warning",
      confirmButtonText: label,
      cancelButtonText: t("common.cancel"),
    },
  );
  actionLoading.value = `runtime:${action}`;
  try {
    await Api.runContainerRuntimeAction({ action, confirm: true });
    ElMessage.success(
      t("container.notifications.runtimeActionExecuted", undefined, {
        action: label,
      }),
    );
    await refreshAll();
  } finally {
    actionLoading.value = "";
  }
};

const handleTabChange = () => {
  void loadActiveTab();
};

const resetCurrentList = () => {
  if (!hasPagination.value) return;
  activeListState.value.page = 1;
  loadedTabs[activeTab.value] = false;
  void loadActiveTab(true);
};

const handlePageChange = (page: number) => {
  if (!hasPagination.value) return;
  activeListState.value.page = page;
  loadedTabs[activeTab.value] = false;
  void loadActiveTab(true);
};

const handlePageSizeChange = (pageSize: number) => {
  if (!hasPagination.value) return;
  activeListState.value.pageSize = pageSize;
  activeListState.value.page = 1;
  loadedTabs[activeTab.value] = false;
  void loadActiveTab(true);
};

const refreshTaskAffectedLists = async () => {
  loadedTabs.containers = false;
  loadedTabs.images = false;
  loadedTabs.compose = false;
  loadedTabs.networks = false;
  const tasks: Promise<unknown>[] = [loadContainerSummary()];
  if (
    activeTab.value === "containers" ||
    activeTab.value === "images" ||
    activeTab.value === "compose" ||
    activeTab.value === "networks"
  ) {
    tasks.push(loadActiveTab(true));
  }
  await Promise.all(tasks);
};

watch(
  () => containerTaskStore.terminalRevision,
  () => {
    void refreshTaskAffectedLists();
  },
);

onMounted(async () => {
  await loadRuntime();
  await loadActiveTab();
  void containerTaskStore.loadActive();
});

onBeforeUnmount(() => {
  clearStatsTimer();
  containerActionPollTokens.clear();
});
</script>

<template>
  <div class="container-page">
    <section class="container-hero">
      <div>
        <h2>{{ t("container.title", "Containers") }}</h2>
        <p>
          {{
            t(
              "container.description",
              "Manage containers, images, networks, volumes, templates, and registries",
            )
          }}
        </p>
      </div>
      <div class="hero-actions">
        <el-button
          :icon="Refresh"
          :loading="runtimeLoading || listLoading"
          @click="refreshAll"
          >{{ t("common.refresh", "Refresh") }}</el-button
        >
        <el-button v-if="canReadContainerTask" @click="openTaskDrawer">
          {{ t("container.task.containerTask", "Container task")
          }}<span v-if="activeTaskCount">（{{ activeTaskCount }}）</span>
        </el-button>
        <div class="action-with-reason">
          <el-tooltip
            :content="createContainerDisabledReason"
            :disabled="!createContainerDisabledReason"
          >
            <span class="disabled-action-wrapper">
              <el-button
                type="primary"
                :icon="Plus"
                :disabled="!runtimeAvailable || !canCreateContainer"
                @click="openDialog('container')"
              >
                {{ t("container.createContainer", "Create container") }}
              </el-button>
            </span>
          </el-tooltip>
          <!-- <div
            v-if="createContainerDisabledReason"
            class="action-disabled-reason"
            role="note"
          >
            <el-icon><WarningFilled /></el-icon>
            <span>{{ createContainerDisabledReason }}</span>
          </div> -->
        </div>
      </div>
    </section>

    <el-alert
      v-if="!canRead"
      class="container-alert"
      :title="
        t(
          'container.noReadPermission',
          'The current account does not have container read permission',
        )
      "
      type="warning"
      show-icon
      :closable="false"
    />
    <el-alert
      v-else-if="runtime && !runtime.available"
      class="container-alert"
      :title="
        runtime.message ||
        t('container.dockerRuntimeUnavailable', 'Docker runtime unavailable')
      "
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
          <el-tab-pane
            :label="t('container.containers', 'Containers')"
            name="containers"
          />
          <el-tab-pane :label="t('container.images', 'Images')" name="images" />
          <el-tab-pane
            :label="t('container.networks', 'Networks')"
            name="networks"
          />
          <el-tab-pane
            :label="t('container.volumes', 'Volumes')"
            name="volumes"
          />
          <el-tab-pane
            :label="t('container.composeRuntime', 'Compose')"
            name="compose"
          />
          <el-tab-pane
            :label="t('container.templates', 'Templates')"
            name="templates"
          />
          <el-tab-pane
            :label="t('container.registries', 'Registries')"
            name="registries"
          />
          <el-tab-pane
            :label="t('container.dockerConfig', 'Docker config')"
            name="config"
          />
        </el-tabs>
        <div class="panel-actions">
          <el-button
            v-if="activeTab === 'containers'"
            class="cleanup-action-button"
            type="warning"
            plain
            :loading="actionLoading === 'cleanup:containers'"
            :disabled="!runtimeAvailable || !canCleanup"
            @click="cleanupStoppedContainers"
          >
            {{ t("container.cleanupStopped", "Clean stopped") }}
          </el-button>
          <el-button
            v-if="activeTab === 'images'"
            type="primary"
            :icon="Plus"
            :disabled="!runtimeAvailable || !canImageWrite"
            @click="openDialog('image')"
          >
            {{ t("container.pullImage", "Pull image") }}
          </el-button>
          <el-button
            v-if="activeTab === 'images'"
            :disabled="!runtimeAvailable || !canImageWrite"
            @click="openDialog('image-import')"
          >
            {{ t("container.import", "Import") }}
          </el-button>
          <el-button
            v-if="activeTab === 'images'"
            :disabled="!runtimeAvailable || !canImageWrite"
            @click="openDialog('image-build')"
          >
            {{ t("container.build", "Build") }}
          </el-button>
          <el-button
            v-if="activeTab === 'images'"
            type="warning"
            plain
            :loading="actionLoading === 'prune:images'"
            :disabled="!runtimeAvailable || !canCleanup"
            @click="pruneImages('images')"
          >
            {{ t("container.cleanupImages", "Clean images") }}
          </el-button>
          <el-button
            v-if="activeTab === 'images'"
            plain
            :loading="actionLoading === 'prune:build-cache'"
            :disabled="!runtimeAvailable || !canCleanup"
            @click="pruneImages('build-cache')"
          >
            {{ t("container.cleanupBuildCache", "Clean build cache") }}
          </el-button>
          <el-button
            v-if="activeTab === 'networks'"
            type="primary"
            :icon="Plus"
            :disabled="!runtimeAvailable || !canNetworkWrite"
            @click="openDialog('network')"
          >
            {{ t("container.createNetwork", "Create network") }}
          </el-button>
          <el-button
            v-if="activeTab === 'networks'"
            plain
            type="warning"
            :loading="actionLoading === 'prune:networks'"
            :disabled="!runtimeAvailable || !canCleanup"
            @click="pruneNetworks"
          >
            {{ t("container.cleanupUnusedNetworks", "Clean unused networks") }}
          </el-button>
          <el-button
            v-if="activeTab === 'volumes'"
            type="primary"
            :icon="Plus"
            :disabled="!runtimeAvailable || !canVolumeWrite"
            @click="openDialog('volume')"
          >
            {{ t("container.createVolume", "Create volume") }}
          </el-button>
          <el-button
            v-if="activeTab === 'volumes'"
            plain
            type="warning"
            :loading="actionLoading === 'prune:volumes'"
            :disabled="!runtimeAvailable || !canCleanup"
            @click="pruneVolumes"
          >
            {{ t("container.cleanupUnusedVolumes", "Clean unused volumes") }}
          </el-button>
          <el-button
            v-if="activeTab === 'compose'"
            type="primary"
            :icon="Plus"
            :disabled="!runtimeAvailable || !canComposeWrite"
            @click="openDialog('compose-create')"
          >
            {{ t("container.createCompose", "Create Compose") }}
          </el-button>
          <el-button
            v-if="activeTab === 'compose'"
            plain
            :loading="listLoading"
            @click="loadActiveTab(true)"
          >
            {{ t("common.refresh", "Refresh") }}
          </el-button>
          <el-button
            v-if="activeTab === 'templates'"
            type="primary"
            :icon="Plus"
            :disabled="
              !runtimeAvailable || !canComposeWrite || !templatesSupported
            "
            @click="openDialog('template')"
          >
            {{ t("container.createTemplate", "Create template") }}
          </el-button>
          <el-button
            v-if="activeTab === 'templates'"
            plain
            :disabled="
              !runtimeAvailable || !canComposeWrite || !templatesSupported
            "
            @click="openDialog('compose-template-deploy')"
          >
            {{ t("container.deployFromTemplate", "Deploy from template") }}
          </el-button>
          <div v-if="activeTab === 'registries'" class="action-with-reason">
            <el-tooltip
              :content="registryManageDisabledReason"
              :disabled="!registryManageDisabledReason"
            >
              <span class="disabled-action-wrapper">
                <el-button
                  type="primary"
                  :icon="Plus"
                  :disabled="!registryManageAvailable || !canRegistryWrite"
                  @click="openDialog('registry')"
                >
                  {{ t("container.addRegistry", "Add Registry") }}
                </el-button>
              </span>
            </el-tooltip>
            <div
              v-if="registryManageDisabledReason"
              class="action-disabled-reason"
              role="note"
            >
              <el-icon><WarningFilled /></el-icon>
              <span>{{ registryManageDisabledReason }}</span>
            </div>
          </div>
          <div v-if="activeTab === 'config'" class="action-with-reason">
            <el-tooltip
              :content="dockerConfigDisabledReason"
              :disabled="!dockerConfigDisabledReason"
            >
              <span class="disabled-action-wrapper">
                <el-button
                  type="primary"
                  :loading="actionLoading === 'config:save'"
                  :disabled="!dockerConfigAvailable || !canConfigWrite"
                  @click="saveDockerConfig"
                >
                  {{ t("container.saveConfig", "Save config") }}
                </el-button>
              </span>
            </el-tooltip>
            <div
              v-if="dockerConfigDisabledReason"
              class="action-disabled-reason"
              role="note"
            >
              <el-icon><WarningFilled /></el-icon>
              <span>{{ dockerConfigDisabledReason }}</span>
            </div>
          </div>
          <el-button
            v-if="activeTab === 'config'"
            type="warning"
            plain
            :loading="actionLoading === 'runtime:restart'"
            :disabled="!runtimeAvailable || !canConfigWrite"
            @click="runRuntimeAction('restart')"
          >
            {{ t("container.restartDocker", "Restart Docker") }}
          </el-button>
        </div>
      </div>

      <el-alert
        v-if="activeTab === 'registries'"
        class="container-alert container-alert--inline"
        :title="
          t(
            'container.registryCapabilityHint',
            'Registry configuration and connectivity testing do not depend on Docker CLI or the daemon. They remain available when permissions allow, even if Docker is not installed.',
          )
        "
        type="info"
        show-icon
        :closable="false"
      />

      <el-alert
        v-if="activeTab === 'config'"
        class="container-alert container-alert--inline"
        :title="
          t(
            'container.dockerConfigCapabilityHint',
            'Docker config read/write does not depend on Docker CLI or the daemon. Saving changes may still require restarting Docker later to take effect.',
          )
        "
        type="info"
        show-icon
        :closable="false"
      />

      <div v-if="hasPagination" class="table-toolbar">
        <div class="table-toolbar__filters">
          <el-input
            v-model.trim="activeListState.search"
            clearable
            :placeholder="
              activeTab === 'containers'
                ? t(
                    'container.searchPlaceholders.containers',
                    'Enter container name or image',
                  )
                : activeTab === 'images'
                  ? t(
                      'container.searchPlaceholders.images',
                      'Enter image ID, repository, or tag',
                    )
                  : activeTab === 'networks'
                    ? t(
                        'container.searchPlaceholders.networks',
                        'Enter network name, driver, or subnet',
                      )
                    : activeTab === 'volumes'
                      ? t(
                          'container.searchPlaceholders.volumes',
                          'Enter volume name, driver, or mount point',
                        )
                      : t(
                          'container.searchPlaceholders.registries',
                          'Enter Registry name or address',
                        )
            "
            @clear="resetCurrentList"
            @keyup.enter="resetCurrentList"
          />
          <el-select
            v-if="activeTab === 'containers'"
            v-model="listState.containers.status"
            class="status-filter"
            :placeholder="
              t('container.statusFilterPlaceholder', 'Select status')
            "
            @change="resetCurrentList"
          >
            <el-option
              :label="t('container.statusOptions.all', 'All')"
              value=""
            />
            <el-option
              :label="t('container.statusOptions.created', 'Created')"
              value="created"
            />
            <el-option
              :label="t('container.statusOptions.up', 'Running')"
              value="up"
            />
            <el-option
              :label="t('container.statusOptions.exited', 'Exited')"
              value="exited"
            />
            <el-option
              :label="t('container.statusOptions.restarting', 'Restarting')"
              value="restarting"
            />
            <el-option
              :label="t('container.statusOptions.paused', 'Paused')"
              value="paused"
            />
            <el-option
              :label="t('container.statusOptions.removing', 'Removing')"
              value="removing"
            />
            <el-option
              :label="t('container.statusOptions.dead', 'Dead')"
              value="dead"
            />
          </el-select>
          <el-button :loading="listLoading" @click="resetCurrentList">{{
            t("common.query", "Query")
          }}</el-button>
        </div>
        <div class="table-toolbar__batch">
          <template v-if="activeTab === 'containers'">
            <span v-if="selectedContainers.length">{{
              t("container.selectedContainers", "{count} containers selected", {
                count: selectedContainers.length,
              })
            }}</span>
            <el-dropdown
              :disabled="
                !selectedContainers.length || !runtimeAvailable || !canWrite
              "
              popper-class="table-action-popper"
              @command="
                (command: ContainerAction) => runBatchContainerAction(command)
              "
            >
              <el-button :loading="actionLoading.startsWith('batch:')">
                {{ t("container.batchActions", "Batch actions") }}
              </el-button>
              <template #dropdown>
                <el-dropdown-menu class="table-action-menu">
                  <el-dropdown-item command="start">{{
                    t("container.start", "Start")
                  }}</el-dropdown-item>
                  <el-dropdown-item command="stop">{{
                    t("container.stop", "Stop")
                  }}</el-dropdown-item>
                  <el-dropdown-item command="restart">{{
                    t("container.restart", "Restart")
                  }}</el-dropdown-item>
                  <el-dropdown-item command="pause">{{
                    t("container.pause", "Pause")
                  }}</el-dropdown-item>
                  <el-dropdown-item command="unpause">{{
                    t("container.resume", "Resume")
                  }}</el-dropdown-item>
                  <el-dropdown-item
                    command="kill"
                    :disabled="!canForceAction"
                    >{{
                      t("container.forceStop", "Force stop")
                    }}</el-dropdown-item
                  >
                  <el-dropdown-item
                    class="table-action-menu__danger"
                    command="rm"
                    :disabled="!canDelete"
                    divided
                    >{{ t("container.delete", "Delete") }}</el-dropdown-item
                  >
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template v-if="activeTab === 'networks'">
            <span v-if="selectedNetworks.length">{{
              t("container.selectedNetworks", "{count} networks selected", {
                count: selectedNetworks.length,
              })
            }}</span>
            <el-button
              :loading="actionLoading === 'batch:networks'"
              :disabled="
                !selectedNetworks.length ||
                !runtimeAvailable ||
                !canNetworkWrite
              "
              @click="batchDeleteNetworks"
            >
              {{ t("container.batchDelete", "Batch delete") }}
            </el-button>
          </template>
          <template v-if="activeTab === 'volumes'">
            <span v-if="selectedVolumes.length">{{
              t("container.selectedVolumes", "{count} volumes selected", {
                count: selectedVolumes.length,
              })
            }}</span>
            <el-button
              :loading="actionLoading === 'batch:volumes'"
              :disabled="
                !selectedVolumes.length || !runtimeAvailable || !canVolumeWrite
              "
              @click="batchDeleteVolumes"
            >
              {{ t("container.batchDelete", "Batch delete") }}
            </el-button>
          </template>
        </div>
      </div>

      <custom-table
        v-if="activeTab === 'containers'"
        v-loading="listLoading"
        :data="containers"
        :columns="containerColumns"
        :pagination="false"
        :auto-pagination="false"
        :row-key="getRowKey"
        :empty-text="t('container.empty.containers', 'No containers')"
        @selection-change="handleContainerSelectionChange"
      >
        <template #containerName="{ row }">
          <div class="primary-cell">
            <strong>{{ row.Names || shortId(row.ID) }}</strong>
            <span>{{ shortId(row.ID) }}</span>
          </div>
        </template>
        <template #containerStatus="{ row }">
          <div
            class="status-cell"
            :class="`is-${statusType(row.Status)}`"
            :title="row.Status || '--'"
          >
            <strong>{{ splitContainerStatus(row.Status).primary }}</strong>
            <span v-if="splitContainerStatus(row.Status).secondary">
              {{ splitContainerStatus(row.Status).secondary }}
            </span>
          </div>
        </template>
        <template #containerMounts="{ row }">
          <el-tooltip
            :disabled="!row.Mounts || row.Mounts.length <= 18"
            :content="row.Mounts || '--'"
            placement="top"
          >
            <span class="table-ellipsis-cell">{{ row.Mounts || "--" }}</span>
          </el-tooltip>
        </template>
        <template #containerNetworks="{ row }">
          <el-tooltip
            :disabled="containerNetworkDisplay(row).length <= 20"
            :content="row.NetworkHealthMessage || containerNetworkDisplay(row)"
            placement="top"
          >
            <span
              class="table-ellipsis-cell"
              :class="{ 'is-network-warning': row.NetworkHealth === 'unhealthy' }"
            >
              {{ containerNetworkDisplay(row) }}
            </span>
          </el-tooltip>
        </template>
        <template #containerAction="{ row }">
          <div class="row-actions table-row-actions">
            <el-button
              link
              type="primary"
              :icon="Document"
              @click="openDetail('container', row)"
            >
              {{ t("container.detail", "Details") }}
            </el-button>
            <el-button
              link
              type="primary"
              :icon="Document"
              :disabled="!canReadLogs"
              @click="openLogs(row)"
            >
              {{ t("container.logs", "Logs") }}
            </el-button>
            <el-button
              link
              type="primary"
              :icon="Monitor"
              :disabled="!canOpenContainerTerminal(row)"
              @click="openTerminal(row)"
            >
              {{ t("container.terminal.entry", "Terminal") }}
            </el-button>
            <el-button
              link
              type="warning"
              :icon="Connection"
              :disabled="!runtimeAvailable || !canNetworkWrite"
              @click="reconnectContainerNetwork(row)"
            >
              {{
                isCustomDockerNetworkMode(row.NetworkMode)
                  ? t("container.reconnectNetwork", "Reconnect network")
                  : t("container.connectNetwork", "Connect network")
              }}
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
              {{ t("container.start", "Start") }}
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
              {{ t("container.stop", "Stop") }}
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
              {{ t("container.pause", "Pause") }}
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
              {{ t("container.resume", "Resume") }}
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
              {{ t("container.restart", "Restart") }}
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
              {{ t("container.delete", "Delete") }}
            </el-button>
          </div>
        </template>
      </custom-table>

      <custom-table
        v-if="activeTab === 'images'"
        v-loading="listLoading"
        :data="images"
        :columns="imageColumns"
        :pagination="false"
        :auto-pagination="false"
        :row-key="getRowKey"
        :empty-text="t('container.empty.images', 'No images')"
      >
        <template #imageName="{ row }">
          <div class="primary-cell">
            <strong>{{ imageReference(row) }}</strong>
            <span>{{ shortId(row.ID) }}</span>
          </div>
        </template>
        <template #imageStatus="{ row }">
          <el-tag :type="row.used ? 'success' : 'info'" effect="light">{{
            row.used
              ? t("container.used", "Used")
              : t("container.unused", "Unused")
          }}</el-tag>
        </template>
        <template #imageAction="{ row }">
          <div class="row-actions table-row-actions">
            <el-button
              link
              type="primary"
              :icon="Document"
              @click="openDetail('image', row)"
              >{{ t("container.detail", "Details") }}</el-button
            >
            <el-button
              link
              type="primary"
              :icon="CollectionTag"
              :disabled="!runtimeAvailable || !canImageWrite"
              @click="openDialog('image-tag', row)"
              >{{ t("container.tag", "Tag") }}</el-button
            >
            <el-button
              link
              type="primary"
              :icon="Upload"
              :disabled="!runtimeAvailable || !canImageWrite"
              @click="openDialog('image-push', row)"
              >{{ t("container.push", "Push") }}</el-button
            >
            <el-button
              link
              type="primary"
              :icon="Download"
              :loading="actionLoading === `export:${row.ID}`"
              :disabled="!runtimeAvailable"
              @click="exportImage(row)"
            >
              {{ t("container.export", "Export") }}
            </el-button>
            <el-button
              link
              type="danger"
              :icon="Delete"
              :loading="actionLoading === row.ID"
              :disabled="!runtimeAvailable || !canDelete"
              @click="deleteImage(row)"
            >
              {{ t("container.delete", "Delete") }}
            </el-button>
          </div>
        </template>
      </custom-table>

      <custom-table
        v-if="activeTab === 'networks'"
        v-loading="listLoading"
        :data="networks"
        :columns="networkColumns"
        :pagination="false"
        :auto-pagination="false"
        :row-key="getRowKey"
        :empty-text="t('container.empty.networks', 'No networks')"
        @selection-change="handleNetworkSelectionChange"
      >
        <template #networkId="{ row }">{{ shortId(row.ID) }}</template>
        <template #networkHealth="{ row }">
          <el-tooltip
            :content="row.healthMessage || row.healthCode || '--'"
            placement="top"
          >
            <el-tag :type="networkHealthTagType(row.health)" effect="light">
              {{
                t(
                  `container.networkHealthState.${row.health || "unknown"}`,
                  row.health || "unknown",
                )
              }}
            </el-tag>
          </el-tooltip>
        </template>
        <template #ipv6="{ row }">
          <el-tag :type="row.EnableIPv6 ? 'success' : 'info'" effect="light">{{
            row.EnableIPv6
              ? t("container.enabledShort", "Enabled")
              : t("container.closed", "Off")
          }}</el-tag>
        </template>
        <template #networkAction="{ row }">
          <div class="row-actions table-row-actions">
            <el-button
              link
              type="primary"
              :icon="Document"
              @click="openDetail('network', row)"
              >{{ t("container.detail", "Details") }}</el-button
            >
            <el-button
              link
              type="danger"
              :icon="Delete"
              :loading="actionLoading === row.ID"
              :disabled="!runtimeAvailable || !canNetworkWrite"
              @click="deleteNetwork(row)"
            >
              {{ t("container.delete", "Delete") }}
            </el-button>
          </div>
        </template>
      </custom-table>

      <custom-table
        v-if="activeTab === 'volumes'"
        v-loading="listLoading"
        :data="volumes"
        :columns="volumeColumns"
        :pagination="false"
        :auto-pagination="false"
        :row-key="getRowKey"
        :empty-text="t('container.empty.volumes', 'No volumes')"
        @selection-change="handleVolumeSelectionChange"
      >
        <template #volumeOptions="{ row }">{{
          row.Options ? Object.keys(row.Options).join("，") : "--"
        }}</template>
        <template #volumeAction="{ row }">
          <div class="row-actions table-row-actions">
            <el-button
              link
              type="primary"
              :icon="Document"
              @click="openDetail('volume', row)"
              >{{ t("container.detail", "Details") }}</el-button
            >
            <el-button
              link
              type="danger"
              :icon="Delete"
              :loading="actionLoading === row.Name"
              :disabled="!runtimeAvailable || !canVolumeWrite"
              @click="deleteVolume(row)"
            >
              {{ t("container.delete", "Delete") }}
            </el-button>
          </div>
        </template>
      </custom-table>

      <custom-table
        v-if="activeTab === 'compose'"
        v-loading="listLoading"
        :data="composeProjects"
        :columns="composeColumns"
        :pagination="false"
        :row-key="getRowKey"
        :empty-text="t('container.empty.compose', 'No Compose projects')"
      >
        <template #composeProject="{ row }">
          <div class="primary-cell">
            <strong>{{ composeProjectName(row) || "--" }}</strong>
            <span>{{
              row.managed
                ? t("container.compose.managed", "Managed")
                : t("container.compose.external", "External")
            }}</span>
          </div>
        </template>
        <template #composeStatus="{ row }">
          <el-tag :type="composeStatusTagType(row)" effect="light">
            {{ composeProjectStatus(row) || "--" }}
          </el-tag>
        </template>
        <template #composeServices="{ row }">
          <span class="table-ellipsis-cell">
            {{
              Array.isArray(row.services) && row.services.length
                ? row.services.map((item: any) => item.name || "--").join(", ")
                : "--"
            }}
          </span>
        </template>
        <template #composeConfigFiles="{ row }">
          <el-tooltip
            :disabled="composeProjectConfigFiles(row).length <= 32"
            :content="composeProjectConfigFiles(row) || '--'"
          >
            <span class="table-ellipsis-cell">{{
              composeProjectConfigFiles(row) || "--"
            }}</span>
          </el-tooltip>
        </template>
        <template #composeWorkingDir="{ row }">
          <el-tooltip
            :disabled="composeProjectWorkingDir(row).length <= 32"
            :content="composeProjectWorkingDir(row) || '--'"
          >
            <span class="table-ellipsis-cell">{{
              composeProjectWorkingDir(row) || "--"
            }}</span>
          </el-tooltip>
        </template>
        <template #composeAction="{ row }">
          <div class="row-actions table-row-actions">
            <el-button
              link
              type="primary"
              :icon="Document"
              @click="openComposeLogs(row)"
            >
              {{ t("container.logs", "Logs") }}
            </el-button>
            <el-button
              v-if="hasComposeAction(row, 'edit') || row.editable"
              link
              type="primary"
              :icon="EditPen"
              :disabled="!canComposeWrite || row.editable === false"
              @click="openComposeEditDialog(row)"
            >
              {{ t("container.edit", "Edit") }}
            </el-button>
            <el-button
              v-if="hasComposeAction(row, 'start')"
              link
              type="primary"
              :icon="VideoPlay"
              :loading="actionLoading === `compose:${composeProjectName(row)}:start`"
              :disabled="!runtimeAvailable || !canComposeWrite"
              @click="runComposeAction(row, 'start')"
            >
              {{ t("container.start", "Start") }}
            </el-button>
            <el-button
              v-if="hasComposeAction(row, 'stop')"
              link
              type="primary"
              :icon="SwitchButton"
              :loading="actionLoading === `compose:${composeProjectName(row)}:stop`"
              :disabled="!runtimeAvailable || !canComposeWrite"
              @click="runComposeAction(row, 'stop')"
            >
              {{ t("container.stop", "Stop") }}
            </el-button>
            <el-button
              v-if="hasComposeAction(row, 'restart')"
              link
              type="primary"
              :icon="Refresh"
              :loading="actionLoading === `compose:${composeProjectName(row)}:restart`"
              :disabled="!runtimeAvailable || !canComposeWrite"
              @click="runComposeAction(row, 'restart')"
            >
              {{ t("container.restart", "Restart") }}
            </el-button>
            <el-button
              v-if="hasComposeAction(row, 'update')"
              link
              type="primary"
              :icon="Upload"
              :loading="actionLoading === `compose:${composeProjectName(row)}:update`"
              :disabled="!runtimeAvailable || !canComposeWrite"
              @click="runComposeAction(row, 'update')"
            >
              {{ t("container.update", "Update") }}
            </el-button>
            <el-button
              v-if="hasComposeAction(row, 'delete')"
              link
              type="danger"
              :icon="Delete"
              :loading="actionLoading === `compose:${composeProjectName(row)}:delete`"
              :disabled="!runtimeAvailable || !canComposeWrite"
              @click="runComposeAction(row, 'delete')"
            >
              {{ t("container.delete", "Delete") }}
            </el-button>
          </div>
        </template>
      </custom-table>

      <el-alert
        v-if="activeTab === 'templates' && !templatesSupported"
        class="container-alert"
        :title="
          templatesMessage ||
          t('container.templatesDisabled', 'Compose templates are not enabled')
        "
        type="info"
        show-icon
        :closable="false"
      />

      <custom-table
        v-if="activeTab === 'templates'"
        v-loading="listLoading"
        :data="templates"
        :columns="templateColumns"
        :pagination="false"
        :row-key="getRowKey"
        :empty-text="t('container.empty.templates', 'No templates')"
      >
        <template #templateContent="{ row }">{{
          row.content || "--"
        }}</template>
        <template #templateAction="{ row }">
          <div class="row-actions table-row-actions">
            <el-button
              link
              type="primary"
              :icon="Plus"
              :disabled="!canComposeWrite || !templatesSupported"
              @click="openDialog('compose-template-deploy', row)"
              >{{ t("container.deployFromTemplate", "Deploy from template") }}</el-button
            >
            <el-button
              link
              type="primary"
              :icon="EditPen"
              :disabled="!canComposeWrite || !templatesSupported"
              @click="openDialog('template', row)"
              >{{ t("container.edit", "Edit") }}</el-button
            >
            <el-button
              link
              type="danger"
              :icon="Delete"
              :loading="actionLoading === `template:${row.id}`"
              :disabled="!canDelete || !row.id || !templatesSupported"
              @click="deleteTemplate(row)"
            >
              {{ t("container.delete", "Delete") }}
            </el-button>
          </div>
        </template>
      </custom-table>

      <custom-table
        v-if="activeTab === 'registries'"
        v-loading="listLoading"
        :data="registries"
        :columns="registryColumns"
        :pagination="false"
        :auto-pagination="false"
        :row-key="getRowKey"
        :empty-text="t('container.empty.registries', 'No registries')"
      >
        <template #registryAddress="{ row }">{{ registryLabel(row) }}</template>
        <template #registryAuth="{ row }">
          <el-tag :type="row.authEnabled ? 'success' : 'info'" effect="light">{{
            row.authEnabled
              ? t("container.enabled", "Enabled")
              : t("container.disabled", "Disabled")
          }}</el-tag>
        </template>
        <template #registryAction="{ row }">
          <div class="row-actions table-row-actions">
            <el-tooltip
              :content="registryTestDisabledReason"
              :disabled="!registryTestDisabledReason"
            >
              <span class="disabled-action-wrapper">
                <el-button
                  link
                  type="primary"
                  :icon="Connection"
                  :loading="actionLoading === `registry-test:${row.id}`"
                  :disabled="!registryTestAvailable || !canRegistryWrite"
                  @click="testRegistry(row)"
                >
                  {{ t("container.test", "Test") }}
                </el-button>
              </span>
            </el-tooltip>
            <el-button
              link
              type="primary"
              :icon="EditPen"
              :disabled="!canRegistryWrite"
              @click="openDialog('registry', row)"
              >{{ t("container.edit", "Edit") }}</el-button
            >
            <el-button
              link
              type="danger"
              :icon="Delete"
              :loading="actionLoading === `registry:${row.id}`"
              :disabled="!canRegistryWrite"
              @click="deleteRegistry(row)"
            >
              {{ t("container.delete", "Delete") }}
            </el-button>
          </div>
        </template>
      </custom-table>

      <div
        v-if="activeTab === 'config'"
        v-loading="listLoading"
        class="config-editor"
      >
        <div class="config-editor__meta">
          <span>{{
            t("container.configFile", "Config file: {path}", {
              path: dockerConfig?.configPath || "--",
            })
          }}</span>
          <el-tag
            :type="dockerConfig?.exists ? 'success' : 'info'"
            effect="light"
          >
            {{
              dockerConfig?.exists
                ? t("container.exists", "Exists")
                : t("container.notCreated", "Not created")
            }}
          </el-tag>
        </div>
        <el-input
          v-model="configForm.raw"
          type="textarea"
          :rows="16"
          :placeholder="dockerConfigPlaceholder"
        />
        <div class="field-help">
          {{
            t(
              'container.configSaveTip',
              'Saving only writes daemon.json and does not restart Docker automatically. To apply changes, click &quot;Restart Docker&quot; and confirm the operation preview.',
            )
          }}
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

      <!-- <div class="panel-foot">
        <span v-if="activeTab === 'containers'">{{
          t(
            "container.footer.containers",
            "{total} containers, {running} running on current page",
            { total: listState.containers.total, running: runningContainers },
          )
        }}</span>
        <span v-if="activeTab === 'images'">{{
          t(
            "container.footer.images",
            "{total} images, current page size {size}",
            { total: listState.images.total, size: totalImagesSize },
          )
        }}</span>
        <span v-if="activeTab === 'networks'">{{
          t("container.footer.networks", "{total} networks", {
            total: listState.networks.total,
          })
        }}</span>
        <span v-if="activeTab === 'volumes'">{{
          t("container.footer.volumes", "{total} volumes", {
            total: listState.volumes.total,
          })
        }}</span>
        <span v-if="activeTab === 'compose'">{{
          t("container.footer.compose", "{total} Compose projects, read-only", {
            total: composeProjects.length,
          })
        }}</span>
        <span v-if="activeTab === 'templates'">{{
          t("container.footer.templates", "{total} templates", {
            total: templates.length,
          })
        }}</span>
        <span v-if="activeTab === 'registries'">{{
          t("container.footer.registries", "{total} registries", {
            total: listState.registries.total,
          })
        }}</span>
        <span v-if="activeTab === 'config'">{{
          t("container.footer.config", "Docker config read and save")
        }}</span>
      </div> -->
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
      @update:visible="handleDialogVisibleChange"
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
      :compose-form="composeForm"
      :registry-form="registryForm"
      :template-form="templateForm"
      :registries="registries"
      :templates="templates"
      :image-reference="imageReference"
      :registry-label="registryLabel"
      :reveal-compose-config="revealComposeConfig"
      @confirm="submitDialog"
      @update:visible="handleDialogVisibleChange"
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
      :custom-range="logCustomRange"
      :timestamps="logTimestamps"
      @update:tail="logTail = $event"
      @update:time-filter="logTimeFilter = $event"
      @update:custom-range="logCustomRange = $event"
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

  :deep(.cleanup-action-button) {
    border-color: rgba(245, 158, 11, 0.28);
    background: linear-gradient(180deg, rgba(255, 247, 237, 0.92), rgba(255, 251, 235, 0.98));
    color: #b45309;
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.7) inset,
      0 8px 18px rgba(245, 158, 11, 0.12);

    &:not(.is-disabled):hover,
    &:not(.is-disabled):focus-visible {
      border-color: rgba(217, 119, 6, 0.42);
      background: linear-gradient(180deg, rgba(255, 237, 213, 0.98), rgba(255, 247, 237, 1));
      color: #92400e;
      box-shadow:
        0 1px 0 rgba(255, 255, 255, 0.78) inset,
        0 10px 24px rgba(245, 158, 11, 0.16);
    }

    &.is-disabled,
    &.is-disabled:hover,
    &:disabled,
    &:disabled:hover {
      border-color: rgba(245, 158, 11, 0.18) !important;
      background: linear-gradient(180deg, rgba(255, 247, 237, 0.54), rgba(255, 251, 235, 0.7)) !important;
      color: rgba(180, 83, 9, 0.72) !important;
      box-shadow: none !important;
      transform: none !important;
    }
  }
}

:root:root.dark .container-page .panel-actions :deep(.cleanup-action-button) {
  border-color: rgba(245, 158, 11, 0.34);
  background: linear-gradient(180deg, rgba(101, 67, 18, 0.38), rgba(74, 48, 16, 0.48));
  color: #fcd34d;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.03) inset,
    0 10px 22px rgba(0, 0, 0, 0.18);

  &:not(.is-disabled):hover,
  &:not(.is-disabled):focus-visible {
    border-color: rgba(251, 191, 36, 0.5);
    background: linear-gradient(180deg, rgba(120, 82, 12, 0.46), rgba(96, 62, 16, 0.58));
    color: #fde68a;
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.04) inset,
      0 12px 26px rgba(0, 0, 0, 0.24);
  }

  &.is-disabled,
  &.is-disabled:hover,
  &:disabled,
  &:disabled:hover {
    border-color: rgba(180, 131, 19, 0.26) !important;
    background: linear-gradient(180deg, rgba(80, 58, 24, 0.34), rgba(66, 48, 22, 0.42)) !important;
    color: rgba(252, 211, 77, 0.72) !important;
    box-shadow: none !important;
  }
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

.resource-panel :deep(.el-table td.el-table__cell) {
  height: auto;
  min-height: 48px;
  padding-top: 10px;
  padding-bottom: 10px;
  vertical-align: top;
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
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
    font-size: 12px;
  }
}

.status-cell {
  min-width: 0;
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  max-width: 100%;
  padding: 6px 10px;
  border: 1px solid transparent;
  border-radius: 10px;
  line-height: 1.3;
  vertical-align: middle;

  strong {
    color: inherit;
    font-size: 13px;
    font-weight: 700;
  }

  span {
    color: inherit;
    opacity: 0.78;
    font-size: 12px;
    white-space: normal;
    word-break: break-word;
  }

  &.is-success {
    color: #15803d;
    border-color: rgb(34 197 94 / 18%);
    background: rgb(34 197 94 / 8%);
  }

  &.is-warning {
    color: #b45309;
    border-color: rgb(245 158 11 / 22%);
    background: rgb(245 158 11 / 10%);
  }

  &.is-danger {
    color: #dc2626;
    border-color: rgb(239 68 68 / 18%);
    background: rgb(239 68 68 / 8%);
  }

  &.is-info {
    color: #475569;
    border-color: rgb(148 163 184 / 20%);
    background: rgb(148 163 184 / 10%);
  }
}

.table-ellipsis-cell {
  display: inline-block;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}

.table-ellipsis-cell.is-network-warning {
  color: var(--el-color-warning);
  font-weight: 600;
}

.container-network-picker {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.container-network-picker__label {
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
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
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
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

:global(.container-batch-result-message-box) {
  width: min(680px, calc(100vw - 32px));
}

:global(.container-batch-result-message-box .el-message-box__message) {
  margin-top: 2px;
}

:global(.batch-result) {
  display: flex;
  flex-direction: column;
  gap: 12px;
  color: var(--text-primary);
}

:global(.batch-result p) {
  margin: 0;
  color: var(--text-secondary);
  font-weight: 600;
}

:global(.batch-result pre) {
  margin: 0;
  max-height: min(40vh, 320px);
  overflow: auto;
  padding: 12px;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  background: color-mix(in srgb, var(--surface-page) 74%, var(--surface-card));
  color: var(--text-primary);
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
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
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
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

@media (max-width: 640px) {
  .container-page {
    padding: 0;
  }

  .resource-panel {
    padding: 12px;
  }

  .table-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .table-toolbar__filters :deep(> .el-input) {
    width: 100%;
  }

  .status-filter {
    flex: 1;
    min-width: 0;
  }

  .resource-pagination {
    flex-wrap: wrap;
    justify-content: flex-start;
    row-gap: 12px;
  }
}
</style>
