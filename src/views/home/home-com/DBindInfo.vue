<template>
  <van-overlay class-name="toast-overlay" :show="conf.showNumberBox">
    <div class="cu-modal-x">
      <div class="cu-dialog">
        <div class="cu-bar flex justify-end">
          <div
            class="flex flex-center"
            style="width: 100rem; height: 80rem"
            @click="conf.handleBindDialogBtns('close')"
          >
            <van-icon name="cross" color="#ccc" size="28rem" />
          </div>
        </div>
        <div class="row justify-center">
          <img class="showimg" src="/static/img/showBox-log.png" />
        </div>
        <div class="showBox-content flex justify-center">
          <span>{{ $t('home.bindTitle') }}</span>
          <div class="tip">
            <p>{{ $t('home.bindTip') }}</p>
          </div>
        </div>
        <div class="bind-btn-view">
          <div class="right-btn" style="margin-right: 64rem" @click="conf.handleBindDialogBtns('bind')">
            {{ $t('home.bind') }}
          </div>
          <div class="left-btn" @click="conf.handleBindDialogBtns('close')">{{ $t('home.Close') }}</div>
        </div>
        <div class="check">
          <img
            class="check-img"
            v-if="!conf.isNoPrompt"
            @click="conf.isNoPrompt = !conf.isNoPrompt"
            src="/static/img/uncheck.png"
          />
          <img class="check-img" v-else @click="conf.isNoPrompt = !conf.isNoPrompt" src="/static/img/check.png" />
          <span>{{ $t('home.NoPrompt') }}</span>
        </div>
      </div>
    </div>
  </van-overlay>
</template>
<script setup lang="ts">
import { apis } from '@/api'
import sconfig from '@/sstore/sconfig'
import sstatus from '@/sstore/sstatus'
import System from '@/utils/System'
import { onMounted, reactive } from 'vue'
const conf = reactive({
  showNumberBox: false,
  isNoPrompt: false,
  getUserPhone: async () => {
    if (!sconfig.userInfo) return
    let prompt = sstatus.getPrompt('bindDialogInfo')
    if (prompt) return
    const res = await apis.getUserPhone({
      toast: (msg: string) => {}
    })

    let data = res.data
    if (!data.email || !data.isPwd || !data.userPhone || !data.isPwd) {
      conf.showNumberBox = !prompt
    }
  },

  //bind安全信息弹窗btns
  handleBindDialogBtns: (type: any) => {
    conf.showNumberBox = false
    let obj = {
      uid: sconfig.userInfo.uid,
      noPrompt: conf.isNoPrompt
    }
    sstatus.setPrompt('bindDialogInfo', obj)
    if (type == 'bind') System.router.push('/user/Password/Change')
  }
})
onMounted(() => {
  conf.getUserPhone()
})
</script>
<style lang="less" scoped>
.toast-overlay {
  z-index: 2002;
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

.bind-btn-view {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 30rem 0rem;
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
</style>
