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
          <img class="top-wallet-img" src="/static/img/home/wallet3.png" />
          <text>{{ dataHandling(conf.slider.value) }}</text>
        </div>
        <div class="arrow-view">
          <img class="arrow-img" src="/static/img/home/arrow.png" style="transform: rotate(-90deg)" />
          <img class="arrow-img" src="/static/img/home/arrow.png" />
        </div>
        <div class="modal-btn-view">
          <div class="left-wallet">
            <div class="top">
              <img class="wallet-img" src="/static/img/home/wallet4.png" />
              <text>{{ conf.currentWallet.coinSymbol }}{{ dataHandling(conf.currentWallet.walletMoney) }}</text>
            </div>
            <div class="bottom">
              <text>{{ $t('casinoModule.My') + ' ' + $t('me.Wallet') }}</text>
            </div>
          </div>
          <div class="left-wallet">
            <div class="top">
              <img class="wallet-img" src="/static/img/home/wallet4.png" />
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
import sutil from '@/sstore/sutil'
import { index } from './DGameTip'

const dataHandling = sutil.dataHandling
const conf = index()

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
  background-color: #f17638;
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
  background-color: #fff2df;
  color: #000000;
  opacity: 0.7;
}
.select-box {
  padding: 60rem 30rem;

  .input-view {
    width: 230rem;
    background: linear-gradient(#ffa64f, #eb602d) !important;
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
    background-color: #fff2df;
    border-radius: 80rem;
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
    background: linear-gradient(328.56deg, #ff7502 18.81%, #fc9b01 77.66%);
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
