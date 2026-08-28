import i18n from '@/lang'

const t = (key: string, fallback?: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params)
  return value && value !== key ? value : fallback || key
}

const padTime = (value: string) => String(value).padStart(2, '0')

const formatTime = (hour: string, minute: string) =>
  t('task.cron.fixedTime', `${hour}:${padTime(minute)}`, {
    hour,
    minute: padTime(minute)
  })

export default function formatCron(cronStr: string): string {
  if (!cronStr) return ''

  const cronExpressions = cronStr
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)

  const descriptions = cronExpressions.map((expression) => {
    const parts = expression.split(/\s+/)
    if (parts.length !== 5) {
      return t('task.cron.invalidExpression', `Invalid cron expression: ${expression}`, { value: expression })
    }

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts
    const fallbackWeekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const weekdayLabel = (value: string) => {
      const index = Number(value)
      return t(`task.cron.weekdays.${index}`, fallbackWeekdays[index] || value)
    }

    if (minute === '*' && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
      return t('task.editor.everyMinute', '每分钟')
    }

    if (minute.startsWith('*/') && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
      return t('task.cron.everyNMinutes', `每 ${minute.slice(2)} 分钟`, { value: minute.slice(2) })
    }

    if (/^\d+$/.test(minute) && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
      return t('task.cron.minuteOfEveryHour', `每小时 ${minute} 分`, { minute })
    }

    if (/^\d+$/.test(minute) && hour.startsWith('*/') && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
      return `${t('task.cron.everyNHours', `每 ${hour.slice(2)} 小时`, { value: hour.slice(2) })} ${t('task.cron.minuteOfEveryHour', `${minute} 分`, { minute })}`.trim()
    }

    if (/^\d+$/.test(minute) && /^\d+$/.test(hour) && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
      return `${t('task.cron.everyDay', '每日')} ${formatTime(hour, minute)}`.trim()
    }

    if (/^\d+$/.test(minute) && /^\d+$/.test(hour) && dayOfMonth.startsWith('*/') && month === '*' && dayOfWeek === '*') {
      return `${t('task.cron.everyNDays', `每 ${dayOfMonth.slice(2)} 日`, { value: dayOfMonth.slice(2) })} ${formatTime(hour, minute)}`.trim()
    }

    if (/^\d+$/.test(minute) && /^\d+$/.test(hour) && dayOfMonth === '*' && month === '*' && /^\d+$/.test(dayOfWeek)) {
      const weekday = weekdayLabel(dayOfWeek)
      return `${t('task.cron.everyWeekday', `每周 ${weekday}`, { day: weekday })} ${formatTime(hour, minute)}`.trim()
    }

    if (/^\d+$/.test(minute) && /^\d+$/.test(hour) && /^\d+$/.test(dayOfMonth) && month === '*' && dayOfWeek === '*') {
      return `${t('task.cron.everyMonth', '每月')} ${t('task.cron.dayOfMonth', `${dayOfMonth} 日`, { day: dayOfMonth })} ${formatTime(hour, minute)}`.trim()
    }

    if (/^\d+$/.test(minute) && /^\d+$/.test(hour) && dayOfMonth === '*' && /^\d+$/.test(month) && dayOfWeek === '*') {
      return `${t('task.cron.everyYearMonth', `每年 ${month} 月`, { month })} ${formatTime(hour, minute)}`.trim()
    }

    const segments: string[] = []
    if (month !== '*') {
      segments.push(t('task.cron.everyYearMonth', `每年 ${month} 月`, { month }))
    }
    if (dayOfMonth !== '*') {
      segments.push(t('task.cron.dayOfMonth', `${dayOfMonth} 日`, { day: dayOfMonth }))
    }
    if (dayOfWeek !== '*') {
      const weekday = weekdayLabel(dayOfWeek)
      segments.push(t('task.cron.everyWeekday', `每周 ${weekday}`, { day: weekday }))
    }
    if (hour !== '*' && minute !== '*') {
      segments.push(formatTime(hour, minute))
    } else if (hour === '*' && minute !== '*') {
      segments.push(t('task.cron.minuteOfEveryHour', `每小时 ${minute} 分`, { minute }))
    }

    return segments.join(' ').trim() || expression
  })

  return descriptions.join('<br>')
}
