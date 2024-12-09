<template>
  <div class="tarbar-foot">
    <div style="transform: translateY(-100%)">
      <div>
        <div class="tabbar row items-center">
          <div class="row fit-width">
            <template v-for="item in conf.tabbar">
              <div
                class="col row flex-center"
                @click="conf.clickItem(item)"
                :class="[{ 'tabbar-item-active': item.name === conf.activeItem.name }]"
              >
                <div class="column flex-center">
                  <div class="flex items-center">
                    <VSIcon :name="`${item.name == conf.activeItem.name ? item.iconActive : item.icon}`" :size="44" />
                  </div>
                  <div class="tabbar-item-text">
                    {{ item.name }}
                  </div>
                </div>
              </div>
            </template>
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
    default: [] as { path: string; icon: string; iconActive: string; auth: boolean; index: number; name: string }[]
  }
})
const emit = defineEmits(['change'])

const conf = reactive({
  tabbar: props.list,
  clickItem(item: any) {
    emit('change', item)
  },
  activeItem: {} as any,
  setActiveItem: (path: string = System.getRouterPath()) => {
    let _findItem: any = conf.tabbar.find((item: any) => item.path == path)
    if (!_findItem) return
    conf.activeItem = _findItem
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
  position: relative;
  width: 100%;
  height: 112rem;
  background-color: #efefef;
  border-top: 1rem solid #d3d3d3;

  .tabbar-item-text {
    color: #868686;
    white-space: nowrap;
    font-size: 20rem;
  }

  .tabbar-item-active {
    .tabbar-item-text {
      color: #07c261;
    }
  }
}
</style>
