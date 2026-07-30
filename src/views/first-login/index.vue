<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { Api } from '@/api/Api'
import sconfig from '@/sstore/sconfig'
import System from '@/utils/System'

const formRef = ref<FormInstance>()
const form = reactive({
  password: '',
  confirmPassword: ''
})
const loading = ref(false)
const passwordRule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,128}$/
const rules: FormRules = {
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        passwordRule.test(value)
          ? callback()
          : callback(new Error('密码需包含大写字母、小写字母、数字和特殊字符，长度至少 8 位'))
      },
      trigger: ['blur', 'change']
    }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        value === form.password ? callback() : callback(new Error('两次输入的密码不一致'))
      },
      trigger: ['blur', 'change']
    }
  ]
}
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
    ElMessage.success('密码修改成功，请使用新密码重新登录')
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
        <h1>只差一步，完成您的<br />面板安全初始化</h1>
        <p>初始凭据仅用于首次登录。设置独立强密码后，即可进入服务器管理控制台。</p>
        <div class="protection-list">
          <div><i>01</i><span><b>强密码策略</b>降低暴力破解和凭据泄露风险</span></div>
          <div><i>02</i><span><b>本地安全存储</b>密码加密后保存在您的服务器</span></div>
          <div><i>03</i><span><b>操作可审计</b>关键账户行为均可追踪</span></div>
        </div>
      </div>
    </div>

    <main class="password-panel">
      <div class="password-card">
        <div class="step">安全初始化 · 第 1/1 步</div>
        <div class="title">设置新的管理密码</div>
        <div class="description">为了保护服务器，完成密码修改前暂时无法进入管理面板。</div>
        <el-alert
          title="密码需包含大写字母、小写字母、数字和特殊字符，长度至少 8 位。"
          type="warning"
          :closable="false"
          show-icon
        />
        <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
          <el-form-item label="新密码" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入新的管理密码"
              show-password
              autocomplete="new-password"
            />
          </el-form-item>
          <el-form-item label="确认新密码" prop="confirmPassword">
            <el-input
              v-model="form.confirmPassword"
              type="password"
              placeholder="请再次输入新密码"
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
            保存密码并重新登录
            <span>→</span>
          </el-button>
        </el-form>
        <div class="privacy-note">密码仅用于本机面板认证，不会上传到 OneinStack 服务中心。</div>
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
    radial-gradient(circle at 20% 10%, rgba(249, 115, 22, 0.2), transparent 26rem),
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
    color: #fb923c;
    background: rgba(249, 115, 22, 0.12);
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
    color: #fb923c;
    background: linear-gradient(145deg, rgba(249, 115, 22, 0.18), rgba(249, 115, 22, 0.05));
    clip-path: polygon(50% 0, 92% 16%, 86% 68%, 50% 100%, 14% 68%, 8% 16%);

    span {
      width: 28px;
      height: 28px;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background: rgba(249, 115, 22, 0.18);
      font-size: 14px;
      font-weight: 800;
    }
  }

  .eyebrow {
    margin-top: 28px;
    color: #fb923c;
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
    color: #fb923c;
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
    radial-gradient(circle at 100% 0, rgba(249, 115, 22, 0.07), transparent 25rem),
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
  color: #f97316;
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
      0 0 0 1px #f97316 inset,
      0 0 0 4px rgba(249, 115, 22, 0.11);
  }
}

.submit {
  width: 100%;
  min-height: 50px;
  margin-top: 5px;
  display: flex;
  justify-content: space-between;
  border-radius: 11px;
  background: linear-gradient(135deg, #f97316, #ea580c);
  box-shadow: 0 10px 24px rgba(249, 115, 22, 0.22);
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
