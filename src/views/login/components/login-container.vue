<script setup lang="ts">
import LanguageSwitch from '@/views/layout/components/language-switch.vue'

interface Props {
  currentActive?: 'login' | 'register'
  loading?: boolean
}

withDefaults(defineProps<Props>(), {
  currentActive: 'login',
  loading: false
})
</script>

<template>
  <div v-loading="loading" class="login-container">
    <div class="ambient ambient-one"></div>
    <div class="ambient ambient-two"></div>
    <div class="guest-language-switch">
      <language-switch />
    </div>
    <section class="login-hero">
      <div class="hero-brand">
        <div class="hero-logo">1S</div>
        <div>
          <strong>OneinStack Panel</strong>
          <span>{{ $t('login.heroSubtitle') }}</span>
        </div>
      </div>

      <div class="hero-copy">
        <div class="eyebrow"><span></span> {{ $t('login.heroEyebrow') }}</div>
        <h1 v-html="$t('login.heroTitle')"></h1>
        <p>{{ $t('login.heroDescription') }}</p>
      </div>

      <div class="console-preview">
        <div class="console-head">
          <div class="window-dots"><i></i><i></i><i></i></div>
          <span>{{ $t('login.serverOverview') }}</span>
          <div class="online"><i></i> {{ $t('login.online') }}</div>
        </div>
        <div class="console-body">
          <div class="metric">
            <span>{{ $t('login.cpuLoad') }}</span>
            <strong>24%</strong>
            <div class="progress"><i style="width: 24%"></i></div>
          </div>
          <div class="metric">
            <span>{{ $t('login.memoryUsage') }}</span>
            <strong>6.8 GB</strong>
            <div class="progress memory"><i style="width: 52%"></i></div>
          </div>
          <div class="service-list">
            <div><span class="service-icon orange">N</span><b>Nginx</b><em>{{ $t('login.running') }}</em></div>
            <div><span class="service-icon blue">DB</span><b>MySQL 8.0</b><em>{{ $t('login.running') }}</em></div>
            <div><span class="service-icon red">R</span><b>Redis</b><em>{{ $t('login.running') }}</em></div>
          </div>
        </div>
      </div>

      <div class="hero-features">
        <span><i>✓</i> {{ $t('login.localDeployment') }}</span>
        <span><i>✓</i> {{ $t('login.secureControl') }}</span>
        <span><i>✓</i> {{ $t('login.realtimeMonitor') }}</span>
      </div>
    </section>

    <main class="login-panel">
      <div class="login-panel__inner">
        <slot
          :className="{
            loginBtn: 'login-content-right__main-login-btn',
            other: 'login-content-right__main-other',
            formItemGap: 'login-content-right__main-form-item-gap'
          }"
        />
      </div>
      <div class="panel-footer">{{ $t('login.panelFooter') }}</div>
    </main>
  </div>
</template>

<style scoped lang="less">
.login-container {
  position: relative;
  width: 100%;
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(500px, 1.08fr) minmax(440px, 0.92fr);
  overflow: hidden;
  color: #f8fafc;
  background: #0b1120;
}

.ambient {
  position: absolute;
  border-radius: 50%;
  filter: blur(20px);
  pointer-events: none;

  &-one {
    top: -260px;
    left: -180px;
    width: 620px;
    height: 620px;
    background: radial-gradient(circle, rgba(var(--primary-color), 0.19), transparent 68%);
  }

  &-two {
    right: 28%;
    bottom: -360px;
    width: 760px;
    height: 760px;
    background: radial-gradient(circle, rgba(59, 130, 246, 0.13), transparent 68%);
  }
}

.guest-language-switch {
  position: absolute;
  top: 28px;
  right: 34px;
  z-index: 5;
}

.login-hero {
  position: relative;
  min-height: 100vh;
  padding: clamp(34px, 5vw, 70px) clamp(38px, 7vw, 104px);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  border-right: 1px solid rgba(255, 255, 255, 0.07);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    opacity: 0.2;
    background-image:
      linear-gradient(rgba(148, 163, 184, 0.09) 1px, transparent 1px),
      linear-gradient(90deg, rgba(148, 163, 184, 0.09) 1px, transparent 1px);
    background-size: 42px 42px;
    mask-image: linear-gradient(to bottom, black, transparent 80%);
    pointer-events: none;
  }
}

.hero-brand,
.hero-copy,
.console-preview,
.hero-features {
  position: relative;
  z-index: 1;
}

