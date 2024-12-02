<template>
    <gameBox ref="gameBoxRefs" :list="conf.play.list" :active="conf.play.active"
        :betShare="conf.lotteryBox.countDown[3] <= 20" @change="conf.play.reloadTo" @close="conf.bet.closeFun"
        :selectBetInfo="conf.selectBetInfoArr" :currentOpenInfo="conf.lotteryBox.current" :gameType="'pk10'"
        :openLockCountdown="conf.openLockCountdown">
        <!-- 下注弹框自定义显示列表 -->
        <template v-slot:bet>
            <div class="row items-center">
                <div class="select-info-name" style="margin-right: 10rem">
                    {{ conf.bet.tabs.active }}
                </div>
                <div class="col row items-center">
                    <template v-for="item in conf.bet.listNum">
                        <div :class="['qkball' + item.sort]" style="height: 58rem; width: 58rem"></div>
                    </template>
                    <template v-for="item in conf.bet.listBS">
                        <div class="row flex-center ct-bs" :class="['num_' + item.color]">
                            <div>{{ item.label }}</div>
                        </div>
                    </template>
                </div>
            </div>
        </template>

        <!-- 期数信息、倒计时 -->
        <div class="time-box" style="margin: 6rem 0 30rem 0">
            <div class="row justify-between">
                <div>
                    <div class="text">{{ $t('game.drawID') }}</div>
                    <div class="number">{{ conf.lotteryBox.issue }}</div>
                </div>
                <div class="column items-end">
                    <div style="margin-bottom: 14rem">
                        {{ $t('winGo.TimeRemaining') }}
                    </div>
                    <ctime :times="conf.lotteryBox.countDown" />
                </div>
            </div>
        </div>

        <!-- 游戏 -->
        <div class="relative cgame-box" ref="cgamebox"
            style="width: 100%; height: 398rem; overflow: hidden;margin: 0 auto; margin-bottom: 30rem"
            :style="{ 'height': conf.game.box.height + 'px' }">
            <cgame ref="cgameRef" :title="conf.play.item.title" :issue="conf.lotteryBox.lastissue" :width="conf.game.box.width" />
        </div>

        <!-- 下注选项 -->
        <div class="bet-box column fit-width relative" style="padding: 40rem 24rem 30rem 24rem">
            <div class="row" style="gap: 40rem">
                <template v-for="item in conf.bet.tabs.options">
                    <div class="pl-tabs-item col" :class="[conf.bet.tabs.active == item.key ? 'active' : '']"
                        @click="conf.bet.tabs.choose(item)">
                        {{ item.label }}
                    </div>
                </template>
            </div>

            <div class="game-line" style="margin: 30rem 0"></div>
            <div class="row" style="gap: 8rem">
                <template v-for="item in conf.bet.listNumArr">
                    <div class="column flex-center ball-box"
                        :class="[conf.bet.listNum.find((v: any) => v.key == item.key) ? 'active' : '']"
                        style="width: 19%" @click="conf.bet.choose(item, 'listNum')">
                        <div class="ball" :class="['qkball' + item.sort]"></div>
                        <div style="line-height: 50rem">
                            {{ item[conf.bet.tabs.active + 'odds'] }}
                        </div>
                    </div>
                </template>
            </div>
            <div class="row" style="gap: 6rem; margin-top: 10rem">
                <template v-for="item in conf.bet.listBSArr">
                    <div class="col bsitem-box"
                        :class="[conf.bet.listBS.find((v: any) => v.key == item.key) ? 'active' : '']"
                        @click="conf.bet.choose(item, 'listBS')">
                        <div class="bsitem row justify-between items-center" :class="['num_' + item.color]">
                            <div>{{ item.label }}</div>
                            <div>{{ item[conf.bet.tabs.active + 'odds'] }}</div>
                        </div>
                    </div>
                </template>
            </div>
            <!-- 倒计时5秒弹窗 -->
            <big-time :seconds="conf.lotteryBox.countDown[2]"
                v-if="conf.lotteryBox.countDown[3] <= conf.openLockCountdown"></big-time>
        </div>

        <!-- 历史记录 -->
        <div class="twgo-list">
            <div class="twgo-list-type flex justify-between items-center">
                <div class="type-item flex flex-center" v-for="(item, index) in conf.his.tabs.options"
                    :class="{ 'type-active': conf.his.tabs.active == item.value }" @click="conf.his.tabs.choose(item)">
                    {{ item.label }}
                </div>
            </div>
            <history v-if="conf.his.tabs.active == 1" ref="historyRfes" :historyList="conf.his.result.list" />
            <order v-if="conf.his.tabs.active == 3" :orderDataList="conf.his.order.list" :isClickPage="conf.isClickPage"
                @handleClickOrderPage="conf.handleClickOrderPage"></order>
            <template v-if="conf.his.tabs.active == 4">
                <div style="padding: 20rem 48rem" v-html="conf.play.item.lotteryRuleurl"></div>
            </template>
        </div>

        <!-- 分页工具 -->
        <cpage :pageSize="conf.page.pageSize" :pageNum.sync="conf.page.pageNum" :total="conf.page.total"
            @change="conf.page.change" v-if="conf.page.total > conf.page.pageSize"
            style="margin-bottom: 150rem; margin-top: 30rem" />
        <!-- 加载动画 -->
        <game-loading v-if="conf.loading" />
    </gameBox>
