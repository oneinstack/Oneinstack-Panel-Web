<template>
  <x-page noFooter>
    <!-- 头部标题 -->
    <template #title>
      <slot name="title">{{ title }} - {{ lottery.play.item.label }}</slot>
    </template>
    <!-- 头部钱包 -->
    <template #right>
      <div class="column" style="text-align: right; letter-spacing: -0.3px; font-size: 22rem">
        <div>{{ $t('wallet.balance') }}</div>
        <div>{{ lottery.wallet.label }}</div>
      </div>
      <img src="/static/img/wallet.webp" style="width: 72rem; height: 72rem" />
    </template>
    <slot></slot>
  </x-page>
</template>
<script setup lang="ts">
import { onMounted } from 'vue'

const props = defineProps<{
  title: string
  lottery: any
  code: string
}>()

onMounted(() => {
  props.lottery.init(props.code)
})
</script>

<style lang="less" scoped></style>
