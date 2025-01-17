<script setup lang="ts">
import { index } from './add'

const conf = index()
</script>

<template>
  <x-page no-footer>
    <template #title>{{ $t('Feedback.add') }}</template>
    <!-- content -->
    <div class="content-view">
      <div class="input-box">
        <div class="lable">
          <span class="red-text">*</span>
          {{ $t('Feedback.questionType') }}
        </div>
        <div class="input-view" @click="conf.handleOpenMadal()">
          <div
            class="input"
            :class="[!conf.formData.type ? 'select-value' : '']"
          >
            {{ conf.formData.typeName || $t('common.PleaseSelect') }}
          </div>
          <van-icon class="cuIcon-right" name="arrow" />
        </div>
      </div>
      <div class="input-box">
        <div class="lable">
          <span class="red-text">*</span>
          {{ $t('Feedback.problemDescription') }}
        </div>
        <van-field
            v-model="conf.formData.description"
            rows="3"
            autosize
            type="textarea"
            maxlength="500"
            :placeholder="$t('common.PleaseEnter')"
            show-word-limit
        />
      </div>
      <div class="input-box">
        <div class="lable">{{ $t('Feedback.problemScreenshot') }}</div>
        <van-uploader v-model="conf.formData.fileList" multiple :max-count="3" :after-read="conf.handleSelectPhoto">
          <div class="upload-view" v-if="!conf.isShowImg">
            <div>
              <img class="camera" src="/static/img/camera-feed.png"/>
              <div class="uploadTip">{{$t('Feedback.PhotoUpload')}}</div>
            </div>
          </div>
            <img class="img-bg" :src="conf.formData.scanCodePayImgUrl" v-else />
        </van-uploader>
      </div>
      <div class="input-box">
        <div class="lable">
          <span class="red-text">*</span>
          {{ $t('Feedback.contactAccount') }}
        </div>
        <div class="input-view">
            <input
              class="input"
              :placeholder="$t('common.PleaseEnterAccountOrPhone')"
              v-model="conf.formData.account"
            />
            <van-icon
              v-if="conf.formData.account"
              name="cross"
              class="clear-icon"
              @click="conf.handleClearInput('account')"
            />
          </div>
      </div>

      <!-- btn -->
      <div class="btn-view">
        <div class="sumit-btn" @click="conf.handleDataSubmit">
          {{ $t('Feedback.submit') }}
        </div>
      </div>
    </div>

    <!-- 模态框 -->
    <van-popup
      class="popup-bottom-center"
      :show="conf.modalShow"
      closeable
      position="bottom"
      @close="conf.hideModal"
    >
      <div class="cu-bar bg-white justify-end">
        <div class="content">{{ conf.modalTitle }}</div>
      </div>
      <div class="winning-box" scroll-y="true" style="width: 100%; max-height: 700rem">
        <div
            class="winning-item"
            v-for="(item, itemIndex) in conf.typeList"
            :key="itemIndex"
            @click="conf.handleModalSelect(item)"
            :class="item.isChecked ? 'active-view' : ''"
          >
            <div class="left-view" style="width: 100%">
              <span>{{ item.dictValue }}</span>
            </div>
          </div>
          <x-no-data v-if="conf.typeList.length == 0" :top="0"></x-no-data>
      </div>
    </van-popup>
  </x-page>
</template>

<style scoped lang="less">
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
  background: #fff;

  .winning-item {
    padding: 0rem 24rem 24rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 96rem;
    border-bottom: 2rem solid #f9fafc;

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

.cu-bar {
  display: flex;
  position: relative;
  align-items: center;
  min-height: 100rem;
  justify-content: center;
}

.cu-bar .content {
  width: 100% !important;
  text-align: center;
  margin: auto;
  height: 60rem;
  font-size: 32rem;
  line-height: 60rem;
  cursor: none;
  pointer-events: none;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  color: #666666;
}



input::placeholder,
.select-placeholder {
  color: #a8a8a860 !important;
}

.active-view {
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
    .red-text{
      color:red;
    }
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
      margin-top: 20rem;

      &::placeholder {
        color: #c3c2c1;
        font-size: 28rem;
      }
    }

    .clear-icon {
      position: absolute;
      top: 60%;
      right: 20rem;
    }

    .cuIcon-right,
    .cuIcon-close {
      position: absolute;
      right: 20rem;
      top: calc(50% - 14rem);
      rotate: 90deg;
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
      top: calc(50% - 20rem);
      text-align: center;
      padding: 0rem 20rem;
    }

    .countdown {
      position: absolute;
      right: 20rem;
      min-width: 100rem;
      height: 40rem;
      line-height: 40rem;
      background: linear-gradient(to right, #eb602d, #ffa64f);
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      top: calc(50% - 20rem);
      text-align: center;
      padding: 0rem 20rem;
    }

    .left-view {
      width: 22%;
      position: relative;
      height: 72rem;
      margin-top: 20rem;

      .input1 {
        border-radius: 10rem;
        background: #fffbf5;
        height: 72rem;
        padding: 16rem 22rem;
        color: #000;
        font-size: 28rem;
      }
    }

    .right-view {
      width: 78%;
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
    }
  }
}

.cu-dialog {
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

.disabledView {
  background: #99999940 !important;
  pointer-events: auto !important;
  cursor: not-allowed !important;
}

:deep(.van-field__value){
    padding: 10rem 20rem !important;
  background: #fffbf5;
}
:deep(.van-cell){
    padding: 0rem !important;
    border-radius: 10rem !important;
    margin-top: 20rem;
}
:deep(.van-uploader__input-wrapper),:deep(.van-uploader__preview){
    width: 216rem !important;
    height: 216rem !important;
    border-radius: 20rem !important;
    text-align: center !important;
    margin-top: 20rem !important;
    background-color: #fffbf5 !important;
}
:deep(.van-image .van-uploader__preview-image),
:deep(.van-image__img, .van-image__error, .van-image__loading),
:deep(.van-uploader__preview-image){
    width: 216rem !important;
    height: 216rem !important;
}

.upload-view{
  display:flex;
  align-items: center;
  justify-content: center;
  width: 216rem;
  height: 216rem;
  font-size:20rem;
  color: #C3C2C1;

  .camera{
    width: 78rem;
    height: 78rem;
  }
}
</style>
