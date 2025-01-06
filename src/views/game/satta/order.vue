<template>
	<div class="order">
		<div class="head-top">
			<div class="head-nav">
				<div class="back" @click="conf.close">
					<img class="back-img" src="/static/img/vector.png" />
				</div>
				<div class="head-title">{{ $t('game.myOrder') }}</div>
			</div>
		</div>
		<div style="flex: 1;overflow-y: hidden;">
			<div class="result">
				<div class="result-list">
					<template v-for="(item, index) in conf.myOrderList" :key="index">
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
							</div>
							<div class="result-content">
								<div class="singe-line">
									<div class="left-div">
										<img src="/static/img/bet-time.png" class="left-img" />
										{{ $t('game.bettingTime') + ':' }}
									</div>
									<div class="right-div">{{ conf.getTime(item.betTime) }}</div>
								</div>
								<div class="singe-line">
									<div class="left-div">
										<img src="/static/img/bet-time.png" class="left-img" />
										{{ $t('game.openTime') + ':' }}
									</div>
									<div class="right-div">{{ conf.getTime(item.betOpenTime) }}</div>
								</div>
								<div class="singe-line">
									<div class="left-div">
										<img src="/static/img/bet-open.png" class="left-img" />
										{{ $t('SattaKing.BettingContent2') + ':' }}
									</div>
									<div class="right-div">{{ item.newBetCodes }}</div>
								</div>
								<div class="content-line">
									<div class="line-left">
										<div class="content-item">
											<span class="open-code border">{{ 'G' }}</span>
											<div class="content">{{ $t('SattaKing.GameType') }}:{{ item.game_type }}
											</div>
										</div>
									</div>
									<div class="line-right">
										<div class="content-item">
											<img class="content-img" src="/static/img/bet-money.png" />
											<div class="content">{{ $t('game.BetCoin') }}:{{ item.betCoinCode }}
											</div>
										</div>
									</div>
								</div>
								<div class="singe-line">
									<div class="left-div">
										<img src="/static/img/bet-money.png" class="left-img" />
										{{ $t('game.TotalBetAmount') + ':' }}
									</div>
									<div class="right-div">
										{{ item.coinSymbol + item.totalBetAmount }}
										<template v-if="item.defaultWalletCoin != item.betCoinCode">{{ ' (≈' +
											item.defaultWalletCoinSymbol + item.betTotalMoneyToFixed4 + ')'
											}}</template>
									</div>
								</div>
								<div class="singe-line">
									<div class="left-div">
										<img src="/static/img/bet-prize.png" class="left-img" />
										{{ $t('game.prizeMoney') + ':' }}
									</div>
									<div class="right-div">
										{{ item.coinSymbol + item.betPrizeMoney }}
										<template
											v-if="item.defaultWalletCoin != item.betCoinCode && parseFloat(item.betPrizeMoney) > 0">{{
												'(≈' + item.defaultWalletCoinSymbol + item.PrizeMoneyToFixed4 + ')'
											}}</template>
									</div>
								</div>
								<div class="singe-line">
									<span class="open-code border">{{ item.betOpenCode || '-' }}</span>
									<div class="content">{{ $t('game.openCode') + ':' }}</div>
									<div class="openCodeBox" v-if="item.betOpenCode">
										<img class="sum-img" src="/static/img/color-red.webp" />
										<div class="sum-num">{{ conf.ripr(item.betOpenCode) }}</div>
									</div>
								</div>
							</div>
						</div>
					</template>
					<div v-if="conf.myOrderList.length > 0">
						<div class="more" v-if="!conf.isTips">
							<div class="more-btn" @click="conf.moreMessage">
								<span>{{ $t('game.showMore') }}</span>
								<img src="/static/img/show-more.png" style="width: 20rem;height: 12rem;" />
							</div>
						</div>
						<div class="more-not" v-else>
							<span>{{ $t('user.noMore') }}</span>
						</div>
					</div>
					<x-no-data v-if="conf.myOrderList.length == 0"></x-no-data>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { apis } from '@/api';
