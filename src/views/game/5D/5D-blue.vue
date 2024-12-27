<template>
	<gameBox ref="gameBoxRefs" :list="conf.play.list" :active="conf.play.active"
		:betShare="conf.countdownDialogTime <= 20" @change="conf.play.choose" @close="conf.bet.closeFun"
		:selectBetInfo="conf.selectBetInfoArr" :gameType="'5D'" :currentOpenInfo="conf.currentOpenInfo"
		:openLockCountdown="conf.openLockCountdown">
		<!-- 下注弹框自定义显示列表 -->
		<template v-slot:bet>
			<div class="row items-center">
				<div class="select-bet-type">{{ conf.selectBetType }}</div>
				<template v-for="item in conf.betTypeArr" :key="item">
					<div class="bet-type flex-center" :class="[`num_${item}`]">{{ item }}</div>
				</template>
				<template v-for="(item, itemIndex) in conf.selectBetInfoArr" :key="itemIndex">
					<div class="flex-center-num" v-if="item.type == 'num'">
						<img src="/static/img/poinits.webp" />
						<span>{{ item.number }}</span>
					</div>
					<div class="bet-number flex-center" :class="['num_' + item.color]" v-else>{{ item.number }}
					</div>
				</template>
			</div>
		</template>
		<!-- 开奖结果 -->
		<div class="game-result">
			<div class="result-top">
				<div class="txt-grey">{{ $t('game.resultBig') }}</div>
				<div class="round-num" v-for="(item, index) in conf.resultInfoObj.numArr">
					<div class="fade-item">
						<img src="/static/img/poinits.webp" class="point-img" />
						<!-- 已开奖 -->
						<span v-if="!conf.isNoOpenCode">{{ item.value }}</span>
						<!-- 未开奖 -->
						<span v-else>{{ conf.openCodeAllData[conf.scollIndex + index] || index }}</span>
					</div>
					<div class="word-index">{{ item.key }}</div>
				</div>
				<div>=</div>
				<div class="round-num">
					<!-- 已开奖 -->
					<div class="fade-item fage-active" :class="conf.resultInfoObj.sum > 22 ? 'num_blue' : 'num_yellow'"
						v-if="!conf.isNoOpenCode">
						{{ conf.resultInfoObj.sum }}</div>
					<!-- 未开奖 -->
					<div class="fade-item fage-active" :class="conf.resultInfoObj.sum > 22 ? 'num_blue' : 'num_yellow'"
						v-else>
						{{ conf.scollSum }}</div>
				</div>
			</div>
			<!-- 开奖倒计时 -->
			<div class="result-number">
				<div class="txt-grey flex-bw">
					<span>{{ $t('game.drawID') }}</span>
					<span>{{ $t('winGo.TimeRemaining') }}</span>
				</div>
				<div class="flex-bw num-time">
					<div class="number">{{ conf.currentOpenInfo.openExpect }}</div>
					<div class="down-time">
						<div class="time-item flex-center red-bg">{{ conf.minutes[0] }}</div>
						<div class="time-item flex-center red-bg">{{ conf.minutes[1] }}</div>
						<div class="division">:</div>
						<div class="time-item flex-center red-bg">{{ conf.second[0] }}</div>
						<div class="time-item flex-center red-bg">{{ conf.second[1] }}</div>
					</div>
				</div>
			</div>
		</div>
		<div class="bet-select-box">
			<!-- 下注类型 -->
			<div class="bet-type-list">
				<template v-for="(item, index) in conf.selectBetList" :key="index">
					<div class="d5-bet-type flex-center" :class="{ 'type-active': item == conf.selectBetType }"
						@click="conf.handleSelectBetType(item, index)">{{ item }}</div>
				</template>
			</div>
			<!-- 下注按钮 -->
			<div class="d5-bet-content">
				<div class="flex-bw">
					<template v-for="(item, index) in conf.betTypeOdds" :key="item.name">
						<div class="bet-type-btn flex-bw" :class="['num_' + item.color]"
							@click="conf.handleSelectBet(item)">
							<span>{{ item.number }}</span>
							<span>{{ item.odds }}</span>
						</div>
					</template>
				</div>
				<!-- 下注数字 -->
				<div class="d5-bet-num">
					<template v-for="(item, itemIndex) in conf.betNumberOdds" :key="itemIndex">
						<div class="bet-num-item" v-if="conf.selectBetType != 'SUM'"
							:class="{ 'active_number': conf.betNumArr.includes(item.number) }">
							<div class="num-box flex-center" @click="conf.handleSelectBet(item)">
								<img src="/static/img/poinits.webp" />
								<span>{{ item.number }}</span>
							</div>
							<div class="onum-dds">{{ item.odds }}</div>
						</div>
					</template>
				</div>
			</div>
			<div class="big-time" v-if="conf.bigDownShow && conf.countdownDialogTime <= conf.openLockCountdown">
				<div class="big-down-time">
					<div class="big-time-item flex-center red-bg">{{ conf.second[0] }}</div>
					<div class="big-time-item flex-center red-bg">{{ conf.second[1] }}</div>
				</div>
			</div>
		</div>
		<!-- 历史结果记录 -->
		<div class="d5-list">
			<div class="d5-list-type flex-bw">
				<div class="type-item flex-center" :class="{ 'type-active': conf.tabType == 1 }"
					@click="conf.handleSelctTabChange(1, null)">{{ $t('game.resultHistory') }}</div>
				<div class="type-item flex-center" :class="{ 'type-active': conf.tabType == 2 }"
					@click="conf.handleSelctTabChange(2, null)">{{ $t('winGo.Chart') }}</div>
				<div class="type-item flex-center" :class="{ 'type-active': conf.tabType == 4 }"
					@click="conf.handleSelctTabChange(4, null)">{{ $t('game.rule') }}</div>
				<div class="type-item flex-center" :class="{ 'type-active': conf.tabType == 3 }"
					@click="conf.handleSelctTabChange(3, null)">{{ $t('game.myOrder') }}</div>
			</div>
			<result v-if="conf.tabType == 1" :resultList="conf.resultList"></result>
			<chat v-else-if="conf.tabType == 2" :chartDataList="conf.chartDataList"
				:selectBetIndex="conf.selectBetIndex">
			</chat>
			<order v-if="conf.tabType == 3" :orderDataList="conf.orderDataList" :isClickPage="conf.isClickPage"
				@handleClickOrderPage="conf.handleClickOrderPage"></order>
			<rule v-if="conf.tabType == 4" :list="conf.lotteryRuleurl"></rule>
		</div>
		<!-- 分页工具 -->
		<cpage :pageInfo="conf.pageObj" style="margin-top: 30rem"
			v-if="(conf.tabType == 1 || (conf.tabType == 2 && conf.selectBetIndex != 5)) ? conf.resultList.length > 0 : conf.tabType == 3 ? conf.orderDataList.length > 0 : ''"
			@handlePageChange="conf.handlePageChange" />

		<game-loading v-if="conf.loading" />
	</gameBox>
