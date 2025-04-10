<template>
  <van-overlay :show="show">
    <div class="bg">
      <div class="content">
        <van-image class="bg-img" width="502rem" height="300rem" src="/public/static/img/application/stop-bg.png" />
        <p class="p1">确定吗？</p>
        <div class="tip">确定要停止此应用吗？可能会导致一些问题产生</div>
        <div class="btn">确定停止</div>
        <p class="cancel" @click="cancel()">取消</p>
      </div>
      <van-icon class="close" name="close" @click="cancel()" />
    </div>
  </van-overlay>
</template>
<script setup lang="ts">
import { ref } from 'vue'

const show = ref<boolean>(false)
const open = () => {
  show.value = true
}
const cancel = ()=>{
    show.value = false
}
defineExpose({
  open
})
</script>
<style lang="less" scoped>
.bg {
  width: 502rem;
  height: 100%;
  margin: 0 auto;
  text-align: center;
  .content {
    width: 100%;
    height: 408rem;
    background: var(--card-bg-color);
    border-radius: 16rem;
    margin: 0 auto;
    margin-top: 512rem;
    text-align: center;
    position: relative;
    padding-top: 108rem;
    .bg-img {
      top: -90rem;
      left: 0;
      position: absolute;
    }
    .p1 {
      font-size: 32rem;
      line-height: 28rem;
      font-weight: 700;
      color: var(--primary-color);
      z-index: 1;
    }
    .tip{
        height: 64rem;
        width: 288rem;
        text-align: center;
        margin: 0 auto;
        color: var(--assist-blue);
        font-size: 24rem;
        margin-top: 28rem;
    }
    .btn{
        background: var(--primary-color);
        color: var(--font-light-color);
        height: 56rem;
        line-height: 56rem;
        width: 284rem;
        margin: 0 auto;
        margin-top: 40rem;
        border-radius: 28rem;
    }
    .cancel{
        color: var(--font-gray-color);
        font-size: 24rem;
        margin-top: 28rem;
    }
  }
  .close {
    color: var(--card-bg-color);
    font-size: 46rem;
    margin-top: 50rem;
  }
}

.van-overlay {
  z-index: 999;
}
</style>
