<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Delete, EditPen, WarningFilled } from "@element-plus/icons-vue";

import { Api } from "@/api/modules";
import SearchInput from "@/components/search-input.vue";
import i18n from "@/lang";
import { useSoftwareTaskStore } from "@/stores/modules/softwareTask";
import {
  isOperationCancelled,
  submitOperation,
} from "@/utils/operationPreview";
import InstallTaskDrawer from "../../software/components/InstallTaskDrawer.vue";
import Addfirewall from "./addfirewall.vue";
import type { ColumnItem } from "@/components/custom-table.vue";

interface SecurityCapabilities {
  canReadSecurity: boolean;
  canWriteSecurity: boolean;
  canInstall: boolean;
  canChangeFirewallRules: boolean;
  canChangePortForward: boolean;
  canToggleFirewall: boolean;
  canTogglePing: boolean;
}

const props = defineProps<{
  capabilities: SecurityCapabilities;
}>();

const softwareTaskStore = useSoftwareTaskStore()

type RuleTab = "port" | "ip" | "forward" | "region" | "auto_block";

interface FirewallCounts {
  portRules: number;
  ipRules: number;
  portForwards: number;
  regionRules: number;
  autoBlockRules: number;
}

interface FirewallStatus {
  install: boolean;
  enabled: boolean;
  pingBlocked: boolean;
  backend: "ufw" | "firewalld" | "iptables" | "none";
  runtimeBackend?: string;
  managedBackend?: string;
  persistent: boolean;
  canToggle: boolean;
  repairRequired: boolean;
  warning?: string;
  panelPort: number;
  panelPortProtected: boolean;
  managedPanelRule?: boolean;
  managedRuleCount: number;
  counts: FirewallCounts;
}

interface FirewallListResponse<T> {
  data?: T[];
  total?: number;
}

interface FirewallRule {
  id: number;
  ruleType: Exclude<RuleTab, "forward">;
  direction: "in" | "out";
  protocol: "tcp" | "udp" | "icmp" | "all";
  strategy: "allow" | "deny";
  ips: string;
  ports: string;
  state: number;
  remark: string;
  location: string;
  expiresAt?: string | null;
  backend: string;
  protected: boolean;
  create_time: string;
  update_time?: string;
}

interface PortForward {
  id: number;
  protocol: "tcp" | "udp";
  sourcePort: number;
  destinationIp: string;
  destinationPort: number;
  state: number;
  remark: string;
  backend: string;
  create_time: string;
}

interface AutoBlockConfig {
  id?: number;
  enabled: boolean;
  threshold: number;
  windowMinutes: number;
  banMinutes: number;
  create_time?: string;
  update_time?: string;
  lastRunAt?: string | null;
}

const emptyCounts = (): FirewallCounts => ({
  portRules: 0,
  ipRules: 0,
  portForwards: 0,
  regionRules: 0,
  autoBlockRules: 0,
});

const defaultStatus = (): FirewallStatus => ({
  install: false,
  enabled: false,
  pingBlocked: false,
  backend: "none",
  persistent: false,
  canToggle: false,
  repairRequired: false,
  panelPort: 8089,
  panelPortProtected: false,
  managedRuleCount: 0,
  counts: emptyCounts(),
});

const t = (key: string, fallback?: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params);
  return value && value !== key ? value : fallback || key;
};

const tabs: Array<{
  key: RuleTab;
  labelKey: string;
  fallback: string;
  countKey: keyof FirewallCounts;
}> = [
  {
    key: "port",
    labelKey: "security.ruleTabs.port",
    fallback: "端口规则",
    countKey: "portRules",
  },
  {
    key: "ip",
    labelKey: "security.ruleTabs.ip",
    fallback: "IP 规则",
    countKey: "ipRules",
  },
  {
    key: "forward",
    labelKey: "security.ruleTabs.forward",
    fallback: "端口转发",
    countKey: "portForwards",
  },
  {
    key: "region",
    labelKey: "security.ruleTabs.region",
    fallback: "地区规则",
    countKey: "regionRules",
  },
  {
    key: "auto_block",
    labelKey: "security.ruleTabs.autoBlock",
    fallback: "恶意 IP 自动封禁",
    countKey: "autoBlockRules",
  },
];

const backendNames: Record<string, string> = {
  ufw: "UFW",
  firewalld: "firewalld",
  iptables: "iptables",
};

const normalizeBackend = (backend?: string | null): FirewallStatus["backend"] => {
  if (backend === "ufw" || backend === "firewalld" || backend === "iptables") {
    return backend;
  }
  return "none";
};

const parseListResponse = <T,>(payload: any): FirewallListResponse<T> => ({
  data: Array.isArray(payload?.data) ? payload.data : [],
  total: Number(payload?.total || 0),
});

const portContainsPanelPort = (ports: string, panelPort: number) => {
  const normalized = String(ports || "").trim();
  if (!normalized) return true;
  return normalized.split(",").some((segment) => {
    const token = segment.trim();
    if (!token) return false;
    if (/^\d+$/.test(token)) return Number(token) === panelPort;
    const range = token.match(/^(\d+)\s*-\s*(\d+)$/);
    if (!range) return false;
    const start = Number(range[1]);
    const end = Number(range[2]);
    return start <= panelPort && panelPort <= end;
  });
};

const buildUnifiedStatus = (
  rawStatus: Partial<FirewallStatus>,
  portSummary: FirewallListResponse<FirewallRule>,
  ipSummary: FirewallListResponse<FirewallRule>,
  regionSummary: FirewallListResponse<FirewallRule>,
  forwardSummary: FirewallListResponse<PortForward>,
) => {
  const panelPort = Number(rawStatus.panelPort || 8089);
  const portRows = portSummary.data || [];
  const ipRows = ipSummary.data || [];
  const regionRows = regionSummary.data || [];
  const allRules = [...portRows, ...ipRows, ...regionRows];
  const allBackends: FirewallStatus["backend"][] = [
    rawStatus.backend,
    rawStatus.runtimeBackend,
    rawStatus.managedBackend,
    ...allRules.map((row) => row.backend),
    ...(forwardSummary.data || []).map((row) => row.backend),
  ]
    .map((item) => normalizeBackend(item));
  const detectedBackend =
    allBackends.find((item) => item !== "none") || "none";
  const panelPortRules = portRows.filter(
    (row) =>
      row.direction === "in" &&
      row.strategy === "allow" &&
      row.state === 1 &&
      portContainsPanelPort(row.ports, panelPort),
  );
  const protectedRules = allRules.filter((row) => row.protected);
  const managedPanelRule = panelPortRules.some((row) => row.protected);
  const hasSupportedRules =
    detectedBackend !== "none" ||
    allRules.length > 0 ||
    (forwardSummary.total || 0) > 0 ||
    protectedRules.length > 0;

  return {
    ...defaultStatus(),
    ...rawStatus,
    backend: normalizeBackend(rawStatus.backend) !== "none"
      ? normalizeBackend(rawStatus.backend)
      : detectedBackend,
    runtimeBackend:
      normalizeBackend(rawStatus.runtimeBackend) !== "none"
        ? rawStatus.runtimeBackend
        : detectedBackend !== "none"
          ? detectedBackend
          : rawStatus.runtimeBackend,
    managedBackend:
      normalizeBackend(rawStatus.managedBackend) !== "none"
        ? rawStatus.managedBackend
        : managedPanelRule && detectedBackend !== "none"
          ? detectedBackend
          : rawStatus.managedBackend,
    install: Boolean(rawStatus.install || hasSupportedRules),
    panelPort,
    panelPortProtected: Boolean(rawStatus.panelPortProtected),
    managedPanelRule,
    managedRuleCount: protectedRules.length,
    counts: {
      ...emptyCounts(),
      ...(rawStatus.counts || {}),
      portRules: portSummary.total || portRows.length,
      ipRules: ipSummary.total || ipRows.length,
      portForwards: forwardSummary.total || (forwardSummary.data || []).length,
      regionRules: regionSummary.total || regionRows.length,
      autoBlockRules: rawStatus.counts?.autoBlockRules || 0,
    },
  } satisfies FirewallStatus;
};

