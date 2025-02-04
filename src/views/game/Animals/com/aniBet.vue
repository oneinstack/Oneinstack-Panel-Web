<template>
    <div class="bet">
        <div class="tips">Animals running</div>
        <div class="top-type">
            <div class="type-list">
                <template v-for="(item, index) in options" :key="index">
                    <div class="type-item" @click="conf.changeType(item.key)">
                        <div class="type-icon" :class="{ 'type-active': conf.selectType == item.key }">
                            <img class="type-img" :src="`/static/img/game/animal/${item.key}.png`" />
                        </div>
                        <span>{{ item.key }}</span>
                    </div>
                </template>
            </div>
            <div style="width: 10%;">
                <img v-if="sconfig.userInfo && svalue.configv1['im_open']" class="share-img" style="margin-right: 24rem"
                    src="/static/img/share.png" :class="{ 'disabled': betShare }" @click="conf.share" />
            </div>
        </div>
        <div class="ani-list">
            <template v-for="(item, index) in conf.betTypeList" :key="index">
                <div class="ani-item" :class="{ 'ani-active': item.selectBet }" @click="conf.changeAni(item, index)">
                    <div class="ani-con">
                        <div class="ani-bg" :class="'ani-bg-' + index"></div>
                    </div>
                    <div class="money" @click.stop="" v-if="item.selectBet">
                        <div class="minus" @click.stop="conf.changCount(item, '-')">-</div>
                        <div class="num">
                            <div class="coin">{{ conf.betCoin }}</div>{{ item.betMoney }}
                        </div>
                        <div class="add" @click.stop="conf.changCount(item, '+')">+</div>
                    </div>
                    <img class="img-bet" :src="`/static/img/game/animal/${item.img}-bet.png`" />
                    <div class="txt">
                        <div class="name">{{ item.name }}</div>
                        <div class="odds">{{ item[conf.selectType + 'odds'] || 0 }}</div>
                    </div>
                    <div class="addMoney" v-if="item.selectBet && conf.showAddani[index]">+{{
                        conf.quickRechargeAmount.list[conf.amount] }}</div>
                </div>
            </template>
        </div>
        <div class="btn">
            <div class="btn-left">
                <div class="name">{{ $t('ar.bet_amount') }}</div>
                <div class="num">
                    <van-icon name="arrow-left" size="36rem" color="#fff" @click.stop="conf.changeAmount('-')" />
                    <div class="total">{{ conf.betCoin }}{{ conf.quickRechargeAmount.list[conf.amount] }}</div>
                    <van-icon name="arrow" size="36rem" color="#fff" @click.stop="conf.changeAmount('+')" />
                </div>
            </div>
            <div class="btn-right" style="justify-content: center;" v-if="!getWinMoney" @click="conf.changeBet">
                <div>{{ $t('ar.guess') }}</div>
            </div>
            <div class="btn-right" @click="conf.changeBet" v-else>
                <div class="win">
                    <div>{{ $t('ar.betting_amount') }}</div>
                    <div style="margin-top: 4rem;font-size: 25rem;"><span>{{ `${conf.betCoin}${getWinMoney}` }}</span>
                    </div>
                </div>
                <div class="line"></div>
                <div>{{ $t('ar.guess') }}</div>
            </div>
        </div>
        <div class="mosk" v-if="stopBet"></div>
    </div>
</template>
<script setup lang="ts">
import i18n from '@/lang';
import sconfig from '@/sstore/sconfig';
import sutil from '@/sstore/sutil';
import System from '@/utils/System';
import { svalue } from '@/sstore/svalue'
import { computed, onMounted, reactive, watch } from 'vue';

const props = defineProps({
    options: {
        default: [] as any[]
    },
    listNumArr: {
        default: [] as any[]
    },
    stopBet: {
        default: false
    },
    defaultWalletInfo: {
        default: {} as any
    },
    betShare: {
        default: false
    }
})

const emit = defineEmits(['changeBet','share'])

