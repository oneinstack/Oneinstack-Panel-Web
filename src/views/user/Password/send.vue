<template>
	<view class="box">
		<head-nav :isWallet="false">Verification code</head-nav>
        <!-- content -->
        <view class="content-view" scroll-y="true">
			<view class="content-title">
				A
				<text class="into-text"> verification code </text>
				has been sent to your phone
			</view>
			<view class="phone-view">
				{{infoObj.phone}}
			</view>
			
			<view class="title">Verification code</view>
			<view class="cu-form-group">
				<input placeholder="Please enter the verification code" v-model="infoObj.code"/>
			</view>
			<view class="countdown-view">
				<text>It takes about</text> 
				<text class="number">{{infoObj.countdown}}</text> 
				<text>seconds to receive a text message</text>
			</view>
			
			<!-- btn -->
			<view class="btn-view">
			    <view @click="handleDataSubmit">Next</view>
			</view>
        </view>
	</view>
</template>
<script>
    let appObj = getApp()
	export default {
		data() {
			return {
				infoObj:{
					phone:'12345678901',
					code:'',
					countdown:'5',
				},
				timer: null  // 定时器名称
			};
		},
		onLoad(){
			this.timer = setInterval(() => {
				this.infoObj.countdown > 0 && (this.infoObj.countdown -= 1)
				this.infoObj.countdown == 0 && clearInterval(this.timer)
			}, 1000)
		},
		onHide() {
			if(this.timer) {
				clearInterval(this.timer)
				this.timer = null
			}
		},
		onUnload() {
			if(this.timer) {
				clearInterval(this.timer)
				this.timer = null
			}
		},
		methods: {
			//返回
			goBack() {
				this.pageBack()
			},
			
			//数据提交
			handleDataSubmit(){
				uni.navigateTo({
				    url: '/user/Password/modify?hasOldPassword=' + false
				})
			},

		},
		beforeDestroy() {
		    clearInterval(this.timer);        
		    this.timer = null;
		},
	}
</script>

<style lang="less" scoped>

.box{
    width: 100%;
    height: 100% !important;
	background: #fff;

	.content-view{
		padding: 30rpx;
		width: 100%;
		font-weight: 500;
		color: #000000;
		.content-title{
			text-align: center;
			color:#828282;
			font-weight: 500;
			font-size: 32rpx;
			padding: 20rpx 30rpx;
			
			.into-text{
				margin: 0px 15rpx;
				background: linear-gradient(to bottom, #EB602D, #FFA64F);
				-webkit-background-clip: text; /* 使用-webkit-前缀兼容部分浏览器 */
				background-clip: text;
				color: transparent;
				
			}
		}
		
		.phone-view{
			color: #000;
			font-size: 40rpx;
			font-weight: 500;
			text-align: center;
			margin-top: 30rpx;
		}
		
		.title{
			margin-top: 50rpx;;
			font-size: 32rpx;
			font-weight: 500;
			opacity: 0.7;
		    color: #000000;
		    padding: 20rpx 30rpx;
		}
		
		.cu-form-group,.uni-input-wrapper,.uni-input-placeholder{
		    background: #FFFBF5;
		    border-radius: 10rpx;
			min-height: 72rpx !important;
		    height: 72rpx !important;
			line-height: 72rpx !important;
			color:#A8A8A8;
			opacity: 0.7;
			font-weight: 500;
			font-size: 24rpx;
		}
		
		
		.countdown-view{
			color: #A8A8A8;
			margin-top: 20rpx;
			font-size: 20rpx;
			font-weight: 500;
			opacity: 0.7;
			padding: 20rpx 30rpx;
			
			.number{
				color: #4D4D4D;
				margin: 0rpx 15rpx;
			}
		}
		
		.btn-view{
			margin-top: 150rpx;
			width: calc(100% - 60rpx);
			background: linear-gradient(180deg, #EB602D 0%, #FFA64F 160%);
			border-radius: 82rpx;
			text-align: center;
			color: #fff;
			font-weight: 500;
			font-size: 40rpx;
			height: 100rpx;
			line-height: 100rpx;
			margin-left: 30rpx;
		}
		
		
	}

    

}


</style>
