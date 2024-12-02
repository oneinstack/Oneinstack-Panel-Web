<template>
	<div class="change-box" v-if="conf.show">
		<div class="change-content">
			<img class="change-pop-img" src="/static/img/point/change-pop.png" />
			<img class="close-img" src="/static/img/point/close.png" @click="conf.closePop" />
			<div class="top-bg"></div>
			<div class="content">
				<div class="pop-title">{{ $t('point.pointsRedemption') }}</div>
				<div style="height: 180rem;">
					<img class="box-img" mode="heightFix" :src="conf.imgUrl" v-if="conf.getImgUrl(conf.imgUrl)" />
					<img class="box-img" mode="heightFix" :src="`/static/img/point/${conf.imgUrl}.png`" v-else />
				</div>
				<div class="conditions">
					<div>{{ $t('point.redemptionConditions') }}:</div>
					<div style="margin: 8rem;">VIP{{ conf.vipLevel || ' ' + $t('point.all') }}</div>
				</div>
				<div style="display: flex;justify-content: center;">
					<div class="num">
						<div class="num-change num-left" @click="conf.reduce">-</div>
						<input class="num-input" v-model="conf.num" @input="conf.input" />
						<div class="num-change num-right" @click="conf.add">+</div>
					</div>
				</div>
				<div class="btn-list">
					<div class="btn" @click="conf.closePop">{{ $t('wallet.deny') }}</div>
					<div class="btn confirm" :class="{ 'disabled': conf.showConfirm() }" @click="conf.confirm">
						{{ $t('wallet.correct') }}</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import i18n from '@/lang';
import System from '@/utils/System';
import { nextTick, reactive } from 'vue';

const emit = defineEmits(['submit'])
const conf = reactive({
	num: 1,
	show: false,
	vipLevel: '',
	imgUrl: '',
	userVipLevel: '',
	closePop() {
		conf.show = false
	},
	showConfirm() {
		if (!conf.vipLevel) return false
		let arr = conf.vipLevel.split(',')
		return !arr.includes(conf.userVipLevel)
	},
	confirm() {
		let userVip = conf.showConfirm()
		if (userVip) {
			System.toast(i18n.t('code.2603'))
			conf.show = false
			return
		}
		if (conf.num == 0) conf.num = 1
		conf.show = false
		emit('submit', conf.num)
	},
	getImgUrl(url: any) {
		if (!url) return false
		if (url.indexOf('http') != -1) {
			return true
		}
		return false
	},
	add() {
		let num1 = Math.floor(conf.num)
		if (num1 < 10) conf.num = num1 + 1
	},
	reduce() {
		let num1 = Math.floor(conf.num)
		if (num1 > 1) conf.num = num1 - 1
	},
	input(e: any) {
		let value: any = conf.num
		// 删除数字之外的字符
		let arr = (value.match(/[^0-9]/g)) || null
		let inputval = value.toString()
		if (arr) {
			for (let i = 0; i < arr.length; i++) {
				let index = inputval.indexOf(arr[i])
				inputval = inputval.split(arr[i]).join('')
			}
		}
		nextTick(() => {
			let inputNum = parseInt(inputval)
			if (inputNum < 1) return conf.num = 1
			if (inputNum > 10) return conf.num = 10
			conf.num = inputval
		})
	}
})
const showPop = (e: any) => {
	conf.num = 1
	conf.vipLevel = e.vipLevel
	conf.imgUrl = e.url
	conf.userVipLevel = e.userVipLevel + ''
	conf.show = e.show
}
defineExpose({ showPop })
</script>

<style lang="less" scoped>
.change-box {
	position: fixed;
	top: 0;
	width: 100%;
	height: 100%;
	z-index: 10;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: rgba(0, 0, 0, .3);
	max-width: 500px;
	z-index: 9999;

	.change-content {
		width: 80%;
		border-radius: 30rem;
		position: relative;
		background: #fff;
		text-align: center;

		.top-bg {
			position: absolute;
			left: 0;
			right: 0;
			top: 0;
			height: 140rem;
			z-index: 0;
			background: linear-gradient(180deg, #FFDDBE 0%, rgba(255, 255, 255, 0) 100%);
			border-radius: 30rem;
		}

		.change-pop-img {
			position: absolute;
			left: 15%;
			right: 0rem;
			top: -120rem;
			height: 180rem;
			z-index: 1;
			width: 70%;
		}

		.close-img {
			width: 45rem;
			height: 45rem;
			position: absolute;
			right: 0;
			top: -80rem;
		}

		.content {
			position: relative;
			z-index: 1;
		}

		.pop-title {
			background: linear-gradient(328.56deg, #FF7502 18.81%, #FC9B01 77.66%);
			-webkit-background-clip: text;
			background-clip: text;
			color: transparent;
			font-size: 38rem;
			font-weight: bold;
			margin-top: 60rem;
		}

		.box-img {
			height: 160rem;
			margin: 20rem 0 10rem;
		}

		.conditions {
			color: #AAAAAA;
			padding: 0rem 120rem;
		}

		.num {
			margin: 20rem;
			display: flex;
			border: 1rem solid #EFEFEF;
			border-radius: 25rem;
			font-size: 26rem;
			height: 50rem;

			.num-change {
				color: #333;
				width: 45rem;
				height: 100%;
				display: flex;
				align-items: center;
				justify-content: center;
			}

			.num-left {
				border-right: 1rem solid #EFEFEF;
			}

			.num-right {
				border-left: 1rem solid #EFEFEF;
			}

			.num-input {
				width: 100rem;
				color: #FF7502;
				font-size: 25rem;
				height: 100%;
				text-align: center;
			}
		}

		.btn-list {
			display: flex;
			justify-content: center;
			margin: 30rem 0rem 40rem;

			.btn {
				background: #FFF2DF;
				padding: 10rem 25rem;
				border-radius: 36rem;
				font-size: 22rem;
			}

			.confirm {
				background: linear-gradient(328.56deg, #FF7502 18.81%, #FC9B01 77.66%);
				color: #FFF;
				margin-left: 80rem;
			}

			.disabled {
				filter: grayscale(1);
			}
		}
	}
}
</style>