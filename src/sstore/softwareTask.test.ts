import { beforeEach, describe, expect, it } from 'vitest'
import softwareTaskStore, { type SoftwareTask } from './softwareTask'

const makeTask = (status: string, id = 'task-openresty'): SoftwareTask => ({
  id,
  operation: 'install',
  component: 'openresty',
  softwareKey: 'openresty',
  requestedVersion: '1.27.1.2',
  status,
  phase: status,
  progress: status === 'succeeded' ? 100 : 50,
  message: status,
  rollbackStatus: 'not_required',
  cancelRequested: false,
  eventSeq: 1,
  createdAt: '2026-07-28T00:00:00Z',
  updatedAt: '2026-07-28T00:00:00Z'
})

describe('software task terminal refresh notification', () => {
  beforeEach(() => {
    softwareTaskStore.tasks = {}
    softwareTaskStore.order = []
    softwareTaskStore.terminalRevision = 0
  })

  it('notifies once when polling changes an active task to succeeded', () => {
    softwareTaskStore.upsert(makeTask('installing'))
    expect(softwareTaskStore.terminalRevision).toBe(0)

    softwareTaskStore.upsert(makeTask('succeeded'))
    expect(softwareTaskStore.terminalRevision).toBe(1)

    softwareTaskStore.upsert(makeTask('succeeded'))
    expect(softwareTaskStore.terminalRevision).toBe(1)
  })

  it('also notifies when history ingestion observes a terminal transition', () => {
    softwareTaskStore.ingest([makeTask('installing')])
    softwareTaskStore.ingest([makeTask('failed')])

    expect(softwareTaskStore.terminalRevision).toBe(1)
  })

  it('does not treat initial terminal history as a newly completed task', () => {
    softwareTaskStore.ingest([makeTask('succeeded')])

    expect(softwareTaskStore.terminalRevision).toBe(0)
  })
})
