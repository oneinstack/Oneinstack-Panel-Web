<template>
  <x-page noHeader noFooter>
    <div class="register-page">
      <x-statusbar />
      <bgImg :pageUrl="'register'" />
    </div>
  </x-page>
</template>

<script lang="ts" setup>
import { index } from './register'
import BgImg from '@/views/user/login/components/bgImg.vue'

const conf = index()
</script>

<style lang="less" scoped>
.register-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
}
.loginBox {
  padding-top: 100rem;
  height: 100%;
  position: relative;

  .input-placeholder {
    // font-size: 28rem;
    color: #aaaaaa;
  }

  .content {
    padding: 0 48rem;

    .select {
      display: flex;
      height: 100rem;
      margin-top: 20rem;

      .select-item {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        color: rgb(37, 37, 41);
        font-size: 28rem;
        font-weight: bold;

        &.select-active {
          border-bottom: 4rem solid #ffa64f;
          background-image: linear-gradient(white, #ffa64f10);
        }
      }
    }

    .otp {
      border: 1rem solid transparent;

      .otp-item {
        height: 88rem;
        // border-bottom: 2rem solid rgb(220, 220, 229);
        // padding: 44rem 0rem;
        display: flex;
        align-items: center;
        // margin-top: 24rem;
        border-radius: 80rem;
        background: #ffffff30;
        padding: 0rem 32rem;
        margin-bottom: 38rem;

        .phone-img {
          width: 32rem;
          height: 32rem;
        }

        .area {
          border-right: 2rem solid #fff;
          padding-left: 8rem;
          padding-right: 16rem;
          position: relative;
          width: 130rem;
          color: #fff;

          .cuIcon-right {
            position: absolute;
            right: 20rem;
            font-size: 32rem;
          }
        }

        .input {
          padding: 0rem 20rem;
          --placeholderTextColor: #bbbbc5;
          color: rgb(37, 37, 41);
          font-size: 28rem;
          flex: 1;

          input {
            width: 100%;
            color: #fff;

            &.account-input {
              -webkit-text-security: disc;
              text-security: disc;
            }

            &::placeholder {
              color: #fff;
            }
          }
        }

        .code {
          // border-radius: 8rem;
          // box-shadow: rgb(173, 179, 200) 0rem 4rem 2rem 0rem;
          // background-image: linear-gradient(rgba(242, 246, 255, 0.7), rgba(223, 227, 237, 0.7));
          // padding: 16rem 24rem;
          color: rgb(132, 132, 144);
          font-size: 24rem;
        }

        .active-code {
          display: flex;
          align-items: center;
          // background: #fff;
          height: 40rem;
          text-align: center;
          // width: 100rem;
          padding: 0 10rem;
          color: #ff7502;
          border-radius: 35rem;
          border: 2rem solid #f5813d;
          box-shadow: #ffa64f 0rem 2rem 2rem 0rem;
        }

        .eye-img {
          width: 32rem;
          height: 32rem;
        }
      }
    }

    .check {
      display: flex;
      align-items: center;
      margin: 0rem 0rem 10rem;

      .check-img {
        width: 40rem;
        height: 40rem;
        flex-shrink: 0;
      }

      span {
        margin-left: 16rem;
        font-size: 27rem;
        white-space: pre-wrap;
        overflow-wrap: break-word;
      }
    }

    .login-btn {
      margin: 40rem 0rem 0;
      height: 80rem;
      border-radius: 48rem;

      font-size: 28rem;
      color: #fff;
      display: flex;
      justify-content: center;
      align-items: center;
      background-image: linear-gradient(#ffa64f, #eb602d);
    }

    .tip {
      padding: 24rem;
      display: flex;
      justify-content: center;
      align-items: center;
      color: #fff;
      font-size: 28rem;

      div {
        color: #ff7502;
        font-weight: bold;
        margin-left: 8rem;
      }
      .visltor {
        display: flex;
        justify-content: center;
        color: #aaaaaa;
        span {
          margin: 0 6rem;
        }
      }
    }
  }
}

.foot {
  // position: absolute;
  // bottom: 0;
  // left: 0;
  // width: 100%;
  text-align: center;
  // margin-top: 96rem;
  max-width: 750rem;

  .foot-title {
    color: #bbbbc5;
    font-size: 24rem;
    height: 40rem;
    display: flex;
    align-items: center;
    justify-content: center;

    span {
      margin: 0 15rem;
    }

    .solid-img {
      width: 160rem;
      height: 4rem;
    }
  }

  .foot-img {
    width: 80rem;
    height: 80rem;
    margin: 0 36rem;
  }

  .foot-item {
    height: calc(200rem - 40rem);
    display: flex;
    align-items: center;
    justify-content: center;
    .footClickStyle {
      box-shadow: 0rem 4rem 12rem 6rem #999;
      border-radius: 50%;
    }
  }
}

.cu-dialog {
  // height: 356rem;
  border-radius: 40rem 40rem 0rem 0rem !important;
  max-width: 750rem !important;
  margin: 0 auto;
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

.nodata {
  display: flex;
  justify-content: end;
  background-color: #f8f8f8;

  .rigImg {
    width: 26rem;
    height: 26rem;
    margin: 0 30rem;
  }
}

.picker-view {
  width: 100%;
  height: 308rem;
}

.item {
  line-height: 100rem;
  text-align: center;
  background: #fff !important;
  color: #000000;
}
.showbox {
  border-radius: 35rem !important;
  // position: absolute;
  // top: 0;
  // z-index: 1000 !important;
  background-color: #fff;
  max-width: 600rem !important;
  .showimg {
    width: 228rem;
    height: 228rem;
  }
  .imgIcon {
    width: 46rem;
    height: 43rem;
  }
  .inputBox {
    display: flex;
    background-color: #fff6e6;
    border-radius: 50rem;
    padding: 0 30rem;
    width: 85%;
    align-items: center;
    margin: 50rem auto;
    box-sizing: border-box;
  }
  .tip {
    justify-content: center;
  }
  span {
    font-weight: bold;
    font-size: 32rem;
    margin: 30rem 0;
    width: 90%;
  }
  .bind-btn {
    margin: 30rem auto 50rem;
    color: #fff;
    font-size: 40rem;
    height: 80rem;
    line-height: 80rem;
    width: 418rem;
    border-radius: 40rem;
    background: linear-gradient(to top, #eb602d, #ffa64f);
  }
  .uni-input {
    flex: 1;
    height: 100rem;
    line-height: 100rem;
    font-size: 32rem;
    color: #000 !important;
    font-weight: bolder !important;
    padding: 0rem 10rem;
    // color: #AAAAAA;
    opacity: 0.4;
    font-size: 32rem;
    background-color: #fffbf5;
    border-radius: 35rem;
  }
}

.welcome {
  // margin-top: 220rem;
  // margin-bottom: 50rem;
  color: #ffffff;
  font-size: 88rem;
  font-weight: 600;
}

.input {
  color: #fff !important;
  background-color: transparent;
}

.close-icon {
  position: absolute;
  right: 20rem;
  top: -10rem;
  color: #bbbbc5;
  font-size: 54rem;
}

input :-webkit-autofill {
  -webkit-text-fill-color: #fff !important;
  -webkit-box-shadow: 0 0 0 2000rem #bbbbc5 inset !important;
}

.uni-input-placeholder.input-placeholder {
  // color: rgba($color: #fff, $alpha: 0.7);
  color: #fff;
  // font-weight: bold;
  // font-size: 32rem;
}
</style>
