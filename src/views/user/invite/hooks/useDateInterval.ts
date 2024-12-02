import i18n from '@/lang'

export default function useDateInterval() {
  const interval = [
    {
      label: i18n.t('invite.AllDates'),
      value: null,
    },
    {
      label: i18n.t('invite.Today'),
      value: TimeUtil.somedayse(),
    },
    {
      label: i18n.t('invite.Yesterday'),
      value: TimeUtil.somedayse(-1),
    }
  ]

  const t = new Date()

  const _day = TimeUtil.somedayse
  // 本周起始时间-结束时间
  const today = t.getDay()
  const startTime = _day(1 - today)[0]
  const endTime =  _day(7 - today)[1]
  const thisWeek = {
    label: i18n.t('invite.ThisWeek'),
    value: [startTime, endTime]
  }
  interval.push(thisWeek)

  // 上周起始时间-结束时间
  const lastWeekSTime = _day(1 - today - 7)[0]
  const lastWeekETime =  _day(7 - today - 7)[1]
  const lastWeek = {
    label: i18n.t('invite.LastWeek'),
    value: [lastWeekSTime, lastWeekETime]
  }
  interval.push(lastWeek)

  // 本月起始时间-结束时间
  const ms = new Date()
  ms.setDate(1)
  const mstartTime = _day(0, ms)
  ms.setMonth(ms.getMonth() + 1)
  ms.setDate(1)
  ms.setDate(ms.getDate() - 1)
  const mendTime = _day(0, ms)
  const thisMonth = {
    label: i18n.t('invite.ThisMonth'),
    value: [mstartTime[0], mendTime[1]]
  }
  interval.push(thisMonth)

  return interval
}