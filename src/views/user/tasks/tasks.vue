<template>
  <x-page no-footer :bgcolor="'#f1f1f1'" :headerBgColor="conf.bgcolor" :topfill="false">
    <template #title>
      {{ $t('task.Task') }}
    </template>
    <template #right>
      <div class="head-right" @click="conf.goPage('/user/tasks/myTask')">
        <img class="img" src="/static/img/myTask.png" mode="" />
      </div>
    </template>
    <sign-remind :show="conf.signTip" :sigNum="conf.sigTotal"></sign-remind>
    <div class="head">
      <div style="padding: 0 20rem">
        <x-statusbar />
        <div style="height: 104rem"></div>
        <div class="points flex-between">
          <div class="left-total items-center">
            <div v-if="conf.showMall">
              <span>{{ conf.changePointNum(conf.userVipIntegral) }}</span>
              {{ $t('point.points') }}
            </div>
            <div @click.stop="conf.goPage('/user/luckybox/index')" class="items-center">
              <span style="margin-left: 20rem">{{ conf.boxCount }}</span>
              {{ $t('point.luckyBox') }}
            </div>
            <img src="/static/img/task/black-arrow.png" />
          </div>
          <div class="ponints-mall items-center" @click.stop="conf.goPage('/user/point/point')" v-if="conf.showMall">
            <img class="points-mall-img" src="/static/img/task/points-mall.png" />
            <span>{{ $t('point.pointsMall') }}</span>
          </div>
        </div>
        <div class="sign-time" v-if="conf.showSign">
          <!-- 连续签到和签到提醒开关 -->
          <div class="flex-between">
            <div class="title-left">
              <div>
                {{ $t('point.SigningIn') }}
                <span>{{ conf.sigTotal }}</span>
                {{ conf.sigTotal > 1 ? $t('point.days') : $t('agencyCenterModule.day') }}
              </div>
              <img @click="conf.changeTips" class="tips" src="/static/img/task/sign-tips.png" />
            </div>
            <div class="title-right items-center">
              <span>{{ $t('point.SignReminder') }}</span>
              <van-switch
                v-model="conf.checked"
                active-color="#FFA64F"
                style="transform: scale(0.7)"
                @change="conf.switch1Change"
              />
            </div>
          </div>
          <!-- <div class="line"></div> -->
          <!-- 上/下月份选择 -->
          <div class="select-time flex-between">
            <img
              class="select-arrow"
              v-if="!conf.selectDateNo"
              src="/static/img/task/sign-select.png"
              @click="conf.prevMonth"
            />
            <img class="select-arrow arrow-right" v-else src="/static/img/task/sign-select-no.png" />
            {{ conf.dateNum }}
            <img
              class="select-arrow arrow-right"
              v-if="!conf.nextDateNo"
              src="/static/img/task/sign-select.png"
              @click="conf.nextMonth"
            />
            <img class="select-arrow" v-else src="/static/img/task/sign-select-no.png" />
          </div>
          <loading :type="2" v-if="conf.signLading && !conf.calendar.length"></loading>
          <div
            class="time-box"
            :style="{ 'height': !conf.moreDayShow ? '180rem' : conf.calendar.length > 28 ? '650rem' : '520rem' }"
            v-if="conf.calendar.length"
          >
            <!-- 隐藏时显示今天的日期列 -->
            <div
              class="time-list"
              :class="{ 'transitionTime': conf.moreDayShow }"
              :style="{ 'margin-top': !conf.moreDayShow ? conf.showSignLine * -132 + 'rem' : '0rem' }"
            >
              <template v-for="(item, index) in conf.calendar" :key="index">
                <div
                  class="time-item time-active"
                  v-if="item.year == conf.today[2] && item.moon == conf.today[0] && item.num == conf.today[1]"
                >
                  <img
                    class="task-sign-img"
                    v-if="conf.getIsPoint(item.num, item.moon, item.year)"
                    src="/static/img/task/task-sign.png"
                  />
                  <div class="time-img" v-else>
                    <img class="day-point-img" src="/static/img/task/day-point.png" />
                    <div class="point-num">{{ conf.getPointNum(item.num, item.moon) }}</div>
                  </div>
                  <div class="day-today">{{ $t('point.today') }}</div>
                </div>
                <div
                  class="time-item"
                  :style="{ 'background': conf.getIsPoint(item.num, item.moon, item.year) ? '#FFF3EB' : '#F8F8F9' }"
                  v-else-if="item.year == conf.today[2] && item.moon <= conf.today[0]"
                >
                  <!-- 时间没到 -->
                  <div class="time-img" v-if="item.moon == conf.today[0] && item.num > conf.today[1]">
                    <img class="day-point-img" src="/static/img/task/day-point.png" />
                    <div class="point-num">{{ conf.getPointNum(item.num, item.moon) }}</div>
                  </div>
                  <!-- 已签到 -->
                  <img
                    class="task-sign-img"
                    v-else-if="conf.getIsPoint(item.num, item.moon, item.year)"
                    src="/static/img/task/task-sign.png"
                  />
                  <!-- 未签到 -->
                  <div class="miss" v-else>{{ $t('point.miss') }}</div>
                  <div class="dat-num">{{ item.moon == 13 ? 1 : item.moon }}.{{ item.num }}</div>
                </div>
                <div class="time-item" v-else>
                  <div class="time-img">
                    <img class="day-point-img" src="/static/img/task/day-point.png" />
                    <div class="point-num">{{ conf.getPointNum(item.num, item.moon) }}</div>
                  </div>
                  <div class="dat-num">{{ item.moon == 13 ? 1 : item.moon }}.{{ item.num }}</div>
                </div>
              </template>
              <div
                class="time-item"
                style="background: none"
                v-for="item in 35 - conf.calendar.length"
                :key="item + '-'"
                v-if="conf.calendar.length < 35"
              ></div>
            </div>
            <!-- 显示/隐藏更多 -->
            <div
              class="mask-more"
              @click="conf.moreDayShow = !conf.moreDayShow"
              :class="{ 'mask-more-up': conf.moreDayShow }"
            >
              <img class="more-img" src="/static/img/task/black-arrow.png" />
            </div>
          </div>
          <div
            class="sign-btn flex-center"
            :class="{ 'disabled': conf.selectSignBtn() }"
            @click="conf.clickPointsSign"
            v-if="conf.calendar.length"
          >
            {{ $t('point.signIn') }}
          </div>
        </div>
        <!-- 任务列表 -->
        <task-list
          :taskList="conf.taskList"
          :defalutWallet="conf.defalutWallet"
          v-if="conf.defalutWallet && conf.taskList.length"
        ></task-list>
        <loading v-if="!conf.taskList.length && (conf.taskLoading || !conf.defalutWallet)"></loading>
        <div class="no-task" v-if="!conf.taskLoading && !conf.taskList.length">
          <img class="no-task-img" mode="widthFix" src="/static/img/task/not-data.png" />
          <div class="no-txt">{{ $t('point.noTasks') }}</div>
        </div>
      </div>
    </div>
    <sign-pop ref="signPopRefs"></sign-pop>
  </x-page>
