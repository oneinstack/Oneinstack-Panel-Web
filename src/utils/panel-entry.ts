import sconfig from '@/sstore/sconfig'

type PanelEntryStatus = {
  enabled: boolean
  path: string
}

let statusPromise: Promise<PanelEntryStatus | null> | null = null

const normalizePath = (path?: string | null) => {
  const trimmed = String(path || '').trim()
  if (!trimmed || trimmed === '/') return '/'
  const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return normalized.replace(/\/+$/, '') || '/'
}

const normalizeEntryPath = (path?: string | null) => {
  const normalized = normalizePath(path)
  return normalized === '/' ? '' : normalized
}

const parseStatusPayload = (payload: any): PanelEntryStatus => {
  const data = payload?.data ?? payload ?? {}
  const enabled = Boolean(data.panelEntryEnabled ?? data.enabled)
  const rawPath = data.panelEntryPath ?? data.path ?? ''
  return {
    enabled,
    path: enabled ? normalizeEntryPath(rawPath) : ''
  }
}

const saveStatus = (status: PanelEntryStatus | null) => {
  if (!status) return
  sconfig.setPanelEntryAccess({
    enabled: status.enabled,
    path: status.path
  })
}

export const getPanelEntryStatus = async (force = false) => {
  if (!force && statusPromise) return statusPromise

  statusPromise = (async () => {
    try {
      const response = await fetch('/v1/panel-entry/status', {
        credentials: 'include',
        headers: {
          Accept: 'application/json'
        }
      })
      if (!response.ok) throw new Error(`HTTP_${response.status}`)
      const payload = await response.json()
      const status = parseStatusPayload(payload)
      saveStatus(status)
      return status
    } catch {
      const cached = sconfig.panelEntryAccess
      if (cached) {
        return {
          enabled: Boolean(cached.enabled),
          path: normalizeEntryPath(cached.path)
        }
      }
      return null
    }
  })()

  return statusPromise
}

export const isPanelEntryPathAllowed = (status: PanelEntryStatus | null, pathname = window.location.pathname) => {
  if (!status) return true
  const currentPath = normalizePath(pathname)
  if (status.enabled) {
    if (status.path) return currentPath === status.path
    return currentPath !== '/'
  }
  return currentPath === '/'
}
