<template>
  <x-page :headerBgColor="stheme.theme.blue.headerBgColor()">
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
              <VSIcon v-if="item.id == conf.language" class="select-img" lib="blue" name="j-blue" :size="20" />
            </div>
          </div>
        </div>
      </div>
      <div v-else-if="conf.popup.type == 'theme'" class="lang-select">
        <div class="select-title">
          <span>{{ $t('me.Theme') }}</span>
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
              <VSIcon v-if="item.id == conf.currentTheme" lib="blue" name="j-blue" :size="20" />
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
import i18n from '@/lang'
import sconfig from '@/sstore/sconfig'
import { stheme } from '@/sstore/stheme'
import System from '@/utils/System'
import { reactive } from 'vue'

const conf = reactive({
  language: Cookie.get('language') || 'en-us',
  menu1: [
    [
      {
        name: 'me.Password',
        new: false,
        url: '/user/Password/Change',
        isShow: () => sconfig.userInfo
      },
      {
        name: 'me.Theme',
        new: false,
        func: () => {
          conf.popup.open('theme')
        },
        isShow: true
      },
      {
        name: 'me.Languages',
        new: false,
        func: () => {
          conf.popup.open('lang')
        },
        isShow: true
      },
      {
        name: 'me.AboutUs',
        new: false,
        url: '/user/about/about',
        isShow: true
      }
    ],
    [
      {
        name: 'me.logOut',
        new: false,
        func: () => {
          conf.outPopup = true
        },
        isShow: () => sconfig.userInfo
      }
    ]
  ],
  langArr: [
    {
      name: 'English',
      id: 'en-us'
    },
    {
      name: 'हिंदी',
      id: 'hi-IN'
    },
    {
      name: 'ภาษาไทย',
      id: 'th-TH'
    },
    {
      name: 'Indonesia',
      id: 'id-ID'
    },
    {
      name: 'Português',
      id: 'pt-PT'
    },
    {
      name: 'Español',
      id: 'es-ES'
    }
  ],
  currentTheme: Cookie.get('pageTheme') || '',
  themeArr: [
    {
      name: 'me.defaultTheme',
      id: '',
      bg: '#FFF2E9',
      color: '#FF7502'
    },
    {
      name: 'me.blueTheme',
      id: 'blue',
      bg: '#E6F2FF',
      color: '#006FFF'
    }
  ],
  popup: {
    type: 'lang' as 'theme' | 'lang',
    show: false,
    data: [] as any[],
    open: (type: 'theme' | 'lang') => {
      conf.popup.type = type
      conf.popup.data = type == 'theme' ? conf.themeArr : conf.langArr
      conf.popup.show = true
    },
    close: () => {
      conf.popup.show = false
    }
  },
  outPopup: false,
  total_money: 0,
  handle(item: any) {
    item.url && System.router.push(item.url)
    item.func && item.func()
  },
  async changeLang(item: any) {
    conf.language = item.id
    System.loading()
    await i18n.setLang(item.id)
    System.loading(false)
    conf.popup.close()
  },
  changeTheme(item: any) {
    System.setTheme(item.id)
    conf.popup.close()
  },
  async goOutLogin() {
    sconfig.logout()
    conf.outPopup = false
    conf.total_money = 0
    System.toast('out success', 'success')
    setTimeout(() => System.router.replace('/'), 2000)
  }
})
</script>

<style lang="less" scoped>
.menu-list {
  padding: 32rem;
  position: relative;
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
