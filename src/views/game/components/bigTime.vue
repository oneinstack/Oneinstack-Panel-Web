<template>
	<div class="big-time" :class="{ 'flex-center': marginTop == 0 }" :style="{ 'border-radius': radius + 'rem' }">
		<div class="big-down-time" :style="{ 'marginTop': marginTop + 'rem' }">
			<div class="big-time-item red-bg">{{ seconds[0] }}</div>
			<div class="big-time-item red-bg">{{ seconds[1] }}</div>
		</div>
	</div>
</template>

<script setup lang="ts">
const props = defineProps({
	// 倒计时5秒
	seconds: {
		default: ''
	},
	// 距离顶部的距离 为0或不传为居中对齐
	marginTop: {
		default: 0
	},
	// 距离顶部的距离 为0或不传为居中对齐
	radius: {
		default: 10
	}
})
</script>

<style lang="less" scoped>
.red-bg {
	border: none;
	color: #fff;
	background: linear-gradient(180deg, #F6843F 0%, #FEA14D 100%);
}

.flex-center {
	display: flex;
	align-items: center;
	justify-content: center;
}

.big-time {
	position: absolute;
	left: 0;
	top: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, .6);
	z-index: 9;
	border-radius: 20rem;

	.big-down-time {
		display: flex;
		justify-content: center;
		align-items: center;
		// margin-top: 50rem;

		.big-time-item {
			width: 170rem;
			height: 240rem;
			font-weight: 600;
			font-size: 200rem;
			border-radius: 10rem;
			display: flex;
			justify-content: center;
			align-items: center;

			&:first-of-type {
				margin-right: 20rem;
			}
		}
	}
}
</style>