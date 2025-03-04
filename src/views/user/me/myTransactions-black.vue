<template>
  <x-page no-footer :fixed="false">
    <template #title>{{ $t('me.Transactions') }}</template>
    <!-- header -->
    <template #top>
      <div class="top-content">
        <div class="select">
          <div class="select-item">
            <tranSelect :label="conf.typeList.find((v:any) => v.isCheck)?.label" @click="conf.popupType = 'type'" />
          </div>
          <div class="select-item">
            <tranSelect label="All Assets" />
          </div>
        </div>
        <div class="select">
          <div class="select-item">
            <tranSelect label="Past 60 days" />
          </div>
          <div class="select-item">
            <tranSelect :label="conf.statusList.find((v:any) => v.isCheck)?.label" @click="conf.popupType = 'status'" />
          </div>
        </div>
        <div class="table-title flex-b-c">
          <div>Payment Method</div>
          <div>Amount/Status</div>
        </div>
      </div>
    </template>
    <div class="table">
      <template v-for="(item, itemIndex) in conf.detailData" :key="itemIndex">
        <tranItem :item="item" :tradeLable="conf.tradeLable" />
      </template>
      <x-no-data v-if="conf.detailData.length == 0"></x-no-data>
    </div>
    <!-- 类型选择 -->
    <selectPopup
      :show="conf.popupType == 'type'"
      :dataArr="conf.typeList"
      @close="conf.popupType = ''"
      @change="(e: any) => { conf.handleChange('type', e) }"
    />
    <!-- 状态选择 -->
    <selectPopup
      :show="conf.popupType == 'status'"
      :dataArr="conf.statusList"
      @close="conf.popupType = ''"
      @change="(e: any) => { conf.handleChange('status', e) }"
    />
  </x-page>
</template>

<script setup lang="ts">
import tranSelect from './com/tranSelect.vue'
import tranItem from './com/tranItem.vue'
import selectPopup from '../wallet/com/black/selectPopup.vue'
import { index } from './myTransactions'
import sutil from '@/sstore/sutil'

const conf = index()
</script>

<style lang="less" scoped>
.top-content {
  padding: 30rem 24rem;
}

.select {
  display: flex;
  margin-bottom: 20rem;

  .select-item {
    flex: 1;

    &:last-of-type {
      margin-left: 20rem;
    }
  }
}

.table-title {
  background: #292D2E;
  height: 80rem;
  border-radius: 20rem;
  font-family: Poppins;
  font-weight: 500;
  font-size: 24rem;
  color: #fff;
  padding: 0rem 20rem;
  margin-top: 30rem;
}

.table {
  padding: 0rem 24rem;
}
</style>
