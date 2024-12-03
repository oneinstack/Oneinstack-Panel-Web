<template>
  <div
    class="mask"
    :style="{
      height: `100%`
    }"
  >
    <div class="red_packet" id="red_packet">
      <template v-for="(item, index) in redpacketsRe">
        <div
          class="package"
          :style="{
            left: item.left,
            width: item.redWidth,
            height: item.height
          }"
          v-if="item.isShow"
        >
          <div
            style="padding: 15rem; width: 118rem; height: 146rem"
            @click="!item.isClickImg ? clickRedpacket(item, index) : ''"
          >
            <img v-if="!item.isClickImg" src="/static/img/redEnvelope/payoff.webp" style="width: 88rem" />
            <div class="box-view" v-else>
              <img src="/static/img/redEnvelope/open_bot.webp" class="click-img" />
              <img src="/static/img/redEnvelope/open_top.webp" class="click-img-top" />
              <div class="amount-view" :class="{ 'amount-view-ani': item.innerAnimation }">
                {{ item.amount }}
              </div>
              <div class="amount-bg" :class="{ 'amount-bg-ani': item.innerAnimation }"></div>
            </div>
          </div>
        </div>
      </template>
    </div>
    <div v-if="countdownFlag" class="countdown-wrap">
      <div class="c-t-num">3</div>
      <div class="c-t-num">2</div>
      <div class="c-t-num">1</div>
      <div class="c-t-num">{{ $t('redEnvelopeModule.GO') }}</div>
    </div>
  </div>
</template>

<script>
import { Scope } from 'tools-vue3'

export default {
  name: 'redpacketrain',
  data() {
    return {
      scrollerArea: {},
      redsHeight: 80,
      redsWidth: 64,
      duration: 15, // 持续时间
      redpacketsRe: [],
      animationData: {},
      countdownFlag: false, //倒计时
      isActivity: false, //显示红包雨
      activityData: {
        totalTime: 15 // 活动持续时间 秒
      }
    }
  },
  created() {
    this.timer = Scope.Timer()
  },
  mounted() {
    // 开启倒计时
    this.countdownFlag = true
    this.timer.once(() => {
      // 倒计时结束，开始红包雨
      this.countdownFlag = false
      const res = document.querySelector('.mask').getBoundingClientRect()
      this.scrollerArea = {
        left: res.left,
        right: res.right,
        top: res.top,
        bottom: res.bottom,
        height: res.bottom - res.top - this.redsHeight,
        width: res.right - res.left - this.redsWidth
      }
      this.startRedPacket()
    }, 4000)
  },
  methods: {
    startRedPacket() {
      let w = Math.random() * 90 + 120
      let durTime = parseInt(Math.random() * 1.5) + 2.5 + 's' // 时间
      let left = parseInt(Math.random() * this.scrollerArea.width)
      const item = {
        id: StrUtil.getId(),
        left: left + 'px',
        width: w + 'rem',
        durTime: durTime,
        isShow: true,
        height: '116rem',
        redWidth: '88rem'
      }
      this.redpacketsRe.push(item)
      this.timer.once(() => {
        item.isShow = false
      }, 2500)
    },

    // 运行
    run() {
      this.startRedPacket()
      for (let i = 0; i < this.duration * 2; i++) {
        // 红包密度
        this.timer.once(() => {
          this.startRedPacket()
        }, 500)
      }
    },

    runNumber(max, min) {
      // 某个范围内的随机数
      return Math.ceil(Math.random() * (max - min) + min)
    },

    //点击红包
    clickRedpacket(item, itemIndex) {
      item.isClickImg = true
      // 点击红包事件
      this.$emit('clickRedPacket', item, itemIndex, this.redpacketsRe)

      item.innerAnimation = true

      this.timer.once(() => {
        item.isShow = false
      }, 500)
    },

    selector(selectorName, componentsName, cb) {
      // 节点选择器
      const query = uni.createSelectorQuery().in(componentsName)
      query
        .select(selectorName)
        .boundingClientRect((data) => {
          cb && cb(data)
        })
        .exec()
    }
  }
}
</script>

<style lang="less" scoped>
.box-view {
  position: relative;
  margin-top: 30rem;

  .click-img {
    width: 88rem;
    height: 116rem;
    z-index: 0;
  }

  .click-img-top {
    position: absolute;
    bottom: 0rem;
    left: 0rem;
    width: 88rem;
    height: 90rem;
    z-index: 2;
  }

  .amount-view {
    position: absolute;
    top: -5rem;
    color: #fa9e3e !important;
    font-size: 38rem;
    // background: #FDE1AB;
    height: auto;
    width: 80rem;
    z-index: 0;
    // margin-left: 6rem;
    // padding: 10rem;
    // border-radius: 10rem;
    text-align: center;
  }

  .amount-bg {
    position: absolute;
    top: 50rem;
    background: #fde1ab;
    height: 30rem;
    min-width: 80rem;
    z-index: 0;
    margin-left: 6rem;
    padding: 10rem;
    border-radius: 10rem;
    text-align: center;
  }
}

.countdown-wrap {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;

  .c-t-num {
    position: absolute;
    font-size: 288rem;
    font-family: 'D-DIN Exp', sans-serif;
    font-weight: bold;
    line-height: 338rem;
    background: linear-gradient(180deg, #faf6e8 0%, #eda863 100%);
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
    transform: scale(0);
    animation: ani 1s;

    &:nth-child(2) {
      animation-delay: 1s;
    }

    &:nth-child(3) {
      animation-delay: 2s;
    }

    &:nth-child(4) {
      animation-delay: 3s;
    }
  }

  @keyframes ani {
    0% {
      transform: scale(0);
    }

    50% {
      transform: scale(1);
    }

    100% {
      transform: scale(0);
    }
  }
}

.red_packet {
  .package {
    position: absolute;
    top: -200rem;
    z-index: 3;
    animation: aim_move 2.5s linear 1 forwards;
  }
}

@keyframes aim_move {
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(50vh);
  }
  100% {
    transform: translateY(105vh);
  }
}

.amount-bg-ani {
  animation: amount_bg_ani 0.3s linear 1 forwards;
}

@keyframes amount_bg_ani {
  0% {
    transform: translateY(0rem);
  }
  100% {
    transform: translateY(-42rem);
  }
}
</style>
