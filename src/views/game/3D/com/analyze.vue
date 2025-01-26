<template>
	<div class="analyze">
		<div class="dice-area">
			<div class="dice-num" style="overflow-x: scroll;" ref="showContentRef">
				<div class="tip-content" @click="conf.stopScroll" @mousedown="conf.stopScroll">
					<div class="dice-num-line">
						<template v-for="(item, index) in conf.resultList.slice(0, conf.lineNum * 1)" :key="index">
							<div class="num-item">
								<div class="point">
									<span v-if="item.color == 0" style="color: #0090e2;">{{ item.total }}</span>
									<span v-if="item.color == 1" style="color: #e20000;">{{ item.total }}</span>
									<span v-if="item.color == 2" style="color: #009a19;">{{ item.total }}</span>
								</div>
								<div class="num">{{ item.num1 }}{{ item.num2 }}{{ item.num3 }}</div>
							</div>
						</template>
					</div>
					<div class="dice-num-line">
						<template v-for="(item, index) in conf.resultList.slice(conf.lineNum * 1, conf.lineNum * 2)"
							:key="index">
							<div class="num-item">
								<div class="point">
									<span v-if="item.color == 0" style="color: #0090e2;">{{ item.total }}</span>
									<span v-if="item.color == 1" style="color: #e20000;">{{ item.total }}</span>
									<span v-if="item.color == 2" style="color: #009a19;">{{ item.total }}</span>
								</div>
								<div class="num">{{ item.num1 }}{{ item.num2 }}{{ item.num3 }}</div>
							</div>
						</template>
					</div>
					<div class="dice-num-line">
						<template v-for="(item, index) in conf.resultList.slice(conf.lineNum * 2, conf.lineNum * 3)"
							:key="index">
							<div class="num-item">
								<div class="point">
									<span v-if="item.color == 0" style="color: #0090e2;">{{ item.total }}</span>
									<span v-if="item.color == 1" style="color: #e20000;">{{ item.total }}</span>
									<span v-if="item.color == 2" style="color: #009a19;">{{ item.total }}</span>
								</div>
								<div class="num">{{ item.num1 }}{{ item.num2 }}{{ item.num3 }}</div>
							</div>
						</template>
					</div>
					<div class="dice-num-line">
						<template v-for="(item, index) in conf.resultList.slice(conf.lineNum * 3, conf.lineNum * 4)"
							:key="index">
							<div class="num-item">
								<div class="point">
									<span v-if="item.color == 0" style="color: #0090e2;">{{ item.total }}</span>
									<span v-if="item.color == 1" style="color: #e20000;">{{ item.total }}</span>
									<span v-if="item.color == 2" style="color: #009a19;">{{ item.total }}</span>
								</div>
								<div class="num">{{ item.num1 }}{{ item.num2 }}{{ item.num3 }}</div>
							</div>
						</template>
					</div>
					<div class="dice-num-line">
						<template v-for="(item, index) in conf.resultList.slice(conf.lineNum * 4, conf.lineNum * 5)"
							:key="index">
							<div class="num-item">
								<div class="point">
									<span v-if="item.color == 0" style="color: #0090e2;">{{ item.total }}</span>
									<span v-if="item.color == 1" style="color: #e20000;">{{ item.total }}</span>
									<span v-if="item.color == 2" style="color: #009a19;">{{ item.total }}</span>
								</div>
								<div class="num">{{ item.num1 }}{{ item.num2 }}{{ item.num3 }}</div>
							</div>
						</template>
					</div>
				</div>
			</div>
			<div class="area">
				<div style="overflow-x: scroll;" ref="areaRefs" @click="conf.stopScrollArea" @mousedown="conf.stopScrollArea">
					<div class="area-content">
						<template v-for="(result, i) in conf.resultType" :key="i">
							<div class="area-row">
								<div class="area-item" v-for="(it, i2 ) in conf.resultType[i]" :key="i2">
									<div class="area-num" v-if="it == 0">S</div>
									<div class="area-num bg-red" v-if="it == 1">B</div>
									<div class="area-num bg-blue" v-if="it == 2">T</div>
									<div v-if="it == 4"></div>
								</div>
							</div>
						</template>
					</div>
				</div>
			</div>
		</div>
		<div class="round">
			<div class="round-btn-list">
				<div class="round-btn" :class="{ 'round-active': conf.pointSize == 50 }"
					@click="conf.getResultPoints(50)">50
					{{ $t('game.round') }}</div>
				<div class="round-btn" :class="{ 'round-active': conf.pointSize == 100 }"
					@click="conf.getResultPoints(100)">
					100 {{ $t('game.round') }}</div>
				<div class="round-btn" :class="{ 'round-active': conf.pointSize == 200 }"
					@click="conf.getResultPoints(200)">
					200 {{ $t('game.round') }}</div>
				<div class="round-btn" :class="{ 'round-active': conf.pointSize == 600 }"
					@click="conf.getResultPoints(600)">
					600 {{ $t('game.round') }}</div>
			</div>
		</div>
		<div class="round-content">
			<div class="round-list">
				<div class="round-item" style="margin-top: 0rem;">
					<img class="round-img" src="/static/img/share-1.webp" />
					<div class="round-num">
						<span>{{ conf.onePoints }}%</span>
						<div class="round-bar">
							<div class="bar" :style="{ 'width': conf.onePoints + '%' }"></div>
						</div>
					</div>
				</div>
				<div class="round-item" style="margin-top: 0rem;">
					<img class="round-img" src="/static/img/share-2.webp" />
					<div class="round-num">
						<span>{{ conf.twoPoints }}%</span>
						<div class="round-bar">
							<div class="bar" :style="{ 'width': conf.twoPoints + '%' }"></div>
						</div>
					</div>
				</div>
				<div class="round-item">
					<img class="round-img" src="/static/img/share-3.webp" />
					<div class="round-num">
						<span>{{ conf.threePoints }}%</span>
						<div class="round-bar">
							<div class="bar" :style="{ 'width': conf.threePoints + '%' }"></div>
						</div>
					</div>
				</div>
				<div class="round-item">
					<img class="round-img" src="/static/img/share-4.webp" />
					<div class="round-num">
						<span>{{ conf.fourPoints }}%</span>
						<div class="round-bar">
							<div class="bar" :style="{ 'width': conf.fourPoints + '%' }"></div>
						</div>
					</div>
				</div>
				<div class="round-item">
					<img class="round-img" src="/static/img/share-5.webp" />
					<div class="round-num">
						<span>{{ conf.fivePoints }}%</span>
						<div class="round-bar">
							<div class="bar" :style="{ 'width': conf.fivePoints + '%' }"></div>
						</div>
					</div>
				</div>
				<div class="round-item">
					<img class="round-img" src="/static/img/share-6.webp" />
					<div class="round-num">
						<span>{{ conf.sixPoints }}%</span>
						<div class="round-bar">
							<div class="bar" :style="{ 'width': conf.sixPoints + '%' }"></div>
						</div>
					</div>
				</div>
			</div>
		</div>
		<div class="stat">
			<div class="stat-title">
				<div>{{ $t('game.small') }}</div>
				<div style="color: #02921b">{{ $t('game.triple') + '(' + conf.triple + '%)' }}</div>
				<div style="color: #e20000">{{ $t('game.big') }}</div>
			</div>
			<div class="stat-bar">
				<div class="bar-green" :style="{ 'width': conf.small + '%' }">{{ conf.small }}%</div>
				<div :style="{ 'width': conf.triple + '%' }"></div>
				<div class="bar-red" :style="{ 'width': conf.big + '%' }">{{ conf.big }}%</div>
			</div>
		</div>
	</div>
	<div style="height: 144rem;"></div>
