<template>
  <redpack v-if="conf.type === CustomData.RedPack" />
  <!-- <ShareBet v-else-if="conf.type === CustomData.ShareBet" /> -->
  <other v-else />
</template>

<script setup lang="ts">
import IMSDK, { IMMethods } from 'openim-uniapp-polyfill'
import { Scope } from 'tools-vue3'
import redpack from './redpack/index.vue'
import other from './other.vue'
import { CustomData } from '@/sstore/sim'
import ShareBet from './ShareBet/index.vue'
import { onMounted, reactive } from 'vue'

const props = defineProps({
  message: {
    default: {} as any
  }
})

const conf = reactive({
  type: '',
  CustomData,
  item: {},
  message: {} as any,
  //发送自定义消息入口
  send(data: any, extension: any) {
    return IMSDK.asyncApi(IMMethods.CreateCustomMessage, IMSDK.uuid(), {
      data,
      extension: JSON.stringify(extension)
    })
  }
})
onMounted(() => {
  const data = props.message.customElem
  console.log('6688');
  console.log(data);
  if (!data?.extension) return
  conf.item = JSON.parse(data.extension)
  conf.type = data.data
  
  console.log('668801');
  console.log(conf.type);
  console.log(conf.item);
  conf.message = props.message
  
  Scope.setConf(conf)
  
})
</script>

<style lang="scss" scoped></style>
