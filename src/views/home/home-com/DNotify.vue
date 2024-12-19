<template>
  <van-overlay class-name="toast-overlay" :show="conf.showPopNotify">
    <div class="cu-modal-x relative">
      <div class="open">
        <div class="popup-mask" @click="conf.close"></div>
        <div class="notify open-image">
          <van-swipe class="swiper" circular previous-margin="80rem" next-margin="80rem" :autoplay="3000">
            <template v-for="(item, index) in conf.notifyList">
              <van-swipe-item class="swiperItem" :key="index" v-if="item.verticalUrl" @click="conf.goContent(item)">
                <img class="notify-img" :src="item.verticalUrl" />
              </van-swipe-item>
            </template>
          </van-swipe>
          <div class="check">
            <div style="display: flex; align-items: center" @click.stop="conf.isNoPromptPop = !conf.isNoPromptPop">
              <img v-if="!conf.isNoPromptPop" class="check-img" src="/static/img/uncheck.png" />
              <img v-else class="check-img" src="/static/img/check.png" />
              <span>{{ $t('home.NoPrompt') }}</span>
            </div>
          </div>
          <div class="action" @click="conf.close">
            <van-icon name="close" color="#fff" size="60rem" />
          </div>
        </div>
      </div>
    </div>
  </van-overlay>
</template>
<script setup lang="ts">
import { apis } from '@/api'
import sstatus from '@/sstore/sstatus'
import sweb from '@/sstore/sweb';
import System from '@/utils/System'
import { Scope } from 'tools-vue3';
import { onMounted, reactive } from 'vue'
const mconf = Scope.getConf()
const conf = reactive({
  showPopNotify: false,
  title: '',
  isNoPromptPop: false,
  notifyList: [] as any[],
  openItem:{
    fun:()=>{
      conf.showPopNotify = true
    },
    level:3,
    isRun:false
  },
  close() {
    conf.showPopNotify = false
    mconf.dialog.runNext(conf.openItem)
    let obj = {
      noPrompt: conf.isNoPromptPop
    }
    sstatus.setPrompt('PopNotifyDialogInfo', obj)
  },
  goContent(item: any) {
    if (item.pathUrl.indexOf('http') != -1) {
      sweb.open(item.pathUrl)
    }
  },

  //获取活动弹窗数据
  async getPoPut() {
    let popNotify = sstatus.getPrompt('PopNotifyDialogInfo')
    if (popNotify) return
    conf.notifyList = []
    const res = await apis.getPoPut()

    conf.notifyList = res.data.filter((item: any) => {
      return item.activityType == 3
    })
    if (conf.notifyList.length > 0) {
      conf.openItem.isRun = !popNotify
      mconf.dialog.insert(conf.openItem)
    }
  }
})
onMounted(() => {
  conf.getPoPut()
})
</script>
<style lang="less" scoped>
.toast-overlay {
  z-index: 2000;
}

.cu-modal-x {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.popup-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  background: rgba(0, 0, 0, 0.3);
}
.open {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  margin: 0 auto;
}
.notify {
  position: absolute;
  z-index: 9;
  left: 0%;
  right: 40rem;
  height: 60vh;
  // background: #FFF;
  border-radius: 40rem;
  width: 100%;
  // overflow: hidden;
  .swiper {
    height: 100%;
    width: 600rem;
    margin: 0 auto;
  }
  .swiperItem {
    height: 100%;
  }
  .notify-img {
    width: 100%;
    height: 100%;
    border-radius: 40rem;
  }
  .action {
    position: absolute;
    bottom: -120rem;
    left: 0rem;
    right: 0rem;
    text-align: center;
    .notify-close {
      color: #fff;
      font-size: 80rem;
    }
  }
}

.check {
  position: absolute;
  bottom: -30rem;
  left: 0rem;
  right: 0rem;
  display: flex;
  align-items: center;
  margin: 20rem 50rem 40rem 20rem;
  justify-content: center;
  z-index: 8;

  .check-img {
    width: 28rem;
    height: 28rem;
    flex-shrink: 0;
  }

  span {
    margin-left: 16rem;
    color: #fff;
    font-size: 26rem;
    white-space: pre-wrap;
    overflow-wrap: break-word;
  }
}

/* 定义动画 */
@keyframes fadeInOut {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(2);
  }
}

/* 应用动画到图片 */
.animated-image {
  animation: fadeInOut 1s infinite; /* 动画名称，持续时间，重复次数 */
}

/* 定义动画 */
@keyframes fadeIn {
  0% {
    opacity: 0;
    transform: scale(0);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* 应用动画到图片 */
.open-image {
  animation: fadeIn 1s 1 alternate;
}
</style>
