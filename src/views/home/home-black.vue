<template>
  <x-page no-header tabbar>
    <div>
      <x-statusbar />
      <!-- 头部 -->
      <topStatus />
      
      <!-- 搜索框 -->
      <search />

      <!-- 游戏列表导航 -->
      <gamesBox />

      <!-- 彩票 -->
      <!-- <div class="lottery" v-if="conf.localGameArr.length > 0">
        <div class="game-type-name">
          <img src="/static/img/fire.png" />
          {{ $t('home.LOTTERY') }}
        </div>
        <div class="lottery-item">
          <div class="lottery-list" v-scroll>
            <div v-for="(item, itemIndex) in conf.localGameArr" :key="itemIndex">
              <lotteryItem :item="item" @clickItem="conf.handleIntoLocalGame(item, 0)" style="margin-left: 10rem" />
            </div>
          </div>
        </div>
      </div> -->

      <!-- 刮刮乐 -->
      <!-- <div class="scratch-box">
        <div class="game-type-name2">
          <div>{{ $t('home.scratch') }}</div>
          <div class="see-all" @click="conf.goPage('/user/scratch/scratch', 2)">{{ $t('home.more') }}</div>
        </div>
        <div class="scratch-game">
          <template v-for="(item, itemIndex) in conf.scratchList">
            <div
              class="scratch-item"
              @click="conf.goPage('/user/scratch/purchase?id=' + item.id, 2)"
              v-if="itemIndex < 4"
            >
              <scratchImg :item="item"></scratchImg>
            </div>
          </template>
        </div>
      </div> -->

      <!-- 排行榜-->
      <WinList v-if="conf.virtualData" />

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
import DBindInfo from './home-com/DBindInfo.vue'
import DGameTip from './home-com/DGameTip.vue'
import DNotice from './home-com/DNotice.vue'
import DNotify from './home-com/DNotify.vue'
import gamesBox from './theme/black/home-com/gamesBox.vue'
import lotteryItem from './home-com/lotteryItem.vue'
import rightFloat from './home-com/right-float.vue'
import scratchImg from './home-com/scratch-img.vue'
import slotsGamesItem from './home-com/slotsGamesItem.vue'
import TopWinList from './home-com/topWinList.vue'
import WinList from './theme/black/home-com/winList.vue'
import greenBtn from './theme/black/components/greenBtn.vue'
import search from './theme/black/components/search.vue'
import topStatus from './theme/black/home-com/topStatus.vue'

const timer = Scope.Timer()
const DGameTipRef = ref<any>(null)
const conf = reactive({
  showDNotice: false,
  downloadUrl: '',
  language: '',
  localGameArr: [] as any[],
  slotsGamesList: [] as any[],
  redpacketList: [] as any[],
  scratchList: [] as any[],
  swiperList: [] as any[],

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

  // 获取logo 名称
  async getConfiguration() {
    let appConfig = await svalue.getAppConfiguration(true)
    Cookie.set('appConfiguration', appConfig)
    if (System.platform == 'ios') {
      conf.downloadUrl = appConfig.app_iosurl
    } else {
      conf.downloadUrl = appConfig.app_androidurl
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
    const res = await apis.lotteryList()
    conf.localGameArr = res.data
  },
  // 刮刮乐列表
  async getScratchTicketlList() {
    await svalue.getCoinlist()
    const res = await apis.scratchTicketlList()
    conf.scratchList = res.data
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
    count:3,
    countList:[] as {fun:any;level:number;isRun:boolean; next:any;id:string}[],
    insert:(item:any)=>{
      item.id = StrUtil.getId()

      conf.dialog.countList.push(item)

      if(conf.dialog.countList.length == conf.dialog.count){
        conf.dialog.run()
      }
    },
    run:()=>{
      conf.dialog.countList = conf.dialog.countList.filter(v=>v.isRun)
      conf.dialog.countList.sort((a:any,b:any)=>a.level - b.level)
      for(let i = 0;i<conf.dialog.countList.length;i++){
        conf.dialog.countList[i].next = conf.dialog.countList[i+1]
      }
      conf.dialog.countList[0].fun()
      conf.dialog.countList= []
    },
    runNext:(item:any)=>{
      item.next?.fun()
    }
  }
})

Scope.setConf(conf)

onMounted(() => {
  const run = async () => {
    conf.getConfiguration()
    conf.getLotteryList()
    conf.getScratchTicketlList()

    conf.getLanguageList()
    conf.loadVirtualData()
  }
  run()
})
</script>
<style lang="less" scoped>
.banner {
  padding: 10rem 30rem 10rem;
  overflow: hidden;
  --van-swipe-indicator-inactive-opacity: 1;
  --van-swipe-indicator-inactive-background: rgba(58, 58, 60, 0.3);
  .banner-list {
    height: 290rem;
    border-radius: 10rem;
    .banner-item {
      border-radius: 10rem;

      .banner-img {
        width: 100%;
        height: 100%;
      }
    }
  }
}

.lottery {
  margin: 20rem 30rem 0rem;

  .lottery-item {
    margin-top: 15rem;
    height: auto !important;
    width: 100%;

    .lottery-list {
      width: 100%;
      overflow: auto;
      display: flex;
      height: auto !important;
    }
  }
}

.task-box {
  margin: 0rem 10rem 0rem;
  padding: 8rem 20rem 0rem;
  border-radius: 20rem;
  height: auto;

  .content-view {
    position: relative;
    width: 100%;

    .task-img {
      width: 100%;
    }

    .task-txt {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      color: #fff;
      font-size: 28rem;
      font-weight: bold;
      padding-bottom: 25rem;
      padding-left: 5rem;
      .txt2 {
        font-size: 22rem;
        padding-left: 20rem;
        padding-bottom: 10rem;
      }
    }
    .mask-btn {
      position: absolute;
      right: 5%;
      top: calc(50% - 78rem);
      width: 116rem;
      height: 116rem;
      z-index: 3;
      background-size: contain;
      background-position: center;
      background-repeat: no-repeat; /* 设置自定义图片路径 */
      background-image: url('/static/img/home/mask-btn1.png');
    }
    .right-img {
      width: 52rem;
      height: 52rem;
      position: absolute;
      right: 30rem;
      top: 50%;
    }
  }
}

.game-type-name,
.game-type-name2 {
  display: flex;
  align-items: center;
  font-size: 26rem;
  color: #333;
  img {
    width: 28rem;
    height: 38rem;
    margin-right: 20rem;
    filter: brightness(120%);
    filter: contrast(120%);
    filter: drop-shadow(8rem 8rem 15rem #ff7602);
  }
}
.game-type-name2 {
  justify-content: space-between;
  margin: 10rem 0rem 15rem;
  .see-all {
    color: #999999;
    font-size: 24rem;
    font-weight: 400;
  }
}

.scratch-box {
  padding: 10rem 30rem 0rem;
  .scratch-game {
    width: 100% !important;
    height: auto;
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    .scratch-item {
      width: 48%;
      height: 210rem;
      border-radius: 16rem;
      margin-bottom: 20rem;
      overflow: hidden;
    }
  }
}

.fbg1 {
  -webkit-filter: drop-shadow(4rem 4rem 14rem #ff7802b2) !important;
  filter: drop-shadow(4rem 4rem 14rem #ff7802b2) !important;
}
</style>
