import i18n from '@/lang'
import { svalue } from '@/sstore/svalue'
import System from '@/utils/System'
import { onMounted, reactive } from 'vue'
import sconfig from '@/sstore/sconfig'


export const index = () => {
  const conf = reactive({
    userInfo: {
      userImgUrl: '',
      userNickname: '',
      userId: ''
    } as any,
    statistics: {
      totalWins: 0,
      totalBets: 0,
      totalAmount: '0.00'
    } as any,

    handleNavigate: () => {
      System.router.push('/user/setting/black/edit')
    },
  })
  
  onMounted(() => {
    conf.userInfo = sconfig.userInfo
  })

  return conf
}
