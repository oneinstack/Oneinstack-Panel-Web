<template>
	<x-page no-footer :fixed="false">
		<template #title>{{ $t('me.Transactions') }}</template>
		<!-- header -->
		<template #top>
			<div class="top-content">
				<div class="scroll-times" style="overflow-x: scroll;">
					<div class="scroll-title" v-scroll>
						<span>{{ $t('Transactions.TradeType') + ':' }}</span>
						<span v-for="(item, index) in conf.typeList" :key="index" class="times-times"
							:class="item.isCheck ? 'checked' : ''" @click="conf.handleChange('type', item)">
							<span>{{ item.label }}</span>
						</span>
					</div>
				</div>
				<div class="scroll-times" style="overflow-x: scroll;">
					<div>
						<span>{{ $t('Transactions.TradeStatus') + ':' }}</span>
						<span v-for="(item, index) in conf.statusList" :key="index" class="times-times"
							:class="item.isCheck ? 'checked' : ''" @click="conf.handleChange('status', item)">
							<span>{{ item.label }}</span>
						</span>
					</div>
				</div>
			</div>
		</template>
		<!-- content -->
		<div class="content-div">
			<div style="width: 100%;margin-bottom: 20rem;">
				<div class="winning-box" v-if="conf.detailData.length > 0">
					<div class="winning-item" v-for="(item, itemIndex) in conf.detailData" :key="itemIndex">
						<div class="left-user">
							<div class="userName">
								<div>
									<span>{{ item.tradeObjName || conf.tradeLable || "--" }} </span>
								</div>
								<div>
									<span style="color: #BCBCBC;font-size:20rem">{{ sutil.getTimeFormat(item.tradeTime)
										}}</span>
								</div>
							</div>
						</div>
						<div class="right-money">
							<div class="money">{{ conf.getCoin(item.walletCoin) + item.money }}</div>
							<!-- <div class="money">{{item.tradeTypeName}}</div> -->
						</div>
					</div>
				</div>
				<!-- <div class="more" v-if="conf.detailData.length > 0 && (conf.pageSize * conf.pageNum < conf.total)">
					<div class="more-btn" @click="conf.moreMessage">
						<span>{{ $t('game.showMore') }}</span>
						<img src="/static/img/show-more.png" style="width: 20rem;height: 12rem;" />
					</div>
				</div> -->
				<x-no-data v-if="conf.detailData.length == 0"></x-no-data>
			</div>
		</div>
	</x-page>
</template>

