import i18n from '@/lang'
import sconfig from '@/sstore/sconfig'
import stheme from '@/sstore/stheme'
import sutil from '@/sstore/sutil'
import System from '@/utils/System'
import { Scope } from 'tools-vue3'
import { onMounted, reactive } from 'vue'

export const index = () => {
  const conf = reactive({
    selectedCode: '+1' as string,
    phoneNumber: '' as string,
    isValidPhone: false as boolean,
    verifyType:'' as string,
    //显示国家代码选择器
    showCountryPicker: (event: any) => {

    },
    //处理手机号验证
    handleVerify: () => {
      if (!conf.isValidPhone) return

    },

    // 验证手机号格式
    validatePhone: () => {
      conf.isValidPhone = conf.phoneNumber.length >= 10

    },
  })
  onMounted(() => {
    conf.verifyType = Cookie.get('securityVerifyType')
    console.log('conf.verifyType',conf.verifyType)
  })

  return conf
}
