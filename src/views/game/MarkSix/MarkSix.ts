import i18n from '@/lang'
import slottery from '@/sstore/slottery'
import { Scope } from 'tools-vue3'
import { onMounted, reactive,nextTick,ref,watch } from 'vue'
import { getOdds } from './MarkSixDataOdds'
import { apis } from '@/api';
import System from '@/utils/System';


export const index = () => {
  const resultRefs = ref<any>()
  const orderRefs = ref<any>()
  const timer = Scope.Timer()
  const lottery = slottery.lotteryBox({
    timer: timer,
    success: (onetime: any, status: any, results: any) => {
      //设置开奖信息
      results.forEach((item: any, index: number) => {
        conf.ballListRef[index].conf.setVal(item)
      })
      if (conf.operation.active == 'result') resultRefs.value?.initResult()
      if (conf.operation.active === 'myOrder') orderRefs.value?.initOrder()
    },
    updateCountDown: (time: any) => {
      if (time[3] <= 0) {
        conf.runAni()
      }

      let newTime = Math.floor(lottery.closeDate / 1000)

      //判断停止下注
      if( newTime <= lottery.play.item.openLockCountdown){
        conf.stopBet = true
        conf.layout.ref.close()
      }else{
        conf.stopBet = false
        conf.timePopupShop = false
      }

      // 打开倒计时
      if(newTime <= 3){
        conf.timePopupShop = true
      }else{
        conf.timePopupShop = false
      }
    },
    resultSize: 7,
    showBox: () => {}
  })

  const conf = reactive({
    gameType: 'MARK_SIX',
    reset:(val:any)=>{
      if(!val.money) return
      conf.winBetInfo = val
      const obj = conf.betting.tabs.level2
      const data =  JSON.parse(JSON.stringify(obj.item.list))
      data?.forEach((item:any) => {
        item.isActive = false
      })
      obj.item.list = []
      nextTick(()=>{
        obj.item.list = data
        conf.betting.totalAmount = 0
        conf.betting.betArr = []
        conf.isWinBet = true
        setTimeout(() => {
          conf.isWinBet = false
      }, 3000)
      })
    },
    stopBet:false,
    timePopupShop: false,
    isWinBet: false,
    winBetInfo: {} as any,
    layout: {
      ref: null as any,
      setRef: (el: any) => {
        if (el) conf.layout.ref = el
        else conf.layout.ref = null as any
      }
    },
    ballListRef: {} as { [key: number]: { conf: any } },
    setBallRef: (el: any) => {
      if (el) conf.ballListRef[el.conf.index] = el
      else conf.ballListRef = null as any
    },
    /**
     * 开始开奖动画
     */
    runAni: () => {
      Object.keys(conf.ballListRef).forEach((key: any) => {
        conf.ballListRef[key].conf.runAni()
      })
    },
    /**
     * 功能控制菜单
     */
    operation: {
      active: 'betting',
      list: [
        {
          label: i18n.t('game.betting'),
          value: 'betting'
        },
        // {
        //   label: i18n.t('game.analyze'),
        //   value: 'analyze'
        // },
        {
          label: i18n.t('game.result'),
          value: 'result'
        },
        {
          label: i18n.t('game.myOrder'),
          value: 'myOrder'
        },
        {
          label: i18n.t('game.rule'),
          value: 'rule'
        }
      ],
      change: (item: any) => {
        conf.operation.active = item.value
      }
    },
    /**
     * 下注信息
     */
    betting: {
      tabs: {
        tree: getOdds(),
        level1: {
          list: [] as any[],
          item: {} as any,
          change(item: any,val:any = false) {
            const { tabs } = conf.betting
            tabs.level1.item = item
            tabs.level2.list = item.list
            conf.betting.totalAmount = 0
            conf.betting.betArr = []
            tabs.showLeve2 = !tabs.showLeve2
            let obj = item.list.find((into:any) => into.name == tabs.level2.item.name) || item.list[0]
            tabs.level2.change(obj,true)
            tabs.isOnload = val
          }
        },
        showLeve2:false,
        isOnload:false,
        level2: {
          list: [] as any[],
          item: {} as any,
          change(item: any,val: any = false) {
            const { tabs } = conf.betting
            tabs.level2.list?.forEach((into:any) => {
              into.isActive = item.name == into.name ? true : false
            })
            if(val){
              tabs.level2.item = item
              tabs.level2.item.list = tabs.level2.item.list.map((into:any) => {
                return {
                  isActive: false,
                  ...into
                }
              })
              conf.betting.totalAmount = 0
              conf.betting.betArr = []
            }
          },
          confirm(){
            conf.betting.tabs.showLeve2 = false
            let obj = conf.betting.tabs.level2.list.find((item:any) => item.isActive)
            conf.betting.tabs.level2.change(obj,true)
          }

        },
        init: () => {
          const { tabs } = conf.betting
          tabs.level1.list = tabs.tree
          tabs.level1.change(tabs.tree[0],true)
        },
      },
      popup: {
        open: () => {
          if(conf.stopBet){
            return
          }
          if(conf.betting.totalAmount == 0){
            System.toast(i18n.t('SattaKing.betEmptyTip'))
            return
          }
          const list  = conf.betting.betArr.map((num:any) => num.oddsCode)
          lottery.bet.content = list
          lottery.bet.num = conf.betting.totalAmount
          conf.layout.ref.open()
        },
        close: () => {
          conf.layout.ref.close()
        }
      },
      totalAmount:0,
      betArr:[] as any,
      getChoseData(data:any){
        conf.betting.betArr = data
        let obj = conf.betting.tabs.level2.item
        conf.betting.totalAmount = 0
        if(obj.hasOwnProperty('amount')){
          conf.betting.totalAmount = conf.betting.combination(data.length,Number(obj.amount))
        }else if(obj.hasOwnProperty('min')){
          if(data.length >= obj.min){
            conf.betting.totalAmount = 1
          }else{
            conf.betting.totalAmount = 0
          }
        }else{
          conf.betting.totalAmount = data.length
        }
      },
      factorial(n:number):number {
        if (n <= 1) {
          return 1;
        }
        return n * conf.betting.factorial(n - 1);
      },
       
      combination(n:number, k:number):number {
        if (k > n) {
          return 0;
        }
        return conf.betting.factorial(n) / (conf.betting.factorial(k) * conf.betting.factorial(n - k));
      },
    },

    /**
     * 赔率表数据
     */
    oddsData: [] as any[],
    getLotteryOdds() {
      let lotteryTypeId = lottery.play.item.lotteryTypeId
      apis.lotteryOdds({
          lotteryTypeId,
          lotteryTypeCode: "MarkSix",
          success: (res: any) => {
              conf.oddsData = res.data
          }
      });
    },


  })
  onMounted(async () => {
    conf.runAni()

    // 初始化下注区域选中
    conf.betting.tabs.init()
  })

  watch(
    () => conf.betting.tabs.level1.item,
    (val: any) => {
      if(conf.betting.tabs.isOnload){
        conf.betting.tabs.showLeve2 = false
      }else{
        conf.betting.tabs.showLeve2 = true
      }
    }
  )

  Scope.setConf({
    conf,
    lottery
  })

  return { conf, lottery, resultRefs, orderRefs }
}

export type MarkSixConfInter = ReturnType<typeof index>
