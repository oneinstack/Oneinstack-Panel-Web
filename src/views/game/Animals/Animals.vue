<template>
    <x-page headerBgColor="transparent" :topfill="false" noFooter>
        <template #title>
            <div class="head-title" @click="conf.play.typeShow = !conf.play.typeShow">
                <span>Animals - {{ conf.play.item.title }}</span>
                <img class="arrow-img" src="/static/img/type-arrow.png"
                    :style="{ 'transform': conf.play.typeShow ? 'rotate(-180deg)' : 'rotate(0deg)' }" />
            </div>
        </template>
        <div class="ani-page">
            <!-- 游戏 -->
            <div class="relative cgame-box" ref="cgamebox" style="width: 100%; flex: 1; margin-bottom: 30rem;">
                <!-- 游戏动画 -->
                <cgame ref="cgameRef" @close="conf.game.showDown = true" />
                <!-- 倒计时 -->
                <countdown
                    :times="conf.lotteryBox.countDown"
                    :totalList="conf.result.totalList"
                    :active="conf.bet.tabs.active"
                    :openExpect="conf.lotteryBox.current.openExpect"
                    @showMore="conf.openMore"
                    :showDown="conf.game.showDown" />
            </div>
            <!-- 下注菜单 -->
            <aniBet
                :options="conf.bet.tabs.options"
                :listNumArr="conf.bet.listNumArr"
                :stopBet="!conf.game.showDown || (conf.lotteryBox.countDown[3] <= conf.openLockCountdown)"
                :defaultWalletInfo="conf.defaultWalletInfo"
                @changeBet="conf.bet.requestBet"
                @share="conf.bet.shareBet" />
        </div>
        <div v-if="conf.game.showDown">
            <div class="rulse" @click="conf.goPage('rules')">{{ $t('ar.rules') }}</div>
            <div class="rulse mony">
                <div class="coin">{{ conf.defaultWalletInfo.coinSymbol || '₹' }}</div>
                <div class="total">{{ conf.walletMoney }}</div>
            </div>
            <div class="rulse record" @click="conf.changeMyOrder">
                <img class="record-img" src="/static/img/game/animal/record.png" />
                {{ $t('ar.record') }}
            </div>
        </div>
        <moreResult :result="conf.result.list" :totalList="conf.result.totalList" ref="resultRefs" />
        <timeType
            :typeShow="conf.play.typeShow"
            :typeList="conf.play.list"
            :lotteryId="conf.play.lotteryId"
            :resultInfo="conf.result.typeResult"
            @close="conf.play.closePopup"
            @change="conf.play.reloadTo"
        />
    </x-page>
</template>
<script setup lang="ts">
import cgame from './com/AnimalsAni.vue';
import aniBet from './com/aniBet.vue';
import countdown from './com/countdown.vue'
import moreResult from './com/moreResult.vue';
import timeType from './com/timeType.vue';
import { index } from './animals'

const { conf, cgamebox, cgameRef, resultRefs } = index()
</script>
<style lang="less" scoped>
.ani-page {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background: #fb9f7a;
    position: relative;
}

// .van-popup {
//     background: transparent;
// }

// .van-popup--top {
//     top: 104rem;
// }

.head-title {
    font-size: 32rem;
    font-weight: Bold;

    .arrow-img {
        width: 28rem;
        height: 14rem;
        margin-left: 10rem;
        transition: transform 0.3s ease-in-out;
    }
}

.rulse {
    position: absolute;
    top: 12%;
    background: #fff;
    padding: 8rem 28rem;
    border-radius: 0 30rem 30rem 0;
    color: #9A470C;
    font-size: 24rem;
    z-index: 9;
}

.mony {
    right: 0;
    border-radius: 30rem 0rem 0rem 30rem;
    display: flex;
    align-items: center;
    padding: 5rem 20rem 5rem 16rem;
    min-width: 156rem;

    .coin {
        width: 38rem;
        height: 38rem;
        background-size: 100% 100%;
        background-image: url('/static/img/coin-task.png');
        color: #faa54b;
        font-size: 14rem;
        display: flex;
        justify-content: center;
        align-items: center;
        // margin-right: 20rem;
    }

    .total {
        flex: 1;
        text-align: center;
    }
}

.record {
    top: 18%;
    right: 0;
    border-radius: 30rem 0rem 0rem 30rem;
    padding: 12rem 24rem 12rem 20rem;
    display: flex;
    align-items: center;
    background: #4196FF;
    color: #fff;

    .record-img {
        height: 28rem;
        margin-right: 10rem;
    }
}

.type {
    background: #fff;
}
</style>