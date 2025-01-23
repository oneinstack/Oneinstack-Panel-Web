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
import { onMounted, reactive, defineEmits } from 'vue';
import betPopup from './gameBetPopup.vue'
import i18n from '@/lang'

const props = defineProps<{
  title: string
  lottery: LotteryConfInter
  code: string
  onInit?: () => void
  betInfo?: any
}>()

const emit = defineEmits(['reset'])

const conf = reactive({
  bet: {
    share: false,
    show: false,
    submit: async (status: number) => {
      if (status) {
        System.loading()
        const obj = props.lottery.bet.getInfo()
        obj.betCodes = props.betInfo.betArr.map((num:any) => num.oddsCode).join(',')
        obj.money = status
        obj.nums = props.betInfo.totalAmount
        obj.multiple = 1
          // money => 单注金额
          // betCodes => 投注内容
          // betExpect => 投注期号
          // betOpenId => 开奖记录编号
          // lotteryId => 投注彩票ID
          // multiple => 投注倍数
          // nums => 投注数量
          // supplement => 是否追加订单，0否，1是
          // walletCoinCode => 下注钱包币种
        await apis.lotteryUserBets({
          ...obj,
          success: (res: any) => {
            props.lottery.wallet.getWalletMoney()
            System.toast(i18n.t('game.betSuccess'),'success')
            emit('reset')
          },
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

onMounted(async () => {
  await props.lottery.init(props.code as any)
  props.onInit?.()
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
