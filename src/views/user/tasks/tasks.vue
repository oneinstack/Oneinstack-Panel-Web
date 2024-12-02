<template>
	<x-page no-footer :bgcolor="'#f1f1f1'" :headerBgColor="conf.bgcolor" :topfill="false">
		<template #title>
			{{ $t('task.Task') }}
		</template>
		<template #right>
			<div class="head-right" @click="conf.goPage('/user/tasks/myTask')">
				<img class="img" src="/static/img/myTask.png" mode="" />
			</div>
		</template>
		<sign-remind :show="conf.signTip" :sigNum="conf.sigTotal"></sign-remind>
		<div class="head">
			<div style="padding:0 20rem;">
				<x-statusbar />
				<div style="height: 104rem"></div>
				<div class="points flex-between">
					<div class="left-total items-center">
						<div v-if="conf.showMall">
							<span>{{ conf.changePointNum(conf.userVipIntegral) }}</span>{{ $t('point.points') }}
						</div>
						<div @click.stop="conf.goPage('/user/luckybox/index')" class="items-center"><span
								style="margin-left: 20rem;">{{ conf.boxCount }}</span>{{ $t('point.luckyBox') }}</div>
						<img src="/static/img/task/black-arrow.png" />
					</div>
					<div class="ponints-mall items-center" @click.stop="conf.goPage('/user/point/point')"
						v-if="conf.showMall">
						<img class="points-mall-img" src="/static/img/task/points-mall.png" />
						<span>{{ $t('point.pointsMall') }}</span>
					</div>
				</div>
				<div class="sign-time" v-if="conf.showSign">
					<!-- 连续签到和签到提醒开关 -->
					<div class="flex-between">
						<div class="title-left">
							<div>{{ $t('point.SigningIn') }} <span>{{ conf.sigTotal }}</span> {{ conf.sigTotal > 1 ?
								$t('point.days')
								:
								$t('agencyCenterModule.day') }}</div>
							<img @click="conf.changeTips" class="tips" src="/static/img/task/sign-tips.png" />
						</div>
						<div class="title-right items-center">
							<span>{{ $t('point.SignReminder') }}</span>
							<van-switch v-model="conf.checked" active-color="#FFA64F" style="transform:scale(0.7)"
								@change="conf.switch1Change" />
						</div>
					</div>
					<!-- <div class="line"></div> -->
					<!-- 上/下月份选择 -->
					<div class="select-time flex-between">
						<img class="select-arrow" v-if="!conf.selectDateNo" src="/static/img/task/sign-select.png"
							@click="conf.prevMonth" />
						<img class="select-arrow arrow-right" v-else src="/static/img/task/sign-select-no.png">
						</img>
						{{ conf.dateNum }}
						<img class="select-arrow arrow-right" v-if="!conf.nextDateNo"
							src="/static/img/task/sign-select.png" @click="conf.nextMonth" />
						<img class="select-arrow" v-else src="/static/img/task/sign-select-no.png" />
					</div>
					<loading :type="2" v-if="conf.signLading && !conf.calendar.length"></loading>
					<div class="time-box"
						:style="{ 'height': !conf.moreDayShow ? '180rem' : conf.calendar.length > 28 ? '650rem' : '520rem' }"
						v-if="conf.calendar.length">
						<!-- 隐藏时显示今天的日期列 -->
						<div class="time-list" :class="{ 'transitionTime': conf.moreDayShow }"
							:style="{ 'margin-top': !conf.moreDayShow ? conf.showSignLine * -132 + 'rem' : '0rem' }">
							<template v-for="(item, index) in conf.calendar" :key="index">
								<div class="time-item time-active"
									v-if="item.year == conf.today[2] && item.moon == conf.today[0] && item.num == conf.today[1]">
									<img class="task-sign-img" v-if="conf.getIsPoint(item.num, item.moon, item.year)"
										src="/static/img/task/task-sign.png" />
									<div class="time-img" v-else>
										<img class="day-point-img" src="/static/img/task/day-point.png" />
										<div class="point-num">{{ conf.getPointNum(item.num, item.moon) }}</div>
									</div>
									<div class="day-today">{{ $t('point.today') }}</div>
								</div>
								<div class="time-item"
									:style="{ 'background': conf.getIsPoint(item.num, item.moon, item.year) ? '#FFF3EB' : '#F8F8F9' }"
									v-else-if="item.year == conf.today[2] && item.moon <= conf.today[0]">
									<!-- 时间没到 -->
									<div class="time-img" v-if="item.moon == conf.today[0] && item.num > conf.today[1]">
										<img class="day-point-img" src="/static/img/task/day-point.png" />
										<div class="point-num">{{ conf.getPointNum(item.num, item.moon) }}</div>
									</div>
									<!-- 已签到 -->
									<img class="task-sign-img"
										v-else-if="conf.getIsPoint(item.num, item.moon, item.year)"
										src="/static/img/task/task-sign.png" />
									<!-- 未签到 -->
									<div class="miss" v-else>{{ $t('point.miss') }}</div>
									<div class="dat-num">{{ item.moon == 13 ? 1 : item.moon }}.{{ item.num }}</div>
								</div>
								<div class="time-item" v-else>
									<div class="time-img">
										<img class="day-point-img" src="/static/img/task/day-point.png" />
										<div class="point-num">{{ conf.getPointNum(item.num, item.moon) }}</div>
									</div>
									<div class="dat-num">{{ item.moon == 13 ? 1 : item.moon }}.{{ item.num }}</div>
								</div>
							</template>
							<div class="time-item" style="background: none;" v-for="item in (35 - conf.calendar.length)"
								:key="item + '-'" v-if="conf.calendar.length < 35"></div>
						</div>
						<!-- 显示/隐藏更多 -->
						<div class="mask-more" @click="conf.moreDayShow = !conf.moreDayShow"
							:class="{ 'mask-more-up': conf.moreDayShow }">
							<img class="more-img" src="/static/img/task/black-arrow.png" />
						</div>
					</div>
					<div class="sign-btn flex-center" :class="{ 'disabled': conf.selectSignBtn() }"
						@click="conf.clickPointsSign" v-if="conf.calendar.length">{{ $t('point.signIn') }}</div>
				</div>
				<!-- 任务列表 -->
				<task-list :taskList="conf.taskList" :defalutWallet="conf.defalutWallet"
					v-if="conf.defalutWallet && conf.taskList.length"></task-list>
				<loading v-if="!conf.taskList.length && (conf.taskLoading || !conf.defalutWallet)"></loading>
				<div class="no-task" v-if="!conf.taskLoading && !conf.taskList.length">
					<img class="no-task-img" mode="widthFix" src="/static/img/task/not-data.png" />
					<div class="no-txt">{{ $t('point.noTasks') }}</div>
				</div>
			</div>
		</div>
		<sign-pop ref="signPopRefs"></sign-pop>
	</x-page>
