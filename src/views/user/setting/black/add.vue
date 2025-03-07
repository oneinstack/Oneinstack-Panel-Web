<script setup lang="ts">
import greenBtn from '@/views/home/theme/black/components/greenBtn.vue'
import { index as bindIndex } from '@/views/user/Password/bind'
const bindConf = bindIndex()
</script>

<template>
  <x-page no-footer pageType="black">
    <template #title>
      {{ 'Add' }}
    </template>

    <div class="container">
      <div class="phone-verify" v-if="bindConf.typeName == 'Phone'">
        <div class="icon">
          <img src="/static/theme/black/setting/phone.png" alt="phone" />
        </div>
        <div class="title">Phone Number Set</div>
        <div class="desc">Enter your new phone number below to receive a verification code.</div>

        <div class="phone-input">
          <div class="country-code" @click="bindConf.showCountryPicker">
            <span>{{ bindConf.formData.area_code ? '+' + bindConf.formData.area_code : '' }}</span>
            <van-icon name="arrow-down" class="arrow-down" size="18rem" />
          </div>
          <input
            type="tel"
            v-model="bindConf.formData.mobile_phone"
            @input="bindConf.vfFun($event, 'mobile_phone')"
            placeholder="Phone Number"
          />
        </div>
        <div class="phone-input">
          <input
            type="tel"
            v-model="bindConf.formData.verification_code"
            @input="bindConf.vfFun($event, 'verification_code')"
            placeholder="Verification Code"
          />
          <button class="code-btn" @click="bindConf.handleGetCode('phone')">
            <greenBtn>
              <span>GET CODE</span>
            </greenBtn>
          </button>
        </div>
      </div>

      <div class="phone-verify" v-if="bindConf.typeName == 'Email'">
        <div class="icon">
          <img src="/static/theme/black/setting/email.png" alt="phone" />
        </div>
        <div class="title">E-mail Set</div>
        <div class="desc">Enter your e-mail below to receive a verification code.</div>

        <div class="phone-input">
          <input type="tel" v-model="bindConf.formData.email" placeholder="E-mail" />
        </div>

        <div class="phone-input">
          <input
            type="tel"
            v-model="bindConf.formData.verification_code"
            @input="bindConf.vfFun($event, 'verification_code')"
            placeholder="Verification Code"
          />
          <button class="code-btn" @click="bindConf.handleGetCode('email')">
            <greenBtn>
              <span>GET CODE</span>
            </greenBtn>
          </button>
        </div>
      </div>

      <button class="verify-btn" @click="bindConf.handleDataSubmit">
        <greenBtn>
          <span>Bind</span>
        </greenBtn>
      </button>
    </div>

    <!-- 弹出层 -->
    <van-popup
      v-model:show="bindConf.infoPopupObj.show"
      position="bottom"
      :style="{ background: '#323738', borderRadius: '20rem', padding: '20rem' }"
    >
      <div class="popup-content">
        <div class="model-btn">
          <div class="left-btn" @click="bindConf.infoPopupObj.show = false">{{ 'Cancel' }}</div>
          <div class="right-btn" @click="bindConf.handleAreaCodeConfirm">
            <greenBtn>
              <span>Confirm</span>
            </greenBtn>
          </div>
        </div>
        <van-picker
          :visible-option-num="4"
          :show-toolbar="false"
          :columns="bindConf.areaCodeList"
          @scroll-into="bindConf.bindChange"
          :style="{ background: '#fff', }"
        >
          <template #option="item">
            {{ item.showName + ' ' + item.areaCode }}
          </template>
        </van-picker>
      </div>
    </van-popup>
  </x-page>
</template>

<style scoped lang="less">
.container {
  padding: 0rem 30rem;
  color: #ffffff;

  .phone-verify {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40rem 24rem;

    .icon {
      width: 60rem;
      height: 60rem;
      margin-bottom: 24rem;

      img {
        width: 100%;
        height: 100%;
      }
    }

    .title {
      font-family: Poppins;
      font-size: 28rem;
      font-style: normal;
      font-weight: 700;
      line-height: normal;
    }

    .desc {
      color: #bfbfbf;
      text-align: center;
      font-family: 'PingFang SC';
      font-size: 24rem;
      font-style: normal;
      font-weight: 600;
      line-height: normal;
      margin: 20rem 0 30rem;
    }

    .phone-input {
      width: 100%;
      display: flex;
      border-radius: 14rem;
      border: 2rem solid #4b5253;
      background: #292d2e;
      margin-bottom: 30rem;
      position: relative;

      .code-btn {
        position: absolute;
        top: 10%;
        right: 10rem;
        height: 80%;
        min-width: 180rem;
      }

      .country-code {
        margin: 15rem 0;
        display: flex;
        align-items: center;
        gap: 8rem;
        padding: 0 16rem;
        height: 54rem;
        cursor: pointer;
        border-right: 2rem solid #3b4041;
        color: #fff;
        font-family: 'PingFang SC';
        font-size: 28rem;
        font-style: normal;
        font-weight: 600;
        line-height: normal;

        .arrow-down {
          margin: 0 10rem;
        }
      }

      input {
        flex: 1;
        height: 84rem;
        border: none;
        padding: 0 16rem;
        color: #bfbfbf;
        font-family: 'PingFang SC';
        font-size: 28rem;
        font-style: normal;
        font-weight: 600;
        line-height: normal;

        &::placeholder {
          color: #bfbfbf;
        }
      }
    }

    
  }
}

.model-btn {
  height: 64rem;
  display: flex;
  justify-content: space-around;
  align-items: center;
  font-size: 36rem;
  font-weight: 600;
  background: transparent;
  color: #fff;
  margin-bottom: 20rem;

  .left-btn {
    background: #464f50;
    padding: 0 30rem;
    border-radius: 12rem;
    height: 100%;
    line-height: 64rem;
  }
  .right-btn {
    height: 100%;
    min-width: 190rem;
  }
}

.verify-btn {
      width: 100%;
      height: 83rem;
      border-radius: 12rem;
      color: #1f1f1f;
      font-size: 32rem;
      font-weight: 600;
      font-family: Poppins;
      font-style: normal;
      line-height: normal;

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

</style>
