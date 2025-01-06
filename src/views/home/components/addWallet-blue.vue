<template>
	<div>
		<div class="popup-mask" @click="conf.closePopup"></div>
		<div class="popup">
			<div class="popup-content" :style="{ transform: `translateY( ${conf.translateY}%)` }">
				<div class="popup-title">
					<text>{{ $t('wallet.AddWallet') }}</text>
					<img class="close-img" src="/static/img/close.webp" @click="conf.closePopup" />
				</div>
				<div class="bet-type">
					<text>{{ $t('wallet.wantAddWallet') }}</text>
				</div>
				<div class="select-box">
					<div class="bet-btn">
						<text class="left-btn" @click="conf.submit">{{ $t('wallet.correct') }}</text>
						<text class="right-btn" @click="conf.closePopup"><span>{{ $t('wallet.deny') }}</span></text>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
<script setup lang="ts">
import { reactive } from 'vue';
const emit = defineEmits(['dialogDataSubmit', 'sendData'])
const conf = reactive({
	num: 10,
	translateY: 0,
	//数据提交
	submit() {
		emit('dialogDataSubmit')
	},
	//关闭弹窗
	closePopup() {
		//向父组件传值
		emit("sendData", false)
	},
})
</script>
<style lang="less" scoped>
.popup-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0rem;
	z-index: 9996;
	background: rgba(0, 0, 0, 0.5);
	max-width: 750rem;
	margin: 0 auto;
}

.popup {
	position: fixed;
	z-index: 9998;
	bottom: 0rem;
	width: 100%;
	max-width: 750rem;
	margin: 0 auto;

	.popup-content {
		border-radius: 16rem 16rem 0rem 0rem;
		background: #FFF;
		padding-bottom: 80rem;

		.popup-title {
			padding: 40rem 40rem 0rem;
			color: rgb(37, 37, 41);
			font-size: 28rem;
			font-weight: bold;
			display: flex;
			justify-content: space-between;
			align-items: center;

			.close-img {
				width: 48rem;
				height: 48rem;
			}
		}

		.bet-type {
			padding: 24rem;
            background: #F6F7FA;
			display: flex;
			justify-content: center;
			font-weight: bold;
		}

		.select-box {
			.bet-btn {
				display: flex;
				justify-content: center;
				align-items: center;
				margin-top: 30rem;
			}

			.left-btn {
				padding: 10rem 50rem;
                background: linear-gradient(93.51deg, #006FFF 5.72%, #087BFF 86.61%);
				border-radius: 20rem;
				margin-right: 100rem;
				color: #fff;
			}

			.right-btn {
				padding: 10rem 50rem;
                background: #E6F2FF;
				border-radius: 20rem;
				margin-right: 10rem;
                span{
                    background: linear-gradient(93.51deg, #006FFF 5.72%, #087BFF 86.61%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
			}
		}
	}
}
</style>