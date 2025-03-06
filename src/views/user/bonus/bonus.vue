<template>
    <x-page no-footer :headerBgColor="conf.bgcolor" :topfill="false" backColor="#00000033">
        <template #title>
            Bonus
        </template>
        <div class="head">
            <x-statusbar />
            <div class="head-box">
                <img class="head-bg" src="/static/theme/black/bonus/bonus-bg.png" />
                <div class="head-content">
                    <div class="time">Ends 2025/2/28 06:59:59</div>
                    <div class="money">$0.00</div>
                    <div class="detail">
                        <span>Details</span>
                        <van-icon size="24rem" name="arrow" />
                    </div>
                </div>
            </div>
        </div>
        <div class="bonus">
            <!-- 宝箱 -->
            <bonusBox :bonusList="conf.bonusList" />
            <!-- 导航栏 -->
            <div class="nav">
                <custNav :dataArr="conf.navList" @change="conf.changeNav">
                    <template v-slot="{ item }">
                        <span>{{ item.name }}</span>
                    </template>
                </custNav>
            </div>
            <!-- 内容 -->
            <div class="concent">
                <!-- General Bonus -->
                <general v-if="conf.navActive == 1" />
                <!-- VIP Bonus -->
                <vipBonus :gradedInfo="conf.gradedInfo" v-if="conf.navActive == 2" />
                <!-- Special Bonus -->
                <noData v-if="conf.navActive == 3" />
            </div>
        </div>
    </x-page>
</template>
<script setup lang="ts">
import bonusBox from './com/bonusBox.vue';
import custNav from '../setting/com/custNav.vue';
import general from './com/general.vue';
import vipBonus from './com/vipBonus.vue';
import noData from './com/noData.vue';
import { onMounted, reactive } from 'vue';
import sconfig from '@/sstore/sconfig';
import { apis } from '@/api';
import System from '@/utils/System';
import { Scope } from 'tools-vue3';
import { EPage } from '@/enum/Enum';
import stheme from '@/sstore/stheme';



const conf = reactive({
    bgcolor: 'transparent',
    bonusList: [
        {
            num: '+180%',
            imgUrl: 'bonus1'
        },
        {
            num: '+240%',
            imgUrl: 'bonus2-close'
        },
        {
            num: '+300%',
            imgUrl: 'bonus3-close'
        },
        {
            num: '+360%',
            imgUrl: 'bonus4-close'
        }
    ],
    navActive: 1,
    navList: [
        {
            name: 'General Bonus',
            id: 1
        },
        {
            name: 'VIP Bonus',
            id: 2
        },
        {
            name: 'Special Bonus',
            id: 3
        }
    ],
    gradedInfo: {} as any,
    async userGradedInfo() {
        if (!sconfig.userInfo) return
        System.loading()
        const { data } = await apis.userGradedInfo({
            final: () => {
                System.loading(false)
            }
        })
        console.log(data);
        conf.gradedInfo = data
    },
    changeNav({ item }: any) {
        console.log(item);
        conf.navActive = item.id
        if (item.id && !conf.gradedInfo.theMax) conf.userGradedInfo()
    }
})
const event = Scope.Event()
event.on(EPage.scroll, (e) => {
    if (e.top > 80) {
        conf.bgcolor = stheme.theme.black.headerBgColor()
    } else {
        conf.bgcolor = 'transparent'
    }
})
</script>
<style lang="less" scoped>
.head {
    background: linear-gradient(180deg, #4C3428 0%, #232626 100%);

    .head-box {
        height: 260rem;
        display: flex;
        justify-content: flex-end;
        position: relative;

        .head-bg {
            height: 360rem;
            margin-top: 10rem;
        }

        .head-content {
            position: absolute;
            inset: 0;
            padding: 116rem 24rem 0rem;
            color: #BFBFBF;
            font-size: 24rem;
            font-weight: 600;

            .money {
                font-family: Poppins;
                font-weight: 600;
                font-size: 40rem;
                color: #fff;
            }

            .detail {
                display: flex;
                align-items: center;
                margin-top: 20rem;

                span {
                    margin-right: 8rem;
                }
            }
        }
    }
}

.bonus {
    padding: 24rem;
    position: relative;

    .nav {
        margin: 20rem 0rem;
    }

    .concent {
        padding-top: 10rem;
    }
}
</style>