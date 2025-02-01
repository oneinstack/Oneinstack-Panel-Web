<template>
  <div class="container" style="transform-origin: left top" :style="{ transform: `scale(${conf.scale})` }">
    <div class="header">
      <div class="logo">{{ title }}</div>
      <div class="position">
        <template v-for="item in conf.numlist">
          <div class="positm" :class="['num' + item.num]"></div>
        </template>
      </div>
      <div class="currentdraw">
        Per.
        <!-- <span id="currentdrawid">------</span> -->
        <span id="currentdrawid">{{ issue }}</span>
      </div>
    </div>
    <div class="scenary page1">
      <div ref="scenaryitm" class="scenaryitm" id="scenaryitm">
        <cview name="scenaryitm">
          <div class="scenaryitm-img"></div>
        </cview>
      </div>
    </div>
    <div class="road page1" style="">
      <div class="roadani">
        <div class="roaditm" id="roaditm">
          <cview name="roaditm">
            <div class="roaditm-img"></div>
          </cview>
        </div>
      </div>
      <cview name="roadstart">
        <div class="roadstart" id="roadstart"> <img src="/static/zhibo/pk/img/finisher.png"
            style="width: 249px; height: 490px" /></div>
      </cview>
      <cview name="car1">
        <div class="car1" id="car1">
          <img src="/static/zhibo/pk/img/car1.png" style="width: 160px; height: 44px" />
          <div class="wheel1a">
            <cview name="wheel1a">
              <img src="/static/zhibo/pk/img/wheel.gif" style="width: 20px; height: 20px" />
            </cview>
          </div>
          <div class="wheel1b">
            <cview name="wheel1b">
              <img src="/static/zhibo/pk/img/wheel.gif" style="width: 20px; height: 20px" />
            </cview>
          </div>
          <div class="wind">
            <cview name="wind1">
              <img src="/static/zhibo/pk/img/wind.png" style="width: 144px; height: 53px" />
            </cview>
          </div>
          <div class="flame" style="right: -45px; bottom: 5px">
            <cview name="flame1">
              <img src="/static/zhibo/pk/img/flame.png" style="width: 49px; height: 11px" />
            </cview>
          </div>
        </div>
      </cview>
      <cview name="car2">
        <div class="car2" id="car2">
          <img src="/static/zhibo/pk/img/car2.png" style="width: 164px; height: 44px" />
          <div class="wheel2a">
            <cview name="wheel2a">
              <img src="/static/zhibo/pk/img/wheel.gif" style="width: 20px; height: 20px" />
            </cview>
          </div>
          <div class="wheel2b">
            <cview name="wheel2b">
              <img src="/static/zhibo/pk/img/wheel.gif" style="width: 20px; height: 20px" />
            </cview>
          </div>
          <div class="wind">
            <cview name="wind2">
              <img src="/static/zhibo/pk/img/wind.png" style="width: 154px; height: 51px" />
            </cview>
          </div>
          <div class="flame" style="right: -45px; bottom: 5px">
            <cview name="flame2">
              <img src="/static/zhibo/pk/img/flame.png" style="width: 49px; height: 11px" />
            </cview>
          </div>
        </div>
      </cview>
      <cview name="car3">
        <div class="car3" id="car3">
          <img src="/static/zhibo/pk/img/car3.png" style="width: 150px; height: 47px" />
          <div class="wheel3a">
            <cview name="wheel3a">
              <img src="/static/zhibo/pk/img/wheel.gif" style="width: 20px; height: 20px" />
            </cview>
          </div>
          <div class="wheel3b">
            <cview name="wheel3b">
              <img src="/static/zhibo/pk/img/wheel.gif" style="width: 20px; height: 20px" />
            </cview>
          </div>
          <div class="wind">
            <cview name="wind3">
              <img src="/static/zhibo/pk/img/wind.png" style="width: 162px; height: 55px" />
            </cview>
          </div>
          <div class="flame" style="right: -45px; bottom: 5px">
            <cview name="flame3">
              <img src="/static/zhibo/pk/img/flame.png" style="width: 51px; height: 12px" />
            </cview>
          </div>
        </div>
      </cview>
      <cview name="car4">
        <div class="car4" id="car4">
          <img src="/static/zhibo/pk/img/car4.png" style="width: 173px; height: 47px" />
          <div class="wheel4a">
            <cview name="wheel4a">
              <img src="/static/zhibo/pk/img/wheel.gif" style="width: 21px; height: 21px" />
            </cview>
          </div>
          <div class="wheel4b">
            <cview name="wheel4b">
              <img src="/static/zhibo/pk/img/wheel.gif" style="width: 21px; height: 21px" />
            </cview>
          </div>
          <div class="wind">
            <cview name="wind4">
              <img src="/static/zhibo/pk/img/wind.png" style="width: 154px; height: 56px" />
            </cview>
          </div>
          <div class="flame" style="right: -45px; bottom: 5px">
            <cview name="flame4">
              <img src="/static/zhibo/pk/img/flame.png" style="width: 51px; height: 12px" />
            </cview>
          </div>
        </div>
      </cview>
      <cview name="car5">
        <div class="car5" id="car5">
          <img src="/static/zhibo/pk/img/car5.png" style="width: 190px; height: 50px" />
          <div class="wheel5a">
            <cview name="wheel5a">
              <img src="/static/zhibo/pk/img/wheel.gif" style="width: 21px; height: 21px" />
            </cview>
          </div>
          <div class="wheel5b">
            <cview name="wheel5b">
              <img src="/static/zhibo/pk/img/wheel.gif" style="width: 21px; height: 21px" />
            </cview>
          </div>
          <div class="wind">
            <cview name="wind5">
              <img src="/static/zhibo/pk/img/wind.png" style="width: 158px; height: 57px" />
            </cview>
          </div>
          <div class="flame" style="right: -47px; bottom: 5px">
            <cview name="flame5">
              <img src="/static/zhibo/pk/img/flame.png" style="width: 53px; height: 13px" />
            </cview>
          </div>
        </div>
      </cview>

      <cview name="car6">
        <div class="car6" id="car6">
          <img src="/static/zhibo/pk/img/car6.png" style="width: 201px; height: 53px" />
          <div class="wheel6a">
            <cview name="wheel6a">
              <img src="/static/zhibo/pk/img/wheel.gif" style="width: 22px; height: 22px" />
            </cview>
          </div>
          <div class="wheel6b">
            <cview name="wheel6b">
              <img src="/static/zhibo/pk/img/wheel.gif" style="width: 22px; height: 22px" />
            </cview>
          </div>
          <div class="wind">
            <cview name="wind6">
              <img src="/static/zhibo/pk/img/wind.png" style="width: 161px; height: 59px" />
            </cview>
          </div>
          <div class="flame" style="right: -47px; bottom: 5px">
            <cview name="flame6">
              <img src="/static/zhibo/pk/img/flame.png" style="width: 53px; height: 13px" />
            </cview>
          </div>
        </div>
      </cview>
      <cview name="car7">
        <div class="car7" id="car7">
          <img src="/static/zhibo/pk/img/car7.png" style="width: 210px; height: 59px" />
          <div class="wheel7a">
            <cview name="wheel7a">
              <img src="/static/zhibo/pk/img/wheel.gif" style="width: 23px; height: 23px" />
            </cview>
          </div>
          <div class="wheel7b">
            <cview name="wheel7b">
              <img src="/static/zhibo/pk/img/wheel.gif" style="width: 23px; height: 23px" />
            </cview>
          </div>
          <div class="wind">
            <cview name="wind7">
              <img src="/static/zhibo/pk/img/wind.png" style="width: 163px; height: 63px" />
            </cview>
          </div>
          <div class="flame" style="right: -48px; bottom: 5px">
            <cview name="flame7">
              <img src="/static/zhibo/pk/img/flame.png" style="width: 55px; height: 14px" />
            </cview>
          </div>
        </div>
      </cview>
      <cview name="car8">
        <div class="car8" id="car8">
          <img src="/static/zhibo/pk/img/car8.png" style="width: 217px; height: 59px" />
          <div class="wheel8a">
            <cview name="wheel8a">
              <img src="/static/zhibo/pk/img/wheel.gif" style="width: 24px; height: 24px" />
            </cview>
          </div>
          <div class="wheel8b">
            <cview name="wheel8b">
              <img src="/static/zhibo/pk/img/wheel.gif" style="width: 24px; height: 24px" />
            </cview>
          </div>
          <div class="wind">
            <cview name="wind8">
              <img src="/static/zhibo/pk/img/wind.png" style="width: 165px; height: 65px" />
            </cview>
          </div>
          <div class="flame" style="right: -48px; bottom: 5px">
            <cview name="flame8">
              <img src="/static/zhibo/pk/img/flame.png" style="width: 55px; height: 14px" />
            </cview>
          </div>
        </div>
      </cview>
      <cview name="car9">
        <div class="car9" id="car9">
          <img src="/static/zhibo/pk/img/car9.png" style="width: 230px; height: 66px" />
          <div class="wheel9a">
            <cview name="wheel9a">
              <img src="/static/zhibo/pk/img/wheel.gif" style="width: 25px; height: 25px" />
            </cview>
          </div>
          <div class="wheel9b">
            <cview name="wheel9b">
              <img src="/static/zhibo/pk/img/wheel.gif" style="width: 25px; height: 25px" />
            </cview>
          </div>
          <div class="wind" style="left: -13px; top: -3px">
            <cview name="wind9">
              <img src="/static/zhibo/pk/img/wind.png" style="width: 177px; height: 72px" />
            </cview>
          </div>
          <div class="flame" style="right: -49px; bottom: 5px">
            <cview name="flame9">
              <img src="/static/zhibo/pk/img/flame.png" style="width: 57px; height: 15px" />
            </cview>
          </div>
        </div>
      </cview>
      <cview name="car10">
        <div class="car10" id="car10">
          <img src="/static/zhibo/pk/img/car10.png" style="width: 241px; height: 66px" />
          <div class="wheel10a">
            <cview name="wheel10a">
              <img src="/static/zhibo/pk/img/wheel.gif" style="width: 26px; height: 26px" />
            </cview>
          </div>
          <div class="wheel10b">
            <cview name="wheel10b">
              <img src="/static/zhibo/pk/img/wheel.gif" style="width: 26px; height: 26px" />
            </cview>
          </div>
          <div class="wind" style="left: -13px; top: -3px">
            <cview name="wind10">
              <img src="/static/zhibo/pk/img/wind.png" style="width: 177px; height: 72px" />
            </cview>
          </div>
          <div class="flame" style="right: -49px; bottom: 5px">
            <cview name="flame10">
              <img src="/static/zhibo/pk/img/flame.png" style="width: 58px; height: 16px" />
            </cview>
          </div>
        </div>
      </cview>
      <cview name="trafficlight">
        <div class="trafficlight" style="display: block">
          <div class="countdownnum"></div>
          <div class="countdownnum2"></div>
          <cview name="redlight">
            <div class="redlight"> <img src="/static/zhibo/pk/img/lightred.png" style="width: 293px; height: 193px" />
            </div>
          </cview>
          <cview name="yellowlight">
            <div class="yellowlight"> <img src="/static/zhibo/pk/img/lightyellow.png"
                style="width: 293px; height: 193px" />
            </div>
          </cview>
          <cview name="greenlight">
            <div class="greenlight"> <img src="/static/zhibo/pk/img/lightgreen.png"
                style="width: 293px; height: 193px" />
            </div>
          </cview>
        </div>
      </cview>
    </div>
    <div class="resultpage page2" style="display: block; position: absolute"
      :style="{ bottom: conf.isEnd ? '0px' : '9999px' }">
      <cview name="result1">
        <div v-if="conf.isEnd" class="resultitm result1" id="result1"> <img src="/static/zhibo/pk/img/result1.png"
            style="width: 226px; height: 177px" /></div>
      </cview>
      <cview name="result2">
        <div v-if="conf.isEnd" class="resultitm result2" id="result2"> <img src="/static/zhibo/pk/img/result2.png"
            style="width: 258px; height: 139px" /></div>
      </cview>
      <cview name="result3">
        <div v-if="conf.isEnd" class="resultitm result3" id="result3"> <img src="/static/zhibo/pk/img/result3.png"
            style="width: 173px; height: 112px" /></div>
      </cview>
      <div class="resultitm resultcar2" id="resultcar2" style="left: 81px; top: 287px">
        <cview name="rcar1">
          <div v-if="conf.isEnd && conf.numlist[1]" class="rcar" :class="['rcar' + conf.numlist[1].num]"></div>
        </cview>
      </div>
      <div class="resultitm resultcar3" id="resultcar3" style="left: 859px; top: 291px">
        <cview name="rcar3">
          <div v-if="conf.isEnd && conf.numlist[2]" class="rcar" :class="['rcar' + conf.numlist[2].num]"></div>
        </cview>
      </div>
      <div class="resultitm resultcar1" id="resultcar1" style="left: 395px; top: 328px">
        <cview name="rcar2">
          <div v-if="conf.isEnd && conf.numlist[0]" class="rcar" :class="['rcar' + conf.numlist[0].num]"></div>
        </cview>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { Scope } from 'tools-vue3';
