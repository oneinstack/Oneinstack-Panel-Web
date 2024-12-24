<template>
  <div class="relative fit" v-if="conf.show" style="background: #f5f5f7">
    <template v-if="!isGroup">
      <div class="absolute fit flex flex-center" v-if="conf.imgLoading">
        <VSIcon
          v-if="conf.isError"
          lib="wx"
          name="icon_outlined_collect_personal"
          :size="props.iconSize"
          :color="['#b3b3b3']"
        />
      </div>
      <x-img class="relative fit" :src="src" @load="conf.imgLoad" @error="conf.imgError"></x-img>
    </template>
    <template v-else-if="src.length > 0">
      <div class="flex justify-center reverse-wrap fit content-center" style="gap: 1rem">
        <template v-for="(item, index) in src">
          <div class="relative" :style="{ width: conf.getGroupRem(88) + 'rem', height: conf.getGroupRem(88) + 'rem' }">
            <headImg :src="item" :iconSize="conf.getGroupRem(60)"></headImg>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive } from 'vue'
const props = defineProps({
  src: {
    default: '' as any
  },
  iconSize: {
    default: 60
  },
  isGroup: {
    default: false
  }
})
const conf = reactive({
  show: false,
  imgLoading: true,
  isError: false,
  imgLoad(e: any) {
    conf.imgLoading = false
    // console.log('cim', 'imgLoad', conf.imgLoading)
  },
  imgError(e: any) {
    conf.isError = true
    // console.log('cim', 'imgError', conf.isError)
  },
  init() {
    if (!props.src) {
      conf.isError = true
    }
    conf.show = true
  },
  getGroupRem: (val: number) => val / (props.src.length > 4 ? 3 : 2)
})

onMounted(() => {
  conf.init()
})
</script>
