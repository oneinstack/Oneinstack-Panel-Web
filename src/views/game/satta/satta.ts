import { apis } from '@/api'
import i18n from '@/lang'
import sconfig from '@/sstore/sconfig'
import System from '@/utils/System'
import sutil from '@/sstore/sutil'
import { svalue } from '@/sstore/svalue'
import { computed, onMounted, onUnmounted, reactive } from 'vue'
import { ERouter } from '@/enum/Enum'

export const index = ({ orderRefs, selectRefs }: any) => {
  const conf = reactive({
    walletMoney: '-',
    seleceNumArr: [] as any[],
    typeIndex: 1,
    betArr: [] as any[],
    betStr: '' as any,
    betStrNum: '',
    typeShow: false,
    resultShow: false,
    showOrder: false,
    BettingAmount: '',
    BettingNumber: 1,
    betTotalAmount: 0,
    gameType: '',
    gameTypeId: '',
    gameTypeArr: [] as any,
    betClose: false,
    openLockCountdown: 10000, //锁定倒计时
    hasResultTimer: null as any,
    pointNum: 0, //未开奖数据滚动
    hour: '00',
    minutes: '00',
    second: '00',
    currentOpenInfo: {} as any, //当前期数开奖信息
    lastOpenInfo: {} as any, //上一期开奖期数
    nextOpenInfo: {} as any, //下一期开奖信息
    oddsArr: [] as any, //赔率数据
    countdownNum: null as any,
    playTypeArr: [
      {
        name: 'Jodi',
        value: 1,
        odds: '',
        numArr: [],
        rule: i18n.t('SattaKing.JodirRule')
      },
      {
        name: 'Andar',
        value: 2,
        odds: '',
        numArr: [],
        rule: i18n.t('SattaKing.AndarRule')
      },
      {
        name: 'Bndar',
        value: 3,
        odds: '',
        numArr: [],
        rule: i18n.t('SattaKing.BndarRule')
      }
    ] as any,
    StopScrolling: false,
    betNum: 0, //选择下注号码数量
    isShowBetInfo: false,
    //result分页
    resultPageSize: 10,
    resultPageNum: 1,
    resultTotal: 0,
    resultList: [] as any,
    isResultShowMore: false,
    lotteryId: '',
    gameRule: '',
    serviceHeight: 300,
    rightSelectNumberHeight: 600,
    coinSymbol: '',
    topdivBtn: true,
    GameType: '',
    openCodeTimer: null as any,
    countdownTime: null as any,
    selectShow: false,
    defaultWalletInfo: {} as any,
    // input输入事件
    handleInputEnter(e: any) {
      let val = e.detail.value
      if (val[0] == '0') {
        val = ''
      }
      val = val
        .replace(/[^\d.]/g, '')
        .replace(/^(\-)*(\d+)\.(\d{0}).*$/, '$1$2')
        .replace(/^\.*$/g, '')
      conf.BettingNumber = val
    },

    //获取选择号码高度
    getSelectNumberHeight(type: any) {
      // conf.$nextTick(() => {
      // 	let selector = uni.createSelectorQuery().select('.tips');
      // 	selector.fields({
      // 		size: true
      // 	}, data => {
      // 		if (!type) {
      // 			conf.rightSelectNumberHeight = conf.serviceHeight - data.height
      // 		} else {
      // 			conf.rightSelectNumberHeight = conf.serviceHeight - data.height - uni.upx2px(
      // 				60)
      // 		}
      // 	}).exec();
      // })
    },
    changeShow() {
      if (conf.selectShow) {
        selectRefs.value.scrollTo({
          top: 0
        })
      }
      conf.selectShow = !conf.selectShow
    },
    //rule详细/收起btn
    handleRulediv() {
      conf.topdivBtn = !conf.topdivBtn
      conf.getSelectNumberHeight(null)
    },

    //获取result数据
    getLotteryResult() {
      System.loading()
      conf.isResultShowMore = false
      apis.lotteryOpenResult({
        current: conf.resultPageNum,
        size: conf.resultPageSize,
        lotteryId: conf.lotteryId,
        success: (res: any) => {
          conf.resultList = [...conf.resultList, ...res.data.records]
          conf.resultList?.forEach((item: any) => {
            item.newOpenTime = sutil.getTimeFormat(item.openTime, 1)
            item.openCode && (item.openCode = conf.ripr(item.openCode))
          })
          conf.resultTotal = res.data.total
          if (conf.resultPageSize * conf.resultPageNum >= conf.resultTotal) return (conf.isResultShowMore = true)
        },
        final: () => {
          System.loading(false)
        }
      })
    },

    //查看my order
    handleMyOrderdiv() {
      System.router.push('/user/myBet/index?lottery=Satta')
      // conf.typeShow = false
      // conf.resultShow = false
      // conf.showOrder = true
    },

    //打开游戏类型弹窗
    handleOpenGameTypeDialog() {
      conf.typeShow = !conf.typeShow
      conf.resultShow = false
      conf.showOrder = false
    },

    //打开result弹窗
    handleOpenResultDialog() {
      conf.typeShow = false
      conf.resultShow = !conf.resultShow
      conf.showOrder = false
    },

    // 获取玩法类型
    getLotteryList() {
      apis.lotteryList({
        success: (res: any) => {
          let datas = res.data
          let newIndex = datas.findIndex((item: any) => item.lotteryTypeVO.lotteryTypeCode == 'SATTA_KING')
          conf.gameTypeArr = datas[newIndex].lotteryVOList || []
          const params = System.getRouterParams()
          const index = params.id ? conf.gameTypeArr.findIndex((item: any) => item.id == params.id) : 0
          conf.gameType = conf.gameTypeArr[index].lotteryShowname || conf.gameTypeArr[0].lotteryShowname
          conf.gameTypeId = conf.gameTypeArr[index].id || conf.gameTypeArr[0].id
          conf.openLockCountdown = conf.gameTypeArr[index].openLockCountdown //锁定倒计时
          conf.lotteryId = conf.gameTypeArr[index].id
          if (conf.openCodeTimer) {
            clearTimeout(conf.openCodeTimer)
            conf.openCodeTimer = null
          }
          conf.getLotteryOpen('load')
          conf.getLotteryOdds(conf.gameTypeArr[index].lotteryTypeId)
        }
      })
    },

    //获取开奖信息
    getLotteryOpen(type: any) {
      conf.StopScrolling = false
      conf.pointNum = 0
      conf.hasResultTimer = setInterval(() => {
        conf.pointNum++
        if (conf.pointNum > 99) conf.pointNum = 0
        conf.pointNum = conf.ripr(conf.pointNum)
      }, 80)
      apis.lotteryOpen({
        lotteryId: conf.lotteryId,
        success: (res: any) => {
          let datas = res.data
          conf.currentOpenInfo = datas.currentOpen
          conf.lastOpenInfo = datas.lastOpen
          conf.nextOpenInfo = datas.nextOpen
          let countdownCurr = parseInt(conf.currentOpenInfo.openTime) - parseInt(datas.currentSystemTime)
          conf.countdownNum = countdownCurr
          // conf.countdownNum = 10000
          type && conf.handleCountdown(conf.countdownNum)

          if (!conf.lastOpenInfo.openCode) {
            if (conf.openCodeTimer) {
              clearTimeout(conf.openCodeTimer)
              conf.openCodeTimer = null
            }
            conf.openCodeTimer = setTimeout(() => {
              conf.getLotteryOpen(null)
            }, 1000)
          } else {
            conf.lastOpenInfo.openCode = conf.ripr(conf.lastOpenInfo.openCode)
            conf.StopScrolling = true
            if (conf.hasResultTimer) {
              clearInterval(conf.hasResultTimer)
              conf.hasResultTimer = null
            }
            conf.getWalletMoney(2)
            conf.resultPageNum = 1
            conf.resultList = []
            conf.getLotteryResult()
            orderRefs.value?.initOrder()
          }
        }
      })
    },

    //根据当前系统时间与开奖时间 => 下注倒计时
    handleCountdown(nowDate: any) {
      conf.betClose = false
      const hours = Math.floor((nowDate / 1000 / 60 / 60) % 24)
      const minutes = Math.floor((nowDate / 1000 / 60) % 60)
      const seconds = Math.floor((nowDate / 1000) % 60)
      if (seconds < 0) return
      conf.hour = conf.ripr(hours)
      conf.minutes = conf.ripr(minutes)
      conf.second = conf.ripr(seconds)
      conf.countdownNum = nowDate
      if (nowDate > 0) {
        conf.countdownTime = setTimeout(() => {
          nowDate -= 1000
          if (nowDate < 0) {
            clearInterval(conf.countdownTime)
            conf.countdownTime = null
            if (conf.openCodeTimer) {
              clearTimeout(conf.openCodeTimer)
              conf.openCodeTimer = null
            }
            conf.getLotteryOpen('load')
          } else {
            conf.handleCountdown(nowDate)
          }
        }, 1000)
      }

      //停止下注判断
      if (conf.countdownNum <= conf.openLockCountdown) {
        conf.betClose = true
      }
    },

    //数据小于10处理
    ripr(num: any) {
      num = parseFloat(num)
      return num < 10 ? `0${num}` : num
    },

    // 获取赔率
    getLotteryOdds(lotteryTypeId: string) {
      apis.lotteryOdds({
        lotteryTypeId,
        lotteryTypeCode: 'SATTA_KING',
        success: (res: any) => {
          conf.oddsArr = res.data || []
          conf.getPlayTypeOdds()
        }
      })
    },

    //获取当前玩法类型的赔率
    getPlayTypeOdds() {
      conf.playTypeArr[0].odds = conf.oddsArr.find((item: any) => item.oddsCode.includes('num'))?.odds
      conf.playTypeArr[1].odds = conf.oddsArr.find((item: any) => item.oddsCode.includes('first'))?.odds
      conf.playTypeArr[2].odds = conf.oddsArr.find((item: any) => item.oddsCode.includes('second'))?.odds
      conf.oddsArr?.forEach((item: any) => {
        item.number = item.oddsCode.split('_')[1]
        if (item.oddsCode.includes('num')) {
          conf.playTypeArr[0].numArr.push(item)
        }
        if (item.oddsCode.includes('first')) {
          conf.playTypeArr[1].numArr.push(item)
        }
        if (item.oddsCode.includes('second')) {
          conf.playTypeArr[2].numArr.push(item)
        }
      })
      conf.seleceNumArr = conf.playTypeArr[0].numArr
      conf.gameRule = conf.playTypeArr[0].rule
      conf.GameType = conf.playTypeArr[0].name
    },

    //输入下注金额
    handleEnterBetAmount(e: any) {
      let val = conf.BettingAmount + ''
      if (val.length > 1 && val[0] === '0' && val[1] !== '.') {
        val = val.substring(1)
      }
      val = val
        .replace(/[^\d.]/g, '')
        .replace(/^(\-)*(\d+)\.(\d{4}).*$/, '$1$2.$3')
        .replace(/^\.*$/g, '')
      // 移除非数字和点以及除第一个点外的所有点
      val = val
        .replace(/[^\d.]/g, '')
        .replace(/\.{2,}/g, '.')
        .replace('.', '$#$')
        .replace(/\./g, '')
        .replace('$#$', '.')
      const decimalIndex = val.indexOf('.')
      if (decimalIndex !== -1) {
        val = val.substring(0, decimalIndex) + '.' + val.substring(decimalIndex).replace('.', '')
      }
      conf.BettingAmount = val
      conf.BettingAmount && conf.handleBetMoney()
    },

    //计算下注总金额
    handleBetMoney() {
      let val = parseFloat(conf.BettingAmount)
      conf.betTotalAmount = sutil.Mul(sutil.Mul(conf.betNum, val), conf.BettingNumber)
    },

    //增加、减少下注注数
    handleBetNumber(type: any) {
      conf.BettingNumber = conf.BettingNumber
      switch (type) {
        case 'reduce':
          conf.BettingNumber > 1 && (conf.BettingNumber -= 1)
          break
        case 'add':
          conf.BettingNumber += 1
          break
      }
      conf.handleBetMoney()
    },

    //玩法类型change
    async handleGameChange(obj: any) {
      await System.router.replace(`/game/Satta/Satta?id=${obj.id}`)
      CEvent.emit(ERouter.reload)
    },

    //关闭my order
    closeOrder() {
      conf.showOrder = false
    },

    //选号玩法change
    changeType(obj: any) {
      conf.seleceNumArr = obj.numArr
      conf.gameRule = obj.rule
      conf.typeIndex = obj.value
      conf.GameType = obj.name
      conf.betArr = []
      conf.betStr = ''
      conf.betStrNum = ''
      if (conf.typeIndex != 1) {
        conf.seleceNumArr?.forEach((item: any) => {
          item.number = parseFloat(item.number)
        })
      }
    },

    //选号click
    changeOdds(obj: any) {
      if (!sconfig.userInfo) return System.router.push('/login')
      if (conf.betClose) return
      let currIndex = conf.betArr.findIndex((item: any) => item.oddsId == obj.oddsId)
      if (currIndex != -1) {
        conf.betArr.splice(currIndex, 1)
      } else {
        conf.betArr.push(obj)
      }
      conf.betArr.sort((a, b) => {
        return parseFloat(a.number) - parseFloat(b.number)
      })
      conf.getBetStr()
      conf.handleBetMoney()
    },

    //获取下注号码数组转字符串
    getBetStr() {
      conf.betNum = conf.betArr.length
      conf.betStr = conf.betArr.map((obj) => {
        return obj.number
      })
      conf.betStrNum = conf.betStr.join(',')
    },

    // 获取钱包金额
    async getWalletMoney(type: any) {
      if (!sconfig.userInfo) return (conf.walletMoney = '-')
      let item = await svalue.getDefaultWallet()
      if (item.hasOwnProperty('coinSymbol')) {
        conf.defaultWalletInfo = item
        let m = parseFloat(conf.defaultWalletInfo.walletMoney)
        conf.walletMoney = (conf.defaultWalletInfo.coinSymbol || '₹') + sutil.dataHandling(m)
      }
    },

    //下注数据提交
    handleBetDataSubmit() {
      if (conf.betClose) {
        System.toast(i18n.t('SattaKing.stoppedBetTip'))
      } else {
        if (!conf.defaultWalletInfo.hasOwnProperty('coinCode')) {
          System.toast(i18n.t('game.setWalletTip'))
          return
        }
        if (conf.betArr.length == 0) {
          System.toast(i18n.t('SattaKing.betEmptyTip'))
          return
        }
        if (!conf.BettingAmount) {
          System.toast(i18n.t('SattaKing.betAmountEmptyTip')) //投注金额不能为空!
          return
        }
        if (!String(conf.BettingNumber) || conf.BettingNumber < 1) {
          System.toast(i18n.t('game.betTip'))
          return
        }
        if (parseFloat(conf.BettingAmount) > parseFloat(conf.defaultWalletInfo.walletMoney)) {
          System.toast(i18n.t('SattaKing.insufficient'))
          return
        }
        let minBetMoney = conf.defaultWalletInfo.betMinAmount
        let maxBetMoney = conf.defaultWalletInfo.betMaxAmount
        let coinSymbol = conf.defaultWalletInfo.coinSymbol

        if (parseFloat(conf.BettingAmount) < parseFloat(minBetMoney)) {
          System.toast(i18n.t('game.minBetTip') + ' ' + coinSymbol + minBetMoney || '')
          return
        }

        if (parseFloat(conf.BettingAmount) > parseFloat(maxBetMoney)) {
          System.toast(i18n.t('game.maxBetTip') + ' ' + coinSymbol + maxBetMoney || '')
          return
        }
        System.loading()
        apis.lotteryUserBets({
          money: conf.BettingAmount,
          betCodes:
            conf.betArr
              .map((obj) => {
                return obj.oddsCode
              })
              .join(',') || '',
          betExpect: conf.currentOpenInfo.openExpect,
          betOpenId: conf.currentOpenInfo.lotteryOpenId,
          lotteryId: conf.currentOpenInfo.lotteryId,
          // lotteryOddsId: conf.betArr.map(obj=>{return obj.oddsId}).join(",") || '',
          multiple: 1,
          nums: conf.BettingNumber,
          supplement: 0,
          walletCoinCode: conf.defaultWalletInfo.walletCoin,
          success: (res: any) => {
            conf.isShowBetInfo = true
            conf.getWalletMoney(2)
            setTimeout(() => {
              conf.isShowBetInfo = false
              conf.betArr = []
              conf.betStr = ''
              conf.betStrNum = ''
              conf.BettingAmount = ''
              conf.BettingNumber = 1
              conf.betNum = 0
              conf.handleBetMoney()
            }, 2000)
          },
          final: () => {
            System.loading(false)
          }
        })
      }
    },

    //关闭下注信息弹窗
    handleCloseBetInfoDialog() {
      conf.isShowBetInfo = false
    },

    //result查看更多
    handleResultMoreMessage() {
      if (conf.resultPageSize * conf.resultPageNum >= conf.resultTotal) return (conf.isResultShowMore = true)
      conf.resultPageNum++
      conf.getLotteryResult()
    },

    async handleClickShare() {
      let obj = {
        coinSymbol: conf.defaultWalletInfo.coinSymbol,
        betMoney: parseFloat(conf.BettingAmount).toFixed(4),
        money: parseFloat(conf.BettingAmount).toFixed(4),
        orderType: '',
        id: StrUtil.getId(),
        lotteryName: 'Satta',
        lotteryTypeCode: 'Satta',
        betCodes:
          conf.betArr
            .map((obj) => {
              return obj.oddsCode
            })
            .join(',') || '',
        betLotteryId: conf.currentOpenInfo.lotteryId,
        betOpenId: conf.currentOpenInfo.lotteryOpenId,
        betExpect: conf.currentOpenInfo.openExpect,
        playName: conf.gameType,
        newPlayName: conf.gameType,
        newBetCodesArr: [] as any[],
        newBetCodes: '',
        betContent: '',
        betTitle: ''
      }
      obj.newBetCodesArr = obj.betCodes.split(',')
      obj.newBetCodes =
        obj.newBetCodesArr
          .map((obj) => {
            return obj.split('_')[1]
          })
          .join(',') || ''
      obj.betContent = obj.newBetCodes
      obj.betTitle = obj.betExpect
      console.log('obj', obj)
      Cookie.set('betRecord', JSON.stringify(obj))

      await sconfig.toChat('/chat/betRecordForward')
    },

    canShare: computed<any>(() => {
      return !conf.betClose && conf.betArr.length && conf.BettingNumber && conf.BettingAmount
    })
  })
  onMounted(() => {
    // 获取钱包
    conf.getWalletMoney(1)

    conf.getLotteryList()
  })
  onUnmounted(() => {
    if (conf.hasResultTimer) {
      clearInterval(conf.hasResultTimer)
      conf.hasResultTimer = null
    }
    if (conf.openCodeTimer) {
      clearTimeout(conf.openCodeTimer)
      conf.openCodeTimer = null
    }
    if (conf.countdownTime) {
      clearTimeout(conf.countdownTime)
      conf.countdownTime = null
    }
  })

  return conf
}
