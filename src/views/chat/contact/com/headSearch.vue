<template>
  <div class="search-box flex flex-center" @click="conf.goPages">
    <van-icon name="search" size="34rem" color="#B9B9B9" />
    <span>Search</span>
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
    if(props.customClick) return emit('click')
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
