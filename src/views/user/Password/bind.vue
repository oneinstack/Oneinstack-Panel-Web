<template>
  <x-page>
    <template #title>
      {{ conf.titleName }}
    </template>
    <div class="content-view">
      <!-- 手机 -->
      <template v-if="conf.typeName == 'Phone'">
        <div class="input-box">
          <div class="lable">{{ $t('addBankCradModule.Phone') }}</div>
          <div class="input-view" style="display: flex">
            <div class="left-view" @click="conf.handleOpenMadal">
              <div class="input1" :class="!conf.formData.area_code ? 'select-value' : ''">
                <img :src="conf.selectAreaCodeObj.flagUrl" style="width: 37rem; height: 37rem; margin-right: 15rem" />
                <div class="code-icon">
                  <span>{{ conf.formData.area_code ? '+' + conf.formData.area_code : '' }}</span>
                  <van-icon class="cuIcon-right" name="arrow" />
                </div>
              </div>
            </div>
            <div class="right-view">
              <input
                class="input2"
                :placeholder="$t('addBankCradModule.pleaseEnterPhone')"
                v-model="conf.formData.mobile_phone"
                :disabled="conf.mode"
                @input="conf.vfFun($event, 'mobile_phone')"
              />
              <div v-if="conf.formData.mobile_phone" @click="conf.handleClearInput('mobile_phone')">
                <span class="cuIcon-close"></span>
              </div>
            </div>
          </div>
        </div>
        <div class="input-box" v-if="!conf.mode">
          <div class="lable">{{ $t('addBankCradModule.VerificationCode') }}</div>
          <div class="input-view" style="margin-top: 20rem">
            <input
              class="input"
              :placeholder="$t('common.PleaseEnter')"
              v-model="conf.formData.verification_code"
              @input="conf.vfFun($event, 'verification_code')"
            />
            <div class="code-btn" @click="conf.handleGetCode('phone')" v-if="conf.Countdown == 60">
              {{ $t('login.message') }}
            </div>
            <div class="countdown" v-else>{{ conf.Countdown + 's' }}</div>
          </div>
        </div>
      </template>

      <!-- Email -->
      <template v-else>
        <div class="input-box">
          <div class="lable">{{ $t('login.email') }}</div>
          <div class="input-view">
            <input
              class="input"
              :placeholder="$t('addBankCradModule.pleaseEnterEmail')"
              v-model="conf.formData.email"
              @input="conf.vfFun($event, 'email')"
              :disabled="conf.mode"
            />
            <div v-if="conf.formData.email" @click="conf.handleClearInput('email')">
              <span class="cuIcon-close"></span>
            </div>
          </div>
        </div>
        <div class="input-box" v-if="!conf.mode">
          <div class="lable">{{ $t('addBankCradModule.VerificationCode') }}</div>
          <div class="input-view" style="margin-top: 20rem">
            <input
              class="input"
              :placeholder="$t('common.PleaseEnter')"
              v-model="conf.formData.verification_code"
              @input="conf.vfFun($event, 'verification_code')"
            />
            <div class="code-btn" @click="conf.handleGetCode('email')" v-if="conf.Countdown == 60">
              {{ $t('login.message') }}
            </div>
            <div class="countdown" v-else>{{ conf.Countdown + 's' }}</div>
          </div>
        </div>
      </template>

      <!-- btn -->
      <div class="btn-view">
        <div class="sumit-btn" @click="conf.handleDataSubmit">
          {{ $t(conf.mode ? 'passwordModule.Change' : 'addBankCradModule.Bind') }}
        </div>
      </div>
    </div>

    <!-- 手机区号模态框 -->
    <div class="cu-modal bottom-modal" :class="conf.modalShow ? 'show' : ''">
      <div class="cu-dialog">
        <div class="padding-xl">
          <!-- btns -->
          <div class="model-btn">
            <div class="left-btn" @click="conf.handleAreaCodeCancel">{{ $t('agencyCenterModule.cancellation') }}</div>
            <div class="right-btn" @click="conf.handleAreaCodeConfirm">{{ $t('agencyCenterModule.determine') }}</div>
          </div>
          <!-- picker -->
          <van-picker
            :visible-option-num="3"
            :show-toolbar="false"
            :columns="conf.areaCodeList"
            @scroll-into="conf.bindChange"
          >
            <template #option="item">
              {{ item.showName + ' ' + item.areaCode }}
            </template>
          </van-picker>
        </div>
        <x-no-data v-if="conf.areaCodeList.length == 0"></x-no-data>
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
import { Scope } from 'tools-vue3'
import { onMounted, reactive } from 'vue'

