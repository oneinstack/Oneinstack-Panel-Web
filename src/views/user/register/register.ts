import { apis } from '@/api'
import i18n from '@/lang'
import sconfig from '@/sstore/sconfig'
import sutil from '@/sstore/sutil'
import { svalue } from '@/sstore/svalue'
import svf from '@/sstore/svf'
import System from '@/utils/System'
import { onMounted, reactive } from 'vue'

export const index = () => {
  System.loadModule('lottie')

  const conf = reactive({
    openEye: false,
    checkedAge: true,
    checkedAgree: true,
    userName: '',
    password: '',
    invitationCode: '',
    selectIndex: 1,
    oldIndex: 1,
    email: '',
    emailCode: '',
    num: 60,
    num2: 60,
    message: '',
    message2: '',
    disabled: false,
    isEmail: false,
    isInvitationCode: false,
    invitationCodeDisabled: false,
    confirmPassword: '',
    confirmEye: false,
    isOpenPhoneRegistration: false,
    phone: '',
    phoneVerificationCode: '',
    areaCode: '',
    selectAreaCodeInfo: {},
    isOpenAreacodeModal: false,
    areaCodeList: [],
    indicatorStyle: `height: 50px;`,
    value: [0],
    isGetCode: false,
    flag: false,
    timers: null as any,
    timerNum: 60,
    isShowFoot: false,
    logImag: '',
    datas: [],
    gooleUserName: '',
    gooleEmail: '',
    gooleUuid: '',
    showBox: false, //打开邀请码窗口
    goolgeinvitationCode: '', //邀请码
    isRegisterInvite: '',
    footNav: [],
    footClick: 0,
    accountGoogle: false,
    accountTmp: false,
    isMore: false,
    lottieJsonData: [],
    BackByCode: '',
    disabled2: false,
    timers2: null as any,
    vf: {} as any,
    vfFun: (e: any, name: string) => {
      conf.vf[name](e)
    },
    vobj: {
      getNum: true,
      getEn: true
    },
    handleMore() {
      conf.isMore = true
    },
    handleCloseMore() {
      conf.isMore = false
    },
    handleMenuTouchstart(index: number) {
      conf.footClick = index
    },
    handleMenuTouchend() {
      conf.footClick = 0
    },
    //通过谷歌第三方登录后 拿到code 后请求的接口
    googleLoginCallBackByCode() {
      apis.googleLoginCallBackByCode({
        code: conf.BackByCode,
        success: (res: any) => {
          if (res.code == 200) {
            conf.gooleEmail = res.data.email
            conf.getConfig()
          }
        },
        complete: () => {
          // uni.hideLoading();
        }
      })
    },
    goGool() {
      this.windwOpen()
    },
    //h5 登录
    windwOpen() {
      apis.getConfig({
        type: 0,
        success: (res: any) => {
          if (res.code == 200) {
            let datas = res.data
            let url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${datas.clientId}&redirect_uri=${datas.redirectUrl}&scope=${datas.scope}&response_type=code&prompt=select_account`
            window.open(url, '_self')
          }
        }
      })
    },
    //第三方邀请码登录
    bind() {
      if (conf.goolgeinvitationCode.length <= 0) {
        System.toast(i18n.t(`login.invitationCode`))
      } else {
        conf.googleSubmit()
      }
    },
    //登录到系统 api
    googleSubmit(type?: number) {
      let data = {
        invitationCode: conf.goolgeinvitationCode,
        uuid: conf.gooleUuid,
        email: conf.gooleEmail
      }
      if (type == 1) {
        data = {
          invitationCode: '',
          uuid: conf.gooleUuid,
          email: conf.gooleEmail
        }
      }
      System.loading()
      apis.googleLogin({
        ...data,
        success: (res: any) => {
          if (res.code == 200) {
            sconfig.login(res.data.data)
            System.toast(i18n.t('common.loginSuccess'), 'success')
            setTimeout(() => {
              sutil.pageBack()
            }, 300)
            conf.showBox = false
          } else {
            System.toast(i18n.t(`code.${res.code}`))
          }
        },
        complete: () => {
          System.loading(false)
          conf.goolgeinvitationCode = ''
        }
      })
    },
    //获取第三方谷歌配置
    getConfig() {
      let keys =
        'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDL5t81bThdPiJHHkuWGI/0Bf4GRwizzYXyBk5y9LFsgYsE+I3YCiz1NtEisw2B5QbKb9WDSVWgcWHdg6AECexUDbe52FxbopGzIzm9zLq4i+YB26TgdAG/Yf/ZK7x0lwMteydPiOgEDWeVpposA0U83bfh1j6FIlUqgEuipBjPGQIDAQAB'
      conf.showBox = false
      apis.getConfig({
        type: 0,
        success: (res: any) => {
          if (res.code == 200) {
            let datas = res.data
            conf.gooleUuid = sutil.jsRsa(datas.uuid, keys) as string
            //是否第一次登录
            apis.checkUserName({
              email: conf.gooleEmail,
              success: (succe: any) => {
                if (succe.code == 200) {
                  conf.showBox = succe.data.result

                  if (
                    (conf.showBox == false && !conf.isRegisterInvite) ||
                    (conf.showBox == true && !conf.isRegisterInvite) ||
                    (conf.showBox == false && conf.isRegisterInvite)
                  ) {
                    conf.googleSubmit(1)
                  }
                }
              }
            })
          }
        },
        complete: () => {
          System.loading(false)
        }
      })
    },
    //tab => change
    handleTabChange(val: number) {
      conf.isGetCode = false
      conf.selectIndex = val
      conf.flag = false
      !conf.invitationCodeDisabled && (conf.invitationCode = '')
      conf.areaCode = (conf.areaCodeList as any)[0]?.areaCode || ''
      conf.selectAreaCodeInfo = (conf.areaCodeList as any)[0] || {}
      switch (val) {
        case 1:
          conf.email = ''
          conf.emailCode = ''
          conf.phone = ''
          conf.phoneVerificationCode = ''
          break
        case 2:
          conf.userName = ''
          conf.password = ''
          conf.confirmPassword = ''
          conf.phone = ''
          conf.phoneVerificationCode = ''
          break
        case 3:
          conf.userName = ''
          conf.password = ''
          conf.confirmPassword = ''
          conf.email = ''
          conf.emailCode = ''
          break
      }
      conf.isMore = false
    },
    //获取手机区号列表数据
    getAreaCode() {
      System.loading()
      apis.getCountry({
        success: (res: any) => {
          if (res.code == 200) {
            conf.areaCodeList = res.data || []
            conf.areaCode = (conf.areaCodeList as any)[0]?.areaCode || ''
            conf.selectAreaCodeInfo = (conf.areaCodeList as any)[0] || {}
          }
        },
        complete: () => {
          System.loading(false)
        }
      })
    },
    // 手机区号picker => change事件
    bindChange({ currentOption }: any) {
      conf.value = currentOption
    },
    // 手机区号picker取消btn
    handleAreaCodeCancel() {
      conf.isOpenAreacodeModal = false
    },
    // 手机区号picker确认btn
    handleAreaCodeConfirm() {
      conf.areaCode = (conf.value as any).areaCode
      conf.selectAreaCodeInfo = conf.value
      conf.isOpenAreacodeModal = false
    },
    //获取手机验证码
    handleGetVerificationCode() {
      if (!conf.phone) {
        System.toast(i18n.t('addBankCradModule.correctphoneTip'))
      } else {
        //滑块防抖
        let storTime = Cookie.get('timeVal')
        if (storTime) {
          let cha = new Date().getTime() - storTime > 60 * 1000

          if (cha) {
            conf.num2 = 60
            conf.getNumber()
          } else {
            conf.flag = true
          }
        } else {
          conf.flag = true
          conf.getNumber()
        }
      }
    },
    getNumber() {
      let infoTip = ''
      let str1 = eval('/' + (conf.selectAreaCodeInfo as any).phoneRule + '/')
      if (!str1.test(conf.phone)) {
        infoTip = i18n.t('addBankCradModule.correctphoneTip')
      }

      if (!conf.phone) {
        infoTip = i18n.t('login.phoneNullTip') //手机号不能为空!
      }

      if (!conf.areaCode) {
        infoTip = i18n.t('login.phoneAreaCodeNullTip') //手机区号不能为空!
      }

      if (infoTip) {
        System.toast(infoTip)
        return
      }

      System.loading()
      let timeVal = new Date().getTime()
      Cookie.set('timeVal', timeVal)
      apis.registerSendSms({
        areaCode: conf.areaCode,
        mobile: conf.phone,
        success: (res: any) => {
          if (res.code == 200) {
            let timeVal = new Date().getTime()
            Cookie.set('timeVal', timeVal)
            conf.timeoutChangeStyle2()
            conf.isGetCode = true
          } else {
            System.toast(i18n.t(`code.${res.code}`))
            // conf.slideVerify.resetView()
            Cookie.set('timeVal', 0)
          }
        },
        complete: () => {
          System.loading(false)
          //存储上一次发送验证码的时间戳
          conf.flag = true
        }
      })
    },
    //关闭弹窗
    hideModal(e: any) {
      conf.showBox = !conf.showBox
    },
    changeCode() {
      conf.isOpenAreacodeModal = true
    },
    getList() {
      conf.isOpenPhoneRegistration = (conf.datas as any).account_register_mobile
      conf.isEmail = (conf.datas as any).account_register_email
      conf.isInvitationCode = (conf.datas as any).account_register_invite
      conf.accountTmp = (conf.datas as any).account_tmp
      conf.accountGoogle = (conf.datas as any).account_google

      conf.isShowFoot = conf.isEmail || conf.isOpenPhoneRegistration || conf.accountGoogle

      // 是否开启手机号注册
      if ((conf.datas as any).account_register_mobile) {
        conf.getAreaCode()
      }
    },
    // 倒计时
    timeoutChangeStyle() {
      conf.disabled = true
      if (conf.num < 0) {
        conf.message = i18n.t('login.message')
        conf.num = 60
        conf.disabled = false
      } else {
        conf.message = conf.num + 's'
        conf.num = conf.num - 1
        conf.timers = setTimeout(conf.timeoutChangeStyle, 1000)
      }
    },
    timeoutChangeStyle2() {
      conf.disabled2 = true
      if (conf.num2 < 0) {
        // this.message = 'Get';
        conf.message2 = ''
        conf.message2 = i18n.t('login.message')
        conf.num2 = 60
        conf.disabled2 = false
      } else {
        conf.message2 = conf.num2 + 's'
        conf.num2 = conf.num2 - 1
        conf.timers2 = setTimeout(conf.timeoutChangeStyle2, 1000)
      }
    },
    clearTimers() {
      conf.oldIndex = conf.oldIndex || conf.selectIndex
      clearTimeout(conf.timers)
      conf.message = i18n.t('login.message')
    },
    //邮箱获取验证码
    emailSendCode() {
      if (conf.disabled) return
      if (!conf.email) {
        System.toast(i18n.t('login.emailPlace'))
        return
      } else {
        let storTime = Cookie.get('timeValEmail')
        if (storTime) {
          let cha = new Date().getTime() - storTime > 60 * 1000
          if (cha) {
            conf.num = 60
            conf.getEmail()
          }
        } else {
          conf.getEmail()
        }
      }
    },
    getEmail() {
      System.loading()
      let timeVal = new Date().getTime()
      Cookie.set('timeValEmail', timeVal)
      apis.emailSendCode({
        email: conf.email,
        success: (res: any) => {
          if (res.code == 200) {
            let timeVal = new Date().getTime()
            Cookie.set('timeValEmail', timeVal)
            conf.timeoutChangeStyle()
            conf.isGetCode = true
          } else {
            System.toast(i18n.t(`code.${res.code}`))
            Cookie.set('timeValEmail', 0)
          }
        },
        complete: () => {
          System.loading(false)
        }
      })
    },
    passwordRegister() {
      if (!conf.userName) {
        System.toast(i18n.t('login.accountPlace'))
        return
      }
      if (conf.userName.length < 6) {
        System.toast(i18n.t('login.userLength'))
        return
      }
      let str1 = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d._-]{6,20}$/
      if (!str1.test(conf.userName)) {
        System.toast(i18n.t('login.account10'))
        return
      }
      if (conf.userName.length > 20) {
        System.toast(i18n.t('login.account20'))
        return
      }
      if (!conf.password) {
        System.toast(i18n.t('login.passwordPlace'))
        return
      }
      if (conf.password.length < 6) {
        System.toast(i18n.t('login.digits'))
        return
      }
      if (conf.password.length > 15) {
        System.toast(i18n.t('login.password15'))
        return
      }
      if (conf.password != conf.confirmPassword) {
        System.toast(i18n.t('login.confirmPassword'))
        return
      }
      if (!conf.checkedAge || !conf.checkedAgree) {
        System.toast(i18n.t('login.TickProtocolTip'))
        return
      }
      System.loading()
      apis.registerByAccount({
        country: conf.areaCode,
        userName: conf.userName,
        password: conf.password,
        invitationCode: conf.invitationCode,
        registerType: 1,
        phone: conf.phone,
        phoneCode: conf.phoneVerificationCode,
        success: (res: any) => {
          if (res.code == 200) {
            System.toast(i18n.t('common.registerSuccess'), 'success')
            setTimeout(() => {
              System.router.replace('/login')
            }, 300)
            Cookie.set('timeVal', 0)
            Cookie.set('timeValEmail', 0)
          } else {
            System.toast(i18n.t(`code.${res.code}`))
          }
        },
        complete: () => {
          System.loading(false)
        }
      })
    },
    // 手机注册提交
    handlePhoneRegister() {
      let infoTip = ''
      if (!conf.checkedAge || !conf.checkedAgree) {
        infoTip = i18n.t('login.TickProtocolTip') //请勾选用户注册协议
      }

      if (!this.phone) {
        infoTip = i18n.t('login.phoneNullTip') //手机号不能为空!
      }

      if (!conf.areaCode) {
        infoTip = i18n.t('login.phoneAreaCodeNullTip') //手机区号不能为空!
      }

      if (infoTip) {
        System.toast(infoTip)
        return
      }
      if (!conf.isGetCode) {
        System.toast(i18n.t('addBankCradModule.getCode'))
        return
      }
      System.loading()
      apis.registerByAccount({
        registerType: 2,
        areaCode: conf.areaCode,
        phone: conf.phone,
        phoneCode: conf.phoneVerificationCode,
        invitationCode: conf.invitationCode,
        success: (res: any) => {
          if (res.code == 200) {
            System.toast(i18n.t('common.registerSuccess'), 'success')
            setTimeout(() => {
              sutil.pageBack()
            }, 300)
            Cookie.set('timeVal', 0)
            Cookie.set('timeValEmail', 0)
          } else {
            System.toast(i18n.t(`code.${res.code}`))
          }
        },
        complete: () => {
          System.loading(false)
        }
      })
    },
    emailRegister() {
      if (!conf.email) {
        System.toast(i18n.t('login.emailPlace'))
        return
      }
      if (!conf.emailCode) {
        System.toast(i18n.t('login.codePlace'))
        return
      }
      if (!conf.isGetCode) {
        System.toast(i18n.t('addBankCradModule.getCode'))
        return
      }
      System.loading()
      apis.registerByAccount({
        email: conf.email,
        emailCode: conf.emailCode,
        invitationCode: conf.invitationCode,
        registerType: 3,
        success: (res: any) => {
          if (res.code == 200) {
            System.toast(i18n.t('common.registerSuccess'), 'success')
            setTimeout(() => {
              sutil.pageBack()
            }, 300)
            Cookie.set('timeVal', 0)
            Cookie.set('timeValEmail', 0)
          } else {
            System.toast(i18n.t(`code.${res.code}`))
          }
        },
        complete: () => {
          System.loading(false)
        }
      })
    },
    visitorLogin() {
      System.loading()
      apis.tmpLogin({
        registerType: 5,
        success: (res: any) => {
          if (res.code == 200) {
            sconfig.login(res.data)
            System.toast(i18n.t('common.loginSuccess'), 'success')
            setTimeout(() => {
              sutil.pageBack()
            }, 300)
          } else {
            System.toast(i18n.t(`code.${res.code}`))
          }
        },
        complete: () => {
          System.loading(false)
        }
      })
    }
  })

  conf.vf = svf.getVf(conf, {
    userName: {},
    password: {},
    confirmPassword: {},
    email: {
      ...conf.vobj,
      getCustom: '@.'
    },
    emailCode: conf.vobj,
    invitationCode: conf.vobj,
    goolgeinvitationCode: conf.vobj,
    phone: {
      getNum: true
    },
    phoneVerificationCode: {
      getNum: true
    }
  })

  onMounted(async () => {
    conf.logImag = Cookie.get('appImag') || ''
    const routeParams = System.getRouterParams()
    if (routeParams.code) {
      conf.invitationCode = routeParams.code
      Cookie.set('invitationCode', conf.invitationCode)
      conf.invitationCodeDisabled = true
    }

    //获取当前用户配置信息
    conf.datas = await svalue.getAppConfiguration()
    conf.isRegisterInvite = (conf.datas as any).account_register_invite
    conf.getList()

    conf.BackByCode = routeParams.code
    if (conf.BackByCode) {
      conf.googleLoginCallBackByCode()
    }
    //邮箱 电话号码发送倒计时
    let timeVal = Cookie.get('timeVal')
    let timeValEmail = Cookie.get('timeValEmail')
    let date = new Date().getTime()
    let numberDate = parseInt(((date - timeVal) / 1000).toString())
    let nowDate = parseInt(((date - timeValEmail) / 1000).toString())
    if (60 - nowDate > 1) {
      conf.num = parseInt((60 - nowDate).toString())
      conf.timeoutChangeStyle()
    }
    if (60 - numberDate > 1) {
      conf.num2 = parseInt((60 - numberDate).toString())
      conf.timeoutChangeStyle2()
    }
  })

  return conf
}
