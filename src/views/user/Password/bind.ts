import { apis } from '@/api'
import i18n from '@/lang'
import sutil from '@/sstore/sutil'
import { svf } from '@/sstore/svf'
import System from '@/utils/System'
import { Scope } from 'tools-vue3'
import { onMounted, reactive } from 'vue'

export const index = () => {
  const timer = Scope.Timer()
  const conf = reactive({
    mode: null as any,
    formData: {
      area_code: '', //区号
      mobile_phone: '', //手机号
      verification_code: '', //验证码
      email: '' //邮箱
    } as any,
    areaCodeList: [] as any[],
    selectAreaCodeObj: {} as any,
    modalShow: false,
    Countdown: 60,
    visible: true,
    value: [0],
    modalTitle: '',
    titleName: '',
    typeName: '',
    isGetCode: false,
    vf: {} as any,
    vfFun: (e: any, name: any) => {
      conf.vf[name](e)
    },

    //获取手机区号列表数据
    getAreaCode: async () => {
      System.loading()
      const res = await apis.getCountry({
        complete: () => {
          System.loading(false)
        }
      })
      conf.areaCodeList = res.data || []
      conf.selectAreaCodeObj = conf.areaCodeList[0] || {}
      conf.formData.area_code = conf.areaCodeList[0].areaCode || ''
    },

    //打开modal
    handleOpenMadal() {
      if (conf.mode) return
      conf.modalShow = true
    },

    //关闭modal
    hideModal() {
      conf.modalShow = false
    },

    // input => 清空
    handleClearInput(key: any) {
      conf.formData[key] = ''
    },

    //eamil => 输入事件
    handleEmailInput(e: any) {
      let val = e.target.value
      let regex = /[\u4e00-\u9fa5]/g // 匹配任何中文字符
      if (regex.test(val)) {
        val = val.replace(regex, '') // 删除中文字符
      }
      conf.formData.email = val
    },

    // 手机区号picker => change事件
    bindChange({ currentOption }: any) {
      conf.value = [conf.areaCodeList.findIndex((item: any) => item.areaCode == currentOption.areaCode)]
      conf.formData.mobile_phone = ''
      conf.formData.verification_code = ''
      conf.Countdown = 60
    },

    // 手机区号picker取消btn
    handleAreaCodeCancel() {
      conf.modalShow = false
    },

    // 手机区号picker确认btn
    handleAreaCodeConfirm() {
      conf.selectAreaCodeObj.flagUrl = ''
      let index = conf.value[0]
      conf.formData.area_code = conf.areaCodeList[index].areaCode
      conf.selectAreaCodeObj = conf.areaCodeList[index]
      conf.modalShow = false
    },

    //获取验证码btn
    handleGetCode: async (type: any) => {
      let isNull = false,
        tipInfo = '',
        apiUrl = null as any,
        obj = {}
      switch (type) {
        case 'phone':
          let str1 = eval('/' + conf.selectAreaCodeObj.phoneRule + '/')
          if (!str1.test(conf.formData.mobile_phone)) {
            isNull = true
            tipInfo = i18n.t('addBankCradModule.correctphoneTip')
          }
          if (!conf.formData.mobile_phone) {
            isNull = true
            tipInfo = i18n.t('addBankCradModule.enterPhoneTip')
          }
          apiUrl = apis.phoneVerify
          obj = {
            areaCode: conf.selectAreaCodeObj.areaCode,
            mobile: conf.formData.mobile_phone
          }
          break
        case 'email':
          let regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!regex.test(conf.formData.email)) {
            isNull = true
            tipInfo = i18n.t('addBankCradModule.correctEmailTip')
          }
          if (!conf.formData.email) {
            isNull = true
            tipInfo = i18n.t('login.emailPlace')
          }
          apiUrl = apis.emailSendCode
          obj = {
            email: conf.formData.email
          }
          break
      }

      if (isNull) {
        System.toast(tipInfo)
        return
      }

      System.loading()
      const res = await apiUrl({
        ...obj,
        complete: () => {
          System.loading(false)
        }
      })

      conf.isGetCode = true
      conf.handleCountdown()
      System.toast(i18n.t(`code.${res.code}`) || 'success', 'success')
    },

    //倒计时
    handleCountdown() {
      if (conf.Countdown == 0) {
        conf.Countdown = 60
      } else {
        conf.Countdown -= 1
        timer.once(conf.handleCountdown, 1000)
      }
    },

    // 数据提交
    handleDataSubmit: async () => {
      if (conf.mode) {
        conf.mode = null
        return
      }
      let nullArr = [],
        obj = {}
      if (conf.typeName == 'Phone') {
        nullArr = ['area_code', 'mobile_phone', 'verification_code']
        obj = {
          areaCode: conf.formData.area_code,
          code: conf.formData.verification_code,
          type: conf.formData.mobile_phone
        }
      } else {
        nullArr = ['email', 'verification_code']
        obj = {
          code: conf.formData.verification_code,
          type: conf.formData.email
        }
      }

      let isNull = false
      for (let key of nullArr) {
        !conf.formData[key] && (isNull = true)
      }
      if (isNull) {
        System.toast(i18n.t('addBankCradModule.formTip'))
        return
      }

      let str1 = eval('/' + conf.selectAreaCodeObj.phoneRule + '/')
      if (!str1.test(conf.formData.mobile_phone) && conf.typeName == 'Phone') {
        System.toast(i18n.t('addBankCradModule.correctphoneTip'))
        return
      }

      let regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!regex.test(conf.formData.email) && conf.typeName != 'Phone') {
        System.toast(i18n.t('addBankCradModule.correctphoneTip'))
        return
      }

      if (!conf.isGetCode) {
        System.toast(i18n.t('addBankCradModule.getCode'))
        return
      }

      System.loading()
      const res = await apis.bindByCode({
        ...obj,
        complete: () => {
          System.loading(false)
        }
      })
      System.toast(i18n.t(`code.${res.code}`) || 'success', 'success')
      timer.once(() => {
        sutil.pageBack()
      }, 2000)
    }
  })

  const init = async () => {
    const param = System.getRouterParams()
    conf.mode = param.mode
    conf.formData.mobile_phone = param.phone
    conf.formData.email = param.email
    conf.vf = svf.getVf(conf.formData, {
      email: {
        getNum: true,
        getEn: true,
        getCustom: '@.'
      },
      verification_code: {
        getNum: true,
        getEn: true
      },
      mobile_phone: {
        getNum: true
      }
    })
    conf.typeName = Cookie.get('passwordType')
    if (conf.typeName == 'Phone') {
      conf.titleName = i18n.t('passwordModule.SetPhone')
    } else {
      conf.titleName = i18n.t('passwordModule.SetEmail')
    }
    conf.getAreaCode()
  }
  onMounted(() => {
    init()
  })

  return conf
}
