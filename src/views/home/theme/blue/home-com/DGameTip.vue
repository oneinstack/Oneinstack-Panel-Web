<template>
  <div class="cu-modal" :class="conf.modalName ? 'show' : ''">
    <div class="cu-dialog" v-if="conf.modalName">
      <div class="cu-bar bg-white justify-end" v-if="conf.modalName == 'selectMoney'">
        <div class="content">{{ $t('casinoModule.QuickTransfer') }}</div>
        <img class="close-img" @click="conf.modalName = ''" src="/static/img/pop-close.png" />
      </div>
      <!-- 进入游戏提示 -->
      <div class="padding-xl" v-if="conf.modalName == 'intoGame'">
        <div style="font-size: 36rem; opacity: 0.8; color: #828282">{{ $t('casinoModule.enterGame') }}</div>
      </div>

      <!-- 访客clikc第三方游戏提示 -->
      <div class="padding-xl" v-if="conf.modalName == 'visitorIntoGame'">
        <div style="font-size: 36rem; opacity: 0.8; color: #828282">{{ $t('home.visitorTip') }}</div>
      </div>

      <!-- 快捷转入 -- 钱包 => 第三方游戏 -->
      <div class="select-box" v-if="conf.modalName == 'selectMoney'">
        <div class="input-view">
          <img class="top-wallet-img" src="/static/vicon/svg/blue/wallet3.svg" />
          <text>{{ dataHandling(conf.slider.value) }}</text>
        </div>
        <div class="arrow-view">
          <img class="arrow-img" src="/static/vicon/svg/blue/arrow.svg" />
          <img class="arrow-img" src="/static/vicon/svg/blue/arrow.svg" style="transform: rotate(90deg)" />
        </div>
        <div class="modal-btn-view">
          <div class="left-wallet">
            <div class="top">
              <img class="wallet-img" src="/static/vicon/svg/blue/wallet2.svg" />
              <text>{{ conf.currentWallet.coinSymbol }}{{ dataHandling(conf.currentWallet.walletMoney) }}</text>
            </div>
            <div class="bottom">
              <text>{{ $t('casinoModule.My') + ' ' + $t('me.Wallet') }}</text>
            </div>
          </div>
          <div class="left-wallet">
            <div class="top">
              <img class="wallet-img" src="/static/vicon/svg/blue/wallet4.svg" />
              <text>{{ conf.gameWallet.coinSymbol }}{{ dataHandling(conf.gameWallet.walletMoney) }}</text>
            </div>
            <div class="bottom">
              <text>{{ conf.clickGameInfo.gamePlatformName + ' - ' + $t('me.Wallet') }}</text>
            </div>
          </div>
        </div>
        <div class="input-money" v-if="conf.slider.maxVal > 0">
          <div class="num">
            <div class="num-change">{{ conf.currentWallet.coinSymbol }}</div>
            <input
              class="num-input"
              :placeholder="$t('swapModule.enterAmountTip')"
              v-model="conf.slider.value"
              @input="conf.input"
            />
            <div class="num-change" @click="conf.changeAll">{{ $t('scratch.all') }}</div>
          </div>
        </div>
      </div>

      <div class="select-box" v-if="conf.modalName == 'isSure'">
        {{ $t('common.isSureTip') }}
      </div>

      <!-- btns -->
      <div class="modal-btn-view">
        <template v-if="conf.modalName == 'intoGame'">
          <div class="left-btn" @click="conf.modalName = null">{{ $t('otcOrderDetailsModule.No') }}</div>
          <div class="right-btn" @click="conf.handleIntoGames">{{ $t('otcOrderDetailsModule.Yes') }}</div>
        </template>
        <template v-if="conf.modalName == 'selectMoney'">
          <div class="left-btn" @click="conf.modalName = 'isSure'">{{ $t('otcOrderDetailsModule.No') }}</div>
          <div class="right-btn" @click="conf.handleSelectMoney">{{ $t('otcOrderDetailsModule.Yes') }}</div>
        </template>
        <template v-if="conf.modalName == 'isSure'">
          <div class="left-btn" @click="conf.modalName = 'selectMoney'">{{ $t('otcOrderDetailsModule.No') }}</div>
          <div class="right-btn" @click="conf.handleUrl">{{ $t('otcOrderDetailsModule.Yes') }}</div>
        </template>
        <template v-if="conf.modalName == 'visitorIntoGame'">
          <div class="right-btn" @click="conf.modalName = null">{{ $t('otcOrderDetailsModule.Yes') }}</div>
        </template>
      </div>
    </div>
    <toast ref="toast"></toast>
  </div>
