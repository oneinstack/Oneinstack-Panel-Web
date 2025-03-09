<template>
  <x-page pageType="black">
    <template #title>
      {{ $t('me.AboutUs') }}
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
    <custPopup :show="conf.outPopup" @close="conf.outPopup = false">
      <div class="out-popup">
        <div class="out-line flex-b-c" :class="{'out-active': conf.gameType == 0}" @click="conf.chageGameType(0)">
          <div class="name">{{ $t('me.defaultMethod') }}</div>
          <div class="icon"></div>
        </div>
        <div class="out-line flex-b-c" :class="{'out-active': conf.gameType == 1}" @click="conf.chageGameType(1)">
          <div class="name">{{ $t('me.newWindow') }}</div>
          <div class="icon"></div>
        </div>
      </div>
    </custPopup>
  </x-page>
</template>

<script lang="ts" setup>
import custPopup from '../setting/com/custPopup.vue'
import { index } from './about'
import stheme from '@/sstore/stheme'

const conf = index()
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
    color: #BFBFBF;

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
  background: #323738;
  padding: 0rem 30rem;
  height: 110rem;
  font-size: 30rem;
  color: #fff;

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
    background: #323738;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 25rem;

    .name {
      color: #fff;
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

  padding: 20rem 24rem;

  .out-line {
    height: 120rem;
    padding: 0rem 16rem;
    color: #fff;
    font-size: 30rem;
    margin-bottom: 20rem;

    .icon {
      border: 3rem solid #36393A;
      width: 40rem;
      height: 40rem;
      border-radius: 50%;
    }
  }

  .out-active {
    background: #323738;
    border-radius: 12rem;

    .icon {
      border: 8rem solid #1CF187;
    }
  }
}
</style>
