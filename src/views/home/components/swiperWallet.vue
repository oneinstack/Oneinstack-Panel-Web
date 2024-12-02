<template>
	<swiper :effect="'cards'" loop :grabCursor="true" :modules="conf.modules" class="mySwiper"
		@slideChange="conf.onSwiper">
		<swiper-slide v-for="(item, index) in swiperList" :key="index">
			<div class="s-item">
				<img class="coin-img" :src="item.coinImg" />
				<!-- <div class="coin-img">
						<x-load-img :src="item.coinImg"></x-load-img>
					</div> -->
				<div style="position: relative;z-index: 8;width: 100%;height: 100%;">
					<img class="opacity-img" src="/static/img/wallet/opacity_img.png" @click='conf.handleAddWallet(item,index)' v-if="!item.hasWallet" />
					<div class="wallet-content" v-if="item.hasWallet && defaultCoin">
						<div class="walletCoin">{{ item.walletCoin }}</div>
						<div class="money">
							{{ item.openEye ? (item.coinSymbol == 'USDT' ? item.coinSymbol + ' ' +
								sutil.dataHandling(item.walletMoney) : item.coinSymbol +
							sutil.dataHandling(item.walletMoney))
								:
								item.hidden_amount }}
						</div>
						<div v-if="item.openEye && item.coinSymbol != defaultCoin.coinSymbol"
							:class="[item.openEye && item.coinSymbol != defaultCoin.coinSymbol ? 'dollar' : '']">
							{{ '≈' + defaultCoin.coinSymbol + item.defaultCoinMoney }}
						</div>
						<div class="total-balance-view"
							:class="item.coinCode == defaultCoin.coinCode ? 'total-balance_default' : ''">
							<span>{{ $t('wallet.totalBalance') }}</span>
							<img v-if="!item.openEye" @click.stop="conf.handleWalletEyeClick(item, index)"
								class="eye-img" src="/static/img/wallet/eye-open.png" />
							<img v-else @click.stop="conf.handleWalletEyeClick(item, index)" class="eye-img"
								src="/static/img/wallet/eye-close.png" />
						</div>
					</div>
					<div v-if="item.hasWallet">
						<div class="absolute" style="top: 15rem;right: 40rem;"
							:style="{ pointerEvents: item.id == sconfig.userInfo.defaultWalletId ? 'none' : 'all' }">
							<div class="relative flex flex-center">
								<img style="width: 70rem;height: 70rem;"
									:src="`/static/img/wallet/w-${item.id === sconfig.userInfo.defaultWalletId ? 'default' : 'change'}.png`"
									@click.stop="conf.handleDefaultwallet" />
								<span class="absolute" style="color: #fff;pointer-events: none;"
									:style="{ fontSize: item.coinSymbol.length > 2 ? '12rem' : '20rem' }">{{
										item.coinSymbol
									}}</span>
							</div>
						</div>
					</div>
					<div class="add-wallet-name" v-else>{{ item.coinCode }}</div>
					<img v-if="!item.walletStatus == item.hasWallet" @click.stop="conf.handleLockClick" class="lock-img"
						:class="conf.isShake ? 'animation-shake' : ''" src="/static/img/wallet/lock.png" />
				</div>
			</div>
		</swiper-slide>
	</swiper>
</template>
<script setup lang="ts">
import { Swiper, SwiperSlide } from 'swiper/vue';

// Import Swiper styles
import 'swiper/css';

import 'swiper/css/effect-cards';

// import required modules
import { EffectCards } from 'swiper/modules';

import { onMounted, reactive } from 'vue';
import sutil from '@/sstore/sutil';
import sconfig from '@/sstore/sconfig';
import i18n from '@/lang';

