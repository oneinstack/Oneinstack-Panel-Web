import { defineStore } from "pinia";
import { Api } from "@/api/modules";
import { useConfigStore } from "@/stores/modules/config";
import System from "@/utils/System";
import { SESSION_LOGOUT_EVENT } from "@/utils/session";

export interface SoftwareTask {
  id: string;
  operation:
    | "install"
    | "upgrade"
    | "uninstall"
    | "start"
    | "stop"
    | "restart"
    | "reload"
    | "configure";
  component: string;
  softwareKey: string;
  requestedVersion: string;
  resolvedVersion?: string;
  packageSource?: string;
  status: string;
  phase: string;
  phaseProgress?: number;
  progress: number;
  message: string;
  errorCode?: string;
  errorMessage?: string;
  failurePhase?: string;
  rollbackStatus: string;
  recoveryStatus?: string;
  recoveryMessage?: string;
  cancelRequested: boolean;
  eventSeq: number;
  startedAt?: string;
  finishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface TaskEvent {
  taskId: string;
  seq: number;
  type: string;
  status: string;
  phase: string;
  phaseProgress?: number;
  progress: number;
  code?: string;
  message: string;
  createdAt: string;
}

export interface SoftwareTaskStats {
  since: string;
  total: number;
  active: number;
  succeeded: number;
  failed: number;
  canceled: number;
  interrupted: number;
  successRate: number;
  averageDurationSeconds: number;
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
let logoutListenerBound = false;

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
};

if (typeof window !== "undefined" && !logoutListenerBound) {
  logoutListenerBound = true;
  window.addEventListener(SESSION_LOGOUT_EVENT, clearSessionWork);
}

const taskURL = (path: string) => {
  const apiBase = new URL(System.env.API || "/v1", window.location.origin);
  const prefix = apiBase.pathname.replace(/\/$/, "");
  return new URL(
    `${prefix}/soft/tasks/${path.replace(/^\//, "")}`,
    apiBase.origin,
  ).toString();
};

export const useSoftwareTaskStore = defineStore("softwareTask", {
  state: () => ({
    tasks: {} as Record<string, SoftwareTask>,
    order: [] as string[],
    logs: {} as Record<string, string>,
    logCursors: {} as Record<string, number>,
    loading: false,
    historyTotal: 0,
    stats: null as SoftwareTaskStats | null,
    terminalRevision: 0,
  }),
  actions: {
    isTerminal(status?: string) {
      return !!status && terminalStatuses.has(status);
    },

    canReadTaskList() {
      return useConfigStore().hasScopeAccess("software", "read");
    },

    activeForKey(key: string) {
      return Object.values(this.tasks)
        .filter(
          (task) =>
            task.softwareKey === key &&
            !this.isTerminal(task.status),
        )
        .sort(
          (left, right) =>
            Date.parse(right.createdAt) - Date.parse(left.createdAt),
        )[0];
    },

    recentTasks() {
      return this.order
        .map((id) => this.tasks[id])
        .filter(Boolean)
        .slice(0, 10);
    },

    async loadActive() {
      if (!this.canReadTaskList()) return;
      this.loading = true;
      try {
        const { data: result } = await Api.getSoftwareTasks({
          active: true,
          pageSize: 100,
        });
        const tasks = result?.data ?? [];
        this.ingest(tasks);
        tasks.forEach((task: SoftwareTask) => {
          this.connect(task.id);
        });
      } finally {
        this.loading = false;
      }
    },

    async loadHistory(page = 1, pageSize = 20) {
      if (!this.canReadTaskList()) {
        this.historyTotal = 0;
        return { data: [], total: 0 };
      }
      const { data: result } = await Api.getSoftwareTasks({ page, pageSize });
      const tasks = (result?.data ?? []) as SoftwareTask[];
      this.historyTotal = result?.total ?? tasks.length;
      this.ingest(tasks);
      tasks.forEach((task) => {
        if (!this.isTerminal(task.status)) {
          this.connect(task.id);
        }
      });
      return result;
    },

    async loadStats(days = 30) {
      const { data } = await Api.getSoftwareTaskStats({ days });
      this.stats = data as SoftwareTaskStats;
      return this.stats;
    },

    async loadAll() {
      this.loading = true;
      try {
        await Promise.all([
          this.loadActive(),
          this.loadHistory(),
          this.loadStats(),
        ]);
      } finally {
        this.loading = false;
      }
    },

    async track(taskId: string) {
      const { data: task } = await Api.getSoftwareTask(taskId);
      this.upsert(task);
      if (this.isTerminal(task.status)) {
        this.close(taskId);
      } else {
        this.connect(taskId);
      }
      return task as SoftwareTask;
    },

    acceptCreated(data: any, request: any) {
      const now = new Date().toISOString();
      const operation = data.operation || "install";
      const operationMessages: Record<string, string> = {
        uninstall: "Task entered the uninstall queue",
        start: "Task entered the start queue",
        stop: "Task entered the stop queue",
        restart: "Task entered the restart queue",
        reload: "Task entered the reload queue",
        configure: "Task entered the configuration queue",
      };
      this.upsert({
        id: data.taskId,
        operation,
        component: data.component,
        softwareKey: request.key,
        requestedVersion: request.version,
        status: data.status,
        phase: data.status,
        progress: data.progress ?? 0,
        message:
          operationMessages[operation] || "Task entered the install queue",
        rollbackStatus: "not_required",
        cancelRequested: false,
        eventSeq: 0,
        createdAt: now,
        updatedAt: now,
      });
      this.connect(data.taskId);
      void this.track(data.taskId);
    },

    upsert(task: SoftwareTask) {
      const current = this.tasks[task.id];
      const next = current ? { ...current, ...task } : task;
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
    },

    ingest(tasks: SoftwareTask[]) {
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
      const source = new EventSource(taskURL(`${taskId}/events`), {
        withCredentials: true,
      });
      eventSources.set(taskId, source);
      this.startLogPolling(taskId);
      const handleEvent = (raw: MessageEvent) => {
        const event = JSON.parse(raw.data) as TaskEvent;
        const current = this.tasks[taskId];
        if (!current || event.seq <= (current.eventSeq || 0)) return;
        this.upsert({
          ...current,
          status: event.status,
          phase: event.phase,
          phaseProgress: event.phaseProgress,
          progress: event.progress,
          message: event.message,
          errorCode: event.code || current.errorCode,
          eventSeq: event.seq,
          updatedAt: event.createdAt,
        });
        void this.fetchLog(taskId).catch(() => undefined);
        if (this.isTerminal(event.status)) {
          this.close(taskId);
          void this.track(taskId);
          void this.loadHistory().catch(() => undefined);
          void this.loadStats().catch(() => undefined);
        }
      };
      ["snapshot", "phase", "progress", "warning", "terminal"].forEach(
        (type) => {
          source.addEventListener(type, handleEvent as EventListener);
        },
      );
      source.onopen = () => {
        window.clearInterval(snapshotPollTimers.get(taskId));
        snapshotPollTimers.delete(taskId);
      };
      source.onerror = () => {
        if (
          this.isTerminal(this.tasks[taskId]?.status)
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
        const { data: chunk } = await Api.getSoftwareTaskLog(taskId, {
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
        if (logFetches.get(taskId) === request) {
          logFetches.delete(taskId);
        }
      }
    },

    async cancel(taskId: string) {
      const { data: task } = await Api.cancelSoftwareTask(taskId);
      this.upsert(task);
    },

    async downloadLog(taskId: string) {
      await Api.downloadSoftwareTaskLog(taskId);
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
});
