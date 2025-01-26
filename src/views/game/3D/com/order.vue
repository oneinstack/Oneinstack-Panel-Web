<template>
	<div class="result">
		<div class="result-list">
			<template v-for="(item, index) in conf.resultList" :key="index">
				<div class="result-ltem">
					<div class="result-title">
						<div class="title-left">
							<div class="title-type" v-if="item.betStatus == 0">
								<div class="title-skew"></div>
								<div class="type-text">{{ $t('game.toDrawn') }}</div>
							</div>
							<div class="title-type" v-if="item.betStatus == 2">
								<div class="title-skew Prize"></div>
								<div class="type-text">{{ $t('game.prizeWinning') }}</div>
							</div>
							<div class="title-type Losing" v-if="item.betStatus == 1">
								<div class="title-skew Losing"></div>
								<div class="type-text">{{ $t('game.losingLottery') }}</div>
							</div>
							<div class="title-type" style="width: 215rem;" v-if="item.betStatus == 3">
								<div class="title-skew Cancelled"></div>
								<div class="type-text">{{ $t('game.cancelledOrder') }}</div>
							</div>
							<div class="title-code">{{ item.betExpect }}</div>
						</div>
						<div class="title-right">
							<img class="purchase" :src="`static/img/${item.orderStr}.webp`"
								v-if="item.orderType == 'sumStr'" />
							<div class="purchase-num" v-if="item.orderType == 'sum'">
								<img class="sum-img" src="/static/img/poinits.webp" />
								<div class="sum-num">{{ item.orderNum }}</div>
							</div>
							<img class="purchase" :src="`static/img/share-${item.orderNum}.webp`"
								v-if="item.orderType == 'single'" />
							<div class="purchase-triple" v-if="item.orderType == 'double'">
								<div class="triple-bottom">
									<img class="purchase-img" :src="`static/img/share-${item.orderNum}.webp`" />
									<img class="purchase-img" :src="`static/img/share-${item.orderNum}.webp`" />
								</div>
							</div>
							<div class="purchase-triple" v-if="item.orderType == 'leopard'">
								<img class="purchase-img" :src="`static/img/share-${item.orderNum}.webp`" />
								<div class="triple-bottom">
									<img class="purchase-img" :src="`static/img/share-${item.orderNum}.webp`" />
									<img class="purchase-img" :src="`static/img/share-${item.orderNum}.webp`" />
								</div>
							</div>
						</div>
					</div>
					<div class="result-content">
						<!-- <div class="content-item">
								<img class="content-img" src="/static/img/bet-expect.png" />
								<div class="content">{{$t('game.betExpect')}}:{{item.betExpect}}</div>
							</div> -->
						<div class="content-item">
							<img class="content-img" src="/static/img/bet-time.png" />
							<div class="content">{{ $t('game.bettingTime') }}:{{ sutil.getTimeFormat(item.betTime) }}
							</div>
						</div>
						<div class="content-item">
							<img class="content-img" src="/static/img/bet-time.png" />
							<div class="content">{{ $t('game.openTime') }}:{{ sutil.getTimeFormat(item.betOpenTime) }}
							</div>
						</div>
						<div class="content-item">
							<img class="content-img" src="/static/img/bet-money.png" />
							<div class="content">{{ $t('game.BetCoin') }}:{{ item.betCoinCode }}
							</div>
						</div>
						<div class="content-item">
							<img class="content-img" src="/static/img/bet-money.png" />
							<div class="content">
								{{ $t('game.betMoney') }}:{{ item.coinSymbol + item.betMoney }}
								<template v-if="item.defaultWalletCoin != item.betCoinCode">{{ ' (≈' +
									item.defaultWalletCoinSymbol + item.betMoneyToFixed4 + ')' }}</template>
							</div>
						</div>
						<div class="content-item">
							<img class="content-img" src="/static/img/bet-prize.png" />
							<div class="content">
								{{ $t('game.prizeMoney') }}:{{ item.coinSymbol + item.betPrizeMoney }}
								<template
									v-if="item.defaultWalletCoin != item.betCoinCode && parseFloat(item.betPrizeMoney) > 0">{{
										'(≈' + item.defaultWalletCoinSymbol + item.PrizeMoneyToFixed4 + ')' }}</template>
							</div>
						</div>
						<div class="content-item">
							<div class="content-img-item">
								<img src="/static/img/bet-numbers.png" />
								<div class="img-num"><text style="margin-top: 0rem;">{{ conf.getTotal(item.betOpenCode)
										}}</text></div>
							</div>
							<div class="content">{{ $t('game.openCode') }}:
								<div v-for="(into, intoIndex) in item.OpenCodeArr" :key="intoIndex">

									<img class="random-img" :src="into.src" />


								</div>
								<!-- :{{item.betOpenCode}} -->

							</div>
						</div>
					</div>
				</div>
			</template>
			<div v-if="conf.resultList.length > 0">
				<div class="more" v-if="!conf.isTips">
					<div class="more-btn" @click="conf.moreMessage">
						<text>{{ $t('game.showMore') }}</text>
						<img src="/static/img/show-more.png" style="width: 20rem;height: 12rem;" />
					</div>
				</div>
				<div class="more-not" v-else>
					<text>{{ $t('user.noMore') }}</text>
				</div>
			</div>
			<x-no-data v-if="conf.resultList.length == 0" :top="60"></x-no-data>
		</div>
	</div>
