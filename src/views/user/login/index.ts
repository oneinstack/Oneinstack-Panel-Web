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
    selectIndex: 1,
    openEye: false,
    password: '',
    username: '',
    loading: false,
    email: '',
    emailCode: '',
    num: 60,
    num2: 60,
    message: '',
    message2: '',
    disabled: false,
    type: 1,
    phone: '',
    phoneVerificationCode: '',
    areaCode: '',
    selectAreaCodeInfo: {},
    isOpenAreacodeModal: false,
    areaCodeList: [],
    indicatorStyle: `height: 50px;`,
    value: [0],
    timers: 0,
    isGetCode: false,
    isOpenPhoneRegistration: false,
    isEmail: false,
    isInvitationCode: false,
    accountTmp: false,
    isShowFoot: true,
    logImag: '', //applog
    datas: [],
    urlGoogle: '', //谷歌
    weburl: '',
    gooleUserName: '',
    gooleEmail: '',
    gooleUuid: '',
    showBox: false, //打开邀请码窗口
    goolgeinvitationCode: '', //邀请码
    isRegisterInvite: '',
    footClick: 0,
    accountGoogle: false,
    SubjectColor: '#FFA64F',
    lottieJsonData: [],
    BackByCode: '',
    flag: false,
    disabled2: false,
    timers2: 0,
    vf: {},
    vobj: {
      getNum: true,
      getEn: true
    },
    vfFun: (e: Event, name: string) => {
      ;(conf.vf as any)[name](e)
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
          conf.gooleEmail = res.data.email
          conf.getConfig()
        }
      })
    },
    //谷歌
    goGool() {
      conf.windwOpen()
    },
    //h5 登录
    windwOpen() {
      apis.getConfig({
        type: 0,
        success: (res: any) => {
          if (res.code == 200) {
            let datas = res.data
            conf.urlGoogle = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${datas.clientId}&redirect_uri=${datas.redirectUrl}&scope=${datas.scope}&response_type=code&prompt=select_account`
            window.open(conf.urlGoogle, '_self')
          }
        }
      })
    },
    //第三方邀请码登录
    bind() {
      if (conf.goolgeinvitationCode.length <= 0) {
        System.toast(i18n.t('login.invitationCode'))
      } else {
        conf.googleSubmit()
      }
    },
    //谷歌登录api
    googleSubmit(type?: number) {
      let data = {
        invitationCode: conf.goolgeinvitationCode,
        uuid: conf.gooleUuid,
        email: conf.gooleEmail
      }
      //无邀请码
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
            sconfig.login(res.data)
            System.toast(i18n.t('common.loginSuccess'), 'success')
            conf.getLoginSuccess()
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
      //密钥
      let keys =
        'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDL5t81bThdPiJHHkuWGI/0Bf4GRwizzYXyBk5y9LFsgYsE+I3YCiz1NtEisw2B5QbKb9WDSVWgcWHdg6AECexUDbe52FxbopGzIzm9zLq4i+YB26TgdAG/Yf/ZK7x0lwMteydPiOgEDWeVpposA0U83bfh1j6FIlUqgEuipBjPGQIDAQAB'
      conf.showBox = false
      apis.getConfig({
        type: 0,
        success: (res: any) => {
          if (res.code == 200) {
            let datas = res.data
            //将uuid 加密存储 rsa
            conf.gooleUuid = sutil.jsRsa(datas.uuid, keys).toString()
            //是否第一次登录
            apis.checkUserName({
              email: conf.gooleEmail,
              success: (succe: any) => {
                if (succe.code == 200) {
                  conf.showBox = succe.data.result
                  //false 不是第一次登录
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
    handleGoogleLogin() {},
    //关闭弹窗
    hideModal(e: any) {
      conf.showBox = !conf.showBox
    },
    cancelModal(e: any) {},
    getList() {
      //account_login_captcha 验证码登录
      //account_login_mobile手机号登录
      //account_login_email 邮箱登录
      conf.isOpenPhoneRegistration = (conf.datas as any).account_login_mobile
      conf.isEmail = (conf.datas as any).account_login_email
      conf.isInvitationCode = (conf.datas as any).account_login_captcha
      conf.accountTmp = (conf.datas as any).account_tmp
      conf.logImag = (conf.datas as any).app_logo
      conf.accountGoogle = (conf.datas as any).account_google
      //本地存储app 的log图片
      Cookie.set('appImag', conf.logImag)

      if (!conf.isEmail && !conf.isOpenPhoneRegistration && !conf.accountGoogle) {
        conf.isShowFoot = false
      }
      // 是否开启手机号注册
      if ((conf.datas as any).account_login_mobile) {
        // this.isOpenPhoneRegistration = item.account_register_mobile
        conf.getAreaCode()
      }
    },
    //tab => change
    handleTabChange(val: any) {
      conf.isGetCode = false
      conf.selectIndex = val
      // this.num = 0
      conf.clearTimers()
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
          conf.username = ''
          conf.password = ''
          conf.phone = ''
          conf.phoneVerificationCode = ''
          break
        case 3:
          conf.username = ''
          conf.password = ''
          conf.email = ''
          conf.emailCode = ''

          // window.location.href=`https://accounts.google.com/o/oauth2/auth?redirect_uri=http://localhost:8001/googleLogin&access_type=offline&client_id=1046966932868-uc1a3irkpire8o6usn1snr6hpl77ic9o.apps.googleusercontent.com&response_type=code&scope=https://www.googleapis.com/auth/userinfo.email`
          break
      }
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
        setTimeout(() => {}, 50)

        System.toast(i18n.t('addBankCradModule.correctphoneTip'))
      } else {
        //滑块防抖
        let storTime = Cookie.get('timeValLog')
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
      conf.num = 60
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
      Cookie.set('timeValLog', timeVal)
      apis.loginSendSms({
        areaCode: conf.areaCode,
        mobile: conf.phone,
        success: (res: any) => {
          if (res.code == 200) {
            conf.timeoutChangeStyle2()
            conf.isGetCode = true
            let timeVal = new Date().getTime()
            Cookie.set('timeValLog', timeVal)
          } else {
            System.toast(i18n.t(`code.${res.code}`))
          }
        },
        complete: () => {
          System.loading(false)
        }
      })
    },
    changeCode() {
      conf.isOpenAreacodeModal = true
      conf.value = conf.selectAreaCodeInfo as any
    },
    goRegister() {
      System.router.replace('/register')
    },
    timeoutChangeStyle() {
      conf.disabled = true
      if (conf.num < 0) {
        conf.message = i18n.t('login.message')
        conf.num = 60
        conf.disabled = false
      } else {
        conf.message = conf.num + 's'
        conf.num = conf.num - 1
        conf.timers = window.setTimeout(conf.timeoutChangeStyle, 1000)
      }
    },
    timeoutChangeStyle2() {
      conf.disabled2 = true
      if (conf.num2 < 0) {
        conf.message2 = i18n.t('login.message')
        conf.num2 = 60
        conf.disabled2 = false
      } else {
        conf.message2 = conf.num2 + 's'
        conf.num2 = conf.num2 - 1
        conf.timers2 = window.setTimeout(conf.timeoutChangeStyle2, 1000)
      }
    },
    clearTimers() {
      clearTimeout(conf.timers)
      conf.message = i18n.t('login.message')
      conf.num = 60
      conf.disabled = false
    },
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
      Cookie.set('timeValEmailLog', timeVal)
      apis.emailLoginSendCode({
        email: conf.email,
        success: (res: any) => {
          if (res.code == 200) {
            let timeVal = new Date().getTime()
            Cookie.set('timeValEmailLog', timeVal)
            conf.timeoutChangeStyle()
            conf.isGetCode = true
          } else {
            System.toast(i18n.t(`code.${res.code}`))
          }
        },
        complete: () => {
          System.loading(false)
        }
      })
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

      if (conf.password.length < 6) {
        System.toast(i18n.t('login.digits'))
        return
      }

      System.loading()
      apis.login({
        account: conf.username,
        password: conf.password,
        loginType: 1,
        success: (res: any) => {
          console.log(res)
          if (res.code == 200) {
            sconfig.login(res.data)
            System.toast(i18n.t('common.loginSuccess'), 'success')
            conf.getLoginSuccess()
            Cookie.set('timeValLog', '')
            Cookie.set('timeValEmailLog', '')
          } else {
            System.toast(i18n.t(`code.${res.code}`))
          }
        },
        complete: () => {
          System.loading(false)
        }
      })
    },
    emailLogin() {
      let obj: any = {}
      if (!conf.email) {
        System.toast(i18n.t('login.emailPlace'))
        return
      }

      obj = {
        account: conf.email,
        captcha: conf.emailCode,
        loginType: 3
      }
      if (!conf.isInvitationCode) {
        if (!conf.password) {
          System.toast(i18n.t('login.passwordPlace'))
          return
        }
        if (conf.password.length < 6) {
          System.toast(i18n.t('login.digits'))
          return
        }
        obj.password = conf.password
      } else {
        if (!conf.emailCode) {
          System.toast(i18n.t('login.codePlace'))
          return
        }
        if (!conf.isGetCode) {
          System.toast(i18n.t('addBankCradModule.getCode'))
          return
        }
      }
      System.loading()
      apis.login({
        ...obj,
        success: (res: any) => {
          if (res.code == 200) {
            let userInfo = {
              email: conf.email.slice(0, 7),
              ...res.data
            }
            sconfig.login(userInfo)
            System.toast(i18n.t('common.loginSuccess'), 'success')
            conf.getLoginSuccess()
            Cookie.set('timeValLog', '')
            Cookie.set('timeValEmailLog', '')
          } else {
            System.toast(i18n.t(`code.${res.code}`))
          }
        },
        complete: () => {
          System.loading(false)
        }
      })
    },
    //手机号登录
    handlePhoneLogin() {
      let infoTip = ''
      let obj: any = {}
      if (!conf.phone) {
        infoTip = i18n.t('login.phoneNullTip') //手机号不能为空!
      }

      obj = {
        account: conf.phone,
        captcha: conf.phoneVerificationCode,
        loginType: 2,
        areaCode: conf.areaCode
      }
      if (!conf.isInvitationCode) {
        if (!conf.password) {
          System.toast(i18n.t('login.passwordPlace'))
          return
        }
        if (conf.password.length < 6) {
          System.toast(i18n.t('login.digits'))
          return
        }
        obj.password = conf.password
      } else {
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
      }

      System.loading()
      apis.login({
        ...obj,
        success: (res: any) => {
          if (res.code == 200) {
            sconfig.login(res.data)
            System.toast(i18n.t('common.loginSuccess'), 'success')
            conf.getLoginSuccess()
            Cookie.set('timeValLog', '')
            Cookie.set('timeValEmailLog', '')
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
            conf.getLoginSuccess()
          } else {
            System.toast(i18n.t(`code.${res.code}`))
          }
        },
        complete: () => {
          System.loading(false)
        }
      })
    },
    getLoginSuccess() {
      reset() // 重置会话级缓存
      setTimeout(() => {
        sutil.pageBack()
      }, 300)
    }
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
    const routeParams = System.getRouterParams()
    conf.goolgeinvitationCode = Cookie.get('invitationCode') || ''
    if (routeParams && routeParams.type) {
      conf.type = routeParams.type
    }

    // conf.getConfig()
    //获取当前用户配置信息
    conf.datas = await svalue.getAppConfiguration()
    conf.isRegisterInvite = (conf.datas as any).account_register_invite
    conf.getList()

    // #ifdef H5
    //获取登录谷歌后 重定向地址的参数
    let url = window.location.href
    let obj = sutil.getQueryParams(url)
    conf.BackByCode = obj.code

    if (conf.BackByCode) {
      conf.googleLoginCallBackByCode()
    }
    // #endvar

    //邮箱 电话号码发送倒计时
    let timeVal = Cookie.get('timeValLog')
    let timeValEmail = Cookie.get('timeValEmailLog')
    let date = new Date().getTime()

    let numberDate = parseInt(((date - timeVal) / 1000).toString())
    let nowEmai = parseInt(((date - timeValEmail) / 1000).toString())
    // email
    if (60 - nowEmai > 1) {
      conf.num = parseInt((60 - nowEmai).toString())
      conf.timeoutChangeStyle()
    }
    //手机
    if (60 - numberDate > 1) {
      conf.num2 = parseInt((60 - numberDate).toString())
      conf.timeoutChangeStyle2()
    }
  })

  return conf
}
