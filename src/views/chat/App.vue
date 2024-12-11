<template>
  <div class="chat-box">
    <x-router-view :show="conf.show"></x-router-view>
  </div>
</template>
<script setup lang="ts">
import uspage from '@/components/page/uspage'
import csconfig from '@/modules/chat/sstore/csconfig'
import System from '@/utils/System'
import cConfig from '@chat/utils/cConfig'
import { reactive } from 'vue'


defineOptions({
  name: 'ChatApp'
})

const conf = reactive({
  show: false,
  init: async () => {
    //优先从url中获取
    const param = System.getRouterParams()
    let chatInfo = {} as any
    if (param.url) {
      chatInfo = param
      Cookie.set('chatInfo', param, {
        expire: 3600
      })
    } else {
      chatInfo = Cookie.get('chatInfo') || {}
    }

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

    csconfig.userInfo = chatInfo

    cConfig.init()
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