import { stween } from '@/sstore/stween';
import cview from './cview.vue'
import { onMounted, reactive, watch } from 'vue';

const props = defineProps({
  issue: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: ''
  },
  width: {
    type: Number,
    default: 1334
  }
})

const timer = Scope.Timer()

const conf = reactive({
  scale: 1,

  isStart: false,
  isEnd: false,
  numlist: [] as any[],
  setList(arr:any) {
    const sorts = [10, 9, 8]
    conf.numlist = arr.map((item:any, i:any) => {
      return {
        num: item,
        sort: sorts[i]
      }
    })
  },
  startCountdown() {
    return new Promise((res) => {
      const options = {
        opacity: 1,
        time: 1000
      }
      stween.to('redlight', options)
      stween.to('yellowlight', {
        ...options,
        delay: 1000
      })
      stween.to('greenlight', {
        ...options,
        delay: 2000,
        final() {
          stween.set(['trafficlight'], {
            opacity: 0
          })
          res(true)
        }
      })
    })
  },
  init(res:any) {
    stween.set(['redlight', 'greenlight', 'yellowlight'], {
      opacity: 0
    })
    stween.set(['trafficlight', 'roadstart'], {
      opacity: 1
    })
    stween.set(['roadstart'], {
      x: 0
    })
    for (let i = 1; i < 11; i++) {
      stween.set([`flame${i}`, `wind${i}`, `wheel${i}b`, `wheel${i}a`], {
        opacity: 0
      })

      stween.set('car' + i, {
        x: 0
      })
    }

    conf.numlist = res
  },
  async start() {
    await conf.startCountdown()
    conf.isStart = true
    //背景
    const loopBg = () => {
      stween.to('scenaryitm', {
        x: 1334,
        time: 20000,
        final() {
          stween.set('scenaryitm', {
            x: 0
          })
          if (conf.isStart) {
            loopBg()
          }
        }
      })
    }
    loopBg()

    //路障
    stween.to(['roadstart'], {
      x: 400,
      time: 600,
      final() {
        stween.set('roadstart', {
          x: -2000,
        })
      }
    })

    //路面
    const loopRoad = () => {
      stween.to('roaditm', {
        x: 1200,
        time: 400,
        final() {
          stween.set('roaditm', {
            x: 0
          })
          if (conf.isStart) {
            loopRoad()
          }
        }
      })
    }
    loopRoad()

    conf.carInfo.x = {}

    //车辆行驶
    const _final = (i:any) => {
      if (i === 10) {
        if (conf.stopFun) {
          conf.stopFun()
          conf.stopFun = null
        } else if (conf.isStart) {  
          conf.loopCar(conf.getRandomCarArr(), _final,'')
        }
      }
    }
    conf.loopCar(conf.getRandomCarArr(), _final,'')
  },
  carInfo: {
    x: {}
  } as any,
  getRandomCarArr() {
    const arr = []
    for (let i = 1; i < 11; i++) {
      arr.push(MathUtil.getRandomInt(100, 700))
    }
    return arr
  },
  loopCar(res:any, final:any, forceup:any) {
    conf.numlist = []
    for (let i = 1; i < 11; i++) {
      const x = res[i - 1]
      if (!conf.carInfo.x[i]) conf.carInfo.x[i] = 0
      const up = conf.carInfo.x[i] < x
      conf.carInfo.x[i] = x
      conf.numlist.push({
        num: i,
        sort: x
      })
      stween.to('car' + i, {
        x: -x,
        time: 1000,
        final() {
          if (final) {
            final(i)
          }
        }
      })
      stween.set([`flame${i}`, `wind${i}`, `wheel${i}b`, `wheel${i}a`], {
        opacity: forceup ? 1 : up ? 1 : 0
      })
    }
    conf.numlist = conf.numlist.sort((a, b) => b.sort - a.sort)
  },
  /**
   * 冲线钩子
   */
  stopFun: null as any,
  /**
   * 执行生成结果，进行冲线
   * @param res -数组：[1,2,3]
   */
  async stop(res:any) {
    const _arr = conf.getRandomCarArr()
    for (let i = 0; i < res.length; i++) {
      _arr[res[i] - 1] = 950 - i * 50 - MathUtil.getRandomInt(0, 30)
    }
    stween.set('roadstart', {
      x: -1334
    })
    conf.stopFun = () => {
      stween.to('roadstart', {
        x: -800,
        time: 1000
      })
      conf.loopCar(
        _arr,
        (i:any) => {
          if (i === 10) {
            conf.isStart = false
            stween.pause(['scenaryitm', 'roaditm'])

            timer.once(() => {
              //移出屏幕外面
              for (let i = 1; i < 11; i++) {
                stween.to('car' + i, {
                  x: -(conf.carInfo.x[i] + 1334),
                  time: 1000,
                  final() {
                    if (i === 10) {
                      conf.showWin()
                    }
                  }
                })
              }
            }, 1000)
          }
        },
        true
      )
    }
  },

  /**
   * 结算画面
   */
  showWin() {
    conf.isEnd = true
    stween.set(['rcar1', 'rcar2', 'rcar3', 'result1', 'result2', 'result3'], {
      opacity: 0
    })
    stween.set(['rcar1', 'rcar2', 'rcar3'], {
      x: 40,
      y: -40
    })

    conf.numlist = conf.numlist.slice(0, 3)
    conf.init([...conf.numlist])

    timer.once(() => {
      const options1 = {
        x: 0,
        y: 0,
        opacity: 1,
        time: 600
      }
      stween.to('rcar2', {
        ...options1
      })
      stween.to('rcar1', {
        ...options1,
        delay: 600
      })
      stween.to('rcar3', {
        ...options1,
        delay: 1200
      })

      const options2 = {
        opacity: 1,
        time: 600
      }
      stween.to('result1', {
        ...options2
      })
      stween.to('result2', {
        ...options2,
        delay: 600
      })
      stween.to('result3', {
        ...options2,
        delay: 1200,
        final() {
          timer.once(() => {
            conf.isEnd = false
          }, 1000)
        }
      })
    }, 500)
  },
  /**
   * 重置为一开始
   */
  reset() {
    stween.kill(['redlight', 'greenlight', 'yellowlight', 'trafficlight', 'roadstart', 'scenaryitm', 'roaditm', 'rcar1', 'rcar2', 'rcar3', 'result1', 'result2', 'result3'])
    for (let i = 1; i < 11; i++) {
      stween.kill([`flame${i}`, `wind${i}`, `wheel${i}b`, `wheel${i}a`, 'car' + i])
    }
    timer.clear()
    conf.isEnd = false
    conf.isStart = false
    conf.init([])
  }
})
watch(
  () => props.width,
  (newVal) => {
    conf.scale = newVal / 1334
  },
  {
    deep: true // 深度监听父组件传过来对象变化
  }
)
// 暴露方法
defineExpose({
  reset: conf.reset,
  start: conf.start,
  stop: conf.stop,
  setList: conf.setList
})
onMounted(() => {
  conf.numlist = conf.getRandomCarArr()
    // conf.scale = uni.upx2px(conf.width) / 1334
    conf.scale = props.width / 1334
  conf.init([])
})
</script>

