<template>
	<x-page :no-footer="true" :bgcolor="'#eff1f5'">
		<template #title>
			{{ $t('scratch.scratch') }}
		</template>
		<template #right>
			<div class="right-content">
				<div class="right-text">{{ $t('wallet.balance') }}</div>
				<div class="right-icon">{{ conf.walletMoney }}</div>
			</div>
			<img class="wallet-img" src="/static/img/wallet.webp" />
		</template>
		<div class="page">
			<div class="main-img">
				<scratch-img :paddingNum="62" :item="conf.scratch"
					v-if="conf.scratch.scratchTicketShowname"></scratch-img>
			</div>
			<div class="nav-box-list">
				<div class="nav-content">
					<div class="nav-left">
						<div class="power">{{ conf.scratch.scratchTicketShowname }}</div>
						<!-- <div class="left-time">Sale Date: 2023-10-26 09:59:14</div> -->
					</div>
					<div class="nav-right">{{ conf.coinSymbol ||
						'$' }}{{ conf.scratch.newScratchTicketPrice }}<span>/{{ $t('scratch.ticket') }}</span></div>
				</div>
			</div>
			<div class="rule" v-if="conf.scratch.scratchTicketRule">
				<div v-html="conf.scratch.scratchTicketRule"></div>
			</div>
			<div style="height: 140rem;"></div>
			<div class="bottom-btn">
				<div class="btn-content">
					<div class="btn-left" @click="conf.goHisTory">
						<img class="btn-img" src="/static/img/purchase-btn.png" />
						<span>{{ $t('scratch.mySratchHistory') }}</span>
					</div>
					<div class="btn-right">
						<div class="btn-item" @click="conf.goPlay">{{ $t('scratch.howPlay') }}</div>
						<div class="btn-item" style="margin-left: 12rem;background: #BE1B1B;padding: 0rem 24rem;"
							@click="conf.changePurchase">{{ $t('scratch.playNow') }}</div>
					</div>
				</div>
			</div>
		</div>
		<showModal ref="modalRefs" @confirm="conf.confirm"></showModal>
	</x-page>
</template>

<script setup lang="ts">
import showModal from "./components/showModal.vue"
import { svalue } from '@/sstore/svalue';
import scratchImg from './components/scratchImg.vue'
import { nextTick, onMounted, reactive, ref } from "vue";
import sconfig from '@/sstore/sconfig';
import sutil from '@/sstore/sutil';
import System from '@/utils/System';
import i18n from '@/lang';
import { apis } from '@/api';
import { useRoute } from "vue-router";

