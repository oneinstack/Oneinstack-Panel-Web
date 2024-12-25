import { apis } from '@/api'
import { EPage } from '@/enum/Enum'
import i18n from '@/lang'
import sutil from '@/sstore/sutil'
import { svalue } from '@/sstore/svalue'
import System from '@/utils/System'
import { Scope } from 'tools-vue3'
import { onMounted, reactive } from 'vue'

export const index = () => {
  const conf = reactive({
    pageSize: 15,
    pageNum: 1,
    total: 0,
    detailData: [] as any[],
    scrollHeight: 300,
    typeList: [
      {
        value: 1,
        label: i18n.t('tradeType.1'),
        isCheck: true
      },
      {
        value: 2,
        label: i18n.t('tradeType.2')
      },
      {
        value: 3,
        label: i18n.t('tradeType.3')
      },
      {
        value: 4,
        label: i18n.t('tradeType.4')
      },
      {
        value: 5,
        label: i18n.t('tradeType.5')
      },
      {
        value: 6,
        label: i18n.t('tradeType.6')
      },
      {
        value: 7,
        label: i18n.t('tradeType.7')
      },
      {
        value: 8,
        label: i18n.t('tradeType.8')
      },
      {
        value: 9,
        label: i18n.t('tradeType.9')
      },
      {
        value: 10,
        label: i18n.t('tradeType.10')
      },
      {
        value: 11,
        label: i18n.t('tradeType.11')
      },
      {
        value: 12,
        label: i18n.t('tradeType.12')
      },
      {
        value: 13,
        label: i18n.t('tradeType.13')
      },
      {
        value: 14,
        label: i18n.t('tradeType.14')
      },
      {
        value: 15,
        label: i18n.t('tradeType.15')
      },
      {
        value: 17,
        label: i18n.t('tradeType.17')
      },
      {
        value: 18,
        label: i18n.t('tradeType.18')
      },
      {
        value: 97,
        label: i18n.t('tradeType.97')
      }
    ],
    index: 0,
    statusList: [
      {
        value: 1,
        label: i18n.t('otcOrderModule.statusList.1'),
        isCheck: true
      },
      {
        value: -1,
        label: i18n.t('otcOrderModule.statusList.2')
      },
      {
        value: 0,
        label: i18n.t('otcOrderModule.statusList.0')
      }
    ],
    tradeType: 1,
    tradeStatus: 1,
    tradeExamineStatus: 1,
    tradeLable: i18n.t('tradeType.1'),
    getList() {
      System.loading()
      apis.meTrade({
        current: conf.pageNum,
        size: conf.pageSize,
        tradeType: conf.tradeType,
        tradeStatus: conf.tradeStatus,
        success: (res: any) => {
          conf.detailData = [...conf.detailData, ...res.data.records]
          conf.total = res.data.total || 0
        },
        final: () => {
          System.loading(false)
        }
      })
    },

    handleChange(type: any, val: any) {
      switch (type) {
        case 'type':
          conf.typeList.forEach((item) => {
            item.isCheck = false
            if (item.value == val.value) {
              item.isCheck = true
              conf.tradeType = item.value
              conf.tradeLable = item.label
            }
          })
          conf.detailData = []
          conf.getList()
          break
        case 'status':
          conf.statusList.forEach((item) => {
            item.isCheck = false
            if (item.value == val.value) {
              item.isCheck = true
              conf.tradeStatus = item.value
            }
          })
          conf.detailData = []
          conf.getList()
          break
      }
    },

    moreMessage() {
      if (conf.pageSize * conf.pageNum >= conf.total) {
        return
      }
      conf.pageNum++
      conf.getList()
    },

    getTime(val: any) {
      console.log(val)

      let _time = String(new Date(val))
      return String(_time).split('(')[0]
    },

    getCoin(val: any) {
      let _data = svalue.coinlist.find((it) => it.coinCode == val)
      if (_data) {
        return _data.coinSymbol
      } else {
        return ''
      }
    }
  })
  onMounted(() => {
    conf.getList()
  })
  const event = Scope.Event()
  event.on(EPage.scrollBottom, () => {
    conf.moreMessage()
  })

  return {
    conf,
    sutil
  }
}
