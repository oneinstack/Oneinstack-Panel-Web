<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, useTemplateRef } from 'vue'
import LoginContainer from './components/login-container.vue'
import System from '@/utils/System'
import { Api } from '@/api/modules'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useConfigStore } from '@/stores/modules/config';
import i18n from '@/lang'
import { getFirstAccessiblePath } from '@/utils/access'

const sconfig = useConfigStore()

const isDesktop = ref(window.innerWidth > 980)
const updateViewport = () => {
  isDesktop.value = window.innerWidth > 980
}

onMounted(() => window.addEventListener('resize', updateViewport))
onBeforeUnmount(() => window.removeEventListener('resize', updateViewport))

const goAfterLogin = async (routePath: string) => {
  const normalizedRoute = routePath.startsWith('/') ? routePath : `/${routePath}`
  const currentPathname = window.location.pathname || '/'
  if (currentPathname !== '/') {
    const hashURL = `${window.location.origin}${currentPathname}#${normalizedRoute}`
    window.location.replace(hashURL)
    return
  }
  await System.router.replace(normalizedRoute)
}

const loginRules = computed<FormRules>(() => ({
  username: [{ required: true, message: i18n.t('login.usernameRequired'), trigger: 'blur' }],
  password: [{ required: true, message: i18n.t('login.passwordRequired'), trigger: 'blur' }],
  totpCode: [{ required: true, message: i18n.t('login.totpRequired'), trigger: 'blur' }]
}))

const conf = reactive({
  form: {
    username: '',
    password: '',
    totpCode: '',
    remember: false
  },
  requiresTwoFactor: false,
  loading: false,
  formRef: useTemplateRef<FormInstance>('formRef'),
  handleLogin: async () => {
    const valid = await conf.formRef?.validate().catch(() => false)
    if (!valid || conf.loading) return

    let nextRoute = ''
    conf.loading = true
    try {
      const { data: res } = await Api.login({
        username: conf.form.username,
        password: conf.form.password,
        totpCode: conf.requiresTwoFactor ? conf.form.totpCode : ''
      })
      if (res.requiresTwoFactor && !res.authenticated) {
        conf.requiresTwoFactor = true
        conf.form.totpCode = ''
        ElMessage.info(i18n.t('login.totpMessage'))
        return
      }

      sconfig.login(res)
      if (res.mustChangePassword) {
        sconfig.setAccessMatrix({})
      } else {
        try {
          const matrixResponse = await Api.getAccessMatrix()
          sconfig.setAccessMatrix(matrixResponse?.data || {})
        } catch {
          sconfig.setAccessMatrix({})
        }
      }

      nextRoute = res.mustChangePassword ? '/first-login' : getFirstAccessiblePath()
      ElMessage.success(i18n.t('login.loginSuccess'))
    } catch {
      // 请求层已经统一展示错误，此处只负责恢复加载状态。
    } finally {
      conf.loading = false
    }

    if (!nextRoute) return
    // 先让表单完成加载态更新，避免登录页状态进入下一个路由。
    await nextTick()
    await goAfterLogin(nextRoute)
  }
})
</script>