<script setup lang="ts">
import { apis } from '@/api';
import { EPage } from '@/enum/Enum';
import i18n from '@/lang';
import sutil from '@/sstore/sutil';
import { svalue } from '@/sstore/svalue';
import System from '@/utils/System';
import { Scope } from 'tools-vue3';
import { onMounted, reactive } from 'vue';
const conf = reactive({
	pageSize: 15,
	pageNum: 1,
	total: 0,
	detailData: [] as any[],
	scrollHeight: 300,
	typeList: [{
		value: 1,
		label: i18n.t('tradeType.1'),
		isCheck: true
	}, {
		value: 2,
		label: i18n.t('tradeType.2')
	}, {
		value: 3,
		label: i18n.t('tradeType.3')
	}, {
		value: 4,
		label: i18n.t('tradeType.4')
	}, {
		value: 5,
		label: i18n.t('tradeType.5')
	}, {
		value: 6,
		label: i18n.t('tradeType.6')
	}, {
		value: 7,
		label: i18n.t('tradeType.7')
	}, {
		value: 8,
		label: i18n.t('tradeType.8')
	}, {
		value: 9,
		label: i18n.t('tradeType.9')
	}, {
		value: 10,
		label: i18n.t('tradeType.10')
	}, {
		value: 11,
		label: i18n.t('tradeType.11')
	}, {
		value: 12,
		label: i18n.t('tradeType.12')
	}, {
		value: 13,
		label: i18n.t('tradeType.13')
	}, {
		value: 14,
		label: i18n.t('tradeType.14')
	}, {
		value: 15,
		label: i18n.t('tradeType.15')
	}, {
		value: 17,
		label: i18n.t('tradeType.17')
	}, {
		value: 18,
		label: i18n.t('tradeType.18')
	}, {
		value: 97,
		label: i18n.t('tradeType.97')
	}],
	index: 0,
	statusList: [{
		value: 1,
		label: i18n.t('otcOrderModule.statusList.1'),
		isCheck: true
	}, {
		value: -1,
		label: i18n.t('otcOrderModule.statusList.2'),

	}, {
		value: 0,
		label: i18n.t('otcOrderModule.statusList.0'),
	}],
	tradeType: 1,
	tradeStatus: 1,
	tradeExamineStatus: 1,
	tradeLable: i18n.t('tradeType.1'),
	getList() {
		System.loading()
		apis.meTrade({
			current: conf.pageNum,
			size: conf.pageSize,
			tradeType: conf.tradeType,
			tradeStatus: conf.tradeStatus,
			success: (res: any) => {
				conf.detailData = [...conf.detailData, ...res.data.records]
				conf.total = res.data.total || 0
			},
			final: () => {
				System.loading(false)
			}
		});
	},

	handleChange(type: any, val: any) {
		switch (type) {
			case 'type':
				conf.typeList.forEach(item => {
					item.isCheck = false
					if (item.value == val.value) {
						item.isCheck = true
						conf.tradeType = item.value
						conf.tradeLable = item.label
					}
				})
				conf.detailData = []
				conf.getList()
				break;
			case 'status':
				conf.statusList.forEach(item => {
					item.isCheck = false
					if (item.value == val.value) {
						item.isCheck = true
						conf.tradeStatus = item.value
					}
				})
				conf.detailData = []
				conf.getList()
				break;
		}
	},

	moreMessage() {
		if (conf.pageSize * conf.pageNum >= conf.total) {
			return
		}
		conf.pageNum++;
		conf.getList();
	},

	getTime(val: any) {
		console.log(val);
		
		let _time = String(new Date(val))
		return String(_time).split("(")[0]
	},

	getCoin(val: any) {
		let _data = svalue.coinlist.find(it => it.coinCode == val)
		if (_data) {
			return _data.coinSymbol
		} else {
			return ""
		}
	}
})
onMounted(() => {
	conf.getList()
})
const event = Scope.Event()
event.on(EPage.scrollBottom, () => {
	conf.moreMessage()
})
</script>

<style lang="less" scoped>
.top-content {
	background-color: #fff;
	padding: 20rem;
	margin-bottom: 16rem;
	width: 100%;
	font-size: 26rem;

	.scroll-times {
		margin-top: 20rem;
		white-space: nowrap;

		.times-times {
			margin: 10rem;
			padding: 0 20rem;
			background-color: #F9F9F9;
			border-radius: 5px;
			line-height: 50rem;
			line-height: 50rem;
			height: 50rem !important;
			display: inline-block;
		}

		.times-times.checked {
			background-color: #FFF6E6;
		}
	}
}

.content-div {
	width: 100%;

	.winning-box {
		// overflow-y: hidden;
		width: 100%;
		height: 100%;
		padding: 20rem 24rem 24rem;
		background: #fff;
		margin-top: 0rem;

		.winning-item {
			display: flex;
			justify-content: space-between;
			align-items: center;
			height: 96rem;
			border-bottom: 1px solid #F9FAFC;

			.left-user {
				display: flex;
				align-items: center;

				.serial {
					width: 40rem;
					color: rgb(37, 37, 41);
					font-size: 28rem;
					font-weight: bold;
					margin-right: 16rem;
				}

				.avatar {
					width: 56rem;
					height: 56rem;
					margin-right: 8rem;
				}

				.userName {
					color: rgb(132, 132, 144);
					font-size: 24rem;
				}
			}

			.right-money {
				text-align: right;

				.money {
					font-size: 24rem;
					padding-right: 10rem;

					span {
						font-size: 32rem;
					}
				}

				.amount {
					color: rgb(132, 132, 144);
					font-size: 24rem;
				}
			}

			.chart-money {
				min-width: 200rem;
				height: 36rem;
				padding: 0rem 24rem;
				background: rgb(217, 0, 0);
				display: flex;
				justify-content: center;
				align-items: center;
				border-radius: 20rem;
				color: #FFFFFF;
				font-size: 28rem;
			}
		}
	}

	.more {
		background: #FFF;
		padding: 24rem 24rem 24rem;

		.more-btn {
			box-shadow: rgba(0, 0, 0, 0.1) 0px 1.06667vw 1.06667vw;
			border-radius: 2.13333vw;
			height: 78rem;
			display: flex;
			align-items: center;
			justify-content: center;

			span {
				margin-right: 20rem;
				font-size: 24rem;
				font-weight: 700;
			}
		}
	}
}
</style>