</template>

<script setup lang="ts">
import { apis } from '@/api';
import sconfig from '@/sstore/sconfig';
import sutil from '@/sstore/sutil';
import { svalue } from '@/sstore/svalue'
import System from '@/utils/System';
import { reactive, watch } from 'vue';
const props = defineProps({
	lotteryId: {
		default: ''
	},
	oddsArr: {
		default: [] as any[]
	}
})
const initOrder = () => {
	if (!sconfig.userInfo) return System.router.push('/login')
	conf.resultList = []
	conf.pageNum = 1
	conf.total = 0
	conf.getLotteryResult()
}
const conf = reactive({
	resultList: [] as any[],
	pageSize: 10,
	pageNum: 1,
	total: 0,
	oddsType: [] as any[],
	isTips: false,
	coinlist: [] as any[],
	shareList: [{
		src: '/static/img/share-1.webp',
		value: 1,
	},
	{
		src: '/static/img/share-2.webp',
		value: 2,
	},
	{
		src: '/static/img/share-3.webp',
		value: 3,
	},
	{
		src: '/static/img/share-4.webp',
		value: 4,
	},
	{
		src: '/static/img/share-5.webp',
		value: 5,
	},
	{
		src: '/static/img/share-6.webp',
		value: 6,
	}
	],
	getLotteryOdds(arr: any) {
		conf.oddsType = arr.map((item: any) => {
			let orderType = ''
			if (item.oddsCode == 'sum_big' || item.oddsCode == 'sum_small' || item.oddsCode ==
				'sum_even' || item.oddsCode == 'sum_odd') {
				orderType = 'sumStr'
			} else {
				orderType = item.oddsCode.split('_')[0]
			}
			let orderNum = ''
			if (item.oddsCode == 'leopard_any') {
				orderNum = '0'
			} else {
				orderNum = item.oddsName.split('-')[1]
			}
			return {
				orderType,
				orderStr: item.oddsCode.split('_')[1],
				orderNum,
				...item
			}
		})
		initOrder()
	},
	getPurchase(oddsId: any) {
		let num = conf.oddsType.find(item => {
			return item.oddsCode == oddsId
		});
		if (num) return num
	},
	async getLotteryResult() {
		let defaultWalletInfo = await svalue.getDefaultWallet()
		conf.isTips = false
		apis.lotteryUserOrder({
			current: conf.pageNum,
			size: conf.pageSize,
			lotteryId: props.lotteryId,
			success: (res: any) => {
				let data = res.data.records.map((item: any) => {
					let order = conf.getPurchase(item.betCodes)
					return {
						oddsId: order.oddsId,
						orderNum: order.orderNum,
						orderStr: order.orderStr,
						orderType: order.orderType,
						...item
					}
				})
				data.forEach((item: any) => {
					let obj = svalue.coinlist.find(into => into.coinCode == item.betCoinCode)
					item.coinTousdt = obj.coinTousdt
					//默认钱包coinSymbol
					item.defaultWalletCoinSymbol = defaultWalletInfo.coinSymbol == 'USDT' ? defaultWalletInfo.coinSymbol + ' ' : defaultWalletInfo.coinSymbol
					item.defaultWalletCoin = defaultWalletInfo.walletCoin

					//下注钱包coinSymbol
					item.coinSymbol = obj.coinSymbol == 'USDT' ? obj.coinSymbol + ' ' : obj.coinSymbol

					let arr = item.betOpenCode ? item.betOpenCode.split(',') : []
					item.OpenCodeArr = []
					arr?.forEach((into: any) => {
						let index = conf.shareList.findIndex(num => num.value == Number(into));
						item.OpenCodeArr.push(conf.shareList[
							index])
					})
					if (defaultWalletInfo.walletCoin != item.betCoinCode) {
						//下注金额汇率转换（eg:默认钱包=CNY，默认币种钱包=INR,下注钱包=USD,将下注金额转换为默认钱包对应金额）
						let betMoneyResult = sutil.Mul(
							sutil.division(item.betMoney, item.coinTousdt, false), defaultWalletInfo.coinTousdt)
						betMoneyResult = sutil.formatNumber(betMoneyResult)
						let betMoneyResultToFixed4 = sutil.dataHandling(betMoneyResult)
						item.betMoneyToFixed4 = betMoneyResultToFixed4

						//中奖金额汇率转换
						let PrizeMoneyResult = null
						if (parseFloat(item.betPrizeMoney) > 0) {
							PrizeMoneyResult = sutil.Mul(sutil.division(item.betPrizeMoney, item.coinTousdt, false), defaultWalletInfo.coinTousdt)
							PrizeMoneyResult = sutil.formatNumber(PrizeMoneyResult)
						} else {
							PrizeMoneyResult = 0.00
						}
						let PrizeMoneyResultToFixed4 = sutil.dataHandling(PrizeMoneyResult)
						item.PrizeMoneyToFixed4 = PrizeMoneyResultToFixed4
					} else {
						item.betMoneyToFixed4 = sutil.dataHandling(item.betMoney)
						if (parseFloat(item.betPrizeMoney) < 0) {
							item.betPrizeMoney = 0.00
						}
						item.PrizeMoneyToFixed4 = sutil.dataHandling(item.betPrizeMoney)
					}
				})
				conf.resultList = [...conf.resultList, ...data]
				conf.total = res.data.total
				if (conf.pageSize * conf.pageNum >= conf.total) return conf.isTips = true
			}
		});
	},
	initResult() {
		apis.lotteryUserOrder({
			current: 1,
			size: 10,
			lotteryId: props.lotteryId,
			success: (res: any) => {
				if (conf.resultList[0].openExpect != res.data.records[0].openExpect) {
					conf.resultList.unshift(res.data.records[0])
					conf.resultList.pop()
				}
				conf.total = res.data.total
			}
		});
	},
	getNum(item:any, index:number) {
		let arr = item.openCode.split(',')
		return arr[index]
	},
	getTotal(code:any) {
		if (!code) return '-';
		let arr = code.split(',')
		return arr.reduce(function (prev:any, curr:any) {
			return parseInt(prev) + parseInt(curr);
		});
	},
	getValue(item:any) {
		let arr = item.openCode.split(',')
		let num1 = parseInt(arr[0])
		let num2 = parseInt(arr[1])
		let num3 = parseInt(arr[2])
		if (num1 == num2 && num1 == num3 && num2 == num3) {
			return 0
		} else if ((num1 + num2 + num3) < 11) {
			return 1
		} else {
			return 2
		}
	},
	getNumber(item:any) {
		let arr = item.openCode.split(',')
		let num1 = parseInt(arr[0])
		let num2 = parseInt(arr[1])
		let num3 = parseInt(arr[2])
		if (num1 == num2 && num1 == num3 && num2 == num3) {
			return 0
		} else if ((num1 + num2 + num3) % 2 == 0) {
			return 2
		} else {
			return 1
		}
	},
	getFixed(num:any) {
		if (!num) return '-';
		let n = parseFloat(num)
		if (n == -1) {
			return '-'
		}
		return n.toFixed(2)
	},
	moreMessage() {
		if (conf.pageSize * conf.pageNum >= conf.total) return conf.isTips = true
		conf.pageNum++;
		conf.getLotteryResult();
	}
})
watch(
	() => props.oddsArr,
	(val:any) => {
		if (val.length > 0) conf.getLotteryOdds(val)
	},
	{ deep: true, immediate: true }
)
watch(
	() => props.lotteryId,
	(val: string) => {
		if (val) initOrder()
	}
)
// 暴露方法
defineExpose({
	initOrder
})
</script>

