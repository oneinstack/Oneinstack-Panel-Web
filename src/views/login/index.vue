<script setup lang="ts">
import { reactive, useTemplateRef, ref } from 'vue'
import LoginContainer from './components/login-container.vue'
import System from '@/utils/System'
import { Api } from '@/api/Api'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import sconfig from '@/sstore/sconfig'
import sapp from "@/sstore/sapp";
// import i18n from '@/lang/index.ts'

const isMobile = ref(window.innerWidth <= 768 ? false : true)

window.addEventListener('resize', () => {
  isMobile.value = window.innerWidth >= 768
})

const conf = reactive({
  form: {
    username: '',
    password: '',
    remember: false
  },
  loading: false,
  formRef: useTemplateRef<FormInstance>('formRef'),
  rules: {
    username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
    password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
  } as FormRules,
  handleLogin: () => {
    conf.formRef?.validate(async valid => {
      if (!valid) return
      conf.loading = true
      const { data: res } = await Api.login({
        ...conf.form,
        final: () => conf.loading = false
      })
      console.log('登陆',res)
      ElMessage.success('登录成功')
      // 更新首次登录状态
      sapp.setFirstLogin(res.firstLogin)
      sconfig.login(res)
      setTimeout(() => {
        System.router.push('/')
        // 根据 firstLogin 控制插件弹窗
      }, 500)
      // getSystemInfo()
    })
  },
  handleToAppLogin: () => {
    System.router.push('/login/scan')
  }
})
// //获取网页标题并修改网页标题
// const getSystemInfo = async () => {
//   try {
//     const { data: res } = await Api.getSystemInfo()
//     document.title = res.title+'' 
//   } catch (error) {
//     ElMessage.error('获取系统信息失败')
//   }
// }
</script>

<template>
  <login-container :loading="conf.loading" currentActive="login">
    <template #default="{ className }">
      <div class="logo-box flex justify-center fit-width" :class="{ 'mobile-logo': isMobile }">
        <!-- <transition name="logo-fade" mode="out-in">
          <img v-if="isMobile" src="/static/images/logo-pc.png" alt="logo" width="320" height="60" key="pc-logo" />
          <img v-else src="/static/images/logo-app.png" alt="logo" width="180" height="180" key="mobile-logo" />
        </transition> -->
      </div>
      <div class="" :class="{ 'login-title-box': isMobile }">
        <div class="login-title flex" :class="{ 'mobile-title': isMobile }">
          <!-- {{i18n.t('welcome')}} -->
          <transition name="fade" mode="out-in">
            <img v-if="isMobile" src="/static/images/logo-pc.png" alt="logo" width="202.62" height="35.32"
              key="pc-logo" />
            <img v-else src="/static/images/logo-app.png" alt="logo" width="180" height="180" key="mobile-logo" />
          </transition>
        </div>
        <el-form ref="formRef" :model="conf.form" :rules="conf.rules" class="fit-width">
          <el-form-item :class="[className.formItemGap, { 'input-box': !isMobile }]" prop="username">
            <el-input v-model.trim="conf.form.username" :placeholder="$t('commons.login.usernamePlaceholder')" clearable
              :class="{ 'pc-input': isMobile }">
              <template #prefix>
                <v-s-icon name="user" size="20" />
              </template>
            </el-input>
          </el-form-item>
          <el-form-item prop="password" :class="{ 'input-box': !isMobile }">
            <el-input v-model.trim="conf.form.password" :placeholder="$t('commons.login.passwordPlaceholder')" type="password" clearable
              :class="{ 'pc-input': isMobile }">
              <template #prefix>
                <v-s-icon name="password" size="20" />
              </template>
            </el-input>
          </el-form-item>
          <div class="flex justify-between">
            <el-checkbox v-model="conf.form.remember" :label="$t('commons.login.remeber')" />
          </div>
          <button :class="[className.loginBtn, { 'mobile-btn': isMobile }]" @click.prevent="conf.handleLogin">{{ $t('commons.button.login') }}</button>
        </el-form>
      </div>
      <!-- <div :class="className.other">
        <el-divider class="login-content-right__main-other-title">
          <el-link @click="conf.handleToAppLogin">App扫码登录</el-link>
        </el-divider>
      </div> -->
    </template>
  </login-container>
</template>

<style scoped lang="less">
@primary-color: #1677FF;
@font-gray: #a2a2a2;
@border-gray: #e3e3e3;
@bg-color: #f5f5f5;

:deep(.el-input__wrapper.is-focus){
  border-bottom: 1px solid #1677FF !important;
}

:deep(.el-checkbox) {
  --el-checkbox-font-size: 0.75rem; // 12px
}
:deep(.el-checkbox__label) {
  padding-left: 6px;
  font-weight: 400;
}
:deep(.el-checkbox__inner){
  width: 0.625rem; // 10px
  height: 0.625rem; // 10px
}
:deep(.el-checkbox__inner:after) {
  width: 0.125rem !important; // 2px
  left: 0.1875rem !important; // 3px
  top: 0.0625rem !important; // 1px
  height: 0.3125rem !important; // 5px
}

.login-title {
  display: flex;
  font-size: 32px;
  font-weight: 600;
  color: #2b2b2b;
  margin-bottom: 40px;
  text-align: left;
  justify-content: center;
  width: 100%;
}

.login-title-box {
  width: 415px;
  height: 451px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #ffffff;
  padding: 49px 58px 54px 58px;
  border-radius: 40px;
  box-shadow: 0px 12px 32px 1px rgba(0, 0, 0, 0.11);
}

.input-box {
  width: 300px;
  height: 62px;
  background: #FAF4EC;
  border-radius: 20px 20px 20px 20px;
  padding: 0 20px;
}

.pc-input {
  // border-bottom: none;
  border-bottom: 1px solid #f5f5f5
}

.login-content-right__main {
  &-logo {
    margin-bottom: 5rem; // 80px
  }

  &-other {
    &-btn {
      margin-top: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 14px;
      font-size: 16px;
      color: #2b2b2b;
      cursor: pointer;

      .vsicon {
        border-radius: 50%;
        transition: box-shadow 0.3s;
      }

      &:hover {
        color: @primary-color;

        .vsicon {
          box-shadow: 0 0 10px @primary-color;
        }
      }
    }
  }
}
</style>
