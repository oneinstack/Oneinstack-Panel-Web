import i18n from '@/lang'
import { svalue } from '@/sstore/svalue'
import System from '@/utils/System'
import { onMounted, reactive } from 'vue'
import sconfig from '@/sstore/sconfig'


export const index = () => {
  const conf = reactive({
    vipInfo: {
      level: 0,
      progress: 0
    } as any,
    statistics: {
      totalWins: 0,
      totalBets: 0,
      totalAmount: '0.00'
    } as any,

    // 处理查看更多VIP信息
    handleLearnMore: () => {
      System.router.push('/user/vip/levelSystem')
    },
  })
  
  onMounted(() => {
  })

  return conf
}
