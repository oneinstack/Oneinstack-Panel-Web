<template>
	<x-page :noFooter="true" :fixed="false" ref="colorRefs" :bgcolor="conf.categoryIndex == 1 ? '#A6B4BD' : '#f5f5fa'">
		<template #title>
			<div v-if="(conf.tabIndex / 1000 / 60) >= 1">
				{{ $t('game.color') }}-{{ conf.tabIndex / 1000 / 60 || '' }}
				{{ (conf.tabIndex / 1000 / 60) > 1 ? $t('game.minutes') : $t('game.minute') }}
			</div>
			<div v-else>{{ $t('game.color') }}-{{ conf.tabIndex / 1000 || '' }} {{ $t('game.second') }}</div>
		</template>
		<template #right>
			<div class="right-content">
				<div class="right-text">{{ $t('wallet.balance') }}</div>
				<div class="right-icon">{{ conf.walletMoney }}</div>
			</div>
			<img class="wallet-img" src="/static/img/wallet.webp" />
		</template>
		<template #top>
			<div class="tip">
				<img class="tip-icon" src="/static/img/Frame.png" />
				<div style="width: 100%;overflow: hidden;">
					<div class="tip-content">
						<span>{{ $t('game.colorTips') }}</span>
					</div>
				</div>
			</div>
			<div class="game">
				<div class="game-title">
					<div class="minute" v-if="(conf.tabIndex / 1000 / 60) >= 1">{{ conf.tabIndex / 1000 / 60 }}
						{{ (conf.tabIndex / 1000 / 60) > 1 ? $t('game.minutes') : $t('game.minute') }}
					</div>
					<div class="minute" v-else>{{ conf.tabIndex / 1000 }} {{ $t('game.second') }}1</div>
					<div class="result">{{ conf.lastOpen.openExpect }} {{ $t('game.result') }}:</div>
				</div>
				<div class="game-banner">
					<game-loop :swipeList="conf.bannerList" :target-swipe="conf.colorNum" :autoplay="conf.autoplay">
						<template v-slot="{ item }">
							<div class="swiper">
								<div class="banner-item">
									<img class="img" :src="item.src" />
									<div class="num">{{ item.num }}</div>
								</div>
							</div>
						</template>
					</game-loop>
				</div>
			</div>
			<div class="category" :class="{ 'betCategory': conf.categoryIndex == 1 }">
				<div @click="conf.categoryIndex = 1"><span :class="{ 'category-active': conf.categoryIndex == 1 }">{{
					$t('game.betting') }}</span></div>
				<div @click="conf.categoryIndex = 2"><span :class="{ 'category-active': conf.categoryIndex == 2 }">{{
					$t('game.rule') }}</span></div>
				<div @click="conf.categoryIndex = 3"><span :class="{ 'category-active': conf.categoryIndex == 3 }">{{
					$t('game.resultHistory') }}</span></div>
				<div @click="conf.categoryIndex = 4"><span :class="{ 'category-active': conf.categoryIndex == 4 }">{{
					$t('game.myOrder') }}</span></div>
			</div>
		</template>
		<div style="width: 100%;height: 100%;" :style="{ background: conf.categoryIndex == 1 ? '#A6B4BD' : '#f5f5fa' }">
			<div class="betting" v-if="conf.categoryIndex == 1">
				<img class="box-top" src="/static/img/box-top.png" />
				<div class="time-tabs" v-if="conf.tabs.length">
					<div style="overflow-x: scroll;" ref="tabsRefs">
						<div class="tabs-list">
							<template v-for="(item, index) in conf.tabs" :key="index">
								<div class="tab-item" :class="{ 'tab-active': item.lotteryInterval == conf.tabIndex }"
									@click="conf.changeTab(item, index)">
									<div class="item-content" v-if="(item.lotteryInterval / 1000 / 60) >= 1">
										<span>{{ item.lotteryInterval / 1000 /
											60 }}</span>{{ (item.lotteryInterval /
												1000 / 60) > 1 ? $t('game.minutes') : $t('game.minute') }}
									</div>
									<div class="item-content" v-else>
										<span>{{ item.lotteryInterval / 1000 }}</span>{{ $t('game.second') }}
									</div>
								</div>
							</template>
						</div>
					</div>
				</div>
				<div style="padding: 0rem 20rem;">
					<div class="reckon-box">
						<img class="box-1" src="/static/img/box-1.png" />
						<div class="reckon-container">
							<div class="current-time">
								<div class="time-num">
									<div class="num-item">{{ conf.hour }}</div>
									<span>:</span>
									<div class="num-item">{{ conf.minutes }}</div>
									<span>:</span>
									<div class="num-item">{{ conf.second }}</div>
								</div>
							</div>
							<div class="current-expect">
								<div class="expect-status">
									<div class="periods">{{ conf.currentOpen.openExpect }}</div>
									<div class="status">
										{{ conf.timeStopBet ? $t('game.pauseBetting') : $t('game.betting') +
											'...' }}
									</div>
								</div>
							</div>
							<div class="bar">
								<div class="bar-active" :style="{ 'width': conf.bar + '%' }"></div>
							</div>
							<div class="scale">
								<div class="scale-list" :class="{ 'disabled': conf.timeStopBet }">
									<div class="scale-item"
										@click="conf.changeBet(conf.odds.color_green_status, 'color-green.webp', 'color_green', 'color', 'GREEN')"
										:class="{ 'disabled': conf.odds.color_green_status == 0 }">
										<div class="bg-color" :class="{ 'colorBtn': conf.colorBtnNum == 'GREEN' }">
											<div class="color-name">GREEN</div>
											<div class="color-num">1:{{ conf.greenOdds }}</div>
										</div>
									</div>
									<div class="scale-item"
										@click="conf.changeBet(conf.odds.color_violet_status, 'color-violet.webp', 'color_violet', 'color', 'VIOLET')"
										:class="{ 'disabled': conf.odds.color_violet_status == 0 }">
										<div class="bg-color color-purple"
											:class="{ 'colorBtn': conf.colorBtnNum == 'VIOLET' }">
											<div class="color-name">VIOLET</div>
											<div class="color-num">1:{{ conf.violetOdds }}</div>
										</div>
									</div>
									<div class="scale-item"
										@click="conf.changeBet(conf.odds.color_red_status, 'color-red.webp', 'color_red', 'color', 'RED')"
										:class="{ 'disabled': conf.odds.color_red_status == 0 }">
										<div class="bg-color color-red"
											:class="{ 'colorBtn': conf.colorBtnNum == 'RED' }">
											<div class="color-name">RED</div>
											<div class="color-num">1:{{ conf.redOdds }}</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
					<div class="circle-btn">
						<img class="robot-center" src="/static/img/robot-center.png" />
						<div class="btn-list-box">
							<div class="btn-list" :class="{ 'disabled': conf.timeStopBet }">
								<div class="btn-item"
									@click="conf.changeBet(conf.odds.nums_0_status, 'color2.webp', 'nums_0', 'colorNum', 0)"
									:class="{ 'disabled': conf.odds.nums_0_status == 0 }">
									<div class="btn-bg" :class="{ 'colorBtn': conf.colorBtnNum == 0 }">0</div>
								</div>
								<div class="btn-item"
									@click="conf.changeBet(conf.odds.nums_1_status, 'color-green.webp', 'nums_1', 'colorNum', 1)"
									:class="{ 'disabled': conf.odds.nums_1_status == 0 }">
									<div class="btn-bg color-green" :class="{ 'colorBtn': conf.colorBtnNum == 1 }">1
									</div>
								</div>
								<div class="btn-item"
									@click="conf.changeBet(conf.odds.nums_2_status, 'color-red.webp', 'nums_2', 'colorNum', 2)"
									:class="{ 'disabled': conf.odds.nums_2_status == 0 }">
									<div class="btn-bg color-red" :class="{ 'colorBtn': conf.colorBtnNum == 2 }">2
									</div>
								</div>
								<div class="btn-item"
									@click="conf.changeBet(conf.odds.nums_3_status, 'color-green.webp', 'nums_3', 'colorNum', 3)"
									:class="{ 'disabled': conf.odds.nums_3_status == 0 }">
									<div class="btn-bg color-green" :class="{ 'colorBtn': conf.colorBtnNum == 3 }">3
									</div>
								</div>
								<div class="btn-item"
									@click="conf.changeBet(conf.odds.nums_4_status, 'color-red.webp', 'nums_4', 'colorNum', 4)"
									:class="{ 'disabled': conf.odds.nums_4_status == 0 }">
									<div class="btn-bg color-red" :class="{ 'colorBtn': conf.colorBtnNum == 4 }">4
									</div>
								</div>
								<!-- 大小 -->
								<div class="btn-item"
									@click="conf.changeBet(conf.odds.num_small_status, 'color-blue.png', 'num_small', 'colorNum', 'SMALL')"
									:class="{ 'disabled': conf.odds.nums_10_status == 0 }">
									<div class="btn-bg color-bule" :class="{ 'colorBtn': conf.colorBtnNum == 10 }">
										SMALL
									</div>
								</div>
								<div class="btn-item"
									@click="conf.changeBet(conf.odds.nums_5_status, 'color1.webp', 'nums_5', 'colorNum', 5)"
									:class="{ 'disabled': conf.odds.nums_5_status == 0 }">
									<div class="btn-bg color-5" :class="{ 'colorBtn': conf.colorBtnNum == 5 }">5
									</div>
								</div>
								<div class="btn-item"
									@click="conf.changeBet(conf.odds.nums_6_status, 'color-red.webp', 'nums_6', 'colorNum', 6)"
									:class="{ 'disabled': conf.odds.nums_6_status == 0 }">
									<div class="btn-bg color-red" :class="{ 'colorBtn': conf.colorBtnNum == 6 }">6
									</div>
								</div>
								<div class="btn-item"
									@click="conf.changeBet(conf.odds.nums_7_status, 'color-green.webp', 'nums_7', 'colorNum', 7)"
									:class="{ 'disabled': conf.odds.nums_7_status == 0 }">
									<div class="btn-bg color-green" :class="{ 'colorBtn': conf.colorBtnNum == 7 }">7
									</div>
								</div>
								<div class="btn-item"
									@click="conf.changeBet(conf.odds.nums_8_status, 'color-red.webp', 'nums_8', 'colorNum', 8)"
									:class="{ 'disabled': conf.odds.nums_8_status == 0 }">
									<div class="btn-bg color-red" :class="{ 'colorBtn': conf.colorBtnNum == 8 }">8
									</div>
								</div>
								<div class="btn-item"
									@click="conf.changeBet(conf.odds.nums_9_status, 'color-green.webp', 'nums_9', 'colorNum', 9)"
									:class="{ 'disabled': conf.odds.nums_9_status == 0 }">
									<div class="btn-bg color-green" :class="{ 'colorBtn': conf.colorBtnNum == 9 }">9
									</div>
								</div>
								<!-- 大小 -->

								<div class="btn-item"
									@click="conf.changeBet(conf.odds.num_big_status, 'color-red.webp', 'num_big', 'colorNum', 'BIG')"
									:class="{ 'disabled': conf.odds.nums_11_status == 0 }">
									<div class="btn-bg color-btn-big color-big"
										:class="{ 'colorBtn': conf.colorBtnNum == 11 }">
										BIG
									</div>
								</div>
							</div>
						</div>
					</div>
					<div class="bottom-container">
						<div class="bottom-title">
							<div class="parting-line"></div>
							<span>MY BETS</span>
							<div class="parting-line"></div>
						</div>
						<div class="bottom-roller">
							<div class="printer-box" v-if="conf.selectBetList.length">
								<div class="printer-top"></div>
								<!-- <div class="printer" v-if="openPrinter"></div> -->
								<div class="printer1">
									<template v-for="(item, index) in conf.selectBetList" :key="index">
										<div class="dashed" :style="{ marginTop: index == 0 ? '56rem' : '0rem' }">
										</div>
										<div class="printer-open">
											<div class="printer-back">
												<img class="printer-img" src="/static/img/printer-left.png">
												</img>
												<div class="back-title">color</div>
												<img class="printer-img" src="/static/img/printer-right.png">
												</img>
											</div>
											<div class="printer-content">
												<div class="printer-expect">{{ item.openExpect }}</div>
												<div class="open-content">
													<div class="code">
														<div class="open-item">
															{{ $t('game.BettingCode') }}：{{ item.betNum }}
														</div>
														<div class="open-item">{{ $t('chat.type') }}：color</div>
													</div>
													<div class="open-item">
														{{ $t('game.amount') }}：{{ item.money }}
													</div>
													<div class="open-item">
														{{ $t('game.start') }}：{{
															sutil.getTimeFormat(item.startTime) }}
													</div>
													<div class="open-item">
														{{ $t('game.open') }}：{{
															sutil.getTimeFormat(item.openTime) }}
													</div>
												</div>
											</div>
										</div>
									</template>
									<div id="last-msg-item" style="height: 1px;"></div>
								</div>
							</div>
							<img class="roll-bottom" src="/static/img/roll-bottom.png" />
						</div>
					</div>
					<div class="bottom-container-line"></div>
				</div>
			</div>
			<rule v-if="conf.categoryIndex == 2" :list="conf.lotteryRuleurl"></rule>
			<result v-if="conf.categoryIndex == 3" :tabs="conf.tabs" ref="resultRefs" :selectIndexId="conf.tabIndexId">
			</result>
			<order v-if="conf.categoryIndex == 4" :lotteryId="conf.lotteryId" ref="orderRefs"
				:lotteryOdds="conf.lotteryOdds">
			</order>
		</div>
		<time-popup @close="conf.timePopupShop = false" v-if="conf.timePopupShop"></time-popup>
		<bet-popup :betShow="conf.showBet" :betObj="conf.colorItem" @submit="conf.submit" @share="conf.share"
			:betShare="conf.betShare" :isBetBtnClick="conf.isBetBtnClick"></bet-popup>
	</x-page>
