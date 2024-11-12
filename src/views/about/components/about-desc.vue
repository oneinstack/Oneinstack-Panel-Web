<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <div class="about-desc-container">
    <div class="content">
      <h1 class="title">
        <span>About</span>
        <span class="bg-gradient">BG</span>
      </h1>
      <div class="desc">
        <h3>{{ t('gameDeveloper') }}</h3>
        <p>
          {{ t('gameDeveloperDesc') }}
        </p>
      </div>
      <div class="desc">
        <h3>{{ t('iGamingProviders') }}</h3>
        <p>
          {{ t('iGamingProvidersDesc') }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.about-desc-container {
  --bs-gutter-x: 1.5rem;
  --bs-gutter-y: 0;
  padding: calc(120px + var(--nav-heaght)) calc(var(--bs-gutter-x) * 15) 124px;
  background: url('/images/banner-bg.png') center center no-repeat;
  background-size: cover;

  .content {
    max-width: 1320px;
    width: 100%;
    padding-right: calc(var(--bs-gutter-x) * 0.5);
    padding-left: calc(var(--bs-gutter-x) * 0.5);
    margin-right: auto;
    margin-left: auto;

    .title {
      font-size: 72px;
      margin-bottom: 120px;
      margin-top: 0;
      font-weight: 700;
      line-height: 1.2;
      text-align: center;

      .bg-gradient {
        padding: 0 20px;
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        background-image: var(--gradient-color);
      }
    }
  }

  .desc {
    & > h3 {
      font-size: 40px;
      margin-bottom: 1rem;
      font-weight: 700;
      line-height: 1.2;
    }

    & > p {
      color: #fffc;
      line-height: 32px;
      margin: 0 0 56px;
    }
  }
}

@media screen and (max-width: 768px) {
  .about-desc-container {
    padding: 60px 0 62px;

    .content {
      .title {
        font-size: 60px;
        margin-bottom: 60px;
      }
    }

    .desc {
      & > h3 {
        font-size: 32px;
      }
    }
  }
}
</style>
