<template>
  <play1 :listData="conf.listData" />
</template>
<script setup lang="ts">
import { reactive,watch,ref,onMounted } from 'vue'
import play1 from './play1.vue'
import { Scope } from 'tools-vue3'
const { conf:markSixConf } = Scope.getConf()
const conf = reactive({
  listData: [] as any[],
  initData() {
    conf.listData = []
    let data1 = markSixConf.oddsData
    let data2 = markSixConf.betting.tabs.level2.item.list
    data2.forEach((item:any) => {
      let obj = data1.find((num:any) => num.oddsCode === item.oddsCode)
      let newObj = {
        languageName: item.oddsName,
        ...obj,
      }
      conf.listData.push(newObj)
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
    // console.log('val===',val)
		conf.initData()
	},
  { deep: true }
)
</script>
<style lang="less" scoped></style>
