<template>
  <x-page bgcolor="#fff" :headerBgColor="stheme.theme.blue.headerBgColor()">
    <template #title>
      {{ conf.titleName }}
    </template>

    <div class="content-view">
      <div class="input-box">
        <div class="lable">{{ $t('PersonalInformation.Username') }}</div>
        <div class="input-view">
          <input
            class="input"
            :placeholder="$t('PersonalInformation.UsernameEnter')"
            v-model="conf.formData.username"
            @input="conf.vfFun($event, 'username')"
          />
          <div v-if="conf.formData.username" @click="conf.handleClearInput('username')">
            <span class="cuIcon-close"></span>
          </div>
        </div>
      </div>
      <div class="input-box">
        <div class="lable">{{ $t('PersonalInformation.IdentityId') }}</div>
        <div class="input-view">
          <input
            class="input"
            :placeholder="$t('PersonalInformation.IdentityIdEnter')"
            v-model="conf.formData.cardId"
            @input="conf.vfFun($event, 'cardId')"
          />
          <div v-if="conf.formData.cardId" @click="conf.handleClearInput('cardId')">
            <span class="cuIcon-close"></span>
          </div>
        </div>
      </div>

      <!-- btn -->
      <div class="btn-view">
        <div class="sumit-btn" @click="conf.handleDataSubmit">
          {{ conf.isBind ? $t('passwordModule.Change') : $t('addBankCradModule.Bind') }}
        </div>
      </div>
    </div>
  </x-page>
</template>
<script lang="ts" setup>
import { index } from './PersonalInformation'
import stheme from '@/sstore/stheme'

const conf = index()
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
    background: linear-gradient(93.51deg, #006fff 5.72%, #087bff 86.61%);
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
  background-clip: text;
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
      background: #f6f7fa;
      height: 72rem;
      padding: 16rem 22rem;
      color: #000;
      font-size: 28rem;
      margin-top: 20rem;
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
      background-clip: text;
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
      background-clip: text;
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
        border-radius: 0rem 10rem 10rem 0rem;
        height: 40rem;
        margin: 16rem 22rem 16rem 0rem;
        padding-left: 22rem;
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
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}
.picker-view {
  width: 100%;
  height: 258rem;
}
.item {
  line-height: 100rem;
  text-align: center;
  background: #fff !important;
  color: #000000;
}
</style>
