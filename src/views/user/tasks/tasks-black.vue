<template>
  <x-page no-footer :headerBgColor="conf.bgcolor" :topfill="false" backColor="#00000033" pageType="black">
    <template #title>
      {{ $t('task.Task') }}
    </template>
    <sign-remind :show="conf.signTip" :sigNum="conf.sigTotal"></sign-remind>

    <div class="head">
      <x-statusbar />
      <div class="head-box">
        <img class="head-bg" src="/static/theme/black/task/task-bg.png" />
        <div class="head-content">
          <div class="time">Ends 2025/2/28 06:59:59</div>
          <div class="points flex-b-c">
            <div class="left-total items-center">
              <div v-if="conf.showMall">
                <span>{{ conf.changePointNum(conf.userVipIntegral) }}</span>
                {{ $t('point.points') }}
              </div>
              <div @click.stop="conf.goPage('/user/luckybox/index')" class="items-center">
                <span style="margin-left: 20rem">{{ conf.boxCount }}</span>
                {{ $t('point.luckyBox') }}
              </div>
              <van-icon size="24rem" name="arrow" style="margin-left: 10rem;" />
            </div>
            <div class="ponints-mall" v-if="conf.showMall">
              <greenBtn @click="conf.goPage('/user/point/point')">
                <span>{{ $t('point.pointsMall') }}</span>
              </greenBtn>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="task-box">
      <div class="sign-time" v-if="conf.showSign">
        <!-- 连续签到和签到提醒开关 -->
        <div class="flex-b-c">
          <div class="title-left">
            <div>
              {{ $t('point.SigningIn') }}
              <span>{{ conf.sigTotal }}</span>
              {{ conf.sigTotal > 1 ? $t('point.days') : $t('agencyCenterModule.day') }}
            </div>
            <van-icon color="#bfbfbf" @click="conf.changeTips" name="info-o" style="margin-left: 10rem;" />
          </div>
          <div class="title-right items-center">
            <span>{{ $t('point.SignReminder') }}</span>
            <van-switch v-model="conf.checked" active-color="#1CF187" style="transform: scale(0.7)"
              @change="conf.switch1Change" />
          </div>
        </div>
        <!-- <div class="line"></div> -->
        <!-- 上/下月份选择 -->
        <div class="select-time flex-b-c">
          <div class="select-arrow flex-center" @click="conf.prevMonth">
            <van-icon color="#fff" size="20rem" name="arrow-left" />
          </div>
          {{ conf.dateNum }}
          <div class="select-arrow flex-center" @click="conf.nextMonth">
            <van-icon color="#fff" size="20rem" name="arrow" />
          </div>
        </div>
        <loading :type="2" v-if="conf.signLading && !conf.calendar.length"></loading>
        <div class="time-box"
          :style="{ 'height': !conf.moreDayShow ? '180rem' : conf.calendar.length > 28 ? '650rem' : '520rem' }"
          v-if="conf.calendar.length">
          <!-- 隐藏时显示今天的日期列 -->
          <div class="time-list" :class="{ 'transitionTime': conf.moreDayShow }"
            :style="{ 'margin-top': !conf.moreDayShow ? conf.showSignLine * -132 + 'rem' : '0rem' }">
            <template v-for="(item, index) in conf.calendar" :key="index">
              <div class="time-item time-active"
                v-if="item.year == conf.today[2] && item.moon == conf.today[0] && item.num == conf.today[1]">
                <van-icon size="30rem" color="#1CF187" name="checked"
                  v-if="conf.getIsPoint(item.num, item.moon, item.year)" />
                <div class="time-img" v-else>
                  <img class="day-point-img" src="/static/theme/black/task/day-point.png" />
                  <div class="point-num">{{ conf.getPointNum(item.num, item.moon) }}</div>
                </div>
                <div class="day-today">{{ $t('point.today') }}</div>
              </div>
              <div class="time-item"
                :style="{ 'background': conf.getIsPoint(item.num, item.moon, item.year) ? '#2E6E50' : '#2E3733' }"
                v-else-if="item.year == conf.today[2] && item.moon <= conf.today[0]">
                <!-- 时间没到 -->
                <div class="time-img" v-if="item.moon == conf.today[0] && item.num > conf.today[1]">
                  <img class="day-point-img" src="/static/theme/black/task/day-point.png" />
                  <div class="point-num">{{ conf.getPointNum(item.num, item.moon) }}</div>
                </div>
                <!-- 已签到 -->
                <van-icon size="30rem" color="#1CF187" name="checked"
                  v-else-if="conf.getIsPoint(item.num, item.moon, item.year)" />
                <!-- 未签到 -->
                <div class="miss" v-else>{{ $t('point.miss') }}</div>
                <div class="dat-num">{{ item.moon == 13 ? 1 : item.moon }}.{{ item.num }}</div>
              </div>
              <div class="time-item" v-else>
                <div class="time-img">
                  <img class="day-point-img" src="/static/theme/black/task/day-point.png" />
                  <div class="point-num">{{ conf.getPointNum(item.num, item.moon) }}</div>
                </div>
                <div class="dat-num">{{ item.moon == 13 ? 1 : item.moon }}.{{ item.num }}</div>
              </div>
            </template>
            <div class="time-item" style="background: none" v-for="item in 35 - conf.calendar.length" :key="item + '-'"
              v-if="conf.calendar.length < 35"></div>
          </div>
          <!-- 显示/隐藏更多 -->
          <div class="mask-more" @click="conf.moreDayShow = !conf.moreDayShow"
            :class="{ 'mask-more-up': conf.moreDayShow }">
            <!-- <img class="more-img" src="/static/img/task/black-arrow.png" /> -->
            <van-icon class="more-img" color="#fff" size="20rem" name="arrow-down" />
          </div>
        </div>
        <div class="sign-btn flex-center" :class="{ 'disabled': conf.selectSignBtn() }" @click="conf.clickPointsSign"
          v-if="conf.calendar.length">
          <greenBtn>
            <span>{{ $t('point.signIn') }}</span>
          </greenBtn>
        </div>
      </div>
      <!-- 任务列表 -->
      <task-list :taskList="conf.taskList" :defalutWallet="conf.defalutWallet"
        v-if="conf.defalutWallet && conf.taskList.length"></task-list>
      <loading v-if="!conf.taskList.length && (conf.taskLoading || !conf.defalutWallet)"></loading>
      <x-no-data v-if="!conf.taskLoading && !conf.taskList.length" />
    </div>
    <sign-pop ref="signPopRefs"></sign-pop>
  </x-page>
