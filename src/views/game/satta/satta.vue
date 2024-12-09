<template>
	<x-page :noFooter="true" :headerBgColor="'linear-gradient(180deg, #EB602D 0%, #FFA64F 160%)'">
		<template #title>
			<div class="head-title" @click="conf.handleOpenGameTypeDialog">
				<span>{{ conf.gameType }}</span>
				<img class="arrow-img" src="/static/img/type-arrow.png"
					:style="{ 'transform': conf.typeShow ? 'rotate(-180deg)' : 'rotate(0deg)' }" />
			</div>
		</template>
		<template #right>
			<div class="right-content">
				<div class="right-text">{{ $t('wallet.balance') }}</div>
				<div class="right-icon">{{ conf.walletMoney }}</div>
			</div>
			<img class="wallet-img" src="/static/img/wallet.webp" />
		</template>
		<div class="page-box">
			<div class="top-content">
				<div class="left-result">
					<div class="open-number" @click="conf.handleOpenResultDialog">
						{{ conf.lastOpenInfo.openExpect || '--' }}
						{{ $t('game.result') }}
						<img class="game-down" src="/static/img/game-down.png"
							:style="{ 'transform': conf.resultShow ? 'rotate(-180deg)' : 'rotate(0deg)' }" />
					</div>
					<div class="open-point">
						<div class="openCodeBox">
							<img class="sum-img" src="/static/img/color-red.webp" />
							<div class="sum-num" v-if="!conf.StopScrolling">{{ conf.pointNum }}</div>
							<div class="sum-num" v-else>{{ conf.ripr(conf.lastOpenInfo.openCode) }}</div>
						</div>
					</div>
				</div>
				<div class="right-box">
					<div class="current-open">{{ conf.currentOpenInfo.openExpect || '--' }}</div>
					<div class="time-box">
						<div class="time-item">{{ conf.hour }}</div>
						<div class="txt">:</div>
						<div class="time-item">{{ conf.minutes }}</div>
						<div class="txt">:</div>
						<div class="time-item">{{ conf.second }}</div>
					</div>
				</div>
				<div class="order-left" @click="conf.handleMyOrderdiv">
					<img class="order-arrow" src="/static/img/order-arrow-left.png" />
				</div>
			</div>
			<div class="main">
				<div class="tips">
					<template v-if="conf.topdivBtn">
						<span>{{ conf.gameRule.substring(0, 100) }}...</span>
						<span @click="conf.handleRulediv" class="topBtn">{{ $t('SattaKing.Details') }}</span>
					</template>
					<template v-else>
						<div>{{ conf.gameRule }}</div>
						<span v-if="conf.openLockCountdown / 1000 > 1">{{ $t('SattaKing.BetClose') + ' ' +
							conf.openLockCountdown / 1000 + ' ' + $t('SattaKing.seconds') }}</span>
						<span v-else>{{ $t('SattaKing.BetClose') + ' ' + conf.openLockCountdown / 1000 + ' ' +
							$t('SattaKing.second') }}</span>
						<span @click="conf.handleRulediv" class="topBtn">{{ $t('SattaKing.PackUp') }}</span>
					</template>
				</div>
				<div class="bet-content">
					<div class="btn-list">
						<template v-for="(item, itemIndex) in conf.playTypeArr">
							<div class="btn-item" :class="{ 'btn-active': conf.typeIndex == item.value }"
								@click="conf.changeType(item)">
								<div>{{ item.name }}</div>
								<div class="odes">1 : {{ parseFloat(item.odds) }}</div>
							</div>
						</template>
					</div>
					<div class="select-box" ref="selectRefs">
						<div>
							<div class="select-list"
								:class="{ 'number-box': conf.typeIndex == 1, 'number-active': conf.selectShow }">
								<template v-for="(item, itemIndex) in conf.seleceNumArr">
									<div class="select-item" :class="{ 'disabled': conf.betClose }">
										<div :class="{ 'select-active': conf.betArr.includes(item) }"
											@click="conf.changeOdds(item)">
											<span>{{ item.number }}</span>
										</div>
									</div>
								</template>
							</div>
							<div class="show" v-if="conf.typeIndex == 1">
								<img :class="conf.selectShow ? 'show-icon active' : 'show-icon'"
									src="/static/img/games-left.png" mode="" @click="conf.changeShow" />
							</div>
						</div>
					</div>
				</div>
				<div class="footer">
					<div class="bet-input">
						<input class="input" :placeholder="$t('swapModule.enterAmountTip')"
							v-model.trim="conf.BettingAmount" @input="conf.handleEnterBetAmount($event)"
							inputmode="decimal" :class="conf.betStr.length <= 0 ? 'bet-input-zero' : ''" />
						<div class="money-btn">
							<div class="money-plus" @click="conf.handleBetNumber('reduce')"
								:class="{ 'disabled': true }">-
							</div>
							<input v-model="conf.BettingNumber" inputmode="decimal" class="money-num"
								@input="conf.handleInputEnter($event)" />
							<div class="money-plus" @click="conf.handleBetNumber('add')">+</div>
						</div>
					</div>
					<div class="bet-select">
						<div class="left-num" style="font-size: 32rem;" v-if="!conf.betStr">{{ $t('SattaKing.notes0') }}
						</div>
						<div class="left-num" v-else>
							<div class="num">
								<div class="num-total">
									<template v-if="conf.betNum == 1">{{ $t('SattaKing.injection') }}</template>
									<template v-else>{{ 'Total:' + conf.betNum }}</template>
									<span v-if="conf.BettingAmount" class="rit">
										{{ ' Amount:' + conf.coinSymbol + conf.betTotalAmount }}</span>
								</div>
								<div class="num-x">

									<div v-if="conf.betStr.length > 0" style="width: 100%;overflow-x: scroll;">
										<div class="select-num">
											<div class="select_item" v-for="item in conf.betStr" :key="item">{{ item }}
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
						<div class="flex items-center">
							<img v-if="svalue.configv1['im_open']" class="share-img" :class="{ 'disabled': !canShare }"
								style="margin-right: 24rem; width: 47rem; height: 35rem;" src="/static/img/share.png"
								@click="conf.handleClickShare" />
						</div>
						<div class="right-btn" :class="{ 'disabled': conf.betClose }" @click="conf.handleBetDataSubmit">
							{{ $t('SattaKing.betMax') }}
						</div>
					</div>
				</div>
			</div>
		</div>
		<!-- 游戏类型选择 -->
		<div class="type-box" v-if="conf.typeShow" @click="conf.typeShow = false">
			<div class="type-contnet" @click.stop="">
				<div class="time-list">
					<template v-for="(item, index) in conf.gameTypeArr">
						<div class="time-item" :class="conf.gameTypeId == item.id ? 'time-active' : ''"
							@click="conf.handleGameChange(item)">{{ item.lotteryShowname }}</div>
					</template>
				</div>
			</div>
		</div>
		<!-- 结果弹窗 -->
		<div class="result-box" v-if="conf.resultShow" @click="conf.resultShow = false">
			<div class="result-content" @click.stop="">
				<div class="result-title">
					<div>{{ $t('game.drawID') }}</div>
					<div>{{ $t('game.result') }}</div>
					<div>{{ $t('SattaKing.LotteryTime') }}</div>
				</div>
				<div class="result-list">
					<template v-for="(item, index) in conf.resultList" :key="index">
						<div class="result-line">
							<div>{{ item.openExpect }}</div>
							<div>
								<div class="openCodeBox" v-if="item.openCode">
									<img class="sum-img" src="/static/img/color-red.webp" />
									<div class="sum-num">{{ item.openCode }}</div>
								</div>
								<div class="openCodeBox" v-else>
									<div class="sum-num" style="color: #000000E6;">{{ '-' }}</div>
								</div>
							</div>

							<div>{{ item.newOpenTime }}</div>
						</div>
					</template>
					<div v-if="conf.resultList.length > 0">
						<div class="more" v-if="!conf.isResultShowMore">
							<div class="more-btn" @click="conf.handleResultMoreMessage">
								<span>{{ $t('game.showMore') }}</span>
								<img src="/static/img/show-more.png" style="width: 20rem;height: 12rem;" />
							</div>
						</div>
						<div class="more-not" v-else>{{ $t('user.noMore') }}</div>
					</div>
					<x-no-data v-if="conf.resultList.length == 0"></x-no-data>
				</div>

			</div>
		</div>
		<div class="order-container" :class="{ active: conf.showOrder }">
			<order @close="conf.closeOrder" v-if="conf.showOrder" :lotteryId="conf.lotteryId" ref="orderRefs"></order>
		</div>

		<div v-if="conf.isShowBetInfo">
			<div class="popup-mask"></div>
			<div class="tips-popup" @click="conf.handleCloseBetInfoDialog">
				<div class="bet-win">
					<div class="win-title">{{ $t('game.winBet') }}</div>
					<div class="win-content">
						<div class="win-item">{{ $t('game.expect') }}：{{ conf.currentOpenInfo.openExpect }}</div>
						<div class="win-item">{{ $t('SattaKing.GameType') }}：{{ conf.GameType }}</div>
						<div class="win-item">{{ $t('SattaKing.BettingContent') }}：{{ conf.betStrNum }}</div>
						<div class="win-item">{{ $t('game.amount') }}：{{ conf.betTotalAmount }}</div>
						<div class="win-item">{{ $t('game.start') }}：{{
							sutil.getTimeFormat(conf.currentOpenInfo.startTime, 1)
						}}</div>
						<div class="win-item">{{ $t('game.open') }}：{{
							sutil.getTimeFormat(conf.currentOpenInfo.openTime, 1) }}
						</div>
					</div>
				</div>
			</div>
		</div>
	</x-page>
