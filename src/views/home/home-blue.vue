<template>
  <x-page no-header tabbar>
    <div>
      <!-- 轮播图 -->
      <div class="banner" v-if="conf.swiperList.length > 0">
        <van-swipe class="banner-list" indicator-dots :autoplay="3000" indicator-color="#ffffff">
          <van-swipe-item class="banner-item" v-for="(item, index) in conf.swiperList" :key="index">
            <x-img zIndex="2" class="banner-img" :src="item.coverUrl" />
          </van-swipe-item>
        </van-swipe>
      </div>

      <div class="content-card">
        <!-- 奖池 -->
        <PrizePool />
        <!-- 分类 -->
        <CategoryBlock
          :data="conf.dataList"
          :category-list="Data"
          style="margin: 40rem 0 20rem"
          :show-more="conf.showMore"
          @click-more="conf.handleClickMore"
          @change="conf.handleChangeCategory"
        >
          <template #list="{ row }">
            <div v-for="item in row.data" :key="item.id">
              <div v-if="conf.currentCategoryId === 'lottery'">
                <lotteryItem style="height: 350rem" :item="item" @clickItem="conf.handleIntoLocalGame(item, 0)" />
              </div>
              <div
                v-else-if="conf.currentCategoryId === 'scratch'"
                :class="row.className"
                @click="conf.goPage('/user/scratch/purchase?id=' + item.id, 2)"
              >
                <scratchImg :item="item" />
              </div>
              <div v-else :class="row.className" @click="conf.handleClickGameTip(item)">
                <x-load-img :src="item.imgUrl" />
              </div>
            </div>
            <div v-if="!row.data.length" class="not-data">{{ $t('user.noMore') }}</div>
          </template>
        </CategoryBlock>
        <!-- 任务 -->
        <TaskBlock @click="conf.goPage('/user/tasks/tasks', 2)" />
      </div>

      <!-- 排行榜-->
      <WinList v-if="conf.virtualData" style="margin: 64rem 0" />

      <!-- 前五排行榜-->
      <TopWinList v-if="conf.virtualData" />

      <!-- 右浮动 -->
      <rightFloat />

      <!-- 绑定安全信息弹框 -->
      <DBindInfo />

      <!-- 系统公告弹窗 -->
      <DNotice v-if="conf.showDNotice" />

      <!-- 通知弹窗 -->
      <DNotify />

      <!-- 进入游戏提示弹框 -->
      <DGameTip ref="DGameTipRef" />
    </div>
  </x-page>
</template>
<script setup lang="ts">
import { apis } from '@/api'
import { sconfig } from '@/sstore/sconfig'
import sutil from '@/sstore/sutil'
import { svalue } from '@/sstore/svalue'
import System from '@/utils/System'
import { Scope } from 'tools-vue3'
import { onMounted, reactive, ref } from 'vue'
import DBindInfo from './theme/blue/home-com/DBindInfo.vue'
import DGameTip from './theme/blue/home-com/DGameTip.vue'
import DNotice from './theme/blue/home-com/DNotice.vue'
import DNotify from './theme/blue/home-com/DNotify.vue'
import lotteryItem from './home-com/lotteryItem.vue'
import rightFloat from './home-com/right-float.vue'
import scratchImg from './home-com/scratch-img.vue'
import TopWinList from './theme/blue/home-com/topWinList.vue'
import WinList from './theme/blue/home-com/winList.vue'
import PrizePool from './theme/blue/home-com/prize-pool.vue'
import CategoryBlock from './theme/blue/home-com/category-block.vue'
import TaskBlock from './theme/blue/home-com/task-block.vue'
import type { DataItem, CategoryItem } from './theme/blue/home-com/category-block.vue'
import i18n from '@/lang'

type LocalGameType = 'lottery' | 'scratch' | 'slots' | 'casino' | 'fish' | 'chess'

