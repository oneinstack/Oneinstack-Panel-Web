const timezoneSuffix = /(Z|[+-]\d{2}:?\d{2})$/i
const dateTimeWithoutZone = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/

const parseFileTime = (value: string) => {
  const normalized = value.trim().replace(' ', 'T')
  if (dateTimeWithoutZone.test(normalized) && !timezoneSuffix.test(normalized)) {
    const [datePart, timePart = '00:00:00'] = normalized.split('T')
    const [year, month, day] = datePart.split('-').map(Number)
    const [hour = '0', minute = '0', secondPart = '0'] = timePart.split(':')
    const [second = '0', fraction = '0'] = secondPart.split('.')
    const milliseconds = Number(fraction.slice(0, 3).padEnd(3, '0'))

    // File APIs return timezone-less timestamps as server wall-clock time.
    // Keep the displayed clock value unchanged instead of applying a guessed offset.
    return new Date(
      year,
      month - 1,
      day,
      Number(hour),
      Number(minute),
      Number(second),
      milliseconds
    )
  }

  return new Date(normalized)
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
