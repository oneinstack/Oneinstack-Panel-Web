<template>
	<x-page :no-footer="true" :bgcolor="'#eff1f5'">
		<template #title>
			{{ $t('scratch.scratch') }}
		</template>
		<template #right>
			<div class="right-content">
				<div class="right-text">{{ $t('scratch.history') }}</div>
				<div class="right-icon">{{ conf.walletMoney }}</div>
			</div>
			<img class="wallet-img" src="/static/img/wallet.webp" />
		</template>
		<div class="top-select">
			<div class="top-content">
				<div class="class-num">
					<div class="class-item" :class="conf.clickTab == '0' ? 'activeTab' : ''"
						@click="conf.handleTabClick('0')">
						<div class="name">{{ $t('scratch.drawn') }}</div>
						<div class="num">{{ conf.statistics.drawn }}</div>
					</div>
					<div class="class-item" :class="conf.clickTab == '1' ? 'activeTab' : ''"
						@click="conf.handleTabClick('1')">
						<div class="name">{{ $t('scratch.winning') }}</div>
						<div class="num">{{ conf.statistics.winning }}</div>
					</div>
					<div class="class-item" :class="conf.clickTab == '2' ? 'activeTab' : ''"
						@click="conf.handleTabClick('2')">
						<div class="name">{{ $t('scratch.losing') }}</div>
						<div class="num">{{ conf.statistics.lose }}</div>
					</div>
					<div class="class-item" :class="conf.clickTab == '-1' ? 'activeTab' : ''"
						@click="conf.handleTabClick('-1')">
						<div class="name">{{ $t('scratch.expired') }}</div>
						<div class="num">{{ conf.statistics.expired }}</div>
					</div>
				</div>
				<div class="line">
					<div class="left-around"></div>
					<div class="centre"></div>
					<div class="left-around right"></div>
				</div>
			</div>
			<div class="result" style="flex: 1;overflow: hidden;">
				<div class="result-list" style="overflow-y: scroll;">
					<template v-for="(item, index) in conf.resultList" :key="index">
						<div class="result-ltem relative" @click="conf.goPlay(item)">
							<div class="result-title">
								<div class="absolute" style="top: 0;right: 0;">
									<div class="flex flex-center source-text">
										{{ item.source }}
									</div>
								</div>
								<div class="title-left">
									<div class="title-type" v-if="item.stSaleStatus == 0">
										<div class="title-skew"></div>
										<div class="type-text">{{ $t('scratch.toDrawn') }}</div>
									</div>
									<div class="title-type" v-if="item.stSaleStatus == 1">
										<div class="title-skew Prize"></div>
										<div class="type-text">{{ $t('scratch.prizeWinning') }}</div>
									</div>
									<div class="title-type Losing" v-if="item.stSaleStatus == 2">
										<div class="title-skew Losing"></div>
										<div class="type-text">{{ $t('scratch.losingLottery') }}</div>
									</div>
									<div class="title-type" style="width: 215rem;" v-if="item.stSaleStatus == -1">
										<div class="title-skew Cancelled"></div>
										<div class="type-text">{{ $t('scratch.haveExpired') }}</div>
									</div>
									<div class="title-code">{{ item.stSaleExpect }}</div>
								</div>
							</div>
							<div class="result-content">
								<div class="content-item">
									<img class="content-img" src="/static/img/bet-time.png" />
									<div class="content">{{ $t('scratch.bettingTime') }}:{{
										conf.getHour(item.stSaleTime) }}
									</div>
								</div>
								<div class="content-item">
									<img class="content-img" src="/static/img/sale-name.png" />
									<div class="content">{{ $t('scratch.name') }}:{{ item.scratchTicketShowname }}
									</div>
								</div>
								<div class="content-item">
									<img class="content-img" src="/static/img/bet-time.png" />
									<div class="content">{{ $t('game.betMoney') }}:{{ item.coinSymbol + item.saleMoney
										}}
										<template v-if="conf.currentWalletInfo.coinCode != item.saleMoneyCoin">{{ ' (≈'
											+
											(conf.currentWalletInfo.coinSymbol == 'USDT' ?
												conf.currentWalletInfo.coinSymbol + ' '
												: conf.currentWalletInfo.coinSymbol) + item.currentWalletSale + ')'
											}}</template>
									</div>
								</div>
								<div class="content-item" v-if="item.stSaleStatus">
									<img class="content-img" src="/static/img/bet-time.png" />
									<div class="content">{{ $t('game.prizeMoney') }}:{{ item.coinSymbol +
										item.saleWalletWin }}
										<template
											v-if="conf.currentWalletInfo.coinCode != item.saleMoneyCoin && parseFloat(item.saleWinningAmount) > 0">{{
												'(≈' + (conf.currentWalletInfo.coinSymbol == 'USDT' ?
													conf.currentWalletInfo.coinSymbol
													+ ' ' : conf.currentWalletInfo.coinSymbol) + item.currentWalletWin +
											')' }}</template>
									</div>
								</div>
							</div>
						</div>
					</template>
					<div v-if="conf.resultList.length > 0">
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
					<div class="all" v-if="conf.resultList.length == 0">
						<div>{{ $t('casinoModule.noData') }}</div>
					</div>
				</div>
			</div>

		</div>
	</x-page>
