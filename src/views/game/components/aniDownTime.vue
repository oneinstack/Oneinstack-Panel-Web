<template>
  <div class="count" :class="[conf.changeState, conf.arrow]">
    <span class="current top">{{ value }}</span>
    <span class="next top">{{ value }}</span>
    <span class="current bottom">{{ value }}</span>
    <span class="next bottom">{{ value }}</span>
  </div>
</template>
<script setup lang="ts">
import { watch, reactive } from 'vue'
const props = defineProps({
  value: {
    default: 0 as any
  },
  w: {
    default: 56
  },
  h: {
    default: 56
  },
  b: {
    default: 8
  }
})
//动态宽高
// const { w, h } = toRefs(props.chartConfig.attr)
const w = props.w
const h = props.h
const b = props.b

const conf = reactive({
  changeState: '',
  time: 0 as any, //当前数字
  nextTime: 0 as any, //下一个数字
  duration: 1000, //延迟时间
  arrow: 'up', //方向
  //自适应改变数字
  selfAdaption(n: any) {
    conf.changeState = ''
    setTimeout(() => {
      conf.changeState = 'changing'
    }, 20)
    setTimeout(() => {
      conf.changeState = 'changed'
    }, conf.duration * 0.9)
    conf.time = n
    conf.nextTime = n + 1 < 0 ? 0 : n + 1
  }
})

watch(
  () => props.value,
  (n: any) => {
    conf.selfAdaption(parseInt(n))
  },
  { deep: true, immediate: true }
)
</script>
<style lang="less" scoped>
.count {
  // box-shadow: 0 5px 5px -5px rgba(0, 0, 0, 0.2);
  -moz-perspective: 500px;
  -webkit-perspective: 500px;
  perspective: 500px;
  text-align: center;
  -moz-transform: translateZ(0);
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
  width: v-bind('w + "rem"');
	height: v-bind('h + "rem"');
	line-height: v-bind('h + "rem"');
  box-sizing: border-box;
  display: flex;
}

.count span {
  background: #000;
  color: #fff;
  display: block;
  left: 0;
  position: absolute;
  top: 0;
  // text-shadow: 0 1rem 0 #282828, 0 2px 0 #1e1e1e, 0 3rem 0 #141414, 0 4rem 0 #0a0a0a, 0 5rem 0 #000,
  //   0 0 10rem rgba(0, 0, 0, 1);
  -moz-transform-origin: 0 v-bind('h/2 + "rem"') 0;
  -webkit-transform-origin: 0 v-bind('h/2 + "rem"') 0;
  transform-origin: 0 v-bind('h/2 + "rem"') 0;
  right: 0;
}

.count span:before {
  // border-bottom: 2rem solid #000;
  content: '';
  left: 0;
  position: absolute;
  width: 100%;
}

.count span:after {
  // box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.35);
  content: '';
  height: 100%;
  left: 0;
  position: absolute;
  top: 0;
  width: 100%;
}

.count .top {
  border-top-left-radius: v-bind('b + "rem"');
  border-top-right-radius: v-bind('b + "rem"');
  box-shadow: inset 0 1rem rgba(0, 0, 0, 0.9), inset 0 1rem 0 rgba(255, 255, 255, 0.4);
  height: 50%;
  width: 100%;
  overflow: hidden;
}

.count .top:before {
  bottom: 0;
}

.count .top:after {
  // background: -moz-linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.1));
  // background: -webkit-linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.1));
  // background: linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.1));
  border-top-left-radius: v-bind('b + "rem"');
  border-top-right-radius: v-bind('b + "rem"');
}

.count .bottom {
  border-radius: v-bind('b - 2 + "rem"');
  height: 100%;
}

.count .bottom:before {
  top: 50%;
}


.count.down .top.current {
  -moz-transform-style: flat;
  -webkit-transform-style: flat;
  transform-style: flat;
  z-index: 3;
}

.count.down .top.next {
  -moz-transform: rotate3d(1, 0, 0, -90deg);
  -ms-transform: rotate3d(1, 0, 0, -90deg);
  -webkit-transform: rotate3d(1, 0, 0, -90deg);
  transform: rotate3d(1, 0, 0, -90deg);
  z-index: 4;
}

.count.down .bottom {
  border-radius: v-bind('b - 2 + "rem"');
}

