<template>
	<x-page :showBack="false" :fixed="false">
		<template #title>
			<bet-record-header :selectNumber="conf.selectBetRecord.length"
				@change-select-mode="conf.handleChangeSelectMode" @click-share="conf.handleShare" />
		</template>

		<template #top>
			<bet-record-filter ref="filterRefs" @filter="conf.handleFilter" v-if="conf.hasLotteryList" />
		</template>

		<bet-record-list ref="listRef" :list="conf.chat.list" :listItems="conf.listItems" :currentGroupChatId="conf.chat.active" :selectMode="conf.isSelectMode"
			@select-share="conf.hanldeSelectShare" @confirm="conf.toShare" />
	</x-page>
</template>

<script setup lang="ts">
// import { CustomData, sim } from '@/sstore/sim'
import { svalue } from '@/sstore/svalue'
// import IMSDK, { IMMethods } from 'openim-uniapp-polyfill'
// import { mapGetters } from 'vuex'
import BetRecordFilter from './components/BetRecordFilter.vue'
import BetRecordHeader from './components/BetRecordHeader.vue'
import BetRecordList from './components/BetRecordList.vue'
import { onMounted, reactive, ref } from 'vue'
import i18n from '@/lang'
import System from '@/utils/System'
import { apis } from '@/api'
import { Scope } from 'tools-vue3'


