<script setup lang="ts">
import { computed, reactive, StyleValue } from 'vue'
import { RewardsType } from '../types/enum'

export interface CellData {
  /** 转盘格子的文字 */
  label: string
  /** 转盘格子的类型 */
  type: RewardsType
}

export interface Props {
  /** 转盘格子的数据 */
  cellData?: CellData[]
  /** 转盘格子的颜色 */
  colors?: string[]
  /** 转盘的宽高，单位rem */
  size?: number
  /** 剩余的转动次数 */
  times?: number
  /** 转盘是否禁用 */
  disabled?: boolean
  /** 转盘的文字 */
  text?: string
}

interface Emits {
  (e: 'click'): void
  (e: 'disabled-click'): void
  (e: 'start'): void
  (e: 'end', data: CellData): void
}

const props = withDefaults(defineProps<Props>(), {
  cellData: () =>
    Array.from({ length: 6 }, (_, index) => ({
      label: index % 2 ? 'Random red envelope' : 'Cash',
      type: index % 2 ? RewardsType.RED_PACKET : RewardsType.COIN
    })),
  colors: () => ['#fff', '#feebba'],
  size: 450,
  times: 0,
  disabled: false,
  text: ''
})

const emit = defineEmits<Emits>()

const conf = reactive({
  /** 每个扇形区域的度数 */
  radis: 360 / props.cellData.length,
  /** 计算随机中奖的位置 */
  n: 0,
  /** 初始转动的角度 */
  initRadis: 360 * 8,
  /** 转动时间 */
  time: 3 * 1000,
  /** 限制一个转动周期只能点击一次 */
  isRotating: false,
  /** 转动角度计算公式 */
  totalRadis: 0,
  attrs: null as any,

  wrapStyle: computed<StyleValue>(() => ({
    width: `${props.size}rem`,
    height: `${props.size}rem`
  })),

  pieceStyle: computed<StyleValue>(() => ({
    width: `${props.size / 2}rem`,
    height: `${props.size}rem`,
    borderRadius: `0 ${props.size / 2}rem ${props.size / 2}rem 0`
  })),

  sinLength: computed(() => (props.size / 2) * Math.sin((2 * Math.PI) / props.cellData.length)),

  getColor(i: number) {
    const len = props.colors.length
    if (props.disabled) return ['#BBBABA', '#D3D3D3'][i % len]
    if (len && len === 1) return props.colors[0]
    return props.colors[i % len]
  },

  randomArr: (start: number, end: number) => {
    return Math.floor(start + Math.random() * (end - start))
  },

  start() {
    if (props.disabled) return emit('disabled-click')
    emit('click')
    if (conf.isRotating || !props.times) return
    emit('start')
    conf.n = conf.randomArr(0, 360 / conf.radis)
    conf.totalRadis = conf.initRadis + conf.radis * conf.n - conf.radis / 2
    conf.isRotating = true
    conf.attrs = {
      transform: `rotate(${conf.totalRadis}deg)`,
      transition: 'transform 3s cubic-bezier(0,.47,.31,1)'
    }
    setTimeout(() => {
      conf.attrs = {
        transform: `rotate(${conf.radis * conf.n - conf.radis / 2}deg)`
      }
      conf.isRotating = false
      emit('end', props.cellData[conf.n])
    }, conf.time)
  }
})
</script>

<template>
  <div class="turntable-container">
    <div class="piece-wrap" :style="[conf.wrapStyle, conf.attrs]">
      <div
        v-for="(item, i) in cellData"
        :key="i"
        class="piece"
        :style="[
          conf.pieceStyle,
          {
            transform: `rotate(${conf.radis * i}deg)`,
            backgroundImage: `linear-gradient(${90 + conf.radis}deg, ${conf.getColor(i)} ${conf.sinLength}rem, transparent 0)`,
            border: `8rem solid ${i % 2 ? '#ef1116' : '#e77540'}`,
            borderLeft: 'transparent'
          }
        ]"
      >
        <div class="content" :style="{ transform: `rotate(${conf.radis / 2}deg) translateX(-45%)` }">
          <div class="text">{{ item.label }}</div>
          <img v-if="item.type === 'redpacket'" src="/static/img/luckyWheel/redpacket-small.webp" />
          <img v-else src="/static/img/luckyWheel/coin-small.webp" />
        </div>
      </div>
    </div>
    <div class="btn" @click="conf.start">
      <div v-if="!disabled" class="times">{{ times }}</div>
      <img v-if="!disabled" src="/static/img/luckyWheel/pointer.png" class="pointer" />
      <span class="text" :class="{ small: text.length > 5 }">{{ text }}</span>
    </div>
  </div>
</template>

<style scoped lang="less">
.turntable-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background-image: url('/static/img/luckyWheel/wheel-border.webp');
  background-size: 100% 100%;
  position: relative;

  .piece-wrap {
    position: relative;
    margin: 0 auto;
    outline: 16rem solid #fed77c;
    border-radius: 50%;
    overflow: hidden;

    .piece {
      position: absolute;
      left: 50%;
      top: 0;
      transform-origin: left center;
      display: flex;

      .content {
        color: #d11d0d;
        padding-top: 24rem;
        font-size: 16rem;
        font-weight: bold;
        display: flex;
        flex-flow: column nowrap;
        align-items: center;

        .text {
          text-align: center;
          padding-top: 12rem;
          width: 100rem;
        }

        img {
          width: 80rem;
          height: 80rem;
        }
      }
    }
  }

  .btn {
    width: 168rem;
    height: 168rem;
    border-radius: 50%;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    line-height: 168rem;
    text-align: center;
    color: #fff;
    font-weight: bold;
    background-image: url('/static/img/luckyWheel/wheel-btn.webp');
    background-size: 100% 100%;

    .text {
      font-size: 32rem;

      &.small {
        font-size: 24rem;
      }
    }

    .times {
      height: 48rem;
      line-height: 24rem;
      border: 1px solid #fff1b9;
      border-radius: 48rem;
      padding: 8rem 12rem;
      position: absolute;
      right: -4rem;
      top: 16rem;
      background: linear-gradient(to bottom, #fff1b9, #fa1f00);
    }

    @keyframes animate {
      100% {
        transform: translate(24rem, 24rem);
      }
    }

    .pointer {
      position: absolute;
      right: -16rem;
      bottom: -32rem;
      width: 100rem;
      height: 100rem;
      animation: animate 1s ease infinite alternate;
    }
  }
}
</style>
