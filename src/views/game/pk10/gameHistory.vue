<template>
	<div class="bet-histort">
		<div class="gh-table">
			<div class="gh-table-header row no-wrap">
				<div style="width: 29%">{{ $t('game.drawID') }}</div>
				<div style="width: 29%">{{ $t('game.result') }}</div>
				<div style="width: 21%">{{ $t('winGo.BS') }}</div>
				<div style="width: 21%">{{ $t('pk10.OE') }}</div>
			</div>
			<div>
				<template v-for="(item, index) in historyList">
					<div class="gh-table-item row no-wrap">
						<div style="width: 29%">{{ item.openExpect }}</div>
						<div style="width: 29%; gap: 8rem" class="row flex-center">
							<div v-for="(a, i) in item.openCode.split(',')" :key="i" :class="['qkball' + a]"
								style="height: 40rem; width: 40rem"></div>
							<!-- 	<div :class="['qkball2']" style="height: 40rem; width: 40rem"></div>
							<div :class="['qkball3']" style="height: 40rem; width: 40rem"></div> -->
						</div>
						<div style="width: 21%; gap: 8rem" class="row flex-center">
							<div class="bs-item" v-for="(a, i) in item.openCode.split(',')" :key="i"
								:class="conf.BSFun(a) != 'B' ? ['num_blue'] : ['num_yellow']">
								<div>{{ conf.BSFun(a) }}</div>
							</div>
							<!-- <div class="bs-item" :class="['num_blue']">
								<div>S</div>
							</div>
							<div class="bs-item" :class="['num_yellow']">
								<div>B</div>
							</div> -->
						</div>
						<div style="width: 21%; gap: 8rem" class="row flex-center">
							<div class="bs-item" v-for="(a, i) in item.openCode.split(',')" :key="i"
								:class="conf.OEFun(a) == 'O' ? ['num_red'] : ['num_green']">
								<div>{{ conf.OEFun(a) }}</div>
							</div>
							<!-- <div class="bs-item" :class="['num_green']">
								<div>E</div>
							</div>
							<div class="bs-item" :class="['num_red']">
								<div>O</div>
							</div> -->
						</div>
					</div>
				</template>
			</div>
			<div class="gh-table-foot"></div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';

const props = defineProps({
	historyList: {
		default: [] as any
	}
})
const conf = reactive({
	//判断为大小
	BSFun(num:any) {
		let a = null
		num.toString().split(',').forEach((item:any) => {
			if (item > 5) {
				a = 'B'
			} else {
				a = 'S'
			}
		})
		return a
	},
	OEFun(num:any) {
		let a = null
		num.toString().split(',').forEach((item:any) => {
			if (item % 2 == 0) {
				a = 'E'
			} else {
				a = 'O'
			}
		})
		return a
	},
})
</script>

<style lang="less" scoped>
/* // 历史数据样式 */
.bet-histort {
	// margin-top: 30rem;

	.header-item {
		height: 80rem;
		line-height: 80rem;
		text-align: center;
		width: 100%;
		background-color: #dddddd;
		border-radius: 26rem 26rem 0 0;
		color: rgba(92, 97, 109, 0.8);
		overflow: hidden;
		font-size: 28rem;

		&.active {
			color: #ffffff;
			background: linear-gradient(180deg, #F6843F 0%, #FEA14D 100%);
		}
	}

	.gh-table {
		color: #ffffff;

		&-header {
			text-align: center;
			background-color: #F6843F;
			font-size: 24rem;
			line-height: 80rem;
			font-weight: 600;
		}

		&-item {
			text-align: center;
			line-height: 80rem;
			color: #414141;
			font-size: 24rem;
			background-color: #fff;

			.bs-item {
				height: 40rem;
				line-height: 40rem;
				padding: 0 12rem;
				color: #fff;
				border-radius: 8rem;
			}
		}

		&-foot {
			height: 40rem;
			background-color: #ffffff;
			border-bottom-right-radius: 26rem;
			border-bottom-left-radius: 26rem;
		}
	}

	.gh-table .gh-table-item:nth-child(odd) {
		background-color: #FEF4EB;
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

}

.qkball1 {
	background: url(/static/img/game/pk10/speed_pinball01.png) !important;
	background-size: 100% !important;
}

.qkball2 {
	background: url(/static/img/game/pk10/speed_pinball02.png) !important;
	background-size: 100% !important;
}

.qkball3 {
	background: url(/static/img/game/pk10/speed_pinball03.png) !important;
	background-size: 100% !important;
}

.qkball4 {
	background: url(/static/img/game/pk10/speed_pinball04.png) !important;
	background-size: 100% !important;
}

.qkball5 {
	background: url(/static/img/game/pk10/speed_pinball05.png) !important;
	background-size: 100% !important;
}

.qkball6 {
	background: url(/static/img/game/pk10/speed_pinball06.png) !important;
	background-size: 100% !important;
}

.qkball7 {
	background: url(/static/img/game/pk10/speed_pinball07.png) !important;
	background-size: 100% !important;
}

.qkball8 {
	background: url(/static/img/game/pk10/speed_pinball08.png) !important;
	background-size: 100% !important;
}

.qkball9 {
	background: url(/static/img/game/pk10/speed_pinball09.png) !important;
	background-size: 100% !important;
}

.qkball10 {
	background: url(/static/img/game/pk10/speed_pinball10.png) !important;
	background-size: 100% !important;
}
</style>