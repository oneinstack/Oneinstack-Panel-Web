<template>
    <x-page>
        <template #title>
            Record
        </template>
        <div class="record">
            <div class="record-item" v-for="(item, index) in conf.order.list" :key="index">
                <div class="title">
                    <div class="issue">
                        {{ item.betExpect }}
                        <div class="type">{{ item.betCodes.split('_')[0] }}</div>
                    </div>
                    <div class="status" :class="{ 'success': index == 2 }">{{ index == 2 ? 'Success' : 'Failed' }}</div>
                </div>
                <div class="content">
                    <div class="line">MyGuess: <span :class="{ 'success': index == 2 }">{{
                        conf.order.getContent(item.betCodes,1) }}</span></div>
                    <div class="line">Points: <span>{{ item.coinSymbol + item.betMoney }}
                            <template v-if="item.defaultWalletCoin != item.betCoinCode">{{ ' (≈' +
                                item.defaultWalletCoinSymbol + item.betMoneyToFixed4 + ')' }}</template></span></div>
                    <div class="line">Result: <span>{{ conf.order.getContent(item.betOpenCode, 2) }}</span></div>
                    <div class="time">{{ sutil.getTimeFormat(item.betTime) }}</div>
                </div>
            </div>
        </div>
    </x-page>
</template>
                    <script setup lang="ts">
                    import { apis } from '@/api';
                    import { EPage } from '@/enum/Enum';
                    import sutil from '@/sstore/sutil';
                    import { svalue } from '@/sstore/svalue';
                    import System from '@/utils/System';
                    import { Scope } from 'tools-vue3';
                    import { onMounted, reactive } from 'vue';

                    const conf = reactive({
                        lotteryId: '1791354591116879873',
                        order: {
                            list: [] as any[],
                            pageNum: 1,
                            pageSize: 10,
                            total: 0,
                            //获取roder列表
                            getList: async () => {
                                let defaultWalletInfo = await svalue.getDefaultWallet()
                                const { data } = await apis.lotteryUserOrder({
                                    current: conf.order.pageNum,
                                    size: conf.order.pageSize,
                                    lotteryId: conf.lotteryId
                                })

                                let coinlistArr = await svalue.getCoinlist() //货币数据
                                data.records.forEach((item: any) => {
                                    item.typeName = 'Animals'
                                    item.openNumber = item.betOpenCode

                                    let obj = coinlistArr.find((into) => into.coinCode == item.betCoinCode)
                                    //默认钱包coinSymbol
                                    item.defaultWalletCoinSymbol =
                                        defaultWalletInfo.coinSymbol == 'USDT' ? defaultWalletInfo.coinSymbol + ' ' : defaultWalletInfo.coinSymbol
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
                                        item.betPrizeMoney = 0.0
                                        PrizeMoneyResult = 0.0
                                    }
                                    let PrizeMoneyResultToFixed4 = sutil.dataHandling(PrizeMoneyResult)
                                    item.PrizeMoneyToFixed4 = PrizeMoneyResultToFixed4
                                })
                                conf.order.list = [...conf.order.list, ...data.records]
                                conf.order.total = data.total
                                console.log(conf.order.list);
                            },
                            moreMessage() {
                                if (conf.order.pageSize * conf.order.pageNum >= conf.order.total) return ''
                                conf.order.pageNum++
                                conf.order.getList()
                            },
                            getContent(code: string, type: number) {
                                if (!code) return ''
                                let str = ''
                                if (type == 1) {
                                    str = code.split('_')[1]
                                } else {
                                    let array = code.split(',')
                                    let strArr = ['A', 'B', 'C', 'D', 'E', 'F']
                                    const stIndex = array.indexOf('A');
                                    str = strArr[stIndex]
                                }
                                switch (str) {
                                    case 'A':
                                        return 'Exiaobao'
                                    case 'B':
                                        return 'Freshippo'
                                    case 'C':
                                        return 'Piaopiao'
                                    case 'D':
                                        return 'Xiazai'
                                    case 'E':
                                        return 'Zhixiaobao'
                                    case 'F':
                                        return 'Huanxing'
                                    default:
                                        return ''
                                }
                            }
                        }
                    })
                    const event = Scope.Event()
                    event.on(EPage.scrollBottom, () => {
                        conf.order.moreMessage()
                    })
                    onMounted(() => {
                        const { lotteryId } = System.getRouterParams();
                        if (lotteryId) {
                            conf.lotteryId = lotteryId
                            conf.order.getList()
                        }
                    })
</script>
                    <style lang="less" scoped>
                    .record {
                        padding: 20rem;

                        .record-item {
                            background: #fff;
                            border-radius: 16rem;
                            margin-bottom: 20rem;

                            .title {
                                padding: 20rem 30rem;
                                display: flex;
                                align-items: center;
                                justify-content: space-between;
                                border-bottom: 2rem solid #E4E4E4;

                                .issue {
                                    display: flex;
                                    align-items: center;
                                    color: #666;
                                    font-size: 25rem;

                                    .type {
                                        color: #333;
                                        margin-left: 20rem;
                                    }
                                }

                                .status {
                                    color: #333;
                                    font-size: 28rem;
                                }

                                .success {
                                    color: #E02F35;
                                }
                            }

                            .content {
                                padding: 20rem 30rem;

                                .line {
                                    color: #999;
                                    font-size: 28rem;
                                    margin-bottom: 10rem;

                                    span {
                                        color: #333;
                                        font-size: 500;
                                    }

                                    .success {
                                        color: #E02F35;
                                    }
                                }

                                .time {
                                    font-size: 22rem;
                                    color: #999;
                                    margin-top: 20rem;
                                }
                            }

                        }
                    }
                </style>