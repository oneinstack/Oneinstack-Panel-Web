<template>
	<gameBox ref="gameBoxRefs" :list="conf.play.list" :active="conf.play.active" @change="conf.play.choose"
		@close="conf.bet.closeFun" :selectBetInfo="conf.selectBetInfoArr" :gameType="'Trx'"
		:currentOpenInfo="conf.currentOpenInfo" :openLockCountdown="conf.openLockCountdown"
		:betShare="conf.countdownDialogTime <= 20">
		<!-- 下注弹框自定义显示列表 -->
		<template v-slot:bet>
			<div class="row items-center">
				<div class="col row items-center">
					<template v-for="item in conf.bet.listNum">
						<div v-if="item.type == 'num'" class="row flex-center " :class="['qkball_' + item.color]"
							style="height: 58rem; width: 58rem">
							<span class="txt">{{ item.label }}</span>
						</div>
						<div v-else class="row flex-center ct-bs" :class="['qkball_' + item.color]">
							<span class="txt">{{ item.label }}</span>
						</div>
					</template>
				</div>
			</div>
		</template>

		<!-- 开奖结果 -->
		<div class="open-bet-box">
			<div class="open-number-list">
				<template v-for="(item, itemIndex) in conf.drawLotteryResult">
					<div class="result-item">
						<img class="number-item-img" src="/static/img/game/twgo/openCodeImg.webp" />
						<!-- 未开奖 -->
						<span class="result-text" v-if="conf.resuleIndex === null">{{
							conf.openCodeAllData[conf.scollIndex + itemIndex] || itemIndex }}</span>
						<!-- 已开奖 -->
						<span class="result-text" :class="itemIndex == conf.resuleIndex ? 'openCodeText' : ''" v-else>{{
							item }}</span>
					</div>
				</template>
			</div>
		</div>

		<!-- 期数信息、倒计时 -->
		<div class="time-box" style="margin: 6rem 0 30rem 0">
			<div class="row justify-between">
				<div>
					<div class="text">{{ $t('winGo.TrxWinGo') + ' ' }} {{ conf.selectPlayTypeName }}</div>
					<div class="number">{{ conf.currentOpenInfo.openExpect }}</div>
				</div>
				<div class="column items-end">
					<div style="margin-bottom: 14rem">{{ $t('winGo.TimeRemaining') }}</div>
					<ctime :times="conf.countdownArr" />
				</div>
			</div>
		</div>

		<!-- 下注选项 -->
		<div class="bet-box fit-width relative" style="padding: 20rem">
			<div class="row">
				<template v-for="item in conf.bet.listBSArr.slice(0, 3)">
					<div class="col bsitem-box"
						:class="[conf.bet.listNum.find((v: any) => v.oddsId == item.oddsId) ? 'active' : '']"
						@click="conf.bet.choose(item, 'listNum')">
						<div class="bsitem row justify-between items-center" :class="['num_' + item.color]">
							<div>{{ item.label }}</div>
							<div>{{ item.odds }}</div>
						</div>
					</div>
				</template>
			</div>
			<div class="row" style="margin-top: 8rem;display: flex;justify-content: space-between;">
				<template v-for="item in conf.bet.listNumArr">
					<div class="column flex-center ball-box"
						:class="[conf.bet.listNum.find((v: any) => v.oddsId == item.oddsId) ? 'active' : '']"
						style="width: 20%" @click="conf.bet.choose(item, 'listNum')">
						<div class="ball" :class="['qkball_' + item.color]">
							<span class="txt">{{ item.label }}</span>
						</div>
						<div style="line-height: 50rem">{{ item.odds }}</div>
					</div>
				</template>
			</div>
			<div class="row">
				<template v-for="item in conf.bet.listBSArr.slice(3)">
					<div class="col bsitem-box"
						:class="[conf.bet.listNum.find((v: any) => v.oddsId == item.oddsId) ? 'active' : '']"
						@click="conf.bet.choose(item, 'listNum')">
						<div class="bsitem row justify-between items-center" :class="['qkball_' + item.color]">
							<div>{{ item.label }}</div>
							<div>{{ item.odds }}</div>
						</div>
					</div>
				</template>
			</div>
			<!-- 倒计时弹窗 -->
			<big-time :seconds="conf.countdownDialogTime + ''"
				v-if="conf.bigDownShow && conf.countdownDialogTime <= conf.openLockCountdown"></big-time>
		</div>

		<!-- 历史结果记录 -->
		<div class="twgo-list">
			<div class="twgo-list-type flex-bw">
				<div class="type-item flex-center" :class="{ 'type-active': conf.tabType == 1 }"
					@click="conf.changeResultType(1, null)">
					{{ $t('game.resultHistory') }}</div>
				<div class="type-item flex-center" :class="{ 'type-active': conf.tabType == 2 }"
					@click="conf.changeResultType(2, null)">
					{{ $t('winGo.Chart') }}</div>
				<div class="type-item flex-center" :class="{ 'type-active': conf.tabType == 4 }"
					@click="conf.changeResultType(4, null)">
					{{ $t('game.rule') }}</div>
				<div class="type-item flex-center" :class="{ 'type-active': conf.tabType == 3 }"
					@click="conf.changeResultType(3, null)">
					{{ $t('game.myOrder') }}</div>

			</div>
			<result v-if="conf.tabType == 1" ref="resultRfes" :resultList="conf.resultList"></result>
			<chat v-if="conf.tabType == 2" :chartDataList="conf.chartDataList"></chat>
			<order v-if="conf.tabType == 3" :orderDataList="conf.orderDataList" :isClickPage="conf.isClickPage"
				@handleClickOrderPage="conf.handleClickOrderPage"></order>
			<rule v-if="conf.tabType == 4" :list="conf.lotteryRuleurl"></rule>
		</div>
		<!-- 分页工具 -->
		<cpage :pageInfo="conf.pageObj" style="margin-top: 30rem"
			v-if="(conf.tabType == 1 || conf.tabType == 2) ? conf.resultList.length > 0 : conf.tabType == 3 ? conf.orderDataList.length > 0 : ''"
			@handlePageChange="conf.handlePageChange" />
	</gameBox>
