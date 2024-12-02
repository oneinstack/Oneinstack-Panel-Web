<template>
	<div class="swipe-box">
		<template v-for="(item, index) in swipeList" :key="index">
			<div
				:style="{ transform: `translateY(${conf.currentNum * -100}%)`, 'transition-duration': `${conf.durationNum}ms` }">
				<slot :item="item" />
			</div>
		</template>
	</div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';

const props = defineProps({
	swipeList: {
		default: [] as any
	},
	targetSwipe: {
		default: 0
	},
	autoplay: {
		default: false
	},
	type: {
		default: 1
	}
})
const conf = reactive({
	currentNum: 0,
	durationNum: 180,
	play: false,
	timer: null as any,
})
const getShare = () => {
	conf.timer = setInterval(() => {
		conf.durationNum = 180
		conf.currentNum++
		if (conf.currentNum >= props.swipeList.length - 1) {
			setTimeout(() => {
				if(props.autoplay){
					conf.durationNum = 10
					conf.currentNum = 0
				}
			}, 100)
		}
	}, 150)
}
watch(
	() => props.autoplay,
	(val: any) => {
		if (val) getShare()
		if (!val) {
			clearInterval(conf.timer)
			conf.timer = null
			conf.durationNum = 0
			conf.currentNum = props.targetSwipe
		}
	},
	{ deep: true, immediate: true }
)
</script>

<style lang="less" scoped>
.swipe-box {
	width: 100%;
	height: 100%;
	overflow: hidden;
	div{
		width: 100%;
		height: 100%;
	}
}
</style>