</template>

<script setup lang="ts">
import taskList from './components/taskList.vue'
import loading from './components/loading.vue'
import signRemind from './components/signRemind.vue'
import signPop from './components/signPop.vue'
import { ref } from 'vue'
import { index } from './tasks'
import { Scope } from 'tools-vue3'
import { EPage } from '@/enum/Enum'

const signPopRefs = ref<any>()
const conf = index({ signPopRefs })
const event = Scope.Event()
event.on(EPage.scroll, (e) => {
  if (e.top > 60) {
    conf.bgcolor = 'linear-gradient(180deg, #EB602D 0%, #FFA64F 160%)'
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
  height: 480rem;
  position: relative;
  width: 100%;
  background-size: 100% 100%;
  background-image: url('/static/img/task/task-bg.png');
}

.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.items-center {
  display: flex;
  align-items: center;
}

.points {
  margin-top: 40rem;
  font-size: 25rem;

  .left-total {
    color: #000;
    font-size: 25rem;
    display: flex;
    align-items: center;

    span {
      color: #ff7502;
      font-size: 32rem;
      margin-right: 10rem;
    }

    img {
      width: 10rem;
      height: 18rem;
      margin-left: 10rem;
    }
  }

  .ponints-mall {
    padding: 12rem 20rem;
    border-radius: 40rem;
    background: linear-gradient(328.56deg, #fc9b01 18.81%, #ff7502 77.66%);
    color: #fff;
    font-size: 25rem;

    .points-mall-img {
      width: 40rem;
      height: 36rem;
      margin-right: 12rem;
    }
  }
}

.sign-time {
  padding: 20rem 20rem 40rem;
  border-radius: 12rem;
  margin-top: 40rem;
  background: linear-gradient(179.55deg, #ffffff 86.08%, #fe9f61 218.09%);

  .title-left {
    display: flex;
    align-items: center;
    font-size: 26rem;

    span {
      color: #ff7502;
      margin: 0 8rem;
    }

    .tips {
      width: 20rem;
      height: 20rem;
      margin-left: 10rem;
      margin-top: 2rem;
    }
  }

  .title-right {
    color: #c0c0c0;
    font-size: 26rem;
    margin-right: -6rem;
  }

  .line {
    height: 1rem;
    background: #eee;
    margin: 10rem 0rem;
  }

  .select-time {
    margin: 20rem 6rem 10rem;
    color: #333;
    font-weight: 600;
    font-size: 30rem;

    .select-arrow {
      width: 36rem;
      height: 36rem;
    }

    .arrow-right {
      transform: rotate(180deg);
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
      background: #f8f8f9;
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
        background: #ababab;
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
          color: #d76f03;
        }
      }

      .dat-num {
        color: #999;
        font-size: 22rem;
        text-align: center;
        margin: 10rem 0 8rem;
      }
    }

    .time-active {
      background: #fff3eb;
      border: 2rem solid #fc9b01;

      .day-today {
        background: linear-gradient(180deg, #fc9b01 0%, #ff7502 100%);
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
    background: linear-gradient(360deg, rgba(255, 255, 255, 0.7) 71.01%, rgba(255, 255, 255, 0) 113.77%);

    .more-img {
      width: 10rem;
      height: 18rem;
      transform: rotate(90deg);
    }
  }

  .mask-more-up {
    background: linear-gradient(360deg, rgba(255, 255, 255, 0.6) 71.01%, rgba(255, 255, 255, 0) 113.77%);

    .more-img {
      transform: rotate(-90deg);
    }
  }

  .sign-btn {
    background: linear-gradient(180deg, #eb602d 0%, #ffa64f 100%);
    box-shadow: 8rem 8rem 16rem 0rem #ff8d444d;
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

.no-task {
  text-align: center;
  margin-top: 60rem;

  .no-task-img {
    height: 180rem;
  }

  .no-txt {
    font-size: 26rem;
    color: #707070;
  }
}
</style>
