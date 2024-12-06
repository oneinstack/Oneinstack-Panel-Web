<template>
	<x-page :noFooter="true" :fixed="false">
		<template #title>
			<div v-if="(conf.timeIndex / 1000 / 60) >= 1">
				{{ $t('game.dice') }}-{{ conf.timeIndex / 1000 / 60 || '' }}
				{{ (conf.timeIndex / 1000 / 60) > 1 ? $t('game.minutes') : $t('game.minute') }}
			</div>
			<div v-else>{{ $t('game.dice') }}-{{ conf.timeIndex / 1000 || '' }} {{
				$t('game.second')
			}}
			</div>
		</template>
		<template #right>
			<div class="right-content">
				<div class="right-text">{{ $t('wallet.balance') }}</div>
				<div class="right-icon">{{ conf.walletMoney }}</div>
			</div>
			<img class="wallet-img" src="/static/img/wallet.webp" />
		</template>
		<template #top>
			<div class="time-box">
				<div class="time-outer">
					<div class="time-content">
						<img class="time-img" src="/static/img/time.png" />
						<span>{{ $t('game.timeBig') }}</span>
						<img class="time-img" src="/static/img/time.png" />
					</div>
				</div>
			</div>
			<div class="incline">
				<img class="incline-img" src="/static/img/incline.png" />
			</div>
			<div class="time-nav">
				<div style="overflow-x: scroll;" v-scroll>
					<div class="time-list" v-if="conf.lotteryVOList.length">
						<div v-for="(item, index) in conf.lotteryVOList" :key="index" class="time-item"
							:class="{ 'time-active': conf.timeIndex == item.lotteryInterval }"
							@click="conf.changeTime(item, index)">
							<div v-if="(item.lotteryInterval / 1000 / 60) >= 1">
								{{ item.lotteryInterval / 1000 / 60 }}<span class="word">{{ (item.lotteryInterval /
									1000 / 60)
									> 1 ? $t('game.minutes') : $t('game.minute') || '' }}</span>
							</div>
							<div v-else>
								{{ item.lotteryInterval / 1000 }}<span class="word">{{ $t('game.second') }}</span>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div class="share-box">
				<div class="share-title">{{ $t('game.resultFor') }}：{{ conf.LastExpect }}</div>
				<div class="share-list">
					<div class="share-item">
						<div class="item-title">{{ $t('game.resultBig') }}</div>
						<div class="item-random">
							<div class="adbanner">
								<game-loop :swipeList="conf.shareList" :target-swipe="conf.share1"
									:autoplay="conf.autoplay">
									<template v-slot="{ item }">
										<img style="width: 100%;height: 100%;" :src="item.src" />
									</template>
								</game-loop>
							</div>
							<div class="adbanner">
								<game-loop :swipeList="conf.shareList" :target-swipe="conf.share2"
									:autoplay="conf.autoplay">
									<template v-slot="{ item }">
										<img style="width: 100%;height: 100%;" :src="item.src" />
									</template>
								</game-loop>
							</div>
							<div class="adbanner">
								<game-loop :swipeList="conf.shareList" :target-swipe="conf.share3"
									:autoplay="conf.autoplay">
									<template v-slot="{ item }">
										<img style="width: 100%;height: 100%;" :src="item.src" />
									</template>
								</game-loop>
							</div>
						</div>
					</div>
					<div class="divider-h"></div>
					<div class="share-item">
						<div class="item-title" style="text-align: center;">{{ $t('game.totalPoint') }}</div>
						<div class="item-random">
							<div class="adbanner">
								<game-loop :swipeList="conf.poinits" :target-swipe="conf.total"
									:autoplay="conf.autoplay">
									<template v-slot="{ item }">
										<div class="total-swiper">
											<img class="total-img" src="/static/img/poinits.webp" />
											<div class="total-point">{{ item.num }}</div>
										</div>
									</template>
								</game-loop>
							</div>
						</div>
					</div>
					<div class="divider-h"></div>
					<div class="share-item">
						<div class="item-title" style="text-align: center;">{{ $t('game.draw') }}</div>
						<div class="item-random">
							<div class="adbanner">
								<game-loop :swipeList="conf.drawList" :target-swipe="conf.sizeNum"
									:autoplay="conf.autoplay">
									<template v-slot="{ item }">
										<div class="random"
											style="display: flex;justify-content: center;align-items: center;font-size: 48rem;width: 100%;height: 100%;"
											v-if="item.content == '-'">-</div>
										<img style="width: 100%;height: 100%;" :src="item.src1" v-else />
									</template>
								</game-loop>
							</div>
							<div class="adbanner">
								<game-loop :swipeList="conf.drawList" :target-swipe="conf.doubleNum"
									:autoplay="conf.autoplay">
									<template v-slot="{ item }">
										<div class="random"
											style="display: flex;justify-content: center;align-items: center;font-size: 48rem;width: 100%;height: 100%;"
											v-if="item.content == '-'">-</div>
										<img style="width: 100%;height: 100%;" :src="item.src2" v-else />
									</template>
								</game-loop>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div class="reckon-time">
				<div class="reckon-title">{{ $t('game.drawingTime') }}：{{ conf.currentOpen.openExpect }}</div>
				<div class="time-bar">
					<div class="time-num">
						<div class="num-item">{{ conf.hour }}</div>
						<span>:</span>
						<div class="num-item">{{ conf.minutes }}</div>
						<span>:</span>
						<div class="num-item">{{ conf.second }}</div>
					</div>
					<div class="bar">
						<div class="bar-active" :style="{ 'width': conf.bar + '%' }"></div>
					</div>
				</div>
			</div>
			<div class="category">
				<div @click="conf.changeStatus(1)"><span :class="{ 'category-active': conf.categoryIndex == 1 }">{{
					$t('game.betting') }}</span></div>
				<div @click="conf.changeStatus(2)"><span :class="{ 'category-active': conf.categoryIndex == 2 }">{{
					$t('game.result') }}</span></div>
				<div @click="conf.changeStatus(3)"><span :class="{ 'category-active': conf.categoryIndex == 3 }">{{
					$t('game.analyze') }}</span></div>
				<div @click="conf.changeStatus(4)"><span :class="{ 'category-active': conf.categoryIndex == 4 }">{{
					$t('game.rule') }}</span></div>
				<div @click="conf.changeStatus(5)"><span :class="{ 'category-active': conf.categoryIndex == 5 }">{{
					$t('game.myOrder') }}</span></div>
			</div>
		</template>
		<div style="width: 100%;height: 100%;background: #f5f5fa;">
			<betting v-if="conf.categoryIndex == 1" :poinits="conf.poinits" :shareList="conf.shareList"
				:timeClose="conf.timeClose" :oddsArr="conf.oddsArr" @closeBet="conf.closeBet"
				@changeBet="conf.changeBet">
			</betting>
			<result v-if="conf.categoryIndex == 2" :lotteryId="conf.lotteryId" ref="resultRefs"></result>
			<analyze v-if="conf.categoryIndex == 3" :lotteryId="conf.lotteryId" ref="analyzeRefs"></analyze>
			<rule v-if="conf.categoryIndex == 4" :list="conf.lotteryRuleurl"></rule>
			<order v-if="conf.categoryIndex == 5" :lotteryId="conf.lotteryId" ref="orderRefs" :oddsArr="conf.oddsArr">
			</order>
		</div>
		<time-popup @close="conf.timePopupShop = false" v-if="conf.timePopupShop"></time-popup>
		<bet-popup :betShow="conf.showBet" :betObj="conf.addsItem" @submit="conf.submit" @share="conf.share"
			:betShare="conf.shareOpen" :isBetBtnClick="conf.isBetBtnClick"></bet-popup>
		<div v-if="conf.isWinBet">
			<div class="popup-mask"></div>
			<div class="tips-popup" @click="conf.closeWinBet">
				<div class="bet-win">
					<div class="win-title">{{ $t('game.winBet') }}</div>
					<div class="win-content">
						<div class="win-item">{{ $t('game.expect') }}：{{ conf.currentOpen.openExpect }}</div>
						<div class="win-item">{{ $t('game.amount') }}：{{ conf.money }}</div>
						<div class="win-item">{{ $t('game.start') }}：{{ sutil.getTimeFormat(conf.currentOpen.startTime)
							}}
						</div>
						<div class="win-item">{{ $t('game.open') }}：{{ sutil.getTimeFormat(conf.currentOpen.openTime) }}
						</div>
					</div>
				</div>
			</div>
		</div>
	</x-page>
