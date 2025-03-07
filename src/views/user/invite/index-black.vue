<script setup lang="ts">
import dashboardCom from './components/Dashboard.vue'
import rewarddCom from './components/reward.vue'
// import coinPopup from './com/coinPopup.vue'
// import selectPopup from './com/selectPopup.vue'
// import greenBtn from '@/views/home/theme/black/components/greenBtn.vue'
// import sutil from '@/sstore/sutil'
import { index } from './index'

const conf = index()
</script>

<template>
  <x-page no-footer pageType="black">
    <template #title>
      {{ $t('agencyCenterModule.titleName') }}
    </template>

    <div class="container">
        <div class="top-menu-list">
          <template v-for="item in conf.blackTopMenu">
            <div 
              class="menu-item flex-center"
              :class="{ 'type-active': conf.activeMenu == item.value }"
              @click="conf.handleMenuChange(item)">
              {{item.name}}
            </div>
          </template>
        </div>
        <dashboardCom v-if="conf.activeMenu == 1"/>
        <rewarddCom v-if="conf.activeMenu == 2"/>
    </div>      
  </x-page>
</template>

<style scoped lang="less">
.container {
  border-radius: 20rem;
  margin: 24rem;

  .top-menu-list {
    display: flex;
    width: 100%;
    overflow: auto !important;
    background: #323738;
    border-radius: 14rem;
    overflow: hidden;

    .menu-item {
      flex: 1;
      background: #323838;
      height: 68rem;
      color: #B3BEC1;
      font-size: 24rem;
    }
    .type-active{
      background: #394143;
      border-radius: 14rem !important;
    }
  }

}

</style>
