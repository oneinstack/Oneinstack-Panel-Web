<template>
  <div class="flip-container">
    <div class="flip-items" v-for="(unit, unitIndex) of timeArr" :key="unitIndex">
      <div class="item" v-for="(item, index) of unit.max + 1" :key="index"
        :class="{ current: unit.current == index, past: unit.current + 1 == index || index == unit.max && unit.current == 0 }">
        <div class="up">
          <div class="inner">{{ conf.getNum(index) }}</div>
          <div class="shadow"></div>
        </div>
        <div class="down">
          <div class="inner">{{ conf.getNum(index) }}</div>
          <div class="shadow"></div>
        </div>
      </div>
      <!-- <div class="icon-list">
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
      </div> -->
    </div>
  </div>
</template>
<script setup lang="ts">
import { watch, reactive, computed } from 'vue'
const props = defineProps({
  value: {
    default: 0 as any
  },
  w: {
    default: 68
  },
  h: {
    default: 68
  },
  b: {
    default: 6
  }
})
//动态宽高
// const { w, h } = toRefs(props.chartConfig.attr)
const w = props.w
const h = props.h
const b = props.b

const conf = reactive({
  timeArr: [] as any[],
  lastNum: 0 as any,
  getNum(num: any) {
    return ('00' + num).slice(-2)
  }
})

const timeArr = computed(() => {
  return conf.timeArr.map((item: any, index) => {
    let unit = Number(item);
    let max, current, isHour, isAM;
    if (index != 2) {  // 时
      max = 12
      isAM = unit > 12 ? false : true
      current = isAM ? unit : unit - 12
      isHour = true
    } else {  //分
      max = 59
      current = unit
      isHour = false
    }
    return {
      max,
      current,
      isHour,
      isAM,
    }
  })
})

watch(
  () => props.value,
  (n: any, newn: any) => {
    if (newn && n != newn) conf.timeArr = newn.slice(0, 3)
  },
  { deep: true, immediate: true }
)
</script>
<style lang="less" scoped>
.flip-container {
  display: flex;
  justify-content: center;
  position: relative;

  .flip-items {
    position: relative;
    width: v-bind('w + "rem"');
    height: v-bind('h + "rem"');
    font-weight: bold;
    border-radius: 6rem;
    box-shadow: 0 2rem 18rem rgba(0, 0, 0, 0.7);

    &:nth-of-type(1),
    &:nth-of-type(2) {
      margin-right: 30rem;

      &::after,
      &::before {
        position: absolute;
        right: -14rem;
        content: '';
        transform: translateX(50%);
        width: 8rem;
        height: 8rem;
        border-radius: 50%;
        background-color: #333;
      }

      &::before {
        top: 30%;
      }

      &::after {
        bottom: 30%;
      }
    }

    .item {
      z-index: 1;
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      perspective: 150px;

      &:before {
        content: '';
        position: absolute;
        top: v-bind('h / 2 - 1 + "rem"');
        ;
        left: 0;
        z-index: 9;
        width: 100%;
        height: 2rem;
        min-height: 4rem;
        background-color: rgba(0, 0, 0, 0.6);
      }

      .up,
      .down {
        position: absolute;
        left: 0;
        right: 0;
        height: 50%;
        overflow: hidden;
      }

      .up {
        transform-origin: 50% 100%;
        top: 0;
      }

      .down {
        transform-origin: 50% 0%;
        bottom: 0;
      }

      .inner {
        position: absolute;
        left: 0;
        width: 100%;
        height: v-bind('h + "rem"');
        line-height: v-bind('h + "rem"');
        color: #ccc;
        text-shadow: 0 2rem 4rem #000;
        text-align: center;

        background-color: #333;
        border-radius: v-bind('b + "rem"');
      }

      .up .inner {
        top: 0;
      }

      .down .inner {
        bottom: 0;
      }

      .up .shadow {
        border-top-left-radius: v-bind('b + "rem"');
        border-top-right-radius: v-bind('b + "rem"');
      }

      .down .shadow {
        border-bottom-left-radius: v-bind('b + "rem"');
        border-bottom-right-radius: v-bind('b + "rem"');
      }
    }
  }
}

.flip-items .item {
  &.past {
    z-index: 3;
  }

  &.current {
    //反转到中间时候当前秒层级最大
    animation: highter-level 0.5s 0.5s linear forwards;
    z-index: 2;
  }

  &.past .up {
    animation: flip-past-up 0.5s linear both;
  }

  &.current .down {
    animation: flip-current-down 0.5s 0.5s linear both;
  }

  @keyframes flip-current-down {
    from {
      transform: rotateX(90deg);
    }

    to {
      transform: rotateX(0deg);
    }
  }

  @keyframes flip-past-up {
    from {
      transform: rotateX(0deg);
    }

    to {
      transform: rotateX(-90deg);
    }
  }

  @keyframes highter-level {
    from {
      z-index: 4;
    }

    to {
      z-index: 4;
    }
  }
}


// 控制阴影
.flip-items .item {
  .shadow {
    position: absolute;
    width: 100%;
    height: 100%;
  }

  &.past .up .shadow {
    background: linear-gradient(rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 1) 100%);
    animation: show 0.5s linear both;
  }

  &.past .down .shadow {
    background: linear-gradient(rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.1) 100%);
    animation: show 0.5s linear both;
  }

  &.current .up .shadow {
    background: linear-gradient(rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 1) 100%);
    animation: hide 0.5s 0.3s linear both;
  }

  &.current .down .shadow {
    background: linear-gradient(rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.1) 100%);
    animation: hide 0.5s 0.3s linear both;
  }
}

@keyframes show {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes hide {
  from {
    opacity: 1;
  }

  to {
    opacity: 0;
  }
}
.icon-list{
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  z-index: 9;
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
    // background: linear-gradient(93.2deg, #F7DFB1 1.89%, #F7E0AE 98.59%);
    height: 4rem;
    width: 100%;
    margin: 4rem 0rem;
  }
  
}
</style>