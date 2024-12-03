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
        <div class="stting" @click.stop="conf.changeOutPopup" v-if="sconfig.userInfo">
          <img class="setting-img" src="/static/img/quit-new.png" />
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
                    :src="'/static/img/VIP/v' + conf.userVipLevel + '.png'"
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
                      <div style="height: 8px" v-if="!conf.openEye"></div>
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
                <div class="select" v-if="!conf.coinLosding">
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
                    :style="{
                      maxWidth: conf.swiperList.length ? '100%' : '0px'
                    }"
                  >
                    <img v-if="conf.swiperList.length" src="/static/img/wallet/remittance-new.png" />
                    <span v-if="conf.swiperList.length">{{ $t('wallet.Remittance') }}</span>
                  </div>
                  <div class="select-item" @click="conf.handleCilckImg('CentralWallet', $event)">
                    <img src="/static/img/wallet/center-new.png" />
                    <span>{{ $t('wallet.central') }}</span>
                  </div>
                </div>
                <div class="select" style="justify-content: center;
                align-items: center;" v-else>
                  <van-loading type="spinner" />
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
        <div v-for="(item, index) of conf.menu1" :key="index">
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
import { apis } from '@/api'
import i18n from '@/lang'
import sapp from '@/sstore/sapp'
import sconfig from '@/sstore/sconfig'
import sutil from '@/sstore/sutil'
import { svalue } from '@/sstore/svalue'
import System from '@/utils/System'
import { onMounted, reactive } from 'vue'
import CuModal from './components/cuModal.vue'

