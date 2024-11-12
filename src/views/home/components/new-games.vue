<script setup>
import { Vue3Marquee } from 'vue3-marquee'
import NewGameCard from './new-game-card.vue'
import { Scope } from 'tools-vue3'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const mconf = Scope.getConf()

const rows = computed(() => {
  const row = parseInt(mconf.newGames.length / 5)
  return row < 3 ? parseInt(mconf.newGames.length / 5) : 3
})
</script>

<template>
  <div class="new-games-container">
    <div class="txt">
      <h1 class="title">
        <span v-html="t('newGames')" />
        <br />
        <span>{{ t('release') }}</span>
      </h1>
      <img src="/svg/game-split.svg" class="split" alt="" />
      <div class="desc">{{ t('newGamesDesc') }}</div>
    </div>

    <div class="scroll-view">
      <template v-for="(item, index) in rows" :key="item">
        <vue3-marquee pauseOnHover direction="reverse" :duration="50" class="marquee">
          <new-game-card
            v-for="game in mconf.newGames.slice(index * 5 + 1, item * 5)"
            :key="game.id"
            :data="game"
            @click-play="mconf.modal.open(game)"
          />
        </vue3-marquee>
      </template>
    </div>

    <div class="footer">
      <router-link to="/game/list" class="btn">
        <span>{{ t('allGames') }}</span>
      </router-link>
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
      text-decoration: none;
      color: #fff;

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

@media screen and (max-width: 768px) {
  .txt {
    flex-direction: column;
  }

  .title {
    font-size: calc(1.575rem + 3.9vw) !important;
    margin-bottom: 32px;
  }

  .split {
    display: none;
  }
}
</style>
