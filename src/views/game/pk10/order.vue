<template>
  <div class="result">
    <div class="result-list">
      <template v-for="(item, index) in orderDataList" :key="index">
        <div class="result-ltem" :id="index == 0 ? 'order0' : ''">
          <div class="result-title">
            <div class="title-left">
              <div class="title-type" v-if="item.betStatus == 0">
                <div class="title-skew"></div>
                <div class="type-text">{{ $t('game.toDrawn') }}</div>
              </div>
              <div class="title-type" v-if="item.betStatus == 2">
                <div class="title-skew Prize"></div>
                <div class="type-text">{{ $t('game.prizeWinning') }}</div>
              </div>
              <div class="title-type Losing" v-if="item.betStatus == 1">
                <div class="title-skew Losing"></div>
                <div class="type-text">{{ $t('game.losingLottery') }}</div>
              </div>
              <div class="title-type" style="width: 215rem" v-if="item.betStatus == 3">
                <div class="title-skew Cancelled"></div>
                <div class="type-text">{{ $t('game.cancelledOrder') }}</div>
              </div>
              <div class="title-code">{{ item.betExpect }}</div>
            </div>
            <!-- PK10 -->
            <div class="title-right">
              <div class="pkOpenCode">
                <div class="blue">
                  {{ item.betCodes.slice(0, 3) }}
                </div>
                <div class="pk" v-if="!conf.getNum(item.betCodes)" :class="['pk_' + item.betCodes.slice(4)]"></div>
                <div class="pk num" :class="'num_' + item.betCodes.slice(4)" v-else>
                  {{ item.betCodes.slice(4) }}
                </div>
              </div>
            </div>
          </div>

          <div class="result-content">
            <div class="content-item">
              <img class="content-img" src="/static/img/bet-time.png" />
              <div class="content">{{ $t('game.bettingTime') }}:{{ sutil.getTimeFormat(item.betTime) }}</div>
            </div>
            <div class="content-item">
              <img class="content-img" src="/static/img/bet-time.png" />
              <div class="content">{{ $t('game.openTime') }}:{{ sutil.getTimeFormat(item.betOpenTime) }}</div>
            </div>
            <div class="content-item">
              <img class="content-img" src="/static/img/bet-money.png" />
              <div class="content">{{ $t('game.BetCoin') }}:{{ item.betCoinCode }}</div>
            </div>
            <div class="content-item">
              <img class="content-img" src="/static/img/bet-money.png" />
              <div class="content">
                {{ $t('game.betMoney') }}:{{ item.coinSymbol + item.betMoney }}
                <template v-if="item.defaultWalletCoin != item.betCoinCode">
                  {{ ' (≈' + item.defaultWalletCoinSymbol + item.betMoneyToFixed4 + ')' }}
                </template>
              </div>
            </div>
            <div class="content-item">
              <img class="content-img" src="/static/img/bet-prize.png" />
              <div class="content">
                {{ $t('game.prizeMoney') }}:{{ item.coinSymbol + item.betPrizeMoney }}
                <template v-if="item.defaultWalletCoin != item.betCoinCode && parseFloat(item.betPrizeMoney) > 0">
                  {{ '(≈' + item.defaultWalletCoinSymbol + item.PrizeMoneyToFixed4 + ')' }}
                </template>
              </div>
            </div>
            <!-- <div class="content-line">
								<div class="line-left">
									<div class="content-item">
										<img class="content-img" src="/static/img/bet-money.png" />
										<div class="content">
											{{$t('game.betMoney')}}:{{item.betMoneyToFixed4}}
										</div>
									</div>
								</div>
								<div class="line-right">
									<div class="content-item">
										<img class="content-img" src="/static/img/bet-prize.png" />
										<div class="content">
											{{$t('game.prizeMoney')}}:{{item.PrizeMoneyToFixed4}}
										</div>
									</div>
								</div>
							</div> -->
            <div class="content-item">
              <div class="content-img-item">
                <img src="/static/img/bet-numbers.png" />
                <div class="img-num">
                  <text style="margin-top: 0rem">
                    {{ String(item.openNumber).length > 1 ? '-' : String(item.openNumber) }}
                  </text>
                </div>
              </div>
              <div class="content">
                {{ $t('game.openCode') }}:
                <div class="pkOpenCode" v-if="item.betOpenCode">
                  <div class="pk" v-for="(v, i) in item.betOpenCode.split(',')" :key="i" :class="['pk_' + v]"></div>
                </div>
                <div class="pkOpenCode" v-else>--</div>
              </div>
            </div>
          </div>
        </div>
      </template>
      <x-no-data v-if="orderDataList.length == 0"></x-no-data>
    </div>
  </div>