</template>

<script setup lang="ts">
import { apis } from '@/api';
import { onMounted, onUnmounted, reactive, ref, watch } from 'vue';

const props = defineProps({
	lotteryId: {
		default: ''
	}
})
const areaRefs = ref<any>()
const showContentRef = ref<any>()
const conf = reactive({
	marginTop: 0,
	areaLeft: 0,
	scrollNum: 0,
	areaNum: 0,
	resultList: [] as any[],
	lineNum: 13,
	resultType: [] as any[],
	arrType: [] as any[],
	typeIndex: 0,
	onePoints: '0',
	twoPoints: '0',
	threePoints: '0',
	fourPoints: '0',
	fivePoints: '0',
	sixPoints: '0',
	triple: '0',
	big: '0',
	small: '0',
	pointSize: 50,
	marginTopShow: false,
	marginTopStop: 0,
	areaLeftShow: false,
	timer1: null as any,
	timer: null as any,
	leftLeft: 0,
	stopScrollLeft: true,
	stopScrollAreaLeft: true,
	// 获取历史数据
	getLotteryResult() {
		conf.leftLeft = 0
		apis.lotteryOpenResult({
			current: 1,
			size: 65,
			lotteryId: props.lotteryId,
			success: (res: any) => {
				if (res.data.records) {
					conf.lineNum = res.data.records.length / 5
					res.data.records.forEach((item: any, itemIndex: number, mainArr: any) => {
						if (item.openCode) {
							let arr = item.openCode.split(',')
							let num1 = parseInt(arr[0])
							let num2 = parseInt(arr[1])
							let num3 = parseInt(arr[2])
							let total = num1 + num2 + num3
							let color = 0
							if (num1 == num2 && num1 == num3 && num2 == num3) {
								color = 2
							} else if ((num1 + num2 + num3) < 11) {
								color = 0
							} else {
								color = 1
							}
							conf.resultList.push({
								total,
								num1,
								num2,
								num3,
								color
							})
							conf.getType(color, itemIndex, mainArr)
						}
					})
					conf.animationFunc()

				}
			}
		});
	},
	// 统计类型
	getType(num: any, itemIndex: number, mainArr: any) {
		let length = conf.arrType.length
		if (itemIndex >= (mainArr.length - 1)) {
			if (conf.arrType[length - 1] == num) {
				conf.arrType.push(num)
				conf.resultType[conf.typeIndex] = conf.getNum(conf.arrType)
				conf.arrType.pop()
			} else {
				conf.resultType[conf.typeIndex + 1] = conf.getNum([num])
			}
		}
		if (length > 0) {
			if (conf.arrType[length - 1] == num) {
				conf.arrType.push(num)
				if (conf.arrType.length == 6) {
					conf.resultType[conf.typeIndex] = conf.arrType
					conf.arrType = []
					// conf.arrType.push(num)
					conf.typeIndex++
				}
			} else {
				conf.resultType[conf.typeIndex] = conf.getNum(conf.arrType)
				conf.arrType = []
				conf.arrType.push(num)
				conf.typeIndex++
			}
		} else {
			conf.arrType.push(num)
		}
	},
	// 补全数据列有6位
	getNum(arr: any) {
		let length = arr.length
		if (length == 1) {
			return [...arr, ...[4, 4, 4, 4, 4]]
		}
		if (length == 2) {
			return [...arr, ...[4, 4, 4, 4]]
		}
		if (length == 3) {
			return [...arr, ...[4, 4, 4]]
		}
		if (length == 4) {
			return [...arr, ...[4, 4]]
		}
		if (length == 5) {
			return [...arr, ...[4]]
		}
		if (length == 6) {
			return arr
		}
	},
	getResultPoints(size: any) {
		conf.pointSize = size
		apis.lotteryOpenResult({
			current: 1,
			size,
			lotteryId: props.lotteryId,
			success: (res: any) => {
				if (res.data.records) {
					let one = 0
					let two = 0
					let three = 0
					let four = 0
					let five = 0
					let six = 0
					let t = 0
					let b = 0
					let s = 0
					res.data.records.forEach((item: any, itemIndex: number, mainArr: any) => {
						if (item.openCode) {
							let arr = item.openCode.split(',')
							let num1 = parseInt(arr[0])
							let num2 = parseInt(arr[1])
							let num3 = parseInt(arr[2])

							if (num1 == 1 || num2 == 1 || num3 == 1) {
								one++
							}
							if (num1 == 2 || num2 == 2 || num3 == 2) {
								two++
							}
							if (num1 == 3 || num2 == 3 || num3 == 3) {
								three++
							}
							if (num1 == 4 || num2 == 4 || num3 == 4) {
								four++
							}
							if (num1 == 5 || num2 == 5 || num3 == 5) {
								five++
							}
							if (num1 == 6 || num2 == 6 || num3 == 6) {
								six++
							}
							if (num1 == num2 && num1 == num3 && num2 == num3) {
								t++
							} else if ((num1 + num2 + num3) < 11) {
								s++
							} else {
								b++
							}
							if (itemIndex == mainArr.length - 1) {
								let totalPoints = one + two + three + four + five + six
								conf.onePoints = (one / totalPoints * 100).toFixed(2)
								conf.twoPoints = (two / totalPoints * 100).toFixed(2)
								conf.threePoints = (three / totalPoints * 100).toFixed(2)
								conf.fourPoints = (four / totalPoints * 100).toFixed(2)
								conf.fivePoints = (five / totalPoints * 100).toFixed(2)
								conf.sixPoints = (six / totalPoints * 100).toFixed(2)

								let totalBig = t + s + b
								conf.triple = (t / totalBig * 100).toFixed(2)
								conf.small = (s / totalBig * 100).toFixed(2)
								conf.big = (b / totalBig * 100).toFixed(2)
							}
						}
					})
				}
			}
		});
	},
	animationFunc() {
		setTimeout(() => {
			if (showContentRef.value) {
				autoScrollToBottom(showContentRef.value, 20000, 1)
			}
			if (areaRefs.value) {
				autoScrollToBottom(areaRefs.value, conf.resultType.length * 1500, 2)
			}
		}, 300)
	},
	stopScroll(event: any) {
		event.preventDefault();
		showContentRef.value = null
		conf.stopScrollLeft = false

	},
	stopScrollArea(event: any) {
		event.preventDefault();
		areaRefs.value = null
		conf.stopScrollAreaLeft = false

	}
})
const autoScrollToBottom = (element: any, duration: any, type = 1) => {
	const scrollHeight = element.scrollWidth;
	const start = element.scrollLeft;
	const change = scrollHeight - start;
	const startDate = +new Date();

	if (type == 1) {
		const scroll = () => {
			const currentDate = +new Date();
			const currentTime = currentDate - startDate;
			element.scrollLeft = easeInOutQuad(currentTime, start, change, duration);
			if (currentTime < duration && conf.stopScrollLeft) {
				requestAnimationFrame(scroll);
			}
		};
		requestAnimationFrame(scroll);
	} else {
		const scroll2 = () => {
			const currentDate2 = +new Date();
			const currentTime2 = currentDate2 - startDate;
			element.scrollLeft = easeInOutQuad(currentTime2, start, change, duration);
			if (currentTime2 < duration && conf.stopScrollAreaLeft) {
				requestAnimationFrame(scroll2);
			}
		};
		requestAnimationFrame(scroll2);
	}
}
const easeInOutQuad = (t: any, b: any, c: any, d: any) => {
	t /= d / 2;
	if (t < 1) return c / 2 * t * t + b;
	t--;
	return -c / 2 * (t * (t - 2) - 1) + b;
}
const initAnaly = () => {
	conf.resultType = []
	conf.arrType = []
	conf.resultList = []
	conf.getLotteryResult()
	conf.getResultPoints(conf.pointSize)
}
watch(
	() => props.lotteryId,
	(val: string) => {
		if (val) {
			conf.marginTopShow = false
			conf.areaLeftShow = false
			conf.marginTop = 0
			conf.scrollNum = 0
			conf.areaLeft = 0
			conf.areaNum = 0
			initAnaly()
		}
	}
)
// 暴露方法
defineExpose({
	initAnaly
})
onMounted(() => {
	conf.getLotteryResult()
	conf.getResultPoints(conf.pointSize)
})
onUnmounted(() => {
	if (conf.timer) {
		clearInterval(conf.timer)
		conf.timer = null
	}
	if (conf.timer1) {
		clearInterval(conf.timer1)
		conf.timer1 = null
	}
})
</script>

