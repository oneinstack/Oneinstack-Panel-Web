<template>
  <div class="relative fit">
    <div class="absolute fit flex flex-center" style="background: #f5f5f7" v-if="conf.imgLoading">
      <VSIcon v-if="conf.isError" lib="wx" name="icon_outlined_collect_personal" size="60" :color="['#b3b3b3']" />
    </div>
    <x-img
      class="relative fit"
      :src="src"
      @load="conf.imgLoad"
      @error="conf.imgError"
    ></x-img>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
defineProps({
  src: {
    default: ''
  },
})
const conf = reactive({
  imgLoading: true,
  isError: false,
  imgLoad(e: any) {
    conf.imgLoading = false
    // console.log('cim', 'imgLoad', conf.imgLoading)
  },
  imgError(e: any) {
    conf.isError = true
    // console.log('cim', 'imgError', conf.isError)
  }
})
</script>
