<template>
  <x-page :headerBgColor="'transparent'" backColor="#fff" :bgcolor="'#fff'" :topfill="false">
    <div class="redpack-list">
    <div class="redpack-list-top"></div>
    <div class="redpack-list-line"></div>
    <div v-if="conf.show">
      <x-statusbar header />
      <div class="content-desc column items-center fit-width">
        <div class="row flex-center" style="gap: 15rem">
          <img :src="sutil.getAvatarUrl(conf.item.data.senderFaceUrl)" />
          <div style="font-size: 34rem; font-weight: bold">
            {{ conf.item.data.senderNickname }} {{ $t('chatRoom.rpkt_info') }}
          </div>
        </div>
        <div class="data-text">
          {{ conf.item.data.data }}
        </div>
        <div class="row self-money items-end" v-if="conf.selfItem">
          <div>{{ conf.selfItem.money.toFixed(2) }}</div>
          <div>{{ conf.selfItem.coinSymbol }}</div>
        </div>
        <div class="row self-money-desc" v-if="conf.selfItem">{{ $t('chatRoom.credited_to_bal') }}</div>
        <div class="fit-width" style="border-bottom: 1rem solid #b2b2b2" v-if="conf.self.show">
          <div class="self-send-info row items-center fit-width">
            <div>
              {{ $t('chatRoom.received') }} {{ conf.self.getNum }}/{{ conf.self.totalNum }} {{ $t('chatRoom.pieces') }}，{{
                $t('chatRoom.total')
              }}
              {{ conf.self.getMoney.toFixed(2) }}/{{
                conf.item.data.type === 2 ? (conf.self.totalMoney * conf.self.totalNum).toFixed(2) : conf.self.totalMoney.toFixed(2)
              }}
            </div>
          </div>
        </div>
        <div class="redpack-user-list">
          <div class="fit-width">
            <div class="redpack-user-item row" v-for="v in conf.item.list">
              <img :src="sutil.getAvatarUrl(v.memberHeadIcon)" />
              <div class="column col" style="margin-left: 20rem; padding-top: 8rem">
                <div class="row justify-between" style="">
                  <div>{{ v.memberNickName }}</div>
                  <div>{{ v.money.toFixed(2) }} {{ v.coinSymbol }}</div>
                </div>
                <div class="item-data-time">{{ v.drawTime }}</div>
                <div class="item-data-line"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  </x-page>
</template>

<script setup lang="ts">
import { apis } from '@/api';
import { EPage } from '@/enum/Enum';
import sutil from '@/sstore/sutil';
import { Scope } from 'tools-vue3';
import { onMounted, reactive } from 'vue';

import { sim } from '@/sstore/sim'
import { DialogName, simdl } from '@/sstore/simdl'

const conf = reactive({
  item: {} as any,
  show: false,
  selfItem: null as any, //自己领取的红包信息

  self: {
    show: false, //是否是自己发的红包
    getNum: 0,
    totalNum: 0,
    getMoney: 0,
    totalMoney: 0
  },
  search: {
    page: 1,
    limit: 15,
    total: 0
  },
  async scrolltolower() {
    const totalPage = conf.item.listRes.totalPage
    if (conf.search.page + 1 > totalPage) return
    conf.search.page++
    const res = await apis.wrprQueryPage({
      packetId: conf.item.data.id,
      page: conf.search.page,
      limit: conf.search.limit
    })
    conf.item.list = conf.item.list.concat(res.data.list.filter((v:any) => v.drawTime))
    conf.item.listRes.totalPage = res.data.totalPage
  }
})
const event = Scope.Event()
event.on(EPage.scrollBottom, () => {
  conf.scrolltolower()
})
onMounted(() => {
  conf.item = simdl.data[DialogName.RedPackDetail] || {}
  console.log(conf.item);
  console.log('668');
  conf.show = true
  const selfInfo = sim.getSelfInfo()
  conf.self.show = selfInfo.userID == conf.item.data.sendUserId
  conf.self.totalNum = Number(conf.item.data.number)
  conf.self.totalMoney = Number(conf.item.data.money)
  conf.self.getNum = conf.item.list.length
  conf.item.list.forEach((v:any) => {
    conf.self.getMoney += v.money
  })
  conf.selfItem = conf.item.list.find((v:any) => v.memberId === selfInfo.userID)

  //领取完毕设置状态
  if (conf.self.totalNum === conf.self.getNum && !conf.selfItem) {
    sim.setRedPacketStatus(conf.item.data.id, 20)
  }
})
</script>

<style lang="less" scoped>
.redpack-list {
  color: #1a1a1a;

  &-top {
    position: fixed;
    left: 0;
    right: 0;
    top: 0;
    z-index: 10;
    height: 88rem;
    width: 100%;

    &::after {
      content: '';
      position: absolute;
      top: calc(-1000rem + 136rem);
      left: -50%;
      height: 1000rem;
      width: 200%;
      background-color: #f45645;
      box-shadow: 0rem 4rem 4rem 0rem #df9b52;
      border-radius: 50%;
      pointer-events: none;
    }
  }

  &-line {
    height: 64rem;
    box-shadow: 0rem 10rem 18rem 6rem #ffffff;
    background-color: #fff;
    z-index: 9;
  }

  .content-desc {
    z-index: 1;
    color: #1a1a1a;

    img {
      width: 54rem;
      height: 54rem;
      border-radius: 10rem;
    }
  }

  .data-text {
    font-size: 25rem;
    color: #b4b4b4;
    letter-spacing: 1px;
    margin-top: 12rem;
    margin: 0 48rem;
    text-align: center;
  }

  .self-money {
    margin-top: 70rem;
    color: #cfac74;

    &> :nth-of-type(1) {
      font-size: 100rem;
      font-weight: bold;
      line-height: 90rem;
    }

    &> :nth-of-type(2) {
      margin-left: 15rem;
      font-size: 30rem;
      line-height: 45rem;
    }

    &-desc {
      margin-top: 20rem;
      color: #cfac74;
      font-size: 26rem;
    }
  }

  .self-send-info {
    font-size: 22rem;
    color: #b2b2b2;
    margin: 80rem 0rem 20rem 20rem;
  }

  .redpack-user {
    &-list {
      width: 100vw;
    }

    &-item {
      color: #1a1a1a;
      font-size: 30rem;
      margin: 20rem 20rem 0rem 20rem;

      image {
        width: 92rem;
        height: 92rem;
        border-radius: 10rem;
      }

      .item-data-time {
        font-size: 28rem;
        color: #dedede;
        margin-top: 14rem;
      }

      .item-data-line {
        width: 100%;
        height: 2rem;
        background: #fbfbfb;
        margin-top: 24rem;
      }
    }
  }
}
</style>
