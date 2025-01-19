<template>
	<view class="box">
		<view class="title">
			<image :src="imgSrc" class="type-img"></image>
			{{ betInfo.lotteryName }}
		</view>
		<view class="content">
			<view class="line">
				<view class="label">{{$t('chatRoom.BettingPeriod') + ' :'}}</view>
				<view class="value"> {{betInfo.openExpect}} </view>
			</view>
			<view class="line">
				<view class="label">{{$t('SattaKing.GameType') + ' :'}}</view>
				<view class="value"> {{betInfo.newPlayName}} </view>
			</view>
			<view class="line">
				<view class="label">{{$t('SattaKing.BettingContent2') + ' :'}}</view>
				<view class="value"> {{betInfo.newBetCodes}} </view>
			</view>
			<view class="line">
				<view class="label">{{$t('game.TotalBetAmount') + ' :'}}</view>
				<view class="value"> {{betInfo.coinSymbol + betInfo.money}} </view>
			</view>
		</view>
		<view class="bet-share">
			<!-- <view class="left-view">{{$t('chatRoom.OrderSharing')}}</view> -->
			<view class="left-view">{{$t('chatRoom.OrderSharing')}}</view>
			<view class="right-view" @click="handleBtns('follow-bet')">{{$t('chat.chatFollow')}}</view>
		</view>

		<!-- 跟投弹窗 -->
		<view class="cu-modal" :class="modalName=='follow-bet'?'show':''">
			<view class="cu-dialog">
				<view class="padding-xl">
					<view class="title-box">
						<image :src="imgSrc" class="type-img"></image>
						<view>{{betInfo.lotteryName}}</view>
						<view class="close" @click="modalName = ''">×</view>
					</view>
					<view class="content-box">
						<view class="info">
							<text class="name">{{betInfo.shareName}}</text>
							<text> {{$t('chatRoom.ShareBettingScheme') + ' '}}{{$t('chatRoom.total') + ' '}}{{shareMultiple + ' '}}{{ shareMultiple > 1 ? $t('chatRoom.bets') : $t('chatRoom.bet') }} </text>
						</view>
						<view class="bet-info">
							<view class="line">
								<view class="label">{{$t('SattaKing.GameType')}}:</view>
								<view class="value"> {{betInfo.newPlayName}} </view>
							</view>
							<view class="line">
								<view class="label">{{$t('chatRoom.BettingPeriod')}}:</view>
								<view class="value"> {{betInfo.openExpect}} </view>
							</view>
							<view class="line">
								<view class="label">{{$t('SattaKing.BettingContent2')}}:</view>
								<view class="value"> {{betInfo.newBetCodes}} </view>
							</view>
						</view>
					</view>
					<view class="money-info">
						<view class="bet-totalamount">
							{{$t('chatRoom.TotalAmount')}}:
							<span class="money-value" style="margin-left: 10rpx;">{{defaultWalletInfo.coinSymbol +' '+ totalMoney}}</span>
						</view>
						<view class="bet-member-amount"> {{$t('chatRoom.AccountBalance')}}: 
							<span class="money-value">{{AccountBalance}}</span>
						</view>
					</view>
					<view class="enter-info">
						<view class="left">
							<view>{{$t('game.amount')}}</view>
							<view class="coinSymbol">
								<view class="value">
									<view style="margin: 0 16rpx;">{{defaultWalletInfo.coinSymbol}}</view>
								</view>
							</view>
							<input class="money-input" v-model="betMoney" @input="vfFun($event,'betMoney')"/>
						</view>
					</view>
					<view class="bet-confirm" @click="handleBtns('confirm')">{{$t('chatRoom.confirm')}}</view>
				</view>
			</view>
		</view>
		<toast ref="toast"></toast>
	</view>
</template>

<script>
	import { svalue } from '@/sstore/svalue';