<style lang="less" scoped>
.hide {
  display: none;
}

.container {
  width: 1334px;
  height: 755px;
  overflow: hidden;
  position: absolute;
  left: 0;
  color: #fff;
  top: 0;
}

.header {
  height: 115px;
  background-image: url('/static/zhibo/pk/img/top_header.jpg');
  position: relative;
}

.logo {
  /*position: absolute;*/
  /*top: 25px;*/
  /*left: 30px;*/
  /*font-size: 50px;*/
  display: flex;
  height: 114px;
  margin-left: 20px;
  align-items: center;
  font-size: 40px;
}

.position {
  position: absolute;
  top: 30px;
  left: 320px;
}

.positm {
  float: left;
  width: 64px;
  height: 64px;
  margin-right: 5px;
}

.positm {
  background: url('/static/zhibo/pk/img/numbersprite.png') no-repeat top left;
  width: 64px;
  height: 64px;
}

.num1 {
  background-position: 0 0;
}

.num2 {
  background-position: 0 -64px;
}

.num3 {
  background-position: 0 -128px;
}

.num4 {
  background-position: 0 -192px;
}

.num5 {
  background-position: 0 -256px;
}

.num6 {
  background-position: 0 -320px;
}

.num7 {
  background-position: 0 -384px;
}

