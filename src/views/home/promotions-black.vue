<template>
  <x-page no-header tabbar>
    <template #top>
      <div style="width: 100%;">
        <div class="head">
          <x-statusbar />
          <topInfo />
        </div>
        <!-- 搜索框 -->
        <search typeName="Casino" />

        <!-- 游戏导航栏 -->
        <div style="padding-left: 24rem;">
          <gamesNav @change="conf.changeNav" />
        </div>
        <!-- 游戏内容 -->
        <div class="game">
          <div class="type-list">
            <div class="type-item flex-b-c" @click="conf.popupShow = true">
              <div class="type-name">
                Sort By: <span>Popular</span>
              </div>
              <div class="arrow flex-center">
                <van-icon size="24rem" color="#fff" :name="conf.popupShow ? 'arrow-up' : 'arrow-down'" />
              </div>
            </div>
            <div class="type-item flex-b-c" @click="conf.popupShow = true">
              <div class="type-name">
                Providers: <span>All</span>
              </div>
              <div class="arrow flex-center">
                <van-icon size="24rem" color="#fff" name="arrow-down" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
    <div class="content-list">
      <template v-for="(it, index) in conf.gameList" :key="index">
        <div class="games-content-item">
          <x-load-img :src="it.imgUrl"></x-load-img>
          <div class="user">
            <img class="user-img" src="/static/img/home/black/online-user.png" />
            <div class="num">145</div>
          </div>
        </div>
      </template>
    </div>
    <van-popup class="popup-bottom-center" :show="conf.popupShow" position="bottom" borderRadius='16' :round="true"
      @close="conf.popupShow = false">
      <div class="popup-content">
        <div class="title flex-center">
          <span>select</span>
          <div class="arrow flex-center" @click.stop="conf.popupShow = false">
            <van-icon size="28rem" color="#fff" name="cross" />
          </div>
        </div>
        <div class="select-list">
          <div class="select-item flex-b-c select-active">
            <div class="name">Popular</div>
            <div class="icon"></div>
          </div>
          <div class="select-item flex-b-c">
            <div class="name">Recommend</div>
            <div class="icon"></div>
          </div>
          <div class="select-item flex-b-c">
            <div class="name">Newest</div>
            <div class="icon"></div>
          </div>
        </div>
      </div>
    </van-popup>
  </x-page>
</template>

<script setup lang="ts">
import topInfo from './theme/black/components/topInfo.vue'
import search from './theme/black/components/search.vue';
import gamesNav from './theme/black/components/gamesNav.vue';
import { reactive } from 'vue';
import System from '@/utils/System';
import { apis } from '@/api';

const conf = reactive({
  isLoading: false,
  gameList: [] as any[],
  initData: {} as any,
  initType: {} as any,
  navList: [] as any[],
  popupShow: false,
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
    conf.gameList = res.data
    console.log('5555');

    console.log(conf.gameList);
    console.log(conf.initData);
    // conf.gameList = res.data
  }
})

</script>
<style lang="less" scoped>
.head {
  background: #323838;
  padding: 0rem 24rem;
}

.game {
  padding: 24rem;
}

.type-list {
  display: flex;

  .type-item {
    flex: 1;
    height: 80rem;
    background: #292D2E;
    border: 2rem solid #383E3E;
    border-radius: 14rem;
    padding: 0rem 16rem;

    &:last-of-type {
      margin-left: 12rem;
    }

    .type-name {
      color: #BFBFBF;
      font-size: 24rem;

      span {
        color: #fff;
        margin-left: 20rem;
      }
    }

    .arrow {
      width: 44rem;
      height: 44rem;
      background: #464F50;
      border-radius: 12rem;
      margin-left: 24rem;
      position: relative;
      z-index: 2;
    }
  }
}

.content-list {
  display: flex;
  flex-flow: wrap;
  padding: 0 24rem;
  overflow-y: auto;

  .games-content-item {
    flex-shrink: 0;
    position: relative;
    margin-right: 2%;
    width: 32%;
    height: 280rem;
    border-radius: 16rem;
    overflow: hidden;
    margin-bottom: 14rem;

    &:nth-child(3n + 3) {
      margin-right: 0rem;
    }

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
}

.popup-content {
  background: #232626;

  .title {
    height: 100rem;
    color: #fff;
    font-size: 28rem;
    position: relative;

    .arrow {
      position: absolute;
      right: 24rem;
      top: calc(50% - 28rem);
      width: 56rem;
      height: 56rem;
      background: #464F50;
      border-radius: 12rem;
      z-index: 2;
    }
  }

  .select-list{
    padding: 0 24rem 24rem;
    .select-item{
      height: 80rem;
      padding: 0rem 16rem;
      color: #fff;
      font-size: 26rem;
      margin-bottom: 10rem;
      .icon{
        border: 3rem solid #36393A;
        width: 40rem;
        height: 40rem;
        border-radius: 50%;
      }
    }
    .select-active{
      background: #323738;
      border-radius: 12rem;
      .icon{
        border: 8rem solid #1CF187;
      }
    }
  }
}
</style>