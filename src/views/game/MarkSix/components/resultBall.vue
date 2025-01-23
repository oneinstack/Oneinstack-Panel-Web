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
import { onMounted, reactive,watch } from 'vue'
import { lhc, resultBallManager } from './resultBall'
import resultBallCom from './resultBallCom.vue'

const props = withDefaults(
  defineProps<{
    size?: number
    active?: boolean
    aniX?: number
    aniY?: number
    aniScale?: number
    reverse?: boolean
    index?: number
    /**
     * 动画时间-ms
     */
    time?: number
    num?: any
  }>(),
  {
    size: 56,
    active: false,
    aniX: 0,
    aniY: 100,
    aniScale: 0.9,
    reverse: true,
    time: 300
  }
)

const reverse = props.reverse ? -1 : 1
const conf = reactive({
  index: props.index,
  current: {
    number: 0,
    color: '',
    img: '',
    val: '',
    transition: `transform ${props.time}ms linear`,
    transform: 'translate(0rem,0rem) scale(1)'
  },
  next: {
    number: 0,
    color: '',
    img: '',
    val: '',
    transform: `translate(${props.aniX}rem,${props.aniY * reverse}rem) scale(${props.aniScale})`,
    transition: `transform ${props.time}ms linear`
  },
  /**
   * 设置显示值，停止动画
   * @param val
   */
  setVal: (val: any) => {
    conf.ani.stop()
    const { nextName, currentName } = conf.ani.getName()
    const _conf = conf as any
    conf.setItem(_conf[currentName], val)
  },
  /**
   * 以随机值开始动画
   */
  runAni: () => {
    if (conf.ani.isRun) return
    conf.ani.isRun = true
    conf.ani.toAni({ num: MathUtil.getRandomInt(1, 31) })
  },
  /**
   * 动画
   */
  ani: {
    show: 'current',
    isRun: false,
    stop: () => {
      conf.ani.isRun = false
    },
    getName: () => {
      const isCurrent = conf.ani.show === 'current'
      const nextName = isCurrent ? 'next' : 'current'
      const currentName = isCurrent ? 'current' : 'next'
      return { nextName, currentName }
    },
    /**
     * 启动动画
     * @param val
     */
    toAni: (val: { num: number }) => {
      if (!conf.ani.isRun) return
      const { nextName, currentName } = conf.ani.getName()
      const _conf = conf as any

      // 预计算下一个数字
      let nextNum = val.num + 1
      if (nextNum > 31) nextNum = 1

      // 批量更新状态，减少重绘
      requestAnimationFrame(() => {
        // 更新当前和下一个球的值
        conf.setItem(_conf[currentName], val)
        conf.setItem(_conf[nextName], { num: nextNum })

        // 设置transform
        _conf[currentName].transform =
          `translate(${props.aniX}rem,${props.aniY * -1 * reverse}rem) scale(${props.aniScale})`
        _conf[nextName].transform = `translate(0rem,0rem) scale(1)`
        conf.ani.show = nextName

        requestAnimationFrame(() => {
          setTimeout(() => {
            _conf[currentName].transition = 'transform 0s'
            requestAnimationFrame(() => {
              _conf[currentName].transform =
                `translate(${props.aniX}rem,${props.aniY * reverse}rem) scale(${props.aniScale})`
              requestAnimationFrame(() => {
                _conf[currentName].transition = `transform ${props.time}ms linear`
                requestAnimationFrame(() => {
                  resultBallManager.runNextAni(conf, () => {
                    conf.ani.toAni({ num: nextNum })
                  })
                })
              })
            })
          }, props.time - 20)
        })
      })
    }
  },
  setItem: (item: any, num: any) => {
    item.val = lhc.getVal(num)
    item.img = lhc.getImg(num, props.active)
    item.color = lhc.getColor(num, props.active)
  }
})

onMounted(() => {
  if (props.num) {
    conf.setVal({ num: props.num })
  }
})

defineExpose({
  conf
})

watch(
	() => props.num,
	(val: any) => {
    conf.setVal({ num: props.num })
	},
  { deep: true }
)
</script>
<style lang="less" scoped></style>
