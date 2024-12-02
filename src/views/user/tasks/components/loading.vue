<template>
	<div :class="{ 'loading': type != 3 }">
		<!-- 雪花状 -->
		<div class="loading row" v-if="type == 1">
			<div class="van-loading van-loading--spinner van-loading"
				style="color: rgb(102, 102, 102); width: 22px; height: 22px;"><span
					class="van-loading__spinner van-loading__spinner--spinner"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><!----></span>
			</div>
		</div>
		<!-- 圆环状 -->
		<span class="circle-loading__spinner" style="width: 20px;height: 20px;" v-else-if="type == 2">
			<div class="no-clip-circle"></div>
		</span>

		<!-- 行内加载 -->
		<div class="van-loading van-loading--spinner van-loading" style="color: #FFF; width: 18px; height: 18px;"
			v-else-if="type == 3"><span
				class="van-loading__spinner van-loading__spinner--spinner"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><!----></span>
		</div>

		<div class="loadingio-spinner-ellipsis" v-else>
			<div class="ldio-list">
				<div class="ldio ldio1"></div>
				<div class="ldio ldio2"></div>
				<div class="ldio ldio3"></div>
				<div class="ldio ldio4"></div>
				<div class="ldio ldio5"></div>
			</div>
		</div>
	</div>
</template>

<script lang="ts" setup>
const props = defineProps({
	// 1 雪花状 2 圆环状
	type: {
		default: 1 as any
	}
})
</script>

<style lang="less" scoped>
.loading {
	padding: 20px 0;
	display: flex;
	justify-content: center;
	align-items: center;
}

.circle-loading__spinner {
	display: inline-block;
	width: 30px;
	max-width: 100%;
	height: 30px;
	max-height: 100%;
	-webkit-animation: van-rotate .7s linear infinite;
	animation: van-rotate .7s linear infinite;
}

.van-loading__circular {
	display: block;
	width: 100%;
	height: 100%;
	position: absolute;
	left: 0;
	top: 0;
}

@keyframes van-rotate {
	0% {
		-webkit-transform: rotate(0);
		transform: rotate(0);
	}

	100% {
		-webkit-transform: rotate(360deg);
		transform: rotate(360deg);
	}

}

.no-clip-circle {
	width: 100%;
	height: 100%;
	border: 1px solid #989898;
	border-radius: 50%;
	border-right-color: transparent;
	position: relative;
	overflow: hidden;
	/* 确保边界不会溢出容器 */
}

.van-loading {
	/* width: 1.39535rem; */
	/* height: 1.39535rem; */
	z-index: 0;
	font-size: 0;
	line-height: 0;
	position: relative;
	vertical-align: middle;
}

.van-loading__spinner--spinner {
	-webkit-animation-timing-function: steps(12);
	animation-timing-function: steps(12);
}

.van-loading__spinner {
	z-index: -1;
	width: 100%;
	height: 100%;
	position: relative;
	display: inline-block;
	box-sizing: border-box;
	-webkit-animation: van-rotate .8s linear infinite;
	animation: van-rotate .8s linear infinite;
}

.van-loading__spinner--spinner {
	-webkit-animation-timing-function: steps(12);
	animation-timing-function: steps(12)
}

.van-loading__spinner--spinner i {
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	position: absolute
}

.van-loading__spinner--spinner i:before {
	width: .09302rem;
	height: 25%;
	content: " ";
	display: block;
	margin: 0 auto;
	border-radius: 40%;
	background-color: currentColor
}

.van-loading__spinner--spinner i:first-of-type {
	opacity: 1;
	-webkit-transform: rotate(30deg);
	transform: rotate(30deg)
}

.van-loading__spinner--spinner i:nth-of-type(2) {
	opacity: .9375;
	-webkit-transform: rotate(60deg);
	transform: rotate(60deg)
}

.van-loading__spinner--spinner i:nth-of-type(3) {
	opacity: .875;
	-webkit-transform: rotate(90deg);
	transform: rotate(90deg)
}

.van-loading__spinner--spinner i:nth-of-type(4) {
	opacity: .8125;
	-webkit-transform: rotate(120deg);
	transform: rotate(120deg)
}

.van-loading__spinner--spinner i:nth-of-type(5) {
	opacity: .75;
	-webkit-transform: rotate(150deg);
	transform: rotate(150deg)
}

.van-loading__spinner--spinner i:nth-of-type(6) {
	opacity: .6875;
	-webkit-transform: rotate(180deg);
	transform: rotate(180deg)
}

.van-loading__spinner--spinner i:nth-of-type(7) {
	opacity: .625;
	-webkit-transform: rotate(210deg);
	transform: rotate(210deg)
}

.van-loading__spinner--spinner i:nth-of-type(8) {
	opacity: .5625;
	-webkit-transform: rotate(240deg);
	transform: rotate(240deg)
}

.van-loading__spinner--spinner i:nth-of-type(9) {
	opacity: .5;
	-webkit-transform: rotate(270deg);
	transform: rotate(270deg)
}

