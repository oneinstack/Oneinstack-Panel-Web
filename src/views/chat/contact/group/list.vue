<template>
  <x-page>
    <template #title>
      <span class="title">{{ $t('chatRoom.my_grps') }}</span>
    </template>
    <headSearch v-if="!conf.isFocus && !conf.keyword" :customClick="true" @click="conf.changeFocus" />
    <van-search v-else ref="inputRef" class="input" :autofocus="conf.isFocus" @blur="conf.isFocus = false" v-model="conf.keyword"
      :placeholder="$t('chatRoom.search')" />
    <div class="content">
      <template v-for="item in getGroupList" :key="item.groupID">
        <groupItem :groupInfo="item"></groupItem>
      </template>
      <div class="group_num" v-if="getGroupList.length">{{ getGroupList.length }} {{ $t('chatRoom.sgrops') }}</div>
      <div style="padding-top: 120rem;" v-if="!getGroupList.length">
        <x-no-data></x-no-data>
      </div>
    </div>
  </x-page>
</template>
<script setup lang="ts">
import cscontact from '@/modules/chat/sstore/cscontact';
import headSearch from '../com/headSearch.vue';
import groupItem from './com/groupItem.vue';
import { computed, onMounted, reactive, ref } from 'vue';

const inputRef = ref<any>()
const conf = reactive({
  isGroup: false,
  isFocus: false,
  keyword: '',
  changeFocus() {
    conf.isFocus = true
    setTimeout(()=> {
      inputRef.value?.focus()
    },100)
  }
})
const getGroupList = computed(() => {
  if (conf.keyword) {
    return cscontact.groupList.filter(
      (friend) =>
        friend.groupName.includes(conf.keyword)
    )
  }
  console.log('66544');
  
  console.log(cscontact.groupList);
  
  return cscontact.groupList
})
onMounted(() => {
  
})
</script>
<style lang="less" scoped>
.title {
  font-size: 32rem;
  color: #000;
}

.content {
  background: #fff;
  height: 100%;

  .group_num {
    color: #999;
    font-size: 28rem;
    text-align: center;
    margin-top: 20rem;
  }
}

.input {
  height: 68rem;
  margin: 0rem 20rem 20rem;
  border-radius: 4rem;
}

::v-deep .van-search__content {
  background: #fff;
  padding: 0;
}
</style>