const timer = Scope.Timer()
const conf = reactive({
  mode: null as any,
  formData: {
    area_code: '', //区号
    mobile_phone: '', //手机号
    verification_code: '', //验证码
    email: '' //邮箱
  } as any,
  areaCodeList: [] as any[],
  selectAreaCodeObj: {} as any,
  modalShow: false,
  Countdown: 60,
  visible: true,
  value: [0],
  modalTitle: '',
  titleName: '',
  typeName: '',
  isGetCode: false,
  vf: {} as any,
  vfFun: (e: any, name: any) => {
    conf.vf[name](e)
  },

  //获取手机区号列表数据
  getAreaCode: async () => {
    System.loading()
    const res = await apis.getCountry({
      complete: () => {
        System.loading(false)
      }
    })
    conf.areaCodeList = res.data || []
    conf.selectAreaCodeObj = conf.areaCodeList[0] || {}
    conf.formData.area_code = conf.areaCodeList[0].areaCode || ''
  },

  //打开modal
  handleOpenMadal() {
    if (conf.mode) return
    conf.modalShow = true
  },

  //关闭modal
  hideModal() {
    conf.modalShow = false
  },

  // input => 清空
  handleClearInput(key: any) {
    conf.formData[key] = ''
  },

  //eamil => 输入事件
  handleEmailInput(e: any) {
    let val = e.target.value
    let regex = /[\u4e00-\u9fa5]/g // 匹配任何中文字符
    if (regex.test(val)) {
      val = val.replace(regex, '') // 删除中文字符
    }
    conf.formData.email = val
  },

  // 手机区号picker => change事件
  bindChange({ currentOption }: any) {
    conf.value = [conf.areaCodeList.findIndex((item: any) => item.areaCode == currentOption.areaCode)]
    conf.formData.mobile_phone = ''
    conf.formData.verification_code = ''
    conf.Countdown = 60
  },

  // 手机区号picker取消btn
  handleAreaCodeCancel() {
    conf.modalShow = false
  },

  // 手机区号picker确认btn
  handleAreaCodeConfirm() {
    conf.selectAreaCodeObj.flagUrl = ''
    let index = conf.value[0]
    conf.formData.area_code = conf.areaCodeList[index].areaCode
    conf.selectAreaCodeObj = conf.areaCodeList[index]
    conf.modalShow = false
  },

  //获取验证码btn
  handleGetCode: async (type: any) => {
    let isNull = false,
      tipInfo = '',
      apiUrl = null as any,
      obj = {}
    switch (type) {
      case 'phone':
        let str1 = eval('/' + conf.selectAreaCodeObj.phoneRule + '/')
        if (!str1.test(conf.formData.mobile_phone)) {
          isNull = true
          tipInfo = i18n.t('addBankCradModule.correctphoneTip')
        }
        if (!conf.formData.mobile_phone) {
          isNull = true
          tipInfo = i18n.t('addBankCradModule.enterPhoneTip')
        }
        apiUrl = apis.phoneVerify
        obj = {
          areaCode: conf.selectAreaCodeObj.areaCode,
          mobile: conf.formData.mobile_phone
        }
        break
      case 'email':
        let regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!regex.test(conf.formData.email)) {
          isNull = true
          tipInfo = i18n.t('addBankCradModule.correctEmailTip')
        }
        if (!conf.formData.email) {
          isNull = true
          tipInfo = i18n.t('login.emailPlace')
        }
        apiUrl = apis.emailSendCode
        obj = {
          email: conf.formData.email
        }
        break
    }

    if (isNull) {
      System.toast(tipInfo)
      return
    }

    System.loading()
    const res = await apiUrl({
      ...obj,
      complete: () => {
        System.loading(false)
      }
    })

    conf.isGetCode = true
    conf.handleCountdown()
    System.toast(i18n.t(`code.${res.code}`) || 'success', 'success')
  },

  //倒计时
  handleCountdown() {
    if (conf.Countdown == 0) {
      conf.Countdown = 60
    } else {
      conf.Countdown -= 1
      timer.once(conf.handleCountdown, 1000)
    }
  },

  // 数据提交
  handleDataSubmit: async () => {
    if (conf.mode) {
      conf.mode = null
      return
    }
    let nullArr = [],
      obj = {}
    if (conf.typeName == 'Phone') {
      nullArr = ['area_code', 'mobile_phone', 'verification_code']
      obj = {
        areaCode: conf.formData.area_code,
        code: conf.formData.verification_code,
        type: conf.formData.mobile_phone
      }
    } else {
      nullArr = ['email', 'verification_code']
      obj = {
        code: conf.formData.verification_code,
        type: conf.formData.email
      }
    }

    let isNull = false
    for (let key of nullArr) {
      !conf.formData[key] && (isNull = true)
    }
    if (isNull) {
      System.toast(i18n.t('addBankCradModule.formTip'))
      return
    }

    let str1 = eval('/' + conf.selectAreaCodeObj.phoneRule + '/')
    if (!str1.test(conf.formData.mobile_phone) && conf.typeName == 'Phone') {
      System.toast(i18n.t('addBankCradModule.correctphoneTip'))
      return
    }

    let regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!regex.test(conf.formData.email) && conf.typeName != 'Phone') {
      System.toast(i18n.t('addBankCradModule.correctphoneTip'))
      return
    }

    if (!conf.isGetCode) {
      System.toast(i18n.t('addBankCradModule.getCode'))
      return
    }

    System.loading()
    const res = await apis.bindByCode({
      ...obj,
      complete: () => {
        System.loading(false)
      }
    })
    System.toast(i18n.t(`code.${res.code}`) || 'success', 'success')
    timer.once(() => {
      sutil.pageBack()
    }, 2000)
  }
})

