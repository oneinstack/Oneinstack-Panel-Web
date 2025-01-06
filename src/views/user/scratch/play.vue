<template>
	<x-page :no-footer="true" headerBgColor="transparent" :topfill="false">
		<template #right>
			<div class="right-content">
				<div class="right-text">{{ $t('wallet.balance') }}</div>
				<div class="right-icon">{{ conf.walletMoney }}</div>
			</div>
			<img class="wallet-img" src="/static/img/wallet.webp" />
		</template>
		<div>
			<div class="main">
				<div class="main-img" style="flex: 1;">
					<!-- <img class="bg-img" src="/static/img/scrape-bg.webp" /> -->
					<img class="ship-img" src="/static/img/bg-ship.png" />
					<div class="maximum">
						<img class="maximum-img" src="/static/img/maximum.png" />
					</div>
				</div>
				<!--  -->
				<startchCard ref="stratchCardRef" :scratchPercent="80" maskColor="#646464" :radius="5"
					:scratchRadius="25" @scratchAll="conf.scratchAll">
					<!-- 自定义奖品内容插槽 -->
					<div class="scratch-box">
						<div class="scratch">
							<img class="scratch-bg" src="/static/img/scratch-bg.webp" />
							<div class="scratch-content">
								<div class="Winning">
									<div class="num-title" style="color: transparent;">{{ '-' }}</div>
									<div class="num-list">
										<template v-for="(item, index) in conf.saleWinningNums" :key="index">
											<div class="num-item">
												<div class="num-name">{{ item }}</div>
											</div>
										</template>
									</div>
								</div>
								<div class="numer-item">
									<div class="num-title" style="color: transparent;">{{ '-' }}</div>
									<div class="num-list">
										<template v-for="(item, index) in conf.saleRandomNums.slice(0, 5)" :key="index">
											<div class="num-item">
												<div class="num-name">{{ item.number }}</div>
												<div class="num-moner" v-if="item.moneyToFixed4 < 100">{{
													item.moneyToFixed4
													}}
												</div>
												<div class="num-moner" v-else>{{ item.money }}</div>
												<div class="win-icon"
													v-if="conf.isScratch && conf.saleWinningNums.includes(item.number)">
													<img class="win-icon-img" src="/static/img/scratch-icon.png" />
												</div>
											</div>
										</template>
									</div>
								</div>
								<div class="numer-item">
									<div class="num-list">
										<template v-for="(item, index) in conf.saleRandomNums.slice(5, 10)"
											:key="index">
											<div class="num-item">
												<div class="num-name">{{ item.number }}</div>
												<div class="num-moner" v-if="item.moneyToFixed4 < 100">{{
													item.moneyToFixed4
													}}
												</div>
												<div class="num-moner" v-else>{{ item.money }}</div>
												<div class="win-icon"
													v-if="conf.isScratch && conf.saleWinningNums.includes(item.number)">
													<img class="win-icon-img" src="/static/img/scratch-icon.png" />
												</div>
											</div>
										</template>
									</div>
								</div>
								<div class="numer-item" style="border: none;">
									<div class="num-list">
										<template v-for="(item, index) in conf.saleRandomNums.slice(10, 15)"
											:key="index">
											<div class="num-item">
												<div class="num-name">{{ item.number }}</div>
												<div class="num-moner" v-if="item.moneyToFixed4 < 100">{{
													item.moneyToFixed4
													}}
												</div>
												<div class="num-moner" v-else>{{ item.money }}</div>
												<div class="win-icon"
													v-if="conf.isScratch && conf.saleWinningNums.includes(item.number)">
													<img class="win-icon-img" src="/static/img/scratch-icon.png" />
												</div>
											</div>
										</template>
									</div>
								</div>
							</div>
						</div>
						<div style="color: #fbfbf9;font-size: 32rem;font-weight: 600;">
							<span style="position: absolute; top: 20rem;z-index: 999;width: 100%;text-align: center;">{{
								$t('scratch.WinningNumber') }}</span>
							<span
								style="position: absolute; top: 193rem;z-index: 999;width: 100%;text-align: center;">{{
									$t('scratch.YourNumber') }}</span>
						</div>
					</div>
				</startchCard>

				<div class="scratch-tips">
					<div style="float:right;height:50rem;width:2rem"></div><!--这个Div是用来占位,高度自定,宽度要为1px不能为0 -->
					<span class="tips-number">{{ conf.id }}</span>
					<p class="tips-content">{{ $t('scratch.Instructions') }}</p>
				</div>
			</div>
		</div>
		<!-- 红包弹窗 -->
		<div class="win" v-if="conf.isOpenWin" @click="conf.isOpenWin = false">
			<!-- v-if="isOpenWin" -->
			<div class="win-money">
				<img class="win-bg" src="/static/img/scratch-win.webp" />
				<div class="win-content">
					<div class="win-title" v-if="conf.winMoney > 0">Congratulations on winning</div>
					<div class="money-num" v-if="conf.winMoney > 0">{{ conf.coinSymbol == 'USDT' ? conf.coinSymbol + ' '
						:
						conf.coinSymbol }}{{ conf.winMoney }}</div>
					<div v-else>
						<div class="money-num" style="font-size: 40rem; font-weight: bold;margin-top: 80rem;">GOOD LUCK
						</div>
						<div class="money-num"
							style="font-size: 40rem; font-weight: bold;margin-top: 20rem;  margin-left: 30rem;">FOR YOU
						</div>
					</div>
				</div>
				<div class="win-btn">
					<div class="btn-item" @click.stop="sutil.pageBack">back</div>
					<!-- <div class="btn-item sure" @click.stop="back">back</div> -->
				</div>
			</div>
		</div>
		<!-- 右上角悬框 -->
		<div class="float-fixed" v-if="conf.isScratch && conf.winMoney > 0">
			<div class="float-win">
				<div class="float-content">
					<div class="float-money">{{ conf.coinSymbol == 'USDT' ? conf.coinSymbol + ' ' : conf.coinSymbol }}{{
						conf.winMoney }}
					</div>
					<div class="float-title">{{ $t('scratch.winning') }}</div>
				</div>
			</div>
		</div>
	</x-page>