.count.down .bottom.current {
  z-index: 2;
}

.count.down .bottom.next {
  z-index: 1;
}

.count.down.changing .bottom.current {
  box-shadow: 0 75px 5px -20px rgba(0, 0, 0, 0.3);
  -moz-transform: rotate3d(1, 0, 0, 90deg);
  -ms-transform: rotate3d(1, 0, 0, 90deg);
  -webkit-transform: rotate3d(1, 0, 0, 90deg);
  transform: rotate3d(1, 0, 0, 90deg);
  -moz-transition: -moz-transform 0.35s ease-in, box-shadow 0.35s ease-in;
  -o-transition: -o-transform 0.35s ease-in, box-shadow 0.35s ease-in;
  -webkit-transition: -webkit-transform 0.35s ease-in, box-shadow 0.35s ease-in;
  transition: transform 0.35s ease-in, box-shadow 0.35s ease-in;
}

.count.down.changing .top.next,
.count.down.changed .top.next {
  -moz-transition: -moz-transform 0.35s ease-out 0.35s;
  -o-transition: -o-transform 0.35s ease-out 0.35s;
  -webkit-transition: -webkit-transform 0.35s ease-out;
  -webkit-transition-delay: 0.35s;
  transition: transform 0.35s ease-out 0.35s;
  transition-delay: 0.35s;
  -moz-transform: none;
  -ms-transform: none;
  -webkit-transform: none;
  transform: none;
}

.count.up .top {
  height: 50%;
}

.count.up .top.current {
  z-index: 4;
}

.count.up .top.next {
  z-index: 3;
}

.count.up .bottom.current {
  z-index: 1;
}

.count.up .bottom.next {
  box-shadow: 0 75px 5px -20px rgba(0, 0, 0, 0.3);
  -moz-transform: rotate3d(1, 0, 0, 90deg);
  -ms-transform: rotate3d(1, 0, 0, 90deg);
  -webkit-transform: rotate3d(1, 0, 0, 90deg);
  transform: rotate3d(1, 0, 0, 90deg);
  z-index: 2;
}

.count.up.changing .top.current {
  -moz-transform: rotate3d(1, 0, 0, -90deg);
  -ms-transform: rotate3d(1, 0, 0, -90deg);
  -webkit-transform: rotate3d(1, 0, 0, -90deg);
  transform: rotate3d(1, 0, 0, -90deg);
  -moz-transition: -moz-transform 0.2625s ease-in, box-shadow 0.2625s ease-in;
  -o-transition: -o-transform 0.2625s ease-in, box-shadow 0.2625s ease-in;
  -webkit-transition: -webkit-transform 0.2625s ease-in, box-shadow 0.2625s ease-in;
  transition: transform 0.2625s ease-in, box-shadow 0.2625s ease-in;
}

.count.up.changing .bottom.next,
.count.up.changed .bottom.next {
  box-shadow: 0 0 0 0 transparent;
  -moz-transition: box-shadow 0.175s cubic-bezier(0.375, 1.495, 0.61, 0.78) 0.35s,
    -moz-transform 0.35s cubic-bezier(0.375, 1.495, 0.61, 0.78) 0.35s;
  -o-transition: box-shadow 0.175s cubic-bezier(0.375, 1.495, 0.61, 0.78) 0.35s,
    -o-transform 0.35s cubic-bezier(0.375, 1.495, 0.61, 0.78) 0.35s;
  -webkit-transition: box-shadow 0.175s cubic-bezier(0.375, 1.495, 0.61, 0.78),
    -webkit-transform 0.35s cubic-bezier(0.375, 1.495, 0.61, 0.78);
  -webkit-transition-delay: 0.35s, 0.35s;
  transition-delay: 0.35s, 0.35s;
  transition: box-shadow 0.175s cubic-bezier(0.375, 1.495, 0.61, 0.78) 0.35s,
    transform 0.35s cubic-bezier(0.375, 1.495, 0.61, 0.78) 0.35s;
  -moz-transform: rotate3d(1, 0, 0, 0);
  -ms-transform: rotate3d(1, 0, 0, 0);
  -webkit-transform: rotate3d(1, 0, 0, 0);
  transform: rotate3d(1, 0, 0, 0);
}

.count.changed .top.current,
.count.changed .bottom.current {
  display: none;
}
</style>