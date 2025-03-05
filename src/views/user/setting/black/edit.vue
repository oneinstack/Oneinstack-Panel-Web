<script setup lang="ts">
import greenBtn from '@/views/home/theme/black/components/greenBtn.vue'
import { ref } from 'vue'


import { index } from './edit'
const uploaderRef = ref<any>()
const conf = index({uploaderRef})
</script>

<template>
  <x-page no-footer>
    <template #title>
      {{ 'Edit Profile' }}
    </template>

    <div class="container">
      <div class="avatar-section">
        <div class="avatar-wrapper">
          <van-uploader ref="uploaderRef" v-model="conf.fileList" :after-read="conf.handleSelectPhoto">
            <div class="upload-view" v-if="!conf.isShowImg">
              <div class="edit-overlay" @click.stop="conf.triggerUpload">
                <greenBtn>
                  <span>Edit Your Avatar</span>
                </greenBtn>
              </div>
            </div>
            <img class="avatar" :src="conf.avatarUrl" v-else />
          </van-uploader>
        </div>
      </div>

      <div class="form-section">
        <div class="form-item">
          <div class="label">Username</div>
          <input type="text" v-model="conf.username" placeholder="Enter your username" />
          <div class="hint">Do not use special symbols, otherwise your account may not be supported.</div>
        </div>

        <button class="verify-btn" @click="conf.handleSubmit">
          <greenBtn>
            <span>Verify</span>
          </greenBtn>
        </button>
      </div>
    </div>
  </x-page>
</template>

<style scoped lang="less">
.container {
  font-family: PingFang SC;
  padding: 50rem 30rem;

  .avatar-section {
    display: flex;
    justify-content: center;
    margin-bottom: 30rem;

    .avatar-wrapper {
      position: relative;

      .upload-view,
      .avatar {
        width: 300rem;
        height: 300rem;
        object-fit: cover;
        border-radius: 50%;
        border: 16rem solid #3a4142;
      }

      .edit-overlay {
        position: absolute;
        bottom: 0;
        left: 30rem;
        right: 30rem;
        min-width: 224rem;
        height: 56rem;
        border-radius: 12rem;
        font-family: PingFang SC;
        font-weight: 600;
        font-size: 24rem;
        line-height: 34rem;
      }
    }

    .hidden {
      display: none;
    }
  }

  .form-section {
    .form-item {
      // margin-bottom: 24rem;

      .label {
        color: #bfbfbf;
        font-weight: 600;
        font-size: 28rem;
        line-height: 40rem;
        letter-spacing: 0%;
      }

      input {
        width: 100%;
        border: 2rem solid #4b5253;
        height: 84rem;
        border-radius: 14rem;
        font-family: PingFang SC;
        font-weight: 600;
        font-size: 28rem;
        line-height: 40rem;
        letter-spacing: 0%;
        color: #ffffff;
        background: #292d2e;
        margin: 20rem 0 10rem;
        padding: 0 20rem;

        &::placeholder {
          color: #bfbfbf;
        }
      }

      .hint {
        font-weight: 600;
        font-size: 20rem;
        line-height: 28rem;
        color: #bfbfbf;
      }
    }

    .verify-btn {
      width: 100%;
      height: 88rem;
      border-radius: 12rem;
      color: #1f1f1f;
      font-family: Poppins;
      font-weight: 600;
      font-size: 32rem;
      line-height: 48rem;
      letter-spacing: 0%;
      margin-top: 26rem;
    }
  }
}
</style>
