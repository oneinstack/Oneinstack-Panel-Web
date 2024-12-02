<template>
  <van-overlay class-name="toast-overlay" :show="conf.isOpenSystemBulletinDialog">
    <div class="cu-modal-x">
      <div class="cu-dialog relative">
        <div class="cu-bar flex justify-end">
          <div
            class="flex flex-center"
            style="width: 100rem; height: 80rem"
            @click="conf.handleCloseSystemBulletinDialog"
          >
            <van-icon name="cross" color="#ccc" size="28rem" />
          </div>
        </div>

        <img class="systemContentImg" src="/static/img/systemContent.png" />
        <div class="SystemBulletin-box">
          <div class="title row justify-center">
            {{ conf.SystemBulletinContentObj.announcementName }}
          </div>
          <div class="row justify-center" style="color: #000; font-size: 20rem">
            {{ '( ' + (conf.SystemBulletinDialogIndex + 1) + '/' + conf.SystemBulletinDialogArr.length + ' )' }}
          </div>
          <div class="content">
            <div class="rich-view" v-html="conf.SystemBulletinContentObj.announcementContent"></div>
          </div>

          <div class="modal-btn-view" style="margin-top: 30rem">
            <div class="left-btn" @click="conf.handleLastSystemBulletin" v-if="conf.SystemBulletinDialogIndex != 0">
              {{ $t('home.last') }}
            </div>
            <div
              class="right-btn"
              @click="conf.handleNextSystemBulletin"
              v-if="conf.SystemBulletinDialogIndex != conf.SystemBulletinDialogArr.length - 1"
            >
              {{ $t('home.next') }}
            </div>
          </div>
          <div class="check">
            <img
              class="check-img"
              v-if="!conf.isNoPromptBulletin"
              @click="conf.isNoPromptBulletin = !conf.isNoPromptBulletin"
              src="/static/img/uncheck.png"
            />
            <img
              class="check-img"
              v-else
              @click="conf.isNoPromptBulletin = !conf.isNoPromptBulletin"
              src="/static/img/check.png"
            />
            <span>{{ $t('home.NoPrompt') }}</span>
          </div>
        </div>
      </div>
    </div>
  </van-overlay>
</template>
<script setup lang="ts">
import sstatus from '@/sstore/sstatus'
import { Scope } from 'tools-vue3'
import { onMounted, reactive } from 'vue'
const mconf = Scope.getConf()
const conf = reactive({
  SystemBulletinContentObj: {} as any,
  SystemBulletinDialogIndex: 0,
  SystemBulletinDialogArr: [] as any[],
  isOpenSystemBulletinDialog: false,
  isNoPromptBulletin: false,
  //关闭当前系统公告弹窗
  handleCloseSystemBulletinDialog() {
    conf.isOpenSystemBulletinDialog = false
    let obj = {
      noPrompt: conf.isNoPromptBulletin
    }
    sstatus.setPrompt('bulletinDialogInfo', obj)
  },

  //查看上一条公告弹窗
  handleLastSystemBulletin() {
    conf.SystemBulletinDialogIndex -= 1
    conf.SystemBulletinContentObj = conf.SystemBulletinDialogArr[conf.SystemBulletinDialogIndex]
  },

  //查看下一条公告弹窗
  handleNextSystemBulletin() {
    conf.SystemBulletinDialogIndex += 1
    conf.SystemBulletinContentObj = conf.SystemBulletinDialogArr[conf.SystemBulletinDialogIndex]
  }
})
onMounted(() => {
  conf.SystemBulletinDialogArr = mconf.swiperList.filter((item: any) => {
    return item.isPopUps
  })

  if (conf.SystemBulletinDialogArr.length) {
    let bulletin = sstatus.getPrompt('bulletinDialogInfo')
    conf.isOpenSystemBulletinDialog = !bulletin
  }

  conf.SystemBulletinContentObj = conf.SystemBulletinDialogArr[0] || {}
  conf.SystemBulletinDialogIndex = 0
})
</script>
<style lang="less" scoped>
.toast-overlay {
  z-index: 2001;
}

.cu-modal-x {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  .cu-dialog {
    background-color: #fff;
    width: 560rem;
    border-radius: 40rem;
    width: 560rem;
    box-shadow: 0 2rem 10rem #fffbf5;

    .cu-bar {
      height: 70rem;
      min-height: 70rem;
    }

    .showimg {
      width: 200rem;
      height: 200rem;
    }

    .text-red {
      color: #cccccc;
      font-weight: bold;
      font-size: 28rem;
    }

    .showBox-content {
      font-size: 32rem;
      color: #333;
    }

    .tip {
      text-align: center;
      color: #666666;
      font-size: 24rem;
      margin-top: 15rem;
      padding: 0 15rem;
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
  }
}

.SystemBulletin-box {
  margin-top: 30rem;
  padding: 20rem;
  font-size: 24rem;
  color: #aaaaaa;
  font-weight: 500;
  .title {
    background: linear-gradient(to left, #ff7502, #fe8502, #fc9b01);
    -webkit-background-clip: text;
    /* 使用-webkit-前缀兼容部分浏览器 */
    background-clip: text;
    color: transparent;
    font-size: 48rem;
    font-weight: 900;
  }
  .content {
    margin-top: 30rem;
    height: 350rem;
    text-align: left;
    overflow: auto !important;
    .rich-view {
      width: 100%;
      height: 100%;
    }
  }
  .content::-webkit-scrollbar {
    display: initial;
    width: 4rem;
  }
  .content::-webkit-scrollbar-thumb {
    background-color: #888;
    border-radius: 4rem;
  }
}

.systemContentImg {
  width: 189rem;
  height: 189rem;
  position: absolute;
  top: -80rem;
  left: calc((100% - 189rem) / 2);
}
.check {
  display: flex;
  align-items: center;
  margin: 20rem 50rem 40rem 20rem;
  justify-content: flex-end !important;

  .check-img {
    width: 28rem;
    height: 28rem;
    flex-shrink: 0;
  }

  span {
    margin-left: 16rem;
    color: #aaaaaa;
    font-size: 24rem;
    white-space: pre-wrap;
    overflow-wrap: break-word;
  }
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
  min-width: 132rem;
  padding: 0rem 20rem;
}

.left-btn {
  background-color: #fff2df;
  color: #000000;
  opacity: 0.7;
}

.right-btn {
  background: linear-gradient(#ffa64f, #eb602d) !important;
  color: #fff;
}
</style>
