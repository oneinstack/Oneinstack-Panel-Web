<template>
  <x-page no-header tabbar>
    <template #top>
      <div style="width: 100%;">
        <div class="head">
          <x-statusbar />
          <topInfo />
        </div>
      </div>
    </template>

    <div class="banner">
      <img class="b-img" src="/static/img/home/black/lottery.png" />
      <div class="content">
        <div class="tilte">LOTTERY</div>
        <div class="tips">Play lotteries online and hit the jackpot!</div>
      </div>
    </div>

    <!-- 搜索框 -->
    <search />

    <!-- Draw -->
    <div class="game">
      <gameTitle name="Upcoming Draw" :showRight="false" />
      <div class="draw-list" v-scroll>
        <template v-for="item in conf.drawList" :key="item.name">
          <drawItem :item="item" />
        </template>
      </div>
    </div>

    <!-- popular -->
    <div class="popular">
      <gameTitle name="Popular" :showPage="false" />
      <div class="popular-list">
        <template v-for="item in conf.popular" :key="item.name">
          <popularItem :item="item" />
        </template>
      </div>
    </div>

    <!-- Recent Winners -->
    <recentWin />

    <!-- Top Winning Lotteries -->
    <topWin />

    <!-- Latest Results -->
    <div class="result">
      <gameTitle name="Latest Results" :showRight="false" />
      <div class="result-list">
        <div class="r-title flex-b-c">
          <span>Lottery Name</span>
          <span>Jackpot Number</span>
        </div>
        <template v-for="(item,index) in conf.resultList" :key="index">
          <resultItem :item="item" />
        </template>
      </div>
    </div>
  </x-page>
</template>
<script setup lang="ts">
import topInfo from './theme/black/components/topInfo.vue';
import search from './theme/black/components/search.vue';
import gameTitle from './theme/black/home-com/gameTitle.vue';
import drawItem from './theme/black/lott-com/drawItem.vue';
import popularItem from './theme/black/lott-com/popularItem.vue';
import recentWin from './theme/black/lott-com/recentWin.vue';
import topWin from './theme/black/lott-com/topWin.vue';
import resultItem from './theme/black/lott-com/resultItem.vue';
import { reactive } from 'vue';

const conf = reactive({
  drawList: [
    {
      name: 'Color-1Min',
      imgUrl: 'color',
      money: '$872,322.19',
      bg: 'linear-gradient(180deg, #343739 0%, #A23F6B 100%)'
    },
    {
      name: 'Dice-5Mins',
      imgUrl: '3d',
      money: '$130,690.35',
      bg: 'linear-gradient(180deg, #343739 0%, #a3843c 100%)'
    },
    {
      name: 'Dice-5Mins',
      imgUrl: '3d',
      money: '$130,690.35',
      bg: 'linear-gradient(180deg, #343739 0%, #a3843c 100%)'
    }
  ],
  popular: [
    {
      name: 'Satta king-10Mins',
      imgUrl: 'satta',
    },
    {
      name: 'PK10-3Mins',
      imgUrl: 'pk10',
    },
    {
      name: 'Marx Six-5Mins',
      imgUrl: 'six',
    },
    {
      name: 'Welfare 3D-1Min',
      imgUrl: 'w-3d',
    }
  ],
  resultList: [
    {
      name: 'Dice',
      imgUrl: '3d',
      lotteryTypeCode: '3D',
      openCode: '1,6,2'
    },
    {
      name: 'Color',
      imgUrl: 'color',
      lotteryTypeCode: 'COLOR',
      openCode: '5'
    },
    {
      name: 'TrxWinGo',
      imgUrl: 'color',
      lotteryTypeCode: 'Trx_Win_Go',
      openCode: '0'
    },
    {
      name: 'PK10',
      imgUrl: 'pk10',
      lotteryTypeCode: 'PK10',
      openCode: '8,3,7'
    },
    {
      name: '5D',
      imgUrl: 'pk10',
      lotteryTypeCode: '5D',
      openCode: '5,9,8,4,0'
    },
    {
      name: 'Satta',
      imgUrl: 'satta',
      lotteryTypeCode: 'SATTA_KING',
      openCode: '96'
    },
    {
      name: 'AnimalsRunning',
      imgUrl: 'satta',
      lotteryTypeCode: 'ANIMALS_RUNNING',
      openCode: 'D,F,C,A,B,E'
    },
    {
      name: '3DLottery',
      imgUrl: 'w-3d',
      lotteryTypeCode: '3D_LOTTERY',
      openCode: '8,7,1'
    },
    {
      name: 'MarkSix',
      imgUrl: 'six',
      lotteryTypeCode: 'MARK_SIX',
      openCode: '12,09,01,29,08,25,09'
    }
  ]
})

</script>
<style lang="less" scoped>
.head {
  background: #323838;
  padding: 0rem 24rem;
}

.banner {
  margin: 24rem 24rem 0rem;
  height: 260rem;
  position: relative;

  .b-img {
    width: 100%;
    height: 100%;
  }

  .content{
    position: absolute;
    top: 0rem;
    left: 40rem;
    height: 100%;
    .tilte{
      font-size: 45rem;
      color: #fff;
      margin-top: 40rem;
    }
    .tips{
      margin-top: 30rem;
      color: #BFBFBF;
      font-size: 24rem;
      width: 300rem;
    }
  }
}

.game {
  padding-left: 24rem;

  .draw-list {
    display: flex;
    margin-top: 20rem;
  }
}

.popular {
  padding: 24rem 0rem 24rem 24rem;

  .popular-list {
    display: flex;
    flex-wrap: wrap;
    padding-right: 24rem;
    margin-top: 10rem;
  }
}

.result {
  padding: 24rem;

  .result-list {
    background: #323738;
    border-radius: 20rem;

    .r-title {
      color: #BFBFBF;
      font-size: 22rem;
      padding: 10rem 30rem 10rem 20rem;
    }
  }
}
</style>
