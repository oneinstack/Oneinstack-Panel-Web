<template>
    <div class="bet">
        <div class="tips">Animals running</div>
        <div class="type-list">
            <template v-for="(item, index) in conf.typeList" :key="index">
                <div class="type-item" @click="conf.selectType = index">
                    <div class="type-icon" :class="{ 'type-active': conf.selectType == index }">
                        <img class="type-img" :src="`/static/img/game/animal/${item}.png`" />
                    </div>
                    <span>{{ item }}</span>
                </div>
            </template>
        </div>
        <div class="ani-list">
            <template v-for="(item, index) in conf.numlist" :key="index">
                <div class="ani-item" :class="{ 'ani-active': index == conf.selectAnimal }"
                    @click="conf.changeType(index)">
                    <div class="ani-con">
                        <div class="ani-bg" :class="'ani-bg-' + index"></div>
                    </div>
                    <div class="money" v-if="index == conf.selectAnimal">
                        <div class="coin">$</div>20
                    </div>
                    <img class="img-bet" :src="`/static/img/game/animal/${item.img}-bet.png`" />
                    <div class="txt">
                        <div class="name">{{ item.name }}</div>
                        <div class="odds">1.95</div>
                    </div>
                </div>
            </template>
        </div>
        <div class="btn">
            <div class="btn-left">
                <div class="name">Consume</div>
                <div class="num">
                    <div class="total" @click="conf.changeType(conf.selectAnimal)">{{ conf.total }}</div>
                    <div class="count">$</div>
                </div>
            </div>
            <div class="btn-right" style="justify-content: center;" v-if="conf.selectAnimal == -1">
                <div>Guess</div>
            </div>
            <div class="btn-right" v-else>
                <div class="win">
                    <div>Guess correctly <span>1</span></div>
                    <div style="margin-top: 4rem;">Get <span>${{ conf.total * 1.95 }}</span></div>
                </div>
                <div class="line"></div>
                <div>Guess</div>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import { onMounted, reactive } from 'vue';

const conf = reactive({
    numlist: [] as any[],
    selectType: 0,
    typeList: ['1st', '2end', '3rd'],
    selectAnimal: -1,
    total: 20,
    changeType(index: number) {
        if (index == conf.selectAnimal) {
            conf.total = conf.total + 20
            if (conf.total >= 1000) conf.total = 20
            return
        }
        conf.total = 20
        conf.selectAnimal = index
    }
})

onMounted(() => {
    conf.numlist = [
        {
            img: 'exb',
            name: 'Exiaobao',
            num: 1
        },
        {
            img: 'hm',
            name: 'Freshippo',
            num: 2
        },
        {
            img: 'pp',
            name: 'Piaopiao',
            num: 3
        },
        {
            img: 'xz',
            name: 'Xiazai',
            num: 4
        },
        {
            img: 'zxb',
            name: 'Zhixiaobao',
            num: 5
        },
        {
            img: 'hx',
            name: 'Huanxing',
            num: 6
        }
    ]
})
</script>

<style lang="less" scoped>
.bet {
    background: url('/static/img/game/animal/bet-bg.png') no-repeat;
    width: 100%;
    background-size: 100% 100%;
    text-align: center;
    padding: 0 20rem 20rem;

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
        height: 120rem;
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

}
</style>