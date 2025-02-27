<template>
  <div class="tarbar-foot">
    <div class="tabbar">
      <div class="tabbar__list">
        <div v-for="(item, index) in conf.tabbar" :key="index">
          <div class="tabbar__item" :class="[{ 'tabbar__item--active': index === conf.currentTabbarIndex }]"
            @click="conf.clickItem(item)">
            <img class="tabbar__item__icon"
              :src="`${index == conf.currentTabbarIndex ? item.iconActive : item.icon}`" />
            <div class="tabbar__item__text">{{ item.name }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ERouter } from '@/enum/Enum'
import System from '@/utils/System'
import { Scope } from 'tools-vue3'
import { onMounted, reactive } from 'vue'
const event = Scope.Event()
const props = defineProps({
  list: {
    default: [] as { path: string; icon: string; iconActive: string; auth: boolean; index: number,name: string }[]
  }
})
const emit = defineEmits(['change'])

const conf = reactive({
  currentTabbarIndex: null as number | null,
  tabbar: props.list,
  bgPositionX: 0,
  zIndex: -60 - (2370 / 2 - 135),
  clickItem(item: any) {
    emit('change', item)
  },
  setActiveItem: (path: string = System.getRouterPath()) => {
    let _findItem: any = conf.tabbar.find((item: any) => item.path == path)
    if (!_findItem) return
    conf.currentTabbarIndex = _findItem.index
    conf.bgPositionX = conf.zIndex + _findItem.index * 150
  }
})

onMounted(() => {
  conf.setActiveItem()
  event.on(ERouter.change, (path: string) => {
    conf.setActiveItem(path)
  })
})
</script>

<style lang="less" scoped>
.tarbar-foot {
  position: fixed;
  bottom: 0;
  width: 750rem;
  margin: 0 auto;
  z-index: 100;
  height: 120rem;
}

.tabbar {
  width: 100%;
  height: 100%;
  position: relative;
  background: #323838;
  border-radius: 24rem 24rem 0rem 0rem;

  &__list {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: space-around;
  }

  &__item {
    height: 100%;
    width: 100%;
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    font-size: 25rem;
    position: relative;
    color: #B3BEC1;

    &__icon {
      width: 36rem;
      height: 36rem;
      border-radius: 50%;
      transition: 0.5s;
      transition-delay: 0s;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    &__text {
      opacity: 1;
      white-space: nowrap;
      margin-top: 10rem;
    }
  }

  &__item--active {
    color: #24EE89;
  }
  &__placeholder {
    height: calc(110rem + env(safe-area-inset-bottom));
  }
}
</style>
