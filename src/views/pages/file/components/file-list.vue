<script setup lang="ts">
import { Api } from "@/api/modules";
import CustomDialog from "@/components/custom-dialog.vue";
import CustomDrawer from "@/components/custom-drawer.vue";
import CustomTable from "@/components/custom-table.vue";
import { useConfigStore } from "@/stores/modules/config";
import sutil from "@/utils/sutil";
import {
  Refresh,
  Search,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Delete,
  CopyDocument,
  Scissor,
  EditPen,
  Lock,
  Files,
  MoreFilled,
  FolderOpened,
  Operation,
  Star,
  Share,
  InfoFilled,
  Download,
  PictureFilled,
  View,
  Grid,
  List,
  UploadFilled,
  FolderAdd,
  Monitor,
  Tickets,
  Folder,
  Document,
  Bell,
} from "@element-plus/icons-vue";
import {
  ElMessage,
  ElMessageBox,
  FormInstance,
  UploadFile,
  UploadInstance,
} from "element-plus";
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  useTemplateRef,
} from "vue";
import type { DrawerType, DrawerOpenType } from "../index.vue";
import System from "@/utils/System";
import { formatBytes } from "@/utils/fileSize";
import FileSearchDialog from "./FileSearchDialog.vue";
import FileOperationDrawer from "./FileOperationDrawer.vue";
import FileEditorDrawer from "./FileEditorDrawer.vue";
import i18n from "@/lang";
import { hasTerminalAccess } from "@/utils/access";
import { HttpRequestError } from "@/api";

const sconfig = useConfigStore()

interface Emits {
  (e: "update:path", value: string[]): void;
  (
    e: "open-drawer",
    openType: DrawerOpenType,
    type: DrawerType,
    row?: any,
  ): void;
  (e: "open-trash"): void;
}

const emit = defineEmits<Emits>();

type ClipboardMode = "" | "copy" | "move";
type RowInlineActionKey =
  | "open"
  | "copy"
  | "cut"
  | "rename"
  | "tree";
type FavoriteItem = {
  id?: number;
  path: string;
  name: string;
  isDir: boolean;
  isMissing?: boolean;
};
type FilePermission =
  | "archive"
  | "create"
  | "delete"
  | "edit"
  | "modify"
  | "move"
  | "read"
  | "share";
type FileTaskOperation = "archive" | "extract";

const t = (key: string, fallback?: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params);
  return value && value !== key ? value : fallback || key;
};
const filePermissionLabel = (permission: FilePermission) =>
  t(`file.permissionLabels.${permission}`, permission);
const canFilePermission = (permission: FilePermission) =>
  sconfig.hasScopeAccess("file", permission);
