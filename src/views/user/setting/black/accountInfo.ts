import i18n from '@/lang'
import sconfig from '@/sstore/sconfig'
import stheme from '@/sstore/stheme'
import sutil from '@/sstore/sutil'
import System from '@/utils/System'
import { Scope } from 'tools-vue3'
import { onMounted, reactive } from 'vue'

export const index = () => {
  const conf = reactive({
    userAvatar: '/static/theme/black/setting/Account.png',
    username: 'lddbweevqtcc',
    userId: '69023432',
    email: '123456789@gmail.com',
    handleNavigate: () => {
      System.router.push('/user/setting/black/edit')
    },
  })
  onMounted(() => {
    
  })

  return conf
}
