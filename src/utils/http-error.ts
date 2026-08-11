import i18n from '@/lang'

export const resolveHttpErrorMessage = (data: any, fallback = i18n.t('common.request.failed')) => {
  if (typeof data === 'string') return data || fallback
  if (typeof data?.error === 'string') return data.error
  return data?.error?.detail || data?.detail || data?.error?.message || data?.message || fallback
}

export const formatHttpStatusMessage = (status?: number, statusText?: string, fallback = i18n.t('common.request.failed')) => {
  if (!status) return fallback
  return (i18n.t as any)('common.request.httpStatus', {
    message: fallback,
    status: `${status}${statusText ? ` ${statusText}` : ''}`
  })
}
