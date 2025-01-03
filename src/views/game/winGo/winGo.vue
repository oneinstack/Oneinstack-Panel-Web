<template>
	<gameBox ref="gameBoxRefs" :list="conf.play.list" :active="conf.play.active" @change="conf.play.choose"
		@close="conf.bet.closeFun" :selectBetInfo="conf.selectBetInfoArr" :gameType="'Trx'"
		:currentOpenInfo="conf.currentOpenInfo" :openLockCountdown="conf.openLockCountdown"
		:betShare="conf.countdownDialogTime <= 20">
		<!-- 下注弹框自定义显示列表 -->
		<template v-slot:bet>
			<div class="row items-center">
				<div class="col row items-center">
					<template v-for="item in conf.bet.listNum">
						<div v-if="item.type == 'num'" class="row flex-center " :class="['qkball_' + item.color]"
							style="height: 58rem; width: 58rem">
							<span class="txt">{{ item.label }}</span>
						</div>
						<div v-else class="row flex-center ct-bs" :class="['qkball_' + item.color]">
							<span class="txt">{{ item.label }}</span>
						</div>
					</template>
				</div>
			</div>
		</template>

		<!-- 开奖结果 -->
		<div class="open-bet-box">
			<div class="open-number-list">
				<template v-for="(item, itemIndex) in conf.drawLotteryResult">
					<div class="result-item">
						<img class="number-item-img" src="/static/img/game/twgo/openCodeImg.webp" />
						<!-- 未开奖 -->
						<span class="result-text" v-if="conf.resuleIndex === null">{{
							conf.openCodeAllData[conf.scollIndex + itemIndex] || itemIndex }}</span>
						<!-- 已开奖 -->
						<span class="result-text" :class="itemIndex == conf.resuleIndex ? 'openCodeText' : ''" v-else>{{
							item }}</span>
					</div>
				</template>
			</div>
		</div>

		<!-- 期数信息、倒计时 -->
		<div class="time-box" style="margin: 6rem 0 30rem 0">
			<div class="row justify-between">
				<div>
					<div class="text">{{ $t('winGo.TrxWinGo') + ' ' }} {{ conf.selectPlayTypeName }}</div>
					<div class="number">{{ conf.currentOpenInfo.openExpect }}</div>
				</div>
				<div class="column items-end">
					<div style="margin-bottom: 14rem">{{ $t('winGo.TimeRemaining') }}</div>
					<ctime :times="conf.countdownArr" />
				</div>
			</div>
		</div>

		<!-- 下注选项 -->
		<div class="bet-box fit-width relative" style="padding: 20rem">
			<div class="row">
				<template v-for="item in conf.bet.listBSArr.slice(0, 3)">
					<div class="col bsitem-box"
						:class="[conf.bet.listNum.find((v: any) => v.oddsId == item.oddsId) ? 'active' : '']"
						@click="conf.bet.choose(item, 'listNum')">
						<div class="bsitem row justify-between items-center" :class="['num_' + item.color]">
							<div>{{ item.label }}</div>
							<div>{{ item.odds }}</div>
						</div>
					</div>
				</template>
			</div>
			<div class="row" style="margin-top: 8rem;display: flex;justify-content: space-between;">
				<template v-for="item in conf.bet.listNumArr">
					<div class="column flex-center ball-box"
						:class="[conf.bet.listNum.find((v: any) => v.oddsId == item.oddsId) ? 'active' : '']"
						style="width: 20%" @click="conf.bet.choose(item, 'listNum')">
						<div class="ball" :class="['qkball_' + item.color]">
							<span class="txt">{{ item.label }}</span>
						</div>
						<div style="line-height: 50rem">{{ item.odds }}</div>
					</div>
				</template>
			</div>
			<div class="row">
				<template v-for="item in conf.bet.listBSArr.slice(3)">
					<div class="col bsitem-box"
						:class="[conf.bet.listNum.find((v: any) => v.oddsId == item.oddsId) ? 'active' : '']"
						@click="conf.bet.choose(item, 'listNum')">
						<div class="bsitem row justify-between items-center" :class="['qkball_' + item.color]">
							<div>{{ item.label }}</div>
							<div>{{ item.odds }}</div>
						</div>
					</div>
				</template>
			</div>
			<!-- 倒计时弹窗 -->
			<big-time :seconds="conf.countdownDialogTime + ''"
				v-if="conf.bigDownShow && conf.countdownDialogTime <= conf.openLockCountdown"></big-time>
		</div>

		<!-- 历史结果记录 -->
		<div class="twgo-list">
			<div class="twgo-list-type flex-bw">
				<div class="type-item flex-center" :class="{ 'type-active': conf.tabType == 1 }"
					@click="conf.changeResultType(1, null)">
					{{ $t('game.resultHistory') }}</div>
				<div class="type-item flex-center" :class="{ 'type-active': conf.tabType == 2 }"
					@click="conf.changeResultType(2, null)">
					{{ $t('winGo.Chart') }}</div>
				<div class="type-item flex-center" :class="{ 'type-active': conf.tabType == 4 }"
					@click="conf.changeResultType(4, null)">
					{{ $t('game.rule') }}</div>
				<div class="type-item flex-center" :class="{ 'type-active': conf.tabType == 3 }"
					@click="conf.changeResultType(3, null)">
					{{ $t('game.myOrder') }}</div>

			</div>
			<result v-if="conf.tabType == 1" ref="resultRfes" :resultList="conf.resultList"></result>
			<chat v-if="conf.tabType == 2" :key="conf.comKey" :chartDataList="conf.chartDataList"></chat>
			<order v-if="conf.tabType == 3" :orderDataList="conf.orderDataList" :isClickPage="conf.isClickPage"
				@handleClickOrderPage="conf.handleClickOrderPage"></order>
			<rule v-if="conf.tabType == 4" :list="conf.lotteryRuleurl"></rule>
		</div>
		<!-- 分页工具 -->
		<cpage :pageInfo="conf.pageObj" style="margin-top: 30rem"
			v-if="(conf.tabType == 1 || conf.tabType == 2) ? conf.resultList.length > 0 : conf.tabType == 3 ? conf.orderDataList.length > 0 : ''"
			@handlePageChange="conf.handlePageChange" />
	</gameBox>
