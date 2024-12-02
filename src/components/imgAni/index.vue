<template>
  <div
    :style="{
      width: width * scale + 'rem',
      height: height * scale + 'rem',
      minWidth: width * scale + 'rem',
      maxWidth: width * scale + 'rem',
      opacity: show ? 1 : 0
    }"
  >
    <div
      style="overflow: hidden; position: relative; transform-origin: top left"
      :style="{
        width: width + 'rem',
        height: height + 'rem',
        minWidth: width + 'rem',
        maxWidth: width + 'rem',
        transform: `scale(${scale})`
      }"
    >
      <div
        style="position: absolute; pointer-events: none"
        :style="{
          width: width * len + 'rem',
          height: height + 'rem',
          minWidth: width * len + 'rem',
          maxWidth: width * len + 'rem',
          left: left + 'rem'
        }"
      >
        <img
          :src="url"
          :style="{
            width: width * len + 'rem',
            minWidth: width * len + 'rem',
            maxWidth: width * len + 'rem',
            height: height + 'rem'
          }"
        />
      </div>
    </div>
  </div>
</template>
<script>
import { Scope } from 'tools-vue3'
export default {
  components: {},
  props: {
    name: {
      type: String,
      default: 'data'
    },
    scale: {
      type: Number,
      default: 1
    },
    width: {
      type: Number,
      default: 1200
    },
    height: {
      type: Number,
      default: 1200
    },
    len: {
      type: Number,
      default: 0
    },
    time: {
      type: Number,
      default: 2000
    },
    url: {
      type: String,
      default: ''
    },
    autoplay: {
      type: Boolean,
      default: true
    },
    show: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      left: 0,
      num: 0, //执行次数
      run: (index) => {
        this.timer.once(() => {
          if (this.num === 0) return
          let next = index + 1
          if (next > this.len - 1) {
            next = 0
            if (this.num !== -1) {
              this.num--
              if (this.num === 0) {
                this.stop()
                return
              }
            }
          }
          this.left = -(next * this.width)
          this.run(next)
        }, this.time / this.len)
      },
      //动画播放结束回调
      end: null,
      start: async ({ num = 1, end }) => {
        return new Promise((res) => {
          this.stop()
          this.num = num
          this.end = () => {
            end?.()
            res()
          }
          this.run(0)
        })
      },
      stop: () => {
        this.timer.clear()
        this.num = 0
        this.end?.()
      },
      init: () => {
        this.stop()
        this.left = 0
      }
    }
  },
  created() {
    this.event = Scope.Event()
    this.timer = Scope.Timer()
  },
  mounted() {
    if (this.autoplay && this.show) this.start({ num: -1 })
  }
}
</script>