.num8 {
  background-position: 0 -448px;
}

.num9 {
  background-position: 0 -512px;
}

.num10 {
  background-position: 0 -576px;
}

.scenary {
  height: 119px;
  position: relative;
}

.scenaryitm {
  position: absolute;
  top: 0px;
  left: -1334px;
}

.scenaryitm-img {
  background: url('/static/zhibo/pk/img/scenery.jpg') no-repeat;
  width: 2668px;
  height: 119px;
}

.road {
  height: 540px;
  position: relative;
}

.roadani {
  position: absolute;
  width: 1334px;
  height: 540px;
  top: 0;
  left: 0;
  overflow: hidden;
}

.roaditm {
  position: absolute;
  top: 0;
  left: -1300px;
}

.roaditm-img {
  background: url('/static/zhibo/pk/img/road.jpg') no-repeat;
  width: 2660px;
  height: 540px;
  background-size: 100% 100%;
}

.flag {
  position: absolute;
  bottom: 0;
  left: -150px;
}

.car1,
.car10,
.car2,
.car3,
.car4,
.car5,
.car6,
.car7,
.car8,
.car9 {
  position: absolute;
}

.car1 {
  top: -5px;
  left: 1206px;
}

.car2 {
  top: 38px;
  left: 1197px;
}

.car3 {
  top: 83px;
  left: 1181px;
}

