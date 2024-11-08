<script setup>
import { reactive } from 'vue'
import HomeBanner from './components/home-banner.vue'
import NewGames from './components/new-games.vue'
import TypeGames from './components/type-games.vue'
import { Scope } from 'tools-vue3'
import GameModal from '@/components/game-modal.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const conf = reactive({
  fetchData: async () => {
    const { data } = await http.get('/api/game/getGameList', { pages: 1, size: 999 })
    const statistics = await http.get('/api/game/getTypeCount')
    Object.keys(statistics).forEach((key) => {
      const currentItem = conf.categories.find((item) => item.id === parseInt(key))
      currentItem.number = statistics[key]
    })
    conf.banners = data.records
      .filter((item) => item.isSwiper)
      .map((item, i) => ({
        id: i + 1,
        imgUrl: item.imgUrl
      }))
    conf.newGames = data.records
      .filter((item) => item.isNewGame)
      .map((item, i) => ({
        id: i + 1,
        img: item.imgUrl,
        name: item.gameName,
        desc: item.gameDesc,
        link: item.supportTryUrl,
        isSupportTry: item.isSupportTry
      }))
    if (!conf.newGames.length || conf.newGames.length >= 5) return
    for (let i = 4 - conf.newGames.length; i >= 0; i--) {
      conf.newGames.push(conf.newGames[i % conf.newGames.length])
    }
  },
  banners: [],
  newGames: [],
  categories: [
    {
      id: 1,
      index: 1,
      name: t('gameSlot'),
      img: '/images/game-slot.jpg',
      link: '/game/list/slot',
      number: 0,
      color: '#FFD200'
    },
    {
      id: 2,
      index: 2,
      name: t('gameFish'),
      img: '/images/game-fish.jpg',
      link: '/game/list/fish-shooting',
      number: 0,
      color: '#FFB40B'
    },
    {
      id: 3,
      index: 3,
      name: t('gameArcade'),
      img: '/images/game-arcade.jpg',
      link: '/game/list/arcade',
      number: 0,
      color: '#FF8708'
    },
    {
      id: 4,
      index: 4,
      name: t('gameCard'),
      img: '/images/game-card.jpg',
      link: '/game/list/poker-card',
      number: 0,
      color: '#FF6128'
    },
    {
      id: 5,
      index: 5,
      name: t('gameBingo'),
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
    <new-games v-if="conf.newGames.length" />
    <type-games />

    <game-modal v-model="conf.modal.show" :game-link="conf.modal.link" />
  </div>
</template>

<style scoped lang="scss">
.base-home-container {
}
</style>
