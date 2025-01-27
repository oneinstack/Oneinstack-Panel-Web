<template>
	<div class="row flex-center" style="color: #404653">
		<div class="row flex-center page-btn" :class="[conf.page.pageNum > 1 ? 'active' : '']" @click="conf.page.changePage(-1)">
			<div class="page-icon"></div>
		</div>
		<div class="row flex-center" style="width: 180rem">{{ conf.page.pageNum }}/{{ conf.page.pageTotal }}</div>
		<div class="row flex-center page-btn" :class="[conf.page.pageNum < conf.page.pageTotal ? 'active' : '']"
			@click="conf.page.changePage(1)">
			<div class="page-icon" style="transform: rotateZ(180deg)"></div>
		</div>
	</div>
</template>
<script setup lang="ts">
import { reactive, watch } from 'vue';

const emit = defineEmits(['update:pageNum','change'])
const props = defineProps({
	total: {
		default: 0
	},
	pageSize: {
		default: 0
	},
	pageNum: {
		default: 0
	}
})
const conf = reactive({
	page: {
		pageTotal: 1,

		pageSize: 10,
		pageNum: 1,
		total: 0,

		setTotal: (total:any) => {
			const page = conf.page
			page.total = total
			let pageTotal = Math.floor(total / page.pageSize)
			if ((total % page.pageSize > 0)) pageTotal++
			page.pageTotal = pageTotal
			if (page.pageNum > page.pageTotal) {
				page.pageNum = page.pageTotal
				emit('update:pageNum', page.pageNum)
			}
		},
		changePage: (num:any) => {
			conf.updatePageNum(conf.page.pageNum + num)
		}
	},
	updatePageNum(num:any) {
		if (this.page.pageNum !== num) {
			this.page.pageNum = num
			emit('update:pageNum', num)
			emit('change', num)
		}
	}
})
watch(
	() => props.total,
	(val: any) => {
		conf.page.setTotal(val)
	},
	{ immediate: true }
)
watch(
	() => props.pageSize,
	(newValue: any) => {
		conf.page.pageSize = newValue
		conf.updatePageNum(1)
		conf.page.setTotal(conf.page.total)
	}
)
watch(
	() => props.total,
	(val: any) => {
		let pageNum = val
		if (pageNum > conf.page.pageTotal) {
			pageNum = conf.page.pageTotal
		}
	}
)
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
			background: linear-gradient(180deg, #f6843f, #fea14d);
		}
	}

	&-icon {
		width: 18rem;
		height: 30rem;
		background: url('/static/img/vector.png');
		background-size: 100%;
	}
}
</style>