<template>
    <div class="bonus-box">
        <div class="b-name flex-b-c">
            <span>Deposit Bonus</span>
            <van-icon size="28rem" color="#BFBFBF" name="info-o" />
        </div>
        <div class="coin">Get up to: <span>20,000 INR</span></div>
        <div class="box">
            <div class="bar">
                <div class="bonus-img flex-b-c">
                    <template v-for="item in bonusList" :key="item.imgUrl">
                        <img class="b-img" :src="`/static/theme/black/bonus/${item.imgUrl}.png`" />
                    </template>
                </div>
                <div class="bar-line"></div>
                <div class="bar-list">
                    <template v-for="(item, index) in bonusList" :key="item.num">
                        <div class="bar-item" :class="{ 'bar-active': index == 0 }">
                            <div class="quare"></div>
                            <div class="num">{{ item.num }}</div>
                        </div>
                    </template>
                </div>
            </div>
        </div>
        <div>Bonus ends:<span style="color: #fff;">17h 09m</span></div>
        <div class="bonus-btn">
            <greenBtn>
                <span style="font-size: 32rem;">Deposit Now</span>
            </greenBtn>
        </div>
    </div>
</template>
<script setup lang="ts">
import greenBtn from '@/views/home/theme/black/components/greenBtn.vue';

const props = defineProps({
    bonusList: {
        default: ():any => []
    }
})

</script>
<style lang="less" scoped>
.bonus-box {
    background: linear-gradient(180deg, #473F32 0%, #323939 100%);
    border-radius: 20rem;
    padding: 24rem;
    color: #BFBFBF;
    font-size: 24rem;

    .b-name {
        font-family: Poppins;
        font-weight: 600;
        font-size: 28rem;
        color: #fff;
    }

    .coin {
        margin-top: 4rem;

        span {
            color: #1CF187;
        }
    }

    .box {
        margin: 160rem 0rem 70rem;

        .bar {
            position: relative;

            .bonus-img {
                position: absolute;
                left: 0;
                right: 0;
                bottom: 35rem;

                .b-img {
                    width: 120rem;
                    height: 120rem;
                }
            }

            .bar-line {
                background: #232626;
                height: 16rem;
                margin: 0rem 50rem;
            }

            .bar-list {
                display: flex;
                justify-content: space-between;
                position: absolute;
                left: 0;
                right: 0;
                top: -7rem;
                padding: 0rem 20rem;

                .bar-item {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;

                    .quare {
                        background: #232626;
                        width: 28rem;
                        height: 28rem;
                        transform: rotate(45deg);
                        border: 2rem solid #232626;
                    }

                    .num {
                        margin-top: 12rem;
                    }

                }

                .bar-active {
                    color: #FFBA08;

                    .quare {
                        background: linear-gradient(315deg, #DFD02F -0.17%, #7A752B 100%);
                    }
                }
            }
        }
    }

    .bonus-btn {
        height: 80rem;
        margin-top: 16rem;
    }
}
</style>