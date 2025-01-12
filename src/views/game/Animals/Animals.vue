<template>
    <x-page noHeader noFooter>
        <div class="ani-page">
            <!-- 游戏 -->
            <div class="relative cgame-box" ref="cgamebox" style="width: 100%; flex: 1; margin-bottom: 30rem;">
                <!-- 游戏动画 -->
                <cgame ref="cgameRef" :height="conf.game.box.width" />
                <!-- 倒计时 -->
                <countdown :time="conf.downNum" v-if="conf.downNum < 33" />
            </div>
            <aniBet />
        </div>
        <div v-if="conf.downNum < 33">
            <div class="rulse" @click="conf.goPage('rules')">Rules</div>
            <div class="rulse mony">
                <div class="coin">$</div>
                <div class="total">20</div>
            </div>
            <div class="rulse record" @click="conf.goPage('record')">
                <img class="record-img" src="/static/img/game/animal/record.png" />
                Record
            </div>
        </div>
    </x-page>
</template>
<script setup lang="ts">
import System from '@/utils/System';
import cgame from './com/AnimalsAni.vue';
import aniBet from './com/aniBet.vue';
import countdown from './com/countdown.vue'
import { onBeforeMount, onMounted, reactive, ref } from 'vue'

const cgamebox = ref<any>()
const cgameRef = ref<any>()
const conf = reactive({
    game: {
        box: {
            width: 0,
            height: 0,
            init: () => {
                conf.game.box.width = cgamebox.value.offsetWidth
                conf.game.box.height = conf.game.box.width / 1.769
            }
        },
        isRun: false,
        action: (type: any, res: any) => {
            if (type == 'time') conf.game.start()
            else if (type == 'stop') conf.game.stop(res)
        },
        reset: () => {
            conf.game.isRun = false
            cgameRef.value?.reset()
        },
        start: () => {
            if (conf.game.isRun) return
            conf.game.isRun = true
            cgameRef.value?.start()
        },
        stop: (res: any) => {
            if (conf.game.isRun) {
                conf.game.isRun = false
                cgameRef.value?.stop(res)
            } else {
                cgameRef.value?.setList(res)
            }
        }
    },
    downNum: 10,
    //重置所有内容
    reset() {
        //   conf.game.reset()
    },
    //初始页面业务
    async init() {
        conf.reset()
        //初始化游戏宽高
        conf.game.box.init()
        setInterval(() => {
            conf.downNum--
            if (conf.downNum == 0) {
                cgameRef.value?.init()
                conf.downNum = 60
            }
            if (conf.downNum == 45) cgameRef.value?.stop([])
            if (conf.downNum == 33) cgameRef.value?.reset()
        }, 1000)
    },
    goPage(url: any) {
        console.log('12345');

        System.router.push('/game/Animals/' + url)
    }
})
onMounted(async () => {
    conf.init()
})
onBeforeMount(async () => {
    // let time = 0
    // let timer:any = setInterval(() => {
    //     time++
    //     if (time == 20) {
    //         conf.game.action(
    //             'stop',
    //             [3,5,6]
    //         )
    //         time = 0
    //         clearInterval(timer)
    //         timer = null
    //     } else {
    //         conf.game.action('time', time)
    //     }
    // }, 1000)

})
</script>
<style lang="less" scoped>
.ani-page {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background: #fb9f7a;
    position: relative;
}

.rulse {
    position: absolute;
    top: 12%;
    background: #fff;
    padding: 8rem 28rem;
    border-radius: 0 30rem 30rem 0;
    color: #9A470C;
    font-size: 24rem;
    z-index: 9;
}

.mony {
    right: 0;
    border-radius: 30rem 0rem 0rem 30rem;
    display: flex;
    align-items: center;
    padding: 5rem 20rem 5rem 16rem;
    min-width: 156rem;

    .coin {
        width: 38rem;
        height: 38rem;
        background-size: 100% 100%;
        background-image: url('/static/img/coin-task.png');
        color: #faa54b;
        font-size: 14rem;
        display: flex;
        justify-content: center;
        align-items: center;
        // margin-right: 20rem;
    }

    .total {
        flex: 1;
        text-align: center;
    }
}

.record {
    top: 18%;
    right: 0;
    border-radius: 30rem 0rem 0rem 30rem;
    padding: 12rem 24rem 12rem 20rem;
    display: flex;
    align-items: center;
    background: #4196FF;
    color: #fff;

    .record-img {
        height: 28rem;
        margin-right: 10rem;
    }
}
</style>