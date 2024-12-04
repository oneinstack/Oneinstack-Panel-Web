<template>
  <x-page header-bg-color="transparent" :topfill="false" no-footer>
    <template #title>
      {{ $t('agencyCenterModule.titleName') }}
    </template>
    <div class="invite-container">
      <x-statusbar header />
      <div class="content-box">
        <div class="top-content">
          <div class="user" @click="conf.handleIntoPage('/user/personal/personal')">
            <div class="user-avatar">
              <img class="avatar-img" :src="conf.userInfo?.userImgUrl" v-if="conf.userInfo?.userImgUrl" />
              <img class="avatar-img" src="/static/img/header.webp" v-else />
            </div>
            <div class="user-info">
              <div class="name">
                {{ conf.userInfo?.userName || '--' }}
              </div>
            </div>
          </div>
          <div class="info-box">
            <div class="data-view">
              <searchBlock
                v-model:value="conf.isOpenSearch"
                @change="conf.handleSelect"
                @search="conf.getData"
                @reset="conf.getData"
                @close="conf.getData"
              >
                <contentBlock
                  :isExpand="conf.isExpand"
                  :data="conf.contentData"
                  :time="conf.modifiedTime"
                  @expand="conf.isExpand = true"
                  @click-link="conf.hanldeClickLink"
                />
              </searchBlock>
            </div>

            <div class="select-block">
              <div class="select-item" @click="conf.handleCopyCode">
                <img class="img" src="/static/img/invite.png" mode="" />
                <div class="text">
                  <span>{{ $t('invite.CopyInvitationCode') }}: {{ conf.userInfo?.userInvitationCode || '' }}</span>
                  <img class="copy-img" src="/static/img/copyImg.png" />
                </div>
              </div>
              <div class="select-item" @click="conf.handleIntoPage('/user/me/agencyCenter')">
                <img class="img" src="/static/img/me-active-new.png" mode="" />
                <span>{{ $t('invite.SubordinateUser') }}</span>
              </div>
              <div class="select-item" @click="conf.handleIntoPage('/user/me/myCommission')">
                <img class="img" src="/static/img/commission-new.png" mode="" />
                <span>{{ $t('me.Commission') }}</span>
              </div>
            </div>

            <div class="btn-view">
              <div @click="conf.handleIntoPage('/user/invite/toImg')">{{ $t('tabble.invite') }}</div>
            </div>
            <div style="height: 30rem"></div>
          </div>
        </div>
      </div>
    </div>
  </x-page>
</template>
<script lang="ts" setup>
import { apis } from '@/api'
import i18n from '@/lang'
import { sconfig } from '@/sstore/sconfig'
import sutil from '@/sstore/sutil'
import System from '@/utils/System'
import { onMounted, reactive } from 'vue'
import contentBlock from './components/content-block.vue'
import searchBlock from './components/search-block.vue'

