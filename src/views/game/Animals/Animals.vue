<template>
    <x-page headerBgColor="transparent" :topfill="false" noFooter>
        <template #title>
            <div class="head-title" @click="conf.play.typeShow = !conf.play.typeShow">
                <span>Animals - {{ conf.play.item.title }}</span>
                <img
                class="arrow-img"
                src="/static/img/type-arrow.png"
                :style="{ 'transform': conf.play.typeShow ? 'rotate(-180deg)' : 'rotate(0deg)' }"
                />
            </div>
        </template>
        <div class="ani-page">
            <!-- 游戏 -->
            <div class="relative cgame-box" ref="cgamebox" style="width: 100%; flex: 1; margin-bottom: 30rem;">
                <!-- 游戏动画 -->
                <cgame ref="cgameRef" @close="conf.game.showDown = true" />
                <!-- 倒计时 -->
                <countdown
                    :times="conf.lotteryBox.countDown"
                    :totalList="conf.result.totalList"
                    :active="conf.bet.tabs.active"
                    :openExpect="conf.lotteryBox.current.openExpect"
                    @showMore="conf.openMore"
                    v-if="conf.game.showDown"
                />
            </div>
            <!-- 下注菜单 -->
            <aniBet
                :options="conf.bet.tabs.options"
                :listNumArr="conf.bet.listNumArr"
                :stopBet="!conf.game.showDown"
                @changeBet="conf.bet.requestBet"
            />
        </div>
        <div v-if="conf.game.showDown">
            <div class="rulse" @click="conf.goPage('rules')">Rules</div>
            <div class="rulse mony">
                <div class="coin">$</div>
                <div class="total">{{ conf.walletMoney }}</div>
            </div>
            <div class="rulse record" @click="conf.goPage('record')">
                <img class="record-img" src="/static/img/game/animal/record.png" />
                Record
            </div>
        </div>
        <moreResult
            :result="conf.result.list"
            :totalList="conf.result.totalList"
            ref="resultRefs"
        />
        <van-popup z-index="97" :show="conf.play.typeShow" position="bottom" borderRadius='16' :round="true"
            @close="conf.play.closePopup">
            <div class="type-list">
                <template v-for="item in conf.play.list" :key="item.id">
                    <div class="type-item" :class="{'type-active': conf.play.lotteryId == item.id}" @click="conf.play.reloadTo(item.id)">
                        <div v-if="(item.lotteryInterval / 1000 / 60) >= 1">
                            <span>{{ item.lotteryInterval / 1000 / 60 }}</span>
                            {{ (item.lotteryInterval / 1000 / 60) > 1 ? $t('game.minutes') : $t('game.minute') }}
                        </div>
                        <div v-else>
                            <span>{{ item.lotteryInterval / 1000 }}</span>{{ $t('game.second') }}
                        </div>
                    </div>
                </template>
                <div style="height: 20rem; background: #f6f6f6"></div>
                <div class="type-item" @click="conf.play.closePopup">{{ $t('me.cancle') }}</div>
            </div>
        </van-popup>
    </x-page>
</template>
<script setup lang="ts">
import System from '@/utils/System';
import cgame from './com/AnimalsAni.vue';
import aniBet from './com/aniBet.vue';
import countdown from './com/countdown.vue'
import moreResult from './com/moreResult.vue';
import { onBeforeMount, onMounted, reactive, ref } from 'vue'
import slottery from '@/sstore/slottery';
import { Scope } from 'tools-vue3';
import { apis } from '@/api';
import i18n from '@/lang';
import sconfig from '@/sstore/sconfig';
import { svalue } from '@/sstore/svalue';
import sutil from '@/sstore/sutil';

