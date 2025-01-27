<template>
	<GameLayout :showTips="true" title="Trx" :code="conf.gameType" :lottery="lottery" :ref="conf.layout.setRef"
		@reset="conf.betting.popup.close">
		<div class="row play-item-box">
			<div style="overflow-y: scroll;">
				<div class="tabs-list">
					<template v-for="item in lottery.play.list" :key="item.id">
						<div class="tab-item" :class="{ 'tab-active': item.id === lottery.play.item.id }"
							@click="lottery.play.change(`/game/TrxWinGo/TrxWinGo`, item)">
							<div class="item-content">
								<div class="icon"></div>
								<span>{{ item.label }}</span>
							</div>
						</div>
					</template>
				</div>
			</div>
		</div>
		<div style="padding: 20rem;">
			<!-- 开奖结果 -->
			<div class="open-bet-box">
				<div class="open-number-list">
					<template v-for="(item, index) in conf.loop.openCode" :key="index">
						<div class="result-item">
							<img class="number-item-img" src="/static/theme/blue/openCodeImg.jpg" />
							<!-- 已开奖 -->
							<span class="result-text" :class="index == conf.loop.resuleIndex ? 'openCodeText' : ''">{{
								item }}</span>
						</div>
					</template>
				</div>
			</div>
			<!-- 期数信息、倒计时 -->
			<div class="time-box" style="margin: 6rem 0 30rem 0">
				<div class="row justify-between">
					<div>
						<div class="text">{{ $t('winGo.TrxWinGo') + ' ' }} {{ lottery.play.item.label }}</div>
						<div class="number">{{ lottery.issue }}</div>
					</div>
					<div class="column items-end">
						<div style="margin-bottom: 14rem">{{ $t('winGo.TimeRemaining') }}</div>
						<ctime :times="[lottery.countDown[0], lottery.countDown[1], lottery.countDown[2]]" />
					</div>
				</div>
			</div>
			<!-- 下注选项 -->
			<div class="bet-box fit-width relative" style="padding: 20rem">
				<div class="row">
					<template v-for="item in conf.betting.tabs.list[0].sizeList.slice(0, 3)">
						<div class="col bsitem-box" :class="{ 'active': item.isActive }"
							@click="conf.betting.popup.open(item, 1)">
							<div class="bsitem row justify-between items-center" :class="['num_' + item.color]">
								<div>{{ item.name }}</div>
								<div>{{ conf.betting.oddsInfo[item.oddsCode] || 0 }}</div>
							</div>
						</div>
					</template>
				</div>
				<div class="row" style="margin-top: 8rem;display: flex;justify-content: space-between;">
					<template v-for="item in conf.betting.tabs.list[0].numList">
						<div class="column flex-center ball-box" :class="{ 'active': item.isActive }" style="width: 20%"
							@click="conf.betting.popup.open(item, 2)">
							<div class="ball" :class="['qkball_' + item.color]">
								<span class="txt">{{ item.name }}</span>
							</div>
							<div style="line-height: 50rem">{{ conf.betting.oddsInfo[item.oddsCode] || 0 }}</div>
						</div>
					</template>
				</div>
				<div class="row">
					<template v-for="item in conf.betting.tabs.list[0].sizeList.slice(3)">
						<div class="col bsitem-box" :class="{ 'active': item.isActive }"
							@click="conf.betting.popup.open(item, 1)">
							<div class="bsitem row justify-between items-center" :class="['qkball_' + item.color]">
								<div>{{ item.name }}</div>
								<div>{{ conf.betting.oddsInfo[item.oddsCode] || 0 }}</div>
							</div>
						</div>
					</template>
				</div>
				<!-- 倒计时弹窗 -->
				<big-time :seconds="lottery.countDown[2] + ''"
					v-if="lottery.countDown[3] <= lottery.play.item.openLockCountdown"></big-time>
			</div>
			<!-- 历史结果记录 -->
			<div class="twgo-list">
				<!-- 功能控制 -->
				<div class="twgo-list-type flex-bw" v-scroll>
					<template v-for="item in conf.operation.list" :key="item.value">
						<div class="type-item flex-center"
							:class="{ 'type-active': item.value === conf.operation.active }"
							@click="conf.operation.change(item)">
							{{ item.label }}
						</div>
					</template>
				</div>
				<result v-if="conf.operation.active === 'result'" :resultList="conf.his.result.list"></result>
				<chat v-else-if="conf.operation.active === 'chart'" :key="conf.his.result.comKey"
					:chartDataList="conf.his.result.chartList">
				</chat>
				<order v-if="conf.operation.active === 'myOrder'" :orderDataList="conf.his.order.list"></order>
				<rule ref="orderRefs" v-if="conf.operation.active === 'rule'"
					:list="lottery.play.item.lotteryRuleurl" />
			</div>
			<!-- 分页工具 -->
			<cpage :pageSize="conf.page.pageSize" :pageNum.sync="conf.page.pageNum" :total="conf.page.total"
				@change="conf.page.change" v-if="conf.page.total > conf.page.pageSize"
				style="margin-bottom: 150rem; margin-top: 30rem" />
		</div>
		<!-- 下注弹窗内容 -->
		<template #bet>
			<div class="row items-center">
				<div class="col row items-center">
					<div v-for="item in conf.betting.betTypeArr" :key="item" 
						class="row flex-center ct-bs" :class="['qkball_' + item.color]">
						<span class="txt">{{ item.name }}</span>
					</div>
					<div v-for="(item, itemIndex) in conf.betting.betNumArr" :key="itemIndex" class="row flex-center "
						:class="['qkball_' + item.color]" style="height: 58rem; width: 58rem">
						<span class="txt">{{ item.name }}</span>
					</div>
				</div>
			</div>
		</template>

	</GameLayout>
