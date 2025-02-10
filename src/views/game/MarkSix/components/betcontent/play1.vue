<template>
  <div class="flex relative" style="gap: 14rem; padding: 32rem" v-if="conf.list1.length > 0">
    <template v-for="item in conf.list1">
      <div class="play-item column flex-center" :class="{ active: item.isActive }" @click="conf.change(item)" style="width:102rem">
        <resultBall :num="item.oddsName" :size="72" :active="item.isActive"/>
        <div class="odds">{{ parseFloat(item.odds).toFixed(2) }}</div>
      </div>
    </template>
  </div>
  <div class="flex relative" style="gap: 14rem; padding: 32rem" v-if="conf.list2.length > 0">
    <template v-for="item in conf.list2">
      <div class="play-item column flex-center" :class="{ active: item.isActive }" @click="conf.change(item)" style="width:218rem">
         <div class="ball-box" :style="{
          'background-image': `url('/static/img/game/marksix/${item.oddsName}.webp')`,
          'width': isNaN(item.oddsName) ? '100%' : '72rem'
          }">{{ item.languageName}}</div>
        <div class="odds">{{ parseFloat(item.odds).toFixed(2) }}</div>
      </div>
    </template>
  </div>
</template>
<script setup lang="ts">
  import { reactive, watch } from 'vue';
  import resultBall from '../resultBall.vue'
  import { Scope } from 'tools-vue3'
  const mconf = Scope.getConf()
  const conf = reactive({
    allList: [] as any[],
    list1: [] as any[],
    list2: [] as any[],
    change(item: any) {
      if(mconf.conf.stopBet){
        return
      }
      item.isActive = !item.isActive
      const data = conf.allList.filter((item:any) => item.isActive)
      mconf.conf.betting.getChoseData(data)
    },
  })

const props = defineProps({
  listData: {
    type: Array,
    default: []
  }
})
watch(
	() => props.listData,
	(val: any) => {
		if (val) {
      conf.list1 = []
      conf.list2 = []
      conf.allList = val
      conf.allList?.forEach((item:any) => {
        if(!isNaN(item.oddsName)){
          conf.list1.push(item)
        }else{
          conf.list2.push(item)
        }
      })
		}
	},
  {
    deep:true,
    immediate:true
  }
)

</script>
<style lang="less" scoped>
.play-item {
  width: 102rem;
  height: 134rem;
  background: #ffffff;
  border-radius: 10rem;
  box-shadow: 0 8rem 4rem 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border: 2rem solid #ffffff00;

  &.active {
    border: 2rem solid #ff7502;
    background: #fff2e9;
  }

  .ball-box {
    background-repeat: no-repeat;
    background-size: 100% 100%;
    pointer-events: none;
    width: 72rem;
    height: 72rem;
    font-size: 30rem;
    text-align: center;
    word-break: break-word;
  }

  .odds {
    color: #666666;
    font-size: 24rem;
    font-weight: 400;
    margin-top: 6rem;
  }
}
</style>
