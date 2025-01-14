<template>
    <van-popup class="popup-bottom-center" :show="conf.showMore" position="bottom" borderRadius='16' :round="true"
        @close="conf.closePopup">
        <div class="result">
            <div class="cross" @click="conf.closePopup">
                <van-icon name="cross" size="28rem" color="#ACACAC" />
            </div>
            <div class="tips">Previous data</div>
            <div class="title">
                <div class="line"></div>
                <div class="txt">The past 100 championships</div>
                <div class="line"></div>
            </div>
            <div class="list">
                <div class="list-item" v-for="(item, index) in totalList" :key="index">
                    <img class="img" :src="`/static/img/game/animal/${item.img}.png`" />
                    <div class="num">
                        <img class="glass-img" src="/static/img/game/animal/glass.png" />
                        <div>{{ item[conf.active] }}</div>
                    </div>
                </div>
            </div>
            <div class="title">
                <div class="line"></div>
                <div class="txt">the past 10 competitions</div>
                <div class="line"></div>
            </div>
            <div class="table">
                <div class="table-title">
                    <div class="issus">
                        <div class="txt-t">Animals</div>
                        <div class="txt-b">Periods</div>
                    </div>
                    <div class="num" v-for="(item, index) in totalList" :key="index">
                        <img class="img-bet" :src="`/static/img/game/animal/${item.img}-bet.png`" />
                    </div>
                </div>
                <div class="tabli-line" v-for="(item) in result" :key="item.openTime">
                    <div class="issue">123456</div>
                    <template  v-for="(n,i) in item.openCodeArr" :key="i">
                        <div class="num" :class="{'active': (conf.active=='st' && n=='A') || (conf.active=='nd' && n=='B') || (conf.active=='rd' && n=='C')}">{{ n }}</div>
                    </template>
                </div>
            </div>
        </div>
    </van-popup>
</template>

<script lang="ts" setup>
import { onMounted, reactive } from 'vue';

const props = defineProps({
    result: {
        default: [] as any
    },
    totalList: {
        default: [] as any
    }
})

const conf = reactive({
    showMore: false,
    active: 'st',
    closePopup() {
        conf.showMore = false
    },
    openPopup(e:any) {
        if(e) conf.active = e // 当前选中的类型
        conf.showMore = true
    }
})

defineExpose({
    openPopup: conf.openPopup
})
</script>

<style lang="less" scoped>
.result {
    background: #fff;
    text-align: center;
    padding: 0 20rem 20rem;
    position: relative;

    .cross{
        position: absolute;
        top: 30rem;
        right: 30rem;
    }

    .tips {
        color: #fff;
        font-size: 32rem;
        font-weight: 600;
        background: linear-gradient(328.56deg, #FF7502 18.81%, #FC9B01 77.66%);
        display: inline-block;
        padding: 20rem 30rem;
        border-radius: 0 0 48rem 48rem;
        clip-path: polygon(0 0, 100% 0, 94% 100%, 6% 100%)
    }

    .title{
        display: flex;
        align-items: center;
        width: 100%;
        margin: 40rem 0rem 20rem;
        .txt{
            color: #333;
            font-size: 26rem;
            margin: 0 20rem;
            font-weight: 500;
        }
        .line{
            height: 2rem;
            background: #E4E4E4;
            flex: 1;
        }
    }

    .list {
        display: flex;
        justify-content: center;
        margin-top: 20rem;

        .list-item {
            text-align: center;
            margin-left: 20rem;

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

    .table{
        width: 100%;
        border: 2rem solid #FC9B01;
        border-radius: 16rem;
        overflow: hidden;
        margin-top: 40rem;
        .table-title{
            display: flex;
            height: 65rem;
            background: #feebcc;
            .issus{
                position: relative;
                overflow: hidden;
                padding: 0% 6rem;
                font-size: 20rem;
                color: #FC9B01;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                height: 100%;
                width: 130rem;

                &::before {
                    content: '';
                    position: absolute;
                    top: 2px;
                    left: 2px;
                    width: 200px;
                    height: 2rem; 
                    background-color: #ffbe57;
                    transform: rotate(25.5deg);
                    transform-origin: top left;
                }
                .txt-t{
                    text-align: right;
                }
                .txt-b{
                    text-align: left;
                }
            }
            .num{
                flex: 1;
                border-left: 2rem solid #FC9B01;
                &:nth-child(2n) {
                    background: #FC9B01;
                }
                .img-bet{
                    height: 100%;
                }

            }

        }
        .tabli-line{
            display: flex;
            height: 55rem;
            font-size: 24rem;
            border-top: 2rem solid #FFBE57;
            div{
                display: flex;
                justify-content: center;
                align-items: center;
            }
            .issue{ 
                width: 130rem;
                color: #A8A8A8;
            }
            .num{
                flex: 1;
                border-left: 2rem solid #FFBE57;
                color: #333;
                &:nth-child(2n) {
                    background: #feebcc;
                }
            }
            .active{
                color: #F34F4F;
            }
        }
    }
}
</style>