<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref, useTemplateRef } from 'vue'
import LoginContainer from './components/login-container.vue'
import System from '@/utils/System'
import { Api } from '@/api/Api'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import sconfig from '@/sstore/sconfig'

const isDesktop = ref(window.innerWidth > 980)
const updateViewport = () => {
  isDesktop.value = window.innerWidth > 980
}

onMounted(() => window.addEventListener('resize', updateViewport))
onBeforeUnmount(() => window.removeEventListener('resize', updateViewport))

const goAfterLogin = (routePath: string) => {
  const normalizedRoute = routePath.startsWith('/') ? routePath : `/${routePath}`
  const currentPathname = window.location.pathname || '/'
  if (currentPathname !== '/') {
    const hashURL = `${window.location.origin}${currentPathname}#${normalizedRoute}`
    window.location.replace(hashURL)
    return
  }
  System.router.push(normalizedRoute)
}

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
  rules: {
    username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
    password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
    totpCode: [{ required: true, message: '请输入动态口令或恢复码', trigger: 'blur' }]
  } as FormRules,
  handleLogin: () => {
    conf.formRef?.validate(async valid => {
      if (!valid) return
      conf.loading = true
      try {
        const { data: res } = await Api.login({
          username: conf.form.username,
          password: conf.form.password,
          totpCode: conf.requiresTwoFactor ? conf.form.totpCode : '',
          final: () => conf.loading = false
        })
        if (res.requiresTwoFactor && !res.authenticated) {
          conf.requiresTwoFactor = true
          conf.form.totpCode = ''
          ElMessage.info('请输入身份验证器动态口令或恢复码')
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

        ElMessage.success('登录成功')
        setTimeout(() => {
          goAfterLogin(res.mustChangePassword ? '/first-login' : '/')
        }, 500)
      } catch {
        conf.loading = false
      }
    })
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
          <span>服务器管理控制台</span>
        </div>
      </div>

      <div class="login-heading">
        <div class="eyebrow">WELCOME BACK</div>
        <h2>{{ conf.requiresTwoFactor ? '验证您的身份' : '登录管理面板' }}</h2>
        <p>
          {{ conf.requiresTwoFactor ? '完成二次认证后即可安全进入控制台。' : '使用面板管理员账号继续访问服务器。' }}
        </p>
      </div>

      <el-form ref="formRef" :model="conf.form" :rules="conf.rules" class="login-form">
        <el-alert
          v-if="conf.requiresTwoFactor"
          title="二次认证"
          description="请输入身份验证器中的 6 位动态口令，也可以使用一条未使用的恢复码。"
          type="info"
          :closable="false"
          show-icon
          class="two-factor-alert"
        />

        <el-form-item
          v-if="!conf.requiresTwoFactor"
          :class="className.formItemGap"
          prop="username"
          label="账号"
        >
          <el-input
            v-model="conf.form.username"
            placeholder="请输入管理员账号"
            clearable
            autocomplete="username"
            @keyup.enter="conf.handleLogin"
          >
            <template #prefix>
              <v-s-icon name="user" size="19" />
            </template>
          </el-input>
        </el-form-item>

        <el-form-item v-if="!conf.requiresTwoFactor" prop="password" label="密码">
          <el-input
            v-model="conf.form.password"
            placeholder="请输入登录密码"
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

        <el-form-item v-else prop="totpCode" label="动态口令或恢复码">
          <el-input
            v-model="conf.form.totpCode"
            placeholder="请输入认证代码"
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
          <el-checkbox v-model="conf.form.remember" label="记住登录状态" />
          <span class="security-tip"><i></i> 加密连接</span>
        </div>
        <el-button
          v-else
          link
          class="back-button"
          @click="conf.requiresTwoFactor = false; conf.form.totpCode = ''"
        >
          ← 返回账号密码登录
        </el-button>

        <button :class="className.loginBtn" type="button" @click="conf.handleLogin">
          <span>{{ conf.requiresTwoFactor ? '验证并登录' : '安全登录' }}</span>
          <span aria-hidden="true">→</span>
        </button>
      </el-form>

      <div class="login-note">
        <span class="shield">✓</span>
        <div>
          <strong>安全提示</strong>
          <p>请确认访问地址正确，不要在公共设备保存登录信息。</p>
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
    background: #fff1e7;
    font-size: 13px;
    font-weight: 800;
  }

  > div:last-child {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  strong {
    color: #182230;
    font-size: 14px;
  }

  span {
    color: #98a2b3;
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
    color: #182230;
    font-size: 30px;
    font-weight: 720;
    line-height: 1.3;
    letter-spacing: -0.035em;
  }

  p {
    margin-top: 10px;
    color: #667085;
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
    color: #344054;
    font-size: 12px;
    font-weight: 620;
    line-height: 1.4;
  }

  :deep(.el-input__wrapper) {
    min-height: 50px;
    padding: 1px 15px;
    border-radius: 11px;
    background: #f9fafb;
    box-shadow: 0 0 0 1px #e4e7ec inset;

    &:hover {
      box-shadow: 0 0 0 1px #cfd4dc inset;
    }

    &.is-focus {
      background: #fff;
      box-shadow:
        0 0 0 1px rgb(var(--primary-color)) inset,
        0 0 0 4px rgba(var(--primary-color), 0.11);
    }
  }

  :deep(.el-input__inner) {
    color: #182230;
    font-size: 13px;
  }

  :deep(.el-checkbox__label) {
    color: #667085;
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

  .security-tip {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #98a2b3;
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
}

.login-note {
  margin-top: 26px;
  padding: 13px 14px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  border: 1px solid #eaecf0;
  border-radius: 11px;
  background: #f9fafb;

  .shield {
    width: 23px;
    height: 23px;
    flex: 0 0 23px;
    display: grid;
    place-items: center;
    border-radius: 7px;
    color: #12b76a;
    background: #ecfdf3;
    font-size: 11px;
    font-weight: 700;
  }

  strong {
    color: #475467;
    font-size: 10px;
    font-weight: 650;
  }

  p {
    margin-top: 2px;
    color: #98a2b3;
    font-size: 9px;
    line-height: 1.5;
  }
}

@media (max-width: 980px) {
  .login-heading h2 {
    font-size: 28px;
  }
}

@media (max-width: 520px) {
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
