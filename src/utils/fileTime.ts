const timezoneSuffix = /(Z|[+-]\d{2}:?\d{2})$/i
const dateTimeWithoutZone = /^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?)?$/
const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

const parseFileTime = (value: string) => {
  const normalized = value.trim().replace(' ', 'T')
  const match = normalized.match(dateTimeWithoutZone)

  if (match && !timezoneSuffix.test(normalized)) {
    const [, year, month, day, hour = '0', minute = '0', second = '0', fraction = ''] = match
    const milliseconds = Number(fraction.slice(0, 3).padEnd(3, '0'))

    // Legacy file endpoints omit the zone and return server wall-clock time.
    // Preserve that clock value instead of applying the browser offset a second time.
    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
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
    hourCycle: 'h23',
    timeZone: browserTimeZone
  }).formatToParts(date)
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value || ''

  // Keep the date and time glued together so table cells do not wrap them onto two lines.
  return `${part('year')}-${part('month')}-${part('day')}\u00A0${part('hour')}:${part('minute')}:${part('second')}`
}
