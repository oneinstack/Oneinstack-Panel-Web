<template>
	<x-page :no-footer="true" :headerBgColor="'#EE7331'">
		<template #title>
			{{ $t('point.pointsMall') }}
		</template>
		<div class="head">
			<div class="head-content">
				<notice :integralNum="conf.integralNum" v-if="conf.integralNum" />
				<div class="user">
					<div class="user-info">
						<div class="user-head">
							<img class="head-img" :src="conf.userInfo.userImgUrl"
								v-if="conf.userInfo && conf.userInfo.userImgUrl" />
							<img class="head-img" src="/static/img/default-header.png" v-else />
						</div>
						<div class="user-name">{{ conf.userInfo.userNickname || conf.userInfo.userName }}</div>
						<img mode="widthFix" class="vip-img" :src="`/static/img/VIP/v${conf.userVipLevel}.png`" />
					</div>
					<img class="hand-img" src="/static/img/point/hand.png" />
				</div>
				<div class="head-point">
					<div class="top-info">
						<div>
							<div class="point-title">
								<img class="left-img" src="/static/img/point/money-img.png" />
								<div class="left-name">{{ $t('point.myPoints') }}</div>
							</div>
							<div class="total">
								<span style="margin-right: 8rem" v-if="!conf.totalLading">{{ conf.integralNum }}</span>
								<loading v-else :type="3"></loading>
							</div>
						</div>
						<div class="info-right">
							<div class="right-rules" @click="conf.goPage('/user/point/rules')">
								<div class="rules">{{ $t('point.pointsRules') }}</div>
								<img class="right-arrow-img" src="/static/img/point/right-arrow.png" />
							</div>
							<div>
								<div class="win" @click="sutil.pageBack()">{{ $t('point.winPoints') }}</div>
							</div>
						</div>
					</div>
					<div class="footer-type">
						<div class="see-type" @click="conf.goPage('/user/point/record')">
							<img class="see-img" src="/static/img/point/point-record.png" />
							<div class="see-name">{{ $t('point.pointRecord') }}</div>
						</div>
						<div class="line"></div>
						<div class="see-type" @click="conf.goPage('/user/point/exchange')">
							<img class="see-img" src="/static/img/point/exchange-record.png" />
							<div class="see-name">{{ $t('point.exchangeRecord') }}</div>
						</div>
					</div>
				</div>
				<img class="five-pointed-img" src="/static/img/point/five-pointed.png" />
			</div>
		</div>
		<div class="point-type">
			<template v-for="(item, index) in conf.typeList" :key="index">
				<div class="type-item" :class="{ 'type-active': conf.typeId == item.id }"
					@click="conf.changeType(item.id)">
					<span style="z-index: 5;position: relative;">{{ item.name }}</span>
				</div>
			</template>
		</div>
		<div class="point-list">
			<template v-for="(item, index) in conf.pointList" :key="index">
				<div class="point-item" :style="{ width: conf.pointItemW + 'px' }">
					<div class="point-top">
						<img class="point-img" mode="heightFix" :src="item.url" v-if="conf.getImgUrl(item.url)" />
						<img class="point-img" mode="heightFix" :src="`/static/img/point/${item.url}.png`" v-else />
					</div>
					<div class="name">{{ item.rewardName }}</div>
					<div class="line">
						<div class="left-around"></div>
						<div class="centre"></div>
						<div class="left-around right"></div>
					</div>
					<div class="footer">
						<div class="left">
							<div class="left-point">
								<img class="money-img" src="/static/img/point/money-img.png" />
								<div class="point-num">{{ conf.getNum(item.integral) }}</div>
							</div>
							<div class="num">{{ $t('point.exchanged') }}:{{ sutil.dataHandling(item.exchangeNums, 2) }}
							</div>
						</div>
						<div class="right-btn" :class="{ 'disabled': !conf.showExchange }"
							@click.stop="conf.integralExchange(item, index)">{{ $t('point.exchange') }}</div>
					</div>
				</div>
			</template>
			<div v-if="conf.pointList.length % 2 != 0" :style="{ width: conf.pointItemW + 'px' }"
				style="height: 380rem;"></div>
		</div>
		<div :style="{ 'margin-top': conf.loading && conf.pointList.length > 0 ? '-80rem' : '-40rem' }">
			<loading v-if="conf.loading" />
		</div>
		<x-no-data v-if="!conf.loading && conf.pointList.length == 0"></x-no-data>
		<change-pop ref="changeRef" @submit="conf.submit"></change-pop>
	</x-page>
</template>

