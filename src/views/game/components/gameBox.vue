<template>
	<div class="c-head-main" style="background: linear-gradient(180deg, #EB602D 0%, #FFA64F 160%)">
		<div :style="{ height: `${StatusBarConfig.statusHeight}px` }"></div>
		<div class="c-head-nav">
			<div class="back" @click="conf.goBack">
				<img class="back-img" src="/static/img/vector.png" />
			</div>
			<div class="c-head-nav-title">
				<div v-if="conf.currentTab">
					{{ gameType }} - {{ conf.currentTab.lotteryInterval / 1000 / 60 }}{{
						(conf.currentTab.lotteryInterval /
							1000 / 60)
							>
							1 ? $t('game.minutes') : $t('game.minute') }}
				</div>
			</div>
			<div class="c-head-nav-right">
				<div class="right-content">
					<div class="right-text">{{ $t('wallet.balance') }}</div>
					<div class="right-icon">{{ conf.walletMoney }}</div>
				</div>
				<img class="wallet-img" src="/static/img/wallet.webp" />
			</div>
		</div>
	</div>

	<div class="col relative" style="overflow-y: scroll">
		<div class="absolute" style="width: 750rem; height: 100%">
			<x-statusbar />
			<div style="height: 104rem"></div>
			<div class="flex justify-center" style="background: #f5f0f0;height: 100%;">
				<div style="width: 100%; max-width: 500px">
					<div class="tip">
						<img class="tip-icon" src="/static/img/Frame.png" />
						<div style="width: 100%;overflow: hidden;">
							<div class="tip-content">
								<span>{{ $t('winGo.BettingCloseTip1') + props.openLockCountdown +
									$t('winGo.BettingCloseTip2') }}</span>
							</div>
						</div>
					</div>

					<div class="row play-item-box">
						<div style="overflow-y: scroll;">
							<div class="tabs-list">
								<template v-for="(item, index) in props.list" :key="index">
									<div class="tab-item" :class="{ 'tab-active': item.id == active }"
										@click="emit('change', item.id, index); conf.currentTab = item">
										<div class="item-content" v-if="(item.lotteryInterval / 1000 / 60) >= 1">
											<div class="icon"></div>
											<span>{{ item.lotteryInterval / 1000 / 60 }}</span>{{ (item.lotteryInterval
												/
												1000 /
												60) > 1 ? $t('game.minutes') : $t('game.minute') }}
										</div>
										<div class="item-content" v-else>
											<div class="icon"></div>
											<span>{{ item.lotteryInterval / 1000 }}</span>{{ $t('game.second') }}
										</div>
									</div>
								</template>
							</div>
						</div>
					</div>
					<div style="padding: 20rem">
						<slot></slot>
					</div>
				</div>

				<bet-popup :betShow="conf.gb.show" :betShare="betShare" @submit="conf.handleBetSubmit">
					<slot name="bet"></slot>
				</bet-popup>
			</div>
		</div>
	</div>
</template>
<script setup lang="ts">
import gameBet from './gameBet.vue';
import betPopup from "./betPopup.vue"
import { svalue } from "@/sstore/svalue"
import { onMounted, reactive, watch } from 'vue';
import sconfig from '@/sstore/sconfig';
import sutil from '@/sstore/sutil';
import System from '@/utils/System';
import StatusBarConfig from '@/utils/StatusBarConfig'
import i18n from '@/lang';
import { apis } from '@/api';
import { Scope } from 'tools-vue3'

const event = Scope.Event()
const emit = defineEmits(['change', 'close'])
const props = defineProps({
	list: {
		default: [] as any[]
	},
	active: {
		default: ''
	},
	selectBetInfo: {
		default: [] as any[]
	},
	gameType: {
		default: ''
	},
	currentOpenInfo: {
		default: {} as any
	},
	openLockCountdown: {
		default: 0
	},
	betShare: {
		default: false
	}
})
//获取当前钱包余额
const getWalletMoney = async (type: any) => {
	if (!sconfig.userInfo) return conf.walletMoney = '-'
	let item = await svalue.getDefaultWallet()
	if (item.hasOwnProperty('coinSymbol')) {
		conf.defaultWalletInfo = item
		let m = parseFloat(conf.defaultWalletInfo.walletMoney)
		conf.walletMoney = (conf.defaultWalletInfo.coinSymbol || '₹') + sutil.dataHandling(m)
	}
}

