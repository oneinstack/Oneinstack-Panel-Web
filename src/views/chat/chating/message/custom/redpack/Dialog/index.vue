<template>
    <redpackDetail v-if="simdl.listType.includes(DialogName.RedPackDetail)" />
    <loadingCom v-if="simdl.listType.includes(DialogName.loading)" />
</template>

<script setup lang="ts">
import { DialogName, simdl } from '@/sstore/simdl'
import loadingCom from './loadingIM.vue'
import redpackDetail from './detail.vue'
import { onMounted, onUnmounted } from 'vue';

onMounted(() => {
  simdl.clear()
})

onUnmounted(() => {
  simdl.clear()
})

</script>

<style lang="less"></style>
