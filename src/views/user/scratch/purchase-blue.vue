<template>
  <x-page :no-footer="true" :bgcolor="'#eff1f5'" :header-bg-color="stheme.theme.blue.headerBgColor()">
    <template #title>
      {{ $t('scratch.scratch') }}
    </template>
    <template #right>
      <div class="right-content">
        <div class="right-text">{{ $t('wallet.balance') }}</div>
        <div class="right-icon">{{ conf.walletMoney }}</div>
      </div>
      <img class="wallet-img" src="/static/img/wallet.webp" />
    </template>
    <div class="page">
      <div class="main-img">
        <scratch-img :paddingNum="62" :item="conf.scratch" v-if="conf.scratch.scratchTicketShowname"></scratch-img>
      </div>
      <div class="nav-box-list" :style="conf.sTop">
        <div class="nav-content">
          <div class="nav-left">
            <div class="power">{{ conf.scratch.scratchTicketShowname }}</div>
            <!-- <div class="left-time">Sale Date: 2023-10-26 09:59:14</div> -->
          </div>
          <div class="nav-right">
            {{ conf.coinSymbol || '$' }}{{ conf.scratch.newScratchTicketPrice }}
            <span>/{{ $t('scratch.ticket') }}</span>
          </div>
        </div>
      </div>
      <div class="rule" v-if="conf.scratch.scratchTicketRule">
        <div v-html="conf.scratch.scratchTicketRule"></div>
      </div>
      <div style="height: 140rem"></div>
      <div class="bottom-btn">
        <div class="btn-content">
          <div class="btn-left" @click="conf.goHisTory">
            <img class="btn-img" src="/static/img/purchase-btn.png" />
            <span>{{ $t('scratch.mySratchHistory') }}</span>
          </div>
          <div class="btn-right">
            <div class="btn-item" @click="conf.goPlay">{{ $t('scratch.howPlay') }}</div>
            <div
              class="btn-item"
              style="margin-left: 12rem; background: #be1b1b; padding: 0rem 24rem"
              @click="conf.changePurchase"
            >
              {{ $t('scratch.playNow') }}
            </div>
          </div>
        </div>
      </div>
    </div>
    <showModal ref="modalRefs" @confirm="conf.confirm"></showModal>
  </x-page>
</template>

<script setup lang="ts">
import showModal from './components/showModal.vue'
import scratchImg from './components/scratchImg.vue'
import { index } from './purchase'
import stheme from '@/sstore/stheme'
import { ref } from 'vue'

const modalRefs = ref<any>()
const conf = index({ modalRefs })
</script>

<style lang="less" scoped>
.right-content {
  text-align: right;
  letter-spacing: -0.3px;
  font-size: 22rem;
}

.wallet-img {
  width: 72rem;
  height: 72rem;
  margin-right: 20rem;
}

.main-img {
  display: block;
  width: 100%;
  height: 700rem;
  padding-top: 20rem;

  img {
    width: 100%;
    height: 100%;
  }
}

.nav-box-list {
  position: sticky;
  z-index: 1;
  top: var(--sTop);
  left: 0;
  background: #fff;
  padding: 22rem 0rem;
  z-index: 1;
  border-radius: 0rem 0rem 10px 10px;
  box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.06);

  .nav-content {
    padding: 26rem 62rem;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .nav-left {
      .power {
        color: #e20000;
        font-weight: 600;
        font-size: 36rem;
      }

      .left-time {
        font-weight: 400;
        font-size: 24rem;
        color: rgba(0, 0, 0, 0.6);
        margin-top: 10rem;
      }
    }

    .nav-right {
      color: #000;
      font-weight: 700;
      font-size: 48rem;

      span {
        font-weight: 500;
        font-size: 24rem;
        color: rgba(0, 0, 0, 0.6);
      }
    }
  }
}

.rule {
  margin: 20rem 10rem;
  border-radius: 10rem;
  background: #fff;
  box-shadow: 0px 8rem 8rem 0px rgba(0, 0, 0, 0.06);
  padding: 32rem;
  font-size: 28rem;

  .odds {
    color: #000;
    margin-bottom: 40rem;

    .odds-title {
      font-weight: 600;
      font-size: 36rem;
    }

    .odds-content {
      font-weight: 400;
      font-size: 28rem;
      margin-top: 5rem;
      line-height: 40rem;
    }
  }

  .bonus {
    border-radius: 10rem;
    background: #f8f9ff;
    padding: 8rem;

    .title {
      display: flex;
      padding: 20rem 0rem;

      .title-item {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }
    }

    .bonus-line {
      display: flex;
      height: 72rem;
      color: #000;
      font-weight: 600;
      font-size: 28rem;

      .line-item {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }

      &:nth-child(2n) {
        background: #fff;
      }
    }
  }

  .rule-content {
    color: #000;
    font-size: 28rem;
    line-height: 40rem;
    margin-top: 40rem;
  }
}

.bottom-btn {
  height: 120rem;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-width: 500px;
  margin: 0rem auto;

  .btn-content {
    padding: 30rem 20rem;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #fff;

    .btn-left {
      display: flex;
      flex-direction: column;
      align-items: center;

      .btn-img {
        width: 48rem;
        height: 48rem;
      }

      span {
        color: #000;
        font-size: 28rem;
        font-weight: 400;
      }
    }

    .btn-right {
      display: flex;

      .btn-item {
        // width: 172rem;
        padding: 0rem 16rem;
        height: 72rem;
        border-radius: 10rem;
        background: #2782bf;
        color: #fff;
        font-size: 24rem;
        font-weight: 600;
        display: flex;
        justify-content: center;
        align-items: center;
      }
    }
  }
}

:deep(.modal) {
  .btn-item {
    background: #e6f2ff !important;
    color: #006fff !important;

    &.sure {
      background: linear-gradient(93.51deg, #006fff 5.72%, #087bff 86.61%) !important;
      color: #fff !important;
    }
  }
}
</style>
