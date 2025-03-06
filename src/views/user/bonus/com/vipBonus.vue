<template>
    <div class="vip">
        <div class="vip-head">
            <img class="vip-img" src="/static/theme/black/vip/badge-none.png" />
            <div class="r-box">
                <div class="title flex-b-c">
                    <span>VIP {{ gradedInfo.userVipLevel }}</span>
                    <van-icon size="28rem" color="#BFBFBF" name="info-o" />
                </div>
                <div class="progress">
                    <div class="flex-b-c">
                        <span>Your VIP Progress</span>
                        <div class="p-num">
                            <span>0.0%</span>
                            <van-icon size="20rem" color="#BFBFBF" name="info-o" />
                        </div>
                    </div>
                    <div class="vip-tage">
                        <div class="finish" :style="{ width: gradedInfo.gradedPercentage + '%' }">
                            <div class="icon-big flex-center">
                                <div class="icon-second flex-center">
                                    <div class="icon-small"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="total">Total VIP Bonus Claimed</div>
        <div class="vip-btn flex-center">
            <img src="/static/theme/black/bonus/lock-close.png" />
            <span>Available at VIP {{ gradedInfo.gradedPercentage }}</span>
        </div>
    </div>
</template>
<script setup lang="ts">
import System from '@/utils/System';
import { reactive } from 'vue';

const props = defineProps({
    gradedInfo: {
        default: ():any => []
    }
})

</script>
<style lang="less" scoped>
.vip {
    background: linear-gradient(360deg, #323738 0%, #323738 31.92%, #435466 100%);
    padding: 20rem;
    border-radius: 20rem;

    .vip-head {
        display: flex;
        align-items: center;

        .vip-img {
            height: 160rem;
            height: 160rem;
        }

        .r-box {
            flex: 1;
            height: 160rem;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            color: #FFFFFF;
            font-size: 20rem;
            margin-left: 30rem;

            .title {
                font-family: Poppins;
                font-weight: 700;
                font-size: 36rem;
            }

            .progress {
                .p-num {
                    display: flex;
                    align-items: center;

                    span {
                        margin-right: 10rem;
                    }
                }

                .vip-tage {
                    height: 20rem;
                    background: #282C2D;
                    border-radius: 10rem;
                    margin-top: 30rem;
                    margin-left: 20rem;

                    .finish {
                        background: #6E96C6;
                        height: 100%;
                        border-radius: 7rem;
                        position: relative;

                        .icon-big {
                            background: #42505E;
                            width: 42rem;
                            height: 42rem;
                            border-radius: 50%;
                            position: absolute;
                            right: -14rem;
                            top: -14rem;

                            .icon-second {
                                background: #536C87;
                                width: 26rem;
                                height: 26rem;
                                border-radius: 50%;
                            }

                            .icon-small {
                                background: #6E96C6;
                                width: 14rem;
                                height: 14rem;
                                border-radius: 50%;
                            }
                        }
                    }
                }
            }
        }
    }

    .total {
        color: #BFBFBF;
        font-size: 20rem;
        margin-top: 30rem;
    }

    .vip-btn {
        background: #282C2D;
        height: 80rem;
        border-radius: 12rem;
        color: #BFBFBF;
        font-size: 24rem;
        margin-top: 20rem;

        img {
            width: 32rem;
            height: 32rem;
            margin-right: 20rem;
        }
    }
}
</style>