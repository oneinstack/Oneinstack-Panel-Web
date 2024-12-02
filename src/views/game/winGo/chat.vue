<template>
	<div class="d5-history">
		<template v-if="chartDataList.length > 0">
			<div class="d5-history-title flex-bw">
				<div class="d5-period flex-center">{{ $t('game.drawID') }}</div>
				<div class="d5-result flex-center">{{ $t('game.number') }}</div>
			</div>
			<template v-for="(item, index) in chartDataList" :key="index">
				<div class="d5-history-num flex-bw">
					<div class="d5-period-num flex-center">
						<div class="period">{{ item.openExpect }}</div>
					</div>
					<div class="d5-result d5-number flex-bw">
						<div class="result-list">
							<template v-for="(num, i2) in 10" :key="i2">
								<div class="result-item">
									<div class="result-num flex-center result-active" ref="activeRefs"
										v-if="item.openNumber && i2 == item.openNumber" :class="['qkball_' + item.num]">
										<span class="txt">{{ i2 }}</span>
									</div>
									<div class="result-num flex-center" v-else>{{ i2 }}</div>
									<div class="eleLine"
										v-if="conf.showLine && item.openNumber && i2 == item.openNumber"
										:style="{ width: `${item.distance}rem`, transform: `rotate(${item.radius}rad)`, background: '#ff4b4b' }">
									</div>
								</div>
							</template>
						</div>
						<div class="sum-type" v-if="item.openNumber && item.openNumber > 4">
							<div class="sum flex-center active_blue">B</div>
						</div>
						<div class="sum-type" v-if="item.openNumber && item.openNumber <= 4">
							<div class="sum flex-center active_yellow">S</div>
						</div>
						<div class="sum-type" v-if="!item.openNumber">
							<div class="sum flex-center active_yellow">{{ '--' }}</div>
						</div>
					</div>
				</div>
			</template>
		</template>
		<x-no-data v-if="chartDataList.length == 0"></x-no-data>
	</div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';

const props = defineProps({
	chartDataList: {
		default: [] as any[]
	}
})

const activeRefs = ref<any>()
const conf = reactive({
	showLine: false,
	getNodesInfo() {
		this.showLine = false
		let data = activeRefs.value
		for (let i = 0; i < data.length - 1; i++) {
			let x1 = data[i].innerText * 38,
				y1 = 74 * i
			let x2 = data[i + 1].innerText * 38,
				y2 = 74 * (i + 1)
			let distance = Math.sqrt(
				(x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1),
			);
			// 弧度
			let radius = Math.atan2(y2 - y1, x2 - x1);

			props.chartDataList[i].distance = distance
			props.chartDataList[i].radius = radius
		}
		conf.showLine = true
	}
})
watch(
	() => props.chartDataList,
	(val: any) => {
		conf.getNodesInfo()
	},
	{ deep: true }
)
</script>

<style lang="less" scoped>
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

.d5-history {
	background: #fff;
	border-bottom-right-radius: 20rem;
	border-bottom-left-radius: 20rem;

	// padding-bottom: 40rem;
	.d5-history-title {
		background-color: #F6843F;
		font-weight: 600;
		color: #ffffff;
		height: 64rem;
	}

	.d5-period {
		width: 33%;
	}

	.d5-result {
		width: 67%;
	}

	.d5-history-num {
		height: 74rem;
		font-size: 25rem;
		color: #414141;

		&:nth-child(2n+1) {
			background: #FFFBF5;
		}

		.d5-period-num {
			width: 30%;
		}

		.d5-number {
			width: 70%;
		}

		.result-list {
			display: flex;

			.result-item {
				position: relative;
				margin-right: 8rem;
			}

			.result-num {
				height: 30rem;
				width: 30rem;
				border: 2rem solid #bbb;
				color: #bbb;
				border-radius: 50%;
				font-size: 20rem;

				&:last-of-type {
					margin-right: 0rem;
				}

				&.result-active {
					color: #fff;
					background-color: #fb4e4e;
					border: none;
					z-index: 3;
					position: relative;
				}
			}

			.qkball_0 {
				background: url(/static/img/game/twgo/n0_bg.png) !important;
				background-size: 100% !important;

				.txt {
					background: linear-gradient(143deg, #FE565C 51.71%, #A943F7 51.72%) !important;
					background-clip: text !important;
					-webkit-background-clip: text !important;
					-webkit-text-fill-color: transparent !important;
				}
			}

			.qkball_1,
			.qkball_3,
			.qkball_7,
			.qkball_9 {
				background: url(/static/img/game/twgo/green_bg.png) !important;
				background-size: 100% !important;

				.txt {
					color: #2F9C61;
				}
			}

			.qkball_5 {
				background: url(/static/img/game/twgo/n5_bg.png) !important;
				background-size: 100% !important;

				.txt {
					background: linear-gradient(143deg, #4CCB86 51.71%, #A943F7 51.72%) !important;
					background-clip: text !important;
					-webkit-background-clip: text !important;
					-webkit-text-fill-color: transparent !important;
				}
			}

			.qkball_2,
			.qkball_4,
			.qkball_6,
			.qkball_8 {
				background: url(/static/img/game/twgo/red_bg.png) !important;
				background-size: 100% !important;

				.txt {
					color: #E93333;
				}
			}

			.eleLine {
				position: absolute;
				left: 50%;
				top: 50%;
				height: 4rem;
				box-sizing: border-box;
				transform-origin: left center;
				margin-top: -1px;
				pointer-events: none;
				z-index: 1;
			}
		}

		.sum-type {
			padding-right: 40rem;
			display: flex;
		}

		.sum {
			height: 30rem;
			width: 30rem;
			color: #fff;
			background-color: #fb4e4e;
			border-radius: 50%;
			font-size: 20rem;
		}

		.active_blue {
			background: linear-gradient(90deg, #00BDFF 0%, #5BCDFF 100%);
			box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.15);
		}

		.active_yellow {
			background: linear-gradient(90deg, #FF9000 0%, #FFD000 100%);
			box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.15);
		}
	}
}
</style>