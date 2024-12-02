<template>
	<gameBox ref="gameBoxRefs" :list="conf.play.list" :active="conf.play.active"
		:betShare="conf.countdownDialogTime <= 20" @change="conf.play.choose" @close="conf.bet.closeFun"
		:selectBetInfo="conf.selectBetInfoArr" :gameType="'5D'" :currentOpenInfo="conf.currentOpenInfo"
		:openLockCountdown="conf.openLockCountdown">
		<!-- 下注弹框自定义显示列表 -->
		<template v-slot:bet>
			<div class="row items-center" style="align-items: start;">
				<div class="select-bet-type">{{ conf.selectBetType }}</div>
				<template v-for="item in conf.betTypeArr" :key="item">
					<div class="bet-type flex-center" :class="[`num_${item}`]">{{ item }}</div>
				</template>
				<template v-for="(item, itemIndex) in conf.selectBetInfoArr" :key="itemIndex">
					<div class="flex-center-num" v-if="item.type == 'num'">
						<img src="/static/img/poinits.webp" />
						<span>{{ item.number }}</span>
					</div>
					<div class="bet-number flex-center" :class="['num_' + item.color]" v-else>{{ item.number }}
					</div>
				</template>
			</div>
		</template>
		<!-- 开奖结果 -->
		<div class="game-result">
			<div class="result-top">
				<div class="txt-grey">{{ $t('game.resultBig') }}</div>
				<div class="round-num" v-for="(item, index) in conf.resultInfoObj.numArr">
					<div class="fade-item">
						<img src="/static/img/poinits.webp" class="point-img" />
						<!-- 已开奖 -->
						<span v-if="!conf.isNoOpenCode">{{ item.value }}</span>
						<!-- 未开奖 -->
						<span v-else>{{ conf.openCodeAllData[conf.scollIndex + index] || index }}</span>
					</div>
					<div class="word-index">{{ item.key }}</div>
				</div>
				<div>=</div>
				<div class="round-num">
					<!-- 已开奖 -->
					<div class="fade-item fage-active" :class="conf.resultInfoObj.sum > 22 ? 'num_blue' : 'num_yellow'"
						v-if="!conf.isNoOpenCode">
						{{ conf.resultInfoObj.sum }}</div>
					<!-- 未开奖 -->
					<div class="fade-item fage-active" :class="conf.resultInfoObj.sum > 22 ? 'num_blue' : 'num_yellow'"
						v-else>
						{{ conf.scollSum }}</div>
				</div>
			</div>
			<!-- 开奖倒计时 -->
			<div class="result-number">
				<div class="txt-grey flex-bw">
					<span>{{ $t('game.drawID') }}</span>
					<span>{{ $t('winGo.TimeRemaining') }}</span>
				</div>
				<div class="flex-bw num-time">
					<div class="number">{{ conf.currentOpenInfo.openExpect }}</div>
					<div class="down-time">
						<div class="time-item flex-center red-bg">{{ conf.minutes[0] }}</div>
						<div class="time-item flex-center red-bg">{{ conf.minutes[1] }}</div>
						<div class="division">:</div>
						<div class="time-item flex-center red-bg">{{ conf.second[0] }}</div>
						<div class="time-item flex-center red-bg">{{ conf.second[1] }}</div>
					</div>
				</div>
			</div>
		</div>
		<div class="bet-select-box">
			<!-- 下注类型 -->
			<div class="bet-type-list">
				<template v-for="(item, index) in conf.selectBetList" :key="index">
					<div class="d5-bet-type flex-center" :class="{ 'type-active': item == conf.selectBetType }"
						@click="conf.handleSelectBetType(item, index)">{{ item }}</div>
				</template>
			</div>
			<!-- 下注按钮 -->
			<div class="d5-bet-content">
				<div class="flex-bw">
					<template v-for="(item, index) in conf.betTypeOdds" :key="item.name">
						<div class="bet-type-btn flex-bw" :class="['num_' + item.color]"
							@click="conf.handleSelectBet(item)">
							<span>{{ item.number }}</span>
							<span>{{ item.odds }}</span>
						</div>
					</template>
				</div>
				<!-- 下注数字 -->
				<div class="d5-bet-num">
					<template v-for="(item, itemIndex) in conf.betNumberOdds" :key="itemIndex">
						<div class="bet-num-item" v-if="conf.selectBetType != 'SUM'"
							:class="{ 'active_number': conf.betNumArr.includes(item.number) }">
							<div class="num-box flex-center" @click="conf.handleSelectBet(item)">
								<img src="/static/img/poinits.webp" />
								<span>{{ item.number }}</span>
							</div>
							<div class="onum-dds">{{ item.odds }}</div>
						</div>
					</template>
				</div>
			</div>
			<div class="big-time" v-if="conf.bigDownShow && conf.countdownDialogTime <= conf.openLockCountdown">
				<div class="big-down-time">
					<div class="big-time-item flex-center red-bg">{{ conf.second[0] }}</div>
					<div class="big-time-item flex-center red-bg">{{ conf.second[1] }}</div>
				</div>
			</div>
		</div>
		<!-- 历史结果记录 -->
		<div class="d5-list">
			<div class="d5-list-type flex-bw">
				<div class="type-item flex-center" :class="{ 'type-active': conf.tabType == 1 }"
					@click="conf.handleSelctTabChange(1, null)">{{ $t('game.resultHistory') }}</div>
				<div class="type-item flex-center" :class="{ 'type-active': conf.tabType == 2 }"
					@click="conf.handleSelctTabChange(2, null)">{{ $t('winGo.Chart') }}</div>
				<div class="type-item flex-center" :class="{ 'type-active': conf.tabType == 4 }"
					@click="conf.handleSelctTabChange(4, null)">{{ $t('game.rule') }}</div>
				<div class="type-item flex-center" :class="{ 'type-active': conf.tabType == 3 }"
					@click="conf.handleSelctTabChange(3, null)">{{ $t('game.myOrder') }}</div>
			</div>
			<result v-if="conf.tabType == 1" :resultList="conf.resultList"></result>
			<chat v-else-if="conf.tabType == 2" :chartDataList="conf.chartDataList"
				:selectBetIndex="conf.selectBetIndex">
			</chat>
			<order v-if="conf.tabType == 3" :orderDataList="conf.orderDataList" :isClickPage="conf.isClickPage"
				@handleClickOrderPage="conf.handleClickOrderPage"></order>
			<rule v-if="conf.tabType == 4" :list="conf.lotteryRuleurl"></rule>
		</div>
		<!-- 分页工具 -->
		<cpage :pageInfo="conf.pageObj" style="margin-top: 30rem"
			v-if="(conf.tabType == 1 || (conf.tabType == 2 && conf.selectBetIndex != 5)) ? conf.resultList.length > 0 : conf.tabType == 3 ? conf.orderDataList.length > 0 : ''"
			@handlePageChange="conf.handlePageChange" />

		<game-loading v-if="conf.loading" />
	</gameBox>