</template>

<script setup lang="ts">
import sutil from '@/sstore/sutil'
import { reactive, watch } from 'vue'

const emit = defineEmits(['handleClickOrderPage'])
const props = defineProps({
  orderDataList: {
    default: [] as any[]
  },
  isClickPage: {
    default: false
  }
})
const conf = reactive({
  getNum(str: any) {
    let a = ['Big', 'Small', 'Odd', 'Even', 'big', 'small', 'odd', 'even']
    let sta = false
    a.forEach((v) => {
      if (str.includes(v)) {
        return (sta = true)
      }
    })
    return sta
  }
})
watch(
  () => props.isClickPage,
  (val: any) => {
    emit('handleClickOrderPage', false)
  },
  { deep: true }
)
</script>

<style lang="less" scoped>
.result {
  // margin: 0rem 24rem 124rem;
  border-radius: 16rem;

  .result-list {
    .result-ltem {
      padding: 30rem;
      background: #fff;
      margin-bottom: 24rem;

      .result-title {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .title-left {
          display: flex;
          align-items: center;

          .title-type {
            position: relative;
            width: 186rem;
            height: 46rem;

            .title-skew {
              background: #3c80f5;
              position: absolute;
              top: 0;
              bottom: 0;
              left: 0;
              right: 0;
              transform: skew(-30deg);

              &.Prize {
                background: #e20000;
              }

              &.Losing {
                background: #fdab45;
              }

              &.Cancelled {
                background: #5c6381;
              }
            }

            .type-text {
              position: absolute;
              top: 0;
              bottom: 0;
              left: 0;
              right: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #fff;
              font-size: 24rem;
              font-weight: 600;
            }
          }

          .title-code {
            margin-left: 12rem;
            color: #000;
            font-size: 30rem;
            font-weight: 600;
          }
        }

        .title-right {
          .purchase-bg {
            padding: 0rem 12rem;
            height: 40rem;
            background: red;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20rem;
            color: #fff;
            border-radius: 5rem;
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
      }

      .result-content {
        .content-item {
          display: flex;
          align-items: center;
          margin-top: 24rem;

          .content-img {
            width: 25rem;
            height: 25rem;
          }

          .content {
            color: #3a3a3a;
            font-size: 24rem;
            font-weight: 500;
            margin-left: 8rem;
            display: flex;
            align-items: center;
          }

          .content-img-item {
            width: 25rem;
            height: 25rem;
            position: relative;

            img {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
            }

            .img-num {
              position: absolute;
              top: 0;
              bottom: 0;
              right: 0;
              left: 0;
              color: #000;
              font-size: 19rem;
              display: flex;
              align-items: center;
              justify-content: center;
            }
          }
        }

        .content-line {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
      }
    }

    .more {
      background: #fff;
      padding: 24rem 24rem 24rem;

      .more-btn {
        box-shadow: rgba(0, 0, 0, 0.1) 0px 1.06667vw 1.06667vw;
        border-radius: 2.13333vw;
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
      padding: 0rem 0rem 36rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24rem;
      color: #707070;
    }
  }
}

.banner-item {
  position: relative;
  width: 34rem;
  height: 34rem;
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

@import '@/views/game/pk10/pk10.less';
</style>
