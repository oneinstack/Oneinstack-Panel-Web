<template>
  <div class="result">
    <div style="overflow-x: scroll" ref="tabRrfs" v-scroll>
      <div class="scale">
        <div class="scale-list">
          <template v-for="(item, index) in props.tabs" :key="index">
            <div class="scale-item" @click="conf.changeTab(item, index)">
              <div class="bg-color" :class="{ 'colorBtn': item.lotteryInterval == conf.tabIndex }">
                <div class="color-name">
                  <div class="tab-text" v-if="item.lotteryInterval / 1000 / 60 >= 1">
                    <span>{{ item.lotteryInterval / 1000 / 60 || '' }}</span>
                    {{ item.lotteryInterval / 1000 / 60 > 1 ? $t('game.minutes') : $t('game.minute') }}
                  </div>
                  <div class="tab-text" v-else>
                    <span>{{ item.lotteryInterval / 1000 || '' }}</span>
                    {{ $t('game.second') }}
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
    <div class="result-content">
      <div class="result-title">
        <div style="width: 30%; justify-content: flex-start">{{ $t('game.drawID') }}</div>
        <div style="flex: 1">{{ $t('game.number') }}</div>
        <div style="width: 80rem">{{ $t('game.color') }}</div>
      </div>
      <div class="result-list">
        <template v-for="(item, i) in conf.resultList" :key="i">
          <div class="result-ltem">
            <div class="issue">{{ item.openExpect }}</div>
            <div class="number" v-if="item.openCode">
              <template v-for="(it, num) in 10" :key="num">
                <div class="num-img" v-if="num == item.openCode">
                  <img v-if="item.openCode == 0" class="img" src="/static/img/color2.webp" />
                  <img
                    v-if="item.openCode == 2 || item.openCode == 4 || item.openCode == 6 || item.openCode == 8"
                    class="img"
                    src="/static/img/color-red.webp"
                  />
                  <img v-if="item.openCode == 5" class="img" src="/static/img/color1.webp" />
                  <img
                    v-if="item.openCode == 1 || item.openCode == 3 || item.openCode == 7 || item.openCode == 9"
                    class="img"
                    src="/static/img/color-green.webp"
                  />
                  <div class="num">{{ item.openCode }}</div>
                </div>
                <div class="number-item" v-else>
                  <span>{{ num }}</span>
                </div>
              </template>
            </div>
            <div class="number" v-else>
              <template v-for="(it, num) in 10" :key="num">
                <div class="number-item" v-if="num == 0"><span>?</span></div>
                <div class="number-item" v-else>
                  <span>{{ num }}</span>
                </div>
              </template>
            </div>
            <div class="item-color">
              <div class="color-red" v-if="['0', '2', '4', '6', '8'].includes(item.openCode)"></div>
              <div class="color-green" v-if="['1', '3', '5', '7', '9'].includes(item.openCode)"></div>
              <div class="color-violet" v-if="['0', '5'].includes(item.openCode)"></div>
            </div>
          </div>
        </template>
        <div v-if="conf.resultList.length > 0">
          <div class="more" v-if="!conf.isTips">
            <div class="more-btn" @click="conf.moreMessage">
              <span>{{ $t('game.showMore') }}</span>
              <img src="/static/img/show-more.png" style="width: 20rem; height: 12rem" />
            </div>
          </div>
          <div class="more-not" v-else>
            <span>{{ $t('user.noMore') }}</span>
          </div>
        </div>
        <x-no-data v-if="conf.resultList.length == 0"></x-no-data>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { index } from './result'

const props = defineProps({
  tabs: {
    default: [] as any
  },
  selectIndexId: {
    default: ''
  }
})
const tabRrfs = ref<any>()

const conf = index({ props, tabRrfs })

// 暴露方法
defineExpose({
  initResult: conf.initResult
})
</script>

