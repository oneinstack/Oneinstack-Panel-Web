<template>
  <x-page :fixed="false" no-footer>
    <template #title>
      {{
        conf.saveInfo.userName
          ? conf.saveInfo.userName + ' - ' + $t('agencyCenterModule.level') + conf.saveInfo.level
          : $t('invite.SubordinateUser')
      }}
    </template>

    <template #top>
      <div class="search" style="background: #fff; padding: 50rem 30rem">
        <!-- 关键字搜索 -->
        <div class="tabs">
          <div class="cu-form-group">
            <input
              :placeholder="$t('agencyCenterModule.keywordPlaceholder')"
              v-model="conf.search.keyword"
              @keypress.enter.native="conf.handleInputSearch()"
            />
            <button class="cu-btn bg-green shadow" @click="conf.handleInputSearch">{{ $t('chat.searchPlace') }}</button>
          </div>
        </div>

        <div class="status-view">
          <div
            class="status-item"
            v-for="(item, index) in conf.levelList"
            :key="index"
            @click="conf.handleLevelChange(item, index)"
          >
            <div :class="item.isCheck ? 'checked' : ''">
              {{ $t(`agencyCenterModule.levelList.${index}`) }}
            </div>
          </div>
        </div>
      </div>
    </template>

    <div>
      <div class="winning-box">
        <div
          class="winning-item"
          v-for="(item, itemIndex) in conf.detailData"
          :key="itemIndex"
          @click="conf.handleNextLevel(item)"
        >
          <div class="left-user">
            <template v-if="item.userImgUrl">
              <img class="avatar" :src="item.userImgUrl" @click.stop="conf.handleCilckHeadSculpture(item)" />
            </template>
            <template v-else>
              <img class="avatar" src="/static/img/header.webp" @click.stop="conf.handleCilckHeadSculpture(item)" />
            </template>
          </div>
          <div class="right-view">
            <div class="userName">{{ item.userName || '--' }}</div>
            <div class="bottom-view">
              <div>
                <span>{{ $t('agencyCenterModule.balance') + ': ' }}</span>
                <span class="value">{{ conf.defaultCoin.coinSymbol + item.walletMoney }}</span>
              </div>
              <div>
                <span>{{ $t('agencyCenterModule.CodingQuantity') + ': ' }}</span>
                <span class="value">{{ item.codes }}</span>
              </div>
            </div>
          </div>
        </div>
        <x-no-data v-if="conf.isLoading && conf.detailData.length == 0"></x-no-data>
      </div>
    </div>
  </x-page>
</template>
<script lang="ts" setup>
import { apis } from '@/api'
import { EPage } from '@/enum/Enum'
import { sconfig } from '@/sstore/sconfig'
import sutil from '@/sstore/sutil'
import { svalue } from '@/sstore/svalue'
import System from '@/utils/System'
import { Scope } from 'tools-vue3'
import { onMounted, reactive, watch } from 'vue'

const event = Scope.Event()
const conf = reactive({
  search: {
    keyword: '',
    level: ''
  },
  detailData: [] as any[],
  pageNum: 1,
  pageSize: 10,
  total: 0,
  levelList: [
    { name: 'Level1', value: '1', isCheck: true },
    { name: 'Level2', value: '2', isCheck: false },
    { name: 'Level3', value: '3', isCheck: false },
    { name: 'Level4', value: '4', isCheck: false }
  ],
  userInfo: {} as any,
  saveInfo: {} as any,
  isLoading: false,
  defaultCoin: {} as any, //接口返回默认币种钱包

  //获取列表数据
  getData: async (type?: string) => {
    System.loading()
    const res = await apis.subsetPage({
      level: conf.search.level,
      current: conf.pageNum,
      search: conf.search.keyword,
      size: conf.pageSize,
      userId: conf.saveInfo.userId || conf.userInfo.userId,
      complete: () => {
        System.loading(false)
        conf.isLoading = true
      }
    })

    let datas = res.data || {}
    datas.records?.forEach((item: any) => {
      item.walletMoney = sutil.dataHandling(item.walletMoney)
      item.codes = sutil.dataHandling(item.codes)
    })
    if (type == 'clear') {
      conf.detailData = datas.records || []
    } else {
      conf.detailData = [...conf.detailData, ...datas.records]
    }

    conf.pageSize = datas.size || 10
    conf.total = datas.total || 0
  },

  moreMessage() {
    if (conf.pageSize * conf.pageNum >= conf.total) return
    conf.pageNum++
    conf.getData()
  },

  // input关键字搜索
  handleInputSearch() {
    conf.pageNum = 1
    conf.pageSize = 10
    conf.detailData = []
    conf.getData('clear')
  },

  //level -- click事件
  handleLevelChange(obj: any, index: number) {
    conf.pageNum = 1
    conf.pageSize = 10
    conf.detailData = []
    conf.levelList?.forEach((item) => {
      item.isCheck = false
      item.value == obj.value && (item.isCheck = true)
    })
    conf.search.level = obj.value
    conf.getData('clear')
  },

  //代理人信息 == 进入下一级
  handleNextLevel(obj: any) {
    let newObj = {
      userName: obj.userName,
      userId: obj.id,
      level: Number(conf.search.level) + 1
    }
    if (conf.search.level != '4') {
      System.router.push('/user/me/agencyCenter?obj=' + JSON.stringify(newObj))
    }
  },

  //点击头像事件 == 进入详情页
  handleCilckHeadSculpture(obj: any) {
    System.router.push('/user/me/agentView?userId=' + obj.id)
  }
})

