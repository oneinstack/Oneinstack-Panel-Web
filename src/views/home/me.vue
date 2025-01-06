<template>
  <x-page no-header tabbar>
    <div class="head-fixd" v-if="conf.isHeadFixed">
      <x-statusbar />
      <div class="head-user" @click="conf.goLogin('/user/personal/personal')">
        <img
          class="head-img"
          :src="
            sconfig.userInfo && sconfig.userInfo.userImgUrl
              ? sconfig.userInfo.userImgUrl
              : '/static/img/default-header.png'
          "
        />
        <span v-if="sconfig.userInfo">
          {{
            sconfig.userInfo.userNickname || sconfig.userInfo.userName || sconfig.userInfo.email || $t('me.userName')
          }}
        </span>
        <span v-else>{{ $t('me.userName') }}</span>
      </div>
    </div>
    <div class="head">
      <x-statusbar />
      <div style="height: 578rem; position: relative">
        <div class="stting" @click.stop="conf.pageToSettings">
          <VSIcon class="setting-img" lib="blue" name="settings" :size="52" />
        </div>
        <div class="user-content">
          <div class="user" @click="conf.goLogin('/user/personal/personal')">
            <div class="user-avatar">
              <img
                class="avatar-img"
                :src="sconfig.userInfo.userImgUrl"
                v-if="sconfig.userInfo && sconfig.userInfo.userImgUrl"
              />
              <img class="avatar-img" src="/static/img/default-header.png" v-else />
            </div>
            <div class="user-info" v-if="sconfig.userInfo">
              <div class="name">
                <span class="name-span">
                  {{
                    sconfig.userInfo.userNickname ||
                    sconfig.userInfo.userName ||
                    sconfig.userInfo.email ||
                    $t('me.userName')
                  }}
                </span>

                <span class="vip-icon">
                  <img
                    class="vip2"
                    :src="'/static/img/VIP/v' + conf.userVipLevel + '.svg'"
                    mode="widthFix"
                    style="width: 80rem !important"
                  />
                </span>
              </div>
              <div class="uid">UID:{{ sconfig.userInfo.uid || '******' }}</div>
            </div>
            <div class="user-info" v-else>
              <div class="name">{{ $t('me.userName') }}</div>
              <div class="uid">UID:******</div>
            </div>
          </div>
          <div class="grade">
            <div class="grade-img"></div>
            <div class="grade-info">
              <div class="level">
                <div class="left-content">
                  <div class="left-total">{{ $t('wallet.topTitle') }}:</div>
                  <div class="left-icon">
                    <div>
                      <div style="height: 16rem" v-if="!conf.openEye"></div>
                      {{
                        conf.openEye
                          ? conf.defaultCoin.coinSymbol + sutil.dataHandling(conf.total_money)
                          : conf.str_money
                      }}
                    </div>
                    <img
                      v-if="!conf.openEye && sconfig.userInfo"
                      @click.prevent="conf.handleEyeClick()"
                      class="eye-img"
                      src="/static/img/color_open_eye.png"
                    />
                    <img
                      v-if="conf.openEye && sconfig.userInfo"
                      @click.prevent="conf.handleEyeClick()"
                      class="eye-img"
                      src="/static/img/color_close_eye.png"
                    />
                  </div>
                </div>
                <div
                  class="select"
                  style="justify-content: center; align-items: center"
                  v-if="conf.coinLosding && sconfig.userInfo"
                >
                  <van-loading type="spinner" />
                </div>
                <div class="select" v-else>
                  <div class="select-item" @click="conf.handleCilckImg('Recharge', $event)">
                    <img src="/static/img/wallet/recharge-new.png" />
                    <span>{{ $t('wallet.Recharge') }}</span>
                  </div>
                  <!-- 推广用户不可提现 -->
                  <div class="select-item" @click="conf.handleCilckImg('Withdraw', $event)">
                    <img src="/static/img/wallet/withdraw-new.png" />
                    <span>{{ $t('wallet.Withdrawal') }}</span>
                  </div>
                  <div
                    class="select-item"
                    @click="conf.handleCilckImg('Remittance', $event)"
                    v-if="conf.userWalletList.length > 1"
                  >
                    <img src="/static/img/wallet/remittance-new.png" />
                    <span>{{ $t('wallet.Remittance') }}</span>
                  </div>
                  <div class="select-item" @click="conf.handleCilckImg('CentralWallet', $event)">
                    <img src="/static/img/wallet/center-new.png" />
                    <span>{{ $t('wallet.central') }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- 银行卡绑定提示框-->
    <cuModal :showNumberBox="conf.showNumberBox" @handleCloseBindDialog="conf.handleCloseBindDialog" />
    <div class="menu-list">
      <div class="menu-item">
        <div v-for="(item, index) of conf.menu1.flat()" :key="index">
          <van-cell
            is-link
            @click="conf.handle(item)"
            v-if="typeof item.isShow === 'function' ? item.isShow() : item.isShow"
          >
            <!-- 使用 title 插槽来自定义标题 -->
            <template #icon>
              <div class="flex items-center">
                <img class="menu-icon" :src="item.leftImg" />
              </div>
            </template>
            <template #title>
              <span>{{ item.name.indexOf('me.') > -1 ? $t(item.name) : item.name }}</span>
            </template>
          </van-cell>
        </div>
      </div>
    </div>
    <!-- 多语言弹框 -->
    <van-popup class="popup-bottom-center" v-model:show="conf.langPopup" position="bottom">
      <div class="lang-select">
        <div class="select-title">
          <span>{{ $t('me.switchLanguage') }}</span>
          <img class="close-img" src="/static/img/close.webp" @click="conf.langPopup = false" />
        </div>
        <div class="lang-list">
          <div v-for="item of conf.langArr" :key="item.id">
            <div class="lang-item" @click="conf.changeLang(item)">
              <div class="lang-left">
                <img class="left-img" :src="`/static/img/me/${item.id}.png`" />
                <span>{{ item.name }}</span>
              </div>
              <img class="select-img" v-if="conf.language == item.id" src="/static/img/selected.webp" />
            </div>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 退出登录弹框 -->
    <van-popup class="popup-bottom-center" v-model:show="conf.outPopup" position="bottom">
      <div class="out-popup">
        <div class="out-line" @click="conf.goOutLogin">{{ $t('me.logOut') }}</div>
        <div style="height: 20rem; background: #f6f6f6"></div>
        <div class="out-line" @click="conf.outPopup = false">{{ $t('me.cancle') }}</div>
      </div>
    </van-popup>
  </x-page>
</template>
<script lang="ts" setup>
import CuModal from './components/cuModal.vue'
import sconfig from '@/sstore/sconfig'
import sutil from '@/sstore/sutil'
import { index } from './ts/me'

const conf = index()
</script>

<style lang="less" scoped>
.head-fixd {
  position: fixed;
  top: 0;
  z-index: 99;
  width: 100%;
  max-width: 750rem;
  background-image: linear-gradient(180deg, #eb602d 0%, #ffa64f 108.78%);
  padding: 0rem 24rem;

  .head-user {
    height: 100rem;
    display: flex;
    align-items: center;

    .head-img {
      width: 64rem;
      height: 64rem;
      margin-right: 24rem;
      border-radius: 32rem;
    }

    span {
      color: rgb(255, 255, 255);
      font-size: 28rem;
      font-weight: Bold;
      letter-spacing: -0.3px;
    }
  }
}

.head {
  width: 100%;
  position: relative;
  background: linear-gradient(#eb602d 0%, #f68740 51%, rgba(255, 166, 79, 0) 100%);

  .head-bg {
    position: absolute;
    top: 0rem;
    bottom: 40rem;
    width: 100%;

    .bg-img {
      width: 100%;
      height: 100%;
    }
  }

  .stting {
    width: 88rem;
    height: 88rem;
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    top: 70rem;
    right: 40rem;
    z-index: 2;
  }

  .user-content {
    position: absolute;
    top: 60rem;
    bottom: 40rem;
    width: 100%;

    .user {
      width: 60%;
      display: flex;
      align-items: center;
      margin-left: 30rem;
      margin-top: 12rem;
      height: 130rem;

      .user-avatar {
        width: 130rem;
        height: 130rem;
        background: #fff;
        border-radius: 65rem;
        display: flex;
        justify-content: center;
        align-items: center;

        .avatar-img {
          width: 118rem;
          height: 118rem;
          border-radius: 89rem;
        }
      }

      .user-info {
        padding-left: 20rem;
        color: #fff;
        display: flex;
        flex-direction: column;

        .name {
          font-size: 40rem;
          font-weight: 600;
          position: relative;
          // height: ;
          display: flex;
          // height: 50rem;
          align-items: center;

          .vip2 {
            vertical-align: bottom;
            width: 80rem !important;
            display: inline-block;
            margin-left: 20rem;
            margin-right: 10rem;
          }

          .vip-icon {
            position: relative;
            display: inline-block;
            line-height: 38rem;
            font-size: 32rem;
            vertical-align: middle;
          }

          .name-span {
            display: inline-block;
            max-width: 260rem;
            text-overflow: ellipsis;
            overflow: hidden;
            white-space: nowrap;
          }
        }

        .uid {
          font-size: 24rem;
          font-weight: 500;
          margin-top: 15rem;
        }
      }
    }

    .grade {
      position: absolute;
      left: 30rem;
      right: 30rem;
      bottom: 15rem;
      height: 280rem;
      z-index: 2;

      .grade-img {
        position: absolute;
        width: 100%;
        height: 100%;
        background: #fff;
        border-radius: 10rem;
      }

      .grade-info {
        position: absolute;
        width: 100%;
        height: 100%;

        .current {
          position: absolute;
          right: calc(19% - 54rem);
          width: 120rem;
          height: 120rem;
          top: 50rem;
          color: #f6f9ff;
          font-size: 62rem;
          font-weight: 400;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .currentbig {
          font-size: 54rem;
        }

        .level {
          .left-content {
            height: 100rem;
            padding: 0rem 30rem;
            background: linear-gradient(#eb602d 0%, #ffa64f 100%);
            background-clip: text;
            -webkit-background-clip: text;
            /*将设置的背景颜色限制在文字中*/
            -webkit-text-fill-color: transparent;
            /*给文字设置成透明*/
            display: flex;
            justify-content: center;
            align-items: center;

            .left-total {
              font-size: 35rem;
              font-weight: 600;
              margin-right: 15rem;
            }

            .left-icon {
              font-size: 35rem;
              font-weight: 600;
              display: flex;
              align-items: center;
              justify-content: left;

              .eye-img {
                margin-left: 10rem;
                width: 28rem;
                height: 20rem;
              }
            }
          }

          .select {
            height: 180rem;
            width: 100%;
            background: transparent;
            border-radius: 16rem;
            display: flex;
            background: #fffbf5;

            .select-item {
              flex: 1;
              display: flex;
              justify-content: center;
              align-items: center;
              flex-direction: column;
              flex-shrink: 0;
              transition: all 0.3s linear;

              img {
                width: 52rem;
                height: 52rem;
              }

              span {
                color: #be720f;
                font-size: 25rem;
                font-weight: 600;
                letter-spacing: -0.3px;
                margin-top: 16rem;
                flex-shrink: 0;
              }
            }
          }
        }

        .rech {
          position: absolute;
          bottom: 12rem;
          width: 100%;

          .rech-content {
            display: flex;
            align-items: center;
            justify-content: center;

            .rech-left {
              color: #000;
              font-size: 22rem;
              font-weight: 500;
              margin-right: 24rem;
            }

            .rech-btn {
              width: 110rem;
              height: 40rem;
              background: linear-gradient(180deg, #ffa632 0%, #ffc87f 100%);
              border-radius: 45rem;
              display: flex;
              justify-content: center;
              align-items: center;
              color: #fff;
              font-size: 22rem;
              font-weight: 500;
            }
          }
        }
      }
    }
  }
}

.menu-list {
  margin-top: -30rem;
  padding: 0 30rem;
  z-index: 2;
  position: relative;
}

.menu-item {
  background: #fff;
  border-radius: 10rem;
  overflow: hidden;
}

.menu-icon {
  width: 32rem;
  height: 32rem;
  margin-right: 42rem;
}

.lang-select {
  background: #fff;
  padding: 40rem;

  .select-title {
    color: rgb(37, 37, 41);
    font-size: 30rem;
    font-weight: bold;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .close-img {
      width: 48rem;
      height: 48rem;
    }
  }

  .lang-list {
    margin-top: 24rem;

    .lang-item {
      margin-top: 24rem;
      padding: 24rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background-color: rgb(246, 247, 250);

      .lang-left {
        display: flex;
        align-items: center;

        .left-img {
          width: 45rem;
          height: 45rem;
          margin-right: 15rem;
        }
      }

      .select-img {
        width: 24rem;
        height: 24rem;
      }
    }
  }
}

.out-popup {
  font-size: 40rem;
  font-weight: 500;
  background: #ffffff;

  .out-line {
    line-height: 120rem;
    border-bottom: 1rem solid #eee;
    text-align: center;
  }
}
</style>