</template>
<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref } from 'vue';
import gameBox from '../components/gameBox.vue'
import cpage from '../components/gamePage.vue'
import rule from "../components/gameRule.vue"
import ctime from '../components/downTime.vue'
import result from "./result.vue"
import chat from "./chat.vue"
import bigTime from "../components/bigTime.vue"
import order from "./order.vue"
import { svalue } from '@/sstore/svalue'
import { apis } from '@/api';
import i18n from '@/lang';
import System from '@/utils/System';
import sutil from '@/sstore/sutil';

const gameBoxRefs = ref<any>()
const conf = reactive({
	hours: '00',	//倒计时 - 时
	minutes: '00',	//倒计时 - 分
	second: '00',	//倒计时 - 秒
	countdownArr: ['00', '00', '00'],	//倒计时数组
	countdownDialogTime: 10,
	bigDownShow: false,

	drawLotteryResult: ['9', 'A', 'E', 'A', 'D'],
	resuleIndex: null as any,
	openCodeAllData: [] as any[],
	scollIndex: 0,
	scollTimer: null as any,
	selectBetInfoArr: [] as any[],	//选择下注信息
	bet: {
		//打开下注弹框
		open: () => {
			CEvent.emit('openbet')
		},
		//关闭下注弹框
		close: () => {
			CEvent.emit('closebet')
		},
		autoClose: (time: any) => {
			time <= conf.openLockCountdown && conf.bet.close()
		},
		//清理选中数据
		closeFun: (type: any) => {
			conf.bet.listNum = []
			conf.bet.listBS = []
			if (type == 'betSuccess' && conf.tabType == 3) {
				conf.changeResultType(3, null)
			}
		},
		//下注数字原始数据
		listNumArr: [] as any[],
		//选中数据
		listNum: [] as any[],
		//下注大小单双原始数据
		listBSArr: [] as any[],
		//选中数据
		listBS: [] as any[],
		//选择下注数据
		choose: (item: any, name: any) => {
			if (conf.bet[name].includes(item)) {
				let index = conf.bet[name].findIndex((v: any) => v.sort == item.sort)
				if (index >= 0) conf.bet[name].splice(index, 1)
				// conf.bet[name].remove((v) => v.sort == item.sort)
			} else {
				conf.bet[name].push(item)
			}
			conf.bet[name].sort((a: any, b: any) => a.sort - b.sort)
			conf.bet.open()
			conf.selectBetInfoArr = conf.bet[name]
		}
	} as any,
	countdownSetTime: null as any,
	play: {
		active: '',
		choose: (key: any, index: any) => {
			conf.play.active = key
			//清空倒计时定时器
			clearTimeout(conf.countdownSetTime)
			conf.countdownSetTime = null
			conf.getCurrentPlayInfo(index)
			conf.bet.close()
		},
		list: []
	},
	his: {
		tabs: {
			active: '1',
			options: [{
				key: '1',
				label: 'Game history'
			},
			{
				key: '2',
				label: 'My history'
			}
			],
			choose: (item: any) => {
				conf.his.tabs.active = item.key
			}
		}
	},
	tabType: 1,
	lotteryRuleurl: '',
	gameTypeArr: [] as any[],	//玩法类型
	lotteryId: '',	//当前玩法类型id
	openLockCountdown: 0,	//当前玩法类型停止下注倒计时
	currentOpenInfo: {} as any, //当前期数开奖信息
	lastOpenInfo: {} as any, //上一期开奖期数
	nextOpenInfo: {} as any, //下一期开奖信息
	countdownNum: 10,	//当前玩法类型开奖倒计时
	getOpenLotteryInfoTimer: null as any,	//获取开奖信息定时器
	oddsArr: [] as any[], //赔率数据

	//result分页
	resultPageSize: 10,
	resultPageNum: 1,
	resultTotalPages: 0,
	resultTotal: 0,
	resultList: [],

	pageObj: {
		page: 1,
		size: 10,
		total: 0,
		pageTotal: 0,
	},

	//order
	orderPageSize: 10,
	orderPageNum: 1,
	orderTotalPages: 0,
	orderTotal: 0,
	orderDataList: [],

	selectPlayTypeName: '',
	isClickPage: false,
	gameType: '',
	gameTypeId: '',
	chartDataList: [] as any[],
	//获取玩法类型
	getLotteryList(index: any) {
		//清空倒计时定时器
		clearInterval(conf.countdownSetTime)
		conf.countdownSetTime = null
		apis.lotteryList({
			success: (res: any) => {
				let datas = res.data
				let newIndex = datas.findIndex((item: any) => item.lotteryTypeVO.lotteryTypeCode == 'Trx_Win_Go')
				conf.gameTypeArr = datas[newIndex].lotteryVOList || []
				conf.gameType = conf.gameTypeArr[index].lotteryShowname || conf.gameTypeArr[0].lotteryShowname
				conf.gameTypeId = conf.gameTypeArr[index].id || conf.gameTypeArr[0].id
				conf.openLockCountdown = conf.gameTypeArr[index].openLockCountdown / 1000 //锁定倒计时
				conf.lotteryId = conf.gameTypeArr[index].id
				conf.play.list = datas[newIndex].lotteryVOList || []
				conf.play.active = conf.gameTypeArr[index].id || []
				let min = conf.gameTypeArr[index].lotteryInterval || conf.gameTypeArr[0].lotteryInterval
				if ((min / 1000 / 60) >= 1) {
					conf.selectPlayTypeName = (min / 1000 / 60) + ((min / 1000 / 60) > 1 ? i18n.t('game.minutes') : i18n.t('game.minute'))
				} else {
					conf.selectPlayTypeName = (min / 1000) + i18n.t('game.second')
				}
				if (conf.getOpenLotteryInfoTimer) {
					clearTimeout(conf.getOpenLotteryInfoTimer)
					conf.getOpenLotteryInfoTimer = null
				}
				conf.getLotteryOpen('changePlay')
				conf.getLotteryOdds(conf.gameTypeArr[index].lotteryTypeId)
				conf.changeResultType(conf.tabType, null)
				conf.lotteryRuleurl = conf.gameTypeArr[index].lotteryRuleurl
			}
		});
	},

	//获取当前玩法数据
	getCurrentPlayInfo(index: any) {
		conf.gameType = conf.gameTypeArr[index].lotteryShowname || conf.gameTypeArr[0].lotteryShowname
		conf.gameTypeId = conf.gameTypeArr[index].id || conf.gameTypeArr[0].id
		conf.openLockCountdown = conf.gameTypeArr[index].openLockCountdown / 1000 //锁定倒计时
		conf.lotteryId = conf.gameTypeArr[index].id
		conf.play.active = conf.gameTypeArr[index].id || []
		let min = conf.gameTypeArr[index].lotteryInterval || conf.gameTypeArr[0].lotteryInterval
		if ((min / 1000 / 60) >= 1) {
			conf.selectPlayTypeName = (min / 1000 / 60) + ((min / 1000 / 60) > 1 ? i18n.t('game.minutes') : i18n.t('game.minute'))
		} else {
			conf.selectPlayTypeName = (min / 1000) + i18n.t('game.second')
		}
		if (conf.getOpenLotteryInfoTimer) {
			clearTimeout(conf.getOpenLotteryInfoTimer)
			conf.getOpenLotteryInfoTimer = null
		}
		conf.getLotteryOpen('changePlay')
		conf.lotteryRuleurl = conf.gameTypeArr[index].lotteryRuleurl
	},

	// 获取开奖信息
	getLotteryOpen(type: any) {
		if (type == 'changePlay') {
			System.loading()
		}
		conf.resuleIndex = null
		apis.lotteryOpen({
			lotteryId: conf.lotteryId,
			success: (res: any) => {
				let datas = res.data
				conf.currentOpenInfo = datas.currentOpen
				conf.lastOpenInfo = datas.lastOpen
				conf.nextOpenInfo = datas.nextOpen
				conf.countdownNum = parseInt(conf.currentOpenInfo.openTime) - parseInt(datas.currentSystemTime)
				type && conf.handleCountdown(conf.countdownNum)

				//上一期数未开奖
				if (!conf.lastOpenInfo.openCode) {
					clearTimeout(conf.getOpenLotteryInfoTimer);
					conf.getOpenLotteryInfoTimer = null;
					conf.getOpenLotteryInfoTimer = setTimeout(() => {
						conf.getLotteryOpen(null)
					}, 1000)
					clearInterval(conf.scollTimer);
					conf.scollTimer = null;
					conf.handleScollNumber()
				} else {
					gameBoxRefs.value?.getWalletMoney(2)
					conf.handleDrawLotteryResult(conf.lastOpenInfo.openCode)
					conf.changeResultType(conf.tabType, null)
				}
			},
			final: () => {
				System.loading(false)
			}
		});
	},

	// 未开奖 => 数字变化
	handleScollNumber() {
		conf.scollTimer = setInterval(() => {
			conf.scollIndex = conf.getRandomIndex(conf.openCodeAllData)
		}, 100)
	},

	//随机选择数组索引
	getRandomIndex(array: any) {
		let randomIndex = Math.floor(Math.random() * array.length);
		return randomIndex;
	},

	// 倒计时
	handleCountdown(nowDate: any) {
		let hours = Math.floor((nowDate / 1000 / 60 / 60) % 24)
		let minutes = Math.floor((nowDate / 1000 / 60) % 60)
		let seconds = Math.floor((nowDate / 1000) % 60)
		if (seconds < 0) return
		conf.hours = conf.ripr(hours)
		conf.minutes = conf.ripr(minutes)
		conf.second = conf.ripr(seconds)
		conf.countdownDialogTime = conf.ripr(Math.floor(nowDate / 1000))
		conf.countdownDialogTime = conf.countdownDialogTime
		conf.bigDownShow = true
		if (nowDate > 0) {
			conf.countdownSetTime = setTimeout(() => {
				nowDate -= 1000
				if (nowDate < 0) {
					clearInterval(conf.countdownSetTime);
					conf.countdownSetTime = null;
					if (conf.getOpenLotteryInfoTimer) {
						clearTimeout(conf.getOpenLotteryInfoTimer);
						conf.getOpenLotteryInfoTimer = null;
					}
					conf.getLotteryOpen('load')
				} else {
					conf.handleCountdown(nowDate)
				}
				conf.countdownArr = [conf.hours, conf.minutes, conf.second]
				conf.bet.autoClose(conf.countdownDialogTime)
			}, 1000)
		}
	},

	//获取赔率
	getLotteryOdds(lotteryTypeId: string) {
		// System.loading()
		apis.lotteryOdds({
			lotteryTypeId,
			lotteryTypeCode: "Trx_Win_Go",
			success: (res: any) => {
				let regex = /^[0-9]*$/ // 匹配数字
				let datas = res.data || []
				datas?.forEach((item: any) => {
					let num = item.oddsCode.split('_')[1]
					item.number = regex.test(num) ? parseFloat(num) : num.toUpperCase()
					item.odds = parseFloat(item.odds)

					//颜色、大小赔率
					let newIndex = conf.bet.listBSArr.findIndex((into: any) => into.label.toUpperCase() == item.number)
					if (newIndex != -1) {
						let newObj = {
							...item,
							...conf.bet.listBSArr[newIndex]
						}
						conf.bet.listBSArr[newIndex] = newObj
					}

					// 数字赔率
					let index = conf.bet.listNumArr.findIndex((into: any) => into.label == item.number)
					if (index != -1) {
						let obj = {
							...item,
							...conf.bet.listNumArr[index]
						}
						conf.bet.listNumArr[index] = obj
					}
				})
			},
			final: () => {
				System.loading()
			}
		});
	},

	//数据小于10处理
	ripr(num: any) {
		num = parseFloat(num)
		return num < 10 ? `0${num}` : num
	},

	//处理开奖结果
	handleDrawLotteryResult(val: any) {
		let openCode = conf.toUpperCase(val.slice(val.length - 5, val.length))
		conf.drawLotteryResult = Array.from(openCode)
		let regex = /^[0-9]*$/ // 匹配数字
		conf.resuleIndex = null
		let resultObj = {}
		conf.drawLotteryResult.forEach((item, itemIndex) => {
			if (regex.test(item)) {
				conf.resuleIndex = itemIndex
				conf.drawLotteryResult[itemIndex] = item
			}
		})
	},

	//选择菜单类型（Rule、Result history、Chart、My order）
	//type判断分页
	changeResultType(num: any, type: any) {
		conf.tabType = num
		switch (num) {
			//Result history
			case 1:
				if (type == 'last') {
					conf.resultPageNum--
				} else if (type == 'next') {
					conf.resultPageNum++
				} else {
					conf.resultPageNum = 1
				}
				conf.getLotteryResult()
				break;
			//Chart
			case 2:
				if (type == 'last') {
					conf.resultPageNum--
				} else if (type == 'next') {
					conf.resultPageNum++
				} else {
					conf.resultPageNum = 1
				}
				conf.getLotteryResult()
				break;
			//My order
			case 3:
				if (type == 'last') {
					conf.orderPageNum--
				} else if (type == 'next') {
					conf.orderPageNum++
				} else {
					conf.orderPageNum = 1
				}
				conf.getOrderData()
				break;
			//Rule
			case 4:

				break;
		}
	},

	//获取result数据
	getLotteryResult() {
		// System.loading()
		apis.lotteryOpenResult({
			current: conf.resultPageNum,
			size: conf.resultPageSize,
			lotteryId: conf.lotteryId,
			success: (res: any) => {
				let datas = res.data
				conf.resultList = datas.records || []
				conf.resultList?.forEach((item: any) => {
					item.openNumberStr = conf.toUpperCase(item.openCode.slice(item.openCode.length - 5, item.openCode.length))
					let index = conf.findLastDigitIndex(item.openNumberStr)
					item.openNumber = String(item.openNumberStr.slice(index, index + 1)) || ''
				})
				conf.resultTotal = datas.total
				conf.resultTotalPages = datas.pages
				conf.pageObj.page = datas.current
				conf.pageObj.total = datas.total
				conf.pageObj.pageTotal = Math.ceil(datas.total / conf.pageObj.size)
				conf.chartDataList = conf.resultList.filter((item: any) => { return item.openCode })
			},
			final: () => {
				System.loading(false)
			}
		});
	},

	// 使用正则表达式匹配字符串中的所有字母，并将其转换为大写
	toUpperCase(str: any) {
		return str.replace(/[a-z]/g, function (letter: any) {
			return letter.toUpperCase();
		});
	},

	//获取My order数据
	async getOrderData() {
		let defaultWalletInfo = await svalue.getDefaultWallet()
		System.loading()
		apis.lotteryUserOrder({
			current: conf.orderPageNum,
			size: conf.orderPageSize,
			lotteryId: conf.lotteryId,
			success: async (res: any) => {
				let coinlistArr = await svalue.getCoinlist()	//货币数据
				// let defaultCoin = uni.getStorageSync('defaultCoin')	//默认货币数据
				let datas = res.data
				conf.orderDataList = datas.records || []
				conf.orderDataList?.forEach((item: any) => {
					item.openNumberStr = item.betOpenCode ? item.betOpenCode.slice(item.betOpenCode.length - 5, item.betOpenCode.length) : ''
					let index = conf.findLastDigitIndex(item.openNumberStr)
					item.openNumber = index != -1 ? parseFloat(item.openNumberStr.slice(index, index + 1)) : ''

					let color = conf.bet.listNumArr.find((into: any) => into.label == item.openNumber)?.color || ''
					item.color = color
					//下注number
					item.betNumber = item.betCodes.split('_')[1]
					//下注number对应颜色
					let betColor = conf.bet.listNumArr.find((into: any) => into.label == item.betNumber)?.color || ''
					item.betColor = betColor
					let obj = coinlistArr.find(into => into.coinCode == item.betCoinCode)
					//默认钱包coinSymbol
					item.defaultWalletCoinSymbol = defaultWalletInfo.coinSymbol == 'USDT' ? defaultWalletInfo.coinSymbol + ' ' : defaultWalletInfo.coinSymbol
					item.defaultWalletCoin = defaultWalletInfo.walletCoin

					//下注钱包coinSymbol
					item.coinSymbol = obj.coinSymbol == 'USDT' ? obj.coinSymbol + ' ' : obj.coinSymbol

					// 下注钱包对应汇率
					item.coinTousdt = obj?.coinTousdt

					//下注金额汇率转换（eg:默认钱包=CNY，默认币种钱包=INR,下注钱包=USD,将下注金额转换为默认钱包对应金额）
					let betMoneyResult = sutil.Mul(sutil.division(defaultWalletInfo.coinTousdt, item.coinTousdt, false), item.totalBetAmount)
					betMoneyResult = sutil.formatNumber(betMoneyResult)
					let betMoneyResultToFixed4 = sutil.dataHandling(betMoneyResult)
					item.betMoneyToFixed4 = betMoneyResultToFixed4

					//中奖金额汇率转换
					let PrizeMoneyResult = null
					if (parseFloat(item.betPrizeMoney) > 0) {
						PrizeMoneyResult = sutil.Mul(sutil.division(defaultWalletInfo.coinTousdt, item.coinTousdt, false), item.betPrizeMoney)
						PrizeMoneyResult = sutil.formatNumber(PrizeMoneyResult)
					} else {
						item.betPrizeMoney = 0.00
						PrizeMoneyResult = 0.00
					}
					let PrizeMoneyResultToFixed4 = sutil.dataHandling(PrizeMoneyResult)
					item.PrizeMoneyToFixed4 = PrizeMoneyResultToFixed4
				})
				conf.orderTotal = datas.total
				conf.pageObj.page = datas.current
				conf.pageObj.total = datas.total
				conf.pageObj.pageTotal = Math.ceil(datas.total / conf.pageObj.size)
			},
			final: () => {
				System.loading(false)
			}
		});
	},

	//匹配开奖结果最后一个数字的位置
	findLastDigitIndex(str: any) {
		const matches = str.match(/\d(?!.*\d)/);
		const index = matches ? str.search(/\d(?!.*\d)/) : -1;
		return index;
	},

	//分页change
	handlePageChange(type: any) {
		conf.changeResultType(conf.tabType, type)
		conf.handleClickOrderPage(true)
	},

	//点击order => 分页
	handleClickOrderPage(val: any) {
		conf.isClickPage = val
	},
})
const init = () => {
	conf.bet.listNumArr = []
	let greenArr = [1, 3, 7, 9]
	for (let i = 0; i < 10; i++) {
		let color = ''
		if (i == 0) {
			color = 'rv'
		} else if (greenArr.includes(i)) {
			color = 'g'
		} else if (i == 5) {
			color = 'gv'
		} else {
			color = 'r'
		}
		conf.bet.listNumArr.push({
			// sort: i + 4,
			key: i,
			label: i,
			color,
			// type: 'num',
			// odds: 9
		})
	}

	conf.bet.listBSArr = [
		{
			label: 'Red',
			color: 'red',
		},
		{
			label: 'Green',
			color: 'green',
		},
		{
			label: 'Violet',
			color: 'violet',
		},
		{
			label: 'Big',
			color: 'blue',
		},
		{
			label: 'Small',
			color: 'yellow',
		}
	]
}
onMounted(() => {
	init()
	let arr = Array.from({ length: 26 }, (_, index) => String.fromCharCode('A'.charCodeAt(0) + index))
	for (let i = 0; i < 10; i++) {
		conf.openCodeAllData.push(i)
	}
	conf.openCodeAllData = [...conf.openCodeAllData, ...arr]
	conf.getLotteryList(0)
})
onUnmounted(() => {
	//清空倒计时定时器
	clearTimeout(conf.countdownSetTime)
	conf.countdownSetTime = null

	clearTimeout(conf.getOpenLotteryInfoTimer)
	conf.getOpenLotteryInfoTimer = null

	clearInterval(conf.scollTimer);
	conf.scollTimer = null;
})
</script>

