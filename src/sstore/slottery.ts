import { apis } from '@/api/index'
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
    //页面对象-传入this即可
    timer,
    //获取到正确数据后回调
    success,
    //每次刷新倒计时回调
    updateCountDown,
    //结果长度
    resultSize,
    //获取彩票id方法
    lotteryId,
    //弹框提示方法
    showBox
  }: {
    timer: TimerBeanInter
    success: (onetime: number, _status: any, results: any[]) => void
    updateCountDown: (countDown: any[]) => void
    resultSize: number
    lotteryId: () => string
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
      //开始每3秒循环获取最新期数信息，直到获取到
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
      issue: '',
      lastissue: '',
      nextissue: '',
      countDown: [0, 0, 0] as any[],
      results: [] as any[],
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
            lotteryId: lotteryId(),
            final: (a: any, b: any) => {
              if (!a && !b) {
                _res(false)
              }
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
                num: Number(item)
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
      }
    })
    return conf
  }
})

export default slottery
