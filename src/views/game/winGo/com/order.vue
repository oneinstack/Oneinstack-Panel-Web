<template>
	<div class="result">
		<div class="result-list">
			<template v-for="(item, index) in orderDataList" :key="index">
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
							<div class="title-type" style="width: 215rem;" v-if="item.betStatus == 3">
								<div class="title-skew Cancelled"></div>
								<div class="type-text">{{ $t('game.cancelledOrder') }}</div>
							</div>
							<div class="title-code">{{ item.betExpect }}</div>
						</div>
						<div class="title-right">
							<div class="purchase-bg" v-if="item.betNumber == 'red'"
								style="background: linear-gradient(90deg, #fd0261 0%, #ff8a96 100%);">
								{{ item.betNumber }}
							</div>
							<div class="purchase-bg" v-else-if="item.betNumber == 'green'"
								style="background: linear-gradient(90deg, #00be50 0%, #9bdf00 100%);">
								{{ item.betNumber }}
							</div>
							<div class="purchase-bg" v-else-if="item.betNumber == 'violet'"
								style="background: linear-gradient(90deg, #480AC5 0%, #B36FF8 100%);">
								{{ item.betNumber }}
							</div>
							<div class="purchase-bg" v-else-if="item.betNumber == 'small'"
								style="background: linear-gradient(90deg, #ff9000 0%, #ffd000 100%);">
								{{ item.betNumber }}
							</div>
							<div class="purchase-bg" v-else-if="item.betNumber == 'big'"
								style="background: linear-gradient(90deg, #00bdff 0%, #5bcdff 100%);">
								{{ item.betNumber }}
							</div>

							<div class="purchase-num" v-else="item.betNumber">
								<div class="sum-num" :class="['qkball_' + item.betColor]">
									<span class="txt">{{ item.betNumber }}</span>
								</div>
							</div>
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
										'(≈' + item.defaultWalletCoinSymbol + item.PrizeMoneyToFixed4 + ')'}}</template>
							</div>
						</div>
						<div class="content-item">
							<div class="content-img-item">
								<img src="/static/img/bet-numbers.png" />
								<div class="img-num">
									<span style="margin-top: 0rem;">{{ String(item.openNumber) ?
										String(item.openNumber) : '--' }}</span>
								</div>
							</div>
							<div class="content">
								{{ $t('game.openCode') }}:
								<div class="banner-item" v-if="String(item.openNumber)">
									<div class="num" :class="['qkball_' + item.color]">
										<span class="txt">{{ item.openNumber }}</span>
									</div>
								</div>
								<div class="pkOpenCode" v-else>
									<div class="num">{{ '--' }}</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</template>
			<x-no-data v-if="orderDataList.length == 0"></x-no-data>
		</div>
	</div>
</template>

<script setup lang="ts">
import sutil from '@/sstore/sutil';
import { watch } from 'vue';

const props = defineProps({
	orderDataList: {
		default: [] as any[]
	},
	isClickPage: {
		default: false
	},
})
const emit = defineEmits(['handleClickOrderPage'])
watch(
	() => props.isClickPage,
	(val: any) => {
		emit('handleClickOrderPage', false)
	},
	{ deep: true }
)
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
					.purchase-bg {
						padding: 0rem 12rem;
						height: 40rem;
						background: red;
						display: flex;
						align-items: center;
						justify-content: center;
						font-size: 20rem;
						color: #FFF;
						border-radius: 5rem;
					}

					.purchase-num {
						width: 40rem;
						height: 40rem;
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
							color: #FFF;
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
							font-size: 19rem;
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
			padding: 0rem 0rem 36rem;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 24rem;
			color: #707070;
		}
	}
}

.banner-item {
	position: relative;
	width: 34rem;
	height: 34rem;
	margin-left: 8rem;

	.img {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 100%;
	}

	.num {
		position: absolute;
		top: 0rem;
		bottom: 0rem;
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 28rem;
	}
}

