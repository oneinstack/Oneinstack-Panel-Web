<script setup>
import { Scope } from 'tools-vue3'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const mconf = Scope.getConf()
const categories = mconf.categories
</script>

<template>
  <div class="type-games-container">
    <img src="/images/category-bg-1.png" alt="" class="category-bg-1" />
    <img src="/images/category-bg-2.png" alt="" class="category-bg-2" />
    <img src="/images/category-bg-3.png" alt="" class="category-bg-3" />
    <img src="/images/category-bg-4.png" alt="" class="category-bg-4" />
    <img src="/images/category-bg-5.png" alt="" class="category-bg-5" />
    <div class="title">
      <h1 class="type-games-title">{{ t('gameTypes') }}</h1>
      <h2 class="type-games-subtitle">
        {{ t('gameTypesDesc') }}
      </h2>
    </div>
    <ul class="categories">
      <img src="/svg/game-split.svg" alt="" class="split-img" />
      <li
        v-for="item in categories"
        :key="item.id"
        class="categories-item"
        :style="{ borderColor: item.color }"
        @click="$router.push(item.link)"
      >
        <div class="bg" :style="{ backgroundImage: `url(${item.img})` }" />
        <div>
          <div class="index" :style="{ color: item.color }">
            <span>{{ item.index.toString().padStart(2, '0') }}</span>
          </div>
          <h3 class="name">
            {{ item.name }}
          </h3>
        </div>
        <div class="game-num">
          <div class="value">{{ item.number }}</div>
          <div class="label">{{ t('games') }}</div>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
.type-games-container {
  padding: 160px 0;
  background-image: url('/images/game-type-bg.png');
  background-position: center center;
  background-size: cover;
  position: relative;

  .category-bg-1 {
    position: absolute;
    right: 0;
    top: 0;
  }

  .category-bg-2 {
    position: absolute;
    left: 0;
    top: 0;
  }

  .category-bg-3 {
    position: absolute;
    right: 0;
    top: 160px;
  }

  .category-bg-4 {
    position: absolute;
    top: 205px;
    left: 25%;
  }

  .category-bg-5 {
    position: absolute;
    top: 200px;
    left: 0;
  }

  .title,
  .categories {
    max-width: 1320px;
    --bs-gutter-x: 1.5rem;
    --bs-gutter-y: 0;
    width: 100%;
    padding-right: calc(var(--bs-gutter-x) * 0.5);
    padding-left: calc(var(--bs-gutter-x) * 0.5);
    margin-right: auto;
    margin-left: auto;
  }

  .title {
    display: flex;
    justify-content: center;
    width: 40%;
    display: flex;
    flex-wrap: wrap;
    padding-right: calc(var(--bs-gutter-x) * 0.5);
    padding-left: calc(var(--bs-gutter-x) * 0.5);
    margin-top: var(--bs-gutter-y);
  }

  .type-games-title {
    font-size: 72px;
    margin-bottom: 1.5rem;
    margin-top: 0;
    font-weight: 700;
    line-height: 1.2;
    text-align: center;
  }

  .type-games-subtitle {
    font-size: 22px;
    color: #fffc;
    text-align: center;
  }

  .categories {
    display: flex;
    margin-top: 110px;
    gap: 0 24px;
    position: relative;

    .split-img {
      position: absolute;
      top: -45px;
      left: 50%;
      transform: translate(-50%);
      z-index: -1;
    }

    &-item {
      border-bottom: 10px solid;
      display: flex;
      justify-content: space-between;
      flex: 1;
      flex-flow: column nowrap;
      border-radius: 8px;
      padding: 24px 24px 16px;
      overflow: hidden;
      height: 575px;
      position: relative;
      cursor: pointer;

      &:hover {
        transform: translateY(-50px);
        transition: all ease-in-out 0.5s;

        .bg {
          filter: grayscale(0);
        }

        .name,
        .game-num > .value {
          transform: scale(1.1);
          transition: all ease-in-out 0.5s;
        }
      }

      .bg {
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        filter: grayscale(1);
        z-index: -1;
        background-repeat: no-repeat;
        background-position: center center;
        background-size: cover;
        transition: all ease-in-out 0.5s;
      }

      .index {
        font-size: 1rem;
        position: relative;

        &::after {
          content: '';
          position: absolute;
          transform: translate(-50%, -50%);
          top: 50%;
          left: 53px;
          width: 48px;
          height: 1px;
          background: #ffffff;
        }
      }

      .name {
        font-size: 2rem;
        margin-top: 0;
        margin-bottom: 0.5rem;
        font-weight: 700;
        line-height: 1.2;
      }

      .game-num {
        text-align: center;

        .value {
          font-weight: 800;
          font-size: 56px;
          margin-bottom: -12px;
        }

        .label {
          font-size: 1rem;
          color: #fffc;
        }
      }
    }
  }
}
</style>
