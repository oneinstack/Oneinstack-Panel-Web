<template>
	<div class="result">
		<div style="overflow-x: scroll;" ref="tabRrfs">
			<div class="scale">
				<div class="scale-list">
					<template v-for="(item, index) in props.tabs" :key="index">
						<div class="scale-item" @click="conf.changeTab(item, index)">
							<div class="bg-color" :class="{ 'colorBtn': item.lotteryInterval == conf.tabIndex }">
								<div class="color-name">
									<div class="tab-text" v-if="(item.lotteryInterval / 1000 / 60) >= 1">
										<span>{{ item.lotteryInterval / 1000 / 60 || '' }}</span>
										{{ item.lotteryInterval / 1000 / 60 > 1 ? $t('game.minutes') :
											$t('game.minute') }}
									</div>
									<div class="tab-text" v-else>
										<span>{{ item.lotteryInterval / 1000 || '' }}</span>{{ $t('game.second') }}
									</div>
								</div>
							</div>
						</div>
					</template>
				</div>
			</div>
		</div>
		<div class="result-content">
			<div class="result-title">
				<div style="width: 30%;justify-content: flex-start;">{{ $t('game.drawID') }}</div>
				<div style="flex: 1;">{{ $t('game.number') }}</div>
				<div style="width: 80rem;">{{ $t('game.color') }}</div>
			</div>
			<div class="result-list">
				<template v-for="(item, i) in conf.resultList" :key="i">
					<div class="result-ltem">
						<div class="issue">{{ item.openExpect }}</div>
						<div class="number" v-if="item.openCode">
							<template v-for="(it, num) in 10" :key="num">
								<div class="num-img" v-if="num == item.openCode">
									<img v-if="item.openCode == 0" class="img" src="/static/img/color2.webp" />
									<img v-if="item.openCode == 2 || item.openCode == 4 || item.openCode == 6 || item.openCode == 8"
										class="img" src="/static/img/color-red.webp" />
									<img v-if="item.openCode == 5" class="img" src="/static/img/color1.webp" />
									<img v-if="item.openCode == 1 || item.openCode == 3 || item.openCode == 7 || item.openCode == 9"
										class="img" src="/static/img/color-green.webp" />
									<div class="num">{{ item.openCode }}</div>
								</div>
								<div class="number-item" v-else><span>{{ num }}</span></div>
							</template>
						</div>
						<div class="number" v-else>
							<template v-for="(it, num) in 10" :key="num">
								<div class="number-item" v-if="num == 0"><span>?</span></div>
								<div class="number-item" v-else><span>{{ num }}</span></div>
							</template>
						</div>
						<div class="item-color">
							<div class="color-red" v-if="['0', '2', '4', '6', '8'].includes(item.openCode)"></div>
							<div class="color-green" v-if="['1', '3', '5', '7', '9'].includes(item.openCode)"></div>
							<div class="color-violet" v-if="['0', '5'].includes(item.openCode)"></div>
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
	</div>
</template>

<script setup lang="ts">
import { apis } from '@/api';
import { sstatus } from '@/sstore/sstatus';
import System from '@/utils/System';
import { onMounted, reactive, ref } from 'vue';

const props = defineProps({
	tabs: {
		default: [] as any
	},
	selectIndexId: {
		default: ''
	}
})
const tabRrfs = ref<any>()
const conf = reactive({
	tabIndex: 1,
	lotteryId: '',
	resultList: [] as any,
	pageSize: 10,
	pageNum: 1,
	total: 0,
	index: 0,
	colorBtnNum: 1,
	isTips: false,
	changeTab(item: any, index: any) {
		conf.tabIndex = item.lotteryInterval
		sstatus.getscrollLeft(tabRrfs,550, index, 180)
		conf.index = index
		conf.resultList = []
		conf.pageNum = 1
		conf.total = 0
		conf.getLotteryResult(item.id)
	},
	getLotteryResult(lotteryId: any) {
		System.loading()
		conf.isTips = false
		apis.lotteryOpenResult({
			current: conf.pageNum,
			size: conf.pageSize,
			lotteryId,
			success: (res: any) => {
				conf.resultList = [...conf.resultList, ...res.data.records]
				conf.total = res.data.total
				if (conf.pageSize * conf.pageNum >= conf.total) return conf.isTips = true
			},
			final: () => {
				System.loading(false)
			}
		});
	},
	moreMessage() {
		if (conf.pageSize * conf.pageNum >= conf.total) return conf.isTips = true
		conf.pageNum++;
		conf.getLotteryResult(props.tabs[conf.index].id);
	}
})
const initResult = (e: any) => {
	console.log(e);
	
	let lotteryId = props.tabs[conf.index].id
	if (e != lotteryId) return;
	System.loading()
	apis.lotteryOpenResult({
		current: 1,
		size: 10,
		lotteryId,
		success: (res: any) => {
			let datas = res.data.records
			if (conf.resultList[0].openExpect != datas[0].openExpect) {
				conf.resultList.unshift(datas[0])
				conf.resultList.pop()
			}
			let index = conf.resultList.findIndex((item: any) => !item.openCode)
			if (index != -1) {
				let openExpect = conf.resultList[index]?.openExpect
				let newIndex = datas.findIndex((item: any) => item.openExpect == openExpect)
				conf.resultList[index].openCode = datas[newIndex].openCode
			}
			conf.total = res.data.total
		},
		final: () => {
			System.loading(false)
		}
	});
}
// 暴露方法
defineExpose({
	initResult
})
onMounted(() => {
	if (props.selectIndexId) {
		conf.index = props.tabs.findIndex((item: any) => item.id == props.selectIndexId)
		conf.tabIndex = props.tabs[conf.index].lotteryInterval
		conf.getLotteryResult(props.tabs[conf.index].id)
	} else {
		conf.tabIndex = props.tabs[0].lotteryInterval
		conf.getLotteryResult(props.tabs[0].id)
	}
})
</script>