.car4 {
  top: 132px;
  left: 1166px;
}

.car5 {
  top: 179px;
  left: 1150px;
}

.car6 {
  top: 225px;
  left: 1139px;
}

.car7 {
  top: 272px;
  left: 1128px;
}

.car8 {
  top: 328px;
  left: 1105px;
}

.car9 {
  top: 380px;
  left: 1084px;
}

.car10 {
  top: 440px;
  left: 1067px;
}

.roadstart {
  position: absolute;
  top: 15px;
  left: 960px;
  display: block;
}

.wheel1a {
  position: absolute;
  left: 29px;
  top: 21px;
}

.wheel1b {
  position: absolute;
  left: 124px;
  top: 20px;
}

.wheel2a {
  position: absolute;
  left: 29px;
  top: 21px;
}

.wheel2b {
  position: absolute;
  left: 128px;
  top: 20px;
}

.wheel3a {
  position: absolute;
  left: 32px;
  top: 23px;
}

.wheel3b {
  position: absolute;
  left: 133px;
  top: 22px;
}

.wheel4a {
  position: absolute;
  left: 32px;
  top: 23px;
}

.wheel4b {
  position: absolute;
  left: 135px;
  top: 23px;
}

.wheel5a {
  position: absolute;
  left: 36px;
  top: 24px;
}

