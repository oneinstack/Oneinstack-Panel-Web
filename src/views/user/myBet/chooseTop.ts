import { slottery } from '@/sstore/slottery'
import sutil from '@/sstore/sutil'
import System from '@/utils/System'
import { reactive } from 'vue'

export const index = ({ emit, lotteryTypeRef, betTimeRef }: any) => {
  const conf = reactive({
    lottery: {
      type: {} as any,
      item: {} as any,
      confirm: (data: any) => {
        conf.lottery.type = data[0] || {}
        conf.lottery.item = data[1] || {}
        conf.confirm()
      }
    },
    bettime: {
      item: {} as any,
      confirm: (data: any) => {
        conf.bettime.item = data[0] || {}
        conf.confirm()
      }
    },
    confirm: () => {
      emit('confirm', {
        lottery: conf.lottery,
        bettime: conf.bettime
      })
    },
    /** 获取玩法列表，初始化选项 */
    getList: async () => {
      const res = await slottery.getLotteryList()

      let _data = []
      const key = 'key'
      const label = 'label'
      const children = 'children'
      const lotteryTypeCode = 'lotteryTypeCode'
      for (let i = 0; i < res.length; i++) {
        const _item: any = res[i]
        let obj = {
          [key]: _item.lotteryTypeVO.lotteryTypeId,
          [label]: _item.lotteryTypeVO.lotteryTypeName,
          [lotteryTypeCode]: _item.lotteryTypeVO.lotteryTypeCode,
          [children]: _item.lotteryVOList.map((v: any) => ({
            [key]: v.id,
            [label]: v.lotteryShowname
          }))
        }
        _data.push(obj)
      }
      lotteryTypeRef.value.init(_data)

      let timeArr = sutil.getDateOptions(false)
      betTimeRef.value.init(timeArr)

      const options = System.getRouterParams()
      let fItem = _data.find((v: any) => v.label == options.lottery)
      if (options.lottery && fItem) {
        conf.dialog.refObj.lotteryType.chooseItem(0, fItem)
        conf.dialog.refObj.lotteryType.confirm()
      } else {
        conf.confirm()
      }
    },
    /** 对话框 */
    dialog: {
      show: false,
      showRef: 'lotteryType',
      refObj: {
        lotteryType: lotteryTypeRef,
        betTime: betTimeRef
      } as any,
      openRef: (ref: string) => {
        conf.dialog.refObj[conf.dialog.showRef].reset()
        conf.dialog.showRef = ref
        conf.dialog.show = true
      },
      /** 确认 */
      confirm: () => {
        conf.dialog.show = false
        conf.dialog.refObj[conf.dialog.showRef].confirm()
      },
      /** 取消 */
      cancel: () => {
        conf.dialog.refObj[conf.dialog.showRef].reset()
        conf.dialog.show = false
      }
    }
  })

  return conf
}
