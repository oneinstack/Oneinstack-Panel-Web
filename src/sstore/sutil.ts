import i18n from '@/lang'
import { sconfig } from '@/sstore/sconfig'
import JSEncrypt from 'jsencrypt'
import { reactive } from 'vue'
import System from '../utils/System'

export const sutil = reactive({
  /**
   * 请求根地址
   */
  baseUrl: '',
  reset: () => {},
  store: {} as any,
  getStore(name: string) {
    return sutil.store[name]
  },
  isNull(val: any) {
    return StrUtil.isNull(val)
  },
  /**
   * 移除数组指定内容
   * @param item
   */
  remove(arr: any[], item: any) {
    for (let i = arr.length - 1; i >= 0; i--) {
      if (typeof item === 'function') {
        if (item(arr[i])) arr.splice(i, 1)
      } else {
        if (arr[i] === item) arr.splice(i, 1)
      }
    }
    return arr
  },

  /**
   * rem转px
   * @param rem
   * @returns
   */
  rem2px: (rem: number) => {
    return H5Util.rem2px(rem)
  },

  /**
   * px转rem
   * @param px
   * @returns
   */
  px2rem: (px: number) => {
    return H5Util.px2rem(px)
  },

  /**
   * 通过时间大小转换为倒计时字符串
   * @param nowDate
   */
  getCountDown: (nowDate: number) => {
    const formatTimeText = (time: number) => {
      return time < 10 ? `0${time}` : `${time}`
    }

    let totalSeconds = Math.floor(nowDate / 1000)
    if (totalSeconds < 0) totalSeconds = 0
    const hours = Math.floor((totalSeconds / 60 / 60) % 24)
    const minutes = Math.floor((totalSeconds / 60) % 60)
    const seconds = totalSeconds % 60

    return [formatTimeText(hours), formatTimeText(minutes), formatTimeText(seconds), totalSeconds]
  },

  /**
   * 返回上一页，如果没进行过跳转，进入首页
   */
  pageBack: () => {
    if (window.history.state.back) {
      System.router.back()
    } else {
      System.router.replace('/')
    }
  },

  // 重置所有缓存
  resetStorage: () => {
    Cookie.clear()
  },

  //
  getAvatarUrl: (url: string) => {
    if (!url) return undefined
    if (url.startsWith('http')) return url
    return '/static/img/headimg/' + url
  },
  /** 本月第一天 */
  getCurrentMonthFirstDay: () => {
    let d = new Date()
    d.setDate(1)
    d.setHours(0, 0, 0, 0)
    return Date.Format(d)
  },
  // new Date(2017,2,0)
  /** 这个月的最后一天 */
  getCurrentMonthLastTime: () => {
    let d = new Date()
    let d2 = new Date(d.getFullYear(), d.getMonth() + 1, 0)
    let dayLength = d2.getDate()
    d.setDate(dayLength)
    d.setHours(23, 59, 59)
    return Date.Format(d)
  },

  // 转为北京时间戳
  getBjDate: (str: string) => {
    const localDate = new Date(str) // 当前本地时间
    const localOffset = localDate.getTimezoneOffset() * 60 * 1000 // 本地时间偏移量转为毫秒
    //如果我在迪拜   -240*60*1000=-14400000
    //北京偏移量   -480*60*1000=-28800000
    const utcTime = localDate.getTime() // 本地时间转为UTC时间
    const beijingOffset = 8 * 60 * 60000 // 北京时区偏移量转为毫秒
    const beijingTime = new Date(utcTime - localOffset - beijingOffset) // 计算北京时间
    return beijingTime.getTime()
  },

  // 时间-前几天
  getDaysAgo: (daysAgo: number) => {
    const date = new Date()
    if (daysAgo == -2) {
      date.setTime(date.getTime() - 1 * 24 * 60 * 60 * 1000)
      return Date.Format(date, 'yyyy-MM-dd 23:59:59')
    } else if (daysAgo != -1) {
      date.setTime(date.getTime() - daysAgo * 24 * 60 * 60 * 1000)
      date.setHours(0, 0, 0, 0)
      return Date.Format(date)
    } else {
      return Date.Format(date)
    }
  },

  getPetList: (pet: any, max = 49) => {
    const str = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']
    const obj = str.reduce((acc: any, cur: any) => {
      acc[cur] = []
      return acc
    }, {})
    let index = str.indexOf(pet) + 2
    if (index > 12) index = index - 12
    const arr = str.slice(index).concat(str.slice(0, index)).reverse()
    for (let i = 1; i <= max; i++) {
      obj[arr[i % 12]].push(i < 10 ? '0' + i : i + '')
    }
    return obj
  },

  /**
   * 通过时间大小转换为倒计时字符串-天,时,分,秒,对比的时间戳
   * @param enddate 未来的结束时间
   * @returns
   */
  getCountDownAll: (enddate: any) => {
    function checkTime(i: any) {
      if (i < 10) i = '0' + i
      return i
    }
    if (typeof enddate === 'string') enddate = new Date(enddate)
    const leftTime = enddate.getTime() - new Date().getTime()
    if (leftTime < 0) return [0, 0, 0, 0]
    const days = parseInt(leftTime / 1000 / 60 / 60 / 24 + '', 10)
    const hours = parseInt(((leftTime / 1000 / 60 / 60) % 24) + '', 10)
    const minutes = parseInt(((leftTime / 1000 / 60) % 60) + '', 10)
    const seconds = parseInt(((leftTime / 1000) % 60) + '', 10)
    const arr = [days, hours, minutes, seconds].map((item) => checkTime(item))
    arr.push(leftTime)
    return arr
  },

  // 是否登录
  isLogin: () => {
    return sconfig.userInfo?.token ? true : false
  },

  getMoneyFiexd: (money: number | string, n = 0) => {
    if (!money) return ''
    let maxStr = money.toString()
    let maxIndex = maxStr.indexOf('.')
    let numberMoney = '0'
    if (maxIndex == -1) {
      numberMoney = maxStr
    } else {
      numberMoney = maxStr.substring(0, maxIndex + 3)
    }
    let num = parseFloat(numberMoney)
    return num.toFixed(n)
  },

  // 数据处理
  dataHandling: (amount: number | string, fixed = 4, endFixed?: number) => {
    if (StrUtil.isNull(amount)) amount = '0'
    let unit = ''
    amount = parseFloat(amount.toString()) || 0
    if (amount < 10000) {
    } else if (amount < 1000000) {
      // 如果金额在10,000到1,000,000之间，则显示为xxxx.xxW（万）
      amount /= 1000
      unit = 'K'
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
    decimalPart = decimalPart.substring(0, fixed)
    decimalPart = decimalPart.replace(/0+$/, '')
    //对末位进行0补齐
    if (endFixed) {
      if (decimalPart.length < endFixed) {
        while (decimalPart.length < endFixed) {
          decimalPart += '0'
        }
      }
    }
    amount = decimalPart ? `${integerPart}.${decimalPart}` : integerPart
    return amount + unit
  },

  // 用户名字段隐藏
  changeUserName: (name: string, frontLen = 0, endLen = 0) => {
    if (!name) return ''
    if (name.length == 1) return '*'
    if (name.length == 2) return name.substring(0, 1) + '*'
    if (name.length < 5) {
      frontLen = 1
      endLen = 1
    } else {
      frontLen = 2
      endLen = 2
    }
    let len = name.length - frontLen - endLen
    let str = ''
    for (let i = 0; i < len; i++) {
      str += '*'
    }
    return name.substring(0, frontLen) + str + name.substring(name.length - endLen)
  },

  //截取小数四位 => 不进行四舍五入
  formatNumber: (num: number, num2?: number) => {
    !num2 && (num2 = 4)
    let multiplier = Math.pow(10, num2) // 将数字乘以10000（因为我们要保留四位小数）
    let roundedNum = Math.floor(num * multiplier) // 乘以10000后向下取整
    return roundedNum / multiplier // 再除以10000得到结果
  },

  // 时间戳 => 当地标准时间
  getTime: (val: number | string | Date) => {
    let _time = String(new Date(val))
    let arr = _time.split(' ').slice(0, 5)
    return arr.join(' ')
  },

  // 年月日 时分秒 => 当地标准时间
  handleTime: (val: number | string | Date) => {
    let newTime = Date.parse(new Date(val).toString())
    let _time = String(new Date(newTime))
    let arr = _time.split(' ').slice(0, 5)
    return arr.join(' ')
  },
  getTimeFormat: (timestamp: number | string, type = 1) => {
    if (!timestamp) return '-'
    let date = new Date(timestamp)
    let year = date.getFullYear()
    let moth = ('0' + (date.getMonth() + 1)).slice(-2)
    let day = ('0' + date.getDate()).slice(-2)
    let hour = ('0' + date.getHours()).slice(-2)
    let minute = ('0' + date.getMinutes()).slice(-2)
    let sechond = ('0' + date.getSeconds()).slice(-2)
    if (type == 2) return hour + ':' + minute + ':' + sechond
    if (type == 3) return year + '-' + moth + '-' + day
    return year + '-' + moth + '-' + day + '  ' + hour + ':' + minute + ':' + sechond
  },

  // 计算两个数相除 => 结果保留四位小数四舍五入
  division: (arg1: number | string, arg2: number | string, fixed = true) => {
    let t1 = 0,
      t2 = 0,
      r1,
      r2
    try {
      t1 = new String(arg1).split('.')[1].length
    } catch (e) {}
    try {
      t2 = arg2.toString().split('.')[1].length
    } catch (e) {}
    r1 = Number(new String(arg1).replace('.', ''))
    r2 = Number(arg2.toString().replace('.', ''))
    //放大倍数后两个数相除 后，乘以两个小数位数长度相减后的10的次幂
    let money = sutil.Mul(r1 / r2, Math.pow(10, t2 - t1))
    //保留4个小数位数
    if (!fixed) return money.toFixed(16)
    return money.toFixed(4)
  },

  // 计算两个数相除 => 结果截取小数四位
  handleDivision: (arg1: number | string, arg2: number | string, fixed = true) => {
    let t1 = 0,
      t2 = 0,
      r1,
      r2
    try {
      t1 = new String(arg1).split('.')[1].length
    } catch (e) {}
    try {
      t2 = arg2.toString().split('.')[1].length
    } catch (e) {}
    r1 = Number(new String(arg1).replace('.', ''))
    r2 = Number(arg2.toString().replace('.', ''))
    //放大倍数后两个数相除 后，乘以两个小数位数长度相减后的10的次幂
    let money = sutil.Mul(r1 / r2, Math.pow(10, t2 - t1))
    let multiplier = Math.pow(10, 4) // 将数字乘以10000（因为我们要保留四位小数）
    let roundedNum = Math.floor(money * multiplier) // 乘以10000后向下取整
    return roundedNum / multiplier // 再除以10000得到结果
  },

  //计算两个数相乘
  Mul: (arg1: number | string, arg2: number | string) => {
    let m = 0,
      s1 = arg1.toString(),
      s2 = arg2.toString()
    //获取两个相乘数据的小数点后面的数据的长度，即获取小数的位数，因为最终相乘计算的结果：结果小数的位数=第一个数的小数位数+第二个数的小数位数
    try {
      m += s1.split('.')[1].length
    } catch (e) {}
    try {
      m += s2.split('.')[1].length
    } catch (e) {}
    //将两个小数去掉小数点，强制转换整个值（即进行数值放开小数点位数的倍数），然后进行相乘的操作，相乘的结果除去10的m次方
    return (Number(s1.replace('.', '')) * Number(s2.replace('.', ''))) / Math.pow(10, m)
  },

  //两数相加
  addNum: (num1: number, num2: number) => {
    let sq1, sq2, m
    try {
      sq1 = num1.toString().split('.')[1].length
    } catch (e) {
      sq1 = 0
    }
    try {
      sq2 = num2.toString().split('.')[1].length
    } catch (e) {
      sq2 = 0
    }
    m = Math.pow(10, Math.max(sq1, sq2))
    return (num1 * m + num2 * m) / m
  },

  //两数相减
  numsub: (arg1: number, arg2: number) => {
    let r1, r2, m, n
    try {
      r1 = arg1.toString().split('.')[1].length
    } catch (e) {
      r1 = 0
    }
    try {
      r2 = arg2.toString().split('.')[1].length
    } catch (e) {
      r2 = 0
    }
    m = Math.pow(10, Math.max(r1, r2))
    n = r1 >= r2 ? r1 : r2
    return ((arg1 * m - arg2 * m) / m).toFixed(n)
  },

  /* 部分隐藏处理
   ** str 需要处理的字符串
   ** frontLen 保留的前几位
   ** endLen 保留的后几位
   ** cha 替换的字符串
   */
  plusXing: (str: string, frontLen: number, endLen: number, cha: string) => {
    let len = str.length - frontLen - endLen
    let xing = ''
    for (let i = 0; i < len; i++) {
      xing += cha
    }
    return str.substring(0, frontLen) + xing + str.substring(str.length - endLen)
  },

  //rsa 加密
  jsRsa: (message: string, publicKey: string) => {
    // 加密
    const jsRsa = new JSEncrypt()

    //设置公钥  公钥是由后端返回的
    jsRsa.setPublicKey(publicKey)

    //使用加密对象给密码加密
    let str: string | false = ''
    str = jsRsa.encrypt(message)

    return str
  },

  //转换字符串的参数
  getQueryParams: (url: string) => {
    // 使用正则表达式匹配URL中的查询参数
    const paramsString = url.split('?')[1]
    if (!paramsString) {
      return {}
    }
    // 将查询参数字符串分割为键值对数组
    const params = paramsString.split('&')
    const paramsObj: any = {}
    params.forEach((param) => {
      // 分割键和值
      let [key, value] = param.split('=')
      // 解码键和值
      key = decodeURIComponent(key)
      value = decodeURIComponent(value)
      // 添加到对象中
      paramsObj[key] = value
    })
    return paramsObj
  },

  //获取 => 今天 昨天 近七天 的时间戳
  getTimeRanges: (type: string) => {
    // 获取当前日期
    let daystart = null
    let daysEnd = null
    let today = new Date()
    // 今天的日期
    if (type == 'today') {
      let start = new Date() // 设置为今天的开始时间
      start.setHours(0, 0, 0, 0)
      daystart = start.getTime()
      let end = new Date()
      end.setHours(23, 59, 59, 999) // 昨天结束时间
      daysEnd = end.getTime()
    }
    // 获取昨天的日期
    if (type == 'yesterday') {
      let yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1) // 设置为昨天的日期
      yesterday.setHours(0, 0, 0, 0) // 设置为昨天的开始时间
      daystart = yesterday.getTime()
      daysEnd = new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1).getTime() // 昨天结束时间
    }
    // 获取近七天的日期
    if (type == 'sevenDays') {
      let sevenDaysAgo = new Date(today)
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7) // 设置为七天前的日期
      sevenDaysAgo.setHours(0, 0, 0, 0) // 设置为七天前的开始时间
      daystart = sevenDaysAgo.getTime()
      daysEnd = new Date(today.getTime() - 1).getTime() // 近七天的结束时间
    }
    // 返回开始和结束时间
    return {
      daystart,
      daysEnd
    }
  },

  //匹配结果最后一个数字
  getLastNum: (str: string) => {
    const match = str.match(/\d(?!.*\d)/)
    return match ? match[0] : ''
  },

  /** 获取时间区间选择 */
  getDateOptions: (all = true) => {
    const interval = []
    if (all)
      interval.push({
        label: i18n.t('dateOptions.AllDates'),
        value: null,
        key: 'all'
      })
    interval.push({
      label: i18n.t('dateOptions.Today'),
      value: TimeUtil.somedayse(),
      key: 'today'
    })
    interval.push({
      label: i18n.t('dateOptions.Yesterday'),
      value: TimeUtil.somedayse(-1),
      key: 'yesterday'
    })

    const t = new Date()

    const _day = TimeUtil.somedayse
    // 本周起始时间-结束时间
    const today = t.getDay()
    const startTime = _day(1 - today)[0]
    const endTime = _day(7 - today)[1]
    const thisWeek = {
      label: i18n.t('dateOptions.ThisWeek'),
      value: [startTime, endTime],
      key: 'thisWeek'
    }
    interval.push(thisWeek)

    // 上周起始时间-结束时间
    const lastWeekSTime = _day(1 - today - 7)[0]
    const lastWeekETime = _day(7 - today - 7)[1]
    const lastWeek = {
      label: i18n.t('dateOptions.LastWeek'),
      value: [lastWeekSTime, lastWeekETime],
      key: 'lastWeek'
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
      label: i18n.t('dateOptions.ThisMonth'),
      value: [mstartTime[0], mendTime[1]],
      key: 'thisMonth'
    }
    interval.push(thisMonth)

    return interval
  },

  /**
   * 获取时间提示
   * @param time 时间戳
   * @returns 时间提示
   */
  getTimeTip: (time: number) => {
    const _thisTime = new Date()
    const _formatTime = new Date(time)
    const now = _thisTime.getTime()
    const diff = now - time

    // //刚刚
    // if (diff < 60 * 1000) return i18n.t('chatRoom.just_now')

    //今天
    if (diff < 24 * 60 * 60 * 1000) {
      const _dd = _thisTime.Format('dd')
      const _ddFormat = _formatTime.Format('dd')
      if (_dd == _ddFormat) return _formatTime.Format('hh:mm')
    }

    //昨天
    if (diff < 48 * 60 * 60 * 1000) {
      const _yd = new Date(TimeUtil.somedayse(-1)[0])
      const _dd = _yd.Format('dd')
      const _ddFormat = _formatTime.Format('dd')
      if (_dd == _ddFormat) return i18n.t('chatRoom.yesterday')
    }

    //今年的显示月日
    const _year = _thisTime.getFullYear()
    const _yearFormat = _formatTime.getFullYear()
    if (_year == _yearFormat) return _formatTime.Format('MM/dd')

    return _formatTime.Format('MM/dd/yyyy')
  }
})

export default sutil
