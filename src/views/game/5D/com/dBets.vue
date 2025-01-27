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
		padding: 80rem 0 10rem;
		.game-default-img{
			width: 290rem;
			height: 290rem;
		}
		.no-data{
			color: #96979B;
			font-size: 28rem;
			margin-top: 20rem;
		}
	}
</style>