const requireFilePermission = (permission: FilePermission) => {
  if (canFilePermission(permission)) return true;
  ElMessage.warning(
    t(
      "file.noPermission",
      "This account does not have file {permission} permission",
      { permission: filePermissionLabel(permission) },
    ),
  );
  return false;
};
const imageExtensionPattern = /\.(avif|bmp|gif|ico|jpe?g|png|webp)$/i;
const archiveExtensionPattern = /\.(7z|bz2|gz|rar|tar|tgz|xz|zip)$/i;
const archiveSuffixPatterns: RegExp[] = [
  /\.tar\.gz$/i,
  /\.tar\.bz2$/i,
  /\.tar\.xz$/i,
  /\.tar\.zst$/i,
  /\.tar\.zstd$/i,
  /\.tgz$/i,
  /\.tbz2$/i,
  /\.tbz$/i,
  /\.txz$/i,
  /\.tzst$/i,
  /\.zip$/i,
  /\.tar$/i,
  /\.gz$/i,
  /\.bz2$/i,
  /\.xz$/i,
  /\.zst$/i,
  /\.zstd$/i,
  /\.rar$/i,
  /\.7z$/i,
];
const currentPath = () => conf.path.join("/").replace(/\/\//g, "/");
const normalizeBool = (value: any) =>
  value === true || value === 1 || value === "1" || value === "true";
const joinVirtualPath = (dir: string, name: string) =>
  `${dir === "/" ? "" : dir}/${name}`;
const toCopyName = (name: string) => {
  const dotIndex = name.lastIndexOf(".");
  if (dotIndex <= 0) return `${name}-copy`;
  return `${name.slice(0, dotIndex)}-copy${name.slice(dotIndex)}`;
};
const parentPath = (path: string) => {
  const clean = path.replace(/\/+$/, "");
  const index = clean.lastIndexOf("/");
  return index <= 0 ? "/" : clean.slice(0, index);
};
const normalizeVirtualPath = (path: string) => {
  const normalized = `/${String(path || "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+/g, "/")}`;
  return normalized.length > 1 ? normalized.replace(/\/+$/, "") : "/";
};
const protectedSystemRoots = ["/boot", "/dev", "/etc", "/proc", "/sys", "/usr"];
const isProtectedSystemPath = (path?: string) => {
  const normalized = normalizeVirtualPath(path || "/");
  return protectedSystemRoots.some(
    (root) => normalized === root || normalized.startsWith(`${root}/`),
  );
};
const isRootLevelPath = (path?: string) =>
  parentPath(normalizeVirtualPath(path || "/")) === "/";
const isHighRiskRootPath = (path?: string) =>
  isRootLevelPath(path) && !isProtectedSystemPath(path);
const isProtectedMutationPath = (path?: string) =>
  isProtectedSystemPath(path);
const protectedActionLabel = (action: "delete" | "rename" | "move") =>
  action === "delete"
    ? t("file.delete", "Delete")
    : action === "rename"
      ? t("file.rename", "Rename")
      : t("file.cut", "Cut");
const ensurePathMutationAllowed = async (
  row: any,
  action: "delete" | "rename" | "move",
) => {
  const path = normalizeVirtualPath(row?.path || "");
  if (!path || path === "/") return false;
  if (isProtectedMutationPath(path)) {
    const message =
      action === "delete"
        ? t(
            "file.protectedDeleteConfirm",
            "Deleting item {path} inside a protected system directory may break boot, device, service, or package management behavior. Confirm you have created a snapshot or backup before continuing.",
            { path },
          )
        : action === "rename"
          ? t(
              "file.protectedRenameConfirm",
              "Renaming item {path} inside a protected system directory may break boot, device, service, or package management behavior. Confirm you have created a snapshot or backup before continuing.",
              { path },
            )
          : t(
              "file.protectedCutConfirm",
              "Cutting or moving item {path} inside a protected system directory may break boot, device, service, or package management behavior. Confirm you have created a snapshot or backup before continuing.",
              { path },
            );
    try {
      await ElMessageBox.confirm(
        message,
        t("file.protectedActionTitle", "Protected system directory operation"),
        {
          type: "warning",
          confirmButtonText: t("file.confirmHighRiskContinue", "Continue"),
          cancelButtonText: t("common.cancel", "Cancel"),
        },
      );
      return true;
    } catch {
      return false;
    }
  }
  if (isHighRiskRootPath(path)) {
    const message =
      action === "delete"
        ? t(
            "file.highRiskDeleteConfirm",
            "Deleting root-level item {path} is high risk and may directly affect running services or data. Confirm you have created a snapshot or backup before continuing.",
            { path },
          )
        : action === "rename"
          ? t(
              "file.highRiskRenameConfirm",
              "Renaming root-level item {path} is high risk and may break service paths or startup configuration. Confirm you have created a snapshot or backup before continuing.",
              { path },
            )
          : t(
              "file.highRiskCutConfirm",
              "Cutting or moving root-level item {path} is high risk and may directly affect running services or mounted data. Confirm you have created a snapshot or backup before continuing.",
              { path },
            );
    try {
      await ElMessageBox.confirm(
        message,
        t("file.highRiskActionTitle", "High-risk root directory operation"),
        {
          type: "warning",
          confirmButtonText: t("file.confirmHighRiskContinue", "Continue"),
          cancelButtonText: t("common.cancel", "Cancel"),
        },
      );
      return true;
    } catch {
      return false;
    }
  }
  return true;
};
const releasePreviewUrl = () => {
  if (!conf.imagePreview.url?.startsWith("blob:")) return;
  URL.revokeObjectURL(conf.imagePreview.url);
};
const downloadVirtualFile = async (path: string, fallbackName: string) => {
  await Api.downloadFile({ path, filename: fallbackName });
};
const loadImagePreviewUrl = async (path: string) => {
  const { blob, contentType } = await Api.getFileBlob(
    path,
    "image/*,application/octet-stream",
  );
  if (!(contentType || blob.type).startsWith("image/")) {
    throw new Error(
      t(
        "file.unsupportedImageFormat",
        "The current file is not a supported image format",
      ),
    );
  }
  return URL.createObjectURL(blob);
};

const fileTypeLabel = (row: any) => {
  if (row?.isSymlink)
    return row?.isDir
      ? t("file.typeLabels.directorySymlink", "目录链接")
      : t("file.typeLabels.fileSymlink", "文件链接");
  if (row?.isDir) return t("file.folder", "文件夹");
  if (imageExtensionPattern.test(row?.name || ""))
    return t("file.typeLabels.image", "图片");
  if (isArchiveFile(row))
    return t("file.typeLabels.archive", "压缩包");
  const extension = String(row?.name || "")
    .split(".")
    .pop();
  return extension && extension !== row?.name
    ? extension.toUpperCase()
    : t("file.file", "文件");
};

const isArchiveFile = (row: any) => normalizeBool(row?.isArchive) || archiveExtensionPattern.test(row?.name || "");
const canExtractRow = (row: any) => canFilePermission("archive") && normalizeBool(row?.canExtract);
const archiveFormatLabel = (row: any) => String(row?.archiveFormat || "").trim() || (isArchiveFile(row) ? t("file.archive", "压缩") : "—");
const getArchiveFormatHint = (row: any) => {
  const format = String(row?.archiveFormat || "").trim().toLowerCase();
  if (canExtractRow(row)) return t("file.extract", "解压");
  if (!isArchiveFile(row)) return "";
  if (["rar", "7z"].includes(format)) {
    return t(
      "file.archiveExtractUnsupported",
      "分卷压缩暂不支持解压",
    );
  }
  return t("file.extractUnsupported", "当前压缩文件暂不支持解压");
};
const stripArchiveSuffix = (name: string) => {
  const trimmed = String(name || "").trim();
  for (const pattern of archiveSuffixPatterns) {
    if (pattern.test(trimmed)) return trimmed.replace(pattern, "");
  }
  return trimmed;
};
const defaultExtractTarget = (path?: string) => {
  const source = normalizeVirtualPath(path || "");
  if (!source || source === "/") return "/";
  const dir = parentPath(source);
  const fileName = source.split("/").filter(Boolean).pop() || "";
  const targetName = stripArchiveSuffix(fileName) || fileName;
  return targetName ? joinVirtualPath(dir, targetName) : dir;
};

type ArchiveTaskStatus = "queued" | "running" | "succeeded" | "failed";

interface ArchiveTask {
  id: string;
  operation?: FileTaskOperation;
  sourcePath: string;
  targetDir: string;
  archiveName: string;
  archiveFormat?: string;
  overwrite?: boolean;
  resultPath?: string;
  status: ArchiveTaskStatus;
  message: string;
  totalBytes: number;
  processedBytes: number;
  progress: number;
  currentPath?: string;
  entries?: number;
  bytes?: number;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  statusUrl?: string;
}

const archiveTaskPollTimers = new Map<string, number>();
const archiveTaskRetryDelays = new Map<string, number>();
const archiveTaskNotified = new Set<string>();
const archiveTaskTerminalStatuses = new Set<ArchiveTaskStatus>([
  "succeeded",
  "failed",
]);
const archiveTaskStatusTagType: Record<
  ArchiveTaskStatus,
  "info" | "warning" | "success" | "danger"
> = {
  queued: "info",
  running: "warning",
  succeeded: "success",
  failed: "danger",
};

const archiveTaskStatusLabel = (status: ArchiveTaskStatus) =>
  status === "queued"
    ? t("file.archiveTaskStatusQueued", "Queued")
    : status === "running"
      ? t("file.archiveTaskStatusRunning", "Compressing")
      : status === "succeeded"
        ? t("file.archiveTaskStatusSucceeded", "Succeeded")
        : t("file.archiveTaskStatusFailed", "Failed");
const taskOperationLabel = (operation?: FileTaskOperation) =>
  operation === "extract"
    ? t("file.extract", "Extract")
    : t("file.archive", "Archive");
const taskDisplayName = (task: ArchiveTask) =>
  task.operation === "extract"
    ? archiveTaskFileName(task.sourcePath) || task.archiveName || t("file.extract", "Extract")
    : task.archiveName || archiveTaskFileName(task.sourcePath) || t("file.archive", "Archive");
const taskProgressHint = (task: ArchiveTask) => {
  if (task.status === "queued")
    return t(
      "file.archiveTaskQueuedHint",
      "Waiting for another archive task to finish",
    );
  if (task.status === "running" && task.totalBytes <= 0) {
    return task.operation === "extract"
      ? t("file.extractTaskPackingHint", "Preparing extracted contents")
      : t("file.archiveTaskPackingHint", "Preparing archive contents");
  }
  if (task.status === "failed") {
    return t("file.archiveTaskFailedAt", "Failed at {progress}%", {
      progress: Math.max(0, Math.min(100, Math.round(task.progress || 0))),
    });
  }
  return `${Math.max(0, Math.min(100, Math.round(task.progress || 0)))}%`;
};
const taskFinishedMessage = (task: ArchiveTask) =>
  task.operation === "extract"
    ? t("file.extractTaskFinishedSimple", "Extract ready")
    : t("file.archiveTaskFinishedSimple", "Archive ready");
const taskFailedMessage = (task: ArchiveTask) =>
  task.operation === "extract"
    ? t("file.extractTaskFailed", "Failed to extract")
    : t("file.archiveTaskFailed", "Failed to create archive");
const taskSubmittedMessage = (task: ArchiveTask) =>
  task.operation === "extract"
    ? t("file.extractTaskSubmitted", "Extract task submitted")
    : t("file.archiveTaskSubmitted", "Archive task submitted");
const taskCompletedMessage = (task: ArchiveTask) =>
  task.operation === "extract"
    ? t("file.extractTaskFinished", "Archive {name} has been extracted", {
        name: taskDisplayName(task),
      })
    : t("file.archiveTaskFinished", "Archive {name} is ready", {
        name: taskDisplayName(task),
      });
const archiveTaskProgressText = (task: ArchiveTask) => {
  return taskProgressHint(task);
};
const formatArchiveTaskTime = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(i18n.locale === "en-US" ? "en-US" : "zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
};
const archiveTaskFileName = (path?: string) =>
  String(path || "")
    .split("/")
    .filter(Boolean)
    .pop() || "";
const normalizeArchiveTask = (raw: any): ArchiveTask => ({
  id: String(raw?.id || raw?.taskId || ""),
  operation: raw?.operation === "extract" ? "extract" : "archive",
  sourcePath: String(raw?.sourcePath || raw?.path || ""),
  targetDir: String(raw?.targetDir || "/"),
  archiveName: String(raw?.archiveName || ""),
  archiveFormat: raw?.archiveFormat ? String(raw.archiveFormat) : undefined,
  overwrite: raw?.overwrite === undefined ? undefined : normalizeBool(raw.overwrite),
  resultPath: raw?.resultPath ? String(raw.resultPath) : undefined,
  status: (raw?.status || "queued") as ArchiveTaskStatus,
  message: String(raw?.message || ""),
  totalBytes: Number(raw?.totalBytes || 0),
  processedBytes: Number(raw?.processedBytes || 0),
  progress: Number(raw?.progress || 0),
  currentPath: raw?.currentPath ? String(raw.currentPath) : undefined,
  entries: raw?.entries === undefined ? undefined : Number(raw.entries),
  bytes: raw?.bytes === undefined ? undefined : Number(raw.bytes),
  createdAt: String(raw?.createdAt || new Date().toISOString()),
  startedAt: raw?.startedAt ? String(raw.startedAt) : undefined,
  finishedAt: raw?.finishedAt ? String(raw.finishedAt) : undefined,
  statusUrl: raw?.statusUrl ? String(raw.statusUrl) : undefined,
});

const conf = reactive({
  tipPaste: "",
  path: ["/"],
  quickFilter: "",
  viewMode: "list" as "list" | "grid",
  searchVisible: false,
  operationsVisible: false,
  editorVisible: false,
  editorPath: "",
  editorDetail: null as any,
  editorLoadingPath: "",
  archiveTasksVisible: false,
  archiveTasksLoading: false,
  archiveTasks: {} as Record<string, ArchiveTask>,
  archiveTaskOrder: [] as string[],
  imagePreview: {
    show: false,
    row: null as any,
    url: "",
    loading: false,
    error: false,
    open: async (row: any) => {
      if (!requireFilePermission("read")) return;
      conf.imagePreview.row = row;
      conf.imagePreview.error = false;
      conf.imagePreview.loading = true;
      conf.imagePreview.show = true;
      try {
        releasePreviewUrl();
        conf.imagePreview.url = await loadImagePreviewUrl(row.path);
      } catch {
        conf.imagePreview.loading = false;
        conf.imagePreview.error = true;
      }
    },
    close: () => {
      releasePreviewUrl();
      conf.imagePreview.show = false;
      conf.imagePreview.loading = false;
      conf.imagePreview.error = false;
      conf.imagePreview.url = "";
      conf.imagePreview.row = null;
    },
  },
  columns: computed(() => [
    {
      prop: "name",
      label: t("file.columns.name", "File name"),
      minWidth: "270",
      sortable: true,
    },
    { prop: "type", label: t("file.columns.type", "Type"), width: "110" },
    {
      prop: "identity",
      label: t("file.columns.identity", "Permissions / Owner"),
      width: "150",
    },
    {
      prop: "size",
      label: t("file.columns.size", "Size"),
      width: "110",
      sortable: true,
    },
    {
      prop: "modTime",
      label: t("file.columns.modTime", "Modified time"),
      width: "170",
      sortable: true,
    },
    {
      prop: "action",
      label: t("file.columns.action", "Actions"),
      width: "400",
      fixed: "right" as const,
    },
  ]),
  fileList: [] as any[],
  clipboard: {
    mode: "" as ClipboardMode,
    source: null as any,
  },
  copyDialog: {
    show: false,
    overwrite: false,
    targetPath: "",
    open: () => {
      if (!conf.clipboard.source) return;
      conf.copyDialog.overwrite = false;
      conf.copyDialog.targetPath = joinVirtualPath(
        currentPath(),
        toCopyName(conf.clipboard.source.name),
      );
      conf.copyDialog.show = true;
    },
    close: () => {
      conf.copyDialog.show = false;
      conf.copyDialog.overwrite = false;
      conf.copyDialog.targetPath = "";
    },
    confirm: async () => {
      if (!conf.clipboard.source || conf.clipboard.mode !== "copy") return;
      if (!canCopyFile()) {
        requireFilePermission(canFilePermission("read") ? "create" : "read");
        return;
      }
      await Api.copyFile({
        sourcePath: conf.clipboard.source.path,
        targetPath: conf.copyDialog.targetPath,
        overwrite: conf.copyDialog.overwrite,
      });
      ElMessage.success(t("file.copyDone", "Copied"));
      conf.copyDialog.close();
      conf.refresh();
    },
  },
  favorites: [] as FavoriteItem[],
  favoritesLoading: false,
  capacity: null as any,
  rootPath: "/",
  loading: false,
  getCapacity: async () => {
    const { data } = await Api.getFileCapacity();
    conf.capacity = data.capacity;
    conf.rootPath = data.rootPath || "/";
  },
  getFileList: async (refresh = false) => {
    if (!refresh) emit("update:path", conf.path);
    const path = currentPath();
    conf.loading = true;
    let failed = false;
    try {
      const { data: res } = await Api.getFileList({ path });
      conf.fileList = res.files ?? [];
    } catch {
      failed = true;
    } finally {
      conf.loading = false;
    }
    if (failed) conf.handleBackLevel();
  },
  refresh: () => {
    conf.getFileList(true);
    conf.getCapacity();
  },
  upsertArchiveTask: (task: ArchiveTask) => {
    if (!task.id) return;
    const current = conf.archiveTasks[task.id];
    conf.archiveTasks[task.id] = current ? { ...current, ...task } : task;
    conf.archiveTaskOrder = [
      task.id,
      ...conf.archiveTaskOrder.filter((id) => id !== task.id),
    ];
  },
  removeArchiveTask: (taskId: string) => {
    delete conf.archiveTasks[taskId];
    conf.archiveTaskOrder = conf.archiveTaskOrder.filter((id) => id !== taskId);
    const timer = archiveTaskPollTimers.get(taskId);
    if (timer) window.clearTimeout(timer);
    archiveTaskPollTimers.delete(taskId);
    archiveTaskRetryDelays.delete(taskId);
    archiveTaskNotified.delete(taskId);
  },
  scheduleArchiveTaskPoll: (taskId: string, delay: number) => {
    const currentTimer = archiveTaskPollTimers.get(taskId);
    if (currentTimer) window.clearTimeout(currentTimer);
    archiveTaskPollTimers.set(
      taskId,
      window.setTimeout(() => {
        archiveTaskPollTimers.delete(taskId);
        void conf.pollArchiveTask(taskId);
      }, delay),
    );
  },
  locateArchiveResult: (task: ArchiveTask) => {
    const targetDir = normalizeVirtualPath(task.targetDir || "/");
    const resultName =
      archiveTaskFileName(task.resultPath) ||
      archiveTaskFileName(task.sourcePath) ||
      task.archiveName ||
      "";
    conf.quickFilter = resultName;
    if (currentPath() === targetDir) {
      conf.refresh();
      return;
    }
    conf.handleNavigate(targetDir);
  },
  locateTaskResult: (task: ArchiveTask) => {
    conf.locateArchiveResult(task);
  },
  retryArchiveTask: async (task: ArchiveTask) => {
    if (!task.sourcePath || !task.targetDir) return;
    const { data } =
      task.operation === "extract"
        ? await Api.extractFile(
            {
              path: task.sourcePath,
              targetDir: task.targetDir,
              overwrite: task.overwrite,
            },
            { timeout: 10000 },
          )
        : await Api.archiveFile(
            {
              path: task.sourcePath,
              targetDir: task.targetDir,
              archiveName: task.archiveName,
            },
            { timeout: 10000 },
          );
    const created = normalizeArchiveTask({
      ...task,
      ...data,
      id: data?.taskId || data?.id,
      operation: task.operation || data?.operation || "archive",
      status: data?.status || "queued",
      statusUrl: data?.statusUrl,
      progress: 0,
      processedBytes: 0,
      totalBytes: 0,
      resultPath: undefined,
      currentPath: undefined,
      message: taskSubmittedMessage({
        ...task,
        operation: task.operation || "archive",
      }),
      createdAt: new Date().toISOString(),
      startedAt: undefined,
      finishedAt: undefined,
      entries: undefined,
      bytes: undefined,
    });
    conf.upsertArchiveTask(created);
    conf.archiveTasksVisible = true;
    archiveTaskNotified.delete(created.id);
    ElMessage.success(
      taskSubmittedMessage({
        ...task,
        operation: task.operation || "archive",
      }),
    );
    conf.scheduleArchiveTaskPoll(created.id, 1200);
  },
  handleArchiveTaskUpdate: (task: ArchiveTask, previous?: ArchiveTask) => {
    conf.upsertArchiveTask(task);
    const wasTerminal = previous
      ? archiveTaskTerminalStatuses.has(previous.status)
      : false;
    if (
      task.status === "succeeded" &&
      !wasTerminal &&
      !archiveTaskNotified.has(task.id)
    ) {
      archiveTaskNotified.add(task.id);
      ElMessage.success(taskCompletedMessage(task));
      const targetDir = normalizeVirtualPath(task.targetDir);
      if (
        currentPath() === targetDir ||
        currentPath().startsWith(`${targetDir}/`) ||
        targetDir.startsWith(`${currentPath()}/`)
      ) {
        conf.refresh();
      }
      return;
    }
    if (
      task.status === "failed" &&
      !wasTerminal &&
      !archiveTaskNotified.has(task.id)
    ) {
      archiveTaskNotified.add(task.id);
      ElMessage.error(task.message || taskFailedMessage(task));
    }
  },
  pollArchiveTask: async (taskId: string) => {
    const localTask = conf.archiveTasks[taskId];
    if (!localTask || archiveTaskTerminalStatuses.has(localTask.status)) return;
    try {
      const { data } =
        localTask.operation === "extract"
          ? await Api.getExtractTask(taskId, { silentError: true })
          : await Api.getArchiveTask(taskId, { silentError: true });
      const next = normalizeArchiveTask({
        ...localTask,
        ...data,
        statusUrl: localTask.statusUrl || data?.statusUrl,
      });
      conf.handleArchiveTaskUpdate(next, localTask);
      archiveTaskRetryDelays.delete(taskId);
      if (archiveTaskTerminalStatuses.has(next.status)) {
        const timer = archiveTaskPollTimers.get(taskId);
        if (timer) window.clearTimeout(timer);
        archiveTaskPollTimers.delete(taskId);
        return;
      }
      conf.scheduleArchiveTaskPoll(
        taskId,
        next.status === "running" ? 1000 : 2000,
      );
    } catch (error) {
      if (error instanceof HttpRequestError) {
        if (error.status === 403 || error.status === 404) {
          conf.removeArchiveTask(taskId);
          ElMessage.warning(
            error.status === 403
              ? t(
                  "file.archiveTaskNoPermission",
                  "You no longer have permission to view this archive task",
                )
              : t("file.archiveTaskMissing", "Archive task no longer exists"),
          );
          return;
        }
        if (error.status === 401) return;
      }
      const nextDelay = Math.min(
        archiveTaskRetryDelays.get(taskId) || 1000,
        10000,
      );
      archiveTaskRetryDelays.set(taskId, Math.min(nextDelay * 2, 10000));
      conf.scheduleArchiveTaskPoll(taskId, nextDelay);
    }
  },
  loadArchiveTasks: async () => {
    if (!canFilePermission("archive")) return;
    conf.archiveTasksLoading = true;
    try {
      const [archiveResult, extractResult] = await Promise.allSettled([
        Api.getArchiveTasks(
          { page: 1, pageSize: 20 },
          { silentError: true },
        ),
        Api.getExtractTasks(
          { page: 1, pageSize: 20 },
          { silentError: true },
        ),
      ]);
      const tasks: any[] = [];
      if (archiveResult.status === "fulfilled") {
        const data = archiveResult.value?.data;
        if (Array.isArray(data?.data)) {
          tasks.push(
            ...data.data.map((item: any) => ({
              ...item,
              operation: item?.operation || "archive",
            })),
          );
        }
      }
      if (extractResult.status === "fulfilled") {
        const data = extractResult.value?.data;
        if (Array.isArray(data?.data)) {
          tasks.push(
            ...data.data.map((item: any) => ({
              ...item,
              operation: item?.operation || "extract",
            })),
          );
        }
      }
      tasks.forEach((item: any) => {
        const task = normalizeArchiveTask(item);
        conf.upsertArchiveTask(task);
        if (!archiveTaskTerminalStatuses.has(task.status)) {
          conf.scheduleArchiveTaskPoll(
            task.id,
            task.status === "running" ? 500 : 1000,
          );
        }
      });
    } catch {
      // 归档任务入口允许静默失败，避免影响文件列表主流程。
    } finally {
      conf.archiveTasksLoading = false;
    }
  },
  openTerminal: () => System.router.push("/terminal"),
  handleFileClick: (row: any) => {
    if (!row.isDir) {
      if (conf.isImage(row)) {
        if (!requireFilePermission("read")) return;
        conf.imagePreview.open(row);
        return;
      }
      if (!requireFilePermission("edit")) return;
      conf.openEditor(row);
      return;
    }
    if (!requireFilePermission("read")) return;
    conf.path.push(row.name);
    conf.getFileList();
  },
  openEditor: async (row: any) => {
    if (!row?.path) return;
    if (!requireFilePermission("edit")) return;
    conf.editorLoadingPath = row.path;
    conf.editorDetail = null;
    try {
      const { data } = await Api.getFileContent({ path: row.path });
      conf.editorPath = row.path;
      conf.editorDetail = data;
      conf.editorVisible = true;
    } catch {
      // 请求拦截器已经展示后端错误，此处保持编辑器关闭。
    } finally {
      conf.editorLoadingPath = "";
    }
  },
  handleBackLevel: (index = conf.path.length - 2) => {
    if (conf.path.length === 1) return;
    conf.path = conf.path.slice(0, index + 1);
    conf.getFileList();
  },
  inputPath: "",
  isInputPath: false,
  inputPathRef: useTemplateRef<HTMLInputElement>("inputPathRef"),
  handleClickOutside: (e: MouseEvent) => {
    if (e.target === conf.inputPathRef) return;
    conf.isInputPath = false;
    window.removeEventListener("click", conf.handleClickOutside);
  },
  handleInputPath: () => {
    conf.isInputPath = true;
    conf.inputPath = conf.path.join("/").replace(/\/\//g, "/");
    nextTick(() => {
      conf.inputPathRef?.focus();
      window.addEventListener("click", conf.handleClickOutside);
    });
  },
  handleInputPathConfirm: () => {
    if (!sutil.matchFilePath(conf.inputPath) && conf.inputPath !== "/")
      return ElMessage.error(
        t("file.pathPlaceholder", "Enter a valid file path"),
      );
    conf.isInputPath = false;
    conf.path =
      conf.inputPath === "/"
        ? ["/"]
        : conf.inputPath.split("/").map((item) => (item === "" ? "/" : item));
    conf.getFileList();
  },
  handleNavigate: (path: string) => {
    const normalized = path.trim() || "/";
    conf.path =
      normalized === "/"
        ? ["/"]
        : normalized.split("/").map((item) => (item === "" ? "/" : item));
    conf.getFileList();
  },
  handleOpenDrawer: (openType: DrawerOpenType, type: DrawerType, row?: any) => {
    if (openType === "create" && !requireFilePermission("create")) return;
    if (
      (openType === "editPER" || openType === "editUser") &&
      !requireFilePermission("modify")
    )
      return;
    emit("open-drawer", openType, type, row);
  },
  handleFileDownload: async (row: any) => {
    if (!requireFilePermission("read")) return;
    await downloadVirtualFile(row.path, row.name);
    ElMessage.success(t("file.downloadSuccess", "Downloaded successfully"));
  },
  isImage: (row: any) =>
    !row?.isDir && imageExtensionPattern.test(row?.name || ""),
  setClipboard: async (mode: Exclude<ClipboardMode, "">, row: any) => {
    if (mode === "copy" && !canCopyFile())
      return requireFilePermission(
        canFilePermission("read") ? "create" : "read",
      );
    if (mode === "move" && !requireFilePermission("move")) return;
    if (mode === "move" && !(await ensurePathMutationAllowed(row, "move")))
      return;
    conf.clipboard.mode = mode;
    conf.clipboard.source = {
      path: row.path,
      name: row.name,
      isDir: row.isDir,
    };
    ElMessage.success(
      mode === "copy"
        ? t("file.copiedToClipboard", "Copied to file clipboard")
        : t("file.cutToClipboard", "Cut to file clipboard"),
    );
    conf.tipPaste =
      mode === "copy"
        ? t("file.pasteToCurrentDir", "Paste to current directory")
        : t("file.cutToCurrentDir", "Cut to current directory");
  },
  clearClipboard: () => {
    conf.clipboard.mode = "";
    conf.clipboard.source = null;
  },
  pasteClipboard: async () => {
    if (!conf.clipboard.source || !conf.clipboard.mode) return;
    if (!canPasteClipboard()) {
      requireFilePermission(conf.clipboard.mode === "copy" ? "create" : "move");
      return;
    }
    if (conf.clipboard.mode === "copy") {
      conf.copyDialog.open();
      return;
    }
    if (!(await ensurePathMutationAllowed(conf.clipboard.source, "move"))) return;
    await Api.moveFile({
      sourcePath: conf.clipboard.source.path,
      targetPath: joinVirtualPath(currentPath(), conf.clipboard.source.name),
    });
    ElMessage.success(t("file.cutDone", "Cut completed"));
    conf.clearClipboard();
    conf.refresh();
  },
  loadFavorites: async () => {
    conf.favoritesLoading = true;
    try {
      const { data } = await Api.getFileFavorites();
      const items = Array.isArray(data?.items) ? data.items : [];
      conf.favorites = items.map((item: any) => ({
        id: item.id,
        path: item.path,
        name: item.name || item.path?.split("/").pop() || item.path,
        isDir: normalizeBool(item.isDir),
        isMissing: normalizeBool(item.isMissing),
      }));
    } catch {
      conf.favorites = [];
    } finally {
      conf.favoritesLoading = false;
    }
  },
  isFavorite: (path: string) =>
    conf.favorites.some((item) => item.path === path),
  toggleFavorite: async (row: any) => {
    if (!requireFilePermission("read")) return;
    const item = conf.favorites.find((favorite) => favorite.path === row.path);
    if (item) {
      await Api.cancelFileFavorite({ path: item.path });
      ElMessage.success(t("file.favoriteRemoved", "Removed from favorites"));
    } else {
      await Api.favoriteFile({ path: row.path });
      ElMessage.success(t("file.favoriteAdded", "Added to favorites"));
    }
    await conf.loadFavorites();
  },
  openFavorite: (item: FavoriteItem) => {
    if (!requireFilePermission("read")) return;
    if (item.isMissing) {
      ElMessage.warning(
        t("file.favoriteMissing", "This favorite path is no longer available"),
      );
      return;
    }
    if (item.isDir) {
      conf.handleNavigate(item.path);
      return;
    }
    conf.handleNavigate(parentPath(item.path));
    ElMessage.success(
      t(
        "file.openedFavoriteParent",
        "Opened the folder containing the favorite file",
      ),
    );
  },
  openInNewWindow: (row: any) => {
    if (!requireFilePermission("read")) return;
    const params = new URLSearchParams({
      path: row.isDir ? row.path : parentPath(row.path),
    });
    if (!row.isDir) params.set("file", row.path);
    window.open(
      `${window.location.origin}${window.location.pathname}#/file?${params.toString()}`,
      "_blank",
      "noopener,noreferrer",
    );
  },
  fileDialog: {
    row: {} as any,
    show: false,
    type: "delete",
    title: t("file.deleteFile", "Delete file"),
    confirmText: t("common.confirm", "Confirm"),
    cancelText: t("common.cancel", "Cancel"),
    open: async (type: "delete" | "upload" | "linkDownload", row?: any) => {
      if (type === "delete" && !requireFilePermission("delete")) return;
      if (
        (type === "upload" || type === "linkDownload") &&
        !requireFilePermission("create")
      )
        return;
      if (
        type === "delete" &&
        row &&
        !(await ensurePathMutationAllowed(row, "delete"))
      )
        return;
      switch (type) {
        case "delete":
          conf.fileDialog.row = row;
          conf.fileDialog.title = t("file.deleteFile", "Delete file");
          conf.fileDialog.confirmText = t("common.confirm", "Confirm");
          break;
        case "upload":
          const path = conf.path.join("/").replace(/\/\//g, "/");
          conf.fileDialog.row = {
            path,
          };
          conf.fileDialog.title = t(
            "file.uploadToPath",
            "Upload files to [{path}]",
            { path },
          );
          conf.fileDialog.confirmText = t("file.startUpload", "Start upload");
          break;
        case "linkDownload":
          const downloadPath = conf.path.join("/").replace(/\/\//g, "/");
          conf.fileDialog.row = {
            path: downloadPath,
            name: "",
            url: "",
          };
          conf.fileDialog.title = t("file.urlDownload", "URL download");
          conf.fileDialog.confirmText = t("common.confirm", "Confirm");
          break;
      }
      conf.fileDialog.type = type;
      conf.fileDialog.show = true;
    },
    close: () => {
      conf.fileDialog.show = false;
      conf.fileDialog.row = {};
      conf.upload.instance?.clearFiles();
      conf.linkDownload.instance?.resetFields();
      conf.linkDownload.instance?.clearValidate();
    },
    confirm: async () => {
      if (conf.fileDialog.type === "upload")
        return conf.upload.instance?.submit();
      if (conf.fileDialog.type === "linkDownload") {
        const res = await conf.linkDownload.instance?.validate();
        if (!res) return;
        await Api.urlDownloadFile(conf.fileDialog.row);
        ElMessage.success(
          t("file.downloadTaskDone", "Download task completed"),
        );
        conf.fileDialog.close();
        conf.refresh();
        return;
      }
      if (!(await ensurePathMutationAllowed(conf.fileDialog.row, "delete"))) return;
      const path = conf.path.join("/").replace(/\/\//g, "/");
      await Api.deleteFile({
        path: `${path === "/" ? "" : path}/${conf.fileDialog.row.name}`,
      });
      ElMessage.success(t("file.movedToTrash", "Moved to trash"));
      conf.fileDialog.close();
      conf.refresh();
    },
  },
  operationDialog: {
    show: false,
    type: "" as "rename" | "archive" | "extract" | "properties" | "share" | "",
    title: "",
    row: {} as any,
    value: "",
    targetDir: "",
    overwrite: false,
    submitting: false,
    properties: null as any,
    expiryHours: 24,
    shareUrl: "",
    loading: false,
    open: async (
      type: "rename" | "archive" | "extract" | "properties" | "share",
      row: any,
    ) => {
      const permissionMap: Record<typeof type, FilePermission> = {
        rename: "modify",
        archive: "archive",
        extract: "archive",
        properties: "read",
        share: "share",
      };
      if (!requireFilePermission(permissionMap[type])) return;
      if (type === "rename" && !(await ensurePathMutationAllowed(row, "rename")))
        return;
      conf.operationDialog.type = type;
      conf.operationDialog.row = row;
      conf.operationDialog.value = "";
      conf.operationDialog.targetDir = "";
      conf.operationDialog.overwrite = false;
      conf.operationDialog.properties = null;
      conf.operationDialog.expiryHours = 24;
      conf.operationDialog.shareUrl = "";
      conf.operationDialog.show = true;
      if (type === "rename") {
        conf.operationDialog.title = t("file.rename", "Rename");
        conf.operationDialog.value = row.name;
      } else if (type === "archive") {
        conf.operationDialog.title = t("file.createArchive", "Create archive");
        conf.operationDialog.value = `${row.name}.tar.gz`;
      } else if (type === "extract") {
        conf.operationDialog.title = t("file.extractFile", "Extract file");
        conf.operationDialog.targetDir = defaultExtractTarget(row.path);
      } else if (type === "share") {
        conf.operationDialog.title = t("file.shareLink", "Share link");
      } else {
        conf.operationDialog.title = t(
          "file.fileProperties",
          "File properties",
        );
        conf.operationDialog.loading = true;
        try {
          const { data } = await Api.getFileProperties({ path: row.path });
          conf.operationDialog.properties = data;
        } finally {
          conf.operationDialog.loading = false;
        }
      }
    },
    close: () => {
      conf.operationDialog.show = false;
      conf.operationDialog.row = {};
      conf.operationDialog.properties = null;
      conf.operationDialog.shareUrl = "";
      conf.operationDialog.targetDir = "";
      conf.operationDialog.overwrite = false;
      conf.operationDialog.submitting = false;
    },
    confirm: async () => {
      const dialog = conf.operationDialog;
      if (dialog.type === "properties") {
        dialog.close();
        return;
      }
      if (dialog.type === "rename") {
        const name = dialog.value.trim();
        if (!name)
          return ElMessage.warning(
            t("file.newNameRequired", "Enter a new name"),
          );
        if (!(await ensurePathMutationAllowed(dialog.row, "rename"))) return;
        await Api.renameFile({ path: dialog.row.path, newName: name });
        ElMessage.success(t("file.renameSuccess", "Renamed successfully"));
        dialog.close();
        conf.refresh();
        return;
      }
      if (dialog.type === "extract") {
        const targetDir = normalizeVirtualPath(dialog.targetDir || "");
        if (!targetDir)
          return ElMessage.warning(
            t("file.extractTargetRequired", "Select an extraction directory"),
          );
        dialog.submitting = true;
        try {
          const { data } = await Api.extractFile(
            {
              path: dialog.row.path,
              targetDir,
              overwrite: dialog.overwrite,
            },
            { timeout: 10000 },
          );
          const created = normalizeArchiveTask({
            ...dialog.row,
            ...data,
            id: data?.taskId || data?.id,
            operation: data?.operation || "extract",
            sourcePath: dialog.row.path,
            targetDir,
            archiveFormat: data?.archiveFormat || dialog.row.archiveFormat,
            overwrite: dialog.overwrite,
            status: data?.status || "queued",
            statusUrl: data?.statusUrl,
            message: taskSubmittedMessage({
              ...dialog.row,
              operation: "extract",
            }),
            progress: 0,
            processedBytes: 0,
            totalBytes: 0,
            createdAt: new Date().toISOString(),
          });
          conf.upsertArchiveTask(created);
          archiveTaskNotified.delete(created.id);
          dialog.close();
          conf.archiveTasksVisible = true;
          ElMessage.success(
            taskSubmittedMessage({ ...dialog.row, operation: "extract" }),
          );
          conf.scheduleArchiveTaskPoll(created.id, 1200);
        } finally {
          dialog.submitting = false;
        }
        return;
      }
      if (dialog.type === "archive") {
        const archiveName = dialog.value.trim();
        if (!archiveName.endsWith(".tar.gz"))
          return ElMessage.warning(
            t("file.archiveNameMustEnd", "Archive name must end with .tar.gz"),
          );
        dialog.submitting = true;
        try {
          const { data } = await Api.archiveFile(
            {
              path: dialog.row.path,
              targetDir: currentPath(),
              archiveName,
            },
            { timeout: 10000 },
          );
          const created = normalizeArchiveTask({
            ...dialog.row,
            ...data,
            id: data?.taskId || data?.id,
            sourcePath: dialog.row.path,
            targetDir: currentPath(),
            archiveName,
            status: data?.status || "queued",
            statusUrl: data?.statusUrl,
            message: t("file.archiveTaskSubmitted", "Archive task submitted"),
            progress: 0,
            processedBytes: 0,
            totalBytes: 0,
            createdAt: new Date().toISOString(),
          });
          conf.upsertArchiveTask(created);
          archiveTaskNotified.delete(created.id);
          dialog.close();
          conf.archiveTasksVisible = true;
          ElMessage.success(
            t("file.archiveTaskSubmitted", "Archive task submitted"),
          );
          conf.scheduleArchiveTaskPoll(created.id, 1200);
        } finally {
          dialog.submitting = false;
        }
        return;
      }
      if (dialog.type === "share") {
        const { data } = await Api.createFileShare({
          path: dialog.row.path,
          expiryHours: dialog.expiryHours,
        });
        dialog.shareUrl = `${window.location.origin}${data.downloadUrl}`;
        await navigator.clipboard?.writeText(dialog.shareUrl);
        ElMessage.success(
          t("file.shareCreatedCopied", "Share link created and copied"),
        );
      }
    },
    copyShareUrl: async () => {
      if (!conf.operationDialog.shareUrl) return;
      await navigator.clipboard.writeText(conf.operationDialog.shareUrl);
      ElMessage.success(t("file.shareUrlCopied", "Share link copied"));
    },
  },
  upload: {
    instance: useTemplateRef<UploadInstance>("uploadRef"),
    onChange: ({ status, response: res }: UploadFile) => {
      if (status === "success") ElMessage.success((res as any).data);
      else if (status === "fail") ElMessage.error((res as any).data);
      else return;
      conf.refresh();
      conf.fileDialog.close();
    },
    handleOpenDialog: () => {
      if (conf.path.length === 1)
        return ElMessage.error(
          t(
            "file.uploadRootDenied",
            "Files cannot be uploaded directly to the system root directory.",
          ),
        );
      conf.fileDialog.open("upload");
    },
  },
  linkDownload: {
    instance: useTemplateRef<FormInstance>("formRef"),
  },
  treeDialog: {
    show: false,
    path: "/",
    isDir: true,
    key: 0,
    open: (row?: any) => {
      if (!requireFilePermission("read")) return;
      conf.treeDialog.path = row?.path || currentPath();
      conf.treeDialog.isDir = true;
      conf.treeDialog.key += 1;
      conf.treeDialog.show = true;
    },
    select: (node: any) => {
      conf.treeDialog.path = node.path;
      conf.treeDialog.isDir = Boolean(node.isDir);
    },
    confirm: () => {
      if (!conf.treeDialog.isDir)
        return ElMessage.warning(
          t("file.selectDirectoryWarning", "Select a directory"),
        );
      conf.handleNavigate(conf.treeDialog.path || "/");
      conf.treeDialog.show = false;
    },
  },
  selectFolder: {
    show: false,
    path: "",
    target: "download" as "download" | "extract",
    open: (target: "download" | "extract" = "download") => {
      conf.selectFolder.target = target;
      conf.selectFolder.path =
        target === "extract"
          ? conf.operationDialog.targetDir || currentPath()
          : conf.fileDialog.row.path || currentPath();
      conf.selectFolder.show = true;
    },
    select: (node: any) => {
      if (!node.isDir) return;
      conf.selectFolder.path = node.path;
    },
    confirm: () => {
      if (conf.selectFolder.target === "extract") {
        conf.operationDialog.targetDir = conf.selectFolder.path;
      } else {
        conf.fileDialog.row.path = conf.selectFolder.path;
      }
      conf.selectFolder.show = false;
    },
  },
});

const canCopyFile = () =>
  canFilePermission("read") && canFilePermission("create");
const canCutRow = (_row: any) => canFilePermission("move");
const canRenameRow = (_row: any) => canFilePermission("modify");
const canDeleteRow = (row: any) =>
  canFilePermission("delete") && normalizeBool(row?.canDelete);
const extractActionLabel = (row: any) =>
  canExtractRow(row)
    ? t("file.extract", "Extract")
    : getArchiveFormatHint(row) || t("file.extract", "Extract");
const canPasteClipboard = () => {
  if (conf.clipboard.mode === "copy") return canCopyFile();
  if (conf.clipboard.mode === "move") return canFilePermission("move");
  return false;
};
const canUsePrimaryAction = (row: any) => {
  if (row?.isDir || conf.isImage(row)) return canFilePermission("read");
  return canFilePermission("edit");
};
const rowInlineActionLimit = 3;
const rowInlineActionKeys = (row: any): RowInlineActionKey[] => {
  const keys: RowInlineActionKey[] = [];
  if (canUsePrimaryAction(row)) keys.push("open");
  if (canCopyFile()) keys.push("copy");
  if (canCutRow(row)) keys.push("cut");
  if (canRenameRow(row)) keys.push("rename");
  if (row?.isDir && canFilePermission("read")) keys.push("tree");
  return keys;
};
const rowVisibleInlineActionKeys = (row: any) =>
  rowInlineActionKeys(row).slice(0, rowInlineActionLimit);
const showRowInlineAction = (row: any, key: RowInlineActionKey) =>
  rowVisibleInlineActionKeys(row).includes(key);
const showRowMoreAction = (row: any, key: RowInlineActionKey) =>
  rowInlineActionKeys(row).includes(key) &&
  !rowVisibleInlineActionKeys(row).includes(key);
const hasRowMoreMenu = (row: any) =>
  rowInlineActionKeys(row).length > rowInlineActionLimit ||
  (!row?.isDir && canFilePermission("read")) ||
  canFilePermission("read") ||
  (!row?.isDir && canFilePermission("share")) ||
  canFilePermission("modify") ||
  canFilePermission("archive") ||
  canFilePermission("read");

onMounted(() => {
  conf.loadFavorites();
  void conf.loadArchiveTasks();
  const queryText = window.location.hash.split("?")[1] || "";
  const routeQuery = new URLSearchParams(queryText);
  const initialPath = routeQuery.get("path");
  const initialFile = routeQuery.get("file");
  if (initialPath) {
    conf.handleNavigate(initialPath);
  } else {
    conf.getFileList();
  }
  if (initialFile) {
    const initialRow = {
      path: initialFile,
      name: initialFile.split("/").pop() || initialFile,
      isDir: false,
    };
    if (conf.isImage(initialRow)) {
      conf.imagePreview.open(initialRow);
    } else {
      conf.openEditor(initialRow);
    }
  }
  conf.getCapacity();
});

onUnmounted(() => {
  archiveTaskPollTimers.forEach((timer) => window.clearTimeout(timer));
  archiveTaskPollTimers.clear();
  archiveTaskRetryDelays.clear();
});

defineExpose({
  refresh: () => conf.refresh(),
});

const filteredFileList = computed(() => {
  const keyword = conf.quickFilter.trim().toLowerCase();
  if (!keyword) return conf.fileList;
  return conf.fileList.filter((row: any) =>
    String(row?.name || "")
      .toLowerCase()
      .includes(keyword),
  );
});
const fileTablePage = ref(1);
const fileTablePageSize = ref(50);

const fileStats = computed(() => {
  const rows = filteredFileList.value as any[];
  return {
    total: rows.length,
    directories: rows.filter((row) => row.isDir).length,
    files: rows.filter((row) => !row.isDir).length,
    hidden: rows.filter((row) => String(row?.name || "").startsWith("."))
      .length,
  };
});

const capacityUsedPercent = computed(() => {
  const total = Number(conf.capacity?.diskTotalBytes || 0);
  const available = Number(conf.capacity?.diskAvailableBytes || 0);
  if (total <= 0) return 0;
  return Math.max(
    0,
    Math.min(100, Math.round(((total - available) / total) * 100)),
  );
});
const archiveTaskList = computed(() =>
  conf.archiveTaskOrder
    .map((id) => conf.archiveTasks[id])
    .filter(Boolean)
    .sort(
      (left, right) =>
        Date.parse(String(right.createdAt || "")) -
        Date.parse(String(left.createdAt || "")),
    ),
);
const archiveTaskActiveList = computed(() =>
  archiveTaskList.value.filter(
    (task) => task.status === "queued" || task.status === "running",
  ),
);
const archiveTaskRecentList = computed(() =>
  archiveTaskList.value.filter(
    (task) => task.status === "succeeded" || task.status === "failed",
  ),
);
const archiveTaskActiveCount = computed(() => archiveTaskActiveList.value.length);
const archiveTaskQueuedCount = computed(
  () => archiveTaskList.value.filter((task) => task.status === "queued").length,
);
const archiveTaskRunningCount = computed(
  () => archiveTaskList.value.filter((task) => task.status === "running").length,
);
</script>

<template>
  <div class="file-explorer">
    <section class="navigation-bar">
      <div class="path-navigator">
        <el-button
          class="path-action"
          :icon="ArrowLeft"
          :disabled="conf.path.length === 1"
          :aria-label="t('file.goParent', '返回上一级')"
          @click="conf.handleBackLevel()"
        />
        <div class="path-field" @click.stop="conf.handleInputPath">
          <el-breadcrumb v-if="!conf.isInputPath" :separator-icon="ArrowRight">
            <el-breadcrumb-item
              v-for="(item, index) in conf.path"
              :key="index"
              @click.stop="conf.handleBackLevel(index)"
            >
              {{ index === 0 ? t("file.rootDir", "根目录") : item }}
            </el-breadcrumb-item>
          </el-breadcrumb>
          <el-input
            v-else
            ref="inputPathRef"
            v-model="conf.inputPath"
            class="path-input"
            @blur="conf.handleInputPathConfirm"
            @keyup.enter="conf.handleInputPathConfirm"
          />
        </div>
        <el-button
          class="path-action"
          :icon="Refresh"
          :aria-label="t('file.refreshCurrentDirectory', '刷新当前目录')"
          @click="conf.refresh"
        />
      </div>
      <div class="navigation-search">
        <el-input
          v-model="conf.quickFilter"
          clearable
          :prefix-icon="Search"
          :placeholder="
            t('file.filterCurrentDirectory', 'Filter current directory')
          "
        />
        <el-button :icon="Search" :aria-label="t('file.deepSearch', 'Deep search')" :title="t('file.deepSearch', 'Deep search')" @click="conf.searchVisible = true">
          <span class="deep-search-label">{{ t('file.deepSearch', 'Deep search') }}</span>
        </el-button>
      </div>
    </section>

    <section class="command-bar">
      <div class="command-bar__primary">
        <el-dropdown v-if="canFilePermission('create')">
          <el-button
            class="command-button command-button--primary"
            type="primary"
            :icon="UploadFilled"
          >
            {{ t("file.uploadDownload", "Upload / Download") }}
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="conf.upload.handleOpenDialog">{{
                t("file.uploadFiles", "Upload files/folders")
              }}</el-dropdown-item>
              <el-dropdown-item @click="conf.fileDialog.open('linkDownload')">{{
                t("file.urlDownload", "URL download")
              }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-dropdown v-if="canFilePermission('create')">
          <el-button class="command-button" :icon="FolderAdd">
            {{ t("file.newItem", "New") }}
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                @click="conf.handleOpenDrawer('create', 'file')"
              >
                <el-icon><Document /></el-icon
                >{{ t("file.createFile", "New file") }}
              </el-dropdown-item>
              <el-dropdown-item @click="conf.handleOpenDrawer('create', 'dir')">
                <el-icon><Folder /></el-icon
                >{{ t("file.createFolder", "New folder") }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-dropdown v-if="canFilePermission('read')">
          <el-button class="command-button" :icon="Star">
            {{ t("file.favorites", "Favorites") }}
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu class="favorite-menu">
              <el-dropdown-item v-if="conf.favoritesLoading" disabled>{{
                t("file.favoritesLoading", "Loading favorites...")
              }}</el-dropdown-item>
              <el-dropdown-item v-else-if="!conf.favorites.length" disabled>{{
                t("file.noFavorites", "No favorites")
              }}</el-dropdown-item>
              <el-dropdown-item
                v-for="item in conf.favorites"
                :key="item.path"
                :disabled="item.isMissing"
                @click="conf.openFavorite(item)"
              >
                <el-icon><Star /></el-icon>
                <span class="favorite-name">{{ item.name }}</span>
                <el-tag
                  v-if="item.isMissing"
                  size="small"
                  type="warning"
                  effect="plain"
                  >{{ t("file.missing", "Missing") }}</el-tag
                >
                <small>{{ item.path }}</small>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button
          v-if="canFilePermission('read')"
          class="command-button"
          :icon="FolderOpened"
          @click="conf.treeDialog.open()"
        >
          {{ t("file.directoryTree", "Directory tree") }}
        </el-button>
        <el-button
          v-if="hasTerminalAccess()"
          class="command-button"
          :icon="Monitor"
          @click="conf.openTerminal"
        >
          {{ t("file.terminal", "Terminal") }}
        </el-button>
      </div>

      <div class="command-bar__secondary">
        <div v-if="conf.capacity" class="capacity-compact">
          <div class="capacity-compact__label">
            <span>{{ t("file.disk", "Disk") }} {{ capacityUsedPercent }}%</span>
            <strong
              >{{ t("file.writable", "Writable") }}
              {{ formatBytes(conf.capacity.writableBytes) }}</strong
            >
          </div>
          <div class="capacity-compact__track">
            <span :style="{ width: `${capacityUsedPercent}%` }" />
          </div>
        </div>
        <el-tooltip
          v-if="canFilePermission('archive')"
          :content="t('file.tasks', 'Tasks')"
          placement="bottom"
        >
          <el-badge
            :value="archiveTaskActiveCount"
            :hidden="archiveTaskActiveCount === 0"
          >
            <el-button
              class="icon-command"
              :icon="Bell"
              :aria-label="t('file.tasks', 'Tasks')"
              @click="conf.archiveTasksVisible = true"
            />
          </el-badge>
        </el-tooltip>
        <el-tooltip
          :content="t('file.operationRecords', 'Operation records')"
          placement="bottom"
        >
          <el-button
            class="icon-command"
            :icon="Tickets"
            :aria-label="t('file.operationRecords', 'Operation records')"
            @click="conf.operationsVisible = true"
          />
        </el-tooltip>
        <el-tooltip
          v-if="canFilePermission('delete')"
          :content="t('file.trash', 'Trash')"
          placement="bottom"
        >
          <el-button
            class="icon-command"
            :icon="Delete"
            :aria-label="t('file.trash', 'Trash')"
            @click="emit('open-trash')"
          />
        </el-tooltip>
        <div
          class="view-switch"
          :aria-label="t('file.fileViewSwitch', 'File view switch')"
        >
          <el-button
            :class="{ active: conf.viewMode === 'list' }"
            :icon="List"
            :aria-label="t('file.listView', 'List view')"
            @click="conf.viewMode = 'list'"
          />
          <el-button
            :class="{ active: conf.viewMode === 'grid' }"
            :icon="Grid"
            :aria-label="t('file.gridView', 'Grid view')"
            @click="conf.viewMode = 'grid'"
          />
        </div>
      </div>
    </section>

    <div
      v-if="conf.clipboard.source && canPasteClipboard()"
      class="clipboard-strip"
    >
      <div>
        <el-icon><CopyDocument /></el-icon>
        <span>{{ conf.tipPaste }}</span>
        <strong>{{ conf.clipboard.source.name }}</strong>
      </div>
      <div>
        <el-button type="primary" size="small" @click="conf.pasteClipboard">{{
          t("file.pasteNow", "Paste now")
        }}</el-button>
        <el-button size="small" @click="conf.clearClipboard">{{
          t("common.cancel", "Cancel")
        }}</el-button>
      </div>
    </div>

    <section v-if="conf.viewMode === 'list'" class="file-table-shell">
      <custom-table
        v-model:page="fileTablePage"
        v-model:page-size="fileTablePageSize"
        class="file-data-table"
        :data="filteredFileList"
        :columns="conf.columns"
        :loading="conf.loading"
      >
        <template #name="{ row }">
          <div class="file-name-cell">
            <span v-if="conf.isImage(row)" class="image-file-icon">
              <el-icon><PictureFilled /></el-icon>
            </span>
            <v-s-icon v-else :name="row.isDir ? 'folder' : 'txt'" size="21" />
            <el-link
              :disabled="!canUsePrimaryAction(row)"
              @click="conf.handleFileClick(row)"
            >
              <span class="ellipsis file-name">{{ row.name }}</span>
            </el-link>
            <el-icon v-if="conf.isFavorite(row.path)" class="favorite-mark"
              ><Star
            /></el-icon>
            <span v-if="row.isSymlink" class="symlink-mark">{{
              t("file.symlink", "符号链接")
            }}</span>
          </div>
        </template>
        <template #type="{ row }">
          <span
            class="file-type"
            :class="{
              'is-directory': row.isDir,
              'is-image': conf.isImage(row),
            }"
          >
            {{ fileTypeLabel(row) }}
          </span>
        </template>
        <template #identity="{ row }">
          <div class="identity-cell">
            <el-link
              v-if="canFilePermission('modify')"
              @click="
                conf.handleOpenDrawer(
                  'editPER',
                  row.isDir ? 'dir' : 'file',
                  row,
                )
              "
            >
              {{ row.permissions?.padEnd(4, "0") }}
            </el-link>
            <span v-else>{{ row.permissions?.padEnd(4, "0") }}</span>
            <el-link
              v-if="canFilePermission('modify')"
              class="identity-owner"
              @click="
                conf.handleOpenDrawer(
                  'editUser',
                  row.isDir ? 'dir' : 'file',
                  row,
                )
              "
            >
              {{ row.user }}
            </el-link>
            <span v-else class="identity-owner">{{ row.user }}</span>
          </div>
        </template>
        <template #action="{ row }">
          <div class="row-actions table-row-actions">
    <el-button
      v-if="showRowInlineAction(row, 'open')"
      class="action-main action-open"
      type="primary"
      link
      :icon="conf.isImage(row) ? View : FolderOpened"
      :loading="conf.editorLoadingPath === row.path"
      @click="conf.handleFileClick(row)"
            >
              {{
                row.isDir
                  ? t("file.open", "Open")
                  : conf.isImage(row)
                    ? t("file.preview", "Preview")
                    : t("file.edit", "Edit")
              }}
            </el-button>
    <el-button
      v-if="showRowInlineAction(row, 'copy')"
      class="action-copy"
      type="primary"
      link
      :icon="CopyDocument"
      @click="conf.setClipboard('copy', row)"
    >
              {{ t("file.copy", "Copy") }}
            </el-button>
    <el-button
      v-if="showRowInlineAction(row, 'cut')"
      class="action-cut"
      type="primary"
      link
      :icon="Scissor"
      @click="conf.setClipboard('move', row)"
    >
              {{ t("file.cut", "Cut") }}
            </el-button>
    <el-button
      v-if="showRowInlineAction(row, 'rename')"
      class="action-rename"
      type="primary"
      link
      :icon="EditPen"
      @click="conf.operationDialog.open('rename', row)"
    >
              {{ t("file.rename", "Rename") }}
            </el-button>
    <el-button
      v-if="showRowInlineAction(row, 'tree')"
      class="action-tree"
      type="primary"
      link
      :icon="Operation"
      @click="conf.treeDialog.open(row)"
    >
              {{ t("file.directoryTree", "Directory tree") }}
            </el-button>
    <el-dropdown
      v-if="hasRowMoreMenu(row)"
      class="row-action-more"
      trigger="click"
      popper-class="table-action-popper"
    >
      <el-button class="action-more-trigger" type="primary" link :icon="MoreFilled">
        {{ t("file.more", "More") }}
        <el-icon class="el-icon--right"><ArrowDown /></el-icon>
      </el-button>
              <template #dropdown>
                <el-dropdown-menu class="table-action-menu file-action-menu">
                  <el-dropdown-item
                    v-if="showRowMoreAction(row, 'open')"
                    @click="conf.handleFileClick(row)"
                  >
                    <el-icon
                      ><component :is="conf.isImage(row) ? View : FolderOpened"
                    /></el-icon>
                    {{
                      row.isDir
                        ? t("file.openDirectory", "Open directory")
                        : conf.isImage(row)
                          ? t("file.imagePreview", "Image preview")
                          : t("file.editFile", "Edit file")
                    }}
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="showRowMoreAction(row, 'tree')"
                    @click="conf.treeDialog.open(row)"
                  >
                    <el-icon><Operation /></el-icon
                    >{{ t("file.directoryTree", "Directory tree") }}
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="!row.isDir && canFilePermission('read')"
                    @click="conf.handleFileDownload(row)"
                  >
                    <el-icon><Download /></el-icon
                    >{{ t("file.download", "Download") }}
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="showRowMoreAction(row, 'copy')"
                    @click="conf.setClipboard('copy', row)"
                  >
                    <el-icon><CopyDocument /></el-icon
                    >{{ t("file.copy", "Copy") }}
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="showRowMoreAction(row, 'cut')"
                    @click="conf.setClipboard('move', row)"
                  >
                    <el-icon><Scissor /></el-icon>{{ t("file.cut", "Cut") }}
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="showRowMoreAction(row, 'rename')"
                    @click="conf.operationDialog.open('rename', row)"
                  >
                    <el-icon><EditPen /></el-icon
                    >{{ t("file.rename", "Rename") }}
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="canFilePermission('read')"
                    divided
                    @click="conf.toggleFavorite(row)"
                  >
                    <el-icon><Star /></el-icon>
                    {{
                      conf.isFavorite(row.path)
                        ? t("file.removeFavorite", "Remove from favorites")
                        : t("file.addFavorite", "Add to favorites")
                    }}
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="!row.isDir && canFilePermission('share')"
                    @click="conf.operationDialog.open('share', row)"
                  >
                    <el-icon><Share /></el-icon
                    >{{ t("file.shareLink", "Share link") }}
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="canFilePermission('modify')"
                    divided
                    @click="
                      conf.handleOpenDrawer(
                        'editPER',
                        row.isDir ? 'dir' : 'file',
                        row,
                      )
                    "
                  >
                    <el-icon><Lock /></el-icon
                    >{{ t("file.permissions", "Permissions") }}
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="isArchiveFile(row) && canFilePermission('archive')"
                    :disabled="!canExtractRow(row)"
                    @click="canExtractRow(row) && conf.operationDialog.open('extract', row)"
                  >
                    <el-icon><Download /></el-icon
                    >{{ extractActionLabel(row) }}
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="canFilePermission('archive')"
                    @click="conf.operationDialog.open('archive', row)"
                  >
                    <el-icon><Files /></el-icon
                    >{{ t("file.createArchive", "Create archive") }}
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="canFilePermission('read')"
                    @click="conf.operationDialog.open('properties', row)"
                  >
                    <el-icon><InfoFilled /></el-icon
                    >{{ t("file.properties", "Properties") }}
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="canDeleteRow(row)"
                    divided
                    class="table-action-menu__danger"
                    @click="conf.fileDialog.open('delete', row)"
                  >
                    <el-icon><Delete /></el-icon
                    >{{ t("file.delete", "Delete") }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </template>
        <template #summary>
          <div class="file-summary">
            <span>{{
              t("file.summary.total", "共 {total} 项", {
                total: fileStats.total,
              })
            }}</span>
            <span>{{
              t("file.summary.directories", "{count} 个文件夹", {
                count: fileStats.directories,
              })
            }}</span>
            <span>{{
              t("file.summary.files", "{count} 个文件", {
                count: fileStats.files,
              })
            }}</span>
            <span v-if="fileStats.hidden">{{
              t("file.summary.hidden", "{count} 个隐藏项", {
                count: fileStats.hidden,
              })
            }}</span>
            <span v-if="conf.quickFilter" class="file-summary__filter">{{
              t("file.summary.filtered", "已从 {count} 项中筛选", {
                count: conf.fileList.length,
              })
            }}</span>
          </div>
        </template>
      </custom-table>
    </section>

    <section v-else class="file-grid-shell" v-loading="conf.loading">
      <div v-if="filteredFileList.length" class="file-grid">
        <article
          v-for="row in filteredFileList"
          :key="row.path"
          class="file-card"
          tabindex="0"
          @dblclick="conf.handleFileClick(row)"
          @keyup.enter="conf.handleFileClick(row)"
        >
          <div
            class="file-card__icon"
            :class="{ 'is-image': conf.isImage(row) }"
          >
            <el-icon v-if="conf.isImage(row)"><PictureFilled /></el-icon>
            <v-s-icon v-else :name="row.isDir ? 'folder' : 'txt'" size="42" />
          </div>
          <div class="file-card__body">
            <strong :title="row.name">{{ row.name }}</strong>
            <span
              >{{ fileTypeLabel(row) }} · {{ row.isDir ? "—" : row.size }}</span
            >
            <small>{{ row.modTime }}</small>
          </div>
          <el-dropdown
            trigger="click"
            class="file-card__menu"
            popper-class="table-action-popper"
          >
            <el-button
              text
              :icon="MoreFilled"
              :aria-label="t('file.more', '更多')"
              @click.stop
            />
            <template #dropdown>
              <el-dropdown-menu class="table-action-menu file-action-menu">
                <el-dropdown-item
                  v-if="canUsePrimaryAction(row)"
                  @click="conf.handleFileClick(row)"
                >
                  <el-icon><FolderOpened /></el-icon
                  >{{
                    row.isDir
                      ? t("file.open", "打开")
                      : conf.isImage(row)
                        ? t("file.preview", "预览")
                        : t("file.edit", "编辑")
                  }}
                </el-dropdown-item>
                <el-dropdown-item
                  v-if="row.isDir && canFilePermission('read')"
                  @click="conf.treeDialog.open(row)"
                >
                  <el-icon><Operation /></el-icon
                  >{{ t("file.directoryTree", "目录树") }}
                </el-dropdown-item>
                <el-dropdown-item
                  v-if="!row.isDir && canFilePermission('read')"
                  @click="conf.handleFileDownload(row)"
                >
                  <el-icon><Download /></el-icon
                  >{{ t("file.download", "下载") }}
                </el-dropdown-item>
                <el-dropdown-item
                  v-if="canCopyFile()"
                  @click="conf.setClipboard('copy', row)"
                >
                  <el-icon><CopyDocument /></el-icon
                  >{{ t("file.copy", "复制") }}
                </el-dropdown-item>
                <el-dropdown-item
                  v-if="canCutRow(row)"
                  @click="conf.setClipboard('move', row)"
                >
                  <el-icon><Scissor /></el-icon>{{ t("file.cut", "剪切") }}
                </el-dropdown-item>
                <el-dropdown-item
                  v-if="canRenameRow(row)"
                  @click="conf.operationDialog.open('rename', row)"
                >
                  <el-icon><EditPen /></el-icon
                  >{{ t("file.rename", "重命名") }}
                </el-dropdown-item>
                <el-dropdown-item
                  v-if="canFilePermission('read')"
                  @click="conf.toggleFavorite(row)"
                >
                  <el-icon><Star /></el-icon
                  >{{
                    conf.isFavorite(row.path)
                      ? t("file.removeFavorite", "取消收藏")
                      : t("file.addFavorite", "收藏")
                  }}
                </el-dropdown-item>
                <el-dropdown-item
                  v-if="!row.isDir && canFilePermission('share')"
                  @click="conf.operationDialog.open('share', row)"
                >
                  <el-icon><Share /></el-icon
                  >{{ t("file.shareLink", "外链分享") }}
                </el-dropdown-item>
                <el-dropdown-item
                  v-if="canFilePermission('modify')"
                  divided
                  @click="
                    conf.handleOpenDrawer(
                      'editPER',
                      row.isDir ? 'dir' : 'file',
                      row,
                    )
                  "
                >
                  <el-icon><Lock /></el-icon
                  >{{ t("file.permissions", "权限") }}
                </el-dropdown-item>
                <el-dropdown-item
                  v-if="isArchiveFile(row) && canFilePermission('archive')"
                  :disabled="!canExtractRow(row)"
                  @click="canExtractRow(row) && conf.operationDialog.open('extract', row)"
                >
                  <el-icon><Download /></el-icon
                  >{{ extractActionLabel(row) }}
                </el-dropdown-item>
                <el-dropdown-item
                  v-if="canFilePermission('archive')"
                  @click="conf.operationDialog.open('archive', row)"
                >
                  <el-icon><Files /></el-icon
                  >{{ t("file.createArchive", "创建压缩包") }}
                </el-dropdown-item>
                <el-dropdown-item
                  v-if="canFilePermission('read')"
                  @click="conf.operationDialog.open('properties', row)"
                >
                  <el-icon><InfoFilled /></el-icon
                  >{{ t("file.properties", "属性") }}
                </el-dropdown-item>
                <el-dropdown-item
                  v-if="canDeleteRow(row)"
                  divided
                  class="table-action-menu__danger"
                  @click="conf.fileDialog.open('delete', row)"
                >
                  <el-icon><Delete /></el-icon>{{ t("file.delete", "删除") }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </article>
      </div>
      <el-empty
        v-else
        :description="t('file.emptyDirectory', '当前目录没有文件')"
      />
      <footer class="file-grid-footer">
        <div class="file-summary">
          <span>{{
            t("file.summary.total", "共 {total} 项", { total: fileStats.total })
          }}</span>
          <span>{{
            t("file.summary.directories", "{count} 个文件夹", {
              count: fileStats.directories,
            })
          }}</span>
          <span>{{
            t("file.summary.files", "{count} 个文件", {
              count: fileStats.files,
            })
          }}</span>
        </div>
        <span>{{
          t("file.managedRootPath", "管理根目录 {path}", {
            path: conf.rootPath,
          })
        }}</span>
      </footer>
    </section>

    <custom-dialog
      v-model="conf.imagePreview.show"
      :title="
        t('file.imagePreviewTitle', 'Image preview · {name}', {
          name: conf.imagePreview.row?.name || '',
        })
      "
      width="860px"
      :on-close="conf.imagePreview.close"
    >
      <div class="image-preview">
        <div
          v-loading="conf.imagePreview.loading"
          class="image-preview__stage"
          :class="{ 'is-error': conf.imagePreview.error }"
        >
          <el-image
            v-if="conf.imagePreview.url && !conf.imagePreview.error"
            :src="conf.imagePreview.url"
            :preview-src-list="[conf.imagePreview.url]"
            :initial-index="0"
            fit="contain"
            preview-teleported
            hide-on-click-modal
            @load="conf.imagePreview.loading = false"
            @error="
              conf.imagePreview.loading = false;
              conf.imagePreview.error = true;
            "
          >
            <template #placeholder>
              <div class="image-preview__message">
                {{ t("file.imageLoading", "Reading image...") }}
              </div>
            </template>
          </el-image>
          <div v-if="conf.imagePreview.error" class="image-preview__error">
            <el-icon><PictureFilled /></el-icon>
            <strong>{{
              t("file.imagePreviewFailed", "Image preview failed")
            }}</strong>
            <span>{{
              t(
                "file.imagePreviewFailedTip",
                "The file may not be a supported image, may exceed 30 MB, or may have been modified.",
              )
            }}</span>
          </div>
        </div>
        <div class="image-preview__meta">
          <div>
            <strong>{{ conf.imagePreview.row?.name }}</strong>
            <span>{{ conf.imagePreview.row?.path }}</span>
          </div>
          <el-tag type="info" effect="plain">{{
            conf.imagePreview.row?.size || t("file.imageFile", "Image file")
          }}</el-tag>
        </div>
        <p class="image-preview__hint">
          {{
            t(
              "file.imagePreviewHint",
              "Click the image to enter fullscreen preview. Use the wheel to zoom.",
            )
          }}
        </p>
      </div>
      <template #footer>
        <el-button
          v-if="conf.imagePreview.row"
          :icon="Download"
          @click="conf.handleFileDownload(conf.imagePreview.row)"
        >
          {{ t("file.downloadOriginal", "Download original") }}
        </el-button>
        <el-button type="primary" @click="conf.imagePreview.close">{{
          t("common.close", "Close")
        }}</el-button>
      </template>
    </custom-dialog>

    <custom-dialog
      v-model="conf.fileDialog.show"
      :title="conf.fileDialog.title"
    >
      <template v-if="conf.fileDialog.type === 'delete'">
        <el-alert
          :title="
            t(
              'file.trashConfirmTip',
              'Move the selected file to trash? It can be restored later.',
            )
          "
          type="warning"
          show-icon
          :closable="false"
        />
        <div class="flex items-center" style="gap: 10px; margin-top: 20px">
          <v-s-icon
            :name="conf.fileDialog.row?.isDir ? 'folder' : 'txt'"
            size="22"
          />
          <span style="color: var(--font-color-gray)">{{
            conf.fileDialog.row.name
          }}</span>
        </div>
      </template>
      <template v-else-if="conf.fileDialog.type === 'upload'">
        <div class="flex column" style="gap: 18px">
          <div class="flex justify-end">
            <el-button
              type="info"
              @click="conf.upload.instance?.clearFiles()"
              >{{ t("file.clearList", "Clear list") }}</el-button
            >
          </div>
          <el-upload
            ref="uploadRef"
            drag
            :data="conf.fileDialog.row"
            :with-credentials="true"
            :auto-upload="false"
            multiple
            :action="`${System.env.API}/ftp/upload`"
            :on-change="conf.upload.onChange"
          >
            <div class="el-upload__text">
              {{ t("file.uploadDropTip", "Drag files/folders here to upload") }}
            </div>
          </el-upload>
        </div>
      </template>
      <template v-else-if="conf.fileDialog.type === 'linkDownload'">
        <el-form
          ref="formRef"
          :model="conf.fileDialog.row"
          :rules="{
            name: [
              {
                required: true,
                message: t('file.fileNameRequired', 'Enter a file name'),
                trigger: 'blur',
              },
            ],
            url: [
              {
                required: true,
                message: t('file.urlRequired', 'Enter a URL'),
                trigger: 'blur',
              },
            ],
          }"
          label-width="100px"
        >
          <el-form-item :label="t('file.urlAddress', 'URL')" prop="url">
            <el-input
              v-model="conf.fileDialog.row.url"
              :placeholder="
                t('file.urlPlaceholder', 'Paste or enter a URL here')
              "
              clearable
            />
          </el-form-item>
          <el-form-item
            :label="t('file.downloadTo', 'Download to')"
            prop="path"
          >
            <el-input
              v-model="conf.fileDialog.row.path"
              :placeholder="
                t('file.downloadPathPlaceholder', 'Select download path')
              "
            >
              <template #append>
                <v-s-icon
                  class="cursor-pointer"
                  name="folders"
                  @click="conf.selectFolder.open"
                />
              </template>
            </el-input>
          </el-form-item>
          <el-form-item :label="t('file.fileName', 'File name')" prop="name">
            <el-input
              v-model="conf.fileDialog.row.name"
              :placeholder="
                t('file.saveFileNamePlaceholder', 'Enter saved file name')
              "
              clearable
            />
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <el-button
          v-if="conf.fileDialog.type !== 'upload'"
          @click="conf.fileDialog.close"
        >
          {{ conf.fileDialog.cancelText }}
        </el-button>
        <el-button type="primary" @click="conf.fileDialog.confirm">{{
          conf.fileDialog.confirmText
        }}</el-button>
      </template>
    </custom-dialog>

    <custom-dialog
      v-model="conf.operationDialog.show"
      :title="conf.operationDialog.title"
      v-if="conf.operationDialog.type !== 'properties'"
    >
      <div class="operation-dialog">
        <template v-if="conf.operationDialog.type === 'rename'">
          <el-form label-position="top">
            <el-form-item :label="t('file.newName', 'New name')" required>
              <el-input
                v-model="conf.operationDialog.value"
                maxlength="255"
                show-word-limit
                :placeholder="
                  t(
                    'file.newNamePlaceholder',
                    'Enter a new file or directory name',
                  )
                "
                @keyup.enter="conf.operationDialog.confirm"
              />
            </el-form-item>
          </el-form>
          <el-alert
            :title="
              t(
                'file.renameNoOverwriteTip',
                'Existing items with the same name in this directory will not be overwritten.',
              )
            "
            type="info"
            show-icon
            :closable="false"
          />
        </template>
        <template v-else-if="conf.operationDialog.type === 'archive'">
          <el-form label-position="top">
            <el-form-item
              :label="t('file.archiveName', 'Archive name')"
              required
            >
              <el-input
                v-model="conf.operationDialog.value"
                maxlength="255"
                :placeholder="
                  t('file.archiveNamePlaceholder', 'Example: website.tar.gz')
                "
              />
            </el-form-item>
            <el-form-item :label="t('file.saveLocation', 'Save location')">
              <el-input :model-value="currentPath()" disabled />
            </el-form-item>
          </el-form>
          <el-alert
            :title="
              t(
                'file.archiveTip',
                'Uses tar.gz format. Symbolic links and special device files are not followed or packed.',
              )
            "
            type="info"
            show-icon
            :closable="false"
          />
        </template>
        <template v-else-if="conf.operationDialog.type === 'extract'">
          <el-form label-position="top">
            <el-form-item :label="t('file.extractSource', 'Source file')">
              <el-input :model-value="conf.operationDialog.row.path" disabled />
            </el-form-item>
            <el-form-item :label="t('file.extractTarget', 'Extract to')" required>
              <el-input
                v-model="conf.operationDialog.targetDir"
                :placeholder="
                  t(
                    'file.extractTargetPlaceholder',
                    'Select an extraction directory',
                  )
                "
              >
                <template #append>
                  <v-s-icon
                    class="cursor-pointer"
                    name="folders"
                    @click="conf.selectFolder.open('extract')"
                  />
                </template>
              </el-input>
            </el-form-item>
            <el-form-item :label="t('file.extractOverwrite', 'Overwrite existing files')">
              <el-switch v-model="conf.operationDialog.overwrite" />
              <div class="form-unit">
                {{
                  t(
                    'file.extractOverwriteTip',
                    'Replace files with the same name. Existing directories will be merged and non-conflicting files will be kept.',
                  )
                }}
              </div>
            </el-form-item>
          </el-form>
          <el-alert
            :title="
              t(
                'file.extractTip',
                'The backend will precheck the archive format and target directory, then create an asynchronous extract task.',
              )
            "
            type="info"
            show-icon
            :closable="false"
          />
        </template>
        <template v-else-if="conf.operationDialog.type === 'share'">
          <template v-if="!conf.operationDialog.shareUrl">
            <el-alert
              :title="
                t(
                  'file.shareTip',
                  'External links only allow downloading this regular file and do not expose the server path.',
                )
              "
              type="warning"
              show-icon
              :closable="false"
            />
            <el-form label-position="top" class="share-form">
              <el-form-item :label="t('file.shareFile', 'Shared file')">
                <el-input
                  :model-value="conf.operationDialog.row.path"
                  disabled
                />
              </el-form-item>
              <el-form-item :label="t('file.expiresIn', 'Expires in')">
                <el-input-number
                  v-model="conf.operationDialog.expiryHours"
                  :min="1"
                  :max="168"
                  controls-position="right"
                />
                <span class="form-unit">{{
                  t("file.hoursMaxDays", "hours (up to 7 days)")
                }}</span>
              </el-form-item>
            </el-form>
          </template>
          <div v-else class="share-result">
            <div class="share-result__icon">
              <el-icon><Share /></el-icon>
            </div>
            <strong>{{
              t("file.shareCreateSuccessTitle", "Share link created")
            }}</strong>
            <p>
              {{
                t(
                  "file.shareCreateSuccessTip",
                  "The link has been copied and can be used to download during its validity period.",
                )
              }}
            </p>
            <el-input v-model="conf.operationDialog.shareUrl" readonly>
              <template #append>
                <el-button @click="conf.operationDialog.copyShareUrl">{{
                  t("file.copy", "Copy")
                }}</el-button>
              </template>
            </el-input>
          </div>
        </template>
      </div>
      <template #footer>
        <el-button @click="conf.operationDialog.close">
          {{
            conf.operationDialog.shareUrl
              ? t("common.close", "Close")
              : t("common.cancel", "Cancel")
          }}
        </el-button>
        <el-button
          v-if="!conf.operationDialog.shareUrl"
          type="primary"
          :loading="conf.operationDialog.submitting"
          @click="conf.operationDialog.confirm"
        >
          {{
            conf.operationDialog.type === "share"
              ? t("file.createAndCopyShare", "Create and copy share link")
              : t("common.confirm", "Confirm")
          }}
        </el-button>
      </template>
    </custom-dialog>

    <custom-drawer
      :visible="
        conf.operationDialog.show && conf.operationDialog.type === 'properties'
      "
      :title="t('file.fileProperties', 'File properties')"
      size="min(820px, 92vw)"
      body-mode="compact"
      :show-confirm="false"
      :cancel-text="t('common.close', 'Close')"
      :on-close="conf.operationDialog.close"
    >
      <template #title>
        <div class="properties-heading">
          <h3>{{ t("file.fileProperties", "File properties") }}</h3>
          <p v-if="conf.operationDialog.properties?.path">
            {{ conf.operationDialog.properties.path }}
          </p>
        </div>
      </template>

      <div
        v-loading="conf.operationDialog.loading"
        class="properties-panel properties-drawer"
      >
        <template v-if="conf.operationDialog.properties">
          <div class="properties-list">
            <div class="properties-row">
              <span>{{ t("common.name", "Name") }}</span>
              <strong>{{ conf.operationDialog.properties.name }}</strong>
            </div>
            <div class="properties-row">
              <span>{{ t("file.path", "Path") }}</span>
              <strong class="break-path">{{
                conf.operationDialog.properties.path
              }}</strong>
            </div>
            <div class="properties-row">
              <span>{{ t("common.type", "Type") }}</span>
              <strong>
                {{
                  conf.operationDialog.properties.type === "directory"
                    ? t("file.directory", "Directory")
                    : conf.operationDialog.properties.type === "symlink"
                      ? t("file.symlink", "Symbolic link")
                      : t("file.file", "File")
                }}
              </strong>
            </div>
            <div class="properties-row">
              <span>{{ t("file.columns.identity", "Permissions / Owner") }}</span>
              <strong>
                {{ conf.operationDialog.properties.permissions }} /
                {{ conf.operationDialog.properties.owner }}
              </strong>
            </div>
            <div class="properties-row">
              <span>{{ t("common.size", "Size") }}</span>
              <strong>{{
                formatBytes(conf.operationDialog.properties.size)
              }}</strong>
            </div>
            <div class="properties-row">
              <span>{{ t("file.mimeType", "MIME type") }}</span>
              <strong>{{
                conf.operationDialog.properties.mimeType || "—"
              }}</strong>
            </div>
            <div class="properties-row">
              <span>{{ t("file.archiveFormat", "Archive format") }}</span>
              <strong>{{
                conf.operationDialog.properties.isArchive
                  ? conf.operationDialog.properties.archiveFormat || "—"
                  : "—"
              }}</strong>
            </div>
            <div class="properties-row">
              <span>{{ t("file.extractStatus", "Can extract") }}</span>
              <strong>
                {{
                  conf.operationDialog.properties.isArchive
                    ? conf.operationDialog.properties.canExtract
                      ? t("common.yes", "Yes")
                      : t("common.no", "No")
                    : "—"
                }}
              </strong>
            </div>
            <div class="properties-row">
              <span>{{ t("file.columns.modTime", "Modified time") }}</span>
              <strong>{{ conf.operationDialog.properties.modTime }}</strong>
            </div>
          </div>
          <div class="properties-actions">
            <el-button
              v-if="conf.operationDialog.properties.isArchive && conf.operationDialog.properties.canExtract"
              type="primary"
              @click="
                conf.operationDialog.open('extract', conf.operationDialog.properties)
              "
            >
              {{ t("file.extract", "Extract") }}
            </el-button>
            <el-alert
              v-else-if="conf.operationDialog.properties.isArchive"
              type="warning"
              show-icon
              :closable="false"
              :title="
                getArchiveFormatHint(conf.operationDialog.properties) ||
                t('file.extractUnsupported', 'This archive cannot be extracted')
              "
            />
          </div>
        </template>
      </div>
    </custom-drawer>

    <custom-dialog
      v-model="conf.copyDialog.show"
      :title="t('file.copyToCurrentDir', 'Copy to current directory')"
      width="680px"
    >
      <div class="copy-dialog">
        <el-alert
          :title="
            t(
              'file.copyOverwriteTip',
              'If the target already exists, the backend rejects the copy by default. Enabling overwrite replaces the target file.',
            )
          "
          type="warning"
          show-icon
          :closable="false"
        />
        <el-form label-position="top" class="copy-dialog__form">
          <el-form-item :label="t('file.sourcePath', 'Source path')">
            <el-input :model-value="conf.clipboard.source?.path" disabled />
          </el-form-item>
          <el-form-item :label="t('file.targetPath', 'Target path')">
            <el-input v-model="conf.copyDialog.targetPath" disabled />
          </el-form-item>
          <el-form-item :label="t('file.overwritePolicy', 'Overwrite policy')">
            <el-switch
              v-model="conf.copyDialog.overwrite"
              :active-text="
                t('file.overwriteExisting', 'Overwrite existing files')
              "
              :inactive-text="t('file.noOverwrite', 'Do not overwrite')"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="conf.copyDialog.close">{{
          t("common.cancel", "Cancel")
        }}</el-button>
        <el-button type="primary" @click="conf.copyDialog.confirm">{{
          t("file.startCopy", "Start copy")
        }}</el-button>
      </template>
    </custom-dialog>

    <custom-dialog
      v-model="conf.selectFolder.show"
      :title="t('file.selectFolder', 'Select folder')"
    >
      <file-panel
        :path="conf.selectFolder.path || currentPath()"
        @select-node="conf.selectFolder.select"
      />
      <template #footer>
        <el-button type="primary" @click="conf.selectFolder.confirm">{{
          t("common.confirm", "Confirm")
        }}</el-button>
      </template>
    </custom-dialog>

    <custom-dialog
      v-model="conf.treeDialog.show"
      :title="t('file.directoryTree', 'Directory tree')"
      width="720px"
    >
      <file-panel
        :key="conf.treeDialog.key"
        :path="conf.treeDialog.path || currentPath()"
        @select-node="conf.treeDialog.select"
      />
      <template #footer>
        <el-button @click="conf.treeDialog.show = false">{{
          t("common.cancel", "Cancel")
        }}</el-button>
        <el-button
          type="primary"
          :disabled="!conf.treeDialog.isDir"
          @click="conf.treeDialog.confirm"
          >{{ t("file.openDirectoryAction", "Open directory") }}</el-button
        >
      </template>
    </custom-dialog>

    <custom-drawer
      v-model:visible="conf.archiveTasksVisible"
      :title="t('file.tasks', 'Tasks')"
      size="460px"
      :append-to-body="true"
      :show-footer="false"
      body-mode="compact"
    >
      <div class="archive-task-drawer">
        <div class="archive-task-overview">
          <div class="archive-task-overview__card">
            <strong>{{ archiveTaskRunningCount }}</strong>
            <span>{{ t("file.taskStatusRunning", "In progress") }}</span>
          </div>
          <div class="archive-task-overview__card">
            <strong>{{ archiveTaskQueuedCount }}</strong>
            <span>{{ t("file.taskStatusQueued", "Queued") }}</span>
          </div>
          <div class="archive-task-overview__card">
            <strong>{{ archiveTaskList.length }}</strong>
            <span>{{ t("file.taskStatusRecent", "Recent") }}</span>
          </div>
        </div>

        <div v-loading="conf.archiveTasksLoading" class="archive-task-sections">
          <div v-if="archiveTaskActiveList.length" class="archive-task-section">
            <div class="archive-task-section__title">
              {{ t("file.taskActive", "In progress") }}
            </div>
            <article
              v-for="task in archiveTaskActiveList"
              :key="task.id"
              class="archive-task-card"
            >
              <div class="archive-task-card__header">
                <div>
                  <strong>{{ taskDisplayName(task) }}</strong>
                  <small>{{ taskOperationLabel(task.operation) }}</small>
                  <small>{{ formatArchiveTaskTime(task.createdAt) }}</small>
                </div>
                <el-tag
                  size="small"
                  effect="plain"
                  :type="archiveTaskStatusTagType[task.status]"
                >
                  {{ archiveTaskStatusLabel(task.status) }}
                </el-tag>
              </div>
              <p class="archive-task-card__message">
                {{
                  task.message ||
                  (task.status === "queued"
                    ? t(
                        "file.taskQueuedHint",
                        "Waiting for another task to finish",
                      )
                    : task.operation === "extract"
                      ? t("file.extractTaskPacking", "Extracting archive")
                      : t("file.archiveTaskPacking", "Creating archive"))
                }}
              </p>
              <div
                class="archive-task-progress"
                :class="{
                  'is-indeterminate':
                    task.status === 'queued' ||
                    (task.status === 'running' && task.totalBytes <= 0),
                }"
              >
                <span
                  :style="{
                    width: `${
                      task.status === 'succeeded'
                        ? 100
                        : Math.max(0, Math.min(99, Math.round(task.progress || 0)))
                    }%`,
                  }"
                />
              </div>
              <div class="archive-task-card__meta">
                <span>{{ archiveTaskProgressText(task) }}</span>
                <span v-if="task.totalBytes > 0">
                  {{ formatBytes(task.processedBytes) }} /
                  {{ formatBytes(task.totalBytes) }}
                </span>
              </div>
              <div v-if="task.currentPath" class="archive-task-card__path">
                {{ t("file.archiveTaskCurrentFile", "Current file") }}:
                {{ task.currentPath }}
              </div>
            </article>
          </div>

        <div v-if="archiveTaskRecentList.length" class="archive-task-section">
            <div class="archive-task-section__title">
              {{ t("file.taskRecent", "Recent") }}
            </div>
            <article
              v-for="task in archiveTaskRecentList"
              :key="task.id"
              class="archive-task-card"
            >
              <div class="archive-task-card__header">
                <div>
                  <strong>{{ taskDisplayName(task) }}</strong>
                  <small>{{ taskOperationLabel(task.operation) }}</small>
                  <small>{{ formatArchiveTaskTime(task.finishedAt || task.createdAt) }}</small>
                </div>
                <el-tag
                  size="small"
                  effect="plain"
                  :type="archiveTaskStatusTagType[task.status]"
                >
                  {{ archiveTaskStatusLabel(task.status) }}
                </el-tag>
              </div>
              <p class="archive-task-card__message">
                {{
                  task.message ||
                    (task.status === "succeeded"
                    ? taskFinishedMessage(task)
                    : taskFailedMessage(task))
                }}
              </p>
              <div class="archive-task-card__meta">
                <span>{{ archiveTaskProgressText(task) }}</span>
                <span v-if="task.status === 'succeeded' && task.resultPath">
                  {{ task.resultPath }}
                </span>
              </div>
              <div class="archive-task-card__actions">
                <el-button
                  v-if="task.status === 'succeeded'"
                  link
                  type="primary"
                  @click="conf.locateTaskResult(task)"
                >
                  {{ t("file.taskLocateResult", "Locate result") }}
                </el-button>
                <el-button
                  v-if="task.status === 'failed'"
                  link
                  type="primary"
                  @click="conf.retryArchiveTask(task)"
                >
                  {{ t("file.archiveTaskRetry", "Retry") }}
                </el-button>
              </div>
            </article>
          </div>

          <el-empty
            v-if="!archiveTaskList.length && !conf.archiveTasksLoading"
            :description="
              t('file.taskEmpty', 'No tasks yet')
            "
          />
        </div>
      </div>
    </custom-drawer>

    <file-search-dialog
      v-model="conf.searchVisible"
      :current-path="conf.path.join('/').replace(/\/\//g, '/')"
      @navigate="conf.handleNavigate"
    />
    <file-operation-drawer v-model="conf.operationsVisible" />
    <file-editor-drawer
      v-model="conf.editorVisible"
      :path="conf.editorPath"
      :initial-detail="conf.editorDetail"
      @saved="conf.refresh"
    />
  </div>
</template>

<style scoped lang="less">
.file-explorer {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
}

.navigation-bar {
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(360px, 1fr) minmax(280px, 420px);
  align-items: center;
  gap: 10px;
}

.path-navigator,
.navigation-search {
  min-width: 0;
  height: 40px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.path-navigator {
  padding: 3px;
  border: 1px solid var(--border-subtle);
  border-radius: 9px;
  background: var(--surface-card);
}

.path-field {
  min-width: 0;
  height: 32px;
  display: flex;
  flex: 1;
  align-items: center;
  padding: 0 10px;
  overflow: hidden;
  border-radius: 6px;
  cursor: text;

  &:hover {
    background: var(--surface-subtle);
  }

  :deep(.el-breadcrumb) {
    min-width: 0;
    display: flex;
    overflow: hidden;
  }

  :deep(.el-breadcrumb__item) {
    flex: 0 0 auto;
  }

  :deep(.el-breadcrumb__inner) {
    color: var(--text-secondary);
    font-size: 13px;
    font-weight: 560;
    cursor: pointer;
  }

  :deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
    color: var(--text-primary);
    font-weight: 680;
  }
}

.path-input {
  width: 100%;

  :deep(.el-input__wrapper) {
    padding: 0;
    box-shadow: none;
  }
}

.path-action {
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  margin: 0;
  border: 0;
  border-radius: 6px;
  color: var(--text-secondary);
  background: transparent;
}

.navigation-search {
  :deep(.el-input) {
    min-width: 0;
  }

  :deep(.el-input__wrapper) {
    min-height: 40px;
    border-radius: 9px;
    box-shadow: inset 0 0 0 1px var(--border-subtle);
  }

  > .el-button {
    height: 40px;
    margin: 0;
    border-radius: 9px;
  }
}

.command-bar {
  min-width: 0;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 7px 9px;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  background: var(--surface-subtle);
}

.command-bar__primary,
.command-bar__secondary {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 7px;
}

.command-bar__primary {
  flex-wrap: wrap;
}

.command-bar__secondary {
  flex: 0 0 auto;
}

.command-button,
.icon-command {
  height: 34px;
  margin: 0;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 620;
  background: var(--surface-card);
}

.command-button--primary {
  background: rgb(var(--primary-color));
}

.capacity-compact {
  width: 194px;
  padding: 3px 8px;
}

.capacity-compact__label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: var(--text-tertiary);
  font-size: 10px;

  strong {
    color: var(--text-secondary);
    font-weight: 650;
  }
}

.capacity-compact__track {
  height: 3px;
  margin-top: 4px;
  overflow: hidden;
  border-radius: 10px;
  background: var(--border-subtle);

  span {
    height: 100%;
    display: block;
    border-radius: inherit;
    background: linear-gradient(
      90deg,
      rgb(var(--primary-color)),
      var(--primary-color-light)
    );
  }
}

.view-switch {
  display: flex;
  padding: 2px;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: var(--surface-card);

  .el-button {
    width: 30px;
    height: 28px;
    margin: 0;
    border: 0;
    border-radius: 6px;
    color: var(--text-tertiary);
    background: transparent;

    &.active {
      color: rgb(var(--primary-color));
      background: rgba(var(--primary-color), 0.1);
    }
  }
}

.clipboard-strip {
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 6px 10px;
  border: 1px solid rgba(var(--primary-color), 0.24);
  border-radius: 9px;
  color: var(--text-secondary);
  background: rgba(var(--primary-color), 0.055);
  font-size: 12px;

  > div {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  strong {
    max-width: 360px;
    overflow: hidden;
    color: var(--text-primary);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.file-table-shell {
  min-width: 0;
  overflow: hidden;
  background: var(--surface-card);
}

.file-grid-shell {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  background: var(--surface-card);
}

:deep(.file-data-table .smart-table) {
  border-radius: 0;
  background: var(--surface-card);
  box-shadow: none;
}

:deep(.file-data-table .smart-table th.el-table__cell) {
  height: 41px;
  color: var(--text-secondary);
  background: var(--surface-subtle);
}

:deep(.file-data-table .smart-table td.el-table__cell) {
  height: 45px;
}

:deep(.file-data-table .smart-table .cell) {
  padding: 0 11px;
}

:deep(.file-data-table .pagination) {
  min-height: 49px;
  margin: 0;
  padding: 7px 11px;
  border-top: 1px solid var(--border-subtle);
}

:deep(.file-data-table .pagination .el-pagination.is-background .btn-next),
:deep(.file-data-table .pagination .el-pagination.is-background .btn-prev),
:deep(.file-data-table .pagination .el-pagination.is-background .el-pager li) {
  min-width: 30px;
  height: 30px;
  border-radius: 7px;
}

.file-summary {
  display: flex;
  align-items: center;
  gap: 14px;
  color: var(--text-tertiary);
  font-size: 12px;

  strong {
    color: var(--text-primary);
  }
}

.file-summary__filter {
  color: rgb(var(--primary-color));
}

.identity-cell {
  display: flex;
  align-items: center;
  gap: 8px;

  .identity-owner {
    color: var(--text-tertiary);
    font-size: 12px;
  }
}

.file-name {
  max-width: 220px;
}

.file-name-cell {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 9px;
}

.favorite-mark {
  flex: 0 0 auto;
  color: #f59e0b;
  font-size: 13px;
}

.symlink-mark {
  flex: 0 0 auto;
  padding: 1px 5px;
  border-radius: 4px;
  color: #0891b2;
  font-size: 10px;
  background: rgba(6, 182, 212, 0.09);
}

.file-type {
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  border-radius: 5px;
  color: var(--text-tertiary);
  font-size: 11px;
  background: var(--surface-subtle);

  &.is-directory {
    color: #2563eb;
    background: rgba(59, 130, 246, 0.09);
  }

  &.is-image {
    color: #7c3aed;
    background: rgba(139, 92, 246, 0.09);
  }
}

.image-file-icon {
  width: 23px;
  height: 23px;
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 6px;
  color: #3b82f6;
  font-size: 16px;
  background: rgba(59, 130, 246, 0.1);
}

.row-actions {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, 96px) 88px;
  align-items: center;
  justify-content: end;
  justify-items: stretch;
  column-gap: 4px;
  padding: 0;
  border: 0;
  border-radius: 7px;
  background: transparent;
  opacity: 1;
  pointer-events: auto;
  transform: none;

  > * {
    min-width: 0;
  }

  :deep(.el-button) {
    width: 100%;
    min-height: 28px;
    padding: 5px 7px;
    border-radius: 6px;
    justify-content: center;
  }

  :deep(.el-button.is-link) {
    min-height: 28px;
    padding: 5px 10px;
    border: 0 !important;
    border-radius: 8px;
    font-size: 12px;
    background: transparent !important;
    box-shadow: none !important;
    transition:
      color 0.2s ease,
      background-color 0.2s ease,
      border-color 0.2s ease;

    &:hover {
      background: transparent !important;
      box-shadow: none;
    }
  }

  :deep(.action-open.is-link),
  :deep(.action-more-trigger.is-link) {
    color: var(--table-action-color) !important;

    :deep(.el-icon) {
      color: currentColor !important;
    }

    :deep(.el-button__text),
    :deep(.el-button__content),
    :deep(> span) {
      color: inherit !important;
      -webkit-text-fill-color: currentColor !important;
    }

    &:hover {
      color: var(--table-action-hover-color) !important;
      background: transparent !important;
    }
  }

  :deep(.action-copy.is-link) {
    color: #409eff !important;

    :deep(.el-icon) {
      color: currentColor !important;
    }

    :deep(.el-button__text),
    :deep(.el-button__content),
    :deep(> span) {
      color: inherit !important;
      -webkit-text-fill-color: currentColor !important;
    }

    &:hover {
      color: #409eff !important;
      background: transparent !important;
    }
  }

  :deep(.action-cut.is-link) {
    color: #e6a23c !important;

    :deep(.el-icon) {
      color: currentColor !important;
    }

    :deep(.el-button__text),
    :deep(.el-button__content),
    :deep(> span) {
      color: inherit !important;
      -webkit-text-fill-color: currentColor !important;
    }

    &:hover {
      color: #e6a23c !important;
      background: transparent !important;
    }
  }

  :deep(.action-rename.is-link) {
    color: #8b5cf6 !important;

    :deep(.el-icon) {
      color: currentColor !important;
    }

    :deep(.el-button__text),
    :deep(.el-button__content),
    :deep(> span) {
      color: inherit !important;
      -webkit-text-fill-color: currentColor !important;
    }

    &:hover {
      color: #8b5cf6 !important;
      background: transparent !important;
    }
  }

  :deep(.action-tree.is-link) {
    color: #16a085 !important;

    :deep(.el-icon) {
      color: currentColor !important;
    }

    :deep(.el-button__text),
    :deep(.el-button__content),
    :deep(> span) {
      color: inherit !important;
      -webkit-text-fill-color: currentColor !important;
    }

    &:hover {
      color: #16a085 !important;
      background: transparent !important;
    }
  }

  :deep(.row-action-danger.is-link) {
    color: var(--el-color-danger) !important;

    :deep(.el-icon) {
      color: currentColor !important;
    }

    :deep(.el-button__text),
    :deep(.el-button__content),
    :deep(> span) {
      color: inherit !important;
      -webkit-text-fill-color: currentColor !important;
    }

    &:hover {
      color: var(--el-color-danger) !important;
      background: transparent !important;
    }
  }

  :deep(.action-main) {
    font-size: 12px;
  }

  .row-action-more {
    grid-column: 4;
  }
}

.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 8px;
  padding: 10px;
}

.file-card {
  min-width: 0;
  min-height: 92px;
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) 28px;
  align-items: center;
  gap: 9px;
  padding: 10px;
  border: 1px solid var(--border-subtle);
  border-radius: 9px;
  background: var(--surface-card);
  cursor: default;
  transition:
    border-color 0.16s ease,
    background 0.16s ease,
    transform 0.16s ease;

  &:hover,
  &:focus-visible {
    border-color: rgba(var(--primary-color), 0.32);
    outline: none;
    background: rgba(var(--primary-color), 0.025);
    transform: translateY(-1px);
  }
}

.file-card__icon {
  height: 48px;
  display: grid;
  place-items: center;

  &.is-image {
    border-radius: 9px;
    color: #7c3aed;
    font-size: 28px;
    background: rgba(139, 92, 246, 0.09);
  }
}

.file-card__body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;

  strong,
  span,
  small {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    color: var(--text-primary);
    font-size: 13px;
  }

  span,
  small {
    color: var(--text-tertiary);
    font-size: 10px;
  }
}

.file-card__menu {
  align-self: start;

  .el-button {
    width: 28px;
    height: 28px;
    padding: 0;
  }
}

.file-grid-footer {
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 7px 11px;
  border-top: 1px solid var(--border-subtle);
  color: var(--text-tertiary);
  font-size: 11px;
}

@media (max-width: 1180px) {
  .navigation-bar {
    grid-template-columns: 1fr;
  }

  .command-bar {
    align-items: flex-start;
    flex-direction: column;
  }

  .command-bar__secondary {
    width: 100%;
  }

  .capacity-compact {
    flex: 1;
  }
}

@media (max-width: 720px) {
  .file-explorer {
    padding: 7px;
  }

  .navigation-bar {
    gap: 7px;
  }

  .navigation-search > .el-button {
    width: 40px;
    flex: 0 0 40px;
    padding: 0;

    :deep(> span) {
      display: none;
    }

    :deep(.el-icon) {
      margin: 0;
      color: var(--text-secondary);
    }
  }

  .command-bar__primary,
  .command-bar__secondary {
    width: 100%;
    flex-wrap: wrap;
  }

  .capacity-compact {
    width: 100%;
    flex-basis: 100%;
  }

  .clipboard-strip,
  .file-grid-footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .file-summary {
    flex-wrap: wrap;
    gap: 6px 12px;
  }

  :deep(.file-data-table .pagination.has-summary) {
    align-items: flex-start;
    flex-direction: column;
  }
}

.image-preview {
  .image-preview__stage {
    height: min(58vh, 560px);
    min-height: 360px;
    display: grid;
    place-items: center;
    overflow: hidden;
    border: 1px solid var(--border-subtle);
    border-radius: 16px;
    background: linear-gradient(
        45deg,
        rgba(148, 163, 184, 0.06) 25%,
        transparent 25%
      ),
      linear-gradient(-45deg, rgba(148, 163, 184, 0.06) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, rgba(148, 163, 184, 0.06) 75%),
      linear-gradient(-45deg, transparent 75%, rgba(148, 163, 184, 0.06) 75%),
      var(--surface-subtle);
    background-position:
      0 0,
      0 8px,
      8px -8px,
      -8px 0;
    background-size: 16px 16px;

    &.is-error {
      background: var(--surface-subtle);
    }
  }

  :deep(.image-preview__stage .el-image) {
    width: 100%;
    height: 100%;
    cursor: zoom-in;
  }

  .image-preview__message {
    color: var(--text-tertiary);
    font-size: 13px;
  }

  .image-preview__error {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    color: var(--text-tertiary);
    text-align: center;

    .el-icon {
      margin-bottom: 4px;
      color: var(--text-tertiary);
      font-size: 42px;
    }

    strong {
      color: var(--text-primary);
      font-size: 16px;
    }

    span {
      max-width: 420px;
      font-size: 13px;
      line-height: 1.6;
    }
  }

  .image-preview__meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding: 16px 2px 0;

    > div {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    strong {
      color: var(--text-primary);
      font-size: 14px;
    }

    span {
      overflow: hidden;
      color: var(--text-tertiary);
      font-size: 12px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .image-preview__hint {
    margin: 10px 0 0;
    color: var(--text-tertiary);
    font-size: 12px;
  }
}

.operation-dialog {
  min-height: 130px;
}

.copy-dialog {
  display: flex;
  flex-direction: column;
  gap: 18px;

  :deep(.el-form-item__label) {
    color: var(--text-secondary);
  }

  :deep(.el-input.is-disabled .el-input__wrapper) {
    background: var(--surface-subtle);
    box-shadow: 0 0 0 1px var(--border-default) inset;
  }

  :deep(.el-input.is-disabled .el-input__inner),
  :deep(.el-input.is-disabled .el-input__inner::placeholder) {
    color: var(--text-primary) !important;
    -webkit-text-fill-color: var(--text-primary) !important;
    opacity: 1 !important;
  }

  :deep(.el-input.is-disabled .el-input__inner::placeholder) {
    color: var(--text-placeholder) !important;
    -webkit-text-fill-color: var(--text-placeholder) !important;
  }

  :deep(.el-switch__label) {
    color: var(--text-secondary);
  }
}

.copy-dialog__form {
  :deep(.el-form-item:last-child) {
    margin-bottom: 0;
  }
}

.share-form {
  margin-top: 20px;
}

.form-unit {
  margin-left: 12px;
  color: var(--text-tertiary);
  font-size: 13px;
}

.share-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 0 4px;
  text-align: center;

  .share-result__icon {
    width: 52px;
    height: 52px;
    display: grid;
    place-items: center;
    margin-bottom: 12px;
    border-radius: 16px;
    color: rgb(var(--primary-color));
    font-size: 24px;
    background: rgba(var(--primary-color), 0.1);
  }

  strong {
    color: var(--text-primary);
    font-size: 17px;
  }

  p {
    margin: 8px 0 18px;
    color: var(--text-tertiary);
    font-size: 13px;
  }
}

.properties-panel {
  min-height: 180px;
}

.properties-heading {
  min-width: 0;

  h3 {
    margin: 0;
    color: var(--text-primary);
    font-size: 20px;
    font-weight: 760;
    line-height: 1.2;
  }

  p {
    overflow: hidden;
    margin: 6px 0 0;
    color: var(--text-tertiary);
    font-family:
      ui-monospace,
      SFMono-Regular,
      Menlo,
      Monaco,
      Consolas,
      monospace;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.properties-drawer {
  padding-top: 4px;
}

.properties-list {
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--border-subtle) 82%, transparent);
  border-radius: 20px;
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--surface-card) 96%, white 4%) 0%,
      color-mix(in srgb, var(--surface-card) 92%, transparent) 100%
    );
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
}

.properties-row {
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr);
  align-items: start;

  & + & {
    border-top: 1px solid color-mix(in srgb, var(--border-subtle) 76%, transparent);
  }

  > span,
  > strong {
    min-width: 0;
    padding: 16px 18px;
    line-height: 1.6;
  }

  > span {
    color: var(--text-secondary);
    font-size: 14px;
    font-weight: 700;
    background: color-mix(in srgb, var(--surface-card) 76%, white 24%);
    border-right: 1px solid color-mix(in srgb, var(--border-subtle) 76%, transparent);
  }

  > strong {
    color: var(--text-primary);
    font-size: 14px;
    font-weight: 520;
    background: color-mix(in srgb, var(--surface-card) 92%, transparent);
  }
}

