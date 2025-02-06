<template>
	<div class="box">
		<div class="title">
			<!-- <img :src="conf.imgSrc" class="type-img" /> -->
			{{ conf.betInfo.lotteryName }}
		</div>
		<div class="content">
			<div class="line">
				<div class="label">{{ $t('chatRoom.BettingPeriod') + ' :' }}</div>
				<div class="value"> {{ conf.betInfo.openExpect }} </div>
			</div>
			<div class="line">
				<div class="label">{{ $t('SattaKing.GameType') + ' :' }}</div>
				<div class="value"> {{ conf.betInfo.newPlayName }} </div>
			</div>
			<div class="line">
				<div class="label">{{ $t('SattaKing.BettingContent2') + ' :' }}</div>
				<div class="value" style="overflow-x: auto;"> {{ conf.betInfo.newBetCodes }} </div>
			</div>
			<div class="line">
				<div class="label">{{ $t('game.TotalBetAmount') + ' :' }}</div>
				<div class="value"> {{ conf.betInfo.coinSymbol + conf.betInfo.money }} </div>
			</div>
		</div>
		<div class="bet-share">
			<!-- <div class="left-div">{{$t('chatRoom.OrderSharing')}}</div> -->
			<div class="left-div">{{ $t('chatRoom.OrderSharing') }}</div>
			<div class="right-div" @click="conf.handleBtns('follow-bet')">{{ $t('chat.chatFollow') }}</div>
		</div>

		<!-- 跟投弹窗 -->
		<div class="cu-modal" :class="conf.modalName == 'follow-bet' ? 'show' : ''">
			<div class="cu-dialog">
				<div class="padding-xl">
					<div class="title-box">
						<!-- <img :src="conf.imgSrc" class="type-img" /> -->
						<div>{{ conf.betInfo.lotteryName }}</div>
						<div class="close" @click="conf.modalName = ''">×</div>
					</div>
					<div class="content-box">
						<div class="info">
							<span class="name">{{ conf.betInfo.shareName }}</span>
							<span> {{ $t('chatRoom.ShareBettingScheme') + ' ' }}{{ $t('chatRoom.total') + ''}}{{ conf.shareMultiple + ' ' }}{{ conf.shareMultiple > 1 ? $t('chatRoom.bets') :
									$t('chatRoom.bet') }} </span>
						</div>
						<div class="bet-info">
							<div class="line">
								<div class="label">{{ $t('SattaKing.GameType') }}:</div>
								<div class="value"> {{ conf.betInfo.newPlayName }} </div>
							</div>
							<div class="line">
								<div class="label">{{ $t('chatRoom.BettingPeriod') }}:</div>
								<div class="value"> {{ conf.betInfo.openExpect }} </div>
							</div>
							<div class="line">
								<div class="label">{{ $t('SattaKing.BettingContent2') }}:</div>
								<div class="value" style="overflow-x: auto;"> {{ conf.betInfo.newBetCodes }} </div>
							</div>
						</div>
					</div>
					<div class="money-info">
						<div class="bet-totalamount">
							{{ $t('chatRoom.TotalAmount') }}:
							<span class="money-value" style="margin-left: 10rem;">{{ conf.defaultWalletInfo.coinSymbol + ' '
								+
								conf.totalMoney }}</span>
						</div>
						<div class="bet-member-amount"> {{ $t('chatRoom.AccountBalance') }}:
							<span class="money-value">{{ conf.AccountBalance }}</span>
						</div>
					</div>
					<div class="enter-info">
						<div class="left">
							<div>{{ $t('game.amount') }}</div>
							<div class="coinSymbol">
								<div class="value">
									<div style="margin: 0 16rem;">{{ conf.defaultWalletInfo.coinSymbol }}</div>
								</div>
							</div>
							<input class="money-input" v-model="conf.betMoney" @input="conf.vfFun($event, 'betMoney')" />
						</div>
					</div>
					<div class="bet-confirm" @click="conf.handleBtns('confirm')">{{ $t('chatRoom.confirm') }}</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { apis } from '@/api';
import i18n from '@/lang';
import sconfig from '@/sstore/sconfig';
import sutil from '@/sstore/sutil';
import { svalue } from '@/sstore/svalue';
import { svf } from '@/sstore/svf';
import Config from '@/utils/Config';
import System from '@/utils/System';
import { Scope } from 'tools-vue3';
import { onMounted, reactive, nextTick } from 'vue';

const props = defineProps({
	info: {
		default: [] as any[]
	}
})

const mconf = Scope.getConf()

