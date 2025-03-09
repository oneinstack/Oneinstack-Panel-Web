<template>
  <div class="games">
    <!-- 导航栏 -->
     <gamesNav @change="conf.changeNav" />
    <template v-for="(item,index) in conf.navList.slice(1)" :key="item.type">
      <div class="games-content" v-if="conf.initData[item.type]">
        <gameTitle 
          :name="item.name"
          :preStatus="conf.pageItem[index]"
          @nextPage="conf.changePage($event,index)"
          @changeAll="mconf.goPage(item.url)"
        />
        <div class="content-list" :ref="setRef" v-scroll>
          <template v-for="(it, i2) in conf.initData[item.type]" :key="i2">
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
        <gameTitle 
          name="Game Providers"
          :preStatus="conf.pageItem[4]"
          @nextPage="conf.changePage($event,4)"
          @changeAll="mconf.goPage('/user/casino/index')"
        />
        <div class="content-list" :ref="setRef" v-scroll>
          <template v-for="(it, index) in conf.gameList" :key="index">
            <div class="games-content-type" @click="mconf.goPage(`/user/casino/index?second=${it.gamePlatformCode}`)">
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
import { onMounted, reactive, ref } from 'vue'
import gameTitle from './gameTitle.vue'
import gamesNav from '../components/gamesNav.vue'
import System from '@/utils/System'
import sstatus from '@/sstore/sstatus'
import sutil from '@/sstore/sutil'
const mconf = Scope.getConf()

// 声明 refs 数组，用于存储所有的 ref
const refs = ref<any[]>([]);
// setRef 用于把每个元素的 DOM 引用推入 refs 数组
const setRef = (el: any) => {
  if (el) {
    refs.value.push(el);
  }
};

const conf = reactive({
  isLoading: false,
  gameList: [] as any[],
  initData: {} as any,
  initType: {} as any,
  navList: [] as any[],
  pageItem:{0: 0,1: 0,2: 0,3: 0,4: 0} as any,
  changeNav(e: any) {
    conf.gameList = []
    if (Array.isArray(e)) {
      conf.navList = e
      conf.getGamesData(e[0].type)
      return
    }
    console.log(conf.navList);
    console.log('99887');
    
    
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
  },
  // 下一页/上一页滚动条滚动到对应位置
  changePage(type: string,index: any) {
    conf.pageItem[index] = 0
    let leftNum = refs.value[index].scrollLeft + sutil.rem2px(690)
    if(type == 'pre') {
      const preLeft = refs.value[index].scrollLeft - sutil.rem2px(690)
      leftNum = preLeft > 0 ? preLeft : 0
    }
    if(leftNum > 0) conf.pageItem[index] = 1
    refs.value[index].scrollTo({
      left: leftNum,
      behavior: 'smooth'
    })
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
      overflow-x: scroll;

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
