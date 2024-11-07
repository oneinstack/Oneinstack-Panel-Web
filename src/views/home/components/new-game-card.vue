<script setup>
import BaseTag from '@/components/base-tag.vue'
import BaseButton from '@/components/base-button.vue'

const props = defineProps({
  data: {
    type: Object,
    required: true
  }
})
</script>

<template>
  <div class="game-card">
    <div class="game-card-img">
      <img :src="data.img" alt="" />
    </div>
    <div class="game-card-body">
      <img :src="data.img" alt="" class="bg" />
      <div class="info">
        <div class="tag">
          <base-tag type="new">NEW</base-tag>
          <base-tag type="hot">HOT</base-tag>
        </div>
        <div class="name">
          <div class="game-type-icon">
            <svg
              data-v-0ff4bdce=""
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
          <span>{{ data.name }}</span>
        </div>
        <div class="desc">
          {{ data.desc }}
        </div>
        <div class="action">
          <base-button v-if="data.isSupportTry" type="primary" @click="$emit('click-play', data)">立即试玩</base-button>
          <base-button v-else>敬请期待</base-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.game-card {
  padding: 59px 24px;
  display: flex;
  align-items: center;
  position: relative;
  cursor: pointer;

  &-img {
    position: absolute;
    width: 330px;
    height: 330px;
    z-index: 2;

    img {
      width: 100%;
      max-width: 100%;
      height: auto;
      object-fit: cover;
    }
  }

  &-body {
    width: 632px;
    padding: 20px 32px 20px 202px;
    box-shadow:
      0 0 2px #ffffff3d,
      0 0 16px #0000007a;
    border-radius: 8px;
    margin-left: 180px;
    position: relative;
    overflow: hidden;
    display: flex;

    .bg {
      position: absolute;
      transform: translateY(-50%);
      top: 50%;
      right: 20px;
      width: 360px;
      height: 360px;
      background-repeat: no-repeat;
      background-position: center center;
      background-size: cover;
      filter: blur(2px) grayscale(1);
      opacity: 0.2;
      z-index: 0;
    }

    .tag {
      .base-tag {
        margin-right: 5px;
      }
    }

    .name {
      display: flex;
      align-items: center;
      margin: 12px 0;
      font-size: 1.5rem;
      font-weight: 700;
      line-height: 1.2;

      .game-type-icon {
        width: 36px;
        height: 36px;
        background: rgba(255, 255, 255, 0.24);
        border-radius: 4px;
        text-align: center;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-right: 8px;
      }
    }

    .desc {
      overflow: hidden;
      display: -webkit-box;
      text-overflow: ellipsis;
      line-clamp: 2;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .action {
      margin-top: 20px;
      display: flex;
      justify-content: center;
      gap: 0.5rem;
    }
  }
}
</style>
