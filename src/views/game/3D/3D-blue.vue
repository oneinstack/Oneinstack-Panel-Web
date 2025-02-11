<template>
	<GameLayout title="Dice" :code="conf.gameType" :lottery="lottery" :ref="conf.layout.setRef"
		@reset="conf.betting.popup.close">
		<div class="time-box">
			<div class="time-outer">
				<div class="time-content">
					<img class="time-img" src="/static/theme/blue/time.png" />
					<span>{{ $t('game.timeBig') }}</span>
					<img class="time-img" src="/static/theme/blue/time.png" />
				</div>
			</div>
		</div>
		<div class="incline">
			<img class="incline-img" src="/static/theme/blue/incline.png" />
		</div>
		<div class="center-box">
			<div class="time-nav">
				<div style="overflow-x: scroll;" v-scroll>
					<div class="time-list">
						<div v-for="(item, index) in lottery.play.list" :key="index" class="time-item"
							:class="{ 'time-active': item.id === lottery.play.item.id }"
							@click="lottery.play.change(`/game/${conf.gameType}/${conf.gameType}`, item)">
							<div>{{ item.timeType }}<span class="word">{{ item.timeName }}</span></div>
						</div>
					</div>
				</div>
			</div>
			<div class="share-box">
				<div class="share-title">{{ $t('game.resultFor') }}：{{ lottery.lastissue }}</div>
				<div class="share-list">
					<div class="share-item">
						<div class="item-title">{{ $t('game.resultBig') }}</div>
						<div class="item-random">
							<div class="adbanner">
								<game-loop :swipeList="conf.loop.shareList" :target-swipe="conf.loop.openCode[0]"
									:autoplay="conf.loop.autoplay">
									<template v-slot="{ item }">
										<img style="width: 100%;height: 100%;"
											:src="`/static/img/share-${item}.webp`" />
									</template>
								</game-loop>
							</div>
							<div class="adbanner">
								<game-loop :swipeList="conf.loop.shareList" :target-swipe="conf.loop.openCode[1]"
									:autoplay="conf.loop.autoplay">
									<template v-slot="{ item }">
										<img style="width: 100%;height: 100%;"
											:src="`/static/img/share-${item}.webp`" />
									</template>
								</game-loop>
							</div>
							<div class="adbanner">
								<game-loop :swipeList="conf.loop.shareList" :target-swipe="conf.loop.openCode[2]"
									:autoplay="conf.loop.autoplay">
									<template v-slot="{ item }">
										<img style="width: 100%;height: 100%;"
											:src="`/static/img/share-${item}.webp`" />
									</template>
								</game-loop>
							</div>
						</div>
					</div>
					<div class="divider-h"></div>
					<div class="share-item">
						<div class="item-title" style="text-align: center;">{{ $t('game.totalPoint') }}</div>
						<div class="item-random">
							<div class="adbanner">
								<game-loop :swipeList="conf.loop.poinits" :target-swipe="conf.loop.openCode[3]"
									:autoplay="conf.loop.autoplay">
									<template v-slot="{ item }">
										<div class="total-swiper">
											<img class="total-img" src="/static/img/poinits.webp" />
											<div class="total-point">{{ item }}</div>
										</div>
									</template>
								</game-loop>
							</div>
						</div>
					</div>
					<div class="divider-h"></div>
					<div class="share-item">
						<div class="item-title" style="text-align: center;">{{ $t('game.draw') }}</div>
						<div class="item-random">
							<div class="adbanner">
								<game-loop :swipeList="conf.loop.drawList" :target-swipe="conf.loop.openCode[4]"
									:autoplay="conf.loop.autoplay">
									<template v-slot="{ item }">
										<div class="random"
											style="display: flex;justify-content: center;align-items: center;font-size: 48rem;width: 100%;height: 100%;"
											v-if="item.content == '-'">-</div>
										<img style="width: 100%;height: 100%;" :src="item.src1" v-else />
									</template>
								</game-loop>
							</div>
							<div class="adbanner">
								<game-loop :swipeList="conf.loop.drawList" :target-swipe="conf.loop.openCode[5]"
									:autoplay="conf.loop.autoplay">
									<template v-slot="{ item }">
										<div class="random"
											style="display: flex;justify-content: center;align-items: center;font-size: 48rem;width: 100%;height: 100%;"
											v-if="item.content == '-'">-</div>
										<img style="width: 100%;height: 100%;" :src="item.src2" v-else />
									</template>
								</game-loop>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div class="reckon-time">
				<div class="reckon-title">{{ $t('game.drawingTime') + ':' + lottery.issue }}</div>
				<div class="time-bar">
					<div class="time-num">
						<downTime :value="lottery.countDown[0]" />
						<span>:</span>
						<downTime :value="lottery.countDown[1]" />
						<span>:</span>
						<downTime :value="lottery.countDown[2]" />
						<!-- <div class="num-item">{{ lottery.countDown[2] }}</div> -->
					</div>
					<div class="bar">
						<div class="bar-active"
							:style="{ width: `${(lottery.countDown[3] / (lottery.play.item.lotteryInterval / 1000)) * 100}%` }">
						</div>
					</div>
				</div>
			</div>
			<!-- 功能控制 -->
			<div class="category" v-scroll>
				<div v-for="item in conf.operation.list" :key="item.value" @click="conf.operation.change(item)">
					<span :class="{ 'category-active': item.value === conf.operation.active }">{{ item.label }}</span>
				</div>
			</div>
		</div>
		<!-- 内容区 -->
		<div class="col" style="overflow: auto;" :class="{ 'active-bg': conf.operation.active === 'betting' }">
			<!-- 下注区和处理下注 -->
			<betting @changeBet="conf.betting.popup.open" v-if="conf.operation.active === 'betting'" />
			<result ref="resultRefs" v-if="conf.operation.active === 'result'" :lotteryId="lottery.play.item.id" />
			<analyze ref="resultRefs" v-if="conf.operation.active === 'analyze'" :lotteryId="lottery.play.item.id" />
			<rule ref="orderRefs" v-if="conf.operation.active === 'rule'" :list="lottery.play.item.lotteryRuleurl" />
			<order ref="orderRefs" v-if="conf.operation.active === 'myOrder'" :lotteryId="lottery.play.item.id"
				:oddsArr="conf.betting.oddsArr" />
		</div>
		<!-- 下注弹窗内容 -->
		<template #bet>
			<img v-if="conf.betting.type == 1" class="bet-img" :src="`/static/img/${conf.betting.item.imgUrl}.webp`" />

			<div class="bet-type-item" v-else-if="conf.betting.type == 2">
				<img class="bet-img" src="/static/img/poinits.webp" />
				<div class="bet-num">{{ conf.betting.item.imgUrl }}</div>
			</div>
			<img v-else-if="conf.betting.type == 3" class="bet-img"
				:src="`static/img/share-${conf.betting.item.imgUrl}.webp`" />
			<div class="bet-type-dice" v-else>
				<img class="bet-dice-img" :src="`static/img/share-${conf.betting.item.imgUrl}.webp`"
					v-if="conf.betting.type == 5" />
				<div class="bet-dice-bottom">
					<img class="bet-dice-img" :src="`static/img/share-${conf.betting.item.imgUrl}.webp`" />
					<img class="bet-dice-img" :src="`static/img/share-${conf.betting.item.imgUrl}.webp`" />
				</div>
			</div>
		</template>
		<time-popup @close="conf.loop.timePopupShop = false" v-if="conf.loop.timePopupShop"></time-popup>
		<div v-if="conf.betting.isWinBet">
			<div class="popup-mask"></div>
			<div class="tips-popup" @click="conf.betting.isWinBet = false">
				<div class="bet-win">
					<div class="win-title">{{ $t('game.winBet') }}</div>
					<div class="win-content">
						<div class="win-item">{{ $t('game.expect') }}：{{ lottery.current.openExpect }}</div>
						<div class="win-item">{{ $t('game.amount') }}：{{ conf.betting.money }}</div>
						<div class="win-item">{{ $t('game.start') }}：{{ sutil.getTimeFormat(lottery.current.startTime)
							}}
						</div>
						<div class="win-item">{{ $t('game.open') }}：{{ sutil.getTimeFormat(lottery.current.openTime) }}
						</div>
					</div>
				</div>
			</div>
		</div>
	</GameLayout>
