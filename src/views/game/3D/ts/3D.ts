import { apis } from '@/api';
import { onMounted, onUnmounted, reactive, ref } from 'vue';
import System from '@/utils/System';
import i18n from '@/lang';
import { svalue } from '@/sstore/svalue';
import sutil from '@/sstore/sutil';
import sconfig from '@/sstore/sconfig';
import slottery from '@/sstore/slottery';

export const index = () => {
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
        requestOpen: true,
        gameType: '3D',
        isBetBtnClick: true,
        defaultWalletInfo: {} as any,
        navIndex: 0,
        // 选择时间期数
        changeTime(item: any, index: any) {
            if (conf.timeIndex == item.lotteryInterval) return;
            conf.timeIndex = item.lotteryInterval
            conf.openLockCountdown = item.openLockCountdown
            conf.openShow = true
            conf.getLotteryList(index)
            // conf.getLotteryOpen(item.id)
            if (index == 1 && conf.scrollLeft > 30) {
                conf.scrollLeft = 0
            } else {
                conf.scrollLeft = index * 32
            }
        },
        // 游戏列表
        async getLotteryList(index: any) {
            conf.lotteryVOList = await slottery.findLotteryList('3D')
            conf.lotteryRuleurl = conf.lotteryVOList[index]?.lotteryRuleurl
            conf.timeIndex = conf.lotteryVOList[index].lotteryInterval
            conf.openLockCountdown = conf.lotteryVOList[index].openLockCountdown
            let lotteryTypeId = conf.lotteryVOList[index].lotteryTypeId
            conf.navIndex = index
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
            if(!conf.requestOpen) return
            if (!conf.autoplay) {
                conf.autoplay = true
                conf.duration = 120
            }
            
            lotteryId && (conf.lotteryId = lotteryId)
            apis.lotteryOpen({
                lotteryId: lotteryId || conf.lotteryId,
                success: (res: any) => {
                    if (res.code == 200) {
                        if (conf.openShow) {
                            let cdata = res.data
                            let id = conf.lotteryVOList[conf.navIndex].lotteryTypeId
                            
                            if (cdata.currentOpen && (id == lotteryId)) conf.openShow = false
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
                            setTimeout(() => {
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
                        if (res.code == '1306') {
                            setTimeout(() => {
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
                // lotteryOddsId: conf.addsItem.oddsId,
                multiple: 1,
                nums: 1,
                supplement: 0,
                walletCoinCode: conf.defaultWalletInfo.walletCoin,
                success: (res: any) => {
                    conf.isBetBtnClick = true
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
        conf.requestOpen = false
        if (conf.timer) {
            clearInterval(conf.timer);
            conf.timer = null;
        }
    })
	return conf
}