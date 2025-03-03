<template>
    <div class="c-title flex-b-c">
        <span>{{ title }}</span>
        <span>{{ rTitle }}</span>
    </div>
    <div class="c-item flex-b-c" style="margin-bottom: 10rem;">
        <input class="input" :placeholder="placeholder || $t('rechargeModule.PleaseEnter')" v-model="conf.inputVal"
            @input="conf.input" :disabled="disabled" />
        <div class="r-arrow flex-center" @click="emit('change', $event)" :data-target="dataTarget">
            <slot></slot>
            <van-icon size="24rem" color="#fff" name="arrow-down" />
        </div>
    </div>
    <div class="btn-list" v-if="isSelect">
        <div class="btn-item flex-center" @click="conf.changeMoney(0)">Min</div>
        <div class="btn-item flex-center" @click="conf.changeMoney(0.25)">25%</div>
        <div class="btn-item flex-center" @click="conf.changeMoney(0.5)">50%</div>
        <div class="btn-item flex-center" @click="conf.changeMoney(1)">Max</div>
    </div>
</template>

<script setup lang="ts">
import i18n from '@/lang';
import sutil from '@/sstore/sutil';
import System from '@/utils/System';
import { computed, onMounted, reactive, watch } from 'vue';


const props = defineProps({
    title: {
        default: ''
    },
    rTitle: {
        default: ''
    },
    isSelect: {
        default: false
    },
    placeholder: {
        default: ''
    },
    disabled: {
        default: false
    },
    type: {
        default: 'decimal'
    },
    dataTarget: {
        default: 'topModal'
    },
    lable: {
        default: ''
    },
    maxNum: {
        default: 0
    }
})

const emit = defineEmits(['close', 'change', 'input'])

const conf = reactive({
    inputVal: '' as any,
    input(e: any) {
        console.log(e);
        emit('input', { type: e, val: conf.inputVal })
    },
    changeMoney(item: any) {
        if(props.disabled) return System.toast(i18n.t('swapModule.chooseWalletTip') || 'fail')
        if(item == 0) conf.inputVal = 1
        else conf.inputVal = sutil.Mul(props.maxNum,item)
        emit('input', { type: null, val: conf.inputVal })
    }
})

watch(
    () => props.lable,
    (val: any) => {
        conf.inputVal = props.lable
    },
    { immediate: true, deep: true }
)


</script>

<style lang="less" scoped>
.c-title {
    color: #BFBFBF;
    font-size: 28rem;
    margin-bottom: 16rem;
    padding: 0rem 2rem;

    .t-right {
        display: flex;
        align-items: center;
        color: #fff;
    }
}

.c-item {
    background: #363B3C;
    border: 2rem solid #4B5253;
    height: 80rem;
    padding: 0rem 5rem 0rem 20rem;
    border-radius: 12rem;
    color: #fff;
    font-size: 28rem;
    font-weight: 700;
    margin-bottom: 30rem;

    .left-table {
        display: flex;
        align-items: center;

        img {
            height: 40rem;
            margin-right: 12rem;
        }
    }

    .r-arrow {
        padding: 0rem 20rem;
        height: 64rem;
        background: #464F50;
        border-radius: 12rem;
    }

    .input {
        flex: 1;
        font-size: 32rem;

        &::placeholder {
            color: #BFBFBF;
        }
    }

    .disabled,
    [disabled] {
        opacity: 1 !important;
    }
}

.btn-list {
    display: flex;
    margin-bottom: 20rem;

    .btn-item {
        flex: 1;
        background: #3A4142;
        height: 56rem;
        border-radius: 10rem;
        color: #fff;
        font-size: 24rem;
        margin-right: 12rem;
        border: 2rem solid #4B5253;

        &:last-of-type {
            margin-right: 0rem;
        }
    }
}
</style>