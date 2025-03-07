<template>
  <x-page :no-footer="true" pageType="black">
    <template #title>
      {{ $t('scratch.scratch') }}
    </template>
    <div class="page">
      <div class="main">
        <div class="main-img">
          <scratch-img :paddingNum="40" :item="conf.scratch" v-if="conf.scratch.scratchTicketShowname"></scratch-img>
        </div>
        <!-- <div class="nav-box-list" :style="conf.sTop">
        <div class="nav-content">
          <div class="nav-left">
            <div class="power">{{ conf.scratch.scratchTicketShowname }}</div>
          </div>
          <div class="nav-right">
            {{ conf.coinSymbol || '$' }}{{ conf.scratch.newScratchTicketPrice }}
            <span>/{{ $t('scratch.ticket') }}</span>
          </div>
        </div>
      </div> -->
        <div class="scratch-content">
          <div class="show-name">{{ conf.scratch.scratchTicketShowname }}</div>
          <div class="time">1st of March 2025</div>
          <div class="price">
            <div class="l-name">Total Prize</div>
            <div class="r-money">
              <div>{{ conf.coinSymbol || '$' }}{{ conf.scratch.newScratchTicketPrice }}</div>
              <div class="ticket">/{{ $t('scratch.ticket') }}</div>
            </div>
          </div>
          <div class="rule" v-if="conf.scratch.scratchTicketRule">
            <div v-html="conf.scratch.scratchTicketRule"></div>
          </div>
        </div>
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
            <div class="btn-item" style="margin-left: 12rem; padding: 0rem;width: 180rem;"
              @click="conf.changePurchase">
                <greenBtn>
                  <sapn>{{ $t('scratch.playNow') }}</sapn>
                </greenBtn>
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
import greenBtn from '@/views/home/theme/black/components/greenBtn.vue'
import { index } from './purchase'
import stheme from '@/sstore/stheme'
import { ref } from 'vue'

const modalRefs = ref<any>()
const conf = index({ modalRefs })
</script>

<style lang="less" scoped>
.main {
  margin: 24rem;
  background: #323738;
  box-shadow: 0px 4px 4px 0px #0000000F;
  border-radius: 20rem;
  overflow: hidden;
}

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
  width: 100%;
  height: 400rem;
  border-radius: 20rem;
}

.scratch-content {
  padding: 40rem 24rem;
  font-family: Poppins;
  font-weight: 700;
  font-size: 32rem;
  color: #fff;
  .time{
    color: #BFBFBF;
    font-size: 24rem;
    font-weight: 600;
    margin: 20rem 0rem;
  }
  .price{
    display: flex;
    justify-content: space-between;
    background: #3A4142;
    border-radius: 16rem;
    padding: 20rem;
    .r-money{
      font-size: 48rem;
      .ticket{
        color: #BFBFBF;
        font-weight: 500;
        font-size: 24rem;
        text-align: right;
      }
    }
  }
}

.rule {
  margin: 20rem 10rem;
  font-size: 28rem;
  color: #BFBFBF;
  font-weight: 500;
  ::v-deep strong{
    color: #fff;
    font-size: 32rem;
    font-weight: 700;
  }
}

.bottom-btn {
  height: 120rem;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-width: 750rem;
  margin: 0rem auto;

  .btn-content {
    padding: 30rem 20rem;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #323738;


    .btn-left {
      display: flex;
      flex-direction: column;
      align-items: center;

      .btn-img {
        width: 48rem;
        height: 48rem;
      }

      span {
        color: #fff;
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
        background: #3A4142;
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