<style lang="less" scoped>
//自定义下注列表样式
.select-info-name {
	color: #0074ff;
	font-size: 40rem;
}

.ct-bs {
	height: 48rem;
	padding: 0 20rem;
	color: #fff;
	border-radius: 10rem;
	margin-left: 8rem;

	&:first-of-type {
		margin-left: 0rem;
	}
}

.open-bet-box {
	background-image: linear-gradient(#f1d2b0, #d3ac84);
	padding: 15rem;
	border-radius: 10rem;
	margin-bottom: 30rem;

	.open-number-list {
		padding: 10rem 10rem 14rem;
		background-color: #fff;
		border-radius: 10rem;
		display: flex;
		justify-content: space-between;

		.number-item-img {
			height: 120rem;
			width: 100rem;
		}

		.result-item {
			position: relative;

		}

		.result-text {
			position: absolute;
			top: 32rem;
			left: 34rem;
			font-size: 45rem;
			color: #FEC748;
		}

		.openCodeText {
			color: #fff !important;
		}
	}
}

// 倒计时样式
.time-box {
	width: 100%;
	height: 190rem;
	background: url(/static/img/game/pk10/diban.png) no-repeat;
	background-size: 100% 100%;
	padding: 42rem 36rem;
	color: #fff;

	.span {
		border: 1rem solid #fff;
		display: inline-block;
		font-size: 24rem;
		line-height: 38rem;
		color: #ffffff;
		border-radius: 10rem;
		margin-bottom: 14rem;
		padding: 0 16rem;
	}

	.number {
		font-size: 34rem;
		font-weight: 600;
	}
}

// 下注样式

.pl-tabs-item {
	display: flex;
	font-size: 24rem;
	justify-content: center;
	align-items: center;
	color: #697984;
	border-radius: 30rem;
	height: 60rem;
	padding: 0 20rem;
	border: 1px solid #d61f24;
	color: #d61f24;

	&.active {
		background: #d61f24;
		color: #ffffff;
	}
}

.bet-box {
	background-color: #fff;
	border-radius: 16rem;
}

.ball-box {
	padding-top: 10rem;
	border-radius: 15rem;
	border: 1rem solid #d61f2400;

	&.active {
		border: 1px solid #F88c43;
		background: #FEC74810;
	}

	.ball {
		width: 76rem;
		height: 76rem;
		color: #fff;
		background: #fff;
		font-size: 38rem;
		font-weight: 500;
		color: #3a3a3a;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: bold;
	}
}

.bsitem-box {
	border-radius: 8rem;
	border: 1rem solid #d61f2400;
	// padding: 6rem;
	padding: 6rem;

	&.active {
		border: 1px solid #F88c43;
		background: #FEC74810;
	}

	.bsitem {
		border-radius: 8rem;
		// height: 75rem;
		padding: 24rem 20rem;
		color: #fff;
	}
}

.qkball_rv {
	background: url(/static/img/game/twgo/n0_bg.png) !important;
	background-size: 100% !important;

	.txt {
		background: linear-gradient(143deg, #FE565C 51.71%, #A943F7 51.72%) !important;
		background-clip: text !important;
		-webkit-background-clip: text !important;
		-webkit-text-fill-color: transparent !important;
	}
}

.qkball_g {
	background: url(/static/img/game/twgo/green_bg.png) !important;
	background-size: 100% !important;

	.txt {
		color: #2F9C61;
	}
}

.qkball_gv {
	background: url(/static/img/game/twgo/n5_bg.png) !important;
	background-size: 100% !important;

	.txt {
		background: linear-gradient(143deg, #4CCB86 51.71%, #A943F7 51.72%) !important;
		background-clip: text !important;
		-webkit-background-clip: text !important;
		-webkit-text-fill-color: transparent !important;
	}
}

.qkball_r {
	background: url(/static/img/game/twgo/red_bg.png) !important;
	background-size: 100% !important;

	.txt {
		color: #E93333;
	}
}

.qkball_green {
	background: linear-gradient(90deg, #00be50 0%, #9bdf00 100%);
	box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.15);
}

.qkball_red {
	background: linear-gradient(90deg, #fd0261 0%, #ff8a96 100%);
	box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.15);
}

.qkball_blue {
	background: linear-gradient(90deg, #00bdff 0%, #5bcdff 100%);
	box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.15);
}

.qkball_yellow {
	background: linear-gradient(90deg, #ff9000 0%, #ffd000 100%);
	box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.15);
}

.qkball_violet {
	background: linear-gradient(90deg, #480AC5 0%, #B36FF8 100%);
	box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.15);
}

.num_green {
	background: linear-gradient(90deg, #00be50 0%, #9bdf00 100%);
	box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.15);
}

.num_red {
	background: linear-gradient(90deg, #fd0261 0%, #ff8a96 100%);
	box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.15);
}

.num_blue {
	background: linear-gradient(90deg, #00bdff 0%, #5bcdff 100%);
	box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.15);
}

.num_yellow {
	background: linear-gradient(90deg, #ff9000 0%, #ffd000 100%);
	box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.15);
}

.num_violet {
	background: linear-gradient(90deg, #480AC5 0%, #B36FF8 100%);
	box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.15);
}

.flex-bw {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.flex-center {
	display: flex;
	align-items: center;
	justify-content: center;
}

.twgo-list {
	padding: 20rem 0rem;

	.twgo-list-type {
		.type-item {
			width: 23.3%;
			background-color: #DDDDDD;
			border-radius: 14rem 14rem 0 0;
			color: rgba(92, 97, 109, .8);
			font-size: 26rem;
			height: 64rem;

			&.type-active {
				color: #ffffff;
				background: linear-gradient(180deg, #F6843F 0%, #FEA14D 100%);
			}
		}

	}
}

.justify-between {
	justify-content: space-between;
}
</style>