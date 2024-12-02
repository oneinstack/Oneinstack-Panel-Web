<template>
  <van-overlay class-name="toast-overlay" :show="conf.show">
    <div class="flex flex-center fit">
      <div class="tip-box">
        <van-loading type="spinner" />
      </div>
    </div>
  </van-overlay>
</template>
<script lang="ts" setup>
import { Scope } from 'tools-vue3'
import { onMounted, reactive, watch } from 'vue'

const props = defineProps({
  show: { default: false },
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

watch(() => props.show, setShow)

const timer = Scope.Timer()
const conf = reactive({
  show: false
})

onMounted(() => {
  timer.once(() => {
    setShow()
  }, 20)
})

const close = () => {
  conf.show = false
  if (props.remove) props.remove()
}
</script>

<style lang="less" scoped>
.toast-overlay {
  background: transparent;
  z-index: 9000;
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
}
</style>
