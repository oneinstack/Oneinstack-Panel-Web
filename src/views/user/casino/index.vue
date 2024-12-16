<template>
  <x-page :fixed="false" :bgcolor="'#fff'">
    <template #title>
      {{ conf.title }}
    </template>
    <template #top>
      <div class="head-type relative">
        <div class="type-list" v-scroll>
          <template v-for="(item, index) in conf.tabs.list" :key="index">
            <div
              class="type-item"
              @click="conf.tabs.change(item)"
              :class="{ 'type-active': conf.tabs.active == item.gamePlatformCode }"
            >
              <img
                mode="heightFix"
                :class="index == 0 ? 'type-img1' : 'type-img'"
                :src="`/static/img/centerWallet/${item.gamePlatformCode}.png`"
              />
              <div class="type-name">{{ item.gamePlatformCode }}</div>
            </div>
          </template>
        </div>
      </div>
    </template>
    <x-no-data v-if="!conf.loading && conf.list.length === 0" theme="no-method" />
    <div v-else class="content column" style="gap: 20rem">
      <div class="sign-box">
        <div class="time-list">
          <div
            class="time-item"
            v-for="(item, itemIndex) in conf.list"
            :key="itemIndex"
            @click="conf.handleClickGameTip(item)"
          >
            <div class="nav-img">
              <x-load-img :src="item.imgUrl"></x-load-img>
            </div>
            <div class="nav-name">
              <div class="left-name">{{ item.gameEnglishName || item.gameName }}</div>
              <div class="right-name">{{ item.platformName }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- 进入游戏提示弹框 -->
    <DGameTip ref="DGameTipRef" />
  </x-page>
</template>

<script setup lang="ts">
import { apis } from '@/api'
import { EPage } from '@/enum/Enum'
import i18n from '@/lang'
import sconfig from '@/sstore/sconfig'
import System from '@/utils/System'
import { Scope } from 'tools-vue3'
import { nextTick, onMounted, reactive, ref } from 'vue'
import DGameTip from '../../home/home-com/DGameTip.vue'

const event = Scope.Event()
const DGameTipRef = ref<any>(null)
const conf = reactive({
  title: '',
  setTitle() {
    const type = System.getRouterParams().type || 'Games'
    conf.title = (
      {
        'Games': i18n.t('casinoModule.titleName'),
        'Live': i18n.t('liveModule.titleName'),
        'Chess': i18n.t('home.chess'),
        'Fishing': i18n.t('home.fish')
      } as any
    )[type]
  },
  tabs: {
    list: [] as any[],
    active: 'All',
    change: (item: any) => {
      conf.tabs.active = item.gamePlatformCode
      conf.query.current = 1
      conf.list = []
      conf.nextPage()
    }
  },
  query: {
    current: 1,
    size: 10
  },
  initData: {} as any,
  loading: true,
  list: [] as any[],
  getData: async () => {
    System.loading()
    const res = await apis.getThirdGameList({
      deviceType: 1,
      final(status, config, xhr) {
        System.loading(false)
      }
    })
    conf.initData = {
      'All': res.data
    }
    res.data.forEach((item: any) => {
      conf.initData[item.gamePlatformCode] = conf.initData[item.gamePlatformCode] || []
      conf.initData[item.gamePlatformCode].push(item)
    })
    conf.tabs.list = Object.keys(conf.initData).map((item) => ({ gamePlatformCode: item }))
    conf.nextPage()
  },
  nextPage: async () => {
    const _list = conf.initData[conf.tabs.active]
    if (conf.query.current * conf.query.size >= _list.length) {
      return
    }
    await nextTick()
    System.loading()
    conf.loading = true
    Timer.once(() => {
      System.loading(false)
      conf.loading = false
      conf.query.current++
      conf.list = [
        ...conf.list,
        ..._list.slice((conf.query.current - 1) * conf.query.size, conf.query.current * conf.query.size)
      ]
    }, 400)
  },
  //click游戏提示
  handleClickGameTip(item: any) {
    if (!sconfig.userInfo) {
      System.router.push('/login')
      return
    }
    if (sconfig.userInfo?.userType == 2) {
      DGameTipRef.value.showVisitor()
    } else {
      DGameTipRef.value.show(item)
    }
  }
})
const init = async () => {
  conf.getData()
}
onMounted(() => {
  conf.setTitle()
  init()
  event.on(EPage.scrollBottom, conf.nextPage)
})
</script>

<style scoped lang="less">
.scroll-x {
  width: 100%;
}
.head-type {
  padding: 10rem 20rem;
  height: 132rem;
}
.type-list {
  display: flex;
  position: absolute;
  width: 710rem;
  overflow-x: auto;
  .type-item {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    margin-right: 15rem;
    background: #fff6e6;
    padding: 5rem 0rem 10rem;
    border-radius: 10rem;
    width: 120rem;
    flex-shrink: 0;
    font-size: 28rem;
    box-sizing: border-box;
    .type-img1 {
      height: 50rem;
      padding-top: 10rem;
      flex-shrink: 0;
    }
    .type-img {
      height: 60rem;
      flex-shrink: 0;
    }
    &.type-active {
      background: #ffa64f;
      color: #fff;
    }
  }
}
.sign-box {
  padding: 20rem 20rem 0rem 20rem;
  background: #ffffff;

  .time-list {
    display: flex;
    flex-wrap: wrap;
    .time-item {
      margin: 0rem 2%;
      border-radius: 10rem;
      width: 46%;
      height: 290rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20rem;
      color: #c6924d;
      box-shadow: 4rem 4rem 8rem #00000010;
      overflow: hidden;
      .nav-img {
        width: 327rem;
        height: 220rem;
        border-radius: 10rem 10rem 0rem 0rem;
      }
      .nav-name {
        width: 334rem;
        height: calc(290rem - 220rem);
        line-height: calc(290rem - 220rem);
        justify-content: space-between;
        display: flex;
        .left-name {
          font-weight: 600;
          color: #000000;
          font-size: 24rem;
          padding-left: 20rem;
        }
        .right-name {
          font-weight: 500;
          color: #00000050;
          font-size: 20rem;
          padding-right: 20rem;
        }
      }
    }
  }
}

.content {
  width: 100%;
}
</style>
