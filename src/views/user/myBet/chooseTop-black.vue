<template>
  <div>
    <div class="choose-dialog-mask" v-if="conf.dialog.show" @click="conf.dialog.cancel"></div>
    <div class="row top-mask">
      <div style="margin: 36rem 24rem" class="row no-wrap relative">
        <div class="choose-item row items-center no-wrap" @click="conf.dialog.openRef('lotteryType')">
          <div style="margin: 0 20rem; width: 100%" class="row items-center justify-between">
            <div class="col row no-wrap" style="text-wrap: nowrap">
              <div>{{ conf.lottery.type.label }}</div>
              <div v-if="conf.lottery.item.key" class="row no-wrap">
                <div style="margin: 0 6rem">-</div>
                {{ conf.lottery.item.label }}
              </div>
            </div>
            <div class="r-arrow flex-center">
              <van-icon size="24rem" color="#fff" name="arrow-down" style="transition: 0.3s" :class="{ 'rotate-180': conf.dialog.show && conf.dialog.showRef === 'lotteryType' }" />
            </div>
          </div>
        </div>
        <div class="choose-item row items-center no-wrap" style="margin-left: 20rem; width: 340rem"
          @click="conf.dialog.openRef('betTime')">
          <div style="margin: 0 20rem; width: 100%" class="row items-center justify-between">
            <div class="col row no-wrap" style="text-wrap: nowrap">
              <div>{{ conf.bettime.item.label }}</div>
            </div>
            <div class="r-arrow flex-center">
              <van-icon size="24rem" color="#fff" name="arrow-down" style="transition: 0.3s" :class="{ 'rotate-180': conf.dialog.show && conf.dialog.showRef === 'betTime' }" />
            </div>
          </div>
        </div>
      </div>
      <div class="choose-dialog" v-show="conf.dialog.show">
        <div style="padding: 0 32rem">
          <chooseTree v-show="conf.dialog.showRef === 'lotteryType'" ref="lotteryTypeRef"
            @confirm="conf.lottery.confirm" :title="[$t('home.lottery'), $t('SattaKing.GameType')]" />
          <chooseTree v-show="conf.dialog.showRef === 'betTime'" ref="betTimeRef" @confirm="conf.bettime.confirm"
            :title="[$t('otcOrderDetailsModule.Time')]" />
          <div style="height: 32rem; border-bottom: 1rem solid #f6f7fa; width: 100%"></div>
          <div class="row items-center justify-between">
            <div class="text-color-1" @click="conf.dialog.cancel">{{ $t('chat.cancle') }}</div>
            <div class="text-color-1" @click="conf.dialog.confirm">{{ $t('chatRoom.confirm') }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref } from 'vue'
import chooseTree from './chooseTree-black.vue'
import { index } from './chooseTop'

const emit = defineEmits(['confirm'])

const lotteryTypeRef = ref()
const betTimeRef = ref()

const conf = index({ emit, lotteryTypeRef, betTimeRef })

defineExpose({
  getList: conf.getList
})
</script>
<style lang="less" scoped>
.top-mask {
  box-shadow: 0rem 0rem 10rem 0rem rgba(0, 0, 0, 0.1);
  z-index: 10;
  position: relative;
}

.rotate-180 {
  transform: rotateZ(180deg);
}

.choose-item {
  width: 340rem;
  height: 80rem;
  background: #363B3C;
  border-radius: 14rem;
  font-size: 28rem;
  color: #333;
  font-weight: 500;
  border: 2rem solid #4B5253;
  font-family: Poppins;
  font-weight: 600;
  font-size: 24rem;
  color: #fff;
}

.r-arrow {
  height: 44rem;
  width: 44rem;
  background: #464F50;
  border-radius: 12rem;
}

.choose-dialog {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background: #232626;
  border-bottom-left-radius: 40rem;
  border-bottom-right-radius: 40rem;

  &-item {
    width: 160rem;
    height: 64rem;
    border-radius: 8rem;
    background-color: #f6f7fa;
    color: #646464;
    font-size: 26rem;

    &.active {
      background-color: #e6f2ff;
      color: #006fff;
    }
  }
}

.choose-dialog-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1;
}

.text-color-1 {
  font-size: 32rem;
  font-weight: 600;
  color: #1CF187;
  line-height: 80rem;
}

.text-color-item {
  background: linear-gradient(93.51deg, #006fff 5.72%, #087bff 86.61%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
</style>
