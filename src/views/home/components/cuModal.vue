<template>
	<div class="cu-modal" :class="{'show': showNumberBox }" style="z-index: 2001;">
		<div class="cu-dialog">
			<div class="cu-bar bg-white justify-end">
				<img class="close-img" src="/static/img/close.png" @click="conf.handleCloseBindDialog('close')" />
			</div>
			<div class="showBox-log">
				<img class="showimg" src="/static/img/bindBank-icon.png" mode="" />
			</div>
			<div class="showBox-content">
				<text>{{ $t('wallet.BindCard') }}</text>
				<div class="tip">
					<p>{{ $t('wallet.noPaymentMethods') }}</p>
				</div>
			</div>
			<div class="bind-btn-view">
				<div class="right-btn" style="margin-right: 64rem;" @click="conf.handleCloseBindDialog('bind')">
					{{ $t('home.bind') }}</div>
				<div class="left-btn" @click="conf.handleCloseBindDialog('close')">{{ $t('home.Close') }}</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import System from '@/utils/System';
import { reactive } from 'vue';
defineProps<{
	showNumberBox: boolean
}>()
const emit = defineEmits(['handleCloseBindDialog'])
const conf = reactive({
	handleCloseBindDialog(type: any) {	
		emit('handleCloseBindDialog')
		if (type == 'bind') {
			System.router.push('/user/me/BankCard')
		}
	}
})
</script>

<style lang="less" scoped>
.cu-modal {
	position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    outline: 0;
	opacity: 0;
    text-align: center;
    backface-visibility: hidden;
    perspective: 1104px;
    background: rgba(0, 0, 0, .6);
    transition: all .3s ease-in-out 0s;
    pointer-events: none;
	.cu-dialog {
		background-color: #fff;
		width: 520rem;
		border-radius: 35rem;
		position: relative;
		display: inline-block;
		vertical-align: middle;
		margin-left: auto;
		margin-right: auto;
		max-width: 100%;
		overflow: hidden;

		.cu-bar {
			height: 70rem;
			min-height: 70rem;
			display: flex;
			justify-content: flex-end;
			.close-img{
				width: 10px;
				height: 10px;
				margin-top: 30rem;
				margin-right: 40rem;
			}
		}


		.showimg {
			width: 200rem;
			height: 200rem;
		}

		.text-red {
			color: #CCCCCC;
			font-weight: bold;
			font-size: 28rem
		}

		.showBox-content {
			font-size: 32rem;
			color: #333;
			padding: 0 35rem;
			box-sizing: border-box;

		}

		.left-btn,
		.right-btn {
			text-align: center;
			background-color: #F17638;
			color: #fff;
			border-radius: 80rem;
			font-size: 26rem;
			font-weight: 600;
			height: 52rem;
			line-height: 52rem;
			min-width: 132rem;
			padding: 0rem 20rem;
		}

		.left-btn {
			background-color: #FFF2DF;
			color: #000000;
			opacity: 0.7;
		}


		.right-btn {
			background: linear-gradient(#FFA64F, #EB602D) !important;
			color: #fff;
		}

		.bind-btn-view {
			display: flex;
			// justify-content: space-around;
			justify-content: center;
			align-items: center;
			margin: 50rem 0rem;
		}

		.tip {
			text-align: center;
			color: #666666;
			font-size: 24rem;
			margin-top: 15rem;
			padding: 0 15rem;
		}

		.bind-btn {
			margin: 30rem auto 50rem;
			color: #fff;
			font-size: 40rem;
			height: 80rem;
			line-height: 80rem;
			width: 418rem;
			border-radius: 40rem;
			background: linear-gradient(to top, #EB602D, #FFA64F);
		}
	}
}
.cu-modal.show {
    opacity: 1;
    transition-duration: .3s;
    -ms-transform: scale(1);
    -webkit-transform: scale(1);
    transform: scale(1);
    overflow-x: hidden;
    overflow-y: auto;
    pointer-events: auto;
}
.cu-modal::before {
    content: "\200B";
    display: inline-block;
    height: 100%;
    vertical-align: middle;
}
</style>