<template>
  <x-page>
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
import { apis } from '@/api'
import i18n from '@/lang'
import sutil from '@/sstore/sutil'
import { svf } from '@/sstore/svf'
import System from '@/utils/System'
import { onMounted, reactive } from 'vue'

const conf = reactive({
  typeName: '',
  formData: {
    old_password: '',
    password: '',
    new_password: '',
    confirm_password: ''
  },
  showPassword1: true,
  showPassword2: true,
  showPassword3: true,
  showPassword4: true,
  modalName: null,
  hasOldPassword: true,
  statusObj: {} as any,
  vf: {} as any,
  vfFun: (e: any, name: any) => {
    conf.vf[name](e)
  },

  //忘记密码
  handleForgot(e: any) {
    conf.modalName = e.currentTarget.dataset.modal
  },

  //关闭modal
  hideModal() {
    conf.modalName = null
  },

  //发送验证码页面
  handleSend() {
    System.router.push('/user/Password/send')
  },

  //数据提交
  handleDataSubmit: async () => {
    let obj = {} as any,
      isNull = false,
      isInconsistent = false,
      isSame = false,
      isLength = false
    if (conf.hasOldPassword) {
      // 为空校验
      if (!conf.formData.old_password || !conf.formData.new_password || !conf.formData.confirm_password) {
        isNull = true
      }

      //设置密码不一致
      if (conf.formData.new_password != conf.formData.confirm_password) {
        isInconsistent = true
      }

      //旧密码与新密码设置一致提示
      if (conf.formData.old_password == conf.formData.new_password) {
        isSame = true
      }

      //支付密码输入长度判断
      if (
        conf.typeName != 'Account' &&
        (conf.formData.old_password.length < 6 || conf.formData.confirm_password.length < 6)
      ) {
        isLength = true
      }

      obj.oldPass = conf.formData.old_password
      obj.newPass = conf.formData.new_password
      obj.renewPass = conf.formData.confirm_password
    } else {
      // 为空校验
      if (!conf.formData.password || !conf.formData.confirm_password) {
        isNull = true
      }

      //支付密码输入长度判断
      if (
        conf.typeName != 'Account' &&
        (conf.formData.confirm_password.length < 6 ||
          conf.formData.password.length < 6 ||
          (conf.hasOldPassword && conf.formData.old_password.length < 6))
      ) {
        isLength = true
      }

      //设置密码不一致
      if (conf.formData.password != conf.formData.confirm_password) {
        isInconsistent = true
      }

      obj.oldPass = ''
      obj.newPass = conf.formData.password
      obj.renewPass = conf.formData.confirm_password
    }

    if (isNull) {
      System.toast(i18n.t('passwordModule.modification'))
      return
    }

    if (isLength) {
      System.toast(i18n.t('passwordModule.lengthTip'))
      return
    }

    if (isInconsistent) {
      System.toast(i18n.t('passwordModule.settings'))
      return
    }

    if (isSame) {
      System.toast(i18n.t('passwordModule.sameTip'))
      return
    }

    let url = null as any

    switch (conf.typeName) {
      //账号密码
      case 'Account':
        url = apis.changepass
        break
      //支付密码
      case 'Payment':
        url = apis.updateWithdrawPassword
        break
    }

    const res = await url({
      ...obj
    })

    System.toast(i18n.t(`code.${res.code}`) || 'success')
    setTimeout(() => {
      if (conf.typeName == 'Account') {
        System.router.push('/user/login/login?type=3')
      } else {
        sutil.pageBack()
      }
    }, 2000)
  }
})

const init = async () => {
  conf.vf = svf.getVf(conf.formData, {
    password: {
      getNum: true
    },
    confirm_password: {
      getNum: true
    }
  })
  conf.typeName = Cookie.get('passwordType')
  conf.statusObj = Cookie.get('statusObj')
  //账号密码状态
  if (conf.typeName == 'Account') {
    conf.statusObj.userPasswordStatus && (conf.hasOldPassword = true)
    !conf.statusObj.userPasswordStatus && (conf.hasOldPassword = false)
  } else {
    conf.statusObj.userWithdrawPasswordStatus && (conf.hasOldPassword = true)
    !conf.statusObj.userWithdrawPasswordStatus && (conf.hasOldPassword = false)
  }
  const option = System.getRouterParams()
  option.hasOwnProperty('hasOldPassword') && (conf.hasOldPassword = JSON.parse(option.hasOldPassword.toLowerCase()))
}
onMounted(() => {
  init()
})
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
  background: #fffbf5;
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
  background: linear-gradient(180deg, #eb602d 0%, #ffa64f 160%);
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
  max-width: 500px;
  margin: 0 auto;
}
</style>
