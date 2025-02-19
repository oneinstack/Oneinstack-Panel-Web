<template>
  <!-- sum类型 -->
  <div v-if="sconf.level1.item.sizeList">
    <betcontent @change="conf.changeBet($event, 'size')" :list="sconf.level1.item.sizeList" :title="$t('game.sumType')"
      :oddsInfo="sconf.oddsInfo" :disabled="bsconf.disabledShow"></betcontent>
  </div>
  <!-- point类型 -->
  <div v-if="sconf.level1.item.numList">
    <betcontent @change="conf.changeBet($event, 'num')" :list="sconf.level1.item.numList" title="point"
      :oddsInfo="sconf.oddsInfo" :isSize="false" :disabled="bsconf.disabledShow" :randomShow="sconf.level1.item.numRan">
    </betcontent>
  </div>
  <div v-if="sconf.level1.item.strList">
    <betcontent @change="conf.changeBet($event, 'str')" :list="sconf.level1.item.strList" title="point"
      :oddsInfo="sconf.oddsInfo" :isImg="false" :disabled="bsconf.disabledShow"></betcontent>
  </div>

  <!-- 下注按钮 -->
  <div style="height: 100rem;"></div>
  <div class="betBtn">
    <bottombtn :bg="['#006FFF','#087BFF','#E8EFFF']" :betNum="betNum" @confirm="conf.openBet" :disabled="bsconf.disabledShow" />
  </div>
</template>
<script setup lang="ts">
import { computed, reactive } from 'vue'
import betcontent from './betcontent-blue.vue'
import bottombtn from './bottombtn.vue';
import { Scope } from 'tools-vue3';
import { WelfareConfInter } from '../../Lottery3D'
import System from '@/utils/System';
import i18n from '@/lang';
const mconf = Scope.getConf<WelfareConfInter>()
const sconf = mconf.conf.betting.tabs
const bsconf = mconf.conf.betting

const emit = defineEmits(['changeBet'])

const conf = reactive({
  betTypeTitle: '',
  changeBet(e: any, type: any) {
    if (e.type == 'clear') {
      conf.clearBet(1)
      return
    }
    if (e.type == 'random') {
      conf.clearBet()
      return
    }
    if (type == 'size') bsconf.betSizeList = e.list
    if (type == 'num') bsconf.betNumList = e.list
    if (type == 'str') bsconf.strList = e.list

  },
  clearBet(type = 2) {
    bsconf.betSizeList = []
    bsconf.betNumList = []
    bsconf.strList = []
    let sizeList = sconf.level1.item.sizeList || []
    if (sizeList.length) {
      sconf.level1.item.sizeList.forEach((item: any) => {
        item.isActive = false
      });
    }
    let numList = sconf.level1.item.numList || []
    if (numList.length) {
      sconf.level1.item.numList.forEach((item: any) => {
        item.isActive = false
      });
    }
    let strList = sconf.level1.item.strList || []
    if (strList.length) {
      sconf.level1.item.strList.forEach((item: any) => {
        item.isActive = false
      });
    }

    if (type == 1) return ''

    // 生成随机下注
    let num = sizeList.length + numList.length + strList.length

    let random = Math.floor(Math.random() * num);
    if (sizeList.length && random < sizeList.length) {
      sconf.level1.item.sizeList[random].isActive = true
      bsconf.betSizeList = [sconf.level1.item.sizeList[random]]
    } else if (numList.length) {
      random = random - sizeList.length
      sconf.level1.item.numList[random].isActive = true
      bsconf.betNumList = [sconf.level1.item.numList[random]]
    } else if (strList.length) {
      random = random - sizeList.length
      sconf.level1.item.strList[random].isActive = true
      bsconf.strList = [sconf.level1.item.strList[random]]
    }
  },
  // 打开下注框
  openBet() {
    if (bsconf.disabledShow) return
    if (betNum.value == 0) return System.toast(i18n.t('SattaKing.betEmptyTip'))

    const betList = [...bsconf.betSizeList, ...bsconf.betNumList, ...bsconf.strList]

    let list = [] as any[]
    betList.forEach((item) => {
      list.push(item.oddsCode)
    })

    mconf.lottery.bet.content = list
    mconf.lottery.bet.num = list.length
    conf.betTypeTitle = betList[0].oddsCode.split('_')[0]
    emit('changeBet', { list: betList, type: conf.betTypeTitle })

  }
})

const betNum = computed(() => {
  return bsconf.betSizeList.length + bsconf.betNumList.length + bsconf.strList.length
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
