<template>
	<x-page :noFooter="true" :fixed="false" :headerBgColor="stheme.theme.blue.headerBgColor()">
		<template #title>
			<div v-if="(conf.timeIndex / 1000 / 60) >= 1">
				{{ $t('game.dice') }}-{{ conf.timeIndex / 1000 / 60 || '' }}
				{{ (conf.timeIndex / 1000 / 60) > 1 ? $t('game.minutes') : $t('game.minute') }}
			</div>
			<div v-else>{{ $t('game.dice') }}-{{ conf.timeIndex / 1000 || '' }} {{
				$t('game.second')
			}}
			</div>
		</template>
		<template #right>
			<div class="right-content">
				<div class="right-text">{{ $t('wallet.balance') }}</div>
				<div class="right-icon">{{ conf.walletMoney }}</div>
			</div>
			<img class="wallet-img" src="/static/img/wallet.webp" />
		</template>
		<template #top>
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
                        <div class="time-list" v-if="conf.lotteryVOList.length">
                            <div v-for="(item, index) in conf.lotteryVOList" :key="index" class="time-item"
                                :class="{ 'time-active': conf.timeIndex == item.lotteryInterval }"
                                @click="conf.changeTime(item, index)">
                                <div v-if="(item.lotteryInterval / 1000 / 60) >= 1">
                                    {{ item.lotteryInterval / 1000 / 60 }}<span class="word">{{ (item.lotteryInterval /
                                        1000 / 60)
                                        > 1 ? $t('game.minutes') : $t('game.minute') || '' }}</span>
                                </div>
                                <div v-else>
                                    {{ item.lotteryInterval / 1000 }}<span class="word">{{ $t('game.second') }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="share-box">
                    <div class="share-title">{{ $t('game.resultFor') }}：{{ conf.LastExpect }}</div>
                    <div class="share-list">
                        <div class="share-item">
                            <div class="item-title">{{ $t('game.resultBig') }}</div>
                            <div class="item-random">
                                <div class="adbanner">
                                    <game-loop :swipeList="conf.shareList" :target-swipe="conf.share1"
                                        :autoplay="conf.autoplay">
                                        <template v-slot="{ item }">
                                            <img style="width: 100%;height: 100%;" :src="item.src" />
                                        </template>
                                    </game-loop>
                                </div>
                                <div class="adbanner">
                                    <game-loop :swipeList="conf.shareList" :target-swipe="conf.share2"
                                        :autoplay="conf.autoplay">
                                        <template v-slot="{ item }">
                                            <img style="width: 100%;height: 100%;" :src="item.src" />
                                        </template>
                                    </game-loop>
                                </div>
                                <div class="adbanner">
                                    <game-loop :swipeList="conf.shareList" :target-swipe="conf.share3"
                                        :autoplay="conf.autoplay">
                                        <template v-slot="{ item }">
                                            <img style="width: 100%;height: 100%;" :src="item.src" />
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
                                    <game-loop :swipeList="conf.poinits" :target-swipe="conf.total"
                                        :autoplay="conf.autoplay">
                                        <template v-slot="{ item }">
                                            <div class="total-swiper">
                                                <img class="total-img" src="/static/img/poinits.webp" />
                                                <div class="total-point">{{ item.num }}</div>
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
                                    <game-loop :swipeList="conf.drawList" :target-swipe="conf.sizeNum"
                                        :autoplay="conf.autoplay">
                                        <template v-slot="{ item }">
                                            <div class="random"
                                                style="display: flex;justify-content: center;align-items: center;font-size: 48rem;width: 100%;height: 100%;"
                                                v-if="item.content == '-'">-</div>
                                            <img style="width: 100%;height: 100%;" :src="item.src1" v-else />
                                        </template>
                                    </game-loop>
                                </div>
                                <div class="adbanner">
                                    <game-loop :swipeList="conf.drawList" :target-swipe="conf.doubleNum"
                                        :autoplay="conf.autoplay">
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
                    <div class="reckon-title">{{ $t('game.drawingTime') }}：{{ conf.currentOpen.openExpect }}</div>
                    <div class="time-bar">
                        <div class="time-num">
                            <div class="num-item">{{ conf.hour }}</div>
                            <span>:</span>
                            <div class="num-item">{{ conf.minutes }}</div>
                            <span>:</span>
                            <div class="num-item">{{ conf.second }}</div>
                        </div>
                        <div class="bar">
                            <div class="bar-active" :style="{ 'width': conf.bar + '%' }"></div>
                        </div>
                    </div>
                </div>
                <div class="category">
                    <div @click="conf.changeStatus(1)"><span :class="{ 'category-active': conf.categoryIndex == 1 }">{{
                        $t('game.betting') }}</span></div>
                    <div @click="conf.changeStatus(2)"><span :class="{ 'category-active': conf.categoryIndex == 2 }">{{
                        $t('game.result') }}</span></div>
                    <div @click="conf.changeStatus(3)"><span :class="{ 'category-active': conf.categoryIndex == 3 }">{{
                        $t('game.analyze') }}</span></div>
                    <div @click="conf.changeStatus(4)"><span :class="{ 'category-active': conf.categoryIndex == 4 }">{{
                        $t('game.rule') }}</span></div>
                    <div @click="conf.changeStatus(5)"><span :class="{ 'category-active': conf.categoryIndex == 5 }">{{
                        $t('game.myOrder') }}</span></div>
                </div>
            </div>
		</template>
		<div style="width: 100%;height: 100%;background: #f5f5fa;">
			<betting v-if="conf.categoryIndex == 1" :poinits="conf.poinits" :shareList="conf.shareList"
				:timeClose="conf.timeClose" :oddsArr="conf.oddsArr" @closeBet="conf.closeBet"
				@changeBet="conf.changeBet">
			</betting>
			<result v-if="conf.categoryIndex == 2" :lotteryId="conf.lotteryId" ref="resultRefs"></result>
			<analyze v-if="conf.categoryIndex == 3" :lotteryId="conf.lotteryId" ref="analyzeRefs"></analyze>
			<rule v-if="conf.categoryIndex == 4" :list="conf.lotteryRuleurl"></rule>
			<order v-if="conf.categoryIndex == 5" :lotteryId="conf.lotteryId" ref="orderRefs" :oddsArr="conf.oddsArr">
			</order>
		</div>
		<time-popup @close="conf.timePopupShop = false" v-if="conf.timePopupShop"></time-popup>
		<bet-popup :betShow="conf.showBet" :betObj="conf.addsItem" @submit="conf.submit" @share="conf.share"
			:betShare="conf.shareOpen" :isBetBtnClick="conf.isBetBtnClick"></bet-popup>
		<div v-if="conf.isWinBet">
			<div class="popup-mask"></div>
			<div class="tips-popup" @click="conf.closeWinBet">
				<div class="bet-win">
					<div class="win-title">{{ $t('game.winBet') }}</div>
					<div class="win-content">
						<div class="win-item">{{ $t('game.expect') }}：{{ conf.currentOpen.openExpect }}</div>
						<div class="win-item">{{ $t('game.amount') }}：{{ conf.money }}</div>
						<div class="win-item">{{ $t('game.start') }}：{{ sutil.getTimeFormat(conf.currentOpen.startTime)
							}}
						</div>
						<div class="win-item">{{ $t('game.open') }}：{{ sutil.getTimeFormat(conf.currentOpen.openTime) }}
						</div>
					</div>
				</div>
			</div>
		</div>
	</x-page>
</template>

<script setup lang="ts">
import betting from './betting-blue.vue';
import result from './result-blue.vue';
import rule from '../components/gameRule.vue';
import order from './order.vue';
import analyze from './analyze.vue';
import betPopup from '../components/betPopup-blue.vue';
import timePopup from '../components/timePopup.vue';
import gameLoop from '../components/gameLoop.vue';
import sutil from '@/sstore/sutil';
import { index } from './ts/3D';
import stheme from '@/sstore/stheme'

const conf = index()
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
			box-shadow: 2px 2px 4px 0px rgba(0, 0, 0, 0.10), -4px -4px 4px 0px rgba(255, 255, 255, 0.20);
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
				// box-shadow: 0px 8rem 8rem 0px #000 inset;
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
	// border-top: 1px solid var(--line, #d8e0ea);
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

.center-box{
	background: linear-gradient(116.01deg, #C0DCFF 9.5%, #68A2FF 100.92%) !important;
	height: auto !important;
}
</style>