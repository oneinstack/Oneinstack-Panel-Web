<template>
    <x-page :fixed="false">
        <template #title>Notification</template>
        <template #top>
            <div class="nav-list">
                <div class="nav-item" @click="conf.navIndex = 0">
                    <span>Promotions</span>
                </div>
                <div class="nav-item" @click="conf.navIndex = 1">
                    <span>Promotions</span>
                </div>
                <div class="nav-item" @click="conf.navIndex = 2">
                    <span>Promotions</span>
                    <div class="badge flex-center">1</div>
                </div>
                <div :style="{ left: `calc( ${conf.navIndex} * 100% / 3)` }" class="nav-active"></div>
            </div>
        </template>
        <div class="notic-content">
            <div class="notic-item">
                <div class="top-title flex-b-c">
                    <div class="l-content">
                        <div class="time">
                            <span>2025/2/12 11:58:26</span>
                            <div class="unRead"></div>
                        </div>
                        <div class="title">3rd party Games Maintenance</div>
                    </div>
                    <div class="arrow flex-center" @click="conf.moreShow = !conf.moreShow">
                        <van-icon size="24rem" color="#fff" name="arrow" style="transition: 0.3s" :class="{ 'rotate-90': conf.moreShow }" />
                    </div>
                </div>
                <div class="txt">
                    <div>We would like to inform you that our services for allthird-party slot providers, including slots and live games,will undergo scheduled maintenance.</div>
                    <div style="margin-top: 20rem;" v-if="conf.moreShow">
                        Please be advised that during this maintenance period,third-party slots and live games will be unavailable.
                    </div>
                    <div style="margin-top: 20rem;" v-if="conf.moreShow">
                        Please be advised that during this maintenance period,third-party slots and live games will be unavailable.
                    </div>
                </div>
                <div class="del">
                    <img src="/static/theme/black/notic-del.png" />
                </div>
            </div>
        </div>
    </x-page>
</template>

<script setup lang="ts">
import { reactive } from 'vue';


const conf = reactive({
    navIndex: 2,
    moreShow: false
})

</script>

<style lang="less" scoped>
.nav-list {
    margin: 24rem;
    display: flex;
    background: #323838;
    height: 68rem;
    border-radius: 14rem;
    position: relative;

    .nav-item {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        color: #BFBFBF;
        font-size: 24rem;
        position: relative;
        z-index: 3;

        .badge {
            background: #9FE871;
            border-radius: 12rem;
            font-size: 20rem;
            color: #000;
            padding: 0rem 20rem;
            margin-left: 10rem;
            height: 32rem;
        }
    }

    .nav-active {
        background: #394143;
        border-radius: 14rem;
        font-weight: 600;
        color: #fff;
        position: absolute;
        top: 0;
        height: 100%;
        width: calc(100% / 3);
        transition-duration: 0.2s;
    }
}

.notic-content {
    padding: 24rem;

    .notic-item {
        background: #323738;
        border-radius: 20rem;
        padding: 20rem;
        color: #BFBFBF;
        font-size: 24rem;

        .top-title {
            .l-content {
                margin-right: 30rem;
                .time{
                    display: flex;
                    align-items: center;
                    .unRead{
                        background: #1CF187;
                        width: 16rem;
                        height: 16rem;
                        border-radius: 50%;
                        margin-left: 20rem;
                    }
                }
                .title{
                    font-family: Poppins;
                    font-weight: 600;
                    font-size: 28rem;
                    color: #fff;
                    margin-top: 16rem;
                }
            }

            .arrow {
                width: 44rem;
                height: 44rem;
                background: #464F50;
                border-radius: 12rem;
            }
        }
        .txt{
            padding-right: 20rem;
            margin-top: 20rem;
        }
        .del{
            display: flex;
            justify-content: flex-end;
            margin-top: 40rem;
            img{
                height: 40rem;
            }
        }
    }
}
</style>