const modalRefs = ref<any>()
const conf = reactive({
	scratch: {} as any,
	coinSymbol: '',
	coinTousdt: '',
	scratchTicketPrice: 0,
	currentWalletInfo: {} as any,	//当前设置默认钱包
	id: '' as any,
	defaultCoinInfo: {} as any,	//接口返回默认币种
	coinlistArr: [] as any[],
	walletMoney: '-',
	defaultWalletInfo: {} as any,
	getDefaultCoin(obj: any) {
		conf.currentWalletInfo = obj
		conf.coinSymbol = obj.coinSymbol || ''
		conf.coinTousdt = obj.coinTousdt || ''
		nextTick(() => {
			conf.getScratchTicketlDetail(conf.id)
		})
	},

	goPlay() {
		// let randomNums = "[{\"number\":19,\"bonus\":\"1000000\"},{\"number\":27,\"bonus\":\"1000\"},{\"number\":11,\"bonus\":20.0000},{\"number\":41,\"bonus\":\"30\"},{\"number\":37,\"bonus\":\"300000\"},{\"number\":95,\"bonus\":\"10\"},{\"number\":7,\"bonus\":\"100000\"},{\"number\":8,\"bonus\":\"300\"},{\"number\":67,\"bonus\":\"1000000\"},{\"number\":35,\"bonus\":\"200000\"},{\"number\":54,\"bonus\":\"10\"},{\"number\":36,\"bonus\":\"2000\"},{\"number\":3,\"bonus\":\"10\"},{\"number\":78,\"bonus\":\"2000\"},{\"number\":90,\"bonus\":\"20000\"}]"
		// let arr = JSON.parse(randomNums)
		let saleWinningNums = "[20]"
		let arr = [0, 10, 20, 30, 40, 50, 60, 70, 80, 100, 120, 130, 140, 150, 160]
		let saleRandomNums = arr.map(item => {
			let number = 10 + item
			let money = 20 + item
			return {
				number,
				money
			}
		})
		// let saleRandomNums = arr.map(item => {
		// 	let tousdt = conf.getCoinTousdt(item.bonus,2)
		// 	let money = tousdt
		// 	if(tousdt.length == 4) money = tousdt.charAt(0) + 'K'
		// 	if(tousdt.length == 5) money = tousdt.charAt(0) + 'W'
		// 	if(tousdt.length == 6) money = tousdt.substr(0,2) + 'W'
		// 	if(tousdt.length == 7) money = tousdt.charAt(0) + 'M'
		// 	if(tousdt.length == 8) money = tousdt.substr(0,2) + 'M'
		// 	if(tousdt.length == 9) money = tousdt.charAt(0) + 'B'
		// 	if(tousdt.length == 10) money = tousdt.substr(0,2) + 'B'
		// 	if(tousdt.length == 11) money = tousdt.substr(0,3) + 'B'
		// 	return {
		// 		money,
		// 		...item
		// 	}
		// })
		let scratch = {
			saleRandomNums: JSON.stringify(saleRandomNums),
			saleWinningNums,
			id: "-1",
			isScratch: false
		}
		Cookie.set('scratch', scratch)
		System.router.push('/user/scratch/play')
	},
	changePurchase() {
		if (!sconfig.userInfo) return System.router.push('/login')
		modalRefs.value.open({
			title: i18n.t('scratch.nowPlay')
		})
	},
	confirm() {
		System.loading()
		apis.scratchTicketlPurchase({
			stId: conf.scratch.id,
			total: 1,
			walletCoinCode: conf.defaultWalletInfo.walletCoin,
			success: (res: any) => {
				let scratchData = res.data
				let arr = JSON.parse(scratchData.saleRandomNums)
				let saleRandomNums = arr.map((item: any) => {
					let moneyResult = sutil.Mul(item.bonus, conf.currentWalletInfo.coinTousdt)
					moneyResult = sutil.formatNumber(moneyResult)
					let money = null, moneyToFixed4 = null
					money = conf.moneyHandling(moneyResult)
					moneyToFixed4 = moneyResult
					return {
						money,
						moneyToFixed4,
						...item
					}
				})
				let scratch = {
					saleRandomNums: JSON.stringify(saleRandomNums),
					saleWinningNums: scratchData.saleWinningNums,
					id: scratchData.id,
					isScratch: false
				}
				Cookie.set('scratch', scratch)
				modalRefs.value.close()
				System.router.push('/user/scratch/play')
			},
			final: () => {
				System.loading(false)
			}
		});
	},
	getScratchTicketlDetail(scratchTicketId: any) {
		System.loading()
		apis.scratchTicketlDetail({
			scratchTicketId,
			success: (res: any) => {
				conf.scratch = res.data
				conf.scratch.newScratchTicketPrice = sutil.Mul(conf.currentWalletInfo.coinTousdt, conf.scratch.scratchTicketPrice)
				conf.scratch.newScratchTicketPrice = sutil.formatNumber(conf.scratch.newScratchTicketPrice)
			},
			final: () => {
				System.loading(false)
			}
		});
	},
	getFixed(num: any) {
		if (!num) return '-';
		let n = parseFloat(num)
		return n.toFixed(2)
	},
	moneyHandling(num: any) {
		let amount = parseFloat(num)
		let newNum = null
		if (amount < 10000) {
			// 如果金额小于10,000，则直接显示原数值
			newNum = amount
		} else if (amount < 1000000) {
			// 如果金额在10,000到1,000,000之间，则显示为xxxx.xxW（万）
			newNum = (amount / 1000) + "K"
		} else if (amount < 1000000000) {
			// 如果金额在1,000,000到1,000,000,000之间，则显示为xxxx.xxM（百万）
			newNum = (amount / 1000000) + "M"
		} else {
			// 如果金额超过1,000,000,000，则显示为xxxx.xxB（十亿）
			newNum = (amount / 1000000000) + "B"
		}
		return newNum
	},

	multiple(number: any, multiple: any) {
		let len = number.length;
		if (number.indexOf(".") >= 0) {
			len = number.indexOf(".");
		}
		let mLen = multiple.length - 1;
		let result = '';
		let header = '';
		let index = 0;
		let end = '';
		if (len > mLen) {
			index = len - mLen;
			header = number.substring(0, index);
			end = number.substring(index);
			end = end.replace(".", "");
			result = header + "." + end;
		} else {
			header = '0.'
			index = mLen - len;
			for (let i = 0; i < index; i++) {
				header += "0";
			}
			end = number.replace(".", "");
			result = header + end;
		}
		result = result.substring(0, 4);
		if (result.indexOf(".") == result.length - 1) {
			result = result.replace(".", "");
		}
		return result;
	},
	getCoinTousdt(num: any, type: any) {
		conf.coinSymbol = conf.coinSymbol || conf.defaultWalletInfo.coinSymbol
		let coinTousdt = conf.coinTousdt || conf.defaultWalletInfo.coinTousdt
		if (type == 2) {
			if (conf.coinSymbol == '$') return num
			if (coinTousdt) {
				return parseFloat(coinTousdt) * parseFloat(num)
			}
			return num
		} else {
			let number = parseFloat(num)
			if (conf.coinSymbol == '$') return number.toFixed(2)
			if (coinTousdt) {
				let n = parseFloat(coinTousdt) * parseFloat(num)
				return n.toFixed(2)
			}
			return number.toFixed(2)
		}
	},
	goHisTory() {
		if (sconfig.userInfo) {
			System.router.push('/user/scratch/history')
		} else {
			System.router.replace('/login')
		}
	}
})
const route = useRoute()
onMounted(async () => {
	if (Cookie.get('scratch')) {
		Cookie.remove('scratch')
	}
	const routeParams = route.query

	routeParams.id && (conf.id = routeParams.id)
	if (!sconfig.userInfo) return conf.walletMoney = '-'
	let item = await svalue.getDefaultWallet()
	conf.getDefaultCoin(item)
	conf.defaultWalletInfo = item
	if (item.hasOwnProperty('coinSymbol')) {
		conf.defaultWalletInfo = item
		let m = parseFloat(item.walletMoney)
		conf.walletMoney = (item.coinSymbol || '₹') + sutil.dataHandling(m)
	}
})
</script>

