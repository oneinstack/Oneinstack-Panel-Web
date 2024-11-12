<script setup>
import NavBar from '@/components/nav-bar.vue'
import BaseFooter from '@/components/base-footer.vue'
import BaseModal from '@/components/base-modal.vue'
import BaseButton from '@/components/base-button.vue'
import { onMounted, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import BackTop from '@/components/back-top.vue'

const { t } = useI18n()

const route = useRoute()
http.setConfig({
  base: '/'
})

const modal = reactive({
  show: false,
  tips: false,
  confirm: () => {
    localStorage.setItem('age-restriction', '1')
    modal.show = false
  },
  cancel: () => {
    modal.tips = true
  }
})

const search = reactive({
  show: false,
  keywords: '',
  close: () => {
    search.keywords = ''
    search.show = false
  }
})

const nav = reactive({
  show: false,
  close: () => {
    nav.show = false
  },
  list: [
    {
      label: t('game'),
      path: '/game/list'
    },
    {
      label: t('about'),
      path: '/about'
    }
  ]
})

onMounted(() => {
  const ageRestriction = localStorage.getItem('age-restriction')
  if (!ageRestriction) modal.show = true
})
</script>

<template>
  <div class="app-container">
    <nav-bar>
      <template #left>
        <router-link to="/" class="logo-box" @click="nav.close">
          <img src="/images/BG.png" alt="" class="img" />
        </router-link>
      </template>
      <template #center>
        <ul class="nav-block">
          <li v-for="nav in nav.list" :key="nav.path">
            <router-link :to="nav.path" class="link" :class="{ active: route.path === nav.path }">
              {{ nav.label }}
            </router-link>
          </li>
        </ul>
      </template>
      <template #right>
        <button class="menu-btn" @click="nav.show = !nav.show">
          <svg
            class="svg-inline--fa fa-bars"
            aria-hidden="true"
            focusable="false"
            data-prefix="fas"
            data-icon="bars"
            role="img"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 448 512"
          >
            <path
              class=""
              fill="currentColor"
              d="M0 96C0 78.3 14.3 64 32 64H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32H416c17.7 0 32 14.3 32 32z"
            ></path>
          </svg>
          <span>MENU</span>
        </button>
      </template>
    </nav-bar>
    <div v-show="search.show" class="search-input row">
      <div class="input-box">
        <input v-model="search.value" type="text" class="input" />
        <button class="btn" @click="search.close">
          <svg
            class="svg-inline--fa fa-xmark"
            aria-hidden="true"
            focusable="false"
            data-prefix="fas"
            data-icon="xmark"
            role="img"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 384 512"
          >
            <path
              class=""
              fill="currentColor"
              d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"
            ></path>
          </svg>
        </button>
      </div>
    </div>

    <transition name="slide-bottom">
      <ul v-show="nav.show" class="nav-list" @click="nav.close">
        <li v-for="nav in nav.list" :key="nav.path">
          <router-link :to="nav.path" class="link" :class="{ active: route.path === nav.path }">
            {{ nav.label }}
          </router-link>
        </li>
      </ul>
    </transition>

    <router-view #default="{ Component }" class="main">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>

    <base-footer />

    <base-modal v-model="modal.show">
      <div class="modal-content">
        <h1 class="title">{{ t('welcome') }}</h1>
        <p>
          {{ t('welcomeDesc') }}
          <span class="question">{{ t('welcomeQuestion') }}</span>
        </p>
        <p v-show="modal.tips" class="tips">
          <span>{{ t('welcomeCacelTip1') }}</span>
          <br />
          <span>{{ t('welcomeCacelTip2') }}</span>
        </p>
        <div class="btn">
          <base-button @click="modal.cancel">{{ t('welcomeCancel') }}</base-button>
          <base-button type="primary" @click="modal.confirm">{{ t('welcomeOK') }}</base-button>
        </div>
      </div>
    </base-modal>

    <back-top />
  </div>
</template>

<style scoped lang="scss">
.app-container {
  .logo-box {
    .img {
      width: 83.2px;
      height: 41px;
    }
  }

  .nav-block,
  .nav-list {
    list-style: none;
    display: flex;
    align-items: center;

    li {
      padding: 24px;

      .link {
        display: block;
        padding: 0.5rem 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--bs-emphasis-color-rgb);
        text-decoration: none;
        background: none;
        border: 0;
        transition:
          color 0.15s ease-in-out,
          background-color 0.15s ease-in-out,
          border-color 0.15s ease-in-out;

        &.active {
          color: #ff8708;
        }

        &:hover {
          color: rgba(var(--bs-emphasis-color-rgb), 0.8);
        }
      }
    }
  }

  .nav-list {
    background-color: #080807;
    width: 100%;
    height: calc(100% - var(--nav-heaght));
    position: fixed;
    top: var(--nav-heaght);
    left: 0;
    z-index: 98;
    flex-flow: column nowrap;

    &::before {
      content: '';
      position: absolute;
      left: 50%;
      top: 0;
      transform: translateX(-50%);
      height: 1px;
      width: 90%;
      background-color: gray;
    }

    li {
      padding: 0;
    }

    .link {
      font-size: 24px !important;
      padding: 16px !important;
    }
  }

  .menu-btn {
    display: none;
    font-size: 18px;
    padding: 11px 15px;
    border: 1px solid rgba(255, 255, 255, 0.8);
    transition: 0.2s;
    border-radius: var(--bs-btn-border-radius);
    background: transparent;

    &:active {
      background-color: rgba(255, 255, 255, 0.48);
    }

    svg {
      margin-right: 0.25em;
      display: inline-block;
      height: 1em;
      vertical-align: -0.125em;
    }
  }

  .right {
    display: flex;
    align-items: center;
    font-size: 18px;
    color: #fff;

    .search {
      padding: 12px 20px;
      border: 1px solid rgba(255, 255, 255, 0.8);
      transition: 0.2s;
      cursor: pointer;
      display: flex;
      align-items: center;
      margin-right: 1em;
      border-radius: var(--bs-btn-border-radius);

      &:hover {
        background-color: rgba(255, 255, 255, 0.24);
      }

      .img {
        width: 18px;
        height: 18px;
        color: rgba(255, 255, 255, 0.8);
        margin-right: 0.5rem;
      }
    }

    .lang {
      font-weight: bold;
      position: relative;
      padding: 12px 20px;
      cursor: pointer;

      &::after {
        display: inline-block;
        margin-left: 0.255em;
        vertical-align: 0.255em;
        content: '';
        border-top: 0.3em solid;
        border-right: 0.3em solid transparent;
        border-bottom: 0;
        border-left: 0.3em solid transparent;
      }

      &:active {
        color: rgba(var(--bs-emphasis-color-rgb), 0.8);
      }
    }
  }

  .search-input {
    position: fixed;
    top: var(--nav-heaght);
    left: 0;
    width: 100%;
    background-color: #08080799;
    z-index: 88;
    display: flex;
    justify-content: center;

    .input-box {
      display: flex;
      padding: 1rem 0;
      height: 100%;
      position: relative;
      width: 50%;

      .input {
        display: block;
        width: 100%;
        padding: 0.375rem 0.75rem;
        font-size: 1rem;
        font-weight: 400;
        line-height: 1.5;
        color: #fff;
        background-color: unset;
        background-clip: padding-box;
        border: 1px solid rgba(255, 255, 255, 0.24);
        appearance: none;
        border-radius: 0;
        transition:
          border-color 0.15s ease-in-out,
          box-shadow 0.15s ease-in-out;
        border-width: 0 0 2px 0;
        margin: 0;

        &:focus {
          color: #fff;
          background-color: unset;
          border-color: #ff8708;
          outline: 0;
          box-shadow: unset;
        }
      }

      .btn {
        color: #fff;
        position: absolute;
        right: 0;
        bottom: 1rem;
        padding: 0.75em 1.25em;
        font-size: 1em;
        text-align: center;
        text-decoration: none;
        vertical-align: middle;
        user-select: none;
        border: 1px solid transparent;
        border-radius: 100px;
        background-color: transparent;
        transition:
          color 0.15s ease-in-out,
          background-color 0.15s ease-in-out,
          border-color 0.15s ease-in-out,
          box-shadow 0.15s ease-in-out;
        cursor: pointer;

        svg {
          height: 1em;
          vertical-align: -0.125em;
          color: #fff;
        }
      }
    }
  }
}

.modal-content {
  padding: 8%;
  line-height: 180%;
  background-repeat: no-repeat;
  background-size: auto;
  background-position: center center;
  background-image: url('/images/icon-18plus.png');
  box-shadow:
    0 0 2px #ffffff3d,
    0 0 16px #0000007a;
  text-align: center;

  .title {
    background: linear-gradient(90deg, #ffd200 0%, #ff2e3a 100%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 0;
    line-height: 1.5;
    font-size: 4.5rem;
    font-weight: 700;
    text-align: center;
  }

  .question {
    display: block;
    font-weight: 700;
    font-size: 2rem;
    margin-top: 1rem;
  }

  .tips {
    margin: 1rem 0;
    color: rgb(255, 135, 8);
  }

  .btn {
    margin-top: 2em;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;

    .base-button {
      flex: 0.5;
    }
  }
}

@media screen and (max-width: 768px) {
  .nav-block {
    display: none !important;
  }

  .menu-btn {
    display: block !important;
  }

  .main {
    padding-top: var(--nav-heaght);
  }

  .title {
    font-size: calc(1.575rem + 3.9vw) !important;
  }

  .question {
    font-size: calc(1.325rem + 0.9vw) !important;
  }
}
</style>
