<template>
  <div class="count">
    <div class="top"></div>
    <span class="current">{{ value }}</span>
    <div class="icon-list">
      <div class="icon-top">
        <div class="icon-quare">
          <div class="quare top-quare"></div>
          <div class="quare top-quare"></div>
        </div>
        <div class="icon-quare">
          <div class="quare top-quare"></div>
          <div class="quare top-quare"></div>
        </div>
      </div>
      <div class="line"></div>
      <div class="icon-top">
        <div class="icon-quare">
          <div class="quare"></div>
          <div class="quare"></div>
        </div>
        <div class="icon-quare">
          <div class="quare"></div>
          <div class="quare"></div>
        </div>
      </div>
    </div>
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
  width: 70rem;
  height: 70rem;
  background: #333;
  border-radius: 6rem;
  position: relative;
  color: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 34rem;

  -moz-transform: translateZ(0);
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
}
.current{
  position: relative;
  z-index: 8;
}
.top{
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 50%;
  background: #1B1B1B;
  transform: rotate3d(1, 0, 0, 40deg);
  border-radius: 6rem 6rem 0 0 ;
}
.changing {
  -moz-transform: rotate3d(1, 0, 0, -90deg);
  -ms-transform: rotate3d(1, 0, 0, -90deg);
  -webkit-transform: rotate3d(1, 0, 0, -90deg);
  transform: rotate3d(1, 0, 0, -90deg);
  -moz-transition: -moz-transform 0.2625s ease-in, box-shadow 0.2625s ease-in;
  -o-transition: -o-transform 0.2625s ease-in, box-shadow 0.2625s ease-in;
  -webkit-transition: -webkit-transform 0.2625s ease-in, box-shadow 0.2625s ease-in;
  transition: transform 0.2625s ease-in, box-shadow 0.2625s ease-in;
}
.changed {
  -moz-transition: -moz-transform 0.35s ease-out 0.35s;
  -o-transition: -o-transform 0.35s ease-out 0.35s;
  -webkit-transition: -webkit-transform 0.35s ease-out;
  -webkit-transition-delay: 0.35s;
  transition-delay: 0.35s;
  transition: transform 0.35s ease-out 0.35s;
  -moz-transform: none;
  -ms-transform: none;
  -webkit-transform: none;
  transform: none;
}
.icon-list{
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  .icon-top{
    display: flex;
    justify-content: space-between;
    width: 100%;
    padding: 0rem 2rem;
    .icon-quare{
      display: flex;
      .quare{
        width: 6rem;
        height: 6rem;
        border-radius: 50%;
        background: #000;
        margin-left: 2rem;
        
        &:first-of-type{
          margin-left: 0rem;
        }
      }
      .top-quare{
        position: relative;
        &::after{
          content: '';
          width: 2rem;
          height: 19rem;
          position: absolute;
          top: 2rem;
          left: 2rem;
          background: #333;
          z-index: 9;
        }
      }

    }
  }
  .line{
    background: linear-gradient(93.2deg, #F7DFB1 1.89%, #F7E0AE 98.59%);
    height: 4rem;
    width: 100%;
    margin: 4rem 0rem;
  }
  
}
</style>