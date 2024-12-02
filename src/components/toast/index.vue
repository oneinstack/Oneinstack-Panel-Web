<template>
  <van-overlay class-name="toast-overlay" :show="conf.show" @click="conf.close">
    <div class="flex flex-center fit">
      <div class="tip-box" v-if="type == 'success'">
        <van-icon name="checked" color="#39b54a" size="80rem" v-show="icon" />
        <div class="tip-content">{{ content }}</div>
      </div>
      <div class="tip-box" v-else>
        <div class="tip-icon">!</div>
        <div class="tip-content">{{ content }}</div>
      </div>
    </div>
  </van-overlay>
</template>
<script lang="ts" setup>
import { Scope } from 'tools-vue3'
import { onMounted, reactive } from 'vue'

const props = defineProps({
  content: { default: '' },
  type: { default: 'success' },
  icon: { default: true },
  show: { default: false },
  duration: { default: 2000 },
  remove: {
    default: (): any => {}
  }
})

const setShow = () => {
  conf.show = props.show
  if (!conf.show) {
    close()
  }
}

const timer = Scope.Timer()
const conf = reactive({
  show: false,
  close: async () => {
    timer.clear()
    close()
  }
})

onMounted(() => {
  timer.once(() => {
    setShow()
    timer.once(() => {
      conf.close()
    }, props.duration)
  }, 20)
})

const close = () => {
  conf.show = false
  timer.once(() => {
    if (props.remove) props.remove()
  }, 300)
}
</script>

<style lang="less" scoped>
.toast-overlay {
  background: transparent;
  z-index: 9001;
}
.tip-box {
  background: rgba(0, 0, 0, 0.7);
  border-radius: 14rem;
  padding: 48rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  max-width: 80%;

  .tip-icon {
    font-size: 48rem;
    background: #d90000;
    color: #fff;
    width: 80rem;
    height: 80rem;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .tip-content {
    font-size: 32rem;
    color: #fff;
    margin-top: 24rem;
    width: 100%;
    word-break: break-all;
  }
}
</style>
