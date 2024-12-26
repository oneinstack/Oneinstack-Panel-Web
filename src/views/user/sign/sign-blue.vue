<template>
	<x-page :no-footer="true" :topfill="false" headerBgColor="transparent">
		<template #title>
			{{ $t('point.signIn') }}
		</template>
		<div class="mian">
			<x-statusbar header />
			<div class="sign-bg">
				<div class="sign-img">
					<img src="/static/theme/blue/calendar.webp" />
				</div>
				<div class="tips">
					<div class="surprise">{{ $t('signInModule.SurpriseBenefit') }}</div>
					<div>{{ $t('signInModule.Continuous') }}</div>
				</div>
			</div>
		</div>
		<div class="sign">
			<div class="sign-icon">
				<div class="icon-item"></div>
				<div class="icon-item"></div>
			</div>
			<div class="sign-box">
				<div class="title">{{ conf.signDay + $t('signInModule.row') }}</div>
				<div class="time-list">
					<template v-for="(item, itemIndex) in conf.signList">
						<div class="time-item"
							:class="[item.isSgnin ? 'active' : '', itemIndex == conf.isClickIndex ? 'has-box-hadow' : '']"
							v-if="itemIndex != conf.signList.length - 1"
							@click="itemIndex == conf.isClickIndex ? conf.handleSign(itemIndex) : ''"
							@touchstart="conf.handleTouchstart()" @touchend="conf.handleTouchend()">
							<div class="item-title">{{ $t(`signInModule.signList.${itemIndex + 1}`) }}</div>
							<div class="item-score">
								<img class="money" src="/static/img/wallet/rechange/coin.png" />
								<text class="coin-number" v-if="!item.isSgnin">{{ item.signMoney }}</text>
								<div class="cuIcon-check" v-else>
									<van-icon name="success" />
								</div>
							</div>
						</div>
						<div class="time-item"
							:class="[item.isSgnin ? 'active' : '', itemIndex == conf.isClickIndex ? 'has-box-hadow' : '']"
							style="flex: 1;" v-else
							@click="itemIndex == conf.isClickIndex ? conf.handleSign(itemIndex) : ''">
							<div class="item-title">{{ $t(`signInModule.signList.${itemIndex + 1}`) }}</div>
							<div class="item-score">
								<img class="money" src="/static/img/wallet/rechange/coin.png" />
								<text class="coin-number" v-if="!item.isSgnin">{{ item.signMoney }}</text>
								<div class="cuIcon-check" v-else>
									<van-icon name="success
" />
								</div>
							</div>
						</div>
					</template>
				</div>
				<div class="sign-in" @click="conf.handleSign(null)">
					{{ $t('point.signIn') }}
				</div>
				<div class="footTip">
					<text>※ {{ $t('signInModule.explain') }}</text>
				</div>
			</div>
		</div>
	</x-page>
</template>

<script setup lang="ts">
import { index } from './sign'
import stheme from '@/sstore/stheme'

const conf = index()
</script>

<style lang="less" scoped>

.mian {
	background: linear-gradient(to right, rgb(0, 111, 255) 0%, rgb(16, 127, 253) 100%);
}

.sign-bg {
	min-height: 400rem;
	position: relative;

	.sign-img {
		width: 212rem;
		height: 256rem;
		position: absolute;
		left: 490rem;
		top: -30rem;

		img {
			width: 100%;
			height: 100%;
		}
	}

	.sign-date-img {
		width: 350rem;
		height: 350rem;
		position: absolute;
		right: 10rem;

		image {
			width: 100%;
			height: 100%;
		}
	}

	.tips {
		padding: 80rem 48rem 0rem;
		color: #FFF;
		font-size: 24rem;

		.surprise {
			font-size: 40rem;
			margin-bottom: 12rem;
		}
	}
}

.sign {
	padding: 0rem 30rem;
	position: relative;
	top: -150rem;

	.sign-icon {
		display: flex;
		justify-content: space-between;
		padding: 0rem 28rem;
		position: absolute;
		left: 75rem;
		right: 75rem;
		top: -23rem;

		.icon-item {
			height: 55rem;
			width: 13rem;
			border-radius: 22rem;
			background: #8FA9FF;
		}
	}

	.sign-box {
		border-radius: 42rem;
		background: linear-gradient(360deg, #FFFFFF 85%, #D1DFFF 100%);
		padding: 60rem 48rem;
		box-shadow: 0px 4px 10px 0px #4F81FF26;


		.title {
			color: #4C3629;
			font-size: 48rem;
			text-align: center;
			margin-bottom: 34rem;
		}

		.time-list {
			display: flex;
			justify-content: space-between;
			flex-wrap: wrap;

			.time-item {
				border-radius: 22rem;
				opacity: 0.9004;
				background: #E6F2FF;
				// width: 184rem;
				width: 31%;
				height: 212rem;
				padding: 16rem 22rem;
				display: flex;
				flex-direction: column;
				justify-content: space-between;
				align-items: center;
				margin-bottom: 20rem;
				color: #087BFF;

				// &:hover{
				// 	box-shadow: 0 2rem 20rem #FD7334;
				// }
				.item-title {
					font-size: 22rem;
				}

				.item-score {
					display: flex;
					flex-direction: column;
					justify-content: center;
					align-items: center;
					position: relative;
					height: 142rem;
					line-height: 142rem;

					.money {
						width: 142rem;
						height: 142rem;
					}

					.coin-number {
						position: absolute;
						top: 0rem;
						color: #DC8F2B;
						font-size: 28rem;
					}

					.signed-img {
						position: absolute;
						top: 24rem;
						// color: #DC8F2B;
						width: 50rem;
						height: 50rem;
					}

					.cuIcon-check {
						position: absolute;
						top: 10rem;
						color: #DC8F2B;
						font-size: 66rem;
						font-weight: bolder;
					}
				}

				&.active {
					background: linear-gradient(109.77deg, #087BFF 4.47%, #0645D9 138.81%);
					color: #fff;
				}

			}

			.has-box-hadow {
				&:hover {
					box-shadow: 0 2rem 20rem #087BFF;
				}
			}

		}

		.sign-in {
			height: 100rem;
			background: linear-gradient(93.51deg, #006FFF 5.72%, #087BFF 86.61%);
			border-radius: 74rem;
			color: #FFF;
			font-size: 48rem;
			display: flex;
			justify-content: center;
			align-items: center;
			margin-top: 50rem;
		}
	}

	.sign-info {
		display: flex;
		color: #4C3629;
		opacity: 0.7;
		font-size: 32rem;
		margin-top: 30rem;
	}

	.touch-class {
		box-shadow: 0 2rem 20rem #FD7334;
	}

}

.footTip {
	margin-top: 20rem;
	color: #919191;
	font-size: 24rem;
}
</style>