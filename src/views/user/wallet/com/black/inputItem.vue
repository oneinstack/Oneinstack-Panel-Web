<template>
    <div class="c-title flex-b-c" v-if="title">{{ title }}</div>
    <div class="c-item flex-b-c" @click="emit('change')" v-if="isSelect">
        <div class="left-table">
            <img v-if="img" :src="img" />
            <div>
                <span v-if="lable">{{ lable }}</span>
                <span style="color: #bfbfbf;" v-else>{{ $t('rechargeModule.PleaceSelect') }}</span>
            </div>
        </div>
        <div class="r-arrow flex-center">
            <van-icon size="24rem" color="#fff" name="arrow-down" />
        </div>
    </div>
    <div class="c-item flex-b-c" v-else>
        <input v-if="type == 'decimal'" class="input" inputmode="decimal" :placeholder="placeholder || $t('rechargeModule.PleaseEnter')" v-model="conf.inputVal"
            @input="conf.input" @focus="emit('focus')" :disabled="disabled" />
        <input v-else class="input" :placeholder="placeholder || $t('rechargeModule.PleaseEnter')" v-model="conf.inputVal"
            @input="conf.input" :disabled="disabled" />
            <slot></slot>
    </div>
    <div class="list" v-if="defaultList.length">
        <template v-for="item in defaultList" :key="item">
            <div class="list-item flex-center" :class="{ 'item-active': item.isClick }" @click="conf.changeMoney(item)">
                <div class="right-odds flex-center">+180%</div>
                <span>{{ item.money }}</span>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue';


const props = defineProps({
    isSelect: {
        default: true
    },
    title: {
        default: ''
    },
    lable: {
        default: ''
    },
    img: {
        default: ''
    },
    placeholder: {
        default: ''
    },
    disabled: {
        default: false
    },
    defaultList: {
        default: (): any => []
    },
    type: {
        default: 'decimal'
    }
})

const emit = defineEmits(['change', 'focus', 'input', 'changeMoney'])

const conf = reactive({
    inputVal: '',
    input(e: any) {
        emit('input', { type: e, val: conf.inputVal })
    },
    changeMoney(item: any) {
        conf.inputVal = item.money
        emit('changeMoney', item)
    }
})

onMounted(() => {
    if (props.defaultList.length) conf.changeMoney(props.defaultList[0])
    if(props.lable){
        conf.inputVal = props.lable
    }
})

</script>

<style lang="less" scoped>
.c-title {
    color: #BFBFBF;
    font-size: 28rem;
    margin-bottom: 16rem;
    padding: 0rem 2rem;
}

.c-item {
    width: 100%;
    background: #292D2E;
    border: 2rem solid #383E3E;
    height: 80rem;
    padding: 20rem;
    border-radius: 12rem;
    color: #fff;
    font-size: 28rem;
    font-weight: 700;
    // margin-bottom: 30rem;

    .left-table {
        display: flex;
        align-items: center;

        img {
            height: 40rem;
            width: 40rem;
            border-radius: 50%;
            margin-right: 12rem;
        }
    }

    .r-arrow {
        width: 44rem;
        height: 44rem;
        background: #464F50;
        border-radius: 12rem;
    }

    .input {
        flex: 1;
        color: #fff;

        &::placeholder {
            color: #BFBFBF;
            font-size: 24rem;
        }
    }
    .disabled, [disabled] {
        opacity: 1 !important;
    }
}

.list {
    display: flex;
    flex-wrap: wrap;

    .list-item {
        background: #3A4142;
        border: 2rem solid #444B4C;
        height: 88rem;
        width: calc((100% - 48rem) / 4);
        border-radius: 12rem;
        font-size: 24rem;
        color: #fff;
        font-weight: 700;
        position: relative;
        margin-right: 16rem;
        margin-top: 20rem;

        &:nth-child(4n+4) {
            margin-right: 0rem;
        }

        span {
            padding-top: 10rem;
        }

        .right-odds {
            position: absolute;
            right: -2rem;
            top: -2rem;
            width: 100rem;
            height: 32rem;
            background: url('/static/theme/black/change.png') no-repeat;
            background-size: 100% 100%;
            font-size: 20rem;
            font-weight: 600;
        }
    }

    .item-active {
        border-color: #1CF187;
    }
}
</style>