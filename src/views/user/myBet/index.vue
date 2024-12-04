<template>
  <x-page :fixed="false">
    <template #title>
      {{ $t('me.Bets') }}
    </template>
    <template #top>
      <chooseTop ref="chooseRef" @confirm="conf.dialog.confirm" />
    </template>
    <x-no-data v-if="!conf.loading && conf.list.length === 0"></x-no-data>
    <div class="relative" v-if="conf.list.length">
      <div style="height: 30rem; width: 100%"></div>
      <div
        class="row fit-width justify-center order-box"
        v-for="(item, _index) in conf.list"
        @click="conf.toDetail(item)"
      >
        <div class="order-item column">
          <!-- 顶部显示 -->
          <div class="row items-center justify-between no-wrap">
            <div class="row no-wrap items-center">
              <div class="title-left relative flex flex-center no-wrap">
                <div class="title-skew" :class="[conf.options.betStatus[item.betStatus]]"></div>
                <div class="absolute">{{ $t(`game.${conf.options.betStatus[item.betStatus]}`) }}</div>
              </div>
              <div class="issue">{{ item.betExpect }}</div>
              <img
                mode="heightFix"
                src="/static/images/common_right.png"
                style="height: 36rem; transform: translateY(2rem)"
              />
            </div>
            <div class="row items-center" style="transform: translateX(10rem)">
              <betCode :item="item" />
            </div>
          </div>

          <!-- 其他信息 -->
          <template v-if="item.lotteryTypeCode != 'SATTA_KING'">
            <div class="row items-center top12">
              <img class="order-icon" src="/static/img/bet-time.png" />
              <div style="margin: 0 10rem">{{ $t('game.bettingTime') + ':' }}</div>
              <div>{{ item.betTime }}</div>
            </div>
          </template>
          <template v-else>
            <div class="row items-center top12">
              <div class="row items-center">
                <img class="order-icon" src="/static/img/bet-time.png" />
                <div style="margin: 0 10rem">{{ $t('SattaKing.BettingContent2') + ':' }}</div>
              </div>
              <div class="col" style="text-wrap: wrap; word-break: break-word">
                {{
                  typeof item.betItem.value[0] === 'object'
                    ? item.betItem.value.map((v: any) => v.value).join(',')
                    : item.betItem.value[1]
                }}
              </div>
            </div>
            <div class="row items-center top12">
              <img class="order-icon" src="/static/img/bet-time.png" />
              <div style="margin: 0 10rem">{{ $t('SattaKing.GameType') + ':' }}</div>
              <div>{{ item.lotteryItem.lotteryShowname }}</div>
            </div>
          </template>

          <div class="row items-center top12">
            <img class="order-icon" src="/static/img/bet-money.png" />
            <div style="margin: 0 10rem">
              {{ $t(item.lotteryTypeCode != 'SATTA_KING' ? 'game.betMoney' : 'game.TotalBetAmount') + ':' }}
            </div>
            <div>
              {{ item.coinSymbol + item.betMoney }}
            </div>
          </div>
          <div class="row items-center top12">
            <img class="order-icon" src="/static/img/bet-prize.png" />
            <div style="margin: 0 10rem">{{ $t('game.prizeMoney') + ':' }}</div>
            <div>
              {{ [0, 3].includes(item.betStatus) ? '--' : item.coinSymbol + item.betPrizeMoney }}
            </div>
          </div>

          <!-- 开奖内容 -->
          <div class="row items-center justify-between no-wrap top12">
            <div class="row items-center">
              <div class="flex flex-center relative">
                <img class="order-icon" src="/static/img/bet-numbers.png" />
                <div class="absolute" style="font-size: 18rem">
                  <div v-if="['5D', 'PK10'].includes(item.lotteryTypeCode)">
                    {{ item.betOpenCodeList[0] ? Number(item.betOpenCodeList[0].value) : '' }}
                  </div>
                  <div v-else>{{ item.sumVal }}</div>
                </div>
              </div>
              <div style="margin: 0 10rem">{{ $t('game.openCode') + ':' }}</div>
              <openCode :item="item" />
            </div>

            <!-- 5D多一列sum显示单独处理 -->
            <div class="row items-center" v-if="item.lotteryTypeCode === '5D' && item.sumVal !== undefined">
              <div class="flex flex-center relative">
                <img class="order-icon" src="/static/img/bet-numbers.png" />
                <div class="absolute" style="font-size: 18rem">S</div>
              </div>
              <div style="margin: 0 10rem">{{ $t('game.sum') + ':' }}</div>
              <div class="flex flex-center relative">
                <img style="width: 42rem; height: 42rem" src="/static/img/poinits.webp" />
                <div class="absolute" style="font-size: 24rem; color: rgb(44, 46, 54); font-weight: 900">
                  {{ item.sumVal }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        class="row items-center justify-center"
        style="margin-top: 20rem"
        v-if="conf.page.total && conf.page.total <= conf.list.length"
      >
        {{ $t('user.noMore') }}
      </div>
    </div>
  </x-page>
</template>

<script setup lang="ts">
import { EPage } from '@/enum/Enum'
import { slottery } from '@/sstore/slottery'
import sutil from '@/sstore/sutil'
import { svalue } from '@/sstore/svalue'
import System from '@/utils/System'
import { Scope } from 'tools-vue3'
import { onMounted, reactive, ref } from 'vue'
import { apis } from '../../../api/index'
import betCode from './betCode.vue'
import chooseTop from './chooseTop.vue'
import openCode from './openCode.vue'

const event = Scope.Event()

const chooseRef = ref()
const conf = reactive({
  list: [] as any[],
  loading: false,
  options: {
    betStatus: {
      0: 'toDrawn',
      1: 'losingLottery',
      2: 'prizeWinning',
      3: 'Cancelled'
    } as any,

    imgcolor: {
      0: 'color2',
      1: 'color-green',
      2: 'color-red',
      3: 'color-green',
      4: 'color-red',
      5: 'color1',
      6: 'color-red',
      7: 'color-green',
      8: 'color-red',
      9: 'color-green'
    } as any,

    twg: {
      0: { img: 'n0_bg', color: ['#fe565c', '#a943f7'] },
      1: { img: 'green_bg', color: '#2f9c61' },
      2: { img: 'red_bg', color: '#e93333' },
      3: { img: 'green_bg', color: '#2f9c61' },
      4: { img: 'red_bg', color: '#e93333' },
      5: { img: 'n5_bg', color: ['#4ccb86', '#a943f7'] },
      6: { img: 'red_bg', color: '#e93333' },
      7: { img: 'green_bg', color: '#2f9c61' },
      8: { img: 'red_bg', color: '#e93333' },
      9: { img: 'green_bg', color: '#2f9c61' }
    } as any
  },
  dialog: {
    lottery: {} as any,
    bettime: {} as any,
    confirm: (data: any) => {
      // 保存搜索条件
      conf.dialog.lottery = data.lottery
      conf.dialog.bettime = data.bettime
      conf.search.lotteryTypeId = data.lottery.type.key
      conf.search.lotteryId = data.lottery.item.key
      conf.search.startTime = data.bettime.item.value?.[0]
      conf.search.endTime = data.bettime.item.value?.[1]
      // 重置页码
      conf.page.pageNum = 1
      conf.list = []
      FunUtil.debounce(conf.getList)
    }
  },
  page: {
    pageNum: 1,
    pageSize: 10,
    total: 0,
    change: (e: any) => {
      // 如果当前页码大于等于总页数，则不进行请求
      if (conf.page.pageNum >= Math.ceil(conf.page.total / conf.page.pageSize)) return
      conf.page.pageNum++
      conf.getList()
    }
  },
  search: {
    lotteryTypeId: '',
    lotteryId: '',
    startTime: undefined,
    endTime: undefined
  },
  getList: async () => {
    System.loading()
    const { lotteryTypeId, lotteryId, startTime, endTime } = conf.search
    const { pageNum, pageSize } = conf.page
    let { data } = await apis.meOder({
      current: pageNum,
      size: pageSize,
      lotteryTypeId,
      lotteryId,
      startTime,
      endTime,
      final: () => {
        System.loading(false)
      }
    })

    conf.page.total = data.total
    data = data.records
    const coinList = await svalue.getCoinlist()
    for (let i = 0; i < data.length; i++) {
      const item = data[i]
      item.betTime = new Date(item.betTime).Format()
      item.betOpenTime = new Date(item.betOpenTime).Format()
      item.coinSymbol = coinList.find((v) => v.coinCode === item.betCoinCode)?.coinSymbol
      const lotteryItem = await slottery.findLotteryItem({ id: item.betLotteryId })
      const plotteryItem = lotteryItem.parent
      item.lotteryTypeCode = plotteryItem?.lotteryTypeVO.lotteryTypeCode
      item.lotteryTypeName = plotteryItem?.lotteryTypeVO.lotteryTypeName
      item.lotteryItem = lotteryItem

      //处理各彩种开奖结果
      let betOpenCodeList = item.betOpenCode.split(',')
      if (item.lotteryTypeCode == 'Trx_Win_Go') {
        betOpenCodeList = [sutil.getLastNum(betOpenCodeList[0])]
      }

      //对配置进行初始化
      const getImgConfig = (v: any, item: any) => {
        if (StrUtil.isNull(v)) return null
        let img = ''
        let color = ''
        const isNumber = Number(v) >= 0

        // 单独处理每个彩种的数字、大小单双、any等配置内容
        // 3D
        if (item.lotteryTypeCode == '3D') {
          if (isNumber) {
            img = `/static/img/share-${v}.webp`
          } else {
            img = `/static/img/${v}.webp`
          }
        }

        // COLOR
        else if (item.lotteryTypeCode == 'COLOR') {
          if (isNumber) {
            img = `/static/img/${conf.options.imgcolor[v]}.webp`
          } else {
            const obj = {
              big: '#C42D2D',
              small: '#189EE4',
              odd: '#fd0261',
              even: '#00be50',

              red: 'red',
              green: '#32C94A',
              violet: '#9154EA'
            } as any
            color = obj[v]
          }
        }

        // Trx_Win_Go
        else if (item.lotteryTypeCode == 'Trx_Win_Go') {
          if (isNumber) {
            const _item = conf.options.twg[v]
            img = `/static/img/game/twgo/${_item.img}.png`
            color = _item.color
          } else {
            const obj = {
              big: ['#00bdff', '#5bcdff'],
              small: ['#ff9000', '#ffd000'],
              odd: ['#fd0261', '#ff8a96'],
              even: ['#00be50', '#9bdf00'],

              red: ['#fd0261', '#ff8a96'],
              green: ['#00be50', '#9bdf00'],
              violet: ['#480AC5', '#B36FF8']
            } as any
            color = obj[v]
          }
        }

        // PK10
        else if (item.lotteryTypeCode == 'PK10') {
          if (isNumber) {
            v = Number(v)
            if (v < 10) v = '0' + v
            img = `/static/img/game/pk10/speed_pinball${v}.png`
          } else {
            const obj = {
              big: ['#ff9000', '#ffd000'],
              small: ['#00bdff', '#5bcdff'],
              odd: ['#fd0261', '#ff8a96'],
              even: ['#00be50', '#9bdf00']
            } as any
            color = obj[v]
          }
        }
        // 5D
        else if (item.lotteryTypeCode == '5D') {
          if (!isNumber) {
            const obj = {
              big: ['#00bdff', '#5bcdff'],
              small: ['#ff9000', '#ffd000'],
              odd: ['#fd0261', '#ff8a96'],
              even: ['#00be50', '#9bdf00']
            } as any
            color = obj[v]
          }
        }
        return {
          img,
          value: v,
          color
        }
      }
      item.betOpenCodeList = betOpenCodeList
        .map((v: any) => {
          const _v = getImgConfig(v, item)
          if (_v && Number(v) >= 0) {
            if (!item.sumVal) item.sumVal = 0
            item.sumVal += Number(_v.value) || 0
          }
          return _v
        })
        .filter((v: any) => v)

      //处理各彩种下注内容
      let betCodesList = []
      //下注多个
      if (item.betCodes.indexOf(',') != -1) {
        betCodesList = item.betCodes.split(',').map((v: any) => {
          let sp = [v, v]
          if (v.indexOf('_') != -1) {
            sp = v.split('_')
          }
          return {
            type: sp[0],
            value: sp[1]
          }
        })
      }
      //下注单个
      else if (item.betCodes.indexOf('_') != -1) {
        betCodesList = item.betCodes.split('_')
      } else {
        betCodesList = [sutil.getLastNum(item.betCodes)]
      }

      let lastVal = betCodesList[betCodesList.length - 1]
      let type = Number(lastVal) >= 0 ? 'number' : 'any'
      let isNumber = type === 'number'
      //对3d返回数据单独处理
      if (item.lotteryTypeCode == '3D') {
        isNumber = false
        const _index = [
          'any',
          'one',
          'two',
          'three',
          'four',
          'five',
          'six',
          'seven',
          'eight',
          'nine',
          'ten',
          'eleven',
          'twelve',
          'thirteen',
          'fourteen',
          'fifteen',
          'sixteen',
          'seventeen',
          'eighteen'
        ].findIndex((v) => v == lastVal)
        if (_index > -1) {
          lastVal = _index
          isNumber = true
        }
        type = betCodesList[0]
      }

      item.betItem = {
        type,
        isNumber: isNumber,
        lastVal,
        ...getImgConfig(lastVal, item),
        value: betCodesList
      }
    }

    conf.list = [...conf.list, ...data]
  },
  toDetail(item: any) {
    Cookie.set('betDetailInfo', {
      ...item,
      lotteryItem: {
        ...item.lotteryItem,
        parent: null
      }
    })
    System.router.push('/user/myBet/detail')
  }
})

onMounted(() => {
  chooseRef.value.getList()
  event.on(EPage.scrollBottom, conf.page.change)
})
</script>

<style lang="less" scoped>
.order-box {
  border-radius: 20rem;
  background: #ffffff;
  margin-bottom: 30rem;
}
.order-item {
  width: 690rem;
  margin: 32rem 0rem;
  font-size: 24rem;
}
.order-icon {
  width: 13px;
  height: 13px;
}

.top12 {
  margin-top: 24rem;
}
.title-left {
  width: 196rem;
  height: 46rem;
  color: #fff;
  font-size: 24rem;
}
.issue {
  font-size: 32rem;
  font-weight: 600;
  color: #000;
  margin-left: 20rem;
  text-wrap: nowrap;
}
.title-skew {
  background: #3c80f5;
  width: 196rem;
  height: 46rem;
  transform: skew(-30deg);

  &.prizeWinning {
    background: #e20000;
  }

  &.losingLottery {
    background: #fdab45;
  }

  &.Cancelled {
    background: #5c6381;
  }
}
</style>