const conf = reactive({
    selectType: '',
    selectAnimal: '',
    betMinMoney: 1,
    betMaxMoney: 10000,
    betCoin: '₹',
    amount: 0,
    showAddani: { 0: false, 1: false, 2: false, 3: false, 4: false, 5: false } as any,
    betTypeList: [] as any[],
    quickRechargeAmount: {
        list: [1, 10, 10, 500, 1000], // 快速下注列表
        get: async () => {
            const arr = sconfig.walletInfo.quickRechargeAmount.map((item: any) => parseInt(item))
            if (arr[0] != conf.betMinMoney) {
                conf.quickRechargeAmount.list = [conf.betMinMoney, ...arr]
            } else {
                conf.quickRechargeAmount.list = arr
            }
        }
    },
    changeType(key: string) {
        if (conf.selectType == key) return
        conf.selectType = key
        conf.reset()
        emit('changeBet', { type: key })
    },
    changeAni(item: any, index: number) {
        console.log(item);

        if (item.selectBet) {
            conf.showAddani[index] = true
            setTimeout(() => {
                conf.showAddani[index] = false
                item.betMoney = item.betMoney + conf.quickRechargeAmount.list[conf.amount]
            }, 600)

            if (item.betMoney >= conf.betMaxMoney) item.betMoney = conf.betMaxMoney
            return
        }
        item.selectBet = true
        item.betMoney = conf.quickRechargeAmount.list[conf.amount]
    },
    changCount(item: any, type: string) {
        if (type == '-' && item.betMoney > conf.betMinMoney) {
            item.betMoney--
        }
        if (type == '+' && item.betMoney < conf.betMaxMoney) {
            item.betMoney++
        }
    },
    changeBet() {
        if (!getWinMoney.value) {
            System.toast(i18n.t('common.SelectType'))
            return
        }
        let list = conf.betTypeList.filter((item: any) => item.selectBet)
        emit('changeBet', { list, selectType: conf.selectType })
    },
    share() {
        if (!getWinMoney.value) {
            System.toast(i18n.t('common.SelectType'))
            return
        }
        let list = conf.betTypeList.filter((item: any) => item.selectBet)
        emit('share', {list,type: conf.selectType} )
    },
    changeAmount(type: string) {
        if (type == '-' && conf.amount > 0) {
            conf.amount--
        }
        if (type == '+' && conf.amount < conf.quickRechargeAmount.list.length - 1) {
            conf.amount++
        }
        conf.betTypeList.forEach((item) => {
            item.betMoney = conf.quickRechargeAmount.list[conf.amount]
        })
    },
    reset() {
        conf.betTypeList.forEach((item) => {
            item.betMoney = 0
            item.selectBet = false
        })
    }
})

const getWinMoney = computed(() => {
    let total = 0
    conf.betTypeList.forEach((item) => {
        if (item.selectBet) total = sutil.addNum(total, item.betMoney)
    })
    return total
})
watch(
    () => props.defaultWalletInfo,
    (val: any) => {
        conf.betMinMoney = parseFloat(sutil.dataHandling(val.betMinAmount))
        conf.betMaxMoney = parseFloat(val.betMaxAmount)
        conf.quickRechargeAmount.get()
        conf.betCoin = val.coinSymbol
    },
    { deep: true }
)
onMounted(() => {
    conf.selectType = props.options[0].key
    conf.betTypeList = props.listNumArr
})
</script>

