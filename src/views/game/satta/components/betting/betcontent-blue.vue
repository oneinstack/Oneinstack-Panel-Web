<template>
    <div class="betting">
        <div class="betting-title">
            <div>
                <img src="/static/theme/blue/betting-icon.png" />
                <span>{{ $t('coupon.type') }}</span>
            </div>
        </div>
        <div class="betting-list">
            <template v-for="item in list" :key="item.oddsCode">
                <div class="betting-tem type-item" @click="conf.changeBet(item)"
                    :class="[betList.find((v: any) => v.oddsId == item.oddsId) ? 'active' : '', disabled ? 'disabled' : '']">
                    <div class="txt-box">
                        <div class="txt">{{ item.number }}</div>
                    </div>
                    <span>{{ parseFloat(item.odds) }}</span>
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

    betList: {
        default: [] as any[]
    },
    disabled: {
        default: false
    }
})

const conf = reactive({
    changeBet(item: any) {
        if (props.disabled) return
        emit('change', item)
    }
})
</script>
<style lang="less" scoped>
.betting {
    padding-bottom: 24rem;
    background: linear-gradient(180deg, #F5F8FF 0%, #E6F2FF 100%);

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

            .txt-box {
                width: 80rem;
                height: 80rem;
                flex-shrink: 0;
                background: linear-gradient(142.21deg, #dfedff 14.37%, #9ec9ff 88.03%);
                box-shadow: 0 0 4.28rem #ffffff40 inset;
                border-radius: 50%;
                display: flex;
                justify-content: center;
                align-items: center;
                // color: #F5843F;
                font-size: 34rem;
                font-weight: 700;
                box-shadow: 0rem 4rem 12rem rgba(0, 0, 0, 0.4);

                .txt {
                    background: linear-gradient(93.51deg, #006fff 5.72%, #087bff 86.61%);
                    background-clip: text !important;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
            }

            &.active {
                border: 2rem solid #296AED;
                background: #E6F2FF;

                .txt-box {
                    background: linear-gradient(0deg, #fb0823 85%, #e2061f 100%);
                    box-shadow: 0rem 4rem 12rem rgba(0, 0, 0, 0.4);

                    .txt {
                        background: #fff;
                        background-clip: text !important;
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                    }
                }
            }

            span {
                margin-top: 16rem;
                color: #45454d;
                font-size: 24rem;
            }
        }

        .type-item {
            width: 18.8%;
            margin-right: 1.5%;

            img {
                width: 96rem;
                height: 96rem;
            }

            &:nth-child(5n + 5) {
                margin-right: 0rem;
            }
        }
    }

    .disabled {
        filter: grayscale(1);
    }
}
</style>