import { apis } from '@/api'
import i18n from '@/lang'
import sutil from '@/sstore/sutil'
import { svalue } from '@/sstore/svalue'
import System from '@/utils/System'
import { onMounted, reactive } from 'vue'
import useDateInterval from './hooks/useDateInterval'

export const index = () => {
  const conf = reactive({
    open: false,
    title: 'title',
    queryParams: {} as any,
    options: useDateInterval(),
    currentSelected: null as any,
    list: [] as any[],
    loading: true,
    defaultWallet: null as any,

    async getList() {
      System.loading()
      conf.loading = true
      const { data: res } = await apis.getSubUserStatisticsDetails(conf.queryParams)
      conf.loading = false
      System.loading(false)
      conf.list = res
    },

    transformData(item: any, type: number) {
      let data = {}
      switch (type) {
        case 0:
        case 1:
          data = {
            avatar: item.userImgUrl,
            name: item.userName,
            time: item.registerTime
          }
          break
        case 2:
        case 4:
        case 5:
          data = {
            name: item.userName,
            cell: [
              {
                value: `${conf.defaultWallet.coinSymbol}${sutil.dataHandling(item.money)}`,
                label: i18n.t('invite.TotalAmount')
              },
              {
                value: item.tradeCount,
                label: i18n.t('invite.TotalCount')
              }
            ]
          }
          break
        case 3:
          data = {
            name: item.userName,
            cell: [
              {
                value: `${conf.defaultWallet.coinSymbol}${sutil.dataHandling(item.money)}`,
                label: i18n.t('invite.TotalAmount')
              },
              {
                value: new Date(item.tradeTime).Format(),
                label: i18n.t('invite.DepositTime'),
                isTime: true
              }
            ]
          }
          break
      }
      return data
    },

    hanldeSelect(option: any) {
      conf.currentSelected = option
      conf.queryParams.time1 = option.value?.[0]
      conf.queryParams.time2 = option.value?.[1]
      conf.getList()
      conf.open = false
    }
  })

  const init = async () => {
    conf.defaultWallet = await svalue.getDefaultWallet()
    const params = System.getRouterParams()
    conf.queryParams = params
    conf.queryParams.type = parseInt(params.type)
    conf.title = params.title
    const { time1, time2 } = conf.queryParams
    if (time1 && time2) {
      conf.currentSelected = conf.options.find(
        (item) => item.value?.[0] === conf.queryParams.time1 && item.value?.[1] === conf.queryParams.time2
      )
    } else conf.currentSelected = conf.options[0]
    conf.getList()
  }

  onMounted(async () => {
    init()
  })

  return conf
}
