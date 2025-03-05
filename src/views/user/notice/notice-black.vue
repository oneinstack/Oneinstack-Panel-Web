<template>
    <x-page :fixed="false">
        <template #title>Notification</template>
        <template #top>
            <div class="nav-list">
                <custNav :dataArr="conf.navList" :active="conf.navIndex" @change="conf.changeItem">
                    <template v-slot="{ item }">
                        <span>{{ item.name }}</span>
                        <div class="badge flex-center" v-if="item.badge">{{ item.badge }}</div>
                    </template>
                </custNav>
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
                        <van-icon size="24rem" color="#fff" name="arrow" style="transition: 0.3s"
                            :class="{ 'rotate-90': conf.moreShow }" />
                    </div>
                </div>
                <div class="txt">
                    <div>We would like to inform you that our services for allthird-party slot providers, including
                        slots and
                        live games,will undergo scheduled maintenance.</div>
                    <div style="margin-top: 20rem;" v-if="conf.moreShow">
                        Please be advised that during this maintenance period,third-party slots and live games will be
                        unavailable.
                    </div>
                    <div style="margin-top: 20rem;" v-if="conf.moreShow">
                        Please be advised that during this maintenance period,third-party slots and live games will be
                        unavailable.
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
import custNav from '../setting/com/custNav.vue';
import { reactive } from 'vue';


const conf = reactive({
    navIndex: 2,
    moreShow: false,
    navList: [
        {
            name: 'Promotions',
            badge: 0
        },
        {
            name: 'Transaction',
            badge: 0
        },
        {
            name: 'System',
            badge: 1
        }
    ],
    changeItem({ item, index }: any) {
        console.log(item);
        console.log(index);
    }
})

</script>

<style lang="less" scoped>
.nav-list {
    margin: 24rem;

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

.notic-content {
    padding: 0rem 24rem;

    .notic-item {
        background: #323738;
        border-radius: 20rem;
        padding: 20rem;
        color: #BFBFBF;
        font-size: 24rem;

        .top-title {
            .l-content {
                margin-right: 30rem;

                .time {
                    display: flex;
                    align-items: center;

                    .unRead {
                        background: #1CF187;
                        width: 16rem;
                        height: 16rem;
                        border-radius: 50%;
                        margin-left: 20rem;
                    }
                }

                .title {
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

        .txt {
            padding-right: 20rem;
            margin-top: 20rem;
        }

        .del {
            display: flex;
            justify-content: flex-end;
            margin-top: 40rem;

            img {
                height: 40rem;
            }
        }
    }
}
</style>