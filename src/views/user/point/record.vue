<template>
	<x-page :no-footer="true" :bgcolor="'#FFFFFF'">
		<template #title>
			{{ $t('point.pointRecord') }}
		</template>
		<div class="record-list">
			<template v-for="(item, index) in conf.pointList" :key="index">
				<div class="record-item">
					<div class="record-left">
						<div class="point-name">{{ conf.getType(item.pointsType) }}</div>
						<div class="point-time">{{ sutil.getTimeFormat(item.changeTime) }}</div>
					</div>
					<div class="record-r" v-if="item.pointsType == 2 || item.pointsType == 5">-{{ item.changePoints }}
					</div>
					<div class="record-g" v-else>+{{ item.changePoints }}</div>
				</div>
			</template>
		</div>
		<div :style="{ 'margin-top': conf.loading && conf.pointList.length > 0 ? '-50rem' : '0' }">
			<loading v-if="conf.loading"></loading>
		</div>
		<x-no-data v-if="!conf.loading && conf.pointList.length == 0"></x-no-data>
	</x-page>
</template>

<script setup lang="ts">
import { sconfig } from '@/sstore/sconfig';
import loading from '../tasks/components/loading.vue'
import { onMounted, reactive } from 'vue';
import System from '@/utils/System';
import { apis } from '@/api';
import i18n from '@/lang';
import { Scope } from 'tools-vue3';
import { EPage } from '@/enum/Enum';
import sutil from '@/sstore/sutil';
const conf = reactive({
	pointList: [] as any[],
	userInfo: {} as any,
	loading: false,
	pageNum: 1,
	pageSize: 20,
	total: 0,
	getPointsPageList() {
		conf.loading = true
		apis.getPointsPage({
			userId: conf.userInfo.userId,
			current: conf.pageNum,
			size: conf.pageSize,
			success: (res: any) => {
				res.data.records.forEach((item: any) => {
					item.changePoints = parseInt(item.changePoints)
				});
				
				conf.pointList = [...conf.pointList, ...res.data.records]
				conf.total = res.data.total || 0
			},
			final: () => {
				conf.loading = false
			}
		});
	},
	moreMessage() {
		if (conf.pageSize * conf.pageNum >= conf.total) {
			return
		}
		conf.pageNum++
		conf.getPointsPageList()
	},
	getType(type: any) {
		switch (type) {
			case 0:
				return i18n.t('point.signIn1') // 签到
			case 1:
				return i18n.t('me.Recharge') // 充值
			case 2:
				return i18n.t('point.pointsMall') // 积分商城
			case 3:
				return i18n.t('point.luckyBox') // 宝箱
			case 4:
				return i18n.t('point.systemGift') // 系统赠送
			case 5:
				return i18n.t('point.systemDeduction') // 系统扣减
			default:
				return ''
		}
	}
})
onMounted(() => {
	conf.userInfo = sconfig.userInfo
	if (conf.userInfo && conf.userInfo.userId) {
		conf.getPointsPageList()
	} else {
		System.router.replace('/user/login/login')
	}
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
		padding: 20rem;
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

		.record-r {
			color: #FF273E;
		}

		.record-g {
			color: #00C308;
		}
	}
}
</style>
