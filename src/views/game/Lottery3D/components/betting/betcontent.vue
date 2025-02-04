<template>
    <div class="betting">
        <div class="betting-title">
            <div>
                <img src="/static/img/betting-icon.png" />
                <span>{{ title }}</span>
            </div>
            <div class="btn-list" :class="{'disabled': disabled}" v-if="randomShow">
                <div class="btn-item" @click="conf.random('random')">{{ $t('3d.random') }}</div>
                <div class="btn-item" style="margin-left: 20rem;"  @click="conf.random('clear')">
                    <div class="clear">
                        <span>{{ $t('3d.clear') }}</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="betting-list">
            <template v-for="item in list" :key="item.oddsCode">
                <div class="betting-tem " @click="conf.changeBet(item)"
                    :class="[isSize ? 'type-item' : 'points-item', item.isActive ? 'active' : '', disabled ? 'disabled' : '']">
                    <img v-if="isImg" :src="`/static/img/game/3d/${item.imgUrl}.png`" />
                    <div class="txt-box" v-else>
                        <div class="txt" :class="{ 'small': item.imgUrl.length > 10 }">{{ item.imgUrl }}</div>
                    </div>
                    <span>{{ oddsInfo[item.oddsCode] }}</span>
                </div>
            </template>
        </div>
    </div>
</template>
<script setup lang="ts">
import { reactive } from 'vue'

const emit = defineEmits(['change'])

const props = defineProps({
    list: {
        default: [] as any[]
    },
    title: {
        default: ''
    },
    oddsInfo: {
        default: {} as any
    },
    isSize: {
        default: true
    },
    disabled: {
        default: false
    },
    isImg: {
        default: true
    },
    randomShow: {
        default: true
    }
})

const conf = reactive({
    changeBet(item: any) {
        if (props.disabled) return
        item.isActive = !item.isActive
        let list = props.list.filter((it: any) => it.isActive)
        emit('change', {list, type:''})
    },
    random(type: string) {
        if (props.disabled) return
        emit('change', {list: [],type})
    }
})
</script>
<style lang="less" scoped>
.betting {
    padding-bottom: 24rem;
    background: linear-gradient(180deg, #FFF0E0 0%, #FFE1C3 100%);

    .betting-title {
        padding: 24rem 24rem 16rem;
        display: flex;
        align-items: center;
        justify-content: space-between;

        img {
            width: 24rem;
            height: 24rem;
        }

        span {
            margin-left: 8rem;
            font-weight: 700;
            font-size: 28rem;
        }

        .btn-list {
            display: flex;

            .btn-item {
                // padding: 0rem 30rem;
                background: linear-gradient(328.56deg, #FC9B01 18.81%, #ED6530 77.66%);
                color: #fff;
                font-size: 22rem;
                border-radius: 30rem;
                height: 54rem;
                min-width: 130rem;
                padding: 2rem 2rem 2rem 3rem;
                display: flex;
                justify-content: center;
                align-items: center;

                .clear {
                    background: #fed;
                    width: 100%;
                    height: 100%;
                    border-radius: 60rem;
                    display: flex;
                    justify-content: center;
                    align-items: center;

                    span {
                        background-image: linear-gradient(328.56deg, #FF7502 18.81%, #FC9B01 77.66%);
                        -webkit-background-clip: text;
                        background-clip: text;
                        -webkit-text-fill-color: transparent;
                        font-size: 22rem;
                    }
                }
            }

        }
    }

    .betting-list {
        margin-bottom: 32rem;
        padding: 0rem 24rem;
        display: flex;
        flex-wrap: wrap;

        .betting-tem {
            margin-top: 20rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            background: #FFF;
            padding: 20rem 8rem;
            border-radius: 16rem;
            box-shadow: 0 1.06667vw 1.06667vw #00000040;
            border: 2rem solid transparent;

            &.active {
                border: 2rem solid #ff7502;
                background: #fff2e9;
            }

            span {
                margin-top: 16rem;
                color: #45454d;
                font-size: 24rem;
            }
        }

        .txt-box {
            border: 2rem solid #EAEAEA;
            border-radius: 8rem;
            width: 100%;
            color: #333333;
            height: 60rem;
            padding: 1rem 1rem 4rem;
            margin: 10rem 0;

            .txt {
                height: 100%;
                background: linear-gradient(180deg, #FFFFFF 0%, #EEEEEF 100%);
                border-radius: 0 0 10rem 10rem;
                display: flex;
                justify-content: center;
                align-items: center;
                font-size: 26rem;
            }

            .small {
                font-size: 20rem;
            }
        }

        .type-item {
            width: 23%;
            margin-right: 2.66%;

            img {
                width: 96rem;
                height: 96rem;
            }

            &:nth-child(4n + 4) {
                margin-right: 0rem;
            }
        }

        .points-item {
            width: 15%;
            margin-right: 2%;

            img {
                width: 76rem;
                height: 76rem;
            }

            &:nth-child(6n + 6) {
                margin-right: 0rem;
            }
        }
    }

    .disabled {
        filter: grayscale(1);
    }
}
</style>