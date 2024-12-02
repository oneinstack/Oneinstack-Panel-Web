<template>
  <x-page>
    <template #title>
      {{ $t('user.personal') }}
    </template>
    <div class="user-item">
      <div class="left-name">{{ $t('user.member') }}</div>
      <div class="pictures-img">
        <van-uploader :after-read="conf.chooseFile">
          <img class="head" :src="conf.userImgUrl ? conf.userImgUrl : '/static/img/default-header.png'" />
          <img class="camera-img" src="/static/img/camera.png" />
        </van-uploader>
      </div>
    </div>
    <div class="line"></div>
    <div class="user-item">
      <div class="left-name">{{ $t('user.nickname') }}</div>
      <input class="input" :maxlength="20" :placeholder="$t('user.nicknamePlace')" v-model="conf.userNickname" />
    </div>
    <div class="line"></div>
    <div class="user-item">
      <div class="left-name">UID</div>
      <div class="right-vlue">{{ conf.uid || '******' }}</div>
    </div>
    <div class="line"></div>
    <div class="user-item">
      <div class="left-name">{{ $t('user.memberAccount') }}</div>
      <div class="right-vlue">{{ conf.memberAccount }}</div>
    </div>
    <div class="line"></div>
    <div class="save-btn" @click="conf.submit">{{ $t('user.confirm') }}</div>
  </x-page>
</template>

<script lang="ts" setup>
import { apis } from '@/api'
import i18n from '@/lang'
import { sconfig } from '@/sstore/sconfig'
import sutil from '@/sstore/sutil'
import System from '@/utils/System'
import { onMounted, reactive } from 'vue'
const conf = reactive({
  userImgUrl: '',
  userNickname: '',
  memberAccount: '',
  uid: '',
  outPopup: false,
  file: {} as any,

  chooseFile: async (file: any) => {
    if (file.content.startsWith('data:image')) {
      conf.file = file
      conf.userImgUrl = file.content
    }
  },

  async submit() {
    if (!conf.userNickname) {
      System.toast(i18n.t('common.InputNickname'))
      return
    }
    let userImgUrl = conf.userImgUrl

    if (conf.file.file) {
      System.loading()
      const res = await apis.upload({
        file: conf.file.file,
        final: (_, res) => {
          System.loading(false)
        }
      })
      userImgUrl = res.data.link
    }
    System.loading()
    let ret = await apis.editUserInfo({
      userNickname: conf.userNickname,
      userImgUrl: userImgUrl,
      final: (_, res) => {
        System.loading(false)
      }
    })
    System.toast(i18n.t(`code.${ret.code}`), 'success')
    sconfig.userInfo.userNickname = conf.userNickname
    sconfig.userInfo.userImgUrl = userImgUrl
    sconfig.saveUserInfo()
    setTimeout(() => {
      sutil.pageBack()
    }, 300)
  }
})
onMounted(() => {
  conf.userNickname = sconfig.userInfo.userNickname
  conf.memberAccount = sconfig.userInfo.userName
  conf.userImgUrl = sconfig.userInfo.userImgUrl
  conf.uid = sconfig.userInfo.uid
})
</script>

<style lang="less" scoped>
.picture {
  .tips {
    color: #000;
    font-size: 32rem;
    font-weight: 500;
    margin-top: 32rem;
  }
}
.user-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rem 20rem;
  .left-name {
    font-size: 30rem;
  }
  .pictures-img {
    position: relative;
    .head {
      width: 85rem;
      height: 85rem;
      border-radius: 50%;
    }
    .camera-img {
      width: 26rem;
      height: 26rem;
      position: absolute;
      bottom: 15rem;
      right: 10rem;
    }
  }
  .right-vlue {
    color: #666;
    font-size: 29rem;
  }
  .input {
    flex: 1;
    margin-left: 60rem;
    text-align: right;
    font-size: 28rem;
  }
}
.line {
  opacity: 0.3;
  background: #dcdcdc;
  height: 1rem;
}

.save-btn {
  margin: 180rem 30rem 0rem;
  height: 90rem;
  background: linear-gradient(180deg, #eb602d 0%, #ffa64f 100%);
  border-radius: 50rem;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #fff;
  font-size: 40rem;
  font-weight: 500;
}
.camera-content {
  font-size: 40rem;
  font-weight: 500;
  background: #ffffff;
  .out-line {
    line-height: 120rem;
    border-bottom: 1rem solid #eee;
    text-align: center;
  }
}
</style>
