<template>
	<div class="d5-history">
		<template v-if="resultList.length > 0">
			<div class="d5-history-title flex-bw">
				<div class="d5-period flex-center">{{ $t('game.drawID') }}</div>
				<div class="d5-result flex-center">{{ $t('game.result') }}</div>
				<div class="d5-sum flex-center">{{ $t('game.sum') }}</div>
			</div>
			<template v-for="(item, itemIndex) in resultList" :key="itemIndex">
				<div class="d5-history-num flex-bw">
					<div class="d5-period flex-center">
						<div class="period">{{ item.openExpect }}</div>
					</div>
					<div class="d5-result flex-center">
						<div class="result-list">
							<div class="result-num flex-center">{{ item.openCodeArr[0] || '-' }}</div>
							<div class="result-num flex-center">{{ item.openCodeArr[1] || '-' }}</div>
							<div class="result-num flex-center">{{ item.openCodeArr[2] || '-' }}</div>
							<div class="result-num flex-center">{{ item.openCodeArr[3] || '-' }}</div>
							<div class="result-num flex-center">{{ item.openCodeArr[4] || '-' }}</div>
						</div>
					</div>
					<div class="d5-sum flex-center">
						<div class="sum flex-center" :class="item.sum > 22 ? 'num_blue' : 'num_yellow'" v-if="item.sum">
							{{ item.sum }}</div>
						<div v-else>{{ '--' }}</div>
					</div>
				</div>
			</template>
		</template>
		<x-no-data v-if="resultList.length == 0"></x-no-data>
	</div>
</template>

<script setup lang="ts">
const props = defineProps({
	resultList: {
		default: [] as any[]
	}
})
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
		width: 50%;
	}

	.d5-sum {
		width: 27%;
	}

	.d5-history-num {
		height: 74rem;
		font-size: 25rem;
		color: #414141;

		&:nth-child(2n + 1) {
			background: #FFFBF5;
		}

		.result-list {
			display: flex;

			.result-num {
				height: 38rem;
				width: 38rem;
				border: 2rem solid #404653;
				color: #404653;
				background: #f4f4f4;
				border-radius: 50%;
				margin-right: 8rem;

				&:last-of-type {
					margin-right: 0rem;
				}
			}
		}

		.sum {
			height: 38rem;
			width: 38rem;
			color: #fff;
			background-color: #F6843F;
			border-radius: 50%;
		}
	}
}

.num_blue {
	background: linear-gradient(90deg, #00bdff 0%, #5bcdff 100%);
	box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.15);
}

.num_yellow {
	background: linear-gradient(90deg, #ff9000 0%, #ffd000 100%);
	box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.15);
}
</style>