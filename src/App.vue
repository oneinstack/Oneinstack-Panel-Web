<template>
  <el-config-provider :locale="elementLocale">
    <x-route-event></x-route-event>
    <x-router-view :show="conf.show"></x-router-view>
  </el-config-provider>
</template>
<script setup lang="ts">
import { computed, nextTick, reactive } from 'vue'
import en from 'element-plus/es/locale/lang/en'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { ERouter } from './enum/Enum'
import i18n from './lang'
import { useConfigStore } from './stores/modules/config';

const sconfig = useConfigStore()

defineOptions({
  name: 'App'
})

const conf = reactive({
  show: true,
  reload: () => {
    conf.show = false
    nextTick(() => {
      conf.show = true
    })
  }
})
const elementLocale = computed(() => i18n.locale === 'en-US' ? en : zhCn)

CEvent.on(ERouter.browserShow, (isShow) => {
  if (sconfig.userInfo) {
    if (isShow) {
    } else {
    }
  }
})

CEvent.on(ERouter.reload, conf.reload)

</script>

<style>
	
</style>
