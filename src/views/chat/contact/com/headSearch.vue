<template>
  <div class="search">
    <div class="search-box flex flex-center" @click="conf.goPages">
      <van-icon name="search" size="34rem" color="#B9B9B9" />
      <span>Search</span>
    </div>
  </div>
</template>
<script setup lang="ts">
import System from '@/utils/System';
import { reactive } from 'vue';

const props = defineProps({
  customClick: {
    default: false
  }
})

const emit = defineEmits(['click'])

const conf = reactive({
  goPages() {
    if (props.customClick) return emit('click')
    System.router.push('/chat/search')
  }
})
</script>
<style lang="less" scoped>
.search{
  padding: 0 20rem 20rem;
  background: #efefef;
}
.search-box {
  height: 68rem;
  background-color: #ffffff;
  border-radius: 4rem;
  flex-shrink: 0;

  span {
    font-size: 32rem;
    color: #b9b9b9;
    margin-left: 16rem;
  }
}
</style>
