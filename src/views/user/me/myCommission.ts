import { apis } from '@/api'
import { EPage } from '@/enum/Enum'
import { svalue } from '@/sstore/svalue'
import System from '@/utils/System'
import { Scope } from 'tools-vue3'
import { onMounted, reactive } from 'vue'

export const index = () => {
  const event = Scope.Event()
  const conf = reactive({
    pageSize: 15,
    pageNum: 1,
    total: 0,
    detailData: [] as any[],
    scrollHeight: 0,

    getList: async () => {
      System.loading()
      const res = await apis.meTrade({
        current: conf.pageNum,
        size: conf.pageSize,
        tradeType: 6,
        final: () => {
          System.loading(false)
        }
      })

      res.data.records = res.data.records.map((item: any) => {
        item.tradeTime = new Date(item.tradeTime).Format()
        item.tradeObjPaymentInfo = JSON.parse(item.tradeObjPaymentInfo)
        return item
      })
      conf.detailData = [...conf.detailData, ...res.data.records]
      conf.total = res.data.total
    },

    moreMessage() {
      if (conf.pageSize * conf.pageNum >= conf.total) {
        return
      }
      conf.pageNum++
      conf.getList()
    },

    getCoin(val: string) {
      let _data = svalue.coinlist.find((it) => it.coinCode == val)
      if (_data) {
        return _data.coinSymbol
      } else {
        return ''
      }
    }
  })
  const init = () => {
    conf.getList()
    event.on(EPage.scrollBottom, conf.moreMessage)
  }
  onMounted(() => {
    init()
  })
  return conf
}
