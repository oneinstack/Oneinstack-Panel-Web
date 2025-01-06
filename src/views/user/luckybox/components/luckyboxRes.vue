<template>
  <van-popup style="background: transparent;" :close-on-click-overlay="false" v-model:show="conf.show">
    <div class="luckybox-main column items-center relative">
      <div class="row fit-width justify-end" style="margin-bottom: 16rem">
        <img class="close" src="/static/img/luckybox/close.png" @click="conf.close" />
      </div>
      <div class="absolute" style="transform: translate(242rem, 60rem)">
        <div
          class="rotateZ"
          style="width: 669rem; height: 852rem; transform-origin: 94rem 420rem; --anitime-rotateZ: 2.5s"
        >
          <template v-for="l in 8">
            <img
              class="absolute"
              src="/static/img/luckybox/dialog/rbg-1.webp"
              style="width: 188rem; height: 446rem; transform-origin: 94rem 446rem"
              :style="{ transform: `rotateZ(${l * 45}deg)` }"
            />
          </template>
        </div>
      </div>
      <div class="column items-center relative bg-1" style="width: 669rem; height: 852rem">
        <div class="luckybox-tip">
          {{ $t('luckyBox.congratulationsTo') }}
          <br />
          {{ $t('luckyBox.theLuckyBoxReward') }}
        </div>
        <div class="flex flex-center" style="width: 100%; height: 168rem; margin: 24rem 0">
          <div class="award-list flex justify-center">
            <div
              class="award-list-box relative"
              style="overflow: auto"
              :style="{ '--anitime-scroll': `${conf.reward.time}ms` }"
            >
              <div style="width: 100%; height: 168rem; overflow-x: auto">
                <div
                  class="row no-wrap"
                  @touchstart="conf.reward.stopAni"
                  @mousedown="conf.reward.stopAni"
                  :class="[conf.reward.list.length > 4 ? (conf.reward.ani ? 'leftAniOnce' : '') : 'justify-center']"
                >
                  <template v-for="item in conf.reward.list">
                    <div class="column items-center relative no-wrap award-list-item-box">
                      <div class="column items-center award-list-item">
                        <div class="relative" style="width: 64rem; height: 64rem">
                          <img
                            v-if="item.coinCode !== 'USDT'"
                            :src="`/static/img/luckybox/${item.imgurl}.png`"
                            class="award-item-img"
                          />
                          <img v-else src="/static/img/luckybox/cash-usdt.png" class="award-item-img" />
                          <div
                            v-if="item.rewardType === 0 && item.coinCode !== 'USDT'"
                            class="award-item-unit"
                            :class="{ small: item.coinSymbol.length > 1 }"
                          >
                            {{ item.coinSymbol }}
                          </div>
                        </div>
                        <div class="absolute q-text" style="margin-top: 74rem; color: #333333">
                          <span v-if="item.rewardType === 2">{{ item.reward }}</span>
                          x{{ item.rewardType === 2 ? item.num : item.amount }}
                        </div>
                      </div>
                      <div class="label">{{ item.label }}</div>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="luckybox-btn flex flex-center" style="margin-top: -5rem" @click="conf.close">
          <div style="transform: translateY(-4rem)">{{ $t('luckyBox.confirm') }}</div>
        </div>
      </div>
    </div>
  </van-popup>
</template>
<script lang="ts" setup>
import { reactive } from 'vue'

const emit = defineEmits(['close'])
const conf = reactive({
  show: false,
  reward: {
    ani: false,
    stopAni: () => {
      if (!conf.reward.ani) return
      conf.reward.ani = false
      if (conf.reward.list.length > 4) {
        conf.reward.list = conf.reward.list.slice(0, conf.reward.list.length / 2)
      }
    },
    list: [] as any[],
    time: 10000
  },
  open: async (list: any[]) => {
    conf.reward.ani = true
    let arr = [...list]
    if (arr.length > 4) {
      arr = arr.concat(arr)
    }
    conf.reward.list = arr
    conf.reward.time = arr.length * 1500
    conf.show = true
  },
  close: () => {
    conf.show = false
    emit('close')
  }
})

defineExpose({
  open: conf.open
})
</script>
<style lang="less" scoped>
.bg-1 {
  background-size: 100% 100%;
  background-image: url('/static/img/luckybox/dialog/bg-1.webp');
}
.luckybox {
  &-main {
    width: 750rem;
    overflow: hidden;
    .close {
      width: 60rem;
      height: 60rem;
      margin-right: 52rem;
    }
  }
  &-tip {
    width: 330rem;
    margin-top: 280rem;
    text-align: center;
    font-size: 24rem;
    font-weight: 600;
  }
  &-btn {
    width: 464rem;
    height: 100rem;
    background: linear-gradient(180deg, #eb602d 0%, #ffa64f 100%);
    box-shadow: 4rem 10rem 20rem #f0703533;
    border-radius: 74rem;
    color: #fff;
    font-weight: 500;
    font-size: 48rem;
  }
}

/* #ifdef H5 */

.award-list {
  width: 468rem;
  height: 168rem;
  color: #fff;
  &-box {
    font-size: 16rem;
    width: 468rem;
    height: 168rem;
    overflow: hidden;
  }
  &-item-box {
    width: 108rem;
    height: 168rem;
    margin: 0rem 6rem;
    .label {
      text-align: center;
      color: #999999;
      width: 100rem;
      margin-top: 4rem;
    }
  }
  &-item {
    padding-top: 8rem;
    width: 108rem;
    height: 108rem;
    min-height: 108rem;
    background: #fff3df;
    border-radius: 8rem;
  }
  .q-num {
    margin-top: 39rem;
    margin-left: 14rem;
    font-size: 16rem;
  }
  .award-item-img {
    width: 100%;
    height: 100%;
  }
  .award-item-unit {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 28rem;
    font-weight: 600;
    color: #fa9e3e;

    &.small {
      top: 48%;
      font-size: 20rem;
    }
  }
}

@media (min-width: 960px) {
  .luckybox {
    &-main {
      max-width: 750rem;
    }
  }
}
/* #endif */

.leftAniOnce {
  animation: leftAni var(--anitime-scroll) linear;
}

.leftAni {
  animation: leftAni var(--anitime-scroll) infinite linear;
}

@keyframes leftAni {
  0% {
    transform: translateX(0);
  }

  100% {
    transform: translateX(-50%);
  }
}

.rotateZ {
  animation: rotateZ var(--anitime-rotateZ) infinite linear;
}

@keyframes rotateZ {
  0% {
    transform: rotateZ(0deg);
  }

  100% {
    transform: rotateZ(360deg);
  }
}
</style>
