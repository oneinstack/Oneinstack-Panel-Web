<template>
	<div class="row flex-center" style="color: #404653">
		<div class="row flex-center page-btn" :class="[pageInfo.page > 1 ? 'active' : '']"
			@click="pageInfo.page != 1 ? emit('handlePageChange', 'last') : ''">
			<div class="page-icon"></div>
		</div>
		<div class="row flex-center" style="width: 180rem">{{ pageInfo.page }}/{{ pageInfo.pageTotal }}</div>
		<div class="row flex-center page-btn" :class="[pageInfo.page < pageInfo.pageTotal ? 'active' : '']"
			@click="pageInfo.page != pageInfo.pageTotal ? emit('handlePageChange', 'next') : ''">
			<div class="page-icon" style="transform: rotateZ(180deg)"></div>
		</div>
	</div>
</template>
<script setup lang="ts">
const props = defineProps({
	pageInfo: {
		default: {} as any
	}
})
const emit = defineEmits(['handlePageChange'])
</script>
<style lang="less" scoped>
.page {
	&-btn {
		background: #dedede;
		border-radius: 14rem;
		padding: 25rem 30rem;
		pointer-events: none;

		&.active {
			pointer-events: all;
			background: linear-gradient(93.51deg, #006FFF 5.72%, #087BFF 86.61%);
		}
	}

	&-icon {
		width: 18rem;
		height: 30rem;
		background: url(/static/img/vector.png);
		background-size: 100%;
	}
}
</style>