<script setup lang="ts">
import { reactive } from 'vue'

export interface DataItem {
  id: string | number
  imgUrl: string
  [key: string]: any
}

export interface CategoryItem {
  id: string | number
  name: string
  icon: string
}

interface Emits {
  (e: 'change', id: string | number): void
  (e: 'click-more', id: string | number): void
  (e: 'click-item', item: DataItem): void
}

interface Props {
  data: DataItem[]
  categoryList: CategoryItem[]
  defaultSelectIndex?: number
  showMore?: boolean
}

interface Slots {
  list: (props: { row: { data: DataItem[]; categoryList: CategoryItem[]; className: string } }) => any
}

const emit = defineEmits<Emits>()

const props = withDefaults(defineProps<Props>(), {
  defaultSelectIndex: 0,
  showMore: false
})

defineSlots<Slots>()

const conf = reactive({
  currentCategoryId: props.categoryList[props.defaultSelectIndex].id,

  handleSelectCategory: (id: string | number) => {
    if (id === conf.currentCategoryId) return
    conf.currentCategoryId = id
    emit('change', id)
  }
})
</script>

<template>
  <div class="category-block-container">
    <div class="category-side-list">
      <div
        v-for="category in categoryList"
        :key="category.id"
        class="category-side-item"
        :class="{ active: conf.currentCategoryId === category.id }"
        @click="conf.handleSelectCategory(category.id)"
      >
        <div class="category-side-item-icon">
          <div
            class="rotate-circle"
            :class="{
              playing: conf.currentCategoryId === category.id
            }"
          />
          <VSIcon lib="blue" :name="category.icon" :size="64" />
        </div>
        <span>{{ category.name }}</span>
      </div>
    </div>
    <div class="category-main-list">
      <template v-if="!$slots.list">
        <div v-for="item in data" :key="item.id" class="category-main-item" @click="emit('click-item', item)">
          <x-load-img :src="item.imgUrl" />
        </div>
      </template>
      <slot v-else name="list" :row="{ data, categoryList, className: 'category-main-item' }" />
      <div
        v-if="showMore"
        class="category-main-more van-haptics-feedback"
        @click="emit('click-more', conf.currentCategoryId)"
      >
        {{ $t('home.morebig') }}
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.category-block-container {
  width: 100%;
  height: 850rem;
  display: flex;
  gap: 20rem;

  .category-side-list {
    min-width: 108rem;
    height: 828rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12rem;
    overflow-x: hidden;
    overflow-y: auto;

    .category-side-item {
      width: 100%;
      min-height: 128rem;
      border-radius: 16rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border: 1rem solid #e2e6ec;
      box-shadow: 0px 2px 6px 0px #0000001a;
      background-color: #ffffff;
      background-size: 100% 350%;
      transition: all 0.5s;
      color: #7f8ca4;
      position: relative;
      overflow: hidden;

      &::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0);
        width: 200rem;
        height: 200rem;
        background: linear-gradient(112.71deg, #296aed 4.28%, #0a45cf 67.56%);
        z-index: 1;
        transition: transform 0.25s;
        border-radius: 50%;
      }

      &.active {
        color: #ffffff;

        &::after {
          transform: translate(-50%, -50%) scale(1);
        }
      }

      &-icon {
        width: 64rem;
        height: 64rem;
        margin-bottom: 8rem;
        position: relative;
        z-index: 2;

        @keyframes rotate {
          100% {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }

        .rotate-circle {
          width: 44rem;
          height: 44rem;
          border-radius: 50%;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: rotate 2s linear infinite;
          animation-play-state: paused;

          &.playing {
            animation-play-state: running;
          }

          &::before {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            width: 8rem;
            height: 8rem;
            background: linear-gradient(146.31deg, #2ec9ff 17.5%, #26a6ff 82.5%);
            border-radius: 50%;
          }
        }
      }

      span {
        font-family: PingFang SC;
        font-size: 18rem;
        text-align: center;
        letter-spacing: -0.4rem;
        position: relative;
        z-index: 2;
      }
    }
  }

  .category-main-list {
    width: 100%;
    height: 100%;
    display: grid;
    align-content: start;
    grid-template-columns: repeat(2, 1fr);
    gap: 20rem;
    overflow-y: auto;
    position: relative;

    &::after {
      content: '';
      position: sticky;
      bottom: -10rem;
      left: 0;
      width: 100%;
      height: 25rem;
      grid-column: 1 / 3;
      background: linear-gradient(to top, #ffffff 0%, #ffffff80 50%, transparent 100%);
      z-index: 1;
    }

    .category-main-item,
    :slotted(.category-main-item) {
      width: 270rem;
      height: 176rem;
      border-radius: 12rem;
      overflow: hidden;
    }

    .category-main-more {
      width: 100%;
      height: 76rem;
      border-radius: 12rem;
      background-color: #ffffff;
      box-shadow: 1.61px 1.61px 3.23px 0px #0000001a;
      font-family: PingFang SC;
      font-size: 22rem;
      font-weight: 600;
      text-align: center;
      line-height: 76rem;
      color: #000000;
      grid-column: 1 / 3;
    }
  }
}
</style>