<style lang="less" scoped>
.result {
  margin: 0rem 20rem 124rem;

  .time-tabs {
    padding: 20rem 0rem;

    .tabs-list {
      display: flex;

      // overflow-x: auto;
      .tab-item {
        background: #fff;
        border-radius: 8rem;
        height: 96rem;
        padding: 0rem 24rem;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-left: 6rem;

        .item-content {
          display: flex;
          align-items: center;
          font-size: 24rem;
          color: #5f6975;

          span {
            margin-right: 16rem;
            font-size: 40rem;
            display: flex;
          }
        }

        &.tab-active {
          border-top: 0.8vw solid #d90000;
          background: linear-gradient(180deg, #e9ecf5 0%, #f5f5fa 100%);
        }
      }
    }
  }

  .scale {
    // background: #c8d2d8;
    // height: 174rem;
    padding: 24rem 0rem;

    .scale-list {
      display: flex;
      // justify-content: space-between;
      align-items: center;
      height: 100%;

      .scale-item {
        height: 96rem;
        border-radius: 16rem;
        background: #bdcad4;
        box-shadow:
          0 4rem 4rem rgba(0, 0, 0, 0.25) inset,
          0 2rem 0 0 rgba(255, 255, 255, 0.25);
        margin-right: 14rem;
        padding: 0rem 8rem;
        flex-shrink: 0;

        // border: 4rem solid #9AAAB5;
        .bg-color {
          border: 1px solid rgba(255, 255, 255, 0.22);
          background: linear-gradient(180deg, #c2ced6 0%, #9eadb8 100%);
          box-shadow: 0 12rem #95a4af;
          border-radius: 16rem;
          height: 80rem;
          width: 150rem;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-top: -6rem;
          flex-shrink: 0;

          .tab-text {
            font-size: 24rem;
            color: #fff;
            display: flex;
            align-items: center;

            span {
              margin-right: 16rem;
              font-size: 40rem;
              font-weight: bold;
            }
          }
        }
      }
    }

    .colorBtn {
      animation: colorBtn 0.3s forwards;
    }

    @keyframes colorBtn {
      0% {
        margin-top: 0rem;
        box-shadow: 0 12rem #95a4af;
      }

      100% {
        box-shadow: 0 0rem #95a4af;
        margin-top: 8rem;
      }
    }
  }

  .result-content {
    border-radius: 16rem;
    overflow: hidden;

    .result-title {
      display: flex;
      justify-content: space-between;
      // padding: 0rem 16rem;
      padding-left: 16rem;
      background: #58a5ff;

      div {
        font-size: 24rem;
        color: #ffffff;
        padding: 16rem 0rem;
        display: flex;
        justify-content: center;
      }
    }

    .result-list {
      margin-bottom: 24rem;
      padding-bottom: 24rem;
      background: #fff;
      border-radius: 0 0 16rem 16rem;

      .result-ltem {
        padding: 20rem 15rem;
        padding-right: 0rem;
        display: flex;
        justify-content: space-between;
        align-items: center;

        .issue {
          font-size: 28rem;
          color: #45454d;
          width: 30%;
        }

        .number {
          display: flex;
          justify-content: center;
          flex: 1;

          .num-img {
            width: 33rem;
            height: 33rem;
            position: relative;
            margin-left: 2rem;

            .img {
              width: 100%;
              height: 100%;
            }

            .num {
              position: absolute;
              top: 0;
              bottom: 0;
              width: 100%;
              color: #fff;
              font-size: 24rem;
              font-weight: 700;
              display: flex;
              justify-content: center;
              align-items: center;
            }
          }

          .number-item {
            width: 33rem;
            height: 33rem;
            border-radius: 50%;
            border: 2rem solid #9fa5ac;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-left: 2rem;

            span {
              color: #252529;
              font-weight: 700;
              font-size: 24rem;
            }
          }
        }

        .item-color {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 80rem;

          div {
            width: 10rem;
            height: 10rem;
            border-radius: 50%;
            margin-left: 1rem;
          }

          .color-red {
            background: #bb1212;
          }

          .color-green {
            background: #18972c;
          }

          .color-violet {
            background: #4e00b1;
          }
        }

        &:nth-child(2n) {
          background: #e6f2ff;
        }
      }
    }
  }

  .more {
    background: #fff;
    padding: 24rem 24rem 0rem;

    .more-btn {
      box-shadow: rgba(0, 0, 0, 0.1) 0px 1.06667vw 1.06667vw;
      border-radius: 2.13333vw;
      height: 78rem;
      display: flex;
      align-items: center;
      justify-content: center;

      span {
        margin-right: 20rem;
        font-size: 24rem;
        font-weight: 700;
      }
    }
  }

  .more-not {
    padding: 24rem 0rem 36rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24rem;
    color: #707070;
  }
}

::-webkit-scrollbar {
  display: none;
}
</style>
