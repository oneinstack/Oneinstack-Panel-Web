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
                <img class="img" src="/static/theme/blue/invite.png" mode="" />
                <div class="text">
                  <span>{{ $t('invite.CopyInvitationCode') }}: {{ conf.userInfo?.userInvitationCode || '' }}</span>
                  <img class="copy-img" src="/static/img/copyImg.png" />
                </div>
              </div>
              <div class="select-item" @click="conf.handleIntoPage('/user/me/agencyCenter')">
                <img class="img" src="/static/theme/blue/me-active-new.png" mode="" />
                <span>{{ $t('invite.SubordinateUser') }}</span>
              </div>
              <div class="select-item" @click="conf.handleIntoPage('/user/me/myCommission')">
                <img class="img" src="/static/theme/blue/commission-new.png" mode="" />
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
import contentBlock from './theme/blue/components/content-block.vue'
import searchBlock from './theme/blue/components/search-block.vue'
import { index } from './index'

const conf = index()
</script>

<style lang="less" scoped>
.invite-container {
  height: max-content;
  background: linear-gradient(#336cff 0%, #336cfffc 51%, rgba(255, 166, 79, 0) 100%);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 510rem;
    height: 510rem;
    background: url('/static/theme/blue/bg-square.webp') no-repeat center center;
    background-size: cover;
    z-index: 1;
  }
}

.content-box {
  height: max-content;
  width: 100%;
  position: relative;
  z-index: 2;

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
    background: linear-gradient(93.51deg, #006fff 5.72%, #087bff 86.61%);
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
