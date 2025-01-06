<template>
  <div>
    <div class="choose-dialog-mask" v-if="conf.dialog.show" @click="conf.dialog.cancel"></div>
    <div class="row top-mask">
      <div style="margin: 36rem 58rem" class="row no-wrap relative">
        <div class="choose-item row items-center no-wrap" @click="conf.dialog.openRef('lotteryType')">
          <div style="margin: 0 20rem; width: 100%" class="row items-center justify-between">
            <div class="col row justify-center no-wrap" style="text-wrap: nowrap">
              <div>{{ conf.lottery.type.label }}</div>
              <div v-if="conf.lottery.item.key" class="row no-wrap">
                <div style="margin: 0 6rem">-</div>
                {{ conf.lottery.item.label }}
              </div>
            </div>
            <img
              src="/static/images/point_up.png"
              style="height: 22rem; width: 33rem; transition: 0.3s"
              :class="{ 'rotate-180': conf.dialog.show && conf.dialog.showRef === 'lotteryType' }"
            />
          </div>
        </div>
        <div
          class="choose-item row items-center no-wrap"
          style="margin-left: 32rem; width: 280rem"
          @click="conf.dialog.openRef('betTime')"
        >
          <div style="margin: 0 20rem; width: 100%" class="row items-center justify-between">
            <div class="col row justify-center no-wrap" style="text-wrap: nowrap">
              <div>{{ conf.bettime.item.label }}</div>
            </div>
            <img
              src="/static/images/point_up.png"
              style="height: 22rem; width: 33rem; transition: 0.3s"
              :class="{ 'rotate-180': conf.dialog.show && conf.dialog.showRef === 'betTime' }"
            />
          </div>
        </div>
      </div>
      <div class="choose-dialog" v-show="conf.dialog.show">
        <div style="padding: 0 32rem">
          <chooseTree
            v-show="conf.dialog.showRef === 'lotteryType'"
            ref="lotteryTypeRef"
            @confirm="conf.lottery.confirm"
            :title="[$t('home.lottery'), $t('SattaKing.GameType')]"
          />
          <chooseTree
            v-show="conf.dialog.showRef === 'betTime'"
            ref="betTimeRef"
            @confirm="conf.bettime.confirm"
            :title="[$t('otcOrderDetailsModule.Time')]"
          />
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
import chooseTree from './chooseTree.vue'
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
  background-color: #fff;
  box-shadow: 0rem 0rem 10rem 0rem rgba(0, 0, 0, 0.1);
  z-index: 10;
  position: relative;
}
.rotate-180 {
  transform: rotateZ(180deg);
}
.choose-item {
  width: 320rem;
  height: 64rem;
  background-color: #f6f7fa;
  border-radius: 12rem;
  font-size: 28rem;
  color: #333;
  font-weight: 500;
}

.choose-dialog {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background-color: #fff;
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
      background-color: #fff6e6;
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
  background-image: -webkit-linear-gradient(90deg, #eb602d 0%, #ffa64f 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 80rem;
}
.text-color-item {
  background-image: -webkit-linear-gradient(90deg, #ff7502 0%, #fc9b01 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
</style>