<style lang="less" scoped>
.result {
	// margin: 0rem 24rem 124rem;
	border-radius: 16rem;

	.result-list {
		.result-ltem {
			padding: 30rem;
			background: #FFF;
			margin-bottom: 24rem;
			border-radius: 16rem;

			.result-title {
				display: flex;
				align-items: center;
				justify-content: space-between;

				.title-left {
					display: flex;
					align-items: center;

					.title-type {
						position: relative;
						width: 186rem;
						height: 46rem;

						.title-skew {
							background: #3C80F5;
							position: absolute;
							top: 0;
							bottom: 0;
							left: 0;
							right: 0;
							transform: skew(-30deg);

							&.Prize {
								background: #E20000;
							}

							&.Losing {
								background: #FDAB45;
							}

							&.Cancelled {
								background: #5C6381;
							}
						}

						.type-text {
							position: absolute;
							top: 0;
							bottom: 0;
							left: 0;
							right: 0;
							display: flex;
							align-items: center;
							justify-content: center;
							color: #FFF;
							font-size: 24rem;
							font-weight: 600;
						}
					}

					.title-code {
						margin-left: 12rem;
						color: #000;
						font-size: 30rem;
						font-weight: 600;
					}
				}

				.title-right {

					// color: #3C80F5;
					// font-size: 24rem;
					// font-weight: 600;
					.purchase {
						width: 40rem;
						height: 40rem;
					}

					.purchase-triple {
						text-align: center;

						.purchase-img {
							width: 30rem;
							height: 30rem;
						}
					}

					.purchase-num {
						width: 42rem;
						height: 42rem;
						position: relative;

						.sum-img {
							width: 100%;
							height: 100%;
						}

						.sum-num {
							position: absolute;
							top: 0rem;
							bottom: 0rem;
							width: 100%;
							display: flex;
							align-items: center;
							justify-content: center;
							font-size: 20rem;
						}
					}
				}
			}

			.result-content {
				.content-item {
					display: flex;
					align-items: center;
					margin-top: 24rem;

					.content-img {
						width: 25rem;
						height: 25rem;
					}

					.content {
						color: #3A3A3A;
						font-size: 24rem;
						font-weight: 500;
						margin-left: 8rem;
						display: flex;
						align-items: center;
					}

					.content-img-item {
						width: 25rem;
						height: 25rem;
						position: relative;

						img {
							position: absolute;
							top: 0;
							left: 0;
							width: 100%;
							height: 100%;
						}

						.img-num {
							position: absolute;
							top: 0;
							bottom: 0;
							right: 0;
							left: 0;
							color: #000;
							font-size: 18rem;
							display: flex;
							align-items: center;
							justify-content: center;
						}
					}
				}

				.content-line {
					display: flex;
					align-items: center;
					justify-content: space-between;

				}
			}

			&:first-of-type {
				border-radius: 0rem 0rem 16rem 16rem;
			}
		}

		.more {
			background: #FFF;
			padding: 24rem 24rem 24rem;

			.more-btn {
				box-shadow: rgba(0, 0, 0, 0.1) 0rem 8rem 8rem;
				border-radius: 16rem;
				height: 78rem;
				display: flex;
				align-items: center;
				justify-content: center;

				text {
					margin-right: 20rem;
					font-size: 24rem;
					font-weight: 700;
				}
			}
		}

		.more-not {
			padding: 0rem 0rem 36rem;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 24rem;
			color: #707070;
		}
	}
}

.random-img {
	width: 30rem;
	height: 30rem;
	margin-left: 8rem;
	line-height: 30rem;
	vertical-align: middle;

	img {
		display: inline-block;
	}
}
</style>