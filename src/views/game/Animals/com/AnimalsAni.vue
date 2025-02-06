<template>
    <div class="track">
        <!-- 领奖台 -->
        <podium :winList="conf.numlist" v-if="conf.podiumShow" />
        <!-- 观众台 -->
        <div style="height: 25%;">
            <cview name="desk" direction="-">
                <div style="display: flex;height: 100%;width: 2000px;">
                    <div class="desk"></div>
                    <div class="desk"></div>
                </div>
            </cview>
        </div>
        <div class="trackitm">
            <cview name="trackitm" direction="-">
                <div class="track-bg"></div>
            </cview>
            <div style="position: absolute;inset: 0;">
                <cview name="roadfinsh" direction="-">
                    <div class="roadfinsh" id="roadstart"><img class="finsh-img"
                            src="/static/img/game/animal/finish.png" />
                    </div>
                </cview>
            </div>
        </div>
        <div class="player">
            <div style="height: 100%;display: flex;flex-direction: column;">
                <cview name="animal1">
                    <div class="animal1" id="animal1">
                        <lottie-player autoplay loop mode="normal" v-show="conf.aniInfo[1] == 'walk'"
                            src="/static/lottie/exb/exb-walk.json" />
                        <lottie-player autoplay loop mode="normal" v-show="conf.aniInfo[1] == 'active'"
                            src="/static/lottie/exb/exb-active.json" />
                        <lottie-player autoplay loop mode="normal" speed="1"
                            v-show="conf.aniInfo[1] == 'run' && conf.speedInfo[1] == 1"
                            src="/static/lottie/exb/exb-run.json" />
                        <lottie-player autoplay loop mode="normal" speed="2"
                            v-show="conf.aniInfo[1] == 'run' && conf.speedInfo[1] == 2"
                            src="/static/lottie/exb/exb-run.json" />
                        <lottie-player autoplay loop mode="normal" v-show="conf.aniInfo[1] == 'prop'"
                            src="/static/lottie/exb/exb-prop.json" />
                        <div class="plus" v-if="conf.showPlus[1]">
                            <lottie-player autoplay loop mode="normal" :key="conf.aniInfo[1]"
                                :src="`/static/lottie/plus.json`" />
                        </div>
                        <div v-else>
                            <cview name="light1" direction="-">
                                <img class="plus-img" src="/static/img/game/animal/light-plus.png" />
                            </cview>
                        </div>
                        <div class="rain" v-if="conf.showRain[1]">
                            <lottie-player autoplay loop mode="normal" :key="conf.aniInfo[1]"
                                :src="`/static/lottie/rain.json`" />
                        </div>
                        <div v-else>
                            <cview name="rain1" direction="-">
                                <img class="rain-img" src="/static/img/game/animal/rain.png" />
                            </cview>
                        </div>
                    </div>
                </cview>
                <cview name="animal2">
                    <div class="animal2" id="animal2">
                        <lottie-player autoplay loop mode="normal" v-show="conf.aniInfo[2] == 'walk'"
                            src="/static/lottie/hm/hm-walk.json" />
                        <lottie-player autoplay loop mode="normal" v-show="conf.aniInfo[2] == 'active'"
                            src="/static/lottie/hm/hm-active.json" />
                        <lottie-player autoplay loop mode="normal" speed="1"
                            v-show="conf.aniInfo[2] == 'run' && conf.speedInfo[2] == 1"
                            src="/static/lottie/hm/hm-run.json" />
                        <lottie-player autoplay loop mode="normal" speed="2"
                            v-show="conf.aniInfo[2] == 'run' && conf.speedInfo[2] == 2"
                            src="/static/lottie/hm/hm-run.json" />
                        <lottie-player autoplay loop mode="normal" v-show="conf.aniInfo[2] == 'prop'"
                            src="/static/lottie/hm/hm-prop.json" />
                        <div class="plus" v-if="conf.showPlus[2]">
                            <lottie-player autoplay loop mode="normal" :key="conf.aniInfo[2]"
                                :src="`/static/lottie/plus.json`" />
                        </div>
                        <div v-else>
                            <cview name="light2" direction="-">
                                <img class="plus-img" src="/static/img/game/animal/light-plus.png" />
                            </cview>
                        </div>
                        <div class="rain" v-if="conf.showRain[2]">
                            <lottie-player autoplay loop mode="normal" :key="conf.aniInfo[1]"
                                :src="`/static/lottie/rain.json`" />
                        </div>
                        <div v-else>
                            <cview name="rain2" direction="-">
                                <img class="rain-img" src="/static/img/game/animal/rain.png" />
                            </cview>
                        </div>
                    </div>
                </cview>
                <cview name="animal3">
                    <div class="animal3" id="animal3">
                        <lottie-player autoplay loop mode="normal" v-show="conf.aniInfo[3] == 'walk'"
                            src="/static/lottie/pp/pp-walk.json" />
                        <lottie-player autoplay loop mode="normal" v-show="conf.aniInfo[3] == 'active'"
                            src="/static/lottie/pp/pp-active.json" />
                        <lottie-player autoplay loop mode="normal" speed="1"
                            v-show="conf.aniInfo[3] == 'run' && conf.speedInfo[3] == 1"
                            src="/static/lottie/pp/pp-run.json" />
                        <lottie-player autoplay loop mode="normal" speed="2"
                            v-show="conf.aniInfo[3] == 'run' && conf.speedInfo[3] == 2"
                            src="/static/lottie/pp/pp-run.json" />
                        <lottie-player autoplay loop mode="normal" v-show="conf.aniInfo[3] == 'prop'"
                            src="/static/lottie/pp/pp-prop.json" />
                        <div class="plus" v-if="conf.showPlus[3]">
                            <lottie-player autoplay loop mode="normal" :key="conf.aniInfo[3]"
                                :src="`/static/lottie/plus.json`" />
                        </div>
                        <div v-else>
                            <cview name="light3" direction="-">
                                <img class="plus-img" src="/static/img/game/animal/light-plus.png" />
                            </cview>
                        </div>
                        <div class="rain" v-if="conf.showRain[3]">
                            <lottie-player autoplay loop mode="normal" :key="conf.aniInfo[1]"
                                :src="`/static/lottie/rain.json`" />
                        </div>
                        <div v-else>
                            <cview name="rain3" direction="-">
                                <img class="rain-img" src="/static/img/game/animal/rain.png" />
                            </cview>
                        </div>
                    </div>
                </cview>
                <cview name="animal4">
                    <div class="animal4" id="animal4">
                        <lottie-player autoplay loop mode="normal" v-show="conf.aniInfo[4] == 'walk'"
                            src="/static/lottie/xz/xz-walk.json" />
                        <lottie-player autoplay loop mode="normal" v-show="conf.aniInfo[4] == 'active'"
                            src="/static/lottie/xz/xz-active.json" />
                        <lottie-player autoplay loop mode="normal" speed="1"
                            v-show="conf.aniInfo[4] == 'run' && conf.speedInfo[4] == 1"
                            src="/static/lottie/xz/xz-run.json" />
                        <lottie-player autoplay loop mode="normal" speed="2"
                            v-show="conf.aniInfo[4] == 'run' && conf.speedInfo[4] == 2"
                            src="/static/lottie/xz/xz-run.json" />
                        <lottie-player autoplay loop mode="normal" v-show="conf.aniInfo[4] == 'prop'"
                            src="/static/lottie/xz/xz-prop.json" />
                        <div class="plus" v-if="conf.showPlus[4]">
                            <lottie-player autoplay loop mode="normal" :key="conf.aniInfo[4]"
                                :src="`/static/lottie/plus.json`" />
                        </div>
                        <div v-else>
                            <cview name="light4" direction="-">
                                <img class="plus-img" src="/static/img/game/animal/light-plus.png" />
                            </cview>
                        </div>
                        <div class="rain" v-if="conf.showRain[4]">
                            <lottie-player autoplay loop mode="normal" :key="conf.aniInfo[1]"
                                :src="`/static/lottie/rain.json`" />
                        </div>
                        <div v-else>
                            <cview name="rain4" direction="-">
                                <img class="rain-img" src="/static/img/game/animal/rain.png" />
                            </cview>
                        </div>
                    </div>
                </cview>
                <cview name="animal5">
                    <div class="animal5" id="animal5">
                        <lottie-player autoplay loop mode="normal" v-show="conf.aniInfo[5] == 'walk'"
                            src="/static/lottie/zxb/zxb-walk.json" />
                        <lottie-player autoplay loop mode="normal" v-show="conf.aniInfo[5] == 'active'"
                            src="/static/lottie/zxb/zxb-active.json" />
                        <lottie-player autoplay loop mode="normal" speed="0.8"
                            v-show="conf.aniInfo[5] == 'run' && conf.speedInfo[5] == 1"
                            src="/static/lottie/zxb/zxb-run.json" />
                        <lottie-player autoplay loop mode="normal" speed="1.3"
                            v-show="conf.aniInfo[5] == 'run' && conf.speedInfo[5] == 2"
                            src="/static/lottie/zxb/zxb-run.json" />
                        <lottie-player autoplay loop mode="normal" v-show="conf.aniInfo[5] == 'prop'"
                            src="/static/lottie/zxb/zxb-prop.json" />
                        <div class="plus" v-if="conf.showPlus[5]">
                            <lottie-player autoplay loop mode="normal" :key="conf.aniInfo[5]"
                                :src="`/static/lottie/plus.json`" />
                        </div>
                        <div v-else>
                            <cview name="light5" direction="-">
                                <img class="plus-img" src="/static/img/game/animal/light-plus.png" />
                            </cview>
                        </div>
                        <div class="rain" v-if="conf.showRain[5]">
                            <lottie-player autoplay loop mode="normal" :key="conf.aniInfo[1]"
                                :src="`/static/lottie/rain.json`" />
                        </div>
                        <div v-else>
                            <cview name="rain5" direction="-">
                                <img class="rain-img" src="/static/img/game/animal/rain.png" />
                            </cview>
                        </div>
                    </div>
                </cview>
                <cview name="animal6">
                    <div class="animal6" id="animal6">
                        <lottie-player autoplay loop mode="normal" v-show="conf.aniInfo[6] == 'walk'"
                            src="/static/lottie/hx/hx-walk.json" />
                        <lottie-player autoplay loop mode="normal" v-show="conf.aniInfo[6] == 'active'"
                            src="/static/lottie/hx/hx-active.json" />
                        <lottie-player autoplay loop mode="normal" speed="1"
                            v-show="conf.aniInfo[6] == 'run' && conf.speedInfo[6] == 1"
                            src="/static/lottie/hx/hx-run.json" />
                        <lottie-player autoplay loop mode="normal" speed="2"
                            v-show="conf.aniInfo[6] == 'run' && conf.speedInfo[6] == 2"
                            src="/static/lottie/hx/hx-run.json" />
                        <lottie-player autoplay loop mode="normal" v-show="conf.aniInfo[6] == 'prop'"
                            src="/static/lottie/hx/hx-prop.json" />
                        <div class="plus" v-if="conf.showPlus[6]">
                            <lottie-player autoplay loop mode="normal" :key="conf.aniInfo[6]"
                                :src="`/static/lottie/plus.json`" />
                        </div>
                        <div v-else>
                            <cview name="light6" direction="-">
                                <img class="plus-img" src="/static/img/game/animal/light-plus.png" />
                            </cview>
                        </div>
                        <div class="rain" v-if="conf.showRain[6]">
                            <lottie-player autoplay loop mode="normal" :key="conf.aniInfo[1]"
                                :src="`/static/lottie/rain.json`" />
                        </div>
                        <div v-else>
                            <cview name="rain6" direction="-">
                                <img class="rain-img" src="/static/img/game/animal/rain.png" />
                            </cview>
                        </div>
                    </div>
                </cview>
            </div>
            <div class="Ready">
                <img v-if="conf.showReady == 'ready'" class="ready-img" src="/static/img/game/animal/Ready.png" />
                <img v-else-if="conf.showReady == 'go'" class="ready-img" src="/static/img/game/animal/Go.png" />
            </div>
            <!-- 排名动画 -->
            <div class="sort" v-show="conf.rank">
                <div class="item" v-for="(item, index) in conf.numlist" :key="index">
                    <rank :imgUrl="item.img" :name="item.lable" :sort="item.sort" v-if="item.show" />
                </div>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import { onMounted, reactive } from 'vue';
