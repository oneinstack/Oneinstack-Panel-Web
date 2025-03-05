import i18n from '@/lang'
import sconfig from '@/sstore/sconfig'
import stheme from '@/sstore/stheme'
import sutil from '@/sstore/sutil'
import System from '@/utils/System'
import { Scope } from 'tools-vue3'
import { onMounted, reactive } from 'vue'

export const index = () => {
  const conf = reactive({
    handleChangePassword: () => {
      
    },
    handleVerify: (type:string) => {
      Cookie.set('securityVerifyType',type)
      System.router.push('/user/setting/black/verify')
    },
    handleEnablePasskey: () => {
      
    },
  })
  onMounted(() => {
    
  })

  return conf
}