.wheel5b {
  position: absolute;
  left: 149px;
  top: 23px;
}

.wheel6a {
  position: absolute;
  left: 39px;
  top: 27px;
}

.wheel6b {
  position: absolute;
  left: 159px;
  top: 26px;
}

.wheel7a {
  position: absolute;
  left: 39px;
  top: 32px;
}

.wheel7b {
  position: absolute;
  left: 166px;
  top: 31px;
}

.wheel8a {
  position: absolute;
  left: 42px;
  top: 31px;
}

.wheel8b {
  position: absolute;
  left: 172px;
  top: 31px;
}

.wheel9a {
  position: absolute;
  left: 44px;
  top: 33px;
}

.wheel9b {
  position: absolute;
  left: 182px;
  top: 32px;
}

.wheel10a {
  position: absolute;
  left: 46px;
  top: 35px;
}

.wheel10b {
  position: absolute;
  left: 191px;
  top: 33px;
}

.trafficlight {
  position: absolute;
  top: 145px;
  left: 340px;
  background-image: url(/static/zhibo/pk/img/trafficlight.png);
  width: 636px;
  height: 128px;
}

.redlight {
  position: absolute;
  left: 377px;
  top: -32px;
}

.yellowlight {
  position: absolute;
  left: 179px;
  top: -32px;
}

