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
import { index } from './agencyCenter'

const conf = index()
</script>

<style lang="less" scoped>
.cu-btn {
  position: relative;
  border: 0rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: 0 30rem;
  font-size: 28rem;
  height: 66rem;
  line-height: 1;
  text-align: center;
  text-decoration: none;
  overflow: visible;
  margin-left: 0;
  -webkit-transform: translate(0rem, 0rem);
  transform: translate(0rem, 0rem);
  margin-right: 0;

  box-shadow: 6rem 6rem 8rem rgba(255, 166, 79, 0.2) !important;
  background: linear-gradient(180deg, #eb602d, #ffa64f 160%) !important;
  color: #fff;
  border-radius: 10rem;
}
.cu-btn.button-hover {
  -webkit-transform: translate(1rem, 1rem);
  transform: translate(1rem, 1rem);
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
      border-radius: 10rem;
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
  box-shadow: 6rem 6rem 8rem rgba(255, 166, 79, 0.2) !important;
  background: linear-gradient(180deg, #eb602d 0%, #ffa64f 160%) !important;
}

.cuIcon-search {
  position: absolute;
  left: 20% !important;
}
</style>
