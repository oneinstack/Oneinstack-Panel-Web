import { apis } from '@/api'
import i18n from '@/lang'
import sconfig from '@/sstore/sconfig'
import sutil from '@/sstore/sutil'
import { svalue } from '@/sstore/svalue'
import System from '@/utils/System'
import { Scope } from 'tools-vue3'
import { onMounted, reactive } from 'vue'

export const index = () => {
    const conf = reactive({
        list: [] as any[],
        loading: false,
        lastTime: 0,
        toPage: (path: string) => {
          if (!sconfig.userInfo) {
            System.router.push('/login')
            return
          }
          System.router.push(path)
        },
        getList: async () => {
          System.loading()
          const ttime = Date.now() - conf.lastTime
          if (conf.loading || ttime < 3000) return
          conf.loading = true
          conf.lastTime = Date.now()
          const res = await apis.changLong({
            final: () => {
              conf.loading = false
              System.loading(false)
            }
          })
          if (!res.data.length) {
            timer.once(() => {
              conf.getList()
            }, 3500)
            return
          }
      
          // 处理赔率和按钮列表排序
          const getSort = (resArr: any[]) => {
            const arr = [
              ['big', 'small'],
              ['odd', 'even'],
              ['red', 'green', 'violet']
            ]
            interface Obj {
              [key: string]: any
            }
            const obj: Obj = {
              big: 0,
              small: 0,
              odd: 1,
              even: 1,
              red: 2,
              green: 2,
              violet: 2
            }
            return resArr.sort((a, b) => {
              const to = arr[obj[b.betConent]]
              return to.indexOf(a.betConent) - to.indexOf(b.betConent)
            })
          }
      
          res.data = res.data.map((item: any, index: any) => {
            item.id = item.lotteryId + item.oddsArray[0].lotteryOddsId
            item.oddsObj = item.oddsArray.reduce((a: any, b: any) => {
              b.id = item.id + b.lotteryOddsId
              b.pid = item.id
              b.odds = Number(b.odds).toFixed(2)
              const spIndex = b.betCodes.lastIndexOf('_')
              const plname = b.betCodes.substring(0, spIndex)
              // 处理多个下划特殊5D
              const playName = plname.indexOf('_') !== -1 ? plname.split('_')[1] : plname
              const betConent = b.betCodes.substring(spIndex + 1)
              // 处理有效内容
              if (b.count > 0) {
                // 处理多个下划特殊5D
                item.playName = playName
                item.betConent = betConent
                item.longCount = b.count
                item.betCodes = b.betCodes
              }
              //对选中数据赋值，优化数据传输
              b.betConent = betConent
              ;(b.betExpect = item.betExpect),
                (b.betOpenId = item.betOpenId),
                (b.lotteryId = item.lotteryId),
                (a[betConent] = b)
              a[b.betCodes] = b
              return a
            }, {})
            item.oddsArray = getSort(item.oddsArray)
            item.countDown = ['00', '00', '00']
            return item
          })
          conf.list = res.data
          conf.time.run()
        },
        bet: {
          show: false,
          item: {} as any,
          close: () => {
            conf.bet.item = {}
            conf.bet.show = false
          },
          choose: (item: any) => {
            conf.bet.item = item
            conf.bet.show = true
          },
      
          submit: (e: any) => {
            FunUtil.throttle(() => {
              conf.bet.submitFun(e)
            })
          },
          //下注提交
          submitFun: async (e: any) => {
            if (!e) {
              conf.bet.close()
              return
            }
            const betItem = conf.bet.item
      
            const winfo = await svalue.getDefaultWallet()
            const obj = {
              money: e,
              betCodes: betItem.betCodes,
              betExpect: betItem.betExpect,
              betOpenId: betItem.betOpenId,
              lotteryId: betItem.lotteryId,
              multiple: 1,
              nums: 1,
              supplement: 0,
              walletCoinCode: winfo.walletCoin
            }
            System.loading()
            await apis.lotteryUserBets({
              ...obj,
              final: async () => {
                System.loading(false)
                conf.bet.close()
              }
            })
            System.toast(i18n.t('game.betSuccess'), 'success')
          }
        },
        time: {
          getStatus: false,
          run: () => {
            timer.clear()
            timer.on(
              async () => {
                if (!conf.list.length) return
                const stime = sconfig.nowTime()
                conf.list.forEach((item) => {
                  item.countDown = sutil.getCountDown(item.openTime - stime)
                  if (item.countDown[3] <= 0) {
                    conf.getList()
                  }
                  if (item.stopTime - stime <= 0) {
                    item.needStop = true
                    if (conf.bet.item?.pid === item.id) {
                      conf.bet.close()
                    }
                  }
                })
              },
              1000,
              true
            )
          }
        }
    })

    const timer = Scope.Timer()
    onMounted(() => {
        System.loading(false)
        timer.on(
            () => {
            conf.getList()
            },
            60000,
            true
        )
    })

    return conf
}
