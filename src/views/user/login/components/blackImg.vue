<template>
  <div class="top-bg">
    <div class="content flex-b-c">
      <img class="logo-img" src="/static/img/home/black/logo.png" />
      <div class="arrow flex-center" @click.stop="sutil.pageBack">
        <van-icon size="32rem" color="#fff" name="cross" />
      </div>
    </div>
  </div>
  <div class="name">{{ name }}</div>
</template>
<script setup lang="ts">
import sutil from '@/sstore/sutil';

const props = defineProps({
  name: {
    default: ''
  }
})

</script>

<style scoped lang="less">
.top-bg {
  position: relative;
  height: 400rem;
  width: 750rem;
  flex-shrink: 0;
  background: url('/static/theme/black/login/loginbg.png') no-repeat;
  background-size: 100% 100%;

  .content{
    padding: 20rem 36rem;
  }
  .logo-img {
    height: 68rem;
  }

  .arrow {
    width: 56rem;
    height: 56rem;
    background: #FFFFFF1A;
    border-radius: 12rem;
  }
}
.name{
  color: #fff;
  font-size: 28rem;
  font-weight: 700;
  margin: 20rem 24rem;
}
</style>
