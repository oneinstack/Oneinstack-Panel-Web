import { apis } from '@/api/index'
import { ERouter } from '@/enum/Enum'
import i18n from '@/lang'
import System from '@/utils/System'
import { reactive } from 'vue'
import { sutil } from './sutil'
const { lotteryList, lotteryOpen } = apis

export const slottery = reactive({
  lotteryList: [],
  /**
   * 获取所有彩种列表
   * @param name
   * @returns
   */
  async getLotteryList(load: boolean = true) {
    if (slottery.lotteryList.length) return slottery.lotteryList
    if (load) System.loading()
    const res = await lotteryList({
      final: () => {
        if (load) System.loading(false)
      }
    })
    res.data.forEach((item: any) => {
      item.lotteryVOList.forEach((v: any) => (v.parent = item))
    })
    slottery.lotteryList = res.data
    return slottery.lotteryList
  },
  /**
   * 获取指定彩种列表
   * @param name
   * @returns
   */
  async findLotteryList(name: string) {
    const lotteryList = await slottery.getLotteryList()
    let _item: any = lotteryList.find((item: any) => item.lotteryTypeVO.lotteryTypeCode == name)
    return _item?.lotteryVOList || []
  },
  /**
   * 通过彩种id获取指定彩种对象
   * @param name
   * @returns
   */
  async findLotteryItem({ id }: any) {
    const lotteryList = await slottery.getLotteryList()
    for (let i = 0; i < lotteryList.length; i++) {
      const item: any = lotteryList[i]
      const findItem = item.lotteryVOList.find((v: any) => v.id === id)
      if (findItem) return findItem
    }
    return null
  },

  /**
   * 获取彩票处理对象
   * @param param
   * @returns
   */
  lotteryBox({
    timer,
    success,
    updateCountDown,
    resultSize,
    lotteryId,
    showBox
  }: {
    /**
     * 局部定时器
     */
    timer: TimerBeanInter
    /**
     * 获取到正确数据后回调
     * @param onetime 秒数，第一次传入0，内部传入3000
     * @param _status 是否获取到正确数据
     * @param results 结果
     */
    success: (onetime: number, _status: any, results: any[]) => void
    /**
     * 每次刷新倒计时回调
     * @param countDown 倒计时
     */
    updateCountDown: (countDown: any[]) => void
    /**
     * 结果长度
     */
    resultSize: number
    /**
     * 获取彩票id方法
     */
    lotteryId?: () => string
    /**
     * 弹框提示方法
     */
    showBox: (issue: string, nextissue: string) => void
  }) {
    const conf = reactive({
      reset: () => {
        conf.timer = null
        conf.current = {}
        conf.last = {}
        conf.next = {}

        conf.issue = ''
        conf.lastissue = ''
        conf.nextissue = ''
        conf.countDown = [0, 0, 0]
        conf.results = []
        for (let i = 0; i < conf.resultSize; i++) {
          conf.results.push({
            num: -1,
            color: '',
            text: ''
          })
        }
      },
      timerStartTime: 0,
      timer: null,
      oncetimer: [] as any[],
      /**
       * 开始每x秒循环获取最新期数信息，直到获取到
       * @param onetime 秒数，第一次传入0，内部传入3000
       */
      getInfoLoop: (onetime: number) => {
        timer.un(...conf.oncetimer)
        conf.oncetimer = []
        const getInfoTimer = async () => {
          const _status = await conf.getInfo()
          if (!_status && conf.oncetimer.length > 0) {
            const cid1 = timer.once(() => {
              getInfoTimer()
            }, 1000)
            conf.oncetimer.push(cid1)
          } else {
            success(onetime, _status, conf.results)
          }
        }
        const cid = timer.once(() => {
          getInfoTimer()
        }, onetime)
        conf.oncetimer.push(cid)
      },
      closeDate: 0,
      showBoxTime: 0,
      setCountDownNum: () => {
        if (!StrUtil.isNull(conf.closeDate) && !StrUtil.isNull(conf.issue)) {
          if (conf.closeDate >= 0) {
            conf.countDown = sutil.getCountDown(conf.closeDate)
          } else {
            //检测出现计算错误，将期数置为下一期
            if (Date.now() - conf.showBoxTime < 2000) {
              // System.reload();
              return
            } else conf.showBoxTime = Date.now()

            conf.closeDate = conf.next.autoCloseDateTemp
            conf.countDown = sutil.getCountDown(conf.closeDate)

            if (showBox) showBox(conf.issue, conf.nextissue)

            //倒计时结束以后，初始化期数显示和结果显示
            conf.results = []
            for (let i = 0; i < conf.resultSize; i++) {
              conf.results.push({
                num: -1,
                color: '',
                text: ''
              })
            }
            conf.issue = conf.next.openExpect
            conf.current.openExpect = conf.issue
            conf.current.lotteryOpenId = conf.next.lotteryOpenId
            conf.lastissue = conf.current.openExpect

            //开始每3秒循环获取最新期数信息，直到获取到
            conf.getInfoLoop(3000)
          }

          updateCountDown(conf.countDown)
        }

        const _thisTime = Date.now()
        const _timeOffset = _thisTime - conf.timerStartTime
        conf.current.autoCloseDateTemp -= _timeOffset
        conf.next.autoCloseDateTemp -= _timeOffset
        conf.closeDate -= _timeOffset
        conf.timerStartTime = _thisTime
      },
      start: () => {
        if (conf.timer) return
        conf.timerStartTime = Date.now()
        conf.timer = timer.on(
          () => {
            conf.setCountDownNum()
          },
          1000,
          true
        )
      },
      /**
       * 即将开奖期数
       */
      issue: '',
      /**
       * 最后一期期数
       */
      lastissue: '',
      /**
       * 下期期数
       */
      nextissue: '',
      /**
       * 倒计时
       */
      countDown: [0, 0, 0] as any[],
      /**
       * 结果
       */
      results: [] as any[],
      /**
       * 结果长度
       */
      resultSize: resultSize,
      current: {
        autoCloseDate: '',
        autoOpenDate: '',
        openCode: '',
        lotteryCode: '',
        lotteryName: '',
        periodsId: 0,
        openExpect: '',
        theoryDrawingDate: ''
      } as any,
      last: {
        autoCloseDate: '',
        autoOpenDate: '',
        openCode: '',
        lotteryCode: '',
        lotteryName: '',
        periodsId: 0,
        openExpect: '',
        theoryDrawingDate: ''
      } as any,
      next: {
        autoCloseDate: '',
        autoOpenDate: '',
        openCode: '',
        lotteryCode: '',
        lotteryName: '',
        periodsId: 0,
        openExpect: '',
        theoryDrawingDate: ''
      } as any,

      //获取最新期数信息，也用于倒计时结束后循环获取最新信息
      getInfo: () => {
        conf.start()
        return new Promise(async (_res) => {
          let res = await lotteryOpen({
            lotteryId: lotteryId ? lotteryId() : conf.play.item.id,
            final: (a: any, b: any) => {
              if (!a) _res(false)
            }
          })
          res = res.data

          if (!res.currentOpen) {
            conf.reset()
            _res(false)
            return
          }
          // //更新钱包
          // svalue.walletlist =[]
          // svalue.getWalletlist(2)
          conf.current = res.currentOpen
          conf.last = res.lastOpen
          conf.next = res.nextOpen

          //初始化最终开奖时间戳
          conf.current.autoCloseDateTemp = conf.current.openTime - res.currentSystemTime
          conf.next.autoCloseDateTemp = conf.next.openTime - res.currentSystemTime

          conf.closeDate = conf.current.autoCloseDateTemp

          conf.issue = res.currentOpen.openExpect
          conf.lastissue = res.lastOpen.openExpect
          conf.nextissue = res.nextOpen.openExpect

          if (res.lastOpen.openCode) {
            conf.results = res.lastOpen.openCode.split(',').map((item: any, index: number) => {
              return {
                num: item
              }
            })
            conf.setCountDownNum()
            _res(true)
          } else {
            conf.results = []
            for (let i = 0; i < conf.resultSize; i++) {
              conf.results.push({
                num: -1,
                color: '',
                text: ''
              })
            }
            _res(false)
          }
        })
      },

      /**
       * 选择的玩法
       */
      play: {
        item: {} as {
          id: string
          lotteryTypeId: number
          label: string
          title: string
          openLockCountdown: number
          lotteryInterval: number,
          lotteryRuleurl: string
        },
        list: [] as any[],
        change: async (path: string, obj: any) => {
          if (obj.id === conf.play.item.id) return
          await System.router.replace(`${path}?id=${obj.id}`)
          CEvent.emit(ERouter.reload)
        }
      },

      /**
       * 下注
       */
      bet: {
        /**
         * 获取当前下注的所有信息
         */
        getInfo: () => {
          const obj = {
            betCodes: conf.bet.content.join(','),
            betExpect: conf.current.openExpect,
            betOpenId: conf.current.lotteryOpenId,
            lotteryId: conf.play.item.id,
            money: conf.bet.totalMoney,
            multiple: conf.bet.multiple,
            nums: 1,
            supplement: 0,
            walletCoinCode: conf.wallet.coinSymbol
          }
          return obj
        },

        /**
         * 下注内容
         */
        content: [] as any[],

        /**
         * 下注注数
         */
        num: 0,

        /**
         * 下注金额
         */
        money: 0,

        /**
         * 下注倍数
         */
        multiple: 0,

        /**
         * 下注总金额
         */
        totalMoney: 0
      },

      /**
       * 钱包
       */
      wallet: {
        /**
         * 钱包余额(单位+金额)
         */
        label: '-',
        /**
         * 钱包余额
         */
        money: '0',
        /**
         * 钱包符号
         */
        coinSymbol: '₹',
        /**
         * 获取钱包余额
         * @returns
         */
        getWalletMoney: async () => {
          const sconfig = sutil.getStore('sconfig')
          const svalue = sutil.getStore('svalue')
          if (!sconfig.userInfo) return (conf.wallet.label = '-')
          let item = await svalue.getDefaultWallet()
          if (item.hasOwnProperty('coinSymbol')) {
            let m = parseFloat(item.walletMoney)
            conf.wallet.money = sutil.dataHandling(m)
            conf.wallet.coinSymbol = item.coinSymbol || '₹'
            conf.wallet.label = conf.wallet.coinSymbol + conf.wallet.money
          }
        }
      },
      /**
       * 初始页面业务
       * @returns
       */
      async init(
        name:
          | 'MARK_SIX'
          | 'PK10'
          | '3D_LOTTERY'
          | '3D'
          | 'Trx_Win_Go'
          | '5D'
          | 'COLOR'
          | 'SATTA_KING'
          | 'ANIMALS_RUNNING'
      ) {
        //获取游戏列表,并初始化游戏id和游戏类型
        conf.play.list = await slottery.findLotteryList(name)
        conf.play.list.sort((a: any, b: any) => a.lotteryInterval - b.lotteryInterval)
        conf.play.list.forEach((item: any) => {
          const minutes = item.lotteryInterval / 1000 / 60
          item.label = minutes + (minutes > 1 ? i18n.t('game.minutes') : i18n.t('game.minute'))
          item.openLockCountdown = item.openLockCountdown / 1000
        })

        //获取游戏id
        const { id } = System.getRouterParams()
        conf.play.item = id ? (conf.play.list.find((v: any) => v.id === id) as any) : conf.play.list[0]
        //如果获取不到游戏id,则跳转到首页
        if (!conf.play.item) {
          System.router.replace('/')
          return
        }

        //获取开奖信息任务
        conf.getInfoLoop(0)
        //获取钱包余额
        conf.wallet.getWalletMoney()
      }
    })
    return conf
  }
})

export default slottery

export type LotteryConfInter = ReturnType<typeof slottery.lotteryBox>