</template>

<script setup lang="ts">
import { apis } from '@/api';
import sconfig from '@/sstore/sconfig';
import sutil from '@/sstore/sutil';
import { svalue } from '@/sstore/svalue';
import System from '@/utils/System';
import { onMounted, reactive } from 'vue';

const conf = reactive({
	resultList: [] as any[],
	pageSize: 10,
	pageNum: 1,
	total: 0,
	coinSymbol: '',
	coinTousdt: '',
	isRefresh: false,
	isTips: false,
	statistics: {
		drawn: 0,
		expired: 0,
		lose: 0,
		winning: 0
	},
	clickTab: null,
	serviceHeiht: 300,
	defaultCoin: {} as any,	//接口返回默认币种钱包
	coinlistArr: [] as any[],
	currentWalletInfo: {} as any,
	defaultWalletInfo: {} as any,
	walletMoney: '-',
	async getDefaultCoin(obj: any) {
		conf.defaultCoin = obj
		conf.coinSymbol = obj.coinSymbol || ''
		conf.coinTousdt = obj.coinTousdt || ''
		conf.currentWalletInfo = obj
		conf.coinlistArr = await svalue.getCoinlist()
		conf.getScratchOrder()
	},

	handleTabClick(val: any) {
		if (val == conf.clickTab) {
			conf.clickTab = null
		} else {
			conf.clickTab = val
		}
		conf.pageNum = 1
		conf.resultList = []
		conf.getScratchOrder()
	},
	getScratchOrder() {
		conf.isTips = false
		System.loading()
		apis.scratchTicketlOrder({
			current: conf.pageNum,
			size: conf.pageSize,
			stSaleStatus: conf.clickTab || '',
			success: (res: any) => {
				let hasPush = false
				res.data.records?.forEach((item: any) => {
					item.source = svalue.getSourceValue(item.source)
					let obj = null
					if (item.saleMoneyCoin) {
						obj = conf.coinlistArr.find(into => into.coinCode == item.saleMoneyCoin)
					} else {
						obj = conf.coinlistArr.find(into => into.isDefault)
						item.saleMoneyCoin = obj.coinCode
					}
					item.coinTousdt = obj?.coinTousdt
					item.coinSymbol = item.saleMoneyCoin == 'USDT' ? obj.coinSymbol + ' ' : obj.coinSymbol
					item.saleWinningAmount = item.saleWinningAmount || '0.00'
					item.saleMoney = conf.moneyHandling(item.saleMoney || 0)
					//下注钱包对应中奖金额
					let saleWalletWin = sutil.formatNumber(sutil.Mul(item.coinTousdt, item.saleWinningAmount))
					item.saleWalletWin = conf.moneyHandling(saleWalletWin)

					//当前默认钱包对应中奖金额
					let currentWalletWin = sutil.formatNumber(sutil.Mul(conf.currentWalletInfo.coinTousdt, item.saleWinningAmount))
					item.currentWalletWin = conf.moneyHandling(currentWalletWin)

					//当前默认钱包对应购买金额
					let currentWalletSale = sutil.Mul(sutil.division(conf.currentWalletInfo.coinTousdt, item.coinTousdt, false), item.saleMoney)
					currentWalletSale = sutil.formatNumber(currentWalletSale)
					item.currentWalletSale = conf.moneyHandling(currentWalletSale)


					let index = conf.resultList?.findIndex(into => into.id == item.id)
					index != -1 && (hasPush = true)
				})
				if (!hasPush) {
					conf.resultList = [...conf.resultList, ...res.data.records]
				}
				if (res.data.statistics) conf.statistics = res.data.statistics
				conf.total = res.data.total
				if (conf.pageSize * conf.pageNum >= conf.total) return conf.isTips = true
			},
			final: () => {
				System.loading(false)
			}
		});
	},
	// 时间戳转为时间格式
	getHour(timestamp: any) {
		if (!timestamp) return '-'
		let date = new Date(timestamp)
		let y = date.getFullYear()
		let m = ('0' + (date.getMonth() + 1)).slice(-2)
		let d = ('0' + date.getDate()).slice(-2)
		let hour = ('0' + date.getHours()).slice(-2)
		let minute = ('0' + date.getMinutes()).slice(-2)
		return y + '-' + m + '-' + d + ' ' + hour + ':' + minute
	},
	getFixed(num: any) {
		if (!num) return '-';
		let n = parseFloat(num)
		return n.toFixed(2)
	},
	goPlay(sale: any) {
		if (sale.stSaleStatus == 0) conf.isRefresh = true
		let arr = JSON.parse(sale.saleRandomNums)
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
		let isScratch = sale.stSaleStatus == 0 ? false : true
		let scratch = {
			saleRandomNums: JSON.stringify(saleRandomNums),
			saleWinningNums: sale.saleWinningNums,
			id: sale.id,
			isScratch
		}
		Cookie.set('scratch', scratch)
		System.router.push('/user/scratch/play')
	},
	moreMessage() {
		if (conf.pageSize * conf.pageNum >= conf.total) return conf.isTips = true
		conf.pageNum++;
		conf.getScratchOrder();
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

	getCoinTousdt(num: any,) {
		conf.coinSymbol = conf.coinSymbol || conf.defaultWalletInfo.coinSymbol
		let coinTousdt = conf.coinTousdt || conf.defaultWalletInfo.coinTousdt
		if (conf.coinSymbol == '$') return num
		if (coinTousdt) {
			let n = parseFloat(coinTousdt) * parseFloat(num)
			return n.toFixed(4)
		}
		return num
	},

	getCoinTousdtMoney(num: any) {
		let moneyResult = sutil.Mul(sutil.division(num, conf.defaultCoin.coinTousdt, false), conf.defaultWalletInfo.coinTousdt)
		moneyResult = sutil.formatNumber(moneyResult)
		let moneyToFixed4 = null
		if (conf.defaultWalletInfo.walletCoin == conf.defaultCoin.coinCode) {
			moneyToFixed4 = num
		} else {
			moneyToFixed4 = moneyResult
		}
		return sutil.dataHandling(moneyToFixed4)

	}
})
onMounted(async () => {
	if (!sconfig.userInfo) return conf.walletMoney = '-'
	let item = await svalue.getDefaultWallet()
	conf.defaultWalletInfo = item
	if (item.hasOwnProperty('coinSymbol')) {
		conf.defaultWalletInfo = item
		let m = parseFloat(item.walletMoney)
		conf.walletMoney = (item.coinSymbol || '₹') + sutil.dataHandling(m)
	}
	conf.getDefaultCoin(item)
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

// @media screen and (max-width: 700px) {
.history-content {
	padding: 20rem 10rem
}

.top-select {
	margin: 20rem 10rem;
	border-radius: 10rem;
	background: #FFF5E3;
	display: flex;
	flex-direction: column;
	height: calc(100% - 144rem);

	.class-num {
		height: 145rem;
		display: flex;
		justify-content: space-between;
		margin: 0rem 10rem;

		.class-item {
			flex: 1;
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;
			font-weight: 700rem;
			font-size: 30rem;

			.num {
				color: #000;
				font-size: 36rem;
			}
		}
	}

	.line {
		display: flex;
		// justify-content: space-between;
		position: relative;

		.left-around {
			width: 18px;
			height: 33rem;
			background: #eff1f5;
			border-radius: 18rem;
			margin-left: -10rem;
			position: absolute;

			&.right {
				right: -10rem;
			}
		}

		.centre {
			background: linear-gradient(180deg, rgba(0, 0, 0, 0.15) 0%, rgba(217, 217, 217, 0.00) 100%);
			height: 26rem;
			flex: 1;
		}
	}
}

.result {
	// margin: 0rem 24rem 124rem;
	border-radius: 16rem;

	.result-list {
		padding: 24rem 10rem 0rem;
		height: 100%;

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
					color: #3C80F5;
					font-size: 24rem;
					font-weight: 600;
				}
			}

			.result-content {
				.content-item {
					display: flex;
					align-items: center;
					margin-top: 24rem;

					.content-img {
						width: 25rem;
						height: 22rem;
					}

					.content {
						color: #3A3A3A;
						font-size: 24rem;
						font-weight: 500;
						margin-left: 8rem;
						display: flex;
						align-items: center;

						.purchase {
							width: 30rem;
							height: 30rem;
						}

						.purchase-triple {
							text-align: center;

							.purchase-img {
								width: 30rem;
								height: 30rem;
							}
						}

						.purchase-num {
							width: 30rem;
							height: 30rem;
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

					.content-img-item {
						width: 25rem;
						height: 25rem;
						position: relative;

						img {
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
		}

		.more {
			background: #FFF;
			padding: 24rem 24rem 24rem;

			.more-btn {
				box-shadow: rgba(0, 0, 0, 0.1) 0px 1.06667vw 1.06667vw;
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
			padding: 8rem 0rem 36rem;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 24rem;
			color: #707070;
		}

		.all {
			padding: 20rem;

			div {
				height: 75rem;
				background: #FFF;
				border-radius: 10rem;
				display: flex;
				justify-content: center;
				align-items: center;
				color: #707070;
			}
		}
	}
}

.activeTab,
.activeTab .num {
	// background: #000 !important;
	// color: #FDE63E !important;
	background: #FFA64F !important;
	color: #fff !important;
}

.source-text {
	width: 176rem;
	height: 36rem;
	font-size: 16rem;
	background: linear-gradient(to right, #FFFFFF, #FFE0CA);
	color: #FF7502;
	border-top-right-radius: 16rem;
}
</style>