import { apis } from '@/api'
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import System from '@/utils/System'
import { svalue } from '@/sstore/svalue'
import sutil from '@/sstore/sutil'

export const index = ({ gameBoxRefs }: any) => {
  const conf = reactive({
    bet: {
      open: () => {
        CEvent.emit('openbet')
      },
      close: () => {
        CEvent.emit('closebet')
      },
      autoClose: (time: any) => {
        time <= conf.openLockCountdown && conf.bet.close()
      },
      //清理选中数据
      closeFun: (type: any) => {
        conf.betNumArr = []
        conf.selectBetInfoArr = []
        if (type == 'betSuccess' && conf.tabType == 3) {
          conf.handleSelctTabChange(3, null)
        }
      }
    },
    play: {
      active: 't1',
      choose: (key: any, index: any) => {
        conf.play.active = key
        //清空倒计时定时器
        clearTimeout(conf.countdownSetTime)
        conf.countdownSetTime = null
        conf.getCurrentPlayInfo(index)
        conf.bet.close()
      },
      list: [
        {
          key: 't1',
          label: 'Racing 1Min'
        },
        {
          key: 't3',
          label: 'Racing 3Min'
        },
        {
          key: 't5',
          label: 'Racing 5Min'
        },
        {
          key: 't10',
          label: 'Racing 10Min'
        }
      ]
    },
    autoplay: false,
    duration: 150,

    betTypeArr: [] as any,
    betNumArr: [] as any[], //选中的数据
    loading: false,
    tabType: 1,
    pageSize: 10,
    pageNum: 1,
    total: 60,
    totalPage: 0,
    betNumList: [0, 0, 0, 0, 0],
    downTimeNum: 3,
    hours: '00', //倒计时 - 时
    minutes: '00', //倒计时 - 分
    second: '00', //倒计时 - 秒
    betTotal: 0,
    bigTimeShow: true,
    stopBetTime: 10,

    selectBetInfoArr: [] as any[],

    drawNumber: '',

    lotteryRuleurl: '',
    gameTypeArr: [] as any[], //玩法类型
    lotteryId: '', //当前玩法类型id
    openLockCountdown: 0, //当前玩法类型停止下注倒计时
    currentOpenInfo: {} as any, //当前期数开奖信息
    lastOpenInfo: {} as any, //上一期开奖期数
    nextOpenInfo: {} as any, //下一期开奖信息
    countdownNum: 10, //当前玩法类型开奖倒计时
    getOpenLotteryInfoTimer: null as any, //获取开奖信息定时器
    oddsArr: [] as any[], //赔率数据

    countdownDialogTime: 10,
    bigDownShow: false,

    // 开奖结果信息
    resultInfoObj: {
      numArr: [
        {
          key: 'A',
          value: '1'
        },
        {
          key: 'B',
          value: '2'
        },
        {
          key: 'C',
          value: '3'
        },
        {
          key: 'D',
          value: '4'
        },
        {
          key: 'E',
          value: '5'
        }
      ],
      sum: 0
    },

    countdownSetTime: null as any, //倒计时定时器
    selectBetList: ['A', 'B', 'C', 'D', 'E', 'SUM'],
    selectBetType: '', //选择下注类型
    selectBetIndex: 0,
    //大小、单双赔率数据
    betTypeOdds: [
      {
        number: '',
        name: 'Big',
        select: false,
        odds: 2,
        color: 'blue',
        type: 'other'
      },
      {
        number: '',
        name: 'Small',
        select: false,
        odds: 2,
        color: 'yellow',
        type: 'other'
      },
      {
        number: '',
        name: 'Odd',
        select: false,
        odds: 2,
        color: 'red',
        type: 'other'
      },
      {
        number: '',
        name: 'Even',
        select: false,
        odds: 2,
        color: 'green',
        type: 'other'
      }
    ],
    // 数字赔率
    betNumberOdds: [] as any[],
    allOddsData: [] as any[], //赔率数据

    //分页
    pageObj: {
      page: 1,
      size: 10,
      total: 0,
      pageTotal: 0
    },

    resultList: [], //历史记录
    chartDataList: [], //趋势图
    orderDataList: [], //下注订单

    openCodeAllData: [],
    scollIndex: 0,
    scollTimer: null as any,
    isNoOpenCode: true, //判断是否开奖
    scollSum: null,
    resultTop: null,

    isClickPage: false,
    gameType: '',
    gameTypeId: '',
    countdownArr: [] as any[],
    getRandomInt(min: any, max: any) {
      min = Math.ceil(min) // 确保min是整数
      max = Math.floor(max) // 确保max是整数
      return Math.floor(Math.random() * (max - min + 1)) + min // 返回介于min和max之间的整数
    },

    //获取玩法类型
    getLotteryList(index: any) {
      apis.lotteryList({
        success: (res: any) => {
          let datas = res.data
          let newIndex = datas.findIndex((item: any) => item.lotteryTypeVO.lotteryTypeCode == '5D')
          conf.gameTypeArr = datas[newIndex].lotteryVOList || []
          conf.gameType = conf.gameTypeArr[index].lotteryShowname || conf.gameTypeArr[0].lotteryShowname
          conf.gameTypeId = conf.gameTypeArr[index].id || conf.gameTypeArr[0].id
          conf.openLockCountdown = conf.gameTypeArr[index].openLockCountdown / 1000 //锁定倒计时
          conf.lotteryId = conf.gameTypeArr[index].id
          conf.play.list = datas[newIndex].lotteryVOList || []
          conf.play.active = conf.gameTypeArr[index].id || []
          let min = conf.gameTypeArr[index].lotteryInterval || conf.gameTypeArr[0].lotteryInterval
          if (conf.getOpenLotteryInfoTimer) {
            clearTimeout(conf.getOpenLotteryInfoTimer)
            conf.getOpenLotteryInfoTimer = null
          }
          conf.getLotteryOpen('changePlay')
          conf.getLotteryOdds(conf.gameTypeArr[index].lotteryTypeId)
          conf.handleSelctTabChange(conf.tabType, null)
          conf.lotteryRuleurl = conf.gameTypeArr[index].lotteryRuleurl
        }
      })
    },

    //获取当前玩法数据
    getCurrentPlayInfo(index: any) {
      conf.gameType = conf.gameTypeArr[index].lotteryShowname || conf.gameTypeArr[0].lotteryShowname
      conf.gameTypeId = conf.gameTypeArr[index].id || conf.gameTypeArr[0].id
      conf.openLockCountdown = conf.gameTypeArr[index].openLockCountdown / 1000 //锁定倒计时
      conf.lotteryId = conf.gameTypeArr[index].id
      conf.play.active = conf.gameTypeArr[index].id || []
      let min = conf.gameTypeArr[index].lotteryInterval || conf.gameTypeArr[0].lotteryInterval
      if (conf.getOpenLotteryInfoTimer) {
        clearTimeout(conf.getOpenLotteryInfoTimer)
        conf.getOpenLotteryInfoTimer = null
      }
      conf.getLotteryOpen('changePlay')
      conf.lotteryRuleurl = conf.gameTypeArr[index].lotteryRuleurl
    },

    //获取开奖信息
    getLotteryOpen(type: any) {
      conf.isNoOpenCode = true
      if (type == 'changePlay') {
        System.loading()
      }
      apis.lotteryOpen({
        lotteryId: conf.lotteryId,
        success: (res: any) => {
          let datas = res.data
          conf.currentOpenInfo = datas.currentOpen
          conf.lastOpenInfo = datas.lastOpen
          conf.nextOpenInfo = datas.nextOpen
          conf.countdownNum = parseInt(conf.currentOpenInfo.openTime) - parseInt(datas.currentSystemTime)
          type && conf.handleCountdown(conf.countdownNum)

          //上一期数未开奖
          if (!conf.lastOpenInfo.openCode) {
            clearTimeout(conf.getOpenLotteryInfoTimer)
            conf.getOpenLotteryInfoTimer = null
            conf.getOpenLotteryInfoTimer = setTimeout(() => {
              conf.getLotteryOpen(null)
            }, 1000)
            clearInterval(conf.scollTimer)
            conf.scollTimer = null
            conf.handleScollNumber()
          } else {
            conf.isNoOpenCode = false
            gameBoxRefs && gameBoxRefs.value?.getWalletMoney(2)
            conf.handleDrawLotteryResult(conf.lastOpenInfo.openCode)
            conf.handleSelctTabChange(conf.tabType, null)
          }
        },
        final: () => {
          System.loading(false)
        }
      })
    },

    // 未开奖 => 数字变化
    handleScollNumber() {
      conf.scollTimer = setInterval(() => {
        conf.scollIndex = conf.getRandomIndex(conf.openCodeAllData)
        conf.scollSum = conf.getRandomInt(0, 45)
      }, 100)
    },

    //随机选择数组索引
    getRandomIndex(array: any) {
      let randomIndex = Math.floor(Math.random() * array.length)
      return randomIndex
    },

    //获取赔率
    getLotteryOdds(lotteryTypeId: any) {
      // System.loading()
      apis.lotteryOdds({
        lotteryTypeId,
        lotteryTypeCode: '5D',
        success: (res: any) => {
          conf.allOddsData = res.data || []
          conf.handleOdds()
        },
        final: () => {
          System.loading(false)
        }
      })
    },

    //处理赔率
    handleOdds() {
      let str = '',
        newArr = []
      switch (conf.selectBetType) {
        case 'A':
          str = 'single_A'
          break
        case 'B':
          str = 'single_B'
          break
        case 'C':
          str = 'single_C'
          break
        case 'D':
          str = 'single_D'
          break
        case 'E':
          str = 'single_E'
          break
        case 'SUM':
          str = 'sum'
          break
      }
      newArr = conf.allOddsData.filter((item: any) => item.oddsCode.includes(str))
      let regex = /^[0-9]*$/ // 匹配数字
      newArr.forEach((item: any) => {
        let num = item.oddsCode.split(str + '_')[1]
        item.number = regex.test(num) ? parseFloat(num) : num.toUpperCase()
        item.odds = parseFloat(item.odds)

        //大小、单双赔率
        let newIndex = conf.betTypeOdds.findIndex((into) => into.name.toUpperCase() == item.number)
        if (newIndex != -1) {
          let newObj = {
            name: conf.betTypeOdds[newIndex].name,
            color: conf.betTypeOdds[newIndex].color,
            type: conf.betTypeOdds[newIndex].type,
            select: false,
            ...item
          }
          conf.betTypeOdds[newIndex] = newObj
        }

        // 数字赔率
        let index = conf.betNumberOdds.findIndex((into: any) => into.name == item.number)
        if (index != -1) {
          let obj = {
            name: conf.betNumberOdds[index].name,
            type: conf.betNumberOdds[index].type,
            ...item
          }

          conf.betNumberOdds[index] = obj
        }
      })
    },

    //处理开奖结果
    handleDrawLotteryResult(val: any) {
      let arr = val.split(',')
      arr.forEach((item: any, itemIndex: number) => {
        item = parseInt(item)
        conf.resultInfoObj.numArr[itemIndex].value = item
      })
      conf.resultInfoObj.sum = eval(arr.join('+'))
    },

    //选择下注位数类型
    handleSelectBetType(item: any, index: number) {
      conf.betTypeArr = []
      conf.betNumArr = []
      conf.betTypeOdds.forEach((item) => {
        item.select = false
      })
      conf.selectBetType = item
      conf.selectBetIndex = index
      conf.handleOdds()
    },

    //分页change
    handlePageChange(type: any) {
      conf.handleSelctTabChange(conf.tabType, type)
      conf.handleClickOrderPage(true)
    },

    //点击order => 分页
    handleClickOrderPage(val: any) {
      conf.isClickPage = val
    },

    //选择菜单类型（Rule、Result history、Chart、My order）
    //type判断分页
    handleSelctTabChange(num: any, type: any) {
      conf.tabType = num
      if (type == 'last') {
        conf.pageObj.page--
      } else if (type == 'next') {
        conf.pageObj.page++
      } else {
        conf.pageObj.page = 1
      }
      switch (num) {
        //Result history
        case 1:
          conf.getLotteryResult()
          break
        //Chart
        case 2:
          conf.getLotteryResult()
          break
        //My order
        case 3:
          conf.getOrderData()
          break
        //Rule
        case 4:
          break
      }
    },

    //获取result数据
    getLotteryResult() {
      // System.loading()
      apis.lotteryOpenResult({
        current: conf.pageObj.page,
        size: conf.pageObj.size,
        lotteryId: conf.lotteryId,
        success: (res: any) => {
          let datas = res.data
          conf.resultList = datas.records || []
          conf.resultList?.forEach((item: any) => {
            item.openCodeArr = item.openCode ? item.openCode.split(',') : []
            item.sum = eval(item.openCodeArr.join('+'))
          })
          conf.pageObj.page = datas.current
          conf.pageObj.total = datas.total
          conf.pageObj.pageTotal = Math.ceil(datas.total / conf.pageObj.size)
          conf.chartDataList = conf.resultList.filter((item: any) => {
            return item.openCode
          })
        },
        final: () => {
          System.loading(false)
        }
      })
    },

    //获取My order数据
    async getOrderData() {
      System.loading()
      let defaultWalletInfo = await svalue.getDefaultWallet()
      apis.lotteryUserOrder({
        current: conf.pageObj.page,
        size: conf.pageObj.size,
        lotteryId: conf.lotteryId,
        success: async (res: any) => {
          let coinlistArr = await svalue.getCoinlist() //货币数据
          let datas = res.data
          conf.orderDataList = datas.records || []
          conf.orderDataList?.forEach((item: any) => {
            item.openNumberArr = item.betOpenCode ? item.betOpenCode.split(',') : []
            item.sum = eval(item.openNumberArr.join('+')) || ''

            //下注number
            let arr = item.betCodes.split('_') || []
            item.betNumber = arr

            let obj = coinlistArr.find((into) => into.coinCode == item.betCoinCode)
            //默认钱包coinSymbol
            item.defaultWalletCoinSymbol =
              defaultWalletInfo.coinSymbol == 'USDT' ? defaultWalletInfo.coinSymbol + ' ' : defaultWalletInfo.coinSymbol
            item.defaultWalletCoin = defaultWalletInfo.walletCoin

            //下注钱包coinSymbol
            item.coinSymbol = obj.coinSymbol == 'USDT' ? obj.coinSymbol + ' ' : obj.coinSymbol

            // 下注钱包对应汇率
            item.coinTousdt = obj?.coinTousdt

            //下注金额汇率转换（eg:默认钱包=CNY，默认币种钱包=INR,下注钱包=USD,将下注金额转换为默认钱包对应金额）
            let betMoneyResult = sutil.Mul(
              sutil.division(defaultWalletInfo.coinTousdt, item.coinTousdt, false),
              item.totalBetAmount
            )
            betMoneyResult = sutil.formatNumber(betMoneyResult)
            let betMoneyResultToFixed4 = sutil.dataHandling(betMoneyResult)
            item.betMoneyToFixed4 = betMoneyResultToFixed4

            //中奖金额汇率转换
            let PrizeMoneyResult = null
            if (parseFloat(item.betPrizeMoney) > 0) {
              PrizeMoneyResult = sutil.Mul(
                sutil.division(defaultWalletInfo.coinTousdt, item.coinTousdt, false),
                item.betPrizeMoney
              )
              PrizeMoneyResult = sutil.formatNumber(PrizeMoneyResult)
            } else {
              item.betPrizeMoney = 0.0
              PrizeMoneyResult = 0.0
            }
            let PrizeMoneyResultToFixed4 = sutil.dataHandling(PrizeMoneyResult)
            item.PrizeMoneyToFixed4 = PrizeMoneyResultToFixed4
          })
          conf.pageObj.page = datas.current
          conf.pageObj.total = datas.total
          conf.pageObj.pageTotal = Math.ceil(datas.total / conf.pageObj.size)
        },
        final: () => {
          System.loading(false)
        }
      })
    },

    //选择下注
    handleSelectBet(item: any) {
      let currIndex = conf.betNumArr.indexOf(item.number)
      if (currIndex != -1) {
        conf.betNumArr.splice(currIndex, 1)
      } else {
        conf.betNumArr.push(item.number)
      }
      conf.betNumArr.sort((a, b) => {
        return a - b
      })
      conf.open()
      conf.selectBetInfoArr.push(item)
    },

    //清理选中数据
    closeFun: () => {
      conf.betNumArr = []
      conf.selectBetInfoArr = []
    },

    // 倒计时
    handleCountdown(nowDate: any) {
      let hours = Math.floor((nowDate / 1000 / 60 / 60) % 24)
      let minutes = Math.floor((nowDate / 1000 / 60) % 60)
      let seconds = Math.floor((nowDate / 1000) % 60)
      if (seconds < 0) return
      conf.hours = conf.ripr(hours)
      conf.minutes = conf.ripr(minutes).toString()
      conf.second = conf.ripr(seconds).toString()
      conf.countdownDialogTime = conf.ripr(Math.floor(nowDate / 1000))
      conf.countdownDialogTime = conf.countdownDialogTime
      conf.bigDownShow = true
      if (nowDate > 0) {
        conf.countdownSetTime = setTimeout(() => {
          nowDate -= 1000
          if (nowDate < 0) {
            clearInterval(conf.countdownSetTime)
            conf.countdownSetTime = null
            if (conf.getOpenLotteryInfoTimer) {
              clearTimeout(conf.getOpenLotteryInfoTimer)
              conf.getOpenLotteryInfoTimer = null
            }
            conf.getLotteryOpen('load')
          } else {
            conf.handleCountdown(nowDate)
          }
          conf.countdownArr = [conf.hours, conf.minutes, conf.second]
          conf.bet.autoClose(conf.countdownDialogTime)
        }, 1000)
      }
    },

    //数据小于10处理
    ripr(num: any) {
      num = parseFloat(num)
      return num < 10 ? `0${num}` : num
    },
    open: () => {
      CEvent.emit('openbet')
    },
    close: () => {
      CEvent.emit('closebet')
    }
  })
  onUnmounted(() => {
    //清空倒计时定时器
    clearTimeout(conf.countdownSetTime)
    conf.countdownSetTime = null

    clearTimeout(conf.getOpenLotteryInfoTimer)
    conf.getOpenLotteryInfoTimer = null

    clearInterval(conf.scollTimer)
    conf.scollTimer = null
  })
  onMounted(() => {
    for (let i = 0 as never; i < 10; i++) {
      conf.openCodeAllData.push(i)
    }
    conf.selectBetType = conf.selectBetList[0]
    for (let i = 0; i < 10; i++) {
      conf.betNumberOdds.push({
        name: i,
        type: 'num'
      })
    }
    conf.getLotteryList(0)
  })
  return conf
}
