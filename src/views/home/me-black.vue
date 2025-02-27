<template>
  <x-page no-header tabbar>
    <div class="head">
      <x-statusbar />
      <topInfo />
    </div>
    <div class="menu-content">
      <div class="token">
        <menuItem :menuInfo="conf.menuList[0]" />
      </div>
      <template v-for="item in conf.menuList.slice(1, 6)">
        <div class="second-list" :style="{'height': item.isMore ? (item.list.length+1)*80 + 'rem' : '80rem'}">
          <div class="menu-item" :class="{ 'menu-active': item.isMore }">
            <menuItem :menuInfo="item" @change="conf.showOpen" />
          </div>

          <template v-for="it in item.list">
            <div style="height: 80rem;">
              <menuItem :menuInfo="it" />
            </div>
          </template>
        </div>
      </template>
      <div class="menu-more">
        <template v-for="item in conf.menuList.slice(6, 9)">
          <div style="height: 80rem;">
            <menuItem :menuInfo="item" />
          </div>
        </template>
      </div>
      <template v-for="item in conf.menuList.slice(9, 11)">
        <div class="menu-item">
          <menuItem :menuInfo="item" @change="conf.goPage" />
        </div>
      </template>
      <div class="line-two">
        <template v-for="item in conf.menuList.slice(11)">
          <div class="line-item">
            <div class="menu-item">
              <menuItem :menuInfo="item" />
            </div>
          </div>
        </template>
      </div>

    </div>
  </x-page>
</template>
<script lang="ts" setup>
import { reactive } from 'vue';
import CuModal from './components/cuModal.vue'
import topInfo from './theme/black/components/topInfo.vue'
import menuItem from './theme/black/components/menuItem.vue';
import sconfig from '@/sstore/sconfig'
import sutil from '@/sstore/sutil'
import { url } from 'inspector';
import System from '@/utils/System';

const conf = reactive({
  selectList: 'Casino',
  menuList: [
    {
      name: 'BG ToKen',
      num: '+0.50%',
      imgUrl: 'logo-img',
      rNum: '1BG',
      rPrice: '$0.0041148',
      isArrowRight: true
    },
    {
      name: 'BG Pocker',
      imgUrl: 'me-pocker',
      isArrowRight: false
    },
    {
      name: 'Casino',
      imgUrl: 'me-casino',
      isArrowRight: false,
      isMore: false,
      list: [
        {
          name: 'Favorites',
          imgUrl: 'cs-favorites',
        },
        {
          name: 'Recent',
          imgUrl: 'cs-recent',
        },
        {
          name: 'Originals',
          imgUrl: 'cs-originals',
        },
        {
          name: 'Top Picks',
          imgUrl: 'cs-picks',
        },
        {
          name: 'Slots',
          imgUrl: 'cs-slots',
        },
        {
          name: 'Live Casino',
          imgUrl: 'cs-live',
        },
        {
          name: 'Hot Games',
          imgUrl: 'cs-hot',
        },
        {
          name: 'Feature Buy-in',
          imgUrl: 'cs-feature',
        },
        {
          name: 'New Releases',
          imgUrl: 'cs-new',
        },
        {
          name: 'Table Game',
          imgUrl: 'cs-table',
        },
        {
          name: 'Game Shows',
          imgUrl: 'cs-game',
        }
      ]
    },
    {
      name: 'Lottery',
      imgUrl: 'me-lottery',
      isArrowRight: false
    },
    {
      name: 'Sports',
      imgUrl: 'me-sports',
      isArrowRight: false
    },
    {
      name: 'Promotions',
      imgUrl: 'me-promotions',
      isArrowRight: false,
    },
    {
      name: 'VIP Clup',
      imgUrl: 'me-club',
    },
    {
      name: 'Bonus',
      imgUrl: 'me-bonus',
    },
    {
      name: 'Agency Center',
      imgUrl: 'me-center',
    },
    {
      name: 'About us',
      imgUrl: 'me-about',
      isArrowRight: true,
      url: '/user/about/about'
    },
    {
      name: 'Live Support',
      imgUrl: 'me-live',
      isArrowRight: true
    },
    {
      name: 'English',
      imgUrl: 'logo-img',
      isArrowRight: true
    },
    {
      name: 'INR',
      imgUrl: 'logo-img',
      isArrowRight: true
    }
  ] as any[],
  showOpen(e: any) {
    const index = conf.menuList.findIndex((item: any) => item.name === e.name);
    conf.menuList[index].isMore = !conf.menuList[index].isMore;
  },
  goPage(e: any) {
    console.log(e);
    e.url && System.router.push(e.url);
  }
})

</script>

<style lang="less" scoped>
.head {
  background: #323838;
  padding: 0rem 24rem;
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
</style>
