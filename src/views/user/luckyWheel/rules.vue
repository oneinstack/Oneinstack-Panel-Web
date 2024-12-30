<script setup lang="ts">
import { onMounted, reactive } from 'vue'
import System from '@/utils/System'
import { apis } from '@/api'
import sconfig from '@/sstore/sconfig'
import { svalue } from '@/sstore/svalue'

const conf = reactive({
  tabsData: [] as any[],
  currentIndex: 0,
  rule: {
    desc: '',
    get: async () => {
      System.loading()
      const { data: res } = await apis.luckywheelinviteList()
      conf.rule.desc = res[0].content
      System.loading(false)
    }
  },

  async handleTabChange({ value }: { value: number }) {
    conf.currentIndex = value
    if (value === 0) return (conf.tabsData = [])
    const { userImgUrl, userId } = sconfig.userInfo
    System.loading()
    const { data } = await apis.withdrawalRecord({ userId })
    System.loading(false)
    await svalue.getCoinlist()
    conf.tabsData = data
      .sort((a: any, b: any) => b.finishTime - a.finishTime)
      .map((item: any) => {
        const unit = svalue.coinlist.find((cur: any) => cur.coinCode === item.coinCode).coinSymbol
        return {
          title: item.userName,
          avatar: userImgUrl,
          subTitle: new Date(item.finishTime).Format('yyyy-MM-dd hh:mm'),
          value: `+<span class="${unit.length > 3 ? 'unit' : ''}">${unit}</span>${parseFloat(item.bonus)}`
        }
      })
  }
})

onMounted(() => {
  conf.rule.get()
})
</script>

<template>
  <x-page headerBgColor="#ed2e1d" :fixed="false">
    <template #title>
      <span>{{ $t('luckyWheel.rules') }}</span>
    </template>
    <template #top>
      <x-tabs
        v-model:active="conf.currentIndex"
        style="background: #fff"
        :list="[
          { label: $t('luckyWheel.activityRules'), value: 0 },
          { label: $t('luckyWheel.withdrawalHistory'), value: 1 }
        ]"
        :lineWidth="350"
        lineColor="#F93F09"
        @change="conf.handleTabChange"
      />
    </template>

    <div class="content">
      <div class="card">
        <template v-if="conf.currentIndex === 0">
          <view class="rule">
            <view class="title">Special note:</view>
            <div v-html="conf.rule.desc" class="desc" />
          </view>
        </template>
        <template v-else>
          <x-no-data v-if="!conf.tabsData.length"/>
          <div v-for="(item, index) in conf.tabsData" :key="index" class="list-row">
            <div class="flex items-center">
              <img v-if="item.avatar" :src="item.avatar" alt="" class="avatar" />
              <div>
                <div class="title">{{ item.title }}</div>
                <div class="subTitle">{{ item.subTitle }}</div>
              </div>
            </div>
            <div v-html="item.value" class="value" />
          </div>
        </template>
      </div>
    </div>
  </x-page>
</template>

<style scoped lang="less">
.content {
  position: relative;
  padding: 20rem 32rem;
  width: 100%;
  background-color: #f6f7fa;
  font-family: PingFang SC;

  .card {
    padding: 32rem;
    background-color: #fff;
    min-height: 1148rem;
    max-height: 1300rem;
    border-radius: 20rem;
    box-shadow: 4rem 4rem 12rem 0px #0000001a;
    overflow: auto;

    .list-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 108rem;
      border-bottom: 1px solid #f6f7fa;

      .avatar {
        width: 80rem;
        height: 80rem;
        border-radius: 50%;
        background-color: lightgray;
        margin-right: 24rem;
      }

      .title {
        font-size: 28rem;
        font-weight: 550;
        margin-bottom: 8rem;
      }

      .subTitle {
        font-size: 20rem;
        font-weight: 400;
        color: #888;
      }

      .value {
        font-size: 32rem;
        font-weight: 500;
        color: #f93f09;
      }
    }
  }
}

.rule {
  .title {
    font-size: 36rpx;
    font-weight: 600;
    margin-bottom: 20rpx;
  }

  .desc {
    font-size: 28rpx;
  }
}

::v-deep(.unit) {
  font-size: 20rpx;
}
</style>
