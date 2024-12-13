<template>
  <div class="chat-box">
    <x-router-view :show="conf.show"></x-router-view>
  </div>
</template>
<script setup lang="ts">
import uspage from '@/components/page/uspage'
import csconfig from '@/modules/chat/sstore/csconfig'
import cConfig from '@chat/utils/cConfig'
import IMSDK from 'openim-uniapp-polyfill'
import { reactive } from 'vue'

defineOptions({
  name: 'ChatApp'
})

const conf = reactive({
  show: false,
  init: async () => {
    //如果cookie有问题，则跳转至首页
    // if (!chatInfo.url) {
    //   System.router.replace('/')
    //   return
    // }

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

    cConfig.init()

    await IMSDK.asyncApi(IMSDK.IMMethods.Login, IMSDK.uuid(), {
      userID: csconfig.userInfo.userID,
      token: csconfig.userInfo.imToken,
      platformID: 5,
      wsAddr: csconfig.config.wsUrl,
      apiAddr: csconfig.config.apiUrl
    })
      .then((res) => {
        // initStore()
        console.log('success', res)
      })
      .catch((err) => {
        // console.log("error", err);
        // uni.removeStorage({
        // 	key: "IMToken",
        // });
        // uni.removeStorage({
        // 	key: "BusinessToken",
        // });
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

::v-deep(.c-head-nav-bottom) {
  border-bottom: 1rem solid #d3d3d3 !important;
}
</style>
