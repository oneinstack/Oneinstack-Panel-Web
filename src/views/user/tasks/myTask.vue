<template>
	<x-page :no-footer="true" :fixed="false" :bgcolor="'#F1F1F1'">
		<template #title>
			{{ $t('task.mytask') }}
		</template>
		<template #top>
			<div class="type-nav">
				<div class="type-list">
					<template v-for="(item, index) in conf.typeList" :key="index">
						<div class="type-item" :class="{ 'type-active': conf.navIndex == index }"
							@click="conf.changeType(index, item)">
							{{ item.name }}</div>
					</template>
				</div>
				<div class="trend-line"
					:style="{ width: `${conf.navLeft}px`, transform: `translateX(${conf.navIndex * conf.navLeft}px)`, 'transition-duration': '0.2s' }">
				</div>
			</div>
		</template>
		<div class="task-list" style="flex: 1;overflow-y: hidden;" v-if="conf.defalutWallet">
			<div style="height: 100%;overflow-y: scroll;" @scroll="conf.moreMessage">
				<template v-for="(item, index) in conf.taskList" :key="index">
					<div class="task-item">
						<div class="task-left">
							<div class="left-img">
								<img mode="widthFix" class="vip-img"
									:src="`/static/img/VIP/v${conf.getLevel(item.userLevel)}.png`" />
								<img class="task-img" :src="item.img" />
							</div>
							<div class="left-info">
								<div class="info-name">
									<div class="task-name">{{ item.title }}</div>
									<div class="task-tips">{{ item.brief }}</div>
								</div>
							</div>
						</div>
						<div class="task-right">
							<div class="right-line">
								<div :class="'get-line-' + item.userTaskStatus"
									:style="{ 'width': conf.getProgress(item) + '%' }"></div>
							</div>
							<div :class="'num-' + item.userTaskStatus">{{ conf.getProgress(item) }}%</div>
						</div>
						<!-- 0-现金、1-宝箱 -->
						<div class="task-money" v-if="item.rewardType">
							<div style="display: flex;align-items: center;">
								<template v-for="(b, i2) in conf.getBoxTypeNum(item.reward)" :key="b.id">
									<div style="display: flex;align-items: center;">
										<img class="task-coin-img" :src="`/static/img/point/box${b.boxType}.png`" />
										<span style="margin-right: 10rem;">+{{ b.count }}</span>
									</div>
								</template>
							</div>
							<!-- <img class="clock-img" src="/static/img/task/task-clock.png" /> -->
							<div class="time">{{ sutil.getTimeFormat(item.pickupTime) }}</div>
						</div>
						<div class="task-money" v-else>
							<div style="display: flex;align-items: center;">
								<div class="task-coin">{{ conf.defalutWallet.coinSymbol }}</div>
								<span>+{{ conf.defalutWallet.coinSymbol + sutil.dataHandling(parseInt(item.reward))
									}}</span>
							</div>
							<!-- <img class="clock-img" src="/static/img/task/task-clock.png" /> -->
							<div class="time">{{ sutil.getTimeFormat(item.pickupTime) }}</div>
						</div>
						<div class="right-top">
							<img class="state-img" :src="`/static/img/task/task-${item.userTaskStatus}.png`" />
						</div>
					</div>
				</template>
				<div :style="{ 'margin-top': conf.loading && conf.taskList.length > 0 ? '-80rem' : '0rem' }">
					<loading v-if="conf.loading"></loading>
				</div>
				<x-no-data v-if="!conf.loading && conf.taskList.length == 0"></x-no-data>
			</div>
		</div>
	</x-page>
</template>

<script setup lang="ts">
import { onMounted, reactive } from 'vue';
import loading from './components/loading.vue'
import { svalue } from '@/sstore/svalue';
import i18n from '@/lang';
import { apis } from '@/api';
import sutil from '@/sstore/sutil';
const conf = reactive({
	typeList: [{ name: i18n.t('point.all'), id: '' }, { name: i18n.t('task.ongoing'), id: '0' }, { name: i18n.t('task.failed'), id: '-1' }, { name: i18n.t('task.finished'), id: '1' }],
	navLeft: 40,
	navIndex: 0,
	taskList: [] as any[],
	defalutWallet: null as any,
	taskType: '',
	serviceHeiht: 300,
	loading: false,
	pageNum: 1,
	pageSize: 10,
	total: 0,
	changeType(index: number, item: any) {
		conf.navIndex = index
		conf.taskType = item.id
		conf.taskList = []
		conf.pageNum = 1
		conf.total = 0
		conf.getTaskRecord()
	},
	//获取列表
	getTaskRecord(load = true) {
		conf.loading = load
		apis.getUserTaskRecord({
			current: conf.pageNum,
			size: conf.pageSize,
			taskStatus: conf.taskType,
			success: (res: any) => {
				conf.taskList = [...conf.taskList, ...res.data.records]
				conf.total = res.data.total || 0
			},
			complete: () => {
				conf.loading = false
			}
		});
	},
	moreMessage(event: any) {
		const { scrollTop, clientHeight, scrollHeight } = event.target;
		if (scrollTop + clientHeight >= scrollHeight - 5) { // 5是一个缓冲值，避免提前加载
			if (conf.pageSize * conf.pageNum >= conf.total) return
			conf.pageNum++
			conf.getTaskRecord()
		}
	},
	getLevel(num: any) {
		if (!num) return 0
		let arr = num.split(',')
		arr.sort((a: any, b: any) => {
			return a - b
		})
		return arr[0]
	},
	getProgress(item: any) {
		if (item.userTaskStatus == 2) return 100
		let progress: any = Number(item.taskProgress) //当前进度
		let target = Number(item.taskTarget) //目标进度
		if (target == 0) {
			return 100
		}
		progress = ((progress / target) * 100)?.toFixed(0)
		progress = progress == 'NaN' ? 0 : progress
		return progress
	},
	getBoxTypeNum(reward: any) {
		if (!reward) return []
		let arr = JSON.parse(reward)
		return arr
	}
})
onMounted(async () => {
	let windowWidth = window.innerWidth
	conf.navLeft = windowWidth > 500 ? 500 / 4 : windowWidth / 4
	conf.defalutWallet = await svalue.getDefaultWallet()
	conf.getTaskRecord()
})
</script>

