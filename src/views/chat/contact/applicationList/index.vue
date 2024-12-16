<template>
  <x-page>
    <template #title>
      <span class="title">{{ conf.isGroup ? $t('chatRoom.new_grp_chat') : $t('chatRoom.new_friend') }}</span>
    </template>
    <headSearch />
    <div class="content">
      <template v-for="item in 5" :key="item">
        <applicationItem></applicationItem>
      </template>
      <!-- <div style="padding-top: 120rem;">
        <x-no-data></x-no-data>
      </div> -->
    </div>
  </x-page>
</template>
<script setup lang="ts">
import { useRoute } from 'vue-router';
import headSearch from '../com/headSearch.vue';
import applicationItem from './applicationItem.vue';
import { onMounted, reactive } from 'vue';
import { ContactMenuTypes } from '@/modules/chat/constant'

const conf = reactive({
  isGroup: false
})
const route = useRoute()
onMounted(() => {
	const { type } = route.query;
  conf.isGroup = type === ContactMenuTypes.NewGroup;
  console.log(conf.isGroup);
  
})
</script>
<style lang="less" scoped>
.title {
  font-size: 32rem;
  color: #000;
}
.content{
  background: #fff;
  height: 100%;
}
</style>
