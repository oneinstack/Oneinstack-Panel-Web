<template>
  <x-page :fixed="false">
    <template #title>
      {{ $t('me.History') }}
    </template>
    <template #top>
      <div class="tabs-comtent">
        <div class="tabs-type">
          <div style="width: 720rem; overflow: auto" ref="typeRefs" v-if="conf.lotteryList.length > 0" v-scroll>
            <div class="type-list">
              <template v-for="(item, index) in conf.lotteryList" :key="index">
                <div
                  class="type-item"
                  :class="{ 'type-active': item.lotteryTypeVO.lotteryTypeCode == conf.typeIndex }"
                  @click="conf.handleChangeTab(item, index)"
                  v-if="item.lotteryVOList.length > 0"
                >
                  {{ item.lotteryTypeVO.lotteryTypeName }}
                </div>
              </template>
            </div>
          </div>
        </div>
        <div>
          <div style="width: 720rem; overflow: auto" v-if="conf.timesList.length > 0" v-scroll>
            <div class="tabs-times">
              <template v-for="(item, index) in conf.timesList" :key="index">
                <div
                  class="time-item"
                  :class="{ 'time-active': index == conf.timeIndex }"
                  @click="conf.handleChangeTime(item, index)"
                >
                  {{ item.newName || item.lotteryShowname }}
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </template>
    <!-- content -->
    <div style="width: 100%">
      <div scroll-y style="width: 100%; height: 100%">
        <div class="result">
          <div class="result-title" v-if="conf.typeIndex == '3D'">
            <div style="width: 31%; padding-right: 20rem">{{ $t('game.drawID') }}</div>
            <div style="width: 30%">{{ $t('game.result') }}</div>
            <div style="width: 12%">{{ $t('game.sum') }}</div>
            <div style="width: 12%">{{ $t('game.value') }}</div>
            <div style="width: 15%">{{ $t('game.number') }}</div>
          </div>
          <div
            class="result-title"
            style="display: flex; justify-content: space-between"
            v-if="conf.typeIndex == 'COLOR'"
          >
            <div>{{ $t('game.drawID') }}</div>
            <div>{{ $t('game.number') }}</div>
          </div>
          <div
            class="result-title"
            style="display: flex; justify-content: space-between"
            v-if="conf.typeIndex == 'SATTA_KING'"
          >
            <div>{{ $t('game.drawID') }}</div>
            <div>{{ $t('game.number') }}</div>
          </div>
          <div class="result-title" v-if="conf.typeIndex == 'Trx_Win_Go'">
            <div style="width: 36%; padding-right: 20rem">{{ $t('game.drawID') }}</div>
            <div style="width: 34%">{{ $t('winGo.Block') }}</div>
            <div style="width: 15%">{{ $t('winGo.BS') }}</div>
            <div style="width: 15%">{{ $t('game.result') }}</div>
          </div>
          <div class="result-title" v-if="conf.typeIndex == 'PK10'">
            <div style="width: 29%">{{ $t('game.drawID') }}</div>
            <div style="width: 29%">{{ $t('game.result') }}</div>
            <div style="width: 21%">{{ $t('winGo.BS') }}</div>
            <div style="width: 21%">{{ $t('pk10.OE') }}</div>
          </div>
          <div class="result-title" v-if="conf.typeIndex == '5D'">
            <div style="width: 30%">{{ $t('game.drawID') }}</div>
            <div style="width: 37%">{{ $t('game.result') }}</div>
            <div style="width: 11%">{{ $t('game.sum') }}</div>
            <div style="width: 11%">{{ $t('winGo.BS') }}</div>
            <div style="width: 11%">{{ $t('pk10.OE') }}</div>
          </div>
          <div class="result-list">
            <!-- 3d -->
            <div v-if="conf.typeIndex == '3D'">
              <template v-for="(item, index) in conf.resultList" :key="index">
                <div class="result-ltem" v-if="item.openCode">
                  <div style="width: 31%; word-break: break-all; font-size: 28rem">{{ item.openExpect }}</div>
                  <div style="width: 30%" class="share-point">
                    <img class="point-img" :src="'static/img/share-' + conf.getNum(item, 0) + '.webp'" />
                    <img class="point-img" :src="'static/img/share-' + conf.getNum(item, 1) + '.webp'" />
                    <img class="point-img" :src="'static/img/share-' + conf.getNum(item, 2) + '.webp'" />
                  </div>
                  <div style="width: 12%; display: flex; justify-content: center">
                    <div class="sum">
                      <img class="sum-img" src="/static/img/poinits.webp" />
                      <div class="sum-num">{{ conf.getTotal(item.openCode) }}</div>
                    </div>
                  </div>
                  <div style="width: 12%; display: flex; justify-content: center">
                    <img class="img" src="/static/img/small.webp" v-if="conf.getValue(item) == 1" />
                    <img class="img" src="/static/img/big.webp" v-if="conf.getValue(item) == 2" />
                    <div class="img" style="text-align: center" v-if="conf.getValue(item) == 0">-</div>
                  </div>
                  <div style="width: 15%; display: flex; justify-content: center">
                    <img class="img" src="/static/img/odd.webp" v-if="conf.getNumber(item) == 2" />
                    <img class="img" src="/static/img/even.webp" v-if="conf.getNumber(item) == 1" />
                    <div class="img" style="text-align: center" v-if="conf.getNumber(item) == 0">-</div>
                  </div>
                </div>
                <div class="result-ltem" v-else>
                  <div style="width: 31%; word-break: break-all; font-size: 28rem">{{ item.openExpect }}</div>
                  <div style="width: 30%" class="share-point">
                    <img class="point-img" src="/static/img/share-0.webp" />
                    <img class="point-img" src="/static/img/share-0.webp" />
                    <img class="point-img" src="/static/img/share-0.webp" />
                  </div>
                  <div style="width: 14%; display: flex; justify-content: center">
                    <div class="sum">
                      <img class="sum-img" src="/static/img/poinits.webp" />
                      <div class="sum-num">?</div>
                    </div>
                  </div>
                  <div style="width: 14%; display: flex; justify-content: center">
                    <div class="img" style="text-align: center">-</div>
                  </div>
                  <div style="width: 15%; display: flex; justify-content: center">
                    <div class="img" style="text-align: center">-</div>
                  </div>
                </div>
              </template>
            </div>
            <!-- color -->
            <div v-if="conf.typeIndex == 'COLOR'">
              <template v-for="(item, index) in conf.resultList" :key="index">
                <div class="result-ltem">
                  <div class="issue">{{ item.openExpect }}</div>
                  <div class="number">
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
                </div>
              </template>
            </div>

            <!-- satta -->
            <div v-if="conf.typeIndex == 'SATTA_KING'">
              <template v-for="(item, index) in conf.resultList" :key="index">
                <div class="result-ltem">
                  <div class="issue">{{ item.openExpect }}</div>
                  <div class="purchase-num" v-if="item.openCode">
                    <img class="sum-img" src="/static/img/color-red.webp" />
                    <div class="sum-num">{{ conf.ripr(item.openCode) }}</div>
                  </div>
                </div>
              </template>
            </div>

            <!-- Trx_Win_Go -->
            <div v-if="conf.typeIndex == 'Trx_Win_Go'">
              <template v-for="(item, index) in conf.resultList" :key="index">
                <div class="result-ltem" v-if="item.openCode">
                  <div style="width: 36%; word-break: break-all; font-size: 28rem">{{ item.openExpect }}</div>
                  <div style="width: 34%" class="share-point">
                    {{ '**' + item.openNumberStr }}
                  </div>
                  <div style="width: 15%; display: flex; justify-content: center">
                    <div class="sum-type" v-if="item.openNumber > 4">
                      <div class="win-go-sum flex-center active_blue">B</div>
                    </div>
                    <div class="sum-type" v-else>
                      <div class="win-go-sum flex-center active_yellow">S</div>
                    </div>
                  </div>
                  <div style="width: 15%; display: flex; justify-content: center">
                    <div class="banner-item" v-if="String(item.openNumber)">
                      <div class="num" :class="['qkball_' + item.color]">
                        <span class="txt">{{ item.openNumber }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="result-ltem" v-else>
                  <div style="width: 36%; word-break: break-all; font-size: 28rem">{{ item.openExpect }}</div>
                  <div style="width: 34%" class="share-point">
                    {{ '--' }}
                  </div>
                  <div style="width: 15%; display: flex; justify-content: center">
                    <div class="sum-type">{{ '--' }}</div>
                  </div>
                  <div style="width: 15%; display: flex; justify-content: center">
                    <div class="banner-item" v-if="String(item.openNumber)">
                      <div class="num">{{ '--' }}</div>
                    </div>
                  </div>
                </div>
              </template>
            </div>
            <!-- PK10 -->
            <div class="gh-table" v-if="conf.typeIndex == 'PK10'">
              <template v-for="(item, index) in conf.resultList">
                <div class="gh-table-item row no-wrap">
                  <div style="width: 29%">{{ item.openExpect }}</div>
                  <div style="width: 29%; gap: 8rem" class="row flex-center">
                    <template v-if="item.openCode.length > 0">
                      <div
                        v-for="(a, i) in item.openCode.split(',')"
                        :key="i"
                        :class="['qkball' + a]"
                        style="height: 40rem; width: 40rem"
                      ></div>
                    </template>
                    <template v-else>
                      <div v-for="v in 3" :key="v" style="height: 40rem; width: 40rem">-</div>
                    </template>
                  </div>
                  <div style="width: 21%; gap: 8rem" class="row flex-center">
                    <div
                      class="bs-item"
                      v-for="(a, i) in item.openCode.split(',')"
                      :key="i"
                      :class="conf.BSFun(a) == 'B' ? ['num_blue'] : ['num_yellow']"
                    >
                      <div>{{ conf.BSFun(a) }}</div>
                    </div>
                  </div>
                  <div style="width: 21%; gap: 8rem" class="row flex-center">
                    <div
                      class="bs-item"
                      v-for="(a, i) in item.openCode.split(',')"
                      :key="i"
                      :class="conf.OEFun(a) == 'O' ? ['num_red'] : ['num_green']"
                    >
                      <div>{{ conf.OEFun(a) }}</div>
                    </div>
                  </div>
                </div>
              </template>
            </div>

            <!-- 5D -->
            <div v-if="conf.typeIndex == '5D'">
              <template v-for="(item, index) in conf.resultList" :key="index">
                <div class="result-ltem" v-if="item.openCode">
                  <div style="width: 30%; word-break: break-all; font-size: 28rem">{{ item.openExpect }}</div>
                  <div style="width: 37%" class="share-point">
                    <template v-for="(into, intoIndex) in item.openCode.split(',')">
                      <div class="sum">
                        <img class="sum-img" src="/static/img/poinits.webp" />
                        <div class="sum-num">{{ into || '-' }}</div>
                      </div>
                    </template>
                  </div>
                  <div style="width: 11%; display: flex; justify-content: center">
                    <div class="sum">
                      <img class="sum-img" src="/static/img/poinits.webp" />
                      <div class="sum-num">{{ conf.getTotal(item.openCode) }}</div>
                    </div>
                  </div>
                  <div style="width: 11%; display: flex; justify-content: center">
                    <div v-if="conf.getTotal(item.openCode) > 22" class="big-view">B</div>
                    <div v-else class="small-view">S</div>
                  </div>
                  <div style="width: 11%; display: flex; justify-content: center">
                    <div v-if="conf.getTotal(item.openCode) % 2 != 0" class="odd-view">O</div>
                    <div v-else class="even-view">E</div>
                  </div>
                </div>
                <div class="result-ltem" v-else>
                  <div style="width: 31%; word-break: break-all; font-size: 28rem">{{ item.openExpect }}</div>
                  <div style="width: 30%" class="share-point">
                    <img class="point-img" src="/static/img/share-0.webp" />
                    <img class="point-img" src="/static/img/share-0.webp" />
                    <img class="point-img" src="/static/img/share-0.webp" />
                  </div>
                  <div style="width: 14%; display: flex; justify-content: center">
                    <div class="sum">
                      <img class="sum-img" src="/static/img/poinits.webp" />
                      <div class="sum-num">?</div>
                    </div>
                  </div>
                  <div style="width: 14%; display: flex; justify-content: center">
                    <div class="img" style="text-align: center">-</div>
                  </div>
                  <div style="width: 15%; display: flex; justify-content: center">
                    <div class="img" style="text-align: center">-</div>
                  </div>
                </div>
              </template>
            </div>

            <div v-if="conf.resultList.length > 0">
              <div class="more" v-if="conf.isTips == false">
                <div class="more-btn" @click="conf.moreMessage">
                  <span>{{ $t('game.showMore') }}</span>
                  <img src="/static/img/show-more.png" style="width: 20rem; height: 12rem" />
                </div>
              </div>
              <div class="more-not" v-else>
                <span>{{ $t('user.noMore') }}</span>
              </div>
            </div>
          </div>
          <x-no-data v-if="conf.resultList.length == 0" />
        </div>
      </div>
    </div>
  </x-page>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { index } from './resultHistory'

const typeRefs = ref<any>()

const conf = index({ typeRefs })
</script>

<style lang="less" scoped>
.tabs-comtent {
  height: 224rem;
  background: #fff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 32rem 20rem;

  .tabs-type {
    display: flex;
    background: #fff6e6;

    .type-list {
      display: flex;
      height: 60rem;
      background: #fff6e6;
      color: #000000;
      font-weight: bold;
      border-radius: 10rem;

      .type-item {
        text-align: center;
        width: 220rem;
        flex-shrink: 0;
        line-height: 60rem;
      }

      .type-active {
        border-radius: 10rem;
        background: #ffa64f;
        color: #fff;
      }
    }
  }

  .tabs-times {
    display: flex;

    .time-item {
      padding: 0rem 25rem;
      color: #00000090;
      font-weight: bold;
      background: #f9f9f9;
      border-radius: 10rem;
      height: 56rem;
      display: flex;
      justify-content: center;
      align-items: center;
      margin-left: 20rem;
      width: 120rem;

      &:first-of-type {
        margin-left: 0rem;
      }
    }

    .time-active {
      background: #fff6e6;
    }
  }
}

.result {
  margin: 24rem 12rem;
  border-radius: 16rem;
  overflow: hidden;

  .result-title {
    display: flex;
    padding: 0rem 24rem;
    background: #ffecc7;

    div {
      font-size: 24rem;
      color: #45454d;
      padding: 20rem 0rem;
      display: flex;
      justify-content: center;
    }
  }

  .result-list {
    margin-bottom: 24rem;
    background: #fff;
    border-radius: 0 0 16rem 16rem;

    .result-ltem {
      padding: 28rem 24rem;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;

      .share-point {
        display: flex;
        justify-content: center;

        .point-img {
          width: 48rem;
          height: 48rem;
        }
      }

      .img {
        width: 48rem;
        height: 48rem;
      }

      .sum {
        width: 48rem;
        height: 48rem;
        position: relative;

        .sum-img {
          width: 100%;
          height: 100%;
        }

        .sum-num {
          position: absolute;
          top: 0rem;
          bottom: 0rem;
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 26rem;
          color: #2c2e36;
        }
      }

      .issue {
        font-size: 30rem;
        color: #45454d;
      }

      .number {
        display: flex;
        justify-content: center;

        .num-img {
          width: 40rem;
          height: 40rem;
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
          width: 36rem;
          height: 36rem;
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

      &:nth-child(2n) {
        background: #fffbf5;
      }

      .purchase-num {
        width: 40rem;
        height: 40rem;
        position: relative;

        .sum-img {
          width: 100%;
          height: 100%;
        }

        .sum-num {
          position: absolute;
          top: 0rem;
          bottom: 0rem;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20rem;
          color: #fff;
        }
      }
    }

    .more {
      background: #fff;
      padding: 24rem;

      .more-btn {
        box-shadow: rgba(0, 0, 0, 0.1) 0px 8rem 8rem;
        border-radius: 16rem;
        height: 78rem;
        display: flex;
        align-items: center;
        justify-content: center;

        text {
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

  .sum-type {
    display: flex;
    margin: auto;
  }

  .active_blue {
    background: linear-gradient(90deg, #00bdff 0%, #5bcdff 100%);
    box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.15);
  }

  .active_yellow {
    background: linear-gradient(90deg, #ff9000 0%, #ffd000 100%);
    box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.15);
  }

  .win-go-sum {
    height: 45rem;
    width: 45rem;
    color: #fff;
    background-color: #fb4e4e;
    border-radius: 50%;
    font-size: 20rem;
  }

  .flex-center {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.banner-item {
  position: relative;
  width: 45rem;
  height: 45rem;
  margin-left: 8rem;

  .img {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 100%;
  }

  .num {
    position: absolute;
    top: 0rem;
    bottom: 0rem;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28rem;
  }
}

.qkball_rv {
  background: url(/static/img/game/twgo/n0_bg.png) !important;
  background-size: 100% !important;

  .txt {
    background: linear-gradient(143deg, #fe565c 51.71%, #a943f7 51.72%) !important;
    background-clip: text !important;
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
  }
}

.qkball_g {
  background: url(/static/img/game/twgo/green_bg.png) !important;
  background-size: 100% !important;

  .txt {
    color: #2f9c61;
  }
}

.qkball_gv {
  background: url(/static/img/game/twgo/n5_bg.png) !important;
  background-size: 100% !important;

  .txt {
    background: linear-gradient(143deg, #4ccb86 51.71%, #a943f7 51.72%) !important;
    background-clip: text !important;
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
  }
}

.qkball_r {
  background: url(/static/img/game/twgo/red_bg.png) !important;
  background-size: 100% !important;

  .txt {
    color: #e93333;
  }
}

.qkball_green {
  background: linear-gradient(90deg, #00be50 0%, #9bdf00 100%);
  box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.15);
}

.qkball_red {
  background: linear-gradient(90deg, #fd0261 0%, #ff8a96 100%);
  box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.15);
}

.qkball_blue {
  background: linear-gradient(90deg, #00bdff 0%, #5bcdff 100%);
  box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.15);
}

.qkball_yellow {
  background: linear-gradient(90deg, #ff9000 0%, #ffd000 100%);
  box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.15);
}

.qkball_violet {
  background: linear-gradient(90deg, #480ac5 0%, #b36ff8 100%);
  box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.15);
}

//pk10
.gh-table {
  color: #ffffff;

  &-header {
    text-align: center;
    background-color: #f6843f;
    font-size: 24rem;
    line-height: 80rem;
    font-weight: 600;
  }

  &-item {
    text-align: center;
    line-height: 80rem;
    color: #414141;
    font-size: 24rem;
    background-color: #fff;

    .bs-item {
      height: 40rem;
      line-height: 40rem;
      padding: 0 12rem;
      color: #fff;
      border-radius: 8rem;
    }
  }

  &-foot {
    height: 40rem;
    background-color: #ffffff;
    border-bottom-right-radius: 26rem;
    border-bottom-left-radius: 26rem;
  }
}

.gh-table .gh-table-item:nth-child(even) {
  background-color: #fffbf5;
}

.num_green {
  background: linear-gradient(90deg, #00be50 0%, #9bdf00 100%);
  box-shadow: 0 0 20rem 0 rgba(0, 0, 0, 0.15);
}

.num_red {
  background: linear-gradient(90deg, #fd0261 0%, #ff8a96 100%);
  box-shadow: 0 0 20rem 0 rgba(0, 0, 0, 0.15);
}

.num_blue {
  background: linear-gradient(90deg, #00bdff 0%, #5bcdff 100%);
  box-shadow: 0 0 20rem 0 rgba(0, 0, 0, 0.15);
}

.num_yellow {
  background: linear-gradient(90deg, #ff9000 0%, #ffd000 100%);
  box-shadow: 0 0 20rem 0 rgba(0, 0, 0, 0.15);
}

.flex-bw {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}
.gh-table-item {
  line-height: 100rem;
}

.small-view {
  background: linear-gradient(90deg, #ff9000 0%, #ffd000 100%);
  box-shadow: 0 0 20rem 0 rgba(0, 0, 0, 0.15);
}

.big-view {
  background: linear-gradient(90deg, #00bdff 0%, #5bcdff 100%);
  box-shadow: 0 0 20rem 0 rgba(0, 0, 0, 0.15);
}

.odd-view {
  background: linear-gradient(90deg, #fd0261 0%, #ff8a96 100%);
  box-shadow: 0 0 20rem 0 rgba(0, 0, 0, 0.15);
}

.even-view {
  background: linear-gradient(90deg, #00be50 0%, #9bdf00 100%);
  box-shadow: 0 0 20rem 0 rgba(0, 0, 0, 0.15);
}

.small-view,
.big-view,
.odd-view,
.even-view {
  color: #fff;
  width: 48rem;
  height: 48rem;
  text-align: center;
  line-height: 48rem;
  border-radius: 50%;
}
</style>
<style lang="less" scoped>
@import '@/views/game/pk10/pk10.less';
</style>
