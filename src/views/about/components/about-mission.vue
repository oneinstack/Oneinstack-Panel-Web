<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <div class="about-mission-container">
    <div class="container row">
      <div class="desc">
        <h4 class="mission-title">{{ t('ourMission') }}</h4>
        <h3 class="mission-slogan">
          “Just Do the Best“
          <br />
          {{ t('theMottoOf') }}
        </h3>
        <div class="mission-texts">
          <p class="text">
            {{ t('ourMissionDesc1') }}
          </p>
          <p class="text">{{ t('ourMissionDesc2') }}</p>
        </div>
      </div>
      <div class="list">
        <div class="list-item">
          <h4 class="title">{{ t('innovate') }}</h4>
          <ul>
            <li class="text">{{ t('innovateDesc') }}</li>
          </ul>
        </div>
        <div class="list-item">
          <h4 class="title">{{ t('challenge') }}</h4>
          <ul>
            <li class="text">{{ t('challengeDesc') }}</li>
          </ul>
        </div>
        <div class="list-item">
          <h4 class="title">{{ t('evolve') }}</h4>
          <ul>
            <li class="text">{{ t('evolveDesc') }}</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.about-mission-container {
  padding: 160px 0 120px;
  background: url('/images/mission-bg.png') center center no-repeat;
  background-size: cover;

  .container {
    margin: 0 auto;
    width: 1320px;
    display: flex;

    .desc {
      flex: 0.5;

      .mission-title {
        font-size: 40px;
        text-align: center;
        margin-bottom: 1.5rem;
        font-weight: 700;
        line-height: 1.2;
      }

      .mission-slogan {
        font-size: 55px;
        background-image: var(--gradient-color);
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        text-align: center;
        margin-top: 0;
        margin-bottom: 0.5rem;
        font-weight: 700;
        line-height: 1.2;
      }

      .text {
        padding: 32px;
        line-height: 28px;
        text-align: center;
        margin-bottom: 0;
        color: #fffc;
      }
    }

    .list {
      padding: 32px;
      margin: 0 0 32px;
      flex: 0.5;
      display: flex;
      flex-flow: column nowrap;

      &-item {
        padding: 32px;
        background: rgba(46, 46, 44, 0.6);
        box-shadow:
          0 0 2px #ffffff3d,
          0 0 16px #0000007a;
        border-radius: 8px;
        border: 2px solid rgba(46, 46, 44, 0.6);
        transition: all ease-in-out 0.3s;
        margin-bottom: 1rem;

        &:hover {
          background: #141413;
          border: 2px solid #ff8708;
          box-shadow: 0 0 16px #ff8708;
        }

        .title {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 1rem;
          line-height: 1.2;
          margin-top: 0;
        }

        ul {
          margin-top: 0;
          margin-bottom: 1rem;
          padding-left: 2rem;
          color: #fffc;
          list-style-type: disc;

          .text {
            position: relative;
            line-height: 32px;
            margin-bottom: 0.5rem;
            display: list-item;
            text-align: -webkit-match-parent;
            unicode-bidi: isolate;

            &::marker {
              content: '';
              unicode-bidi: isolate;
              font-variant-numeric: tabular-nums;
              text-transform: none;
              text-indent: 0px !important;
              text-align: start !important;
              text-align-last: start !important;
            }

            &::after {
              content: '';
              border: 2px solid #ff8708;
              border-radius: 50%;
              width: 12px;
              height: 12px;
              position: absolute;
              top: 8px;
              left: -22px;
            }
          }
        }
      }
    }
  }
}

@media screen and (max-width: 768px) {
  .row {
    padding: 0 !important;
  }

  .about-mission-container {
    padding: 80px 0 60px;

    .container {
      width: 100%;
      flex-direction: column;

      .desc,
      .list {
        flex: 1;
      }

      .desc {
        .mission-title {
          font-size: 32px;
        }

        .mission-slogan {
          font-size: 35px;
        }

        .text {
          padding: 0 0 24px;
        }
      }

      .list {
        padding: 0 16px;

        &-item {
          padding: 16px;
        }
      }
    }
  }
}
</style>
