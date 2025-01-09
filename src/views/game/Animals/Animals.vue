<template>
    <x-page noHeader noFooter>
        <div class="ani-page">
            <!-- 游戏 -->
            <div class="relative cgame-box" ref="cgamebox"
                style="width: 100%; flex: 1; margin-bottom: 30rem">
                <cgame ref="cgameRef" :height="conf.game.box.width" />
            </div>
            <aniBet />
        </div>
    </x-page>
</template>
<script setup lang="ts">
import cgame from './com/AnimalsAni.vue';
import aniBet from './com/aniBet.vue';
// import moreResult from './com/moreResult.vue';
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
    //重置所有内容
    reset() {
        //   conf.game.reset()
    },
    //初始页面业务
    async init() {
        conf.reset()
        //初始化游戏宽高
        conf.game.box.init()
    },
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
}
</style>