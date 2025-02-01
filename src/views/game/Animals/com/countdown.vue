<template>
    <transition name="fade-slide-down" mode="out-in">
        <div class="down-popup" v-if="showDown">
            <div class="down-content">
                <div style="display: flex;justify-content: center;">
                    <div class="time-box">
                        <div class="result">{{ openExpect }}</div>
                        <div class="time">
                            {{ times[1] || '00' }}<span style="margin-left: 12rem;">:</span>{{ times[2] || '00' }}
                        </div>
                    </div>
                </div>
                <div class="line">
                    <div class="line-item"></div>
                    <div class="line-item" style="margin-left: 100rem;"></div>
                </div>
                <div class="total">
                    <div class="tips">The past 100 championships</div>
                    <div class="list">
                        <div class="list-item" v-for="(item, index) in totalList" :key="index">
                            <img class="img" :src="`/static/img/game/animal/${item.img}.png`" />
                            <div class="num">
                                <img class="glass-img" :src="`/static/img/game/animal/glass-${active}.png`" />
                                <div>{{ item[active] }}</div>
                            </div>
                        </div>
                    </div>
                    <div class="more" @click="emit('showMore')">
                        <div class="txt">More</div>
                        <van-icon name="arrow" size="20rem" color="#E34348" />
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>
<script setup lang="ts">

const props = defineProps({
    times: {
        default: [] as any
    },
    totalList: {
        default: [] as any
    },
    active: {
        default: 'st'
    },
    openExpect: {
        default: ''
    },
    showDown: {
        default: false
    }
})

const emit = defineEmits(['showMore'])

</script>
<style lang="less" scoped>
.down-popup {
    position: absolute;
    inset: 0;
    z-index: 9;
    display: flex;
    justify-content: center;
    align-items: center;
    padding-top: 20%;

    .down-content {
        .time-box {
            background: #FFFFFF;
            box-shadow: 1px 1px 8rem 0px #FFBECEE5 inset;
            box-shadow: -1px -1px 8rem 0px #FFBECEE5 inset;
            display: flex;
            flex-direction: column;
            padding: 6rem 24rem 16rem;
            border-radius: 24rem;

            .result {
                color: #FF898D;
                font-size: 22rem;
                text-align: center;
                margin-bottom: 4rem;

            }

            .time {
                background: #DC534F;
                display: inline-block;
                text-align: center;
                color: #fff;
                font-size: 44rem;
                font-weight: 800;
                padding: 16rem 0rem;
                border-radius: 16rem;
                width: 240rem;
                font-size: 32px;
                font-family: 'XS';
                /* 可使用数字风格字体 */
            }
        }
    }

    .line {
        display: flex;
        justify-content: center;

        .line-item {
            background: #FFFFFF;
            box-shadow: 1px 1px 2px 0px #FFBECE80 inset;
            box-shadow: -1px -1px 2px 0px #FFBECE80 inset;
            width: 20rem;
            height: 20rem;
        }
    }

    .total {
        background: linear-gradient(180deg, #FFFFFF 4.63%, #FFDADA 100%);
        box-shadow: 2px -7px 6px 0px #FFA5B3B2 inset;
        box-shadow: -2px -6px 6px 0px #FFA5B3B2 inset;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20rem;
        border-radius: 16rem;

        .tips {
            box-shadow: 1px 1px 4px 0px #FF8400 inset;
            box-shadow: -1px -1px 4px 0px #FF8400 inset;
            background: #FFAA00;
            color: #fff;
            font-size: 22rem;
            padding: 10rem 40rem;
            border-radius: 30rem;
        }

        .list {
            display: flex;
            margin-top: 20rem;

            .list-item {
                text-align: center;
                margin-left: 10rem;

                &:first-of-type {
                    margin-left: 0rem;
                }

                .img {
                    height: 90rem;
                }

                .num {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #333;
                    font-weight: 500;
                    font-size: 24rem;

                    .glass-img {
                        height: 30rem;
                        margin-right: 2rem;
                    }
                }
            }
        }

        .more {
            display: flex;
            align-items: center;
            margin-top: 30rem;
            margin-bottom: 10rem;

            .txt {
                color: #E34348;
                font-size: 28rem;
                font-weight: 500;
                margin-right: 6rem;
            }
        }
    }
}
/* 从上向下渐入渐出 */
.fade-slide-down-enter-active,
.fade-slide-down-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-down-enter-from,
.fade-slide-down-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}
</style>