<script setup lang="ts">
import loading from '../tasks/components/loading.vue'
import notice from './components/notice.vue'
import changePop from './components/changePop.vue'
import { sconfig } from '@/sstore/sconfig'
import { svalue } from '@/sstore/svalue'
import { onMounted, reactive, ref } from 'vue'
import i18n from '@/lang'
import { apis } from '@/api'
import System from '@/utils/System'
import sutil from '@/sstore/sutil'
import { Scope } from 'tools-vue3'
import { EPage } from '@/enum/Enum'

const changeRef = ref<any>()
const conf = reactive({
	pointList: [] as any[],
	typeList: [{ name: i18n.t('point.all'), id: '1,2,3' }, { name: i18n.t('point.luckyBox'), id: '2' }, { name: i18n.t('point.cash'), id: '1' }, { name: i18n.t('point.scratch'), id: '3' }],
	typeId: '1,2,3',
	pointItemW: 100,
	loading: false,
	pageNum: 1,
	pageSize: 10,
	total: 0,
	integralNum: 0,
	userInfo: { userNickname: '' } as any,
	totalLading: false,
	showMall: true,
	showExchange: false,
	exchangeIndex: 0,
	userVipLevel: 0,
	changeType(id: any) {
		conf.typeId = id
		conf.pointList = []
		conf.pageNum = 1
		conf.getIntegralExchangeList()
	},
	getIntegralExchangeList(load = true) {
		if (!conf.showMall) return  // 积分商城未开启
		conf.loading = load
		apis.getIntegralExchangeList({
			rewardType: conf.typeId,
			current: conf.pageNum,
			size: conf.pageSize,
			success: (res: any) => {
				conf.pointList = [...conf.pointList, ...res.data.records]
				conf.total = res.data.total || 0
			},
			complete: () => {
				conf.loading = false
			}
		});
	},
	moreMessage() {
		if (conf.pageSize * conf.pageNum >= conf.total) {
			return
		}
		conf.pageNum++
		conf.getIntegralExchangeList()
	},
	integralExchange(item: any, index: number) {
		if (!conf.showExchange) {
			System.toast(i18n.t('point.noExchanging'))
			return
		}
		conf.exchangeIndex = index
		changeRef.value?.showPop({
			vipLevel: item.vipLevel,
			url: item.url,
			userVipLevel: conf.userVipLevel,
			show: true
		})
	},
	submit(e: any) {
		System.loading()
		let item = conf.pointList[conf.exchangeIndex]
		apis.integralExchange({
			configId: item.configId,
			count: e,
			success: (res: any) => {
				if (res.code == 200) {
					System.toast(i18n.t('point.exchangeSuccess'), 'success')
					conf.pointList[conf.exchangeIndex].exchangeNums = conf.pointList[conf.exchangeIndex].exchangeNums + e
					let num = conf.integralNum - parseFloat(item.integral) * e
					conf.integralNum = num
				} else {
					conf.changeType(conf.typeId)
				}
			},
			final: () => {
				System.loading(false)
			}
		});
	},
	goPage(url: any) {
		System.router.push(url)
	},
	getNum(num: any) {
		if (num == '') return '-'
		return parseInt(num)
	},
	userGradedInfo(load = true) {
		conf.totalLading = load
		apis.userGradedInfo({
			data: {},
			success: (res: any) => {
				let pointNum = res.data.integral
				conf.integralNum = parseInt(pointNum)
				conf.userVipLevel = res.data.userVipLevel
			},
			final: () => {
				conf.totalLading = false
			}
		});
	},
	getImgUrl(url: any) {
		if (!url) return false
		if (url.indexOf('http') != -1) {
			return true
		}
		return false
	},
})
onMounted(async () => {
	conf.userInfo = sconfig.userInfo
	conf.userGradedInfo()
	let windowWidth = window.innerWidth
	let mianW = windowWidth > 500 ? 500 : windowWidth
	conf.pointItemW = (mianW - 30) / 2

	const config = await svalue.getAppConfiguration(true)
	// conf.showMall = config.activity_points_mall // 是否开启积分商城
	conf.showExchange = config.activity_points_mall_exchange // 兑换按钮是否可点击
	conf.getIntegralExchangeList()
})
const event = Scope.Event()
event.on(EPage.scrollBottom, () => {
	conf.moreMessage()
})
</script>


