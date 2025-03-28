<template>
  <div class="memo">
    <p class="p1" @click="router.push('/memo')">暂无备忘录，点击编辑</p>
    <p class="p2" @click="router.push('/memoList')">备忘录</p>
  </div>
</template>
<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();
</script>
<style lang="less" scoped>
.memo {
  height: 222rem;
  background: url('/static/img/server/memo.png');
  background-size: 100%;
  padding: 0 48rem;
  overflow: hidden;
  .p1 {
    color: #0095c6;
    font-family: 'PingFang SC-Medium';
    font-size: 32rem;
    margin-top: 70rem;
  }
  .p2 {
    margin-top: 32rem;
    color: #9c9c9c;
    font-size: 24rem;
  }
}
</style>
