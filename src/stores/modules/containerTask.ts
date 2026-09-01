import { defineStore } from "pinia";
import { Api } from "@/api/modules";
import System from "@/utils/System";
import { piniaPersistConfig } from "@/stores/helper/persist";
import i18n from "@/lang";
import { SESSION_LOGOUT_EVENT } from "@/utils/session";

export interface ContainerTask {
  id: string;
  operation: "pull" | "build" | "create" | string;
  status: string;
  phase: string;
  phaseProgress?: number | null;
  progress: number;
  message: string;
  details?: Array<Record<string, any>>;
  containerId?: string;
  errorCode?: string;
  errorMessage?: string;
  cancelRequested?: boolean;
  eventSeq: number;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  finishedAt?: string;
  resourceName?: string;
  autoStartStatus?: "pending" | "starting" | "succeeded" | "failed";
  autoStartError?: string;
}

interface ContainerTaskEvent {
  seq: number;
  type: string;
  status: string;
  phase: string;
  phaseProgress?: number | null;
  progress: number;
  message: string;
  details?: Array<Record<string, any>>;
  log?: string;
  code?: string;
  errorMessage?: string;
  createdAt?: string;
}

interface ContainerTaskState {
  tasks: Record<string, ContainerTask>;
  order: string[];
  logs: Record<string, string>;
  logCursors: Record<string, number>;
  loading: boolean;
  terminalRevision: number;
  autoStartTaskIds: string[];
}

const terminalStatuses = new Set([
  "succeeded",
  "failed",
  "canceled",
  "interrupted",
]);
const eventSources = new Map<string, EventSource>();
const reconnectTimers = new Map<string, number>();
const logPollTimers = new Map<string, number>();
const snapshotPollTimers = new Map<string, number>();
const logFetches = new Map<string, Promise<any>>();
const autoStartInFlight = new Set<string>();
let logoutListenerBound = false;
const t = (key: string, fallback?: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params);
  return value && value !== key ? value : fallback || key;
};

const normalizeProgress = (value?: number | null) => {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return Math.min(100, Math.max(0, value));
};

const mergeProgress = (current?: ContainerTask, next?: ContainerTask) => {
  const currentProgress = normalizeProgress(current?.progress);
  const incomingProgress = normalizeProgress(next?.progress);
  if (next?.status === "succeeded") return 100;
  if (currentProgress == null) {
    return incomingProgress ?? 0;
  }
  if (!next) {
    return currentProgress;
  }
  return Math.max(currentProgress, incomingProgress ?? currentProgress);
};

const clearSessionWork = () => {
  eventSources.forEach((source) => {
    source.close();
  });
  eventSources.clear();
  reconnectTimers.forEach((timer) => window.clearTimeout(timer));
  reconnectTimers.clear();
  logPollTimers.forEach((timer) => window.clearInterval(timer));
  logPollTimers.clear();
  snapshotPollTimers.forEach((timer) => window.clearInterval(timer));
  snapshotPollTimers.clear();
  logFetches.clear();
  autoStartInFlight.clear();
};

if (typeof window !== "undefined" && !logoutListenerBound) {
  logoutListenerBound = true;
  window.addEventListener(SESSION_LOGOUT_EVENT, clearSessionWork);
}

const taskURL = (path: string) => {
  const apiBase = new URL(System.env.API || "/v1", window.location.origin);
  const prefix = apiBase.pathname.replace(/\/$/, "");
  return new URL(
    `${prefix}/containers/tasks/${path.replace(/^\//, "")}`,
    apiBase.origin,
  ).toString();
};

const operationFallbackMessage: Record<string, string> = {
  pull: "Image pull task created",
  build: "Image build task created",
  create: "Container creation task created",
};

const normalizeCreatedTaskPayload = (data: any) => {
  const envelope = data?.data ?? data ?? {};
  const payload = envelope?.data ?? envelope ?? {};
  return {
    taskId:
      payload?.taskId ||
      envelope?.taskId ||
      payload?.id ||
      envelope?.id,
    payload,
  };
};