const status = ref<FirewallStatus>(defaultStatus());
const activeTab = ref<RuleTab>("port");
const ruleRows = ref<FirewallRule[]>([]);
const forwardRows = ref<PortForward[]>([]);
const selectedRows = ref<FirewallRule[]>([]);
const statusLoading = ref(false);
const tableLoading = ref(false);
const firewallChanging = ref(false);
const pingChanging = ref(false);
const cleanupLoading = ref(false);
const installSubmitting = ref(false);
const batchAction = ref<"enable" | "disable" | "delete" | "">("");
const searchValue = ref("");
const pagination = reactive({ currentPage: 1, pageSize: 20, total: 0 });

const installTaskVisible = ref(false);
const installTaskId = ref("");
const refreshedTerminalTasks = new Set<string>();
const activeInstallTask = computed(() =>
  softwareTaskStore.activeForKey("firewalld"),
);
const installButtonText = computed(() =>
  activeInstallTask.value
    ? t("security.viewTaskProgress", "查看任务进度")
    : status.value.repairRequired
      ? t("security.repairFirewalld", "修复 firewalld")
      : t("security.installFirewalld", "安装 firewalld"),
);
const showInstallCard = computed(
  () => status.value.repairRequired || !status.value.install || status.value.backend === "none",
);

const portDialogVisible = ref(false);
const portDialogIsAdd = ref(true);
const currentPortRule = ref<Record<string, any>>({});

const ipDialogVisible = ref(false);
const ipDialogIsAdd = ref(true);
const ipSubmitting = ref(false);
const ipForm = reactive({
  id: 0,
  ips: "",
  strategy: "deny" as "allow" | "deny",
  location: "",
  remark: "",
  expiresAt: undefined as Date | string | undefined,
  enabled: true,
});

const forwardDialogVisible = ref(false);
const forwardDialogIsAdd = ref(true);
const forwardSubmitting = ref(false);
const forwardForm = reactive({
  id: 0,
  protocol: "tcp" as "tcp" | "udp",
  sourcePort: 0,
  destinationIp: "",
  destinationPort: 0,
  remark: "",
  enabled: true,
});

const importInput = ref<HTMLInputElement>();
const autoSaving = ref(false);
const autoRunning = ref(false);
const autoConfig = reactive<AutoBlockConfig>({
  enabled: false,
  threshold: 8,
  windowMinutes: 10,
  banMinutes: 1440,
  lastRunAt: null,
});

const isRuleTab = computed(() => activeTab.value !== "forward");
const canWrite = computed(() => Boolean(props.capabilities?.canWriteSecurity));
const baseActionDisabledReason = computed(() => {
  if (!canWrite.value)
    return t("security.readOnlyReason", "当前账号只有安全配置读取权限");
  if (!status.value.install)
    return t("security.firewallUnsupportedReason", "未检测到受支持的防火墙");
  if (status.value.repairRequired)
    return t("security.firewallRepairReason", "防火墙配置需要先修复");
  if (!status.value.enabled)
    return t("security.firewallEnableRequired", "需先启用防火墙");
  if (!status.value.persistent)
    return t("security.firewallPersistentRequired", "当前防火墙规则无法持久化");
  return "";
});
const canManageRules = computed(() => !baseActionDisabledReason.value);
const firewallDisabledNotice = computed(() => {
  if (!status.value.install || status.value.repairRequired) return "";
  if (!canWrite.value)
    return t("security.readOnlyHint", "当前账号只有安全配置读取权限，可查看但不能修改安全配置。");
  if (!status.value.enabled)
    return t("security.firewallDisabledHint", "防火墙已关闭，启用后才能修改规则。");
  if (!status.value.persistent)
    return t("security.firewallPersistentHint", "当前防火墙规则不可持久化，建议先修复持久化能力后再修改。");
  return "";
});
const pingDisabledReason = computed(() => {
  if (!props.capabilities?.canTogglePing)
    return t("security.pingPermissionDenied", "当前账号没有修改 Ping 策略的权限");
  return baseActionDisabledReason.value;
});
const canRunAutoBlock = computed(
  () =>
    canWrite.value &&
    autoConfig.enabled === true &&
    !autoRunning.value &&
    !autoSaving.value,
);
const autoRunDisabledReason = computed(() => {
  if (!canWrite.value)
    return t("security.autoBlockRunWriteDenied", "当前账号没有安全配置修改权限");
  if (!autoConfig.enabled)
    return t("security.autoBlockRunDisabled", "请先启用自动封禁");
  if (autoSaving.value)
    return t("security.autoBlockSaving", "正在保存配置，请稍候");
  if (autoRunning.value)
    return t("security.autoBlockRunning", "正在检测，请稍候");
  return "";
});
const ruleColumns = computed<ColumnItem<FirewallRule>[]>(() => [
  { type: "selection", width: 48, selectable: (row) => !row.protected },
  ...(activeTab.value === "port"
    ? [
        {
          prop: "direction",
          label: t("security.direction", "方向"),
          width: 82,
          slot: "direction",
        },
        {
          prop: "protocol",
          label: t("security.protocol", "协议"),
          width: 82,
          slot: "protocol",
        },
        {
          prop: "ports",
          label: t("security.ports", "端口"),
          minWidth: 120,
          slot: "ports",
        },
        {
          prop: "ips",
          label: t("security.sourceTarget", "来源 / 目标"),
          minWidth: 180,
          slot: "sourceTarget",
        },
      ]
    : [
        {
          prop: "ips",
          label: t("security.ipAddress", "IP 地址"),
          minWidth: 190,
        },
        {
          prop: "location",
          label: t("security.ipLocation", "IP 归属地"),
          minWidth: 130,
          slot: "location",
        },
      ]),
  {
    prop: "strategy",
    label: t("security.strategy", "策略"),
    width: 94,
    slot: "strategy",
  },
  {
    prop: "state",
    label: t("common.status", "状态"),
    width: 92,
    slot: "state",
  },
  {
    prop: "remark",
    label: t("security.remark", "备注"),
    minWidth: 160,
    slot: "remark",
  },
  {
    prop: "create_time",
    label: t("security.createdAt", "添加时间"),
    minWidth: 168,
    slot: "createdAt",
  },
  {
    prop: "expiresAt",
    label: t("security.expiresAt", "过期时间"),
    minWidth: 168,
    slot: "expiresAt",
  },
  {
    prop: "actionColumn",
    label: t("common.action", "操作"),
    width: 180,
    fixed: "right",
    slot: "actionColumn",
    className: "table-action-column",
  },
]);
const forwardColumns = computed<ColumnItem<PortForward>[]>(() => [
  {
    prop: "protocol",
    label: t("security.protocol", "协议"),
    width: 90,
    slot: "protocol",
  },
  {
    prop: "sourcePort",
    label: t("security.sourcePort", "源端口"),
    minWidth: 120,
  },
  {
    prop: "forwardTarget",
    label: t("security.forwardTarget", "转发目标"),
    minWidth: 220,
    slot: "forwardTarget",
  },
  {
    prop: "state",
    label: t("common.status", "状态"),
    width: 100,
    slot: "state",
  },
  {
    prop: "remark",
    label: t("security.remark", "备注"),
    minWidth: 180,
    slot: "remark",
  },
  {
    prop: "create_time",
    label: t("security.createdAt", "添加时间"),
    minWidth: 180,
    slot: "createdAt",
  },
  {
    prop: "actionColumn",
    label: t("common.action", "操作"),
    width: 180,
    fixed: "right",
    slot: "actionColumn",
    className: "table-action-column",
  },
]);

const addRuleButtonText = computed(() => {
  if (activeTab.value === "ip") return t("security.addIpRule", "添加 IP 规则");
  if (activeTab.value === "region")
    return t("security.addRegionRule", "添加地区规则");
  if (activeTab.value === "forward")
    return t("security.addPortForward", "添加端口转发");
  return t("security.addPortRule", "添加端口规则");
});

const importButtonText = computed(() =>
  activeTab.value === "auto_block"
    ? t("security.importBlockedIps", "导入封禁 IP")
    : t("security.importRules", "导入规则"),
);

