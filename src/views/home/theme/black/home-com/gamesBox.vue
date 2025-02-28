<template>
  <div class="games">
    <!-- 导航栏 -->
     <gamesNav @change="conf.changeNav" />
    <template v-for="item in conf.navList.slice(1)" :key="item.type">
      <div class="games-content" v-if="conf.initData[item.type]">
        <gameTitle :name="item.name" />
        <div class="content-list" v-scroll>
          <template v-for="(it, index) in conf.initData[item.type]" :key="index">
            <div class="games-content-item" @click="mconf.handleClickGameTip(item)">
              <x-load-img :src="it.imgUrl"></x-load-img>
              <div class="user">
                <img class="user-img" src="/static/img/home/black/online-user.png" />
                <div class="num">145</div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </template>
    <div class="games-content" v-if="conf.gameList.length">
        <gameTitle name="Game Providers" />
        <div class="content-list" v-scroll>
          <template v-for="(it, index) in conf.gameList" :key="index">
            <div class="games-content-type">
              <img
                mode="heightFix"
                class="type-img"
                :src="`/static/img/centerWallet/${it.gamePlatformCode}.png`"
              />
              <span>{{ it.gamePlatformCode }}</span>
            </div>
          </template>
        </div>
      </div>
  </div>
</template>
<script setup lang="ts">
import { apis } from '@/api'
import i18n from '@/lang'
import { svalue } from '@/sstore/svalue'
import { Scope } from 'tools-vue3'
import { onMounted, reactive } from 'vue'
import gameTitle from './gameTitle.vue'
import gamesNav from '../components/gamesNav.vue'
import System from '@/utils/System'
import { log } from 'node:console'
const mconf = Scope.getConf()
const conf = reactive({
  isLoading: false,
  gameList: [] as any[],
  initData: {} as any,
  initType: {} as any,
  navList: [] as any[],
  changeNav(e: any) {
    conf.gameList = []
    if (Array.isArray(e)) {
      conf.navList = e
      conf.getGamesData(e[0].type)
      return
    }
    conf.getGamesData(e)
  },

  //获取games列表数据
  async getGamesData(typeCode: any) {
    conf.isLoading = true
    System.loading()
    const res = await apis.getThirdGameList({
      deviceType: 1, //邮箱验证码
      typeCode,
      final: (status, config, xhr) => {
        conf.isLoading = false
        System.loading(false)
      }
    })
    conf.initData = {
      '': res.data
    }
    res.data.forEach((item: any) => {
      conf.initData[item.typeCode] = conf.initData[item.typeCode] || []
      conf.initData[item.typeCode].push(item)
      conf.initType[item.gamePlatformCode] = conf.initType[item.gamePlatformCode] || []
      conf.initType[item.gamePlatformCode].push(item)
    })
    conf.gameList = Object.keys(conf.initType).map((item) => ({ gamePlatformCode: item }))
    console.log('5555');
    
    console.log(conf.gameList);
    console.log(conf.initData);
    // conf.gameList = res.data
  }
})

// onMounted(() => {
//   conf.changeNav(conf.navList[0].type)
// })
</script>
<style lang="less" scoped>
.games {
  padding-left: 24rem;

  .games-content {
    padding: 24rem 0rem 0rem;

    .content-list {
      display: flex;
      margin-top: 10rem;

      .games-content-item {
        flex-shrink: 0;
        position: relative;
        margin-right: 10rem;
        width: 220rem;
        height: 280rem;
        border-radius: 16rem;
        overflow: hidden;

        .user {
          position: absolute;
          right: 10rem;
          bottom: 10rem;
          display: flex;
          align-items: center;
          background: rgba(0, 0, 0, 0.3);
          padding: 5rem 10rem;
          border-radius: 8rem;

          .user-img {
            width: 18rem;
            height: 20rem;
            margin-right: 5rem;
          }

          .num {
            font-size: 20rem;
            color: #fff;
          }
        }
      }
      .games-content-type{
        width: 220rem;
        height: 80rem;
        background: #323738;
        border-radius: 12rem;
        flex-shrink: 0;
        margin-right: 10rem;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 24rem;
        color: #BFBFBF;
        .type-img{
          height: 50rem;
          margin-right: 10rem;
        }
      }
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
}
</style>
