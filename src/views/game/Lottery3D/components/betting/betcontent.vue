<template>
    <div class="betting">
        <div class="betting-title">
            <img src="/static/img/betting-icon.png" />
            <span>{{ title }}</span>
        </div>
        <div class="betting-list">
            <template v-for="item in list" :key="item.oddsCode">
                <div class="betting-tem" :class="isSize ? 'type-item' : 'points-item'">
                    <img :src="`/static/img/game/3d/${item.imgUrl}.png`" />
                    <span>{{ oddsInfo[item.oddsCode] }}</span>
                </div>
            </template>
        </div>
    </div>
</template>
<script setup lang="ts">
import { onMounted } from 'vue'

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
    }
})

onMounted(() => {
    console.log('558');


})
</script>
<style lang="less" scoped>
.betting {
    padding-bottom: 24rem;
    background: linear-gradient(180deg, #FFF0E0 0%, #FFE1C3 100%);

    .betting-title {
        padding: 24rem;
        display: flex;
        align-items: center;

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
            padding: 20rem 0rem;
            border-radius: 16rem;
            box-shadow: 0 1.06667vw 1.06667vw #00000040;

            span {
                margin-top: 16rem;
                color: #45454d;
                font-size: 24rem;
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