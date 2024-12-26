import { apis } from '@/api'
import i18n from '@/lang'
import sutil from '@/sstore/sutil'
import System from '@/utils/System'
import { onMounted, reactive } from 'vue'
import { useRoute } from 'vue-router'

export const index = () => {
  const conf = reactive({
    pathUrl: '',
    activityContent: '' as any,
    taskId: '' as any,
    hasReceive: true,
    deposit: '' as any,
    getData() {
      System.loading()
      apis.isClaimed({
        taskId: conf.taskId,
        success: (res: any) => {
          conf.hasReceive = res.data
        },
        final: () => {
          System.loading(false)
        }
      })
    },

    // 领取btn
    handleReceive() {
      System.loading()
      apis.pickupActivityTask({
        taskId: conf.taskId,
        success: (res: any) => {
          System.toast(i18n.t(`code.${res.code}`), 'success')
          setTimeout(() => {
            sutil.pageBack()
          }, 2000)
        },
        final: () => {
          System.loading(false)
        }
      })
    }
  })
  const route = useRoute()
  onMounted(() => {
    const routeParams = route.query
    if (routeParams.deposit) conf.deposit = routeParams.deposit
    conf.taskId = routeParams.id
    conf.activityContent = routeParams.taskDesc
    conf.getData()
  })

  return conf
}
