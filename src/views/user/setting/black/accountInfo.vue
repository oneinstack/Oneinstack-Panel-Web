<script setup lang="ts">
import greenBtn from '@/views/home/theme/black/components/greenBtn.vue'
import { index as currentIndex } from './accountInfo'
import { index } from '@/views/user/Password/Change'
import sconfig from '@/sstore/sconfig'

const conf = index()
const currentConf = currentIndex()
</script>

<template>
  <x-page no-footer pageType="black">
    <template #title>
      {{ 'Account Info' }}
    </template>

    <div class="container">
      <div class="section profile-info">
        <div class="section-title">Profile Info</div>
        <div class="profile-content">
          <div class="avatar-name">
            <img :src="sconfig.userInfo.userImgUrl" class="avatar" alt="" />
            <div class="user-info">
              <div class="username">{{ sconfig.userInfo.userNickname }}</div>
              <div class="user-id">User ID: {{ sconfig.userInfo.uid }}</div>
            </div>
          </div>
          <button class="edit-btn" @click="currentConf.handleNavigate('edit',null)">
            <greenBtn>
              <span>Edit</span>
            </greenBtn>
          </button>
        </div>
      </div>

      <div class="section contact-info">
        <div class="section-title">Contact Info</div>

        <div class="contact-item">
          <div class="item-label">E-mail Verification</div>
          <template v-if="!conf.email">
            <div class="phone-desc">Verify your email, you can use email as your second login method.</div>
            <button class="add-btn" @click="currentConf.handleNavigate('add','Email')">
              <greenBtn>
                <span>Add</span>
              </greenBtn>
            </button>
          </template>
          <template v-else> 
            <div class="email-input">
              <input type="email" v-model="currentConf.email" disabled />
            </div>
            <button class="verify-btn">
              <greenBtn>
                <span>Verify</span>
              </greenBtn>
            </button>
          </template>
        </div>

        <div class="contact-item">
          <div class="item-label">Phone Number</div>
          <div class="phone-desc">Verify your phone number and you can use the phone as your second login method.</div>
          <button class="add-btn" @click="currentConf.handleNavigate('add','Phone')">
            <greenBtn>
              <span>Add</span>
            </greenBtn>
          </button>
        </div>
      </div>
    </div>
  </x-page>
</template>

<style scoped lang="less">
.container {
  margin: 36rem 24rem;
  color: #ffffff;
  .section {
    background: #323738;
    border-radius: 20rem;
    padding: 24rem;
    margin-bottom: 35rem;

    .section-title {
      font-family: Poppins;
      font-weight: 600;
      font-size: 28rem;
      line-height: 42rem;
      letter-spacing: 0%;
      padding-bottom: 20rem;
    }
  }

  .profile-info {
    .profile-content {
      border-top: 2rem solid #3b4041;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12rem;
      padding-top: 20rem;

      .avatar-name {
        display: flex;
        align-items: center;
        gap: 16rem;

        .avatar {
          width: 100rem;
          height: 100rem;
          border-radius: 50%;
          object-fit: cover;
        }

        .user-info {
          font-family: PingFang SC;

          .username {
            font-weight: 600;
            font-size: 28rem;
            line-height: 40rem;
            letter-spacing: 0%;
            margin-bottom: 8rem;
          }

          .user-id {
            font-weight: 600;
            font-size: 24rem;
            line-height: 34rem;
            letter-spacing: 0%;
            color: #bfbfbf;
          }
        }
      }

      .edit-btn {
        min-width: 168rem;
        height: 60rem;
        border-radius: 12rem;
        color: #1f1f1f;
        font-weight: 600;
        font-size: 28rem;
        line-height: 40rem;
        letter-spacing: 0%;
      }
    }
  }

  .contact-info {
    font-family: PingFang SC;

    .contact-item {
      &:not(:last-child) {
        margin-bottom: 24rem;
      }

      .item-label {
        margin-top: 20rem;
        color: #bfbfbf;
        font-weight: 600;
        font-size: 24rem;
        line-height: 34rem;
        letter-spacing: 0%;
      }

      .email-input {
        margin-top: 14rem;
        margin-bottom: 16rem;

        input {
          width: 100%;
          height: 84rem;
          background: #292d2e;
          border-radius: 14rem;
          border: 2rem solid #4b5253;
          padding: 0 16rem;
          font-weight: 600;
          font-size: 28rem;
          line-height: 40rem;

          &:disabled {
            opacity: 0.7;
          }
        }
      }

      .phone-desc {
        font-weight: 600;
        font-size: 24rem;
        line-height: 34rem;
        color: #bfbfbf;
        margin: 15rem 0;
      }

      .verify-btn,
      .add-btn {
        width: 100%;
        height: 88rem;
        border-radius: 12rem;
        font-size: 32rem;
        font-weight: 600;
        line-height: 48rem;
        color: #1f1f1f;
      }
    }
  }
}
</style>