</template>
<script setup lang="ts">
import { apis } from '@/api'
import i18n from '@/lang'
import sutil from '@/sstore/sutil'
import { svalue } from '@/sstore/svalue'
import System from '@/utils/System'
import { onMounted, reactive } from 'vue'

const dataHandling = sutil.dataHandling
const conf = reactive({
  modalName: null as any,
  slider: {
    value: 0,
    maxVal: 200
  },
  currentWallet: {} as any,
  gameWallet: {} as any,
  clickGameInfo: {} as any,
  thirdGamesId: '',
  pathUrl: '',
  currentWalletDefault: {} as any,
  gameWalletDefault: {} as any,
  topInputValue: 0,
  bottomInputValue: 0,
  walletInfo: {} as any,

  handleIntoGames: async () => {
    System.loading()
    let item = await svalue.getDefaultWallet()
    conf.walletInfo = item
    const res = await apis.enterGame({
      coinCode: item.walletCoin, //默认钱包币种CODE
      gameCode: conf.clickGameInfo.gameCode, //游戏CODE
      platformId: conf.clickGameInfo.platformId, //所属平台ID
      gamePlatformCode: conf.clickGameInfo.gamePlatformCode,
      final: (status, config, xhr) => {
        System.loading(false)
      }
    })

    conf.modalName = null
    conf.thirdGamesId = ''
    conf.pathUrl = ''

    let datas = res.data
    if (datas.id) {
      conf.thirdGamesId = datas.id
      conf.currentWallet = datas.current
      conf.gameWallet = datas.game
      conf.currentWalletDefault = JSON.parse(JSON.stringify(datas.current))
      conf.gameWalletDefault = JSON.parse(JSON.stringify(datas.game))
      conf.slider.maxVal = parseInt(conf.currentWalletDefault.walletMoney)
      conf.modalName = 'selectMoney'
    }
  },
  handleSelectMoney: async () => {
    let moneyNum = parseFloat(conf.gameWallet.walletMoney)
    if (conf.slider.value == 0 && moneyNum > 1) {
      conf.pathUrl = conf.thirdGamesId
      conf.handleUrl()
      return
    }
    System.loading()
    await apis.thirdpartyTransfer({
      sourceGameCode: conf.currentWallet.code, //转出游戏CODE
      sourceGamePlatformId: conf.currentWallet.platformId, //转出游戏平台ID
      targetGameCode: conf.gameWallet.code, //转入游戏CODE
      targetGamePlatformId: conf.gameWallet.platformId, //转入游戏平台ID
      tradeAmount: conf.slider.value, //交易金额
      tradeCoinCode: conf.walletInfo.walletCoin, //交易钱包币种
      targetGamePlatformCode: conf.clickGameInfo.gamePlatformCode,
      sourceGamePlatformCode: conf.currentWallet.code,
      toast(code, xhr) {
        if (xhr.data.msg.indexOf('必须大于或等于1') != -1) {
          System.toast(i18n.t(`code.${98002}`))
        } else {
          System.toast(i18n.t(`code.${code}`))
        }
      },
      final(status, config, xhr) {
        System.loading(false)
      }
    })

    conf.pathUrl = conf.thirdGamesId
    conf.handleUrl()
  },
  handleUrl: () => {
    !conf.pathUrl && (conf.pathUrl = conf.thirdGamesId)
    svalue.openGameMethod(conf.pathUrl)
    conf.modalName = null
  },
  changeAll: () => {
    conf.slider.value = parseInt(conf.slider.maxVal + '')
    conf.currentWallet.walletMoney = sutil.numsub(conf.currentWalletDefault.walletMoney, conf.slider.value)
    conf.gameWallet.walletMoney = sutil.addNum(conf.gameWalletDefault.walletMoney, conf.slider.value)
  },
  input: (e: any) => {
    // 删除数字之外的字符
    // [^0-9.\s]
    let arr = e.target.value.match(/[^0-9]/g) || null
    let inputval = e.target.value.toString()
    if (arr) {
      for (let i = 0; i < arr.length; i++) {
        let index = inputval.indexOf(arr[i])
        inputval = inputval.split(arr[i]).join('')
      }
    }
    let inputNum: any = parseFloat(inputval) || ''
    inputval = inputNum > conf.slider.maxVal ? conf.slider.maxVal : inputval
    conf.currentWallet.walletMoney = sutil.numsub(conf.currentWalletDefault.walletMoney, inputval)
    conf.gameWallet.walletMoney = sutil.addNum(conf.gameWalletDefault.walletMoney, inputval)
    if (inputval > 0) inputval = parseInt(inputval)
    conf.slider.value = inputval
  }
})
onMounted(() => {})

