<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { Api } from '@/api/modules'
import { useConfigStore } from '@/stores/modules/config';
import System from '@/utils/System'
import i18n from '@/lang'

const sconfig = useConfigStore()

const t = (key: string, fallback?: string) => {
  const value = (i18n.t as any)(key)
  return value && value !== key ? value : fallback || key
}

const formRef = ref<FormInstance>()
const form = reactive({
  password: '',
  confirmPassword: ''
})
const loading = ref(false)
const passwordRule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,128}$/
const rules = computed<FormRules>(() => ({
  password: [
    { required: true, message: t('firstLogin.newPasswordRequired', 'Enter a new password'), trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        passwordRule.test(value)
          ? callback()
          : callback(new Error(t('firstLogin.passwordPolicy', 'Password must include uppercase, lowercase, number, and special character, at least 8 characters.')))
      },
      trigger: ['blur', 'change']
    }
  ],
  confirmPassword: [
    { required: true, message: t('firstLogin.confirmPasswordRequired', 'Enter the new password again'), trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        value === form.password ? callback() : callback(new Error(t('firstLogin.passwordMismatch', 'The two passwords do not match')))
      },
      trigger: ['blur', 'change']
    }
  ]
}))
const passwordValid = computed(() => passwordRule.test(form.password))
const confirmValid = computed(() => form.confirmPassword.length > 0 && form.confirmPassword === form.password)
const submitDisabled = computed(
  () => loading.value || !passwordValid.value || !confirmValid.value
)

