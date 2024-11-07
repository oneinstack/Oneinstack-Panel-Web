<script setup>
import { computed, reactive } from 'vue'
import GameBanner from './components/game-banner.vue'
import GameList from './components/game-list.vue'
import GameCard from './components/game-card.vue'
import { Scope } from 'tools-vue3'
import GameModal from '@/components/game-modal.vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const conf = reactive({
  fetchData: async () => {
    const { data } = await http.get('/api/game/getGameList')
    const statistics = await http.get('/api/game/getTypeCount')
    let allGameNumber = 0
    Object.keys(statistics).forEach((key) => {
      const currentItem = conf.gameType.find((item) => item.id === parseInt(key))
      currentItem.number = parseInt(statistics[key])
    })
    conf.marqueeList = data
      .filter((item) => item.isHot)
      .map((item, i) => ({
        id: i + 1,
        name: item.name ? item.name : '财神驾到',
        desc: item.gameDesc ? item.gameDesc : 'JDB首款中國風跑灯押分机游戏！',
        type: item.type,
        img: item.imgUrl ? item.imgUrl : '/images/game-marquee.jpg',
        smallImg: item.iconUrl ? item.iconUrl : '/images/marquee-label.png',
        link: item.supportTryUrl ? item.supportTryUrl : '',
        isSupportTry: item.isSupportTry
      }))
    for (let i = 5 - conf.marqueeList.length; i >= 0; i--) {
      conf.marqueeList.push({
        id: i + 1,
        name: '财神驾到',
        desc: 'JDB首款中國風跑灯押分机游戏！',
        type: 'marquee',
        img: '/images/game-marquee.jpg',
        smallImg: '/images/marquee-label.png',
        link: '',
        isSupportTry: false
      })
    }
    conf.games = data.map((item, i) => ({
      id: i + 1,
      name: item.name ? item.name : '海皇争霸龙凤传说',
      bg: item.imgUrl ? item.imgUrl : '/images/cover-bg.jpg',
      logo: item.iconUrl ? item.iconUrl : '/images/cover-game-log.png',
      link: item.supportTryUrl ? item.supportTryUrl : '',
      isSupportTry: item.isSupportTry
    }))
    conf.gameType[0].number = conf.games.length
  },
  currentActive: computed(() => conf.gameType.find((item) => item.link === route.path)),
  gameType: [
    {
      id: 0,
      name: '全部游戏',
      link: '/game/list',
      number: 0
    },
    {
      id: 1,
      name: '老虎机',
      link: '/game/list/slot',
      number: 0
    },
    {
      id: 2,
      name: '捕鱼机',
      link: '/game/list/fish-shooting',
      number: 0
    },
    {
      id: 3,
      name: '街机',
      link: '/game/list/arcade',
      number: 0
    },
    {
      id: 4,
      name: '棋牌',
      link: '/game/list/poker-card',
      number: 0
    },
    {
      id: 5,
      name: '宾果',
      link: '/game/list/bingo',
      number: 0
    }
  ],
  marqueeList: Array.from({ length: 5 }, (_, i) => ({
    id: i,
    name: '财神驾到',
    desc: 'JDB首款中國風跑灯押分机游戏！',
    type: '',
    img: '/images/game-marquee.jpg',
    smallImg: '/images/marquee-label.png'
  })),
  games: Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    name: '海皇争霸龙凤传说',
    bg: '/images/cover-bg.jpg',
    logo: '/images/cover-game-log.png',
    link: ''
  })),
  modal: {
    show: false,
    link: '',
    open: (item) => {
      conf.modal.link = item.link
      conf.modal.show = true
    }
  }
})
conf.fetchData()
Scope.setConf(conf)
</script>

<template>
  <div class="base-game-container">
    <game-banner />
    <game-list>
      <div class="game-list-box">
        <game-card v-for="game in conf.games" :key="game.id" :data="game" @click-play="conf.modal.open(game)" />
      </div>
    </game-list>

    <game-modal v-model="conf.modal.show" :game-link="conf.modal.link" />
  </div>
</template>

<style scoped lang="scss">
.base-game-container {
  padding-top: var(--nav-heaght);

  .game-list-box {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-auto-rows: auto;
    gap: 1.5em;
  }
}
</style>
