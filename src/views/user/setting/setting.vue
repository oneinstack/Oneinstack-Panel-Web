<template>
  <x-page>
    <template #title>
      {{ $t('me.setting') }}
    </template>
    <div class="head-logo">
      <img :src="conf.logoImg" />
      <div class="about">
        <span>{{ conf.appName }}</span>
        <span>{{ $t('version.version') }}：{{ conf.version_number }}</span>
      </div>
    </div>
    <div class="edition" @click="conf.autoUpdate" hover-class="bg-hover">
      <div>{{ $t('version.versionUpdate') }}</div>
      <div class="right">
        <span>{{ conf.edit }}</span>
        <img class="right-img" src="/static/img/rig-icon.png" />
      </div>
    </div>
    <div class="set-list">
      <div class="set-item" @click="conf.outPopup = true">
        <div class="name">{{ $t('me.gamemethod') }}</div>
        <div class="item-right">
          <img class="right-img" src="/static/img/rig-icon.png" />
        </div>
      </div>
    </div>
    <van-popup class="popup-bottom-center" v-model:show="conf.outPopup" position="bottom">
      <div class="out-popup">
        <div class="out-line" @click="conf.chageGameType(0)">
          <div>{{ $t('me.defaultMethod') }}</div>
          <img v-if="conf.gameType == 0" class="select-img" src="/static/img/selected.webp" />
        </div>
        <div class="out-line" @click="conf.chageGameType(1)">
          <div>{{ $t('me.newWindow') }}</div>
          <img v-if="conf.gameType == 1" class="select-img" src="/static/img/selected.webp" />
        </div>
        <div style="height: 20rem; background: #f6f6f6"></div>
        <div class="out-line" @click="conf.outPopup = false" style="justify-content: center">{{ $t('me.cancle') }}</div>
      </div>
    </van-popup>
  </x-page>
</template>

<script lang="ts" setup>
import i18n from '@/lang'
import { svalue } from '@/sstore/svalue'
import System from '@/utils/System'
import { onMounted, reactive } from 'vue'
const conf = reactive({
  outPopup: false,
  gameType: 0,

  version_number: '1.0.0',
  edit: '',
  version: '',
  moreShow: false,
  appName: '',
  logoImg: '',

  // 获取logo 名称
  async getConfiguration() {
    let appConfig = await svalue.getAppConfiguration()

    conf.logoImg = appConfig.app_logo
    conf.appName = appConfig.app_name
  },
  autoUpdate() {
    setTimeout(() => {
      let oVersion = conf.version_number.split('.').join('')
      if (Cookie.get('version') > oVersion) {
        conf.edit = i18n.t('version.subTitle')
        Cookie.remove('version')
      } else {
        conf.edit = i18n.t('version.noNew')
        System.toast(i18n.t('version.noNew'))
        Cookie.remove('version')
      }
    }, 1000)
  },
  chageGameType(num: number) {
    conf.gameType = num
    conf.outPopup = false
    Cookie.set('gameMethod', num)
  }
})
const init = async () => {
  conf.getConfiguration()
}
onMounted(() => {
  init()
})
</script>

<style lang="less" scoped>
.head-logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 450rem;

  img {
    width: 185rem;
    height: 185rem;
    background: #ffffff;
    border-radius: 15rem;
  }
  .about {
    margin-top: 20rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    span:first-of-type {
      font-size: 30rem;
      font-weight: 600;
    }
    span:last-of-type {
      font-size: 26rem;
      margin-top: 10rem;
    }
  }
}
.edition {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #ffffff;
  padding: 0rem 30rem;
  height: 110rem;
  font-size: 30rem;
  .right {
    display: flex;
    align-items: center;
    text:first-of-type {
      font-size: 26rem;
      margin-right: 20rem;
    }
  }
}
.set-list {
  margin-top: 20rem;
  .set-item {
    background: #fff;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 25rem;
    .name {
      color: rgb(69, 69, 77);
      font-size: 30rem;
    }
    .item-right {
      display: flex;
      align-items: center;
      font-size: 27rem;
      color: gray;
      .right-name {
        margin-right: 10rem;
      }
    }
  }
}
.right-img {
  width: 16rem;
  height: 26rem;
}
.out-popup {
  font-size: 40rem;
  font-weight: 500;
  background: #ffffff;

  .out-line {
    padding: 0 24rem;
    line-height: 120rem;
    border-bottom: 1rem solid #eee;
    display: flex;
    align-items: center;
    justify-content: space-between;
    .select-img {
      width: 24rem;
      height: 24rem;
    }
  }
}
</style>
