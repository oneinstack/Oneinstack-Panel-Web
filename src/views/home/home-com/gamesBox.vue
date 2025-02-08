<template>
  <div class="games">
    <div class="games-title">
      <template v-for="(item, index) in conf.navList" :key="index">
        <div class="games-name" :id="`games_item_${index}`" @click="conf.changeNav(index, item.type)">
          <div class="games-item">
            <img
              v-if="conf.gamesIndex == index"
              class="games_item_img"
              :src="`/static/img/game/casino/${item.type}-active.webp`"
            />
            <img v-else-if="item.type == 'Live'" class="games_item_img" src="/static/img/game/casino/Casino.png" />
            <VSIcon v-else :name="item.imgName" :size="60" />
          </div>
          <div class="games_item_name" :class="{ 'active': conf.gamesIndex == index }">{{ item.name }}</div>
        </div>
      </template>
      <div class="games-active" :style="{ 'left': conf.gamesIndex * 160 + 82 + 'rem' }">
        <img class="active-img" src="/static/img/games-active.png" />
      </div>
    </div>
    <div class="games-content">
      <template v-for="(item, index) in conf.gameList" :key="index">
        <div class="games-content-item" v-if="index < 6" @click="mconf.handleClickGameTip(item)">
          <x-load-img :src="item.imgUrl"></x-load-img>
        </div>
      </template>
      <x-no-data v-if="!conf.isLoading && conf.gameList.length == 0" style="margin-left: 130rem;"></x-no-data>
      <!-- <div class="not-data" v-if="!conf.isLoading && conf.gameList.length == 0">{{ $t('user.noMore') }}</div> -->
      <div class="loading-box" v-if="conf.isLoading">
        <van-loading type="spinner" />
      </div>
    </div>
    <div class="more" @click="mconf.goPage(conf.navList[conf.gamesIndex].url, 1)" v-if="conf.gameList.length > 6">
      <div class="more-btn">{{ $t('home.morebig') }}</div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { apis } from '@/api'
import i18n from '@/lang'
import { svalue } from '@/sstore/svalue'
import { Scope } from 'tools-vue3'
import { onMounted, reactive } from 'vue'
const mconf = Scope.getConf()
const conf = reactive({
  userType: 0,
  gamesIndex: 0,
  isLoading: false,
  gameList: [] as any[],
  navPositionLeft: 60,
  handleVisitorClickGame: () => {},
  navList: [
    {
      name: i18n.t('home.games'),
      url: '/user/casino/index?type=Games',
      type: 'Games',
      imgName: 'slots'
    },
    {
      name: i18n.t('home.live'),
      url: '/user/casino/index?type=Live',
      type: 'Live',
      imgName: 'Casino'
    },
    {
      name: i18n.t('home.chess'),
      url: '/user/casino/index?type=Chess',
      type: 'Chess',
      imgName: 'chess'
    },
    {
      name: i18n.t('home.fish'),
      url: '/user/casino/index?type=Fishing',
      type: 'Fishing',
      imgName: 'fish'
    }
  ],
  // 获取游戏导航栏的位置
  async getNavItemInfo() {
    const tlist = await svalue.getGameType()
    tlist.forEach((v) => {
      const _item: any = conf.navList.find((m) => v.gameTypeCode === m.type)
      if (_item) _item.sort = v.sort
    })
    conf.navList.sort((a: any, b: any) => a.sort - b.sort)
    conf.changeNav(0, conf.navList[0].type)
  },
  changeNav(index: any, type: any, force: boolean = false) {
    if (index == conf.gamesIndex && !force) return
    conf.gamesIndex = index
    conf.gameList = []
    conf.getGamesData(type)
  },

  //获取games列表数据
  async getGamesData(typeCode: any) {
    conf.isLoading = true
    const res = await apis.getThirdGameList({
      deviceType: 1, //邮箱验证码
      typeCode,
      final: (status, config, xhr) => {
        conf.isLoading = false
      }
    })
    conf.gameList = res.data
  }
})

onMounted(() => {
  conf.changeNav(0, conf.navList[0].type, true)
})
</script>
<style lang="less" scoped>
.games {
  margin: 0rem 10rem;
  padding: 5rem 20rem 10rem;

  .games-title {
    display: flex;
    justify-content: space-evenly;
    align-items: center;
    background: #fff;
    // margin-bottom: 2rem;
    border-radius: 35rem;
    position: relative;
    padding: 10rem 24rem 15rem !important;

    .games-name {
      font-size: 29rem;
      font-weight: 500;
      color: #333;
      flex: 1;
      text-align: center;
      position: relative;
      height: 95rem;
      .games-item {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 65rem;
      }
      .games_item_img {
        height: 50rem;
      }
      .games_item_name {
        position: absolute;
        bottom: -2rem;
        left: 0;
        right: 0;
        text-align: center;
      }
      .active {
        animation: gamesBtn 0.1s forwards;
        color: burlywood;
      }

      @keyframes gamesBtn {
        0% {
          font-size: 32rem;
        }

        100% {
          font-weight: 700;
        }
      }
    }

    .games-active {
      position: absolute;
      bottom: -8rem;
      transition: all 0.5s ease-in-out;

      .active-img {
        width: 36rem;
        height: 12rem;
      }
    }
  }

  .games-content {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;

    .games-content-item {
      position: relative;
      width: 48%;
      height: 220rem;
      border-radius: 20rem;
      margin-top: 20rem;
      overflow: hidden;
    }

    .not-data {
      width: 100%;
      margin-top: 60rem;
      text-align: center;
      font-size: 24rem;
      color: #707070;
    }
    .loading-box {
      height: 500rem;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .more {
    background: #fff;
    border-radius: 20rem;
    box-shadow: rgba(0, 0, 0, 0.1) 0rem 8rem 8rem;
    margin-top: 25rem;
    .more-btn {
      height: 78rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24rem;
      font-weight: 700;
    }
  }
}
</style>
