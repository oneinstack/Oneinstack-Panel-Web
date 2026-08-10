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
      const parts = expression.split(' ');
      if (parts.length!== 5) {
          descriptions.push(t('task.cron.invalidExpression', `Invalid cron expression: ${expression}`, { value: expression }));
          return;
      }

      const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
      let description = '';

      // 处理月份部分
      if (month === '*') {
          description += t('task.cron.everyMonth', 'Every month');
      } else if (/^\d+$/.test(month)) {
          description += t('task.cron.everyYearMonth', `Every year in month ${month}`, { month });
      } else {
          descriptions.push(t('task.cron.invalidMonth', `Invalid month field: ${month}`, { value: month }));
          return;
      }

      // 处理日期部分
      if (dayOfMonth === '*') {
          if (dayOfWeek === '*') {
              description += ` ${t('task.cron.everyDay', 'Every day')}`;
          }
      } else if (/^\d+$/.test(dayOfMonth)) {
          description += ` ${t('task.cron.dayOfMonth', `Day ${dayOfMonth}`, { day: dayOfMonth })}`;
      } else {
          descriptions.push(t('task.cron.invalidDay', `Invalid day field: ${dayOfMonth}`, { value: dayOfMonth }));
          return;
      }

      // 处理星期部分
      if (dayOfWeek!== '*' && /^\d+$/.test(dayOfWeek)) {
          const dayIndex = parseInt(dayOfWeek);
          const fallbackWeekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const weekday = t(`task.cron.weekdays.${dayIndex}`, fallbackWeekdays[dayIndex] || dayOfWeek);
          description += ` ${t('task.cron.everyWeekday', `Every week on ${weekday}`, { day: weekday })}`;
      }

      // 处理小时和分钟部分
      if (hour === '*' && minute === '*') {
          description += ` ${t('task.cron.everyHourMinute', 'Every hour and minute')}`;
      } else if (hour === '*') {
          description += ` ${t('task.cron.minuteOfEveryHour', `Minute ${minute} of every hour`, { minute })}`;
      } else if (minute === '*') {
          description += ` ${t('task.cron.hourOfEveryDay', `Hour ${hour} of every day`, { hour })}`;
      } else if (/^\d+$/.test(hour) && /^\d+$/.test(minute)) {
          description += ` ${t('task.cron.fixedTime', `${hour}:${String(minute).padStart(2, '0')}`, { hour, minute: String(minute).padStart(2, '0') })}`;
      } else {
          descriptions.push(t('task.cron.invalidTime', `Invalid time field: ${hour}:${minute}`, { value: `${hour}:${minute}` }));
          return;
      }

      descriptions.push(description.trim());
  });

  return descriptions.join('<br>');
}