<template>
  <login-container :loading="conf.loading" current-active="login">
    <template #default="{ className }">
      <div class="login-brand-mobile" :class="{ visible: !isDesktop }">
        <div class="brand-mark">1S</div>
        <div>
          <strong>OneinStack Panel</strong>
          <span>{{ $t('login.mobileBrandSubtitle') }}</span>
        </div>
      </div>

      <div class="login-heading">
        <div class="eyebrow">{{ $t('login.welcomeBack') }}</div>
        <h2>{{ conf.requiresTwoFactor ? $t('login.verifyIdentity') : $t('login.loginPanel') }}</h2>
        <p>
          {{ conf.requiresTwoFactor ? $t('login.twoFactorDescription') : $t('login.loginDescription') }}
        </p>
      </div>

      <el-form ref="formRef" :model="conf.form" :rules="loginRules" :disabled="conf.loading" class="login-form">
        <el-alert
          v-if="conf.requiresTwoFactor"
          :title="$t('login.twoFactorTitle')"
          :description="$t('login.twoFactorAlert')"
          type="info"
          :closable="false"
          show-icon
          class="two-factor-alert"
        />

        <el-form-item
          v-if="!conf.requiresTwoFactor"
          :class="className.formItemGap"
          prop="username"
          :label="$t('login.username')"
        >
          <el-input
            v-model="conf.form.username"
            :placeholder="$t('login.usernamePlaceholder')"
            clearable
            autocomplete="username"
            @keyup.enter="conf.handleLogin"
          >
            <template #prefix>
              <v-s-icon name="user" size="19" />
            </template>
          </el-input>
        </el-form-item>

        <el-form-item v-if="!conf.requiresTwoFactor" prop="password" :label="$t('login.password')">
          <el-input
            v-model="conf.form.password"
            :placeholder="$t('login.passwordPlaceholder')"
            type="password"
            show-password
            autocomplete="current-password"
            @keyup.enter="conf.handleLogin"
          >
            <template #prefix>
              <v-s-icon name="password" size="19" />
            </template>
          </el-input>
        </el-form-item>

        <el-form-item v-else prop="totpCode" :label="$t('login.totpCode')">
          <el-input
            v-model="conf.form.totpCode"
            :placeholder="$t('login.totpPlaceholder')"
            clearable
            autocomplete="one-time-code"
            @keyup.enter="conf.handleLogin"
          >
            <template #prefix>
              <v-s-icon name="password" size="19" />
            </template>
          </el-input>
        </el-form-item>

        <div v-if="!conf.requiresTwoFactor" class="form-options">
          <el-checkbox v-model="conf.form.remember" class="remember-checkbox">
            <span class="remember-checkbox__label">{{ $t('login.rememberLogin') }}</span>
          </el-checkbox>
          <span class="security-tip"><i></i> {{ $t('login.encryptedConnection') }}</span>
        </div>
        <el-button
          v-else
          link
          class="back-button"
          @click="conf.requiresTwoFactor = false; conf.form.totpCode = ''"
        >
          ← {{ $t('login.backToPasswordLogin') }}
        </el-button>

        <button
          :class="className.loginBtn"
          type="button"
          :disabled="conf.loading"
          :aria-busy="conf.loading"
          @click="conf.handleLogin"
        >
          <span>
            {{ conf.loading ? $t('common.loading') : conf.requiresTwoFactor ? $t('login.verifyAndLogin') : $t('login.secureLogin') }}
          </span>
          <span v-if="!conf.loading" aria-hidden="true">→</span>
          <span v-else class="login-button-spinner" aria-hidden="true"></span>
        </button>
      </el-form>

      <div class="login-note">
        <span class="shield">✓</span>
        <div>
          <strong>{{ $t('login.noticeTitle') }}</strong>
          <p>{{ $t('login.noticeDescription') }}</p>
        </div>
      </div>
    </template>
  </login-container>
</template>

<style scoped lang="less">
.login-brand-mobile {
  display: none;
  align-items: center;
  gap: 11px;
  margin-bottom: 54px;

  &.visible {
    display: flex;
  }

  .brand-mark {
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    border-radius: 12px;
    color: rgb(var(--primary-color));
    background: color-mix(in srgb, rgba(var(--primary-color), 0.14) 100%, var(--surface-card));
    border: 1px solid color-mix(in srgb, rgba(var(--primary-color), 0.18) 100%, transparent);
    font-size: 13px;
    font-weight: 800;
  }

  > div:last-child {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  strong {
    color: var(--text-primary);
    font-size: 14px;
  }

  span {
    color: var(--text-tertiary);
    font-size: 10px;
  }
}

.login-heading {
  margin-bottom: 32px;

  .eyebrow {
    margin-bottom: 12px;
    color: rgb(var(--primary-color));
    font-size: 10px;
    font-weight: 750;
    letter-spacing: 0.17em;
  }

  h2 {
    margin: 0;
    color: var(--text-primary);
    font-size: 30px;
    font-weight: 720;
    line-height: 1.3;
    letter-spacing: -0.035em;
  }

  p {
    margin-top: 10px;
    color: var(--text-secondary);
    font-size: 13px;
    line-height: 1.7;
  }
}

.login-form {
  :deep(.el-form-item) {
    margin-bottom: 21px;
  }

  :deep(.el-form-item__label) {
    height: auto;
    margin-bottom: 8px;
    color: var(--text-secondary);
    font-size: 12px;
    font-weight: 620;
    line-height: 1.4;
  }

  :deep(.el-input__wrapper) {
    min-height: 50px;
    padding: 1px 15px;
    border-radius: 11px;
    background: color-mix(in srgb, var(--surface-subtle) 86%, var(--surface-card) 14%);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--border-subtle) 92%, transparent) inset;

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

  :deep(.el-input__prefix),
  :deep(.el-input__suffix) {
    color: var(--text-tertiary);
  }

  :deep(.el-checkbox__inner) {
    background: color-mix(in srgb, var(--surface-subtle) 86%, var(--surface-card) 14%);
    border-color: color-mix(in srgb, var(--border-default) 84%, transparent);
  }

  :deep(.el-checkbox__label) {
    color: var(--text-secondary);
    font-size: 12px;
  }
}

