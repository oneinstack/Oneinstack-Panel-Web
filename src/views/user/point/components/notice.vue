<template>
	<div class="tip">
		<img class="tip-icon" src="/static/img/point/point-notice.png" />
		<div style="width: 100%;overflow: hidden;">
			<div class="tip-content">
				<div style="display: inline-block;align-items: center;">
					<span style="color: #fff;">{{ integralNum }}</span>
					{{ $t('point.pointSmall') }},
					{{ $t('point.themRedeem') }}
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
const props = defineProps({
	integralNum: {
		default: 0 as any
	}
})
</script>

<style lang="less" scoped>
.tip {
	display: flex;
	align-items: center;
	padding: 0rem 15rem;
	height: 46rem;
	width: 64%;
	border-radius: 23rem;
	background: #FFFFFF33;
	margin: 10rem 0rem;
	margin-left: 16%;

	.tip-icon {
		width: 24rem;
		height: 22rem;
		margin-right: 16rem;
		flex-shrink: 0;
	}

	.tip-content {
		font-size: 22rem;
		color: #F33A00;
		display: inline-block;
		white-space: nowrap;
		animation: u-loop-animation 15s linear infinite both;
		text-align: right;
		padding-left: 100%;
		flex-wrap: nowrap;
	}

	@keyframes u-loop-animation {
		0% {
			transform: translate3d(0, 0, 0);
		}

		100% {
			transform: translate3d(-100%, 0, 0);
		}
	}
}
</style>