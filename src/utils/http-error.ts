import i18n from '@/lang'

const resolveApiErrorCode = (data: any) => data?.error?.code ?? data?.code

const normalizeApiErrorCode = (code: unknown) => {
  if (code === undefined || code === null || code === '') return ''
  const value = String(code)
  return value === '0' ? '000' : value
}

export const resolveApiCodeMessage = (data: any) => {
  const code = normalizeApiErrorCode(resolveApiErrorCode(data))
  if (!code) return ''
  const key = `code.${code}`
  const message = i18n.global?.t?.(key) || i18n.t(key)
  return message && message !== key ? message : ''
}

export const resolveHttpErrorMessage = (data: any, fallback = '请求失败') => {
  if (typeof data === 'string') return data || fallback
  if (typeof data?.error === 'string') return data.error
  return data?.error?.detail || data?.detail || resolveApiCodeMessage(data) || data?.error?.message || data?.message || fallback
}

export const formatHttpStatusMessage = (status?: number, statusText?: string, fallback = '请求失败') => {
  if (!status) return fallback
  return `${fallback}：${status}${statusText ? ` ${statusText}` : ''}`
}
