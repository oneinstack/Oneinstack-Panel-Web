<template>
    <GameLayout
      :ref="conf.layout.setRef"
      title="MarkSix"
      code="MARK_SIX"
      :lottery="lottery"
      :onInit="conf.getLotteryOdds"
      :betInfo="conf.betting"
      @reset="conf.reset"
    >
      <!--开奖结果  -->
      <div class="top-result row relative">
        <div class="result column col justify-center">
          <div>{{ $t('game.result') }}:</div>
          <div>{{ lottery.lastissue }}</div>
        </div>
        <div class="result-box relative row flex-center" style="gap: 11rem">
          <resultBall
            v-for="(_, index) in 7"
            :key="index"
            :index="index"
            :number="lottery.results[index]"
            :aniX="30 - index * 10"
            :ref="conf.setBallRef"
          />
        </div>
      </div>
      <div class="top-bg-1"></div>
  
      <div class="top-bg-box">
        <!-- 切换玩法 -->
        <div class="row no-wrap play-type" v-scroll>
          <div
            class="type-item flex flex-center relative"
            v-for="item in lottery.play.list"
            :key="item.id"
            :class="{ active: item.id === lottery.play.item.id }"
            @click="lottery.play.change(`/game/MarkSix/MarkSix`, item)"
          >
            {{ item.label }}
          </div>
        </div>
        <!-- 倒计时 -->
        <div class="count-down-box">
          <div>{{ $t('game.drawingTime') + ':' + lottery.issue }}</div>
          <div class="row" style="margin-top: 20rem">
            <div class="count-down row" style="gap: 4rem">
              <downTime :w="72" :h="72" :value="lottery.countDown" />
            </div>
            <div class="col flex items-center" style="margin: 0 20rem">
              <div class="count-down-line relative">
                <div
                  class="count-down-line-item"
                  :style="{ width: `${(lottery.countDown[3] / (lottery.play.item.lotteryInterval / 1000)) * 100}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
  
        <!-- 功能控制 -->
        <div class="row items-center no-wrap operation-box" v-scroll>
          <div
            class="type-item flex flex-center relative text-no-wrap"
            v-for="item in conf.operation.list"
            :key="item.value"
            :class="{ active: item.value === conf.operation.active }"
            @click="conf.operation.change(item)"
          >
            {{ item.label }}
          </div>
        </div>
  
        <!-- Betting 一二级 -->
        <bettingtabs v-if="conf.operation.active === 'betting'" />
        <div style="height: 36rem"></div>
      </div>
  
      <!-- 内容区 -->
      <div class="col content" :class="{ 'stop-bet': conf.stopBet && conf.operation.active === 'betting' }">
        <!-- 下注区 -->
        <betting v-if="conf.operation.active === 'betting'"/>
        <!-- Result -->
        <resultCom ref="resultRefs" v-if="conf.operation.active === 'result'"/>
        <!-- Rule -->
        <ruleCom v-if="conf.operation.active === 'rule'" :list="lottery.play.item.lotteryRuleurl" style="margin-top: 16rem;"></ruleCom>
        <!-- 下注区 -->
        <orderCom ref="orderRefs" v-if="conf.operation.active === 'myOrder'" :lotteryId="lottery.play.item.id"/>
      </div>
  
  
      <!-- 下注弹窗内容 -->
      <template #bet>
        <div style="width: 100%;">
          <div class="bet-content">
            <template v-for="item in conf.betting.betArr">
              <div class="ball-box" :style="{
                'background-image': `url('/static/img/game/marksix/${item.oddsName}.webp')`,
                }"
                v-if="isNaN(item.oddsName)">
                <div>{{ item.languageName}}</div>
              </div>
              <resultBall :num="item.oddsName" :size="72" :active="item.isActive" v-if="!isNaN(item.oddsName)"/>
            </template>
          </div>
          <!-- <div class="input">
            <div class="input-title">{{ 'TotalBetAmount' }}: {{ conf.betting.totalAmount }}</div>
          </div> -->
        </div>
      </template>
  
      <!-- 下注按钮 -->
      <template v-if="conf.operation.active === 'betting'">
        <bottombtn @confirm="conf.betting.popup.open" :class="{ 'stop-bet': conf.stopBet }"/>
        <time-popup @close="conf.timePopupShop = false" v-if="conf.timePopupShop"></time-popup>
      </template>
  
      <!-- 下注信息 -->
       <template v-if="conf.isWinBet">
        <div class="popup-mask"></div>
          <div class="tips-popup" @click="conf.isWinBet = false">
              <div class="bet-win">
                  <div class="win-title">{{ $t('game.winBet') }}</div>
                  <div class="win-content">
                      <div class="win-item">{{ $t('game.expect') }}：{{ conf.winBetInfo?.betExpect }}</div>
                      <div class="win-item">{{ $t('game.amount') }}：{{ sutil.Mul(conf.winBetInfo?.money , lottery.bet.num) }}</div>
                      <div class="win-item">{{ $t('game.start') }}：{{ sutil.getTimeFormat(lottery.current.startTime) }}</div>
                      <div class="win-item">{{ $t('game.open') }}：{{ sutil.getTimeFormat(lottery.current.openTime) }}</div>
                  </div>
              </div>
          </div>
       </template>
    </GameLayout>
  </template>
  <script setup lang="ts">
  import sutil from '@/sstore/sutil';
  import GameLayout from '../components/gameLayout-blue.vue'
  import bottombtn from './components/betting/bottombtn-blue.vue'
  import betting from './components/betting/index-blue.vue'
  import bettingtabs from './components/betting/tabs-blue.vue'
  import resultBall from './components/resultBall.vue'
  import timePopup from '../components/timePopup.vue';
  import resultCom from './result-blue.vue';
  import orderCom from './order.vue';
  import ruleCom from '../components/gameRule.vue';
  import downTime from '../components/aniDownTime.vue';
  import { index } from './MarkSix'
  const { conf, lottery, resultRefs, orderRefs } = index()
  </script>
  
  <style lang="less" scoped>
  .top-result {
    width: 750rem;
    height: 156rem;
    margin-top: 20rem;
    background: url('/static/theme/blue/markSixTopBg.webp') no-repeat center center;
    background-size: 100% 100%;
    padding: 0rem 36rem;
    font-size: 20rem;
    color: #000000;
    font-weight: 600;
  }
  
  .result-box {
    width: 510rem;
    height: 100%;
    overflow: hidden;
    height: calc(100% - 24rem);
    margin-top: 12rem;
  }
  
  .top-bg-1 {
    width: 100%;
    height: 30rem;
    background: url('/static/theme/blue/incline.png') no-repeat center center;
    background-size: 100% 100%;
  }
  
  .top-bg-box {
    width: 100%;
    background: linear-gradient(116.01deg, #C0DCFF 9.5%, #68A2FF 100.92%) !important;
    // padding: 0 32rem;
    color: #333333;
    font-size: 28rem;
    font-weight: 600;
  
    .play-type {
      margin-top: 42rem;
      gap: 20rem;
      width: 686rem;
      height: 104rem;
      padding: 0 32rem;
    }
  
    .type-item {
      padding: 0 20rem;
      min-width: 164rem;
      height: 104rem;
      flex-shrink: 0;
      background-color: #fffef8;
      border-radius: 8rem;
      box-shadow: inset 2rem 2rem 8rem 0rem rgba(0, 0, 0, 0.1);
      overflow: hidden;
      &.active {
        background-color: #E6F2FF;
      }
      &.active::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 8rem;
        background: #0A45CF;
      }
    }
  
    .count-down-box {
      font-size: 28rem;
      margin-top: 32rem;
      padding: 0 32rem;
  
      .count-down {
        font-size: 46rem;
      }
  
      .count-down-item {
        width: 72rem;
        height: 72rem;
        background: #000000;
        border-radius: 4rem;
        color: #ffffff;
      }
  
      .count-down-line {
        height: 16rem;
        width: 100%;
        border-radius: 22rem;
        background: #b6b9c4;
        transform: translateX(20rem);
        overflow: hidden;
      }
      .count-down-line-item {
        background: linear-gradient(112.71deg, #296AED 4.28%, #0A45CF 67.56%);
        height: 100%;
        transition: width 0.3s;
      }
    }
  
    .operation-box {
      gap: 20rem;
      display: flex;
      justify-content: space-between;
      margin-top: 20rem;
      padding: 0 32rem;
      .type-item {
        height: 76rem;
        border-radius: 6rem;
        padding: 0 20rem;
        min-width: max-content;
        color: #666666;
        flex: 1;
        &.active {
          color: #000000;
        }
        &.active::before {
          height: 6rem;
        }
      }
    }
  }
  
  .stop-bet{
    filter: grayscale(1);
  }
  
  .ball-box{
    height: 72rem;
    padding: 0rem 20rem;
    line-height: 72rem;
    border: 2rem solid rgba(0, 0, 0, 0.1);
    border-radius: 10rem;
  }
  .popup-mask {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.3);
  }
  
  .tips-popup {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 998;
  
      .bet-win {
          width: 600rem;
          height: 152rem;
          border-radius: 20rem;
          background: #FFF;
          box-shadow: 20rem 20rem 40rem 0rem rgba(255, 255, 255, 0.25), -20rem -20rem 40rem 0rem rgba(255, 255, 255, 0.25);
          color: #000;
          font-weight: 500;
          font-size: 40rem;
          overflow: hidden;
          animation: colorBtn 1s forwards;
  
          .win-title {
              height: 152rem;
              display: flex;
              align-items: center;
              justify-content: center;
  
          }
  
          .win-content {
              font-size: 30rem;
              padding-left: 40rem;
  
              .win-item {
                  margin-bottom: 8rem;
              }
          }
      }
  
      @keyframes colorBtn {
          0% {
              height: 152rem;
          }
  
          100% {
              height: 372rem;
          }
      }
  }
  
  .bet-content{
    padding: 24rem;
    background: transparent;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130rem,1fr));
    gap: 12rem;
    place-items: center !important;
  
  }
  
  .input {
    display: flex;
    align-items: center;
    margin: 32rem;
  
    .input-title {
      color: #45454d;
      font-weight: 700;
      font-size: 28rem;
      margin-right: 24rem;
    }
  }

  .content{
    overflow: auto;
    background: linear-gradient(180deg, #F0F4FF 0%, #E6EEFF 100%);
  }
  </style>
  