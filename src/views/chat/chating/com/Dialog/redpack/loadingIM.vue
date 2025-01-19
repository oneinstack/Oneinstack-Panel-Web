<template>
  <div class="loadingIM flex flex-center">
    <div class="loadingIM-content column flex-center">
      <!-- <img class="rotate" src="/static/img/loading.png" /> -->
      <div class="loading-txt">{{ $t('chatRoom.loading') }}{{ conf.dots.join('') }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Scope } from 'tools-vue3';
import { onMounted, reactive } from 'vue';


const conf = reactive({
  dots: [] as any[]
})

const timer = Scope.Timer()

onMounted(() => {
  timer.on(() => {
    conf.dots.push('.')
    if (conf.dots.length > 3) conf.dots = []
  }, 500)
})

</script>

<style lang="less" scoped>
.van-toast--unclickable * {
  pointer-events: none;
}

.loadingIM {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
}

.loadingIM-content {
  width: 220rem;
  height: 220rem;
  background-color: #4c4c4c;
  border-radius: 25rem;
  color: #fff;
  gap: 25rem;

  img {
    width: 65rem;
    height: 65rem;
  }

  .loading-txt {
    font-size: 30rem;
  }
}
</style>
