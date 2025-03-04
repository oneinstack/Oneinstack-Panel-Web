<template>
    <div class="table-item flex-b-c">
        <div class="l-name">{{ item.tradeObjName || tradeLable || '--' }}</div>
        <div class="r-amount">
            <div class="money">
                <div>
                    <span>{{ conf.addNumType.includes(item.tradeType) ? '+' : '-' }}</span>
                    {{ (item.coinSymbol || '') + item.money }}
                </div>
                <img class="coin-img" :src="item.nationalFlag" v-if="item.nationalFlag" />
            </div>
            <div class="status">
                <div class="s-l" v-if="item.tradeStatus == 1">
                    <div class="icon"></div>
                    <div class="status-name">{{ i18n.t('otcOrderModule.statusList.1') }}</div>
                </div>
                <div class="s-l" v-else-if="item.tradeStatus == -1">
                    <div class="icon failed"></div>
                    <div class="status-name">{{ i18n.t('otcOrderModule.statusList.2') }}</div>
                </div>
                <div class="s-l" v-else-if="item.tradeStatus == 0">
                    <div class="icon under"></div>
                    <div class="status-name">{{ i18n.t('otcOrderModule.statusList.0') }}</div>
                </div>
                <van-icon size="24rem" color="#B3BEC1" name="arrow" />
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import i18n from '@/lang'
import { reactive } from 'vue';


const props = defineProps({
    item: {
        default: (): any => { }
    },
    tradeLable: {
        default: ''
    }
})

const emit = defineEmits(['click'])

const conf = reactive({
    addNumType: [1, 3, 5, 6, 8, 10, 12, 13, 15, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33],
})

</script>

<style lang="less" scoped>
.table-item {
    font-family: Poppins;
    font-weight: 600;
    font-size: 24rem;
    border-top: 2rem solid #3B4041;
    padding: 20rem 12rem;

    &:first-of-type {
        border-top: none;
    }

    .l-name {
        color: #fff;
        font-size: 28rem;
    }

    .r-amount {
        display: flex;
        flex-direction: column;
        align-items: flex-end;

        .money {
            display: flex;
            align-content: center;
            color: #1CF187;

            .coin-img {
                height: 30rem;
                border-radius: 2rem;
                margin-left: 10rem;
            }
        }

        .status {
            display: flex;
            align-items: center;
            margin-top: 4rem;
            .s-l{
                display: flex;
                align-items: center;
            }

            .icon {
                width: 10rem;
                height: 10rem;
                border-radius: 50%;
                background: #04BD41;
            }

            .failed{
                background: #BD1904;
            }

            .under{
                background: #FF9820;
            }

            .status-name {
                color: #B3BEC1;
                font-weight: 700;
                margin: 0rem 10rem;
            }
        }
    }
}
</style>