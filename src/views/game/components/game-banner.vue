<script setup>
import { Vue3Marquee } from 'vue3-marquee'
import BaseTag from '@/components/base-tag.vue'
import BaseButton from '@/components/base-button.vue'

const gameType = [
  {
    id: 1,
    name: '全部游戏',
    link: '',
  },
  {
    id: 2,
    name: '老虎机',
    link: '',
  },
  {
    id: 3,
    name: '捕鱼机',
    link: '',
  },
  {
    id: 4,
    name: '街机',
    link: '',
  },
  {
    id: 5,
    name: '棋牌',
    link: '',
  },
  {
    id: 6,
    name: '宾果',
    link: '',
  },
]

const marqueeList = Array.from({ length: 5 }, (_, i) => ({
  id: i,
  name: '财神驾到',
  desc: 'JDB首款中國風跑灯押分机游戏！',
  type: '',
  img: '/images/game-marquee.jpg',
  smallImg: '/images/marquee-label.png',
}))
</script>

<template>
  <div class="game-banner-container">
    <div class="container">
      <div class="row justify-content-center game-t">
        <h1 class="title">游戏</h1>
        <p class="text">
          多样化在线娱乐解决方案，打鱼机、角子机、棋牌游戏、宾果等，满足各种需求，给你最刺激又难忘的游戏体验！
        </p>
      </div>
      <div class="row justify-content-center game-select">
        <ul class="game-select-nav">
          <li
            v-for="item in gameType"
            :key="item.id"
            class="game-select-nav-item"
          >
            <router-link :to="item.link" class="game-select-nav-link">
              <span>{{ item.name }}</span>
            </router-link>
          </li>
        </ul>
      </div>
    </div>
    <div class="game-marquee">
      <h2 class="game-marquee-title"><span>热门游戏</span></h2>
      <div class="game-marquee-list">
        <vue3-marquee pause-on-hover :duration="30">
          <div
            v-for="item in marqueeList"
            :key="item.id"
            class="game-marquee-card"
          >
            <div class="card-img">
              <img :src="item.img" alt="marquee-img" />
            </div>
            <div class="card-mask">
              <base-button type="primary">
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
                <span>立即试玩</span></base-button
              >
            </div>
            <div class="card-content">
              <div class="row">
                <div class="tag">
                  <base-tag type="new">NEW</base-tag>
                  <base-tag type="hot">HOT</base-tag>
                </div>
                <div class="name">
                  <div class="icon">
                    <svg
                      data-v-12c6513b=""
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      preserveAspectRatio="xMidYMid meet"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M13.3892 8.07076C13.9839 13.4799 14.2427 15.8695 14.3548 16.8842H9.64544L10.618 8.07076C9.1975 7.52145 8.19348 6.13942 8.19348 4.52649C8.19348 2.42372 9.89726 0.716309 12.0035 0.716309C14.1064 0.716309 15.8103 2.42372 15.8103 4.52649C15.8103 6.13942 14.8061 7.51795 13.3892 8.07076Z"
                        fill="white"
                      ></path>
                      <path
                        d="M19.2776 17.5839H18.032V16.7694C18.032 16.3147 17.6681 15.9087 17.1713 15.9087C16.6919 15.9087 16.3072 16.2935 16.3072 16.7694V17.5839H7.69314V16.7694C7.69314 16.2936 7.30926 15.9087 6.83245 15.9087C6.35666 15.9087 5.97177 16.2935 5.97177 16.7694V17.5839H4.72259C4.03684 17.5839 3.48059 18.1402 3.48059 18.8259V19.6377H20.5197V18.8259C20.5197 18.1402 19.9633 17.5839 19.2776 17.5839Z"
                        fill="white"
                      ></path>
                      <path
                        d="M22.129 21.9468V23.2834H1.87109V21.9468C1.87109 21.0582 2.59186 20.3374 3.48399 20.3374H20.5197C21.4084 20.3374 22.129 21.0582 22.129 21.9468Z"
                        fill="white"
                      ></path>
                    </svg>
                  </div>
                  <h4>{{ item.name }}</h4>
                </div>
                <div class="text">{{ item.desc }}</div>
              </div>
            </div>
            <img :src="item.smallImg" alt="" class="small-img" />
          </div>
        </vue3-marquee>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.game-banner-container {
  padding: 80px 0 0;
  background: url('/images/game-banner-bg.png') top center no-repeat;
  background-size: cover;

  @media (min-width: 768px) {
    .game-banner-container {
      padding: 120px 0 0;
    }
  }

  .container {
    padding: 0 15%;
    max-width: 1320px;
    position: relative;
  }

  .game-t {
    .title {
      font-size: 72px;
      margin: 0 0 32px;
      text-align: center;
      font-weight: 700;
      line-height: 1.2;
    }

    .text {
      font-size: 22px;
      margin: 0 0 64px;
      text-align: center;
      color: #fffc;
    }
  }

  .game-select {
    &-nav {
      padding: 8px 32px;
      margin: 0 0 80px;
      background: rgba(255, 255, 255, 0.24);
      border-radius: 999px;
      display: flex;
      justify-content: center;

      &-link {
        padding: 8px 32px;
        color: #fff;
        font-size: 18px;
        font-weight: 600;
        border-radius: 999px;
        display: block;
        text-decoration: none;
        background: none;
        border: 0;
        transition:
          color 0.15s ease-in-out,
          background-color 0.15s ease-in-out,
          border-color 0.15s ease-in-out;

        &:hover {
          background: rgba(255, 255, 255, 0.24);
        }

        &.active {
          color: #ff8708;
          background-color: transparent;
        }
      }
    }
  }

  .game-marquee {
    padding: 0 0 80px;
    position: relative;

    &-title {
      font-size: 48px;
      margin: 0 0 64px;
      text-align: center;
      font-weight: 700;
      line-height: 1.2;

      span {
        background-image: linear-gradient(90deg, #ffd200 0%, #ff2e3a 100%);
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
    }

    &-card {
      width: 650px;
      border-radius: 8px;
      margin: 0 24px 0 0;
      position: relative;
      overflow: hidden;

      &:hover {
        .card-mask {
          opacity: 1;
        }

        .card-content {
          bottom: 0;
        }
      }
    }

    .card-img {
      position: relative;
      aspect-ratio: 128 / 45;
      width: 100%;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .card-mask {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      transition: all ease-in-out 0.3s;
      background: rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;

      .svg-inline--fa {
        height: 1em;
        vertical-align: -0.125em;
        margin-right: 0.5rem;
      }
    }

    .card-block {
      width: 100%;
      height: 110px;
    }

    .card-content {
      background-color: #1f1f1d;
      padding: 20px;
      bottom: -45px;
      left: 0;
      width: 100%;
      transition: all ease-in-out 0.3s;

      .tag {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1rem;
        flex-wrap: wrap;
      }

      .name {
        font-size: 24px;
        font-weight: 700;
        line-height: 1.2;
        margin-bottom: 1rem;
        margin-top: auto;
        display: flex;
        position: relative;
        align-items: center;

        .icon {
          width: 36px;
          min-width: 36px;
          height: 36px;
          background: #555553;
          border-radius: 4px;
          margin: 0 12px 0 0;
          display: flex;
          align-items: center;
          justify-content: center;

          svg {
            height: 24px;
            width: 24px;
            vertical-align: middle;
          }
        }
      }

      .desc {
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        line-clamp: 1;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
        color: #fffc;
      }
    }

    .small-img {
      position: absolute;
      right: 42px;
      bottom: 20px;
      height: auto;
      max-width: 180px;
      transition: all ease-in-out 0.3s;
    }
  }
}
</style>
