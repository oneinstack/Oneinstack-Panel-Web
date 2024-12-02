<template>
	<div v-if="conf.isOpen">
		<div class="open">
			<div class="popup-mask" @click="close"></div>
			<div class="modal">
				<div class="title">{{ conf.title }}</div>
				<div class="btn-list">
					<div class="btn-item" @click="close">{{ $t('version.cancelText') }}</div>
					<div class="btn-item sure" @click="emit('confirm')">{{ $t('version.confirmText') }}</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';

const emit = defineEmits(['confirm'])
const conf = reactive({
	isOpen: false,
	title: ''
})
const close = () => {
	conf.isOpen = false
}
const open = (e:any) => {
	conf.title = e.title
	conf.isOpen = true
}
defineExpose({
	close,
	open
})
</script>

<style lang="less" scoped>
.popup-mask {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 2;
	background: rgba(0, 0, 0, 0.3);
}

.open {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 999;
}

.modal {
	position: relative;
	z-index: 9;
	width: 560rem;
	padding: 66rem 65rem 72rem;
	border-radius: 40rem;
	background: #FFF;
	box-shadow: 10px 10px 20px 0px rgba(255, 255, 255, 0.25), -10px -10px 20px 0px rgba(255, 255, 255, 0.25);

	.title {
		font-weight: 600;
		color: #000;
		font-size: 32rem;
		text-align: center;
		opacity: 0.7;
		line-height: 44rem;
	}

	.btn-list {
		display: flex;
		justify-content: space-between;
		padding: 0rem 10rem;
		margin-top: 65rem;

		.btn-item {
			height: 65rem;
			width: 175rem;
			display: flex;
			align-items: center;
			justify-content: center;
			border-radius: 80rem;
			background: #FFF2DF;
			color: #000;
			font-weight: 600;
			font-size: 26rem;

			&.sure {
				background: linear-gradient(180deg, #EB602D 0%, #FFA64F 100%);
				color: #FFF;
			}
		}
	}
}
</style>