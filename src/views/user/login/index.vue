<template>
  <x-page noHeader noFooter>
    <div class="login-page">
      <x-statusbar />
      <van-image class="logo" width="124rem" height="88.86rem" src="/public/static/img/login/logo.png" />
      <p class="name">Oneinstack</p>
      <div class="content">
        <van-form @submit="conf.handleLogin">
          <p class="form-label">服务器地址</p>
          <div class="form-item">
            <!-- <input placeholder="请输入您的服务器地址" /> -->
            <van-field
              v-model="conf.form.serverUrl"
              name="用户名"
              label=""
              placeholder="请输入您的服务器地址"
              :rules="[{ required: true, message: '请输入您的服务器地址' }]"
            />
          </div>
          <p class="form-label">账号</p>
          <div class="form-item">
            <van-field
              v-model="conf.form.username"
              name="用户名"
              label=""
              placeholder="请输入您的账号"
              :rules="[{ required: true, message: '请输入您的账号' }]"
            />
          </div>
          <p class="form-label">密码</p>
          <div class="form-item">
            <van-field
              v-model="conf.form.password"
              name="用户名"
              label=""
              placeholder="请输入您的密码"
              :type="conf.form.isShowPassword ? 'password':'text'"
              :rules="[{ required: true, message: '请输入您的密码' }]"
            />
            <van-image class="eye" width="40rem" height="40rem" :src="!conf.form.isShowPassword ? '/public/static/img/login/eye-open.png' :'/public/static/img/login/eye-close.png'" @click="conf.form.isShowPassword = !conf.form.isShowPassword " />
          </div>
          <van-button class="submit" round block type="primary" native-type="submit">提交</van-button>
        </van-form>
        <!-- <div class="submit" @click="conf.handleLogin">登录</div> -->
        <div class="clause">
          <van-checkbox v-model="conf.form.checked"></van-checkbox>
          <p>
            已阅读并同意
            <span>《服务条款》</span>
            与
            <span>《隐私协议》</span>
          </p>
        </div>
      </div>
    </div>
  </x-page>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { index } from './index'
import { ref, reactive } from 'vue'
import { showDialog } from 'vant'
import { apis } from '@/api/index'
import sconfig from '@/sstore/sconfig'
import System from '@/utils/System'
const router = useRouter()
const onSubmit = () => {
  router.push({
    path: '/'
  })
}
const conf = reactive({
  form: {
    username: '',
    password: '',
    serverUrl:'',
    checked: false,
    isShowPassword: false
  },
  loading: false,
  handleLogin: async () => {
    conf.loading = true
    const { data: res } = await apis.login({
      ...conf.form,
      final: () => (conf.loading = false)
    })
    console.log(res)
    // showDialog({
    //   message: res.msg,
    // }).then(() => {

    // })
    sconfig.login(res)
    // setTimeout(() => {
    //   System.router.push('/')
    // }, 500)
  }
})
</script>

<style lang="less" scoped>
.login-page {
  height: 100%;
  background: url('/public/static/img/login/login-bg.png');
  background-size: 100%;
  display: flex;
  flex-direction: column;
  .logo {
    margin-top: 80rem;
    margin-left: 40rem;
  }
  .name {
    margin-top: 42rem;
    margin-left: 54rem;
    font-size: 56rem;
    color: var(--card-bg-color);
  }
  .content {
    margin-top: 76rem;
    flex: 1;
    background: var(--card-bg-color);
    border-top-left-radius: 44rem;
    border-top-right-radius: 44rem;
    padding: 52rem 40rem;
    overflow-y: scroll;
    .form-label {
      font-size: 32rem;
      color: var(--font-gray-color);
      margin-top: 60rem;
    }
    .form-item {
      position: relative;
      margin-top: 28rem;
      // input {
      //   margin-top: 28rem;
      //   width: 100%;
      //   height: 88rem;
      //   border-radius: 12rem;
      //   background: #f7f7f7;
      //   padding: 32rem;
      //   font-size: 28rem;
      // }
      .eye {
        position: absolute;
        right: 32rem;
        top: 24rem;
      }
    }
    .submit {
      text-align: center;
      height: 88rem;
      line-height: 88rem;
      margin-top: 148rem;
      cursor: pointer;
      background: linear-gradient(to right, #2ACDFF, #1575FC);
      font-size: 36rem;
      color: var(--card-bg-color);
      border-radius: 12rem;
      border: none;
    }
    .clause {
      margin-top: 84rem;
      display: flex;
      align-items: center;
      justify-content: center;
      p {
        margin-left: 28rem;
        font-size: 24rem;
        color: var(--font-gray-color);
        span {
          color: var(--primary-color);
        }
      }
    }
  }
}
:deep(.van-cell) {
  width: 100%;
  padding: 0;
  border-radius: 12rem;
}
.van-cell:after{
  border: none;
}

:deep(.van-field__control) {
  height: 88rem;
  background: var(--bg-color);
  font-size: 28rem;
  padding: 32rem
}
</style>