const exportButtonText = computed(() =>
  activeTab.value === "auto_block"
    ? t("security.exportBlockedIps", "导出封禁 IP")
    : t("security.exportRules", "导出规则"),
);

const showAutoBlockTemplateButton = computed(
  () => activeTab.value === "auto_block",
);

const searchPlaceholder = computed(() =>
  activeTab.value === "forward"
    ? t("security.searchForwardPlaceholder", "请输入目标 IP / 备注")
    : t("security.searchRulePlaceholder", "请输入 IP / 备注"),
);

const ipDialogTitle = computed(() => {
  const action = ipDialogIsAdd.value
    ? t("common.add", "添加")
    : t("common.edit", "编辑");
  const target =
    activeTab.value === "region" ? t("security.region", "地区") : "IP";
  return `${action}${target}${t("security.rule", "规则")}`;
});

const forwardDialogTitle = computed(() =>
  forwardDialogIsAdd.value
    ? t("security.addPortForward", "添加端口转发")
    : t("security.editPortForward", "编辑端口转发"),
);

const directionLabel = (direction: FirewallRule["direction"]) =>
  direction === "in"
    ? t("security.inbound", "入站")
    : t("security.outbound", "出站");

const strategyLabel = (strategy: FirewallRule["strategy"]) =>
  strategy === "allow"
    ? t("security.allow", "放行")
    : t("security.reject", "拒绝");

const backendLabel = (backend: string) =>
  backend === "none"
    ? t("security.backendNotDetected", "未检测到")
    : backendNames[backend] || backend;

const getFirewallInfo = async () => {
  if (!props.capabilities?.canReadSecurity) return;
  statusLoading.value = true;
  try {
    const { data } = await Api.getFirewallInfo({});
    status.value = {
      ...defaultStatus(),
      ...(data?.info || {}),
      counts: { ...emptyCounts(), ...(data?.info?.counts || {}) },
    };
  } catch {
    status.value = defaultStatus();
  } finally {
    statusLoading.value = false;
  }
};

const loadFirewallSummary = async () => {
  if (!props.capabilities?.canReadSecurity) return;
  const [portRes, ipRes, regionRes, forwardRes] = await Promise.allSettled([
    Api.getFirewallRule({ page: 1, pageSize: 500, ruleType: "port", q: "" }),
    Api.getFirewallRule({ page: 1, pageSize: 500, ruleType: "ip", q: "" }),
    Api.getFirewallRule({ page: 1, pageSize: 500, ruleType: "region", q: "" }),
    Api.getFirewallForwards({ page: 1, pageSize: 500, q: "" }),
  ]);
  status.value = buildUnifiedStatus(
    status.value,
    parseListResponse<FirewallRule>(portRes.status === "fulfilled" ? portRes.value?.data : undefined),
    parseListResponse<FirewallRule>(ipRes.status === "fulfilled" ? ipRes.value?.data : undefined),
    parseListResponse<FirewallRule>(regionRes.status === "fulfilled" ? regionRes.value?.data : undefined),
    parseListResponse<PortForward>(forwardRes.status === "fulfilled" ? forwardRes.value?.data : undefined),
  );
};

const getData = async () => {
  if (!props.capabilities?.canReadSecurity) return;
  tableLoading.value = true;
  selectedRows.value = [];
  try {
    if (activeTab.value === "forward") {
      const { data } = await Api.getFirewallForwards({
        page: pagination.currentPage,
        pageSize: pagination.pageSize,
        q: searchValue.value,
      });
      forwardRows.value = data?.data || [];
      pagination.total = data?.total || 0;
      return;
    }
    const { data } = await Api.getFirewallRule({
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
      ruleType: activeTab.value,
      q: searchValue.value,
    });
    ruleRows.value = data?.data || [];
    pagination.total = data?.total || 0;
  } catch {
    ruleRows.value = [];
    forwardRows.value = [];
    pagination.total = 0;
  } finally {
    tableLoading.value = false;
  }
};

const refreshAll = async () => {
  if (!props.capabilities?.canReadSecurity) return;
  await getFirewallInfo();
  await Promise.all([loadFirewallSummary(), getData()]);
};

defineExpose({
  getData,
  refreshAll,
});

const handleFirewallChange = async (value: string | number | boolean) => {
  if (!props.capabilities?.canToggleFirewall) return;
  const enabled = Boolean(value);
  const previous = !enabled;
  firewallChanging.value = true;
  try {
    let confirm = "";
    if (!enabled) {
      const result = await ElMessageBox.prompt(
        t(
          "security.disableFirewallPrompt",
          "关闭防火墙会扩大服务器暴露面。请输入 DISABLE FIREWALL 继续。",
        ),
        t("security.disableFirewallTitle", "关闭防火墙"),
        {
          type: "warning",
          inputPlaceholder: "DISABLE FIREWALL",
          inputValidator: (input) =>
            input === "DISABLE FIREWALL" ||
            t("security.confirmTextIncorrect", "确认文本不正确"),
          confirmButtonText: t("security.confirmDisable", "确认关闭"),
          cancelButtonText: t("common.cancel", "取消"),
        },
      );
      confirm = result.value;
    }
    await submitOperation("firewall.toggle", { enabled, confirm });
    ElMessage.success(
      enabled
        ? t("security.firewallEnabled", "防火墙已启用")
        : t("security.firewallDisabled", "防火墙已关闭"),
    );
  } catch (error) {
    status.value.enabled = previous;
    if (!isOperationCancelled(error)) {
      await getFirewallInfo();
    }
  } finally {
    await refreshAll();
    firewallChanging.value = false;
  }
};

const handlePingChange = async (value: string | number | boolean) => {
  if (!props.capabilities?.canTogglePing) return;
  const blocked = Boolean(value);
  const previous = !blocked;
  pingChanging.value = true;
  try {
    await submitOperation("firewall.rule_change", {
      action: "set_ping",
      blocked,
    });
    ElMessage.success(
      blocked
        ? t("security.pingBlocked", "已禁止外部 Ping")
        : t("security.pingAllowed", "已允许外部 Ping"),
    );
  } catch (error) {
    status.value.pingBlocked = previous;
    if (!isOperationCancelled(error)) {
      await getFirewallInfo();
    }
  } finally {
    await getFirewallInfo();
    pingChanging.value = false;
  }
};

const handleCleanup = async () => {
  if (!canWrite.value) return;
  cleanupLoading.value = true;
  try {
    const { data } = await Api.cleanupFirewallRules();
    ElMessage.success(
      t("security.cleanupComplete", "清理完成，共移除 {count} 条过期规则", {
        count: data?.cleaned || 0,
      }),
    );
    await refreshAll();
  } finally {
    cleanupLoading.value = false;
  }
};

const handleInstallFirewall = async () => {
  if (!props.capabilities?.canInstall) return;
  if (activeInstallTask.value) {
    installTaskId.value = activeInstallTask.value.id;
    installTaskVisible.value = true;
    return;
  }
  try {
    await ElMessageBox.confirm(
      status.value.repairRequired
        ? t(
            "security.repairFirewalldConfirm",
            "系统将通过受校验脚本修复 firewalld 配置，完成后仍保持关闭。",
          )
        : t(
            "security.installFirewalldConfirm",
            "系统将安装默认 firewalld，完成后保持关闭，首次启用时自动保护面板端口。",
          ),
      status.value.repairRequired
        ? t("security.repairFirewalld", "修复 firewalld")
        : t("security.installDefaultFirewall", "安装默认防火墙"),
      {
        type: "info",
        confirmButtonText: t("common.start", "开始"),
        cancelButtonText: t("common.cancel", "取消"),
      },
    );
  } catch {
    return;
  }
  installSubmitting.value = true;
  try {
    const { data } = await submitOperation("software.install", {
      key: "firewalld",
      name: "firewalld",
      repair: status.value.repairRequired,
    });
    softwareTaskStore.acceptCreated(data, {
      key: "firewalld",
      version: "1.0.0",
    });
    installTaskId.value = data.taskId;
    installTaskVisible.value = true;
    ElMessage.success(
      status.value.repairRequired
        ? t("security.repairTaskCreated", "firewalld 修复任务已创建")
        : t("security.installTaskCreated", "firewalld 安装任务已创建"),
    );
  } catch (error) {
    if (!isOperationCancelled(error)) throw error;
  } finally {
    installSubmitting.value = false;
  }
};

