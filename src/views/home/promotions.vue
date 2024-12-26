<template>
  <x-page no-header tabbar>
    <div class="main" :style="{ paddingTop: `${StatusBarConfig.statusHeight}px` }">
      <div class="content">
        <gridBlock :data="conf.gridBlock" @item-click="conf.hanldeItemClick" />

        <div class="other">
          <span class="title">{{ $t('rechargeModule.other') }}</span>
          <div class="list-img">
            <template v-for="item in conf.activityList" :key="item.id">
              <div class="img-item" @click="conf.goContent(item)">
                <img :src="item.coverUrl" />
                <div class="nav-name">{{ item.activityName }}</div>
              </div>
            </template>
          </div>
        </div>
      </div>
      <x-no-data v-if="!conf.isLoading && !conf.activityList.length" :top="40"></x-no-data>
    </div>
  </x-page>
</template>

<script setup lang="ts">
import StatusBarConfig from '@/utils/StatusBarConfig'
import { index } from './ts/promotions'
import gridBlock from './components/gridBlock.vue'


const conf = index()
</script>
<style lang="less" scoped>
.container {
  background: rgba(245, 245, 247, 1);
}

.main {
  background: linear-gradient(180deg, rgba(255, 222, 191, 1) 0%, rgba(245, 245, 247, 1) 15%);
}

.head {
  padding: 16rem 30rem 0rem;

  .head-daily {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .logo-img {
      width: 60rem;
      height: 60rem;
    }

    .head-rank {
      display: flex;
      align-items: center;

      .rank-img {
        width: 44rem;
        height: 40rem;
      }
    }
  }
}

.content {
  margin: 32rem 0;
  padding: 16rem 32rem;
  width: 100%;

  .other {
    margin-top: 20rem;

    .title {
      font-size: 32rem;
      font-weight: 600;
    }
  }

  .list-img {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    // padding: 24rem 30rem 0rem;

    .img-item {
      margin-bottom: 24rem;
      background: #fff;
      border-radius: 10rem;
      width: 100%;
      padding-bottom: 20rem;

      img {
        border-radius: 16rem;
        width: 100%;
        height: 224rem;
      }

      .nav-name {
        font-weight: 600;
        color: #000000;
        font-size: 26rem;
        padding-left: 10rem;
      }
    }
  }
}
</style>
