<template>
	<div class="result">
		<div class="result-list">
			<template v-for="(item, index) in conf.resultList" :key="index">
				<div class="result-ltem" :id="index == 0 ? 'order0' : ''">
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
							<div class="title-type" style="width: 215rem" v-if="item.betStatus == 3">
								<div class="title-skew Cancelled"></div>
								<div class="type-text">{{ $t('game.cancelledOrder') }}</div>
							</div>
							<div class="title-code">{{ item.betExpect }}</div>
						</div>
					</div>

					<div class="result-content">
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
							<img class="content-img" src="/static/img/bet-time.png" />
							<div class="content">{{ 'PlayName' }}:{{ item.playName }}
							</div>
						</div>
						<div class="content-item">
							<img class="content-img" src="/static/img/bet-time.png" />
							<div class="content" style="gap: 4rem;">{{ 'BetContent' }}:
								<template v-for="into in item.betContent">
									<div class="ball-box" :style="{
									'background-image': `url('/static/img/game/marksix/${into}.webp')`,
									}"
									v-if="isNaN(into)">
									<div>{{ into?.split('_')[1] || into}}</div>
									</div>
									<resultBall :num="into" :size="42" :active="item.isActive" v-if="!isNaN(into)"/>
								</template>
							</div>
						</div>
						<div class="content-item">
							<img class="content-img" src="/static/img/bet-money.png" />
							<div class="content">{{ $t('game.BetCoin') }}:{{ item.betCoinCode }}</div>
						</div>
						<div class="content-item">
							<img class="content-img" src="/static/img/bet-money.png" />
							<div class="content">
								{{ $t('game.betMoney') }}:{{ item.coinSymbol + item.betMoney }}
								<template v-if="item.defaultWalletCoin != item.betCoinCode">
									{{ ' (≈' + item.defaultWalletCoinSymbol + item.betMoneyToFixed4 + ')' }}
								</template>
							</div>
						</div>
						<div class="content-item">
							<img class="content-img" src="/static/img/bet-money.png" />
							<div class="content">
								{{ 'BetNums' }}:{{ parseInt(item.betNums) }}
							</div>
						</div>
						<div class="content-item">
							<img class="content-img" src="/static/img/bet-prize.png" />
							<div class="content">
								{{ $t('game.prizeMoney') }}:{{ item.coinSymbol + item.betPrizeMoney }}
								<template
									v-if="item.defaultWalletCoin != item.betCoinCode && parseFloat(item.betPrizeMoney) > 0">
									{{ '(≈' + item.defaultWalletCoinSymbol + item.PrizeMoneyToFixed4 + ')' }}
								</template>
							</div>
						</div>
						<div class="content-item">
							<div class="content-img-item">
								<img src="/static/img/bet-numbers.png" />
								<div class="img-num">
									<span style="margin-top: 0rem">
										{{ conf.getTotal(item.betOpenCode) }}
									</span>
								</div>
							</div>
							<div class="content">
								{{ $t('game.openCode') }}:
								<div class="openCode" v-if="item.betOpenCode"  style="gap: 4rem;">
									<template v-for="into in item.betOpenCode.split(',')">
										<resultBall :num="into" :size="42"/>
									</template>
								</div>
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
			<x-no-data v-if="conf.resultList.length == 0"></x-no-data>
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
import resultBall from './components/resultBall.vue'
import { getOdds } from './MarkSixDataOdds'
import { Scope } from 'tools-vue3'
const {conf:orderConf} = Scope.getConf()

const props = defineProps({
	lotteryId: {
		default: ''
	},
	oddsArr: {
		default: []
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
	allData: [] as any[],
	resultList: [] as any[],
	pageSize: 10,
	pageNum: 1,
	total: 0,
	isTips: false,
	tree: getOdds(),
	async getLotteryResult() {
		let defaultWalletInfo = await svalue.getDefaultWallet()
		conf.isTips = false
		apis.lotteryUserOrder({
			current: conf.pageNum,
			size: conf.pageSize,
			lotteryId: props.lotteryId,
			success: (res: any) => {
				res.data.records.forEach((item: any) => {
					let info = orderConf.oddsData.filter((num:any) => item.betCodes.includes(num.oddsCode))
					item.playName = info[0].oddsLabel
					item.betContent = info.map((into:any) => into.oddsName)
					let obj = svalue.coinlist.find(into => into.coinCode == item.betCoinCode)
					item.coinTousdt = obj.coinTousdt
					//默认钱包coinSymbol
					item.defaultWalletCoinSymbol = defaultWalletInfo.coinSymbol == 'USDT' ? defaultWalletInfo.coinSymbol + ' ' : defaultWalletInfo.coinSymbol
					item.defaultWalletCoin = defaultWalletInfo.walletCoin

					//下注钱包coinSymbol
					item.coinSymbol = obj.coinSymbol == 'USDT' ? obj.coinSymbol + ' ' : obj.coinSymbol

					let arr = item.betOpenCode ? item.betOpenCode.split(',') : []
					item.OpenCodeArr = []
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
				conf.resultList = [...conf.resultList, ...res.data.records]
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
	getTotal(code: any) {
		if (!code) return '-';
		let arr = code.split(',')
		return arr.reduce(function (prev: any, curr: any) {
			return parseInt(prev) + parseInt(curr);
		});
	},
	moreMessage() {
		if (conf.pageSize * conf.pageNum >= conf.total) return conf.isTips = true
		conf.pageNum++;
		conf.getLotteryResult();
	}
})
watch(
	() => props.lotteryId,
	(val: string) => {
		if (val) initOrder()
	},
	{ deep: true, immediate: true }
)
// 暴露方法
defineExpose({
	initOrder
})
onMounted( () =>{
	console.log('conf.tree',conf.tree)
	conf.allData = conf.tree.map((item:any) => item.list.concat(conf.allData))
	// conf.allData = conf.allData.map((item:any) => item)
	console.log('conf.allData',conf.allData)
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
						:deep(.ball-box){
							position: relative !important;
						}
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
							font-size: 15rem;
							display: flex;
							align-items: center;
							justify-content: center;
						}
					}
					.openCode{
						display: flex;
						:deep(.ball-box) {
							position: relative !important;
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

				span {
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