const switchTab = (tab: RuleTab) => {
  activeTab.value = tab;
  pagination.currentPage = 1;
  searchValue.value = "";
};

const openAddDialog = () => {
  if (activeTab.value === "forward" && !props.capabilities?.canChangePortForward) return;
  if (activeTab.value !== "forward" && !props.capabilities?.canChangeFirewallRules) return;
  if (activeTab.value === "port") {
    portDialogIsAdd.value = true;
    currentPortRule.value = {};
    portDialogVisible.value = true;
    return;
  }
  if (activeTab.value === "forward") {
    forwardDialogIsAdd.value = true;
    Object.assign(forwardForm, {
      id: 0,
      protocol: "tcp",
      sourcePort: 0,
      destinationIp: "",
      destinationPort: 0,
      remark: "",
      enabled: true,
    });
    forwardDialogVisible.value = true;
    return;
  }
  if (activeTab.value === "ip" || activeTab.value === "region") {
    ipDialogIsAdd.value = true;
    Object.assign(ipForm, {
      id: 0,
      ips: "",
      strategy: "deny",
      location: "",
      remark: "",
      expiresAt: undefined,
      enabled: true,
    });
    ipDialogVisible.value = true;
  }
};

const editRule = (row: FirewallRule) => {
  if (row.protected || !props.capabilities?.canChangeFirewallRules) return;
  if (row.ruleType === "port") {
    portDialogIsAdd.value = false;
    currentPortRule.value = { ...row };
    portDialogVisible.value = true;
    return;
  }
  ipDialogIsAdd.value = false;
  Object.assign(ipForm, {
    id: row.id,
    ips: row.ips.replaceAll(",", "\n"),
    strategy: row.strategy,
    location: row.location,
    remark: row.remark,
    expiresAt: row.expiresAt || undefined,
    enabled: row.state === 1,
  });
  ipDialogVisible.value = true;
};

const saveIPRule = async () => {
  if (!props.capabilities?.canChangeFirewallRules) return;
  const ips = ipForm.ips
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  if (!ips.length) {
    ElMessage.warning(
      t("security.ipRequired", "请输入至少一个 IPv4 地址或 CIDR 网段"),
    );
    return;
  }
  if (activeTab.value === "region" && !ipForm.location.trim()) {
    ElMessage.warning(t("security.regionRequired", "地区规则必须填写地区名称"));
    return;
  }
  ipSubmitting.value = true;
  try {
    const payload = {
      id: ipDialogIsAdd.value ? undefined : ipForm.id,
      ruleType: activeTab.value,
      direction: "in",
      protocol: "all",
      strategy: ipForm.strategy,
      ips: ips.join(","),
      ports: "",
      state: ipForm.enabled ? 1 : 0,
      location: ipForm.location.trim(),
      remark: ipForm.remark.trim(),
      expiresAt: ipForm.expiresAt
        ? new Date(ipForm.expiresAt).toISOString()
        : null,
    };
    const response = ipDialogIsAdd.value
      ? await Api.addFirewallRule(payload)
      : await Api.updateFirewallRule(payload);
    const saved = response?.data || response;
    ElMessage.success(
      ipDialogIsAdd.value
        ? t("security.ruleAdded", "规则已添加")
        : t("security.ruleUpdated", "规则已更新"),
    );
    ipDialogVisible.value = false;
    if (!ipDialogIsAdd.value && saved?.id) {
      const index = ruleRows.value.findIndex((item) => item.id === saved.id);
      if (index >= 0) ruleRows.value.splice(index, 1, saved);
      await getFirewallInfo();
      return;
    }
    await refreshAll();
  } finally {
    ipSubmitting.value = false;
  }
};

const editForward = (row: PortForward) => {
  if (!props.capabilities?.canChangePortForward) return;
  forwardDialogIsAdd.value = false;
  Object.assign(forwardForm, {
    id: row.id,
    protocol: row.protocol,
    sourcePort: row.sourcePort,
    destinationIp: row.destinationIp,
    destinationPort: row.destinationPort,
    remark: row.remark,
    enabled: row.state === 1,
  });
  forwardDialogVisible.value = true;
};

const saveForward = async () => {
  if (!props.capabilities?.canChangePortForward) return;
  if (
    forwardForm.sourcePort < 1 ||
    forwardForm.sourcePort > 65535 ||
    forwardForm.destinationPort < 1 ||
    forwardForm.destinationPort > 65535 ||
    !forwardForm.destinationIp.trim()
  ) {
    ElMessage.warning(
      t("security.forwardRequired", "请填写有效的源端口、目标 IPv4 和目标端口"),
    );
    return;
  }
  forwardSubmitting.value = true;
  try {
    const payload = {
      id: forwardDialogIsAdd.value ? undefined : forwardForm.id,
      protocol: forwardForm.protocol,
      sourcePort: forwardForm.sourcePort,
      destinationIp: forwardForm.destinationIp.trim(),
      destinationPort: forwardForm.destinationPort,
      state: forwardForm.enabled ? 1 : 0,
      remark: forwardForm.remark.trim(),
    };
    const response = forwardDialogIsAdd.value
      ? await Api.addFirewallForward(payload)
      : await Api.updateFirewallForward(payload);
    const saved = response?.data || response;
    ElMessage.success(
      forwardDialogIsAdd.value
        ? t("security.forwardAdded", "端口转发已添加")
        : t("security.forwardUpdated", "端口转发已更新"),
    );
    forwardDialogVisible.value = false;
    if (!forwardDialogIsAdd.value && saved?.id) {
      const index = forwardRows.value.findIndex((item) => item.id === saved.id);
      if (index >= 0) forwardRows.value.splice(index, 1, saved);
      await getFirewallInfo();
      return;
    }
    await refreshAll();
  } finally {
    forwardSubmitting.value = false;
  }
};

const setRuleState = async (row: FirewallRule, enabled: boolean) => {
  if (!props.capabilities?.canChangeFirewallRules) return;
  try {
    await Api.setFirewallRuleState({ id: row.id, enabled });
    ElMessage.success(
      enabled
        ? t("security.ruleEnabled", "规则已启用")
        : t("security.ruleDisabled", "规则已停用"),
    );
  } finally {
    await refreshAll();
  }
};

const setForwardState = async (row: PortForward, enabled: boolean) => {
  if (!props.capabilities?.canChangePortForward) return;
  try {
    await Api.setFirewallForwardState({ id: row.id, enabled });
    ElMessage.success(
      enabled
        ? t("security.forwardEnabled", "端口转发已启用")
        : t("security.forwardDisabled", "端口转发已停用"),
    );
  } finally {
    await refreshAll();
  }
};

const deleteRule = async (row: FirewallRule) => {
  if (!props.capabilities?.canChangeFirewallRules) return;
  if (row.protected) {
    ElMessage.warning(
      t("security.protectedRuleDeleteDenied", "系统保护规则不能删除"),
    );
    return;
  }
  try {
    await submitOperation("firewall.rule_change", {
      action: "delete",
      id: row.id,
    });
    ElMessage.success(t("security.ruleDeleted", "规则已删除"));
    await refreshAll();
  } catch (error) {
    if (!isOperationCancelled(error)) {
      await getData();
    }
  }
};

const deleteForward = async (row: PortForward) => {
  if (!props.capabilities?.canChangePortForward) return;
  try {
    await ElMessageBox.confirm(
      t("security.deleteForwardConfirm", "确定删除这条端口转发吗？"),
      t("security.deletePortForward", "删除端口转发"),
      {
        type: "warning",
        confirmButtonText: t("common.delete", "删除"),
        cancelButtonText: t("common.cancel", "取消"),
      },
    );
    await Api.deleteFirewallForward({ id: row.id });
    ElMessage.success(t("security.forwardDeleted", "端口转发已删除"));
    await refreshAll();
  } catch {
    // 用户取消时保持页面不变。
  }
};