const cgamebox = ref<any>()
const cgameRef = ref<any>()
const resultRefs = ref<any>()
const conf = reactive({
    loading: false,
    lotteryTypeId: 0,
    lotteryBox: { countDown: [0, 0, 0] } as any,
    openLockCountdown: 0,
    openMore() {
        resultRefs.value.openPopup(conf.bet.tabs.active)
    },
    game: {
        isRun: false,
        showDown: true,
        action: (type: any, res: any) => {
            if (type == 'time' && res[3] === 0) conf.game.start()
            else if (type == 'stop') conf.game.stop(res)
        },
        reset: () => {
            conf.game.isRun = false
            cgameRef.value?.reset()
        },
        start: () => {
            if (conf.game.isRun) return
            conf.game.showDown = false
            conf.game.isRun = true
            cgameRef.value?.init()
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
        lotteryId: '',
        typeShow: false,
        item: {} as any,
        closePopup() {
            conf.play.typeShow = false
        },
        //切换玩法 1min、5min。。。
        reloadTo: async (key: any) => {
            conf.play.lotteryId = key
            conf.play.closePopup()
            await conf.init()
        },
        //初始化玩法
        choose: (key: any) => {
            conf.play.item = conf.play.list.find((v: any) => v.id == key)
            let interval = conf.play.item.lotteryInterval / 1000 / 60
            conf.play.item.title = interval + '' + (interval > 1 ? i18n.t('game.minutes') : i18n.t('game.minute'))
            return conf.play.item
        },

        list: [] as any[]
    },
    bet: {
        tabs: {
            active: 'st',
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
        //下注原始数据
        listNumArr: [],

        //获取赔率
        getOdds: async () => {
            const { data } = await apis.lotteryOdds({
                lotteryTypeId: conf.lotteryTypeId,
                lotteryTypeCode: 'ANIMALS_RUNNING'
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
                conf.bet.listNumArr.forEach(fun)
            })
            console.log(conf.bet.listNumArr);
        },
        // 请求下注接口
        requestBet(e: any) {
            // 选择类型
            if (e.type) {
                conf.bet.tabs.active = e.type.slice(1)
                return
            }
            System.loading()
            apis.lotteryUserBets({
                money: e.balance, //单注金额
                betCodes: e.code, //投注内容
                betExpect: conf.lotteryBox.current.openExpect, //投注期号
                betOpenId: conf.lotteryBox.current.lotteryOpenId, //开奖记录编号
                lotteryId: conf.lotteryBox.current.lotteryId, //投注彩票ID
                multiple: 1, //投注倍数
                nums: 1, //投注数量
                supplement: 0, //是否追加订单，0否，1是
                walletCoinCode: conf.defaultWalletInfo.walletCoin, //下注钱包币种
                success: (res: any) => {
                    conf.getWalletMoney(2)
                    System.toast(i18n.t('game.betSuccess'), 'success')
                },
                final: () => {
                    System.loading(false)
                }
            });
        }
    } as any,
    downNum: 10,
    //重置所有内容
    reset() {
        conf.game.reset()
    },
    //历史结果列表
    result: {
        list: [],
        totalList: [] as any,
        getList: async () => {
            const { data: openData } = await apis.lotteryOpenResult({
                current: 1,
                size: 100,
                lotteryId: conf.play.lotteryId
            })
            // 统计前一百条的冠、亚、季军
            conf.result.rest()
            openData.records.forEach((item: any,index: number) => {
                if(item.openCode) {
                    let array = item.openCode.split(',')
                    const stIndex = array.indexOf('A');
                    const ndIndex = array.indexOf('B');
                    const rdIndex = array.indexOf('C');
                    
                    conf.result.totalList[stIndex].st = conf.result.totalList[stIndex].st + 1
                    conf.result.totalList[ndIndex].nd = conf.result.totalList[ndIndex].nd + 1
                    conf.result.totalList[rdIndex].rd = conf.result.totalList[rdIndex].rd + 1
                }
            })
            let list = openData.records.slice(0, 10) || []
            conf.result.list = list.map((item: any) => {
                let openCodeArr = []
                if (item.openCode) openCodeArr = item.openCode.split(',')
                return {
                    ...item,
                    openCodeArr
                }
            })
        },
        rest() {
            conf.result.totalList = [
                { img: 'exb', name: 'Exiaobao', st: 0, nd: 0, rd: 0 },
                { img: 'hm', name: 'Freshippo', st: 0, nd: 0, rd: 0 },
                { img: 'pp', name: 'Piaopiao', st: 0, nd: 0, rd: 0 },
                { img: 'xz', name: 'Xiazai', st: 0, nd: 0, rd: 0 },
                { img: 'zxb', name: 'Zhixiaobao', st: 0, nd: 0, rd: 0 },
                { img: 'hx', name: 'Huanxing', st: 0, nd: 0, rd: 0 }
            ]
        }
    },
    //获取当前钱包余额
    defaultWalletInfo: {} as any,
    walletMoney: '--',
    async getWalletMoney(type: any) {
        if (!sconfig.userInfo) return conf.walletMoney = '-'
        let item = await svalue.getDefaultWallet()
        if (item.hasOwnProperty('coinSymbol')) {
            conf.defaultWalletInfo = item
            let m = parseFloat(conf.defaultWalletInfo.walletMoney)
            conf.walletMoney = sutil.dataHandling(m)
        }
    },
    //初始页面业务
    async init() {
        conf.reset()
        //获取游戏列表
        conf.play.list = await slottery.findLotteryList('ANIMALS_RUNNING')
        console.log(conf.play.list);
        
        let item = conf.play.list.find((v: any) => v.id === conf.play.lotteryId) as any
        conf.openLockCountdown = item.openLockCountdown / 1000 //锁定倒计时
        //选中当前游戏
        conf.play.choose(conf.play.lotteryId)
        //获取赔率信息
        // await conf.bet.getOdds()
        //获取开奖信息任务
        conf.lotteryBox.getInfoLoop(0)
        conf.getWalletMoney(2)
        //获取l历史记录
        conf.result.getList()
    },
    goPage(url: any) {
        System.router.push('/game/Animals/' + url + '?lotteryId=' + conf.play.lotteryId)
    }
})
onMounted(async () => {
    conf.play.list = await slottery.findLotteryList('ANIMALS_RUNNING')
    conf.play.lotteryId = conf.play.list[0].id
    conf.lotteryTypeId = conf.play.list[0].lotteryTypeId

    conf.init()
})
onBeforeMount(async () => {
    const timer = Scope.Timer()
    conf.lotteryBox = slottery.lotteryBox({
        timer: timer,
        success: (onetime: any, status: any, results: any) => {
            //处理游戏和刷新结果
            if (onetime && status) {
                conf.game.action(
                    'stop',
                    results.map((v: any) => v.num)
                )
            }
        },
        updateCountDown: (time: any) => {
            //处理游戏
            conf.game.action('time', time)
        },
        resultSize: 3,
        lotteryId: () => conf.play.lotteryId,
        showBox: () => { }
    })
    console.log(conf.lotteryBox);
    
    conf.bet.listNumArr = [
        {
            sort: 1,
            key: 'A',
            img: 'exb',
            name: 'Exiaobao'
        },
        {
            sort: 2,
            key: 'B',
            img: 'hm',
            name: 'Freshippo'
        },
        {
            sort: 3,
            key: 'C',
            img: 'pp',
            name: 'Piaopiao'
        },
        {
            sort: 4,
            key: 'D',
            img: 'xz',
            name: 'Xiazai'
        },
        {
            sort: 5,
            key: 'E',
            img: 'zxb',
            name: 'Zhixiaobao'
        },
        {
            sort: 6,
            key: 'F',
            img: 'hx',
            name: 'Huanxing'
        }
    ]
})
</script>
<style lang="less" scoped>
.ani-page {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background: #fb9f7a;
    position: relative;
}

// .van-popup {
//     background: transparent;
// }

// .van-popup--top {
//     top: 104rem;
// }

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
.rulse {
    position: absolute;
    top: 12%;
    background: #fff;
    padding: 8rem 28rem;
    border-radius: 0 30rem 30rem 0;
    color: #9A470C;
    font-size: 24rem;
    z-index: 9;
}

.mony {
    right: 0;
    border-radius: 30rem 0rem 0rem 30rem;
    display: flex;
    align-items: center;
    padding: 5rem 20rem 5rem 16rem;
    min-width: 156rem;

    .coin {
        width: 38rem;
        height: 38rem;
        background-size: 100% 100%;
        background-image: url('/static/img/coin-task.png');
        color: #faa54b;
        font-size: 14rem;
        display: flex;
        justify-content: center;
        align-items: center;
        // margin-right: 20rem;
    }

    .total {
        flex: 1;
        text-align: center;
    }
}

.record {
    top: 18%;
    right: 0;
    border-radius: 30rem 0rem 0rem 30rem;
    padding: 12rem 24rem 12rem 20rem;
    display: flex;
    align-items: center;
    background: #4196FF;
    color: #fff;

    .record-img {
        height: 28rem;
        margin-right: 10rem;
    }
}
.type{
    background: #fff;
}
.type-list {
  font-size: 30rem;
  font-weight: 500;
  background: #ffffff;

  .type-item {
    line-height: 100rem;
    border-bottom: 1rem solid #eee;
    text-align: center;
  }
  .type-active{
    color: #ff5757;
  }
}
</style>