const listRef = ref<any>()
const filterRefs = ref<any>()
const conf = reactive({
	isSelectMode: false,
	selectBetRecord: [],
	currentGroupChatId: 11, // 当前群聊id
	lotteryList: [],
	hasLotteryList: false,
	listItems: [] as any[],
	coinList: [],
	oddsData: [],

	chat: {
		active: '',
		list: [],
		getList: () => {
			// IMSDK.asyncApi('getAllConversationList', IMSDK.uuid())
			// 	.then(({ data }) => {
			// 		const { groupID, userID } = conf.storeCurrentConversation
			// 		conf.chat.active = groupID || userID
			// 		conf.chat.list = data.map((item:any) => {
			// 			const v = {
			// 				id: item.userID || item.groupID,
			// 				imgUrl: item.faceURL,
			// 				conversationID: item.conversationID,
			// 				chatName: item.showName,
			// 				groupID: item.groupID,
			// 				userID: item.userID
			// 			} as any
			// 			v.sort = conf.chat.active === v.id ? 0 : 1
			// 			return v
			// 		})
			// 		conf.chat.list.sort((a:any, b:any) => a.sort - b.sort)
			// 	})
			// 	.catch(({ errCode, errMsg }) => {
			// 		System.toast(i18n.t('chatRoom.FailedGetList'))
			// 	})
		}
	},
	toShare: ({ betList, chatList }: any) => {
		// const data = CustomData.ShareBet
		// const lotteryName = filterRefs.value.filters[0].currentSelect.label
		// const shareName = conf.storeSelfInfo.nickname
		// chatList.forEach(async (itemid) => {
		// 	const sitem = conf.chat.list.find((v) => v.id === itemid)
		// 	betList.forEach(async (betitem) => {
		// 		betitem.lotteryName = lotteryName
		// 		betitem.shareName = shareName
		// 		const extension = {
		// 			data: betitem
		// 		}
		// 		const message = await IMSDK.asyncApi(IMMethods.CreateCustomMessage, IMSDK.uuid(), {
		// 			data,
		// 			extension: JSON.stringify(extension),
		// 			description: data
		// 		})
		// 		sim.sendMessage(message, undefined, undefined, {
		// 			userID: sitem.userID,
		// 			groupID: sitem.groupID
		// 		})
		// 	})
		// })
		// System.toast(i18n.t('chatRoom.ShareSuccess'),'success')
	},
	// 获取默认钱包
	async getCoinData() {
		svalue.coinlist = []
		await svalue.getCoinlist()
	},
	// 获取彩种类型数据
	getLotteryList() {
		System.loading()
		apis.lotteryList({
			success: (res: any) => {
				conf.lotteryList = res.data || []
				conf.hasLotteryList = true
			},
			final: () => {
				System.loading(false)
			}
		});
	},
	handleChangeSelectMode(mode: string) {
		conf.isSelectMode = mode === 'multiple'
	},

	hanldeSelectShare(selectShares: any) {
		conf.selectBetRecord = selectShares
	},

	handleShare() {
		listRef.value.hanldeOpenPopup()
	},

	getLotteryOdds(obj: any) {
		System.loading()
		apis.lotteryOdds({
			lotteryTypeId: obj.typeId,
			lotteryTypeCode: obj.lotteryTypeCode,
			success: (res: any) => {
				if (res.code == 200) {
					conf.oddsData = res.data.map((item: any) => {
						let orderType = ''
						if (item.oddsCode == 'sum_big' || item.oddsCode == 'sum_small' || item
							.oddsCode == 'sum_even' || item.oddsCode == 'sum_odd') {
							orderType = 'sumStr'
						} else {
							orderType = item.oddsCode.split('_')[0]
						}
						let orderNum = ''
						if (item.oddsCode == 'leopard_any') {
							orderNum = '0'
						} else {
							orderNum = item.oddsName.split('-')[1]
						}
						return {
							orderType,
							orderStr: item.oddsCode.split('_')[1],
							orderNum,
							...item
						}
					})
				}
			},
			final: () => {
				System.loading(false)
			}
		});
	},

	handleFilter(obj: any) {
		console.log('obj', obj)
		conf.getLotteryOdds(obj)
		apis.meOder({
			current: 1,
			size: 10000,
			lotteryTypeId: obj.typeId,
			lotteryId: obj.playId,
			success: (res: any) => {
				if (res.code == 200) {
					let datas = res.data.records
					console.log('66666');
					console.log(datas);
					
					conf.listItems = datas.map((item: any, itemIndex: number) => {
						item.newPlayName = obj.playName
						item.playName = obj.playName

						// 投注内容
						item.newBetCodesArr = item.betCodes.split(',')
						if (obj.lotteryTypeCode == '5D') {
							item.newBetCodes = item.newBetCodesArr.map((obj: any) => {
								return obj.split('_')[1] + '_' + obj.split('_')[2]
							}).join(",") || ''
						} else if (obj.lotteryTypeCode == '3D') {
							item.orderType = item.betCodes.split('_')[0]
							let order: any = conf.getPurchase(item.betCodes)
							item.newBetCodes = item.newBetCodesArr.map((obj: any) => {
								return obj.split('_')[1]
							}).join(",") || ''
							item.newPlayName = obj.playName + ' - ' + i18n.t('game.sumType')
							switch (order.orderType) {
								case 'leopard':
									item.newBetCodes = [].concat(Array(3).fill(order.orderNum) as any).join(",")
									item.newPlayName = obj.playName + ' - ' + i18n.t('game.triple')
									break;
								case 'double':
									item.newBetCodes = [].concat(Array(2).fill(order.orderNum) as any).join(",")
									item.newPlayName = obj.playName + ' - ' + i18n.t('game.pair')
									break;
								case 'single':
									item.newBetCodes = order.orderNum
									item.newPlayName = obj.playName + ' - ' + i18n.t('game.single')
									break;
								case 'sum':
									item.newBetCodes = order.orderNum
									!isNaN(item.betContent) && (item.newPlayName = obj.playName + ' - ' + i18n.t('game.sumPoints'))
									break;
							}
						} else {
							item.newBetCodes = item.newBetCodesArr.map((obj: any) => {
								return obj.split('_')[1]
							}).join(",") || ''
						}
						item.betContent = item.newBetCodes

						item.coinSymbol = svalue.coinlist.find(into => into.coinCode == item.betCoinCode)?.coinSymbol || ''
						item.betMultiple = parseInt(item.betMultiple)
						item.betTime = conf.getTime(item.betTime)
						item.betOpenTime = conf.getTime(item.betOpenTime)
						item.id = StrUtil.getId()
						// 开奖号码
						if (obj.lotteryTypeCode == 'Trx_Win_Go') {
							item.openNumberStr = item.betOpenCode ? item.betOpenCode.slice(item.betOpenCode.length - 5, item.betOpenCode.length) : ''
							let index = conf.findLastDigitIndex(item.openNumberStr)
							item.betOpenCode = index != -1 ? parseFloat(item.openNumberStr.slice(index, index + 1)) : ''
						}
						return {
							id: itemIndex,
							betTitle: item.betExpect,
							lotteryTypeCode: obj.lotteryTypeCode,
							...item
						}
					})
				}
			},
			final: () => {
				System.loading(false)
			}
		});
	},

	getPurchase(oddsId: any) {
		let num = conf.oddsData.find((item: any) => {
			return item.oddsCode == oddsId
		});
		if (num) return num
	},

	//匹配开奖结果最后一个数字的位置
	findLastDigitIndex(str: any) {
		const matches = str.match(/\d(?!.*\d)/);
		const index = matches ? str.search(/\d(?!.*\d)/) : -1;
		return index;
	},

	// 时间戳转为时间格式
	getTime(timestamp: any) {
		if (!timestamp) return '-'
		let date = new Date(timestamp)
		let year = date.getFullYear()
		let moth = ('0' + (date.getMonth() + 1)).slice(-2)
		let day = ('0' + date.getDate()).slice(-2)
		let hour = ('0' + date.getHours()).slice(-2)
		let minute = ('0' + date.getMinutes()).slice(-2)
		let sechond = ('0' + date.getSeconds()).slice(-2)
		return year + '-' + moth + '-' + day + '  ' + hour + ':' + minute
	}
})
// computed: {
// 		...mapGetters(['storeCurrentConversation', 'storeSelfInfo'])
// }
onMounted(() => {
	Scope.setConf(conf)
	conf.getCoinData()
	conf.getLotteryList()
	conf.chat.getList()
})
</script>

<style lang="less" scoped>
.betRecord_container {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-color: #ededed;
	display: flex;
	flex-flow: column;
}
</style>