const handleBatch = async () => {
  if (!props.capabilities?.canChangeFirewallRules) return;
  if (!batchAction.value || !selectedRows.value.length) {
    ElMessage.warning(t("security.batchRequired", "请选择规则和批量操作"));
    return;
  }
  if (batchAction.value === "delete") {
    try {
      await ElMessageBox.confirm(
        t("security.batchDeleteConfirm", "确定删除选中的 {count} 条规则吗？", {
          count: selectedRows.value.length,
        }),
        t("security.batchDelete", "批量删除"),
        {
          type: "warning",
          confirmButtonText: t("common.delete", "删除"),
          cancelButtonText: t("common.cancel", "取消"),
        },
      );
    } catch {
      return;
    }
  }
  const { data } = await Api.batchFirewallRules({
    ids: selectedRows.value.map((row) => row.id),
    action: batchAction.value,
  });
  ElMessage.success(
    t("security.batchComplete", "批量操作完成，共处理 {count} 条规则", {
      count: data?.completed || 0,
    }),
  );
  batchAction.value = "";
  await refreshAll();
};

const exportRules = async () => {
  if (!props.capabilities?.canReadSecurity || !isRuleTab.value) return;
  await Api.exportFirewallRules(activeTab.value);
  ElMessage.success(t("security.ruleExported", "规则已导出"));
};

const downloadAutoBlockTemplate = () => {
  const payload = {
    rules: [
      {
        ruleType: "auto_block",
        direction: "in",
        protocol: "all",
        strategy: "deny",
        ips: "203.0.113.10,198.51.100.0/24",
        ports: "",
        state: 1,
        location: "",
        remark: t(
          "security.blockedIpTemplateRemark",
          "SSH 自动封禁导入示例",
        ),
        expiresAt: null,
      },
    ],
  };
  const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], {
    type: "application/json;charset=utf-8",
  });
  const objectURL = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectURL;
  anchor.download = "oneinstack-blocked-ips-template.json";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(objectURL), 1000);
};

const chooseImport = () => {
  if (!props.capabilities?.canChangeFirewallRules) return;
  importInput.value?.click();
};

const importRules = async (event: Event) => {
  if (!props.capabilities?.canChangeFirewallRules) return;
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const rules = Array.isArray(parsed) ? parsed : parsed?.rules;
    if (!Array.isArray(rules)) throw new Error("rules is not an array");
    const { data } = await Api.importFirewallRules({ rules });
    ElMessage.success(
      t("security.ruleImported", "成功导入 {count} 条规则", {
        count: data?.imported || 0,
      }),
    );
    await refreshAll();
  } catch {
    ElMessage.error(
      t("security.importFailed", "导入失败，请检查文件格式和规则内容"),
    );
  }
};

const loadAutoConfig = async () => {
  if (!props.capabilities?.canReadSecurity) return;
  try {
    const { data } = await Api.getFirewallAutoBlock();
    Object.assign(autoConfig, data?.config || {});
  } catch {
    // Keep the safe default disabled state.
  }
};

const getAutoConfigPayload = () => ({
  enabled: autoConfig.enabled,
  threshold: Number(autoConfig.threshold),
  windowMinutes: Number(autoConfig.windowMinutes),
  banMinutes: Number(autoConfig.banMinutes),
});

const persistAutoConfig = async () => {
  autoSaving.value = true;
  try {
    const { data } = await Api.saveFirewallAutoBlock(getAutoConfigPayload());
    Object.assign(autoConfig, data?.config || {});
  } finally {
    autoSaving.value = false;
  }
};

const showAutoConfigSavedMessage = () => {
  ElMessage.success(
    autoConfig.enabled
      ? t("security.autoBlockEnabled", "自动封禁已启用")
      : t("security.autoBlockDisabled", "自动封禁已关闭"),
  );
};

const saveAutoConfig = async () => {
  if (!canWrite.value) return;
  try {
    await persistAutoConfig();
    showAutoConfigSavedMessage();
  } catch {
    ElMessage.error(
      t("security.autoBlockSaveFailed", "自动封禁配置保存失败"),
    );
  }
};

const handleAutoBlockToggle = async (value: boolean | string | number) => {
  if (!canWrite.value) return;
  const nextEnabled = Boolean(value);
  const previousEnabled = !nextEnabled;
  try {
    await persistAutoConfig();
    showAutoConfigSavedMessage();
  } catch {
    autoConfig.enabled = previousEnabled;
    ElMessage.error(
      t(
        "security.autoBlockToggleFailed",
        "自动封禁开关保存失败，已恢复原状态",
      ),
    );
  }
};

const runAutoBlock = async () => {
  if (!canRunAutoBlock.value) return;
  autoRunning.value = true;
  try {
    const { data } = await Api.runFirewallAutoBlock();
    ElMessage.success(
      t(
        "security.autoBlockRunComplete",
        "检测完成，本次新增封禁 {count} 个 IP",
        { count: data?.blocked || 0 },
      ),
    );
    await refreshAll();
  } catch (error: any) {
    if (Number(error?.code) === 2006 || error?.status === 409) {
      await loadAutoConfig();
    }
    throw error;
  } finally {
    autoRunning.value = false;
  }
};

const formatTime = (value?: string | null, fallback?: string) => {
  if (!value) return fallback || "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date.getUTCFullYear() <= 1) {
    return fallback || "--";
  }
  return date.toLocaleString(i18n.locale || "zh-CN", { hour12: false });
};

const formatLastRunAt = (value?: string | null) => {
  if (!value) return t("security.neverRun", "从未检测");
  const date = new Date(value);
  return Number.isNaN(date.getTime()) || date.getUTCFullYear() <= 1
    ? "--"
    : date.toLocaleString(i18n.locale || "zh-CN", { hour12: false });
};

const actionReason = (row?: FirewallRule) => {
  if (row?.protected)
    return t("security.protectedRuleReadonly", "系统保护规则不可修改");
  if (!props.capabilities?.canChangeFirewallRules)
    return t("security.rulePermissionDenied", "当前账号没有防火墙规则修改权限");
  return baseActionDisabledReason.value;
};

const forwardActionReason = () => {
  if (!props.capabilities?.canChangePortForward)
    return t("security.forwardPermissionDenied", "当前账号没有端口转发修改权限");
  if (status.value.backend !== "firewalld")
    return t("security.forwardRequiresFirewalld", "端口转发仅支持 firewalld");
  return baseActionDisabledReason.value;
};

const currentToolbarActionReason = computed(() => {
  if (activeTab.value === "auto_block") return "";
  return activeTab.value === "forward" ? forwardActionReason() : actionReason();
});

const handleCurrentChange = (page: number) => {
  pagination.currentPage = page;
  getData();
};

const handleSizeChange = (size: number) => {
  pagination.pageSize = size;
  pagination.currentPage = 1;
  getData();
};

const handleSavedPortRule = (savedRule?: Record<string, any>) => {
  portDialogVisible.value = false;
  if (!portDialogIsAdd.value && savedRule?.id) {
    const index = ruleRows.value.findIndex((item) => item.id === savedRule.id);
    if (index >= 0) ruleRows.value.splice(index, 1, savedRule as FirewallRule);
    void getFirewallInfo();
    return;
  }
  void refreshAll();
};

watch(activeTab, (tab) => {
  if (tab === "auto_block") void loadAutoConfig();
  void getData();
});

watch(
  () => softwareTaskStore.terminalRevision,
  () => {
    const taskId = installTaskId.value;
    const task = taskId ? softwareTaskStore.tasks[taskId] : undefined;
    if (
      !task ||
      !softwareTaskStore.isTerminal(task.status) ||
      refreshedTerminalTasks.has(taskId)
    )
      return;
    refreshedTerminalTasks.add(taskId);
    void refreshAll();
  },
);

onMounted(() => {
  if (props.capabilities?.canReadSecurity) {
    void refreshAll();
  }
  void softwareTaskStore.loadActive().then(() => {
    if (activeInstallTask.value)
      installTaskId.value = activeInstallTask.value.id;
  });
});
</script>

