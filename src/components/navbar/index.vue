<template>
  <div class="navbar">
    <slot name="left">
      <van-icon name="arrow-left" class="left" @click="router.back()"/>
    </slot>
    <slot name="center">
        <div class="center">{{ props.title }}</div>
    </slot>
    <slot name="right"></slot>
  </div>
</template>
<script setup lang="ts">
import { useRouter } from 'vue-router';
const router = useRouter();
interface navbarProps{
    height?:string,
    width?:string,
    title?:string,
    borderRadius?:string | number
}
// 接受父组件参数
const props = withDefaults(defineProps<navbarProps>(), {
  height: '120rem',
  width: '100%',
  title:'',
  borderRadius: '0'
})
</script>
<style lang="less" scoped>
.navbar {
  height: v-bind(height);
  width: v-bind(width);
  display: flex;
  align-items: center;
  padding: 32rem;
  background: #ffffff;
  .left{
    font-size: 40rem;
    color: #9C9C9C;
  }
  .center{
    flex: 1;
    text-align: center;
    margin: 0 24rem;
    font-size: 32rem;
    font-weight: 700;
  }
}
</style>