<style lang="less" scoped>
.type-nav {
	background: #FFF;

	.type-list {
		height: 85rem;
		display: flex;
		font-size: 28rem;

		.type-item {
			flex: 1;
			display: flex;
			align-items: center;
			justify-content: center;
			color: #333
		}

		.type-active {
			background: linear-gradient(180deg, #EB602D 0%, #F5843E 52.5%, #FB9948 73%, #FB9948 80.5%, #FFA64F 98.5%);
			background-clip: text;
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
		}
	}

	.trend-line {
		height: 4rem;
		background: linear-gradient(180deg, #EB602D 0%, #F5843E 52.5%, #FB9948 73%, #FB9948 80.5%, #FFA64F 98.5%);
	}
}

.task-list {
	padding: 20rem 20rem 0rem;

	.task-item {
		overflow: hidden;
		background: #fff;
		border-radius: 12rem;
		margin-bottom: 20rem;
		padding: 20rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		position: relative;

		.task-left {
			display: flex;
			align-items: center;

			.left-img {
				width: 145rem;
				height: 145rem;
				position: relative;
				flex-shrink: 0;

				.task-img {
					width: 100%;
					height: 100%;
					border-radius: 16rem;
				}

				.vip-img {
					width: 66rem;
					// height: 32rem;
					position: absolute;
					top: -18rem;
					left: -19rem;
					z-index: 1;
				}
			}

			.left-info {
				padding: 0rem 12rem;
				display: flex;
				flex-direction: column;
				justify-content: space-between;
				height: 143rem;
				position: relative;

				.info-name {
					width: 320rem;

					.task-name {
						color: #000;
						font-weight: 500;
						font-size: 28rem;
						overflow: hidden;
						text-overflow: ellipsis;
						white-space: nowrap;

					}

					.task-tips {
						color: #999;
						font-size: 24rem;
						overflow: hidden;
						text-overflow: ellipsis;
						white-space: nowrap;
						width: 300rem;
					}
				}
			}
		}

		.task-right {
			display: flex;
			align-items: center;
			padding-bottom: 10rem;

			.collect-btn {
				padding: 8rem 24rem;
				color: #FC9B01;
				background: #FFF2E9;
				border-radius: 24rem;
				font-size: 25rem;
			}

			.right-line {
				height: 12rem;
				width: 100rem;
				background: #f0f0f0;
				border-radius: 6rem;
				overflow: hidden;
				margin-right: 15rem;

				.get-line-0 {
					background: linear-gradient(88.87deg, #FFA14D 17.77%, #FF6C2C 81.21%);
					height: 100%;
				}

				.get-line--1 {
					background: linear-gradient(88.87deg, #FE5D5E 17.77%, #FF0C2B 81.21%);
					height: 100%;
				}

				.get-line-1,
				.get-line-2,
				.get-line-3 {
					background: linear-gradient(88.87deg, #67E16B 17.77%, #22CD28 81.21%);
					height: 100%;
				}
			}

			.num-0 {
				font-size: 24rem;
				color: #FF7502;
			}

			.num-1,
			.num-2 {
				font-size: 24rem;
				color: #6EE372;
			}

			.num--1 {
				font-size: 24rem;
				color: #FF0c2b;
			}
		}

		.task-money {
			position: absolute;
			bottom: 15rem;
			left: 175rem;
			z-index: 1;

			// display: flex;
			// align-items: center;
			.task-coin-img {
				width: 40rem;
				height: 40rem;
				flex-shrink: 0;
			}

			.task-coin {
				width: 38rem;
				height: 38rem;
				background-size: 100% 100%;
				background-image: url('/static/img/coin-task.png');
				color: #faa54b;
				font-size: 19rem;
				display: flex;
				justify-content: center;
				align-items: center;
			}

			span {
				color: #FF8E18;
				font-size: 25rem;
			}

			.clock-img {
				width: 32rem;
				height: 32rem;
				margin-left: 20rem;
				flex-shrink: 0;
			}

			.time {
				color: #999;
				font-size: 24rem;
				flex-shrink: 0;
			}
		}

		.right-top {
			position: absolute;
			right: -40rem;
			top: -40rem;
			width: 80rem;
			height: 80rem;
			background: #FFF2E9;
			transform: rotate(45deg);

			.state-img {
				width: 24rem;
				height: 24rem;
				position: absolute;
				left: 30rem;
				top: 52rem;
				transform: rotate(-45deg);
			}
		}
	}

}
</style>