</template>

<script setup lang="ts">
import { apis } from '@/api';
import { onMounted, onUnmounted, reactive, ref } from 'vue';
import betting from './betting.vue';
import result from './result.vue';
import rule from '../components/gameRule.vue';
import order from './order.vue';
import analyze from './analyze.vue';
import betPopup from '../components/betPopup.vue';
import timePopup from '../components/timePopup.vue';
import gameLoop from '../components/gameLoop.vue';
import System from '@/utils/System';
import i18n from '@/lang';
import { svalue } from '@/sstore/svalue';
import sutil from '@/sstore/sutil';
import sconfig from '@/sstore/sconfig';
import slottery from '@/sstore/slottery';

const resultRefs = ref<any>()
const analyzeRefs = ref<any>()
const orderRefs = ref<any>()
const conf = reactive({
	timeIndex: 0,
	scrollLeft: 0,
	shareList: [{
		src: 'static/img/share-1.webp',
		betImg: 'share-1.webp',
		single: 'single_one',
		double: 'double_one',
		leopard: 'leopard_one'
	},
	{
		src: 'static/img/share-2.webp',
		betImg: 'share-2.webp',
		single: 'single_two',
		double: 'double_two',
		leopard: 'leopard_two'
	},
	{
		src: 'static/img/share-3.webp',
		betImg: 'share-3.webp',
		single: 'single_three',
		double: 'double_three',
		leopard: 'leopard_three'
	},
	{
		src: 'static/img/share-4.webp',
		betImg: 'share-4.webp',
		single: 'single_four',
		double: 'double_four',
		leopard: 'leopard_four'
	},
	{
		src: 'static/img/share-5.webp',
		betImg: 'share-5.webp',
		single: 'single_five',
		double: 'double_five',
		leopard: 'leopard_five'
	},
	{
		src: 'static/img/share-6.webp',
		betImg: 'share-6.webp',
		single: 'single_six',
		double: 'double_six',
		leopard: 'leopard_six'
	}
	],
	drawList: [{
		content: '-'
	},
	{
		src1: 'static/img/small.webp',
		src2: 'static/img/odd.webp'
	},
	{
		src1: 'static/img/big.webp',
		src2: 'static/img/even.webp'
	}
	],
	share1: 0,
	share2: 0,
	share3: 0,
	total: 0,
	sizeNum: 0,
	doubleNum: 0,
	autoplay: true,
	duration: 120,
	hour: '00',
	minutes: '00',
	second: '00',
	bar: 100,
	timer: null as any,
	categoryIndex: 1,
	timePopupShop: false,
	poinits: [{
		num: 3,
		total: 150,
		name: 'sum_three'
	},
	{
		num: 4,
		total: 50,
		name: 'sum_four'
	},
	{
		num: 5,
		total: 18,
		name: 'sum_five'
	},
	{
		num: 6,
		total: 14,
		name: 'sum_six'
	},
	{
		num: 7,
		total: 12,
		name: 'sum_seven'
	},
	{
		num: 8,
		total: 18,
		name: 'sum_eight'
	},
	{
		num: 9,
		total: 9,
		name: 'sum_nine'
	},
	{
		num: 10,
		total: 6,
		name: 'sum_ten'
	},
	{
		num: 11,
		total: 6,
		name: 'sum_eleven'
	},
	{
		num: 12,
		total: 6,
		name: 'sum_twelve'
	},
	{
		num: 13,
		total: 8,
		name: 'sum_thirteen'
	},
	{
		num: 14,
		total: 12,
		name: 'sum_fourteen'
	},
	{
		num: 15,
		total: 14,
		name: 'sum_fifteen'
	},
	{
		num: 16,
		total: 18,
		name: 'sum_sixteen'
	},
	{
		num: 17,
		total: 50,
		name: 'sum_seventeen'
	},
	{
		num: 18,
		total: 150,
		name: 'sum_eighteen'
	}
	],
	serviceHeiht: 300,
	lotteryVOList: [] as any[],
	openExpect: '',
	oddsArr: [],
	timeClose: true,
	currentOpen: {} as any,
	lotteryId: '',
	LastExpect: '',
	LastOpenCode: '',
	walletMoney: '-',
	openLockCountdown: 10,
	setTimer: null as any,
	setTimer1: null as any,
	refresh: false,
	shareOpen: false,
	showBet: false,
	addsItem: {} as any,
	isWinBet: false,
	money: 0,
	openNum: 0,
	betTimer: null,
	isRequest: false,
	openShow: true,
	countdownNext: 0,
	countdownCurr: 0,
	countdownNum: 0,
	barTotal: 0,
	lotteryRuleurl: '',
	hasOpenCodeTimer: null as any,
	noOpenCodeTimer: null as any,
	gameType: '3D',
	isBetBtnClick: true,
	defaultWalletInfo: {} as any,
	// 选择时间期数
	changeTime(item: any, index: any) {
		if (conf.timeIndex == item.lotteryInterval) return;
		conf.timeIndex = item.lotteryInterval
		conf.openLockCountdown = item.openLockCountdown
		conf.getLotteryList(index)
		if (conf.timer) {
			clearInterval(conf.timer);
			conf.timer = null;
		}
		if (conf.noOpenCodeTimer) {
			clearTimeout(conf.noOpenCodeTimer);
			conf.noOpenCodeTimer = null;
		}
		if (conf.hasOpenCodeTimer) {
			clearTimeout(conf.hasOpenCodeTimer);
			conf.hasOpenCodeTimer = null;
		}
		// conf.getLotteryOpen(item.id)
		if (index == 1 && conf.scrollLeft > 30) {
			conf.scrollLeft = 0
		} else {
			conf.scrollLeft = index * 30
		}
	},
	// 游戏列表
	async getLotteryList(index: any) {
		conf.lotteryVOList = await slottery.findLotteryList('3D')
		conf.lotteryRuleurl = conf.lotteryVOList[index]?.lotteryRuleurl
		conf.timeIndex = conf.lotteryVOList[index].lotteryInterval
		conf.openLockCountdown = conf.lotteryVOList[index].openLockCountdown
		let lotteryTypeId = conf.lotteryVOList[index].lotteryTypeId
		clearTimeout(conf.setTimer)
		clearTimeout(conf.setTimer1)
		if (conf.timer) {
			clearInterval(conf.timer);
			conf.timer = null;
		}
		if (conf.noOpenCodeTimer) {
			clearTimeout(conf.noOpenCodeTimer);
			conf.noOpenCodeTimer = null;
		}
		if (conf.hasOpenCodeTimer) {
			clearTimeout(conf.hasOpenCodeTimer);
			conf.hasOpenCodeTimer = null;
		}
		conf.getLotteryOpen(conf.lotteryVOList[index].id)
		conf.getLotteryOdds(lotteryTypeId)
	},
	getLotteryOdds(lotteryTypeId: any) {
		apis.lotteryOdds({
			lotteryTypeId,
			lotteryTypeCode: "3D",
			success: (res: any) => {
				conf.oddsArr = res.data
			}
		});
	},
	// 获取上期开奖数据及本期时间
	getLotteryOpen(lotteryId: any) {
		if (!conf.autoplay) {
			conf.autoplay = true
			conf.duration = 120
			console.log('88888');

		}
		lotteryId && (conf.lotteryId = lotteryId)
		apis.lotteryOpen({
			lotteryId: lotteryId || conf.lotteryId,
			success: (res: any) => {
				if (res.code == 200) {
					if (conf.openShow) {
						let cdata = res.data
						if (cdata.currentOpen) conf.openShow = false
						let currentOpen = cdata.currentOpen.openTime
						conf.countdownCurr = parseInt(currentOpen) - parseInt(cdata.currentSystemTime)
						let currentNext = cdata.nextOpen.openTime
						conf.countdownNext = parseInt(currentNext) - parseInt(cdata.currentSystemTime)

						conf.countdownNum = conf.countdownCurr
						conf.barTotal = conf.countdownCurr
						conf.currentTime()
					}
					conf.currentOpen = res.data.currentOpen
					conf.currentOpen.orderType = conf.timeIndex
					conf.LastExpect = res.data.lastOpen.openExpect
					conf.LastOpenCode = res.data.lastOpen.openCode
					if (!conf.LastOpenCode && !conf.isRequest) {
						conf.sizeNum = 0
						conf.doubleNum = 0
						conf.noOpenCodeTimer = setTimeout(() => {
							conf.getLotteryOpen(conf.lotteryId)
						}, 1000)
					}
					conf.setCode(res.data.lastOpen.openCode)
				} else {
					conf.timeClose = true
					conf.minutes = '00'
					conf.second = '00'
					conf.bar = 0
					conf.LastExpect = ''
					conf.currentOpen = {}
					conf.share1 = 0
					conf.share2 = 0
					conf.share3 = 0
					conf.total = 0
					conf.sizeNum = 0
					conf.doubleNum = 0
					// conf.autoplay = false
					if (res.code == '1306' && conf.openNum < 6) {
						conf.hasOpenCodeTimer = setTimeout(() => {
							conf.openNum++
							if (conf.timer) {
								clearInterval(conf.timer);
								conf.timer = null;
							}
							if (conf.noOpenCodeTimer) {
								clearTimeout(conf.noOpenCodeTimer);
								conf.noOpenCodeTimer = null;
							}
							if (conf.hasOpenCodeTimer) {
								clearTimeout(conf.hasOpenCodeTimer);
								conf.hasOpenCodeTimer = null;
							}
							conf.getLotteryOpen(conf.lotteryId)
						}, 2000)
					} else {
						System.toast(i18n.t(`code.${res.code}`))
					}
				}
			}
		})
	},
	// 获取页面显示开奖信息
	setCode(code: any) {
		if (!code) return;
		conf.autoplay = false;
		conf.duration = 0
		let arr = code.split(',')
		let num1 = parseInt(arr[0])
		let num2 = parseInt(arr[1])
		let num3 = parseInt(arr[2])
		conf.share1 = num1 - 1
		conf.share2 = num2 - 1
		conf.share3 = num3 - 1
		conf.autoplay = false;

		let totalNum = num1 + num2 + num3
		conf.total = conf.share1 + conf.share2 + conf.share3
		if (conf.share1 == conf.share2 && conf.share1 == conf.share3 && conf.share2 == conf.share3) {
			conf.sizeNum = 0
			conf.doubleNum = 0
		} else {
			if (totalNum < 11) {
				conf.sizeNum = 1
			} else {
				conf.sizeNum = 2
			}
			if (totalNum % 2 == 0) {
				conf.doubleNum = 2
			} else {
				conf.doubleNum = 1
			}
		}
		if (conf.categoryIndex == 2) resultRefs.value?.initResult()
		if (conf.categoryIndex == 3) analyzeRefs.value?.initAnaly()
		if (conf.categoryIndex == 5 && sconfig.userInfo) orderRefs.value?.initOrder()
		setTimeout(() => {
			// 更新钱包金额
			conf.getWalletMoney(2)
		}, 5000)
		conf.openShow = true
	},
	// 获取开奖倒计时
	currentTime() {
		conf.timeClose = false
		conf.shareOpen = false
		if (conf.timer) return;
		conf.timer = setInterval(() => {
			if (conf.countdownNum > 0) {
				conf.getCountDown(conf.countdownNum)
				if (conf.countdownNum <= 20000 && !conf.shareOpen) conf.shareOpen = true
				if (!conf.timeClose && conf.countdownNum <= conf.openLockCountdown) {
					conf.timeClose = true
					conf.showBet = false
				}
				if (Math.round(conf.countdownNum / 1000) == 3) conf.timePopupShop = true
			} else {
				if (!conf.autoplay) {
					conf.duration = 120
					conf.autoplay = true
				}
				conf.openShow = true
				conf.countdownNum = conf.countdownNext
				conf.barTotal = conf.countdownNext
				conf.getCountDown(conf.countdownNum)

				// conf.lastBetNumber = conf.currentNumber
				// conf.currentNumber = conf.nextNumber

				if (conf.timer) {
					clearInterval(conf.timer);
					conf.timer = null;
				}
				if (conf.noOpenCodeTimer) {
					clearTimeout(conf.noOpenCodeTimer);
					conf.noOpenCodeTimer = null;
				}
				if (conf.hasOpenCodeTimer) {
					clearTimeout(conf.hasOpenCodeTimer);
					conf.hasOpenCodeTimer = null;
				}
				conf.getLotteryOpen(conf.currentOpen.lotteryId)
			}
			conf.bar = conf.countdownNum / conf.timeIndex * 100
			conf.countdownCurr -= 1000
			conf.countdownNext -= 1000
			conf.countdownNum -= 1000
		}, 1000);
	},
	getCountDown(nowDate: any) {
		const hours = Math.floor((nowDate / 1000 / 60 / 60) % 24)
		const minutes = Math.floor((nowDate / 1000 / 60) % 60)
		const seconds = Math.floor((nowDate / 1000) % 60)
		if (seconds < 0) return
		conf.hour = conf.ripr(hours)
		conf.minutes = conf.ripr(minutes)
		conf.second = conf.ripr(seconds)
	},
	ripr(num: any) {
		return num < 10 ? `0${num}` : num
	},
	// 导航栏
	changeStatus(i: any) {
		conf.categoryIndex = i
	},
	closeBet(e: any) {
		if (e) {
			conf.refresh = true
		}
		conf.getWalletMoney(2)
	},
	// 选择下注项
	changeBet(e: any) {
		conf.addsItem = e
		conf.showBet = true
	},
	// 获取默认钱包
	async getWalletMoney(type: any) {
		if (!sconfig.userInfo) return conf.walletMoney = '-'
		let item = await svalue.getDefaultWallet()
		if (item.hasOwnProperty('coinSymbol')) {
			conf.defaultWalletInfo = item
			let m = parseFloat(item.walletMoney)
			conf.walletMoney = (item.coinSymbol || '₹') + sutil.dataHandling(m)
		}
	},
	// 下注
	submit(e: any) {
		console.log('6666');
		
		console.log(e);
		
		// conf.isBetBtnClick = false
		if (!e) return conf.showBet = false
		if (!conf.defaultWalletInfo.hasOwnProperty('coinCode')) {
			System.toast(i18n.t('game.setWalletTip'))
			return
		}

		let minBetMoney = conf.defaultWalletInfo.betMinAmount
		let maxBetMoney = conf.defaultWalletInfo.betMaxAmount
		let coinSymbol = conf.defaultWalletInfo.coinSymbol

		if (parseFloat(e) < parseFloat(minBetMoney)) {
			System.toast(i18n.t('game.minBetTip') + ' ' + coinSymbol + minBetMoney || '')
			return
		}

		if (parseFloat(e) > parseFloat(maxBetMoney)) {
			System.toast(i18n.t('game.maxBetTip') + ' ' + coinSymbol + maxBetMoney || '')
			return
		}
		conf.money = e
		System.loading()
		apis.lotteryUserBets({
			money: e,
			betCodes: conf.addsItem.oddsCode,
			betExpect: conf.currentOpen.openExpect,
			betOpenId: conf.currentOpen.lotteryOpenId,
			lotteryId: conf.currentOpen.lotteryId,
			lotteryOddsId: conf.addsItem.oddsId,
			multiple: 1,
			nums: 1,
			supplement: 0,
			walletCoinCode: conf.defaultWalletInfo.walletCoin,
			success: (res: any) => {
				conf.isBetBtnClick = true
				console.log(conf.isBetBtnClick);
				
				conf.isWinBet = true
				setTimeout(() => {
					conf.isWinBet = false
				}, 3000)
				conf.showBet = false
				// 更新钱包金额
				conf.getWalletMoney(2)
			},
			final: () => {
				System.loading(false)
			}
		});
	},
	// 分享
	share(e: any) {
		let type = conf.currentOpen.orderType
		let orderType = ''
		let openTime = sutil.getTimeFormat(conf.currentOpen.openTime, 2)
		if ((type / 1000 / 60) >= 1) {
			orderType = 'Dice-' + (type / 1000 / 60) + ' Minute'
		} else {
			orderType = 'Dice--' + (type / 1000) + ' Second'
		}
		let obj = {
			lotteryId: conf.currentOpen.lotteryId,
			money: e.money,
			betCodes: conf.addsItem.oddsCode,
			betExpect: conf.currentOpen.openExpect,
			betOpenId: conf.currentOpen.lotteryOpenId,
			lotteryOddsId: conf.addsItem.oddsId,
			betImg: conf.addsItem.betImg,
			betNum: conf.addsItem.betNum,
			betType: conf.addsItem.betType,
			isPlace: false,
			orderType,
			openTime
		}
		conf.showBet = false
		conf.refresh = true
		Cookie.set('roomOrder', JSON.stringify(obj))
		if (e.type == 2) {
			System.router.push('/user/chat/chat?id=' + e.roomId + '&room=' + e.roomName + '&banned=' + e.roomBanned +
				'&admin=' + e.roomAdmin + '&type=3')
		} else {
			System.router.push('/user/chat/room?type=3')
		}
	},
	closeWinBet() {
		conf.isWinBet = false
		if (conf.betTimer) clearTimeout(conf.betTimer)
	},
	currentShare1(e: any) {
		if (!conf.autoplay) {
			conf.share1 = 0
		}
	},
})
onMounted(() => {
	conf.getLotteryList(0)
	conf.getWalletMoney(1)
})
onUnmounted(() => {
	clearTimeout(conf.setTimer)
	clearTimeout(conf.setTimer1)
	if (conf.timer) {
		clearInterval(conf.timer);
		conf.timer = null;
	}
	if (conf.noOpenCodeTimer) {
		clearTimeout(conf.noOpenCodeTimer);
		conf.noOpenCodeTimer = null;
	}
	if (conf.hasOpenCodeTimer) {
		clearTimeout(conf.hasOpenCodeTimer);
		conf.hasOpenCodeTimer = null;
	}
})
</script>

