<template>
  <div class="search">
    <div class="search-box flex flex-center" @click="conf.goPages">
      <van-icon name="search" size="34rem" color="#B9B9B9" />
      <span>{{ name }}</span>
    </div>
  </div>
</template>
<script setup lang="ts">
import i18n from '@/lang';
import System from '@/utils/System';
import { reactive } from 'vue';

const props = defineProps({
  customClick: {
    default: false
  },
  type: {
    default: ''
  },
  name: {
    default: i18n.t('chatRoom.search')
  }
})

const emit = defineEmits(['click'])

const conf = reactive({
  goPages() {
    if (props.customClick) return emit('click')
    if(props.type) return System.router.push('/chat/add?type=' + props.type)
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