</template>

<script setup lang="ts">
import { apis } from '@/api';
import i18n from '@/lang';
import sconfig from '@/sstore/sconfig';
import sutil from '@/sstore/sutil';
import { svalue } from '@/sstore/svalue';
import System from '@/utils/System';
import order from './order.vue'
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';

const orderRefs = ref<any>()
const selectRefs = ref<any>()
const conf = reactive({
	walletMoney: '-',
	seleceNumArr: [] as any[],
	typeIndex: 1,
	betArr: [] as any[],
	betStr: '' as any,
	betStrNum: '',
	typeShow: false,
	resultShow: false,
	showOrder: false,
	BettingAmount: '',
	BettingNumber: 1,
	betTotalAmount: 0,
	gameType: '',
	gameTypeId: '',
	gameTypeArr: [] as any,
	betClose: false,
	openLockCountdown: 10000, //锁定倒计时
	hasResultTimer: null as any,
	pointNum: 0, //未开奖数据滚动
	hour: '00',
	minutes: '00',
	second: '00',
	currentOpenInfo: {} as any, //当前期数开奖信息
	lastOpenInfo: {} as any, //上一期开奖期数
	nextOpenInfo: {} as any, //下一期开奖信息
	oddsArr: [] as any, //赔率数据
	countdownNum: null as any,
	playTypeArr: [{
		name: 'Jodi',
		value: 1,
		odds: '',
		numArr: [],
		rule: i18n.t('SattaKing.JodirRule')
	},
	{
		name: 'Andar',
		value: 2,
		odds: '',
		numArr: [],
		rule: i18n.t('SattaKing.AndarRule')
	},
	{
		name: 'Bndar',
		value: 3,
		odds: '',
		numArr: [],
		rule: i18n.t('SattaKing.BndarRule')
	},
	] as any,
	StopScrolling: false,
	betNum: 0, //选择下注号码数量
	isShowBetInfo: false,
	//result分页
	resultPageSize: 10,
	resultPageNum: 1,
	resultTotal: 0,
	resultList: [] as any,
	isResultShowMore: false,
	lotteryId: '',
	gameRule: '',
	serviceHeight: 300,
	rightSelectNumberHeight: 600,
	coinSymbol: '',
	topdivBtn: true,
	GameType: '',
	openCodeTimer: null as any,
	countdownTime: null as any,
	selectShow: false,
	defaultWalletInfo: {} as any,
	// input输入事件
	handleInputEnter(e: any) {
		let val = e.detail.value
		if (val[0] == '0') {
			val = ''
		}
		val = val.replace(/[^\d.]/g, "")
			.replace(/^(\-)*(\d+)\.(\d{0}).*$/, '$1$2')
			.replace(/^\.*$/g, "");
		conf.BettingNumber = val
	},

	//获取选择号码高度
	getSelectNumberHeight(type: any) {
		// conf.$nextTick(() => {
		// 	let selector = uni.createSelectorQuery().select('.tips');
		// 	selector.fields({
		// 		size: true
		// 	}, data => {
		// 		if (!type) {
		// 			conf.rightSelectNumberHeight = conf.serviceHeight - data.height
		// 		} else {
		// 			conf.rightSelectNumberHeight = conf.serviceHeight - data.height - uni.upx2px(
		// 				60)
		// 		}
		// 	}).exec();
		// })
	},
	changeShow() {
		if (conf.selectShow) {
			selectRefs.value.scrollTo({
				top: 0
			})
		}
		conf.selectShow = !conf.selectShow

	},
	//rule详细/收起btn
	handleRulediv() {
		conf.topdivBtn = !conf.topdivBtn
		conf.getSelectNumberHeight(null)
	},

	//获取result数据
	getLotteryResult() {
		System.loading()
		conf.isResultShowMore = false
		apis.lotteryOpenResult({
			current: conf.resultPageNum,
			size: conf.resultPageSize,
			lotteryId: conf.lotteryId,
			success: (res: any) => {
				conf.resultList = [...conf.resultList, ...res.data.records]
				conf.resultList?.forEach((item: any) => {
					item.newOpenTime = sutil.getTimeFormat(item.openTime, 1)
					item.openCode && (item.openCode = conf.ripr(item.openCode))
				})
				conf.resultTotal = res.data.total
				if (conf.resultPageSize * conf.resultPageNum >= conf.resultTotal) return conf.isResultShowMore = true
			},
			final: () => {
				System.loading(false)
			}
		});
	},

	//查看my order
	handleMyOrderdiv() {
		System.router.push('/user/myBet/index?lottery=Satta')
		// conf.typeShow = false
		// conf.resultShow = false
		// conf.showOrder = true
	},

	//打开游戏类型弹窗
	handleOpenGameTypeDialog() {
		conf.typeShow = !conf.typeShow
		conf.resultShow = false
		conf.showOrder = false
	},

	//打开result弹窗
	handleOpenResultDialog() {
		conf.typeShow = false
		conf.resultShow = !conf.resultShow
		conf.showOrder = false
	},

	// 获取玩法类型
	getLotteryList(index: any) {
		apis.lotteryList({
			success: (res: any) => {
				let datas = res.data
				let newIndex = datas.findIndex((item: any) => item.lotteryTypeVO.lotteryTypeCode ==
					'SATTA_KING')
				conf.gameTypeArr = datas[newIndex].lotteryVOList || []
				conf.gameType = conf.gameTypeArr[index].lotteryShowname || conf.gameTypeArr[0].lotteryShowname
				conf.gameTypeId = conf.gameTypeArr[index].id || conf.gameTypeArr[0].id
				conf.openLockCountdown = conf.gameTypeArr[index].openLockCountdown //锁定倒计时
				conf.lotteryId = conf.gameTypeArr[index].id
				if (conf.openCodeTimer) {
					clearTimeout(conf.openCodeTimer);
					conf.openCodeTimer = null;
				}
				conf.getLotteryOpen('load')
				conf.getLotteryOdds(conf.gameTypeArr[index].lotteryTypeId)
			}
		});
	},

	//获取开奖信息
	getLotteryOpen(type: any) {
		conf.StopScrolling = false
		conf.pointNum = 0
		conf.hasResultTimer = setInterval(() => {
			conf.pointNum++
			if (conf.pointNum > 99) conf.pointNum = 0
			conf.pointNum = conf.ripr(conf.pointNum)
		}, 80)
		apis.lotteryOpen({
			lotteryId: conf.lotteryId,
			success: (res: any) => {
				let datas = res.data
				conf.currentOpenInfo = datas.currentOpen
				conf.lastOpenInfo = datas.lastOpen
				conf.nextOpenInfo = datas.nextOpen
				let countdownCurr = parseInt(conf.currentOpenInfo.openTime) - parseInt(datas
					.currentSystemTime)
				conf.countdownNum = countdownCurr
				// conf.countdownNum = 10000
				type && conf.handleCountdown(conf.countdownNum)

				if (!conf.lastOpenInfo.openCode) {
					if (conf.openCodeTimer) {
						clearTimeout(conf.openCodeTimer);
						conf.openCodeTimer = null;
					}
					conf.openCodeTimer = setTimeout(() => {
						conf.getLotteryOpen(null)
					}, 1000)
				} else {
					conf.lastOpenInfo.openCode = conf.ripr(conf.lastOpenInfo.openCode)
					conf.StopScrolling = true
					if (conf.hasResultTimer) {
						clearInterval(conf.hasResultTimer);
						conf.hasResultTimer = null;
					}
					conf.getWalletMoney(2)
					conf.resultPageNum = 1
					conf.resultList = []
					conf.getLotteryResult()
					orderRefs.value?.initOrder()
				}
			}
		});
	},

	//根据当前系统时间与开奖时间 => 下注倒计时
	handleCountdown(nowDate: any) {
		conf.betClose = false
		const hours = Math.floor((nowDate / 1000 / 60 / 60) % 24)
		const minutes = Math.floor((nowDate / 1000 / 60) % 60)
		const seconds = Math.floor((nowDate / 1000) % 60)
		if (seconds < 0) return
		conf.hour = conf.ripr(hours)
		conf.minutes = conf.ripr(minutes)
		conf.second = conf.ripr(seconds)
		conf.countdownNum = nowDate
		if (nowDate > 0) {
			conf.countdownTime = setTimeout(() => {
				nowDate -= 1000
				if (nowDate < 0) {
					clearInterval(conf.countdownTime);
					conf.countdownTime = null;
					if (conf.openCodeTimer) {
						clearTimeout(conf.openCodeTimer);
						conf.openCodeTimer = null;
					}
					conf.getLotteryOpen('load')
				} else {
					conf.handleCountdown(nowDate)
				}
			}, 1000)
		}


		//停止下注判断
		if (conf.countdownNum <= conf.openLockCountdown) {
			conf.betClose = true
		}
	},

	//数据小于10处理
	ripr(num: any) {
		num = parseFloat(num)
		return num < 10 ? `0${num}` : num
	},

	// 获取赔率
	getLotteryOdds(lotteryTypeId: string) {
		apis.lotteryOdds({
			lotteryTypeId,
			lotteryTypeCode: "SATTA_KING",
			success: (res: any) => {
				conf.oddsArr = res.data || []
				conf.getPlayTypeOdds()
			}
		});
	},

	//获取当前玩法类型的赔率
	getPlayTypeOdds() {
		conf.playTypeArr[0].odds = conf.oddsArr.find((item: any) => item.oddsCode.includes('num'))?.odds
		conf.playTypeArr[1].odds = conf.oddsArr.find((item: any) => item.oddsCode.includes('first'))?.odds
		conf.playTypeArr[2].odds = conf.oddsArr.find((item: any) => item.oddsCode.includes('second'))?.odds
		conf.oddsArr?.forEach((item: any) => {
			item.number = item.oddsCode.split('_')[1]
			if (item.oddsCode.includes('num')) {
				conf.playTypeArr[0].numArr.push(item)
			}
			if (item.oddsCode.includes('first')) {
				conf.playTypeArr[1].numArr.push(item)
			}
			if (item.oddsCode.includes('second')) {
				conf.playTypeArr[2].numArr.push(item)
			}
		})
		conf.seleceNumArr = conf.playTypeArr[0].numArr
		conf.gameRule = conf.playTypeArr[0].rule
		conf.GameType = conf.playTypeArr[0].name
	},

	//输入下注金额
	handleEnterBetAmount(e: any) {
		let val = e.detail.value
		if (val.length > 1 && val[0] === '0' && val[1] !== '.') {
			e.detail.value = val[0]
			val = val[0]
		}
		val = val.replace(/[^\d.]/g, "")
			.replace(/^(\-)*(\d+)\.(\d{4}).*$/, '$1$2.$3')
			.replace(/^\.*$/g, "");
		// 移除非数字和点以及除第一个点外的所有点
		val = val.replace(/[^\d.]/g, '')
			.replace(/\.{2,}/g, '.')
			.replace('.', '$#$').replace(/\./g, '').replace('$#$', '.');
		const decimalIndex = val.indexOf('.');
		if (decimalIndex !== -1) {
			val = val.substr(0, decimalIndex) + '.' + val.substr(decimalIndex).replace('.', '');
		}
		conf.BettingAmount = val
		conf.BettingAmount && (conf.handleBetMoney())
	},

	//计算下注总金额
	handleBetMoney() {
		let val = parseFloat(conf.BettingAmount)
		conf.betTotalAmount = sutil.Mul(sutil.Mul(conf.betNum, val), conf.BettingNumber)
	},

	//增加、减少下注注数
	handleBetNumber(type: any) {
		conf.BettingNumber = conf.BettingNumber
		switch (type) {
			case 'reduce':
				conf.BettingNumber > 1 && (conf.BettingNumber -= 1)
				break;
			case 'add':
				conf.BettingNumber += 1
				break;
		}
		conf.handleBetMoney()
	},

	//玩法类型change
	handleGameChange(obj: any) {
		conf.openLockCountdown = obj.openLockCountdown //锁定倒计时
		conf.gameType = obj.lotteryShowname
		conf.gameTypeId = obj.id
		conf.lotteryId = obj.id
		conf.typeShow = false
		conf.betArr = []
		conf.betStr = ''
		conf.betStrNum = ''
		conf.BettingAmount = ''
		conf.BettingNumber = 1
		conf.betNum = 0
		if (conf.hasResultTimer) {
			clearInterval(conf.hasResultTimer);
			conf.hasResultTimer = null;
		}
		if (conf.openCodeTimer) {
			clearTimeout(conf.openCodeTimer);
			conf.openCodeTimer = null;
		}
		if (conf.countdownTime) {
			clearTimeout(conf.countdownTime);
			conf.countdownTime = null;
		}
		conf.getLotteryOpen('load')
	},

	//关闭my order
	closeOrder() {
		conf.showOrder = false
	},

	//选号玩法change
	changeType(obj: any) {
		conf.seleceNumArr = obj.numArr
		conf.gameRule = obj.rule
		conf.typeIndex = obj.value
		conf.GameType = obj.name
		conf.betArr = []
		conf.betStr = ''
		conf.betStrNum = ''
		if (conf.typeIndex != 1) {
			conf.seleceNumArr?.forEach((item: any) => {
				item.number = parseFloat(item.number)
			})
		}
	},

	//选号click
	changeOdds(obj: any) {
		if (!sconfig.userInfo) return System.router.push('/login')
		if (conf.betClose) return;
		let currIndex = conf.betArr.findIndex((item: any) => item.oddsId == obj.oddsId)
		if (currIndex != -1) {
			conf.betArr.splice(currIndex, 1)
		} else {
			conf.betArr.push(obj)
		}
		conf.betArr.sort((a, b) => {
			return parseFloat(a.number) - parseFloat(b.number)
		})
		conf.getBetStr()
		conf.handleBetMoney()
	},

	//获取下注号码数组转字符串
	getBetStr() {
		conf.betNum = conf.betArr.length
		conf.betStr = conf.betArr.map(obj => {
			return obj.number
		})
		conf.betStrNum = conf.betStr.join(',')
	},

	// 获取钱包金额
	async getWalletMoney(type: any) {
		if (!sconfig.userInfo) return conf.walletMoney = '-'
		let item = await svalue.getDefaultWallet()
		if (item.hasOwnProperty('coinSymbol')) {
			conf.defaultWalletInfo = item
			let m = parseFloat(conf.defaultWalletInfo.walletMoney)
			conf.walletMoney = (conf.defaultWalletInfo.coinSymbol || '₹') + sutil.dataHandling(m)
		}
	},

	//下注数据提交
	handleBetDataSubmit() {
		if (conf.betClose) {
			System.toast(i18n.t('SattaKing.stoppedBetTip'))
		} else {
			if (!conf.defaultWalletInfo.hasOwnProperty('coinCode')) {
				System.toast(i18n.t('game.setWalletTip'))
				return
			}
			if (conf.betArr.length == 0) {
				System.toast(i18n.t('SattaKing.betEmptyTip'))
				return
			}
			if (!conf.BettingAmount) {
				System.toast(i18n.t('SattaKing.betAmountEmptyTip')) //投注金额不能为空!
				return
			}
			if (!String(conf.BettingNumber) || conf.BettingNumber < 1) {
				System.toast(i18n.t('game.betTip'))
				return
			}
			if (parseFloat(conf.BettingAmount) > parseFloat(conf.defaultWalletInfo.walletMoney)) {
				System.toast(i18n.t('SattaKing.insufficient'))
				return
			}
			let minBetMoney = conf.defaultWalletInfo.betMinAmount
			let maxBetMoney = conf.defaultWalletInfo.betMaxAmount
			let coinSymbol = conf.defaultWalletInfo.coinSymbol

			if (parseFloat(conf.BettingAmount) < parseFloat(minBetMoney)) {
				System.toast(i18n.t('game.minBetTip') + ' ' + coinSymbol + minBetMoney || '')
				return
			}

			if (parseFloat(conf.BettingAmount) > parseFloat(maxBetMoney)) {
				System.toast(i18n.t('game.maxBetTip') + ' ' + coinSymbol + maxBetMoney || '')
				return
			}
			System.loading()
			apis.lotteryUserBets({
				money: conf.BettingAmount,
				betCodes: conf.betArr.map(obj => {
					return obj.oddsCode
				}).join(",") || '',
				betExpect: conf.currentOpenInfo.openExpect,
				betOpenId: conf.currentOpenInfo.lotteryOpenId,
				lotteryId: conf.currentOpenInfo.lotteryId,
				// lotteryOddsId: conf.betArr.map(obj=>{return obj.oddsId}).join(",") || '',
				multiple: 1,
				nums: conf.BettingNumber,
				supplement: 0,
				walletCoinCode: conf.defaultWalletInfo.walletCoin,
				success: (res: any) => {
					conf.isShowBetInfo = true
					conf.getWalletMoney(2)
					setTimeout(() => {
						conf.isShowBetInfo = false
						conf.betArr = []
						conf.betStr = ''
						conf.betStrNum = ''
						conf.BettingAmount = ''
						conf.BettingNumber = 1
						conf.betNum = 0
						conf.handleBetMoney()
					}, 2000)
				},
				final: () => {
					System.loading(false)
				}
			});
		}
	},

	//关闭下注信息弹窗
	handleCloseBetInfoDialog() {
		conf.isShowBetInfo = false
	},

	//result查看更多
	handleResultMoreMessage() {
		if (conf.resultPageSize * conf.resultPageNum >= conf.resultTotal) return conf.isResultShowMore = true
		conf.resultPageNum++;
		conf.getLotteryResult();
	},

	async handleClickShare() {
		let obj = {
			coinSymbol: conf.defaultWalletInfo.coinSymbol,
			betMoney: parseFloat(conf.BettingAmount).toFixed(4),
			money: parseFloat(conf.BettingAmount).toFixed(4),
			orderType: '',
			id: StrUtil.getId(),
			lotteryName: 'Satta',
			lotteryTypeCode: 'Satta',
			betCodes: conf.betArr.map(obj => {
				return obj.oddsCode
			}).join(",") || '',
			betLotteryId: conf.currentOpenInfo.lotteryId,
			betOpenId: conf.currentOpenInfo.lotteryOpenId,
			betExpect: conf.currentOpenInfo.openExpect,
			playName: conf.gameType,
			newPlayName: conf.gameType,
			newBetCodesArr: [] as any[],
			newBetCodes: '',
			betContent: '',
			betTitle: ''
		}
		obj.newBetCodesArr = obj.betCodes.split(',')
		obj.newBetCodes = obj.newBetCodesArr.map(obj => {
			return obj.split('_')[1]
		}).join(",") || ''
		obj.betContent = obj.newBetCodes
		obj.betTitle = obj.betExpect
		console.log('obj', obj)
		Cookie.set('betRecord', JSON.stringify(obj))
		
		await sconfig.toChat('/chatRoom/conversation/betRecordForward/index')
	}
})
const canShare = computed(() => {
	return !conf.betClose && conf.betArr.length && conf.BettingNumber && conf.BettingAmount
})
onMounted(() => {
	// 获取钱包
	conf.getWalletMoney(1)
	conf.getLotteryList(0)
})
onUnmounted(() => {
	if (conf.hasResultTimer) {
		clearInterval(conf.hasResultTimer);
		conf.hasResultTimer = null;
	}
	if (conf.openCodeTimer) {
		clearTimeout(conf.openCodeTimer);
		conf.openCodeTimer = null;
	}
	if (conf.countdownTime) {
		clearTimeout(conf.countdownTime);
		conf.countdownTime = null;
	}
})
// onShow() {

