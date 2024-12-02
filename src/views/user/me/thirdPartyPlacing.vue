<template>
	<x-page no-footer :fixed="false">
		<template #title>{{ $t('me.casinoBets') }}</template>
		<!-- tab -->
		<template #top>
			<div class="tabs-comtent">
				<div class="tabs-type">
					<div style="width: 100%;overflow-x: auto;">
						<div class="type-list">
							<template v-for="(item, index) in conf.navList" :key="index">
								<div class="type-item" :class="{ 'type-active': item.type == conf.typeIndex }"
									@click="conf.handleChangeTab(item, index)">
									{{ item.name }}
								</div>
							</template>
						</div>
					</div>
				</div>
				<div class="tabs-times">
					<template v-for="(item, index) in conf.timesList" :key="index">
						<div class="time-item" :class="{ 'time-active': item.value == conf.timeIndex }"
							@click="conf.handleChangeTime(item, index)">
							{{ item.label }}
						</div>
					</template>
				</div>
			</div>
		</template>
		<!-- center -->
		<div style="width: 100%;height: 100%;">
			<div class="result-list">
				<div style="height: 24rem;"></div>
				<template v-for="(item, index) in conf.resultList" :key="index">
					<div class="result-ltem">
						<div class="result-title">
							<div class="title-left">
								<div class="title-type">
									<div class="title-skew"></div>
									<div class="type-text">{{ 'AG' }}</div>
								</div>
								<div class="title-code">{{ item.dsfCenterBetId }}</div>
							</div>
						</div>
						<!-- content -->
						<div class="result-content2">
							<div class="singe-line">
								<div class="left-div">
									<img src="/static/img/three-gameName.png" class="left-img" />
									{{ 'GameName' }}：
								</div>
								<div class="right-div">{{ item.gameName }}</div>
							</div>
							<div class="singe-line" v-if="item.platformApiCode">
								<div class="left-div">
									<img src="/static/img/three-apiCode.png" class="left-img" />

									{{ 'PlatformApiCode' }}：
								</div>
								<div class="right-div">{{ item.platformApiCode }}</div>
							</div>
							<div class="singe-line">
								<div class="left-div">
									<img src="/static/img/bet-money.png" class="left-img" />
									{{ 'BetAccount' }}：
								</div>
								<div class="right-div">{{ item.betAmount + ' ' + item.betCoin }}</div>
							</div>
							<div class="singe-line">
								<div class="left-div">
									<img src="/static/img/three-account.png" class="left-img" />
									{{ 'Account' }}：
								</div>
								<div class="right-div">{{ item.playerAccount || item.playerId }}</div>
							</div>
							<div class="singe-line">
								<div class="left-div">
									<img src="/static/img/three-home.png" class="left-img" />
									{{ 'RoomNumber' }}：
								</div>
								<div class="right-div">{{ item.tableName }}</div>
							</div>
							<div class="singe-line">
								<div class="left-div">
									<img src="/static/img/three-time.png" class="left-img" />
									{{ 'GameTime' }}：
								</div>
								<div class="right-div">{{ item.gameTime }}</div>
							</div>
						</div>
					</div>
				</template>
				<div v-if="conf.resultList.length > 0">
					<div class="more" v-if="conf.showMore">
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
	</x-page>
</template>

<script setup lang="ts">
import { apis } from '@/api';
import i18n from '@/lang';
import sutil from '@/sstore/sutil';
import { svalue } from '@/sstore/svalue';
import { onMounted, reactive } from 'vue';

