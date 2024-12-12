<script setup lang="ts">
import { computed, reactive } from 'vue'
import selfInfo from './self-info.vue'
import { Scope } from 'tools-vue3'
import sani from '@/sstore/sani'

interface Times {
  /** 提现次数 */
  withdrawal: number
  /** 免费转盘次数 */
  freeSpins: number
}

interface Amount {
  /** 单位 */
  unit: string
  /** 领取金额 */
  received: number
}

interface Props {
  /** 头像 */
  avatar: string
  /** 是否显示 */
  show: boolean
  /** 次数 */
  times: Times
  /** 金额 */
  amount: Amount
}

interface Emits {
  (e: 'open'): void
  (e: 'end'): void
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  times: () => ({
    withdrawal: 1,
    freeSpins: 0
  }),
  amout: () => ({
    received: '',
    unit: ''
  })
})

const emit = defineEmits<Emits>()
const ani = sani.Ani()
const conf = reactive({
  timerId: null,
  countToReceived: 0,
  // 1 - 领取红包；2 - 文字提示； 3 - 确认领取； 4 - 金额增加动画
  steps: {
    value: 1,
    next: () => {
      switch (conf.steps.value) {
        case 1:
          emit('open')
          break
        case 2:
          ani({
            start: 0,
            end: props.amount.received,
            duration: 1500,
            update: (value) => {
              conf.countToReceived = parseInt(value)
            }
          })
          break
        case 3:
          break
        case 4:
          if (conf.timerId) timer.un(conf.timerId)
          return emit('end')
      }
      conf.steps.value++
      conf.countdown.start(conf.steps.value)
    }
  },
  countdown: {
    value: 3,
    start: (step: number) => {
      conf.countdown.value = 3
      timer.clear()
      conf.timerId = timer.on(() => {
        if (conf.countdown.value <= 0) {
          conf.steps.value === step && conf.steps.next()
          return
        }
        conf.countdown.value--
      }, 1000)
    }
  },
  withdrawalTimes: computed(() => {
    let unit
    switch (props.times.withdrawal) {
      case 1:
        unit = 'st'
        break
      case 2:
        unit = 'nd'
        break
      case 3:
        unit = 'rd'
        break
      default:
        unit = 'th'
        break
    }
    return props.times.withdrawal + unit
  })
})

const timer = Scope.Timer()
</script>

<template>
  <transition name="fade-zoom-in" mode="out-in">
    <x-page v-if="show" headerBgColor="transparent" noFooter :topfill="false">
      <div class="entry-animation-container" :class="{ bg: conf.steps.value === 1 }">
        <div v-if="conf.steps.value === 1" class="receive-view" @click="conf.steps.next">
          <div class="receive">
            <van-icon class="close" name="close" color="#FFFFFF" size="60rem" />
            <div class="receive-packet">
              <img class="avatar" :src="avatar" alt="" />
              <div v-html="$t('luckyWheel.entryTitle')" class="title" />
              <div v-html="$t('luckyWheel.entrySubTitle')" class="subTitle" />
              <img class="packet-btn" src="/static/img/luckyWheel/packet-btn.webp" alt="" />
            </div>
          </div>
        </div>

        <div v-else-if="conf.steps.value === 2" class="desc-view" @click="conf.steps.next">
          <div class="circle-light" />
          <div v-for="i in 6" :key="i" class="circle" :class="`circle-${i}`" />
          <img class="starts" src="/static/img/luckyWheel/firstIn-starts.webp" mode="" />
          <div class="content">
            <img class="light turn" src="/static/img/luckyWheel/firstIn-light.webp" mode="" />
            <img class="light" src="/static/img/luckyWheel/firstIn-light.webp" mode="" />

            <div class="text-box">
              <img class="text-bg-img" src="/static/img/luckyWheel/firstIn-textBg.webp" mode="" />
              <div class="text">
                <div v-html="$t('luckyWheel.withdrawalTimes', { num: conf.withdrawalTimes })" />
                <div v-html="$t('luckyWheel.freeSpins', { num: times.freeSpins })" />
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="conf.steps.value === 3" class="confirm-receive" @click="conf.steps.next">
          <div class="tip">
            {{ $t('luckyWheel.congratulationsReceiving', { amount: `${amount.unit}${amount.received}` }) }}
          </div>
          <div class="redpacket">
            <div class="amount">
              <span class="unit" :class="{ small: amount.unit.length > 2 }">{{ amount.unit }}</span>
              <!-- <u-count-to v-if="conf.steps.value === 3" :endVal="amount.received" color="#EF1017" fontSize="80rem" bold /> -->
              <span v-if="conf.steps.value === 3" style="font-size: 80rem; color: #ef1017; font-weight: bold">
                {{ conf.countToReceived }}
              </span>
            </div>
          </div>
          <div class="btn">{{ $t('luckyWheel.receive') }}({{ conf.countdown.value }})</div>
        </div>

        <div v-else-if="conf.steps.value === 4" class="money-increase-view" @click="emit('end')">
          <div class="money-increase-card">
            <selfInfo style="top: -100rem" />
            <div class="tip">{{ $t('luckyWheel.haveReceived') }}</div>
            <div class="amount">
              <span class="float-add">+{{ amount.received }}</span>
              <span class="unit" :class="{ small: amount.unit.length > 2 }">{{ amount.unit }}</span>
              <div class="num-box">
                <van-rolling-text class="num" :target-num="amount.received" />
                <span>.</span>
                <van-rolling-text class="num" :target-num="0" />
                <van-rolling-text class="num" :target-num="0" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </x-page>
  </transition>
