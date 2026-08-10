import { reactive } from 'vue'
import { Api } from '@/api/Api'
import System from '@/utils/System'

export interface ContainerTask {
  id: string
  operation: 'pull' | 'build' | 'create' | string
  status: string
  phase: string
  phaseProgress?: number | null
  progress: number
  message: string
  details?: Array<Record<string, any>>
  containerId?: string
  errorCode?: string
  errorMessage?: string
  cancelRequested?: boolean
  eventSeq: number
  createdAt: string
  updatedAt: string
  startedAt?: string
  finishedAt?: string
  resourceName?: string
}

interface ContainerTaskEvent {
  seq: number
  type: string
  status: string
  phase: string
  phaseProgress?: number | null
  progress: number
  message: string
  details?: Array<Record<string, any>>
  log?: string
  code?: string
  createdAt?: string
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
  return new URL(`${prefix}/containers/tasks/${path.replace(/^\//, '')}`, apiBase.origin).toString()
}

const operationFallbackMessage: Record<string, string> = {
  pull: 'Image pull task created',
  build: 'Image build task created',
  create: 'Container creation task created'
}

export const containerTaskStore = reactive({
  tasks: {} as Record<string, ContainerTask>,
  order: [] as string[],
  logs: {} as Record<string, string>,
  logCursors: {} as Record<string, number>,
  loading: false,
  terminalRevision: 0,

  isTerminal(status?: string) {
    return !!status && terminalStatuses.has(status)
  },

  async loadActive() {
    containerTaskStore.loading = true
    try {
      const { data: result } = await Api.getContainerTasks({ active: true, pageSize: 100 })
      const tasks = Array.isArray(result) ? result : Array.isArray(result?.data) ? result.data : result?.items || []
      containerTaskStore.ingest(tasks)
      tasks.forEach((task: ContainerTask) => {
        if (!containerTaskStore.isTerminal(task.status)) containerTaskStore.connect(task.id)
      })
    } finally {
      containerTaskStore.loading = false
    }
  },

  async track(taskId: string) {
    const { data: task } = await Api.getContainerTask(taskId)
    containerTaskStore.upsert(task)
    if (containerTaskStore.isTerminal(task.status)) {
      containerTaskStore.close(taskId)
    } else {
      containerTaskStore.connect(taskId)
    }
    return task as ContainerTask
  },

  acceptCreated(data: any, request: Record<string, any> = {}) {
    const now = new Date().toISOString()
    const id = data?.taskId || data?.id
    if (!id) return
    const operation = data.operation || request.operation || 'create'
    const resourceName = request.name || request.image || request.reference || request.imageName || request.buildName
    containerTaskStore.upsert({
      id,
      operation,
      status: data.status || 'queued',
      phase: data.phase || data.status || 'queued',
      progress: data.progress ?? 0,
      phaseProgress: data.phaseProgress,
      message: data.message || operationFallbackMessage[operation] || 'Task created',
      details: data.details || [],
      containerId: data.containerId,
      errorCode: data.errorCode,
      errorMessage: data.errorMessage,
      cancelRequested: false,
      eventSeq: data.eventSeq || 0,
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
      resourceName
    })
    containerTaskStore.connect(id)
    void containerTaskStore.track(id).catch(() => undefined)
  },

  upsert(task: ContainerTask) {
    const current = containerTaskStore.tasks[task.id]
    const next = current ? { ...current, ...task } : task
    containerTaskStore.tasks[task.id] = next
    containerTaskStore.order = [
      task.id,
      ...containerTaskStore.order.filter((id) => id !== task.id)
    ]
    if (
      current &&
      !containerTaskStore.isTerminal(current.status) &&
      containerTaskStore.isTerminal(next.status)
    ) {
      containerTaskStore.terminalRevision++
    }
  },

  ingest(tasks: ContainerTask[]) {
    const ids = tasks.map((task) => task.id)
    tasks.forEach((task) => {
      const current = containerTaskStore.tasks[task.id]
      const next = current ? { ...current, ...task } : task
      containerTaskStore.tasks[task.id] = next
      if (
        current &&
        !containerTaskStore.isTerminal(current.status) &&
        containerTaskStore.isTerminal(next.status)
      ) {
        containerTaskStore.terminalRevision++
      }
    })
    containerTaskStore.order = [
      ...ids,
      ...containerTaskStore.order.filter((id) => !ids.includes(id))
    ]
  },

  connect(taskId: string) {
    if (eventSources.has(taskId) || containerTaskStore.isTerminal(containerTaskStore.tasks[taskId]?.status)) {
      return
    }
    const after = containerTaskStore.tasks[taskId]?.eventSeq || 0
    const source = new EventSource(taskURL(`${taskId}/events${after ? `?after=${after}` : ''}`), { withCredentials: true })
    eventSources.set(taskId, source)
    containerTaskStore.startLogPolling(taskId)
    const handleEvent = (raw: MessageEvent) => {
      const event = JSON.parse(raw.data) as ContainerTaskEvent
      const current = containerTaskStore.tasks[taskId]
      if (!current || event.seq <= (current.eventSeq || 0)) return
      containerTaskStore.upsert({
        ...current,
        status: event.status,
        phase: event.phase,
        phaseProgress: event.phaseProgress,
        progress: event.progress,
        message: event.message,
        details: event.details || current.details,
        errorCode: event.code || current.errorCode,
        eventSeq: event.seq,
        updatedAt: event.createdAt || new Date().toISOString()
      })
      if (event.log) {
        containerTaskStore.logs[taskId] = (containerTaskStore.logs[taskId] || '') + event.log
      }
      void containerTaskStore.fetchLog(taskId).catch(() => undefined)
      if (containerTaskStore.isTerminal(event.status)) {
        containerTaskStore.close(taskId)
        void containerTaskStore.track(taskId).catch(() => undefined)
      }
    }
    ;['snapshot', 'phase', 'progress', 'terminal'].forEach((type) => {
      source.addEventListener(type, handleEvent as EventListener)
    })
    source.onopen = () => {
      window.clearInterval(snapshotPollTimers.get(taskId))
      snapshotPollTimers.delete(taskId)
    }
    source.onerror = () => {
      if (containerTaskStore.isTerminal(containerTaskStore.tasks[taskId]?.status)) return
      containerTaskStore.startSnapshotPolling(taskId)
      if (source.readyState !== EventSource.CLOSED) return
      eventSources.delete(taskId)
      window.clearTimeout(reconnectTimers.get(taskId))
      reconnectTimers.set(taskId, window.setTimeout(() => {
        void containerTaskStore.track(taskId).catch(() => undefined)
      }, 3000))
    }
  },

  async fetchLog(taskId: string) {
    const activeRequest = logFetches.get(taskId)
    if (activeRequest) return activeRequest
    const request = (async () => {
      const cursor = containerTaskStore.logCursors[taskId] || 0
      const { data: chunk } = await Api.getContainerTaskLog(taskId, { cursor, limit: 65536 })
      if (chunk.content) {
        containerTaskStore.logs[taskId] = (containerTaskStore.logs[taskId] || '') + chunk.content
      }
      containerTaskStore.logCursors[taskId] = chunk.nextCursor
      return chunk
    })()
    logFetches.set(taskId, request)
    try {
      return await request
    } finally {
      if (logFetches.get(taskId) === request) logFetches.delete(taskId)
    }
  },

  async cancel(taskId: string) {
    const { data: task } = await Api.cancelContainerTask(taskId)
    containerTaskStore.upsert(task)
  },

  async downloadLog(taskId: string) {
    const response = await fetch(taskURL(`${taskId}/log/download`), {
      credentials: 'include',
      headers: { Accept: 'text/plain' }
    })
    if (!response.ok) throw new Error(`Failed to download logs (HTTP ${response.status})`)
    const blob = await response.blob()
    const objectURL = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = objectURL
    link.download = `oneinstack-container-${taskId}.log`
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
    void containerTaskStore.fetchLog(taskId).catch(() => undefined)
    logPollTimers.set(taskId, window.setInterval(() => {
      if (containerTaskStore.isTerminal(containerTaskStore.tasks[taskId]?.status)) {
        window.clearInterval(logPollTimers.get(taskId))
        logPollTimers.delete(taskId)
        return
      }
      void containerTaskStore.fetchLog(taskId).catch(() => undefined)
    }, 2000))
  },

  startSnapshotPolling(taskId: string) {
    if (snapshotPollTimers.has(taskId)) return
    snapshotPollTimers.set(taskId, window.setInterval(() => {
      void containerTaskStore.track(taskId).catch(() => undefined)
    }, 3000))
  }
})

export default containerTaskStore
