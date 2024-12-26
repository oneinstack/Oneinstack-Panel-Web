<template>
	<div class="tip-popup" v-if="conf.showTip">
		<div class="tip-box">
			<div class="tip-icon">!</div>
			<div class="tip-content">{{ $t('common.SelectMoney') }}</div>
		</div>
	</div>
	<van-popup class="popup-bottom-center" :show="betShow" position="bottom" borderRadius='16' :round="true" @close="conf.closePopup">
		<div class="popup-content" v-if="!conf.shareOpen">
			<div class="popup-title">
				<div style="width: 10%;">
					<img class="close-img" src="/static/img/close.png" @click="conf.closePopup" />
				</div>
				<div>
					<text>{{ $t('game.bet') }}</text>
				</div>
				<div style="width: 10%;">
					<img v-if="showShare && sconfig.userInfo && svalue.configv1['im_open']" class="share-img"
						style="margin-right: 24rem" src="/static/img/share.png" @click="conf.changeShareOpen"
						:class="{ 'disabled': betShare }" />
				</div>
			</div>
			<div class="bet-type" v-if="betObj && betObj.betImg">
				<div class="bet-type-dice" v-if="betObj.betType == 'dice'">
					<img class="bet-dice-img" :src="'/static/img/' + betObj.betImg" v-if="betObj.betNum == 3" />
					<div class="bet-dice-bottom">
						<img class="bet-dice-img" :src="'/static/img/' + betObj.betImg" />
						<img class="bet-dice-img" :src="'/static/img/' + betObj.betImg" />
					</div>
				</div>
				<div class="bet-type-item" v-else>
					<img class="bet-img" :src="'/static/img/' + betObj.betImg" />
					<div class="bet-num" v-if="betObj.betType == 'point'">{{ betObj.betNum }}</div>
					<div class="bet-num colorStr" v-if="betObj.betType == 'color'">{{ betObj.betNum }}</div>
					<div class="bet-num colorNum" :class="betObj.betNum == 'SMALL' ? 'fonts' : ''"
						v-if="betObj.betType == 'colorNum'">{{ betObj.betNum }}</div>
				</div>
			</div>
			<div class="bet-type" v-else>
				<slot></slot>
			</div>
			<div class="select-box">
				<div class="money">
					<div class="money-title">{{ $t('game.money') }}</div>
					<div class="money-list">
						<div v-for="amount in conf.quickRechargeAmount.list" :key="amount" class="money-item"
							:class="{ 'money-active': conf.num == amount }" @click="conf.num = amount">{{
								conf.coinSymbol }}{{ amount }}
						</div>
						<!-- <div class="money-item" :class="{'money-active': num == 100}" @click="num = 100">{{coinSymbol}}100</div>
							<div class="money-item" :class="{'money-active': num == 500}" @click="num = 500">{{coinSymbol}}500</div>
							<div class="money-item" :class="{'money-active': num == 1000}" @click="num = 1000">{{coinSymbol}}1000</div> -->
					</div>
				</div>
				<div class="input">
					<div class="input-title">{{ $t('game.customize') }}:</div>
					<div class="input-box">
						<input :placeholder="conf.betInputPlaceholder" v-model="conf.num" inputmode="decimal"
							@input="conf.vfFun($event, 'num')" />
					</div>
				</div>
				<div class="bet-btn" @click="conf.submit">
					{{ $t('game.totalPrice') }} {{ conf.coinSymbol }}{{ conf.num || 0 }}
				</div>
			</div>
		</div>
		<div class="popup-content" v-if="conf.shareOpen">
			<div class="popup-title">
				<img class="close-img" src="/static/img/close.png" @click="conf.shareOpen = false" />
				<text>{{ $t('game.chatRoom') }}</text>
				<div class="title-right" @click="conf.share">{{ $t('home.more') }}</div>
			</div>
			<div class="room-list" scroll-y>
				<div class="room-item" v-for="(item, index) in conf.roomList" :key="index"
					@click="conf.shareRoom(item)">
					<div class="room-left">
						<img class="head-img" :src="item.lotteryChatRoomimg" v-if="item.lotteryChatRoomimg" />
						<img class="head-img" src="/static/img/default-header.webp" v-else />
						<div class="info">
							<div class="name">{{ item.lotteryChatRoomName }}</div>
							<div class="num">
								<img class="num-img" src="/static/img/room-person.png" />
								<text>{{ item.lotteryChatRoomNumber }}</text>
							</div>
						</div>
					</div>
					<div class="right-btn">{{ $t('game.share') }}</div>
				</div>
				<div class="not-room" v-if="conf.roomList.length == 0">
					<img class="not-img" src="/static/img/no-data.webp" />
					<div class="not-tips">Not Data，<text style="color: #FFA64F;" @click="conf.share">{{
						$t('game.goChat') }}</text></div>
				</div>
			</div>
		</div>
	</van-popup>