<style lang="less" scoped>
.result {
	margin: 0rem 20rem 124rem;

	.time-tabs {
		padding: 20rem 0rem;

		.tabs-list {
			display: flex;

			// overflow-x: auto;
			.tab-item {
				background: #FFF;
				border-radius: 8rem;
				height: 96rem;
				padding: 0rem 24rem;
				display: flex;
				justify-content: center;
				align-items: center;
				margin-left: 6rem;

				.item-content {
					display: flex;
					align-items: center;
					font-size: 24rem;
					color: #5f6975;

					span {
						margin-right: 16rem;
						font-size: 40rem;
						display: flex;
					}
				}

				&.tab-active {
					border-top: 0.8vw solid #D90000;
					background: linear-gradient(180deg, #e9ecf5 0%, #f5f5fa 100%);
				}
			}
		}
	}

	.scale {
		// background: #c8d2d8;
		// height: 174rem;
		padding: 24rem 0rem;

		.scale-list {
			display: flex;
			// justify-content: space-between;
			align-items: center;
			height: 100%;

			.scale-item {
				height: 96rem;
				border-radius: 16rem;
				background: #BDCAD4;
				box-shadow: 0 4rem 4rem rgba(0, 0, 0, .25) inset, 0 2rem 0 0 rgba(255, 255, 255, .25);
				margin-right: 14rem;
				padding: 0rem 8rem;
				flex-shrink: 0;

				// border: 4rem solid #9AAAB5;
				.bg-color {
					border: 1px solid rgba(255, 255, 255, .22);
					background: linear-gradient(180deg, #c2ced6 0%, #9eadb8 100%);
					box-shadow: 0 12rem #95a4af;
					border-radius: 16rem;
					height: 80rem;
					width: 150rem;
					display: flex;
					justify-content: center;
					align-items: center;
					margin-top: -6rem;
					flex-shrink: 0;

					.tab-text {
						font-size: 24rem;
						color: #FFF;
						display: flex;
						align-items: center;

						span {
							margin-right: 16rem;
							font-size: 40rem;
							font-weight: bold;
						}
					}
				}
			}
		}

		.colorBtn {
			animation: colorBtn 0.3s forwards;
		}

		@keyframes colorBtn {
			0% {
				margin-top: 0rem;
				box-shadow: 0 12rem #95a4af;
			}

			100% {
				box-shadow: 0 0rem #95a4af;
				margin-top: 8rem;
			}
		}
	}

	.result-content {
		border-radius: 16rem;
		overflow: hidden;

		.result-title {
			display: flex;
			justify-content: space-between;
			// padding: 0rem 16rem;
			padding-left: 16rem;
			background: #D0D3DC;

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
				padding: 20rem 15rem;
				padding-right: 0rem;
				display: flex;
				justify-content: space-between;
				align-items: center;

				.issue {
					font-size: 28rem;
					color: #45454D;
					width: 30%;
				}

				.number {
					display: flex;
					justify-content: center;
					flex: 1;

					.num-img {
						width: 33rem;
						height: 33rem;
						position: relative;
						margin-left: 2rem;

						.img {
							width: 100%;
							height: 100%;
						}

						.num {
							position: absolute;
							top: 0;
							bottom: 0;
							width: 100%;
							color: #FFF;
							font-size: 24rem;
							font-weight: 700;
							display: flex;
							justify-content: center;
							align-items: center;
						}
					}

					.number-item {
						width: 33rem;
						height: 33rem;
						border-radius: 50%;
						border: 2rem solid #9FA5AC;
						display: flex;
						align-items: center;
						justify-content: center;
						margin-left: 2rem;

						span {
							color: #252529;
							font-weight: 700;
							font-size: 24rem;
						}
					}
				}

				.item-color {
					display: flex;
					align-items: center;
					justify-content: center;
					width: 80rem;

					div {
						width: 10rem;
						height: 10rem;
						border-radius: 50%;
						margin-left: 1rem;
					}

					.color-red {
						background: #BB1212;
					}

					.color-green {
						background: #18972c;
					}

					.color-violet {
						background: #4e00b1;
					}
				}

				&:nth-child(2n) {
					background: #e9ecf5;
				}
			}
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

::-webkit-scrollbar {
	display: none;
}
</style>