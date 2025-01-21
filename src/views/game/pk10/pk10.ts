import { Scope } from 'tools-vue3'
import { sutil } from '@/sstore/sutil'
import { slottery } from '@/sstore/slottery'
import { svalue } from '@/sstore/svalue'
import { onBeforeMount, onMounted, reactive } from 'vue'
import i18n from '@/lang'
import { apis } from '@/api'

export const index = ({ cgamebox, cgameRef, gameBoxRefs }: any) => {
  const conf = reactive({
    isClickPage: false,
    loading: false,
    lotteryTypeId: 0,
    openLockCountdown: 0,
    gameType: 'pk10',
    page: {
      pageSize: 10,
      pageNum: 1,
      total: 9,
      reset: () => {
        conf.page.total = 0
        conf.page.pageNum = 1
      },
      change: (val: any) => {
        conf.his.getList()
        conf.handleClickOrderPage(true)
      }
    },
    selectBetInfoArr: [], //下注号码
    bet: {
      tabs: {
        active: '1st',
        options: [
          {
            key: '1st',
            label: '1st'
          },
          {
            key: '2nd',
            label: '2nd'
          },
          {
            key: '3rd',
            label: '3rd'
          }
        ],
        choose: (item: any) => {
          conf.bet.tabs.active = item.key
          conf.bet.closeFun('0')
        }
      },
      //打开下注弹框
      open: () => {
        CEvent.emit('openbet')
      },
      //关闭下注弹框
      close: () => {
        CEvent.emit('closebet')
      },
      autoClose: (time: any) => {
        time <= conf.openLockCountdown && conf.bet.close()
      },
      //清理选中数据
      closeFun: (type: any) => {
        conf.bet.listNum = []
        conf.bet.listBS = []
        if (type == 'betSuccess' && conf.his.tabs.active == 3) {
          conf.his.getList()
        }
      },
      //下注数字原始数据
      listNumArr: [],
      //选中数据
      listNum: [],
      //下注大小单双原始数据
      listBSArr: [],
      //选中数据
      listBS: [],
      //选择下注数据
      choose: (item: any, name: any) => {
        if (conf.bet[name].includes(item)) {
          sutil.remove(conf.bet[name], (v: any) => v.key == item.key)
        } else {
          conf.bet[name].push(item)
        }
        conf.bet[name].sort((a: any, b: any) => a.sort - b.sort)

        conf.bet.open()
        // let label = conf.bet.tabs.active+'_'+ conf.bet[name][0].label
        conf.bet[name][0].active = conf.bet.tabs.active
        conf.selectBetInfoArr = conf.bet[name]
      },

      //获取赔率
      getOdds: async () => {
        const { data } = await apis.lotteryOdds({
          lotteryTypeId: conf.lotteryTypeId,
          lotteryTypeCode: 'PK10'
        })
        let odds = {} as any
        data.forEach((item: any) => {
          const [key, oddskey] = item.oddsCode.split('_')
          if (!odds[key]) odds[key] = {}
          odds[key][oddskey] = item
        })
        conf.bet.tabs.options.forEach((v: any) => {
          const fun = (item: any) => {
            item[v.key + 'odds'] = Number(odds[v.key][item.key].odds)
          }
          conf.bet.listBSArr.forEach(fun)
          conf.bet.listNumArr.forEach(fun)
        })
      }
    } as any,
    game: {
      box: {
        width: 0,
        height: 0,
        init: () => {
          conf.game.box.width = cgamebox.value.offsetWidth
          conf.game.box.height = conf.game.box.width / 1.769
        }
      },
      isRun: false,
      action: (type: any, res: any) => {
        if (type == 'time' && res[3] === 3) conf.game.start()
        else if (type == 'stop') conf.game.stop(res)
      },
      reset: () => {
        conf.game.isRun = false
        cgameRef.value?.reset()
      },
      start: () => {
        if (conf.game.isRun) return
        conf.game.isRun = true
        cgameRef.value?.start()
      },
      stop: (res: any) => {
        if (conf.game.isRun) {
          conf.game.isRun = false
          cgameRef.value?.stop(res)
        } else {
          cgameRef.value?.setList(res)
        }
      }
    },
    play: {
      active: '',
      lotteryId: '',
      item: {} as any,
      //切换玩法 1min、5min。。。
      reloadTo: async (key: any) => {
        conf.loading = true
        conf.play.lotteryId = key
        await conf.init()
        conf.loading = false
      },
      //初始化玩法
      choose: (key: any) => {
        conf.play.active = key
        conf.bet.tabs.active = '1st'
        conf.play.item = conf.play.list.find((v: any) => v.id == key)
        conf.play.item.title = conf.play.item.lotteryInterval / 1000 / 60 + ' Min' || '=='
        conf.bet.close()
        return conf.play.item
      },

      list: [] as any[]
    },
    his: {
      tabs: {
        active: 1,
        options: [
          {
            value: 1,
            label: i18n.t('game.resultHistory')
          },
          {
            value: 3,
            label: i18n.t('game.myOrder')
          },
          {
            value: 4,
            label: i18n.t('game.rule')
          }
        ],
        choose: (item: any) => {
          conf.his.tabs.active = item.value
          conf.page.reset()
          conf.his.getList()
        }
      },
      //重置
      reset: () => {
        conf.his.tabs.choose(conf.his.tabs.options[0])
      },
      //获取当前选中的列表信息
      getList: async () => {
        gameBoxRefs.value?.getWalletMoney(2)
        const v = {
          1: async () => {
            await conf.his.result.getList()
          },
          3: async () => {
            await conf.his.order.getList()
          }
        } as any
        await v[conf.his.tabs.active]?.()
      },
      //历史结果列表
      result: {
        list: [],
        getList: async () => {
          const { data: openData } = await apis.lotteryOpenResult({
            current: conf.page.pageNum,
            size: conf.page.pageSize,
            lotteryId: conf.play.lotteryId
          })
          openData.records.forEach((item: any) => {
            item.openNumberStr = item.openCode.slice(item.openCode.length - 5, item.openCode.length)
            let index = item.openNumberStr[0]
            item.openNumber = parseFloat(item.openNumberStr.slice(index, index + 1))
          })
          conf.his.result.list = openData.records || []
          conf.page.total = openData.total
        }
      },
      order: {
        list: [],
        //获取roder列表
        getList: async () => {
          let defaultWalletInfo = await svalue.getDefaultWallet()
          const { data } = await apis.lotteryUserOrder({
            current: conf.page.pageNum,
            size: conf.page.pageSize,
            lotteryId: conf.play.lotteryId
          })

          let coinlistArr = await svalue.getCoinlist() //货币数据
          data.records.forEach((item: any) => {
            item.typeName = 'PK10'
            item.openNumber = item.betOpenCode
            let color = conf.bet.listNumArr.find((into: any) => into.label == item.openNumber)?.color || ''
            item.color = color
            //下注number
            item.betNumber = item.betCodes.split('_')[1]
            //下注number对应颜色
            let betColor = conf.bet.listNumArr.find((into: any) => into.label == item.betNumber)?.color || ''
            item.betColor = betColor

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
          conf.his.order.list = data.records || []
          conf.page.total = data.total
        }
      }
    },
    lotteryBox: { countDown: [0, 0, 0] } as any,
    //重置所有内容
    reset() {
      // conf.timer.clear()

      // conf.lotteryBox.reset()

      conf.game.reset()
      conf.page.reset()
      conf.his.reset()
    },

    //初始页面业务
    async init() {
      conf.loading = true
      conf.reset()
      //初始化游戏宽高
      conf.game.box.init()
      //获取游戏列表
      conf.play.list = await slottery.findLotteryList('PK10')
      let item = conf.play.list.find((v: any) => v.id === conf.play.lotteryId) as any
      conf.openLockCountdown = item.openLockCountdown / 1000 //锁定倒计时
      //选中当前游戏
      conf.play.choose(conf.play.lotteryId)
      //获取赔率信息
      await conf.bet.getOdds()
      //获取开奖信息任务
      conf.lotteryBox.getInfoLoop(0)
      //获取底部信息
      conf.his.getList()
      conf.loading = false
    },
    //点击order => 分页
    handleClickOrderPage(val: any) {
      conf.isClickPage = val
    }
  })
  onMounted(async () => {
    conf.play.list = await slottery.findLotteryList('PK10')
    conf.play.lotteryId = conf.play.list[0].id
    conf.lotteryTypeId = conf.play.list[0].lotteryTypeId
    conf.init()
  })
  onBeforeMount(async () => {
    const timer = Scope.Timer()
    conf.lotteryBox = slottery.lotteryBox({
      timer: timer,
      success: (onetime: any, status: any, results: any) => {
        //处理pk10小游戏和刷新底部信息
        if (onetime && status) {
          conf.game.action(
            'stop',
            results.map((v: any) => v.num)
          )
          conf.page.reset()
          conf.his.getList()
        }
      },
      updateCountDown: (time: any) => {
        //处理pk10小游戏
        conf.game.action('time', time)
        conf.bet.autoClose(time[3])
      },
      resultSize: 3,
      lotteryId: () => conf.play.lotteryId,
      showBox: () => {}
    })

    conf.bet.listNumArr = []
    for (let i = 1; i < 11; i++) {
      conf.bet.listNumArr.push({
        sort: i,
        key: i,
        label: i,
        odds: 0
      })
    }

    conf.bet.listBSArr = [
      {
        sort: 1,
        key: 'big',
        label: 'Big',
        color: 'yellow',
        odds: 0
      },
      {
        sort: 2,
        key: 'small',
        label: 'Small',
        color: 'blue',
        odds: 0
      },
      {
        sort: 3,
        key: 'odd',
        label: 'Odd',
        color: 'red',
        odds: 0
      },
      {
        sort: 4,
        key: 'even',
        label: 'Even',
        color: 'green',
        odds: 0
      }
    ]
  })
  Scope.setConf(conf)
  return conf
}