<template>
  <div class="firewall-page">
    <section class="control-card" v-loading="statusLoading">
      <div class="switch-row">
        <div class="switch-control">
          <span class="control-label">{{
            t("security.firewallSwitch", "防火墙开关")
          }}</span>
          <el-tooltip
            :content="!props.capabilities?.canToggleFirewall ? t('security.firewallToggleDenied', '当前账号没有防火墙开关权限') : !status.install ? t('security.firewallUnsupportedReason', '未检测到受支持的防火墙') : !status.canToggle || status.backend === 'iptables' ? t('security.firewallToggleUnavailable', '当前防火墙后端不支持切换状态') : ''"
            :disabled="props.capabilities?.canToggleFirewall && status.install && status.canToggle && status.backend !== 'iptables'"
          >
            <span class="disabled-action-wrapper">
              <el-switch
                v-model="status.enabled"
                :loading="firewallChanging"
                :disabled="
                  !props.capabilities?.canToggleFirewall ||
                  !status.install ||
                  !status.canToggle ||
                  status.backend === 'iptables'
                "
                @change="handleFirewallChange"
              />
            </span>
          </el-tooltip>
        </div>
        <span class="divider" />
        <div class="switch-control">
          <span class="control-label">{{
            t("security.blockPing", "禁 Ping")
          }}</span>
          <el-tooltip :content="pingDisabledReason" :disabled="!pingDisabledReason">
            <span class="disabled-action-wrapper">
              <el-switch
                v-model="status.pingBlocked"
                :loading="pingChanging"
                :disabled="Boolean(pingDisabledReason)"
                @change="handlePingChange"
              />
            </span>
          </el-tooltip>
        </div>
        <span class="divider" />
        <el-button
          :loading="cleanupLoading"
          :disabled="!canWrite"
          @click="handleCleanup"
        >{{
          t("security.cleanupCache", "清理缓存")
        }}</el-button>
        <div class="status-summary">
          <el-tag :type="status.install ? 'success' : 'danger'">
            {{ backendLabel(status.backend) }}
          </el-tag>
          <el-tag :type="status.install ? 'success' : 'info'">
            {{ status.install ? t('security.fail2ban.status.installed', '已安装') : t('security.fail2ban.status.notInstalled', '未安装') }}
          </el-tag>
          <el-tag :type="status.enabled ? 'success' : 'info'">
            {{ status.enabled ? t('security.fail2ban.status.serviceActive', '运行中') : t('security.fail2ban.status.serviceInactive', '未运行') }}
          </el-tag>
          <el-tag :type="status.panelPortProtected ? 'success' : 'warning'">
            {{
              status.panelPortProtected
                ? t("security.panelPortProtected", "面板端口 {port} 已保护", {
                    port: status.panelPort,
                  })
                : t("security.panelPortUnprotected", "面板端口 {port} 待保护", {
                    port: status.panelPort,
                  })
            }}
          </el-tag>
        </div>
      </div>
    </section>

    <section
      v-if="showInstallCard"
      class="install-card"
    >
      <div class="install-mark">FW</div>
      <div class="install-copy">
        <strong>{{
          status.repairRequired
            ? t("security.firewalldRepairRequired", "firewalld 需要修复")
            : t("security.unsupportedFirewall", "未检测到受支持的防火墙")
        }}</strong>
        <span>
          {{
            status.repairRequired
              ? t(
                  "security.firewalldRepairDescriptionShort",
                  "检测到 firewalld 配置异常，修复完成后仍保持关闭。",
                )
              : t(
                  "security.firewalldInstallDescriptionShort",
                  "OneinStack Panel 默认安装 firewalld，安装完成后由管理员手动启用。",
                )
          }}
        </span>
      </div>
      <el-button
        type="primary"
        :loading="installSubmitting"
        :disabled="!props.capabilities?.canInstall"
        @click="handleInstallFirewall"
      >
        {{ installButtonText }}
      </el-button>
    </section>

    <el-alert
      v-if="status.install && status.warning"
      class="status-warning"
      :title="status.warning"
      type="warning"
      :closable="false"
      show-icon
    />

    <el-alert
      v-if="firewallDisabledNotice"
      class="status-warning"
      :title="firewallDisabledNotice"
      :type="!canWrite ? 'info' : 'warning'"
      :closable="false"
      show-icon
    />

    <nav class="rule-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="rule-tab"
        :class="{ active: activeTab === tab.key }"
        @click="switchTab(tab.key)"
      >
        <span>{{ t(tab.labelKey, tab.fallback) }}</span>
        <strong>{{ status.counts[tab.countKey] }}</strong>
      </button>
    </nav>

    <section v-if="activeTab === 'auto_block'" class="auto-card">
      <div class="auto-heading">
        <div>
          <h3>{{ t("security.autoBlockTitle", "SSH 恶意 IP 自动封禁") }}</h3>
          <p>
            {{
              t(
                "security.autoBlockDesc",
                "统计 SSH 失败登录次数，达到阈值后生成带过期时间的防火墙拒绝规则。",
              )
            }}
          </p>
        </div>
        <el-switch
          v-model="autoConfig.enabled"
          :disabled="!canWrite || autoSaving"
          :active-text="t('common.enable', '启用')"
          :inactive-text="t('common.disable', '关闭')"
          @change="handleAutoBlockToggle"
        />
      </div>
      <div class="auto-fields">
        <label>
          <span>{{ t("security.triggerCount", "触发次数") }}</span>
          <el-input-number
            v-model="autoConfig.threshold"
            :min="3"
            :max="100"
            :disabled="!canWrite"
          />
        </label>
        <label>
          <span>{{ t("security.windowMinutes", "统计周期（分钟）") }}</span>
          <el-input-number
            v-model="autoConfig.windowMinutes"
            :min="1"
            :max="1440"
            :disabled="!canWrite"
          />
        </label>
        <label>
          <span>{{ t("security.banMinutes", "封禁时长（分钟）") }}</span>
          <el-input-number
            v-model="autoConfig.banMinutes"
            :min="5"
            :max="525600"
            :disabled="!canWrite"
          />
        </label>
        <div class="auto-actions">
          <el-tooltip :content="autoRunDisabledReason" :disabled="!autoRunDisabledReason">
            <span class="disabled-action-wrapper">
              <el-button
                :loading="autoRunning"
                :disabled="!canRunAutoBlock"
                @click="runAutoBlock"
              >
                {{ t("security.runNow", "立即检测") }}
              </el-button>
            </span>
          </el-tooltip>
          <el-button
            type="primary"
            :loading="autoSaving"
            :disabled="!canWrite || autoSaving"
            @click="saveAutoConfig"
            >{{ t("common.saveConfig", "保存配置") }}</el-button
          >
        </div>
      </div>
      <p class="last-run">
        {{
          t("security.lastRun", "上次检测：{time}", {
            time: formatLastRunAt(autoConfig.lastRunAt),
          })
        }}
      </p>
    </section>

    <section class="rules-card">
      <header class="toolbar security-toolbar">
        <div class="toolbar-actions security-toolbar__actions">
          <el-tooltip
            v-if="activeTab !== 'auto_block'"
            :content="currentToolbarActionReason"
            :disabled="!currentToolbarActionReason"
          >
            <div class="action-with-reason">
              <span class="disabled-action-wrapper">
                <el-button
                  type="primary"
                  :disabled="Boolean(currentToolbarActionReason)"
                  @click="openAddDialog"
                >
                  {{ addRuleButtonText }}
                </el-button>
              </span>
              <div
                v-if="currentToolbarActionReason"
                class="action-disabled-reason"
                role="note"
              >
                <el-icon><WarningFilled /></el-icon>
                <span>{{ currentToolbarActionReason }}</span>
              </div>
            </div>
          </el-tooltip>
          <template v-if="isRuleTab">
            <el-tooltip :content="actionReason()" :disabled="!actionReason()">
              <span class="disabled-action-wrapper">
                <el-button
                  :disabled="Boolean(actionReason()) || !canWrite"
                  @click="chooseImport"
                >{{
                  importButtonText
                }}</el-button>
              </span>
            </el-tooltip>
            <el-button v-if="props.capabilities?.canReadSecurity" @click="exportRules">{{ exportButtonText }}</el-button>
            <el-button v-if="showAutoBlockTemplateButton && props.capabilities?.canReadSecurity" @click="downloadAutoBlockTemplate">{{
              t("security.downloadBlockedIpTemplate", "下载 JSON 模板")
            }}</el-button>
          </template>
        </div>
        <search-input
          v-model="searchValue"
          class="rule-search security-toolbar__search"
          :placeholder="searchPlaceholder"
          @search="getData"
        />
      </header>

      <custom-table
        v-if="activeTab !== 'forward'"
        v-loading="tableLoading"
        :data="ruleRows"
        :columns="ruleColumns"
        :pagination="false"
        :auto-pagination="false"
        row-key="id"
        :empty-text="t('security.noRules', '暂无规则')"
        @selection-change="selectedRows = $event"
      >
        <template #direction="{ row }">{{
          directionLabel(row.direction)
        }}</template>
        <template #protocol="{ row }">{{
          row.protocol.toUpperCase()
        }}</template>
        <template #ports="{ row }">{{
          row.protocol === "icmp"
            ? "—"
            : row.ports || t("security.allPorts", "全部")
        }}</template>
        <template #sourceTarget="{ row }">{{
          row.ips === "0.0.0.0/0" ? t("security.allIpv4", "全部 IPv4") : row.ips
        }}</template>
        <template #location="{ row }">{{
          row.location || t("common.unknown", "未知")
        }}</template>
        <template #strategy="{ row }">
          <el-tag
            :type="row.strategy === 'allow' ? 'success' : 'danger'"
          >
            {{ strategyLabel(row.strategy) }}
          </el-tag>
        </template>
        <template #state="{ row }">
          <el-tooltip :content="actionReason(row)" :disabled="!actionReason(row)">
            <span class="disabled-action-wrapper">
              <el-switch
                :model-value="row.state === 1"
                :disabled="Boolean(actionReason(row))"
                @change="setRuleState(row, Boolean($event))"
              />
            </span>
          </el-tooltip>
        </template>
        <template #remark="{ row }">
          {{ row.remark || "—" }}
          <el-tag
            v-if="row.protected"
            size="small"
            type="warning"
            class="protected-tag"
            >{{ t("security.systemProtected", "系统保护") }}</el-tag
          >
        </template>
        <template #createdAt="{ row }">{{
          formatTime(row.create_time)
        }}</template>
        <template #expiresAt="{ row }">{{
          formatTime(row.expiresAt)
        }}</template>
        <template #actionColumn="{ row }">
          <div class="table-row-actions">
            <el-button
              link
              type="primary"
              :icon="EditPen"
              :disabled="Boolean(actionReason(row))"
              @click="editRule(row)"
              >{{ t("common.edit", "编辑") }}</el-button
            >
            <el-button
              link
              type="danger"
              :icon="Delete"
              :disabled="Boolean(actionReason(row))"
              @click="deleteRule(row)"
              >{{ t("common.delete", "删除") }}</el-button
            >
          </div>
        </template>
      </custom-table>

      <custom-table
        v-else
        v-loading="tableLoading"
        :data="forwardRows"
        :columns="forwardColumns"
        :pagination="false"
        :auto-pagination="false"
        row-key="id"
        :empty-text="t('security.noPortForwards', '暂无端口转发')"
      >
        <template #protocol="{ row }">{{
          row.protocol.toUpperCase()
        }}</template>
        <template #forwardTarget="{ row }"
          >{{ row.destinationIp }}:{{ row.destinationPort }}</template
        >
        <template #state="{ row }">
          <el-tooltip :content="forwardActionReason()" :disabled="!forwardActionReason()">
            <span class="disabled-action-wrapper">
              <el-switch
                :model-value="row.state === 1"
                :disabled="Boolean(forwardActionReason())"
                @change="setForwardState(row, Boolean($event))"
              />
            </span>
          </el-tooltip>
        </template>
        <template #remark="{ row }">{{ row.remark || "—" }}</template>
        <template #createdAt="{ row }">{{
          formatTime(row.create_time)
        }}</template>
        <template #actionColumn="{ row }">
          <div class="table-row-actions">
            <el-button
              link
              type="primary"
              :icon="EditPen"
              :disabled="Boolean(forwardActionReason())"
              @click="editForward(row)"
              >{{ t("common.edit", "编辑") }}</el-button
            >
            <el-button
              link
              type="danger"
              :icon="Delete"
              :disabled="Boolean(forwardActionReason())"
              @click="deleteForward(row)"
              >{{ t("common.delete", "删除") }}</el-button
            >
          </div>
        </template>
      </custom-table>

      <footer class="table-footer">
        <div v-if="isRuleTab" class="batch-bar">
          <el-select
            v-model="batchAction"
            :placeholder="t('security.batchPlaceholder', '请选择批量操作')"
            clearable
          >
            <el-option
              :label="t('security.enableRule', '启用规则')"
              value="enable"
            />
            <el-option
              :label="t('security.disableRule', '停用规则')"
              value="disable"
            />
            <el-option
              :label="t('security.deleteRule', '删除规则')"
              value="delete"
            />
          </el-select>
          <el-tooltip :content="actionReason()" :disabled="!actionReason()">
            <span class="disabled-action-wrapper">
              <el-button
                type="primary"
                plain
                :disabled="!batchAction || !selectedRows.length || Boolean(actionReason())"
                @click="handleBatch"
              >
                {{ t("security.batchAction", "批量操作") }}
              </el-button>
            </span>
          </el-tooltip>
          <span v-if="selectedRows.length">{{
            t("security.selectedCount", "已选择 {count} 条", {
              count: selectedRows.length,
            })
          }}</span>
        </div>
        <span v-else />
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @current-change="handleCurrentChange"
          @size-change="handleSizeChange"
        />
      </footer>
    </section>

    <input
      ref="importInput"
      class="file-input"
      type="file"
      accept="application/json,.json"
      @change="importRules"
    />

    <Addfirewall
      v-if="portDialogVisible"
      v-model="portDialogVisible"
      :type="portDialogIsAdd"
      :form-data="currentPortRule"
      :panel-port="status.panelPort"
      @saved="handleSavedPortRule"
    />

    <el-dialog
      v-model="ipDialogVisible"
      width="600px"
      :close-on-click-modal="false"
      :title="ipDialogTitle"
    >
      <el-form label-position="top" class="dialog-form">
        <el-form-item
          :label="
            activeTab === 'region'
              ? t('security.ipv4CidrRange', 'IPv4 / CIDR 网段')
              : t('security.ipCidrRange', 'IP 地址 / CIDR 网段')
          "
          required
        >
          <el-input
            v-model="ipForm.ips"
            type="textarea"
            :rows="4"
            :placeholder="
              t(
                'security.ipTextareaPlaceholder',
                '每行一个地址，例如：\n192.168.1.20\n10.0.0.0/24',
              )
            "
          />
        </el-form-item>
        <el-form-item
          v-if="activeTab === 'region'"
          :label="t('security.regionName', '地区名称')"
          required
        >
          <el-input
            v-model="ipForm.location"
            :placeholder="
              t('security.regionPlaceholder', '例如：中国大陆 / 北京')
            "
          />
        </el-form-item>
        <el-form-item :label="t('security.accessPolicy', '访问策略')">
          <el-radio-group v-model="ipForm.strategy">
            <el-radio-button value="allow">{{
              t("security.allow", "放行")
            }}</el-radio-button>
            <el-radio-button value="deny">{{
              t("security.reject", "拒绝")
            }}</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="t('security.expiresAt', '过期时间')">
          <el-date-picker
            v-model="ipForm.expiresAt"
            type="datetime"
            class="full-width"
            :placeholder="
              t('security.noExpirePlaceholder', '不设置表示永久有效')
            "
          />
        </el-form-item>
        <el-form-item :label="t('security.remark', '备注')">
          <el-input
            v-model="ipForm.remark"
            maxlength="200"
            show-word-limit
            :placeholder="t('common.optional', '可选')"
          />
        </el-form-item>
        <el-form-item :label="t('security.ruleStatus', '规则状态')">
          <el-switch
            v-model="ipForm.enabled"
            :active-text="t('security.enableImmediately', '立即启用')"
          />
        </el-form-item>
        <el-alert
          :title="
            t(
              'security.blockAllWarning',
              '为避免服务器失联，不允许添加拒绝全部 IPv4 入站流量的规则。',
            )
          "
          type="warning"
          :closable="false"
          show-icon
        />
      </el-form>
      <template #footer>
        <el-button @click="ipDialogVisible = false">{{
          t("common.cancel", "取消")
        }}</el-button>
        <el-button
          type="primary"
          :loading="ipSubmitting"
          :disabled="!canWrite"
          @click="saveIPRule"
        >{{
          t("security.saveRule", "保存规则")
        }}</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="forwardDialogVisible"
      width="560px"
      :close-on-click-modal="false"
      :title="forwardDialogTitle"
    >
      <el-form label-position="top" class="dialog-form">
        <div class="form-grid">
          <el-form-item :label="t('security.protocol', '协议')">
            <el-select v-model="forwardForm.protocol" class="full-width">
              <el-option label="TCP" value="tcp" />
              <el-option label="UDP" value="udp" />
            </el-select>
          </el-form-item>
          <el-form-item :label="t('security.sourcePort', '源端口')" required>
            <el-input-number
              v-model="forwardForm.sourcePort"
              :min="1"
              :max="65535"
              class="full-width"
            />
          </el-form-item>
        </div>
        <div class="form-grid">
          <el-form-item
            :label="t('security.destinationIpv4', '目标 IPv4')"
            required
          >
            <el-input
              v-model="forwardForm.destinationIp"
              placeholder="192.168.1.10"
            />
          </el-form-item>
          <el-form-item
            :label="t('security.destinationPort', '目标端口')"
            required
          >
            <el-input-number
              v-model="forwardForm.destinationPort"
              :min="1"
              :max="65535"
              class="full-width"
            />
          </el-form-item>
        </div>
        <el-form-item :label="t('security.remark', '备注')">
          <el-input
            v-model="forwardForm.remark"
            maxlength="200"
            show-word-limit
            :placeholder="t('common.optional', '可选')"
          />
        </el-form-item>
        <el-form-item :label="t('security.ruleStatus', '规则状态')">
          <el-switch
            v-model="forwardForm.enabled"
            :active-text="t('security.enableImmediately', '立即启用')"
          />
        </el-form-item>
        <el-alert
          :title="
            t(
              'security.forwardPanelPortWarning',
              '端口转发当前由 firewalld 提供，不能占用面板管理端口。',
            )
          "
          type="info"
          :closable="false"
          show-icon
        />
      </el-form>
      <template #footer>
        <el-button @click="forwardDialogVisible = false">{{
          t("common.cancel", "取消")
        }}</el-button>
        <el-button
          type="primary"
          :loading="forwardSubmitting"
          :disabled="!canWrite"
          @click="saveForward"
          >{{ t("security.saveForward", "保存转发") }}</el-button
        >
      </template>
    </el-dialog>

    <InstallTaskDrawer v-model="installTaskVisible" :task-id="installTaskId" />
  </div>
