import { apis } from '@/api'
import i18n from '@/lang'
import { reset } from '@/sstore/index.js'
import { sconfig } from '@/sstore/sconfig'
import sutil from '@/sstore/sutil'
import { svalue } from '@/sstore/svalue'
import svf from '@/sstore/svf'
import System from '@/utils/System'
import { onMounted, reactive } from 'vue'

export const index = () => {
  System.loadModule('lottie')

  const conf = reactive({
    openEye:false,
    password:'',
    username:'',
    loading:false,
    
    vf: {},
    vobj: {
      getNum: true,
      getEn: true
    },
    vfFun: (e: Event, name: string) => {
      ;(conf.vf as any)[name](e)
    },
    goRegister() {
      System.router.replace('/register')
    },
    submit() {
      if (!conf.username) {
        System.toast(i18n.t('login.phonePlace'))
        return
      }

      if (!conf.password) {
        System.toast(i18n.t('login.passwordPlace'))
        return
      }
      
    },
   
  })

  conf.vf = svf.getVf(conf, {
    username: {
      length: 64
    },
    password: {
      length: 15
    },
    email: {
      ...conf.vobj,
      getCustom: '@.'
    },
    emailCode: conf.vobj,
    goolgeinvitationCode: conf.vobj,
    phone: {
      getNum: true
    },
    phoneVerificationCode: {
      getNum: true
    }
  })

  onMounted(async () => {
    
  })

  return conf
}