import sconfig from '@/sstore/sconfig';
import sutil from '@/sstore/sutil';
import { svalue } from '@/sstore/svalue'
import System from '@/utils/System';
import { onMounted, reactive, watch } from 'vue';
const props = defineProps({
	lotteryId: {
		default: ''
	}
})
const emit = defineEmits(['close'])
const conf = reactive({
	myOrderList: [] as any[],
	pageNum: 1,
	pageSize: 10,
	total: 0,
	triggered: true,
	freshing: false,
	serviceHeiht: 300,
	isTips: false,
	//数据小于10处理
	ripr(num: any) {
		num = parseFloat(num)
		return num < 10 ? `0${num}` : num
	},

	close() {
		emit('close')
	},
	tolower() {
		// console.log('5555')
	},

	//获取my order数据
	async getOrderList(cb = null as any) {
		let defaultWalletInfo = await svalue.getDefaultWallet()
		System.loading()
		conf.isTips = false
		apis.lotteryUserOrder({
			current: conf.pageNum,
			size: conf.pageSize,
			lotteryId: props.lotteryId,
			success: (res: any) => {
				let datasArr = res.data.records.map((item: any) => {
					item.newBetCodesArr = item.betCodes.split(',')
					item.newBetCodes = item.newBetCodesArr.map((obj: any) => {
						return obj.split('_')[1]
					}).join(",") || ''
					item.game_type = item.betCodes.includes('num') ? 'Jodi' : item.betCodes
						.includes('first') ? 'Andar' : 'Bndar'
					return {
						...item
					}
				})
				datasArr.forEach((item: any) => {
					let obj = svalue.coinlist.find(into => into.coinCode == item.betCoinCode)
					item.coinTousdt = obj.coinTousdt
					//默认钱包coinSymbol
					item.defaultWalletCoinSymbol = defaultWalletInfo.coinSymbol == 'USDT' ? defaultWalletInfo.coinSymbol + ' ' : defaultWalletInfo.coinSymbol
					item.defaultWalletCoin = defaultWalletInfo.walletCoin

					//下注钱包coinSymbol
					item.coinSymbol = obj.coinSymbol == 'USDT' ? obj.coinSymbol + ' ' : obj.coinSymbol


					item.newBetCodesArr = item.betCodes.split(',')
					item.newBetCodes = item.newBetCodesArr.map((obj: any) => {
						return obj.split('_')[1]
					}).join(",") || ''
					item.game_type = item.betCodes.includes('num') ? 'Jodi' : item.betCodes
						.includes('first') ? 'Andar' : 'Bndar'

					if (defaultWalletInfo.walletCoin != item.betCoinCode) {
						//下注总金额汇率转换（eg:默认钱包=CNY，默认币种钱包=INR,下注钱包=USD,将下注金额转换为默认钱包对应金额）
						let betTotalMoneyResult = sutil.Mul(sutil.division(item.totalBetAmount, item.coinTousdt, false), defaultWalletInfo.coinTousdt)
						betTotalMoneyResult = sutil.formatNumber(betTotalMoneyResult)
						let betTotalMoneyResultToFixed4 = sutil.dataHandling(
							betTotalMoneyResult)
						item.betTotalMoneyToFixed4 = betTotalMoneyResultToFixed4

						//中奖总金额汇率转换
						let PrizeTotalMoneyResult = null
						if (parseFloat(item.betPrizeMoney) > 0) {
							PrizeTotalMoneyResult = sutil.Mul(sutil.division(item.betPrizeMoney, item.coinTousdt, false), defaultWalletInfo.coinTousdt)
							PrizeTotalMoneyResult = sutil.formatNumber(
								PrizeTotalMoneyResult)
						} else {
							PrizeTotalMoneyResult = 0.00
						}
						let PrizeTotalMoneyResultToFixed4 = sutil.dataHandling(
							PrizeTotalMoneyResult)
						item.PrizeMoneyToFixed4 = PrizeTotalMoneyResultToFixed4
					} else {
						item.betTotalMoneyToFixed4 = sutil.dataHandling(item.totalBetAmount)
						if (parseFloat(item.betPrizeMoney) < 0) {
							item.betPrizeMoney = 0.00
						}
						item.PrizeMoneyToFixed4 = sutil.dataHandling(item.betPrizeMoney)
					}
				})

				conf.myOrderList = [...conf.myOrderList, ...datasArr]

				conf.total = res.data.total
				if (conf.pageSize * conf.pageNum >= conf.total) return conf.isTips = true
			},
			final: () => {
				cb && cb()
				System.loading(false)
			}
		});
	},

	// 时间戳转为时间格式
	getHour(timestamp: any) {
		if (!timestamp) return '-'
		let date = new Date(timestamp)
		let hour = ('0' + date.getHours()).slice(-2)
		let minute = ('0' + date.getMinutes()).slice(-2)
		return hour + ':' + minute
	},

	// 时间戳转为时间格式
	getTime(timestamp: any) {
		if (!timestamp) return '-'
		let date = new Date(timestamp)
		let year = date.getFullYear()
		let moth = ('0' + (date.getMonth() + 1)).slice(-2)
		let day = ('0' + date.getDate()).slice(-2)
		let hour = ('0' + date.getHours()).slice(-2)
		let minute = ('0' + date.getMinutes()).slice(-2)
		let sechond = ('0' + date.getSeconds()).slice(-2)
		return year + '-' + moth + '-' + day + '  ' + hour + ':' + minute
	},

	// 触发下拉刷新
	onRefresh() {
		if (conf.freshing) return;
		conf.freshing = true;
		if (!conf.triggered) conf.triggered = true;
		conf.myOrderList = [];
		conf.pageNum = 1;
		conf.getOrderList(() => {
			conf.triggered = false;
			conf.freshing = false;
		});
	},

	moreMessage() {
		if (conf.pageSize * conf.pageNum >= conf.total) return conf.isTips = true
		conf.pageNum++;
		conf.getOrderList();
	},
})
const initOrder = () => {
	if (!sconfig.userInfo) return System.router.push('/login')
	conf.myOrderList = []
	conf.pageNum = 1
	conf.total = 0
	conf.getOrderList()
}
// 暴露方法
defineExpose({
	initOrder
})
watch(
	() => props.lotteryId,
	(val: any) => {
		initOrder()
	}
)
onMounted(() => {
	conf.getOrderList()
})
</script>

