<template>
  <div class="dailyProfitRank" v-if="conf.todayWinnerInfoList[0]">
    <div class="content">
      <div
        class="content-topThree"
        :class="conf.todayWinnerInfoList[1] ? 'no-one' : ''"
        v-if="conf.todayWinnerInfoList[0]"
      >
        <div class="item" style="order: 2; top: -45px">
          <div style="background: url(static/img/home/border1.png) center center / 100% 100% no-repeat">
            <x-img :src="conf.todayWinnerInfoList[0].imgUrl" />
          </div>
          <div class="crown-body">
            <img class="crown-img" style="width: 80rem" src="/static/img/home/crown1.png" />
            <img class="place-img" src="/static/img/home/place1.png" />
          </div>
          <span>{{ conf.todayWinnerInfoList[0].userName }}</span>
          <span>{{ conf.todayWinnerInfoList[0].coinSymbol + conf.todayWinnerInfoList[0].betPrizeMoney }}</span>
        </div>
        <div class="item" style="order: 1; top: -30px" v-if="conf.todayWinnerInfoList[1]">
          <div style="background: url(static/img/home/border2.png) center center / 100% 100% no-repeat">
            <div class="avatar">
              <x-img :src="conf.todayWinnerInfoList[1].imgUrl" />
            </div>
          </div>
          <div class="crown-body">
            <img class="crown-img" style="width: 80rem" src="/static/img/home/crown2.png" />
            <img class="place-img" src="/static/img/home/place2.png" />
          </div>
          <span>{{ conf.todayWinnerInfoList[1].userName }}</span>
          <span>{{ conf.todayWinnerInfoList[1].coinSymbol + conf.todayWinnerInfoList[1].betPrizeMoney }}</span>
        </div>
        <div class="item" style="order: 3; top: -30px" v-if="conf.todayWinnerInfoList[2]">
          <div style="background: url(static/img/home/border3.png) center center / 100% 100% no-repeat">
            <div class="avatar">
              <x-img :src="conf.todayWinnerInfoList[2].imgUrl" />
            </div>
          </div>
          <div class="crown-body">
            <img class="crown-img" style="width: 80rem" src="/static/img/home/crown3.png" />
            <img class="place-img" src="/static/img/home/place3.png" />
          </div>
          <span>{{ conf.todayWinnerInfoList[2].userName }}</span>
          <span>{{ conf.todayWinnerInfoList[2].coinSymbol + conf.todayWinnerInfoList[2].betPrizeMoney }}</span>
        </div>
      </div>
      <div class="list" v-if="conf.todayWinnerInfoList[3]">
        <div class="item" v-for="(item, index) in conf.todayWinnerInfoList.slice(3, 5)">
          <span class="left-rank">{{ index + 4 }}</span>
          <div class="avatar">
            <x-img :src="item.imgUrl" />
          </div>
          <span class="middle-name">{{ item.userName.slice(0, 2) }}****{{ item.userName.slice(-2) }}</span>
          <span class="right-box">{{ item.coinSymbol + item.betPrizeMoney }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { index } from '@/views/home/home-com/topWinList'

const conf = index()
</script>
<style lang="less" scoped>
/*================ 前五排行榜 ================*/
.dailyProfitRank {
  padding: 50rem 26rem 10rem;

  .no-one {
    grid-template-columns: repeat(3, 1fr);
  }

  .content {
    display: -webkit-box;
    display: -webkit-flex;
    display: flex;
    -webkit-box-orient: vertical;
    -webkit-box-direction: normal;
    -webkit-flex-direction: column;
    flex-direction: column;
    -webkit-box-align: center;
    -webkit-align-items: center;
    align-items: center;

    .list {
      position: relative;
      z-index: 2;
      display: -webkit-box;
      display: -webkit-flex;
      display: flex;
      -webkit-box-orient: vertical;
      -webkit-box-direction: normal;
      -webkit-flex-direction: column;
      flex-direction: column;
      -webkit-box-align: center;
      -webkit-align-items: center;
      align-items: center;
      gap: 8rem;
      width: 100%;

      .item {
        display: -webkit-box;
        display: -webkit-flex;
        display: flex;
        -webkit-box-align: center;
        -webkit-align-items: center;
        align-items: center;
        width: 100%;
        height: 102rem;
        padding: 0rem 19rem 0rem 33rem;
        background: #fff;
        border-radius: 10rem;

        .avatar {
          width: 80rem;
          height: 80rem;
          margin-right: 13rem;
          border-radius: 50%;
          overflow: hidden;
        }

        .left-rank {
          margin-right: 30rem;
          color: #9ea3ad;
          font-size: 36rem;
          font-weight: 500;
        }
        .middle-name {
          color: #243047;
          font-size: 24rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          //width: 500rem
        }
        .right-box {
          line-height: 50rem;
          width: 260rem;
          height: 50rem;
          margin-left: auto;
          color: #fff;
          font-size: 30rem;
          text-align: center;
          border-radius: 675rem;
          background: linear-gradient(67.61deg, #57a5ff 14.73%, #0063e5 85.35%);
        }
      }
    }

    .content-topThree {
      position: relative;
      display: grid !important;
      justify-items: center;
      width: 100%;
      height: 250rem;
      z-index: 1;
      margin-bottom: -10rem;
      background: url(/static/theme/blue/home-top.svg) no-repeat center center/100% 100%;

      .item {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 225rem;
        height: 260rem;

        .crown-body {
          position: absolute;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          width: 134rem;
          height: 137rem;

          .crown-img {
            position: relative;
            top: -25rem;
            left: -19rem;
            height: 80rem;
          }
          .place-img {
            height: 33rem;
          }
        }

        & > span {
          color: #fff;
          padding: 0 10rem;
          text-align: center;

          &:first-of-type {
            padding: 18% 8%;
            font-size: 22rem;
            width: 180rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          &:last-of-type {
            width: 152rem;
            height: 50rem;
            padding: 13rem 14rem;
            font-size: 21rem;
            line-height: 21rem;
            text-align: center;
            border-radius: 567rem;
            background: linear-gradient(67.61deg, #57a5ff 14.73%, #0063e5 85.35%);
          }
        }

        & > div:first-of-type {
          position: relative;
          display: grid;
          place-items: center;
          width: 120rem;
          min-width: 120rem;
          height: 120rem;
          min-height: 120rem;
          border-radius: 50%;
          padding: 4rem;
          overflow: hidden;

          & > .avatar {
            width: 100%;
            height: 100%;
            border-radius: 50%;
          }
        }

        &:nth-child(2) {
          right: 0.8rem;
        }

        &:nth-child(3) {
          left: 12rem;
        }
      }
    }
  }
}
</style>