</template>
<script setup lang="ts">
import { apis } from '@/api';
import System from '@/utils/System';
import i18n from '@/lang'
import { onMounted, reactive, ref } from 'vue';
import sbet from '@/sstore/sbet';
import { svalue } from '@/sstore/svalue';
import sutil from '@/sstore/sutil';
import betPopup from '../components/betPopup.vue';
import timePopup from '../components/timePopup.vue';
import gameLoop from '../components/gameLoop.vue'
import rule from '../components/gameRule.vue';
import result from './result.vue'
import order from './order.vue'
import sstatus from '@/sstore/sstatus';

const resultRefs = ref<any>()
const colorRefs = ref<any>()
const tabsRefs = ref<any>()
const conf = reactive({
	colorNum: 0,
	autoplay: true,
	duration: 0,
	bannerList: [{
		num: 0,
		src: '/static/img/color2.webp'
	},
	{
		num: 1,
		src: '/static/img/color-green.webp'
	},
	{
		num: 2,
		src: '/static/img/color-red.webp'
	},
	{
		num: 3,
		src: '/static/img/color-green.webp'
	},
	{
		num: 4,
		src: '/static/img/color-red.webp'
	},
	{
		num: 5,
		src: '/static/img/color1.webp'
	},
	{
		num: 6,
		src: '/static/img/color-red.webp'
	},
	{
		num: 7,
		src: '/static/img/color-green.webp'
	},
	{
		num: 8,
		src: '/static/img/color-red.webp'
	},
	{
		num: 9,
		src: '/static/img/color-green.webp'
	},
	{
		num: 10,
		src: '/static/img/small.webp'
	},
	{
		num: 11,
		src: '/static/img/big.webp'
	}
	],
	categoryIndex: 1,
	tabs: [] as any[],
	tabIndex: 0,
	hour: '00',
	minutes: '00',
	second: '00',
	timer: null as any,
	bar: 100,
	number: 0,
	timePopupShop: false,
	showBet: false,
	colorItem: {} as any,
	showPrinter: false,
	lotteryVOList: [0, 0, 0, 0],
	lastOpen: {} as any,
	currentOpen: {} as any,
	lotteryId: '',
	serviceHeiht: 300,
	timeStopBet: true,
	colorBtnNum: -1 as any,
	lotteryOdds: [],
	openPrinter: false,
	greenOdds: 1,
	violetOdds: 1,
	redOdds: 1,
	odds: {} as any,
	walletMoney: '-',
	openLockCountdown: 10000,
	betShare: false,
	openNum: 0,
	isRequest: false,
	openShow: true,
	countdownNext: 0,
	countdownCurr: 0,
	countdownNum: 0,
	tabIndexId: '',
	lotteryRuleurl: '',
	hasOpenCodeTimer: null as any,
	noOpenCodeTimer: null as any,
	selectBetList: [] as any,
	scrollIntodiv: '',
	scrollTop: 0,
	isBetBtnClick: true,
	gameType: 'Color',
	defaultWalletInfo: {} as any,
	changeTab(item: any, index: number) {
		if (conf.tabIndex == item.lotteryInterval) return;
		conf.tabIndexId = item.id
		conf.tabIndex = item.lotteryInterval
		conf.openLockCountdown = item.openLockCountdown
		conf.selectBetList = []
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
		sstatus.getscrollLeft(tabsRefs,600, index, 180)
		
	},
	// 获取时间tab
	getLotteryList(index: any) {
		apis.lotteryList({
			success: (res: any) => {
				let datas = res.data
				let newIndex = datas.findIndex((item: any) => item.lotteryTypeVO.lotteryTypeCode ==
					'COLOR')
				conf.tabs = datas[newIndex].lotteryVOList
				conf.lotteryRuleurl = conf.tabs[index]?.lotteryRuleurl
				conf.tabIndex = conf.tabs[index].lotteryInterval
				conf.tabIndexId = conf.tabs[index].id
				conf.openLockCountdown = conf.tabs[index].openLockCountdown
				if (conf.timer) {
					clearInterval(conf.timer);
					conf.timer = null;
				}
				conf.getLotteryOpen(conf.tabs[index].id)
				conf.getLotteryOdds(conf.tabs[index].lotteryTypeId)
				// if (index > 1) conf.scrollLeft = index * 30
			}
		});
	},
	// 获取赔率
	getLotteryOdds(lotteryTypeId: any) {
		System.loading()
		apis.lotteryOdds({
			lotteryTypeId,
			lotteryTypeCode: "COLOR",
			success: (res: any) => {
				conf.lotteryOdds = res.data.map((item: any) => {
					return {
						orderType: item.oddsCode.split('_')[1],
						...item
					}
				})
				res.data.forEach((item: any) => {
					if (item.oddsCode == 'color_green' && item.odds) {
						conf.greenOdds = parseFloat(item.odds)
					}
					if (item.oddsCode == 'color_violet' && item.odds) {
						conf.violetOdds = parseFloat(item.odds)
					}
					if (item.oddsCode == 'color_red' && item.odds) {
						conf.redOdds = parseFloat(item.odds)
					}
					conf.odds[item.oddsCode + '_status'] = item.oddsStatus
				})
			},
			final: () => {
				System.loading(false)
			}
		});
	},
	// 获取开奖信息
	getLotteryOpen(lotteryId: any) {
		lotteryId && (conf.lotteryId = lotteryId)
		if (!conf.autoplay) {
			conf.duration = 150
			conf.autoplay = true
		}
		apis.lotteryOpen({
			lotteryId: lotteryId || conf.lotteryId,
			success: (res: any) => {
				if (res.code == 200) {
					let cdata = res.data
					conf.currentOpen = cdata.currentOpen
					if (conf.openShow) {
						if (cdata.currentOpen) conf.openShow = false
						let currentOpen = cdata.currentOpen.openTime
						conf.countdownCurr = parseInt(currentOpen) - parseInt(cdata.currentSystemTime)
						let currentNext = cdata.nextOpen.openTime
						conf.countdownNext = parseInt(currentNext) - parseInt(cdata.currentSystemTime)

						conf.countdownNum = conf.countdownCurr
						conf.setTime()
					}
					conf.lastOpen = cdata.lastOpen
					conf.setCode(cdata.lastOpen.openCode)
					if (conf.openPrinter) conf.openPrinter = false
					let openCode = cdata.lastOpen.openCode
					if (!openCode && !conf.isRequest) {
						conf.colorNum = 0
						// if (conf.timer) {
						// 	clearTimeout(conf.timer);
						// 	conf.timer = null;
						// }
						conf.noOpenCodeTimer = setTimeout(() => {
							conf.getLotteryOpen(conf.lotteryId)
						}, 1000)
					}
				} else {
					conf.minutes = '00'
					conf.second = '00'
					conf.bar = 100
					conf.lastOpen = {}
					conf.currentOpen = {}
					conf.colorNum = 0
					conf.timeStopBet = true
					if (res.code == '1306' && conf.openNum < 6) {
						conf.hasOpenCodeTimer = setTimeout(() => {
							conf.openNum++
							if (conf.timer) {
								clearInterval(conf.timer);
								conf.timer = null;
							}
							conf.getLotteryOpen(conf.lotteryId)
						}, 2000)
					} else {
						System.toast(i18n.t(`code.${res.code}`))
					}
				}
			}
		});
	},
	// 开奖结果轮播滚动
	setCode(code: any) {
		if (!code) return;
		conf.autoplay = false;
		conf.duration = 0
		conf.colorNum = parseInt(code)
		setTimeout(() => {
			let list = sbet.getColorBet(conf.currentOpen.lotteryId, conf.currentOpen.openExpect)
			conf.selectBetList = list
		}, 1000)
		if (conf.categoryIndex == 3) resultRefs.value?.initResult(conf.lotteryId)
		// if (conf.categoryIndex == 4 && conf.isLogin()) conf.$refs.orderRefs.initOrder()
		setTimeout(() => {
			// 更新钱包金额
			conf.getWalletMoney(2)
		}, 5000)
		conf.openShow = true
	},
	setTime() {
		conf.timeStopBet = false
		conf.betShare = false
		if (conf.timer) return;
		conf.timer = setInterval(() => {
			if (conf.countdownNum > 0) {
				conf.getCountDown(conf.countdownNum)
				if (conf.countdownNum <= 20000 && !conf.betShare) conf.betShare = true
				if (!conf.timeStopBet && conf.countdownNum <= conf.openLockCountdown) {
					conf.timeStopBet = true
					conf.submit(0)
				}
				if (Math.round(conf.countdownNum / 1000) == 3) conf.timePopupShop = true
			} else {
				if (!conf.autoplay) {
					conf.duration = 150
					conf.autoplay = true
				}
				conf.openShow = true
				conf.countdownNum = conf.countdownNext
				conf.getCountDown(conf.countdownNum)
				if (conf.timer) {
					clearInterval(conf.timer);
					conf.timer = null;
				}
				conf.getLotteryOpen(conf.currentOpen.lotteryId)
			}
			conf.bar = conf.countdownNum / conf.tabIndex * 100
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
	// 选择下注项 参数：图片地址 接口返回数据 类型 数字
	changeBet(status: any, n: any, adds: any, t: any, s: any) {
		if (status == 0) return;
		if (conf.timeStopBet) return;
		conf.colorBtnNum = s
		conf.lotteryOdds.forEach((item: any) => {
			if (item.oddsCode == adds) {
				conf.colorItem = item
				return
			}
		})
		conf.colorItem['betImg'] = n
		conf.colorItem['betType'] = t || ''
		conf.colorItem['betNum'] = s || 0
		conf.openPrinter = false
		conf.showBet = true
	},
	// 下注
	submit(e: any) {

		conf.colorBtnNum = -1
		if (!e) return conf.showBet = false
		conf.colorItem['money'] = e
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

		System.loading()
		apis.lotteryUserBets({
			money: e,
			betCodes: conf.colorItem.oddsCode,
			betExpect: conf.currentOpen.openExpect,
			betOpenId: conf.currentOpen.lotteryOpenId,
			lotteryId: conf.currentOpen.lotteryId,
			lotteryOddsId: conf.colorItem.oddsId,
			multiple: 1,
			nums: 1,
			supplement: 0,
			walletCoinCode: conf.defaultWalletInfo.walletCoin,
			success: (res: any) => {
				conf.openPrinter = true
				conf.getWalletMoney(2)
				let betObj = {
					openExpect: conf.currentOpen.openExpect,
					startTime: conf.currentOpen.startTime,
					openTime: conf.currentOpen.openTime,
					betNum: conf.colorItem.betNum,
					money: e,
					lotteryId: conf.currentOpen.lotteryId
				}
				sbet.setColorBet(betObj)
				let list = sbet.getColorBet(conf.currentOpen.lotteryId, conf.currentOpen.openExpect)
				conf.selectBetList = list
				conf.showBet = false
				// conf.scrollToBottom()
				if (conf.selectBetList.length == 1) {
					setTimeout(() => {
						colorRefs.value.toBottom()
					}, 300)
				}
			},
			final: () => {
				conf.showBet = false
				System.loading(false)
			}
		});
	},
	share(e: any) {
		let type = conf.tabIndex
		let orderType = ''
		let openTime = sutil.getTimeFormat(conf.currentOpen.openTime, 2)
		if ((type / 1000 / 60) >= 1) {
			orderType = 'Color-' + (type / 1000 / 60) + ' Minute'
		} else {
			orderType = 'Color-' + (type / 1000) + ' Second'
		}
		let obj = {
			lotteryId: conf.currentOpen.lotteryId,
			money: e.money,
			betCodes: conf.colorItem.oddsCode,
			betExpect: conf.currentOpen.openExpect,
			betOpenId: conf.currentOpen.lotteryOpenId,
			lotteryOddsId: conf.colorItem.oddsId,
			betImg: conf.colorItem.betImg,
			betNum: conf.colorItem.betNum,
			betType: conf.colorItem.betType,
			isPlace: false,
			orderType,
			openTime
		}
		conf.showBet = false
		Cookie.set('roomOrder', JSON.stringify(obj))
		if (e.type == 2) {
			System.router.push('/user/chat/chat?id=' + e.roomId + '&room=' + e.roomName + '&banned=' + e.roomBanned +
				'&admin=' + e.roomAdmin + '&type=3')
		} else {
			System.router.push('/user/chat/room?type=3')
		}
	},
	// 获取钱包金额
	async getWalletMoney(type: number) {
		let item = await svalue.getDefaultWallet()
		if (item.hasOwnProperty('coinSymbol')) {
			conf.defaultWalletInfo = item
			let m = parseFloat(item.walletMoney)
			conf.walletMoney = (item.coinSymbol || '₹') + sutil.dataHandling(m)
		}
	},
})
onMounted(() => {
	conf.getLotteryList(0)
	conf.getWalletMoney(1)
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

.tip {
	display: flex;
	align-items: center;
	padding: 0rem 24rem;
	height: 80rem;
	background: #FFF9ED;
	width: 100%;

	.tip-icon {
		width: 32rem;
		height: 32rem;
		margin-right: 16rem;
		flex-shrink: 0;
	}

	.tip-content {
		font-size: 26rem;
		color: #45454d;
		font-weight: 500;
		display: inline-block;
		white-space: nowrap;
		animation: u-loop-animation 20s linear infinite both;
		text-align: right;
		// 这一句很重要，为了能让滚动左右连接起来
		padding-left: 100%;
		flex-wrap: nowrap;
	}

	@keyframes u-loop-animation {
		0% {
			transform: translate3d(0, 0, 0);
		}

		100% {
			transform: translate3d(-100%, 0, 0);
		}
	}
}

.game {
	padding: 24rem 40rem;
	display: flex;
	justify-content: space-between;
	align-items: center;
	background: #FFFEF8;
	width: 100%;

	.game-title {
		font-weight: bold;

		.minute {
			font-size: 32rem;
		}

		.result {
			// margin-top: 6rem;
			font-size: 24rem;
		}
	}

	.game-banner {
		flex: 1;
		background: #B0AEA0;
		border-radius: 12rem;
		margin-left: 60rem;
		height: 75rem;

		.swiper {
			display: flex;
			justify-content: center;
			align-items: center;
			height: 100%;
		}

		.banner-item {
			position: relative;
			width: 64rem;
			height: 64rem;

			.img {
				position: absolute;
				top: 0;
				bottom: 0;
				width: 100%;
			}

			.num {
				position: absolute;
				top: 0rem;
				bottom: 0rem;
				width: 100%;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 32rem;
				color: #FFF;
			}
		}
	}
}

.category {
	height: 120rem;
	background: #FFFFFF;
	background: linear-gradient(180deg, #FFF 0%, #EDEFF5 100%);
	padding: 0rem 20rem 10rem;
	// border-bottom: 3rem solid #eee;
	display: flex;
	justify-content: space-between;
	align-items: center;

	&.betCategory {
		background: linear-gradient(180deg, #CBD5DD 0%, #DAE4EA 100%);
	}

	div {
		font-size: 28rem;
		font-weight: 500;
		color: #45454d;
		// flex: 1;
		padding: 0rem 24rem;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.category-active {
		position: relative;
		height: 100%;
		color: #252529;
		font-weight: 700;
		line-height: 72rem;
		display: inline-block;
	}

	.category-active::after {
		position: absolute;
		content: '';
		width: 50%;
		height: 8rem;
		background: #D90000;
		bottom: 5rem;
		left: 25%;

	}
}

.betting {
	background: #A6B4BD;
	padding-bottom: 300rem;
	min-height: 100%;
	display: flex;
	flex-direction: column;
	padding: 0rem 10rem;
	width: 100%;

	.box-top {
		width: 100%;
		height: 24rem;
		margin-top: 15rem;
	}

	.time-tabs {
		// background: linear-gradient(180deg,#D1DBE2 0%,#B0BFC7 100%);
		background: linear-gradient(180deg, #D0DAE1 0%, #B2C0C8 100%);
		padding: 12rem 40rem;
		border-top: 2rem solid #F3F3F3;

		.tabs-list {
			display: flex;
			// overflow-x: auto;
			align-items: flex-end;

			.tab-item {
				// background: #FFF;
				background: #BECBD2;
				box-shadow: 4rem 4rem 7.6rem 0px rgba(0, 0, 0, 0.10), -4px -4px 7.6rem 0px rgba(255, 255, 255, 0.20);
				border-radius: 8rem;
				height: 84rem;
				padding: 0rem 24rem;
				display: flex;
				justify-content: center;
				align-items: center;
				margin-left: 8rem;

				.item-content {
					display: flex;
					align-items: center;
					font-size: 24rem;
					font-weight: 700;
					color: #000;

					span {
						margin-right: 16rem;
						font-size: 40rem;
						font-weight: bold;
					}
				}

				&.tab-active {
					border-top: 4rem solid #A6B4BD;
					background: #D8E3E8;
					box-shadow: 4rem 4rem 7.6rem 0px rgba(0, 0, 0, 0.10) inset, -4rem -4rem 7.6rem 0px rgba(255, 255, 255, 0.20) inset;
				}
			}
		}
	}

	.reckon-box {
		padding: 0rem 42rem;
		margin-top: 16rem;
		display: flex;
		flex-direction: column;

		.box-1 {
			width: 100%;
			height: 22rem;
		}

		.reckon-container {
			background: linear-gradient(180deg, #D1DBE2 0%, #B0BFC7 100%);

			.current-time {
				display: flex;
				align-content: center;
				justify-content: center;

				.time-num {
					display: flex;
					align-items: center;
					margin: 28rem 0rem 22rem;

					.num-item {
						width: 100rem;
						height: 100rem;
						font-size: 66rem;
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
						margin: 0rem 5rem;
					}
				}
			}

			.current-expect {
				margin: 0rem 90rem 16rem;

				.expect-status {
					display: flex;
					justify-content: center;
					border-radius: 10rem;
					background: #677A84;
					box-shadow: 2px 2px 4px 0px rgba(0, 0, 0, 0.25) inset, -2px -2px 4px 0px rgba(255, 255, 255, 0.10) inset;
					padding: 14rem 0rem;
					color: #FFF;
					font-size: 26rem;
					font-weight: 600;

					.status {
						margin-left: 10rem;
					}
				}
			}

			.bar {
				height: 12rem;
				background: #8998A1;

				.bar-active {
					height: 100%;
					background: #D90000;
				}
			}

			.scale {
				background: #c8d2d8;
				height: 174rem;
				padding: 0rem 24rem;

				.scale-list {
					display: flex;
					justify-content: space-between;
					align-items: center;
					height: 100%;

					.scale-item {
						height: 104rem;
						flex: 1;
						border-radius: 16rem;
						background: #A2B0BA;
						box-shadow: 0 4rem 4rem #00000040 inset, 0 2rem #ffffff40;
						margin-right: 14rem;
						padding: 0rem 10rem;

						.bg-color {
							border: 1px solid rgba(255, 255, 255, .22);
							background: linear-gradient(180deg, #32C94A 0%, #1D9F32 100%);
							box-shadow: 0 12rem #18982C;
							border-radius: 16rem;
							font-size: 28rem;
							color: #FFF;
							height: 87rem;
							display: flex;
							flex-direction: column;
							justify-content: center;
							align-items: center;
							margin-top: -8rem;

							.color-num {
								margin-top: 4rem;
							}
						}

						.color-purple {
							border: 1px solid rgba(255, 255, 255, .29);
							background: linear-gradient(180deg, #9154EA 0%, #7027D6 100%);
							box-shadow: 0 12rem #7922E7;
						}

						.color-red {
							border: 1px solid rgba(255, 255, 255, .26);
							background: linear-gradient(180deg, #D90029 0%, #BE0505 100%);
							box-shadow: 0 12rem #BB1212;
						}
					}
				}
			}
		}
	}

	.circle-btn {
		height: 276rem;
		position: relative;

		.robot-center {
			width: 100%;
			height: 100%;
		}

		.btn-list-box {
			position: absolute;
			top: 24rem;
			bottom: 0rem;
			left: 56rem;
			right: 56rem;

			.btn-list {
				display: flex;
				justify-content: space-between;
				flex-wrap: wrap;

				.btn-item {
					width: 16.5%;
					height: 90rem;
					border-radius: 50%;
					background: #a2b0ba;
					// margin-right: 16rem;
					margin-bottom: 14rem;
					display: flex;
					justify-content: center;

					.btn-bg {
						border: 1px solid rgba(255, 255, 255, .26);
						background: linear-gradient(180deg, #D90029 0%, #CB0B0B 51.5%, #9154EA 53.59%, #7027D6 100%);
						box-shadow: 0 12rem #4e00b1;
						width: 80%;
						height: 72rem;
						border-radius: 50%;
						font-size: 36rem;
						font-weight: bold;
						display: flex;
						justify-content: center;
						align-items: center;
						color: #FFF;
					}

					.color-5 {
						background: linear-gradient(180deg, #32C94A 0%, #1D9F32 51%, #9154EA 50%, #7027D6 100%);
						box-shadow: 0 12rem #4e00b1;
					}

					.color-green {
						// background: linear-gradient(180deg,#007D14 0%,#009919 100%);
						background: linear-gradient(180deg, #35D14E 0%, #19992E 100%);
						box-shadow: 0 12rem #18972c;
					}

					.color-bule {
						background: linear-gradient(180deg, #27B2F6 0%, #0080C7 100%);
						box-shadow: 0 12rem #0080C7;
						font-size: 18rem;
					}

					.color-big {
						font-size: 28rem;
					}

					.color-red {
						background: linear-gradient(180deg, #D90029 0%, #BE0505 100%);
						box-shadow: 0 12rem #BB1212;
					}

					.color-btn-big {
						border: 1px solid rgba(255, 255, 255, .26);
						background: linear-gradient(180deg, #ea6332 0%, #EB602D 100%);
						box-shadow: 0 12rem #d4572a;
					}
				}
			}
		}
	}

	.disabled {
		filter: grayscale(1);
	}

	.colorBtn {
		color: red;
		animation: colorBtn 0.3s forwards;
	}

	@keyframes colorBtn {
		0% {
			margin-top: 0rem;
			box-shadow: 0 12rem #a2b0ba;
		}

		100% {
			box-shadow: 0 0rem #a2b0ba;
			margin-top: 12rem;
		}
	}

	.bottom-container {
		height: 245rem;
		background: #B5C3CB;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;

		.bottom-title {
			display: flex;
			align-items: center;
			justify-content: space-between;
			width: 672rem;

			span {
				font-size: 26rem;
				margin: 0rem 64rem;
			}

			.parting-line {
				flex: 1;
				height: 26rem;
				background: url('/static/img/parting-line.png') no-repeat 100%/100%;
			}
		}

		.bottom-roller {
			width: 622rem;
			height: 128rem;
			border-radius: 15rem;
			background: linear-gradient(180deg, #4B5961 0%, #80929C 100%);
			box-shadow: -1px 4rem #ffffff40;
			margin-top: 26rem;
			position: relative;

			// overflow: hidden;
			.printer-box {
				position: relative;
				top: 20rem;
				margin-bottom: 20rem;
				// overflow: hidden;
				// height: 576rem;
				z-index: 7;

				.printer-top {
					position: absolute;
					left: 14rem;
					right: 14rem;
					z-index: 9;
					top: 0rem;
					height: 20rem;
					border-radius: 42rem;
					background: linear-gradient(180deg, #B5C3CB 0%, #5A6B73 100%);
				}

				.printer1 {
					// width: 100%;
					background: #FFFEF8;
					border-radius: 10rem;
					position: absolute;
					left: 30rem;
					right: 30rem;
					top: 0rem;
					// animation: progress 2s forwards;
					// transition: height 2s;

					.dashed {
						width: 100%;
						border: 1px dashed #62737B;
						// margin-top: 56rem;
					}

					.printer-open {
						height: 320rem;
						position: relative;
						left: 0;
						right: 0;
						background: #FFFEF8;
						border-radius: 10rem;

						.printer-back {
							width: 100%;
							height: 100%;
							display: flex;
							justify-content: space-between;
							align-items: center;
							border-radius: 10rem;

							.printer-img {
								width: 66rem;
								height: 100%;
								border-radius: 42rem;
								border-radius: 10rem;
							}

							.back-title {
								color: #E20000;
								font-weight: 600;
								font-family: PingFang SC;
								font-size: 150rem;
								opacity: 0.1;
							}
						}

						.printer-content {
							position: absolute;
							top: 0;
							right: 0;
							left: 0;
							bottom: 0;

							.printer-expect {
								text-align: center;
								color: #000;
								font-size: 32rem;
								font-weight: 600;
								margin-top: 16rem;
							}

							.open-content {
								color: #000;
								font-size: 24rem;
								font-weight: 400;
								padding: 0rem 40rem;

								.code {
									display: flex;
									justify-content: space-between;
								}

								.open-item {
									margin-top: 25rem;
								}
							}
						}
					}
				}

				// .printer-open{
				// 	animation: progress 2s forwards;
				// }
				@keyframes progress {
					0% {
						top: -376rem;
					}

					100% {
						top: 0rem;
					}
				}
			}

			.roll-bottom {
				position: absolute;
				bottom: 0;
				left: 0;
				height: 46rem;
				width: 100%;
			}
		}
	}

	.bottom-container-line {
		height: 24rem;
		width: 100%;
		border-top: 1px solid rgba(255, 255, 255, .65);
		background: linear-gradient(180deg, #ACC3D1 0%, #96A6B0 100%);
	}
}
</style>