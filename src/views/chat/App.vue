<template>
  <div class="chat-box">
    <x-router-view :show="conf.show"></x-router-view>
  </div>
</template>
<script setup lang="ts">
import uspage from '@/components/page/uspage'
import { initApp } from '@/modules/chat/sstore'
import csopemim from '@/modules/chat/sstore/csdk'
import cConfig from '@chat/utils/cConfig'
import { reactive } from 'vue'

defineOptions({
  name: 'ChatApp'
})

// window.IMSDK = _IMSDK
const conf = reactive({
  show: false,
  init: async () => {
    await initApp()
    //初始化x-page页面ui默认配置
    uspage.setConfig({
      bgcolor: '#efefef',
      header: {
        height: '104rem',
        bgColor: '#efefef',
        backColor: '#666666'
      },
      tabbar: {
        height: '112rem'
      }
    })

    await cConfig.init()
    await csopemim.Login()
    // conf.setGlobalIMlistener()

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

::v-deep(.c-head-nav-bottom) {
  border-bottom: 1rem solid #d3d3d3 !important;
}
</style>