<style lang="less" scoped>
.bet {
    background: url('/static/img/game/animal/bet-bg.png') no-repeat;
    width: 100%;
    background-size: 100% 100%;
    text-align: center;
    padding: 0 20rem 20rem;
    position: relative;

    .tips {
        color: #933D00;
        font-size: 24rem;
        font-weight: 600;
        background: linear-gradient(90deg, #FDE49F 0%, #FAC564 100%);
        display: inline-block;
        padding: 6rem 50rem 10rem;
        border-radius: 0 0 48rem 48rem;
        clip-path: polygon(0 0, 100% 0, 90% 100%, 10% 100%)
    }

    .top-type {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 20rem;
    }

    .type-list {
        display: flex;

        .type-item {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-right: 40rem;

            .type-icon {
                height: 60rem;
                padding: 4rem;
                border-radius: 50%;
                background: #ffd8c3;
            }

            .type-active {
                background: #ff5757;
            }

            .type-img {
                height: 100%;
            }

            span {
                color: #933D00;
                font-size: 32rem;
                margin-left: 10rem;
            }
        }
    }

    .share-img {
        width: 47rem;
        height: 35rem;
        margin-left: 20rem;
    }

    .ani-list {
        display: flex;
        flex-wrap: wrap;
        width: 100%;
        margin-top: 30rem;

        .ani-item {
            height: 120rem;
            width: 32%;
            background-image: linear-gradient(117deg, #FDF3CF 0%, #FEE7B5 100%);
            border-radius: 6px;
            border: 4rem solid #fff;
            position: relative;
            margin-right: 2%;
            margin-bottom: 22rem;

            &:nth-child(3n + 3) {
                margin-right: 0rem;
            }

            &.ani-active {
                box-shadow: 1px 1px 4px 0px #FB5352CC;
                box-shadow: -1px -1px 4px 0px #FB5352CC inset;
                border: 4rem solid #FF4F4F;

                .money {
                    background: #FF4F4F;
                    display: inline-block;
                    padding: 6rem 16rem;
                    position: absolute;
                    top: -24rem;
                    right: 20rem;
                    color: #fff;
                    font-size: 20rem;
                    border-radius: 25rem;
                    display: flex;
                    align-items: center;

                    .num {
                        display: flex;
                        align-items: center;
                        margin: 0 6rem;
                    }

                    .add {
                        margin-left: 6rem;
                        padding-bottom: 3rem;
                    }

                    .coin {
                        width: 32rem;
                        height: 32rem;
                        background-size: 100% 100%;
                        background-image: url('/static/img/coin-task.png');
                        color: #faa54b;
                        font-size: 14rem;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }
                }

            }

            .ani-con {
                position: absolute;
                inset: 2rem;
                overflow: hidden;
            }

            .ani-bg {
                width: 80rem;
                height: 135rem;
                transform: rotate(50deg);
                background: #FFE2C4;
                border-radius: 22px;
                position: absolute;
                bottom: -40rem;
                left: 20rem;
            }

            .ani-bg-0,
            .ani-bg-3 {
                background: linear-gradient(177.16deg, #FFE8B9 2.68%, #FFDDA0 33.87%);
            }

            .ani-bg-1,
            .ani-bg-4 {
                background: linear-gradient(177.16deg, #E9ECD3 2.68%, #EAE5C7 33.87%);
            }

            .ani-bg-2,
            .ani-bg-5 {
                background: linear-gradient(177.16deg, #FFE2C5 2.68%, #FFD7AE 33.87%);
            }

            .img-bet {
                z-index: 8;
                position: absolute;
                bottom: 0;
                left: 0;
                height: 90rem;
            }

            .txt {
                position: absolute;
                z-index: 8;
                bottom: 10rem;
                right: 15rem;

                .name {
                    font-family: PingFangSC-Regular;
                    font-size: 24rem;
                    color: #8C3700;
                }

                .odds {
                    font-size: 28rem;
                    color: #FB3934;
                    text-align: right;
                    font-weight: 600;
                }
            }

            .addMoney {
                color: #FB3934;
                position: absolute;
                left: 55%;
                bottom: 90%;
                animation: down-animation 0.6s linear infinite both;
                font-size: 32rem;
                z-index: 10;
            }

            @keyframes down-animation {
                0% {
                    // transform: rotate(90deg) scale(0.9);
                    bottom: 35%;
                }

                100% {
                    // transform: rotate(90deg) scale(0.9);
                    bottom: 90%;
                }
            }
        }
    }

    .btn {
        height: 110rem;
        width: 100%;
        display: flex;
        margin-top: 10rem;

        .btn-left {
            height: 100%;
            background: linear-gradient(180deg, #FFD36D 0%, #FFC313 100%);
            box-shadow: 2px -4px 4px 0px #FFB212 inset;
            width: 300rem;
            border-radius: 20rem 0 0 20rem;
            padding: 10rem 20rem 0rem;

            .name {
                color: #933C00;
                font-size: 22rem;
                margin-bottom: 6rem;
            }

            .num {
                display: flex;
                justify-content: space-between;
                align-items: center;

                .count {
                    color: #933C00;
                    font-size: 30rem;
                    margin-left: 4rem;
                }

                .total {
                    color: #933C00;
                    font-size: 36rem;

                }
            }
        }

        .btn-right {
            flex: 1;
            height: 100%;
            background: linear-gradient(180deg, #FE908C 0%, #F24F4F 100%);
            box-shadow: -2px -4px 4px 0px #F34F4F inset;
            border-radius: 0 20rem 20rem 0;
            color: #fff;
            font-size: 42rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 20rem;
        }

        .win {
            color: #fff;
            font-size: 20rem;
            text-align: left;

            span {
                color: #FFC72C;
            }
        }

        .line {
            width: 2rem;
            height: 40rem;
            background: #fff;
            opacity: 0.3;
        }
    }

    .mosk {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        z-index: 9;
        border-radius: 40rem 40rem 0 0;
    }

}

.disabled {
    filter: grayscale(1);
}
</style>