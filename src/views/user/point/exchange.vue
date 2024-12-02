<template>
	<x-page :no-footer="true" :bgcolor="'#FFFFFF'">
		<template #title>
			{{ $t('point.exchangeRecord') }}
		</template>
		<div class="record-list">
			<template v-for="(item, index) in conf.recordList" :key="index">
				<div class="record-item">
					<div class="record-left">
						<div class="point-name">{{ item.rewardName }}</div>
						<div class="point-time">{{ sutil.getTimeFormat(item.exchangeTime) }}</div>
					</div>
					<div class="record-right">{{ conf.getNum(item.integral) }}</div>
				</div>
			</template>
		</div>
		<div :style="{ 'margin-top': conf.loading && conf.recordList.length > 0 ? '-50rem' : '0' }">
			<loading v-if="conf.loading"></loading>
		</div>
		<no-data v-if="!conf.loading && conf.recordList.length == 0"></no-data>
	</x-page>
</template>

<script setup lang="ts">
import { onMounted, reactive } from 'vue';
import loading from '../tasks/components/loading.vue'
import { Scope } from 'tools-vue3';
import { EPage } from '@/enum/Enum';
import { apis } from '@/api';
import sutil from '@/sstore/sutil';
const conf = reactive({
	recordList: [] as any[],
	loading: false,
	pageNum: 1,
	pageSize: 20,
	total: 0,
	getIntegralExchangeList() {
		conf.loading = true
		apis.getUserIntegralExchangeRecordList({
			current: conf.pageNum,
			size: conf.pageSize,
			success: (res: any) => {
				conf.recordList = [...conf.recordList, ...res.data.records]
				conf.total = res.data.total || 0
			},
			complete: () => {
				conf.loading = false
			}
		});
	},
	moreMessage() {
		if (conf.pageSize * conf.pageNum >= conf.total) {
			return
		}
		conf.pageNum++
		conf.getIntegralExchangeList()
	},
	getNum(num:any) {
		if (!num) return 0
		return parseInt(num)
	}
})
onMounted(() => {
	conf.getIntegralExchangeList()
})
const event = Scope.Event()
event.on(EPage.scrollBottom, () => {
	conf.moreMessage()
})
</script>


<style lang="less" scoped>
.record-list {
	.record-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-bottom: 1px solid #F6F7FA;
		padding: 20rem 30rem 20rem 20rem;
		font-size: 26rem;

		.record-left {
			color: #000;

			.point-name {
				font-weight: 500;
				font-size: 28rem;
			}

			.point-time {
				color: #999;
			}
		}
	}
}
</style>
