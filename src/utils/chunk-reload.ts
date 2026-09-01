const CHUNK_RELOAD_FLAG = '__oneinstack_chunk_reload__'

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

  return [
    'Failed to fetch dynamically imported module',
    'Importing a module script failed',
    'ChunkLoadError'
  ].some((text) => message.includes(text))
}

export const reloadOnceForChunkFailure = () => {
  if (sessionStorage.getItem(CHUNK_RELOAD_FLAG)) return false
  sessionStorage.setItem(CHUNK_RELOAD_FLAG, '1')
  window.location.reload()
  return true
}

export const clearChunkReloadFlag = () => {
  sessionStorage.removeItem(CHUNK_RELOAD_FLAG)
}