</template>
<script setup lang="ts">
import { apis } from '@/api';
import gameBox from '../components/gameBox.vue'
import gameLoading from "../components/gameLoading.vue"
import cpage from '../components/gamePage.vue'
import rule from "../components/gameRule.vue"
import result from './result.vue'
import chat from './chat.vue'
import order from './order.vue'
import { onMounted, onUnmounted, reactive, ref } from 'vue';
import System from '@/utils/System';
import { svalue } from '@/sstore/svalue';
import sutil from '@/sstore/sutil';

const gameBoxRefs = ref<any>()
const conf = reactive({
	bet: {
		open: () => {
			CEvent.emit('openbet')
		},
		close: () => {
			CEvent.emit('closebet')
		},
		autoClose: (time: any) => {
			time <= conf.openLockCountdown && conf.bet.close()
		},
		//清理选中数据
		closeFun: (type: any) => {
			conf.betNumArr = []
			conf.selectBetInfoArr = []
			if (type == 'betSuccess' && conf.tabType == 3) {
				conf.handleSelctTabChange(3, null)
			}
		},
	},
	play: {
		active: 't1',
		choose: (key: any, index: any) => {
			conf.play.active = key
			//清空倒计时定时器
			clearTimeout(conf.countdownSetTime)
			conf.countdownSetTime = null
			conf.getCurrentPlayInfo(index)
			conf.bet.close()
		},
		list: [{
			key: 't1',
			label: 'Racing 1Min'
		},
		{
			key: 't3',
			label: 'Racing 3Min'
		},
		{
			key: 't5',
			label: 'Racing 5Min'
		},
		{
			key: 't10',
			label: 'Racing 10Min'
		}
		]
	},
	autoplay: false,
	duration: 150,

	betTypeArr: [] as any,
	betNumArr: [] as any[],  //选中的数据
	loading: false,
	tabType: 1,
	pageSize: 10,
	pageNum: 1,
	total: 60,
	totalPage: 0,
	betNumList: [0, 0, 0, 0, 0],
	downTimeNum: 3,
	hours: '00', //倒计时 - 时
	minutes: '00', //倒计时 - 分
	second: '00', //倒计时 - 秒
	betTotal: 0,
	bigTimeShow: true,
	stopBetTime: 10,

	selectBetInfoArr: [] as any[],

	drawNumber: '',

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

	countdownDialogTime: 10,
	bigDownShow: false,

	// 开奖结果信息
	resultInfoObj: {
		numArr: [
			{
				key: 'A',
				value: '1'
			},
			{
				key: 'B',
				value: '2'
			},
			{
				key: 'C',
				value: '3'
			},
			{
				key: 'D',
				value: '4'
			},
			{
				key: 'E',
				value: '5'
			}
		],
		sum: 0,
	},

	countdownSetTime: null as any,	//倒计时定时器
	selectBetList: ['A', 'B', 'C', 'D', 'E', 'SUM'],
	selectBetType: '',	//选择下注类型
	selectBetIndex: 0,
	//大小、单双赔率数据
	betTypeOdds: [
		{
			number: '',
			name: 'Big',
			select: false,
			odds: 2,
			color: 'blue',
			type: 'other'
		},
		{
			number: '',
			name: 'Small',
			select: false,
			odds: 2,
			color: 'yellow',
			type: 'other'
		},
		{
			number: '',
			name: 'Odd',
			select: false,
			odds: 2,
			color: 'red',
			type: 'other'
		},
		{
			number: '',
			name: 'Even',
			select: false,
			odds: 2,
			color: 'green',
			type: 'other'
		}
	],
	// 数字赔率
	betNumberOdds: [] as any[],
	allOddsData: [] as any[],	//赔率数据

	//分页
	pageObj: {
		page: 1,
		size: 10,
		total: 0,
		pageTotal: 0,
	},

	resultList: [],	//历史记录
	chartDataList: [],	//趋势图
	orderDataList: [],	//下注订单

	openCodeAllData: [],
	scollIndex: 0,
	scollTimer: null as any,
	isNoOpenCode: true,	//判断是否开奖
	scollSum: null,
	resultTop: null,

	isClickPage: false,
	gameType: '',
	gameTypeId: '',
	countdownArr: [] as any[],
	getRandomInt(min: any, max: any) {
		min = Math.ceil(min); // 确保min是整数
		max = Math.floor(max); // 确保max是整数
		return Math.floor(Math.random() * (max - min + 1)) + min; // 返回介于min和max之间的整数
	},

	//获取玩法类型
	getLotteryList(index: any) {
		apis.lotteryList({
			success: (res: any) => {
				let datas = res.data
				let newIndex = datas.findIndex((item: any) => item.lotteryTypeVO.lotteryTypeCode == '5D')
				conf.gameTypeArr = datas[newIndex].lotteryVOList || []
				conf.gameType = conf.gameTypeArr[index].lotteryShowname || conf.gameTypeArr[0].lotteryShowname
				conf.gameTypeId = conf.gameTypeArr[index].id || conf.gameTypeArr[0].id
				conf.openLockCountdown = conf.gameTypeArr[index].openLockCountdown / 1000 //锁定倒计时
				conf.lotteryId = conf.gameTypeArr[index].id
				conf.play.list = datas[newIndex].lotteryVOList || []
				conf.play.active = conf.gameTypeArr[index].id || []
				let min = conf.gameTypeArr[index].lotteryInterval || conf.gameTypeArr[0].lotteryInterval
				if (conf.getOpenLotteryInfoTimer) {
					clearTimeout(conf.getOpenLotteryInfoTimer)
					conf.getOpenLotteryInfoTimer = null
				}
				conf.getLotteryOpen('changePlay')
				conf.getLotteryOdds(conf.gameTypeArr[index].lotteryTypeId)
				conf.handleSelctTabChange(conf.tabType, null)
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
		if (conf.getOpenLotteryInfoTimer) {
			clearTimeout(conf.getOpenLotteryInfoTimer)
			conf.getOpenLotteryInfoTimer = null
		}
		conf.getLotteryOpen('changePlay')
		conf.lotteryRuleurl = conf.gameTypeArr[index].lotteryRuleurl
	},

	//获取开奖信息
	getLotteryOpen(type: any) {
		conf.isNoOpenCode = true
		if (type == 'changePlay') {
			System.loading()
		}
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
					conf.isNoOpenCode = false
					gameBoxRefs && gameBoxRefs.value?.getWalletMoney(2)
					conf.handleDrawLotteryResult(conf.lastOpenInfo.openCode)
					conf.handleSelctTabChange(conf.tabType, null)
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
			conf.scollSum = conf.getRandomInt(0, 45)
		}, 100)
	},

	//随机选择数组索引
	getRandomIndex(array: any) {
		let randomIndex = Math.floor(Math.random() * array.length);
		return randomIndex;
	},

	//获取赔率
	getLotteryOdds(lotteryTypeId: any) {
		// System.loading()
		apis.lotteryOdds({
			lotteryTypeId,
			lotteryTypeCode: "5D",
			success: (res: any) => {
				conf.allOddsData = res.data || []
				conf.handleOdds()
			},
			final: () => {
				System.loading(false)
			}
		});
	},

	//处理赔率
	handleOdds() {
		let str = '', newArr = []
		switch (conf.selectBetType) {
			case 'A':
				str = 'single_A'
				break;
			case 'B':
				str = 'single_B'
				break;
			case 'C':
				str = 'single_C'
				break;
			case 'D':
				str = 'single_D'
				break;
			case 'E':
				str = 'single_E'
				break;
			case 'SUM':
				str = 'sum'
				break;
		}
		newArr = conf.allOddsData.filter((item: any) => item.oddsCode.includes(str))
		let regex = /^[0-9]*$/ // 匹配数字
		newArr.forEach((item: any) => {
			let num = item.oddsCode.split(str + '_')[1]
			item.number = regex.test(num) ? parseFloat(num) : num.toUpperCase()
			item.odds = parseFloat(item.odds)

			//大小、单双赔率
			let newIndex = conf.betTypeOdds.findIndex(into => into.name.toUpperCase() == item.number)
			if (newIndex != -1) {
				let newObj = {
					name: conf.betTypeOdds[newIndex].name,
					color: conf.betTypeOdds[newIndex].color,
					type: conf.betTypeOdds[newIndex].type,
					select: false,
					...item,
				}
				conf.betTypeOdds[newIndex] = newObj
			}

			// 数字赔率
			let index = conf.betNumberOdds.findIndex((into: any) => into.name == item.number)
			if (index != -1) {
				let obj = {
					name: conf.betNumberOdds[index].name,
					type: conf.betNumberOdds[index].type,
					...item
				}

				conf.betNumberOdds[index] = obj
			}
		})
	},

	//处理开奖结果
	handleDrawLotteryResult(val: any) {
		let arr = val.split(',')
		arr.forEach((item: any, itemIndex: number) => {
			item = parseInt(item)
			conf.resultInfoObj.numArr[itemIndex].value = item
		})
		conf.resultInfoObj.sum = eval(arr.join('+'))
	},

	//选择下注位数类型
	handleSelectBetType(item: any, index: number) {
		conf.betTypeArr = []
		conf.betNumArr = []
		conf.betTypeOdds.forEach(item => {
			item.select = false
		})
		conf.selectBetType = item
		conf.selectBetIndex = index
		conf.handleOdds()
	},

	//分页change
	handlePageChange(type: any) {
		conf.handleSelctTabChange(conf.tabType, type)
		conf.handleClickOrderPage(true)
	},

	//点击order => 分页
	handleClickOrderPage(val: any) {
		conf.isClickPage = val
	},

	//选择菜单类型（Rule、Result history、Chart、My order）
	//type判断分页
	handleSelctTabChange(num: any, type: any) {
		conf.tabType = num
		if (type == 'last') {
			conf.pageObj.page--
		} else if (type == 'next') {
			conf.pageObj.page++
		} else {
			conf.pageObj.page = 1
		}
		switch (num) {
			//Result history
			case 1:
				conf.getLotteryResult()
				break;
			//Chart
			case 2:
				conf.getLotteryResult()
				break;
			//My order
			case 3:
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
			current: conf.pageObj.page,
			size: conf.pageObj.size,
			lotteryId: conf.lotteryId,
			success: (res: any) => {
				let datas = res.data
				conf.resultList = datas.records || []
				conf.resultList?.forEach((item: any) => {
					item.openCodeArr = item.openCode ? item.openCode.split(',') : []
					item.sum = eval(item.openCodeArr.join('+'))
				})
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

	//获取My order数据
	async getOrderData() {
		System.loading()
		let defaultWalletInfo = await svalue.getDefaultWallet()
		apis.lotteryUserOrder({
			current: conf.pageObj.page,
			size: conf.pageObj.size,
			lotteryId: conf.lotteryId,
			success: async (res: any) => {
				let coinlistArr = await svalue.getCoinlist()	//货币数据
				let datas = res.data
				conf.orderDataList = datas.records || []
				conf.orderDataList?.forEach((item: any) => {
					item.openNumberArr = item.betOpenCode ? item.betOpenCode.split(',') : []
					item.sum = eval(item.openNumberArr.join('+')) || ''

					//下注number
					let arr = item.betCodes.split('_') || []
					item.betNumber = arr


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
				conf.pageObj.page = datas.current
				conf.pageObj.total = datas.total
				conf.pageObj.pageTotal = Math.ceil(datas.total / conf.pageObj.size)
			},
			final: () => {
				System.loading(false)
			}
		});
	},

	//选择下注
	handleSelectBet(item: any) {
		let currIndex = conf.betNumArr.indexOf(item.number)
		if (currIndex != -1) {
			conf.betNumArr.splice(currIndex, 1)
		} else {
			conf.betNumArr.push(item.number)
		}
		conf.betNumArr.sort((a, b) => {
			return a - b
		})
		conf.open()
		conf.selectBetInfoArr.push(item)
	},

	//清理选中数据
	closeFun: () => {
		conf.betNumArr = []
		conf.selectBetInfoArr = []
	},

	// 倒计时
	handleCountdown(nowDate: any) {
		let hours = Math.floor((nowDate / 1000 / 60 / 60) % 24)
		let minutes = Math.floor((nowDate / 1000 / 60) % 60)
		let seconds = Math.floor((nowDate / 1000) % 60)
		if (seconds < 0) return
		conf.hours = conf.ripr(hours)
		conf.minutes = conf.ripr(minutes).toString()
		conf.second = conf.ripr(seconds).toString()
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

	//数据小于10处理
	ripr(num: any) {
		num = parseFloat(num)
		return num < 10 ? `0${num}` : num
	},
	open: () => {
		CEvent.emit('openbet')
	},
	close: () => {
		CEvent.emit('closebet')
	}
})
onUnmounted(() => {
	//清空倒计时定时器
	clearTimeout(conf.countdownSetTime)
	conf.countdownSetTime = null

	clearTimeout(conf.getOpenLotteryInfoTimer)
	conf.getOpenLotteryInfoTimer = null

	clearInterval(conf.scollTimer)
	conf.scollTimer = null
})
onMounted(() => {
	for (let i = 0 as never; i < 10; i++) {
		conf.openCodeAllData.push(i)
	}
	conf.selectBetType = conf.selectBetList[0]
	for (let i = 0; i < 10; i++) {
		conf.betNumberOdds.push({
			name: i,
			type: 'num'
		})
	}
	conf.getLotteryList(0)
})
</script>

<style lang="less" scoped>
page {
	background: #f5f0f0;
	margin: 0 auto;
}

.select-bet-type {
	margin: 0 12rem 0 8rem;
	color: #0074ff;
	font-size: 20px;
}

.bet-type {
	padding: 10rem 19rem;
	color: #fff;
	border-radius: 6rem;
	margin-left: 0.13333rem;
	font-size: 25rem;
	margin: 0 4rem;
}

.bet-number {
	margin: 0 4rem;
	width: auto;
	height: auto;
	border-radius: 10rem;
	padding: 6rem 10rem;
	color: #ffffff;
	background: -webkit-linear-gradient(to left, #F6843F, #FEA14D);
	background: linear-gradient(90deg, #F6843F, #FEA14D);
}

.select-info-name {
	color: #0074ff;
	font-size: 40rem;
}

.txt-grey {
	font-size: 30rem;
	font-weight: 400;
	color: #8e8e93;
}

.red-bg {
	border: none;
	color: #fff;
	background: #F6843F;
}

.flex-center {
	display: flex;
	align-items: center;
	justify-content: center;
}

.flex-bw {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.game-result {
	background: #fff;
	border-radius: 20rem;
	position: relative;
	padding: 20rem;
	margin-bottom: .32rem;

	.result-top {
		text-align: center;
		padding: 0 0 60rem;
		border-bottom: 2rem solid #f1f3fb;
		display: flex;
		justify-content: space-between;
		align-items: center;

		.round-num {
			position: relative;
		}

		.fade-item {
			width: 70rem;
			height: 70rem;
			display: flex;
			justify-content: center;
			align-items: center;
			position: relative;

			.point-img {
				width: 72rem;
				height: 72rem;
			}

			span {
				position: absolute;
				top: 0;
				bottom: 8rem;
				width: 100%;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 36rem;
				color: #2c2e36;
				font-weight: 900;
			}
		}

		.fage-active {
			// background: #F6843F;
			border-radius: 50%;
			font-size: 36rem;
			color: #fff;
			font-weight: 900;
		}

		.word-index {
			position: absolute;
			bottom: -40rem;
			left: 26rem;
			margin-top: 10rem;
			font-size: 30rem;
			color: #9da7b3;
			font-weight: 400;
		}
	}

	.result-number {
		padding-top: 20rem;

		.num-time {
			margin-top: 20rem;
		}

		.number {
			font-size: 32rem;
			display: grid;
			grid-auto-flow: column;
			gap: 8px;
		}

		.down-time {
			display: flex;
			align-items: center;

			.time-item {
				width: 52rem;
				height: 72rem;
				font-weight: 600;
				font-size: 58rem;
				margin-left: 10rem;
				border-radius: 10rem;
			}

			.division {
				margin-left: 10rem;
				color: #F6843F;
				font-size: 52rem;
			}
		}
	}
}

.inner {
	margin: 20rem 0rem;
}

.slot-inner {
	width: 300px;
	padding: 15rem;
	background: #F6843F;
	display: flex;
	border-radius: 0.18667rem;
	position: relative;
	margin: 0.26667rem auto 0;

	.dataNums {
		width: 100%;

		.inrow {
			width: 100%;
			padding: 5px;
			background: #FEA14D;
			border-radius: 2px;
			display: flex;

			.dataOne {
				// width: 100%; 
				flex: 1;
				height: 65px;
				margin-right: 6px;
				text-align: center;
				background: #333;
				color: rgba(0, 0, 0, .4);
				border-radius: 0.10667rem;
				padding: 3px;

				.dataBoc {
					background: #e1e1ec;
					border-radius: 50%;
					color: rgba(0, 0, 0, .4);
					width: 100%;
					aspect-ratio: 1;
					font-size: 28px;

					&.dataBoc-active {
						background: #F6843F;
						color: #ffffff;
					}
				}

				&:last-of-type {
					margin-right: 0px;
				}
			}
		}
	}
}

.slot-inner:after,
.slot-inner:before {
	position: absolute;
	top: calc(50% - 26rem);
	width: 12rem;
	height: 55rem;
	content: "";
	background: #FEA14D;
}

.slot-inner:before {
	left: -12rem;
	border-radius: 10rem 0 0 10rem;
}

.slot-inner:after {
	right: -12rem;
	border-radius: 0 10rem 10rem 0;
}

.dataNums:after,
.dataNums:before {
	position: absolute;
	top: calc(50% - 7px);
	width: 0;
	height: 0;
	border-top: 6px solid transparent;
	border-bottom: 6px solid transparent;
	content: "";
	z-index: 3;
}

.dataNums:before {
	left: 12px;
	border-right: 19px solid transparent;
	border-left: 19px solid #FEA14D;
}

.dataNums:after {
	right: 12px;
	border-left: 19px solid transparent;
	border-right: 19px solid #FEA14D;
}

.bet-select-box {
	position: relative;
}

.bet-type-list {
	display: flex;
	justify-content: flex-start;
	border-bottom: 2rem solid #c7c7cc;
	margin-bottom: 1rem;
	overflow: hidden;
	margin-top: 16rem;

	.d5-bet-type {
		width: 74rem;
		height: 74rem;
		background: #ceced8;
		font-size: 30rem;
		font-weight: 700;
		color: #fff;
		border-radius: 37rem 37rem 0 0;
		position: relative;
		margin-right: 10rem;
		text-align: center;
		cursor: pointer;

		&::after {
			background: radial-gradient(circle at 100% 0, rgba(204, 0, 0, 0) 0.26667rem, #ceced8 0.29333rem);
			right: -9rem;
		}

		&.type-active {
			background: linear-gradient(90deg, #F6843F, #FEA14D);

			&::after {
				background: radial-gradient(circle at 100% 0, rgba(204, 0, 0, 0) 0.26667rem, #FEA14D 0.29333rem);
				right: -9rem;
			}
		}
	}

	.d5-bet-type:after,
	.d5-bet-type:before {
		content: "";
		width: 10rem;
		height: 10rem;
		position: absolute;
		bottom: -12rem;
		z-index: 9;
	}
}

.d5-bet-content {
	margin: 20rem 0rem;
	height: 360rem;
}

.bet-type-btn {
	width: 23%;
	height: 64rem;
	background: #d1d1d6;
	border-radius: 10rem;
	color: #fff;
	padding: 0 14rem;
	cursor: pointer;
}

.num_Big {
	background: linear-gradient(90deg, #FD0261 0%, #FF8A96 100%);
	box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.15);
}

.num_Small {
	background: linear-gradient(90deg, #00BDFF 0%, #5BCDFF 100%);
	box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.15);
}

.num_Odd {
	background: linear-gradient(90deg, #00BE50 0%, #9BDF00 100%);
	box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.15);
}

.num_Even {
	background: linear-gradient(90deg, #FF9000 0%, #FFD000 100%);
	box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.15);
}

.d5-bet-num {
	display: flex;
	flex-wrap: wrap;
	margin: 20rem 0rem;

	.bet-num-item {
		width: 20%;
		display: flex;
		justify-content: center;
		align-items: center;
		flex-direction: column;
		padding: 20rem 0rem;
		// margin-bottom: 20rem;

		.num-box {
			position: relative;

			img {
				width: 72rem;
				height: 72rem;
			}

			span {
				position: absolute;
				top: 0;
				bottom: 8rem;
				width: 100%;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 36rem;
				color: #2c2e36;
				font-weight: 900;
			}

			&.active {
				color: #ffffff;
				background: -webkit-linear-gradient(left, #F6843F, #FEA14D);
				background: linear-gradient(90deg, #F6843F, #FEA14D);
			}
		}

		.onum-dds {
			color: #6b7581;
			margin-top: 5rem;
			font-size: 28rem;
		}
	}
}

.big-time {
	position: absolute;
	left: 0;
	// top: 0;
	top: 74rem;
	;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, .6);
	z-index: 9;

	.big-down-time {
		display: flex;
		justify-content: center;
		margin-top: 65rem;

		.big-time-item {
			width: 160rem;
			height: 250rem;
			font-weight: 600;
			font-size: 200rem;
			border-radius: 10rem;

			&:first-of-type {
				margin-right: 20rem;
			}
		}
	}
}

.d5-list {
	padding: 20rem 0rem;

	.d5-list-type {
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

.page-box {
	display: flex;
	justify-content: center;
	align-items: center;
	margin-top: 15rem;
	padding-bottom: 40rem;

	.page-arrow {
		width: 74rem;
		height: 74rem;
		background: #dedede;
		border-radius: 10rem;
		cursor: pointer;

		img {
			width: 22rem;
			height: 38rem;
		}

		.next-img {
			transform: rotate(180deg);
		}

		&.page-active {
			background: linear-gradient(90deg, #F6843F, #FEA14D);
		}
	}

	.page-num {
		color: #404653;
		width: 182rem;
		text-align: center;
	}
}

.colum,
.flex,
.row {
	display: flex;
	flex-wrap: wrap;
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

.active_number {
	border: 2rem solid #F88c43;
	background: #FEC74810;
	color: #FEC748 !important;
	border-radius: 16rem;
	padding: 18rem 0rem !important;
}

.flex-center-num {
	position: relative;

	img {
		width: 52rem;
		height: 52rem;
	}

	span {
		position: absolute;
		top: 0;
		bottom: 8rem;
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 30rem;
		color: #2c2e36;
		font-weight: 900;
	}
}
</style>