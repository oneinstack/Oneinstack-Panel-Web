import { sconfig } from '@/sstore/sconfig'
import { onMounted, reactive } from 'vue'
import System from '@/utils/System'
import { apis } from '@/api'
import i18n from '@/lang'
import { Scope } from 'tools-vue3'
import { EPage } from '@/enum/Enum'
import sutil from '@/sstore/sutil'

export const index = () => {
  const conf = reactive({
    pointList: [] as any[],
    userInfo: {} as any,
    loading: false,
    pageNum: 1,
    pageSize: 20,
    total: 0,
    getPointsPageList() {
      conf.loading = true
      apis.getPointsPage({
        userId: conf.userInfo.userId,
        current: conf.pageNum,
        size: conf.pageSize,
        success: (res: any) => {
          res.data.records.forEach((item: any) => {
            item.changePoints = parseInt(item.changePoints)
          })

          conf.pointList = [...conf.pointList, ...res.data.records]
          conf.total = res.data.total || 0
        },
        final: () => {
          conf.loading = false
        }
      })
    },
    moreMessage() {
      if (conf.pageSize * conf.pageNum >= conf.total) {
        return
      }
      conf.pageNum++
      conf.getPointsPageList()
    },
    getType(type: any) {
      switch (type) {
        case 0:
          return i18n.t('point.signIn1') // 签到
        case 1:
          return i18n.t('me.Recharge') // 充值
        case 2:
          return i18n.t('point.pointsMall') // 积分商城
        case 3:
          return i18n.t('point.luckyBox') // 宝箱
        case 4:
          return i18n.t('point.systemGift') // 系统赠送
        case 5:
          return i18n.t('point.systemDeduction') // 系统扣减
        default:
          return ''
      }
    }
  })
  onMounted(() => {
    conf.userInfo = sconfig.userInfo
    if (conf.userInfo && conf.userInfo.userId) {
      conf.getPointsPageList()
    } else {
      System.router.replace('/login')
    }
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
