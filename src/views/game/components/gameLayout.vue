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
    <bet-popup :show="conf.bet.show" :betShare="conf.bet.share" @submit="conf.bet.submit" :lottery="lottery">
      <slot name="bet"></slot>
    </bet-popup>
  </x-page>
</template>
<script setup lang="ts">
import { apis } from '@/api'
import { LotteryConfInter } from '@/sstore/slottery'
import System from '@/utils/System'
import { onMounted, reactive } from 'vue'
import betPopup from './gameBetPopup.vue'

const props = defineProps<{
  title: string
  lottery: LotteryConfInter
  code: string
}>()

const conf = reactive({
  bet: {
    share: false,
    show: false,
    submit: async (status: number) => {
      if (status) {
        System.loading()
        const obj = props.lottery.bet.getInfo()
        console.log('obj', obj)
        obj.betCodes = ''
        await apis.lotteryUserBets({
          ...obj,
          final: async () => {
            System.loading(false)
          }
        })
        conf.bet.show = false
      } else {
        //取消提交
        conf.bet.show = false
      }
    }
  }
})

onMounted(() => {
  props.lottery.init(props.code as any)
})

defineExpose({
  open: () => {
    conf.bet.show = true
  },
  close: () => {
    conf.bet.show = false
  }
})
</script>

<style lang="less" scoped></style>
