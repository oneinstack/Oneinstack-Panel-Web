<template>
  <x-page noHeader noFooter>
    <div class="register-page">
      <x-statusbar />
      <bgImg :pageUrl="'register'" />
      <div class="loginBox">
        <div class="content">
          <div class="lottie-ani" style="width: 550rem; height: 220rem">
            <lottie-player autoplay loop mode="normal" src="/static/lottie/welcome.json" />
          </div>
          <div class="otp">
            <div class="otp-item" v-if="conf.isInvitationCode">
              <!-- <img class="phone-img" src="/static/img/log-code.png"/> -->
              <div class="input">
                <input
                  :placeholder="$t('login.referralPlace')"
                  v-model.trim="conf.invitationCode"
                  :disabled="conf.invitationCodeDisabled"
                  @input="conf.vfFun($event, 'invitationCode')"
                />
              </div>
            </div>
            <div class="otp-item" v-if="conf.selectIndex == 1">
              <!-- <img class="phone-img" src="/static/img/log-number.png"/> -->
              <div class="input">
                <input
                  type="text"
                  :placeholder="$t('login.accountPlace')"
                  :maxlength="20"
                  v-model.trim="conf.userName"
                  @input="conf.vfFun($event, 'userName')"
                />
              </div>
            </div>
            <div class="otp-item" v-if="conf.selectIndex == 1">
              <!-- <img class="phone-img" src="/static/img/log-pass.png"/> -->
              <div class="input">
                <input
                  :type="conf.openEye ? 'text' : 'password'"
                  :placeholder="$t('login.passwordPlace')"
                  :maxlength="15"
                  v-model.trim="conf.password"
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
            <div class="otp-item" v-if="conf.selectIndex == 1">
              <!-- <img class="phone-img" src="/static/img/confirmPassword.png"/> -->
              <div class="input">
                <input
                  :type="conf.confirmEye ? 'text' : 'password'"
                  :placeholder="$t('login.confirmPlace')"
                  :maxlength="15"
                  v-model.trim="conf.confirmPassword"
                  @input="conf.vfFun($event, 'confirmPassword')"
                />
              </div>
              <img
                v-if="!conf.confirmEye"
                @click="conf.confirmEye = !conf.confirmEye"
                class="eye-img"
                src="/static/img/eye-close2.svg"
              />
              <img v-else @click="conf.confirmEye = !conf.confirmEye" class="eye-img" src="/static/img/eye-open.svg" />
            </div>
            <!-- 手机号注册 -->
            <template v-if="conf.isOpenPhoneRegistration && conf.selectIndex == 3">
              <div class="otp-item">
                <!-- <img class="phone-img" src="/static/img/phone.png"/> -->
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
              <div class="otp-item">
                <!-- <img class="phone-img" src="/static/img/auth-code.png"/> -->
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
            </template>

            <div class="otp-item" v-if="conf.selectIndex == 2">
              <!-- <img class="phone-img" src="/static/img/email.png"/> -->
              <div class="input">
                <input
                  :placeholder="$t('login.emailPlace')"
                  v-model.trim="conf.email"
                  @input="conf.vfFun($event, 'email')"
                />
              </div>
            </div>
            <div class="otp-item" v-if="conf.selectIndex == 2">
              <!-- <img class="phone-img" src="/static/img/auth-code.png"/> -->
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
          </div>
          <div class="check">
            <img
              v-if="!conf.checkedAge"
              @click="conf.checkedAge = !conf.checkedAge"
              class="check-img"
              src="/static/img/uncheck.png"
            />
            <img v-else @click="conf.checkedAge = !conf.checkedAge" class="check-img" src="/static/img/check.png" />
            <span style="color: #fff">{{ $t('login.confirmChcek') }}</span>
          </div>
          <div class="login-btn" @click="conf.passwordRegister" v-if="conf.selectIndex == 1">
            {{ $t('login.register') }}
          </div>
          <div class="login-btn" @click="conf.emailRegister" v-if="conf.selectIndex == 2">
            {{ $t('login.register') }}
          </div>
          <div class="login-btn" @click="conf.handlePhoneRegister" v-if="conf.selectIndex == 3">
            {{ $t('login.register') }}
          </div>
          <div class="tip">
            {{ $t('login.already') + '?' }}
            <div @click="System.router.replace('/login')">{{ $t('login.login') }}</div>
            <div class="visltor" v-if="conf.accountTmp">
              <template v-if="conf.isShowFoot">
                <span style="color: #fff">or</span>
                <div class="visitor-btn" @click="conf.handleMore">{{ $t('login.moreWays') }}</div>
              </template>
            </div>
          </div>

          <!-- 邀请码弹窗 -->
          <div
            class="cu-modal"
            :class="conf.showBox == true ? 'show' : ''"
            v-if="conf.showBox && conf.isRegisterInvite"
          >
            <div class="cu-dialog showbox">
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

      <!-- 手机区号模态框 -->
      <div class="cu-modal bottom-modal" :class="conf.isOpenAreacodeModal ? 'show' : ''">
        <div class="cu-dialog">
          <div class="padding-xl">
            <van-popup v-model:show="conf.isOpenAreacodeModal" round position="bottom">
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
              <!-- picker -->
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

      <div class="cu-modal bottom-modal" :class="conf.isMore ? 'show' : ''">
        <van-popup v-model:show="conf.isMore" round position="bottom" class="cu-dialog" style="height: 250rem">
          <div class="close-icon" @click.stop="conf.handleCloseMore">×</div>
          <div class="padding-xl">
            <div class="foot" style="margin-top: 50rem">
              <div class="foot-title">
                <img class="solid-img" src="/static/img/log-solid.png" mode="" />
                <span>{{ $t('login.registerMethods') }}</span>

                <img class="solid-img" src="/static/img/log-solid.png" mode="" />
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
                  v-if="conf.isEmail && conf.selectIndex !== 2"
                  class="foot-img"
                  :class="conf.footClick == 2 ? 'footClickStyle' : ''"
                  src="/static/img/foot-email.png"
                  mode=""
                  @click="conf.handleTabChange(2)"
                  @touchstart="conf.handleMenuTouchstart(2)"
                  @touchend="conf.handleMenuTouchend()"
                />
                <img
                  v-if="conf.isOpenPhoneRegistration && conf.selectIndex !== 3"
                  class="foot-img"
                  :class="conf.footClick == 3 ? 'footClickStyle' : ''"
                  src="/static/img/foot-phone.png"
                  mode=""
                  @click="conf.handleTabChange(3)"
                  @touchstart="conf.handleMenuTouchstart(3)"
                  @touchend="conf.handleMenuTouchend()"
                />
                <!-- #ifdef H5 -->
                <img
                  class="foot-img"
                  v-if="conf.accountGoogle && !System.isNative"
                  :class="conf.footClick == 4 ? 'footClickStyle' : ''"
                  src="/static/img/google-log.png"
                  mode=""
                  @click="conf.goGool"
                  id="myButton"
                  @touchstart="conf.handleMenuTouchstart(4)"
                  @touchend="conf.handleMenuTouchend()"
                />
                <!-- #endif -->
              </div>
            </div>
          </div>
        </van-popup>
      </div>
    </div>
  </x-page>