</template>

<script setup lang="ts">
import { sconfig } from '@/sstore/sconfig'
import { svf } from '@/sstore/svf'
import { svalue } from '@/sstore/svalue'
import { onMounted, reactive } from 'vue';
import System from '@/utils/System';
import i18n from '@/lang';
import sutil from '@/sstore/sutil';
const props = defineProps({
	betImg: {
		default: ''
	},
	betType: {
		default: ''
	},
	betNum: {
		default: 0
	},
	betObj: {
		default: {} as any
	},
	betShare: {
		default: false
	},
	betShow: {
		default: false
	},
	showShare: {
		default: true
	},
	isBetBtnClick: {
		default: true
	}
})
const emit = defineEmits(['submit','share'])
const conf = reactive({
	num: 10 as any,
	showTip: false,
	translateY: 0,
	coinSymbol: '₹',
	quickRechargeAmount: {
		list: [10, 20, 50, 100], // 快速下注列表
		get: async () => {
			conf.quickRechargeAmount.list = sconfig.walletInfo.quickRechargeAmount.map((item:any) => parseInt(item))
		}
	},
	roomList: [] as any,
	shareOpen: false,
	walletMoney: '',
	betInputPlaceholder: '',
	vf: {},
	mconf: {} as any,
	vfFun: (e: Event, name: string) => {
		(conf.vf as any)[name](e)
		if (conf.num > parseFloat(conf.walletMoney)) {
			conf.num = parseFloat(conf.walletMoney)
		}
	},
	// 下注
	submit() {
		if (!sconfig.userInfo) return System.router.push('/login')
		if (conf.num == 0) {
			conf.showTip = true
			const timer = setTimeout(() => {
				conf.showTip = false
				clearTimeout(timer)
			}, 2000)
			return;
		}
		if (!props.isBetBtnClick) return
		emit('submit', conf.num)
	},
	// 关闭下注弹窗
	closePopup() {
		conf.shareOpen = false
		emit('submit', 0)
	},
	// 聊天室弹窗
	async changeShareOpen() {
		if (props.betShare) return
		console.log('conf.mconf', conf.mconf.gameType);
		let obj = {
			coinSymbol: conf.coinSymbol,
			betMoney: conf.num.toFixed(4),
			money: conf.num.toFixed(4),
			orderType: '',
			id: StrUtil.getId(),
			lotteryName: conf.mconf.gameType,
			lotteryTypeCode: conf.mconf.gameType,
			betLotteryId: '',
			betOpenId: '',
			betExpect: '',
			betCodes: '',
			betType: '',
			betNum: '',
			playName: '',
			newPlayName: '',
			newBetCodesArr: [] as any[],
			newBetCodes: '',
			betContent: '',
			betTitle: ''
		}
		switch (conf.mconf.gameType) {
			case 'Color':
			case '3D':
				obj.betLotteryId = conf.mconf.currentOpen.lotteryId
				obj.betOpenId = conf.mconf.currentOpen.lotteryOpenId
				obj.betExpect = conf.mconf.currentOpen.openExpect
				let key = conf.mconf.gameType === 'Color' ? 'colorItem' : 'addsItem'
				obj.betCodes = conf.mconf[key].oddsCode
				obj.betType = conf.mconf[key].betType
				obj.betNum = conf.mconf[key].betNum
				let time = conf.mconf.gameType === 'Color' ? conf.mconf.tabIndex : conf.mconf.currentOpen.orderType
				obj.playName = `${time / 1000 / 60}min${conf.mconf.gameType}`
				break
			case '5D':
			case 'pk10':
			case 'Trx':
				obj.betLotteryId = conf.mconf.currentOpenInfo.lotteryId
				obj.betOpenId = conf.mconf.currentOpenInfo.lotteryOpenId
				obj.betExpect = conf.mconf.currentOpenInfo.openExpect
				console.log(conf.mconf.currentTab);
				obj.playName = `${conf.mconf.currentTab.lotteryShortname}min${conf.mconf.gameType}`
				if (conf.mconf.gameType === '5D') obj.betCodes = conf.mconf.selectBetNumArr.map((item:any) => item.oddsCode).join('') || ''
				else if (conf.mconf.gameType === 'pk10') {
					obj.lotteryName = obj.lotteryName.toUpperCase()
					obj.lotteryTypeCode = obj.lotteryName
					obj.playName = `${conf.mconf.currentTab.lotteryShortname}min${obj.lotteryName}`
					let num = conf.mconf.selectBetNumArr[0].active + '_'
					obj.betCodes = num + conf.mconf.selectBetNumArr[0]?.key || ''
				} else if (conf.mconf.gameType === 'Trx') {
					obj.lotteryName = obj.lotteryName + 'WinGo'
					obj.lotteryTypeCode = obj.lotteryName
					obj.betCodes = conf.mconf.selectBetNumArr.map((obj:any) => {
						return obj.oddsCode
					}).join(",") || ''
				}
				break
		}
		obj.newPlayName = obj.playName
		obj.newBetCodesArr = obj.betCodes.split(',')
		if (conf.mconf.gameType == '5D') {
			obj.newBetCodes = obj.newBetCodesArr.map(obj => {
				return obj.split('_')[1] + '_' + obj.split('_')[2]
			}).join(",") || ''
		} else if (conf.mconf.gameType == '3D') {
			obj.orderType = obj.betCodes.split('_')[0]
			obj.newBetCodes = obj.newBetCodesArr.map(obj => {
				return obj.split('_')[1]
			}).join(",") || ''
			obj.newPlayName = obj.playName + ' - ' + i18n.t('game.sumType')
			switch (obj.orderType) {
				case 'leopard':
					// obj.newBetCodes = [].concat(Array(3).fill(order.orderNum)).join(",")
					obj.newPlayName = obj.playName + ' - ' + i18n.t('game.triple')
					break;
				case 'double':
					// obj.newBetCodes = [].concat(Array(2).fill(order.orderNum)).join(",")
					obj.newPlayName = obj.playName + ' - ' + i18n.t('game.pair')
					break;
				case 'single':
					// obj.newBetCodes = order.orderNum
					obj.newPlayName = obj.playName + ' - ' + i18n.t('game.single')
					break;
				case 'sum':
					// obj.newBetCodes = order.orderNum
					!obj.betContent && (obj.newPlayName = obj.playName + ' - ' + i18n.t('game.sumPoints'))
					break;
			}
		} else {
			obj.newBetCodes = obj.newBetCodesArr.map(obj => {
				return obj.split('_')[1]
			}).join(",") || ''
		}
		obj.betContent = obj.newBetCodes
		obj.betTitle = obj.betExpect
		console.log('obj', obj)
		Cookie.set('betRecord', JSON.stringify(obj))
		await sconfig.toChat('/chat/betRecordForward')
	},
	// 选择连并分享到聊天室
	shareRoom(item:any) {
		if (conf.num == 0) {
			conf.showTip = true
			const timer = setTimeout(() => {
				conf.showTip = false
				clearTimeout(timer)
			}, 2000)
			return;
		}
		let obj = {
			type: 2,
			money: conf.num,
			roomId: item.id,
			roomName: item.lotteryChatRoomName,
			roomBanned: item.lotteryChatBanned,
			roomAdmin: item.lotteryChatUid == sconfig.userInfo.uid
		}
		emit('share', obj)
	},
	// 分享聊天室
	share() {
		if (conf.num == 0) {
			conf.showTip = true
			const timer = setTimeout(() => {
				conf.showTip = false
				clearTimeout(timer)
			}, 2000)
		}
		let obj = {
			type: 1,
			money: conf.num
		}
		emit('share', obj)
	}
})
onMounted(async () => {
	conf.vf = svf.getVf(conf, {
		num: {
			float: true,
			fixed: 4,
		}
	})
	if (!sconfig.userInfo) return
	const defaultWalletInfo = await svalue.getDefaultWallet()
	if (Cookie.get('roomOrder')) {
		Cookie.remove('roomOrder')
	}
	// conf.getChatRoom()
	if (defaultWalletInfo && defaultWalletInfo.coinSymbol) {
		let obj = defaultWalletInfo
		let coinSymbol = obj.coinSymbol == 'USDT' ? obj.coinSymbol + ' ' : obj.coinSymbol
		conf.coinSymbol = coinSymbol
		conf.betInputPlaceholder = coinSymbol + sutil.dataHandling(obj.betMinAmount) + ' ~ ' + sutil.dataHandling(obj.betMaxAmount)
		if (obj.betMinAmount) conf.num = sutil.dataHandling(obj.betMinAmount)
	} else {
		conf.coinSymbol = '₹'
	}
	conf.walletMoney = defaultWalletInfo.walletMoney
	conf.quickRechargeAmount.get()
})
</script>

