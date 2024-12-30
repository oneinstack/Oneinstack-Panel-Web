<template>
  <div
    class="lottery-item-animate"
    :class="item.lotteryTypeVO.lotteryTypeName ? 'animate-' + item.lotteryTypeVO.lotteryTypeName : ''"
  >
    <div class="item-animate-img">
      <div class="lottery-item-img2" @click="$emit('clickItem')">
        <x-load-img :src="item.lotteryTypeVO.imgUrl"></x-load-img>
      </div>
    </div>
    <div
      v-if="ani"
      class="line-one"
      :style="{ backgroundImage: `conic-gradient(transparent, transparent, transparent, ${conf.color1})` }"
    ></div>
    <div
      v-if="ani"
      class="line-two"
      :style="{ backgroundImage: `conic-gradient(transparent, transparent, transparent, ${lineColor})`,width: size + 'rem',height: size + 'rem' }"
    ></div>
  </div>
</template>
<script lang="ts" setup>
import { reactive } from 'vue'

const conf = reactive({
  color1: '',
  color2: ''
})

defineProps({
  ani: {
    default: true
  },
  item: {
    default: {} as any
  },
  lineColor: {
    default: '#eb7941'
  },
  size: {
    default: 340
  }
})
</script>

<style lang="less" scoped>
.lottery-item-animate {
  margin-left: 8rem;
  min-width: 210rem;
  height: 280rem;
  position: relative;
  overflow: hidden;
  border-radius: 25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  &:first-of-type {
    margin-left: 0rem;
  }
  // .line-one {
  //     // top: -50%;
  //     position: absolute;
  //     width: 290rem;
  //     height: 220rem;

  //     animation: animate 4s linear infinite;
  //     animation-delay: -2s;
  // }
  .line-two {
    position: absolute;
    width: 200px;
    height: 200px;
    background-image: conic-gradient(transparent, transparent, transparent, #eb7941);
    animation: animate 4s linear infinite;
  }
  @keyframes animate {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
}
.lottery-item-img {
  width: 280rem;
  height: 162rem;
  margin-left: 20rem;
  flex-shrink: 0;

  &:first-of-type {
    margin-left: 0rem;
  }
}
.item-animate-img {
  position: absolute;
  background: rgba(245, 245, 247, 1);
  border-radius: 28rem;
  inset: 4rem;
  z-index: 1;
}

.lottery-item-img2 {
  width: 100%;
  height: 100%;
  flex-shrink: 0;
  border-radius: 25rem;
  overflow: hidden;
}
</style>