const init = async () => {
  const param = System.getRouterParams()
  conf.mode = param.mode
  conf.formData.mobile_phone = param.phone
  conf.formData.email = param.email
  conf.vf = svf.getVf(conf.formData, {
    email: {
      getNum: true,
      getEn: true,
      getCustom: '@.'
    },
    verification_code: {
      getNum: true,
      getEn: true
    },
    mobile_phone: {
      getNum: true,
    }
  })
  conf.typeName = Cookie.get('passwordType')
  if (conf.typeName == 'Phone') {
    conf.titleName = i18n.t('passwordModule.SetPhone')
  } else {
    conf.titleName = i18n.t('passwordModule.SetEmail')
  }
  conf.getAreaCode()
}
onMounted(() => {
  init()
})
</script>

<style lang="less" scoped>
.header-view {
  height: 104rem;
  background: linear-gradient(#ed6630, #fea24d) !important;
  display: flex;
  position: relative;
  line-height: 104rem;

  .back {
    color: #fff;
    position: absolute;
    left: 20rem;
  }

  .head-title {
    width: 100%;
    text-align: center;
    color: #fff;
    font-size: 32rem;
    font-weight: 600;
  }
}

.btn-view {
  width: 80%;
  margin-left: 10%;
  margin-top: 80rem;

  .sumit-btn {
    text-align: center;
    width: 100% !important;
    background-color: #f17638;
    color: #fff;
    border-radius: 50rem;
    padding: 20rem;
    font-weight: bold;
    font-size: 36rem;
  }
}

.winning-box {
  // padding: 0rem 24rem 24rem;
  background: #fff;
  .winning-item {
    padding: 0rem 24rem 24rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 96rem;
    border-bottom: 1px solid #f9fafc;
    .left-view {
      display: flex;
      align-items: center;
      .avatar {
        width: 70rem;
        height: 70rem;
        margin-right: 15rem;
        border-radius: 50%;
      }
      .userName {
        color: rgb(132, 132, 144);
        font-size: 24rem;
      }
    }
    .right-view {
      text-align: right;
      .actOpt::before {
        content: '✔';
        width: 30rem;
        height: 40rem;
        transform: rotate(45deg);
        color: green;
      }
    }
  }
}

.content-view {
  background: #fff;
  padding-bottom: 20rem;
}

.select-value {
  color: #c3c2c1 !important;
  overflow: hidden;
  text-overflow: clip;
  white-space: pre;
  word-break: keep-all;
  pointer-events: none;
  line-height: inherit;
}

.input-view {
  color: inherit;
  opacity: 0.9;
  font: inherit;
  line-height: inherit;
  letter-spacing: inherit;
  text-align: inherit;
  text-indent: inherit;
  text-transform: inherit;
  text-shadow: inherit;
}

.cu-bar .content {
  width: 100% !important;
}

.activeRecharge {
  background: #fff6e6 !important;
  position: relative;
}

.cu-form-group {
  display: flex;
  justify-content: start;
  align-items: center !important;
}

.photo-view {
  margin: 20rem 0rem;
  width: 280rem;
  height: 280rem;
  border-radius: 20rem;
  background-color: #fffbf5;
  font-size: 40rem;
  color: #00000010;
  text-align: center;
  line-height: 280rem;
  .img-bg {
    width: 100%;
    height: 100%;
    border-radius: 20rem;
  }
}

.uni-input-placeholder,
.select-placeholder {
  color: #a8a8a860 !important;
}

.active-view {
  // background: #F17638;
  // color: #fff;
  background: #fffbf5;
  background: linear-gradient(#eb602d, #ffa64f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.input-box {
  padding: 30rem 30rem 0rem 30rem;
  .lable {
    color: #000;
    font-weight: 500;
    font-size: 32rem;
    padding-left: 20rem;
  }

  .input-view {
    position: relative;
    height: 72rem;
    .input {
      width: 100%;
      border-radius: 10rem;
      background: #fffbf5;
      height: 72rem;
      padding: 16rem 22rem;
      color: #000;
      font-size: 28rem;
    }
    .uni-input-placeholder {
      color: #c3c2c1;
      font-size: 28rem;
    }
    // .cuIcon-right{
    // 	position: absolute;
    // 	right: 10rem;
    // 	top: calc(50% - 14rem);
    // 	rotate: 90deg;
    // }

    .cuIcon-close {
      position: absolute;
      right: 20rem;
      top: calc(50% - 14rem);
    }

    .code-btn {
      position: absolute;
      right: 20rem;
      min-width: 100rem;
      border-radius: 24rem;
      border: 1rem solid rgb(0, 0, 0);
      border-color: #ffd8ba !important;
      background: linear-gradient(to right, #eb602d, #ffa64f);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      top: calc(50% - 28rem);
      text-align: center;
      padding: 8rem 15rem;
    }

    .countdown {
      position: absolute;
      right: 20rem;
      min-width: 100rem;
      height: 40rem;
      line-height: 40rem;
      // border-radius: 24rem;
      // border: 1rem solid rgb(0, 0, 0);
      // border-color: #FFD8BA !important;
      background: linear-gradient(to right, #eb602d, #ffa64f);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      top: calc(50% - 20rem);
      text-align: center;
      padding: 0rem 20rem;
    }

    .left-view {
      width: 20%;
      position: relative;
      height: 72rem;
      margin-top: 20rem;
      .input1 {
        border-radius: 10rem;
        background: #fffbf5;
        height: 72rem;
        // padding: 16rem 22rem;
        color: #000;
        font-size: 28rem;
        width: 100%;
        line-height: 28rem;
        text-align: center;
        display: flex;
        justify-content: center;
        align-items: center;
        .code-icon {
          position: relative;
          flex: 1;
          text-align: left;

          span {
            display: inline-block;
            // width: 100rem;
            line-height: 72rem;
            text-align: left;
            position: relative;
          }
          .cuIcon-right {
            position: absolute;
            // right: 10rem;
            top: calc(50% - 14rem);
            rotate: 90deg;
            // color: red;
            // -webkit-transform:rotateZ(180deg);
            // transform: rotateZ(180deg);
          }
        }
      }
    }
    .right-view {
      width: 80%;
      height: 72rem;
      margin-top: 20rem;
      background: #fffbf5;
      .input2 {
        width: 100%;
        border-radius: 0rem 10rem 10rem 0rem;
        height: 40rem;
        margin: 16rem 22rem 16rem 0rem;
        padding: 0 22rem;
        color: #000;
        font-size: 28rem;
        border-left: 4rem solid #d5d4d1;
      }

      .cuIcon-close {
        position: absolute;
        right: 20rem;
        top: 36rem;
        rotate: 90deg;
      }
    }
  }
}

.cu-dialog {
  // height: 356rem;
  border-radius: 40rem 40rem 0rem 0rem !important;
}
.padding-xl {
  padding: 0rem;
}

.model-btn {
  height: 98rem;
  display: flex;
  justify-content: space-around;
  align-items: center;
  font-size: 36rem;
  font-weight: 600;
  background: #fff;

  .left-btn {
    color: #a8a8a8;
  }
  .right-btn {
    background: linear-gradient(#eb602d, #ffa64f);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}
.item {
  line-height: 100rem;
  text-align: center;
  background: #fff !important;
  color: #000000;
}
</style>
