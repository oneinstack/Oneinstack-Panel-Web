<script setup lang="ts">
import { reactive, watch } from 'vue'
import { RewardsType } from '../types/enum'

interface Props {
  /** 转盘奖励类型 */
  type: RewardsType
  /** 奖励金额 */
  amount: number | string
  /** 奖励单位 */
  unit: string
  /** 奖励数量 */
  count?: number
}

const props = withDefaults(defineProps<Props>(), {
  type: RewardsType.RED_PACKET,
  amount: 0,
  unit: '',
  count: 1
})

const conf = reactive({
  currentType: props.type,

  handleOpenRewards() {
    conf.currentType = RewardsType.COIN
  }
})

watch(
  () => props.type,
  (newVal) => {
    conf.currentType = newVal
    if (newVal === RewardsType.RED_PACKET) setTimeout(() => (conf.currentType = RewardsType.COIN), 1500)
  },
  {
    immediate: true
  }
)
</script>

<template>
  <div class="open-rewards">
    <div v-if="conf.currentType === RewardsType.RED_PACKET" class="redpacket" @click.stop="conf.handleOpenRewards">
      <div class="tips">
        {{ `${$t('luckyWheel.congratulations')} ${$t('luckyWheel.onWinning')}` }}
        <br />
        {{ `${count} ${$t('luckyWheel.redEnvelope').toLowerCase()}` }}
      </div>
      <div class="content packet">
        <div class="packet-img" />
        <div class="light-box packet">
          <img
            v-for="v in 8"
            :key="v"
            class="light"
            src="/static/img/luckyWheel/light.webp"
            alt=""
            :style="{ transform: `translate(-50%, -50%) rotate(${v * 45}deg)` }"
          />
        </div>
        <img class="starts" src="/static/img/luckyWheel/starts.webp" alt="" />
      </div>
      <div style="height: 100rem" />
    </div>

    <div v-else class="coin">
      <div class="tips">
        {{ `${$t('luckyWheel.congratulations')} ${$t('luckyWheel.onWinning')}` }}
        <br />
        <span :class="{ 'unit': unit.length > 3 }">{{ unit }}</span>
        {{ amount }}
      </div>
      <div class="content">
        <img class="coin" src="/static/img/luckyWheel/coin.png" />
        <span class="amount">
          <span :class="{ 'unit': unit.length > 3 }">{{ unit }}</span>
          {{ amount }}
        </span>
        <div class="light-box coin">
          <img
            v-for="v in 8"
            :key="v"
            class="light"
            src="/static/img/luckyWheel/light.webp"
            alt=""
            :style="{ transform: `translate(-50%, -50%) rotate(${v * 45}deg)` }"
          />
        </div>
        <img class="starts" src="/static/img/luckyWheel/starts.webp" alt="" />
      </div>
      <div class="btn">{{ $t('luckyWheel.confirm') }}</div>
    </div>
  </div>
</template>

<style scoped lang="less">
.open-rewards {
  font-family: PingFang SC;

  .tips {
    font-size: 40rem;
    text-align: center;
    color: #fef3d2;

    .unit {
      margin-right: 8rem;
      font-size: 32rem;
    }
  }

  .content {
    position: relative;
    margin: 100rem auto;
    width: 511.2rem;
    height: 492rem;
  }

  .redpacket {
    text-align: center;

    @keyframes packetScale {
      0% {
        transform: scale(1);
      }
      100% {
        transform: scale(1.2, 1.3);
      }
    }

    @keyframes packetOpen {
      100% {
        background-image: url('/static/img/luckyWheel/packet-open.webp');
      }
    }

    @keyframes scaleFade {
      100% {
        transform: scale(5);
        opacity: 0;
      }
    }

    .packet-img {
      margin: 0 auto;
      width: 303rem;
      height: 303rem;
      background-image: url('/static/img/luckyWheel/packet-close.webp');
      background-size: cover;
      animation:
        packetScale 0.3s 2,
        packetOpen 0.1s 0.6s ease-out forwards,
        scaleFade 0.75s 1s forwards;
    }
  }

  @keyframes coinScale {
    0% {
      transform: scale(0.5);
    }
  }

  .coin {
    text-align: center;

    img.coin {
      width: 334rem;
      height: 334rem;
      animation: coinScale 0.5s;
    }

    .amount {
      position: absolute;
      left: 50%;
      top: 230rem;
      transform: translateX(-50%);
      font-size: 64rem;
      font-weight: 600;
      background: linear-gradient(180deg, #ffffff 0%, #fde1ab 100%);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      -webkit-text-stroke: 3rem #ef6c33;

      .unit {
        margin-right: 8rem;
        font-size: 48rem;
      }
    }
  }

  .btn {
    width: 592rem;
    height: 100rem;
    border-radius: 74rem;
    background: linear-gradient(180deg, #eb602d 0%, #ffa64f 100%);
    font-size: 48rem;
    font-weight: 500;
    line-height: 90rem;
    text-align: center;
    color: #fff;
  }

  @keyframes startsTwinkle {
    100% {
      opacity: 0;
    }
  }

  .starts {
    width: 635.2rem;
    height: 510rem;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    animation: startsTwinkle 1s 1s ease infinite;
  }

  @keyframes boxRotate {
    100% {
      transform: rotate(360deg);
    }
  }

  @keyframes boxScale {
    0% {
      transform: scale(0);
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

    &.coin {
      animation: boxRotate 3s 0.25s linear infinite;
    }

    &.packet {
      animation: boxScale 1s backwards;
    }

    .light {
      width: 180rem;
      min-width: 180rem;
      height: 304rem;
      position: absolute;
      left: 50%;
      top: 0;
      transform: translate(-50%, -50%);
      transform-origin: center bottom;
      opacity: 0.3;
      z-index: -1;
    }
  }
}
</style>
