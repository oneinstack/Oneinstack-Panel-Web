<script setup lang="ts">
import sutil from '@/sstore/sutil';
import { reactive } from 'vue'
import StatusBarConfig from '@/utils/StatusBarConfig'

const conf = reactive({
  contentStyle: {
    height: '100%',
    top: '0px'
  },

  goBack() {},

  // 登录页返回
  loginBack() {},

  //注册页返回
  registerBack() {}
})
</script>

<template>
  <div class="box" :style="conf.contentStyle">
    <div class="content">
      <div class="close-img" :style="{ top: StatusBarConfig.statusHeight + 'px' }" @click.stop="sutil.pageBack">×</div>
      <img src="/static/img/loginBgImg.webp" class="bgImg" />
    </div>
  </div>
</template>

<style scoped lang="less">
.box {
  width: 100%;
  height: 100%;
  position: absolute;
  bottom: 0;

  .content {
    width: 100%;
    height: 100%;

    .close-img {
      position: absolute;
      right: 15rem;
      top: 0rem;
      z-index: 2;
      color: #fff;
      font-weight: bolder;
      font-size: 58rem;
    }
    .bgImg {
      position: absolute;
      top: 0;
      width: 100%;
      height: 100%;
    }
  }
}
</style>