</template>
<script setup lang="ts">
import GameLayout from '../components/gameLayout-blue.vue'
import cpage from '../components/cpage-blue.vue'
import rule from "../components/gameRule.vue"
import ctime from '../components/downTime.vue'
import result from "./com/result-blue.vue"
import chat from "./com/chat-blue.vue"
import bigTime from "../components/bigTime-blue.vue"
import order from "./com/order.vue"
import { index } from "./winGo"  
const { conf, lottery } = index()
</script>

<style lang="less" scoped>
.play-item-box {
	background-color: #fff;
	border-radius: 36rem;
	margin: 20rem 20rem 0;
}

.colum,
.flex,
.row {
	display: flex;
	flex-wrap: wrap;
}

.tabs-list {
	display: flex;
	align-items: flex-end;

	.tab-item {
		border-radius: 36rem;
		height: 180rem;
		padding: 0rem 24rem;
		display: flex;
		justify-content: center;
		align-items: center;
		width: 25%;
		color: #959ba8;

		.item-content {
			display: flex;
			align-items: center;
			font-size: 24rem;

			.icon {
				width: 58rem;
				height: 58rem;
				background: url(/static/img/game/time_nor.png) no-repeat;
				background-size: 100%;
			}
		}

		&.tab-active {
			border: 2rem solid #77AAFF;
            background: linear-gradient(#336cff 0%, #336cfffc 51%, rgba(255, 166, 79, 0) 100%);
            // background: linear-gradient(180.23deg, rgba(51, 108, 255, 0.99) 0.2%, rgba(51, 108, 255, 0) 99.8%);
			color: #FFF !important;

			.icon {
				background: url(/static/theme/blue/time_nor.webp) no-repeat;
				background-size: 100%;
			}
		}
	}
}
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
    background: linear-gradient(93.51deg, #006FFF 5.72%, #087BFF 86.61%);
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
			color: #336cff
			;
			font-weight: 500;
		}

		.openCodeText {
			color: #E6F2FF  !important;
		}
	}
}

// 倒计时样式
.time-box {
	width: 100%;
	height: 190rem;
	background: url(/static/theme/blue/diban.webp) no-repeat;
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
	border: 2rem solid #d61f24;
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
		border: 2rem solid #F88c43;
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
		border: 2rem solid #F88c43;
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

.num_green {
	background: linear-gradient(90deg, #00be50 0%, #9bdf00 100%);
	box-shadow: 0rem 0rem 20rem 0rem rgba(0, 0, 0, 0.15);
}

.num_red {
	background: linear-gradient(90deg, #fd0261 0%, #ff8a96 100%);
	box-shadow: 0rem 0rem 20rem 0rem rgba(0, 0, 0, 0.15);
}

.num_blue {
	background: linear-gradient(90deg, #00bdff 0%, #5bcdff 100%);
	box-shadow: 0rem 0rem 20rem 0rem rgba(0, 0, 0, 0.15);
}

.num_yellow {
	background: linear-gradient(90deg, #ff9000 0%, #ffd000 100%);
	box-shadow: 0rem 0rem 20rem 0rem rgba(0, 0, 0, 0.15);
}

.num_violet {
	background: linear-gradient(90deg, #480AC5 0%, #B36FF8 100%);
	box-shadow: 0rem 0rem 20rem 0rem rgba(0, 0, 0, 0.15);
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
                background: linear-gradient(93.51deg, #006FFF 5.72%, #087BFF 86.61%);
			}
		}

	}
}

.justify-between {
	justify-content: space-between;
}
</style>