<style lang="less" scoped>
.head {
	position: relative;
	top: -2rem;
	background: linear-gradient(180.23deg, #EE7331 0.2%, rgba(246, 135, 64, 0.99) 51.49%, rgba(255, 166, 79, 0) 90%);
}

.head-content {
	padding: 20rem;
	font-size: 28rem;

	.user {
		display: flex;
		justify-content: space-between;
		align-items: center;

		.user-info {
			display: flex;
			align-items: center;

			.user-head {
				width: 100rem;
				height: 100rem;
				border-radius: 50%;
				overflow: hidden;
				background: #fff;
			}

			.head-img {
				width: 100rem;
				height: 100rem;
			}

			.user-name {
				color: #fff;
				margin-left: 20rem;
				font-size: 32rem;
			}

			.vip-img {
				width: 64rem;
				margin-left: 20rem;
			}
		}

		.hand-img {
			width: 200rem;
			height: 140rem;
		}
	}

	.head-point {
		margin-top: 10rem;
		backdrop-filter: blur(4px);
		padding: 30rem;
		border-radius: 10rem;
		background-size: 100% 100%;
		background-image: url('/static/img/point/point-bg.png');
		font-size: 28rem;

		.top-info {
			display: flex;
			justify-content: space-between;
			align-items: center;
			border-bottom: 1px solid #FFD5BA;
			padding-bottom: 20rem;

			.point-title {
				display: flex;
				align-items: center;

				.left-img {
					width: 45rem;
					height: 45rem;
				}

				.left-name {
					color: #fff;
					font-size: 28rem;
					margin-left: 15rem;
				}
			}

			.total {
				font-size: 42rem;
				color: #000;
				font-weight: 800;
				margin-top: 20rem;
				display: flex;
				align-items: center;
			}

			.info-right {
				display: flex;
				flex-direction: column;
				align-items: center;
			}

			.right-rules {
				display: flex;
				align-items: center;

				.rules {
					font-size: 28rem;
					color: #fff;
				}

				.right-arrow-img {
					width: 10rem;
					height: 18rem;
					margin-left: 10rem;
				}
			}

			.win {
				background: linear-gradient(180deg, #FFFFFF 0%, #FFD2B4 100%);
				color: #FC9B01;
				padding: 8rem 15rem;
				font-size: 25rem;
				border-radius: 20rem;
				margin-top: 15rem;
				text-align: center;
			}
		}

		.footer-type {
			display: flex;
			margin-top: 20rem;
			align-items: center;
			justify-content: space-between;
			padding: 0 6rem;

			.see-type {
				// flex: 1;
				display: flex;
				align-items: center;

				.see-img {
					width: 70rem;
					height: 70rem;
					flex-shrink: 0;
				}

				.see-name {
					color: #A23D00;
					font-size: 28rem;
					margin-left: 20rem;
				}
			}

			.line {
				width: 1rem;
				height: 40rem;
				background: #FFD5BA;
				margin: 0 10rem;
			}
		}
	}
}

.five-pointed-img {
	width: 140rem;
	height: 140rem;
	position: absolute;
	bottom: 295rem;
	left: calc(50% - 70rem);
}

.point-type {
	display: flex;
	align-items: center;
	margin-bottom: 20rem;
	padding: 0 20rem;
	font-size: 28rem;

	.type-item {
		margin-right: 30rem;
		color: #999;
	}

	.type-active {
		color: #000;
		font-size: 32rem;
		position: relative;
		z-index: 1;

		&::before {
			content: '';
			position: absolute;
			left: 2rem;
			right: -2rem;
			bottom: 12rem;
			background: linear-gradient(328.56deg, #FF7502 18.81%, #FC9B01 77.66%);
			height: 2px;
			z-index: 1;
			border-radius: 1px;
		}
	}
}

.point-list {
	column-count: 2;
	column-gap: 20rem;
	padding: 0rem 20rem 20rem;
	font-size: 28rem;

	.point-item {
		background: #fff;
		border-radius: 10rem;
		width: 350rem;
		margin-bottom: 20rem;
		text-align: center;
		padding-top: 20rem;
		position: relative;

		.point-top {
			width: 100%;
			height: 180rem;
		}

		.point-img {
			height: 180rem;
			text-align: center;
		}

		.name {
			color: #000;
			text-align: left;
			padding-left: 20rem;
			padding-bottom: 30rem;
			margin-top: 10rem;
		}

		&:nth-child(2n + 1) {
			margin-right: 2%;
		}

		.line {
			display: flex;
			position: relative;
			align-items: center;

			.left-around {
				width: 10px;
				height: 18rem;
				background: #eff1f5;
				border-radius: 18rem;
				margin-left: -10rem;
				position: absolute;

				&.right {
					right: -10rem;
				}
			}

			.centre {
				border: 1px dashed #EFEFEF;
				flex: 1;
			}
		}

		.footer {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 20rem 10rem;

			.left {
				.left-point {
					display: flex;
					align-items: center;

					.money-img {
						width: 30rem;
						height: 30rem;
					}

					.point-num {
						color: #FC9B01;
						margin-left: 10rem;
					}
				}

				.num {
					font-size: 24rem;
					color: #999;
					text-align: left;
				}
			}

			.right-btn {
				color: #FF7502;
				background: #fff2e9;
				font-size: 24rem;
				padding: 5rem 15rem;
				border-radius: 20rem;
			}

			.disabled {
				filter: grayscale(1);
			}
		}
	}

}
</style>
