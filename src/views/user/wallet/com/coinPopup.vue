<template>
    <van-popup class="popup-bottom-center" :show="show" position="bottom" borderRadius='16' :round="true"
        @close="emit('close')">
        <div class="popup-content">
            <div class="title flex-center">
                <span>{{ $t('me.switchLanguage') }}</span>
                <div class="arrow flex-center" @click.stop="emit('close')">
                    <van-icon size="28rem" color="#fff" name="cross" />
                </div>
            </div>
            <div class="search">
                <div class="r-input flex-center">
                    <van-icon size="36rem" color="#BFBFBF" name="search" />
                    <input class="place" placeholder="Search Game" v-model.trim="conf.keyword" />
                </div>
            </div>
            <div class="select-list">
                <template v-for="item of getList" :key="item.id">
                    <div class="select-item flex-b-c" :class="{ 'select-active': item.id == selectId }"
                        @click="emit('change', item)">
                        <div class="lang-left">
                            <img class="left-img" :src="item.nationalFlag" />
                            <span>{{ item.walletCoin }}</span>
                        </div>
                        <div>
                            {{ item.walletMoney }}
                        </div>
                    </div>
                </template>
            </div>
        </div>
    </van-popup>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue';


const props = defineProps({
    show: {
        default: false
    },
    dataArr: {
        default: [] as any[]
    },
    selectId: {

    }
})

const emit = defineEmits(['close', 'change'])

const conf = reactive({
    keyword: ''
})

const getList: any = computed(() => {
    if (conf.keyword) {
        return props.dataArr.filter(
            (item) =>
                item.walletCoin.includes(conf.keyword.toUpperCase())
        )
    }
    return props.dataArr;
})

</script>

<style lang="less" scoped>
.popup-content {
    background: #232626;

    .title {
        height: 100rem;
        color: #fff;
        font-size: 28rem;
        position: relative;

        .arrow {
            position: absolute;
            right: 24rem;
            top: calc(50% - 28rem);
            width: 48rem;
            height: 48rem;
            background: #464F50;
            border-radius: 12rem;
            z-index: 2;
        }
    }

    .search {
        height: 80rem;
        background: #292D2E;
        border: 1px solid #383E3E;
        display: flex;
        align-items: center;
        margin: 24rem 24rem;
        border-radius: 14rem;
        padding: 0rem 16rem;
        flex-shrink: 0;

        .place {
            color: #BFBFBF;
            font-size: 25rem;
            margin-left: 20rem;
        }
    }

    .select-list {
        padding: 0 24rem 24rem;

        .select-item {
            height: 90rem;
            padding: 0rem 16rem;
            color: #fff;
            font-size: 26rem;
            margin-bottom: 10rem;

            .lang-left {
                display: flex;
                align-items: center;

                .left-img {
                    height: 42rem;
                    margin-right: 20rem;
                }
            }

            .icon {
                border: 3rem solid #36393A;
                width: 40rem;
                height: 40rem;
                border-radius: 50%;
            }
        }

        .select-active {
            background: #323738;
            border-radius: 12rem;

            .icon {
                border: 8rem solid #1CF187;
            }
        }
    }
}
</style>