const conf = reactive({
	betInfo: {
		lotteryName: 'Color',
		openExpect: '202408260008',
		playName: '1minColor',
		content: '1,2',
		money: '$5'
	} as any,
	modalName: '',
	shareMultiple: 1,
	betMoney: 1,
	multiple: 1,
	totalMoney: 0,
	AccountBalance: '0.00',
	defaultWalletInfo: {} as any,
	isSubmitClick: true,
	imgSrc: '/static/img/imShareBet/Color.png',
	vf: {} as any,
	vfFun: (e:any, name:any) => {
		conf.vf[name](e)
		nextTick(() => {
			conf.getTotalMoney()
		})
	},
	async getWalletMoney(type:any) {
		if (!sconfig.userInfo) return ''
		conf.defaultWalletInfo = await svalue.getDefaultWallet()
		let m = parseFloat(conf.defaultWalletInfo.walletMoney)
		conf.AccountBalance = (conf.defaultWalletInfo.coinSymbol || '₹') + sutil.dataHandling(m)
	},


	handleBtns(type:any) {
		switch (type) {
			//跟投
			case 'follow-bet':
				conf.modalName = type
				// conf.getLotteryOpen()
				break;
			//跟投弹窗 - 确定
			case 'confirm':
				if (!conf.defaultWalletInfo.hasOwnProperty('coinCode')) {
					System.toast(i18n.t('game.setWalletTip'))
					return
				}

				let minBetMoney = conf.defaultWalletInfo.betMinAmount
				let maxBetMoney = conf.defaultWalletInfo.betMaxAmount
				let coinSymbol = conf.defaultWalletInfo.coinSymbol

				if (conf.totalMoney < parseFloat(minBetMoney)) {
					System.toast(i18n.t('game.minBetTip') + ' ' + coinSymbol + minBetMoney || '')
					return
				}

				if (conf.totalMoney > parseFloat(maxBetMoney)) {
					System.toast(i18n.t('game.maxBetTip') + ' ' + coinSymbol + maxBetMoney || '')
					return
				}

				if (conf.totalMoney > parseFloat(conf.defaultWalletInfo.walletMoney)) {
					System.toast(i18n.t('code.1204'))
					return
				}

				let obj = {
					money: conf.betMoney, //单注金额
					betCodes: conf.betInfo.betCodes, //投注内容
					betExpect: conf.betInfo.openExpect, //投注期号
					betOpenId: conf.betInfo.betOpenId, //开奖记录编号
					lotteryId: conf.betInfo.betLotteryId, //投注彩票ID
					multiple: conf.multiple, //投注倍数
					nums: 1, //投注数量
					supplement: 0, //是否追加订单，0否，1是
					walletCoinCode: conf.defaultWalletInfo.walletCoin //下注钱包币种
				}

				if (!conf.isSubmitClick) return
				conf.isSubmitClick = false
				System.loading()
				apis.lotteryUserBets({
					...obj,
					success: (res:any) => {
						conf.isSubmitClick = true
						if (res.code == 200) {
							conf.getWalletMoney(1)
							conf.modalName = ''
							System.toast(i18n.t('game.betSuccess'),'success')
						} else {
							System.toast(i18n.t(`code.${res.data.code}`))
						}
					},
					final: () => {
						System.loading(false)
						conf.isSubmitClick = true
					}

				})
				break;
		}
	},

	// 下注倍数 + /-
	handleMultiple(type:any) {
		switch (type) {
			case 'subtract':
				if (conf.multiple == 1) {
					return
				}
				conf.multiple -= 1
				break;
			case 'add':
				conf.multiple += 1
				break;
		}
		conf.getTotalMoney()
	},

	// 计算下注总金额
	getTotalMoney() {
		conf.totalMoney = sutil.Mul(conf.betMoney, conf.multiple)
	}
})

onMounted(() => {
	Scope.getConf(this)
	const _item = mconf.item.data
	conf.betInfo = {
		..._item,
		openExpect: _item.betExpect,
		content: _item.betCodes,
		money: _item.betMoney
	}
	conf.getWalletMoney(1)
	conf.getTotalMoney()
	let lotteryTypeCode = conf.betInfo.lotteryTypeCode
	if (lotteryTypeCode == '3D') {
		conf.imgSrc = '/static/img/imShareBet/3D.png'
	} else if (lotteryTypeCode == 'PK10') {
		conf.imgSrc = '/static/img/imShareBet/PK10.png'
	} else if (lotteryTypeCode == 'Satta') {
		conf.imgSrc = '/static/img/imShareBet/Satta.png'
	} else if (lotteryTypeCode == '5D') {
		conf.imgSrc = '/static/img/imShareBet/5D.png'
	} else if (lotteryTypeCode == 'TrxWinGo') {
		conf.imgSrc = '/static/img/imShareBet/Trx.png'
	}

	conf.vf = svf.getVf(this, {
		betMoney: {
			float: true,
			fixed: 2,
		},
		multiple: {
			getNum: true,
		}
	})
})

</script>

