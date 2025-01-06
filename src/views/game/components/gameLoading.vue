<template>
	<div class="loading-mask">
		<div class="loading-box">
			<div class="loadingio-spinner-ellipsis">
				<div class="ldio-list">
					<div class="ldio ldio1"></div>
					<div class="ldio ldio2"></div>
					<div class="ldio ldio3"></div>
					<div class="ldio ldio4"></div>
					<div class="ldio ldio5"></div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">

</script>

<style lang="less" scoped>
	.loading-mask {
		width: 100%;
		height: 100%;
		position: fixed;
		top: 0;
		left: 0;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.loading-box {
		width: 200rem;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}

	.loadingio-spinner-ellipsis {
		width: 160rem;
		height: 160rem;
		display: inline-block;
		overflow: hidden;
		background: none;
	}

	.ldio-list {
		width: 100%;
		height: 100%;
		position: relative;
		transform: translateZ(0) scale(0.8);
		backface-visibility: hidden;
		transform-origin: 0 0;
	}

	.ldio {
		position: absolute;
		width: 40rem;
		height: 40rem;
		border-radius: 50%;
		transform: translate(80rem, 80rem) scale(1);
		background: #e15b64;
		animation: ldio 3.7037037037037033s infinite cubic-bezier(0, 0.5, 0.5, 1);
	}

	.ldio1 {
		background: #f47e60;
		transform: translate(148rem, 80rem) scale(1);
		animation: ldio-r 0.9259259259259258s infinite cubic-bezier(0, 0.5, 0.5, 1), ldio-c 3.7037037037037033s infinite step-start;
	}

	.ldio2 {
		animation-delay: -0.9259259259259258s;
		background: #e15b64;
	}

	.ldio3 {
		animation-delay: -1.8518518518518516s;
		background: #f47e60;
	}

	.ldio4 {
		animation-delay: -2.7777777777777777s;
		background: #f8b26a;
	}

	.ldio5 {
		animation-delay: -3.7037037037037033s;
		background: #abbd81;
	}

	@keyframes ldio {
		0% {
			transform: translate(12rem, 80rem) scale(0);
		}

		25% {
			transform: translate(12rem, 80rem) scale(0);
		}

		50% {
			transform: translate(12rem, 80rem) scale(1);
		}

		75% {
			transform: translate(80rem, 80rem) scale(1);
		}

		100% {
			transform: translate(148rem, 80rem) scale(1);
		}
	}

	@keyframes ldio-r {
		0% {
			transform: translate(148rem, 80rem) scale(1);
		}

		100% {
			transform: translate(148rem, 80rem) scale(0);
		}
	}

	@keyframes ldio-c {
		0% {
			background: #e15b64
		}

		25% {
			background: #abbd81
		}

		50% {
			background: #f8b26a
		}

		75% {
			background: #f47e60
		}

		100% {
			background: #e15b64
		}
	}
</style>