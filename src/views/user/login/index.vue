<template>
  <x-page noHeader noFooter>
    <div class="login-page">
      <x-statusbar />
      <BgImg :pageUrl="'login'" />
      <div class="loginBox">
        <div class="content">
          <div class="lottie-ani" style="width: 550rem; height: 220rem">
            <lottie-player autoplay loop mode="normal" src="/static/lottie/welcome.json" />
          </div>
          <div class="otp">
            <template v-if="conf.selectIndex == 3">
              <div class="otp-item">
                <div class="area" @click="conf.changeCode">
                  +{{ conf.areaCode }}
                  <van-icon class="cuIcon-right" name="arrow-down" color="#fff" />
                </div>
                <div class="input">
                  <input
                    :placeholder="$t('login.phonePlace')"
                    v-model.trim="conf.phone"
                    @input="conf.vfFun($event, 'phone')"
                  />
                </div>
              </div>
              <div class="otp-item" v-if="conf.selectIndex == 3 && conf.isInvitationCode">
                <div class="input">
                  <input
                    :placeholder="$t('login.codePlace')"
                    v-model.trim="conf.phoneVerificationCode"
                    @input="conf.vfFun($event, 'phoneVerificationCode')"
                  />
                </div>
                <div class="code active-code" @click="conf.handleGetVerificationCode">
                  {{ conf.message2 || $t('login.message') }}
                </div>
              </div>
              <div class="otp-item" v-if="conf.selectIndex == 3 && !conf.isInvitationCode">
                <img class="phone-img" src="/static/img/log-pass.png" />
                <div class="input">
                  <input
                    :class="!conf.openEye && conf.password ? 'account-input' : ''"
                    :placeholder="$t('login.passwordPlace')"
                    v-model.trim="conf.password"
                    maxlength="15"
                    @input="conf.vfFun($event, 'password')"
                  />
                </div>
                <img @click="conf.openEye = !conf.openEye" class="eye-img" src="/static/img/eye-close2.png" />
              </div>
            </template>
            <div class="otp-item" v-if="conf.selectIndex == 1">
              <div class="input">
                <input
                  :placeholder="$t('login.accountPlace')"
                  v-model.trim="conf.username"
                  maxlength="64"
                  @input="conf.vfFun($event, 'username')"
                />
              </div>
            </div>
            <div class="otp-item" v-if="conf.selectIndex == 1">
              <div class="input">
                <input
                  :class="!conf.openEye && conf.password ? 'account-input' : ''"
                  :placeholder="$t('login.passwordPlace')"
                  v-model.trim="conf.password"
                  maxlength="15"
                  @input="conf.vfFun($event, 'password')"
                />
              </div>
              <img
                v-if="!conf.openEye"
                @click="conf.openEye = !conf.openEye"
                class="eye-img"
                src="/static/img/eye-close2.svg"
              />
              <img v-else @click="conf.openEye = !conf.openEye" class="eye-img" src="/static/img/eye-open.svg" />
            </div>
            <div class="otp-item" v-if="conf.selectIndex == 2">
              <div class="input">
                <input
                  :placeholder="$t('login.emailPlace')"
                  v-model.trim="conf.email"
                  @input="conf.vfFun($event, 'email')"
                />
              </div>
            </div>
            <div class="otp-item" v-if="conf.selectIndex == 2 && conf.isInvitationCode">
              <div class="input">
                <input
                  :placeholder="$t('login.codePlace')"
                  v-model.trim="conf.emailCode"
                  @input="conf.vfFun($event, 'emailCode')"
                />
              </div>
              <div class="code active-code" @click="conf.emailSendCode">
                {{ conf.message || $t('login.message') }}
              </div>
            </div>
            <div class="otp-item" v-if="conf.selectIndex == 2 && !conf.isInvitationCode">
              <img class="phone-img" src="/static/img/log-pass.png" />
              <div class="input">
                <input
                  :class="!conf.openEye && conf.password ? 'account-input' : ''"
                  :placeholder="$t('login.passwordPlace')"
                  v-model.trim="conf.password"
                  maxlength="15"
                  @input="conf.vfFun($event, 'password')"
                />
              </div>
              <img @click="conf.openEye = !conf.openEye" class="eye-img" src="/static/img/eye-close2.png" />
            </div>
          </div>

          <button class="login-btn" @click="conf.submit" :disabled="conf.loading" v-if="conf.selectIndex == 1">
            {{ $t('login.login') }}
          </button>
          <button class="login-btn" @click="conf.emailLogin" :disabled="conf.loading" v-if="conf.selectIndex == 2">
            {{ $t('login.login') }}
          </button>
          <button
            class="login-btn"
            @click="conf.handlePhoneLogin"
            :disabled="conf.loading"
            v-if="conf.selectIndex == 3"
          >
            {{ $t('login.login') }}
          </button>
          <div class="tip">
            {{ $t('login.needAccount') }}
            <div @click="conf.goRegister">{{ $t('login.register') }}</div>
            <div class="visltor" v-if="conf.accountTmp">
              <span style="color: #fff">{{ $t('login.or') }}</span>
              <div class="visitor-btn" @click="conf.visitorLogin">{{ $t('login.visitorLogin') }}</div>
            </div>
          </div>

          <!-- 邮箱 -->
          <!-- 手机号码 -->
          <div class="foot" v-if="conf.isShowFoot">
            <div class="foot-title">
              <span>{{ $t('login.loginMethods') }}</span>
            </div>
            <div class="foot-item">
              <img
                v-if="conf.selectIndex !== 1"
                class="foot-img"
                :class="conf.footClick == 1 ? 'footClickStyle' : ''"
                src="/static/img/foot-user.png"
                mode=""
                @click="conf.handleTabChange(1)"
                @touchstart="conf.handleMenuTouchstart(1)"
                @touchend="conf.handleMenuTouchend()"
              />
              <img
                v-if="conf.selectIndex !== 2 && conf.isEmail"
                class="foot-img"
                :class="conf.footClick == 2 ? 'footClickStyle' : ''"
                src="/static/img/foot-email.png"
                mode=""
                @click="conf.handleTabChange(2)"
                @touchstart="conf.handleMenuTouchstart(2)"
                @touchend="conf.handleMenuTouchend()"
              />
              <img
                v-if="conf.selectIndex !== 3 && conf.isOpenPhoneRegistration"
                class="foot-img"
                :class="conf.footClick == 3 ? 'footClickStyle' : ''"
                src="/static/img/foot-phone.png"
                mode=""
                @click="conf.handleTabChange(3)"
                @touchstart="conf.handleMenuTouchstart(3)"
                @touchend="conf.handleMenuTouchend()"
              />
              <img
                class="foot-img"
                v-if="conf.accountGoogle && !System.isNative"
                src="/static/img/google-log.png"
                mode=""
                @click="conf.goGool"
                id="myButton"
                :class="conf.footClick == 4 ? 'footClickStyle' : ''"
                @touchstart="conf.handleMenuTouchstart(4)"
                @touchend="conf.handleMenuTouchend()"
              />
            </div>
          </div>
          <!-- 手机区号模态框 -->
          <div
            class="cu-modal bottom-modal"
            ref="cuModal"
            :class="conf.isOpenAreacodeModal ? 'show' : ''"
            @click="conf.cancelModal"
          >
            <div class="cu-dialog">
              <div class="padding-xl">
                <!-- picker -->
                <van-popup class="popup-bottom-center" v-model:show="conf.isOpenAreacodeModal" round position="bottom">
                  <!-- btns -->
                  <div class="model-btn" v-if="conf.areaCodeList.length > 0">
                    <div class="left-btn" @click="conf.handleAreaCodeCancel">
                      {{ $t('agencyCenterModule.cancellation') }}
                    </div>
                    <div class="right-btn" @click="conf.handleAreaCodeConfirm">
                      {{ $t('agencyCenterModule.determine') }}
                    </div>
                  </div>
                  <div class="model-btn nodata" v-else>
                    <div class="left-btn"></div>
                    <div class="right-btn" @click="conf.handleAreaCodeCancel">
                      <img class="rigImg" src="/static/img/close.png" mode="" />
                    </div>
                  </div>
                  <van-picker
                    v-if="conf.areaCodeList.length > 0"
                    :show-toolbar="false"
                    :columns="conf.areaCodeList"
                    @scroll-into="conf.bindChange"
                  >
                    <template #option="scope">
                      <div>{{ scope.showName + ' ' + scope.areaCode }}</div>
                    </template>
                  </van-picker>
                  <no-data v-else :top="0"></no-data>
                </van-popup>
              </div>
            </div>
          </div>

          <!-- 手机号 / 密码 绑定弹窗 -->
          <div
            class="cu-modal"
            :class="conf.showBox == true ? 'show' : ''"
            v-if="conf.showBox && conf.isRegisterInvite"
          >
            <div class="cu-dialog showbox">
              <!-- {{showBox+'====='+isRegisterInvite}} -->
              <div class="cu-bar bg-white justify-end">
                <div class="action" @tap="conf.hideModal">
                  <span class="cuIcon-close text-red"></span>
                </div>
              </div>
              <div class="showBox-log">
                <img class="showimg" src="/static/img/login-codeImg.png" mode="" />
              </div>
              <div class="showBox-content">
                <span>{{ $t('login.invitationCode') }}</span>
                <div class="inputBox">
                  <img class="imgIcon" src="/static/img/down-icon.png" mode="" />
                  <input
                    class="uni-input"
                    type="text"
                    v-model="conf.goolgeinvitationCode"
                    :placeholder="$t('login.referralPlace')"
                    @input="conf.vfFun($event, 'goolgeinvitationCode')"
                  />
                </div>
              </div>
              <div class="bind-btn" @click="conf.bind">{{ $t('home.bind') }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </x-page>
</template>

<script setup lang="ts">
import { apis } from '@/api'
import i18n from '@/lang'
import { reset } from '@/sstore/index.js'
import { sconfig } from '@/sstore/sconfig'
import sutil from '@/sstore/sutil'
import { svalue } from '@/sstore/svalue'
import svf from '@/sstore/svf'
import System from '@/utils/System'
import { onMounted, reactive } from 'vue'
import BgImg from './components/bgImg.vue'

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
</script>

<style lang="less" scoped>
.login-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
}
.loginBox {
  padding-top: 100rem;
  height: 100%;
  position: relative;

  .input-placeholder {
    // font-size: 28rem;
    color: #aaaaaa;
  }

  .content {
    padding: 0 48rem;

    .select {
      display: flex;
      height: 100rem;
      margin-top: 20rem;

      .select-item {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        color: rgb(37, 37, 41);
        font-size: 28rem;
        font-weight: bold;

        &.select-active {
          border-bottom: 4rem solid #ffa64f;
          // background: linear-gradient(#EB602D 0%,#FFA64F 100%);
          // background-image: linear-gradient(rgb(255, 255, 255), rgb(249, 240, 255));
          background-image: linear-gradient(rgb(255, 255, 255), #ffa64f10);
        }
      }
    }

    .otp {
      .otp-item {
        height: 88rem;
        // border-bottom: 2rem solid rgb(220, 220, 229);
        // padding: 44rem 0rem;
        display: flex;
        align-items: center;
        // margin-top: 24rem;
        border-radius: 80rem;
        background: #ffffff30;
        padding: 0rem 32rem;
        margin-bottom: 38rem;

        .phone-img {
          width: 32rem;
          height: 32rem;
        }

        .area {
          border-right: 2rem solid #fff;
          padding-left: 8rem;
          padding-right: 16rem;
          position: relative;
          width: 130rem;
          color: #fff;

          .cuIcon-right {
            position: absolute;
            right: 20rem;
            font-size: 32rem;
          }
        }

        .input {
          padding: 0rem 20rem;
          --placeholderTextColor: #000;
          color: rgb(37, 37, 41);
          font-size: 28rem;
          flex: 1;

          input {
            width: 100%;
            color: #fff;

            &.account-input {
              -webkit-text-security: disc;
              text-security: disc;
            }

            &::placeholder {
              color: #fff;
            }
          }
        }

        .code {
          // border-radius: 8rem;
          // box-shadow: rgb(173, 179, 200) 0px 4rem 2rem 0px;
          // background-image: linear-gradient(rgba(242, 246, 255, 0.7), rgba(223, 227, 237, 0.7));
          // padding: 16rem 24rem;
          color: rgb(132, 132, 144);
          font-size: 24rem;
        }

        .active-code {
          display: flex;
          align-items: center;
          // background: #fff;
          height: 40rem;
          text-align: center;

          // width: 100rem;
          padding: 0 10rem;
          color: #ff7502;
          border-radius: 35rem;
          border: 2rem solid #f5813d;
          box-shadow: #ffa64f 0px 2rem 2rem 0px;
        }

        .eye-img {
          width: 32rem;
          height: 32rem;
        }
      }
    }

    .login-btn {
      width: 100%;
      margin: 62rem 0rem 0;
      height: 80rem;
      border-radius: 48rem;

      font-size: 28rem;
      color: #fff;
      display: flex;
      justify-content: center;
      align-items: center;
      background-image: linear-gradient(#ffa64f, #eb602d);
    }

    .visitor-btn {
      color: #ffa64f;
      text-align: right;
      font-size: 30rem;
      // padding: 25rem 0rem 30rem;
    }

    .tip {
      margin-top: 24rem;
      // padding: 24rem;
      display: flex;
      justify-content: center;
      align-items: center;
      color: #fff;
      font-size: 28rem;

      div {
        color: #ff7502;
        font-weight: bold;
        margin-left: 8rem;
      }
      .visltor {
        display: flex;
        justify-content: center;
        color: #aaaaaa;
        span {
          margin: 0 6rem;
        }
      }
    }
  }
}

.foot {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  text-align: center;
  // margin-top: 96rem;
  max-width: 500px;

  .foot-title {
    color: #fff;
    font-size: 24rem;
    height: 40rem;
    display: flex;
    align-items: center;
    justify-content: center;

    &::before,
    &::after {
      content: '';
      background-color: #ffffff80;
      width: 160rem;
      height: 1px;
    }

    span {
      margin: 0 15rem;
    }
  }

  .foot-img {
    width: 80rem;
    height: 80rem;
    margin: 0 36rem;
  }

  .foot-item {
    height: calc(200rem - 20px);
    display: flex;
    align-items: center;
    justify-content: center;
    .footClickStyle {
      box-shadow: 0rem 4rem 12rem 6rem #999;
      border-radius: 50%;
    }
  }
}

.cu-dialog {
  // height: 356rem;
  border-radius: 40rem 40rem 0rem 0rem !important;
  max-width: 500px !important;
  margin: 0 auto;
}

.padding-xl {
  padding: 0rem;
}

.model-btn {
  height: 98rem;
  display: flex;
  justify-content: space-around;
  align-items: center;
  font-size: 36rem;
  font-weight: 600;
  background: #fff;

  .left-btn {
    color: #a8a8a8;
  }

  .right-btn {
    background: linear-gradient(#eb602d, #ffa64f);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}

.nodata {
  display: flex;
  justify-content: end;
  background-color: #f8f8f8;

  .rigImg {
    width: 26rem;
    height: 26rem;
    margin: 0 30rem;
  }
}

.picker-view {
  width: 100%;
  height: 308rem;
}

.item {
  line-height: 100rem;
  text-align: center;
  background: #fff !important;
  color: #000000;
}
.cu-modal {
  z-index: 2 !important;

  .cu-dialog {
    background-color: #fff;
    // width: 560rem;
    width: 100%;
    max-width: 500px;
    margin: auto;

    .cu-bar {
      height: 70rem;
      min-height: 70rem;
    }

    .showimg {
      width: 228rem;
      height: 228rem;
    }

    .text-red {
      color: #cccccc;
      font-weight: bold;
      font-size: 28rem;
    }

    .showBox-content {
      font-size: 32rem;
      color: #333;
    }

    .tip {
      text-align: center;
      color: #666666;
      font-size: 24rem;
      margin-top: 15rem;
      padding: 0 15rem;
    }

    .bind-btn {
      margin: 30rem auto 50rem;
      color: #fff;
      font-size: 40rem;
      height: 80rem;
      line-height: 80rem;
      width: 418rem;
      border-radius: 40rem;
      background: linear-gradient(to top, #eb602d, #ffa64f);
    }
  }
}
.showbox {
  border-radius: 35rem !important;
  .imgIcon {
    width: 46rem;
    height: 43rem;
  }
  .inputBox {
    display: flex;
    background-color: #fff6e6;
    border-radius: 50rem;
    padding: 0 30rem;
    width: 85%;
    align-items: center;
    margin: 50rem auto;
    box-sizing: border-box;
  }
  .tip {
    justify-content: center;
  }
  span {
    font-weight: bold;
    font-size: 32rem;
    margin: 30rem 0;
    width: 90%;
  }
}

.uni-input {
  flex: 1;
  height: 100rem;
  line-height: 100rem;
  font-size: 32rem;
  color: #000 !important;
  font-weight: bolder !important;
  padding: 0rem 10rem;
  // color: #AAAAAA;
  opacity: 0.4;
  font-size: 32rem;
  background-color: #fffbf5;
  border-radius: 35rem;
}
.welcome {
  // margin-top: 220rem;
  // margin-bottom: 50rem;
  color: #ffffff;
  font-size: 88rem;
  font-weight: 600;
}

.input {
  color: #fff !important;
}

.uni-input-placeholder.input-placeholder {
  // color: rgba($color: #fff, $alpha: 0.7);
  color: #fff;
  // font-weight: bold;
  // font-size: 32rem;
}
</style>