import cview from './cview.vue';
import rank from './rank.vue'
import podium from './podium.vue';
import stween from '@/sstore/stween';
import System from '@/utils/System';
import { Scope } from 'tools-vue3';
import sutil from '@/sstore/sutil';

const timer = Scope.Timer()
System.loadModule('lottie')

const emit = defineEmits(['close'])

const conf = reactive({
    // 动作
    aniInfo: {
        1: 'walk',
        2: 'walk',
        3: 'walk',
        4: 'walk',
        5: 'walk',
        6: 'walk',
    } as any,
    //  显示的加速道具
    showPlus: {
        1: false,
        2: false,
        3: false,
        4: false,
        5: false,
        6: false,
    } as any,
    // 显示的加速道具
    showRain: {
        1: false,
        2: false,
        3: false,
        4: false,
        5: false,
        6: false,
    } as any,
    // 跑速度
    speedInfo: {
        1: 1,
        2: 1,
        3: 1,
        4: 1,
        5: 1,
        6: 1,
    } as any,
    showReady: '',
    isStart: false,
    rank: false,
    podiumShow: false,
    numlist: [] as any[],
    numsort: [] as any[],
    downNum: 10,
    isAddRun: true,
    setList(arr: any) {
        const sorts = [6, 5, 4]
        // conf.numlist = arr.map((item: any, i: any) => {
        //     return {
        //         num: item,
        //         sort: sorts[i]
        //     }
        // })
    },
    init() {
        conf.numlist = [
            {
                img: 'A',
                name: 'exb',
                lable: 'Exiaobao',
                show: false,
                sort: 1,
                num: 1
            },
            {
                img: 'B',
                name: 'hm',
                lable: 'Freshippo',
                show: false,
                sort: 2,
                num: 2
            },
            {
                img: 'C',
                name: 'pp',
                lable: 'Piaopiao',
                show: false,
                sort: 3,
                num: 3
            },
            {
                img: 'D',
                name: 'xz',
                lable: 'Xiazai',
                show: false,
                sort: 4,
                num: 4
            },
            {
                img: 'E',
                name: 'zxb',
                lable: 'Zhixiaobao',
                show: false,
                sort: 5,
                num: 5
            },
            {
                img: 'F',
                name: 'hx',
                lable: 'Huanxing',
                show: false,
                sort: 6,
                num: 6
            }
        ]
        for (let i = 1; i < 7; i++) {
            conf.aniInfo[i] = 'walk'
            let time = MathUtil.getRandomInt(1400, 2000)
            stween.to('animal' + i, {
                x: 190,
                time,
                final() {
                    conf.aniInfo[i] = 'active'
                }
            })
        }

        timer.once(() => {
            timer.once(() => {
                conf.showReady = 'ready'
                timer.once(() => {
                    conf.showReady = 'go'
                    timer.once(() => {
                        conf.showReady = ''
                        for (let i = 1; i < 7; i++) {
                            conf.aniInfo[i] = 'run'
                            let time = MathUtil.getRandomInt(1500, 2000)
                            stween.to('animal' + i, {
                                x: 320,
                                time
                            })
                        }
                        timer.once(() => {
                            conf.start()
                        }, 1500)
                    }, 800)
                }, 800)
            }, 800)
        }, 2200)
        // conf.numlist = res
    },
    reset() {
        conf.isStart = false
        conf.podiumShow = false
        conf.rank = false
        conf.showReady = ''
        conf.numsort = []
        stween.kill(['trackitm', 'desk', 'light', 'rain', 'roadfinsh'])
        for (let i = 1; i < 7; i++) {
            conf.aniInfo[i] = 'walk'
            conf.showRain[i] = false
            stween.kill(['animal' + i])
            stween.kill(['light' + i])
            stween.kill(['rain' + i])
        }
        timer.clear()
        stween.set(['trackitm', 'desk'], {
            x: 0
        })
        stween.set(['roadfinsh'], {
            x: 0
        })
        for (let i = 1; i < 7; i++) {
            stween.set('animal' + i, {
                x: 0
            })
            stween.set('light' + i, {
                x: 0
            })
            stween.set('rain' + i, {
                x: 0
            })
        }
    },
    // 开始
    start() {
        conf.isStart = true
        conf.isAddRun = true
        //观景台
        const loopDesk = () => {
            stween.to('desk', {
                x: 2000 - sutil.rem2px(750),
                time: 12000,
                reverse: () => { },
                final() {
                    stween.set('desk', {
                        x: sutil.rem2px(750)
                    })
                    if (conf.isStart) {
                        loopDesk()
                    }
                }
            })
        }
        loopDesk()
        //背景
        const loopBg = () => {
            stween.to('trackitm', {
                x: 500,
                time: 4000,
                reverse: () => { },
                final() {
                    stween.to('trackitm', {
                        x: 1440,
                        time: 32000,
                        reverse: () => { },
                        final() {
                            stween.set('trackitm', {
                                x: 2260
                            })
                            if (conf.isStart) {
                                loopBg()
                            }
                        }
                    })
                }
            })
        }
        loopBg()
        conf.carInfo.x = {}
        //动物跑步
        const _final = (i: any) => {
            if (i === 6) {
                if (conf.stopFun) {
                    conf.stopFun()
                    conf.stopFun = null
                } else if (conf.isStart) {
                    conf.loopCar(conf.getRandomCarArr(), _final, '')
                }
            }
        }
        conf.loopCar(conf.getRandomCarArr(), _final, '')
        // timer.once(() => {
        //     conf.stop([])
        // },10000)
    },
    carInfo: {
        x: {}
    } as any,
    getRandomCarArr() {
        const arr = []
        for (let i = 1; i < 7; i++) {
            arr.push(MathUtil.getRandomInt(280, 420))
        }
        return arr
    },
    loopCar(res: any, final: any, forceup: any) {
        conf.numsort = []
        for (let i = 1; i < 7; i++) {
            let x = res[i - 1]
            conf.numsort.push({
                num: i,
                sort: x
            })
        }
        conf.numsort = conf.numsort.sort((a, b) => b.sort - a.sort)

        for (let i = 1; i < 7; i++) {
            let x = res[i - 1]
            if (!conf.carInfo.x[i]) conf.carInfo.x[i] = 0
            conf.carInfo.x[i] = x
            if (i < 3 && conf.isAddRun) conf.speedInfo[conf.numsort[i - 1].num] = 2
            let time = x * 10
            if (!conf.isAddRun) time = x * 7
            // conf.aniName + conf.numsort[0].num = 'run'
            stween.to('animal' + i, {
                x: x,
                time,
                final() {
                    if (i < 3) conf.speedInfo[conf.numsort[i - 1].num] = 1
                    if (final) {
                        final(i)
                    }
                }
            })
        }
    },
    /**
   * 冲线钩子
   */
    stopFun: null as any,
    /**
     * 执行生成结果，进行冲线
     * @param res -数组：[1,2,3]
     */
    async stop(res: any) {
        if (res.length < 6) res = ["B", "F", 'A', 'C', 'E', 'D']
        let list = ["A", "B", 'C', 'D', 'E', 'F']
        const stIndex = list.indexOf(res[0]);
        const ndIndex = list.indexOf(res[1]);
        const rdIndex = list.indexOf(res[2]);
        const fuIndex = list.indexOf(res[3]);
        const fvIndex = list.indexOf(res[4]);
        const sxIndex = list.indexOf(res[5]);
        let numList = conf.getRandomCarArr()
        numList = numList.sort((a, b) => b - a)
        let _arr = []
        _arr[stIndex] = numList[0]
        _arr[ndIndex] = numList[1]
        _arr[rdIndex] = numList[2]
        _arr[fuIndex] = numList[3]
        _arr[fvIndex] = numList[4]
        _arr[sxIndex] = numList[5]

        let minIndex = _arr.findIndex(number => number === Math.min(..._arr));
        let maxIndex = _arr.findIndex(number => number === Math.max(..._arr));
        maxIndex = maxIndex < 0 ? 1 : maxIndex + 1
        minIndex = minIndex < 0 ? 1 : minIndex + 1

        conf.stopFun = () => { }
        conf.isAddRun = false
        //道具
        const looplight = () => {
            stween.to('light' + maxIndex, {
                x: 880,
                time: 3000,
                final() {
                    conf.showPlus[maxIndex] = true
                    conf.aniInfo[maxIndex] = 'prop'
                    stween.to('animal' + maxIndex, {
                        x: conf.numsort[0].sort + 50,
                        time: 2000,
                        final() {
                            conf.aniInfo[maxIndex] = 'run'
                            conf.showPlus[maxIndex] = false
                            conf.loopCar(
                                _arr,
                                (i: any) => {
                                    if (i === maxIndex) {
                                        conf.showWin(minIndex)
                                    }
                                },
                                true
                            )
                        }
                    })
                }
            })
        }
        looplight()
        const looprain = () => {
            stween.to('rain' + minIndex, {
                x: 680,
                time: 2000,
                final() {
                    conf.showRain[minIndex] = true
                    conf.aniInfo[minIndex] = 'run'
                    stween.to('animal' + minIndex, {
                        x: conf.numsort[5].sort - 30,
                        time: 1500,
                        final() {
                            conf.showRain[minIndex] = false
                        }
                    })
                }
            })
        }
        looprain()
    },
    /**
   * 结算画面
   */
    showWin(maxIndex: number) {
        stween.pause(['trackitm'])
        stween.to('roadfinsh', {
            x: 160,
            time: 800
        })
        conf.isStart = false
        //移出屏幕外面
        timer.once(() => {
            stween.pause(['desk'])
            console.log('8888');
            console.log(conf.numsort);
            
            
            // 根据排名冲刺结算
            conf.rank = true
            for (let i = 1; i < 7; i++) {
                stween.to('animal' + conf.numsort[i - 1].num, {
                    x: sutil.rem2px(750) + (600 - conf.numsort[i - 1].sort),
                    time: (600 - conf.numsort[i - 1].sort) * 5,
                    final() {
                        let num = conf.numsort[i - 1].num
                        conf.numlist[num - 1].sort = i
                        conf.numlist[num - 1].show = true

                        if (i == maxIndex) {
                            timer.once(() => {
                                conf.podiumShow = true
                            }, 1000)
                            timer.once(() => {
                                conf.reset()
                                emit('close')
                            }, 3000)
                        }
                    }
                })
            }
        }, 800)
    },

})

