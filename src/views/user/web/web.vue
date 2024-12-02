<template>
  <div class="flex fit">
    <iframe width="100%" height="100%" :src="conf.pathUrl" style="z-index: -1"></iframe>
    <div class="float-btn">
      <img class="float-img" src="/static/img/icon/home.png" @click.stop="sweb.back" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { apis } from '@/api'
import sweb from '@/sstore/sweb'
import System from '@/utils/System'
import { onMounted, reactive } from 'vue'
const conf = reactive({
  pathUrl: '',
  type: 1,

  // 退出游戏
  quitGame() {
    apis.quitGame({
      success: (res: any) => {
        // console.log(res)
      }
    })
  }
})

onMounted(() => {
  System.loading(false)
  const routeParams = System.getRouterParams()
  if (routeParams && routeParams.pathUrl) {
    conf.pathUrl = decodeURIComponent(routeParams.pathUrl)
    if (routeParams.type) conf.type = routeParams.type
  }
})
</script>

<style scoped lang="less">
.back {
  position: fixed;
  left: 30rem;
  top: 45rem;
  width: 30rem;
  display: flex;
  align-items: center;
  z-index: 9;
  .back-img {
    width: 20rem;
    height: 32rem;
  }
}
.float-btn {
  position: fixed;
  right: 0rem;
  bottom: 450rem;
  z-index: 99999;
  width: 65rem;
  height: 65rem;
  border-radius: 50%;
  background: #eb602d80;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  .float-img {
    width: 36rem;
    height: 36rem;
    pointer-events: all;
  }
}
</style>