<style lang="less" scoped>
.box {
	width: 70vw;
	height: auto;
	border-radius: 12rem;
	overflow: hidden;
	background: #fff;
	padding: 20rem;

	.title {
		width: 100%;
		line-height: 64rem;
		align-items: center !important;
		font-size: 32rem;
		font-weight: 600;
		color: #333333;
		display: flex;
		align-content: center;
		padding-bottom: 10rem;
	}

	.content {
		font-size: 24rem !important;
		font-weight: 500;
		padding: 8rem 0;
		border-top: 4rem dashed #E3E3E3;
		border-bottom: 4rem dashed #E3E3E3;
	}

	.bet-share {
		padding-top: 15rem;
		display: flex;
		justify-content: space-between;

		.left-div {
			background: linear-gradient(90deg, #1FC408 0%, #2DC157 100%);
			-webkit-background-clip: text;
			background-clip: text;
			color: transparent;
			font-size: 26rem;
		}

		.right-div {
			padding: 10rem 15rem;
			border-radius: 48rem;
			background: linear-gradient(90deg, #1FC408 0%, #2DC157 100%);
			color: #fff;
			font-weight: 600;
			font-size: 20rem;
			letter-spacing: 4rem;
		}
	}
}

.type-img {
	width: 52rem;
	height: 52rem;
	margin-right: 10rem;
}

.line {
	display: flex !important;
	padding: 10rem;

	.label {
		color: #666666 !important;
		font-weight: 500;
		flex-shrink: 0;
	}

	.value {
		padding-left: 10rem;
		color: #B1B1B1 !important;
	}
}

.cu-dialog {
	width: 80%;
	max-width: 500px;
	font-size: 28rem;
	padding: 30rem;
	border-radius: 20rem;

	.padding-xl {
		padding: 0 !important;
	}

	.title-box {
		display: flex;
		align-items: center;
		position: relative;
		height: 76rem;
		line-height: 76rem;
		font-size: 40rem;
		font-weight: 600;

		.close {
			position: absolute;
			top: 0;
			right: 0;
			width: 76rem;
			height: 76rem;
			border: none;
			border-radius: 0;
			background-color: transparent;
			font-size: 52rem;
			color: #999999;

		}
	}

	.content-box {
		text-align: left;
		border-top: 4rem dashed #E3E3E3;
		border-bottom: 4rem dashed #E3E3E3;

		.info {
			padding: 20rem 0rem;
			font-size: 26rem;
			color: #666666;

			.name {
				color: #2AC245;
				margin-right: 10rem;
			}
		}

		.bet-info {
			padding: 20rem 0rem;
		}

		.bet-content {
			display: flex;
			overflow: auto;
			height: 240rem;
			font-size: 32rem;
			padding: 20rem 32rem;
			color: #323233;

			.value {
				margin-left: 10rem;
			}
		}
	}

	.money-info {
		text-align: left;
		padding: 20rem 0rem;
		font-size: 26rem;
		color: #666666;
		font-weight: 400;

		.bet-totalamount {
			font-size: 32rem;
			color: #2BC247;
			font-weight: 600;
		}

		.money-value {
			margin-left: 10rem;
		}
	}

	.enter-info {
		display: flex;
		align-items: center;
		color: #333333;
		font-size: 28rem;
		font-weight: 600;
		text-align: left;
		margin-top: 15rem;

		.left {
			width: 100%;
			display: flex;
			align-items: center;

			.coinSymbol {
				flex-shrink: 0;
				border-radius: 22rem;
				border: 2rem solid #2CC25150;
				font-size: 26rem;
				color: #fff;
				text-align: center;
				margin-left: 8rem;

				.value {
					flex-shrink: 0;
					min-width: 36rem !important;
					height: 36rem !important;
					margin: 2rem;
					background-color: #20C50B;
					border-radius: 18rem;
				}
			}

			.money-input {
				margin: 0 10rem;
				padding: 0;
				text-align: center;
				border: none;
				background-color: transparent;
				border-bottom: 2rem solid #20C50B;
			}
		}

		.right {
			width: 50%;
			display: flex;
			align-items: center;

			.icon-text,
			.icon-text-add {
				font-size: 50rem;
				font-weight: 400;
				color: #B1B1B1;
				margin: 0rem 10rem;

			}

			.icon-text-add {
				color: #20C50B;
			}

			.multiple-input {
				width: 60rem;
				margin: 0 10px;
				padding: 0;
				text-align: center;
				border: none;
				border-bottom: 2rem solid #20C50B;
				background-color: transparent;
			}
		}
	}

	.bet-confirm {
		height: 84rem;
		background: linear-gradient(97.67deg, #28C238 34.32%, #1FC40A 65.72%);
		display: flex;
		-webkit-box-align: center;
		-webkit-align-items: center;
		align-items: center;
		-webkit-box-pack: center;
		-webkit-justify-content: center;
		justify-content: center;
		color: #fff;
		font-size: 36rem;
		border-radius: 50rem;
		margin-top: 20rem;
	}
}
</style>