<style lang="less" scoped>
.tip-popup {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 9999;
	display: flex;
	align-items: center;
	justify-content: center;
	max-width: 500px;
	margin: 0 auto;

	.tip-box {
		background: rgba(0, 0, 0, 0.7);
		border-radius: 14rem;
		padding: 48rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;

		.tip-icon {
			font-size: 48rem;
			background: #D90000;
			color: #FFF;
			width: 80rem;
			height: 80rem;
			border-radius: 50%;
			display: flex;
			justify-content: center;
			align-items: center;
		}

		.tip-content {
			font-size: 32rem;
			color: #FFF;
			margin-top: 24rem;
		}
	}
}

.popup-content {
	border-radius: 16rem 16rem 0rem 0rem;
	background: #FFF;
	padding-bottom: 40rem;

	.popup-title {
		padding: 40rem 40rem 20rem;
		color: rgb(37, 37, 41);
		font-size: 32rem;
		font-weight: bold;
		display: flex;
		justify-content: space-between;
		align-items: center;

		.close-img {
			width: 19rem;
			height: 19rem;
		}

		.share-img {
			width: 47rem;
			height: 35rem;
		}

		.title-right {
			display: flex;
			justify-content: center;
			align-items: center;
			padding: 4px 8px;
			border-radius: 4px;
			background-color: rgba(0, 0, 0, 0);
			border: 1px solid rgb(187, 187, 197);
			z-index: 8;
			font-size: 24rem;
			color: rgb(37, 37, 41);
		}

		.disabled {
			filter: grayscale(1);
		}
	}

	.bet-type {
		padding: 24rem;
		background: #E6F2FF;
		display: flex;
		justify-content: center;

		.bet-type-item {
			position: relative;

			.bet-img {
				width: 125rem;
				height: 125rem;
			}

			.bet-num {
				position: absolute;
				top: 0;
				bottom: 0;
				width: 100%;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 62rem;
				color: #2c2e36;
				font-weight: 900;
			}

			.colorStr {
				font-size: 24rem;
				color: #FFF;
				font-weight: 700;
			}

			.colorNum {
				font-size: 48rem;
				color: #FFF;
				font-weight: 700;
			}
		}

		.bet-type-dice {
			display: flex;
			flex-direction: column;
			align-items: center;

			.bet-dice-img {
				width: 60rem;
				height: 60rem;
			}
		}
	}

	.select-box {
		padding: 0rem 40rem;

		.money {
			margin-bottom: 32rem;

			.money-title {
				color: #45454d;
				font-size: 28rem;
				font-weight: 700;
				margin-bottom: 16rem;
			}

			.money-list {
				display: flex;
				justify-content: space-between;
				align-items: center;

				.money-item {
					width: 22%;
					height: 75rem;
					border-radius: 8rem;
					background: linear-gradient(180deg, #f2f4f9 0%, #f3f5fb 100%);
                    box-shadow: 0px 4rem 4rem 0px #C3C8DC;
					color: #252529;
					font-weight: 700;
					font-size: 28rem;
					display: flex;
					justify-content: center;
					align-items: center;

					&.money-active {
                        background: #006FFF;
						color: #FFF;
					}
				}
			}
		}

		.input {
			display: flex;
			align-items: center;
			margin-bottom: 32rem;

			.input-title {
				color: #45454d;
				font-weight: 700;
				font-size: 28rem;
				margin-right: 24rem;
			}

			.input-box {
				flex: 1;
				background: #f5f5fa;
				padding: 16rem 24rem;
				border-radius: 8rem;

				input {
					color: #252529;
					font-size: 28rem;
					font-weight: 700;
				}
			}
		}

		.bet-btn {
			display: flex;
			justify-content: center;
			align-items: center;
			height: 96rem;
			color: #fff;
			font-size: 28rem;
			font-weight: 700;
			border-radius: 95rem;
			box-shadow: 0 1px 0 0 rgba(255, 255, 255, .2) inset, 0 1px 7rem 0 rgba(0, 0, 0, .25);
            background: linear-gradient(93.51deg, #006FFF 5.72%, #087BFF 86.61%);
		}
	}

	.room-list {
		height: 40vh;
		background: #edeff5;
		padding: 0rem 20rem 0rem;

		.room-item {
			background: #FFF;
			height: 110rem;
			border-radius: 10rem;
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 0rem 26rem;
			margin-top: 20rem;

			.room-left {
				display: flex;
				align-items: center;

				.head-img {
					width: 65rem;
					height: 65rem;
					border-radius: 53rem;
				}

				.info {
					margin-left: 24rem;

					.name {
						margin-bottom: 8rem;
						color: #000;
						font-weight: 600;
						font-size: 28rem;
					}

					.num {
						color: #000;
						font-weight: 600;
						font-size: 22rem;
						display: flex;
						align-items: center;

						.num-img {
							width: 18rem;
							height: 22rem;
							margin-top: 4rem;
							margin-right: 8rem;
						}

						text {
							opacity: 0.5;
						}
					}
				}
			}

			.right-btn {
				width: 114rem;
				height: 46rem;
				border-radius: 62rem;
				border: 2rem solid #EB602D;
				background: linear-gradient(180deg, #EB602D 0%, #FFA64F 100%);
				display: flex;
				align-items: center;
				justify-content: center;
				color: #FFF;
				font-weight: 600;
				font-size: 25rem;
			}
		}

		.not-room {
			display: flex;
			justify-content: center;
			align-items: center;
			flex-direction: column;

			.not-img {
				width: 225rem;
				height: 225rem;
			}
		}
	}
}

@keyframes FadeIn {
	0% {
		bottom: -50%;
	}

	100% {
		bottom: 0;
	}
}

.fonts {
	font-size: 28rem !important;
}

.uni-input-placeholder {
	opacity: 0.5 !important;
	font-weight: 300 !important;
}
</style>