</template>

<script setup lang="ts">
import { sconfig } from '@/sstore/sconfig';
import { svalue } from '@/sstore/svalue';
import taskList from './components/taskList.vue';
import loading from './components/loading.vue'
import signRemind from './components/signRemind.vue';
import signPop from './components/signPop.vue';
import { onMounted, reactive, ref } from 'vue';
import System from '@/utils/System';
import { apis } from '@/api';
import i18n from '@/lang';
import StatusBarConfig from '@/utils/StatusBarConfig';
import sutil from '@/sstore/sutil';
import { Scope } from 'tools-vue3';
import { EPage } from '@/enum/Enum';

const signPopRefs = ref<any>()
const conf = reactive({
	bgcolor: '',
	isHeadFixed: false,
	moreDayShow: false,
	calendar: [] as any[],
	showSignLine: 0,
	selectDateNo: false,
	nextDateNo: false,
	showDate: new Date(),
	dateNum: '',
	today: [] as any[],
	taskList: [] as any[],
	detailData: [] as any[],
	userVipIntegral: 0,
	userInfo: null as any,
	pointConfig: {} as any,
	signRecord: [] as any[],
	continueDays: 0,
	continueRewardList: [] as any[],
	maxNumArr: [7, 0],
	sigTotal: 0,
	boxCount: 0,
	taskLoading: true,
	defalutWallet: null,
	signLading: false,
	showSign: true,
	showMall: true,
	signTip: false,
	checked: false,
	months: 0,
	serveOffset: -1,
	isSignTip: false,
	remianDays: 0,
	// 获取系统时间
	getTime() {
		apis.system({
			success: (res: any) => {
				let data = res.data
				let offset = new Date().getTimezoneOffset() * 60000 * -1
				conf.serveOffset = data.offset1 - offset + (new Date().getTime() - data.currentTime)
				let t = (new Date(data.currentTime).Format())
			},
			final: () => {
				System.loading(false)
			}
		})
	},
	// 下一次签到倒计时
	changeTips() {
		let t = (new Date().Format())
		let t1 = t.split(' ')[0] + ' 23:59:59'
		let t3 = conf.getHour(t, t1, conf.serveOffset)
		let isSign = conf.selectSignBtn(false)
		signPopRefs.value?.showPop({
			array: t3,
			isSign,
			show: true
		})
	},
	getHour(s1: any, s2: any, offset: any) {
		s1 = new Date(s1.replace(/-/g, '/'));
		s2 = new Date(s2.replace(/-/g, '/'));
		let ms = s2.getTime() - s1.getTime() - offset
		let dy = 24 * 60 * 60 * 1000
		if (ms >= dy) ms = ms - dy
		if (ms < 0) return 0;
		let num = Math.ceil(ms / 1000 / 60)
		let h = Math.floor(num / 60)
		let m = num % 60
		return [h, m, ms]
	},
	// 判断是今天否签到
	selectSignBtn(last = true) {
		if (conf.calendar.length && (conf.calendar[0].year != conf.today[2] || conf.calendar[0].moon != conf.today[0])) return true
		let isSign = conf.getIsPoint(conf.today[1])
		if (isSign) return isSign
		let t = (new Date().Format())
		let t1 = t.split(' ')[0] + ' 23:59:59'
		let arr: any = conf.getHour(t, t1, conf.serveOffset)
		let offset = conf.serveOffset > 0 ? conf.serveOffset : -conf.serveOffset
		if (arr[2] >= offset) return false
		let lastDay = parseInt(conf.today[1]) - 1
		let lastMonth = this.getLastMonthDay()
		if (conf.today[1] == 1) {
			lastDay = lastMonth.getDate()
		}
		if (last && lastDay > 0) {
			let y = lastMonth.getFullYear()
			let m = lastMonth.getMonth() + 1
			let lastSign = conf.getIsPoint(lastDay, m, y)
			return lastSign
		}
		return true
	},
	// 获取积分和宝箱数据
	getUserPoint(userId: string) {
		apis.getUserPoint({
			userId,
			success: (res: any) => {
				let pointNum = res.data.userVipIntegral || 0
				conf.userVipIntegral = parseInt(pointNum)
				conf.boxCount = res.data.boxCount
			}
		});
	},
	//获取列表数据
	getPointsList(userId: any) {
		conf.signLading = true
		apis.getPointsList({
			userId,
			months: conf.months,
			success: (res: any) => {
				conf.pointConfig = res.data.config
				conf.signRecord = res.data.signRecord
				if (conf.pointConfig.continueReward) conf.continueRewardList = JSON.parse(conf.pointConfig.continueReward)
				if (conf.continueRewardList.length) conf.maxNumArr[0] = conf.continueRewardList[conf.continueRewardList.length - 1].signDays
				conf.setCalendar()
			},
			final: () => {
				conf.signLading = false
			}
		});
	},
	//签到
	clickPointsSign(userId: any) {
		if (conf.getIsPoint(conf.today[1])) {
			System.toast(i18n.t('code.2605'))
			return
		}
		System.loading()
		apis.clickPointsSign({
			userId: conf.userInfo.userId,
			configId: conf.pointConfig.id,
			success: (res: any) => {
				conf.userVipIntegral = res.data.userVipIntegral
				System.toast(i18n.t('point.signSuccess'), 'success')
				let belongDate = `${conf.today[2]}${conf.today[0]}${conf.today[1]}`
				conf.signRecord.push({ belongDate })
				conf.sigTotal++
			},
			final: () => {
				System.loading(false)
			}
		});
	},
	// 判断是否签到
	getIsPoint(day: any, month = null as any, year = null as any) {
		if (!conf.signRecord || !conf.calendar.length) return false
		if (!year) year = conf.today[2]
		if (!month) month = conf.today[0]
		month = ('0' + month).slice(-2)
		day = ('0' + day).slice(-2)
		let time = `${year}${month}${day}`
		let pointItem = conf.signRecord.find(item => {
			return item.belongDate == time
		})
		return pointItem
	},
	// 获取签到的积分
	getPointNum(num: number, moon: number) {
		let today = num - conf.today[1]
		if (moon > parseInt(conf.today[0])) {
			today = num + conf.remianDays
		}
		let dayNum = conf.maxNumArr[1] + today + 1
		let maxDays = conf.maxNumArr[0]
		dayNum = dayNum > maxDays ? maxDays : dayNum
		let curent = conf.continueRewardList.find(item => {
			return item.signDays == dayNum
		})
		if (curent) return curent.continuePoints
		let arr = conf.continueRewardList.filter(item => {
			return item.signDays <= dayNum
		})
		if (arr.length) return arr[arr.length - 1].continuePoints
		return conf.pointConfig.dailyReward || 1
	},
	//获取列表数据
	getTaskList() {
		conf.taskLoading = true
		apis.getTaskList({
			success: (res: any) => {
				conf.taskList = res.data || []
			},
			final: () => {
				conf.taskLoading = false
			}
		});
	},
	switch1Change(e: any) {
		conf.checked = e
		Cookie.set('signReminder', e)
	},
	goPage(url: any) {
		System.router.push(url)
	},
	// 获取日期数据
	setCalendar() {
		conf.calendar = []
		conf.showSignLine = 0
		let t = 0 < arguments.length && void 0 !== arguments[0] ? arguments[0] : new Date(conf.showDate)
		t.setDate(0)
		let e = {} as any, a, n, i, m = t.getMonth() + 1
		conf.dateNum = Date.Format(t, 'yyyy.MM')
		let o = t.getDate()
		for (i = 1; i <= o; i++) ((e = {} as any).num = i), (e.moon = m), (e.year = t.getFullYear()), conf.calendar.push(e)
		
		let date = new Date()
		conf.today[0] = ('0' + (date.getMonth() + 1)).slice(-2)
		conf.today[1] = ('0' + date.getDate()).slice(-2)
		conf.today[2] = date.getFullYear()
		// 计算今天日期是第几列
		if (conf.calendar.length && conf.calendar[0].year == conf.today[2] && conf.calendar[0].moon == conf.today[0]) {
			conf.remianDays = conf.calendar[conf.calendar.length - 1].num - parseInt(conf.today[1])
			let todayNum = parseInt(conf.today[1]) - 1
			conf.showSignLine = Math.floor(todayNum / 7)
		}

		if((date.getMonth() + 1) == m) {
			for (n = 1; n <= 35 - o; n++) ((e = {} as any).num = n), (e.moon = m + 1), (e.year = t.getFullYear()), conf.calendar.push(e)
		}

		// 只显示当前月的下一个月的数据
		let nextYear = parseInt(conf.dateNum.split('.')[0])
		let nextMon = parseInt(conf.dateNum.split('.')[1])
		let currentMon = parseInt(conf.today[0])
		if (nextYear > conf.today[2] || nextMon > currentMon) conf.nextDateNo = true

		if (conf.months != 0 || conf.isSignTip) return

		let reminder = Cookie.get('signReminder')
		conf.checked = reminder == 'false' ? false : true
		if (conf.checked) {
			conf.signTip = !conf.selectSignBtn()
			if (conf.signTip) {
				conf.isSignTip = true
				setTimeout(() => {
					conf.signTip = false
				}, 2000)
			}
		}
		if (conf.signRecord.length) {
			// 判断是否连续签到
			let y = parseInt(conf.today[2])
			let m = parseInt(conf.today[0])
			let d = parseInt(conf.today[1])
			if (d == 1) {
				// 获取上个月的最后一天
				const lastDay = conf.getLastMonthDay()
				y = lastDay.getFullYear()
				m = lastDay.getMonth() + 1
				d = lastDay.getDate()
			} else {
				d = d - 1
			}
			let m1 = ('0' + m).slice(-2)
			let d1 = ('0' + d).slice(-2)
			let lastDate = '' + y + m1 + d1
			let lastStr = conf.signRecord[conf.signRecord.length - 1].belongDate + ''
			let item = conf.selectSignBtn()
			if (item || lastStr == lastDate) {
				conf.sigTotal = conf.signRecord[conf.signRecord.length - 1].continueDays
			} else {
				conf.sigTotal = 0
			}
			if (conf.sigTotal == 0) return

			let todayStr = conf.today[2] + '' + conf.today[0] + conf.today[1]
			if (lastStr == todayStr) {
				conf.maxNumArr[1] = conf.sigTotal - 1
			} else {
				conf.maxNumArr[1] = conf.sigTotal
			}
			// 	let lastStr = conf.signRecord[conf.signRecord.length-1].createTime
			// 	let str = '-' + conf.today[0] + '-'
			// 	if (lastStr && lastStr.indexOf(str) !== -1) {
			// 	  conf.sigTotal = conf.signRecord.length
			// 	}
		}
		// conf.today = Date.Format(new Date(),'MM.dd')
	},
	// 获取上个月的最后一天
	getLastMonthDay() {
		const now = new Date()
		let lastMonth
		if (now.getMonth() === 0) { // 如果是1月份，则上个月是上一年的12月
			lastMonth = new Date(now.getFullYear() - 1, 11, 0);
		} else {
			lastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
		}

		return lastMonth
	},
	prevMonth() {
		if (conf.months >= 2) return conf.selectDateNo = true
		// conf.calendar = []
		conf.nextDateNo = false
		conf.showDate.setDate(1)
		conf.showDate.setMonth(conf.showDate.getMonth() - 1)
		let m = conf.showDate.getMonth() + 1 - conf.today[0]
		conf.months++
		if (conf.months == 2) conf.selectDateNo = true
		if (conf.months < 0) {
			conf.setCalendar()
			return
		}
		conf.getPointsList(conf.userInfo.userId)
	},
	nextMonth() {
		// conf.calendar = []
		conf.selectDateNo = false
		conf.showDate.setDate(1)
		conf.showDate.setMonth(conf.showDate.getMonth() + 1)
		conf.months--
		if (conf.months < 0) {
			conf.setCalendar()
			return
		}
		conf.getPointsList(conf.userInfo.userId)
	},
	// 数据处理
	changePointNum(amount: any) {
		let unit = ''
		amount = parseFloat(amount) || 0
		if (amount < 1000000) {
			return parseInt(amount)
		} else if (amount < 1000000000) {
			// 如果金额在1,000,000到1,000,000,000之间，则显示为xxxx.xxM（百万）
			amount /= 1000000;
			unit = 'M'
		} else {
			// 如果金额超过1,000,000,000，则显示为xxxx.xxB（十亿）
			amount /= 1000000000;
			unit = 'B'
		}

		//对数据进行保留n位处理并去掉末位小数
		let [integerPart, decimalPart = ''] = String(amount).split('.');
		decimalPart = decimalPart.substring(0, 2);
		decimalPart = decimalPart.replace(/0+$/, '');
		amount = decimalPart ? `${integerPart}.${decimalPart}` : integerPart;
		return amount + unit;
	}
})
onMounted(async () => {
	let userInfo = sconfig.userInfo
	if (userInfo && userInfo.userId) {
		conf.userInfo = userInfo
		const config = await svalue.getAppConfiguration(true)
		conf.showSign = config.activity_points_mall_sign
		conf.showMall = config.activity_points_mall // 是否开启积分商城
		if (conf.showSign) {
			conf.showDate.setMonth(conf.showDate.getMonth() + 1)
			conf.getPointsList(userInfo.userId)
		}
		conf.getTime()
		conf.getUserPoint(userInfo.userId)
		conf.defalutWallet = await svalue.getDefaultWallet()
		conf.getTaskList()
	} else {
		System.router.push('/login')
	}
})
const event = Scope.Event()
event.on(EPage.scroll, (e) => {
	if (e.top > 60) {
		conf.bgcolor = 'linear-gradient(180deg, #EB602D 0%, #FFA64F 160%)'
	} else {
		conf.bgcolor = ''
	}
})
</script>

