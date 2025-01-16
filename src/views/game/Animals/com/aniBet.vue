<template>
    <div class="bet">
        <div class="tips">Animals running</div>
        <div class="type-list">
            <template v-for="(item, index) in options" :key="index">
                <div class="type-item" @click="conf.changeType(item.key)">
                    <div class="type-icon" :class="{ 'type-active': conf.selectType == item.key}">
                        <img class="type-img" :src="`/static/img/game/animal/${item.key}.png`" />
                    </div>
                    <span>{{ item.key }}</span>
                </div>
            </template>
        </div>
        <div class="ani-list">
            <template v-for="(item, index) in listNumArr" :key="index">
                <div class="ani-item" :class="{ 'ani-active': item.key == conf.selectAnimal }"
                    @click="conf.changeAni(item.key,index)">
                    <div class="ani-con">
                        <div class="ani-bg" :class="'ani-bg-' + index"></div>
                    </div>
                    <div class="money" v-if="item.key == conf.selectAnimal">
                        <div class="coin">{{ conf.betCoin }}</div>{{ conf.betMinMoney }}
                    </div>
                    <img class="img-bet" :src="`/static/img/game/animal/${item.img}-bet.png`" />
                    <div class="txt">
                        <div class="name">{{ item.name }}</div>
                        <div class="odds">{{ item[conf.selectType + 'odds'] || 0 }}</div>
                    </div>
                </div>
            </template>
        </div>
        <div class="btn">
            <div class="btn-left" @click="conf.changeMul">
                <div class="name">Consume</div>
                <div class="num">
                    <div class="total">{{ conf.total }}</div>
                    <div class="count">{{ conf.betCoin }}</div>
                </div>
            </div>
            <div class="btn-right" style="justify-content: center;" v-if="!conf.selectAnimal" @click="conf.changeBet">
                <div>Guess</div>
            </div>
            <div class="btn-right" @click="conf.changeBet" v-else>
                <div class="win">
                    <div>Guess correctly <span>1</span></div>
                    <div style="margin-top: 4rem;">Get <span>{{ `${conf.betCoin}${getWinMoney}` }}</span></div>
                </div>
                <div class="line"></div>
                <div>Guess</div>
            </div>
        </div>
        <div class="mosk" v-if="stopBet"></div>
    </div>
</template>
<script setup lang="ts">
import i18n from '@/lang';
import sutil from '@/sstore/sutil';
import System from '@/utils/System';
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
    }
})

const emit = defineEmits(['changeBet'])

const conf = reactive({
    selectType: '',
    selectAnimal: '',
    selectIndex: 0,
    total: 0,
    betMinMoney: 1,
    betMaxMoney: 10000,
    betCoin: '₹',
    changeType(key: string) {
        conf.selectType = key
        emit('changeBet',{type: key})
    },
    changeAni(key: string,index:number) {
        if (key == conf.selectAnimal) {
            conf.total = conf.total + conf.betMinMoney
            if (conf.total >= conf.betMaxMoney) conf.total = conf.betMinMoney
            return
        }
        conf.total = conf.betMinMoney
        conf.selectAnimal = key
        conf.selectIndex = index
    },
    changeMul() {
        conf.total = conf.total + conf.betMinMoney
        if(conf.betMaxMoney > 10000) conf.betMaxMoney = 10000  
        if (conf.total > conf.betMaxMoney) conf.total = conf.betMinMoney
    },
    changeBet() {
        if(!conf.selectAnimal) {
            System.toast(i18n.t('common.SelectType'))
            return
        }
        emit('changeBet',{balance: conf.total,code: conf.selectType + '_' + conf.selectAnimal})
    }
})

const getWinMoney = computed(() => {
    let odds = props.listNumArr[conf.selectIndex][conf.selectType + 'odds'] || 1
    return sutil.dataHandling(conf.total * odds)
})
watch(
  () => props.defaultWalletInfo,
  (val: any) => {
    conf.betMinMoney = parseFloat(sutil.dataHandling(val.betMinAmount))
    conf.betMaxMoney = parseFloat(val.betMaxAmount)
    
    conf.betCoin = val.coinSymbol
  },
  { deep: true }
)
onMounted(() => {
    conf.selectType = props.options[0].key
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

    .type-list {
        width: 100%;
        display: flex;
        margin-top: 20rem;

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
            margin-bottom: 20rem;

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
                    padding: 0rem 16rem 0rem 10rem;
                    position: absolute;
                    top: -18rem;
                    right: 20rem;
                    color: #fff;
                    font-size: 20rem;
                    border-radius: 20rem;
                    display: flex;
                    align-items: center;

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
            padding: 16rem 25rem 20rem;

            .name {
                color: #933C00;
                font-size: 22rem;
                margin-bottom: 10rem;
            }

            .num {
                display: flex;
                justify-content: center;
                align-items: flex-end;

                .count {
                    color: #933C00;
                    font-size: 30rem;
                    margin-left: 4rem;
                }

                .total {
                    color: #933C00;
                    font-size: 40rem;

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
    .mosk{
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        z-index: 9;
        border-radius: 40rem 40rem 0 0;
    }

}
</style>