<template>
  <div class="div-box">
    <div class="row items-center no-wrap level1-box" v-scroll>
    <div
      class="type-item flex justify-center items-start relative text-no-wrap"
      v-for="item in conf.level1.list"
      :class="{ active: item.name === conf.level1.item.name }"
      @click="conf.level1.change(item)"
    >
      {{ $t('lhc.' + item.name) }}
      <img
        src="/static/images/point_up.png"
        style="height: 16rem; width: 26rem; transition: 0.3s;margin: 6rem 0 0 10rem;"
        v-if="item.name === conf.level1.item.name"
        :class="{ 'rotate-180': conf.showLeve2 }"
      />
    </div>
  </div>
  <template v-if="conf.showLeve2">
    <div class="choose-dialog-mask" @click="conf.showLeve2 = false"></div>
    <div class="choose-dialog">
      <div style="padding: 0 32rem">
          <div class="row">
            <div
              class="type-item flex flex-center"
              v-for="item in conf.level2.list"
              :class="{ active: item.isActive }"
              @click="conf.level2.change(item)"
            >
              <span :class="{ activeName: item.isActive}">{{ $t('lhc.' + item.name) }}</span>
            </div>
          </div>
          <div style="height: 32rem; border-bottom: 1rem solid #f6f7fa; width: 100%"></div>
          <div class="row items-center justify-between">
            <div class="text-color-1" @click="conf.showLeve2 = false">{{ $t('chat.cancle') }}</div>
            <div class="text-color-1" @click="conf.level2.confirm()">{{ $t('chatRoom.confirm') }}</div>
          </div>
      </div>
    </div>

  </template>
  

  </div>
</template>
<script setup lang="ts">
import { Scope } from 'tools-vue3'
import { MarkSixConfInter } from '../../MarkSix'

const mconf = Scope.getConf<MarkSixConfInter>()
const conf = mconf.conf.betting.tabs
</script>
<style lang="less" scoped>
.level1-box {
  margin-top: 20rem;
  gap: 35rem;
  width: 100%;
  .type-item {
    height: 50rem;
    border-radius: 6rem;
    min-width: max-content;
    color: #999999;

    flex-shrink: 0;
    border-radius: 8rem;
    overflow: hidden;
    font-size: 24rem;
    line-height: 28rem;

    &.active {
      color: #333333;
    }
    &.active::before {
      content: '';
      position: absolute;
      bottom: 0;
      margin: 0 auto;
      width: 40%;
      height: 6rem;
      border-radius: 24rem;
      background: linear-gradient(109.77deg, #087BFF 4.47%, #0645D9 138.81%);
    }
  }
}
.div-box{
  position: relative;
  padding: 0 32rem;
  .choose-dialog {
    position: absolute;
    top: calc(100% + 20rem);
    left: 0;
    width: 100%;
    background-color: #fff;
    border-bottom-left-radius: 40rem;
    border-bottom-right-radius: 40rem;
    z-index: 1;
    .choose-level1-name{
      margin: 20rem 0;
    }
    &-item {
      width: 160rem;
      height: 64rem;
      border-radius: 8rem;
      background-color: #f6f7fa;
      color: #646464;
      font-size: 26rem;
      &.active {
        background-color: #fff6e6;
      }
    }
    .row{
        gap: 15rem;
        margin-top: 20rem;
        max-height: 300rem;
        overflow-y: auto;
    }
    .type-item {
      padding: 10rem;
      width: 218rem;
      border-radius: 8rem;
      background-color: #f6f7fa;
      color: #999999;
      font-size: 26rem;
      word-break: break-word !important;
      text-align: center;

      &.active {
        color: #333;
        background-color: #e6f2ff;
        position: relative;
        .activeName{
          background: linear-gradient(109.77deg, #087BFF 4.47%, #0645D9 138.81%);
          background-clip: text;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          color: transparent;
        }
      }
      &.active::before {
        content: '';
        position: absolute;
        bottom: 0;
        right: 0;
        width: 20rem;
        height: 20rem;
        background: url('/static/theme/blue/tabs-active.png') no-repeat center center / 100% 100%;
      }
    }
    .text-color-1 {
      font-size: 32rem;
      font-weight: 600;
      background-image: -webkit-linear-gradient(109.77deg, #087BFF 4.47%, #0645D9 138.81%);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      line-height: 80rem;
    }
    .text-color-item {
      background-image: -webkit-linear-gradient(109.77deg, #087BFF 4.47%, #0645D9 138.81%);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  }
}

.choose-dialog-mask {
  position: fixed;
  top: 50%;
  left: 0;
  width: 100vw;
  height: 50vh;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1;
}

.rotate-180 {
  transform: rotateZ(180deg);
}

</style>
