<template>
  <x-page no-header tabbar pageType="black">
    <template #top>
      <div style="width: 100%;">
        <div class="head">
          <x-statusbar />
          <topInfo />
        </div>
      </div>
    </template>
    <div class="menu-content">
      <div class="token">
        <menuItem :menuInfo="conf.menuList[0]" />
      </div>
      <template v-for="item in conf.menuList.slice(1, 6)">
        <div class="second-list"
          :style="{ 'height': item.isMore ? (item.secondList.length + 1) * 80 + 'rem' : '80rem' }">
          <div class="menu-item" :class="{ 'menu-active': item.isMore }">
            <menuItem :menuInfo="item" @change="conf.showOpen" />
          </div>

          <template v-for="it in item.secondList">
            <div style="height: 80rem;">
              <menuItem :menuInfo="it" @change="conf.handle(it)" />
            </div>
          </template>
        </div>
      </template>
      <div class="menu-more">
        <template v-for="item in conf.menuList.slice(6, 9)">
          <div style="height: 80rem;">
            <menuItem :menuInfo="item" @change="conf.handle(item)" />
          </div>
        </template>
      </div>
      <template v-for="item in conf.menuList.slice(9, 11)">
        <div class="menu-item">
          <menuItem :menuInfo="item" @change="conf.handle(item)" />
        </div>
      </template>
      <div class="line-two">
        <template v-for="item in conf.menuList.slice(11)">
          <div class="line-item">
            <div class="menu-item">
              <menuItem :menuInfo="item" @change="conf.handle(item)" />
            </div>
          </div>
        </template>
      </div>
    </div>
    <custPopup :show="conf.langPopup" @close="conf.langPopup = false">
      <div class="lang-list">
        <template v-for="item of conf.langArr" :key="item.id">
          <div class="select-item flex-b-c" :class="{ 'select-active': item.id == conf.language }"
            @click="conf.changeLang(item)">
            <div class="lang-left">
              <img class="left-img" :src="`/static/img/me/${item.id}.png`" />
              <span>{{ item.name }}</span>
            </div>
            <div class="icon"></div>
          </div>
        </template>
      </div>
    </custPopup>
    <!-- 选择默认钱包 -->
    <coinPopup
      :show="conf.coinPopup"
      :dataArr="conf.userWalletList"
      :selectId="conf.defaultInfo.id"
      @close="conf.coinPopup = false"
      @change="conf.handleDefaultwallet"
    />
  </x-page>
</template>
<script lang="ts" setup>
import { reactive } from 'vue';
import CuModal from './components/cuModal.vue'
import topInfo from './theme/black/components/topInfo.vue'
import menuItem from './theme/black/components/menuItem.vue';
import sconfig from '@/sstore/sconfig'
import sutil from '@/sstore/sutil'
import System from '@/utils/System';
import { svalue } from '@/sstore/svalue';
import { index } from './me'
import custPopup from '../user/setting/com/custPopup.vue';
import coinPopup from '../user/wallet/com/black/coinPopup.vue';

const conf = index()

</script>

<style lang="less" scoped>
.head {
  background: #323838;
}

.menu-content {
  padding: 24rem;

  .menu-item {
    border-radius: 16rem;
    background: #323738;
    height: 80rem;
    margin-bottom: 10rem;
  }

  .menu-active {
    margin-bottom: 0rem;
    background: #3C4142;
  }

  .token {
    height: 110rem;
    margin-bottom: 20rem;
    background: #323A39;
    border-radius: 16rem;
  }

  .menu-more {
    border-radius: 16rem;
    background: #323738;
    margin: 20rem 0rem;
  }

  .second-list {
    background: #323738;
    border-radius: 16rem;
    margin-bottom: 10rem;
    transition: all .2s;
    overflow: hidden;
  }

  .line-two {
    display: flex;
    justify-content: space-between;
    margin-top: 20rem;

    .line-item {
      flex: 1;

      &:first-of-type {
        margin-right: 16rem;
      }
    }
  }
}

.lang-list {
  padding: 0 24rem 24rem;

  .select-item {
    height: 90rem;
    padding: 0rem 16rem;
    color: #fff;
    font-size: 26rem;
    margin-bottom: 10rem;

    .lang-left {
      display: flex;
      align-items: center;

      .left-img {
        height: 42rem;
        margin-right: 20rem;
      }
    }

    .icon {
      border: 3rem solid #36393A;
      width: 40rem;
      height: 40rem;
      border-radius: 50%;
    }
  }

  .select-active {
    background: #323738;
    border-radius: 12rem;

    .icon {
      border: 8rem solid #1CF187;
    }
  }
}
</style>