</template>
<script setup lang="ts">
import gameBox from '../components/gameBox-blue.vue'
import gameLoading from "../components/gameLoading.vue"
import cpage from '../components/gamePage-blue.vue'
import rule from "../components/gameRule.vue"
import result from './result-blue.vue'
import chat from './chat-blue.vue'
import order from './order.vue'
import { index } from './ts/5D'

const {conf,gameBoxRefs} = index()
</script>

<style lang="less" scoped>
page {
	background: #f5f0f0;
	margin: 0 auto;
}

.select-bet-type {
	margin: 0 12rem 0 8rem;
	color: #0074ff;
	font-size: 20px;
}

.bet-type {
	padding: 10rem 19rem;
	color: #fff;
	border-radius: 6rem;
	margin-left: 0.13333rem;
	font-size: 25rem;
	margin: 0 4rem;
}

.bet-number {
	margin: 0 4rem;
	width: auto;
	height: auto;
	border-radius: 10rem;
	padding: 6rem 10rem;
	color: #ffffff;
	background: -webkit-linear-gradient(to left, #F6843F, #FEA14D);
	background: linear-gradient(90deg, #F6843F, #FEA14D);
}

.select-info-name {
	color: #0074ff;
	font-size: 40rem;
}

.txt-grey {
	font-size: 30rem;
	font-weight: 400;
	color: #8e8e93;
}

.red-bg {
	border: none;
	color: #fff;
	background: linear-gradient(#336cff 0%, #336cfffc 51%, rgba(255, 166, 79, 0) 100%);
}

.flex-center {
	display: flex;
	align-items: center;
	justify-content: center;
}

.flex-bw {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.game-result {
	background: #fff;
	border-radius: 20rem;
	position: relative;
	padding: 20rem;
	margin-bottom: .32rem;

	.result-top {
		text-align: center;
		padding: 0 0 60rem;
		border-bottom: 2rem solid #f1f3fb;
		display: flex;
		justify-content: space-between;
		align-items: center;

		.round-num {
			position: relative;
		}

		.fade-item {
			width: 70rem;
			height: 70rem;
			display: flex;
			justify-content: center;
			align-items: center;
			position: relative;

			.point-img {
				width: 72rem;
				height: 72rem;
			}

			span {
				position: absolute;
				top: 0;
				bottom: 8rem;
				width: 100%;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 36rem;
				color: #2c2e36;
				font-weight: 900;
			}
		}

		.fage-active {
			// background: #F6843F;
			border-radius: 50%;
			font-size: 36rem;
			color: #fff;
			font-weight: 900;
		}

		.word-index {
			position: absolute;
			bottom: -40rem;
			left: 26rem;
			margin-top: 10rem;
			font-size: 30rem;
			color: #9da7b3;
			font-weight: 400;
		}
	}

	.result-number {
		padding-top: 20rem;

		.num-time {
			margin-top: 20rem;
		}

		.number {
			font-size: 32rem;
			display: grid;
			grid-auto-flow: column;
			gap: 8px;
		}

		.down-time {
			display: flex;
			align-items: center;

			.time-item {
				width: 52rem;
				height: 72rem;
				font-weight: 600;
				font-size: 58rem;
				margin-left: 10rem;
				border-radius: 10rem;
			}

			.division {
				margin-left: 10rem;
				background: linear-gradient(#336cff 0%, #336cfffc 51%, rgba(255, 166, 79, 0) 100%);
				-webkit-background-clip: text;
				background-clip: text;
				color: transparent;
				font-size: 52rem;
			}
		}
	}
}

.inner {
	margin: 20rem 0rem;
}

.slot-inner {
	width: 300px;
	padding: 15rem;
	background: #F6843F;
	display: flex;
	border-radius: 0.18667rem;
	position: relative;
	margin: 0.26667rem auto 0;

	.dataNums {
		width: 100%;

		.inrow {
			width: 100%;
			padding: 5px;
			background: #FEA14D;
			border-radius: 2px;
			display: flex;

			.dataOne {
				// width: 100%; 
				flex: 1;
				height: 65px;
				margin-right: 6px;
				text-align: center;
				background: #333;
				color: rgba(0, 0, 0, .4);
				border-radius: 0.10667rem;
				padding: 3px;

				.dataBoc {
					background: #e1e1ec;
					border-radius: 50%;
					color: rgba(0, 0, 0, .4);
					width: 100%;
					aspect-ratio: 1;
					font-size: 28px;

					&.dataBoc-active {
						background: #F6843F;
						color: #ffffff;
					}
				}

				&:last-of-type {
					margin-right: 0px;
				}
			}
		}
	}
}

.slot-inner:after,
.slot-inner:before {
	position: absolute;
	top: calc(50% - 26rem);
	width: 12rem;
	height: 55rem;
	content: "";
	background: #FEA14D;
}

.slot-inner:before {
	left: -12rem;
	border-radius: 10rem 0 0 10rem;
}

.slot-inner:after {
	right: -12rem;
	border-radius: 0 10rem 10rem 0;
}

.dataNums:after,
.dataNums:before {
	position: absolute;
	top: calc(50% - 7px);
	width: 0;
	height: 0;
	border-top: 6px solid transparent;
	border-bottom: 6px solid transparent;
	content: "";
	z-index: 3;
}

.dataNums:before {
	left: 12px;
	border-right: 19px solid transparent;
	border-left: 19px solid #FEA14D;
}

.dataNums:after {
	right: 12px;
	border-left: 19px solid transparent;
	border-right: 19px solid #FEA14D;
}

.bet-select-box {
	position: relative;
}

.bet-type-list {
	display: flex;
	justify-content: flex-start;
	border-bottom: 2rem solid #c7c7cc;
	margin-bottom: 1rem;
	overflow: hidden;
	margin-top: 16rem;

	.d5-bet-type {
		width: 74rem;
		height: 74rem;
		background: #ceced8;
		font-size: 30rem;
		font-weight: 700;
		color: #fff;
		border-radius: 37rem 37rem 0 0;
		position: relative;
		margin-right: 10rem;
		text-align: center;
		cursor: pointer;

		&::after {
			background: radial-gradient(circle at 100% 0, rgba(204, 0, 0, 0) 0.26667rem, #ceced8 0.29333rem);
			right: -9rem;
		}

		&.type-active {
			background: linear-gradient(93.51deg, #006FFF 5.72%, #087BFF 86.61%);

			&::after {
				background: radial-gradient(circle at 100% 0, rgba(204, 0, 0, 0) 0.26667rem, #FEA14D 0.29333rem);
				right: -9rem;
			}
		}
	}

	.d5-bet-type:after,
	.d5-bet-type:before {
		content: "";
		width: 10rem;
		height: 10rem;
		position: absolute;
		bottom: -12rem;
		z-index: 9;
	}
}

.d5-bet-content {
	margin: 20rem 0rem;
	height: 360rem;
}

.bet-type-btn {
	width: 23%;
	height: 64rem;
	background: #d1d1d6;
	border-radius: 10rem;
	color: #fff;
	padding: 0 14rem;
	cursor: pointer;
}

.num_Big {
	background: linear-gradient(90deg, #FD0261 0%, #FF8A96 100%);
	box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.15);
}

.num_Small {
	background: linear-gradient(90deg, #00BDFF 0%, #5BCDFF 100%);
	box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.15);
}

.num_Odd {
	background: linear-gradient(90deg, #00BE50 0%, #9BDF00 100%);
	box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.15);
}

.num_Even {
	background: linear-gradient(90deg, #FF9000 0%, #FFD000 100%);
	box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.15);
}

.d5-bet-num {
	display: flex;
	flex-wrap: wrap;
	margin: 20rem 0rem;

	.bet-num-item {
		width: 20%;
		display: flex;
		justify-content: center;
		align-items: center;
		flex-direction: column;
		padding: 20rem 0rem;
		// margin-bottom: 20rem;

		.num-box {
			position: relative;

			img {
				width: 72rem;
				height: 72rem;
			}

			span {
				position: absolute;
				top: 0;
				bottom: 8rem;
				width: 100%;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 36rem;
				color: #2c2e36;
				font-weight: 900;
			}

			&.active {
				color: #ffffff;
				background: -webkit-linear-gradient(left, #F6843F, #FEA14D);
				background: linear-gradient(90deg, #F6843F, #FEA14D);
			}
		}

		.onum-dds {
			color: #6b7581;
			margin-top: 5rem;
			font-size: 28rem;
		}
	}
}

.big-time {
	position: absolute;
	left: 0;
	// top: 0;
	top: 74rem;
	;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, .6);
	z-index: 9;

	.big-down-time {
		display: flex;
		justify-content: center;
		margin-top: 65rem;

		.big-time-item {
			width: 160rem;
			height: 250rem;
			font-weight: 600;
			font-size: 200rem;
			border-radius: 10rem;

			&:first-of-type {
				margin-right: 20rem;
			}
		}
	}
}

.d5-list {
	padding: 20rem 0rem;

	.d5-list-type {
		.type-item {
			width: 23.3%;
			background-color: #DDDDDD;
			border-radius: 14rem 14rem 0 0;
			color: rgba(92, 97, 109, .8);
			font-size: 26rem;
			height: 64rem;

			&.type-active {
				color: #ffffff;
                background: linear-gradient(93.51deg, #006FFF 5.72%, #087BFF 86.61%);
			}
		}

	}
}

.page-box {
	display: flex;
	justify-content: center;
	align-items: center;
	margin-top: 15rem;
	padding-bottom: 40rem;

	.page-arrow {
		width: 74rem;
		height: 74rem;
		background: #dedede;
		border-radius: 10rem;
		cursor: pointer;

		img {
			width: 22rem;
			height: 38rem;
		}

		.next-img {
			transform: rotate(180deg);
		}

		&.page-active {
			background: linear-gradient(90deg, #F6843F, #FEA14D);
		}
	}

	.page-num {
		color: #404653;
		width: 182rem;
		text-align: center;
	}
}

.colum,
.flex,
.row {
	display: flex;
	flex-wrap: wrap;
}

.num_green {
	background: linear-gradient(90deg, #00be50 0%, #9bdf00 100%);
	box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.15);
}

.num_red {
	background: linear-gradient(90deg, #fd0261 0%, #ff8a96 100%);
	box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.15);
}

.num_blue {
	background: linear-gradient(90deg, #00bdff 0%, #5bcdff 100%);
	box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.15);
}

.num_yellow {
	background: linear-gradient(90deg, #ff9000 0%, #ffd000 100%);
	box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.15);
}

.active_number {
	border: 2rem solid #087BFF;
	background: #E6F2FF;
	color: #FEC748 !important;
	border-radius: 16rem;
	padding: 18rem 0rem !important;
}

.flex-center-num {
	position: relative;

	img {
		width: 52rem;
		height: 52rem;
	}

	span {
		position: absolute;
		top: 0;
		bottom: 8rem;
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 30rem;
		color: #2c2e36;
		font-weight: 900;
	}
}
</style>