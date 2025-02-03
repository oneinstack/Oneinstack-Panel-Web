import { apis } from '@/api'
import { sstatus } from '@/sstore/sstatus'
import System from '@/utils/System'
import { onMounted, reactive } from 'vue'

export const index = ({ props, tabRrfs, mconf }: any) => {
  const conf = reactive({
    lotteryId: '',
    resultList: [] as any,
    pageSize: 10,
    pageNum: 1,
    total: 0,
    index: 0,
    colorBtnNum: 1,
    isTips: false,
    changeTab(item: any, index: any) {
      sstatus.getscrollLeft(tabRrfs, 550, index, 180)
      conf.lotteryId = item.id
      conf.resultList = []
      conf.pageNum = 1
      conf.total = 0
      conf.getLotteryResult(item.id)
    },
    getLotteryResult(lotteryId: any) {
      System.loading()
      conf.isTips = false
      apis.lotteryOpenResult({
        current: conf.pageNum,
        size: conf.pageSize,
        lotteryId,
        success: (res: any) => {
          conf.resultList = [...conf.resultList, ...res.data.records]
          conf.total = res.data.total
          if (conf.pageSize * conf.pageNum >= conf.total) return (conf.isTips = true)
        },
        final: () => {
          System.loading(false)
        }
      })
    },
    moreMessage() {
      if (conf.pageSize * conf.pageNum >= conf.total) return (conf.isTips = true)
      conf.pageNum++
      conf.getLotteryResult(conf.lotteryId)
    },
    initResult(e: any) {
      if (e != conf.lotteryId) return
      System.loading()
      apis.lotteryOpenResult({
        current: 1,
        size: 10,
        lotteryId: conf.lotteryId,
        success: (res: any) => {
          let datas = res.data.records
          if (conf.resultList[0].openExpect != datas[0].openExpect) {
            conf.resultList.unshift(datas[0])
            conf.resultList.pop()
          }
          let index = conf.resultList.findIndex((item: any) => !item.openCode)
          if (index != -1) {
            let openExpect = conf.resultList[index]?.openExpect
            let newIndex = datas.findIndex((item: any) => item.openExpect == openExpect)
            conf.resultList[index].openCode = datas[newIndex].openCode
          }
          conf.total = res.data.total
        },
        final: () => {
          System.loading(false)
        }
      })
    }
  })

  onMounted(() => {
    conf.lotteryId = props.lottery.play.item.id
    conf.getLotteryResult(conf.lotteryId)
    sstatus.getscrollLeft(tabRrfs, 550, (props.lottery.play.item.lotterySort - 1), 180)
  })

  return conf
}
