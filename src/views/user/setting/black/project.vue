<script>
export default {
  data() {
    return {
      selectedCode: '+1',
      phoneNumber: '',
      isValidPhone: false
    }
  },

  methods: {
    showCountryPicker() {
      // 显示国家代码选择器
    },

    handleVerify() {
      if (!this.isValidPhone) return
      // 处理手机号验证
    },

    validatePhone() {
      // 验证手机号格式
      this.isValidPhone = this.phoneNumber.length >= 10
    }
  },

  watch: {
    phoneNumber() {
      this.validatePhone()
    }
  }
}
</script>

<template>
  <x-page no-footer>
    <template #title>
      {{ 'Phone Number Verification' }}
    </template>

    <div class="container">
      <div class="phone-verify">
        <div class="icon">
          <img src="@/assets/images/phone-verify.png" alt="phone">
        </div>
        <div class="title">Phone Number Verification</div>
        <div class="desc">Enter your new phone number below to receive a verification code.</div>

        <div class="phone-input">
          <div class="country-code" @click="showCountryPicker">
            <span>{{ selectedCode }}</span>
            <i class="arrow-down"></i>
          </div>
          <input 
            type="tel" 
            v-model="phoneNumber"
            placeholder="Phone Number"
          >
        </div>

        <button 
          class="verify-btn"
          :disabled="!isValidPhone"
          @click="handleVerify"
        >
          Verify
        </button>
      </div>
    </div>
  </x-page>
</template>

<style scoped lang="less">
.container {
  padding: 20rem;

  .phone-verify {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40rem 24rem;

    .icon {
      width: 64rem;
      height: 64rem;
      margin-bottom: 24rem;

      img {
        width: 100%;
        height: 100%;
      }
    }

    .title {
      font-size: 24rem;
      font-weight: 600;
      color: #FFFFFF;
      margin-bottom: 12rem;
      text-align: center;
    }

    .desc {
      font-size: 14rem;
      color: #BFBFBF;
      text-align: center;
      margin-bottom: 32rem;
      line-height: 1.5;
    }

    .phone-input {
      width: 100%;
      display: flex;
      gap: 12rem;
      margin-bottom: 24rem;

      .country-code {
        display: flex;
        align-items: center;
        gap: 8rem;
        padding: 0 16rem;
        height: 48rem;
        background: #3A4142;
        border-radius: 8rem;
        color: #FFFFFF;
        cursor: pointer;

        .arrow-down {
          width: 12rem;
          height: 12rem;
          background-image: url('@/assets/images/arrow-down.png');
          background-size: contain;
          background-repeat: no-repeat;
        }
      }

      input {
        flex: 1;
        height: 48rem;
        background: #3A4142;
        border: none;
        border-radius: 8rem;
        padding: 0 16rem;
        color: #FFFFFF;
        font-size: 14rem;

        &::placeholder {
          color: #BFBFBF;
        }
      }
    }

    .verify-btn {
      width: 100%;
      height: 48rem;
      background: #1CF187;
      border-radius: 8rem;
      color: #000000;
      font-size: 16rem;
      font-weight: 500;

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }
}
</style>