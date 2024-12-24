<script setup lang="ts">
import { apis } from '@/api'
import { EPage } from '@/enum/Enum'
import i18n from '@/lang'
import sutil from '@/sstore/sutil'
import { svalue } from '@/sstore/svalue'
import System from '@/utils/System'
import { Scope } from 'tools-vue3'
import { onMounted, reactive } from 'vue'

const event = Scope.Event()
const datenow = Date.Format(Date.now(), 'yyyy-MM-dd').split('-')
const conf = reactive({
  serviceHeiht: 300,
  detailData: [] as any,
  pageNum: 1,
  pageSize: 10,
  total: 0,
  userId: '',
  search: {
    start_date: '',
    end_date: ''
  } as any,
  isShowDate: false,
  dateType: '',
  selectDateArr: [] as any,
  startDateArr: datenow,
  endDateArr: datenow,

  //打开日期选择器
  handleOpenDate(type: any) {
    conf.isShowDate = true
    conf.dateType = type
    if (conf.dateType == 'start') {
      conf.selectDateArr = conf.startDateArr
    } else {
      conf.selectDateArr = conf.endDateArr
    }
  },

  //日期选择器 -- 取消btn
  handleCloseDate() {
    conf.isShowDate = false
  },

  // 日期清空
  handleClear(key: any) {
    conf.startDateArr = []
    conf.endDateArr = []
    conf.search[key] = ''
    conf.pageNum = 1
    conf.pageSize = 10
    conf.detailData = []
    conf.getData()
  },

  //日期选择器 -- 确认btn
  handleDateConfirm() {
    conf.isShowDate = false
    if (conf.dateType == 'start') {
      conf.startDateArr = conf.selectDateArr
    } else {
      conf.endDateArr = conf.selectDateArr
    }
    conf.pageNum = 1
    conf.pageSize = 10
    conf.detailData = []
    let num1 = null,
      num2 = null
    if (conf.dateType == 'start') {
      conf.search.start_date = conf.selectDateArr.join('-')
    } else {
      conf.search.end_date = conf.selectDateArr.join('-')
    }
    num1 = Date.parse(conf.search.start_date)
    num2 = Date.parse(conf.search.end_date)
    if (num1 > num2) {
      System.toast(i18n.t('agencyCenterModule.reselect'))
      conf.search.end_date = ''
      return
    }
    conf.search.start_date && conf.search.end_date && conf.getData()
  },

  //返回
  goBack() {
    sutil.pageBack()
  },

  //获取列表数据
  async getData() {
    System.loading()
    const { data: res } = await apis.subsetInfo({
      current: conf.pageNum,
      startTime: conf.search.start_date ? Date.parse(conf.search.start_date) : '',
      endTime: conf.search.end_date ? Date.parse(conf.search.end_date) : '',
      size: conf.pageSize,
      userId: conf.userId
    })
    conf.detailData = [...conf.detailData, ...res.records]
    conf.pageSize = res.size || 10
    conf.total = res.total || 0
    conf.detailData?.forEach((item: any) => {
      String(item.tradeStatus) == '-1' && (item.tradeStatus = 2)
      item.tradeStatusName = i18n.t(`tradeStatusList.${item.tradeStatus}`)
      item.tradeTypeName = i18n.t(`tradeType.${item.tradeType}`)
      //当地标准时间
      item.tradeTimenName = sutil.getTime(item.tradeTime)
      item.money = sutil.dataHandling(item.money)
      let obj = svalue.coinlist.find((into) => into.coinCode == item.walletCoin)
      item.coinSymbol = obj.coinSymbol
    })
    System.loading(false)
  },

  moreMessage() {
    if (conf.pageSize * conf.pageNum >= conf.total) return
    conf.pageNum++
    conf.getData()
  }
})

onMounted(async () => {
  const option = System.getRouterParams()
  await svalue.getCoinlist()
  conf.userId = option.userId || ''
  conf.getData()
  event.on(EPage.scrollBottom, conf.moreMessage)
})
</script>