.greenlight {
  position: absolute;
  left: -23px;
  top: -33px;
}

.countdownnum {
  font-family: DS-Digital;
  position: absolute;
  top: -99px;
  left: 115px;
  font-size: 120px;
  line-height: 80px;
  color: #fff;
  text-align: right;
  width: 308px;
  height: 87px;
}

.countdownnum2 {
  font-family: DS-Digital;
  position: absolute;
  top: -72px;
  left: 433px;
  font-size: 70px;
  line-height: 60px;
  color: #fff;
  text-align: left;
  width: 90px;
  height: 63px;
}

.currentdraw {
  position: absolute;
  left: 1025px;
  top: 39px;
  font-size: 34px;
  width: 255px;
  height: 51px;
  white-space: nowrap;
}

#currentdrawid {
  font-family: arial;
}

.footer {
  height: 120px;
  width: 100%;
  background-color: #202020;
  position: absolute;
  font-size: 31px;
  top: 770px;
}

.footer1 {
  margin-top: 2px;
  margin-left: 13px;
  width: 370px;
  height: 88px;
  border: 4px solid #333;
  -webkit-border-radius: 5px;
  -moz-border-radius: 5px;
  border-radius: 5px;
  float: left;
  white-space: nowrap;
}

.footer1_1 {
  float: left;
  margin-left: 20px;
  margin-top: 20px;
}