</template>

<script setup lang="ts">
import greenBtn from '@/views/home/theme/black/components/greenBtn.vue'
import taskList from './theme/black/components/taskList.vue'
import loading from './components/loading.vue'
import signRemind from '@/views/user/tasks/theme/black/components/signRemind.vue'
import signPop from './theme/black/components/signPop.vue'
import { ref } from 'vue'
import { index } from './tasks'
import { Scope } from 'tools-vue3'
import { EPage } from '@/enum/Enum'
import stheme from '@/sstore/stheme'

const signPopRefs = ref<any>()
const conf = index({ signPopRefs })

const event = Scope.Event()
event.on(EPage.scroll, (e) => {
  if (e.top > 60) {
    conf.bgcolor = stheme.theme.black.headerBgColor()
  } else {
    conf.bgcolor = 'transparent'
  }
})
</script>

<style lang="less" scoped>
.head-right {
  padding: 0 32rem;

  .img {
    width: 40rem;
    height: 44rem;
  }
}

.head {
  background: linear-gradient(180deg, #244A38 0%, #232626 100%);

  .head-box {
    height: 260rem;
    display: flex;
    justify-content: flex-end;
    position: relative;

    .head-bg {
      height: 300rem;
      margin-top: 40rem;
      margin-right: 24rem;
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

      .points {
        margin-top: 40rem;

        .left-total {
          display: flex;
          align-items: center;

          span {
            color: #fff;
            font-size: 32rem;
            margin-right: 10rem;
          }
        }

        .ponints-mall {
          height: 68rem;
          width: 200rem;
        }
      }
    }
  }
}

.items-center {
  display: flex;
  align-items: center;
}

.task-box {
  padding: 20rem 24rem;
  position: relative;
  z-index: 3;
}

.sign-time {
  padding: 20rem 20rem 40rem;
  border-radius: 20rem;
  background: linear-gradient(180deg, #324737 0%, #323939 100%);
  color: #fff;
  font-size: 24rem;

  .title-left {
    display: flex;
    align-items: center;
    font-size: 28rem;

    span {
      color: #1CF187;
      margin: 0 8rem;
    }
  }

  .title-right {
    color: #bfbfbf;
    margin-right: -6rem;
  }

  .line {
    height: 1rem;
    background: #eee;
    margin: 10rem 0rem;
  }

  .select-time {
    margin: 20rem 6rem 10rem;
    color: #fff;
    font-weight: 600;
    font-size: 28rem;

    .select-arrow {
      width: 44rem;
      height: 44rem;
      background: #00000033;
      border-radius: 12rem;
    }
  }

  .time-box {
    position: relative;
    overflow: hidden;
    transition: all 0.2s;
  }

  .transitionTime {
    transition: all 0.2s;
  }

  .time-list {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;

    .time-item {
      background: #2E3733;
      border-radius: 8rem;
      width: 12%;
      height: 120rem;
      margin-right: 2%;
      margin-top: 12rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      padding-top: 16rem;

      .miss {
        background: #394143;
        color: #fff;
        font-size: 20rem;
        padding: 2rem 5rem;
        border-radius: 4rem;
      }

      .task-sign-img {
        width: 36rem;
        height: 36rem;
      }

      .time-img {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 8rem;

        .day-point-img {
          width: 50rem;
          height: 50rem;
        }

        .point-num {
          position: absolute;
          font-size: 19rem;
          color: #005233;
        }
      }

      .dat-num {
        color: #BFBFBF;
        font-size: 22rem;
        text-align: center;
        margin: 10rem 0 8rem;
      }
    }

    .time-active {
      border: 2rem solid #1CF187;

      .day-today {
        background: #1CF187;
        color: #fff;
        font-size: 20rem;
        width: 100%;
        text-align: center;
        padding: 5rem 0rem 8rem;
      }
    }
  }

  .mask-more {
    position: absolute;
    left: 0;
    right: 0;
    height: 36rem;
    bottom: 0rem;
    text-align: center;
    background: linear-gradient(0deg, #323B39 63.08%, rgba(50, 57, 57, 0) 100%);


    .more-img {
      width: 10rem;
      height: 18rem;
    }
  }

  .mask-more-up {
    background: linear-gradient(360deg, rgba(50, 59, 57, 0.6) 71.01%, rgba(50, 57, 57, 0) 113.77%);

    .more-img {
      transform: rotate(180deg);
    }
  }

  .sign-btn {
    background: linear-gradient(93.51deg, #006fff 5.72%, #087bff 86.61%);
    box-shadow: 8rem 8rem 16rem 0rem #0779ff4d;
    height: 80rem;
    color: #fff;
    border-radius: 40rem;
    font-size: 32rem;
    margin-top: 20rem;
  }

  .disabled {
    background: #ececec;
    box-shadow: none;
  }
}
</style>