.van-loading__spinner--spinner i:nth-of-type(10) {
	opacity: .4375;
	-webkit-transform: rotate(300deg);
	transform: rotate(300deg)
}

.van-loading__spinner--spinner i:nth-of-type(11) {
	opacity: .375;
	-webkit-transform: rotate(330deg);
	transform: rotate(330deg)
}

.van-loading__spinner--spinner i:nth-of-type(12) {
	opacity: .3125;
	-webkit-transform: rotate(1turn);
	transform: rotate(1turn)
}

.loadingio-spinner-ellipsis {
	width: 80px;
	height: 80px;
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
	width: 20px;
	height: 20px;
	border-radius: 50%;
	transform: translate(40px, 40px) scale(1);
	background: #EB602D;
	animation: ldio 3.7037037037037033s infinite cubic-bezier(0, 0.5, 0.5, 1);
}

.ldio1 {
	background: #FFA64F;
	transform: translate(74px, 40px) scale(1);
	animation: ldio-r 0.9259259259259258s infinite cubic-bezier(0, 0.5, 0.5, 1), ldio-c 3.7037037037037033s infinite step-start;
}

.ldio2 {
	animation-delay: -0.9259259259259258s;
	background: #a9196d;
}

.ldio3 {
	animation-delay: -1.8518518518518516s;
	background: #e67842;
}

.ldio4 {
	animation-delay: -2.7777777777777777s;
	background: #fe7502;
}

.ldio5 {
	animation-delay: -3.7037037037037033s;
	background: #fbd106;
}

@keyframes ldio {
	0% {
		transform: translate(6px, 40px) scale(0);
	}

	25% {
		transform: translate(6px, 40px) scale(0);
	}

	50% {
		transform: translate(6px, 40px) scale(1);
	}

	75% {
		transform: translate(40px, 40px) scale(1);
	}

	100% {
		transform: translate(74px, 40px) scale(1);
	}
}

@keyframes ldio-r {
	0% {
		transform: translate(74px, 40px) scale(1);
	}

	100% {
		transform: translate(74px, 40px) scale(0);
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

.van-loading {
	/* width: 1.39535rem; */
	/* height: 1.39535rem; */
	z-index: 0;
	font-size: 0;
	line-height: 0;
	position: relative;
	vertical-align: middle;
}

.van-loading__spinner--spinner {
	-webkit-animation-timing-function: steps(12);
	animation-timing-function: steps(12);
}

.van-loading__spinner {
	z-index: -1;
	width: 100%;
	height: 100%;
	position: relative;
	display: inline-block;
	box-sizing: border-box;
	-webkit-animation: van-rotate .8s linear infinite;
	animation: van-rotate .8s linear infinite;
}

.van-loading__spinner--spinner {
	-webkit-animation-timing-function: steps(12);
	animation-timing-function: steps(12)
}

.van-loading__spinner--spinner i {
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	position: absolute
}

.van-loading__spinner--spinner i:before {
	width: .09302rem;
	height: 25%;
	content: " ";
	display: block;
	margin: 0 auto;
	border-radius: 40%;
	background-color: currentColor
}

.van-loading__spinner--spinner i:first-of-type {
	opacity: 1;
	-webkit-transform: rotate(30deg);
	transform: rotate(30deg)
}

.van-loading__spinner--spinner i:nth-of-type(2) {
	opacity: .9375;
	-webkit-transform: rotate(60deg);
	transform: rotate(60deg)
}

.van-loading__spinner--spinner i:nth-of-type(3) {
	opacity: .875;
	-webkit-transform: rotate(90deg);
	transform: rotate(90deg)
}

.van-loading__spinner--spinner i:nth-of-type(4) {
	opacity: .8125;
	-webkit-transform: rotate(120deg);
	transform: rotate(120deg)
}

.van-loading__spinner--spinner i:nth-of-type(5) {
	opacity: .75;
	-webkit-transform: rotate(150deg);
	transform: rotate(150deg)
}

.van-loading__spinner--spinner i:nth-of-type(6) {
	opacity: .6875;
	-webkit-transform: rotate(180deg);
	transform: rotate(180deg)
}

.van-loading__spinner--spinner i:nth-of-type(7) {
	opacity: .625;
	-webkit-transform: rotate(210deg);
	transform: rotate(210deg)
}

.van-loading__spinner--spinner i:nth-of-type(8) {
	opacity: .5625;
	-webkit-transform: rotate(240deg);
	transform: rotate(240deg)
}

.van-loading__spinner--spinner i:nth-of-type(9) {
	opacity: .5;
	-webkit-transform: rotate(270deg);
	transform: rotate(270deg)
}

.van-loading__spinner--spinner i:nth-of-type(10) {
	opacity: .4375;
	-webkit-transform: rotate(300deg);
	transform: rotate(300deg)
}

.van-loading__spinner--spinner i:nth-of-type(11) {
	opacity: .375;
	-webkit-transform: rotate(330deg);
	transform: rotate(330deg)
}

.van-loading__spinner--spinner i:nth-of-type(12) {
	opacity: .3125;
	-webkit-transform: rotate(1turn);
	transform: rotate(1turn)
}
</style>