.footer1_2 {
  float: left;
  margin-left: 10px;
  margin-top: 16px;
  line-height: 28px;
  font-family: arial;
}

.footer2 {
  margin-top: 2px;
  margin-left: 10px;
  width: 370px;
  height: 88px;
  border: 4px solid #333;
  -webkit-border-radius: 5px;
  -moz-border-radius: 5px;
  border-radius: 5px;
  float: left;
  white-space: nowrap;
}

.footer2_1 {
  float: left;
  width: 141px;
  margin-left: 5px;
  margin-top: 20px;
}

.footer2_2 {
  float: left;
  margin-left: 10px;
  margin-top: 12px;
  width: 60px;
  height: 60px;
  text-align: center;
  line-height: 60px;
  -webkit-border-radius: 30px;
  -moz-border-radius: 30px;
  border-radius: 30px;
  background: #0191de;
  background: -moz-linear-gradient(top, #0191de 0, #09418b 100%);
  background: -webkit-linear-gradient(top, #0191de 0, #09418b 100%);
  background: linear-gradient(to bottom, #0191de 0, #09418b 100%);
}

.footer3 {
  margin-top: 2px;
  margin-left: 10px;
  width: 530px;
  height: 88px;
  border: 4px solid #333;
  -webkit-border-radius: 5px;
  -moz-border-radius: 5px;
  border-radius: 5px;
  float: left;
  white-space: nowrap;
}

.flashlight {
  width: 100%;
  height: 639px;
  background-color: #fff;
  position: absolute;
  top: 114px;
}

.wind {
  position: absolute;
  top: -3px;
  left: -11px;
}

.flame {
  position: absolute;
}

.page1 {
  display: block;
}

.resultpage {
  width: 1334px;
  height: 639px;

  position: relative;
  background-image: url(/static/zhibo/pk/img/resultbg.jpg);
}

.resultitm {
  position: absolute;
}

.resultitm .rcar {
  background-size: 100% 100%;
}

.rcar1 {
  background-image: url(/static/zhibo/pk/img/winner1.png);
}

.rcar2 {
  background-image: url(/static/zhibo/pk/img/winner2.png);
}

.rcar3 {
  background-image: url(/static/zhibo/pk/img/winner3.png);
}

.rcar4 {
  background-image: url(/static/zhibo/pk/img/winner4.png);
}

.rcar5 {
  background-image: url(/static/zhibo/pk/img/winner5.png);
}

.rcar6 {
  background-image: url(/static/zhibo/pk/img/winner6.png);
}

.rcar7 {
  background-image: url(/static/zhibo/pk/img/winner7.png);
}

.rcar8 {
  background-image: url(/static/zhibo/pk/img/winner8.png);
}

.rcar9 {
  background-image: url(/static/zhibo/pk/img/winner9.png);
}

.rcar10 {
  background-image: url(/static/zhibo/pk/img/winner10.png);
}

.result1 {
  top: 80px;
  left: 568px;
}

.result2 {
  left: 173px;
  top: 107px;
}

.result3 {
  left: 960px;
  top: 121px;
}

.resultcar1 {
  top: 328px;
  left: 395px;
}

.resultcar1 div {
  width: 510px;
  height: 222px;
}

.resultcar2 {
  top: 287px;
  left: 81px;
}

.resultcar2 div {
  width: 422px;
  height: 184px;
}

.resultcar3 {
  top: 291px;
  left: 859px;
}

.resultcar3 div {
  width: 384px;
  height: 166px;
}

.ctrl {
  position: fixed;
  left: 30px;
  top: 130px;
}

#soundCtrl {
  height: 74px;
  width: 74px;
  background: url(/static/zhibo/pk/img/soundbtn.png) no-repeat;
  background-position-y: -92px;
  cursor: pointer;
}

#soundCtrl.on {
  background-position-y: 0;
}
</style>
