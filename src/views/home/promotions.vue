<template>
  <x-page no-header tabbar>
    <div class="main" :style="{ paddingTop: `${StatusBarConfig.statusHeight}px` }">
      <div class="head">
        <div class="head-daily">
          <img class="logo-img" :src="svalue.configv1.app_logo" />
          <div class="head-rank" @click="conf.handleClickServiceImg">
            <img class="rank-img" src="/static/img/customer-service-new.png" />
          </div>
        </div>
      </div>

      <div class="content">
        <gridBlock :data="conf.gridBlock" @item-click="conf.hanldeItemClick" />

        <div class="other">
          <span class="title">{{ $t('rechargeModule.other') }}</span>
          <div class="list-img">
            <template v-for="item in conf.activityList" :key="item.id">
              <div class="img-item" @click="conf.goContent(item)">
                <img :src="item.coverUrl" />
                <div class="nav-name">{{ item.activityName }}</div>
              </div>
            </template>
          </div>
        </div>
      </div>
      <x-no-data v-if="!conf.isLoading && !conf.activityList.length" :top="40"></x-no-data>
    </div>
  </x-page>
</template>
<script setup lang="ts">
import { apis } from '@/api'
import { EPage } from '@/enum/Enum'
import i18n from '@/lang'
import sconfig from '@/sstore/sconfig'
import { svalue } from '@/sstore/svalue'
import sweb from '@/sstore/sweb'
import StatusBarConfig from '@/utils/StatusBarConfig'
import System from '@/utils/System'
import { getPlatforms } from '@ionic/vue'
import { Scope } from 'tools-vue3'
import { onMounted, reactive } from 'vue'
import gridBlock from './components/gridBlock.vue'

const conf = reactive({
  platform: [] as any[],
  logoImg: '',
  gridBlock: [] as any[],
  activityList: [] as any[],
  pageNum: 1,
  pageSize: 20,
  total: 0,
  languageId: '',
  tips: false,
  isLoading: true,
  datas: [] as any[],
  // 客服
  async handleClickServiceImg() {
    svalue.toService()
  },
  hanldeItemClick({ type, link }: any) {
    if (!sconfig.userInfo) return System.router.push('/login')
    if (type === 'luckyWheel' && sconfig.userInfo.userType === 2) return System.toast(i18n.t(`code.422`))
    if (type === 'checkIn') return conf.goSign()
    System.router.push(link)
  },
  // 获取签到数据
  goSign() {
    apis.signinRecordList({
      success: (res: any) => {
        conf.datas = res.data || []
        Cookie.set('signData', conf.datas)
        if (conf.datas.length == 0) {
          System.toast(i18n.t('signInModule.tips'))
        } else {
          System.router.push('/user/sign/sign')
        }
      }
    })
  },
  // 活动详情
  goContent(item: any) {
    if (item.activityType !== 2) return System.router.push('/user/promotion/detail?id=' + item.id)
    let str = item.pathUrl.charAt(0)
    if (str == '/') {
      System.router.push(item.pathUrl)
    } else {
      if (item.pathUrl.indexOf('http') != -1) {
        sweb.open(item.pathUrl)
      }
    }
  },
  getActivityBlock(config: any) {
    conf.gridBlock = [
      {
        img: 'static/img/promotions/checkIn.png',
        color: '#FF7A00',
        title: 'promotions.checkIn',
        desc: 'promotions.dailyRewards',
        link: 'checkin',
        type: 'checkIn'
      },
      {
        img: 'static/img/promotions/luckyBox.png',
        color: '#FF57A1',
        title: 'promotions.luckyBox',
        desc: 'promotions.luckyBoxDesc',
        link: '/user/luckybox/index',
        wait: !config['activity_treasure_box'],
        type: 'luckyBox'
      },
      {
        img: 'static/img/promotions/luckyWheel.png',
        color: '#FF5050',
        title: 'promotions.luckyWheel',
        desc: 'promotions.luckyWheelDesc',
        link: '/user/luckyWheel/index',
        wait: !config['activity_luckyWheel'],
        type: 'luckyWheel'
      }
    ]
    conf.gridBlock
      .sort((a, b) => {
        if (a && a.wait) return 1
        if (b && b.wait) return -1
        return 0
      })
      .push(null)
  },
  // 获取当前语言
  async getLanguageList() {
    let current: any = await svalue.currentLanguage()
    conf.getActivityList(current.id)
  },
  // 获取活动列表
  async getActivityList(languageId: string) {
    conf.languageId = languageId
    System.loading()
    apis.activityList({
      current: conf.pageNum,
      size: conf.pageSize,
      languageId,
      success: (res: any) => {
        if (res.data) {
          conf.activityList = [...conf.activityList, ...res.data.records]
          conf.total = res.data.total
        }
      },
      final: () => {
        System.loading(false)
        conf.isLoading = false
      }
    })
  },
  moreMessage() {
    if (conf.pageSize * conf.pageNum >= conf.total) return (conf.tips = true)
    conf.pageNum++
    conf.getActivityList(conf.languageId)
  }
})
conf.platform = getPlatforms()
const init = async () => {
  const config = await svalue.getAppConfiguration()
  conf.getActivityBlock(config)
  conf.getLanguageList()
}
onMounted(() => {
  System.loading(false)
  init()
  // System.toast('错误提示 ')
  // Timer.once(() => {
  //   System.toast('成功提示 2', 'success')
  // }, 1000)
})
const event = Scope.Event()
event.on(EPage.scrollBottom, () => {
  conf.moreMessage()
})
</script>
<style lang="less" scoped>
.container {
  background: rgba(245, 245, 247, 1);
}

.main {
  background: linear-gradient(180deg, rgba(255, 222, 191, 1) 0%, rgba(245, 245, 247, 1) 15%);
}

.head {
  padding: 16rem 30rem 0rem;

  .head-daily {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .logo-img {
      width: 60rem;
      height: 60rem;
    }

    .head-rank {
      display: flex;
      align-items: center;

      .rank-img {
        width: 44rem;
        height: 40rem;
      }
    }
  }
}

.content {
  margin: 32rem 0;
  padding: 16rem 32rem;
  width: 100%;

  .other {
    margin-top: 20rem;

    .title {
      font-size: 32rem;
      font-weight: 600;
    }
  }

  .list-img {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    // padding: 24rem 30rem 0rem;

    .img-item {
      margin-bottom: 24rem;
      background: #fff;
      border-radius: 10rem;
      width: 100%;
      padding-bottom: 20rem;

      img {
        border-radius: 16rem;
        width: 100%;
        height: 224rem;
      }

      .nav-name {
        font-weight: 600;
        color: #000000;
        font-size: 26rem;
        padding-left: 10rem;
      }
    }
  }
}
</style>
