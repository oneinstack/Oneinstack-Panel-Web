<template>
  <div class="luckyWinners" v-show="conf.winnerInfoVoListInit.length">
    <h1>{{ $t('home.Winning') }}</h1>
    <div class="wrapper" id="box" ref="winListRef">
      <win-loop
        ref="winLoopRef"
        :winList="conf.winnerInfoVoListInit"
        :topNum="conf.winSlateNum"
        v-if="conf.winnerInfoVoListInit.length"
      >
        <template v-slot="{ num, topNum }">
          <div
            class="item winItem"
            :class="[topNum ? 'show-item' : '']"
            :style="{ 'box-shadow': topNum == 4 * conf.winSlateNum ? 'none' : '0 4rem 16rem #d0d0ed5c' }"
          >
            <div class="item-img">
              <div class="avatar" v-if="conf.show">
                <x-img :lazyLoad="false" zIndex="1" :src="conf.winnerInfoVoListInit[num]?.imgUrl" />
              </div>
            </div>
            <div class="item-info">
              <h1 class="nickname">{{ conf.winnerInfoVoListInit[num]?.userName }}</h1>
            </div>
            <img v-if="conf.show" class="gameTypeImg" :src="conf.winnerInfoVoListInit[num]?.winImg" />
            <div class="item-winAmount">
              <h1 class="win_money">
                {{ conf.winnerInfoVoListInit[num]?.coinSymbol + conf.winnerInfoVoListInit[num]?.betPrizeMoney }}
              </h1>
              <span>{{ $t('home.amount') }}</span>
            </div>
          </div>
        </template>
      </win-loop>
    </div>
  </div>
</template>
<script setup lang="ts">
import sutil from '@/sstore/sutil'
import { Scope } from 'tools-vue3'
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import WinLoop from './winLoop.vue'
const mconf = Scope.getConf()
const conf = reactive({
  winnerInfoVoListInit: [] as any[],
  winSlateNum: sutil.rem2px(120),
  show: false,

  //排行榜
  async getReception() {
    let datas = mconf.virtualData || {}
    conf.winnerInfoVoListInit = datas['10'] || []
    let imgArr = [
      '/static/img/game/3D.png',
      '/static/img/game/color.png',
      '/static/img/game/satta.png',
      '/static/img/game/5D.png',
      '/static/img/game/PK10.png',
      '/static/img/game/TRX.png'
    ]
    let array = ['3D', 'CO', 'SA', '5D', 'PK', 'Tr']
    conf.winnerInfoVoListInit.forEach((item) => {
      const name = item.name.slice(1, 3)
      let randomIndex = array.indexOf(name)
      if (randomIndex == -1) randomIndex = 0
      item.winImg = imgArr[randomIndex]
    })
  }
})
const winListRef = ref<HTMLElement | null>(null)
const winLoopRef = ref<any>(null)
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      conf.show = true
      winLoopRef.value.start()
    } else winLoopRef.value.stop()
  })
})

onMounted(() => {
  conf.getReception()
  observer.observe(winListRef.value as any)
})

onUnmounted(() => {
  observer.disconnect()
})
</script>
<style lang="less" scoped>
/*=============== 排行榜 ===============*/
#luckyWinners__ul {
  display: flex;
  flex-direction: column;
}
.luckyWinners {
  padding: 25rem 26rem 0rem;
  position: sticky;
  left: 0;

  .show-item {
    animation: showItem 0.3s linear;
  }

  @keyframes showItem {
    0% {
      opacity: 0;
      transform: scale(0.5);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }

  .wrapper {
    height: 600rem;
    .item {
      box-sizing: border-box;
      display: flex;
      -webkit-box-align: center;
      align-items: center;
      width: 100%;
      height: 110rem;
      // margin-bottom: 10rem;
      // padding: 20rem 18rem;
      margin-bottom: 10rem;
      border-radius: 10rem;
      background: #fff;
      box-shadow: 0 4rem 16rem #d0d0ed5c;

      .gameTypeImg {
        width: 126rem;
        height: 82rem;
        -webkit-box-flex: 0;
        -webkit-flex: none;
        flex: none;
        border-radius: 16rem;
        // background: linear-gradient(118deg,#ED2C33 26.37%,#FECDC9 89.18%);
        background: linear-gradient(118deg, #ffa64f 26.37%, #fecdc9 89.18%);
        box-shadow: 0 -4rem 10rem #fff inset;
      }

      .item-winAmount {
        text-align: center;
        display: -webkit-box;
        display: -webkit-flex;
        display: flex;
        -webkit-box-orient: vertical;
        -webkit-box-direction: normal;
        -webkit-flex-direction: column;
        flex-direction: column;
        -webkit-box-flex: 1;
        -webkit-flex: 1;
        flex: 1;

        h1 {
          color: #333;
          font-size: 24rem;
          font-weight: 600;
          margin-bottom: 10rem;
        }

        span {
          color: #aeb0c6;
          font-size: 24rem;
        }
      }

      .item-info {
        width: 168rem;
        -webkit-box-flex: 0;
        -webkit-flex: none;
        flex: none;

        h1 {
          color: #243047;
          font-size: 24rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
        }

        span {
          color: #aeb0c6;
          font-size: 22rem;
        }
      }

      .item-img {
        margin-right: 13rem;
        margin-left: 10rem;
        flex: none;
        .avatar {
          width: 80rem;
          height: 80rem;
          border-radius: 50%;
          overflow: hidden;
        }
      }
    }
  }

  & > h1 {
    position: relative;
    margin-bottom: 26rem;
    padding-left: 20rem;
    font-size: 39rem;

    &:before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      transform: translateY(-50%);
      width: 6rem;
      height: 30rem;
      background: #ffa64f;
    }
  }
}
</style>
