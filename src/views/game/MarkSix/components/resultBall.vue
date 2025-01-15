<template>
  <div
    :style="{
      'width': `${props.size}rem`,
      'height': `${props.size}rem`
    }"
  >
    <resultBallCom
      class="absolute"
      :size="props.size"
      :val="conf.current.val"
      :img="conf.current.img"
      :color="conf.current.color"
      :style="{ 'transform': conf.current.transform, 'transition': conf.current.transition }"
    />
    <resultBallCom
      class="absolute"
      :size="props.size"
      :val="conf.next.val"
      :img="conf.next.img"
      :color="conf.next.color"
      :style="{ 'transform': conf.next.transform, 'transition': conf.next.transition }"
    />
  </div>
</template>
<script setup lang="ts">
import { Scope } from 'tools-vue3'
import { onMounted, reactive, watch } from 'vue'
import { lhc } from './resultBall'
import resultBallCom from './resultBallCom.vue'
const props = withDefaults(
  defineProps<{
    size?: number
    number: any
    active?: boolean
    aniX?: number
    aniY?: number
    aniScale?: number
    reverse?: boolean
  }>(),
  {
    size: 56,
    active: false,
    aniX: 0,
    aniY: 100,
    aniScale: 0.9,
    reverse: true
  }
)

const timer = Scope.Timer()
const reverse = props.reverse ? -1 : 1
const conf = reactive({
  current: {
    number: 0,
    color: '',
    img: '',
    val: '',
    transition: 'transform 0.3s linear',
    transform: 'translate(0rem,0rem) scale(1)'
  },
  next: {
    number: 0,
    color: '',
    img: '',
    val: '',
    transform: `translate(${props.aniX}rem,${props.aniY * reverse}rem) scale(${props.aniScale})`,
    transition: 'transform 0.3s linear'
  },
  /**
   * 动画
   */
  ani: {
    show: 'current',
    stop: () => {
      // timer.clear()
    },
    /**
     * 开始动画或者停止动画
     */
    run: async () => {
      //如果number有值，则停止动画
      if (props.number?.num) {
        conf.ani.stop()
        return
      }
      //如果number没有值，则开始动画
      conf.ani.runAni()
    },
    /**
     * 设置当前和下一个球的值
     */
    runAni: () => {
      conf.setItem(conf.current, props.number)
      conf.setItem(conf.next, props.number)
    }
  },
  setItem: (item: any, num: any) => {
    item.val = lhc.getVal(num)
    item.img = lhc.getImg(num, props.active)
    item.color = lhc.getColor(num, props.active)
  }
})

watch(
  () => props.number,
  () => {
    conf.ani.run()
  }
)

onMounted(() => {
  conf.ani.run()
  const toAni = (val: { num: number }) => {
    const isCurrent = conf.ani.show == 'current'
    let nextName = isCurrent ? 'next' : 'current'
    let currentName = isCurrent ? 'current' : 'next'
    const _conf = conf as any
    conf.setItem(_conf[currentName], val)
    let _val = val.num + 1
    if (_val > 49) {
      _val = 1
    }
    conf.setItem(_conf[nextName], { num: _val })
    _conf[currentName].transform = `translate(${props.aniX}rem,${props.aniY * -1 * reverse}rem) scale(${props.aniScale})`
    _conf[nextName].transform = `translate(0rem,0rem) scale(1)`
    conf.ani.show = nextName
    timer.once(() => {
      _conf[currentName].transition = 'transform 0s'
      timer.once(() => {
        _conf[currentName].transform = `translate(${props.aniX}rem,${props.aniY * 1 * reverse}rem) scale(${props.aniScale})`
        timer.once(() => {
          _conf[currentName].transition = 'transform 0.3s linear'
          timer.once(() => {
            let _val = val.num + 1
            if (_val > 49) {
              _val = 1
            }
            toAni({ num: _val })
          }, 0)
        }, 20)
      }, 20)
    }, 240)
  }
  timer.once(() => {
    const randomNum = MathUtil.getRandomInt(1, 49)
    toAni({ num: randomNum })
  }, 1000)
})
</script>
<style lang="less" scoped></style>
