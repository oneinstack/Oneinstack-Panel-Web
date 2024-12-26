<template>
    <div class="record-card">
      <div class="absolute" style="left: 0rem; top: 0rem">
        <div class="flex source-text items-center">
          <div style="margin-left: 16rem">{{ item.source }}</div>
        </div>
      </div>
      <div class="status">
        <img v-if="item.isReceive" src="/static/img/luckybox/drawn.png" class="img" />
        <img v-else src="/static/img/luckybox/not-drawn.png" class="img" />
      </div>
  
      <img class="box-img" :src="`/static/img/luckybox/box/box-${item.boxType}.png`" mode="widthFix" />
  
      <div class="box-info">
        <div class="box-name">{{ item.boxName }}</div>
        <div class="receive-time">{{ item.receiveTime }}</div>
        <div v-if="item.isOpen && item.reward" class="reward">
          <div class="reward-img-wrap">
            <img v-if="item.coinCode !== 'USDT'" :src="`/static/img/luckybox/${rewardImg}.png`" class="reward-img" />
            <img v-else :src="`/static/img/luckybox/cash-usdt.png`" class="reward-img" />
            <div v-if="item.rewardType === 0 && item.coinCode !== 'USDT'" class="reward-unit">
              {{ item.coinSymbol }}
            </div>
          </div>
          <div class="reward-num">
            <span>{{ item.receiveItem }}</span>
            <span style="margin: 0 2rem 0 8rem; font-size: 22rem">×{{ item.receiveNum }}</span>
          </div>
        </div>
        <div v-if="item.isErr" class="err">{{ $t('luckyBox.boxErr') }}</div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { computed } from 'vue'
  
  const props = defineProps<{
    item: any
  }>()
  
  const rewardImg = computed(() => {
    switch (props.item.rewardType) {
      case 0:
        return 'cash'
      case 4:
        return 'jifen'
      case 2:
        return 'entity'
      case 1:
        return 'points'
    }
  })
  </script>
  
  <style scoped lang="less">
  .record-card {
    padding: 0 20rem;
    height: 188rem;
    border-radius: 20rem;
    box-shadow: 2px 2px 6px #0000000d;
    background-color: #fff;
    position: relative;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    font-family: PingFang SC;
    overflow: hidden;
  
    .status {
      display: flex;
      align-items: center;
      justify-content: center;
      position: absolute;
      top: 0;
      right: 0;
      background-color: #C0DCFF70;
      width: 60rem;
      height: 60rem;
      clip-path: polygon(0 0, 100% 0, 100% 100%, 0 0);
  
      .img {
        position: relative;
        left: 20%;
        bottom: 20%;
        width: 24rem;
        height: 24rem;
      }
    }
  
    .box-img {
      width: 130rem;
      height: 130rem;
      margin-right: 16rem;
    }
  
    .box-info {
      display: flex;
      flex-direction: column;
      justify-content: center;
  
      .box-name {
        font-size: 28rem;
        font-weight: 600;
        line-height: 40rem;
      }
  
      .receive-time {
        font-size: 20rem;
        line-height: 28rem;
        color: #999;
      }
  
      .err {
        font-size: 20rem;
        line-height: 28rem;
        color: #ff0000;
      }
  
      .reward {
        margin-top: 20rem;
        display: flex;
        align-items: center;
        justify-content: flex-start;
  
        &-img-wrap {
          width: 40rem;
          height: 40rem;
          position: relative;
          margin-right: 8rem;
        }
  
        &-img {
          width: 100%;
          height: 100%;
        }
  
        &-num {
          font-size: 28rem;
          font-weight: 600;
          color: #087BFF;
        }
  
        &-unit {
          font-size: 20rem;
          font-weight: 600;
          position: absolute;
          top: 48%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #087BFF;
  
          &.small {
            font-size: 15rem;
          }
        }
      }
    }
  }
  .source-text {
    width: 176rem;
    height: 36rem;
    font-size: 16rem;
    background: linear-gradient(to right, #C0DCFF, #ffffff);
    color: #006FFF;
    border-top-right-radius: 16rem;
  }
  </style>
  