const submit = async () => {
  if (submitDisabled.value) return
  if (!await formRef.value?.validate()) return
  loading.value = true
  try {
    await Api.updateResetpassword({ password: form.password })
    ElMessage.success(t('firstLogin.passwordChanged', 'Password changed. Sign in again with the new password.'))
    sconfig.logout()
    await System.router.replace('/login')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="first-login">
    <div class="ambient ambient-one"></div>
    <div class="ambient ambient-two"></div>
    <div class="security-visual">
      <div class="brand">
        <div class="brand-mark">1S</div>
        <div>
          <strong>OneinStack Panel</strong>
          <span>Secure Server Console</span>
        </div>
      </div>
      <div class="visual-content">
        <div class="shield">
          <span>✓</span>
        </div>
        <div class="eyebrow">FIRST LOGIN PROTECTION</div>
        <h1>{{ $t('firstLogin.heroTitleLine1') }}<br />{{ $t('firstLogin.heroTitleLine2') }}</h1>
        <p>{{ $t('firstLogin.heroDescription') }}</p>
        <div class="protection-list">
          <div><i>01</i><span><b>{{ $t('firstLogin.strongPasswordTitle') }}</b>{{ $t('firstLogin.strongPasswordText') }}</span></div>
          <div><i>02</i><span><b>{{ $t('firstLogin.localStorageTitle') }}</b>{{ $t('firstLogin.localStorageText') }}</span></div>
          <div><i>03</i><span><b>{{ $t('firstLogin.auditTitle') }}</b>{{ $t('firstLogin.auditText') }}</span></div>
        </div>
      </div>
    </div>

    <main class="password-panel">
      <div class="password-shell">
        <div class="password-card">
          <div class="password-card__header">
            <div class="step">{{ $t('firstLogin.step') }}</div>
            <div class="card-mark"><span>✓</span></div>
          </div>
          <div class="title">{{ $t('firstLogin.setPasswordTitle') }}</div>
          <div class="description">{{ $t('firstLogin.setPasswordDescription') }}</div>
          <div class="trust-strip">
            <span>{{ $t('firstLogin.strongPasswordTitle') }}</span>
            <span>{{ $t('firstLogin.localStorageTitle') }}</span>
            <span>{{ $t('firstLogin.auditTitle') }}</span>
          </div>
          <el-alert
            :title="$t('firstLogin.passwordPolicy')"
            type="warning"
            :closable="false"
            show-icon
          />
          <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="password-form">
            <el-form-item :label="$t('firstLogin.newPassword')" prop="password">
              <el-input
                v-model="form.password"
                type="password"
                :placeholder="$t('firstLogin.newPasswordPlaceholder')"
                show-password
                autocomplete="new-password"
              />
            </el-form-item>
            <el-form-item :label="$t('firstLogin.confirmPassword')" prop="confirmPassword">
              <el-input
                v-model="form.confirmPassword"
                type="password"
                :placeholder="$t('firstLogin.confirmPasswordPlaceholder')"
                show-password
                autocomplete="new-password"
                @keyup.enter="!submitDisabled && submit()"
              />
            </el-form-item>
            <el-button
              type="primary"
              :loading="loading"
              :disabled="submitDisabled"
              class="submit"
              @click="submit"
            >
              {{ $t('firstLogin.saveAndRelogin') }}
              <span>→</span>
            </el-button>
          </el-form>
          <div class="privacy-note">{{ $t('firstLogin.privacyNote') }}</div>
        </div>
      </div>
      <div class="panel-footer">OneinStack Panel · Secure Server Console</div>
    </main>
  </div>
</template>

<style scoped lang="less">
.first-login {
  position: relative;
  width: 100%;
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(500px, 1.08fr) minmax(440px, 0.92fr);
  overflow: hidden;
  isolation: isolate;
  color: #182230;
  background:
    radial-gradient(circle at left top, rgba(var(--primary-color), 0.16), transparent 24rem),
    linear-gradient(135deg, var(--surface-page) 0%, color-mix(in srgb, var(--surface-page) 78%, #101828 22%) 100%);
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

.security-visual {
  position: relative;
  z-index: 0;
  min-height: 100vh;
  padding: clamp(34px, 5vw, 70px) clamp(38px, 7vw, 104px);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  border-right: 1px solid rgba(255, 255, 255, 0.07);
  pointer-events: none;
  color: #f8fafc;
  background:
    radial-gradient(circle at 20% 10%, rgba(var(--primary-color), 0.2), transparent 26rem),
    radial-gradient(circle at 90% 90%, rgba(59, 130, 246, 0.13), transparent 28rem),
    #0b1120;

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

.brand,
.visual-content {
  position: relative;
  z-index: 1;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;

  .brand-mark {
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

.visual-content {
  margin: clamp(48px, 8vh, 96px) 0 34px;

  .shield {
    width: 76px;
    height: 86px;
    display: grid;
    place-items: center;
    color: var(--primary-color-light);
    background: linear-gradient(145deg, rgba(var(--primary-color), 0.18), rgba(var(--primary-color), 0.05));
    clip-path: polygon(50% 0, 92% 16%, 86% 68%, 50% 100%, 14% 68%, 8% 16%);

    span {
      width: 28px;
      height: 28px;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background: rgba(var(--primary-color), 0.18);
      font-size: 14px;
      font-weight: 800;
    }
  }

  .eyebrow {
    margin-top: 28px;
    display: flex;
    align-items: center;
    gap: 9px;
    color: var(--primary-color-light);
    font-size: 10px;
    font-weight: 750;
    letter-spacing: 0.16em;

    &::before {
      content: '';
      width: 22px;
      height: 2px;
      border-radius: 2px;
      background: rgb(var(--primary-color));
    }
  }

  h1 {
    margin: 17px 0;
    font-size: clamp(38px, 4.2vw, 62px);
    font-weight: 720;
    line-height: 1.16;
    letter-spacing: -0.045em;
  }

  > p {
    max-width: 510px;
    color: #94a3b8;
    font-size: 15px;
    line-height: 1.8;
  }
}

.protection-list {
  margin-top: 38px;
  display: grid;
  gap: 16px;

  > div {
    display: flex;
    align-items: center;
    gap: 13px;
    color: #94a3b8;
    font-size: 11px;
  }

  i {
    width: 32px;
    height: 32px;
    flex: 0 0 32px;
    display: grid;
    place-items: center;
    border: 1px solid rgba(148, 163, 184, 0.16);
    border-radius: 9px;
    color: var(--primary-color-light);
    background: rgba(30, 41, 59, 0.55);
    font-size: 9px;
    font-style: normal;
    font-weight: 700;
  }

  b {
    margin-right: 8px;
    color: #e2e8f0;
    font-weight: 600;
  }
}

.password-panel {
  position: relative;
  z-index: 3;
  min-height: 100vh;
  padding: 42px clamp(38px, 7vw, 104px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  pointer-events: auto;
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--surface-card) 96%, white 4%) 0%,
      var(--surface-card) 100%
    );
  box-shadow: inset 1px 0 0 color-mix(in srgb, var(--border-subtle) 84%, transparent);
}

.password-shell {
  position: relative;
  z-index: 1;
  width: min(100%, 440px);
  margin: auto;

  &::before,
  &::after {
    content: '';
    position: absolute;
    inset: auto;
    border-radius: 999px;
    filter: blur(28px);
    pointer-events: none;
  }

  &::before {
    top: -18px;
    right: 36px;
    width: 180px;
    height: 180px;
    background: rgba(var(--primary-color), 0.16);
  }

  &::after {
    left: -24px;
    bottom: 18px;
    width: 140px;
    height: 140px;
    background: rgba(59, 130, 246, 0.1);
  }
}

.password-card {
  position: relative;
  width: 100%;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  overflow: hidden;
}

.password-card__header {
  position: relative;
  z-index: 1;
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.card-mark {
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(var(--primary-color), 0.16);
  border-radius: 14px;
  background: linear-gradient(145deg, rgba(var(--primary-color), 0.12), rgba(var(--primary-color), 0.04));
  box-shadow: 0 10px 22px rgba(var(--primary-color), 0.14);

  span {
    width: 22px;
    height: 22px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    color: #fff;
    background: linear-gradient(135deg, rgb(var(--primary-color)), var(--primary-gradient-end));
    font-size: 11px;
    font-weight: 800;
  }
}

.step {
  color: rgb(var(--primary-color));
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.title {
  position: relative;
  z-index: 1;
  color: var(--text-primary);
  font-size: 30px;
  font-weight: 720;
  line-height: 1.3;
  letter-spacing: -0.035em;
}

.description {
  position: relative;
  z-index: 1;
  margin-top: 10px;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.7;
}

.trust-strip {
  position: relative;
  z-index: 1;
  margin-top: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;

  span {
    padding: 8px 12px;
    border: 1px solid color-mix(in srgb, var(--border-subtle) 92%, transparent);
    border-radius: 999px;
    color: var(--text-secondary);
    background: color-mix(in srgb, var(--surface-subtle) 88%, var(--surface-card) 12%);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.01em;
  }
}

.el-alert {
  margin: 22px 0 26px;
}

.password-form {
  position: relative;
  z-index: 1;

  :deep(.el-form-item) {
    margin-bottom: 22px;
  }

  :deep(.el-form-item__label) {
    margin-bottom: 7px;
    color: var(--text-secondary);
    font-size: 12px;
    font-weight: 620;
  }

  :deep(.el-input__wrapper) {
    min-height: 50px;
    padding: 1px 15px;
    border-radius: 11px;
    background: color-mix(in srgb, var(--surface-subtle) 86%, var(--surface-card) 14%);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--border-subtle) 92%, transparent) inset;
    transition:
      box-shadow 0.2s ease,
      background 0.2s ease;

    &:hover {
      box-shadow: 0 0 0 1px color-mix(in srgb, var(--border-default) 92%, transparent) inset;
    }

    &.is-focus {
      background: var(--surface-card);
      box-shadow:
        0 0 0 1px rgb(var(--primary-color)) inset,
        0 0 0 4px rgba(var(--primary-color), 0.11);
    }
  }

  :deep(.el-input__inner) {
    color: var(--text-primary);
    font-size: 13px;
  }

  :deep(.el-input__inner::placeholder) {
    color: var(--text-placeholder);
  }

  :deep(.el-input__prefix),
  :deep(.el-input__suffix) {
    color: var(--text-tertiary);
  }

  :deep(.el-form-item.is-error .el-input__wrapper) {
    box-shadow:
      0 0 0 1px var(--el-color-danger) inset,
      0 0 0 4px rgba(240, 68, 56, 0.1);
  }
}

.submit {
  width: 100%;
  min-height: 50px;
  margin-top: 28px;
  display: flex;
  justify-content: space-between;
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

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 14px 30px rgba(var(--primary-color), 0.3);
  }
}

.privacy-note {
  margin-top: 26px;
  padding: 13px 14px;
  border: 1px solid color-mix(in srgb, var(--border-subtle) 92%, transparent);
  border-radius: 11px;
  color: var(--text-tertiary);
  background: color-mix(in srgb, var(--surface-subtle) 88%, var(--surface-card) 12%);
  font-size: 10px;
  line-height: 1.6;
}

.panel-footer {
  position: relative;
  z-index: 1;
  width: 100%;
  margin-top: 32px;
  color: var(--text-placeholder);
  font-size: 10px;
  text-align: center;
  letter-spacing: 0.04em;
}

:global(:root:root.dark) {
  .first-login {
    background:
      radial-gradient(circle at left top, rgba(var(--primary-color), 0.18), transparent 24rem),
      radial-gradient(circle at right bottom, rgba(59, 130, 246, 0.1), transparent 28rem),
      linear-gradient(135deg, #08101e 0%, #0b1120 36%, #10192d 100%);
  }

  .security-visual {
    border-right-color: color-mix(in srgb, var(--border-default) 44%, transparent);

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(8, 16, 30, 0.18), rgba(8, 16, 30, 0.04));
      pointer-events: none;
    }
  }

  .brand .brand-mark {
    background: rgba(var(--primary-color), 0.12);
  }

  .password-panel {
    background:
      radial-gradient(circle at left top, rgba(var(--primary-color), 0.08), transparent 18rem),
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--surface-card) 90%, #1b2436 10%) 0%,
        color-mix(in srgb, var(--surface-card) 96%, transparent) 100%
      );
    box-shadow:
      inset 1px 0 0 color-mix(in srgb, var(--border-default) 56%, transparent),
      -28px 0 56px rgba(0, 0, 0, 0.16);
  }

  .card-mark {
    box-shadow: 0 14px 28px rgba(2, 6, 23, 0.28);
  }

  .trust-strip span {
    border-color: color-mix(in srgb, var(--border-default) 72%, transparent);
    background:
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--surface-subtle) 82%, #1e293b 18%) 0%,
        color-mix(in srgb, var(--surface-card) 96%, transparent) 100%
      );
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
  }

  .password-form {
    :deep(.el-input__wrapper) {
      background: color-mix(in srgb, var(--surface-subtle) 72%, #1e293b 28%);
      box-shadow:
        0 0 0 1px color-mix(in srgb, var(--border-default) 80%, transparent) inset,
        inset 0 1px 0 rgba(255, 255, 255, 0.03);

      &:hover {
        box-shadow:
          0 0 0 1px color-mix(in srgb, var(--border-strong) 82%, transparent) inset,
          inset 0 1px 0 rgba(255, 255, 255, 0.04);
      }

      &.is-focus {
        background: color-mix(in srgb, var(--surface-card) 88%, #1e293b 12%);
      }
    }
  }

  .privacy-note {
    border-color: color-mix(in srgb, var(--border-default) 72%, transparent);
    background:
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--surface-subtle) 82%, #1e293b 18%) 0%,
        color-mix(in srgb, var(--surface-card) 96%, transparent) 100%
      );
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
  }

  .panel-footer {
    color: var(--text-tertiary);
  }
}

@media (max-width: 980px) {
  .first-login {
    grid-template-columns: 1fr;
    background:
      radial-gradient(circle at 20% 0, rgba(var(--primary-color), 0.08), transparent 28rem),
      var(--surface-page);
  }

  .security-visual {
    display: none;
  }

  .password-panel {
    min-height: 100vh;
    padding: 32px 24px;
    background:
      radial-gradient(circle at 20% 0, rgba(var(--primary-color), 0.08), transparent 28rem),
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--surface-page) 92%, var(--surface-card) 8%) 0%,
        var(--surface-page) 100%
      );
    box-shadow: none;
  }

  .password-shell,
  .password-card {
    width: 100%;
  }
}

@media (max-width: 520px) {
  .password-card {
    padding: 0;
  }

  .password-card__header {
    align-items: flex-start;
  }

  .card-mark {
    width: 38px;
    height: 38px;
    flex-basis: 38px;
  }

  .title {
    font-size: 24px;
  }

  .trust-strip {
    gap: 6px;

    span {
      width: 100%;
      justify-content: center;
      text-align: center;
    }
  }
}
</style>