const conf = reactive({
	walletMoney: '--',
	swiperList: [],
	gb: {
		show: false
	},
	balance: 1,
	quantity: 1,
	qtt: {
		data: {
			v1: 1,
			v2: 5,
			v3: 10,
			v4: 20,
			v5: 50,
			v6: 100,
			v7: 200
		}
	},
	//gameBetBalance相关配置
	gbb: {
		data: {
			v1: 1,
			v2: 10,
			v3: 100,
			v4: 1000
		},
		active: 'v1',
		choose: (item: any) => {
			conf.gbb.active = item
			conf.balance = conf.gbb.data[item]
		},
		show: false
	} as any,
	//打开下注
	open: () => {
		conf.gb.show = true
	},
	//重置选中内容
	reset: () => {
		conf.quantity = 1
		conf.gbb.choose('v1')
	},
	//关闭下注窗口
	close: () => {
		conf.gb.show = false
		conf.reset()
		emit('close')
	},
	selectBetNumArr: [] as any,
	currentWalletBalance: '',
	titleName: '',
	scrollLeft: 0,
	isSubmitClick: true,
	coinSymbol: '',
	scrollWith: 180,
	currentTab: {} as any,
	defaultWalletInfo: {} as any,
	goBack: () => {
		sutil.pageBack()
	},
	//下注提交
	handleBetSubmit(e: any) {
		if (!e) return conf.close()
		conf.balance = e
		let infoTip = '', obj = {}
		let betAmount = sutil.Mul(sutil.Mul(conf.selectBetNumArr.length, conf.balance), conf.quantity)
		if (!conf.defaultWalletInfo.hasOwnProperty('coinCode')) {
			System.toast(i18n.t('game.setWalletTip'))
			return
		}
		if (betAmount > parseFloat(conf.currentWalletBalance)) {
			System.toast(i18n.t('SattaKing.insufficient')) //钱包余额不足!
		}

		let minBetMoney = conf.defaultWalletInfo.betMinAmount
		let maxBetMoney = conf.defaultWalletInfo.betMaxAmount
		let coinSymbol = conf.defaultWalletInfo.coinSymbol

		if (parseFloat(e) < parseFloat(minBetMoney)) {
			System.toast(i18n.t('game.minBetTip') + ' ' + coinSymbol + minBetMoney || '')
			return
		}

		if (parseFloat(e) > parseFloat(maxBetMoney)) {
			System.toast(i18n.t('game.maxBetTip') + ' ' + coinSymbol + maxBetMoney || '')
			return
		}
		if (infoTip) {
			System.toast(i18n.t(infoTip))
			return
		}

		if (props.gameType == 'Trx') {
			obj = {
				money: conf.balance,	//单注金额
				betCodes: conf.selectBetNumArr.map((obj: any) => {
					return obj.oddsCode
				}).join(",") || '', //投注内容
				betExpect: props.currentOpenInfo.openExpect, //投注期号
				betOpenId: props.currentOpenInfo.lotteryOpenId, //开奖记录编号
				lotteryId: props.currentOpenInfo.lotteryId, //投注彩票ID
				multiple: conf.quantity, //投注倍数
				nums: conf.selectBetNumArr.length, //投注数量
				supplement: 0, //是否追加订单，0否，1是
				walletCoinCode: conf.defaultWalletInfo.walletCoin, //下注钱包币种
			}
		}
		if (props.gameType == 'pk10') {
			let num = conf.selectBetNumArr[0].active + '_'
			obj = {
				money: conf.balance, //单注金额
				betCodes: num + conf.selectBetNumArr[0]?.key || '', //投注内容
				betExpect: props.currentOpenInfo.openExpect, //投注期号
				betOpenId: props.currentOpenInfo.lotteryOpenId, //开奖记录编号
				lotteryId: props.currentOpenInfo.lotteryId, //投注彩票ID
				multiple: conf.quantity, //投注倍数
				nums: conf.selectBetNumArr.length, //投注数量
				supplement: 0, //是否追加订单，0否，1是
				walletCoinCode: conf.defaultWalletInfo.walletCoin, //下注钱包币种
			}
		}
		if (props.gameType == '5D') {
			obj = {
				money: conf.balance, //单注金额
				betCodes: conf.selectBetNumArr.map((item: any) => item.oddsCode).join('') || '', //投注内容
				betExpect: props.currentOpenInfo.openExpect, //投注期号
				betOpenId: props.currentOpenInfo.lotteryOpenId, //开奖记录编号
				lotteryId: props.currentOpenInfo.lotteryId, //投注彩票ID
				multiple: conf.quantity, //投注倍数
				nums: conf.selectBetNumArr.length, //投注数量
				supplement: 0, //是否追加订单，0否，1是
				walletCoinCode: conf.defaultWalletInfo.walletCoin, //下注钱包币种
			}
		}
		if (!conf.isSubmitClick) return
		conf.isSubmitClick = false
		System.loading()
		apis.lotteryUserBets({
			...obj,
			success: (res: any) => {
				conf.isSubmitClick = true
				getWalletMoney(2)
				conf.gb.show = false
				emit('close', 'betSuccess')
				conf.reset()
				System.toast(i18n.t('game.betSuccess'),'success')
			},
			final: () => {
				System.loading(false)
				conf.isSubmitClick = true
			}
		});
	}
})
watch(
	() => props.selectBetInfo,
	(val: any) => {
		if (val) conf.selectBetNumArr = val
	},
	{ deep: true, immediate: true }
)
watch(
	() => props.list,
	(newVal: any) => {
		if (newVal) {
			conf.currentTab = newVal[0]
			let min = newVal.find((item: any) => item.id == props.active)?.lotteryInterval
			if ((min / 1000 / 60) >= 1) {
				conf.titleName = props.gameType + ' - ' + (min / 1000 / 60) + ((min / 1000 / 60) > 1 ? i18n.t('game.minutes') : i18n.t('game.minute'))
			} else {
				conf.titleName = props.gameType + ' - ' + (min / 1000) + i18n.t('game.second')
			}
			let index = newVal.findIndex((item: any) => item.id == props.active)
			if (index > 2) {
				conf.scrollLeft = index * 50
			} else {
				conf.scrollLeft = 0
			}
		}
	}
)
// 暴露方法
defineExpose({
	getWalletMoney
})
onMounted(() => {
	event.on('openbet', conf.open)
	event.on('closebet', conf.close)
	conf.reset()
	getWalletMoney(2)
})
</script>