<style lang="less" scoped>
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

.main-img {
	display: block;
	width: 100%;
	height: 700rem;
	padding-top: 20rem;

	img {
		width: 100%;
		height: 100%;
	}
}

.nav-box-list {
	position: sticky;
	z-index: 1;
	top: 104rem;
	left: 0;
	background: #fff;
	padding: 22rem 0rem;
	z-index: 1;
	border-radius: 0rem 0rem 10px 10px;
	box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.06);

	.nav-content {
		padding: 26rem 62rem;
		display: flex;
		justify-content: space-between;
		align-items: center;

		.nav-left {
			.power {
				color: #E20000;
				font-weight: 600;
				font-size: 36rem;
			}

			.left-time {
				font-weight: 400;
				font-size: 24rem;
				color: rgba(0, 0, 0, 0.6);
				margin-top: 10rem;
			}
		}

		.nav-right {
			color: #000;
			font-weight: 700;
			font-size: 48rem;

			span {
				font-weight: 500;
				font-size: 24rem;
				color: rgba(0, 0, 0, 0.6);
			}
		}
	}
}

.rule {
	margin: 20rem 10rem;
	border-radius: 10rem;
	background: #FFF;
	box-shadow: 0px 8rem 8rem 0px rgba(0, 0, 0, 0.06);
	padding: 32rem;
	font-size: 28rem;

	.odds {
		color: #000;
		margin-bottom: 40rem;

		.odds-title {
			font-weight: 600;
			font-size: 36rem;
		}

		.odds-content {
			font-weight: 400;
			font-size: 28rem;
			margin-top: 5rem;
			line-height: 40rem;
		}
	}

	.bonus {
		border-radius: 10rem;
		background: #F8F9FF;
		padding: 8rem;

		.title {
			display: flex;
			padding: 20rem 0rem;

			.title-item {
				flex: 1;
				display: flex;
				flex-direction: column;
				justify-content: center;
				align-items: center;
			}
		}

		.bonus-line {
			display: flex;
			height: 72rem;
			color: #000;
			font-weight: 600;
			font-size: 28rem;

			.line-item {
				flex: 1;
				display: flex;
				flex-direction: column;
				justify-content: center;
				align-items: center;
			}

			&:nth-child(2n) {
				background: #FFF;
			}
		}
	}

	.rule-content {
		color: #000;
		font-size: 28rem;
		line-height: 40rem;
		margin-top: 40rem;
	}
}

.bottom-btn {
	height: 120rem;
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	max-width: 500px;
	margin: 0rem auto;

	.btn-content {
		padding: 30rem 20rem;
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: #FFF;

		.btn-left {
			display: flex;
			flex-direction: column;
			align-items: center;

			.btn-img {
				width: 48rem;
				height: 48rem;
			}

			span {
				color: #000;
				font-size: 28rem;
				font-weight: 400;
			}
		}

		.btn-right {
			display: flex;

			.btn-item {
				// width: 172rem;
				padding: 0rem 16rem;
				height: 72rem;
				border-radius: 10rem;
				background: #2782BF;
				color: #FFF;
				font-size: 24rem;
				font-weight: 600;
				display: flex;
				justify-content: center;
				align-items: center;
			}
		}
	}
}
</style>