<template>
  <x-page bgcolor="#ffffff">
    <template #title>
      {{ $t('yueb.IncomeRule') }}
    </template>
    <div v-html="conf.info" style="padding: 30rem"></div>
  </x-page>
</template>

<script setup lang="ts">
import { apis } from '@/api'
import sconfig from '@/sstore/sconfig'
import System from '@/utils/System'
import { onMounted, reactive } from 'vue'

const conf = reactive({
  info: '',
  getInfo: async () => {
    System.loading()
    const { data } = await apis.getYebContent({
      uid: sconfig.userInfo.uid,
      final: () => {
        System.loading(false)
      }
    })
    conf.info = data.content
  }
})
onMounted(() => {
  conf.getInfo()
})
</script>

<style lang="less" scoped>
.content {
  font-size: 30rem;
  padding: 30rem;
}
.long-ico {
  color: #ffaf14;
  padding-left: 60rem;
  font-weight: bold;
}
.long-tab {
  padding-left: 60rem;
}
</style>