<style lang="less" scoped>
.c-head {
	position: relative;

	&-main {
		width: 750rem;
		color: #fff;
		z-index: 99;
		position: fixed;
	}

	&-nav {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 104rem;
		position: relative;

		&-title {
			font-size: 32rem;
			font-weight: Bold;
		}

		.back {
			position: absolute;
			height: 100%;
			display: flex;
			align-items: center;
			width: 100rem;
			left: 0;

			.back-img {
				width: 18rem;
				height: 30rem;
				margin-left: 30rem;
			}
		}

		&-right {
			position: absolute;
			right: 0rem;
			height: 100%;
			display: flex;
			align-items: center;
		}
	}
}

.right-content {
	text-align: right;
	letter-spacing: -0.3px;
	font-size: 22rem;
}

.wallet-img {
	width: 72rem;
	height: 72rem;
	margin-right: 20rem;
}

.play-item-box {
	background-color: #fff;
	border-radius: 36rem;
	margin: 20rem 20rem 0;
}

.play-item {
	display: flex;
	justify-content: center;
	align-items: center;
	// flex-direction: column;
	gap: 10rem;
	border: 1px solid #ff605a00;
	height: 180rem;
	border-radius: 36rem;
	padding: 0 20rem;
	color: #959ba8;
	width: 25%;

	.icon {
		width: 88rem;
		height: 88rem;
		background: url(/static/img/game/time_nor.png) no-repeat;
		background-size: 100%;
	}

	&.active {
		border: 1px solid #F88c43;
		background: linear-gradient(180deg, #FFA64F 0%, #fff 90.5%);
		color: #F88c43;

		.icon {
			background: url(/static/img/game/time_cur.png) no-repeat;
			background-size: 100%;
		}
	}
}

.colum,
.flex,
.row {
	display: flex;
	flex-wrap: wrap;
}

.tabs-list {
	display: flex;
	align-items: flex-end;

	.tab-item {
		border-radius: 36rem;
		height: 180rem;
		padding: 0rem 24rem;
		display: flex;
		justify-content: center;
		align-items: center;
		width: 25%;
		color: #959ba8;

		.item-content {
			display: flex;
			align-items: center;
			font-size: 24rem;

			.icon {
				width: 58rem;
				height: 58rem;
				background: url(/static/img/game/time_nor.png) no-repeat;
				background-size: 100%;
			}
		}

		&.tab-active {
			border: 1px solid #F88c43;
			background: linear-gradient(180deg, #FFA64F 0%, #fff 90.5%);
			color: #F88c43 !important;

			.icon {
				background: url(/static/img/game/time_cur.png) no-repeat;
				background-size: 100%;
			}
		}
	}
}

.tip {
	display: flex;
	align-items: center;
	padding: 0rem 24rem;
	height: 80rem;
	background: #FFF9ED;

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