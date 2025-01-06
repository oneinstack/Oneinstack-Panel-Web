<script setup lang="ts">
import { onMounted, reactive } from 'vue'
import { useRoute } from 'vue-router'
import System from '@/utils/System'
import { apis } from '@/api'
import i18n from '@/lang'

const conf = reactive({
  tabsData: [] as any[],
  wheelRecordId: '',
  coinSymbol: '',
  currentIndex: 0,

  async handleTabChange({ value }: { value: number }) {
    System.loading()
    conf.currentIndex = value
    switch (value) {
      case 0:
        {
          const { data } = await apis.clickWheelRecords({ id: conf.wheelRecordId })
          conf.tabsData = data
            .sort((a: any, b: any) => b.clickTime - a.clickTime)
            .map((item: any) => ({
              title: i18n.t('luckyWheel.winCash'),
              subTitle: new Date(item.clickTime).Format('yyyy-MM-dd hh:mm'),
              value: `<span class="${conf.coinSymbol.length > 3 ? 'unit' : ''}">${conf.coinSymbol}</span>${parseFloat(item.reward)}`
            }))
          System.loading(false)
        }
        break
      case 1:
        const { data } = await apis.subUserlist({ id: conf.wheelRecordId })
        conf.tabsData = data
          .sort((a: any, b: any) => b.time - a.time)
          .map((item: any) => ({
            title: item.userName,
            avatar: item.userImgUrl,
            subTitle: new Date(item.time).Format('YYYY-MM-DD HH:mm'),
            value: i18n.t('luckyWheel.luckyDraw')
          }))
        System.loading(false)
        break
    }
  }
})

onMounted(() => {
  const { id, coinSymbol } = useRoute().query as { id: string; coinSymbol: string }
  conf.wheelRecordId = id
  conf.coinSymbol = coinSymbol
  conf.handleTabChange({ value: 0 })
})
</script>

<template>
  <x-page headerBgColor="#ed2e1d" :fixed="false">
    <template #title>
      <span>{{ $t('luckyWheel.details') }}</span>
    </template>
    <template #top>
      <x-tabs
        v-model:active="conf.currentIndex"
        style="background: #fff"
        :list="[
          { label: $t('luckyWheel.drawRecord'), value: 0 },
          { label: $t('luckyWheel.assistanceRecord'), value: 1 }
        ]"
        :lineWidth="350"
        lineColor="#F93F09"
        @change="conf.handleTabChange"
      />
    </template>

    <div class="content">
      <div class="card">
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
    box-shadow: 4rem 4rem 12rem 0rem #0000001a;
    overflow: auto;

    .list-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 108rem;
      border-bottom: 2rem solid #f6f7fa;

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

::v-deep(.unit) {
  font-size: 20rem;
}
</style>