<style lang="less" scoped>
.analyze {
	background: #FFF;

	.dice-area {
		padding: 24rem;
		overflow: hidden;

		.dice-num {
			overflow: hidden;

			.dice-num-line {
				display: flex;

				.num-item {
					// width: 70rem;
					width: calc(100% / 13);
					min-width: 52rem;
					flex-shrink: 0;
					background: #f6f7fb;
					text-align: center;
					font-size: 20rem;
					font-weight: 500;
					padding: 8rem 0rem;
					border-radius: 8rem;
					margin-right: 8rem;
					margin-bottom: 8rem;

					.point {
						color: #0090e2;
						margin-bottom: 8rem;
					}

					.num {
						color: #5f6975;
					}
				}
			}
		}

		.area {
			margin: 24rem 0rem;

			.area-content {
				display: flex;

				.area-row {
					display: flex;
					flex-direction: column;

					.area-item {
						width: 56rem;
						height: 56rem;
						align-items: center;
						display: flex;
						justify-content: center;
						border: 1rem solid #eee;

						.area-num {
							width: 44rem;
							height: 44rem;
							border-radius: 50%;
							background: #0090e2;
							font-size: 24rem;
							color: #FFF;
							display: flex;
							align-items: center;
							justify-content: center;

							&.bg-red {
								background: #e20000;
							}

							&.bg-blue {
								background: #02921b;
							}
						}
					}
				}
			}
		}
	}

	.round {
		padding: 0rem 24rem;
		border-bottom: 2rem solid #eee;

		.round-btn-list {
			display: flex;
			justify-content: space-between;

			.round-btn {
				height: 64rem;
				width: 23%;
				color: #45454d;
				font-size: 24rem;
				background: #f5f5fa;
				border-radius: 8rem;
				display: flex;
				justify-content: center;
				align-items: center;

				&.round-active {
					border-top: 4rem solid #9800f5;
					box-shadow: 0 8rem 8rem #00000040 inset;
					background: #FFF;
				}
			}
		}
	}

	.round-content {
		padding: 24rem 20rem;
		border-bottom: 2rem solid #eee;

		.round-list {
			display: flex;
			justify-content: space-between;
			flex-wrap: wrap;

			.round-item {
				display: flex;
				align-items: center;
				width: 45%;
				margin-top: 40rem;

				.round-img {
					width: 56rem;
					height: 56rem;
					margin-right: 16rem;
					margin-top: 8rem;
				}

				.round-num {
					text-align: center;
					flex: 1;

					span {
						color: #45454d;
						font-size: 24rem;
						font-weight: 700;
					}

					.round-bar {
						margin-top: 8rem;
						height: 15rem;
						border-radius: 8rem;
						background: #CED2D6;
						overflow: hidden;

						.bar {
							background: #3988FD;
							height: 100%;
						}
					}
				}
			}
		}
	}

	.stat {
		padding: 24rem;

		.stat-title {
			display: flex;
			justify-content: space-between;
			font-size: 28rem;
			font-weight: 700;
			color: #0090e2;
			margin-bottom: 8rem;
		}

		.stat-bar {
			border-radius: 32rem;
			overflow: hidden;
			height: 32rem;
			color: #FFF;
			font-size: 24rem;
			font-weight: 700;
			background: #02921b;
			display: flex;
			justify-content: space-between;

			.bar-green {
				height: 100%;
				background: #0090e2;
				display: flex;
				justify-content: center;
				align-items: center;
			}

			.bar-red {
				height: 100%;
				background: #e20000;
				display: flex;
				justify-content: center;
				align-items: center;
			}
		}
	}
}

.tip-content {
	font-size: 26rem;
	color: #45454d;
	font-weight: 500;
	display: inline-block;
	white-space: nowrap;
	// animation: u-loop-animation 10s linear;
	flex-wrap: nowrap;
}

@keyframes u-loop-animation {
	0% {
		transform: translate3d(0, 0, 0);
	}

	100% {
		transform: translateX(-100%);
	}
}
</style>