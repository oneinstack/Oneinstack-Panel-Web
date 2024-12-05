<template>
  <div class="chat-box">
    <router-view v-if="conf.show"></router-view>
  </div>
</template>
<script setup lang="ts">
import uspage from '@/components/page/uspage'
import cConfig from '@chat/utils/cConfig'
import { reactive } from 'vue'
const conf = reactive({
  show: false,
  init: async () => {
    uspage.bgcolor = '#f1f1f1'
    uspage.tabbar.height = '112rem'
    uspage.header.height = '104rem'
    uspage.header.bgColor = '#f1f1f1'
    cConfig.init({
      url: 'http://127.0.0.1:8080/api'
    })
    conf.show = true
  }
})
conf.init()
</script>
<style lang="less" scoped>

.chat-box {
  width: 100%;
  height: 100%;
}

::v-deep(.c-head-nav) {
  border-bottom: 1rem solid #d3d3d3 !important;
}

</style>