// 暴露方法
defineExpose({
    reset: conf.reset,
    start: conf.start,
    stop: conf.stop,
    init: conf.init,
    setList: conf.setList
})

onMounted(() => {
    // conf.init()
})

</script>
<style lang="less" scoped>
.track {
    height: 100%;
    position: relative;
}

.desk {
    width: 1000px;
    height: 100%;
    background: url('/static/img/game/animal/viewdesk.webp') no-repeat;
    background-size: 100% 100%;
}

.trackitm {
    height: 75%;
    position: relative;
}

.roadfinsh {
    position: absolute;
    top: 0;
    bottom: -28rem;
    // left: 2660px;
    right: -60px;
}

.finsh-img {
    width: 18px;
    height: 100%;
}

.track-bg {
    background: url('/static/img/game/animal/track-bg.png') no-repeat;
    width: 2660px;
    height: 100%;
    background-size: 100% 100%;
}

.player {
    height: 76%;
    position: absolute;
    bottom: 0;
    right: 0;
    width: 100%;
}

.animal1,
.animal2,
.animal3,
.animal4,
.animal5,
.animal6 {
    position: absolute;
    left: -160px;
    height: 200rem;
    bottom: 0%;
}

.plus {
    position: absolute;
    top: -20rem;
    height: 220rem;
    z-index: 9;
}

.plus-img {
    width: 80rem;
    height: 80rem;
    position: absolute;
    bottom: 25rem;
    left: 900px;
}

.rain {
    position: absolute;
    top: -22rem;
    right: -21rem;
    height: 240rem;
    width: 240rem;
    z-index: 9;
}

.rain-img {
    width: 80rem;
    height: 80rem;
    position: absolute;
    bottom: 30rem;
    left: 700px;
}

.Ready {
    position: absolute;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: center;

    .ready-img {
        height: 80rem;
        transform: scale(1.2);
        animation: img-animation 0.8s linear;
    }

    @keyframes img-animation {
        0% {
            transform: scale(0.2);
        }

        100% {
            transform: scale(1.2);
        }
    }
}

.sort {
    position: absolute;
    top: 0;
    bottom: 0;
    right: 0;
    display: flex;
    flex-direction: column;

    .item {
        height: 16.6%
    }
}
</style>