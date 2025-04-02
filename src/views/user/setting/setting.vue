<template>
  <x-page>
    <template #title>
      {{ $t('me.setting') }}
    </template>
    <div class="menu-list">
      <div
        v-for="(category, index) in conf.menu1"
        :key="index"
        class="menu-item"
        :style="index === conf.menu1.length - 1 && { marginTop: '32rem' }"
      >
        <div v-for="item of category" :key="item.name">
          <van-cell
            is-link
            @click="conf.handle(item)"
            v-if="typeof item.isShow === 'function' ? item.isShow() : item.isShow"
          >
            <template #title>
              <span class="menu-item-title">{{ item.name.indexOf('me.') > -1 ? $t(item.name) : item.name }}</span>
            </template>
          </van-cell>
        </div>
      </div>
    </div>

    <!-- 多语言和主题弹框 -->
    <van-popup class="popup-bottom-center" v-model:show="conf.popup.show" position="bottom">
      <div v-if="conf.popup.type == 'lang'" class="lang-select">
        <div class="select-title">
          <span>{{ $t('me.switchLanguage') }}</span>
          <img class="close-img" src="/static/img/close.webp" @click="conf.popup.close" />
        </div>
        <div class="lang-list">
          <div v-for="item of conf.langArr" :key="item.id">
            <div class="lang-item" @click="conf.changeLang(item)">
              <div class="lang-left">
                <img class="left-img" :src="`/static/img/me/${item.id}.png`" />
                <span>{{ item.name }}</span>
              </div>
              <!-- <VSIcon v-if="item.id == conf.language" class="select-img" lib="blue" name="j-orange" :size="20" /> -->
            </div>
          </div>
        </div>
      </div>
      <div v-else-if="conf.popup.type == 'theme'" class="lang-select">
        <div class="select-title">
          <span>{{ $t('me.theme') }}</span>
          <img class="close-img" src="/static/img/close.webp" @click="conf.popup.close" />
        </div>
        <div class="lang-list">
          <div v-for="item of conf.themeArr" :key="item.id">
            <div
              class="lang-item"
              :style="item.id == conf.currentTheme && { backgroundColor: item.bg }"
              @click="conf.changeTheme(item)"
            >
              <div class="lang-left" :style="item.id == conf.currentTheme && { color: item.color }">
                <span>{{ $t(item.name) }}</span>
              </div>
              <!-- <VSIcon v-if="item.id == conf.currentTheme" lib="blue" name="j-orange" :size="20" /> -->
            </div>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 退出登录弹框 -->
    <van-popup class="popup-bottom-center" v-model:show="conf.outPopup" position="bottom">
      <div class="out-popup">
        <div class="out-line" @click="conf.goOutLogin">{{ $t('me.logOut') }}</div>
        <div style="height: 20rem; background: #f6f6f6"></div>
        <div class="out-line" @click="conf.outPopup = false">{{ $t('me.cancle') }}</div>
      </div>
    </van-popup>
  </x-page>
</template>

<script lang="ts" setup>
import { index } from './index'
const conf = index()
</script>

<style lang="less" scoped>
.menu-list {
  padding: 32rem;
  position: relative;
  background: var(--bg-color);
}

.menu-item {
  background: #fff;
  border-radius: 10rem;
  overflow: hidden;
}

.lang-select {
  background: #fff;
  padding: 40rem;

  .select-title {
    color: rgb(37, 37, 41);
    font-size: 30rem;
    font-weight: bold;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .close-img {
      width: 48rem;
      height: 48rem;
    }
  }

  .lang-list {
    margin-top: 24rem;

    .lang-item {
      margin-top: 24rem;
      padding: 24rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background-color: rgb(246, 247, 250);

      .lang-left {
        display: flex;
        align-items: center;
        color: #999999;

        .left-img {
          width: 45rem;
          height: 45rem;
          margin-right: 15rem;
        }
      }

      .select-img {
        width: 24rem;
        height: 24rem;
      }
    }
  }
}

.out-popup {
  font-size: 40rem;
  font-weight: 500;
  background: #ffffff;

  .out-line {
    line-height: 120rem;
    border-bottom: 1rem solid #eee;
    text-align: center;
  }
}
</style>