</template>

<style scoped lang="less">
.firewall-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.control-card,
.rules-card,
.auto-card {
  border: 1px solid var(--border-color);
  border-radius: 16px;
  background: var(--surface-card);
  box-shadow: var(--shadow-card);
}

.control-card {
  padding: 18px 22px;
}

.switch-row,
.switch-control,
.status-summary,
.toolbar,
.toolbar-actions,
.table-footer,
.batch-bar,
.auto-heading,
.auto-actions {
  display: flex;
  align-items: center;
}

.switch-row {
  gap: 22px;
}

.switch-control {
  gap: 12px;
}

.control-label {
  color: var(--text-primary);
  font-weight: 600;
  white-space: nowrap;
}

.divider {
  width: 1px;
  height: 28px;
  background: var(--border-color);
}

.status-summary {
  margin-left: auto;
  gap: 8px;
}

.status-warning {
  border-radius: 12px;
}

.install-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  border: 1px solid rgba(var(--primary-color), 0.2);
  border-radius: 14px;
  background: rgba(var(--primary-color), 0.05);
}

.install-mark {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  flex: 0 0 44px;
  border-radius: 12px;
  color: rgb(var(--primary-color));
  background: rgba(var(--primary-color), 0.12);
  font-weight: 800;
}

.install-copy {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;

  strong {
    color: var(--text-primary);
    font-size: 15px;
  }

  span {
    color: var(--text-secondary);
    font-size: 13px;
  }
}

