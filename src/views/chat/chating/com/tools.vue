<template>
  <div class="tools-box" :class="{ show: show }">
    <div class="row" style="gap: 60rem">
      <template v-for="item in conf.list">
        <div>
          <div class="tools-item flex flex-center" @click="item.fun()">
            <VSIcon :name="item.icon" :size="56" />
          </div>
          <div class="flex flex-center" style="font-size: 20rem; margin-top: 10rem">{{ item.name }}</div>
        </div>
      </template>
    </div>
  </div>
</template>
<script setup lang="ts">
import i18n from '@/lang'
import System from '@/utils/System';
import { Scope } from 'tools-vue3';
import { reactive } from 'vue'
defineProps<{
  show: boolean
}>()
const mconf = Scope.getConf()
const conf = reactive({
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
        System.router.push('/chat/redEnvelope/send')
      }
    },
    {
      name: i18n.t('chatRoom.ShareBet'),
      icon: 'tools-record',
      fun: () => {}
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