</template>

<script setup lang="ts">
import { apis } from '@/api';
import { sconfig } from '@/sstore/sconfig';
import sutil from '@/sstore/sutil';
import { svalue } from '@/sstore/svalue';
import System from '@/utils/System';
import startchCard from './components/startchCard.vue';
import { nextTick, onMounted, reactive, ref } from 'vue';

const stratchCardRef = ref<any>()
const conf = reactive({
	disabled: false,
	divWidth: 0,
	divHeight: 0,
	ctx: null as any,
	points: [] as any[],
	percentage: 60, // 刮开百分之多少的时候开奖
	serviceHeiht: 200,

	saleRandomNums: [] as any,
	saleWinningNums: [] as any,
	isScratch: false,
	scratchId: '' as any,
	winMoney: 0,
	isOpenWin: false,
	coinSymbol: '',
	walletMoney: '-',
	defaultWalletInfo: {} as any,
	coinTousdt: '',
	start: false,
	id: '',
	// 成功，清除所有图层
	scratchAll() {
		console.log('1112233');
		if (conf.scratchId == -1) {
			conf.isOpenWin = true
			conf.isScratch = true
			let scratch = Cookie.get('scratch')
			scratch.isScratch = true
			Cookie.set('scratch', scratch)
		} else {
			conf.settlement()
		}
	},
	// 刮刮乐结算
	settlement() {
		System.loading()
		apis.scratchTicketlSettlement({
			id: conf.scratchId,
			success: (res: any) => {
				conf.getWalletMoney()
				conf.isOpenWin = true
				conf.isScratch = true
				let scratch = Cookie.get('scratch')
				scratch.isScratch = true
				Cookie.set('scratch', scratch)
			},
			final: () => {
				System.loading(false)
			}
		});
	},
	getWinMpney() {
		let coinTousdt = conf.coinTousdt || conf.defaultWalletInfo.coinTousdt
		if (conf.scratchId == -1) {
			conf.winMoney = 30
		} else {
			let total = 0
			conf.saleWinningNums.forEach((item: any) => {
				for (let i of conf.saleRandomNums) {
					if (item == i.number) {
						total = sutil.addNum(total, i.moneyToFixed4)
					}
				}
			})
			conf.winMoney = sutil.formatNumber(total)
			// conf.winMoney = conf.dataHandling(conf.winMoney)
		}
	},
	async getWalletMoney() {
		if (!sconfig.userInfo) return conf.walletMoney = '-'
		let item = await svalue.getDefaultWallet()
		conf.defaultWalletInfo = item
		if (item.hasOwnProperty('coinSymbol')) {
			conf.coinSymbol = item.coinSymbol
			conf.defaultWalletInfo = item
			let m = parseFloat(item.walletMoney)
			conf.walletMoney = (item.coinSymbol || '₹') + sutil.dataHandling(m)
		}
		conf.getWinMpney()
	}
})
onMounted(() => {
	let scratch = Cookie.get('scratch')
	conf.saleRandomNums = JSON.parse(scratch.saleRandomNums)
	conf.saleWinningNums = JSON.parse(scratch.saleWinningNums)
	conf.id = scratch.id
	// conf.saleWinningNums = "["+conf.saleWinningNums[0]+"]"
	conf.isScratch = scratch.isScratch
	conf.scratchId = scratch.id
	if (!sconfig.userInfo) {
		conf.getWinMpney()
		conf.coinSymbol = '$'
	}
	conf.getWalletMoney()
})
nextTick(() => {
	if (conf.isScratch) {
		stratchCardRef.value?.remove();
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

.main {
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	position: fixed;
	inset: 0;
	padding: 0 15rem;
	overflow: hidden;
	max-width: 750rem;
	margin: 0 auto;
	background: #1C1247;
}

.main-img {
	width: 100%;
	position: relative;
	background: url('/static/img/scrape-bg.webp') no-repeat;
	background-size: 100% 100%;

	.bg-img {
		width: 100%;
		height: 100%;
	}

	.ship-img {
		position: absolute;
		height: 76rem;
		width: calc(100% - 30rem);
		left: 15rem;
		bottom: 100rem;
	}

	.maximum {
		height: 54rem;
		position: absolute;
		width: 100%;
		padding: 0rem 90rem;
		bottom: 40rem;

		.maximum-img {
			width: 100%;
			height: 100%;
		}
	}
}

.scratch-box {
	position: relative;
	height: 735rem;
	width: 100%;
	padding: 0rem 15rem;
	overflow: hidden;
}

.scratch {
	position: absolute;
	height: 100%;
	width: 100%;
	left: 0;

	.scratch-bg {
		width: 100%;
		height: 100%;
	}

	.scratch-content {
		position: absolute;
		top: 0rem;
		width: 100%;
		height: 100%;
		padding: 0rem 0rem 10rem;

		.Winning {
			padding: 25rem 40rem 20rem;
			border-bottom: 4rem dashed #000;
		}

		.num-title {
			font-size: 32rem;
			font-weight: 500;
			margin-bottom: 25rem;
			color: #000;
			text-align: center;
		}

		.num-list {
			display: flex;
			justify-content: space-between;
			text-align: center;

			.num-item {
				flex: 1;
				display: flex;
				flex-direction: column;
				font-size: 40rem;
				font-weight: 600;
				position: relative;

				.num-name {
					// -webkit-text-stroke: 2rem #000;
					color: #fff;
					// text-shadow: 0rem 0rem 0 #000;
					text-shadow:
						-2rem -2rem 0 #000,
						2rem -2rem 0 #000,
						-2rem 2rem 0 #000,
						2rem 2rem 0 #000;
				}

				.num-moner {
					margin-top: 8rem;
					font-size: 32rem;
				}

				span {
					font-size: 20rem;
					font-weight: 400;
					margin-top: -5rem;
				}

				.win-icon {
					position: absolute;
					// width: 120rem;
					// height: 120rem;
					top: 5rem;
					left: 0rem;
					z-index: 0;
					width: 100%;
					text-align: center;

					.win-icon-img {
						width: 120rem;
						height: 120rem;
					}
				}
			}
		}

		.numer-item {
			padding: 20rem 0rem;
			border-bottom: 4rem dashed #000;
		}
	}
}

// .win-icon{
// 	position: absolute;
// 	top: 0;
// 	width: 100%;
// 	height: 100%;
// 	.win-icon-img{
// 		width: 120rem;
// 		height: 120rem;
// 		margin-top: 228rem;
// 		margin-left: 270rem;
// 	}
// }
.scratch-tips {
	margin-top: 10rem;
	height: 110rem;

	.tips-content {
		color: #FFF;
		font-weight: 600;
		font-size: 18rem;
		line-height: 30rem;
	}

	.tips-number {
		width: 320rem;
		height: 50rem;
		background: #FFF;
		color: #000;
		font-size: 26rem;
		font-weight: 700;
		display: flex;
		justify-content: center;
		align-items: center;
		flex-shrink: 0;
		float: right;
		clear: right;
	}
}

.canvas1 {
	width: 100%;
	height: 100%;
}

.win {
	position: fixed;
	top: 0;
	width: 100%;
	height: 100%;
	display: flex;
	justify-content: center;
	align-items: center;
	max-width: 750rem;
	z-index: 1000;

	.win-money {
		width: 536rem;
		height: 550rem;
		position: relative;

		.win-bg {
			width: 100%;
			height: 100%;
		}

		.win-content {
			position: absolute;
			top: 200rem;
			width: 100%;
			height: 100%;
			color: #FFF;
			font-weight: 500;
			display: flex;
			align-items: center;
			flex-direction: column;

			.win-title {
				font-size: 32rem;
				width: 362rem;
				text-align: center;
			}

			.money-num {
				color: #FEF8E2;
				font-size: 72rem;
				margin-top: 40rem;
			}
		}

		.win-btn {
			display: flex;
			justify-content: space-between;
			position: absolute;
			bottom: 40rem;
			width: 100%;
			display: flex;
			justify-content: center;

			.btn-item {
				height: 52rem;
				width: 175rem;
				display: flex;
				align-items: center;
				justify-content: center;
				border-radius: 80rem;
				background: #FFF2DF;
				color: #000;
				font-weight: 600;
				font-size: 26rem;

				&.sure {
					background: linear-gradient(180deg, #EB602D 0%, #FFA64F 100%);
					color: #FFF;
				}
			}
		}
	}
}

.float-fixed {
	position: fixed;
	top: 0rem;
	width: 100%;
	max-width: 750rem;
	background: red;
}

.float-win {
	position: absolute;
	right: 0;
	top: 250rem;

	.float-content {
		border-radius: 40rem 0rem 0rem 40rem;
		background: #FE4834;
		// height: 69px;
		color: #FFF;
		font-weight: 500;
		padding: 24rem 22rem;
		text-align: center;

		.float-money {
			font-size: 48rem;
		}

		.float-title {
			font-size: 20rem;
		}
	}
}
</style>