<style lang="less" scoped>
.head-right {
	padding: 0 32rem;

	.img {
		width: 40rem;
		height: 44rem;
	}
}

.head {
	height: 480rem;
	position: relative;
	width: 100%;
	background-size: 100% 100%;
	background-image: url('/static/img/task/task-bg.png');
}

.flex-center {
	display: flex;
	align-items: center;
	justify-content: center;
}

.flex-between {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.items-center {
	display: flex;
	align-items: center;
}

.points {
	margin-top: 40rem;
	font-size: 25rem;

	.left-total {
		color: #000;
		font-size: 25rem;
		display: flex;
		align-items: center;

		span {
			color: #FF7502;
			font-size: 32rem;
			margin-right: 10rem;
		}

		img {
			width: 10rem;
			height: 18rem;
			margin-left: 10rem;
		}
	}

	.ponints-mall {
		padding: 12rem 20rem;
		border-radius: 40rem;
		background: linear-gradient(328.56deg, #FC9B01 18.81%, #FF7502 77.66%);
		color: #fff;
		font-size: 25rem;

		.points-mall-img {
			width: 40rem;
			height: 36rem;
			margin-right: 12rem;
		}
	}
}

.sign-time {
	padding: 20rem 20rem 40rem;
	border-radius: 12rem;
	margin-top: 40rem;
	background: linear-gradient(179.55deg, #FFFFFF 86.08%, #FE9F61 218.09%);

	.title-left {
		display: flex;
		align-items: center;
		font-size: 26rem;

		span {
			color: #FF7502;
			margin: 0 8rem;
		}

		.tips {
			width: 20rem;
			height: 20rem;
			margin-left: 10rem;
			margin-top: 2rem;
		}
	}

	.title-right {
		color: #c0c0c0;
		font-size: 26rem;
		margin-right: -6rem;
	}

	.line {
		height: 1rem;
		background: #eee;
		margin: 10rem 0rem;
	}

	.select-time {
		margin: 20rem 6rem 10rem;
		color: #333;
		font-weight: 600;
		font-size: 30rem;

		.select-arrow {
			width: 36rem;
			height: 36rem;
		}

		.arrow-right {
			transform: rotate(180deg);
		}
	}

	.time-box {
		position: relative;
		overflow: hidden;
		transition: all .2s;
	}

	.transitionTime {
		transition: all .2s;
	}

	.time-list {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;

		.time-item {
			background: #F8F8F9;
			border-radius: 8rem;
			width: 12%;
			height: 120rem;
			margin-right: 2%;
			margin-top: 12rem;
			display: flex;
			flex-direction: column;
			justify-content: space-between;
			align-items: center;
			padding-top: 16rem;

			.miss {
				background: #ABABAB;
				color: #fff;
				font-size: 20rem;
				padding: 2rem 5rem;
				border-radius: 4rem;
			}

			.task-sign-img {
				width: 36rem;
				height: 36rem;
			}

			.time-img {
				position: relative;
				display: flex;
				align-items: center;
				justify-content: center;
				margin-bottom: 8rem;

				.day-point-img {
					width: 50rem;
					height: 50rem;
				}

				.point-num {
					position: absolute;
					font-size: 19rem;
					color: #D76F03;
				}
			}

			.dat-num {
				color: #999;
				font-size: 22rem;
				text-align: center;
				margin: 10rem 0 8rem;
			}
		}

		.time-active {
			background: #FFF3EB;
			border: 1px solid #FC9B01;

			.day-today {
				background: linear-gradient(180deg, #FC9B01 0%, #FF7502 100%);
				color: #fff;
				font-size: 20rem;
				width: 100%;
				text-align: center;
				padding: 5rem 0rem 8rem;
			}
		}
	}

	.mask-more {
		position: absolute;
		left: 0;
		right: 0;
		height: 36rem;
		bottom: 0rem;
		text-align: center;
		background: linear-gradient(360deg, rgba(255, 255, 255, 0.7) 71.01%, rgba(255, 255, 255, 0) 113.77%);

		.more-img {
			width: 10rem;
			height: 18rem;
			transform: rotate(90deg);
		}
	}

	.mask-more-up {
		background: linear-gradient(360deg, rgba(255, 255, 255, 0.6) 71.01%, rgba(255, 255, 255, 0) 113.77%);

		.more-img {
			transform: rotate(-90deg);
		}
	}

	.sign-btn {
		background: linear-gradient(180deg, #EB602D 0%, #FFA64F 100%);
		box-shadow: 4px 4px 8px 0px #FF8D444D;
		height: 80rem;
		color: #fff;
		border-radius: 40rem;
		font-size: 32rem;
		margin-top: 20rem;
	}

	.disabled {
		background: #EcEcEc;
		box-shadow: none;
	}
}

.no-task {
	text-align: center;
	margin-top: 60rem;

	.no-task-img {
		height: 180rem;
	}

	.no-txt {
		font-size: 26rem;
		color: #707070;
	}
}
</style>
