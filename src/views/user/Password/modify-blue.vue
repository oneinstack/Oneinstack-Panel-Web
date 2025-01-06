<template>
  <x-page bgcolor="#fff" :headerBgColor="stheme.theme.blue.headerBgColor()">
    <template #title>
      {{ conf.typeName == 'Account' ? $t('passwordModule.SetAccount') : $t('passwordModule.SetPayment') }}
    </template>
    <div class="content-view">
      <form>
        <template v-if="conf.hasOldPassword">
          <div class="title">{{ $t('passwordModule.OldPassword') }}</div>
          <div class="cu-form-group">
            <input
              :placeholder="$t('passwordModule.FillOld')"
              :type="conf.showPassword1 ? 'password' : 'text'"
              v-model="conf.formData.old_password"
              :maxlength="conf.typeName == 'Account' ? 15 : 6"
            />
            <van-icon
              @click="conf.showPassword1 = !conf.showPassword1"
              :name="conf.showPassword1 ? 'closed-eye' : 'eye'"
              :color="conf.showPassword1 ? '#000' : '#007aff'"
            />
          </div>
          <div class="title">{{ $t('passwordModule.NewPassword') }}</div>
          <div class="cu-form-group">
            <input
              :placeholder="$t('passwordModule.FillNew')"
              :type="conf.showPassword2 ? 'password' : 'text'"
              v-model="conf.formData.new_password"
              :maxlength="conf.typeName == 'Account' ? 15 : 6"
            />
            <van-icon
              @click="conf.showPassword2 = !conf.showPassword2"
              :name="conf.showPassword2 ? 'closed-eye' : 'eye'"
              :color="conf.showPassword2 ? '#000' : '#007aff'"
            />
          </div>
        </template>
        <template v-else>
          <div class="title">{{ $t('passwordModule.Password') }}</div>
          <div class="cu-form-group">
            <input
              :placeholder="$t('passwordModule.FillPassword')"
              :type="conf.showPassword4 ? 'password' : 'text'"
              v-model="conf.formData.password"
              :maxlength="conf.typeName == 'Account' ? 15 : 6"
              @input="conf.vfFun($event, 'password')"
            />
            <van-icon
              @click="conf.showPassword4 = !conf.showPassword4"
              :name="conf.showPassword4 ? 'closed-eye' : 'eye'"
              :color="conf.showPassword4 ? '#000' : '#007aff'"
            />
          </div>
        </template>
        <div class="title">{{ $t('passwordModule.ConfirmPassword') }}</div>
        <div class="cu-form-group">
          <input
            :placeholder="$t('passwordModule.FillConfirmation')"
            :type="conf.showPassword3 ? 'password' : 'text'"
            v-model="conf.formData.confirm_password"
            :maxlength="conf.typeName == 'Account' ? 15 : 6"
            @input="conf.vfFun($event, 'confirm_password')"
          />
          <van-icon
            @click="conf.showPassword3 = !conf.showPassword3"
            :name="conf.showPassword3 ? 'closed-eye' : 'eye'"
            :color="conf.showPassword3 ? '#000' : '#007aff'"
          />
        </div>
      </form>

      <!-- btn -->
      <div class="btn-view">
        <div @click="conf.handleDataSubmit">{{ $t('passwordModule.Verify') }}</div>
      </div>
    </div>

    <!-- 忘记密码modal -->
    <div class="cu-modal" :class="conf.modalName == 'forgot' ? 'show' : ''">
      <div class="cu-dialog">
        <div class="cu-bar bg-white justify-end">
          <!-- <div class="content">Modal标题</div> -->
          <div class="action" @tap="conf.hideModal">
            <span class="cuIcon-close text-red"></span>
          </div>
        </div>
        <div class="padding-xl">
          <div style="margin: 30rem 0rem; color: #828282">Whether to send the verification code to</div>
          <div style="font-size: 36rem; opacity: 0.8">12345678901</div>
        </div>
        <div class="modal-btn-view">
          <div class="left-btn" @click="conf.modalName = null">Cancel</div>
          <div class="right-btn" @click="conf.handleSend">Send</div>
        </div>
      </div>
    </div>
  </x-page>
</template>
<script lang="ts" setup>
import { index } from './modify'
import stheme from '@/sstore/stheme'

const conf = index()
</script>

<style lang="less" scoped>
.content-view {
  padding: 20rem;
  background: #fff;
}

.title {
  color: #000000;
  padding: 20rem 30rem;
  font-size: 32rem;
  opacity: 0.7;
  font-weight: 500;
}

.cu-form-group,
.input {
  background: #f6f7fa;
  border-radius: 10rem;
  color: #a8a8a8;
  opacity: 0.7;
  font-weight: 500;
  font-size: 24rem;
}

.cu-form-group {
  height: 72rem !important;
  line-height: 72rem !important;
  min-height: 72rem !important;
}

.light {
  color: #007aff;
}

.forgot-view {
  padding: 20rem;
  background: linear-gradient(to bottom, #eb602d, #ffa64f);
  -webkit-background-clip: text; /* 使用-webkit-前缀兼容部分浏览器 */
  background-clip: text;
  color: transparent;
  font-size: 20rem;
  font-weight: 500;
}

.btn-view {
  margin-top: 100rem;
  width: calc(100% - 60rem);
  background: linear-gradient(93.51deg, #006fff 5.72%, #087bff 86.61%);
  border-radius: 82rem;
  text-align: center;
  color: #fff;
  font-weight: 500;
  font-size: 40rem;
  height: 100rem;
  line-height: 100rem;
  margin-left: 30rem;
}

.modal-btn-view {
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin-bottom: 50rem;
}

.left-btn,
.right-btn {
  text-align: center;
  background-color: #f17638;
  color: #fff;
  border-radius: 80rem;
  font-size: 26rem;
  font-weight: 600;
  height: 52rem;
  line-height: 52rem;
  width: 132rem;
}

.left-btn {
  background-color: #fff2df;
  color: #000000;
  opacity: 0.7;
}

.right-btn {
  background-color: #eb602d;
  color: #fff;
}

.bg-white {
  display: none;
}

.cu-dialog {
  border-radius: 40rem;
  width: 560rem;
  box-shadow: 0 2rem 10rem #fffbf5;
}

.padding-xl {
  font-weight: 600;
  font-size: 26rem;
}

.cu-modal {
  width: 100%;
  max-width: 750rem;
  margin: 0 auto;
}
</style>