defineExpose({
  show: (item: any) => {
    conf.slider.value = 0
    conf.clickGameInfo = item
    conf.modalName = 'intoGame'
  },
  showVisitor: () => {
    conf.modalName = 'visitorIntoGame'
  }
})
</script>
<style lang="less" scoped>
.cu-modal {
  .cu-dialog {
    background-color: #fff;
    width: 560rem;
    padding-top: 15rem;

    .cu-bar {
      height: 70rem;
      min-height: 70rem;
    }

    .showimg {
      width: 200rem;
      height: 200rem;
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
.cu-modal {
  margin: 0 auto;
}
.close-img {
  width: 20rem;
  height: 20rem;
  position: absolute;
  top: 22rem;
  right: 35rem;
  z-index: 999;
}
.cu-dialog {
  border-radius: 40rem;
  width: 560rem;
  box-shadow: 0 2rem 10rem #fffbf5;
  position: relative;
}
.modal-btn-view {
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin-bottom: 50rem;
}

.left-btn,
.right-btn {
  text-align: center;
  background: linear-gradient(93.51deg, #006FFF 5.72%, #087BFF 86.61%);
  color: #fff;
  border-radius: 80rem;
  font-size: 26rem;
  font-weight: 600;
  height: 52rem;
  line-height: 52rem;
  min-width: 132rem;
  padding: 0rem 20rem;
}

.left-btn {
  background: #E6F2FF;
  color: #006FFF;
}
.select-box {
  padding: 60rem 30rem;

  .input-view {
    width: 230rem;
    background: linear-gradient(93.51deg, #006FFF 5.72%, #087BFF 86.61%) !important;
    margin: auto;
    height: 66rem;
    border-radius: 140rem;
    align-items: center;
    display: flex;
    justify-content: center !important;
    padding: 10rem 30rem;
    text-align: center;
    color: #fff;
    font-size: 32rem;
    .input-content {
      display: flex;
      align-items: center;
    }
  }
}
.top-wallet-img {
  width: 40rem;
  height: 40rem;
  margin-right: 10rem;
}
.arrow-img {
  width: 36rem;
  height: 34rem;
}
.left-wallet,
.right-wallet {
  text-align: center;
  font-size: 26rem;
  font-weight: 600;
  width: auto;
  font-size: 24rem;
  min-width: 190rem;

  .top {
    justify-content: center;
    display: flex;
    align-items: center;
    height: 52rem;
    line-height: 52rem;
    padding: 20rem 20rem;
    background: #E6F2FF;
    border-radius: 80rem;
    color: #666666;
  }

  .bottom {
    margin-top: 20rem;
  }

  .wallet-img {
    width: 30rem;
    height: 30rem;
    margin-right: 10rem;
  }
}
.arrow-view {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 70%;
  margin: auto;
  padding: 20rem 0rem;
}
.uni-input-placeholder {
  color: #d2d2d2;
  font-size: 22rem;
  text-align: left;
}
.input-money {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.num {
  display: flex;
  border-radius: 28rem;
  font-size: 28rem;
  width: 87%;
  height: 55rem;
  background: #f6f7fa;
  padding: 0rem 30rem;
  .num-change {
    font-size: 28rem;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    background: linear-gradient(93.51deg, #006FFF 5.72%, #087BFF 86.61%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .num-input {
    flex: 1;
    color: #666;
    font-size: 25rem;
    height: 100%;
    margin: 0 20rem;
  }
}
</style>
