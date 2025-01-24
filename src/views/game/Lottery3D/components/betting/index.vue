<template>
  <!-- sum类型 -->
  <div v-if="sconf.level1.item.sizeList">
    <betcontent @change="conf.changeBet($event,'size')" :list="sconf.level1.item.sizeList" :title="$t('game.sumType')"
      :oddsInfo="sconf.oddsInfo" :disabled="bsconf.disabledShow"></betcontent>
  </div>
  <!-- point类型 -->
  <div v-if="sconf.level1.item.numList">
    <betcontent @change="conf.changeBet($event,'num')" :list="sconf.level1.item.numList" title="point" :oddsInfo="sconf.oddsInfo"
      :isSize="false" :disabled="bsconf.disabledShow" :randomShow="sconf.level1.item.numRan"></betcontent>
  </div>
  <div v-if="sconf.level1.item.strList">
    <betcontent @change="conf.changeBet($event,'str')" :list="sconf.level1.item.strList" title="point" :oddsInfo="sconf.oddsInfo"
      :isImg="false" :disabled="bsconf.disabledShow"></betcontent>
  </div>

  <!-- 下注按钮 -->
  <div style="height: 100rem;"></div>
  <div class="betBtn">
    <bottombtn :betNum="betNum" @confirm="conf.openBet" :disabled="bsconf.disabledShow" />
  </div>

  <bet-popup :betShow="bsconf.betShow" @submit="conf.handleBetSubmit">
    <div v-scroll>
      <div style="display: flex;align-items: center;" v-scroll>
        <div class="bet-type">{{ conf.betTypeTitle }}</div>
        <template v-for="item in conf.betList" :key="item.oddsCode">
          <div class="txt-box" v-if="conf.betTypeTitle == 'triple'">
              <div class="txt" :class="{ 'small': item.imgUrl.length > 10 }">{{ item.imgUrl }}</div>
          </div>
          <img v-else class="img" :src="`/static/img/game/3d/${item.imgUrl}.png`" />
        </template>
      </div>
      <img class="arrow-img" v-show="betNum > 7" src="/static/img/double-arrow.png" />
    </div>
    <template #tips="{ money, coinSymbol }">
      <div class="tips">
        <div class="num">Total bets: <span>{{ betNum }}</span>
          bets</div>
        <div>Amount: <span>{{ coinSymbol }}{{ money * betNum }}</span></div>
      </div>
    </template>
  </bet-popup>
</template>
<script setup lang="ts">
import { computed, reactive } from 'vue'
import betcontent from './betcontent.vue'
import bottombtn from './bottombtn.vue';
import betPopup from '@/views/game/components/betPopup.vue';
import { Scope } from 'tools-vue3';
import { WelfareConfInter } from '../../Lottery3D'
import System from '@/utils/System';
import i18n from '@/lang';
const mconf = Scope.getConf<WelfareConfInter>()
const sconf = mconf.conf.betting.tabs
const bsconf = mconf.conf.betting

const emit = defineEmits(['changeBet'])

const conf = reactive({
  betSizeList: [] as any[],
  betNumList: [] as any[],
  betList: [] as any[],
  strList: [] as any[],
  betTypeTitle: '',
  changeBet(e:any,type: any) {
    if(e.type == 'clear') {
      conf.clearBet(1)
      return
    }
    if(e.type == 'random') {
      conf.clearBet()
      return
    }
    // console.log('6664');
    if(type == 'size') conf.betSizeList = e.list
    if(type == 'num') conf.betNumList = e.list
    if(type == 'str') conf.strList = e.list
    
  },
  clearBet(type = 2) {
    conf.betSizeList = []
    conf.betNumList = []
    conf.strList = []
    let sizeList = sconf.level1.item.sizeList || []
    if(sizeList.length) {
      sconf.level1.item.sizeList.forEach((item: any) => {
        item.isActive = false
      });
    }
    let numList = sconf.level1.item.numList || []
    if(numList.length) {
      sconf.level1.item.numList.forEach((item: any) => {
        item.isActive = false
      });
    }
    let strList = sconf.level1.item.strList || []
    if(strList.length) {
      sconf.level1.item.strList.forEach((item: any) => {
        item.isActive = false
      });
    }

    if(type == 1) return ''

    // 生成随机下注
    let num = sizeList.length + numList.length + strList.length
    
    let random = Math.floor(Math.random() * num);
    if(sizeList.length && random < sizeList.length) {
      sconf.level1.item.sizeList[random].isActive = true
      conf.betSizeList = [sconf.level1.item.sizeList[random]]
    } else if(numList.length) {
      random = random - sizeList.length
      sconf.level1.item.numList[random].isActive = true
      conf.betNumList = [sconf.level1.item.numList[random]]
    } else if(strList.length) {
      random = random - sizeList.length
      sconf.level1.item.strList[random].isActive = true
      conf.strList = [sconf.level1.item.strList[random]]
    }
  },
  // 打开下注框
  openBet() {
    if(bsconf.disabledShow) return
    if(betNum.value == 0) return System.toast(i18n.t('SattaKing.betEmptyTip'))
    bsconf.popup.open()
    conf.betList = [...conf.betSizeList, ...conf.betNumList,...conf.strList]
    let list = [] as any[]
    conf.betList.forEach((item) => {
      list.push(item.oddsCode)
    })
    mconf.lottery.bet.content = list
    console.log('66555');
    conf.betTypeTitle = conf.betList[0].oddsCode.split('_')[0]
    console.log(conf.betList);
    
  },
  handleBetSubmit(e: any) {
    if (!e) return bsconf.betShow = false
    mconf.lottery.bet.totalMoney = e
    let list = [] as any[]
    conf.betList.forEach((item) => {
      list.push(item.oddsCode)
    })
    emit('changeBet',list)
  }
})

const betNum = computed(() => {
  return conf.betSizeList.length + conf.betNumList.length + conf.strList.length
})
</script>
<style lang="less" scoped>
.betBtn {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
}

.img {
  height: 85rem;
  margin-left: 4rem;

  &:first-of-type {
    margin-left: 0rem;
  }
}

.tips {
  padding: 0rem 0rem 30rem;
  font-size: 30rem;
  color: #333;
  display: flex;

  .num {
    margin-right: 40rem;
  }

  span {
    background-image: -webkit-linear-gradient(180deg, #eb602d 0%, #ffa64f 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}
.arrow-img{
  height: 12rem;
  position: absolute;
  top: calc(50% - 6rem);
  right: 6rem;
}
.bet-type {
  color: #5bcdff;
  font-size: 26rem;
  font-weight: 700;
  margin-right: 6rem;
}
.txt-box {
    border: 2rem solid #EAEAEA;
    border-radius: 8rem;
    min-width: 160rem;
    color: #333333;
    height: 60rem;
    padding: 1rem 1rem 4rem;
    margin-left: 10rem;

    .txt {
        height: 100%;
        background: linear-gradient(180deg, #FFFFFF 0%, #EEEEEF 100%);
        border-radius: 0 0 10rem 10rem;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 26rem;
    }

    .small {
        font-size: 20rem;
    }
}
</style>
