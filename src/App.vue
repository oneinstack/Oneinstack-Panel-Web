<script setup>
import NavBar from '@/components/nav-bar.vue'
import BaseFooter from '@/components/base-footer.vue'
import BaseModal from '@/components/base-modal.vue'
import BaseButton from '@/components/base-button.vue'
import { onMounted, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const route = useRoute()
http.setConfig({
  base: 'http://192.168.31.60'
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

onMounted(() => {
  const ageRestriction = localStorage.getItem('age-restriction')
  if (!ageRestriction) modal.show = true
})
</script>

<template>
  <div class="app-container">
    <nav-bar>
      <template #left>
        <router-link to="/" class="logo-box">
          <img src="/images/BG.png" alt="" class="img" />
        </router-link>
      </template>
      <template #center>
        <ul class="nav-list">
          <li>
            <router-link to="/game/list" class="link" :class="{ active: route.path === '/game/list' }">
              {{ t('game') }}
            </router-link>
          </li>
          <li>
            <router-link to="/about" class="link" :class="{ active: route.path === '/about' }">
              {{ t('about') }}
            </router-link>
          </li>
        </ul>
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

    <router-view #default="{ Component }" class="main">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>

    <base-footer />

    <base-modal v-model="modal.show">
      <div class="modal-content">
        <h1 class="title">欢迎来到BG。</h1>
        <p>
          我们非常重视社会责任，并确保您的安全和娱乐享受是我们的首要任务。因此，我们诚挚地要求您进行年龄验证。
          <span class="question">您年满18岁吗?</span>
        </p>
        <p v-show="modal.tips" class="tips">
          <span>本网站仅限18岁及以上的用户访问。</span>
          <br />
          <span>请确认您已年满18岁，方可继续访问。</span>
        </p>
        <div class="btn">
          <base-button @click="modal.cancel">尚未</base-button>
          <base-button type="primary" @click="modal.confirm">我已年满18岁</base-button>
        </div>
      </div>
    </base-modal>
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
</style>