const props = defineProps({
	swiperList: {
		default: [] as any[]
	},
	defaultCoin: {
		default: {} as any
	}
})
const emit = defineEmits(['eyeClick', 'swiper', 'changeDefault', 'addWallet'])
const conf = reactive({
	modules: [EffectCards],
	isShake: true,
	current: 0,
	handleWalletEyeClick(obj: any, index: any) {
		props.swiperList[index].openEye = !obj.openEye
		obj.hidden_amount = '*'.repeat(obj.coinTousdt.length)
	},
	// 滑动切换钱包
	onSwiper(e: any) {
		if (conf.current != e.realIndex) {	
			conf.current = e.realIndex
			emit('swiper', e.realIndex)
		}

	},
	// 设置默认钱包
	handleDefaultwallet() {
		emit('changeDefault')
	},
	// 添加钱包
	handleAddWallet(obj: any,index: number) {
		emit('addWallet',{obj,index})
	},
	handleLockClick() {
		conf.isShake = true
		setTimeout(() => {
			conf.isShake = false
		}, 3000);
		i18n.t(('common.contactAdministrator'))
	}
})
onMounted(() => {
	

})
</script>
<style lang="less" scoped>
.banner_box {
	width: 100%;
	height: 350rem;
	overflow: hidden;
	background: #fff;

	.swiper {
		height: 100%;

		.swiper-wrapper {
			height: 100%;

			.swiper-slide {
				width: 320px !important;
				height: 100%;

			}
		}
	}
}

.s-item {
	display: block;
	width: 100%;
	height: 100%;
	position: relative;
	background-repeat: no-repeat;
	background-size: 100% 100%;
	border-radius: 30rem;
	position: relative;
	// box-shadow: 0px -2px 10px 0px red;

	.coin-img {
		width: 100%;
		height: 100%;
		position: absolute;
		top: 0;
		right: 0;
		width: 100%;
		height: 100%;
	}

	.opacity-img {
		width: 100%;
		height: 100%;
	}

	.wallet-content {
		padding: 25rem 0 0 60rem;

		.walletCoin {
			margin-top: 20rem;
			font-size: 40rem;
		}

		.money {
			font-size: 42rem;
			font-weight: 400;
		}

		.dollar {
			margin-top: 10rem;
			font-size: 28rem;
			font-weight: 100;
		}

		.total-balance-view {
			display: flex;
			align-items: center;
			line-height: 0rem !important;
			margin-top: 10rem;
		}

		.total-balance-view span {
			font-size: 26rem;
			font-weight: 500;
		}

		.eye-img {
			margin-left: 20rem;
			width: 28rem;
			height: 28rem;
			background-size: contain;
			z-index: 999;
		}
	}

	.add-wallet-name {
		position: absolute;
		top: 30rem;
		letter-spacing: 5rem;
		left: 20rem;
		line-height: 56rem;
		font-size: 100rem;
		opacity: 0.2;
		color: #fff;
		mix-blend-mode: overlay;
	}

	.lock-img {
		position: absolute;
		z-index: 3;
		top: calc(50% - 52rem);
		right: 60rem;
		width: 52rem;
		height: 60rem;
	}

	.animation-shake {
		animation: shake 0.3s !important;
	}

	@keyframes shake {

		0%,
		100% {
			transform: translateX(0)
		}

		30% {
			transform: translateX(-7px)
		}

		60% {
			transform: translateX(4px)
		}

		90% {
			transform: translateX(-1px)
		}
	}
}

.swiper {
	width: 580rem;
	height: 350rem;
}

.swiper-slide {
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 18px;
	font-size: 22px;
	font-weight: bold;
	color: #fff;
	box-shadow: 2px 2px 10px 0px rgba(0, 0, 0, 0.5);
}

.swiper-slide:nth-child(1n) {
	background-image: linear-gradient(90deg, #e6e6e6 0%, #d8d8d8 50%, #e6e6e6 100%);
	background-size: 100% 100%;
}

.swiper-slide:nth-child(2n) {
	background-color: rgb(0, 140, 255);
}

.swiper-slide:nth-child(3n) {
	background-color: rgb(10, 184, 111);
}

.swiper-slide:nth-child(4n) {
	background-color: rgb(211, 122, 7);
}

.swiper-slide:nth-child(5n) {
	background-color: rgb(118, 163, 12);
}

.swiper-slide:nth-child(6n) {
	background-color: rgb(180, 10, 47);
}

.swiper-slide:nth-child(7n) {
	background-color: rgb(35, 99, 19);
}

.swiper-slide:nth-child(8n) {
	background-color: rgb(0, 68, 255);
}

.swiper-slide:nth-child(9n) {
	background-color: rgb(218, 12, 218);
}

.swiper-slide:nth-child(10n) {
	background-color: rgb(54, 94, 77);
}
</style>