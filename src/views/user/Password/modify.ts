import { apis } from '@/api'
import i18n from '@/lang'
import sutil from '@/sstore/sutil'
import { svf } from '@/sstore/svf'
import System from '@/utils/System'
import { onMounted, reactive } from 'vue'

export const index = () => {
  const conf = reactive({
    typeName: '',
    formData: {
      old_password: '',
      password: '',
      new_password: '',
      confirm_password: ''
    },
    showPassword1: true,
    showPassword2: true,
    showPassword3: true,
    showPassword4: true,
    modalName: null,
    hasOldPassword: true,
    statusObj: {} as any,
    vf: {} as any,
    vfFun: (e: any, name: any) => {
      conf.vf[name](e)
    },

    //忘记密码
    handleForgot(e: any) {
      conf.modalName = e.currentTarget.dataset.modal
    },

    //关闭modal
    hideModal() {
      conf.modalName = null
    },

    //发送验证码页面
    handleSend() {
      System.router.push('/user/Password/send')
    },

    //数据提交
    handleDataSubmit: async () => {
      let obj = {} as any,
        isNull = false,
        isInconsistent = false,
        isSame = false,
        isLength = false
      if (conf.hasOldPassword) {
        // 为空校验
        if (!conf.formData.old_password || !conf.formData.new_password || !conf.formData.confirm_password) {
          isNull = true
        }

        //设置密码不一致
        if (conf.formData.new_password != conf.formData.confirm_password) {
          isInconsistent = true
        }

        //旧密码与新密码设置一致提示
        if (conf.formData.old_password == conf.formData.new_password) {
          isSame = true
        }

        //支付密码输入长度判断
        if (
          conf.typeName != 'Account' &&
          (conf.formData.old_password.length < 6 || conf.formData.confirm_password.length < 6)
        ) {
          isLength = true
        }

        obj.oldPass = conf.formData.old_password
        obj.newPass = conf.formData.new_password
        obj.renewPass = conf.formData.confirm_password
      } else {
        // 为空校验
        if (!conf.formData.password || !conf.formData.confirm_password) {
          isNull = true
        }

        //支付密码输入长度判断
        if (
          conf.typeName != 'Account' &&
          (conf.formData.confirm_password.length < 6 ||
            conf.formData.password.length < 6 ||
            (conf.hasOldPassword && conf.formData.old_password.length < 6))
        ) {
          isLength = true
        }

        //设置密码不一致
        if (conf.formData.password != conf.formData.confirm_password) {
          isInconsistent = true
        }

        obj.oldPass = ''
        obj.newPass = conf.formData.password
        obj.renewPass = conf.formData.confirm_password
      }

      if (isNull) {
        System.toast(i18n.t('passwordModule.modification'))
        return
      }

      if (isLength) {
        System.toast(i18n.t('passwordModule.lengthTip'))
        return
      }

      if (isInconsistent) {
        System.toast(i18n.t('passwordModule.settings'))
        return
      }

      if (isSame) {
        System.toast(i18n.t('passwordModule.sameTip'))
        return
      }

      let url = null as any

      switch (conf.typeName) {
        //账号密码
        case 'Account':
          url = apis.changepass
          break
        //支付密码
        case 'Payment':
          url = apis.updateWithdrawPassword
          break
      }

      const res = await url({
        ...obj
      })

      System.toast(i18n.t(`code.${res.code}`),'success')
      setTimeout(() => {
        if (conf.typeName == 'Account') {
          System.router.push('/login?type=3')
        } else {
          sutil.pageBack()
        }
      }, 2000)
    }
  })

  const init = async () => {
    conf.vf = svf.getVf(conf.formData, {
      password: {
        getNum: true
      },
      confirm_password: {
        getNum: true
      }
    })
    conf.typeName = Cookie.get('passwordType')
    conf.statusObj = Cookie.get('statusObj')
    //账号密码状态
    if (conf.typeName == 'Account') {
      conf.statusObj.userPasswordStatus && (conf.hasOldPassword = true)
      !conf.statusObj.userPasswordStatus && (conf.hasOldPassword = false)
    } else {
      conf.statusObj.userWithdrawPasswordStatus && (conf.hasOldPassword = true)
      !conf.statusObj.userWithdrawPasswordStatus && (conf.hasOldPassword = false)
    }
    const option = System.getRouterParams()
    option.hasOwnProperty('hasOldPassword') && (conf.hasOldPassword = JSON.parse(option.hasOldPassword.toLowerCase()))
  }
  onMounted(() => {
    init()
  })

  return conf
}
