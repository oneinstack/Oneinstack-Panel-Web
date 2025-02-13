<template>
	<div class="popup-mask">
		<div class="concent">
			<div class="img">
				<img class="rotate-me" :class="{ 'rotated': conf.isRotating }" src="/static/img/cut_down_image_0.png" />
				<div class="time-num">
					<div class="num">{{ conf.count }}</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { onMounted, reactive,onUnmounted} from 'vue';
import { Howl } from "howler";

const emit = defineEmits(['close'])
const conf = reactive({
	rotatingDeg: 0,
	count: 3,
	isRotating: true
})
const soundBgm = new Howl({
	src: ['/static/audio/countdown.ogg'],
	autoplay: true,
	loop: true,
	volume: 1,
	preload: true,
	onload: function() {
		soundBgm.play(); // 在点击后播放
    },
	onend: function () {
	},
})

onMounted(() => {
	const timer = setInterval(() => {
		if (conf.count > 1) {
			conf.count--
		} else {
			clearInterval(timer);
			emit('close')
		}
	}, 1000);
})

onUnmounted(()=>{
	soundBgm.pause()
})

</script>

<style lang="less" scoped>
.popup-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 97;
	background: rgba(0, 0, 0, 0.4);
	display: flex;
	justify-content: center;
	align-items: center;

	.concent {
		position: relative;
		z-index: 98;
		width: 400rem;
		height: 400rem;

		.rotate-me {
			position: absolute;
			z-index: 99;
			width: 100%;
			height: 100%;
			// transition: transform 0s ease;
		}

		.time-num {
			position: absolute;
			top: 0;
			bottom: 0;
			width: 100%;
			z-index: 99;
			display: flex;
			justify-content: center;
			align-items: center;

			.num {
				background: rgba(0, 0, 0, 0.55);
				border-radius: 50%;
				width: 300rem;
				height: 300rem;
				font-size: 62rem;
				color: #FFF;
				display: flex;
				align-items: center;
				justify-content: center;
			}
		}

		.rotated {
			animation-name: rotate;
			animation-duration: 3s;
			animation-timing-function: linear;
			animation-iteration-count: 1;
		}

		@keyframes rotate {
			0% {
				transform: rotate(0deg);
			}

			100% {
				transform: rotate(360deg);
			}
		}
	}
}
</style>