</template>
<script setup lang="ts">
import { Scope } from 'tools-vue3'
import gameBox from '../components/gameBox.vue'
import cpage from './cpage.vue'
import gameLoading from '../components/gameLoading.vue'
import ctime from '../components/downTime.vue'
import cgame from './game.vue'
import bigTime from "../components/bigTime.vue"
import history from './gameHistory.vue'
import order from './order.vue'
import { sutil } from '@/sstore/sutil'
import { slottery } from '@/sstore/slottery'
import { svalue } from '@/sstore/svalue'
import { onBeforeMount, onMounted, reactive, ref } from 'vue'
import i18n from '@/lang'
import { apis } from '@/api'

const cgamebox = ref<any>()
const cgameRef = ref<any>()
const gameBoxRefs = ref<any>()
const conf = reactive({
    isClickPage: false,
    loading: false,
    lotteryTypeId: 0,
    openLockCountdown: 0,
    page: {
        pageSize: 10,
        pageNum: 1,
        total: 9,
        reset: () => {
            conf.page.total = 0
            conf.page.pageNum = 1
        },
        change: (val: any) => {
            conf.his.getList()
            conf.handleClickOrderPage(true)
        }
    },
    selectBetInfoArr: [], //下注号码
    bet: {
        tabs: {
            active: '1st',
            options: [
                {
                    key: '1st',
                    label: '1st'
                },
                {
                    key: '2nd',
                    label: '2nd'
                },
                {
                    key: '3rd',
                    label: '3rd'
                }
            ],
            choose: (item: any) => {
                conf.bet.tabs.active = item.key
                conf.bet.closeFun('0')
            }
        },
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
            if (type == 'betSuccess' && conf.his.tabs.active == 3) {
                conf.his.getList()
            }
        },
        //下注数字原始数据
        listNumArr: [],
        //选中数据
        listNum: [],
        //下注大小单双原始数据
        listBSArr: [],
        //选中数据
        listBS: [],
        //选择下注数据
        choose: (item: any, name: any) => {
            if (conf.bet[name].includes(item)) {
                sutil.remove(conf.bet[name], (v: any) => v.key == item.key)
            } else {
                conf.bet[name].push(item)
            }
            conf.bet[name].sort((a: any, b: any) => a.sort - b.sort)

            conf.bet.open()
            // let label = conf.bet.tabs.active+'_'+ conf.bet[name][0].label
            conf.bet[name][0].active = conf.bet.tabs.active
            conf.selectBetInfoArr = conf.bet[name]
        },

        //获取赔率
        getOdds: async () => {
            const { data } = await apis.lotteryOdds({
                lotteryTypeId: conf.lotteryTypeId,
                lotteryTypeCode: 'PK10'
            })
            let odds = {} as any
            data.forEach((item: any) => {
                const [key, oddskey] = item.oddsCode.split('_')
                if (!odds[key]) odds[key] = {}
                odds[key][oddskey] = item
            })
            conf.bet.tabs.options.forEach((v: any) => {
                const fun = (item: any) => {
                    item[v.key + 'odds'] = Number(odds[v.key][item.key].odds)
                }
                conf.bet.listBSArr.forEach(fun)
                conf.bet.listNumArr.forEach(fun)
            })
        }
    } as any,
    game: {
        box: {
            width: 0,
            height: 0,
            init: () => {
                conf.game.box.width = cgamebox.value.offsetWidth
                conf.game.box.height = conf.game.box.width / 1.769
            }
        },
        isRun: false,
        action: (type: any, res: any) => {
            if (type == 'time' && res[3] === 3) conf.game.start()
            else if (type == 'stop') conf.game.stop(res)
        },
        reset: () => {
            conf.game.isRun = false
            cgameRef.value?.reset()
        },
        start: () => {
            if (conf.game.isRun) return
            conf.game.isRun = true
            cgameRef.value?.start()
        },
        stop: (res: any) => {
            if (conf.game.isRun) {
                conf.game.isRun = false
                cgameRef.value?.stop(res)
            } else {
                cgameRef.value?.setList(res)
            }
        }
    },
    play: {
        active: '',
        lotteryId: '',
        item: {} as any,
        //切换玩法 1min、5min。。。
        reloadTo: async (key: any) => {
            conf.loading = true
            conf.play.lotteryId = key
            await conf.init()
            conf.loading = false
        },
        //初始化玩法
        choose: (key: any) => {
            conf.play.active = key
            conf.bet.tabs.active = '1st'
            conf.play.item = conf.play.list.find((v: any) => v.id == key)
            conf.play.item.title = conf.play.item.lotteryInterval / 1000 / 60 + ' Min' || '=='
            conf.bet.close()
            return conf.play.item
        },

        list: [] as any[]
    },
    his: {
        tabs: {
            active: 1,
            options: [
                {
                    value: 1,
                    label: i18n.t('game.resultHistory')
                },
                {
                    value: 3,
                    label: i18n.t('game.myOrder')
                },
                {
                    value: 4,
                    label: i18n.t('game.rule')
                }
            ],
            choose: (item: any) => {
                conf.his.tabs.active = item.value
                conf.page.reset()
                conf.his.getList()
            }
        },
        //重置
        reset: () => {
            conf.his.tabs.choose(conf.his.tabs.options[0])
        },
        //获取当前选中的列表信息
        getList: async () => {
            gameBoxRefs.value?.getWalletMoney(2)
            const v = {
                1: async () => {
                    await conf.his.result.getList()
                },
                3: async () => {
                    await conf.his.order.getList()
                }
            } as any
            await v[conf.his.tabs.active]?.()
        },
        //历史结果列表
        result: {
            list: [],
            getList: async () => {
                const { data: openData } = await apis.lotteryOpenResult({
                    current: conf.page.pageNum,
                    size: conf.page.pageSize,
                    lotteryId: conf.play.lotteryId
                })
                openData.records.forEach((item: any) => {
                    item.openNumberStr = item.openCode.slice(item.openCode.length - 5, item.openCode.length)
                    let index = item.openNumberStr[0]
                    item.openNumber = parseFloat(item.openNumberStr.slice(index, index + 1))
                })
                conf.his.result.list = openData.records || []
                conf.page.total = openData.total    
            }
        },
        order: {

            list: [],
            //获取roder列表
            getList: async () => {
                let defaultWalletInfo = await svalue.getDefaultWallet()
                const { data } = await apis.lotteryUserOrder({
                    current: conf.page.pageNum,
                    size: conf.page.pageSize,
                    lotteryId: conf.play.lotteryId
                })

                let coinlistArr = await svalue.getCoinlist() //货币数据
                data.records.forEach((item: any) => {
                    item.typeName = 'PK10'
                    item.openNumber = item.betOpenCode
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
                    let betMoneyResult = sutil.Mul(
                        sutil.division(defaultWalletInfo.coinTousdt, item.coinTousdt, false),
                        item.totalBetAmount
                    )
                    betMoneyResult = sutil.formatNumber(betMoneyResult)
                    let betMoneyResultToFixed4 = sutil.dataHandling(betMoneyResult)
                    item.betMoneyToFixed4 = betMoneyResultToFixed4

                    //中奖金额汇率转换
                    let PrizeMoneyResult = null
                    if (parseFloat(item.betPrizeMoney) > 0) {
                        PrizeMoneyResult = sutil.Mul(
                            sutil.division(defaultWalletInfo.coinTousdt, item.coinTousdt, false),
                            item.betPrizeMoney
                        )
                        PrizeMoneyResult = sutil.formatNumber(PrizeMoneyResult)
                    } else {
                        item.betPrizeMoney = 0.00
                        PrizeMoneyResult = 0.00
                    }
                    let PrizeMoneyResultToFixed4 = sutil.dataHandling(PrizeMoneyResult)
                    item.PrizeMoneyToFixed4 = PrizeMoneyResultToFixed4
                })
                conf.his.order.list = data.records || []
                conf.page.total = data.total
            }
        }
    },
    lotteryBox: { countDown: [0, 0, 0] } as any,
    //重置所有内容
    reset() {
        // conf.timer.clear()

        // conf.lotteryBox.reset()

        conf.game.reset()
        conf.page.reset()
        conf.his.reset()
    },

    //初始页面业务
    async init() {
        conf.loading = true
        conf.reset()
        //初始化游戏宽高
        conf.game.box.init()
        //获取游戏列表
        conf.play.list = await slottery.findLotteryList('PK10')
        let item = conf.play.list.find((v: any) => v.id === conf.play.lotteryId) as any
        conf.openLockCountdown = item.openLockCountdown / 1000 //锁定倒计时
        //选中当前游戏
        conf.play.choose(conf.play.lotteryId)
        //获取赔率信息
        await conf.bet.getOdds()
        //获取开奖信息任务
        conf.lotteryBox.getInfoLoop(0)
        //获取底部信息
        conf.his.getList()
        conf.loading = false
    },
    //点击order => 分页
    handleClickOrderPage(val: any) {
        conf.isClickPage = val
    }
})
onMounted(async () => {
    conf.play.list = await slottery.findLotteryList('PK10')
    conf.play.lotteryId = conf.play.list[0].id
    conf.lotteryTypeId = conf.play.list[0].lotteryTypeId
    conf.init()
})
onBeforeMount(async () => {
    const timer = Scope.Timer()
    conf.lotteryBox = slottery.lotteryBox({
        timer: timer,
        success: (onetime: any, status: any, results: any) => {
            //处理pk10小游戏和刷新底部信息
            if (onetime && status) {
                conf.game.action(
                    'stop',
                    results.map((v: any) => v.num)
                )
                conf.page.reset()
                conf.his.getList()
            }
        },
        updateCountDown: (time: any) => {
            //处理pk10小游戏
            conf.game.action('time', time)
            conf.bet.autoClose(time[3])
        },
        resultSize: 3,
        lotteryId: () => conf.play.lotteryId,
        showBox: () => { }
    })

    conf.bet.listNumArr = []
    for (let i = 1; i < 11; i++) {
        conf.bet.listNumArr.push({
            sort: i,
            key: i,
            label: i,
            odds: 0
        })
    }

    conf.bet.listBSArr = [
        {
            sort: 1,
            key: 'big',
            label: 'Big',
            color: 'yellow',
            odds: 0
        },
        {
            sort: 2,
            key: 'small',
            label: 'Small',
            color: 'blue',
            odds: 0
        },
        {
            sort: 3,
            key: 'odd',
            label: 'Odd',
            color: 'red',
            odds: 0
        },
        {
            sort: 4,
            key: 'even',
            label: 'Even',
            color: 'green',
            odds: 0
        }
    ]
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
    margin: 0 8rem;
}

// 倒计时样式

.time-box {
    width: 100%;
    height: 190rem;
    background: url(/static/img/game/pk10/diban.png) no-repeat;
    background-size: 100% 100%;
    padding: 42rem 36rem;
    color: #fff;

    .text {
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
    border: 1px solid #f88c43;
    color: #f6843f;

    &.active {
        background: #f6843f;
        color: #ffffff;
    }
}

.bet-box {
    background-color: #fff;
    border-radius: 36rem;
}

.ball-box {
    padding-top: 10rem;
    border-radius: 8rem;
    border: 1rem solid #d61f2400;

    &.active {
        background: #fef4eb;
        border: 1rem solid #f6843f;
    }

    .ball {
        width: 76rem;
        height: 76rem;
        color: #fff;
        background: #fff;
        font-size: 30rem;
        font-weight: 500;
        color: #3a3a3a;
        display: flex;
        align-items: center;
        justify-content: center;
    }
}

.bsitem-box {
    border-radius: 10rem;
    border: 1rem solid #d61f2400;
    padding: 6rem;

    &.active {
        border: 1rem solid #d61f24;
        background: #d61f241a;
    }

    .bsitem {
        border-radius: 10rem;
        height: 80rem;
        padding: 0 20rem;
        color: #fff;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }
}

.qkball1 {
    background: url(/static/img/game/pk10/speed_pinball01.png) !important;
    background-size: 100% !important;
}

.qkball2 {
    background: url(/static/img/game/pk10/speed_pinball02.png) !important;
    background-size: 100% !important;
}

.qkball3 {
    background: url(/static/img/game/pk10/speed_pinball03.png) !important;
    background-size: 100% !important;
}

.qkball4 {
    background: url(/static/img/game/pk10/speed_pinball04.png) !important;
    background-size: 100% !important;
}

.qkball5 {
    background: url(/static/img/game/pk10/speed_pinball05.png) !important;
    background-size: 100% !important;
}

.qkball6 {
    background: url(/static/img/game/pk10/speed_pinball06.png) !important;
    background-size: 100% !important;
}

.qkball7 {
    background: url(/static/img/game/pk10/speed_pinball07.png) !important;
    background-size: 100% !important;
}

.qkball8 {
    background: url(/static/img/game/pk10/speed_pinball08.png) !important;
    background-size: 100% !important;
}

.qkball9 {
    background: url(/static/img/game/pk10/speed_pinball09.png) !important;
    background-size: 100% !important;
}

.qkball10 {
    background: url(/static/img/game/pk10/speed_pinball10.png) !important;
    background-size: 100% !important;
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

// 历史数据样式
.bet-histort {
    // margin-top: 30rem;

    .header-item {
        height: 80rem;
        line-height: 80rem;
        text-align: center;
        width: 100%;
        background-color: #dddddd;
        border-radius: 26rem 26rem 0 0;
        color: rgba(92, 97, 109, 0.8);
        overflow: hidden;
        font-size: 28rem;

        &.active {
            color: #ffffff;
            background: linear-gradient(180deg, #f6843f 0%, #fea14d 100%);
        }
    }
}

.gh-table {
    color: #ffffff;

    &-header {
        text-align: center;
        background-color: #f6843f;
        font-size: 24rem;
        line-height: 80rem;
        font-weight: 600;
    }

    &-item {
        text-align: center;
        line-height: 80rem;
        color: #414141;
        font-size: 24rem;
        background-color: #fff;

        .bs-item {
            height: 40rem;
            line-height: 40rem;
            padding: 0 12rem;
            color: #fff;
            border-radius: 8rem;
        }
    }

    &-foot {
        height: 40rem;
        background-color: #ffffff;
        border-bottom-right-radius: 26rem;
        border-bottom-left-radius: 26rem;
    }
}

.gh-table .gh-table-item:nth-child(odd) {
    background-color: #fef4eb;
}

.twgo-list {
    padding: 20rem 0rem;

    .twgo-list-type {
        .type-item {
            width: 32%;
            background-color: #dddddd;
            border-radius: 14rem 14rem 0 0;
            color: rgba(92, 97, 109, 0.8);
            font-size: 28rem;
            height: 64rem;

            &.type-active {
                color: #ffffff;
                background: linear-gradient(180deg, #f6843f 0%, #fea14d 100%);
            }
        }
    }
}
</style>
