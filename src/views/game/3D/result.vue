<template>
	<div class="result">
		<div class="result-title">
			<div style="width: 27%;">{{ $t('game.drawID') }}</div>
			<div style="width: 31%;">{{ $t('game.result') }}</div>
			<div style="width: 11%;">{{ $t('game.sum') }}</div>
			<div style="width: 14%;">{{ $t('game.value') }}</div>
			<div style="width: 17%;">{{ $t('game.number') }}</div>
		</div>
		<div class="result-list">
			<template v-for="(item, index) in conf.resultList" :key="index">
				<div class="result-ltem" v-if="item.openCode">
					<div style="width: 28%;word-break:break-all;font-size: 27rem;">{{ item.openExpect }}</div>
					<div style="width: 31%;" class="share-point">
						<img class="point-img" :src="'/static/img/share-' + conf.getNum(item, 0) + '.webp'" />
						<img class="point-img" :src="'/static/img/share-' + conf.getNum(item, 1) + '.webp'" />
						<img class="point-img" :src="'/static/img/share-' + conf.getNum(item, 2) + '.webp'" />
					</div>
					<div style="width: 11%;display: flex;justify-content: center;">
						<div class="sum">
							<img class="sum-img" src="/static/img/poinits.webp" />
							<div class="sum-num">{{ conf.getTotal(item.openCode) }}</div>
						</div>
					</div>
					<div style="width: 14%;display: flex;justify-content: center;">
						<img class="img" src="/static/img/small.webp" v-if="conf.getValue(item) == 1" />
						<img class="img" src="/static/img/big.webp" v-if="conf.getValue(item) == 2" />
						<div class="img" style="text-align: center;" v-if="conf.getValue(item) == 0">-</div>
					</div>
					<div style="width: 16%;display: flex;justify-content: center;">
						<img class="img" src="/static/img/odd.webp" v-if="conf.getNumber(item) == 1" />
						<img class="img" src="/static/img/even.webp" v-if="conf.getNumber(item) == 2" />
						<div class="img" style="text-align: center;" v-if="conf.getNumber(item) == 0">-</div>
					</div>
				</div>
				<div class="result-ltem" v-else>
					<div style="width: 28%;word-break:break-all;font-size: 27rem;">{{ item.openExpect }}</div>
					<div style="width: 31%;" class="share-point">
						<img class="point-img" src="/static/img/share-0.webp" />
						<img class="point-img" src="/static/img/share-0.webp" />
						<img class="point-img" src="/static/img/share-0.webp" />
					</div>
					<div style="width: 11%;display: flex;justify-content: center;">
						<div class="sum">
							<img class="sum-img" src="/static/img/poinits.webp" />
							<div class="sum-num" style="font-weight: 700;">?</div>
						</div>
					</div>
					<div style="width: 14%;display: flex;justify-content: center;">
						<div class="img" style="text-align: center;">-</div>
					</div>
					<div style="width: 16%;display: flex;justify-content: center;">
						<div class="img" style="text-align: center;">-</div>
					</div>
				</div>
			</template>
			<div v-if="conf.resultList.length > 0">
				<div class="more" v-if="!conf.isTips">
					<div class="more-btn" @click="conf.moreMessage">
						<span>{{ $t('game.showMore') }}</span>
						<img src="/static/img/show-more.png" style="width: 20rem;height: 12rem;" />
					</div>
				</div>
				<div class="more-not" v-else>
					<span>{{ $t('user.noMore') }}</span>
				</div>
			</div>
			<x-no-data v-if="conf.resultList.length == 0"></x-no-data>
		</div>
	</div>
</template>

<script setup lang="ts">
import { apis } from '@/api';
import { onMounted, reactive, watch } from 'vue';

