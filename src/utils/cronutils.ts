// src/utils/cronUtils.ts
import i18n from '@/lang'

const t = (key: string, fallback?: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params)
  return value && value !== key ? value : fallback || key
}

export default function formatCron(cronStr: string): string {
  if (!cronStr) return '';
  const cronExpressions = cronStr.split(',');
  const descriptions: string[] = [];

  cronExpressions.forEach((expression) => {
    const parts = expression.trim().split(/\s+/);
    if (parts.length !== 5) {
      descriptions.push(t('task.cron.invalidExpression', `Invalid cron expression: ${expression}`, { value: expression }));
      return;
    }

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
    const isWildcardMonth = month === '*';
    const isWildcardDayOfMonth = dayOfMonth === '*';
    const isWildcardDayOfWeek = dayOfWeek === '*';
    const fallbackWeekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

    const timeDescription = () => {
      if (hour === '*' && minute === '*') {
        return { valid: true, text: t('task.editor.everyMinute', '每分钟') };
      }

      if (hour === '*') {
        return { valid: true, text: t('task.cron.minuteOfEveryHour', `每小时的第 ${minute} 分`, { minute }) };
      }

      if (minute === '*') {
        return { valid: true, text: t('task.cron.hourOfEveryDay', `每天 ${hour} 时`, { hour }) };
      }

      if (/^\d+$/.test(hour) && /^\d+$/.test(minute)) {
        return {
          valid: true,
          text: t('task.cron.fixedTime', `${hour}:${String(minute).padStart(2, '0')}分`, {
          hour,
          minute: String(minute).padStart(2, '0')
          })
        };
      }

      return { valid: false, text: t('task.cron.invalidTime', `Invalid time field: ${hour}:${minute}`, { value: `${hour}:${minute}` }) };
    };

    if (!/^\d+$/.test(dayOfMonth) && dayOfMonth !== '*') {
      descriptions.push(t('task.cron.invalidDay', `Invalid day field: ${dayOfMonth}`, { value: dayOfMonth }));
      return;
    }

    if (!/^\d+$/.test(month) && month !== '*') {
      descriptions.push(t('task.cron.invalidMonth', `Invalid month field: ${month}`, { value: month }));
      return;
    }

    if (!/^\d+$/.test(dayOfWeek) && dayOfWeek !== '*') {
      descriptions.push(t('task.cron.invalidDay', `Invalid day field: ${dayOfWeek}`, { value: dayOfWeek }));
      return;
    }

    const { valid: isTimeValid, text: timeText } = timeDescription();
    if (!isTimeValid) {
      descriptions.push(timeText);
      return;
    }

    if (isWildcardMonth && isWildcardDayOfMonth && isWildcardDayOfWeek) {
      if (/^\d+$/.test(hour) && /^\d+$/.test(minute)) {
        descriptions.push(`${t('task.editor.everyDay', '每天')} ${timeText}`.trim());
        return;
      }
      descriptions.push(timeText);
      return;
    }

    if (isWildcardMonth && isWildcardDayOfMonth && !isWildcardDayOfWeek) {
      const dayIndex = parseInt(dayOfWeek, 10);
      const weekday = t(`task.cron.weekdays.${dayIndex}`, fallbackWeekdays[dayIndex] || dayOfWeek);
      descriptions.push(`${t('task.cron.everyWeekday', `每周 ${weekday}`, { day: weekday })} ${timeText}`.trim());
      return;
    }

    if (isWildcardMonth && !isWildcardDayOfMonth && isWildcardDayOfWeek) {
      descriptions.push(`${t('task.cron.dayOfMonth', `${dayOfMonth} 日`, { day: dayOfMonth })} ${timeText}`.trim());
      return;
    }

    if (!isWildcardMonth && isWildcardDayOfMonth && isWildcardDayOfWeek) {
      descriptions.push(`${t('task.cron.everyYearMonth', `每年 ${month} 月`, { month })} ${timeText}`.trim());
      return;
    }

    const scopeParts: string[] = [];
    if (!isWildcardMonth) {
      scopeParts.push(t('task.cron.everyYearMonth', `每年 ${month} 月`, { month }));
    }
    if (!isWildcardDayOfMonth) {
      scopeParts.push(t('task.cron.dayOfMonth', `${dayOfMonth} 日`, { day: dayOfMonth }));
    }
    if (!isWildcardDayOfWeek) {
      const dayIndex = parseInt(dayOfWeek, 10);
      const weekday = t(`task.cron.weekdays.${dayIndex}`, fallbackWeekdays[dayIndex] || dayOfWeek);
      scopeParts.push(t('task.cron.everyWeekday', `每周 ${weekday}`, { day: weekday }));
    }

    scopeParts.push(timeText);
    descriptions.push(scopeParts.join(' ').trim());
  });

  return descriptions.join('<br>');
}
