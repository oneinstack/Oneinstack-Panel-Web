<template>
  <div class="tarbar-foot">
    <div style="transform: translateY(-100%)">
      <div>
        <div class="tabbar">
          <div class="tabbar__list">
            <div
              v-for="(item, index) in conf.tabbar"
              :key="index"
              :id="`tabbar_item_${index}`"
              class="tabbar__item"
              :class="{ 'tabbar__item--active': index == conf.currentTabbarIndex }"
              @click="conf.clickItem(item)"
            >
              <div class="tabbar__item__icon">
                <VSIcon lib="blue" :name="index == conf.currentTabbarIndex ? item.iconActive : item.icon" :size="88" />
              </div>
              <span class="tabbar__item__text">{{ item.text }}</span>
            </div>
          </div>
        </div>
        <x-navigationbar />
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
    default: [] as { path: string; icon: string; iconActive: string; auth: boolean; index: number; text: string }[]
  }
})
const emit = defineEmits(['change'])

const conf = reactive({
  currentTabbarIndex: null as number | null,
  tabbar: props.list,
  clickItem(item: any) {
    emit('change', item)
  },
  setActiveItem: (path: string = System.getRouterPath()) => {
    let _findItem: any = conf.tabbar.find((item: any) => item.path == path)
    if (!_findItem) return
    conf.currentTabbarIndex = _findItem.index
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
  height: 0px;
  bottom: 0;
  width: 750rem;
  margin: 0 auto;
  z-index: 100;
}
.tabbar {
  width: 100%;
  height: 166rem;
  // left: 0;
  background-color: #ffffff;
  position: relative;
  box-shadow: 0px -2px 6px 0px #0000000d;

  &__list {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: space-around;

    .tabbar__item {
      height: 100%;
      display: flex;
      flex-flow: column nowrap;
      justify-content: flex-start;
      align-items: center;
      position: relative;

      &__icon {
        width: 88rem;
        height: 88rem;
      }

      &__text {
        position: absolute;
        top: 50%;
        transition: color 0.25s;
      }
    }

    .tabbar__item--active {
      .tabbar__item__text {
        color: #006fff;
      }
    }
  }
}
</style>