<template>
  <x-page no-footer>
    <template #title>{{ $t('agencyCenterModule.FindTitle') }}</template>
    <!-- 搜索栏 -->
    <div class="search">
      <!-- left -- 开始时间 -->
      <div class="left-view">
        <div class="title">{{ $t('agencyCenterModule.StartTime') }}</div>
        <div class="cu-form-group" @click="conf.handleOpenDate('start')">
          <span style="white-space: nowrap">{{ conf.search.start_date || $t('common.PleaceSelect') }}</span>
          <img
            class="clear-img"
            src="/static/img/close.png"
            v-if="conf.search.start_date"
            @click.stop="conf.handleClear('start_date')"
          />
        </div>
      </div>
      <div class="center-view">
        <div class="line"></div>
      </div>
      <!-- right -- 结束时间 -->
      <div class="right-view">
        <div class="title">{{ $t('agencyCenterModule.EndTime') }}</div>
        <div class="cu-form-group" @click="conf.handleOpenDate('end')">
          <span style="white-space: nowrap">{{ conf.search.end_date || $t('common.PleaceSelect') }}</span>
          <img
            class="clear-img"
            src="/static/img/close.png"
            v-if="conf.search.end_date"
            @click.stop="conf.handleClear('end_date')"
          />
        </div>
      </div>
    </div>

    <div>
      <div class="winning-box">
        <div class="winning-item" v-for="(item, itemIndex) in conf.detailData" :key="itemIndex">
          <div class="item-view">
            <span class="name">{{ $t('agencyCenterModule.Type') + ' : ' }}</span>
            <span class="value">{{ item.tradeTypeName || '--' }}</span>
          </div>
          <div class="item-view">
            <span class="name">{{ $t('agencyCenterModule.Amount') + ' : ' }}</span>
            <span class="value">{{ item.coinSymbol + item.money || '--' }}</span>
          </div>
          <div class="item-view">
            <span class="name">{{ $t('agencyCenterModule.Status') + ' : ' }}</span>
            <span class="value">{{ item.tradeStatusName || '--' }}</span>
          </div>
          <div class="item-view">
            <span class="name">{{ $t('agencyCenterModule.Time') + ' : ' }}</span>
            <span class="value">{{ item.tradeTimenName || '--' }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="cu-modal bottom-modal" :class="conf.isShowDate ? 'show' : ''" @click="conf.handleCloseDate">
      <div class="cu-dialog">
        <div class="padding-xl">
          <!-- btns -->
          <div class="btn-view">
            <div class="left-btn" @click="conf.handleCloseDate">{{ $t('agencyCenterModule.cancellation') }}</div>
            <div class="right-btn" @click="conf.handleDateConfirm">{{ $t('agencyCenterModule.determine') }}</div>
          </div>
          <!-- 日期picker -->
          <van-date-picker v-model="conf.selectDateArr" :show-toolbar="false" :visible-option-num="5" />
        </div>
      </div>
    </div>
  </x-page>
</template>

<style scoped lang="less">
.search {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  font-weight: 500;
  background: linear-gradient(180deg, #eb602d 0%, #ffa64f 160%);
  padding: 50rem 30rem;

  .left-view,
  .right-view {
    padding: 0rem 30rem;
    text-align: center;
    .title {
      color: #ffffff;
      font-size: 32rem;
      margin-bottom: 20rem;
    }
    span {
      color: #a8a8a8;
    }
  }

  .center-view {
    text-align: center;
    .line {
      height: 4rem;
      width: 42rem;
      background: #fff;
      opacity: 0.5;
      margin-top: 90rem;
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
    height: auto;
    background: #fff;
    border-radius: 20rem;
    color: #000000;
    line-height: 50rem;
    font-size: 30rem;

    .item-view {
      width: 100%;
      margin-left: 50rem;
      .name {
        color: #a8a8a8;
      }
      .value {
        margin-left: 20rox;
        color: #000000;
      }
    }
  }
}

.cu-form-group {
  min-height: 72rem !important;
  height: 72rem !important;
  // line-height: 72rem  !important;
  background-color: #fffbf5 !important;
  margin-bottom: 30rem;
  border-radius: 10rem;
  width: 258rem;
}

.cu-form-group uni-picker::after {
  display: none !important;
}

.picker {
  color: #a8a8a8;
  font-size: 24rem;
  font-weight: 500;
}
.clear-img {
  width: 18rem;
  height: 18rem;
  margin-left: 12rem;
}

.cu-dialog {
  height: 556rem;
  border-radius: 40rem 40rem 0rem 0rem !important;
  background: #fff;
  max-width: 500px;
}
.padding-xl {
  padding: 0rem;
}

.top-view {
  width: 100%;
  display: flex;
  justify-content: center;
  text-align: center;
  font-size: 32rem;
  color: #000000;
  font-weight: 500;
  padding: 20rem;
  .type-item {
    width: calc(100% / 3);
  }
}

.btn-view {
  height: 98rem;
  display: flex;
  justify-content: space-around;
  align-items: center;
  font-size: 36rem;
  font-weight: 600;
  background: #fff;

  .left-btn {
    color: #a8a8a8;
  }

  .right-btn {
    background: linear-gradient(#eb602d, #ffa64f);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}
.picker-view {
  width: 100%;
  height: 458rem;
}
.item {
  line-height: 100rem;
  text-align: center;
  background: #fff !important;
  color: #000000;
  font-size: 32rem;
}

.active-item {
  background: #fffbf5 !important;
}
</style>
