<template>
    <van-popup class="popup-bottom-center" :show="show" position="bottom" borderRadius='16' :round="true"
        @close="emit('close')">
        <div class="popup-content">
            <div class="title flex-center">
                <span>Select</span>
                <div class="arrow flex-center" @click.stop="emit('close')">
                    <van-icon size="28rem" color="#fff" name="cross" />
                </div>
            </div>
            <div class="select-list">
                <template v-for="item of getList" :key="item.id">
                    <div class="select-item flex-b-c" :class="{ 'select-active': item.isClicked || item.isChecked || item.isCheck }"
                        @click="emit('change', item)">
                        <div class="lang-left">
                            <img class="left-img" :src="item.imgUrl" v-if="item.imgUrl" />
                            <span>{{ item.name || item.label }}</span>
                        </div>
                        <div class="icon"></div>
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

    .select-list {
        padding: 0 24rem 24rem;
        max-height: 50vh;
        overflow-y: auto;

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
                    width: 42rem;
                    border-radius: 50%;
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