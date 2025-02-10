import { apis } from "@/api"
import i18n from "@/lang"
import sconfig from "@/sstore/sconfig"
import slottery from "@/sstore/slottery"
import sutil from "@/sstore/sutil"
import { svalue } from "@/sstore/svalue"
import System from "@/utils/System"
import { Scope } from "tools-vue3"
import { onBeforeMount, onMounted, reactive, ref } from "vue"

export const index = () => {
  const cgamebox = ref<any>()
  const cgameRef = ref<any>()
  const resultRefs = ref<any>()
  const conf = reactive({
    gameType: 'ANIMALS_RUNNING',
    loading: false,
    lotteryTypeId: 0,
    lotteryBox: { countDown: [0, 0, 0] } as any,
    openLockCountdown: 0,
    openMore() {
      resultRefs.value.openPopup(conf.bet.tabs.active)
    },
    game: {
      isRun: false,
      showDown: true,
      fistRun: true,
      fistStop: false,
      action: (type: any, res: any) => {
        let open = conf.play.item.lotteryInterval / 1000 - 12
        let time = res[3] - open

        if (type == 'time' && res[3] === 0) conf.game.start()
        else if (type == 'stop') conf.game.stop(res)
        else if (time > 0 && conf.game.fistRun) conf.game.fistStart()
        else if (time < 0 && conf.game.fistStop) {
          const openCode = conf.lotteryBox.last.openCode.split(',')
          if (conf.lotteryBox.last.openCode) {
            conf.game.fistStop = false
            conf.game.stop(openCode)
          }
        }
      },
      reset: () => {
        conf.game.isRun = false
        cgameRef.value?.reset()
      },
      fistStart: () => {
        conf.game.fistStop = true
        conf.game.start()
      },
      start: () => {
        if (conf.game.isRun) return
        conf.game.fistRun = false
        conf.game.showDown = false
        conf.game.isRun = true
        cgameRef.value?.init()
      },
      stop: (res: any) => {
        if (conf.game.isRun) {
          conf.game.isRun = false
          let openCodeArr = res
          conf.result.typeResult[conf.play.lotteryId] = { ...conf.lotteryBox.last, openCodeArr }
          let item = conf.play.list.find((v: any) => v.id === conf.play.lotteryId) as any

          // console.log(conf.lotteryBox.countDown);
          let open = item.lotteryInterval / 1000 - 11
          let time = conf.lotteryBox.countDown[3] - open
          // 控制在35秒左右可下注
          if (time > 0) {
            setTimeout(() => {
              cgameRef.value?.stop(res)
            }, time * 1000)
            return
          }
          cgameRef.value?.stop(res)
        } else {
          console.log('555555');
          
          cgameRef.value?.setList(res)
        }
      }
    },
    play: {
      lotteryId: '',
      typeShow: false,
      item: {} as any,
      closePopup() {
        conf.play.typeShow = false
      },
      //切换玩法 1min、5min。。。
      reloadTo: async (key: any) => {
        conf.play.lotteryId = key
        conf.play.closePopup()
        await conf.init()
      },
      //初始化玩法
      choose: (key: any) => {
        conf.play.item = conf.play.list.find((v: any) => v.id == key)
        let interval = conf.play.item.lotteryInterval / 1000 / 60
        conf.play.item.title = interval + '' + (interval > 1 ? i18n.t('game.minutes') : i18n.t('game.minute'))
        return conf.play.item
      },

      list: [] as any[]
    },
    bet: {
      tabs: {
        active: 'st',
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
      //下注原始数据
      listNumArr: [],

      //获取赔率
      getOdds: async () => {
        const { data } = await apis.lotteryOdds({
          lotteryTypeId: conf.lotteryTypeId,
          lotteryTypeCode: 'ANIMALS_RUNNING'
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
            item[v.key + 'Code'] = odds[v.key][item.key].oddsCode
            item[v.key + 'Name'] = odds[v.key][item.key].oddsName
          }
          conf.bet.listNumArr.forEach(fun)
        })
      },
      // 请求下注接口
      requestBet(e: any) {
        // 选择类型
        if (e.type) {
          conf.bet.tabs.active = e.type.slice(1)
          return
        }
        System.loading()
        e.list.forEach((item: any, index: number) => {
          apis.lotteryUserBets({
            money: item.betMoney, //单注金额
            betCodes: item[e.selectType + 'Code'], //投注内容
            betExpect: conf.lotteryBox.current.openExpect, //投注期号
            betOpenId: conf.lotteryBox.current.lotteryOpenId, //开奖记录编号
            lotteryId: conf.lotteryBox.current.lotteryId, //投注彩票ID
            multiple: 1, //投注倍数
            nums: 1, //投注数量
            supplement: 0, //是否追加订单，0否，1是
            walletCoinCode: conf.defaultWalletInfo.walletCoin, //下注钱包币种
            success: (res: any) => {
              if (index == e.list.length - 1) {
                conf.getWalletMoney(2)
                System.toast(i18n.t('game.betSuccess'), 'success')
              }
            },
            final: () => {
              if (index == e.list.length - 1) System.loading(false)
            }
          })
        })
      },
      async shareBet(e: any) {
        const obj = conf.lotteryBox.bet.getInfo()

        const betCodes = e.list.map((item: any) => item[e.type + 'Code']).join(',') || ''
        const newBetCodesArr = e.list.map((item: any) => item.name)
        const num = parseFloat(conf.defaultWalletInfo.betMinAmount)

        let sobj = {
          coinSymbol: conf.defaultWalletInfo.coinSymbol,
          betMoney: num.toFixed(4),
          money: num.toFixed(4),
          orderType: '',
          id: StrUtil.getId(),
          lotteryName: conf.gameType.toUpperCase(),
          lotteryTypeCode: conf.gameType.toUpperCase(),
          betLotteryId: conf.play.lotteryId,
          betOpenId: obj.betOpenId,
          betExpect: obj.betExpect,
          betCodes,
          playName: conf.play.item.lotteryShowname,
          newPlayName: '',
          newBetCodesArr,
          newBetCodes: '',
          betContent: '',
          betTitle: obj.betExpect
        }

        sobj.newBetCodes = sobj.newBetCodesArr.join(',') || ''
        sobj.betContent = sobj.newBetCodes
        sobj.newPlayName = sobj.playName

        sobj.newPlayName = sobj.newPlayName + ' - ' + e.type
        console.log(sobj)
        Cookie.set('betRecord', JSON.stringify(sobj))
        await sconfig.toChat('/chat/betRecordForward')
      }
    } as any,
    downNum: 10,
    //重置所有内容
    reset() {
      conf.game.reset()
    },
    //历史结果列表
    result: {
      list: [],
      typeResult: {} as any,
      totalList: [] as any,
      getList: async () => {
        const { data: openData } = await apis.lotteryOpenResult({
          current: 1,
          size: 100,
          lotteryId: conf.play.lotteryId
        })
        // 统计前一百条的冠、亚、季军
        conf.result.rest()
        openData.records.forEach((item: any, index: number) => {
          if (item.openCode) {
            let array = item.openCode.split(',')
            let list = ['A', 'B', 'C', 'D', 'E', 'F']
            const stIndex = list.indexOf(array[0])
            const ndIndex = list.indexOf(array[1])
            const rdIndex = list.indexOf(array[2])

            conf.result.totalList[stIndex].st = conf.result.totalList[stIndex].st + 1
            conf.result.totalList[ndIndex].nd = conf.result.totalList[ndIndex].nd + 1
            conf.result.totalList[rdIndex].rd = conf.result.totalList[rdIndex].rd + 1
          }
        })
        let list = openData.records.slice(0, 10) || []
        conf.result.list = list.map((item: any) => {
          let openCodeArr = [] as any[]
          let list = ['A', 'B', 'C', 'D', 'E', 'F']
          if (item.openCode) {
            let arr = item.openCode.split(',')
            let one = list.indexOf(arr[0])
            let two = list.indexOf(arr[1])
            let three = list.indexOf(arr[2])
            let four = list.indexOf(arr[3])
            let five = list.indexOf(arr[4])
            let six = list.indexOf(arr[5])
            openCodeArr[one] = 1
            openCodeArr[two] = 2
            openCodeArr[three] = 3
            openCodeArr[four] = 4
            openCodeArr[five] = 5
            openCodeArr[six] = 6
          }
          return {
            ...item,
            openCodeArr
          }
        })
      },
      getTypeList: async (lotteryId: any) => {
        const { data: openData } = await apis.lotteryOpenResult({
          current: 1,
          size: 5,
          lotteryId
        })
        let n = true
        openData.records.forEach((item: any) => {
          if (item.openCode && n) {
            n = false
            let openCodeArr = item.openCode.split(',')
            conf.result.typeResult[lotteryId] = { ...item, openCodeArr }
            return
          }
        })
      },
      rest() {
        conf.result.totalList = [
          { img: 'A', name: 'zxb', st: 0, nd: 0, rd: 0 },
          { img: 'B', name: 'hm', st: 0, nd: 0, rd: 0 },
          { img: 'C', name: 'pp', st: 0, nd: 0, rd: 0 },
          { img: 'D', name: 'xz', st: 0, nd: 0, rd: 0 },
          { img: 'E', name: 'zxb', st: 0, nd: 0, rd: 0 },
          { img: 'F', name: 'hx', st: 0, nd: 0, rd: 0 }
        ]
      }
    },
    //获取当前钱包余额
    defaultWalletInfo: {} as any,
    walletMoney: '--',
    async getWalletMoney(type: any) {
      if (!sconfig.userInfo) return (conf.walletMoney = '-')
      let item = await svalue.getDefaultWallet()
      if (item.hasOwnProperty('coinSymbol')) {
        conf.defaultWalletInfo = item
        let m = parseFloat(conf.defaultWalletInfo.walletMoney)
        conf.walletMoney = sutil.dataHandling(m)
      }
    },
    //初始页面业务
    async init() {
      conf.reset()
      //获取游戏列表
      conf.play.list = await slottery.findLotteryList('ANIMALS_RUNNING')

      conf.play.list.forEach((item: any) => {
        conf.result.getTypeList(item.id)
      })
      let item = conf.play.list.find((v: any) => v.id === conf.play.lotteryId) as any
      conf.openLockCountdown = item.openLockCountdown / 1000 //锁定倒计时
      //选中当前游戏
      conf.play.choose(conf.play.lotteryId)
      //获取赔率信息
      await conf.bet.getOdds()
      //获取开奖信息任务
      conf.lotteryBox.getInfoLoop(0)
      conf.getWalletMoney(2)
      //获取l历史记录
      conf.result.getList()
    },
    goPage(url: any) {
      System.router.push('/game/Animals/' + url + '?lotteryId=' + conf.play.lotteryId)
    },
    //查看my order
    changeMyOrder() {
      System.router.push('/user/myBet/index?lottery=AnimalsRunning')
    }
  })
  onMounted(async () => {
    conf.play.list = await slottery.findLotteryList('ANIMALS_RUNNING')
    conf.play.lotteryId = conf.play.list[0].id
    conf.lotteryTypeId = conf.play.list[0].lotteryTypeId

    conf.init()
  })
  onBeforeMount(async () => {
    const timer = Scope.Timer()
    conf.lotteryBox = slottery.lotteryBox({
      timer: timer,
      success: (onetime: any, status: any, results: any) => {
        //处理游戏和刷新结果
        if (onetime && status) {
          conf.game.action(
            'stop',
            results.map((v: any) => v.num)
          )
          conf.result.getList()
        }
      },
      updateCountDown: (time: any) => {
        //处理游戏
        conf.game.action('time', time)
      },
      resultSize: 3,
      lotteryId: () => conf.play.lotteryId,
      showBox: () => {}
    })

    conf.bet.listNumArr = [
      {
        sort: 1,
        key: 'A',
        img: 'exb',
        name: 'Exiaobao',
        selectBet: false,
        betMoney: 0
      },
      {
        sort: 2,
        key: 'B',
        img: 'hm',
        name: 'Freshippo',
        selectBet: false,
        betMoney: 0
      },
      {
        sort: 3,
        key: 'C',
        img: 'pp',
        name: 'Piaopiao',
        selectBet: false,
        betMoney: 0
      },
      {
        sort: 4,
        key: 'D',
        img: 'xz',
        name: 'Xiazai',
        selectBet: false,
        betMoney: 0
      },
      {
        sort: 5,
        key: 'E',
        img: 'zxb',
        name: 'Zhixiaobao',
        selectBet: false,
        betMoney: 0
      },
      {
        sort: 6,
        key: 'F',
        img: 'hx',
        name: 'Huanxing',
        selectBet: false,
        betMoney: 0
      }
    ]
  })
  return { conf, cgamebox, cgameRef, resultRefs }
}
