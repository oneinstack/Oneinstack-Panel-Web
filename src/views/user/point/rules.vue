<template>
	<x-page :no-footer="true">
		<template #title>
			{{ $t('point.pointsRules') }}
		</template>
		<div class="content">
			<div v-html="conf.signRule"></div>
		</div>
	</x-page>
</template>

<script setup lang="ts">
import { apis } from '@/api';
import { sconfig } from '@/sstore/sconfig';
import System from '@/utils/System';
import { onMounted, reactive } from 'vue';
const conf = reactive({
	signRule: '',
	//获取列表数据
	getPointsList(userId:any) {
		System.loading()
		apis.getPointsList({
			userId,
			months: 0,
			success: (res:any) => {
				conf.signRule = res.data.config.signRule
			},
			final: () => {
				System.loading(false)
			}
		});
	},
})
onMounted(() => {
	let userInfo = sconfig.userInfo
	if (userInfo && userInfo.userId) {
		conf.getPointsList(userInfo.userId)
	} else {
		System.router.replace('/login')
	}
})

</script>

<style lang="less" scoped>
.content {
	padding: 20rem;
}
</style>
