<script setup>
import ScrollRow from '@/components/scroll-row.vue'
import BaseTag from '@/components/base-tag.vue'
import BaseButton from '@/components/base-button.vue'
</script>

<template>
  <div class="new-games-container">
    <div class="txt">
      <h1 class="title">
        <span>最新游戏</span>
        <br />
        <span>发布</span>
      </h1>
      <img src="/svg/game-split.svg" class="split" alt="" />
      <div class="desc">
        最新、最火热的全新在线娱乐游戏热腾腾上架、就等你来一探究竟！
      </div>
    </div>

    <div class="scroll-view">
      <scroll-row reverse class="marquee">
        <div v-for="item in 10" :key="item" class="game-card">
          <div class="game-card-img">
            <img src="/images/scroll-game.png" alt="" />
          </div>
          <div class="game-card-body">
            <img src="/images/scroll-game.png" alt="" class="bg" />
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
                      <path
                        d="M11.95 8.9375H14.3093V13.5562H11.95V8.9375Z"
                        fill="white"
                      ></path>
                      <path
                        d="M8.18457 8.9375H10.5439V13.5562H8.18457V8.9375Z"
                        fill="white"
                      ></path>
                      <path
                        d="M4.4187 8.9375H6.7782V13.5562H4.4187V8.9375Z"
                        fill="white"
                      ></path>
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
                <span>雷神之锤</span>
              </div>
              <div class="desc">
                「雷神之锤在手，威力无穷」快来体验堆栈百搭疯狂赚的雷神之锤，大力锤出您的2000倍大赏！
              </div>
              <div class="action">
                <base-button type="primary">立即试玩</base-button>
                <base-button>了解更多</base-button>
              </div>
            </div>
          </div>
        </div>
      </scroll-row>
      <scroll-row class="marquee">
        <div v-for="item in 10" :key="item" class="game-card">
          <div class="game-card-img">
            <img src="/images/scroll-game.png" alt="" />
          </div>
          <div class="game-card-body">
            <img src="/images/scroll-game.png" alt="" class="bg" />
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
                      <path
                        d="M11.95 8.9375H14.3093V13.5562H11.95V8.9375Z"
                        fill="white"
                      ></path>
                      <path
                        d="M8.18457 8.9375H10.5439V13.5562H8.18457V8.9375Z"
                        fill="white"
                      ></path>
                      <path
                        d="M4.4187 8.9375H6.7782V13.5562H4.4187V8.9375Z"
                        fill="white"
                      ></path>
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
                <span>雷神之锤</span>
              </div>
              <div class="desc">
                「雷神之锤在手，威力无穷」快来体验堆栈百搭疯狂赚的雷神之锤，大力锤出您的2000倍大赏！
              </div>
              <div class="action">
                <base-button type="primary">立即试玩</base-button>
                <base-button>了解更多</base-button>
              </div>
            </div>
          </div>
        </div>
      </scroll-row>
      <scroll-row reverse class="marquee">
        <div v-for="item in 10" :key="item" class="game-card">
          <div class="game-card-img">
            <img src="/images/scroll-game.png" alt="" />
          </div>
          <div class="game-card-body">
            <img src="/images/scroll-game.png" alt="" class="bg" />
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
                      <path
                        d="M11.95 8.9375H14.3093V13.5562H11.95V8.9375Z"
                        fill="white"
                      ></path>
                      <path
                        d="M8.18457 8.9375H10.5439V13.5562H8.18457V8.9375Z"
                        fill="white"
                      ></path>
                      <path
                        d="M4.4187 8.9375H6.7782V13.5562H4.4187V8.9375Z"
                        fill="white"
                      ></path>
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
                <span>雷神之锤</span>
              </div>
              <div class="desc">
                「雷神之锤在手，威力无穷」快来体验堆栈百搭疯狂赚的雷神之锤，大力锤出您的2000倍大赏！
              </div>
              <div class="action">
                <base-button type="primary">立即试玩</base-button>
                <base-button>了解更多</base-button>
              </div>
            </div>
          </div>
        </div>
      </scroll-row>
    </div>

    <div class="footer">
      <a class="btn">
        <span>全部游戏</span>
      </a>
    </div>
  </div>
</template>

<style scoped lang="scss">
.new-games-container {
  width: 100%;
  padding-top: 146px;
  padding-bottom: 160px;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;

  .txt {
    max-width: 1320px;
    display: flex;
    justify-content: center;
    align-items: center;
    --bs-gutter-x: 1.5rem;
    --bs-gutter-y: 0;
    width: 100%;
    padding-right: calc(var(--bs-gutter-x) * 0.5);
    padding-left: calc(var(--bs-gutter-x) * 0.5);
    margin-right: auto;
    margin-left: auto;

    .title {
      font-size: 4.5rem;
      font-weight: 700;
      line-height: 1.2;
      position: relative;

      &::after {
        content: '';
        position: absolute;
        top: -120px;
        bottom: 0;
        right: 0;
        left: -70px;
        width: 150%;
        height: 200%;
        background: linear-gradient(90deg, #ffd200 0%, #ff2e3a 100%);
        opacity: 0.15;
        filter: blur(50px);
        z-index: -1;
        border: 1px solid red;
      }
    }

    .split {
      padding: 0 1rem;
      margin: 0 3rem;
    }

    .desc {
      font-size: 1.375rem;
      color: #fffc;
    }
  }

  .scroll-view {
    padding-top: 80px;

    .marquee {
      color: #fffc;

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
    }
  }

  .footer {
    width: 100%;
    text-align: center;

    .btn {
      display: inline-block;
      margin: 3rem auto 0;
      padding: 16px 58px;
      font-size: 1.2rem;
      position: relative;
      border: 1px solid transparent;
      background:
        linear-gradient(#1f1f1d 0 0) padding-box,
        linear-gradient(90deg, #ffd200 0%, #ff2e3a 100%) border-box;
      transition: all ease-in-out 0.3s;
      border-radius: var(--bs-btn-border-radius);
      cursor: pointer;

      span {
        position: relative;
        z-index: 2;
      }

      &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background:
          linear-gradient(90deg, #ffd200 0%, #ff2e3a 100%) padding-box,
          linear-gradient(90deg, #ffd200 0%, #ff2e3a 100%) border-box;
        border-radius: var(--bs-btn-border-radius);
        opacity: 0;
        transition: all ease-in-out 0.3s;
      }

      &:hover {
        box-shadow: 0 0 16px #ff8708;
        &::after {
          opacity: 1;
        }
      }
    }
  }
}
</style>