</template>

<script setup lang="ts">
import GameLayout from '../components/gameLayout-blue.vue'
import betting from './com/betting-blue.vue';
import result from './com/result-blue.vue';
import rule from '../components/gameRule.vue';
import order from './com/order.vue';
import analyze from './com/analyze.vue';
import timePopup from '../components/timePopup.vue';
import gameLoop from '../components/gameLoop.vue';
import downTime from '../components/aniDownTime.vue';
import sutil from '@/sstore/sutil';
import { index } from './3D';

const { conf, lottery, resultRefs, analyzeRefs, orderRefs } = index()
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


.time-box {
	height: 100rem;
	margin-top: 5rem;
	padding: 5rem 10rem 0rem;

	.time-outer {
		padding: 10rem 12rem;
		background: linear-gradient(89.96deg, #A4CAFF 0.49%, #77AAFF 99.97%);
		height: 100%;
		border-radius: 20rem;

		.time-content {
			height: 100%;
			background: linear-gradient(89.96deg, #A4CAFF 0.49%, #77AAFF 99.97%);
			border-radius: 20rem;
			display: flex;
			align-items: center;
			justify-content: space-between;

			.time-img {
				height: 8rem;
				width: 80rem;
			}

			span {
				background: linear-gradient(112.71deg, #296AED 4.28%, #0A45CF 67.56%);
				-webkit-background-clip: text;
				-webkit-text-fill-color: transparent;
				background-clip: text;
				font-size: 40rem;
				font-weight: 600;
			}
		}
	}
}

.incline {
	height: 28rem;
	width: 100%;

	.incline-img {
		width: 100%;
		height: 28rem;
	}
}

.time-nav {
	padding: 20rem 24rem;
	// background: linear-gradient(93deg, #F7DFB1 1.89%, #F7E0AE 98.59%);

	.time-list {
		display: flex;
		height: 96rem;

		.time-item {
			background: #FFF;
			box-shadow: 4rem 4rem 8rem 0rem rgba(0, 0, 0, 0.10), -8rem -8rem 8rem 0rem rgba(255, 255, 255, 0.20);
			border-radius: 8rem;
			font-size: 40rem;
			color: #252529;
			font-weight: 700;
			display: flex;
			align-items: center;
			justify-content: center;
			// flex: 1;
			width: 23.8%;
			margin-left: 1.2%;
			flex-shrink: 0;

			.word {
				font-size: 24rem;
				color: #5f6975;
				margin-left: 16rem;
			}

			&.time-active {
				border-top: 0.8vw solid #296AED;
				background: #E6F2FF;
			}
		}
	}
}

.share-box {
	padding: 0rem 32rem;

	.share-title {
		margin-bottom: 24rem;
		color: #45454d;
		font-weight: 700;
		font-size: 28rem;
	}

	.share-list {
		display: flex;
		justify-content: space-between;

		.share-item {
			.item-title {
				margin-bottom: 8rem;
				color: #5f6975;
				font-weight: 700;
				font-size: 20rem;
			}

			.item-random {
				display: flex;
				// background: #b0aea0;
				background: rgba(00, 00, 00, 0.2);
				border-radius: 16rem;
				// box-shadow: 0rem 8rem 8rem 0rem #000 inset;
				padding: 10rem;
				display: flex;
				align-items: center;
				justify-content: center;

				.adbanner {
					width: 74rem;
					height: 74rem;
				}

				.random-img {
					width: 100%;
					height: 100%;
				}

				.total-swiper {
					width: 100%;
					height: 100%;
					position: relative;

					.total-img {
						width: 100%;
						height: 100%;
					}

					.total-point {
						position: absolute;
						top: 0rem;
						bottom: 0rem;
						width: 100%;
						display: flex;
						justify-content: center;
						align-items: center;
						font-size: 36rem;
						color: #2c2e36;
						font-weight: 900;
					}
				}
			}
		}

		.divider-h {
			width: 2rem;
			background: rgba(00, 00, 00, 0.1);
		}
	}
}

.reckon-time {
	padding: 20rem 32rem;
	// border-top: 2rem solid var(--line, #d8e0ea);
	// background: #edeff5;
	// background: linear-gradient(93deg, #F7DFB1 1.89%, #F7E0AE 98.59%);

	.reckon-title {
		word-break: break-all;
		color: #45454d;
		font-weight: 700;
		font-size: 28rem;
	}

	.time-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 24rem;

		.time-num {
			display: flex;
			align-items: center;
			font-size: 44rem;

			.num-item {
				width: 56rem;
				height: 56rem;
				background: #000;
				color: #FFF;
				border-radius: 8rem;
				display: flex;
				justify-content: center;
				align-items: center;
			}

			span {
				color: #45454d;
				font-weight: 700;
				margin: 0rem 4rem;
			}
		}

		.bar {
			flex: 1;
			height: 16rem;
			background: #B6B9C4;
			border-radius: 8rem;
			overflow: hidden;
			margin-left: 50rem;

			.bar-active {
				height: 100%;
				background: linear-gradient(112.71deg, #296AED 4.28%, #0A45CF 67.56%);
			}
		}
	}
}

.category {
	height: 72rem;
	padding: 0rem 20rem 20rem;
	display: flex;
	justify-content: space-between;
	align-items: center;

	div {
		font-size: 28rem;
		font-weight: 500;
		color: #45454d;
		flex: 1;
		display: flex;
		justify-content: center;
		align-items: center;
		flex-shrink: 0;
	}

	.category-active {
		position: relative;
		height: 100%;
		color: #252529;
		font-weight: 500;
		color: black;
		line-height: 72rem;
		display: inline-block;
	}

	.category-active::after {
		position: absolute;
		content: '';
		width: 50%;
		height: 8rem;
		background: linear-gradient(112.71deg, #296AED 4.28%, #0A45CF 67.56%);
		bottom: 5rem;
		left: 25%;

	}
}

.popup-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.3);
}

.tips-popup {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 998;

	.bet-win {
		width: 600rem;
		height: 152rem;
		border-radius: 20rem;
		background: #FFF;
		box-shadow: 20rem 20rem 40rem 0rem rgba(255, 255, 255, 0.25), -20rem -20rem 40rem 0rem rgba(255, 255, 255, 0.25);
		color: #000;
		font-weight: 500;
		font-size: 40rem;
		overflow: hidden;
		animation: colorBtn 1s forwards;

		.win-title {
			height: 152rem;
			display: flex;
			align-items: center;
			justify-content: center;

		}

		.win-content {
			font-size: 30rem;
			padding-left: 40rem;

			.win-item {
				margin-bottom: 8rem;
			}
		}
	}

	@keyframes colorBtn {
		0% {
			height: 152rem;
		}

		100% {
			height: 372rem;
		}
	}
}

.center-box {
	background: linear-gradient(116.01deg, #C0DCFF 9.5%, #68A2FF 100.92%) !important;
	height: auto !important;
}
.bet-type-item {
	position: relative;

	.bet-num {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 62rem;
		color: #2c2e36;
		font-weight: 900;
	}
}

.bet-img {
	height: 125rem;
}
.bet-type-dice {
	display: flex;
	flex-direction: column;
	align-items: center;

	.bet-dice-img {
		height: 60rem;
	}
}
</style>
