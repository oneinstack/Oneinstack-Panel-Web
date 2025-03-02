import { sconfig } from '@/sstore/sconfig'
import { svalue } from '@/sstore/svalue'
import { onMounted, reactive } from 'vue'
import System from '@/utils/System'
import { apis } from '@/api'
import i18n from '@/lang'
import { Scope } from 'tools-vue3'
import { EPage } from '@/enum/Enum'

export const index = ({ signPopRefs }: any) => {
  const conf = reactive({
    bgcolor: 'transparent',
    isHeadFixed: false,
    moreDayShow: false,
    calendar: [] as any[],
    showSignLine: 0,
    selectDateNo: false,
    nextDateNo: false,
    showDate: new Date(),
    dateNum: '',
    today: [] as any[],
    taskList: [] as any[],
    detailData: [] as any[],
    userVipIntegral: 0,
    userInfo: null as any,
    pointConfig: {} as any,
    signRecord: [] as any[],
    continueDays: 0,
    continueRewardList: [] as any[],
    maxNumArr: [7, 0],
    sigTotal: 0,
    boxCount: 0,
    taskLoading: true,
    defalutWallet: null,
    signLading: false,
    showSign: true,
    showMall: true,
    signTip: false,
    checked: false,
    months: 0,
    serveOffset: -1,
    isSignTip: false,
    remianDays: 0,
    // 获取系统时间
    getTime() {
      apis.system({
        success: (res: any) => {
          let data = res.data
          let offset = new Date().getTimezoneOffset() * 60000 * -1
          conf.serveOffset = data.offset1 - offset + (new Date().getTime() - data.currentTime)
          let t = new Date(data.currentTime).Format()
        },
        final: () => {
          System.loading(false)
        }
      })
    },
    // 下一次签到倒计时
    changeTips() {
      let t = new Date().Format()
      let t1 = t.split(' ')[0] + ' 23:59:59'
      let t3 = conf.getHour(t, t1, conf.serveOffset)
      let isSign = conf.selectSignBtn(false)
      signPopRefs.value?.showPop({
        array: t3,
        isSign,
        show: true
      })
    },
    getHour(s1: any, s2: any, offset: any) {
      s1 = new Date(s1.replace(/-/g, '/'))
      s2 = new Date(s2.replace(/-/g, '/'))
      let ms = s2.getTime() - s1.getTime() - offset
      let dy = 24 * 60 * 60 * 1000
      if (ms >= dy) ms = ms - dy
      if (ms < 0) return 0
      let num = Math.ceil(ms / 1000 / 60)
      let h = Math.floor(num / 60)
      let m = num % 60
      return [h, m, ms]
    },
    // 判断是今天否签到
    selectSignBtn(last = true) {
      if (conf.calendar.length && (conf.calendar[0].year != conf.today[2] || conf.calendar[0].moon != conf.today[0]))
        return true
      let isSign = conf.getIsPoint(conf.today[1])
      if (isSign) return isSign
      let t = new Date().Format()
      let t1 = t.split(' ')[0] + ' 23:59:59'
      let arr: any = conf.getHour(t, t1, conf.serveOffset)
      let offset = conf.serveOffset > 0 ? conf.serveOffset : -conf.serveOffset
      if (arr[2] >= offset) return false
      let lastDay = parseInt(conf.today[1]) - 1
      let lastMonth = this.getLastMonthDay()
      if (conf.today[1] == 1) {
        lastDay = lastMonth.getDate()
      }
      if (last && lastDay > 0) {
        let y = lastMonth.getFullYear()
        let m = lastMonth.getMonth() + 1
        let lastSign = conf.getIsPoint(lastDay, m, y)
        return lastSign
      }
      return true
    },
    // 获取积分和宝箱数据
    getUserPoint(userId: string) {
      apis.getUserPoint({
        userId,
        success: (res: any) => {
          let pointNum = res.data.userVipIntegral || 0
          conf.userVipIntegral = parseInt(pointNum)
          conf.boxCount = res.data.boxCount
        }
      })
    },
    //获取列表数据
    getPointsList(userId: any) {
      conf.signLading = true
      apis.getPointsList({
        userId,
        months: conf.months,
        success: (res: any) => {
          conf.pointConfig = res.data.config
          conf.signRecord = res.data.signRecord
          if (conf.pointConfig.continueReward) conf.continueRewardList = JSON.parse(conf.pointConfig.continueReward)
          if (conf.continueRewardList.length)
            conf.maxNumArr[0] = conf.continueRewardList[conf.continueRewardList.length - 1].signDays
          conf.setCalendar()
        },
        final: () => {
          conf.signLading = false
        }
      })
    },
    //签到
    clickPointsSign(userId: any) {
      if (conf.getIsPoint(conf.today[1])) {
        System.toast(i18n.t('code.2605'))
        return
      }
      System.loading()
      apis.clickPointsSign({
        userId: conf.userInfo.userId,
        configId: conf.pointConfig.id,
        success: (res: any) => {
          conf.userVipIntegral = res.data.userVipIntegral
          System.toast(i18n.t('point.signSuccess'), 'success')
          let belongDate = `${conf.today[2]}${conf.today[0]}${conf.today[1]}`
          conf.signRecord.push({ belongDate })
          conf.sigTotal++
        },
        final: () => {
          System.loading(false)
        }
      })
    },
    // 判断是否签到
    getIsPoint(day: any, month = null as any, year = null as any) {
      if (!conf.signRecord || !conf.calendar.length) return false
      if (!year) year = conf.today[2]
      if (!month) month = conf.today[0]
      month = ('0' + month).slice(-2)
      day = ('0' + day).slice(-2)
      let time = `${year}${month}${day}`
      let pointItem = conf.signRecord.find((item) => {
        return item.belongDate == time
      })
      return pointItem
    },
    // 获取签到的积分
    getPointNum(num: number, moon: number) {
      let today = num - conf.today[1]
      if (moon > parseInt(conf.today[0])) {
        today = num + conf.remianDays
      }
      let dayNum = conf.maxNumArr[1] + today + 1
      let maxDays = conf.maxNumArr[0]
      dayNum = dayNum > maxDays ? maxDays : dayNum
      let curent = conf.continueRewardList.find((item) => {
        return item.signDays == dayNum
      })
      if (curent) return curent.continuePoints
      let arr = conf.continueRewardList.filter((item) => {
        return item.signDays <= dayNum
      })
      if (arr.length) return arr[arr.length - 1].continuePoints
      return conf.pointConfig.dailyReward || 1
    },
    //获取列表数据
    getTaskList() {
      conf.taskLoading = true
      apis.getTaskList({
        success: (res: any) => {
          conf.taskList = res.data || []
        },
        final: () => {
          conf.taskLoading = false
        }
      })
    },
    switch1Change(e: any) {
      conf.checked = e
      Cookie.set('signReminder', e)
    },
    goPage(url: any) {
      System.router.push(url)
    },
    // 获取日期数据
    setCalendar() {
      conf.calendar = []
      conf.showSignLine = 0
      let t = 0 < arguments.length && void 0 !== arguments[0] ? arguments[0] : new Date(conf.showDate)
      t.setDate(0)
      let e = {} as any,
        a,
        n,
        i,
        m = t.getMonth() + 1
      conf.dateNum = Date.Format(t, 'yyyy.MM')
      let o = t.getDate()
      for (i = 1; i <= o; i++)
        ((e = {} as any).num = i), (e.moon = m), (e.year = t.getFullYear()), conf.calendar.push(e)

      let date = new Date()
      conf.today[0] = ('0' + (date.getMonth() + 1)).slice(-2)
      conf.today[1] = ('0' + date.getDate()).slice(-2)
      conf.today[2] = date.getFullYear()
      // 计算今天日期是第几列
      if (conf.calendar.length && conf.calendar[0].year == conf.today[2] && conf.calendar[0].moon == conf.today[0]) {
        conf.remianDays = conf.calendar[conf.calendar.length - 1].num - parseInt(conf.today[1])
        let todayNum = parseInt(conf.today[1]) - 1
        conf.showSignLine = Math.floor(todayNum / 7)
      }

      if (date.getMonth() + 1 == m) {
        for (n = 1; n <= 35 - o; n++)
          ((e = {} as any).num = n), (e.moon = m + 1), (e.year = t.getFullYear()), conf.calendar.push(e)
      }

      // 只显示当前月的下一个月的数据
      let nextYear = parseInt(conf.dateNum.split('.')[0])
      let nextMon = parseInt(conf.dateNum.split('.')[1])
      let currentMon = parseInt(conf.today[0])
      if (nextYear > conf.today[2] || nextMon > currentMon) conf.nextDateNo = true

      if (conf.months != 0 || conf.isSignTip) return

      let reminder = Cookie.get('signReminder')
      conf.checked = reminder == 'false' ? false : true
      if (conf.checked) {
        conf.signTip = !conf.selectSignBtn()
        if (conf.signTip) {
          conf.isSignTip = true
          setTimeout(() => {
            conf.signTip = false
          }, 2000)
        }
      }
      if (conf.signRecord.length) {
        // 判断是否连续签到
        let y = parseInt(conf.today[2])
        let m = parseInt(conf.today[0])
        let d = parseInt(conf.today[1])
        if (d == 1) {
          // 获取上个月的最后一天
          const lastDay = conf.getLastMonthDay()
          y = lastDay.getFullYear()
          m = lastDay.getMonth() + 1
          d = lastDay.getDate()
        } else {
          d = d - 1
        }
        let m1 = ('0' + m).slice(-2)
        let d1 = ('0' + d).slice(-2)
        let lastDate = '' + y + m1 + d1
        let lastStr = conf.signRecord[conf.signRecord.length - 1].belongDate + ''
        let item = conf.selectSignBtn()
        if (item || lastStr == lastDate) {
          conf.sigTotal = conf.signRecord[conf.signRecord.length - 1].continueDays
        } else {
          conf.sigTotal = 0
        }
        if (conf.sigTotal == 0) return

        let todayStr = conf.today[2] + '' + conf.today[0] + conf.today[1]
        if (lastStr == todayStr) {
          conf.maxNumArr[1] = conf.sigTotal - 1
        } else {
          conf.maxNumArr[1] = conf.sigTotal
        }
        // 	let lastStr = conf.signRecord[conf.signRecord.length-1].createTime
        // 	let str = '-' + conf.today[0] + '-'
        // 	if (lastStr && lastStr.indexOf(str) !== -1) {
        // 	  conf.sigTotal = conf.signRecord.length
        // 	}
      }
      // conf.today = Date.Format(new Date(),'MM.dd')
    },
    // 获取上个月的最后一天
    getLastMonthDay() {
      const now = new Date()
      let lastMonth
      if (now.getMonth() === 0) {
        // 如果是1月份，则上个月是上一年的12月
        lastMonth = new Date(now.getFullYear() - 1, 11, 0)
      } else {
        lastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
      }

      return lastMonth
    },
    prevMonth() {
      if (conf.months >= 2) return (conf.selectDateNo = true)
      // conf.calendar = []
      conf.nextDateNo = false
      conf.showDate.setDate(1)
      conf.showDate.setMonth(conf.showDate.getMonth() - 1)
      let m = conf.showDate.getMonth() + 1 - conf.today[0]
      conf.months++
      if (conf.months == 2) conf.selectDateNo = true
      if (conf.months < 0) {
        conf.setCalendar()
        return
      }
      conf.getPointsList(conf.userInfo.userId)
    },
    nextMonth() {
      // conf.calendar = []
      conf.selectDateNo = false
      conf.showDate.setDate(1)
      conf.showDate.setMonth(conf.showDate.getMonth() + 1)
      conf.months--
      if (conf.months < 0) {
        conf.setCalendar()
        return
      }
      conf.getPointsList(conf.userInfo.userId)
    },
    // 数据处理
    changePointNum(amount: any) {
      let unit = ''
      amount = parseFloat(amount) || 0
      if (amount < 1000000) {
        return parseInt(amount)
      } else if (amount < 1000000000) {
        // 如果金额在1,000,000到1,000,000,000之间，则显示为xxxx.xxM（百万）
        amount /= 1000000
        unit = 'M'
      } else {
        // 如果金额超过1,000,000,000，则显示为xxxx.xxB（十亿）
        amount /= 1000000000
        unit = 'B'
      }

      //对数据进行保留n位处理并去掉末位小数
      let [integerPart, decimalPart = ''] = String(amount).split('.')
      decimalPart = decimalPart.substring(0, 2)
      decimalPart = decimalPart.replace(/0+$/, '')
      amount = decimalPart ? `${integerPart}.${decimalPart}` : integerPart
      return amount + unit
    }
  })
  onMounted(async () => {
    let userInfo = sconfig.userInfo
    if (userInfo && userInfo.userId) {
      conf.userInfo = userInfo
      const config = await svalue.getAppConfiguration(true)
      conf.showSign = config.activity_points_mall_sign
      conf.showMall = config.activity_points_mall // 是否开启积分商城
      if (conf.showSign) {
        conf.showDate.setMonth(conf.showDate.getMonth() + 1)
        conf.getPointsList(userInfo.userId)
      }
      conf.getTime()
      conf.getUserPoint(userInfo.userId)
      conf.defalutWallet = await svalue.getDefaultWallet()
      conf.getTaskList()
    } else {
      System.router.push('/login')
    }
  })
  const event = Scope.Event()
  event.on(EPage.scroll, (e) => {
    if (e.top > 60) {
      conf.bgcolor = 'linear-gradient(180deg, #EB602D 0%, #FFA64F 160%)'
    } else {
      conf.bgcolor = 'transparent'
    }
  })

  return conf
}
