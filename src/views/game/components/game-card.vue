<script setup>
import BaseButton from '@/components/base-button.vue'
import BaseTag from '@/components/base-tag.vue'
import { useI18n } from 'vue-i18n'

defineProps({
  data: {
    type: Object,
    required: true
  }
})

const { t } = useI18n()
</script>

<template>
  <div class="game-card-container">
    <div class="game-card-bg" :style="{ backgroundImage: `url(${data.bg})` }" />
    <div class="game-tags">
      <base-tag v-if="data.isNew" type="new">NEW</base-tag>
      <base-tag v-if="data.isHot">HOT</base-tag>
    </div>
    <div class="game-logo">
      <img :src="data.logo" class="img-fluid" alt="" />
    </div>
    <div class="game-name-row">
      <div class="game-type-icon">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          preserveAspectRatio="xMidYMid meet"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g clip-path="url(#clip0_1957_2748)">
            <path
              d="M18.0249 5.9248H0.703125C0.314758 5.9248 0 6.23975 0 6.62793V15.8654C0 16.2538 0.314758 16.5685 0.703125 16.5685H18.0249C18.4133 16.5685 18.728 16.2538 18.728 15.8654V6.62793C18.728 6.23975 18.4133 5.9248 18.0249 5.9248ZM15.7156 14.2592C15.7156 14.6476 15.4008 14.9623 15.0125 14.9623H3.71558C3.32739 14.9623 3.01245 14.6476 3.01245 14.2592V8.23431C3.01245 7.84595 3.32739 7.53119 3.71558 7.53119H15.0125C15.4008 7.53119 15.7156 7.84595 15.7156 8.23431V14.2592Z"
              fill="white"
            ></path>
            <path d="M11.95 8.9375H14.3093V13.5562H11.95V8.9375Z" fill="white"></path>
            <path d="M8.18457 8.9375H10.5439V13.5562H8.18457V8.9375Z" fill="white"></path>
            <path d="M4.4187 8.9375H6.7782V13.5562H4.4187V8.9375Z" fill="white"></path>
            <path
              d="M1.5061 23.2969C1.5061 23.6852 1.82104 24 2.20923 24H16.5186C16.9069 24 17.2217 23.6852 17.2217 23.2969V17.9751H1.5061V23.2969ZM11.9999 19.5813H13.5061C13.8945 19.5813 14.2092 19.8961 14.2092 20.2844C14.2092 20.6726 13.8945 20.9875 13.5061 20.9875H11.9999C11.6115 20.9875 11.2968 20.6726 11.2968 20.2844C11.2968 19.8961 11.6115 19.5813 11.9999 19.5813Z"
              fill="white"
            ></path>
            <path
              d="M17.2217 3.71558C17.2217 1.66681 15.5551 0 13.5061 0H5.22168C3.17291 0 1.5061 1.66681 1.5061 3.71558V4.51868H17.2217V3.71558Z"
              fill="white"
            ></path>
            <path
              d="M21.0875 6.50879V10.5437H20.1343V11.95H21.7906C22.1788 11.95 22.4938 11.6352 22.4938 11.2468V6.50879C22.2662 6.55383 22.0311 6.578 21.7906 6.578C21.55 6.578 21.3151 6.55383 21.0875 6.50879Z"
              fill="white"
            ></path>
            <path
              d="M21.7906 0.753174C20.5724 0.753174 19.5813 1.74432 19.5813 2.96252C19.5813 4.18073 20.5724 5.17188 21.7906 5.17188C23.0089 5.17188 24 4.18073 24 2.96252C24 1.74432 23.0089 0.753174 21.7906 0.753174Z"
              fill="white"
            ></path>
          </g>
          <defs>
            <clipPath id="clip0_1957_2748">
              <rect width="24" height="24" fill="white"></rect>
            </clipPath>
          </defs>
        </svg>
      </div>
      <h4>{{ data.name }}</h4>
    </div>
    <div v-if="data.isSupportTry" class="game-cover">
      <base-button type="primary" @click="$emit('click-play')">
        <svg
          data-v-12c6513b=""
          class="svg-inline--fa fa-play me-2"
          aria-hidden="true"
          focusable="false"
          data-prefix="fas"
          data-icon="play"
          role="img"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 384 512"
        >
          <path
            class=""
            fill="currentColor"
            d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80V432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z"
          ></path>
        </svg>
        <span>{{ t('tryNow') }}</span>
      </base-button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.game-card-container {
  padding: 24px 24px 32px;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 434px;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: transparent;
    z-index: 1;
  }

  .game-card-bg {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    z-index: 0;
    background-color: #0006;
    background-position: center center;
    background-repeat: no-repeat;
    background-blend-mode: overlay;
    filter: drop-shadow(0px 0px 2px rgba(255, 255, 255, 0.24)) drop-shadow(0px 0px 16px rgba(0, 0, 0, 0.48));
    background-size: cover;
    transition: all linear 0.3s;
  }

  .game-tags {
    margin: 0 0 32px;
    gap: 0.5rem;
    display: flex;
    flex-wrap: wrap;
    position: relative;
  }

  .game-logo {
    width: 258px;
    height: 258px;
    position: relative;
    margin: 0 auto 32px;
    transition: all linear 0.3s;

    .img-fluid {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .game-name-row {
    position: relative;
    margin-top: auto;
    display: flex;
    align-items: center;

    .game-type-icon {
      width: 36px;
      min-width: 36px;
      height: 36px;
      background: #555553;
      border-radius: 4px;
      margin: 0 12px 0 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    h4 {
      font-size: 24px;
      margin-top: 0;
      margin-bottom: 0;
      font-weight: 700;
      line-height: 1.2;
    }
  }

  &:hover {
    &:before {
      background: linear-gradient(360deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.1) 100%);
    }

    .game-card-bg {
      background-color: #0000001a;
      transform: scale(115%);
    }

    .game-logo {
      transform: scale(1.1);
    }

    .game-cover {
      opacity: 1;
    }
  }

  .game-cover {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    border-radius: 8px;
    background-color: #0000001a;
    opacity: 0;
    transition: all ease-in-out 0.3s;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;

    .svg-inline--fa {
      height: 1em;
      vertical-align: -0.125em;
      margin-right: 0.5rem;
    }
  }
}
</style>
