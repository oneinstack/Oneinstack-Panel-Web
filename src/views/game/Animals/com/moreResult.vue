<template>
    <van-popup class="popup-bottom-center" :show="conf.showMore" position="bottom" borderRadius='16' :round="true"
        @close="conf.closePopup">
        <div class="result">
            <div class="tips">Previous data</div>
            <div class="title">
                <div class="line"></div>
                <div class="txt">The past 100 championships</div>
                <div class="line"></div>
            </div>
            <div class="list">
                <div class="list-item" v-for="(item, index) in conf.numlist" :key="index">
                    <img class="img" :src="`/static/img/game/animal/${item.img}.png`" />
                    <div class="num">
                        <img class="glass-img" src="/static/img/game/animal/glass.png" />
                        <div>{{ item.num }}</div>
                    </div>
                </div>
            </div>
            <div class="title">
                <div class="line"></div>
                <div class="txt">the past 10 competitions</div>
                <div class="line"></div>
            </div>
            <div class="table">
                <div class="table-line">
                    <div class="issus">
                        0101011
                    </div>
                    <div class="num">
                        1
                    </div>
                    <div class="num">
                        2
                    </div>
                    <div class="num">
                        3
                    </div>
                    <div class="num">
                        4
                    </div>
                    <div class="num">
                        5
                    </div>
                    <div class="num">
                        6
                    </div>
                </div>
            </div>
        </div>
    </van-popup>
</template>

<script lang="ts" setup>
import { onMounted, reactive } from 'vue';


const conf = reactive({
    showMore: true,
    numlist: [] as any[],
    closePopup() {
        conf.showMore = false
    }
})

onMounted(() => {
    conf.numlist = [
        {
            img: 'exb',
            name: 'Exiaobao',
            num: 1
        },
        {
            img: 'hm',
            name: 'Freshippo',
            num: 2
        },
        {
            img: 'pp',
            name: 'Piaopiao',
            num: 3
        },
        {
            img: 'xz',
            name: 'Xiazai',
            num: 4
        },
        {
            img: 'zxb',
            name: 'Zhixiaobao',
            num: 5
        },
        {
            img: 'hx',
            name: 'Huanxing',
            num: 6
        }
    ]
})
</script>

<style lang="less" scoped>
.result {
    background: #fff;
    text-align: center;
    padding: 0 20rem 20rem;

    .tips {
        color: #fff;
        font-size: 32rem;
        font-weight: 600;
        background: linear-gradient(328.56deg, #FF7502 18.81%, #FC9B01 77.66%);
        display: inline-block;
        padding: 20rem 50rem;
        border-radius: 0 0 48rem 48rem;
        clip-path: polygon(0 0, 100% 0, 90% 100%, 10% 100%)
    }

    .title{
        display: flex;
        align-items: center;
        width: 100%;
        margin: 20rem 0rem;
        .txt{
            color: #333;
            font-size: 26rem;
            margin: 0 20rem;
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
        .table-line{
            display: flex;
            height: 80rem;
            .issus{
                flex: 2;
            }
            .num{
                flex: 1;
            }

        }
    }
}
</style>