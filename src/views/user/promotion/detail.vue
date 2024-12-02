<template>
	<x-page noFooter :bgcolor="'#f6f7fa'">
		<template #title>
			{{ $t('signInModule.promotions') }}
		</template>
		<div class="content-box">
			<div class="content">
				<!-- <view class="title">123</view> -->
				<div v-html="conf.activityContent"></div>
				<div class="join" v-if="conf.pathUrl && conf.isAccountLogin && sconfig.userInfo.userType != 2">
					<div class="btn" @click="conf.goWeb">{{ $t('signInModule.join') }}</div>
				</div>
			</div>
		</div>
	</x-page>
</template>

<script setup lang="ts">
import { apis } from '@/api';
import sconfig from '@/sstore/sconfig';
import sweb from '@/sstore/sweb';
import System from '@/utils/System';
import { onMounted, reactive } from 'vue';
import { useRoute } from 'vue-router';

const conf = reactive({
	pathUrl: '',
	activityContent: '',
	isAccountLogin: false,
	getDetail(id: any) {
		System.loading()
		apis.getInfoById({
			id,
			success: (res: any) => {
				// conf.detail = res.data.data
				conf.activityContent = res.data.activityContent
				conf.pathUrl = res.data.pathUrl
			},
			final: () => {
				System.loading(false)
			}
		});
	},
	goWeb() {
		let str = conf.pathUrl.charAt(0)
		if (conf.pathUrl.indexOf('http') != -1) {
			sweb.open(conf.pathUrl)
		} else {
			System.router.push(conf.pathUrl)
		}
	}
})

const route = useRoute()
onMounted(() => {
	if (sconfig.userInfo) {
		conf.isAccountLogin = true
	}
	const routeParams = route.query

	routeParams.id && conf.getDetail(routeParams.id)
	
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

		.title {
			color: rgb(37, 37, 41);
			font-size: 40rem;
			font-weight: bold;
			margin-bottom: 8rem;
			text-align: center;
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
