import { reactive } from 'vue'
import { Api } from '@/api/Api'
import System from '@/utils/System'

export interface SoftwareTask {
  id: string
  operation: 'install' | 'upgrade' | 'uninstall' | 'start' | 'stop' | 'restart' | 'reload' | 'configure'
  component: string
  softwareKey: string
  requestedVersion: string
  resolvedVersion?: string
  packageSource?: string
  status: string
  phase: string
  phaseProgress?: number
  progress: number
  message: string
  errorCode?: string
  errorMessage?: string
  failurePhase?: string
  rollbackStatus: string
  recoveryStatus?: string
  recoveryMessage?: string
  cancelRequested: boolean
  eventSeq: number
  startedAt?: string
  finishedAt?: string
  createdAt: string
  updatedAt: string
}

interface TaskEvent {
  taskId: string
  seq: number
  type: string
  status: string
  phase: string
  phaseProgress?: number
  progress: number
  code?: string
  message: string
  createdAt: string
}

export interface SoftwareTaskStats {
  since: string
  total: number
  active: number
  succeeded: number
  failed: number
  canceled: number
  interrupted: number
  successRate: number
  averageDurationSeconds: number
}

const terminalStatuses = new Set(['succeeded', 'failed', 'canceled', 'interrupted'])
const eventSources = new Map<string, EventSource>()
const reconnectTimers = new Map<string, number>()
const logPollTimers = new Map<string, number>()
const snapshotPollTimers = new Map<string, number>()
const logFetches = new Map<string, Promise<any>>()

const taskURL = (path: string) => {
  const apiBase = new URL(System.env.API || '/v1', window.location.origin)
  const prefix = apiBase.pathname.replace(/\/$/, '')
  return new URL(`${prefix}/soft/tasks/${path.replace(/^\//, '')}`, apiBase.origin).toString()
}