export const useContainerTaskStore = defineStore("containerTask", {
  state: (): ContainerTaskState => ({
    tasks: {} as Record<string, ContainerTask>,
    order: [] as string[],
    logs: {} as Record<string, string>,
    logCursors: {} as Record<string, number>,
    loading: false,
    terminalRevision: 0,
    autoStartTaskIds: [] as string[],
  }),
  actions: {
    isTerminal(status?: string) {
      return !!status && terminalStatuses.has(status);
    },

    async loadActive() {
      this.loading = true;
      try {
        const { data: result } = await Api.getContainerTasks({
          active: true,
          pageSize: 100,
        });
        const tasks = Array.isArray(result)
          ? result
          : Array.isArray(result?.data)
            ? result.data
            : result?.items || [];
        this.ingest(tasks);
        tasks.forEach((task: ContainerTask) => {
          if (!this.isTerminal(task.status))
            this.connect(task.id);
        });
        this.autoStartTaskIds.forEach((taskId) => {
          const task = this.tasks[taskId];
          if (task) void this.startCreatedContainer(task);
          else void this.track(taskId).catch(() => undefined);
        });
      } finally {
        this.loading = false;
      }
    },

    async track(taskId: string) {
      const { data: task } = await Api.getContainerTask(taskId);
      this.upsert(task);
      if (this.isTerminal(task.status)) {
        this.close(taskId);
      } else {
        this.connect(taskId);
      }
      return task as ContainerTask;
    },

    acceptCreated(data: any, request: Record<string, any> = {}) {
      const now = new Date().toISOString();
      const { taskId: id, payload } = normalizeCreatedTaskPayload(data);
      if (!id) return;
      const operation = payload?.operation || data?.operation || request.operation || "create";
      const resourceName =
        request.name ||
        request.image ||
        request.reference ||
        request.imageName ||
        request.buildName;
      this.upsert({
        id,
        operation,
        status: payload?.status || data?.status || "queued",
        phase: payload?.phase || payload?.status || data?.phase || data?.status || "queued",
        progress: payload?.progress ?? data?.progress ?? 0,
        phaseProgress: payload?.phaseProgress ?? data?.phaseProgress,
        message:
          payload?.message || data?.message || operationFallbackMessage[operation] || "Task created",
        details: payload?.details || data?.details || [],
        containerId: payload?.containerId || data?.containerId,
        errorCode: payload?.errorCode || data?.errorCode,
        errorMessage: payload?.errorMessage || data?.errorMessage,
        cancelRequested: false,
        eventSeq: payload?.eventSeq || data?.eventSeq || 0,
        createdAt: payload?.createdAt || data?.createdAt || now,
        updatedAt: payload?.updatedAt || data?.updatedAt || now,
        resourceName,
        autoStartStatus: request.startAfterCreate ? "pending" : undefined,
      });
      if (operation === "create" && request.startAfterCreate) {
        this.autoStartTaskIds = Array.from(
          new Set([...this.autoStartTaskIds, id]),
        );
      }
      this.connect(id);
      void this.track(id).catch(() => undefined);
    },

    upsert(task: ContainerTask) {
      const current = this.tasks[task.id];
      const next = current
        ? {
            ...current,
            ...task,
            progress: mergeProgress(current, task),
            phaseProgress: task.phaseProgress ?? current.phaseProgress,
          }
        : {
            ...task,
            progress: normalizeProgress(task.progress) ?? 0,
          };
      this.tasks[task.id] = next;
      this.order = [
        task.id,
        ...this.order.filter((id) => id !== task.id),
      ];
      if (
        current &&
        !this.isTerminal(current.status) &&
        this.isTerminal(next.status)
      ) {
        this.terminalRevision++;
      }
      if (
        next.operation === "create" &&
        this.isTerminal(next.status) &&
        next.status !== "succeeded"
      ) {
        this.autoStartTaskIds = this.autoStartTaskIds.filter(
          (taskId) => taskId !== next.id,
        );
      }
      void this.startCreatedContainer(next);
    },

    async startCreatedContainer(task: ContainerTask) {
      if (
        task.operation !== "create" ||
        task.status !== "succeeded" ||
        !task.containerId ||
        !this.autoStartTaskIds.includes(task.id) ||
        autoStartInFlight.has(task.id)
      ) {
        return;
      }
      autoStartInFlight.add(task.id);
      this.tasks[task.id] = {
        ...task,
        autoStartStatus: "starting",
        autoStartError: undefined,
      };
      try {
        await Api.runContainerAction(task.containerId, {
          action: "start",
          confirm: false,
        });
        this.autoStartTaskIds = this.autoStartTaskIds.filter(
          (taskId) => taskId !== task.id,
        );
        this.tasks[task.id] = {
          ...this.tasks[task.id],
          autoStartStatus: "succeeded",
        };
        this.terminalRevision++;
      } catch (error: any) {
        this.autoStartTaskIds = this.autoStartTaskIds.filter(
          (taskId) => taskId !== task.id,
        );
        this.tasks[task.id] = {
          ...this.tasks[task.id],
          autoStartStatus: "failed",
          autoStartError:
            error?.message ||
            t(
              "container.task.autoStartFailed",
              "Container created, but automatic startup failed. Start or remove it manually.",
            ),
        };
      } finally {
        autoStartInFlight.delete(task.id);
      }
    },

    ingest(tasks: ContainerTask[]) {
      const ids = tasks.map((task) => task.id);
      tasks.forEach((task) => {
        const current = this.tasks[task.id];
        const next = current ? { ...current, ...task } : task;
        this.tasks[task.id] = next;
        if (
          current &&
          !this.isTerminal(current.status) &&
          this.isTerminal(next.status)
        ) {
          this.terminalRevision++;
        }
      });
      this.order = [
        ...ids,
        ...this.order.filter((id) => !ids.includes(id)),
      ];
    },

    connect(taskId: string) {
      if (
        eventSources.has(taskId) ||
        this.isTerminal(this.tasks[taskId]?.status)
      ) {
        return;
      }
      const after = this.tasks[taskId]?.eventSeq || 0;
      const source = new EventSource(
        taskURL(`${taskId}/events${after ? `?after=${after}` : ""}`),
        { withCredentials: true },
      );
      eventSources.set(taskId, source);
      this.startLogPolling(taskId);
      const handleEvent = (raw: MessageEvent) => {
        const event = JSON.parse(raw.data) as ContainerTaskEvent;
        const current = this.tasks[taskId];
        if (!current || event.seq <= (current.eventSeq || 0)) return;
        this.upsert({
          ...current,
          status: event.status,
          phase: event.phase,
          phaseProgress: event.phaseProgress,
          progress: event.progress,
          message: event.message,
          details: event.details || current.details,
          errorCode: event.code || current.errorCode,
          errorMessage: event.errorMessage || current.errorMessage,
          eventSeq: event.seq,
          updatedAt: event.createdAt || new Date().toISOString(),
        });
        // The log endpoint is the single source of truth for output. The SSE
        // event may carry the same bytes, so appending both streams duplicates
        // Docker lines (for example, "StartedStarted").
        void this.fetchLog(taskId).catch(() => undefined);
        if (this.isTerminal(event.status)) {
          this.close(taskId);
          void this.track(taskId).catch(() => undefined);
        }
      };
      ["snapshot", "phase", "progress", "terminal"].forEach((type) => {
        source.addEventListener(type, handleEvent as EventListener);
      });
      source.onopen = () => {
        window.clearInterval(snapshotPollTimers.get(taskId));
        snapshotPollTimers.delete(taskId);
      };
      source.onerror = () => {
        if (
          this.isTerminal(
            this.tasks[taskId]?.status,
          )
        )
          return;
        this.startSnapshotPolling(taskId);
        if (source.readyState !== EventSource.CLOSED) return;
        eventSources.delete(taskId);
        window.clearTimeout(reconnectTimers.get(taskId));
        reconnectTimers.set(
          taskId,
          window.setTimeout(() => {
            void this.track(taskId).catch(() => undefined);
          }, 3000),
        );
      };
    },

    async fetchLog(taskId: string) {
      const activeRequest = logFetches.get(taskId);
      if (activeRequest) return activeRequest;
      const request = (async () => {
        const cursor = this.logCursors[taskId] || 0;
        const { data: chunk } = await Api.getContainerTaskLog(taskId, {
          cursor,
          limit: 65536,
        });
        if (chunk.content) {
          this.logs[taskId] =
            (this.logs[taskId] || "") + chunk.content;
        }
        this.logCursors[taskId] = chunk.nextCursor;
        return chunk;
      })();
      logFetches.set(taskId, request);
      try {
        return await request;
      } finally {
        if (logFetches.get(taskId) === request) logFetches.delete(taskId);
      }
    },

    async cancel(taskId: string) {
      const { data: task } = await Api.cancelContainerTask(taskId);
      this.upsert(task);
    },

    async downloadLog(taskId: string) {
      await Api.downloadContainerTaskLog(taskId);
    },

    close(taskId: string) {
      eventSources.get(taskId)?.close();
      eventSources.delete(taskId);
      window.clearTimeout(reconnectTimers.get(taskId));
      reconnectTimers.delete(taskId);
      window.clearInterval(logPollTimers.get(taskId));
      logPollTimers.delete(taskId);
      window.clearInterval(snapshotPollTimers.get(taskId));
      snapshotPollTimers.delete(taskId);
    },

    startLogPolling(taskId: string) {
      if (logPollTimers.has(taskId)) return;
      void this.fetchLog(taskId).catch(() => undefined);
      logPollTimers.set(
        taskId,
        window.setInterval(() => {
          if (
            this.isTerminal(
              this.tasks[taskId]?.status,
            )
          ) {
            window.clearInterval(logPollTimers.get(taskId));
            logPollTimers.delete(taskId);
            return;
          }
          void this.fetchLog(taskId).catch(() => undefined);
        }, 2000),
      );
    },

    startSnapshotPolling(taskId: string) {
      if (snapshotPollTimers.has(taskId)) return;
      snapshotPollTimers.set(
        taskId,
        window.setInterval(() => {
          void this.track(taskId).catch(() => undefined);
        }, 3000),
      );
    },
  },
  persist: piniaPersistConfig<ContainerTaskState>(
    "oneinstack_container_tasks",
    localStorage,
    ["autoStartTaskIds"],
  ),
});