.pkOpenCode {
	display: flex;
	align-items: center;
	margin-left: 6rem;

	.pk {
		width: 40rem;
		height: 40rem;
		margin: 0 4rem;
	}
}

.qkball_rv {
	background: url(/static/img/game/twgo/n0_bg.png) !important;
	background-size: 100% !important;

	.txt {
		background: linear-gradient(143deg, #FE565C 51.71%, #A943F7 51.72%) !important;
		background-clip: text !important;
		-webkit-background-clip: text !important;
		-webkit-text-fill-color: transparent !important;
	}
}

.qkball_g {
	background: url(/static/img/game/twgo/green_bg.png) !important;
	background-size: 100% !important;

	.txt {
		color: #2F9C61;
	}
}

.qkball_gv {
	background: url(/static/img/game/twgo/n5_bg.png) !important;
	background-size: 100% !important;

	.txt {
		background: linear-gradient(143deg, #4CCB86 51.71%, #A943F7 51.72%) !important;
		background-clip: text !important;
		-webkit-background-clip: text !important;
		-webkit-text-fill-color: transparent !important;
	}
}

.qkball_r {
	background: url(/static/img/game/twgo/red_bg.png) !important;
	background-size: 100% !important;

	.txt {
		color: #E93333;
	}
}

.qkball_green {
	background: linear-gradient(90deg, #00be50 0%, #9bdf00 100%);
	box-shadow: 0rem 0rem 20rem 0rem rgba(0, 0, 0, 0.15);
}

.qkball_red {
	background: linear-gradient(90deg, #fd0261 0%, #ff8a96 100%);
	box-shadow: 0rem 0rem 20rem 0rem rgba(0, 0, 0, 0.15);
}

.qkball_blue {
	background: linear-gradient(90deg, #00bdff 0%, #5bcdff 100%);
	box-shadow: 0rem 0rem 20rem 0rem rgba(0, 0, 0, 0.15);
}

.qkball_yellow {
	background: linear-gradient(90deg, #ff9000 0%, #ffd000 100%);
	box-shadow: 0rem 0rem 20rem 0rem rgba(0, 0, 0, 0.15);
}

.qkball_violet {
	background: linear-gradient(90deg, #480AC5 0%, #B36FF8 100%);
	box-shadow: 0rem 0rem 20rem 0rem rgba(0, 0, 0, 0.15);
}

.pk_1 {
	background: url('/static/img/game/pk10/speed_pinball01.png') no-repeat;
	background-size: 100%;
}

.pk_2 {
	background: url('/static/img/game/pk10/speed_pinball02.png') no-repeat;
	background-size: 100%;
}

.pk_3 {
	background: url('/static/img/game/pk10/speed_pinball03.png') no-repeat;
	background-size: 100%;
}

.pk_4 {
	background: url('/static/img/game/pk10/speed_pinball04.png') no-repeat;
	background-size: 100%;
}

.pk_5 {
	background: url('/static/img/game/pk10/speed_pinball05.png') no-repeat;
	background-size: 100%;
}

.pk_6 {
	background: url('/static/img/game/pk10/speed_pinball06.png') no-repeat;
	background-size: 100%;
}

.pk_7 {
	background: url('/static/img/game/pk10/speed_pinball07.png') no-repeat;
	background-size: 100%;
}

.pk_8 {
	background: url('/static/img/game/pk10/speed_pinball08.png') no-repeat;
	background-size: 100%;
}

.pk_9 {
	background: url('/static/img/game/pk10/speed_pinball09.png') no-repeat;
	background-size: 100%;
}

.pk_10 {
	background: url('/static/img/game/pk10/speed_pinball10.png') no-repeat;
	background-size: 100%;
}

.pink {
	background-color: orange;
	color: #fff;
	text-align: center;
	line-height: 40rem;
	min-width: 60rem;
	border-radius: 40rem;
}

.blue {
	color: #5bcdff;
	font-size: 26rem;
	font-weight: bold;
	margin-right: 5rem;
}
</style>