</template>
<script setup lang="ts">
import gameBox from '../components/gameBox.vue'
import cpage from '../components/gamePage.vue'
import rule from "../components/gameRule.vue"
import ctime from '../components/downTime.vue'
import result from "./result.vue"
import chat from "./chat.vue"
import bigTime from "../components/bigTime.vue"
import order from "./order.vue"
import { index } from "./ts/winGo"  
const {conf,gameBoxRefs} = index()
</script>

<style lang="less" scoped>
//自定义下注列表样式
.select-info-name {
	color: #0074ff;
	font-size: 40rem;
}

.ct-bs {
	height: 54rem;
	padding: 0 20rem;
	color: #fff;
	border-radius: 10rem;
	margin-left: 8rem;

	&:first-of-type {
		margin-left: 0rem;
	}
}

.open-bet-box {
	background-image: linear-gradient(#f1d2b0, #d3ac84);
	padding: 15rem;
	border-radius: 10rem;
	margin-bottom: 30rem;

	.open-number-list {
		padding: 10rem 10rem 14rem;
		background-color: #fff;
		border-radius: 10rem;
		display: flex;
		justify-content: space-between;

		.number-item-img {
			height: 120rem;
			width: 100rem;
		}

		.result-item {
			position: relative;

		}

		.result-text {
			position: absolute;
			top: 32rem;
			left: 34rem;
			font-size: 45rem;
			color: #FEC748;
		}

		.openCodeText {
			color: #fff !important;
		}
	}
}

// 倒计时样式
.time-box {
	width: 100%;
	height: 190rem;
	background: url(/static/img/game/pk10/diban.png) no-repeat;
	background-size: 100% 100%;
	padding: 42rem 36rem;
	color: #fff;

	.span {
		border: 1rem solid #fff;
		display: inline-block;
		font-size: 24rem;
		line-height: 38rem;
		color: #ffffff;
		border-radius: 10rem;
		margin-bottom: 14rem;
		padding: 0 16rem;
	}

	.number {
		font-size: 34rem;
		font-weight: 600;
	}
}

// 下注样式

.pl-tabs-item {
	display: flex;
	font-size: 24rem;
	justify-content: center;
	align-items: center;
	color: #697984;
	border-radius: 30rem;
	height: 60rem;
	padding: 0 20rem;
	border: 1px solid #d61f24;
	color: #d61f24;

	&.active {
		background: #d61f24;
		color: #ffffff;
	}
}

.bet-box {
	background-color: #fff;
	border-radius: 16rem;
}

.ball-box {
	padding-top: 10rem;
	border-radius: 15rem;
	border: 1rem solid #d61f2400;

	&.active {
		border: 1px solid #F88c43;
		background: #FEC74810;
	}

	.ball {
		width: 76rem;
		height: 76rem;
		color: #fff;
		background: #fff;
		font-size: 38rem;
		font-weight: 500;
		color: #3a3a3a;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: bold;
	}
}

.bsitem-box {
	border-radius: 8rem;
	border: 1rem solid #d61f2400;
	// padding: 6rem;
	padding: 6rem;

	&.active {
		border: 1px solid #F88c43;
		background: #FEC74810;
	}

	.bsitem {
		border-radius: 8rem;
		// height: 75rem;
		padding: 24rem 20rem;
		color: #fff;
	}
}

.qkball_rv {
	background: url(/static/img/game/twgo/n0_bg.png) no-repeat !important;
	background-size: 100% !important;

	.txt {
		background: linear-gradient(143deg, #FE565C 51.71%, #A943F7 51.72%) !important;
		background-clip: text !important;
		-webkit-background-clip: text !important;
		-webkit-text-fill-color: transparent !important;
	}
}

.qkball_g {
	background: url(/static/img/game/twgo/green_bg.png) no-repeat !important;
	background-size: 100% !important;

	.txt {
		color: #2F9C61;
	}
}

.qkball_gv {
	background: url(/static/img/game/twgo/n5_bg.png) no-repeat !important;
	background-size: 100% !important;

	.txt {
		background: linear-gradient(143deg, #4CCB86 51.71%, #A943F7 51.72%) !important;
		background-clip: text !important;
		-webkit-background-clip: text !important;
		-webkit-text-fill-color: transparent !important;
	}
}

.qkball_r {
	background: url(/static/img/game/twgo/red_bg.png) no-repeat !important;
	background-size: 100% !important;

	.txt {
		color: #E93333;
	}
}

.qkball_green {
	background: linear-gradient(90deg, #00be50 0%, #9bdf00 100%);
	box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.15);
}

.qkball_red {
	background: linear-gradient(90deg, #fd0261 0%, #ff8a96 100%);
	box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.15);
}

.qkball_blue {
	background: linear-gradient(90deg, #00bdff 0%, #5bcdff 100%);
	box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.15);
}

.qkball_yellow {
	background: linear-gradient(90deg, #ff9000 0%, #ffd000 100%);
	box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.15);
}

.qkball_violet {
	background: linear-gradient(90deg, #480AC5 0%, #B36FF8 100%);
	box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.15);
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

.num_violet {
	background: linear-gradient(90deg, #480AC5 0%, #B36FF8 100%);
	box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.15);
}

.flex-bw {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.flex-center {
	display: flex;
	align-items: center;
	justify-content: center;
}

.twgo-list {
	padding: 20rem 0rem;

	.twgo-list-type {
		.type-item {
			width: 23.3%;
			background-color: #DDDDDD;
			border-radius: 14rem 14rem 0 0;
			color: rgba(92, 97, 109, .8);
			font-size: 26rem;
			height: 64rem;

			&.type-active {
				color: #ffffff;
				background: linear-gradient(180deg, #F6843F 0%, #FEA14D 100%);
			}
		}

	}
}

.justify-between {
	justify-content: space-between;
}
</style>