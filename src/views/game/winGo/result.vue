<template>
	<div class="d5-history">
		<template v-if="resultList.length > 0">
			<div class="d5-history-title flex-bw">
				<div class="d5-period flex-center">{{ $t('game.drawID') }}</div>
				<div class="d5-block flex-center">{{ $t('winGo.Block') }}</div>
				<div class="d5-bs flex-center">{{ $t('winGo.BS') }}</div>
				<div class="d5-result flex-center">{{ $t('game.result') }}</div>
			</div>
			<template v-for="(item, itemIndex) in resultList" :key="itemIndex">
				<div class="d5-history-num flex-bw">
					<div class="d5-period flex-center">
						{{ item.openExpect }}
					</div>
					<div class="d5-block flex-center">
						{{ item.openNumberStr ? '**' + item.openNumberStr : '--' }}
					</div>
					<div class="d5-bs flex-center" v-if="item.openNumberStr">
						<div :class="item.openNumber >= 5 ? 'num_blue' : 'num_yellow'" class="bs-result">
							{{ item.openNumber < 5 ? 'S' : 'B' }}</div>
						</div>
						<div class="d5-bs flex-center" v-else>
							{{ '--' }}
						</div>
						<div class="d5-result flex-center" :class="['qkball_' + item.openNumber]">
							<span>{{ String(item.openNumber) || '--' }}</span>
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
	// padding-bottom: 40rem;
	font-size: 28rem;

	.d5-history-title {
		background-color: #F6843F;
		font-weight: 600;
		color: #ffffff;
		height: 64rem;
	}

	.d5-period {
		width: 25%;
	}

	.d5-block {
		width: 30%;
	}

	.d5-bs {
		width: 20%;
	}

	.d5-result {
		width: 25%;
		font-size: 30rem;
		font-weight: 500;
	}

	.d5-history-num {
		height: 74rem;
		font-size: 24rem;
		color: #414141;

		&:nth-child(2n+1) {
			background: #FFFBF5;
		}
	}
}

.qkball_0 {
	background: linear-gradient(143deg, #FE565C 51.71%, #A943F7 51.72%) !important;
	background-clip: text !important;
	-webkit-background-clip: text !important;
	-webkit-text-fill-color: transparent !important;
}

.qkball_1,
.qkball_3,
.qkball_7,
.qkball_9 {
	color: #2F9C61;
}

.qkball_5 {
	background: linear-gradient(143deg, #4CCB86 51.71%, #A943F7 51.72%) !important;
	background-clip: text !important;
	-webkit-background-clip: text !important;
	-webkit-text-fill-color: transparent !important;
}

.qkball_2,
.qkball_4,
.qkball_6,
.qkball_8 {
	color: #E93333;
}

.num_blue {
	background: linear-gradient(90deg, #00bdff 0%, #5bcdff 100%);
	box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.15);
}

.num_yellow {
	background: linear-gradient(90deg, #ff9000 0%, #ffd000 100%);
	box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.15);
}

.bs-result {
	width: 40rem;
	height: 40rem;
	text-align: center;
	border-radius: 50%;
	line-height: 40rem;
	color: #fff;
}
</style>