.two-factor-alert {
  margin-bottom: 22px;
}

.form-options {
  margin-top: -3px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;

  .remember-checkbox {
    flex: 0 1 auto;
    min-width: 0;
    cursor: pointer;
    user-select: none;

    :deep(.el-checkbox__label) {
      padding-left: 8px;
      cursor: pointer;
      line-height: 1.2;
    }
  }

  .remember-checkbox__label {
    display: inline-flex;
    align-items: center;
    min-height: 18px;
  }

  .security-tip {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--text-tertiary);
    font-size: 10px;

    i {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #12b76a;
      box-shadow: 0 0 0 3px rgba(18, 183, 106, 0.1);
    }
  }
}

.back-button {
  margin-top: -4px;
}

:deep(.login-content-right__main-login-btn) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 19px;

  &:disabled {
    cursor: wait;
    opacity: 0.78;
    transform: none;
  }
}

.login-button-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.45);
  border-top-color: #fff;
  border-radius: 50%;
  animation: login-button-spin 0.8s linear infinite;
}

@keyframes login-button-spin {
  to {
    transform: rotate(360deg);
  }
}

.login-note {
  margin-top: 26px;
  padding: 13px 14px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  border: 1px solid color-mix(in srgb, var(--border-subtle) 92%, transparent);
  border-radius: 11px;
  background: color-mix(in srgb, var(--surface-subtle) 88%, var(--surface-card) 12%);

  .shield {
    width: 23px;
    height: 23px;
    flex: 0 0 23px;
    display: grid;
    place-items: center;
    border-radius: 7px;
    color: #12b76a;
    background: color-mix(in srgb, rgba(18, 183, 106, 0.12) 100%, var(--surface-card));
    font-size: 11px;
    font-weight: 700;
  }

  strong {
    color: var(--text-secondary);
    font-size: 10px;
    font-weight: 650;
  }

  p {
    margin-top: 2px;
    color: var(--text-tertiary);
    font-size: 9px;
    line-height: 1.5;
  }
}

:global(:root:root[class='dark']) {
  .login-form {
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

    :deep(.el-input__inner::placeholder) {
      color: var(--text-placeholder);
    }

    :deep(.el-checkbox__inner) {
      background: color-mix(in srgb, var(--surface-subtle) 74%, #1e293b 26%);
      border-color: color-mix(in srgb, var(--border-default) 82%, transparent);
    }
  }

  .login-note {
    border-color: color-mix(in srgb, var(--border-default) 72%, transparent);
    background:
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--surface-subtle) 82%, #1e293b 18%) 0%,
        color-mix(in srgb, var(--surface-card) 96%, transparent) 100%
      );
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
  }
}

@media (max-width: 980px) {
  .login-heading h2 {
    font-size: 28px;
  }
}

@media (max-width: 520px) {
  .form-options {
    align-items: flex-start;
    flex-direction: column;
  }

  .login-brand-mobile {
    margin-bottom: 42px;
  }

  .login-heading {
    margin-bottom: 26px;
  }

  .login-heading h2 {
    font-size: 25px;
  }
}
</style>