const conf = reactive({
  userInfo: null as any,
  contentData: [] as any[],
  dataList: {
    downLineUserCount: {
      label: i18n.t('invite.TotalDownline'),
      value: '0',
      link: true,
      type: 0
    },
    registerUserCount: {
      label: i18n.t('invite.TotalRegistration'),
      value: '0',
      link: true,
      type: 1
    },
    firstRechargeUserCount: {
      label: i18n.t('invite.FirstDeposit'),
      value: '0',
      link: true,
      type: 3
    },
    rechargeUserCount: {
      label: i18n.t('invite.DepositMember'),
      value: '0',
      link: true,
      type: 2
    },
    withdrawsUserCount: {
      label: i18n.t('invite.WithdrawalMember'),
      value: '0',
      link: true,
      type: 4
    },
    betUserCount: {
      label: i18n.t('invite.VaildBetsBettors'),
      value: '0',
      link: true,
      type: 5
    },
    netProfitAmount: {
      label: i18n.t('invite.NetTotal'),
      value: '0'
    },
    rebatesAmount: {
      label: i18n.t('invite.TotalPromotion'),
      value: '0'
    },
    firstRechargeAmount: {
      label: i18n.t('invite.FirstDepositAmount'),
      value: '0'
    },
    rechargeAmount: {
      label: i18n.t('invite.TotalDeposit'),
      value: '0'
    },
    withdrawsAmount: {
      label: i18n.t('invite.TotalWithdrawal'),
      value: '0'
    },
    betAmount: {
      label: i18n.t('invite.ValidBetTotal'),
      value: '0'
    }
  } as any,
  coinSymbol: '',
  searchParams: {
    time1: null,
    time2: null,
    levels: null
  },
  startDateArr: [] as any[],
  endDateArr: [] as any[],
  isOpenSearch: false,
  isExpand: true,
  modifiedTime: '',

  async handleSelect({ interval, levels }: any) {
    conf.searchParams.time1 = interval.value ? interval.value[0] : null
    conf.searchParams.time2 = interval.value ? interval.value[1] : null
    conf.searchParams.levels = levels.length ? levels.map((item: any) => item.value).join() : null
  },

  getData: () => {
    FunUtil.throttle(conf.getDataFun)
  },

  getDataFun: async () => {
    const res = await apis.getSubUserDataStatistics({
      ...conf.searchParams
    })

    conf.modifiedTime = new Date().Format()
    for (let key in conf.dataList) {
      conf.dataList[key].value = typeof res.data[key] === 'string' ? sutil.dataHandling(res.data[key]) : res.data[key]
    }

    conf.contentData = []
    for (let key in conf.dataList) {
      conf.contentData.push(conf.dataList[key])
    }
  },

  //复制邀请码
  handleCopyCode() {
    let promoteCode = conf.userInfo.userInvitationCode //拿到想要复制的值
    StrUtil.copyText(location.origin + '/#/register?code=' + promoteCode)
    System.toast(i18n.t('invite.CopySuccessful'), 'success')
  },

  //页面跳转
  handleIntoPage(url: string) {
    System.router.push(url)
  },

  hanldeClickLink({ label, type }: any) {
    System.router.push(`/user/invite/detail?type=${type}&title=${label}&params=${JSON.stringify(conf.searchParams)}`)
  }
})

const init = async () => {
  conf.userInfo = sconfig.userInfo
  conf.userInfo.userInvitationCode = conf.userInfo.userInvitationCode.toUpperCase()
  conf.coinSymbol = Cookie.get('defaultCoin')?.coinSymbol || ''
  conf.getData()
}

onMounted(() => {
  init()
})
</script>

<style lang="less" scoped>
.invite-container {
  height: max-content;
  background: linear-gradient(to bottom, #eb602d 0%, #ffa64f 50%, #f6f7fa 100%);
}

.content-box {
  height: max-content;
  width: 100%;

  .top-content {
    // position: absolute;
    width: 100%;
    height: 596rem;

    .user {
      display: flex;
      align-items: center;
      margin-left: 30rem;
      padding-top: 34rem;

      .user-avatar {
        width: 104rem;
        height: 104rem;
        background: #fff;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;

        .avatar-img {
          width: 104rem;
          height: 104rem;
          border-radius: 50%;
        }
      }

      .user-info {
        padding-left: 15rem;
        color: #fff;
        display: flex;
        flex-direction: column;

        .name {
          font-size: 32rem;
          font-weight: 600;
          line-height: 44.8rem;
        }

        .uid {
          font-size: 28rem;
          font-weight: 500;
          margin-top: 10rem;
        }
      }
    }

    .data-view {
      margin: 30rem;
      padding: 10rem;
      background: #fff;
      border-radius: 20rem;
      width: calc(100% - 60rem);
    }
  }
  .btn-view {
    margin-top: 30rem;
    width: calc(100% - 60rem);
    background: linear-gradient(180deg, #eb602d 0%, #ffa64f 160%);
    border-radius: 82rem;
    text-align: center;
    color: #fff;
    font-weight: 500;
    font-size: 40rem;
    height: 100rem;
    line-height: 100rem;
    margin-left: 30rem;
  }

  .select-block {
    margin: 30rem;
    height: 188rem;
    border-radius: 20rem;
    display: flex;
    justify-content: space-around;
    align-items: center;
    background-color: #fff;

    .select-item {
      display: flex;
      flex-flow: column nowrap;
      justify-content: space-between;
      align-items: center;

      .text {
        display: flex;
        align-items: center;
      }

      .img {
        margin-bottom: 10rem;
        width: 64rem;
        height: 64rem;
      }

      span {
        color: #666;
        font-family: PingFang SC;
        font-size: 22rem;
        font-weight: 500;
      }

      .copy-img {
        margin-left: 4rem;
        width: 20rem;
        height: 20rem;
        display: inline;
      }
    }
  }
}
</style>
