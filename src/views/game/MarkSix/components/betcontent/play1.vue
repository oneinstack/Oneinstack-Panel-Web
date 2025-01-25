<template>
  <div class="flex relative" style="gap: 14rem; padding: 32rem">
    <template v-for="item in conf.list">
      <div class="play-item column flex-center" :class="{ active: item.isActive }" @click="conf.change(item)" :style="{
          'width': isNaN(item.oddsName) ? '218rem' : '102rem'
          }">
         <div class="ball-box" :style="{
          'background-image': `url('/static/img/game/marksix/${item.oddsName}.webp')`,
          'width': isNaN(item.oddsName) ? '100%' : '72rem'
          }"
          v-if="isNaN(item.oddsName)">
          <div>{{ item.languageName}}</div>
        </div>
        <resultBall :num="item.oddsName" :size="72" :active="item.isActive" v-if="!isNaN(item.oddsName)"/>
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
    list: [] as any[],
    allData: [] as any[],
    change(item: any) {
      if(mconf.conf.stopBet){
        return
      }
      item.isActive = !item.isActive
      const data = conf.list.filter((item:any) => item.isActive)
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
      conf.list = val
		}
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
