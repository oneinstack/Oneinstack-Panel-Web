import i18n from '@/lang'

const providerKeys: Record<string, string> = {
  uploaded: 'certificate.providers.uploaded',
  'self-signed': 'certificate.providers.selfSigned',
  acme: 'certificate.providers.acme'
}

const statusKeys: Record<string, string> = {
  active: 'certificate.status.active',
  expiring: 'certificate.status.expiring',
  expired: 'certificate.status.expired',
  disabled: 'certificate.status.disabled',
  error: 'certificate.status.error',
  queued: 'certificate.status.queued',
  running: 'certificate.status.running',
  canceling: 'certificate.status.canceling',
  succeeded: 'certificate.status.succeeded',
  failed: 'certificate.status.failed',
  canceled: 'certificate.status.canceled',
  interrupted: 'certificate.status.interrupted'
}

const operationKeys: Record<string, string> = {
  issue_managed: 'certificate.operations.issue',
  issue: 'certificate.operations.issue',
  renew: 'certificate.operations.renew',
  upload: 'certificate.operations.upload',
  self_signed: 'certificate.operations.selfSigned',
  bind: 'certificate.operations.bind'
}

const dnsProviderKeys: Record<string, string> = {
  cloudflare: 'certificate.dnsProviders.cloudflare',
  aliyun: 'certificate.dnsProviders.aliyun',
  tencentcloud: 'certificate.dnsProviders.tencentcloud'
}

const translateValue = (key: string | undefined, fallback?: string) => {
  if (!key) return fallback || '—'
  const value = (i18n.t as any)(key)
  return value && value !== key ? value : fallback || key
}

export const certificateProviderLabel = (value?: string) =>
  translateValue(value ? providerKeys[value] : undefined, value)

export const certificateStatusLabel = (value?: string) =>
  translateValue(value ? statusKeys[value] : undefined, value)

export const certificateOperationLabel = (value?: string) =>
  translateValue(value ? operationKeys[value] : undefined, value)

export const certificateDnsProviderLabel = (value?: string, fallback?: string) =>
  translateValue(value ? dnsProviderKeys[value] : undefined, fallback || value)

export const certificateTime = (value?: string) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(i18n.locale, {
    dateStyle: 'medium',
    timeStyle: 'medium'
  }).format(date)
}

export const certificateTaskTarget = (domains?: string, websiteName?: string, fallback?: string) => {
  if (domains) return domains
  if (websiteName && websiteName !== 'certificate') return websiteName
  return translateValue('certificate.task.resource', fallback)
}
