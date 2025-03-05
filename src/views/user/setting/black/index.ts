import i18n from '@/lang'
import sconfig from '@/sstore/sconfig'
import stheme from '@/sstore/stheme'
import sutil from '@/sstore/sutil'
import System from '@/utils/System'
import { Scope } from 'tools-vue3'
import { onMounted, reactive } from 'vue'

export const index = () => {
  const conf = reactive({
    menu:[
        {
          name: 'Account Info',
          src:'/static/theme/black/setting/Account.png',
          url: '/user/setting/black/accountInfo',
        },
        {
          name: 'Security',
          src:'/static/theme/black/setting/Security.png',
          url: '/user/setting/black/security',
        },
        {
          name: 'Payment Methods',
          src:'/static/theme/black/setting/Payment.png',
          url: '/user/me/bankCard',
        },
        {
          name: 'About Us',
          src:'/static/theme/black/setting/About.png',
          url: '/user/about/about',
        },
    ],
    handleNavigate: (item: any) => {
      item.url && System.router.push(item.url)
    },
  })
  onMounted(() => {
    
  })

  return conf
}
