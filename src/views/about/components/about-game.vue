<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <div class="about-game-container">
    <div class="services">
      <div class="container">
        <h3 class="services-title">{{ t('gameFeatures') }}</h3>
        <div class="row services-items">
          <div class="services-item">
            <div class="desc">
              <div class="index">01</div>
              <div class="title">{{ t('allrounded') }}</div>
              <div class="text">
                {{ t('allroundedDesc') }}
              </div>
            </div>
            <div class="category">
              <img class="category-split-img" src="/images/game-slot.jpg" alt="" />
              <img class="category-split-img" src="/images/game-fish.jpg" alt="" />
              <img class="category-split-img" src="/images/game-arcade.jpg" alt="" />
              <img class="category-split-img" src="/images/game-card.jpg" alt="" />
              <img class="category-split-img" src="/images/game-bingo.jpg" alt="" />
            </div>
          </div>
          <div class="services-item">
            <div class="desc" style="order: 2">
              <div class="index">02</div>
              <div class="title">{{ t('classicGaming') }}</div>
              <div class="text">
                {{ t('classicGamingDesc') }}
              </div>
            </div>
            <div class="category">
              <img src="/images/services-2.png" alt="" />
            </div>
          </div>
          <div class="services-item">
            <div class="desc">
              <div class="index">03</div>
              <div class="title">{{ t('originalMasterpieces') }}</div>
              <div class="text">
                {{ t('originalMasterpiecesDesc') }}
              </div>
            </div>
            <div class="category">
              <img src="/images/services-3.png" alt="" />
            </div>
          </div>
          <div class="services-item">
            <div class="desc" style="order: 2">
              <div class="index">04</div>
              <div class="title">{{ t('localizedGameplay') }}</div>
              <div class="text">
                {{ t('localizedGameplayDesc') }}
              </div>
            </div>
            <div class="category">
              <img src="/images/services-4.png" alt="" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="features">
      <div class="container">
        <h3 class="features-title">{{ t('services') }}</h3>
        <div class="features-items">
          <div class="features-item">
            <div class="features-item-icon">
              <svg
                aria-hidden="true"
                focusable="false"
                data-prefix="fas"
                data-icon="webhook"
                role="img"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 576 512"
              >
                <path
                  class=""
                  fill="currentColor"
                  d="M306 50c-43.1-9.9-86 16.9-95.9 60c-7.9 34.1 7.4 68.2 35.5 85.9c5.4 3.4 9.2 8.8 10.7 15s.3 12.7-3 18.1L170.4 361.5c3.6 6.7 5.6 14.4 5.6 22.5c0 26.5-21.5 48-48 48s-48-21.5-48-48s21.5-48 48-48c.6 0 1.1 0 1.7 0L201 221.9c-32.5-30.2-48.4-76.4-37.7-122.7C179.2 30.3 247.9-12.6 316.8 3.3c65.9 15.2 108 78.7 97.7 144.4c-2.1 13.1-14.3 22-27.4 20s-22-14.3-20-27.4C373.5 99.2 347.1 59.5 306 50zM289.7 176c-.6 0-1.1 0-1.7 0c-26.5 0-48-21.5-48-48s21.5-48 48-48s48 21.5 48 48c0 8.1-2 15.8-5.6 22.5l71.3 114.1c45.8-17.7 99.8-8.2 136.8 28.9c50 50 50 131 0 181c-43 43-109 49-158.4 18c-11.2-7-14.6-21.8-7.6-33.1s21.8-14.6 33.1-7.6c30.9 19.3 72.1 15.5 99-11.3c31.2-31.2 31.2-81.9 0-113.1c-26.8-26.8-68.1-30.6-99-11.3c-5.4 3.4-11.9 4.5-18.1 3s-11.6-5.3-15-10.7L289.7 176zM448 432c-17.8 0-33.3-9.7-41.6-24H253.8c-9.2 48.3-46 88.9-97 100.7c-68.9 15.9-137.6-27-153.5-95.9C-11 351 22.1 289.4 78.7 265.8c12.2-5.1 26.3 .7 31.4 12.9s-.7 26.3-12.9 31.4c-35.4 14.7-56 53.3-47.1 91.8c9.9 43.1 52.9 69.9 95.9 60c37-8.5 62.1-41.5 62-77.9c0-6.4 2.5-12.5 7-17s10.6-7 17-7H406.4c8.3-14.3 23.8-24 41.6-24c26.5 0 48 21.5 48 48s-21.5 48-48 48z"
                ></path>
              </svg>
            </div>
            <h4 class="features-item-title">{{ t('APIIntegration') }}</h4>
            <p class="features-item-text">
              {{ t('APIIntegrationDesc') }}
            </p>
          </div>
          <div class="features-item">
            <div class="features-item-icon">
              <svg
                aria-hidden="true"
                focusable="false"
                data-prefix="fas"
                data-icon="database"
                role="img"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 448 512"
              >
                <path
                  class=""
                  fill="currentColor"
                  d="M448 80v48c0 44.2-100.3 80-224 80S0 172.2 0 128V80C0 35.8 100.3 0 224 0S448 35.8 448 80zM393.2 214.7c20.8-7.4 39.9-16.9 54.8-28.6V288c0 44.2-100.3 80-224 80S0 332.2 0 288V186.1c14.9 11.8 34 21.2 54.8 28.6C99.7 230.7 159.5 240 224 240s124.3-9.3 169.2-25.3zM0 346.1c14.9 11.8 34 21.2 54.8 28.6C99.7 390.7 159.5 400 224 400s124.3-9.3 169.2-25.3c20.8-7.4 39.9-16.9 54.8-28.6V432c0 44.2-100.3 80-224 80S0 476.2 0 432V346.1z"
                ></path>
              </svg>
            </div>
            <h4 class="features-item-title">{{ t('bigDataAnalysis') }}</h4>
            <p class="features-item-text">
              {{ t('bigDataAnalysisDesc') }}
            </p>
          </div>
          <div class="features-item">
            <div class="features-item-icon">
              <svg
                aria-hidden="true"
                focusable="false"
                data-prefix="fas"
                data-icon="dragon"
                role="img"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 640 512"
              >
                <path
                  class=""
                  fill="currentColor"
                  d="M352 124.5l-51.9-13c-6.5-1.6-11.3-7.1-12-13.8s2.8-13.1 8.7-16.1l40.8-20.4L294.4 28.8c-5.5-4.1-7.8-11.3-5.6-17.9S297.1 0 304 0H416h32 16c30.2 0 58.7 14.2 76.8 38.4l57.6 76.8c6.2 8.3 9.6 18.4 9.6 28.8c0 26.5-21.5 48-48 48H538.5c-17 0-33.3-6.7-45.3-18.7L480 160H448v21.5c0 24.8 12.8 47.9 33.8 61.1l106.6 66.6c32.1 20.1 51.6 55.2 51.6 93.1C640 462.9 590.9 512 530.2 512H496 432 32.3c-3.3 0-6.6-.4-9.6-1.4C13.5 507.8 6 501 2.4 492.1C1 488.7 .2 485.2 0 481.4c-.2-3.7 .3-7.3 1.3-10.7c2.8-9.2 9.6-16.7 18.6-20.4c3-1.2 6.2-2 9.5-2.2L433.3 412c8.3-.7 14.7-7.7 14.7-16.1c0-4.3-1.7-8.4-4.7-11.4l-44.4-44.4c-30-30-46.9-70.7-46.9-113.1V181.5v-57zM512 72.3c0-.1 0-.2 0-.3s0-.2 0-.3v.6zm-1.3 7.4L464.3 68.1c-.2 1.3-.3 2.6-.3 3.9c0 13.3 10.7 24 24 24c10.6 0 19.5-6.8 22.7-16.3zM130.9 116.5c16.3-14.5 40.4-16.2 58.5-4.1l130.6 87V227c0 32.8 8.4 64.8 24 93H112c-6.7 0-12.7-4.2-15-10.4s-.5-13.3 4.6-17.7L171 232.3 18.4 255.8c-7 1.1-13.9-2.6-16.9-9s-1.5-14.1 3.8-18.8L130.9 116.5z"
                ></path>
              </svg>
            </div>
            <h4 class="features-item-title">{{ t('onDuty') }}</h4>
            <p class="features-item-text">
              {{ t('onDutyDesc') }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.about-game-container {
  background: url('/images/services-bg.png') no-repeat fixed top center;
  background-size: contain;
  background-color: #1f1f1d;

  .services {
    padding: 160px 0 150px;

    &-title {
      font-size: 64px;
      margin: 0 0 120px;
      text-align: center;
      font-weight: 700;
      line-height: 1.2;
    }

    &-items {
      margin: 0 auto;
      width: 55%;
      display: flex;
      flex-flow: column nowrap;
      justify-content: space-between;
    }

    &-item {
      margin: 0 0 120px;
      display: flex;

      .desc {
        flex: 0.5;
        padding: 0 32px;

        .index {
          font-size: 48px;
          color: rgb(255, 135, 8);
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .title {
          font-size: 32px;
          margin-bottom: 1.5rem;
          font-weight: 700;
          line-height: 1.2;
        }

        .text {
          line-height: 32px;
          color: #fffc;
        }
      }

      .category {
        flex: 0.5;
        aspect-ratio: 526 / 351;
        border-radius: 8px;
        box-shadow:
          0 0 2px #ffffff3d,
          0 0 16px #0000007a;
        overflow: hidden;
        position: relative;

        &:after {
          content: '';
          background: linear-gradient(135deg, #000000 0%, #000000 25%, #ffd200 50%, #ff2e3a 100%);
          background-size: 400% 400%;
          opacity: 0.4;
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          transition: all 0.5s;
          border-radius: 8px;
        }

        &:hover:after {
          background-size: 100% 100%;
        }

        img {
          height: 100%;
          object-fit: cover;
          width: 100%;
          filter: grayscale(1);
        }

        &-split-img {
          width: 20% !important;
        }
      }
    }
  }

  .features {
    padding: 0 0 160px;

    &-title {
      font-size: 64px;
      margin: 0 0 120px;
      text-align: center;
      font-weight: 700;
      line-height: 1.2;
    }

    &-items {
      margin: 0 auto;
      width: 55%;
      display: grid;
      grid-template-rows: 1fr;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }

    &-item {
      padding: 32px 48px;
      border-radius: 8px;
      position: relative;
      bottom: 0;
      outline: 2px solid transparent;
      transition: all ease-in-out 0.3s;

      &:hover {
        transform: translateY(-25px);
        background: #0f0d08;
        outline: 2px solid #ff8708;
        box-shadow: 0 0 16px #ff8708;
      }

      &-icon {
        margin-bottom: 1rem;

        & > svg {
          fill: url(#linear-bg);
          overflow: visible;
          box-sizing: content-box;
          width: 45px;
          height: 36px;
          text-align: center;
          font-size: 2em;
          vertical-align: -0.125em;
        }
      }

      &-title {
        font-size: 32px;
        margin-bottom: 1.5rem;
        font-weight: 700;
        line-height: 1.2;
      }

      &-text {
        color: #fffc;
        line-height: 32px;
        margin-bottom: 0;
      }
    }
  }
}
</style>
