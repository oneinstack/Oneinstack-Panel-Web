<script setup>
import { reactive } from 'vue'
import HomeBanner from './components/home-banner.vue'
import NewGames from './components/new-games.vue'
import TypeGames from './components/type-games.vue'
import { Scope } from 'tools-vue3'
import GameModal from '@/components/game-modal.vue'

const conf = reactive({
  fetchData: async () => {
    const { data } = await http.get('/api/game/getGameList')
    const statistics = await http.get('/api/game/getTypeCount')
    Object.keys(statistics).forEach((key) => {
      const currentItem = conf.categories.find((item) => item.id === parseInt(key))
      currentItem.number = statistics[key]
    })
    conf.banners = data
      .filter((item) => item.isSwiper)
      .map((item, i) => ({
        id: i + 1,
        imgUrl: item.imgUrl ? item.imgUrl : '/images/banner-test.jpg'
      }))
    conf.newGames = data.map((item, i) => ({
      id: i + 1,
      img: item.imgUrl ? item.imgUrl : '/images/scroll-game.png',
      name: item.name ? item.name : '雷神之锤',
      desc: item.gameDesc
        ? item.gameDesc
        : '「雷神之锤在手，威力无穷」快来体验堆栈百搭疯狂赚的雷神之锤，大力锤出您的2000倍大赏！',
      link: item.supportTryUrl ? item.supportTryUrl : '',
      isSupportTry: item.isSupportTry
    }))
    for (let i = 5 - conf.newGames.length; i >= 0; i--) {
      conf.newGames.push({
        id: i + 1,
        img: '/images/scroll-game.png',
        name: '雷神之锤',
        desc: '雷神之锤在手，威力无穷」快来体验堆栈百搭疯狂赚的雷神之锤，大力锤出您的2000倍大赏！',
        link: '',
        isSupportTry: false
      })
    }
  },
  banners: [],
  newGames: Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    img: '/images/scroll-game.png',
    name: '雷神之锤',
    desc: '「雷神之锤在手，威力无穷」快来体验堆栈百搭疯狂赚的雷神之锤，大力锤出您的2000倍大赏！'
  })),
  categories: [
    {
      id: 1,
      index: 1,
      name: '老虎机',
      img: '/images/game-slot.jpg',
      link: '/game/list/slot',
      number: 0,
      color: '#FFD200'
    },
    {
      id: 2,
      index: 2,
      name: '捕鱼机',
      img: '/images/game-fish.jpg',
      link: '/game/list/fish-shooting',
      number: 0,
      color: '#FFB40B'
    },
    {
      id: 3,
      index: 3,
      name: '街机',
      img: '/images/game-arcade.jpg',
      link: '/game/list/arcade',
      number: 0,
      color: '#FF8708'
    },
    {
      id: 4,
      index: 4,
      name: '棋牌',
      img: '/images/game-card.jpg',
      link: '/game/list/poker-card',
      number: 0,
      color: '#FF6128'
    },
    {
      id: 5,
      index: 5,
      name: '宾果',
      img: '/images/game-bingo.jpg',
      link: '/game/list/bingo',
      number: 0,
      color: '#FF2E3A'
    }
  ],
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
  <div class="base-home-container">
    <home-banner />
    <new-games />
    <type-games />

    <game-modal v-model="conf.modal.show" :game-link="conf.modal.link" />
  </div>
</template>

<style scoped lang="scss">
.base-home-container {
}
</style>
