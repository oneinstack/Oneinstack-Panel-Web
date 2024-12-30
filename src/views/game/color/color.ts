import sutil from '@/sstore/sutil'
import { apis } from '@/api'
import System from '@/utils/System'
import i18n from '@/lang'
import { onMounted, onUnmounted, reactive } from 'vue'
import sbet from '@/sstore/sbet'
import { svalue } from '@/sstore/svalue'
import sstatus from '@/sstore/sstatus'

export const index = ({ resultRefs, colorRefs, tabsRefs }: any) => {
  const conf = reactive({
    colorNum: 0,
    autoplay: true,
    duration: 0,
    bannerList: [
      {
        num: 0,
        src: '/static/img/color2.webp'
      },
      {
        num: 1,
        src: '/static/img/color-green.webp'
      },
      {
        num: 2,
        src: '/static/img/color-red.webp'
      },
      {
        num: 3,
        src: '/static/img/color-green.webp'
      },
      {
        num: 4,
        src: '/static/img/color-red.webp'
      },
      {
        num: 5,
        src: '/static/img/color1.webp'
      },
      {
        num: 6,
        src: '/static/img/color-red.webp'
      },
      {
        num: 7,
        src: '/static/img/color-green.webp'
      },
      {
        num: 8,
        src: '/static/img/color-red.webp'
      },
      {
        num: 9,
        src: '/static/img/color-green.webp'
      },
      {
        num: 10,
        src: '/static/img/small.webp'
      },
      {
        num: 11,
        src: '/static/img/big.webp'
      }
    ],
    categoryIndex: 1,
    tabs: [] as any[],
    tabIndex: 0,
    hour: '00',
    minutes: '00',
    second: '00',
    timer: null as any,
    bar: 100,
    number: 0,
    timePopupShop: false,
    showBet: false,
    colorItem: {} as any,
    showPrinter: false,
    lotteryVOList: [0, 0, 0, 0],
    lastOpen: {} as any,
    currentOpen: {} as any,
    lotteryId: '',
    serviceHeiht: 300,
    timeStopBet: true,
    colorBtnNum: -1 as any,
    lotteryOdds: [],
    openPrinter: false,
    greenOdds: 1,
    violetOdds: 1,
    redOdds: 1,
    odds: {} as any,
    walletMoney: '-',
    openLockCountdown: 10000,
    betShare: false,
    openNum: 0,
    isRequest: false,
    openShow: true,
    countdownNext: 0,
    countdownCurr: 0,
    countdownNum: 0,
    tabIndexId: '',
    lotteryRuleurl: '',
    selectBetList: [] as any,
    scrollIntodiv: '',
    scrollTop: 0,
    isBetBtnClick: true,
    gameType: 'Color',
    navIndex: 0,
    defaultWalletInfo: {} as any,
    requestOpen: true,
    changeTab(item: any, index: number) {
      if (conf.tabIndex == item.lotteryInterval) return
      conf.tabIndexId = item.id
      conf.tabIndex = item.lotteryInterval
      conf.openLockCountdown = item.openLockCountdown
      conf.selectBetList = []
      conf.openShow = true
      conf.getLotteryList(index)
      if (conf.timer) {
        clearInterval(conf.timer)
        conf.timer = null
      }
      sstatus.getscrollLeft(tabsRefs, 600, index, 180)
    },
    // 获取时间tab
    getLotteryList(index: any) {
      apis.lotteryList({
        success: (res: any) => {
          let datas = res.data
          let newIndex = datas.findIndex((item: any) => item.lotteryTypeVO.lotteryTypeCode == 'COLOR')
          conf.tabs = datas[newIndex].lotteryVOList
          conf.lotteryRuleurl = conf.tabs[index]?.lotteryRuleurl
          conf.tabIndex = conf.tabs[index].lotteryInterval
          conf.tabIndexId = conf.tabs[index].id
          conf.openLockCountdown = conf.tabs[index].openLockCountdown
          if (conf.timer) {
            clearInterval(conf.timer)
            conf.timer = null
          }
          conf.navIndex = index
          conf.getLotteryOpen(conf.tabs[index].id)
          conf.getLotteryOdds(conf.tabs[index].lotteryTypeId)
          // if (index > 1) conf.scrollLeft = index * 30
        }
      })
    },
    // 获取赔率
    getLotteryOdds(lotteryTypeId: any) {
      System.loading()
      apis.lotteryOdds({
        lotteryTypeId,
        lotteryTypeCode: 'COLOR',
        success: (res: any) => {
          conf.lotteryOdds = res.data.map((item: any) => {
            return {
              orderType: item.oddsCode.split('_')[1],
              ...item
            }
          })
          res.data.forEach((item: any) => {
            if (item.oddsCode == 'color_green' && item.odds) {
              conf.greenOdds = parseFloat(item.odds)
            }
            if (item.oddsCode == 'color_violet' && item.odds) {
              conf.violetOdds = parseFloat(item.odds)
            }
            if (item.oddsCode == 'color_red' && item.odds) {
              conf.redOdds = parseFloat(item.odds)
            }
            conf.odds[item.oddsCode + '_status'] = item.oddsStatus
          })
        },
        final: () => {
          System.loading(false)
        }
      })
    },
    // 获取开奖信息
    getLotteryOpen(lotteryId: any) {
      if (!conf.requestOpen) return
      lotteryId && (conf.lotteryId = lotteryId)
      if (!conf.autoplay) {
        conf.duration = 150
        conf.autoplay = true
      }
      apis.lotteryOpen({
        lotteryId: lotteryId || conf.lotteryId,
        success: (res: any) => {
          if (res.code == 200) {
            let cdata = res.data
            conf.currentOpen = cdata.currentOpen
            let id = conf.tabs[conf.navIndex].lotteryTypeId
            if (conf.openShow) {
              if (cdata.currentOpen && id == lotteryId) conf.openShow = false
              let currentOpen = cdata.currentOpen.openTime
              conf.countdownCurr = parseInt(currentOpen) - parseInt(cdata.currentSystemTime)
              let currentNext = cdata.nextOpen.openTime
              conf.countdownNext = parseInt(currentNext) - parseInt(cdata.currentSystemTime)

              conf.countdownNum = conf.countdownCurr
              conf.setTime()
            }
            conf.lastOpen = cdata.lastOpen
            conf.setCode(cdata.lastOpen.openCode)
            if (conf.openPrinter) conf.openPrinter = false
            let openCode = cdata.lastOpen.openCode
            if (!openCode && !conf.isRequest) {
              conf.colorNum = 0
              // if (conf.timer) {
              // 	clearTimeout(conf.timer);
              // 	conf.timer = null;
              // }
              setTimeout(() => {
                conf.getLotteryOpen(conf.lotteryId)
              }, 1000)
            }
          } else {
            conf.minutes = '00'
            conf.second = '00'
            conf.bar = 100
            conf.lastOpen = {}
            conf.currentOpen = {}
            conf.colorNum = 0
            conf.timeStopBet = true
            if (res.code == '1306') {
              setTimeout(() => {
                conf.openNum++
                if (conf.timer) {
                  clearInterval(conf.timer)
                  conf.timer = null
                }
                conf.getLotteryOpen(conf.lotteryId)
              }, 2000)
            } else {
              System.toast(i18n.t(`code.${res.code}`))
            }
          }
        }
      })
    },
    // 开奖结果轮播滚动
    setCode(code: any) {
      if (!code) return
      conf.autoplay = false
      conf.duration = 0
      conf.colorNum = parseInt(code)
      setTimeout(() => {
        let list = sbet.getColorBet(conf.currentOpen.lotteryId, conf.currentOpen.openExpect)
        conf.selectBetList = list
      }, 1000)
      if (conf.categoryIndex == 3) resultRefs.value?.initResult(conf.lotteryId)
      // if (conf.categoryIndex == 4 && conf.isLogin()) conf.$refs.orderRefs.initOrder()
      setTimeout(() => {
        // 更新钱包金额
        conf.getWalletMoney(2)
      }, 5000)
      conf.openShow = true
    },
    setTime() {
      conf.timeStopBet = false
      conf.betShare = false
      if (conf.timer) return
      conf.timer = setInterval(() => {
        if (conf.countdownNum > 0) {
          conf.getCountDown(conf.countdownNum)
          if (conf.countdownNum <= 20000 && !conf.betShare) conf.betShare = true
          if (!conf.timeStopBet && conf.countdownNum <= conf.openLockCountdown) {
            conf.timeStopBet = true
            conf.submit(0)
          }
          if (Math.round(conf.countdownNum / 1000) == 3) conf.timePopupShop = true
        } else {
          if (!conf.autoplay) {
            conf.duration = 150
            conf.autoplay = true
          }
          conf.openShow = true
          conf.countdownNum = conf.countdownNext
          conf.getCountDown(conf.countdownNum)
          if (conf.timer) {
            clearInterval(conf.timer)
            conf.timer = null
          }
          conf.getLotteryOpen(conf.currentOpen.lotteryId)
        }
        conf.bar = (conf.countdownNum / conf.tabIndex) * 100
        conf.countdownCurr -= 1000
        conf.countdownNext -= 1000
        conf.countdownNum -= 1000
      }, 1000)
    },
    getCountDown(nowDate: any) {
      const hours = Math.floor((nowDate / 1000 / 60 / 60) % 24)
      const minutes = Math.floor((nowDate / 1000 / 60) % 60)
      const seconds = Math.floor((nowDate / 1000) % 60)
      if (seconds < 0) return
      conf.hour = conf.ripr(hours)
      conf.minutes = conf.ripr(minutes)
      conf.second = conf.ripr(seconds)
    },
    ripr(num: any) {
      return num < 10 ? `0${num}` : num
    },
    // 选择下注项 参数：图片地址 接口返回数据 类型 数字
    changeBet(status: any, n: any, adds: any, t: any, s: any) {
      if (status == 0) return
      if (conf.timeStopBet) return
      conf.colorBtnNum = s
      conf.lotteryOdds.forEach((item: any) => {
        if (item.oddsCode == adds) {
          conf.colorItem = item
          return
        }
      })
      conf.colorItem['betImg'] = n
      conf.colorItem['betType'] = t || ''
      conf.colorItem['betNum'] = s || 0
      conf.openPrinter = false
      conf.showBet = true
    },
    // 下注
    submit(e: any) {
      conf.colorBtnNum = -1
      if (!e) return (conf.showBet = false)
      conf.colorItem['money'] = e
      if (!conf.defaultWalletInfo.hasOwnProperty('coinCode')) {
        System.toast(i18n.t('game.setWalletTip'))
        return
      }

      let minBetMoney = conf.defaultWalletInfo.betMinAmount
      let maxBetMoney = conf.defaultWalletInfo.betMaxAmount
      let coinSymbol = conf.defaultWalletInfo.coinSymbol

      if (parseFloat(e) < parseFloat(minBetMoney)) {
        System.toast(i18n.t('game.minBetTip') + ' ' + coinSymbol + minBetMoney || '')
        return
      }

      if (parseFloat(e) > parseFloat(maxBetMoney)) {
        System.toast(i18n.t('game.maxBetTip') + ' ' + coinSymbol + maxBetMoney || '')
        return
      }

      System.loading()
      apis.lotteryUserBets({
        money: e,
        betCodes: conf.colorItem.oddsCode,
        betExpect: conf.currentOpen.openExpect,
        betOpenId: conf.currentOpen.lotteryOpenId,
        lotteryId: conf.currentOpen.lotteryId,
        // lotteryOddsId: conf.colorItem.oddsId,
        multiple: 1,
        nums: 1,
        supplement: 0,
        walletCoinCode: conf.defaultWalletInfo.walletCoin,
        success: (res: any) => {
          conf.openPrinter = true
          conf.getWalletMoney(2)
          let betObj = {
            openExpect: conf.currentOpen.openExpect,
            startTime: conf.currentOpen.startTime,
            openTime: conf.currentOpen.openTime,
            betNum: conf.colorItem.betNum,
            money: e,
            lotteryId: conf.currentOpen.lotteryId
          }
          sbet.setColorBet(betObj)
          let list = sbet.getColorBet(conf.currentOpen.lotteryId, conf.currentOpen.openExpect)
          conf.selectBetList = list
          conf.showBet = false
          // conf.scrollToBottom()
          if (conf.selectBetList.length == 1) {
            setTimeout(() => {
              colorRefs.value.toBottom()
            }, 300)
          }
        },
        final: () => {
          conf.showBet = false
          System.loading(false)
        }
      })
    },
    share(e: any) {
      let type = conf.tabIndex
      let orderType = ''
      let openTime = sutil.getTimeFormat(conf.currentOpen.openTime, 2)
      if (type / 1000 / 60 >= 1) {
        orderType = 'Color-' + type / 1000 / 60 + ' Minute'
      } else {
        orderType = 'Color-' + type / 1000 + ' Second'
      }
      let obj = {
        lotteryId: conf.currentOpen.lotteryId,
        money: e.money,
        betCodes: conf.colorItem.oddsCode,
        betExpect: conf.currentOpen.openExpect,
        betOpenId: conf.currentOpen.lotteryOpenId,
        lotteryOddsId: conf.colorItem.oddsId,
        betImg: conf.colorItem.betImg,
        betNum: conf.colorItem.betNum,
        betType: conf.colorItem.betType,
        isPlace: false,
        orderType,
        openTime
      }
      conf.showBet = false
      Cookie.set('roomOrder', JSON.stringify(obj))
      if (e.type == 2) {
        System.router.push(
          '/user/chat/chat?id=' +
            e.roomId +
            '&room=' +
            e.roomName +
            '&banned=' +
            e.roomBanned +
            '&admin=' +
            e.roomAdmin +
            '&type=3'
        )
      } else {
        System.router.push('/user/chat/room?type=3')
      }
    },
    // 获取钱包金额
    async getWalletMoney(type: number) {
      let item = await svalue.getDefaultWallet()
      if (item.hasOwnProperty('coinSymbol')) {
        conf.defaultWalletInfo = item
        let m = parseFloat(item.walletMoney)
        conf.walletMoney = (item.coinSymbol || '₹') + sutil.dataHandling(m)
      }
    }
  })
  onMounted(() => {
    conf.getLotteryList(0)
    conf.getWalletMoney(1)
  })
  onUnmounted(() => {
    conf.requestOpen = false
    if (conf.timer) {
      clearInterval(conf.timer)
      conf.timer = null
    }
  })

  return conf
}