.rule-tabs {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-radius: 14px;
  background: var(--surface-card);
}

.rule-tab {
  min-height: 62px;
  padding: 12px 16px;
  border: 0;
  border-right: 1px solid var(--border-color);
  color: var(--text-secondary);
  background: transparent;
  cursor: pointer;
  transition:
    background 0.2s,
    color 0.2s;

  &:last-child {
    border-right: 0;
  }

  span,
  strong {
    display: inline-block;
  }

  strong {
    margin-left: 7px;
    color: var(--text-primary);
  }

  &.active {
    color: rgb(var(--primary-color));
    background: rgba(var(--primary-color), 0.08);
    box-shadow: inset 0 -2px 0 rgb(var(--primary-color));

    strong {
      color: rgb(var(--primary-color));
    }
  }
}

.rules-card {
  overflow: hidden;
}

.toolbar {
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--border-color);
}

.toolbar-actions {
  gap: 10px;
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

.rule-search {
  width: min(360px, 38vw);
}

.table-footer {
  min-height: 72px;
  justify-content: space-between;
  gap: 20px;
  padding: 14px 20px;
  border-top: 1px solid var(--border-color);
}

.batch-bar {
  gap: 10px;

  .el-select {
    width: 190px;
  }

  span {
    color: var(--text-secondary);
    font-size: 13px;
  }
}

.protected-tag {
  margin-left: 7px;
}

.auto-card {
  padding: 22px;
}

.auto-heading {
  justify-content: space-between;
  gap: 20px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--border-color);

  h3 {
    margin: 0 0 6px;
    color: var(--text-primary);
    font-size: 17px;
  }

  p {
    margin: 0;
    color: var(--text-secondary);
    font-size: 13px;
  }
}

.auto-fields {
  display: grid;
  grid-template-columns: repeat(3, minmax(160px, 1fr)) auto;
  gap: 18px;
  align-items: end;
  padding-top: 18px;

  label {
    display: flex;
    flex-direction: column;
    gap: 8px;
    color: var(--text-secondary);
    font-size: 13px;
  }

  .el-input-number {
    width: 100%;
  }
}

.auto-actions {
  gap: 10px;
}

.last-run {
  margin: 14px 0 0;
  color: var(--text-secondary);
  font-size: 12px;
}

.dialog-form {
  padding: 4px 4px 0;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.full-width {
  width: 100%;
}

.file-input {
  display: none;
}

.security-toolbar {
  flex-wrap: wrap;
}

.security-toolbar__actions {
  flex-wrap: wrap;
  min-width: 0;
}

.security-toolbar__search {
  min-width: 0;
}

:deep(.el-table th.el-table__cell) {
  height: 50px;
  color: var(--text-secondary);
  background: var(--surface-muted);
  font-weight: 600;
}

:deep(.el-table td.el-table__cell) {
  padding: 14px 0;
}

@media (max-width: 1100px) {
  .rule-tabs {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .rule-tab {
    border-bottom: 1px solid var(--border-color);
  }

  .auto-fields {
    grid-template-columns: repeat(2, minmax(160px, 1fr));
  }
}

@media (max-width: 760px) {
  .switch-row,
  .toolbar,
  .table-footer,
  .auto-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .switch-row {
    gap: 14px;
  }

  .divider {
    width: 100%;
    height: 1px;
  }

  .status-summary {
    margin-left: 0;
  }

  .rule-tabs,
  .auto-fields,
  .form-grid {
    grid-template-columns: 1fr;
  }

  .rule-search {
    width: 100%;
  }

  .batch-bar {
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  .security-toolbar,
  .security-toolbar__actions,
  .security-toolbar__search {
    width: 100%;
  }

  .security-toolbar__search {
    flex: 1 1 100%;
  }

  .toolbar-actions :deep(.el-button),
  .auto-actions :deep(.el-button) {
    flex: 1 1 auto;
  }
}
</style>