const conf = reactive({
  isHeadFixed: false,
  langPopup: false,
  language: Cookie.get('language') || 'en-us',
  menu1: [] as any[],
  coinLosding: true,
  langArr: [
    {
      name: 'English',
      id: 'en-us'
    },
    {
      name: 'हिंदी',
      id: 'hi-IN'
    },
    {
      name: 'ภาษาไทย',
      id: 'th-TH'
    },
    {
      name: 'Indonesia',
      id: 'id-ID'
    },
    {
      name: 'Português',
      id: 'pt-PT'
    },
    {
      name: 'Español',
      id: 'es-ES'
    }
  ],
  outPopup: false,
  userVipLevel: 0,
  gradedPercentage: 0,
  integral: 10000 as any,
  refresh: false,
  openEye: false,
  total_money: 0,
  str_money: '******',
  defaultCoin: {
    coinSymbol: '',
    coinTousdt: 0
  }, //接口返回默认币种钱包
  swiperList: [] as any[],
  showNumberBox: false,
  userWalletList: undefined as any,
  isRefash: false,

  //bind安全信息弹窗关闭
  handleCloseBindDialog() {
    conf.showNumberBox = false
  },

  handleEyeClick() {
    conf.openEye = !conf.openEye
    Cookie.set('showTotalWallet', conf.openEye)
  },

  handleCilckImg(type: string, e: any) {
    if (!sconfig.userInfo) return System.router.push('/login')

    switch (type) {
      //钱包
      case 'Remittance':
        System.router.push('/user/wallet/exchange')
        break
      //充值
      case 'Recharge':
        Cookie.set('userWalletList', conf.userWalletList)
        if (conf.userWalletList == 0) {
          System.toast(i18n.t('wallet.noWalletTip'))
        } else {
          System.router.push('/user/wallet/Recharge')
        }
        break
      //提现
      case 'Withdraw':
        let coin = conf.swiperList.find((item) => item.id == sconfig.userInfo.defaultWalletId)?.walletCoin
        apis.hasPaymentType({
          coin: sapp.globalData.defaultWalletInfo.walletCoin || sapp.globalData.defaultWalletInfo.coinCode || coin,
          success: (res: any) => {
            if (res.data) {
              Cookie.set('userWalletList', conf.userWalletList)
              System.router.push('/user/wallet/withDraw')
            } else {
              conf.showNumberBox = true
            }
          }
        })
        break
      //中心钱包
      case 'CentralWallet':
        System.router.push('/user/wallet/centerWallet')
        break
    }
  },

  needLoginShow: () => sconfig.userInfo,
  async initData() {
    let info = await svalue.getAppConfiguration()
    let addArr = []
    if (info.yeb) {
      addArr.push({
        name: info.app_name + ' fortune',
        leftImg: '/static/img/YuE-bao.png',
        new: false,
        url: '/user/YuE-Bao/yueBao',
        isShow: conf.needLoginShow
      })
    }

    conf.menu1 = [
      ...addArr,
      {
        // name: 'Third party placing',
        name: 'me.casinoBets',
        leftImg: '/static/img/Third-party-placing.png',
        new: false,
        url: '/user/me/thirdPartyPlacing',
        isShow: conf.needLoginShow
      },
      {
        name: 'me.History',
        leftImg: '/static/img/result-history-new.png',
        new: false,
        url: '/user/me/resultHistory',
        isShow: conf.needLoginShow
      },
      {
        name: 'me.Agency',
        leftImg: '/static/img/me-active-new.png',
        new: false,
        url: '/user/invite/index',
        isShow: conf.needLoginShow
      },
      {
        name: 'me.Bets',
        leftImg: '/static/img/money-new.png',
        new: false,
        url: '/user/myBet/index',
        isShow: conf.needLoginShow
      },
      {
        name: 'me.Sratch',
        leftImg: '/static/img/sratch-history-new.png',
        new: false,
        url: '/user/scratch/history',
        isShow: conf.needLoginShow
      },
      {
        name: 'me.Transactions',
        leftImg: '/static/img/transactions-new2.png',
        new: false,
        url: '/user/me/myTransactions',
        isShow: conf.needLoginShow
      },
      {
        name: 'me.bankCrad',
        leftImg: '/static/img/back-card-new.png',
        new: false,
        url: '/user/me/BankCard',
        isShow: conf.needLoginShow
      },
      {
        name: 'me.Password',
        leftImg: '/static/img/password-new.png',
        new: false,
        url: '/user/Password/Change',
        isShow: conf.needLoginShow
      },
      {
        name: 'me.Languages',
        leftImg: '/static/img/languages-new.png',
        new: false,
        func: () => {
          conf.langPopup = true
        },
        isShow: true
      },
      {
        name: 'me.setting',
        leftImg: '/static/img/setting-new.png',
        new: false,
        url: '/user/setting/setting',
        isShow: true
      }
    ]
  },
  handle(item: any) {
    item.url && System.router.push(item.url)
    item.func && item.func()
  },

  changeOutPopup() {
    conf.outPopup = true
  },
  async changeLang(item: any) {
    conf.language = item.id
    await i18n.setLang(item.id)
    conf.langPopup = false
  },
  async goLogin(url: string) {
    if (!sconfig.userInfo) url = '/login'
    System.router.push(url)
  },
  async userGradedInfo() {
    if (!sconfig.userInfo) return
    let res = await apis.userGradedInfo()
    let data = res.data
    conf.gradedPercentage = data.gradedPercentage
    conf.userVipLevel = data.userVipLevel > data.theMax ? data.theMax : data.userVipLevel
    let n = parseFloat(data.integral)
    conf.integral = n.toFixed(2)
  },
  async goOutLogin() {
    sconfig.logout()
    conf.outPopup = false
    conf.total_money = 0
    System.toast('out success', 'success')
  },
  async goWallet() {
    conf.defaultCoin = conf.swiperList.find((item) => item.isDefault)
    Cookie.set('defaultCoin', conf.defaultCoin)
    conf.getWalletList(conf.swiperList)
  },
  //获取用户钱包列表
  async getWalletList(arr: any) {
    console.log(arr);
    
    let wlist = await svalue.getWalletlist()
    let defaultWalletId = sconfig.userInfo.defaultWalletId
    let obj = wlist.find((item: any) => item.id == defaultWalletId)
    if (obj) {
      sapp.globalData.defaultWalletInfo = obj
    }
    let newArr = wlist || []
    arr?.forEach((item: any) => {
      console.log(item.coinTousdt);
      
      let index = newArr?.findIndex((into: any) => into.walletCoin == item.coinCode)
      if (index != -1) {
        newArr[index].coinTousdt = item.coinTousdt
        newArr[index].nationalFlag = item.nationalFlag
        newArr[index].coinCode = item.coinCode
        item.id = newArr[index].id
        item.walletStatus = newArr[index].walletStatus
        newArr[index].coinSymbol = item.coinSymbol
      }
    })
    console.log(conf.defaultCoin);
    
    conf.total_money = 0
    newArr?.forEach((item: any, itemIndex: number) => {
      item.dollar = 0
      item.walletMoney = Number(item.walletMoney).toFixed(4)
      item.walletMoney > 0 && (item.dollar = sutil.division(item.walletMoney, item.coinTousdt))
      item.defaultCoinMoney =
        item.walletMoney > 0
          ? sutil.division(sutil.Mul(item.walletMoney, conf.defaultCoin.coinTousdt), item.coinTousdt)
          : 0
      conf.total_money = sutil.addNum(conf.total_money, item.defaultCoinMoney)
    })
    Cookie.set('userWalletList', newArr)
  }
})

const init = async () => {
  System.loading(false)
  conf.initData()
  conf.userGradedInfo()
  svalue.coinlist = []
  conf.swiperList = await svalue.getCoinlist()
  conf.coinLosding = false
  conf.total_money = 0
  sconfig.userInfo && conf.goWallet()
}
onMounted(() => init())
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
    position: absolute;
    top: 120rem;
    right: 46rem;
    z-index: 2;

    .setting-img {
      width: 38rem;
      height: 36rem;
    }
  }

  .user-content {
    position: absolute;
    top: 60rem;
    bottom: 40rem;
    width: 100%;

    .user {
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
