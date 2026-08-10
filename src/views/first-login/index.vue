<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { Api } from '@/api/Api'
import sconfig from '@/sstore/sconfig'
import System from '@/utils/System'
import i18n from '@/lang'

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
      <div class="password-card">
        <div class="step">{{ $t('firstLogin.step') }}</div>
        <div class="title">{{ $t('firstLogin.setPasswordTitle') }}</div>
        <div class="description">{{ $t('firstLogin.setPasswordDescription') }}</div>
        <el-alert
          :title="$t('firstLogin.passwordPolicy')"
          type="warning"
          :closable="false"
          show-icon
        />
        <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
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
    </main>
  </div>
</template>

<style scoped lang="less">
.first-login {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(460px, 0.95fr) minmax(500px, 1.05fr);
  color: #182230;
  background: #f8fafc;
}

.security-visual {
  position: relative;
  min-height: 100vh;
  padding: 48px clamp(42px, 6vw, 90px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: #f8fafc;
  background:
    radial-gradient(circle at 20% 10%, rgba(var(--primary-color), 0.2), transparent 26rem),
    radial-gradient(circle at 90% 90%, rgba(59, 130, 246, 0.13), transparent 28rem),
    #0b1120;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    opacity: 0.16;
    background-image:
      linear-gradient(rgba(148, 163, 184, 0.1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(148, 163, 184, 0.1) 1px, transparent 1px);
    background-size: 44px 44px;
    mask-image: linear-gradient(black, transparent);
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
  gap: 11px;

  .brand-mark {
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    border-radius: 12px;
    color: var(--primary-color-light);
    background: rgba(var(--primary-color), 0.12);
    font-size: 13px;
    font-weight: 820;
  }

  > div:last-child {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  strong {
    font-size: 14px;
  }

  span {
    color: #94a3b8;
    font-size: 9px;
    letter-spacing: 0.06em;
  }
}

.visual-content {
  margin: auto 0;

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
    color: var(--primary-color-light);
    font-size: 10px;
    font-weight: 750;
    letter-spacing: 0.16em;
  }

  h1 {
    margin: 17px 0;
    font-size: clamp(34px, 3.3vw, 50px);
    font-weight: 710;
    line-height: 1.24;
    letter-spacing: -0.04em;
  }

  > p {
    max-width: 480px;
    color: #94a3b8;
    font-size: 14px;
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
  min-height: 100vh;
  padding: 48px clamp(40px, 8vw, 128px);
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at 100% 0, rgba(var(--primary-color), 0.07), transparent 25rem),
    #f8fafc;
}

.password-card {
  width: min(100%, 470px);
  padding: clamp(30px, 4vw, 46px);
  border: 1px solid #eaecf0;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 24px 64px rgba(16, 24, 40, 0.1);
}

.step {
  margin-bottom: 14px;
  color: rgb(var(--primary-color));
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.title {
  color: #182230;
  font-size: 27px;
  font-weight: 720;
  letter-spacing: -0.035em;
}

.description {
  margin-top: 10px;
  color: #667085;
  font-size: 12px;
  line-height: 1.7;
}

.el-alert {
  margin: 22px 0 26px;
}

:deep(.el-form-item__label) {
  margin-bottom: 7px;
  color: #344054;
  font-size: 12px;
  font-weight: 620;
}

:deep(.el-input__wrapper) {
  min-height: 48px;
  border-radius: 11px;
  background: #f9fafb;
  box-shadow: 0 0 0 1px #e4e7ec inset;

  &.is-focus {
    background: #fff;
    box-shadow:
      0 0 0 1px rgb(var(--primary-color)) inset,
      0 0 0 4px rgba(var(--primary-color), 0.11);
  }
}

.submit {
  width: 100%;
  min-height: 50px;
  margin-top: 5px;
  display: flex;
  justify-content: space-between;
  border-radius: 11px;
  background: linear-gradient(135deg, rgb(var(--primary-color)), var(--primary-gradient-end));
  box-shadow: 0 10px 24px rgba(var(--primary-color), 0.22);
}

.privacy-note {
  margin-top: 18px;
  color: #98a2b3;
  font-size: 9px;
  line-height: 1.6;
  text-align: center;
}

@media (max-width: 980px) {
  .first-login {
    grid-template-columns: 1fr;
  }

  .security-visual {
    display: none;
  }

  .password-panel {
    padding: 28px 20px;
  }
}

@media (max-width: 520px) {
  .password-card {
    padding: 28px 22px;
  }

  .title {
    font-size: 24px;
  }
}
</style>
