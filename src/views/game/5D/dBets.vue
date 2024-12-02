<template>
	<view class="d5-bets1">
		<view class="not-bet">
			<image class="game-default-img" src="/static/img/game/game-image-default.png"></image>
			<view class="no-data">No data</view>
		</view>
	</view>
</template>

<script>
	export default {
		name:"game-5d-bets",
		data() {
			return {
				
			};
		},
		mounted() {
			
		},
		methods: {
			
		}
	}
</script>

<style lang="less" scoped>
	.not-bet {
		text-align: center;
		padding: 80rpx 0 10rpx;
		.game-default-img{
			width: 290rpx;
			height: 290rpx;
		}
		.no-data{
			color: #96979B;
			font-size: 28rpx;
			margin-top: 20rpx;
		}
	}
</style>