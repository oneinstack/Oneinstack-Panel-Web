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
                src="/static/theme/blue/foot-user.png"
                mode=""
                @click="conf.handleTabChange(1)"
                @touchstart="conf.handleMenuTouchstart(1)"
                @touchend="conf.handleMenuTouchend()"
              />
              <img
                v-if="conf.selectIndex !== 2 && conf.isEmail"
                class="foot-img"
                :class="conf.footClick == 2 ? 'footClickStyle' : ''"
                src="/static/theme/blue/foot-email.png"
                mode=""
                @click="conf.handleTabChange(2)"
                @touchstart="conf.handleMenuTouchstart(2)"
                @touchend="conf.handleMenuTouchend()"
              />
              <img
                v-if="conf.selectIndex !== 3 && conf.isOpenPhoneRegistration"
                class="foot-img"
                :class="conf.footClick == 3 ? 'footClickStyle' : ''"
                src="/static/theme/blue/foot-phone.png"
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
import BgImg from './theme/blue/components/bgImg.vue'
import { index } from './index'
import System from '@/utils/System'

const conf = index()
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
  display: flex;
  flex-direction: column;
  justify-content: center;
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
      margin-top: 80rem;
      .otp-item {
        height: 88rem;
        // border-bottom: 2rem solid rgb(220, 220, 229);
        // padding: 44rem 0rem;
        display: flex;
        align-items: center;
        // margin-top: 24rem;
        border-radius: 80rem;
        background: #ffffff40;
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
          // box-shadow: rgb(173, 179, 200) 0rem 4rem 2rem 0rem;
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
          color: #006fff;
          border-radius: 35rem;
          border: 2rem solid #006fff;
          box-shadow: #006fff 0rem 2rem 2rem 0rem;
        }

        .eye-img {
          width: 32rem;
          height: 32rem;
        }
      }
    }

    .login-btn {
      width: 100%;
      margin: 120rem 0rem 0;
      height: 96rem;
      border-radius: 48rem;

      font-size: 28rem;
      color: #fff;
      display: flex;
      justify-content: center;
      align-items: center;
      background: linear-gradient(93.51deg, #006fff 5.72%, #087bff 86.61%);
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
        color: #006fff;
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
  bottom: 25rem;
  left: 0;
  width: 100%;
  text-align: center;
  // margin-top: 96rem;
  max-width: 750rem;

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
      height: 2rem;
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
    height: calc(200rem - 40rem);
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
  max-width: 750rem !important;
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
    background: linear-gradient(93.51deg, #006fff 5.72%, #087bff 86.61%);
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
    max-width: 750rem;
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
