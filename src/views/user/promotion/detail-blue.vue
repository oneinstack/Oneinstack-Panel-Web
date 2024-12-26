<template>
	<x-page noFooter :bgcolor="'#f6f7fa'" :headerBgColor="stheme.theme.blue.headerBgColor()">
		<template #title>
			{{ $t('signInModule.promotions') }}
		</template>
		<div class="content-box">
			<div class="content">
				<div v-html="conf.activityContent"></div>
				<div class="join" v-if="conf.pathUrl && conf.isAccountLogin && sconfig.userInfo.userType != 2">
					<div class="btn" @click="conf.goWeb">{{ $t('signInModule.join') }}</div>
				</div>
			</div>
		</div>
	</x-page>
</template>

<script setup lang="ts">
import sconfig from '@/sstore/sconfig';
import { index } from './detail'
import stheme from '@/sstore/stheme'

const conf = index()
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
                background: linear-gradient(93.51deg, #006FFF 5.72%, #087BFF 86.61%);
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