watch(
  () => System.getRouterParams(),
  (newVal) => {
    const { obj } = newVal
    conf.saveInfo = obj ? JSON.parse(obj) : {}
    conf.levelList?.forEach((item) => {
      item.isCheck = false
      if (!conf.saveInfo.level) {
        conf.levelList[0].isCheck = true
        conf.search.level = '1'
      } else if (Number(item.value) == conf.saveInfo.level) {
        item.isCheck = true
      }
    })
    conf.detailData = []
    conf.getData()
  }
)

const init = async () => {
  const { obj } = System.getRouterParams()
  if (obj) {
    conf.saveInfo = JSON.parse(obj)
    conf.levelList?.forEach((item) => {
      item.isCheck = false
      if (Number(item.value) == conf.saveInfo.level) {
        item.isCheck = true
      }
    })
  }
  conf.userInfo = sconfig.userInfo
  await svalue.getCoinlist()
  conf.defaultCoin = svalue.coinlist.find((item) => item.isDefault)

  conf.search.level = conf.levelList.find((item) => item.isCheck)?.value || ''
  conf.getData()

  event.on(EPage.scrollBottom, conf.moreMessage)
}
onMounted(() => {
  init()
})
</script>

<style lang="less" scoped>
.cu-btn {
  position: relative;
  border: 0px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: 0 15px;
  font-size: 14px;
  height: 33px;
  line-height: 1;
  text-align: center;
  text-decoration: none;
  overflow: visible;
  margin-left: 0;
  -webkit-transform: translate(0px, 0px);
  transform: translate(0px, 0px);
  margin-right: 0;

  box-shadow: 3px 3px 4px rgba(255, 166, 79, 0.2) !important;
  background: linear-gradient(180deg, #eb602d, #ffa64f 160%) !important;
  color: #fff;
  border-radius: 10rem;
}
.cu-btn.button-hover {
  -webkit-transform: translate(0.5px, 0.5px);
  transform: translate(0.5px, 0.5px);
}

.status-view {
  display: flex;
  justify-content: space-between;
  .status-item {
    height: 52rem;
    line-height: 52rem;
    width: 164rem;
    background: #f9f9f9;
    color: #000000;
    text-align: center;
    line-height: 52rem;
    font-size: 28rem;
    border-radius: 10rem;
    .checked {
      border-radius: 5px;
      background: #fff6e6;
    }
  }
}

.winning-box {
  width: 100%;
  height: 100%;
  font-weight: 500;
  padding: 15rem 10rem;
  .winning-item {
    margin-bottom: 10rem;
    padding: 30rem 20rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 182rem;
    background: #fff;
    border-radius: 20rem;
    color: #000000;
    .left-user {
      display: flex;
      align-items: center;
      .avatar {
        width: 104rem;
        height: 104rem;
        margin-right: 20rem;
        border-radius: 50%;
      }
      .userName {
        font-size: 30rem;
        color: #000000;
        width: 160rem;
        margin-left: -10rem;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
        word-break: break-all;
        font-size: 36rem;
        font-weight: 600;
      }
    }

    .center-view,
    .right-money {
      text-align: center;
      .top {
        background: linear-gradient(to bottom, #eb602d, #ffa64f);
        -webkit-background-clip: text; /* 使用-webkit-前缀兼容部分浏览器 */
        background-clip: text;
        color: transparent;
        font-size: 32rem;
        font-weight: 600;
      }
      .bottom {
        font-size: 27rem;
        color: #000000;
        font-weight: bold;
        margin-top: 15rem;
      }
    }

    .right-view {
      text-align: left;
      width: calc(100% - 104rem);
      .userName {
        color: #000000;
        width: 100%;
        margin-left: -10rem;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
        word-break: break-all;
        font-size: 36rem;
        font-weight: 600;
      }

      .bottom-view {
        margin-top: 15rem;
        display: flex;
        justify-content: space-between;
        font-size: 26rem;
        font-weight: 600;
        .value {
          background: linear-gradient(to bottom, #eb602d, #ffa64f);
          -webkit-background-clip: text; /* 使用-webkit-前缀兼容部分浏览器 */
          background-clip: text;
          color: transparent;
          font-size: 28rem;
        }
      }
    }
  }
}

.cu-form-group {
  min-height: 80rem !important;
  background-color: #eeeeee !important;
  margin-bottom: 30rem;
  border-radius: 10rem;
  width: 100%;
}

.uni-input-placeholder {
  left: 25% !important;
}

.bg-green {
  box-shadow: 3px 3px 4px rgba(255, 166, 79, 0.2) !important;
  background: linear-gradient(180deg, #eb602d 0%, #ffa64f 160%) !important;
}

.cuIcon-search {
  position: absolute;
  left: 20% !important;
}
</style>
