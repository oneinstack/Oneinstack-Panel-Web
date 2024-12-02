<script setup lang="ts">
import { reactive } from 'vue'

interface Props {
  /** 头像 */
  avatar: string
  /** 昵称 */
  name: string
}

defineProps<Props>()

const isReceive = reactive({
  value: false,
  view: false,
  set: () => {
    isReceive.value = true
    setTimeout(() => (isReceive.view = true), 1000)
  }
})
</script>

<template>
  <div>
    <div v-if="!isReceive.view" class="assist-friend" :class="{ open: isReceive.value }" @click.stop="isReceive.set">
      <img class="friend-avatar" :src="avatar" alt="" />
      <div class="title">
        {{ $t('luckyWheel.assistSuccess', { name }) }}
      </div>
      <div class="subTitle">
        {{ $t('luckyWheel.assistSubTitle') }}
      </div>
      <img class="packet-btn" src="/static/img/luckyWheel/packet-btn.webp" alt="" />
    </div>

    <div v-else class="receive-times">
      <div class="title">
        {{ $t('luckyWheel.congratulations') }}!
        <br />
        {{ $t('luckyWheel.assistReceive') }}
      </div>
      <div class="times">
        <span>1</span>
        <span class="unit">{{ $t('luckyWheel.times') }}</span>
      </div>
      <div class="btn">{{ $t('luckyWheel.confirm') }}</div>
      <div class="light-box">
        <img
          v-for="v in 8"
          :key="v"
          class="light"
          src="/static/img/luckyWheel/light.webp"
          alt=""
          :style="{ transform: `translate(-50%, -50%) rotate(${v * 45}deg)` }"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
@keyframes packetTurn {
  100% {
    transform: rotateY(720deg) scaleY(1.5);
    opacity: 0;
  }
}

.assist-friend {
  padding: 80rem;
  position: relative;
  width: 570rem;
  height: 788rem;
  background-image: url('/static/img/luckyWheel/nobtn-packet.png');
  background-size: 100% 100%;
  color: #fff8da;
  text-align: center;

  &.open {
    animation: packetTurn 0.5s linear forwards;
  }

  .friend-avatar {
    width: 116rem;
    height: 116rem;
    border-radius: 50%;
    margin-bottom: 40rem;
    background-color: lightgray;
  }

  .title {
    font-size: 32rem;
    font-weight: 600;
  }

  .subTitle {
    margin: 20rem auto;
    width: 294rem;
    font-size: 20rem;
  }

  @keyframes animate {
    100% {
      transform: scale(1.1);
    }
  }
  .packet-btn {
    position: absolute;
    left: calc(570rem / 2 - 314rem / 2);
    bottom: 36rem;
    width: 314rem;
    height: 344rem;
    animation: animate 1s linear infinite alternate;
  }
}

@keyframes scaleIn {
  0% {
    transform: scale(0);
    opacity: 0;
  }
}

.receive-times {
  width: 570rem;
  height: 788rem;
  background-image: url('/static/img/luckyWheel/receive-times.webp');
  background-size: 100% 100%;
  color: #f93f09;
  text-align: center;
  padding: 68rem 36rem;
  position: relative;
  animation: scaleIn 0.25s;

  .title {
    margin: 0 auto 48rem;
    width: 428rem;
    font-size: 32rem;
    font-weight: 600;
    text-align: center;
    color: #cd5e2c;
  }

  .times {
    height: min-content;
    font-size: 192rem;
    font-weight: 600;
    text-align: center;
    position: relative;

    .unit {
      position: absolute;
      bottom: 40rem;
      font-size: 40rem;
    }
  }

  .btn {
    position: absolute;
    bottom: 68rem;
    width: 496rem;
    height: 92rem;
    border-radius: 96rem;
    background: linear-gradient(180deg, #ffecd7 0%, #ffc97e 51.14%, #fff8f0 100%);
    box-shadow: 2px 4px 4px 0px #0000001a;
    font-size: 32rem;
    font-weight: 600;
    text-align: center;
    color: #fa1f00;
    line-height: 92rem;
  }

  @keyframes boxRotate {
    100% {
      transform: rotate(360deg);
    }
  }

  .light-box {
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0;
    top: 5%;
    transform-origin: center 30%;
    z-index: -1;
    animation: boxRotate 3s linear infinite;

    .light {
      width: 240rem;
      min-width: 240rem;
      height: 500rem;
      position: absolute;
      left: 50%;
      top: 0;
      transform: translate(-50%, -50%);
      transform-origin: center bottom;
      opacity: 0.5;
      z-index: -1;

      // @for $i from 0 through 9 {
      //   &:nth-of-type(#{$i}) {
      //     transform: translate(-50%, -50%) rotate(calc(#{$i} * 45deg));
      //   }
      // }
    }
  }
}
</style>
