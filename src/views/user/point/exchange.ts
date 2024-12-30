import { onMounted, reactive } from 'vue'
import { Scope } from 'tools-vue3'
import { EPage } from '@/enum/Enum'
import { apis } from '@/api'

export const index = () => {
  const conf = reactive({
    recordList: [] as any[],
    loading: false,
    pageNum: 1,
    pageSize: 20,
    total: 0,
    getIntegralExchangeList() {
      conf.loading = true
      apis.getUserIntegralExchangeRecordList({
        current: conf.pageNum,
        size: conf.pageSize,
        success: (res: any) => {
          conf.recordList = [...conf.recordList, ...res.data.records]
          conf.total = res.data.total || 0
        },
        complete: () => {
          conf.loading = false
        }
      })
    },
    moreMessage() {
      if (conf.pageSize * conf.pageNum >= conf.total) {
        return
      }
      conf.pageNum++
      conf.getIntegralExchangeList()
    },
    getNum(num: any) {
      if (!num) return 0
      return parseInt(num)
    }
  })
  onMounted(() => {
    conf.getIntegralExchangeList()
  })
  const event = Scope.Event()
  event.on(EPage.scrollBottom, () => {
    conf.moreMessage()
  })

  return conf
}
