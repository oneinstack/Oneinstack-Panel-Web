<template>
	<x-page :no-footer="true" :headerBgColor="conf.bgcolor" :topfill="false">
		<template #title>
			{{ $t('point.signIn') }}
		</template>
		<div class="mian">
			<x-statusbar header />
			<div class="sign-bg">
				<div class="sign-img">
					<img src="/static/img/sign/calendar.png" />
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
import { svalue } from '@/sstore/svalue';
import { onMounted, reactive } from 'vue';
import i18n from '@/lang';
import { apis } from '@/api';
import System from '@/utils/System';
import { Scope } from 'tools-vue3';
import { EPage } from '@/enum/Enum';
const conf = reactive({
	currentSign: 1,
	signList: [] as any[],
	signDay: '',
	isTouch: false,
	isClickIndex: 0,
	bgcolor: '',
	//获取签到列表数据
	async loadData() {
		svalue.coinlist = []
		let clist = await svalue.getCoinlist()
		let defaultCoinWallet = clist.find(item => item.isDefault)
		let datas = Cookie.get('signData')
		let index = 0
		datas.forEach((item: any, itemIndex: any) => {
			item.isSgnin && (index += 1)
			item.signMoney = item.signinAward ? defaultCoinWallet.coinSymbol + item.signinAward : '0'
		})
		conf.signDay = i18n.t(`signInModule.signList.${index}`)
		conf.signList = datas
		conf.isClickIndex = 0
		conf.signList?.forEach((item: any) => {
			item.isSgnin && (conf.isClickIndex += 1)
		})
	},

	//长按开始
	handleTouchstart() {
		conf.isTouch = true
	},

	//长按结束
	handleTouchend() {
		conf.isTouch = false
	},

	//签到数据提交
	handleSign(index: any) {
		if (!index) {
			index = 0
			conf.signList?.forEach((item, itemIndex) => {
				item.isSgnin && (index = itemIndex)
			})
		}
		apis.savaSigninRecord({
			success: (res: any) => {
				System.toast(i18n.t(`code.${res.code}`) || 'success', 'success')
				conf.signList[index].isSgnin = 1
				Cookie.set('signData', conf.signList)
			}
		});
	},
})
onMounted(() => {
	conf.loadData()
})
const event = Scope.Event()
event.on(EPage.scroll, (e) => {
	if (e.top > 50) {
		conf.bgcolor = 'linear-gradient(180deg, #EB602D 0%, #FFA64F 160%)'
	} else {
		conf.bgcolor = ''
	}
})
</script>

<style lang="less" scoped>

.mian {
	background: linear-gradient(119deg, #ED6731 -0.53%, #FFA64F 94.28%);
}

.sign-bg {
	min-height: 400rem;
	position: relative;

	.sign-img {
		width: 350rem;
		height: 350rem;
		position: absolute;
		right: 0rem;
		top: -50rem;

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
			background: #FEDBAC;
		}
	}

	.sign-box {
		border-radius: 42rem;
		background: linear-gradient(180deg, #FCFBE8 -6.45%, #FFF 29.03%);
		box-shadow: 0px 4px 10px 0px rgba(255, 166, 79, 0.20);
		padding: 60rem 48rem;

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
				background: #FFF1DE;
				// width: 184rem;
				width: 31%;
				height: 212rem;
				padding: 16rem 22rem;
				display: flex;
				flex-direction: column;
				justify-content: space-between;
				align-items: center;
				margin-bottom: 20rem;
				color: #C6924D;

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
					background: linear-gradient(180deg, #FD7334 0%, #FF9F4C 100%);
					color: #FFF;
				}

			}

			.has-box-hadow {
				&:hover {
					box-shadow: 0 2rem 20rem #FD7334;
				}
			}

		}

		.sign-in {
			height: 100rem;
			background: linear-gradient(180deg, #EB602D 0%, #FFA64F 100%);
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