// 	conf.$nextTick(() => {
// 		conf.serviceHeight = uni.getSystemInfoSync().windowHeight - uni.upx2px(104) - uni.upx2px(112) - uni
// 			.upx2px(80) - uni.upx2px(100)
// 		// #ifdef APP-PLUS
// 		conf.serviceHeight = uni.getSystemInfoSync().windowHeight - uni.upx2px(104) - uni.upx2px(112) - uni
// 			.upx2px(80) - uni.upx2px(100) - 44
// 		// #endvar
// 		conf.getSelectNumberHeight(1)
// 	})
// }
</script>

<style lang="less" scoped>
.head-title {
	font-size: 32rem;
	font-weight: Bold;

	.arrow-img {
		width: 28rem;
		height: 14rem;
		margin-left: 10rem;
		transition: transform 0.3s ease-in-out;
	}
}

.right-content {
	text-align: right;
	letter-spacing: -0.3px;
	font-size: 22rem;
}

.wallet-img {
	width: 72rem;
	height: 72rem;
	margin-right: 20rem;
}

.page-box {
	display: flex;
	flex-direction: column;
	height: calc(100% - 104rem);
}

.top-content {
	height: 112rem;
	background: #FFF1CE;
	display: flex;
	position: relative;

	.left-result {
		flex: 1;
		padding: 10rem 20rem;
		border-right: 1px solid rgba(0, 0, 0, 0.08);

		.open-number {
			color: #000;
			font-size: 28rem;
			display: flex;
			align-items: center;

			.game-down {
				width: 24rem;
				height: 12rem;
				margin-left: 10rem;
				transition: transform 0.3s ease-in-out;
			}
		}

		.open-point {
			display: flex;
			justify-content: center;
			padding-right: 120rem;
			margin-top: 6rem;

			div {
				width: 40rem;
				height: 40rem;
				// background: linear-gradient(0deg, #FB0823 85%, #E2061F 100%);
				border-radius: 50%;
				color: #fff;
				display: flex;
				justify-content: center;
				align-items: center;
			}
		}
	}

	.right-box {
		width: 50%;

		.current-open {
			width: 100%;
			text-align: center;
			color: #000000E6;
			font-weight: 600;
		}

		.time-box {
			flex: 1;
			display: flex;
			justify-content: center;
			align-items: center;

			.time-item {
				width: 64rem;
				height: 64rem;
				background: #000;
				color: #fff;
				border-radius: 4rem;
				display: flex;
				justify-content: center;
				align-items: center;
				font-size: 34rem;
			}

			.txt {
				margin: 0 4rem;
			}
		}
	}

	.order-left {
		position: absolute;
		bottom: 0;
		right: 0;
		height: 112rem;
		display: flex;
		align-items: center;

		.order-arrow {
			width: 12px;
			height: 24px;
		}
	}
}

