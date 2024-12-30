import { sconfig } from '@/sstore/sconfig'
import { svalue } from '@/sstore/svalue'
import { onMounted, reactive } from 'vue'
import i18n from '@/lang'
import { apis } from '@/api'
import System from '@/utils/System'
import { Scope } from 'tools-vue3'
import { EPage } from '@/enum/Enum'

export const index = ({ changeRef }: any) => {
  const conf = reactive({
    pointList: [] as any[],
    typeList: [
      { name: i18n.t('point.all'), id: '1,2,3' },
      { name: i18n.t('point.luckyBox'), id: '2' },
      { name: i18n.t('point.cash'), id: '1' },
      { name: i18n.t('point.scratch'), id: '3' }
    ],
    typeId: '1,2,3',
    pointItemW: 100,
    loading: false,
    pageNum: 1,
    pageSize: 10,
    total: 0,
    integralNum: 0,
    userInfo: { userNickname: '' } as any,
    totalLading: false,
    showMall: true,
    showExchange: false,
    exchangeIndex: 0,
    userVipLevel: 0,
    changeType(id: any) {
      conf.typeId = id
      conf.pointList = []
      conf.pageNum = 1
      conf.getIntegralExchangeList()
    },
    getIntegralExchangeList(load = true) {
      if (!conf.showMall) return // 积分商城未开启
      conf.loading = load
      apis.getIntegralExchangeList({
        rewardType: conf.typeId,
        current: conf.pageNum,
        size: conf.pageSize,
        success: (res: any) => {
          conf.pointList = [...conf.pointList, ...res.data.records]
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
    integralExchange(item: any, index: number) {
      if (!conf.showExchange) {
        System.toast(i18n.t('point.noExchanging'))
        return
      }
      conf.exchangeIndex = index
      changeRef.value?.showPop({
        vipLevel: item.vipLevel,
        url: item.url,
        userVipLevel: conf.userVipLevel,
        show: true
      })
    },
    submit(e: any) {
      System.loading()
      let item = conf.pointList[conf.exchangeIndex]
      apis.integralExchange({
        configId: item.configId,
        count: e,
        success: (res: any) => {
          if (res.code == 200) {
            System.toast(i18n.t('point.exchangeSuccess'), 'success')
            conf.pointList[conf.exchangeIndex].exchangeNums = conf.pointList[conf.exchangeIndex].exchangeNums + e
            let num = conf.integralNum - parseFloat(item.integral) * e
            conf.integralNum = num
          } else {
            conf.changeType(conf.typeId)
          }
        },
        final: () => {
          System.loading(false)
        }
      })
    },
    goPage(url: any) {
      System.router.push(url)
    },
    getNum(num: any) {
      if (num == '') return '-'
      return parseInt(num)
    },
    userGradedInfo(load = true) {
      conf.totalLading = load
      apis.userGradedInfo({
        data: {},
        success: (res: any) => {
          let pointNum = res.data.integral
          conf.integralNum = parseInt(pointNum)
          conf.userVipLevel = res.data.userVipLevel
        },
        final: () => {
          conf.totalLading = false
        }
      })
    },
    getImgUrl(url: any) {
      if (!url) return false
      if (url.indexOf('http') != -1) {
        return true
      }
      return false
    }
  })
  onMounted(async () => {
    conf.userInfo = sconfig.userInfo
    conf.userGradedInfo()
    let windowWidth = window.innerWidth
    let mianW = windowWidth > 500 ? 500 : windowWidth
    conf.pointItemW = (mianW - 30) / 2

    const config = await svalue.getAppConfiguration(true)
    // conf.showMall = config.activity_points_mall // 是否开启积分商城
    conf.showExchange = config.activity_points_mall_exchange // 兑换按钮是否可点击
    conf.getIntegralExchangeList()
  })
  const event = Scope.Event()
  event.on(EPage.scrollBottom, () => {
    conf.moreMessage()
  })

  return conf
}
