<template>
  <div class="search">
    <input class="search_input" @focus="router.push({path:'/search'})" placeholder="请输入搜索关键词" />
    <div class="search_icon">
      <van-icon name="search" size="32rem" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();
</script>
<style lang="less" scoped>
.search {
  margin-top: 42rem;
  position: relative;
  input {
    background: #ffffff;
    height: 64rem;
    width: 100%;
    border-radius: 46rem;
    padding: 0 32rem;
  }
  .search_icon {
    position: absolute;
    right: 32rem;
    top: 16rem;
  }
}
</style>
