<template>
  <div class="tarbar-foot">
    <div style="transform: translateY(-100%)">
      <div>
        <div class="tabbar">
          <div
            class="tabbar__bg"
            :style="{
              'background-position-x': `${conf.bgPositionX}rem`
            }"
          ></div>
          <div class="tabbar__list">
            <div v-for="(item, index) in conf.tabbar" :key="index">
              <div
                :id="`tabbar_item_${index}`"
                class="tabbar__item"
                @click="conf.clickItem(item)"
              >
                <div class="tabbar__item__icon">
                  <img
                    :class="{ 'img': index == conf.currentTabbarIndex }"
                    :src="`${index == conf.currentTabbarIndex ? item.iconActive : item.icon}`"
                  />
                  <!-- <v-s-icon :name="item.icon" :size="48" /> -->
                  <p class="name" :class="`${index == conf.currentTabbarIndex ? 'tabbar__item_icon_active_name' : ''}`">{{ $t(item.name) }}</p>
                </div>
              </div>
            </div>
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
    default: [] as { path: string; icon: string; iconActive: string; auth: boolean; index: number;name:string }[]
  }
})
const emit = defineEmits(['change'])

console.log('props.list',props.list)

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
  height: 0rem;
  bottom: 0;
  width: 750rem;
  margin: 0 auto;
  z-index: 100;
}
.tabbar {
  width: 100%;
  // height: 166rem;
  height:138rem;
  // left: 0;
  background-color: transparent;
  position: relative;
  &__bg {
    position: absolute;
    top: -65rem;
    z-index: -1;
    left: 0;
    width: 100%;
    height: 618rem;
    background: url('/static/img/tabbar.svg') no-repeat;
    background-size: 2370rem 618rem;
    transition: 0.3s;
    pointer-events: none;
  }

  &__list {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: space-around;
    background:#ffffff;
  }

  &__item {
    height: 100%;
    width: 100%;
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 27rem;
    position: relative;

    .tabbar__item__text {
      opacity: 1;
      color: #000;
      white-space: nowrap;
    }

    .tabbar__item__icon {
      top: 20%;

      img {
        width: 48rem;
        height: 48rem;
        pointer-events: none;
      }
    }

    .img {
      width: 48rem;
      height: 48rem;
    }

    &--active {
      .tabbar__item__icon {
        background: #ffffff;
        transform: translateY(-64rem);
        box-shadow: 0rem -4rem 20rem 0rem #00000014;
      }

      .tabbar__item__text {
        color: #f68740;
      }
    }

    &__icon {
      // font-size: 56rem;
      width: 106rem;
      height: 106rem;
      border-radius: 50%;
      transition: 0.5s;
      transition-delay: 0s;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      .name{
        font-size: 20rem;
      }
      .tabbar__item_icon_active_name{
        color:var(--primary-color);
      }
    }

    &__text {
      position: absolute;
      left: 0;
      right: 0;
      bottom: calc(10rem + env(safe-area-inset-bottom));
      transition: 0.5s;
      opacity: 0;
    }
  }

  &__select-active-bg {
    position: absolute;
    width: 100rem;
    height: 100rem;
    border-radius: 50%;
    background-color: #ffffff;
    z-index: -1;
    box-shadow:
      0rem 10rem 30rem rgba(70, 23, 129, 0.07),
      0rem -8rem 40rem rgba(255, 255, 255, 0.07),
      inset 0rem -10rem 10rem rgba(70, 23, 129, 0.07),
      inset 0rem 10rem 20rem rgba(255, 255, 255, 1);

    &--hide {
      top: calc(110rem + 50rem);
    }

    &--show {
      top: -54rem;
    }
  }

  &__placeholder {
    height: calc(110rem + env(safe-area-inset-bottom));
  }

  .tabbar__list :nth-child(2) {
    img {
      width: 48rem;
      height: 48rem;
    }
  }

  .tabbar__list :nth-child(3) {
    img {
      width: 56rem;
      height: 56rem;
    }
  }
}
</style>
