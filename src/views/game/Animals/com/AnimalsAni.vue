<template>
    <div class="track">
        <cview name="trackitm" direction="-">
            <div class="track-bg"></div>
        </cview>
        <div class="player">
            <div style="height: 100%;display: flex;flex-direction: column;">
                <cview name="animal1">
                    <div class="animal1" id="animal1">
                        <lottie-player autoplay loop mode="normal" :key="conf.aniName"
                            :src="`/static/lottie/exb/exb-${conf.aniName}.json`" />
                        <div class="rain">
                            <lottie-player autoplay loop mode="normal" :key="conf.aniName"
                                :src="`/static/lottie/rain.json`" />
                        </div>
                    </div>
                </cview>
                <cview name="animal2">
                    <div class="animal2" id="animal2">
                        <lottie-player autoplay loop :key="conf.aniName" mode="normal"
                            :src="`/static/lottie/hm/hm-${conf.aniName}.json`" />
                    </div>
                </cview>
                <cview name="animal3">
                    <div class="animal3" id="animal3">
                        <lottie-player autoplay loop mode="normal" :key="conf.aniName"
                            :src="`/static/lottie/pp/pp-${conf.aniName}.json`" />
                    </div>
                </cview>
                <cview name="animal4">
                    <div class="animal4" id="animal4">
                        <lottie-player autoplay loop mode="normal" :key="conf.aniName"
                            :src="`/static/lottie/xz/xz-${conf.aniName}.json`" />
                    </div>
                </cview>
                <cview name="animal5">
                    <div class="animal5" id="animal5">
                        <lottie-player autoplay loop mode="normal" :key="conf.aniName"
                            :src="`/static/lottie/zxb/zxb-${conf.aniName}.json`" />
                    </div>
                </cview>
                <cview name="animal6">
                    <div class="animal6" id="animal6">
                        <lottie-player autoplay loop mode="normal" :key="conf.aniName"
                            :src="`/static/lottie/hx/hx-${conf.aniName}.json`" />
                    </div>
                </cview>
            </div>
            <div class="Ready">
                <img v-if="conf.showReady == 'ready'" class="ready-img" src="/static/img/game/animal/Ready.png" />
                <img v-else-if="conf.showReady == 'go'" class="ready-img" src="/static/img/game/animal/Go.png" />
            </div>
            <div class="sort" v-show="conf.rank">
                <div class="item" v-for="(item,index) in conf.numlist" :key="index">
                    <arank :imgUrl="item.img" :name="item.name" :sort="item.sort" v-if="item.show" />
                </div>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import { onMounted, reactive } from 'vue';
import cview from './cview.vue';
import arank from './arank.vue'
import stween from '@/sstore/stween';
import System from '@/utils/System';
import { Scope } from 'tools-vue3';
import sutil from '@/sstore/sutil';

const timer = Scope.Timer()
System.loadModule('lottie')

const conf = reactive({
    aniName: 'walk',
    showReady: '',
    isStart: false,
    rank: false,
    numlist: [] as any[],
    numsort: [] as any[],
    init() {
        for (let i = 1; i < 7; i++) {
            stween.to('animal' + i, {
                x: 200,
                time: 2000
            })
        }
        timer.once(() => {
            conf.aniName = 'active'
            console.log(conf.aniName);
            timer.once(() => {
                conf.showReady = 'ready'
                timer.once(() => {
                    conf.showReady = 'go'
                    timer.once(() => {
                        conf.aniName = 'run'
                        conf.showReady = ''
                        for (let i = 1; i < 7; i++) {
                            stween.to('animal' + i, {
                                x: 320,
                                time: 2000
                            })
                        }
                        timer.once(() => {
                            conf.start()
                        }, 2000)
                    }, 800)
                }, 800)
            }, 800)
        }, 2200)
        // conf.numlist = res
    },
    // 开始
    start() {
        //背景
        const loopBg = () => {
            stween.to('trackitm', {
                x: 1440,
                time: 20000,
                reverse: () => { },
                final() {
                    stween.set('trackitm', {
                        // x: 2260
                    })
                    if (conf.isStart) {
                        loopBg()
                    }
                }
            })
        }
        loopBg()
        //动物跑步
        const _final = (i: any) => {
            if (i === 7) {
                if (conf.stopFun) {
                    conf.stopFun()
                    conf.stopFun = null
                } else if (conf.isStart) {
                    conf.loopCar(conf.getRandomCarArr(), _final, '')
                }
            }
        }
        conf.loopCar(conf.getRandomCarArr(), _final, '')
        timer.once(() => {
            conf.stop([])
        }, 20000)
    },
    getRandomCarArr() {
        const arr = []
        for (let i = 1; i < 7; i++) {
            arr.push(MathUtil.getRandomInt(280, 400))
        }
        return arr
    },
    loopCar(res: any, final: any, forceup: any) {
        conf.numsort = []
        for (let i = 1; i < 7; i++) {
            const x = res[i - 1]
            conf.numsort.push({
                num: i,
                sort: x
            })
            stween.to('animal' + i, {
                x: x,
                time: (x * 1.2),
                final() {
                    if (final) {
                        final(i)
                    }
                }
            })
        }
        conf.numsort = conf.numsort.sort((a, b) => b.sort - a.sort)
        console.log(conf.numsort);
        
        
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
        console.log('999888');

        stween.set('trackitm', {
            x: 2660 - sutil.rem2px(1500)
        })
        stween.to('trackitm', {
            x: 2660 - sutil.rem2px(750),
            time: 3000,
            reverse: () => { },
            final() {
                stween.pause(['trackitm'])
            }
        })
        
        timer.once(() => {
            //移出屏幕外面
            for (let i = 1; i < 7; i++) {
                stween.to('animal' + i, {
                    x: 2660 - sutil.rem2px(750),
                    time: 6000,
                    final() {

                    }
                })
            }
            conf.rank = true
            for (let i = 0; i < 6; i++) {
                timer.once(() => {
                    let num = conf.numsort[i].num
                    conf.numlist[num - 1].sort = i + 1
                    conf.numlist[num - 1].show = true
                }, (i + 1) * 50)
                
            }
        }, 3600)
    },

})

onMounted(() => {
    console.log('6666');
    conf.numlist = [
        {
            img: 'exb',
            name: 'Exiaobao',
            show: false,
            sort: 1,
            num: 1
        },
        {
            img: 'hm',
            name: 'Freshippo',
            show: false,
            sort: 2,
            num: 2
        },
        {
            img: 'pp',
            name: 'Piaopiao',
            show: false,
            sort: 3,
            num: 3
        },
        {
            img: 'xz',
            name: 'Xiazai',
            show: false,
            sort: 4,
            num: 4
        },
        {
            img: 'zxb',
            name: 'Zhixiaobao',
            show: false,
            sort: 5,
            num: 5
        },
        {
            img: 'hx',
            name: 'Huanxing',
            show: false,
            sort: 6,
            num: 6
        }
    ]
    conf.init()
})

</script>
<style lang="less" scoped>
.track {
    height: 100%;
    position: relative;
}

.track-bg {
    background: url('/static/img/game/animal/animal-bg.jpg') no-repeat;
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
    height: 100px;
    bottom: 0%;
}

.rain {
    position: absolute;
    top: -4px;
    right: -5px;
    height: 100px;
    width: 120px;
    z-index: 9;
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
        flex: 1;
    }
}
</style>