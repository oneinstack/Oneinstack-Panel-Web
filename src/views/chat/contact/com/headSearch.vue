<template>
  <div class="search-box flex flex-center" @click="conf.goPages">
    <van-icon name="search" size="34rem" color="#B9B9B9" />
    <span>Search</span>
  </div>
</template>
<script setup lang="ts">
import System from '@/utils/System';
import { reactive } from 'vue';

const conf = reactive({
  goPages() {
    System.router.push('/chat/search')
  }
})
</script>
<style lang="less" scoped>

.search-box {
  width: 716rem;
  height: 68rem;
  background-color: #ffffff;
  margin: 0 auto;
  border-radius: 4rem;
  margin-bottom: 20rem;
  flex-shrink: 0;

  span {
    font-size: 32rem;
    color: #b9b9b9;
    margin-left: 16rem;
  }
}
</style>
