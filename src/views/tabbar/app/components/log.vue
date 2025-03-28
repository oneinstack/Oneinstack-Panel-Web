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
        <div class="text"></div>
      </div>
      <van-icon class="close" name="close" @click="show = false"/>
    </div>
  </van-overlay>
</template>
<script setup lang="ts">
import { ref } from 'vue'

const show = ref<boolean>(false)
const open = () => {
  show.value = true
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
    background: #ffffff;
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
      .btn{
        width: 96rem;
        height: 52rem;
        line-height: 52rem;
        border-radius: 8rem;
        border: 2rem solid #f98f18;
        color: #f98f18;
        cursor: pointer;
      }
    }
    .text{
        margin-top: 32rem;
        background: #f1f1f1;
        border-radius: 16rem;
        padding: 32rem;
        height: 604rem;
        font-size: 24rem;
        overflow-y: scroll;
    }
  }
  .close {
    color: #ffffff;
    margin-top: 50rem;
    font-size: 46rem;
  }
}

.van-overlay {
  z-index: 999;
}
</style>