<style lang="less" scoped>
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


.time-box {
	height: 100rem;
	// margin: 15rem 10rem 0rem;
	padding: 5rem 10rem 0rem;
	position: relative;
	// top: 15rem;
	bottom: -5rem;

	.time-outer {
		padding: 10rem 12rem;
		background: linear-gradient(90deg, #F7D8A9 0.49%, #F6D0A1 99.97%);
		height: 100%;
		border-radius: 20rem;

		.time-content {
			height: 100%;
			background: linear-gradient(90deg, #F0D69F 0.49%, #E2B572 99.97%);
			border-radius: 20rem;
			display: flex;
			align-items: center;
			justify-content: space-between;

			.time-img {
				height: 8rem;
				width: 80rem;
			}

			span {
				color: #BF781A;
				font-size: 40rem;
				font-weight: 600;
			}
		}
	}
}

.incline {
	height: 28rem;
	width: 100%;

	.incline-img {
		width: 100%;
		height: 28rem;
	}

	border-bottom: 2rem solid #FFECD3;
	;
}

.time-nav {
	padding: 20rem 24rem;
	background: linear-gradient(93deg, #F7DFB1 1.89%, #F7E0AE 98.59%);

	.time-list {
		display: flex;
		height: 96rem;

		.time-item {
			background: #FFF;
			box-shadow: 2px 2px 4px 0px rgba(0, 0, 0, 0.10), -4px -4px 4px 0px rgba(255, 255, 255, 0.20);
			border-radius: 8rem;
			font-size: 40rem;
			color: #252529;
			font-weight: 700;
			display: flex;
			align-items: center;
			justify-content: center;
			// flex: 1;
			width: 23.8%;
			margin-left: 1.2%;
			flex-shrink: 0;

			.word {
				font-size: 24rem;
				color: #5f6975;
				margin-left: 16rem;
			}

			&.time-active {
				border-top: 0.8vw solid #EC612E;
				background: #FFFBE2;
			}
		}
	}
}

.share-box {
	background: linear-gradient(93deg, #F7DFB1 1.89%, #F7E0AE 98.59%);
	padding: 0rem 32rem;

	.share-title {
		margin-bottom: 24rem;
		color: #45454d;
		font-weight: 700;
		font-size: 28rem;
	}

	.share-list {
		display: flex;
		justify-content: space-between;

		.share-item {
			.item-title {
				margin-bottom: 8rem;
				color: #5f6975;
				font-weight: 700;
				font-size: 20rem;
			}

			.item-random {
				display: flex;
				// background: #b0aea0;
				background: rgba(00, 00, 00, 0.2);
				border-radius: 16rem;
				// box-shadow: 0px 8rem 8rem 0px #000 inset;
				padding: 10rem;
				display: flex;
				align-items: center;
				justify-content: center;

				.adbanner {
					width: 74rem;
					height: 74rem;
				}

				.random-img {
					width: 100%;
					height: 100%;
				}

				.total-swiper {
					width: 100%;
					height: 100%;
					position: relative;

					.total-img {
						width: 100%;
						height: 100%;
					}

					.total-point {
						position: absolute;
						top: 0rem;
						bottom: 0rem;
						width: 100%;
						display: flex;
						justify-content: center;
						align-items: center;
						font-size: 36rem;
						color: #2c2e36;
						font-weight: 900;
					}
				}
			}
		}

		.divider-h {
			width: 2rem;
			background: rgba(00, 00, 00, 0.1);
		}
	}
}

.reckon-time {
	padding: 20rem 32rem;
	// border-top: 1px solid var(--line, #d8e0ea);
	// background: #edeff5;
	background: linear-gradient(93deg, #F7DFB1 1.89%, #F7E0AE 98.59%);

	.reckon-title {
		word-break: break-all;
		color: #45454d;
		font-weight: 700;
		font-size: 28rem;
	}

	.time-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 24rem;

		.time-num {
			display: flex;
			align-items: center;

			.num-item {
				width: 56rem;
				height: 56rem;
				background: #000;
				color: #FFF;
				border-radius: 8rem;
				display: flex;
				justify-content: center;
				align-items: center;
			}

			span {
				color: #45454d;
				font-weight: 700;
				margin: 0rem 4rem;
			}
		}

		.bar {
			flex: 1;
			height: 16rem;
			background: #B6B9C4;
			border-radius: 8rem;
			overflow: hidden;
			margin-left: 50rem;

			.bar-active {
				height: 100%;
				// background: #D90000;
				background: linear-gradient(180deg, #FB0224 0%, #F56900 100%);
			}
		}
	}
}

.category {
	height: 72rem;
	background: linear-gradient(180deg, #F8E0B1 0%, #FBD59C 100%);
	padding: 0rem 20rem 20rem;
	// border-bottom: 3rem solid #eee;
	display: flex;
	justify-content: space-between;
	align-items: center;

	div {
		font-size: 28rem;
		font-weight: 500;
		color: #45454d;
		flex: 1;
		display: flex;
		justify-content: center;
		align-items: center;
		flex-shrink: 0;
	}

	.category-active {
		position: relative;
		height: 100%;
		color: #252529;
		font-weight: 500;
		color: black;
		line-height: 72rem;
		display: inline-block;
	}

	.category-active::after {
		position: absolute;
		content: '';
		width: 50%;
		height: 8rem;
		background: linear-gradient(180deg, #FB0224 0%, #F56900 100%);
		bottom: 5rem;
		left: 25%;

	}
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
			height: 372rem;
		}
	}
}
</style>