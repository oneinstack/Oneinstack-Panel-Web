<template>
	<div class="task-list">
		<template v-for="(item, index) in taskList" :key="index">
			<div class="task-item flex-between" @click="conf.handleIntoDetail(item)">
				<div class="task-left">
					<div class="left-img">
						<img mode="widthFix" class="vip-img"
							:src="`/static/img/VIP/v${conf.getLevel(item.userLevel)}.svg`" />
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
					<div class="collect-btn" :class="{ claimed: item.isReceive }">
						{{ item.isReceive ? $t('task.claimed') : $t('point.collect') }}
					</div>
				</div>
				<!-- <div class="task-right" v-else>
					<div class="right-line">
						<div class="get-line-100" style="width: 100%;"></div>
					</div>
					<div class="num-100">100%</div>
				</div> -->
				<!-- 0-现金、1-宝箱 -->
				<div class="task-money" v-if="item.rewardType">
					<template v-for="(b, i2) in conf.getBoxTypeNum(item.reward)" :key="b.id">
						<img class="task-coin-img" :src="`/static/img/point/box${b.boxType}.png`" />
						<span style="margin-right: 10rem;">+{{ b.count }}</span>
					</template>
					<!-- <span>{{$t('task.DEposit')+' '+ defalutWallet.coinSymbol + dataHandling(item.deposit)}}</span> -->
				</div>
				<div class="task-money" v-else>
					<div class="task-coin flex-center">{{ defalutWallet.coinSymbol }}</div>
					<span>+{{ defalutWallet.coinSymbol + sutil.dataHandling(parseInt(item.reward)) }}</span>
					<!-- <span style="margin-left: 20rem;">{{$t('task.DEposit')+' '+ defalutWallet.coinSymbol + dataHandling(item.deposit)}}</span> -->
				</div>
				<div class="right-top" v-if="item.isReceive">
					<img class="state-img" src="/static/img/task/task-1.png" />
				</div>
				<div class="right-top" v-else-if="conf.getDeposit(item.deposit)">
					<img class="state-img" src="/static/theme/blue/task-deposit.webp" />
				</div>
			</div>
		</template>
		<!-- <div class="task-right">
			<div class="right-line">
				<div class="get-line" style="width: 70%;"></div>
			</div>
			<div class="num">70%</div>
		</div> -->
	</div>
</template>

<script setup lang="ts">
import sutil from '@/sstore/sutil';
import System from '@/utils/System';
import { reactive } from 'vue';

const props = defineProps({
	taskList: {
		default: [] as any[]
	},
	defalutWallet: {
		default: {} as any
	}
})
const conf = reactive({
	// 获取vip多个等级时取最小的
	getLevel(num:any) {
		if (!num) return 0
		let arr = num.split(',')
		arr.sort((a:any, b:any) => {
			return a - b
		})
		return arr[0]
	},
	getDeposit(num:any) {
		if (!num) return false
		return parseFloat(num)
	},
	//进入详情页
	handleIntoDetail(obj:any) {
		obj.taskDesc = obj.taskDesc.replace(/&/g, '%26')
		let deposit:any = this.getDeposit(obj.deposit)
		if (deposit > 0) {
			deposit = props.defalutWallet.coinSymbol + deposit
		} else {
			deposit = ''
		}
		System.router.push({ path: '/user/tasks/taskDetail', query: { id: obj.id,taskDesc: obj.taskDesc,deposit} })
	},
	getBoxTypeNum(reward:any) {
		if (!reward) return 1
		let arr = JSON.parse(reward)
		return arr
	}
})
</script>

<style lang="less" scoped>
.flex-center {
	display: flex;
	align-items: center;
	justify-content: center;
}

.flex-between {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.items-center {
	display: flex;
	align-items: center;
}

.task-list {
	// margin-top: 20rem;
	padding-bottom: 20rem;

	.task-item {
		background: #fff;
		border-radius: 12rem;
		margin-top: 20rem;
		padding: 20rem;
		position: relative;
		overflow: hidden;

		.task-left {
			display: flex;
			align-items: center;

			.left-img {
				width: 140rem;
				height: 140rem;
				position: relative;

				.task-img {
					width: 100%;
					height: 100%;
					border-radius: 16rem;
				}

				.vip-img {
					width: 65rem;
					// height: 32rem;
					position: absolute;
					top: -18rem;
					left: -18rem;
					z-index: 1;
				}
			}

			.left-info {
				padding: 5rem 12rem;
				display: flex;
				flex-direction: column;
				justify-content: space-between;
				height: 136rem;

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

			.collect-btn {
				padding: 8rem 24rem;
				color: #006FFF;
				background: #E6F2FF;
				border-radius: 24rem;
				font-size: 25rem;
			}

			.claimed {
				color: #fff;
				background-color: rgb(220, 220, 220);
			}

			.right-line {
				height: 12rem;
				width: 100rem;
				background: #f0f0f0;
				border-radius: 6rem;
				overflow: hidden;
				margin-right: 15rem;

				.get-line {
					background: linear-gradient(88.87deg, #FFA14D 17.77%, #FF6C2C 81.21%);
					height: 100%;
				}

				.get-line-100 {
					background: linear-gradient(88.87deg, #67E16B 17.77%, #22CD28 81.21%);
					height: 100%;
				}
			}

			.num {
				font-size: 24rem;
				color: #FF7502;
			}

			.num-100 {
				font-size: 24rem;
				color: #6EE372;
			}
		}

		.task-money {
			position: absolute;
			bottom: 25rem;
			left: 170rem;
			z-index: 1;
			display: flex;
			align-items: center;

			.task-coin-img {
				width: 40rem;
				height: 40rem;
			}

			.task-coin {
				width: 40rem;
				height: 40rem;
				background-size: 100% 100%;
				background-image: url('/static/img/coin-task.png');
				color: #faa54b;
				font-size: 19rem;
			}

			span {
				color: #006FFF;
				font-size: 24rem;
			}
		}

		.right-top {
			position: absolute;
			right: -40rem;
			top: -40rem;
			width: 80rem;
			height: 80rem;
			background: #E6F2FF;
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
