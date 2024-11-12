<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <div class="about-why-container">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-xxl-10">
          <h2 class="why-title">{{ t('whyBg') }}</h2>
          <div class="card-list row">
            <div class="card-item">
              <h4 class="title">{{ t('whyReason1') }}</h4>
              <p class="text">
                {{ t('whyReason1Desc') }}
              </p>
            </div>
            <div class="card-item">
              <h4 class="title">{{ t('whyReason2') }}</h4>
              <p class="text">
                {{ t('whyReason2Desc') }}
              </p>
            </div>
            <div class="card-item">
              <h4 class="title">{{ t('whyReason3') }}</h4>
              <p class="text">
                {{ t('whyReason3Desc') }}
              </p>
            </div>
            <div class="card-item">
              <h4 class="title">{{ t('whyReason4') }}</h4>
              <p class="text">
                {{ t('whyReason4Desc') }}
              </p>
            </div>
            <div class="card-item">
              <h4 class="title">{{ t('whyReason5') }}</h4>
              <p class="text">
                {{ t('whyReason5Desc') }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.about-why-container {
  padding: 0 0 140px;
  background: linear-gradient(180deg, #020202 0%, #1f1f1d 100%);

  .container {
    width: 1320px;
  }

  @media (min-width: 1400px) {
    .col-xxl-10 {
      flex: 0 0 auto;
      width: 83.33333333%;
    }
  }

  .why-title {
    font-size: 72px;
    margin-bottom: 80px;
    font-weight: 700;
    line-height: 1.2;
    text-align: center;
  }

  .card-list {
    .card-item {
      padding: 32px;
      border-radius: 8px;
      transition: all ease-in-out 0.3s;
      position: relative;
      bottom: 0;
      margin-bottom: 1.5rem;
      flex: 0 0 auto;
      width: 50%;

      &:hover {
        background: #1f1f1d;
        transform: translateY(-25px);

        & > .title::after {
          width: 100%;
          box-shadow: 0 0 16px #ff8708;
        }
      }

      .title {
        font-size: 24px;
        line-height: 36px;
        padding: 0 0 24px;
        position: relative;
        margin-bottom: 1.5rem;
        font-weight: 700;

        &::after {
          content: '';
          height: 4px;
          width: 40px;
          background: var(--gradient-color);
          position: absolute;
          left: 0;
          bottom: 0;
          transition: all ease-in-out 0.3s;
        }
      }

      .text {
        line-height: 32px;
        margin-bottom: 0;
        color: #fffc;
      }
    }
  }
}

@media screen and (max-width: 768px) {
  .about-why-container {
    .container {
      width: 100%;
    }

    .why-title {
      font-size: 32px;
      margin-bottom: 40px;
    }

    .card-list {
      .card-item {
        padding: 0 16px;
        width: 100%;
      }
    }
  }
}
</style>