.break-path {
  word-break: break-all;
}

@media (max-width: 980px) {
  .properties-row {
    grid-template-columns: 1fr;

    > span {
      border-right: 0;
      border-bottom: 1px solid color-mix(in srgb, var(--border-subtle) 76%, transparent);
    }
  }
}

:global(.favorite-menu) {
  min-width: 260px;
  max-width: 420px;
}

:global(.favorite-menu .el-dropdown-menu__item) {
  gap: 8px;
}

:global(.favorite-menu .favorite-name) {
  max-width: 120px;
  overflow: hidden;
  color: var(--text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

:global(.favorite-menu small) {
  max-width: 180px;
  overflow: hidden;
  color: var(--text-tertiary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

:global(.file-action-menu) {
  max-height: 264px;
}

:global(html.dark .file-action-menu .el-dropdown-menu__item:not(.table-action-menu__danger)) {
  color: var(--text-secondary) !important;
}

:global(html.dark .file-action-menu .el-dropdown-menu__item:not(.table-action-menu__danger) .el-icon) {
  color: inherit !important;
}

.archive-task-drawer {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.archive-task-overview {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.archive-task-overview__card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px;
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  background: var(--surface-card);

  strong {
    color: var(--text-primary);
    font-size: 24px;
    line-height: 1;
  }

  span {
    color: var(--text-tertiary);
    font-size: 12px;
  }
}

.archive-task-sections {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.archive-task-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.archive-task-section__title {
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 600;
}

.archive-task-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  background: var(--surface-card);
}

.archive-task-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;

  > div {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  strong {
    overflow: hidden;
    color: var(--text-primary);
    font-size: 14px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  small {
    color: var(--text-tertiary);
    font-size: 12px;
  }
}

.archive-task-card__message {
  margin: 0;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.5;
}

.archive-task-progress {
  position: relative;
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--surface-subtle);

  span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(
      90deg,
      rgba(var(--primary-color), 0.75),
      rgba(var(--primary-color), 1)
    );
    transition: width 0.3s ease;
  }

  &.is-indeterminate span {
    width: 42% !important;
    animation: archive-progress-indeterminate 1.3s ease-in-out infinite;
  }
}

.archive-task-card__meta,
.archive-task-card__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--text-tertiary);
  font-size: 12px;
}

.archive-task-card__actions {
  justify-content: flex-end;
}

.archive-task-card__path {
  overflow: hidden;
  color: var(--text-tertiary);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@keyframes archive-progress-indeterminate {
  0% {
    transform: translateX(-120%);
  }

  100% {
    transform: translateX(260%);
  }
}

@media (max-width: 768px) {
  .archive-task-overview {
    grid-template-columns: 1fr;
  }

  .archive-task-card__header,
  .archive-task-card__meta {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
