const timezoneSuffix = /(Z|[+-]\d{2}:?\d{2})$/i
const dateTimeWithoutZone = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/

const parseFileTime = (value: string) => {
  const normalized = value.trim().replace(' ', 'T')
  // File APIs historically return timezone-less timestamps in UTC.
  const source = dateTimeWithoutZone.test(normalized) && !timezoneSuffix.test(normalized)
    ? `${normalized}Z`
    : normalized
  return new Date(source)
}

export const formatFileTime = (value?: string | null) => {
  if (!value) return '-'

  const date = parseFileTime(value)
  if (Number.isNaN(date.getTime())) return value

  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date)
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value || ''

  return `${part('year')}-${part('month')}-${part('day')} ${part('hour')}:${part('minute')}:${part('second')}`
}
