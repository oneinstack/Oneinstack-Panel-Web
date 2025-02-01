<template>
  <x-page noFooter :headerBgColor="stheme.theme.blue.headerBgColor()">
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
    <div v-if="showTips">
			<div class="tip">
				<img class="tip-icon" src="/static/img/Frame.png" />
				<div style="width: 100%;overflow: hidden;">
					<div class="tip-content">
						<span>{{ $t('winGo.BettingCloseTip1') + lottery.play.item.openLockCountdown +
							$t('winGo.BettingCloseTip2') }}</span>
					</div>
				</div>
			</div>
		</div>
    <slot></slot>
    <bet-popup :show="conf.bet.show" :betShare="lottery.countDown[3] < 20" @submit="conf.bet.submit" @share="conf.bet.shareBet"
      :lottery="lottery">
      <slot name="bet"></slot>
    </bet-popup>
  </x-page>
</template>
<script setup lang="ts">
import { apis } from '@/api'
import { LotteryConfInter } from '@/sstore/slottery'
import System from '@/utils/System'
import { onMounted, reactive, defineEmits } from 'vue';
import betPopup from './gameBetPopup-blue.vue'
import { Scope } from 'tools-vue3';
import sconfig from '@/sstore/sconfig';
import stheme from '@/sstore/stheme'
import i18n from '@/lang';

const props = defineProps({
	title: {
		default: ''
	},
	lottery: {
		default: {} as LotteryConfInter
	},
	code: {
		default: ''
	},
	onInit: {
		default: null as any
	},
	betInfo: {
		default: {} as any
	},
	showTips: {
		default: false
	}
})

const emit = defineEmits(['reset'])

const mconf = Scope.getConf()

const conf = reactive({
  bet: {
    share: false,
    show: false,
    // 下注
    submit: async (money: number) => {
      if (money) {
        System.loading()
        const obj = props.lottery.bet.getInfo()
        console.log(obj);
        obj.money = money
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
            emit('reset', obj)
          },
          final: async () => {
            System.loading(false)
          }
        })
        conf.bet.show = false
      } else {
        //取消提交
        emit('reset', {})
        conf.bet.show = false
      }
    },
    // 分享注单
    async shareBet(money: any) {
      const obj = props.lottery.bet.getInfo()
      const num = parseFloat(money)

      let sobj = {
        coinSymbol: props.lottery.wallet.coinSymbol,
        betMoney: num.toFixed(4),
        money: num.toFixed(4),
        orderType: '',
        id: StrUtil.getId(),
        lotteryName: mconf.conf.gameType.toUpperCase(),
        lotteryTypeCode: mconf.conf.gameType.toUpperCase(),
        betLotteryId: obj.lotteryId,
        betOpenId: obj.betOpenId,
        betExpect: obj.betExpect,
        betCodes: obj.betCodes,
        playName: mconf.lottery.play.item.lotteryShowname,
        newPlayName: '',
        newBetCodesArr: obj.betCodes.split(','),
        newBetCodes: '',
        betContent: '',
        betTitle: obj.betExpect
      }
      if (mconf.conf.betting.showCods) {
        sobj.newBetCodes = mconf.conf.betting.showCods
      } else {
        sobj.newBetCodes = sobj.newBetCodesArr.map(obj => {
          return obj.split('_')[1]
        }).join(",") || ''
      }
      sobj.betContent = sobj.newBetCodes
      sobj.newPlayName = sobj.playName
      
      if(mconf.conf.betting.typeTitle) sobj.newPlayName = sobj.newPlayName + ' - ' + mconf.conf.betting.typeTitle
      console.log(sobj);
      Cookie.set('betRecord', JSON.stringify(sobj))
		  await sconfig.toChat('/chat/betRecordForward')
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

<style lang="less" scoped>
.tip {
	display: flex;
	align-items: center;
	padding: 0rem 24rem;
	height: 80rem;
	background: #E6F2FF;

	.tip-icon {
		width: 32rem;
		height: 32rem;
		margin-right: 16rem;
		flex-shrink: 0;
	}

	.tip-content {
		font-size: 26rem;
		color: #45454d;
		font-weight: 500;
		display: inline-block;
		white-space: nowrap;
		animation: u-loop-animation 20s linear infinite both;
		text-align: right;
		// 这一句很重要，为了能让滚动左右连接起来
		padding-left: 100%;
		flex-wrap: nowrap;
	}

	@keyframes u-loop-animation {
		0% {
			transform: translate3d(0, 0, 0);
		}

		100% {
			transform: translate3d(-100%, 0, 0);
		}
	}
}
</style>