const props = defineProps({
	lotteryId: {
		default: ''
	}
})
const conf = reactive({
	resultList: [] as any[],
	pageSize: 10,
	pageNum: 1,
	total: 0,
	isTips: false,
	getLotteryResult() {
		conf.isTips = false
		apis.lotteryOpenResult({
			current: conf.pageNum,
			size: conf.pageSize,
			lotteryId: props.lotteryId,
			success: (res: any) => {
				conf.resultList = [...conf.resultList, ...res.data.records]
				conf.total = res.data.total
				if (conf.pageSize * conf.pageNum >= conf.total) return conf.isTips = true
			}
		});
	},
	getNum(item: any, index: any) {
		let arr = item.openCode.split(',')
		return arr[index]
	},
	getTotal(code: any) {
		let arr = code.split(',')
		return arr.reduce(function (prev: any, curr: any) {
			return parseInt(prev) + parseInt(curr);
		});
	},
	getValue(item: any) {
		let arr = item.openCode.split(',')
		let num1 = parseInt(arr[0])
		let num2 = parseInt(arr[1])
		let num3 = parseInt(arr[2])
		if (num1 == num2 && num1 == num3 && num2 == num3) {
			return 0
		} else if ((num1 + num2 + num3) < 11) {
			return 1
		} else {
			return 2
		}
	},
	getNumber(item: any) {
		let arr = item.openCode.split(',')
		let num1 = parseInt(arr[0])
		let num2 = parseInt(arr[1])
		let num3 = parseInt(arr[2])
		if (num1 == num2 && num1 == num3 && num2 == num3) {
			return 0
		} else if ((num1 + num2 + num3) % 2 == 0) {
			return 2
		} else {
			return 1
		}
	},
	moreMessage() {
		if (conf.pageSize * conf.pageNum >= conf.total) return conf.isTips = true
		conf.pageNum++;
		conf.getLotteryResult();
	},
})
watch(
	() => props.lotteryId,
	(val: string) => {
		if (val) {
			conf.resultList = []
			conf.pageNum = 1
			conf.total = 0
			conf.getLotteryResult()
		}
	}
)
const initResult = () => {
	apis.lotteryOpenResult({
		current: 1,
		size: 10,
		lotteryId: props.lotteryId,
		success: (res: any) => {
			if (conf.resultList[0].openExpect != res.data.records[0].openExpect) {
				conf.resultList.unshift(res.data.records[0])
				conf.resultList.pop()
			}
			let index = conf.resultList.findIndex((item: any) => !item.openCode)
			if (index != -1) {
				let openExpect = conf.resultList[index]?.openExpect
				let newIndex = res.data.records.findIndex((item: any) => item.openExpect == openExpect)
				conf.resultList[index].openCode = res.data.records[newIndex].openCode
			}
			conf.total = res.data.total
		}
	});
}

// 暴露方法
defineExpose({
	initResult
})
onMounted(() => {
	conf.getLotteryResult()
})
</script>

<style lang="less" scoped>
.result {
	margin: 0rem 20rem 124rem;
	border-radius: 16rem;
	overflow: hidden;

	// padding-bottom: 24rem;
	.result-title {
		display: flex;
		padding: 0rem 24rem;
		background: #e9ecf5;

		div {
			font-size: 24rem;
			color: #45454d;
			padding: 16rem 0rem;
			display: flex;
			justify-content: center;
		}
	}

	.result-list {
		margin-bottom: 24rem;
		padding-bottom: 24rem;
		background: #FFF;
		border-radius: 0 0 16rem 16rem;

		.result-ltem {
			padding: 24rem 22rem;
			display: flex;
			flex-wrap: wrap;
			justify-content: space-between;
			align-items: center;

			.share-point {
				display: flex;
				justify-content: center;

				.point-img {
					width: 48rem;
					height: 48rem;
				}
			}

			.img {
				width: 48rem;
				height: 48rem;
			}

			.sum {
				width: 48rem;
				height: 48rem;
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
					justify-content: center;
					align-items: center;
					font-size: 26rem;
					color: #2c2e36;
				}
			}

			&:nth-child(2n) {
				background: #e9ecf5;
			}
		}

		.more {
			background: #FFF;
			padding: 24rem 24rem 0rem;

			.more-btn {
				box-shadow: rgba(0, 0, 0, 0.1) 0px 1.06667vw 1.06667vw;
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
			padding: 24rem 0rem 36rem;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 24rem;
			color: #707070;
		}
	}
}
</style>