<template>
  <div class="bet_record_list_item">
    <van-row class="title_line">
      <van-col span="20" class="title u-line-1">{{ data.betTitle }}</van-col>
      <van-col span="4">
        <div v-if="!selectMode" style="width: 100%; height: 100%">
          <van-button size="small" @click="conf.hanldeClickShare">{{ $t('chatRoom.Share') }}</van-button>
        </div>
        <div v-else class="flex flex-center">
          <van-checkbox-group checked-color="#0fc05f" v-model="conf.checkboxValue" @change="conf.onCheckboxChange">
            <van-checkbox class="checkbox_style" :name="data.id" activeColor="#0fc05f" />
          </van-checkbox-group>
        </div>
      </van-col>
    </van-row>

    <van-row>{{ $t('SattaKing.GameType') }}：{{ data.newPlayName }}</van-row>
    <van-row>{{ $t('game.bettingTime') }}：{{ data.betTime }}</van-row>
    <van-row>{{ $t('game.openTime') }}：{{ data.betOpenTime }}</van-row>
    <van-row>{{ $t('game.BetCoin') }}：{{ data.betCoinCode }}</van-row>
    <van-row>{{ $t('SattaKing.BettingContent2') }}：{{ data.betContent }}</van-row>
    <van-row>{{ $t('game.openCode') }}：{{ data.betOpenCode || $t('chatRoom.NotDrawn') }}</van-row>
    <van-row>{{ $t('game.TotalBetAmount') }}：{{ data.coinSymbol + data.betMoney }}</van-row>
    <van-row v-if="data.betOpenCode">{{ $t('game.prizeMoney') }}：{{ data.betPrizeMoney }}</van-row>
    <!-- <van-row class="last_line">
      <u-col :span="10">{{ data.betTime }}</u-col>
      <u-col :span="2">{{ data.betStatus }}</u-col>
    </van-row> -->
  </div>
</template>

<script setup lang="ts">
import { nextTick, reactive } from 'vue';

const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  selectMode: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click-share','select-share'])

const conf = reactive({
  checkboxValue: [] as any[],
  hanldeClickShare() {
    emit('click-share', props.data.id)
  },

  async onCheckboxChange() {
    await nextTick()
    emit('select-share', !!conf.checkboxValue[0], props.data.id)
  }
})

</script>

<style lang="less" scoped>
.button {
  pointer-events: auto;
}

.bet_record_list_item {
  padding: 24rem;
  background-color: #fff;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 95%;
    height: 2rem;
    background-color: #eee;
  }

  .van-row {
    margin-top: 12rem;
    font-size: 24rem;
  }

  .title_line {
    height: 50rem;
    margin: 0 0 24rem;

    .title {
      font-size: 32rem;
      color: #0fc05f;
    }

    .van-button {
      background: #0fc05f;
      color: #fff;
      font-size: 24rem;
      border-radius: 4rem;
      width: 100%;
    }
  }

  .last_line {
    margin: 24rem 0;
    color: #aaa;
  }
}
</style>
