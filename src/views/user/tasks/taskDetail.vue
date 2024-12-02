<template>
	<x-page>
		<template #title>
			{{ $t('task.taskDetail') }}
		</template>
		<div class="content-box">
			<div class="content">
				<div class="top-name">
					<text class="title">{{ $t('point.introduction') }}</text>
					<text class="Deposit" v-if="conf.deposit">({{ $t('task.DEposit') }}:{{ conf.deposit }}) </text>
				</div>
				<div v-html="conf.activityContent"></div>
				<div class="join" v-if="!conf.hasReceive">
					<div class="btn" @click="conf.handleReceive">{{ $t('otcOrderDetailsModule.Receive') }}</div>
				</div>
			</div>
		</div>
	</x-page>
</template>
<script setup lang="ts">
import { apis } from '@/api';
import i18n from '@/lang';
import sutil from '@/sstore/sutil';
import System from '@/utils/System';
import { onMounted, reactive } from 'vue';
import { useRoute } from 'vue-router';

const conf = reactive({
	pathUrl: '',
	activityContent: '' as any,
	taskId: '' as any,
	hasReceive: true,
	deposit: '' as any,
	getData() {
		System.loading()
		apis.isClaimed({
			taskId: conf.taskId,
			success: (res: any) => {
				conf.hasReceive = res.data
			},
			final: () => {
				System.loading(false)
			}
		});
	},

	// 领取btn
	handleReceive() {
		System.loading()
		apis.pickupActivityTask({
			taskId: conf.taskId,
			success: (res: any) => {
				System.toast(i18n.t(`code.${res.code}`), 'success')
				setTimeout(() => {
					sutil.pageBack()
				}, 2000)
			},
			final: () => {
				System.loading(false)
			}
		});
	}
})
const route = useRoute()
onMounted(() => {
	const routeParams = route.query
	if(routeParams.deposit) conf.deposit = routeParams.deposit
	conf.taskId = routeParams.id
	conf.activityContent = routeParams.taskDesc
	conf.getData()
})
</script>

<style lang="less" scoped>
.content-box {
	padding: 32rem 24rem 32rem;

	.content {
		padding: 32rem;
		background: #FFF;
		border-radius: 16rem;
		min-height: 80vh;

		.top-name {
			font-weight: bold;
			margin-bottom: 20rem;

			.title {
				color: rgb(37, 37, 41);
				font-size: 40rem;
			}

			.Deposit {
				background: linear-gradient(328.56deg, #FF7502 18.81%, #FC9B01 77.66%);
				-webkit-background-clip: text;
				background-clip: text;
				color: transparent;
				font-size: 34rem;
				margin-left: 10rem;
			}
		}

		.join {
			display: flex;
			justify-content: center;
			margin-top: 48rem;

			.btn {
				padding: 14rem 30rem;
				background-image: linear-gradient(#FFA64F, #EB602D);
				border-radius: 56rem;
				font-size: 36rem;
				color: #FFF;
				display: flex;
				justify-content: center;
				align-items: center;
				width: auto;
			}
		}
	}
}
</style>