<style lang="less" scoped>
.order {
	background: #F5F5F5;
	height: 100%;
	max-width: 750rem;
	margin: 0 auto;
	display: flex;
	flex-direction: column;
}

.head-top {
	background: linear-gradient(180deg, #EB602D 0%, #FFA64F 160%);

	.head-nav {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 104rem;
		color: #FFF;
		position: relative;

		.head-title {
			font-size: 32rem;
			font-weight: Bold;
		}

		.back {
			position: absolute;
			left: 30rem;
			height: 100%;
			display: flex;
			align-items: center;

			.back-img {
				width: 18rem;
				height: 30rem;
			}
		}
	}
}

.result {
	// margin: 0rem 24rem 124rem;
	width: 100%;
	height: 100%;
	overflow-y: scroll;

	.result-list {
		padding-bottom: 24rem;

		.result-ltem {
			padding: 30rem;
			background: #FFF;
			margin-top: 24rem;
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
			}

			.result-content {
				.singe-line {
					display: flex;
					color: #3A3A3A;
					font-size: 24rem;
					font-weight: 500;
					margin-top: 24rem;
					width: 100%;

					.left-div {
						display: flex;
						align-items: start;
						max-width: 30%;

						.left-img {
							width: 25rem;
							height: 25rem;
							margin-right: 8rem;
							margin-top: 6rem;
						}
					}

					.right-div {
						max-width: 70% !important;
						word-wrap: break-word;
					}
				}

				.content-item,
				.singe-line {
					display: flex;
					align-items: center;
					margin-top: 24rem;
					position: relative;

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

					.img-num {
						width: 25rem;
						height: 25rem;
					}

					.open-code {
						position: absolute;
						top: 8rem;
						left: 0;
						width: 25rem;
						font-size: 18rem;
						text-align: center;
						color: #000;

						// border: 2rem solid #AAA;
						// border-radius: 50%;
					}

					.border {
						background: url('../../../static/img/bet-numbers.png') no-repeat center;
						background-size: 100%;
						width: 25rem;
						height: 25rem;
						line-height: 27rem;
						position: initial;
						box-sizing: border-box;
						color: #999;
						font-size: 14rem;
					}
				}

				.content-line {
					display: flex;
					align-items: center;
					justify-content: space-between;
				}
			}
		}

		.more {
			background: #FFF;
			padding: 24rem 24rem 0rem;

			.more-btn {
				box-shadow: rgba(0, 0, 0, 0.1) 0rem 1.06667vw 1.06667vw;
				border-radius: 2.13333vw;
				height: 78rem;
				display: flex;
				align-items: center;
				justify-content: center;

				span {
					margin-right: 20rem;
					font-size: 24rem;
					font-weight: 700;
				}
			}
		}

		.more-not {
			padding: 24rem 0rem 36rem;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 24rem;
			color: #707070;
		}
	}
}

.openCodeBox {
	width: 35rem !important;
	height: 35rem !important;
	position: relative;
	margin-left: 10rem;

	.sum-img {
		width: 100%;
		height: 100%;
	}

	.sum-num {
		position: absolute;
		top: 0rem;
		bottom: 0rem;
		width: 100% !important;
		height: 35rem !important;
		line-height: 35rem;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 24rem;
		color: #FFF;
	}
}
</style>