const timer = Scope.Timer()
const DGameTipRef = ref<any>(null)
const Data: CategoryItem[] = [
  {
    id: 'lottery',
    name: i18n.t('home.LOTTERY'),
    icon: 'home-lottery'
  },
  {
    id: 'scratch',
    name: i18n.t('home.scratch'),
    icon: 'home-scratch'
  },
  {
    id: 'slots',
    name: i18n.t('home.games'),
    icon: 'home-slots'
  },
  {
    id: 'casino',
    name: i18n.t('home.casino'),
    icon: 'home-casino'
  },
  {
    id: 'fish',
    name: i18n.t('home.fish'),
    icon: 'home-fish'
  },
  {
    id: 'chess',
    name: i18n.t('home.chess'),
    icon: 'home-chess'
  }
]
const conf = reactive({
  showDNotice: false,
  logoImg: '',
  appName: '',
  downloadUrl: '',
  language: '',
  localGameArr: [] as DataItem[],
  scratchList: [] as DataItem[],
  thirdGamesList: {} as { [key: string]: DataItem[] },
  redpacketList: [] as any[],
  swiperList: [] as any[],
  dataList: [] as DataItem[],
  currentCategoryId: 'lottery' as LocalGameType,
  showMore: false,

  //红包雨img => click => 获取红包雨列表
  handleClickRedEnvelopeImg() {},

  //进入本地游戏
  handleIntoLocalGame(obj: any, index: any) {
    const urlName = obj.lotteryTypeVO.lotteryTypeName
    System.router.push('/game/' + urlName + '/' + urlName)
  },

  // 客服
  async handleClickServiceImg() {
    svalue.toService()
  },
  //获取三方游戏列表
  async getThirdGameList(typeCode: string) {
    if (conf.thirdGamesList[typeCode]) return (conf.dataList = conf.thirdGamesList[typeCode])
    const res = await apis.getThirdGameList({
      deviceType: 1, //邮箱验证码
      typeCode
    })
    conf.showMore = res.data.length > 6
    conf.thirdGamesList[typeCode] = (res.data.slice(0, 6) as any[]).map<DataItem>((item: any) => ({
      id: item.gameCode,
      imgUrl: item.imgUrl,
      ...item
    }))
    conf.dataList = conf.thirdGamesList[typeCode]
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
  },

  goPage(url: any, type: any) {
    if (type === 2) {
      if (!sconfig.userInfo) {
        System.router.push('/login')
        return
      }
    }
    System.router.push(url)
  },
  // lottery列表
  async getLotteryList() {
    if (conf.localGameArr.length) return (conf.dataList = conf.localGameArr)
    const res = await apis.lotteryList()
    conf.localGameArr = (res.data as any[]).map<DataItem>((item: any) => ({
      id: item.lotteryTypeVO.lotteryTypeId,
      imgUrl: item.lotteryTypeVO.imgUrl,
      ...item
    }))
    conf.dataList = conf.localGameArr
  },
  // 刮刮乐列表
  async getScratchTicketlList() {
    if (conf.scratchList.length) return (conf.dataList = conf.scratchList)
    await svalue.getCoinlist()
    const res = await apis.scratchTicketlList()
    conf.scratchList = (res.data as any[]).map<DataItem>((item: any) => ({
      id: item.id,
      imgUrl: item.scratchTicketImgurl,
      ...item
    }))
    conf.dataList = conf.scratchList
  },

  // 获取轮播图
  async getActivityList(languageId: any) {
    const res = await apis.announcementList({
      current: 1,
      size: 100,
      languageId
    })
    conf.swiperList = res.data.records
    if (conf.swiperList?.length) {
      conf.showDNotice = true
    }
  },
  // 获取当前语言id
  async getLanguageList() {
    let current = await svalue.currentLanguage()
    conf.getActivityList(current.id)
  },
  virtualData: null,
  /** 获取虚拟数据 */
  async loadVirtualData() {
    const res = await apis.getStatistics({
      dataType: '0,10'
    })
    let _coinSymbol = '₹'
    let _coinTousdt = 1
    res.data['10']?.forEach((item: any) => {
      let moneyNum = sutil.division(sutil.Mul(item.amount, _coinTousdt), 1, false)
      item.betPrizeMoney = sutil.dataHandling(moneyNum)
      item.coinSymbol = _coinSymbol
    })
    res.data['0'].sort((a: any, b: any) => parseFloat(b.amount) - parseFloat(a.amount))
    res.data['0']?.forEach((item: any) => {
      let moneyResult = sutil.division(sutil.Mul(item.amount, _coinTousdt), 1, false)
      item.betPrizeMoney = sutil.dataHandling(moneyResult)
      item.coinSymbol = _coinSymbol
    })
    conf.virtualData = res.data
  },
  dialog: {
    count: 3,
    countList: [] as { fun: any; level: number; isRun: boolean; next: any; id: string }[],
    insert: (item: any) => {
      item.id = StrUtil.getId()

      conf.dialog.countList.push(item)

      if (conf.dialog.countList.length == conf.dialog.count) {
        conf.dialog.run()
      }
    },
    run: () => {
      conf.dialog.countList = conf.dialog.countList.filter((v) => v.isRun)
      conf.dialog.countList.sort((a: any, b: any) => a.level - b.level)
      for (let i = 0; i < conf.dialog.countList.length; i++) {
        conf.dialog.countList[i].next = conf.dialog.countList[i + 1]
      }
      conf.dialog.countList[0].fun()
      conf.dialog.countList = []
    },
    runNext: (item: any) => {
      item.next?.fun()
    }
  },

  moreUrl: '',
  async handleChangeCategory(id: string | number) {
    conf.currentCategoryId = id as LocalGameType
    switch (id as LocalGameType) {
      case 'lottery':
        conf.getLotteryList()
        conf.showMore = false
        break
      case 'scratch':
        conf.getScratchTicketlList()
        conf.showMore = true
        break
      case 'slots':
        conf.getThirdGameList('Games')
        conf.moreUrl = '/user/casino/index?type=Games'
        break
      case 'casino':
        conf.getThirdGameList('Live')
        conf.moreUrl = '/user/casino/index?type=Live'
        break
      case 'fish':
        conf.getThirdGameList('Fishing')
        conf.moreUrl = '/user/casino/index?type=Fishing'
        break
      case 'chess':
        conf.getThirdGameList('Chess')
        conf.moreUrl = '/user/casino/index?type=Chess'
        break
    }
  },

  handleClickMore() {
    if (conf.moreUrl) conf.goPage(conf.moreUrl, 1)
    else conf.goPage('/user/scratch/scratch', 2)
  }
})

Scope.setConf(conf)
onMounted(() => {
  const run = async () => {
    conf.getLanguageList()
    conf.loadVirtualData()
    conf.getLotteryList()
  }
  run()
})
</script>
<style lang="less" scoped>
.banner {
  width: 100%;
  height: 432rem;

  &-list {
    width: 100%;
    height: 100%;
  }

  :deep(.van-swipe__indicators) {
    bottom: 64rem !important;
    .van-swipe__indicator {
      width: 8rem;
      height: 8rem;
      border-radius: 50%;
      &.van-swipe__indicator--active {
        width: 20rem;
        border-radius: 4rem;
      }
    }
  }

  :deep(img) {
    width: 100%;
    height: 100%;
    aspect-ratio: 381/224;
  }
}

.content-card {
  padding: 44rem 32rem;
  width: 100%;
  height: 1234rem;
  background: linear-gradient(180deg, #c6e1ff 0%, #ffffff 48rem, #ffffff 100%);
  border-radius: 32rem 32rem 0 0;
  position: relative;
  top: -48rem;
}

.not-data {
  grid-column: 1 / 4;
  text-align: center;
  font-size: 24rem;
  color: #707070;
}
</style>
