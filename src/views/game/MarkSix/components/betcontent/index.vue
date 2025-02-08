<template>
  <div class="name">
    <img src="/static/img/betting-icon.png">
    {{ $t('lhc.' + markSixConf.betting.tabs.level2.item.name || markSixConf.betting.tabs.level2.item.list[0].name) }}
  </div>
  <play1 :listData="conf.listData1" v-if="conf.listData1.length > 0"/>
  <play1 :listData="conf.listData2" v-if="conf.listData2.length > 0"/>
</template>
<script setup lang="ts">
import { reactive,watch,onMounted } from 'vue'
import play1 from './play1.vue'
import { Scope } from 'tools-vue3'
const { conf:markSixConf } = Scope.getConf()
const conf = reactive({
  listData1: [] as any[],
  listData2: [] as any[],
  initData() {
    conf.listData1 = []
    conf.listData2 = []
    let data1 = markSixConf.oddsData
    let data2 = markSixConf.betting.tabs.level2.item.list
    data2?.forEach((item:any) => {
      let obj = data1.find((num:any) => num.oddsCode === item.oddsCode)
      let newObj = {
        languageName: item.oddsName,
        ...obj,
      }
      if(isNaN(item.oddsName)){
        conf.listData2.push(newObj)
      }else{
        conf.listData1.push(newObj)
        
      }
    })
    // const oddsCode = data2.map((item:any) => item.oddsCode)
    // let obj = data1.filter((num:any) => oddsCode.includes(num.oddsCode))
    // conf.listData = obj
  }
})

watch(
	() => markSixConf.oddsData,
	(val: any) => {
		conf.initData()
	}
)
watch(
	() => markSixConf.betting.tabs.level2.item.list,
	(val: any) => {
		conf.initData()
	},
  { deep: true }
)
onMounted(() => {
  conf.initData()
})
</script>
<style lang="less" scoped>
.name{
  padding: 32rem 0 0rem 32rem;
  font-size: 32rem;
  display: flex;
  align-items: center;
  img{
    width: 24rem;
    height: 24rem;
    margin-right: 8rem;
  }
}
</style>
