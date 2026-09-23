const CHUNK_RELOAD_FLAG = '__oneinstack_chunk_reload__'
const CHUNK_RELOAD_TARGET = '__oneinstack_chunk_reload_target__'
const CHUNK_RELOAD_ATTEMPTS = '__oneinstack_chunk_reload_attempts__'
const NAVIGATION_STALL_TARGET = '__oneinstack_navigation_stall_target__'
const MAX_CHUNK_RELOAD_ATTEMPTS = 1

const normalizeTarget = (target?: string) => {
  const value = String(target || '').trim()
  return value.startsWith('/') && !value.startsWith('//') ? value : ''
}

export const isDynamicImportError = (reason: unknown) => {
  if (!reason) return false
  const message =
    reason instanceof Error
      ? reason.message
      : typeof reason === 'string'
        ? reason
        : typeof reason === 'object' && reason && 'message' in reason
          ? String((reason as { message?: unknown }).message || '')
          : ''

  const normalizedMessage = message.toLowerCase()
  return [
    'Failed to fetch dynamically imported module',
    'error loading dynamically imported module',
    'Importing a module script failed',
    'Failed to load module script',
    'ChunkLoadError',
    'Loading chunk',
    'Unable to preload CSS'
  ].some((text) => normalizedMessage.includes(text.toLowerCase())) || normalizedMessage === 'load failed'
}

export const reloadOnceForChunkFailure = (target?: string) => {
  const normalizedTarget = normalizeTarget(target)
  const previousTarget = sessionStorage.getItem(CHUNK_RELOAD_TARGET) || ''
  if (normalizedTarget && normalizedTarget !== previousTarget) {
    sessionStorage.setItem(CHUNK_RELOAD_TARGET, normalizedTarget)
    sessionStorage.removeItem(CHUNK_RELOAD_ATTEMPTS)
  }
  if (sessionStorage.getItem(CHUNK_RELOAD_FLAG)) return false

  const attempts = Number(sessionStorage.getItem(CHUNK_RELOAD_ATTEMPTS) || 0)
  if (attempts >= MAX_CHUNK_RELOAD_ATTEMPTS) return false

  sessionStorage.setItem(CHUNK_RELOAD_ATTEMPTS, String(attempts + 1))
  sessionStorage.setItem(CHUNK_RELOAD_FLAG, '1')
  window.location.reload()
  return true
}

export const getPendingChunkReloadTarget = () => normalizeTarget(sessionStorage.getItem(CHUNK_RELOAD_TARGET) || '')

export const clearChunkReloadFlag = () => {
  sessionStorage.removeItem(CHUNK_RELOAD_FLAG)
}

export const clearChunkReloadRecovery = () => {
  sessionStorage.removeItem(CHUNK_RELOAD_FLAG)
  sessionStorage.removeItem(CHUNK_RELOAD_TARGET)
  sessionStorage.removeItem(CHUNK_RELOAD_ATTEMPTS)
}

export const getPendingNavigationStallTarget = () =>
  normalizeTarget(sessionStorage.getItem(NAVIGATION_STALL_TARGET) || '')

export const reloadOnceForNavigationStall = (target?: string) => {
  const normalizedTarget = normalizeTarget(target)
  if (!normalizedTarget || getPendingNavigationStallTarget() === normalizedTarget) return false

  sessionStorage.setItem(NAVIGATION_STALL_TARGET, normalizedTarget)
  window.location.hash = normalizedTarget
  window.location.reload()
  return true
}

export const clearNavigationStallRecovery = () => {
  sessionStorage.removeItem(NAVIGATION_STALL_TARGET)
}
