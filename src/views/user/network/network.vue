<template>
	<x-page noFooter noHeader :bgcolor="'#fff'">
		<div class="content">
			<img class="img" src="/static/img/no-network.svg" />
			<div class="title">{{ $t('user.noNetWork') }}</div>
			<div class="btn" @click="getBackOnline">{{ $t('user.pefresh') }}</div>
		</div>
	</x-page>
</template>

<script setup lang="ts">
import { apis } from '@/api';
import sutil from '@/sstore/sutil';
import System from '@/utils/System';
import { onMounted } from 'vue';

const getBackOnline = () => {
	System.loading()
	apis.appConfigurationV1({
		success: (res: any) => {
			if (res.code == 200) {
				sutil.pageBack()
			}
		},
		complete: () => {
			System.loading(false)
		}
	});
}
onMounted(() => {
	getBackOnline()
})
</script>

<style lang="less" scoped>
.content {
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	height: 100%;
	padding-bottom: 60rem;

	.img {
		width: 546rem;
		height: 410rem;
	}

	.title {
		color: #AAA;
		font-size: 25rem;
		margin: 20rem 0rem;
	}

	.btn {
		background: linear-gradient(180deg, #EB602D 0%, #FFA64F 100%);
		padding: 10rem 60rem;
		border-radius: 30rem;
		font-size: 24rem;
		color: #fff;
		margin-top: 30rem;
	}
}
</style>
