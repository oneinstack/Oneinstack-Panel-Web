<template>
	<div class="box" v-html="list"></div>
</template>

<script setup lang="ts">

const props = defineProps({
	list: {
		default: ''
	}
})
</script>

<style lang="less" scoped>
.box {
	padding: 0 48rem;
}
</style>