</template>

<style scoped lang="less">
@import url('../styles/animation.css');

.entry-animation-container {
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.85);
  background-repeat: no-repeat;
  background-size: 100% 100%;
  font-family: PingFang SC;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;

  &.bg {
    background-image: url('/static/img/luckyWheel/firstIn-bg.webp');
  }
}

.receive-view {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

  .close {
    width: 100%;
    display: flex;
    justify-content: flex-end;
    margin-bottom: 60rem;
  }

  .receive-packet {
    padding: 80rem;
    position: relative;
    width: 570rem;
    height: 788rem;
    background-image: url('/static/img/luckyWheel/nobtn-packet.png');
    background-size: 100% 100%;
    color: #fff8da;
    text-align: center;
    animation: shake 3s infinite;

    .avatar {
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

    .packet-btn {
      position: absolute;
      left: calc(570rem / 2 - 314rem / 2);
      bottom: 36rem;
      width: 314rem;
      height: 344rem;
      animation: scale11 0.5s linear infinite alternate;
    }
  }
}

.desc-view,
.confirm-receive,
.money-increase-view {
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
  background-color: transparent;
  display: flex;
  justify-content: center;
  align-items: center;
  animation: fadeIn 0.25s;
}

.desc-view {
  position: relative;

  .circle {
    position: absolute;
    background-color: rgba(255, 255, 255, 0.15);
    border-radius: 50%;
    opacity: 0;
    animation: zoomOut1 0.75s 0.75s;

    &-1 {
      left: 398rem;
      top: 554rem;
      width: 104rem;
      height: 104rem;
    }

    &-2 {
      left: 510rem;
      top: 446rem;
      width: 82rem;
      height: 82rem;
    }

    &-3 {
      left: 564rem;
      top: 446rem;
      width: 68rem;
      height: 68rem;
    }

    &-4 {
      left: 42rem;
      top: 638rem;
      width: 76rem;
      height: 76rem;
    }

    &-5 {
      left: 118rem;
      top: 936rem;
      width: 98rem;
      height: 98rem;
    }

    &-6 {
      left: 512rem;
      top: 896rem;
      width: 98rem;
      height: 98rem;
    }
  }

  .starts {
    position: absolute;
    width: 624rem;
    height: 588rem;
    opacity: 0;
    animation:
      zoomOut1 1s 0.75s forwards,
      fadeIn 1s 0.75s infinite;
  }

  .content {
    width: 100%;
    height: 272rem;
    position: relative;
    display: flex;
    align-items: center;

    &::before {
      content: '';
      position: absolute;
      width: 100%;
      height: 100%;
      background-color: #fff2cf;
      z-index: 1;
      animation: slideIn-left 0.75s;
    }

    &::after {
      content: '';
      position: absolute;
      width: 100%;
      height: 70%;
      background-color: #fff;
      z-index: 1;
      animation: slideIn-right 0.5s;
    }

    .light {
      position: absolute;
      top: 145rem;
      width: 100%;
      height: 100%;
      animation: slideIn-right 0.5s 0.3s;

      &.turn {
        top: -145rem;
        transform: rotate(180deg);
        animation: slideIn-right-rotate180 0.5s 0.3s;
      }
    }

    .text-box {
      width: 100%;
      height: 248rem;
      font-size: 44rem;
      font-weight: 500;
      line-height: 61.6rem;
      letter-spacing: -1rem;
      text-align: center;
      color: #ffffff;
      position: relative;

      .text-bg-img {
        position: absolute;
        left: 0;
        bottom: 0;
        width: 100%;
        height: 248rem;
        animation: slideIn-left 0.5s;
        z-index: 2;
      }

      .text {
        opacity: 0;
        margin-top: 56rem;
        height: 100%;
        position: relative;
        z-index: 3;
        animation: zoomIn3 0.5s 0.5s forwards;

        ::v-deep(.hightlight) {
          color: #fff3b3;
        }
      }
    }
  }
}

.confirm-receive {
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;
  padding: 0 128rem;

  .tip {
    font-size: 40rem;
    font-weight: 500;
    line-height: 56rem;
    text-align: center;
    color: #fff1c7;
    text-shadow: 0 0 120rem red;
  }

  .redpacket {
    margin: 98rem 0 160rem;
    width: 403rem;
    height: 404rem;
    background-image: url('/static/img/luckyWheel/firstIn-packet.png');
    background-size: 100% 100%;
    animation: zoomOut1 0.25s;

    .amount {
      padding-top: 58rem;
      text-align: center;
      color: #ef1017;
      font-size: 80rem;
      font-weight: 600;

      .unit {
        margin-right: 8rem;
        font-size: 40rem;

        &.small {
          font-size: 18rem;
        }
      }
    }
  }

  .btn {
    width: 498rem;
    height: 88rem;
    border-radius: 74rem;
    background: linear-gradient(180deg, #eb602d 0%, #ffa64f 100%);
    font-size: 40rem;
    font-weight: 500;
    line-height: 88rem;
    text-align: center;
    color: #ffffff;
    box-shadow: 8rem 8rem 40rem 0 #ed3f1880;
  }
}

.money-increase-card {
  margin-top: 256rem;
  padding: 32rem 16rem;
  position: relative;
  align-self: flex-start;
  width: 592rem;
  height: 296rem;
  border-radius: 28rem;
  background-color: #ffffff;
  border: 1rem solid #ffe0c4;
  outline: 8rem solid #ffffff;
  text-align: center;

  .tip {
    margin-bottom: 32rem;
    font-size: 32rem;
    font-weight: 600;
    line-height: 44.8rem;
    text-align: center;
    color: #cd5e2c;
  }

  .amount {
    padding: 0 80rem;
    width: 100%;
    height: 128rem;
    display: flex;
    justify-content: center;
    align-items: flex-end;
    font-size: 108rem;
    font-weight: 600;
    color: #ef1017;
    position: relative;

    .float-add {
      position: absolute;
      right: 0;
      top: -40%;
      font-size: 40rem;
      font-weight: 400;
      text-align: center;
      opacity: 0;
      animation: slide-top 0.5s;
    }

    .unit {
      padding-top: 54rem;
      padding-right: 8rem;
      height: 100%;
      font-size: 48rem;

      &.small {
        font-size: 20rem;
      }
    }

    .num-box {
      display: inline-flex;
      align-items: flex-end;
    }

    .num {
      width: 100%;
      height: 100%;
      display: flex;
      flex-flow: row nowrap;
      justify-content: flex-start;
      align-items: center;
      --van-rolling-text-color: #ef1017;
      --van-rolling-text-font-size: 96rem;

      ::v-deep(.van-rolling-text-item--down) {
        width: 100%;
        height: 125rem !important;
      }

      ::v-deep(.van-rolling-text-item__box > .van-rolling-text-item__item) {
        line-height: 125rem !important;
      }
    }
  }
}
</style>