.hero-brand {
  display: flex;
  align-items: center;
  gap: 12px;

  .hero-logo {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border: 1px solid rgba(var(--primary-color), 0.28);
    border-radius: 13px;
    color: var(--primary-color-light);
    background: rgba(var(--primary-color), 0.12);
    font-size: 14px;
    font-weight: 850;
    box-shadow: 0 10px 28px rgba(var(--primary-color), 0.13);
  }

  > div:last-child {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  strong {
    font-size: 15px;
    font-weight: 720;
    letter-spacing: 0.01em;
  }

  span {
    color: #94a3b8;
    font-size: 11px;
  }
}

.hero-copy {
  margin: clamp(48px, 8vh, 96px) 0 34px;

  .eyebrow {
    display: flex;
    align-items: center;
    gap: 9px;
    color: var(--primary-color-light);
    font-size: 10px;
    font-weight: 750;
    letter-spacing: 0.16em;

    span {
      width: 22px;
      height: 2px;
      border-radius: 2px;
      background: rgb(var(--primary-color));
    }
  }

  h1 {
    margin: 19px 0 18px;
    font-size: clamp(38px, 4.2vw, 62px);
    font-weight: 720;
    line-height: 1.16;
    letter-spacing: -0.045em;
  }

  p {
    max-width: 510px;
    color: #94a3b8;
    font-size: 15px;
    line-height: 1.8;
  }
}

.console-preview {
  width: min(100%, 600px);
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.17);
  border-radius: 18px;
  background: rgba(15, 23, 42, 0.78);
  box-shadow: 0 26px 70px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(16px);
}

.console-head {
  height: 46px;
  padding: 0 15px;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
  color: #64748b;
  font-size: 10px;

  .window-dots {
    display: flex;
    gap: 6px;

    i {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #475569;

      &:first-child {
        background: rgb(var(--primary-color));
      }
    }
  }

  .online {
    justify-self: end;
    display: flex;
    align-items: center;
    gap: 6px;
    color: #34d399;

    i {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
      box-shadow: 0 0 0 3px rgba(52, 211, 153, 0.12);
    }
  }
}

.console-body {
  padding: 20px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;

  .metric {
    padding: 14px;
    border: 1px solid rgba(148, 163, 184, 0.11);
    border-radius: 12px;
    background: rgba(30, 41, 59, 0.58);

    span {
      color: #94a3b8;
      font-size: 10px;
    }

    strong {
      margin-top: 5px;
      display: block;
      color: #f8fafc;
      font-size: 18px;
    }

    .progress {
      height: 4px;
      margin-top: 11px;
      overflow: hidden;
      border-radius: 99px;
      background: #253147;

      i {
        height: 100%;
        display: block;
        border-radius: inherit;
        background: linear-gradient(90deg, rgb(var(--primary-color)), var(--primary-color-light));
      }

      &.memory i {
        background: linear-gradient(90deg, #3b82f6, #60a5fa);
      }
    }
  }
}

.service-list {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;

  > div {
    min-width: 0;
    padding: 10px;
    display: grid;
    grid-template-columns: 28px 1fr;
    align-items: center;
    gap: 8px;
    border: 1px solid rgba(148, 163, 184, 0.1);
    border-radius: 10px;
    background: rgba(30, 41, 59, 0.4);
  }

  .service-icon {
    width: 28px;
    height: 28px;
    grid-row: 1 / span 2;
    display: grid;
    place-items: center;
    border-radius: 8px;
    font-size: 9px;
    font-weight: 800;

    &.orange {
      color: var(--primary-color-light);
      background: rgba(var(--primary-color), 0.13);
    }

    &.blue {
      color: #60a5fa;
      background: rgba(59, 130, 246, 0.13);
    }

    &.red {
      color: #fb7185;
      background: rgba(244, 63, 94, 0.13);
    }
  }

  b {
    overflow: hidden;
    color: #e2e8f0;
    font-size: 10px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  em {
    color: #34d399;
    font-size: 9px;
    font-style: normal;
  }
}

.hero-features {
  margin-top: 28px;
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  color: #94a3b8;
  font-size: 11px;

  span {
    display: flex;
    align-items: center;
    gap: 7px;
  }

  i {
    width: 18px;
    height: 18px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    color: #34d399;
    background: rgba(52, 211, 153, 0.1);
    font-size: 10px;
    font-style: normal;
  }
}

.login-panel {
  position: relative;
  z-index: 2;
  min-height: 100vh;
  padding: 42px clamp(38px, 7vw, 104px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  color: #182230;
  background: #ffffff;

  &__inner {
    width: min(100%, 440px);
    margin: auto;
  }

  .panel-footer {
    width: 100%;
    margin-top: 32px;
    color: #98a2b3;
    font-size: 10px;
    text-align: center;
    letter-spacing: 0.04em;
  }
}

:deep(.login-content-right__main-login-btn) {
  width: 100%;
  height: 50px;
  margin-top: 28px;
  border: 0;
  border-radius: 11px;
  color: #fff;
  background: linear-gradient(135deg, rgb(var(--primary-color)), var(--primary-gradient-end));
  box-shadow: 0 10px 24px rgba(var(--primary-color), 0.23);
  font-size: 14px;
  font-weight: 680;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 14px 30px rgba(var(--primary-color), 0.3);
  }
}

:deep(.login-content-right__main-form-item-gap) {
  margin-bottom: 20px;
}

@media (max-width: 980px) {
  .login-container {
    grid-template-columns: 1fr;
    background: #f8fafc;
  }

  .login-hero {
    display: none;
  }

  .login-panel {
    min-height: 100vh;
    padding: 32px 24px;
    background:
      radial-gradient(circle at 20% 0, rgba(var(--primary-color), 0.08), transparent 28rem),
      #f8fafc;
  }

  .guest-language-switch {
    top: 24px;
    right: 24px;
  }
}

@media (max-width: 520px) {
  .login-panel {
    padding: 26px 20px;
  }
}
</style>
