<template>
	<x-page noFooter pageType="black">
		<template #title>
			{{ $t('signInModule.promotions') }}
		</template>
		<div class="content-box">
			<div class="content">
				<div v-html="conf.activityContent"></div>
				<div class="btn" v-if="conf.pathUrl && conf.isAccountLogin && sconfig.userInfo.userType != 2">
					<greenBtn @click="conf.goWeb">
						<span style="font-size: 32rem;">Play Now</span>
					</greenBtn>
				</div>
			</div>
		</div>
	</x-page>
</template>

<script setup lang="ts">
import greenBtn from '@/views/home/theme/black/components/greenBtn.vue';
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
		background: #292D2E;
		border-radius: 16rem;
		min-height: 80vh;
		color: #bfbfbf;

		.title {
			margin-bottom: 8rem;
			text-align: center;
			font-family: Poppins;
			font-weight: 700;
			font-size: 32rem;
			color: #fff;
		}

		.btn {
			margin-top: 60rem;
			height: 80rem;
			width: 100%;
		}
	}
}
</style>