.tips {
	font-size: 26rem;
	color: #000;
	padding: 10rem 20rem;
}

.bet-content {
	padding: 10rem 20rem;
	flex: 1;
	display: flex;
	overflow-y: scroll;

	.btn-list {
		overflow-y: scroll;

		.btn-item {
			background: #F2F4FA;
			color: #000;
			width: 180rem;
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;
			margin-bottom: 20rem;
			border-radius: 8rem;
			font-size: 28rem;
			border: 1rem solid rgba(0, 0, 0, 0.08);
			text-align: center;
			padding: 5rem 0rem;

			&.btn-active {
				border-color: #FFD8BA;
				background: #FFFBF5;
				// color: #F5843F;
				background: linear-gradient(#EB602D, #FFA64F);
				background-clip: text !important;
				-webkit-background-clip: text;
				-webkit-text-fill-color: transparent;
			}

			.odes {
				margin-top: -5rem;
			}
		}
	}

	.select-box {
		flex: 1;
		margin-left: 40rem;
		overflow-y: auto !important;
		text-align: center;
		display: flex;
		flex-direction: column;

		.show {
			height: 60rem;
			display: flex;
			align-items: center;
			justify-content: center;

			.show-icon {
				width: 20rem;
				height: 32rem;
				transform: rotate(-90deg);
				transition: 0.5s;
			}

			.show-icon.active {
				transform: rotate(90deg);
			}

			margin-bottom: 20rem;
		}

		.select-list {
			display: flex;
			flex-wrap: wrap;
			// height: 1670rem;
			transition: 0.5s;
			overflow: hidden;

			.select-item {
				display: flex;
				justify-content: center;
				align-items: center;
				width: 20%;
				margin-bottom: 20rem;

				div {
					width: 60rem;
					height: 60rem;
					flex-shrink: 0;
					background: #FDE1AB;
					border-radius: 50%;
					display: flex;
					justify-content: center;
					align-items: center;
					// color: #F5843F;
					font-size: 32rem;
					font-weight: 700;

					span {
						background: linear-gradient(#EB602D, #FFA64F);
						background-clip: text !important;
						-webkit-background-clip: text;
						-webkit-text-fill-color: transparent;
					}

					&.select-active {
						background: linear-gradient(0deg, #FB0823 85%, #E2061F 100%);
						box-shadow: 0px 4rem 12rem rgba(0, 0, 0, 0.4);

						span {
							background: #fff;
							background-clip: text !important;
							-webkit-background-clip: text;
							-webkit-text-fill-color: transparent;
						}
					}
				}
			}
		}

		.arrow-down {
			position: relative;
			width: 0;
			height: 0;
			border-left: 25px solid transparent;
			border-right: 25px solid transparent;
			border-top: 50px solid black;
			/* 改变颜色可以改变箭头颜色 */
		}

		.arrow-down:after {
			content: '';
			position: absolute;
			left: -50px;
			top: -100px;
			width: 0;
			height: 0;
			border-left: 50px solid transparent;
			border-right: 50px solid transparent;
			border-top: 90px solid white;
			/* 改变颜色可以改变箭头背景颜色 */
		}
	}
}

.number-box {
	height: 59%;
}

.number-active {
	height: 100% !important;
}

.footer {
	// position: fixed;
	// bottom: 0;
	// left: 0;
	// right: 0;
	position: relative;
	width: 100%;
	background: #FFF5E3;
	max-width: 500px;
	margin: 0 auto;
	flex-shrink: 0;

	.bet-input {
		display: flex;
		justify-content: space-between;
		align-items: center;
		height: 100rem;
		padding: 15rem 16rem;

		// input::placeholder {
		// 	font-size: 20rem;
		// }

		.bet-input-zero {
			.uni-input-placeholder {
				color: #AEAEAE;
			}
		}

		.input {
			background: #fff;
			height: 100%;
			font-size: 30rem;
			width: 350rem;
			padding: 0 20rem;
			text-align: center;
		}

		.money-btn {
			display: flex;
			background: #fff;
			border: 1rem solid rgba(0, 0, 0, 0.08);
			height: 100%;
			font-size: 28rem;

			.money-plus {
				width: 70rem;
				display: flex;
				justify-content: center;
				align-items: center;
				font-size: 32rem;
			}

			.money-num {
				text-align: center;
				width: 100rem;
				height: 100%;
				display: flex;
				justify-content: center;
				align-items: center;
				border-left: 1rem solid rgba(0, 0, 0, 0.08);
				border-right: 1rem solid rgba(0, 0, 0, 0.08);
			}
		}
	}

	.bet-select {
		height: 110rem;
		background: #FFF1CE;
		display: flex;
		justify-content: space-between;
		border-top: 1rem solid rgba(0, 0, 0, 0.08);

		.left-num {
			flex: 1;
			display: flex;
			align-items: center;
			color: #DC3B40;
			padding: 0 16rem;
			width: 67%;
			overflow: hidden;

			.num-x {
				width: 100%;
				position: relative;
				height: 46rem;
				z-index: 2;
				overflow: hidden;
				// background-color: greenyellow;


				// box-shadow: inset -10px 0 10px -10px rgba(18, 21, 38, 0.3);
				.scorll-num-width {
					width: 90%;
				}

				.shadow {
					width: 42rem;
					// opacity: 0;
					height: 100%;
					background-color: #FFF1CE;
					overflow: hidden;
					display: flex;
					justify-content: center;
					align-items: center;
					// box-shadow: -10px 0 10px -10px rgba(18, 21, 38, 0.6);
					// box-shadow: -6rem 0 15rem 5rem rgba(18, 21, 38, 0.6);
					box-shadow: -15rem 0 10rem -2rem rgba(0, 0, 0, 0.4);

					position: absolute;
					right: 0rem;
					top: 0;
					z-index: 1;

				}
			}

			.shadow-imgs {
				width: 18rem;
				height: 18rem;

			}

			.add {
				font-size: 46rem;
			}

			.num {
				font-size: 28rem;
				margin-left: 8rem;
				color: #DC3B40;
				font-weight: bold;
				height: 100%;
				display: flex;
				flex-direction: column;
				justify-content: space-evenly;
				width: calc(100% - 8rem);

				.select-num {
					font-size: 26rem;
					// width: 360rem;
					height: 46rem;
					display: flex;
					align-items: center;
					// box-shadow: inset -10px 0 10px -10px rgba(18, 21, 38, 0.3); // flex-shrink:;
					// box-shadow: 10px 0 10px -10px rgba(0, 0, 0, 0.5);

					.select_item {
						width: 36rem;
						height: 36rem;
						line-height: 36rem;
						background-color: #FB0823;
						color: #fff;
						margin-right: 12rem;
						border-radius: 50%;
						font-size: 20rem;
						font-weight: initial;
						text-align: center;
						flex-shrink: 0;
					}
				}

				.num-total {
					display: flex;
					justify-content: start;
					font-size: 24rem;

					.rit {
						margin-left: 20rem;
					}
				}
			}
		}

		.right-btn {
			background: linear-gradient(#EB602D, #FFA64F);
			width: 270rem;
			color: #fff;
			display: flex;
			justify-content: center;
			align-items: center;
			font-size: 35rem;
			flex-shrink: 0;
		}
	}
}

.type-box {
	position: fixed;
	top: 104rem;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 10;
	background-color: rgba(0, 0, 0, .5);
	max-width: 500px;
	margin: 0 auto;

	.type-contnet {
		width: 100%;
		background: #fff;

		.time-list {
			// border-top: 1rem solid #eee;
			display: flex;
			flex-wrap: wrap;
			padding: 30rem 16rem 0rem;
			font-size: 27rem;

			.time-item {
				width: 22%;
				height: 50rem;
				background: #FFF6E6;
				color: #000;
				display: flex;
				justify-content: center;
				align-items: center;
				margin-right: 4%;
				margin-bottom: 30rem;
				border-radius: 6rem;

				&:nth-child(4n + 4) {
					margin-right: 0;
				}

				&.time-active {
					background: linear-gradient(#EB602D, #FFA64F);
					color: #fff;
				}
			}
		}
	}
}

.result-box {
	position: fixed;
	top: 103rem;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 100;
	z-index: 10;
	background-color: rgba(0, 0, 0, .5);
	max-width: 500px;
	margin: 0 auto;

	.result-content {
		background: #fff;

		.result-title {
			display: flex;
			// justify-content: space-between;
			// align-items: center;
			padding: 0 20rem;
			height: 100rem;
			line-height: 100rem;
			text-align: center;
		}

		.result-title div:nth-child(1) {
			width: 25%;
		}

		.result-title div:nth-child(2) {
			width: 25%;
		}

		.result-title div:nth-child(3) {
			width: 50%;
		}

		.result-list {
			max-height: 65vh;
			overflow-y: auto;

			.result-line {
				display: flex;
				padding: 30rem 20rem;
				text-align: center;

				div:nth-child(1) {
					width: 25%;
				}

				div:nth-child(2) {
					width: 25%;
					display: flex;
					justify-content: center;
				}

				div:nth-child(3) {
					width: 50%;
				}

				&:nth-child(2n + 1) {
					background: #FFFBF5;
				}
			}

			.More {
				height: 100rem;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 32rem;
				background: linear-gradient(#EB602D, #FFA64F);
				/*设置渐变的方向从左到右 颜色从ff0000到ffff00*/
				background-clip: text !important;
				-webkit-background-clip: text;
				/*将设置的背景颜色限制在文字中*/
				-webkit-text-fill-color: transparent;
				/*给文字设置成透明*/
			}

		}
	}
}

.more {
	background: #FFF;
	padding: 24rem;

	.more-btn {
		box-shadow: rgba(0, 0, 0, 0.1) 0px 1.06667vw 1.06667vw;
		border-radius: 2.13333vw;
		height: 78rem;
		display: flex;
		align-items: center;
		justify-content: center;

		text {
			margin-right: 20rem;
			font-size: 24rem;
			font-weight: 700;
		}
	}
}

.more-not {
	padding: 24rem;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 24rem;
	color: #707070;
	text-align: center !important;
}

.order-container {
	position: absolute;
	top: 0;
	right: -100%;
	/* 初始时隐藏弹窗 */
	height: 100%;
	width: 100%;
	background-color: #fff;
	z-index: 998;
	transition: right 0.3s ease;

	&.active {
		right: 0;
		/* 显示弹窗 */
	}
}

.modal-content {
	padding: 20px;
}

.disabled {
	filter: grayscale(1) !important;
	-webkit-filter: grayscale(1) !important;
}

.popup-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	// z-index: 997;
	background: rgba(0, 0, 0, 0.3);
}

.tips-popup {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 998;

	.bet-win {
		width: 600rem;
		height: 152rem;
		border-radius: 20rem;
		background: #FFF;
		box-shadow: 20rem 20rem 40rem 0rem rgba(255, 255, 255, 0.25), -20rem -20rem 40rem 0rem rgba(255, 255, 255, 0.25);
		color: #000;
		font-weight: 500;
		font-size: 40rem;
		overflow: hidden;
		animation: colorBtn 1s forwards;

		.win-title {
			height: 152rem;
			display: flex;
			align-items: center;
			justify-content: center;

		}

		.win-content {
			font-size: 30rem;
			padding-left: 40rem;

			.win-item {
				margin-bottom: 8rem;
			}
		}
	}

	@keyframes colorBtn {
		0% {
			height: 152rem;
		}

		100% {
			height: 572rem;
		}
	}
}

.main {
	overflow-y: hidden;
	flex: 1;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
}

.topBtn {
	color: #F56900 !important;
	margin-left: 18rem;
}

.openCodeBox {
	width: 50rem !important;
	height: 50rem !important;
	position: relative;

	.sum-img {
		width: 100%;
		height: 100%;
	}

	.sum-num {
		position: absolute;
		top: 0rem;
		bottom: 0rem;
		width: 100% !important;
		height: 50rem !important;
		line-height: 50rem;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 28rem;
		color: #FFF;
	}
}

.type-list {
	display: flex;
	height: 60rem;
	background: #FFF6E6;
	color: #000000;
	font-weight: bold;
	border-radius: 10rem;

	.type-item {
		text-align: center;
		width: 20rem;
		flex-shrink: 0;
		line-height: 60rem;
	}

	.type-active {
		border-radius: 10rem;
		background: #FFA64F;
		color: #fff;
	}
}

.share-img {
	&.disabled {
		pointer-events: none;
		filter: grayscale(1);
	}
}
</style>