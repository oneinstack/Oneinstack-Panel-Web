<template>
  <div class="tools-box" :class="{ show: show }">
    <div class="row" style="gap: 60rem">
      <div>
        <van-uploader :after-read="conf.createImageMessage">
          <div class="tools-item flex flex-center">
            <VSIcon name="tools-img" :size="56" />
          </div>
        </van-uploader>
        <div class="flex flex-center" style="font-size: 20rem; margin-top: 10rem">{{ i18n.t('chatRoom.album') }}</div>
      </div>
      <div>
        <div class="tools-item flex flex-center">
          <VSIcon name="tools-camera" :size="56" />
        </div>
        <div class="flex flex-center" style="font-size: 20rem; margin-top: 10rem">{{ i18n.t('chatRoom.shoot') }}</div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import i18n from '@/lang'
import csmessage from '@/modules/chat/sstore/csmessage'
import System from '@/utils/System'
import { Scope } from 'tools-vue3'
import { reactive } from 'vue'
defineProps<{
  show: boolean
}>()
const mconf = Scope.getConf()
const conf = reactive({
  createImageMessage: async (file: any) => {
    if (file.content.startsWith('data:image')) {
      const res = await csmessage.createImageMessage(file.file)
      csmessage.sendMessage(res)
    }
  },
  list: [
    {
      name: i18n.t('chatRoom.album'),
      icon: 'tools-img',
      fun: () => {}
    },
    {
      name: i18n.t('chatRoom.shoot'),
      icon: 'tools-camera',
      fun: () => {}
    },
    {
      name: i18n.t('chatRoom.rpkt'),
      icon: 'tools-pack',
      fun: () => {
        mconf.tools.close()
        System.router.push('/chat/redPacket/send')
      }
    },
    {
      name: i18n.t('chatRoom.ShareBet'),
      icon: 'tools-record',
      fun: () => {
        mconf.tools.close()
        System.router.push('/chat/betRecord')
      }
    }
  ]
})
</script>
<style lang="less" scoped>
.tools-box {
  width: 100%;
  height: 0rem;
  overflow: auto;
  padding: 40rem;
  opacity: 0;
  transition: all 0.3s;
  &.show {
    opacity: 1;
    height: 240rem;
  }
}
.tools-item {
  width: 120rem;
  height: 120rem;
  background-color: #fff;
  border-radius: 28rem;
}
</style>
