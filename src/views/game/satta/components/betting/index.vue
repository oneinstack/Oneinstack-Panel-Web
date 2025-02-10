<template>
  <!-- sum类型 -->
  <betcontent @change="conf.changeBet" :list="sconf.item.numArr" :disabled="bsconf.disabledShow"
    :betList="bsconf.betList"></betcontent>

  <!-- 下注按钮 -->
  <div style="height: 100rem;"></div>
  <div class="betBtn">
    <bottombtn :betNum="betNum" @confirm="conf.openBet" :disabled="bsconf.disabledShow" />
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import betcontent from './betcontent.vue'
import bottombtn from './bottombtn.vue';
import { Scope } from 'tools-vue3';
import { WelfareConfInter } from '../../satta'
import System from '@/utils/System';
import i18n from '@/lang';
const mconf = Scope.getConf<WelfareConfInter>()
const sconf = mconf.conf.betting.tabs
const bsconf = mconf.conf.betting

const emit = defineEmits(['changeBet'])

const conf = reactive({
  betTypeTitle: '',
  changeBet(e: any) {
    let currIndex = bsconf.betList.findIndex((item: any) => item.oddsId == e.oddsId)
    if (currIndex != -1) {
      bsconf.betList.splice(currIndex, 1)
    } else {
      bsconf.betList.push(e)
    }
    bsconf.betList.sort((a, b) => {
      return parseFloat(a.number) - parseFloat(b.number)
    })

  },
  // 打开下注框
  openBet() {
    if (bsconf.disabledShow) return
    if (betNum.value == 0) return System.toast(i18n.t('SattaKing.betEmptyTip'))

    let list = [] as any[]
    bsconf.betList.forEach((item) => {
      list.push(item.oddsCode)
    })
    
    mconf.lottery.bet.content = list
    mconf.lottery.bet.num = list.length
    emit('changeBet')
  }
})

const betNum = computed(() => {
  return bsconf.betList.length
})

onMounted(() => {
  console.log('6666');
  console.log(bsconf);


})
</script>
<style lang="less" scoped>
.betBtn {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  width: 750rem;
  margin: 0 auto;
}
</style>
