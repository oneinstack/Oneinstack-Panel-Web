<script setup>
import { computed, reactive, watch, nextTick } from 'vue'
import GameBanner from './components/game-banner.vue'
import GameList from './components/game-list.vue'
import GameCard from './components/game-card.vue'
import { Scope } from 'tools-vue3'
import GameModal from '@/components/game-modal.vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const route = useRoute()

watch(
  () => route.path,
  async (path) => {
    await nextTick()
    const currentType = conf.gameType.find((item) => item.link === path).id
    conf.changeType(currentType)
  }
)
const conf = reactive({
  queryParams: {
    current: 1,
    size: 8,
    type: ''
  },
  hasMore: true,
  fetchData: async () => {
    conf.queryParams.type = conf.currentActive.id
    const { data } = await http.get('/api/game/getGameList', conf.queryParams)
    const statistics = await http.get('/api/game/getTypeCount')
    Object.keys(statistics).forEach((key) => {
      const currentItem = conf.gameType.find((item) => item.id === parseInt(key))
      currentItem.number = parseInt(statistics[key])
    })
    conf.marqueeList = data.records
      .filter((item) => item.isHot)
      .map((item, i) => ({
        id: i + 1,
        name: item.gameName,
        desc: item.gameDesc,
        img: item.imgUrl,
        smallImg: item.iconUrl,
        link: item.supportTryUrl,
        isSupportTry: item.isSupportTry
      }))
    conf.games = data.records.map((item, i) => ({
      id: i + 1,
      name: item.gameName,
      bg: item.imgUrl,
      logo: item.iconUrl,
      link: item.supportTryUrl,
      isSupportTry: item.isSupportTry,
      isHot: item.isHot,
      isNew: item.isNewGame
    }))
    conf.hasMore = conf.games.length < data.total
    conf.gameType[0].number = data.total
    if (!conf.marqueeList.length || conf.marqueeList.length >= 5) return
    for (let i = 4 - conf.marqueeList.length; i >= 0; i--) {
      conf.marqueeList.push(conf.marqueeList[i % conf.marqueeList.length])
    }
  },
  changeType: async (type) => {
    conf.hasMore = true
    conf.queryParams = {
      current: 1,
      size: 8,
      type
    }
    const { data } = await http.get('/api/game/getGameList', conf.queryParams)
    conf.gameType[0].number = data.total
    conf.games = data.records.map((item) => ({
      id: item.gameCode,
      name: item.gameName,
      bg: item.imgUrl,
      logo: item.iconUrl,
      link: item.supportTryUrl,
      isSupportTry: item.isSupportTry,
      isHot: item.isHot,
      isNew: item.isNewGame
    }))
    conf.hasMore = conf.games.length < data.total
  },
  nextPage: async () => {
    if (!conf.hasMore) return
    conf.queryParams.current++
    const { data } = await http.get('/api/game/getGameList', conf.queryParams)
    const newData = data.records.map((item) => ({
      id: item.gameCode,
      name: item.gameName,
      bg: item.imgUrl,
      logo: item.iconUrl,
      link: item.supportTryUrl,
      isSupportTry: item.isSupportTry,
      isHot: item.isHot,
      isNew: item.isNewGame
    }))
    conf.games.push(...newData)
    conf.hasMore = conf.games.length < data.total
  },
  currentActive: computed(() => conf.gameType.find((item) => item.link === route.path)),
  gameType: [
    {
      id: '',
      name: t('all'),
      link: '/game/list',
      number: 0
    },
    {
      id: 1,
      name: t('gameSlot'),
      link: '/game/list/slot',
      number: 0
    },
    {
      id: 2,
      name: t('gameFish'),
      link: '/game/list/fish-shooting',
      number: 0
    },
    {
      id: 3,
      name: t('gameArcade'),
      link: '/game/list/arcade',
      number: 0
    },
    {
      id: 4,
      name: t('gameCard'),
      link: '/game/list/poker-card',
      number: 0
    },
    {
      id: 5,
      name: t('gameBingo'),
      link: '/game/list/bingo',
      number: 0
    }
  ],
  marqueeList: [],
  games: [],
  modal: {
    show: false,
    link: '',
    open: (item) => {
      const mediaQuery = matchMedia('(max-width: 768px)')
      if (mediaQuery.matches) return window.open(item.link, '_blank')
      conf.modal.link = item.link
      conf.modal.show = true
    }
  }
})
conf.fetchData()
Scope.setConf(conf)
</script>

<template>
  <div ref="container" class="base-game-container">
    <game-banner />
    <game-list :has-more="conf.hasMore" @load="conf.nextPage">
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

@media screen and (max-width: 768px) {
  .game-list-box {
    grid-template-columns: 1fr !important;
  }
}
</style>
