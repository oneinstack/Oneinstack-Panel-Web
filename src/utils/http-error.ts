export const resolveHttpErrorMessage = (data: any, fallback = '请求失败') => {
  if (typeof data === 'string') return data || fallback
  if (typeof data?.error === 'string') return data.error
  return data?.message || data?.error?.message || data?.error?.detail || data?.detail || fallback
}

export const formatHttpStatusMessage = (status?: number, statusText?: string, fallback = '请求失败') => {
  if (!status) return fallback
  return `${fallback}：${status}${statusText ? ` ${statusText}` : ''}`
}
