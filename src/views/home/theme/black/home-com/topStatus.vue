<template>
  <div class="head">
    <topInfo v-if="sconfig.userInfo" />
    <!-- 轮播图 -->
    <div class="banner" v-if="swiperList.length > 0">
      <van-swipe class="banner-list" indicator-dots :autoplay="5000" indicator-color="rgb(28, 241, 135)">
        <van-swipe-item class="banner-item" v-for="(item, index) in swiperList" :key="index">
          <div style="height: 290rem;border-radius: 20rem;overflow: hidden;">
            <x-img class="banner-img" :src="item.coverUrl" />
          </div>
        </van-swipe-item>
      </van-swipe>
    </div>
  </div>

  <div class="wins-game" v-if="conf.gameList.length">
    <div class="wins-title">
      <div class="w-icon"></div>
      <span>Recent Big Wins</span>
    </div>
    <div class="game-list" v-scroll>
      <template v-for="(item, index) in conf.gameList" :key="index">
        <div class="games-item" @click="mconf.handleClickGameTip(item)">
          <div class="games-item-img">
            <x-load-img :src="item.imgUrl"></x-load-img>
            <div class="user">
              <img class="user-img" src="/static/img/home/black/online-user.png" />
              <div class="num">145</div>
            </div>
          </div>
          <div class="game-name">
            <img class="wins-img" src="/static/img/home/black/wins-badge1.png" />
            <span class="ellipsis">{{ item.gameEnglishName }}</span>
          </div>
          <div class="money ellipsis">$14.66M</div>
        </div>
      </template>
    </div>
  </div>
</template>
<script setup lang="ts">
import { onMounted, reactive } from 'vue';
import topInfo from '../components/topInfo.vue';
import sconfig from '@/sstore/sconfig';
import System from '@/utils/System';
import { apis } from '@/api';
import { Scope } from 'tools-vue3';

const props = defineProps({
  swiperList: {
    default: (): any => []
  }
})

const mconf = Scope.getConf()

const conf = reactive({
  goPage(url: string) {
    System.router.push(url)
  },
  gameList: [] as any[],
  //获取games列表数据
  async getGamesData() {
    const { data } = await apis.getThirdGameList({
      deviceType: 1, //邮箱验证码
      typeCode: 'Games',
    })
    conf.gameList = data
    console.log('666');
    console.log(conf.gameList);


  }
})

onMounted(() => {
  conf.getGamesData()
})
</script>
<style lang="less" scoped>
.head {
  padding: 16rem 0rem 0rem;
  background: linear-gradient(180deg, #567340 0%, #222627 100%);
}

.banner {
  padding: 0rem 24rem;
  --van-swipe-indicator-inactive-opacity: 1;
  --van-swipe-indicator-inactive-background: rgba(0, 0, 0, 0.3);

  .banner-list {
    height: 320rem;
    border-radius: 20rem;

    .banner-item {
      border-radius: 20rem;

      .banner-img {
        width: 100%;
        height: 100%;
        border-radius: 20rem;
      }
    }
  }
}

:deep(.van-swipe__indicators) {
  bottom: 0rem !important;

  .van-swipe__indicator {
    width: 10rem;
    height: 10rem;
    border-radius: 50%;

    &.van-swipe__indicator--active {
      height: 10rem;
      width: 24rem;
      border-radius: 5rem;
    }
  }
}

.wins-game {
  padding: 20rem 24rem 0rem;

  .wins-title {
    font-size: 28rem;
    color: #fff;
    font-weight: 600;
    display: flex;
    align-items: center;
    margin-bottom: 20rem;

    .w-icon {
      background: #1CF187;
      width: 14rem;
      height: 14rem;
      border-radius: 50%;
      margin-right: 20rem;
    }
  }

  .game-list {
    display: flex;

    .games-item {
      flex-shrink: 0;
      margin-right: 12rem;
      width: 106rem;


      .games-item-img {
        width: 100%;
        height: 130rem;
        border-radius: 16rem;
        overflow: hidden;
        position: relative;
      }

      .user {
        position: absolute;
        right: 0rem;
        bottom: 2rem;
        display: flex;
        align-items: center;
        background: rgba(0, 0, 0, 0.3);
        padding: 2rem 6rem;
        border-radius: 16rem;

        .user-img {
          width: 9rem;
          height: 10rem;
          margin-right: 5rem;
        }

        .num {
          font-size: 14rem;
          color: #fff;
        }
      }

      .game-name {
        display: flex;
        align-items: center;
        margin-top: 10rem;
        padding-right: 0rem;
        font-size: 20rem;
        color: #BFBFBF;

        .wins-img {
          width: 28rem;
          height: 28rem;
        }
      }

      .money {
        margin-top: 10rem;
        font-size: 20rem;
        font-family: 600;
        color: #1CF187;
        text-align: center;
      }

      .ellipsis {
        white-space: nowrap;
        /* 防止文本换行 */
        overflow: hidden;
        /* 隐藏溢出的内容 */
        text-overflow: ellipsis;
      }
    }
  }
}
</style>