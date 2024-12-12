<template>
  <div style="width: 100%; height: 100%; position: relative">
    <x-img class="load-img" :src="src" lazy-load @load="conf.imgLoad" @error="conf.imgError" :zIndex="zIndex"></x-img>
    <!-- 图片加载动画 -->
    <div class="load-content" v-if="conf.imgLoading">
      <img v-if="conf.isError" class="fail-img" mode="heightFix" src="./fail-img.png" />
      <div v-else class="load-box"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
defineProps({
  src: {
    default: ''
  },
  zIndex: {
    default: undefined as any
  }
})
const conf = reactive({
  imgLoading: true,
  isError: false,

  // 图片载入成功
  imgLoad(e: any) {
    conf.imgLoading = false
  },
  // 图片载入失败
  imgError(e: any) {
    // conf.isError = true
  }
})
</script>

<style lang="less" scoped>
.load-img {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.load-content {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #e6e6e6;
  .load-box {
    position: absolute;
    height: 100%;
    width: 100%;
    background-image: linear-gradient(90deg, #e6e6e6 0%, #d8d8d8 50%, #e6e6e6 100%);
    background-size: 100% 100%;
    animation: animate 1.8s ease infinite;
  }
}

@keyframes animate {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
.fail-img {
  height: 45rem;
}
</style>