export const softwareTaskStore = reactive({
  tasks: {} as Record<string, SoftwareTask>,
  order: [] as string[],
  logs: {} as Record<string, string>,
  logCursors: {} as Record<string, number>,
  loading: false,
  historyTotal: 0,
  stats: null as SoftwareTaskStats | null,
  terminalRevision: 0,

  isTerminal(status?: string) {
    return !!status && terminalStatuses.has(status)
  },

  activeForKey(key: string) {
    return Object.values(softwareTaskStore.tasks)
      .filter((task) => task.softwareKey === key && !softwareTaskStore.isTerminal(task.status))
      .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))[0]
  },

  recentTasks() {
    return softwareTaskStore.order
      .map((id) => softwareTaskStore.tasks[id])
      .filter(Boolean)
      .slice(0, 10)
  },

  async loadActive() {
    softwareTaskStore.loading = true
    try {
      const { data: result } = await Api.getSoftwareTasks({ active: true, pageSize: 100 })
      const tasks = result?.data ?? []
      softwareTaskStore.ingest(tasks)
      tasks.forEach((task: SoftwareTask) => {
        softwareTaskStore.connect(task.id)
      })
    } finally {
      softwareTaskStore.loading = false
    }
  },

  async loadHistory(page = 1, pageSize = 20) {
    const { data: result } = await Api.getSoftwareTasks({ page, pageSize })
    const tasks = (result?.data ?? []) as SoftwareTask[]
    softwareTaskStore.historyTotal = result?.total ?? tasks.length
    softwareTaskStore.ingest(tasks)
    tasks.forEach((task) => {
      if (!softwareTaskStore.isTerminal(task.status)) {
        softwareTaskStore.connect(task.id)
      }
    })
    return result
  },

  async loadStats(days = 30) {
    const { data } = await Api.getSoftwareTaskStats({ days })
    softwareTaskStore.stats = data as SoftwareTaskStats
    return softwareTaskStore.stats
  },

  async loadAll() {
    softwareTaskStore.loading = true
    try {
      await Promise.all([
        softwareTaskStore.loadActive(),
        softwareTaskStore.loadHistory(),
        softwareTaskStore.loadStats()
      ])
    } finally {
      softwareTaskStore.loading = false
    }
  },

  async track(taskId: string) {
    const { data: task } = await Api.getSoftwareTask(taskId)
    softwareTaskStore.upsert(task)
    if (softwareTaskStore.isTerminal(task.status)) {
      softwareTaskStore.close(taskId)
    } else {
      softwareTaskStore.connect(taskId)
    }
    return task as SoftwareTask
  },

  acceptCreated(data: any, request: any) {
    const now = new Date().toISOString()
    const operation = data.operation || 'install'
    const operationMessages: Record<string, string> = {
      uninstall: 'Task entered the uninstall queue',
      start: 'Task entered the start queue',
      stop: 'Task entered the stop queue',
      restart: 'Task entered the restart queue',
      reload: 'Task entered the reload queue',
      configure: 'Task entered the configuration queue'
    }
    softwareTaskStore.upsert({
      id: data.taskId,
      operation,
      component: data.component,
      softwareKey: request.key,
      requestedVersion: request.version,
      status: data.status,
      phase: data.status,
      progress: data.progress ?? 0,
      message: operationMessages[operation] || 'Task entered the install queue',
      rollbackStatus: 'not_required',
      cancelRequested: false,
      eventSeq: 0,
      createdAt: now,
      updatedAt: now
    })
    softwareTaskStore.connect(data.taskId)
    void softwareTaskStore.track(data.taskId)
  },

  upsert(task: SoftwareTask) {
    const current = softwareTaskStore.tasks[task.id]
    const next = current ? { ...current, ...task } : task
    softwareTaskStore.tasks[task.id] = next
    softwareTaskStore.order = [
      task.id,
      ...softwareTaskStore.order.filter((id) => id !== task.id)
    ]
    if (
      current &&
      !softwareTaskStore.isTerminal(current.status) &&
      softwareTaskStore.isTerminal(next.status)
    ) {
      softwareTaskStore.terminalRevision++
    }
  },

  ingest(tasks: SoftwareTask[]) {
    const ids = tasks.map((task) => task.id)
    tasks.forEach((task) => {
      const current = softwareTaskStore.tasks[task.id]
      const next = current ? { ...current, ...task } : task
      softwareTaskStore.tasks[task.id] = next
      if (
        current &&
        !softwareTaskStore.isTerminal(current.status) &&
        softwareTaskStore.isTerminal(next.status)
      ) {
        softwareTaskStore.terminalRevision++
      }
    })
    softwareTaskStore.order = [
      ...ids,
      ...softwareTaskStore.order.filter((id) => !ids.includes(id))
    ]
  },

  connect(taskId: string) {
    if (eventSources.has(taskId) || softwareTaskStore.isTerminal(softwareTaskStore.tasks[taskId]?.status)) {
      return
    }
    const source = new EventSource(taskURL(`${taskId}/events`), { withCredentials: true })
    eventSources.set(taskId, source)
    softwareTaskStore.startLogPolling(taskId)
    const handleEvent = (raw: MessageEvent) => {
      const event = JSON.parse(raw.data) as TaskEvent
      const current = softwareTaskStore.tasks[taskId]
      if (!current || event.seq <= (current.eventSeq || 0)) return
      softwareTaskStore.upsert({
        ...current,
        status: event.status,
        phase: event.phase,
        phaseProgress: event.phaseProgress,
        progress: event.progress,
        message: event.message,
        errorCode: event.code || current.errorCode,
        eventSeq: event.seq,
        updatedAt: event.createdAt
      })
      void softwareTaskStore.fetchLog(taskId).catch(() => undefined)
      if (softwareTaskStore.isTerminal(event.status)) {
        softwareTaskStore.close(taskId)
        void softwareTaskStore.track(taskId)
        void softwareTaskStore.loadHistory().catch(() => undefined)
        void softwareTaskStore.loadStats().catch(() => undefined)
      }
    }
    ;['snapshot', 'phase', 'progress', 'warning', 'terminal'].forEach((type) => {
      source.addEventListener(type, handleEvent as EventListener)
    })
    source.onopen = () => {
      window.clearInterval(snapshotPollTimers.get(taskId))
      snapshotPollTimers.delete(taskId)
    }
    source.onerror = () => {
      if (softwareTaskStore.isTerminal(softwareTaskStore.tasks[taskId]?.status)) return
      softwareTaskStore.startSnapshotPolling(taskId)
      if (source.readyState !== EventSource.CLOSED) return
      eventSources.delete(taskId)
      window.clearTimeout(reconnectTimers.get(taskId))
      reconnectTimers.set(taskId, window.setTimeout(() => {
        void softwareTaskStore.track(taskId).catch(() => undefined)
      }, 3000))
    }
  },

  async fetchLog(taskId: string) {
    const activeRequest = logFetches.get(taskId)
    if (activeRequest) return activeRequest

    const request = (async () => {
      const cursor = softwareTaskStore.logCursors[taskId] || 0
      const { data: chunk } = await Api.getSoftwareTaskLog(taskId, { cursor, limit: 65536 })
      if (chunk.content) {
        softwareTaskStore.logs[taskId] = (softwareTaskStore.logs[taskId] || '') + chunk.content
      }
      softwareTaskStore.logCursors[taskId] = chunk.nextCursor
      return chunk
    })()
    logFetches.set(taskId, request)
    try {
      return await request
    } finally {
      if (logFetches.get(taskId) === request) {
        logFetches.delete(taskId)
      }
    }
  },

  async cancel(taskId: string) {
    const { data: task } = await Api.cancelSoftwareTask(taskId)
    softwareTaskStore.upsert(task)
  },

  async downloadLog(taskId: string) {
    const response = await fetch(taskURL(`${taskId}/log/download`), {
      credentials: 'include',
      headers: { Accept: 'text/plain' }
    })
    if (!response.ok) {
      let message = `Failed to download logs (HTTP ${response.status})`
      try {
        const body = await response.json()
        message = body?.message || body?.error?.message || message
      } catch {
        // Keep the status-based message when the response is not JSON.
      }
      throw new Error(message)
    }
    const blob = await response.blob()
    const objectURL = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    const disposition = response.headers.get('Content-Disposition') || ''
    const encodedName = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
    link.href = objectURL
    link.download = encodedName
      ? decodeURIComponent(encodedName)
      : `oneinstack-software-${taskId}.log`
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(objectURL)
  },

  close(taskId: string) {
    eventSources.get(taskId)?.close()
    eventSources.delete(taskId)
    window.clearTimeout(reconnectTimers.get(taskId))
    reconnectTimers.delete(taskId)
    window.clearInterval(logPollTimers.get(taskId))
    logPollTimers.delete(taskId)
    window.clearInterval(snapshotPollTimers.get(taskId))
    snapshotPollTimers.delete(taskId)
  },

  startLogPolling(taskId: string) {
    if (logPollTimers.has(taskId)) return
    void softwareTaskStore.fetchLog(taskId).catch(() => undefined)
    logPollTimers.set(taskId, window.setInterval(() => {
      if (softwareTaskStore.isTerminal(softwareTaskStore.tasks[taskId]?.status)) {
        window.clearInterval(logPollTimers.get(taskId))
        logPollTimers.delete(taskId)
        return
      }
      void softwareTaskStore.fetchLog(taskId).catch(() => undefined)
    }, 2000))
  },

  startSnapshotPolling(taskId: string) {
    if (snapshotPollTimers.has(taskId)) return
    snapshotPollTimers.set(taskId, window.setInterval(() => {
      void softwareTaskStore.track(taskId).catch(() => undefined)
    }, 3000))
  }
})

export default softwareTaskStore