import { svf } from '@/sstore/svf';
import Config from '@/utils/Config';
import {
	Scope
} from 'tools-vue2';
	

	export default {
		components: {},
		props: {
			info: {
				type: Array,
				default: ()=>{
					return []
				}
			}
		},
		data() {
			return {
				betInfo: {
					lotteryName: 'Color',
					openExpect: '202408260008',
					playName: '1minColor',
					content: '1,2',
					money: '$5'
				},
				modalName: '',
				shareMultiple:1,
				betMoney:1,
				multiple:1,
				totalMoney:0,
				AccountBalance:'0.00',
				defaultWalletInfo:{},
				isSubmitClick:true,
				imgSrc:'/static/img/imShareBet/Color.png',
				vfFun:(e,name)=>{
					this.vf[name](e)
					this.$nextTick(()=>{
						this.getTotalMoney()
					})
				}
			}
		},
		computed: {},
		created() {
			Config.Timer(this)
			Config.Event(this)
			Scope.getConf(this)
			const _item = this.mconf.item.data
			this.betInfo = {
				..._item,
				openExpect: _item.betExpect,
				content: _item.betCodes,
				money: _item.betMoney
			}
			this.getWalletMoney(1)
			this.getTotalMoney()
			let lotteryTypeCode = this.betInfo.lotteryTypeCode
			if(lotteryTypeCode == '3D'){
				this.imgSrc = '/static/img/imShareBet/3D.png'
			}else if(lotteryTypeCode == 'PK10'){
				this.imgSrc = '/static/img/imShareBet/PK10.png'
			}else if(lotteryTypeCode == 'Satta'){
				this.imgSrc = '/static/img/imShareBet/Satta.png'
			}else if(lotteryTypeCode == '5D'){
				this.imgSrc = '/static/img/imShareBet/5D.png'
			}else if(lotteryTypeCode == 'TrxWinGo'){
				this.imgSrc = '/static/img/imShareBet/Trx.png'
			}
			
			this.vf = svf.getVf(this, {
				betMoney:{
					float:true,
					fixed:2,
				},
				multiple:{
					getNum:true,
				}
			})
		},
		mounted() {},
		methods: {
			async getWalletMoney(type) {
				if(!this.isLogin()) return this.walletMoney = '-'
				this.defaultWalletInfo = await svalue.getDefaultWallet(type)
				let m = parseFloat(this.defaultWalletInfo.walletMoney)
				this.AccountBalance = (this.defaultWalletInfo.coinSymbol || '₹') + this.dataHandling(m)
			},
			
						
			handleBtns(type) {
				switch (type) {
					//跟投
					case 'follow-bet':
						this.modalName = type
						// this.getLotteryOpen()
						break;
					//跟投弹窗 - 确定
					case 'confirm':
						if(!this.defaultWalletInfo.hasOwnProperty('coinCode')){
							this.$refs.toast.show({
								message: this.$t('game.setWalletTip')
							});
							return
						}
						
						let minBetMoney = this.defaultWalletInfo.betMinAmount
						let maxBetMoney = this.defaultWalletInfo.betMaxAmount
						let coinSymbol = this.defaultWalletInfo.coinSymbol
						
						if (parseFloat(this.totalMoney) < parseFloat(minBetMoney)) {
							this.$refs.toast.show({
								message: this.$t('game.minBetTip') + ' ' + coinSymbol + minBetMoney || ''
							});
							return
						}
						
						if (parseFloat(this.totalMoney) > parseFloat(maxBetMoney)) {
							this.$refs.toast.show({
								message: this.$t('game.maxBetTip') + ' ' + coinSymbol + maxBetMoney || ''
							});
							return
						}
						
						if (parseFloat(this.totalMoney) > parseFloat(this.defaultWalletInfo.walletMoney)) {
							this.$refs.toast.show({
								message: this.$t('code.1204')
							});
							return
						}
						
						let obj = {
							money: this.betMoney, //单注金额
							betCodes: this.betInfo.betCodes, //投注内容
							betExpect: this.betInfo.openExpect, //投注期号
							betOpenId: this.betInfo.betOpenId, //开奖记录编号
							lotteryId: this.betInfo.betLotteryId, //投注彩票ID
							multiple: this.multiple, //投注倍数
							nums: 1, //投注数量
							supplement: 0, //是否追加订单，0否，1是
							walletCoinCode: this.defaultWalletInfo.walletCoin //下注钱包币种
						}
						
						uni.showLoading({
							mask: true,
							title: ''
						});
						if(!this.isSubmitClick) return
						this.isSubmitClick = false
						uni.showLoading({
							mask: true,
							title: ''
						});
						this.$api.lotteryUserBets({
							data: obj,
							success: res => {
								this.isSubmitClick = true
								if (res.data.code == 200) {
									this.getWalletMoney(1)
									this.modalName = ''
									this.$refs.toast.show({
										message: this.$t('game.betSuccess'),
										type: 'success'
									});
								} else {
									this.$refs.toast.show({
										message: this.$t(`code.${res.data.code}`)
									});
								}
							},
							complete: () => {
								uni.hideLoading()
								this.isSubmitClick = true
							}
						});
						break;
				}
			},
			
			// 下注倍数 + /-
			handleMultiple(type){
				switch (type) {
					case 'subtract':
						if(this.multiple == 1){
							return
						}
						this.multiple -= 1
						break;
					case 'add':
						this.multiple += 1
						break;
				}
				this.getTotalMoney()
			},
			
			// 计算下注总金额
			getTotalMoney(){
				this.totalMoney = this.Mul(this.betMoney,this.multiple)
			},
		}
	}
</script>

