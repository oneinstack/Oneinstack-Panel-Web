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
      <div style="height: 670rem; position: relative">
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
            <div class="grade-info">
              <div class="left-content">
                <div class="left-total">
                  {{ $t('wallet.topTitle') }}
                  <VSIcon
                    v-if="sconfig.userInfo"
                    class="eye-img"
                    lib="blue"
                    :color="['#979797']"
                    :name="conf.openEye ? 'eye-open' : 'eye-close'"
                    :size="40"
                    @click.prevent="conf.handleEyeClick()"
                  />
                </div>
                <div class="left-icon">
                  {{
                    conf.openEye
                      ? `${conf.defaultCoin.coinSymbol} ${sutil.dataHandling(conf.total_money)}`
                      : conf.str_money
                  }}
                </div>
              </div>
              <div
                v-if="conf.coinLosding && sconfig.userInfo"
                class="select justify-center items-center"
                style="height: 100%"
              >
                <van-loading type="spinner" />
              </div>
              <div class="select" v-else>
                <div class="select-item" @click="conf.handleCilckImg('Recharge', $event)">
                  <img src="/static/theme/blue/recharge.webp" />
                  <span>{{ $t('wallet.Recharge') }}</span>
                </div>
                <!-- 推广用户不可提现 -->
                <div class="select-item" @click="conf.handleCilckImg('Withdraw', $event)">
                  <img src="/static/theme/blue/withdrawal.webp" />
                  <span>{{ $t('wallet.Withdrawal') }}</span>
                </div>
                <div
                  class="select-item"
                  @click="conf.handleCilckImg('Remittance', $event)"
                  v-if="conf.userWalletList.length > 1"
                >
                  <img src="/static/theme/blue/remittance.webp" />
                  <span>{{ $t('wallet.Remittance') }}</span>
                </div>
                <div class="select-item" @click="conf.handleCilckImg('CentralWallet', $event)">
                  <img src="/static/theme/blue/central.webp" />
                  <span>{{ $t('wallet.central') }}</span>
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
      <div
        v-for="(category, index) in conf.menu1"
        :key="index"
        :style="index === conf.menu1.length - 1 && 'margin-top: 32rem'"
        class="menu-item"
      >
        <div v-for="item of category" :key="item.name">
          <van-cell
            is-link
            center
            @click="conf.handle(item)"
            v-if="typeof item.isShow === 'function' ? item.isShow() : item.isShow"
          >
            <!-- 使用 title 插槽来自定义标题 -->
            <template #icon>
              <div class="flex items-center">
                <VSIcon lib="blue" class="menu-icon" :name="item.icon" :size="64" />
              </div>
            </template>
            <template #title>
              <span class="menu-item-title">{{ item.name.indexOf('me.') > -1 ? $t(item.name) : item.name }}</span>
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
import CuModal from './theme/blue/components/cuModal.vue'
import sconfig from '@/sstore/sconfig'
import sutil from '@/sstore/sutil'
import { index } from './me'

const conf = index()
</script>

<style lang="less" scoped>
.head-fixd {
  position: fixed;
  top: 0;
  z-index: 99;
  width: 100%;
  max-width: 500px;
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
  background: linear-gradient(#336cff 0%, #336cfffc 51%, rgba(255, 166, 79, 0) 100%);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 510rem;
    height: 510rem;
    background: url('/static/theme/blue/bg-square.webp') no-repeat center center;
    background-size: cover;
    transform: rotate(-15deg);
  }

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
            line-height: 19px;
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
      height: 364rem;
      z-index: 2;
      border-radius: 20rem;
      overflow: hidden;

      .grade-info {
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        background: linear-gradient(180deg, #e2f0ff 0%, #ffffff 75.69%, #ffffff 100%);

        .left-content {
          height: 164rem;
          border-bottom: 1px solid #ffffff;
          padding: 32rem 40rem 20rem;
          position: relative;

          &::after {
            content: '';
            position: absolute;
            width: 342rem;
            height: 232rem;
            right: 0;
            top: 0;
            background-image: url('/static/theme/blue/card-decorate.svg');
            background-size: cover;
            background-repeat: no-repeat;
            background-position: center;
          }

          .left-total {
            font-weight: 600;
            margin-right: 15rem;
            font-family: PingFang SC;
            font-weight: 100;
            font-size: 28rem;
            color: #979797;
            display: flex;
            align-items: center;
          }

          .left-icon {
            height: 80rem;
            line-height: 80rem;
            font-family: PingFang SC;
            font-size: 48rem;
            font-weight: 600;
            color: #006fff;
          }

          .eye-img {
            margin-left: 10rem;
          }
        }

        .select {
          padding: 20rem 40rem;
          width: 100%;
          display: flex;

          .select-item {
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column;
            flex-shrink: 0;
            transition: all 0.3s linear;

            img {
              width: 120rem;
              height: 120rem;
            }

            span {
              color: #979797;
              font-size: 24rem;
              letter-spacing: -0.3px;
              flex-shrink: 0;
              font-family: PingFang SC;
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

  &-title {
    font-family: PingFang SC;
    font-size: 32rem;
    font-weight: 500;
    color: #333333;
  }
}

.menu-icon {
  width: 64rem;
  height: 64rem;
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