const conf = reactive({
	navList: [{
		img: 'static/img/home/Live.png',
		name: i18n.t('home.live'),
		url: '/user/casino/index?type=Live',
		type: 'Live',
		// type: 'CASINO',
	},
	{
		img: 'static/img/home/Game.png',
		name: i18n.t('home.games'),
		url: '/user/casino/index?type=Games',
		type: 'Games',
		// type: 'SLOTS',
	},
	{
		img: 'static/img/home/Sports.png',
		name: i18n.t('home.chess'),
		url: '/user/casino/index?type=Chess',
		type: 'Chess'
	},
	{
		img: 'static/img/home/Sports.png',
		name: i18n.t('home.fish'),
		url: '/user/casino/index?type=Fishing',
		type: 'Fishing'
	}
		// {
		// 	img: 'static/img/home/Sports.png',
		// 	name: i18n.t('home.sports'),
		// 	url: '/user/sports/index',
		// 	type: 'Sports'
		// },

		// {
		// 	img: 'static/img/home/scratchOff.png',
		// 	name: i18n.t('home.scratch'),
		// 	url: '/user/scratch/scratch',
		// 	type: 'scratch',
		// 	// type: 'SCRATCH',
		// }
	],
	timesList: [
		{
			value: 'today',
			label: i18n.t('invite.Today'),
		},
		{
			value: 'yesterday',
			label: i18n.t('invite.Yesterday'),
		},
		{
			value: 'sevenDays',
			label: i18n.t('invite.LastDays'),
		}
	],
	timeIndex: 'today',
	resultList: [] as any[],
	typeIndex: 'Live',
	coinCode: '',
	scrollHeight: 600,
	endTime: 0 as any,
	startTime: 0 as any,
	current: 1,
	size: 10,
	total: 0,
	showMore: false,
	//获取三方注单列表数据
	getLotteryResult(type: any) {
		apis.userBetRecord({
			coinCode: conf.coinCode,
			gameTypeCode: type,
			current: conf.current,
			size: conf.size,
			startTime: conf.startTime,
			endTime: conf.endTime,
			success: (res: any) => {
				let data = res.data.records
				conf.resultList = [...conf.resultList, ...data]
				conf.total = res.data.total
				if (conf.size * conf.current < conf.total) {
					conf.showMore = true
				} else {
					conf.showMore = false
				}
			}
		});
	},
	moreMessage() {
		if (conf.size * conf.current >= conf.total) return conf.showMore = false
		conf.current++;
		conf.getLotteryResult(conf.typeIndex)
	},
	//tab 点击 
	handleChangeTab(val: any, i: any) {
		conf.typeIndex = val.type
		conf.resultList = []
		conf.getLotteryResult(conf.typeIndex)
	},

	handleChangeTime(val: any, index: any) {
		conf.timeIndex = val.value
		let timeObj = sutil.getTimeRanges(conf.timeIndex)
		conf.startTime = timeObj.daystart
		conf.endTime = timeObj.daysEnd
		conf.getLotteryResult(conf.typeIndex)
	}
})
onMounted(async () => {
	//获取默认钱包币种
	let coinlist = await svalue.getCoinlist()
	let coin = coinlist.find(v => v.isDefault)
	let timeObj = sutil.getTimeRanges('today')
	conf.startTime = timeObj.daystart
	conf.endTime = timeObj.daysEnd
	conf.coinCode = coin.coinCode
	conf.getLotteryResult(conf.typeIndex)
})
</script>

<style lang="less" scoped>
.tabs-comtent {
	height: 224rem;
	background: #FFF;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	padding: 32rem 60rem;
	width: 100%;

	.tabs-type {
		display: flex;

		.type-list {
			display: flex;
			height: 60rem;
			// background: #FFF6E6;
			color: #000000;
			font-weight: bold;
			border-radius: 10rem;

			.type-item {
				background: #FFF6E6;
				// width: 148rem;
				width: 220rem;
				display: flex;
				align-items: center;
				justify-content: center;
			}

			.type-active {
				border-radius: 10rem;
				background: #FFA64F;
				color: #fff;
			}
		}
	}

	.tabs-times {
		display: flex;
		justify-content: space-between;

		.time-item {
			text-align: center;
			color: #00000090;
			font-weight: bold;
			background: #F9F9F9;
			border-radius: 10rem;
			height: 56rem;
			line-height: 56rem;
			width: 180rem;

			&:first-of-type {
				margin-left: 0rem;
			}
		}

		.time-active {
			background: #FFF6E6;
		}
	}
}

