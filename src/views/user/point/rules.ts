import { apis } from '@/api'
import { sconfig } from '@/sstore/sconfig'
import System from '@/utils/System'
import { onMounted, reactive } from 'vue'

export const index = () => {
  const conf = reactive({
    signRule: '',
    //获取列表数据
    getPointsList(userId: any) {
      System.loading()
      apis.getPointsList({
        userId,
        months: 0,
        success: (res: any) => {
          conf.signRule = res.data.config.signRule
        },
        final: () => {
          System.loading(false)
        }
      })
    }
  })
  onMounted(() => {
    let userInfo = sconfig.userInfo
    if (userInfo && userInfo.userId) {
      conf.getPointsList(userInfo.userId)
    } else {
      System.router.replace('/login')
    }
  })

  return conf
}
