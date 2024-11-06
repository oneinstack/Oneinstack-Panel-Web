<script setup>
import NavBar from '@/components/nav-bar.vue'
import BaseFooter from '@/components/base-footer.vue'
import BaseModal from '@/components/base-modal.vue'
import { onMounted, ref } from 'vue'

const show = ref(false)

onMounted(() => {})
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
          <li><router-link to="/game/list" class="link">游戏</router-link></li>
          <li><router-link to="/about" class="link">关于我们</router-link></li>
        </ul>
      </template>
      <template #right>
        <div class="right">
          <div class="search">
            <svg
              class="img"
              aria-hidden="true"
              focusable="false"
              data-prefix="fas"
              data-icon="magnifying-glass"
              role="img"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
            >
              <path
                class=""
                fill="currentColor"
                d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"
              ></path>
            </svg>
            <span>搜寻</span>
          </div>
          <div class="lang">CN</div>
        </div>
      </template>
    </nav-bar>

    <router-view #default="{ Component }" class="main">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>

    <base-footer />

    <base-modal v-model="show" />
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
}
</style>