.result-list {
	.result-ltem {
		padding: 50rem;
		background: #FFF;
		margin-bottom: 24rem;
		border-radius: 16rem;

		.result-title {
			display: flex;
			align-items: center;
			justify-content: space-between;

			.title-left {
				display: flex;
				align-items: center;

				.title-type {
					position: relative;
					width: 156rem;
					height: 46rem;
					border-radius: 10rem;
					box-sizing: border-box;
					// overflow: hidden;

					.title-skew {
						// background: #3C80F5;
						background: linear-gradient(to right, #FD2F3D, #FF7D54);
						position: absolute;
						top: 0;
						bottom: 0;
						left: 0;
						right: 0;
						border-radius: 8rem;
						transform: skew(-20deg);

						&.Prize {
							background: #E20000;
						}

						&.Losing {
							background: #FDAB45;
						}

						&.Cancelled {
							background: #5C6381;
						}
					}

					.type-text {
						position: absolute;
						top: 0;
						bottom: 0;
						left: 0;
						right: 0;
						display: flex;
						align-items: center;
						justify-content: center;
						color: #FFF;
						font-size: 24rem;
						font-weight: 600;
					}
				}

				.title-code {
					margin-left: 30rem;
					color: #000;
					font-size: 30rem;
					font-weight: 600;
				}
			}

			.title-right {
				.purchase-bg {
					padding: 0rem 12rem;
					height: 40rem;
					background: red;
					display: flex;
					align-items: center;
					justify-content: center;
					font-size: 20rem;
					color: #FFF;
					border-radius: 5rem;
				}

				.purchase {
					width: 42rem;
					height: 42rem;
				}

				.purchase-triple {
					text-align: center;

					.purchase-img {
						width: 30rem;
						height: 30rem;
					}
				}

				.purchase-num {
					width: 40rem;
					height: 40rem;
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
						align-items: center;
						justify-content: center;
						font-size: 20rem;
					}
				}
			}
		}

		.result-content {
			display: flex;

			.singe-line {
				display: flex;
				color: #3A3A3A;
				font-size: 24rem;
				font-weight: 500;
				margin-top: 24rem;
				width: 100%;

				.left-div {
					display: flex;
					align-items: start;
					max-width: 30%;

					.left-img {
						width: 25rem;
						height: 25rem;
						margin-right: 8rem;
						margin-top: 6rem;
					}
				}

				.right-div {
					max-width: 70% !important;
					word-wrap: break-word;
				}
			}

			.left-content,
			.right-content {
				width: 50%;
			}

			// .right-content {
			// 	display: flex;
			// 	justify-content: center;
			// }

			.content-item {
				display: flex;
				align-items: center;

				// margin-top: 24rem;
				.content-img {
					width: 25rem;
					height: 22rem;
				}

				.content {
					color: #3A3A3A;
					font-size: 24rem;
					font-weight: 500;
					margin-left: 8rem;
					display: flex;
					justify-content: center;
					// align-items: center;

					.purchase {
						width: 30rem;
						height: 30rem;
					}

					.purchase-triple {
						text-align: center;

						.purchase-img {
							width: 30rem;
							height: 30rem;
						}
					}

					.purchase-num {
						width: 30rem;
						height: 30rem;
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
							align-items: center;
							justify-content: center;
							font-size: 20rem;
						}
					}
				}

				.content-img-item {
					width: 25rem;
					height: 25rem;
					position: relative;
					margin-top: -10rem;

					img {
						position: absolute;
						top: 0;
						left: 0;
						width: 100%;
						height: 100%;
					}

					.img-num {
						position: absolute;
						top: 0;
						bottom: 0;
						right: 0;
						left: 0;
						color: #000;
						font-size: 18rem;
						display: flex;
						align-items: center;
						justify-content: center;
					}

					.border {
						background: url('../../static/img/bet-numbers.png') no-repeat center;
						background-size: 100%;
						width: 25rem;
						height: 25rem;
						line-height: 27rem;
						position: initial;
						box-sizing: border-box;
						color: #999;
						font-size: 14rem;
					}
				}
			}

			.content-line {
				display: flex;
				align-items: center;
				justify-content: space-between;

			}
		}

		// &:first-of-type{
		// 	border-radius: 0px 0px 16rem 16rem;
		// }
	}

	.more {
		background: #FFF;
		padding: 24rem;

		.more-btn {
			box-shadow: rgba(0, 0, 0, 0.1) 0px 8rem 8rem;
			border-radius: 16rem;
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
		padding: 0rem 0rem 36rem;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 24rem;
		color: #707070;
	}
}

.result-content2 {
	.singe-line {
		display: flex;
		color: #3A3A3A;
		font-size: 24rem;
		font-weight: 500;
		margin-top: 24rem;
		width: 100%;

		.left-div {
			display: flex;
			align-items: center;
			// max-width: 30%;

			.left-img {
				width: 25rem;
				height: 25rem;
				margin-right: 8rem;
				margin-top: 6rem;
			}
		}

		.right-div {
			max-width: 70% !important;
			word-wrap: break-word;
		}
	}

	.content-item {
		display: flex;
		align-items: center;
		margin-top: 24rem;
		position: relative;

		.content-img {
			width: 25rem;
			height: 22rem;
		}

		.content {
			color: #3A3A3A;
			font-size: 24rem;
			font-weight: 500;
			margin-left: 8rem;
			display: flex;
			align-items: center;
		}

		.img-num {
			width: 25rem;
			height: 25rem;
		}

		.open-code {
			position: absolute;
			top: 4rem;
			left: 0;
			width: 25rem;
			font-size: 18rem;
			text-align: center;
			color: #000;
		}

		.border {
			background: url('../../static/img/bet-numbers.png') no-repeat center;
			background-size: 100%;
			width: 25rem;
			height: 25rem;
			line-height: 27rem;
			position: initial;
			box-sizing: border-box;
			color: #999;
			font-size: 14rem;
		}
	}


	.content-line {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
}
</style>