</template>

<script lang="ts" setup>
import { apis } from '@/api'
import i18n from '@/lang'
import sconfig from '@/sstore/sconfig'
import sutil from '@/sstore/sutil'
import { svalue } from '@/sstore/svalue'
import svf from '@/sstore/svf'
import System from '@/utils/System'
import BgImg from '@/views/user/login/components/bgImg.vue'
import { onMounted, reactive } from 'vue'

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
</script>

<style lang="less" scoped>
.register-page {
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
          background-image: linear-gradient(white, #ffa64f10);
        }
      }
    }

    .otp {
      border: 1rem solid transparent;

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
          --placeholderTextColor: #bbbbc5;
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

    .check {
      display: flex;
      align-items: center;
      margin: 0rem 0rem 10rem;

      .check-img {
        width: 40rem;
        height: 40rem;
        flex-shrink: 0;
      }

      span {
        margin-left: 16rem;
        font-size: 27rem;
        white-space: pre-wrap;
        overflow-wrap: break-word;
      }
    }

    .login-btn {
      margin: 40rem 0rem 0;
      height: 80rem;
      border-radius: 48rem;

      font-size: 28rem;
      color: #fff;
      display: flex;
      justify-content: center;
      align-items: center;
      background-image: linear-gradient(#ffa64f, #eb602d);
    }

    .tip {
      padding: 24rem;
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
  // position: absolute;
  // bottom: 0;
  // left: 0;
  // width: 100%;
  text-align: center;
  // margin-top: 96rem;
  max-width: 500px;

  .foot-title {
    color: #bbbbc5;
    font-size: 24rem;
    height: 40rem;
    display: flex;
    align-items: center;
    justify-content: center;

    span {
      margin: 0 15rem;
    }

    .solid-img {
      width: 160rem;
      height: 4rem;
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
.showbox {
  border-radius: 35rem !important;
  // position: absolute;
  // top: 0;
  // z-index: 1000 !important;
  background-color: #fff;
  max-width: 600rem !important;
  .showimg {
    width: 228rem;
    height: 228rem;
  }
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
  background-color: transparent;
}

.close-icon {
  position: absolute;
  right: 20rem;
  top: -10rem;
  color: #bbbbc5;
  font-size: 54rem;
}

input :-webkit-autofill {
  -webkit-text-fill-color: #fff !important;
  -webkit-box-shadow: 0 0 0 1000px #bbbbc5 inset !important;
}

.uni-input-placeholder.input-placeholder {
  // color: rgba($color: #fff, $alpha: 0.7);
  color: #fff;
  // font-weight: bold;
  // font-size: 32rem;
}
</style>