<style lang="scss" scoped>
	.box {
		width: 70vw;
		height: auto;
		border-radius: 12rpx;
		overflow: hidden;
		background: #fff;
		padding: 20rpx;

		.title {
			width: 100%;
			line-height: 64rpx;
			align-items: center !important;
			font-size: 32rpx;
			font-weight: 600;
			color: #333333;
			display: flex;
			align-content: center;
			padding-bottom: 10rpx;
		}

		.content {
			font-size: 24rpx !important;
			font-weight: 500;
			padding: 8rpx 0;
			border-top: 4rpx dashed #E3E3E3;
			border-bottom: 4rpx dashed #E3E3E3;
		}

		.bet-share {
			padding-top: 15rpx;
			display: flex;
			justify-content: space-between;
			.left-view{
				background: linear-gradient(90deg, #1FC408 0%, #2DC157 100%);
				-webkit-background-clip: text;  
				background-clip: text;  
				color: transparent; 
				 font-size: 26rpx;
			}
			.right-view{
				padding: 10rpx 15rpx;
				border-radius: 48rpx;
				background: linear-gradient(90deg, #1FC408 0%, #2DC157 100%);
				color: #fff;
				font-weight: 600;
				font-size: 20rpx;
				letter-spacing: 4rpx;
			}
		}
	}
	
	.type-img{
		width: 52rpx;
		height: 52rpx;
		margin-right: 10rpx;
	}
	
	.line {
		display: flex !important;
		padding: 10rpx;
	
		.label {
			color: #666666 !important;
			font-weight: 500;
		}
	
		.value {
			padding-left: 10rpx;
			color: #B1B1B1 !important;
		}
	}

	.cu-dialog {
		width: 80%;
		max-width: 500px;
		font-size: 28rpx;
		padding: 30rpx;
		border-radius: 20rpx;

		.padding-xl {
			padding: 0 !important;
		}

		.title-box {
			display: flex;
			align-items: center;
			position: relative;
			height: 76rpx;
			line-height: 76rpx;
			font-size: 40rpx;
			font-weight: 600;

			.close {
				position: absolute;
				top: 0;
				right: 0;
				width: 76rpx;
				height: 76rpx;
				border: none;
				border-radius: 0;
				background-color: transparent;
				font-size: 52rpx;
				color: #999999;
				
			}
		}

		.content-box {
			text-align: left;
			border-top: 4rpx dashed #E3E3E3;
			border-bottom: 4rpx dashed #E3E3E3;

			.info {
				padding: 20rpx 0rpx;
				font-size: 26rpx;
				color: #666666;

				.name {
					color: #2AC245;
					margin-right: 10rpx;
				}
			}

			.bet-info {
				padding: 20rpx 0rpx;
			}

			.bet-content {
				display: flex;
				overflow: auto;
				height: 240rpx;
				font-size: 32rpx;
				padding: 20rpx 32rpx;
				color: #323233;

				.value {
					margin-left: 10rpx;
				}
			}
		}
		
		.money-info{
			text-align: left;
			padding: 20rpx 0rpx;
			font-size: 26rpx;
			color: #666666;
			font-weight: 400;
			
			.bet-totalamount{
				font-size: 32rpx;
				color: #2BC247;
				font-weight: 600;
			}
			
			.money-value{
				margin-left: 10rpx;
			}
		}
		
		.enter-info{
			display: flex;
			align-items: center;
			color: #333333;
			font-size: 28rpx;
			font-weight: 600;
			text-align: left;
			margin-top: 15rpx;
			.left{
				width: 100%;
				display: flex;
				align-items: center;
				.coinSymbol{
					flex-shrink: 0;
					border-radius: 22rpx;
					border: 2rpx solid #2CC25150;
					font-size: 26rpx;
					color: #fff;
					text-align: center;
					margin-left: 8rpx;
					.value{
						flex-shrink: 0;
						min-width: 36rpx !important;
						height: 36rpx !important;
						margin: 2rpx;
						background-color: #20C50B;
						border-radius: 18rpx;
					}
				}
				.money-input{
					margin: 0 10rpx;
					padding: 0;
					text-align: center;
					border: none;
					background-color: transparent;
					border-bottom: 2rpx solid #20C50B;
				}
			}
			.right{
				width: 50%;
				display: flex;
				align-items: center;
				.icon-text,.icon-text-add{
					font-size: 50rpx;
					font-weight: 400;
					color: #B1B1B1;
					margin: 0rpx 10rpx;

				}
				
				.icon-text-add{
					color: #20C50B;
				}
				.multiple-input{
					width: 60rpx;
					margin: 0 10px;
					padding: 0;
					text-align: center;
					border: none;
					border-bottom: 2rpx solid #20C50B;
					background-color: transparent;
				}
			}
		}
		
		.bet-confirm{
			height: 84rpx;
			background: linear-gradient(97.67deg, #28C238 34.32%, #1FC40A 65.72%);
			display: flex;
			-webkit-box-align: center;
			-webkit-align-items: center;
			align-items: center;
			-webkit-box-pack: center;
			-webkit-justify-content: center;
			justify-content: center;
			color: #fff;
			font-size: 36rpx;
			border-radius: 50rpx;
			margin-top: 20rpx;
		}
	}
</style>