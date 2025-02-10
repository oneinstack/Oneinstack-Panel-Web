<template>
	<div class="result">
		<div class="result-list">
			<template v-for="(item, index) in resultList" :key="index">
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

						<!-- <div class="title-right" v-if="item.betCodes">
							<div class="bet-type">
								{{ item.betCodes.split('_')[0] }}
							</div>
							<img class="img" :src="`/static/img/game/3d/d${item.betCodes.split('_')[1]}.png`" />
						</div> -->
					</div>

					<div class="result-content">
						<div class="content-item">
							<div class="content-img-item">
								<img src="/static/img/bet-numbers.png" />
								<div class="img-num">
									<span style="margin-top: 0rem">B</span>
								</div>
							</div>
							<div class="content">
								{{ $t('SattaKing.BettingContent2') }}:
								<div class="bet-type">
									{{ conf.getType(item.betCodes.split('_')[0]) }}
								</div>
								<div class="openCode" v-if="item.betCodeArr">
									<template v-for="(url, i2) in item.betCodeArr" :key="i2">
										<div class="txt-box">
											<div class="txt-point">{{ url.split('_')[1] }}</div>
										</div>
									</template>

								</div>
							</div>
						</div>
						<div class="content-item">
							<img class="content-img" src="/static/img/bet-time.png" />
							<div class="content">{{ $t('game.openTime') }}:{{ sutil.getTimeFormat(item.betOpenTime) }}
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
										{{ item.betOpenCode }}
									</span>
								</div>
							</div>
							<div class="content">
								{{ $t('game.openCode') }}:
								<div class="openCode" v-if="item.betOpenCode">
									<div class="txt-box">
										<div class="txt-point">{{ item.betOpenCode }}</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</template>
			<div v-if="resultList.length > 0">
				<div class="more" v-if="!isTips">
					<div class="more-btn" @click="emit('change')">
						<span>{{ $t('game.showMore') }}</span>
						<img src="/static/img/show-more.png" style="width: 20rem;height: 12rem;" />
					</div>
				</div>
				<div class="more-not" v-else>
					<span>{{ $t('user.noMore') }}</span>
				</div>
			</div>
			<x-no-data v-if="resultList.length == 0"></x-no-data>
		</div>
	</div>
</template>

<script setup lang="ts">
import sutil from '@/sstore/sutil';
import { reactive } from 'vue';
const props = defineProps({
	resultList: {
		default: [] as any[]
	},
	isTips: {
		default: false
	}
})

const emit = defineEmits(['change'])

const conf = reactive({
	getType(str: any) {
		switch (str) {
			case 'first':
				return 'Andar'
			case 'second':
				return 'Bandar'
			default:
				return 'Jodi'
		}
	}
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
					display: flex;
					align-items: center;

					.img {
						height: 42rem;
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
							color: #3a3a3a;
							font-size: 15rem;
							display: flex;
							align-items: center;
							justify-content: center;
						}
					}

					.openCode {
						display: flex;
						flex-wrap: wrap;

						img {
							height: 42rem;
							margin-left: 6rem;
						}

						.txt-box {
							height: 42rem;
							width: 42rem;
							flex-shrink: 0;
							position: relative;
							margin-left: 4rem;
							background: url('/static/img/color-red.webp') no-repeat;
							background-size: 100% 100%;
							display: flex;
							justify-content: center;
							align-items: center;

							.txt-point {
								font-size: 22rem;
								color: #fff;
							}
						}
					}
				}

				.content-line {
					display: flex;
					align-items: center;
					justify-content: space-between;

				}
			}

			.bet-type {
				color: #5bcdff;
				font-size: 26rem;
				font-weight: 700;
				margin-left: 10rem;
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