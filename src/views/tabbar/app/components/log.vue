<template>
  <van-overlay :show="show">
    <div class="bg">
      <div class="content">
        <p class="title">日志</p>
        <div class="operation">
          <p>最近一小时</p>
          <p>200条</p>
          <div class="btn">追踪</div>
        </div>
        <div class="text">
          {{ logContent }}
        </div>
      </div>
      <van-icon class="close" name="close" @click="close" />
    </div>
  </van-overlay>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { apis } from '@/api'
const logInfo = ref<any>({})
const logContent = ref<string>('')
const getLog = async () => {
  const obj = {
    name: logInfo.value?.name,
    fn: logInfo.value?.log
  }
  const { data: res } = await apis.getInstallLog(obj)
  logContent.value = res.logs.content
}
const show = ref<boolean>(false)
const close = () => {
  show.value = false
  clearInterval(timer)
}
let timer: any = null
const open = (item: any) => {
  logInfo.value = item
  show.value = true
  timer = setInterval(() => {
    getLog()
  }, 3000)
}
defineExpose({
  open
})
</script>
<style lang="less" scoped>
.bg {
  width: 686rem;
  height: 100%;
  margin: 0 auto;
  text-align: center;
  .content {
    width: 100%;
    height: 822rem;
    padding: 40rem 32rem;
    background: var(--card-bg-color);
    border-radius: 16rem;
    margin: 0 auto;
    margin-top: 314rem;
    .title {
      font-size: 32rem;
      font-weight: 700;
      text-align: left;
    }
    .operation {
      margin-top: 26rem;
      display: flex;
      align-items: center;
      .btn {
        width: 96rem;
        height: 52rem;
        line-height: 52rem;
        border-radius: 8rem;
        border: 2rem solid var(--primary-color);
        color: var(--primary-color);
        cursor: pointer;
      }
    }
    .text {
      margin-top: 32rem;
      background: var(--bg-color);
      border-radius: 16rem;
      padding: 32rem;
      height: 604rem;
      font-size: 24rem;
      overflow-y: scroll;
      text-align: left;
    }
  }
  .close {
    color: var(--card-bg-color);
    margin-top: 50rem;
    font-size: 46rem;
  }
}

.van-overlay {
  z-index: 999;
}
</style>
